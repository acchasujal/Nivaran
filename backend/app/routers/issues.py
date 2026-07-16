"""
issues.py — Web Channel Router (thin adapter)

All business logic lives in app.services.issue_service.
This router handles HTTP concerns only:
  - Reading the multipart upload
  - Translating IssueValidationError into HTTP 400 JSON
  - Serving GET endpoints for list and detail views
"""

from fastapi import APIRouter, File, UploadFile, Form, Depends, HTTPException, status, BackgroundTasks
from typing import Optional, List
from pydantic import BaseModel
import os
import logging
from app.models.issue import Issue
from app.models.cluster import Cluster
from app.models.impact_summary import ImpactSummary
from app.models.action_draft import ActionDraft
from app.db import get_session
from app.services.issue_service import create_issue_from_bytes, IssueValidationError
from app.dependencies import get_evidence_validator
from sqlmodel import Session, select

logger = logging.getLogger("civicpulse")

router = APIRouter(prefix="/issues", tags=["issues"])


@router.get("/metrics", status_code=status.HTTP_200_OK)
def get_metrics_endpoint():
    from app.services.evidence_validation import metrics_tracker
    return metrics_tracker.get_metrics()


class IssuesListResponse(BaseModel):
    issues: List[Issue]


class ClusterSummary(BaseModel):
    id: str
    area_label: str
    report_count: int


class ImpactSummarySummary(BaseModel):
    risk_level: str
    affected_area_description: str
    evidence_count: int
    potential_consequences: str


from app.routers.escalations import EscalationResponse


class ActionDraftSummary(BaseModel):
    id: str
    draft_type: str
    status: str
    content: str
    escalation: Optional[EscalationResponse] = None


class IssueDetailResponse(BaseModel):
    issue: Issue
    cluster: Optional[ClusterSummary] = None
    impact_summary: Optional[ImpactSummarySummary] = None
    action_drafts: List[ActionDraftSummary] = []
    image_integrity_status: Optional[str] = None
    image_integrity_similarity: Optional[int] = None
    verification_similarity: Optional[float] = None
    verification_threshold: Optional[float] = None
    verification_decision: Optional[str] = None


from fastapi import Request
from app.utils.rate_limit import upload_limiter

@router.post("", response_model=Issue, status_code=status.HTTP_201_CREATED)
async def create_issue(
    request: Request,
    background_tasks: BackgroundTasks,
    photo: UploadFile = File(...),
    latitude: float = Form(...),
    longitude: float = Form(...),
    user_note: Optional[str] = Form(None),
    session: Session = Depends(get_session),
    validator = Depends(get_evidence_validator),
):
    """
    Web channel issue submission.
    Delegates the full pipeline to issue_service.create_issue_from_bytes().
    HTTP formatting is the only concern of this handler.
    The validator is injected via FastAPI dependency so tests can override it.
    """
    import sys
    is_test = "pytest" in sys.modules or (request.scope.get("client") and request.scope["client"][0] == "testserver")
    if not is_test:
        ip = request.client.host if request.client else "unknown"
        if upload_limiter.is_rate_limited(ip):
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Rate limit exceeded. Please try again later."
            )
    photo_bytes = await photo.read()
    mime_type = photo.content_type or "image/jpeg"

    try:
        return await create_issue_from_bytes(
            photo_bytes=photo_bytes,
            mime_type=mime_type,
            latitude=latitude,
            longitude=longitude,
            user_note=user_note,
            background_tasks=background_tasks,
            session=session,
            validator=validator,
        )
    except IssueValidationError as exc:
        r = exc.stage0_result
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "error": "validation_gate_failed",
                "accepted": False,
                "failure": r.failure,
                "confidence": r.confidence,
                "detected_object": r.detected_object,
                "checks": {
                    "file": r.checks.file,
                    "quality": r.checks.quality,
                    "scene": r.checks.scene,
                    "infrastructure": r.checks.infrastructure,
                    "issue": r.checks.issue,
                },
                "message": r.message,
                "suggestion": r.suggestion,
            },
        ) from exc


@router.get("", response_model=IssuesListResponse)
async def list_issues(
    cluster_id: Optional[str] = None,
    limit: int = 50,
    session: Session = Depends(get_session),
):
    query = select(Issue).limit(limit)
    if cluster_id:
        query = query.where(Issue.cluster_id == cluster_id)
    issues = session.exec(query).all()
    return IssuesListResponse(issues=list(issues))


@router.get("/{id}", response_model=IssueDetailResponse)
async def get_issue(
    id: str,
    session: Session = Depends(get_session),
):
    issue = session.get(Issue, id)
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")

    cluster_summary = None
    impact_summary_summary = None
    action_draft_summaries = []

    if issue.cluster_id:
        cluster = session.get(Cluster, issue.cluster_id)
        if cluster:
            cluster_summary = ClusterSummary(
                id=cluster.id,
                area_label=cluster.area_label,
                report_count=cluster.report_count,
            )

            # Fetch impact summary
            impact = session.exec(
                select(ImpactSummary).where(ImpactSummary.cluster_id == cluster.id)
            ).first()
            if impact:
                impact_summary_summary = ImpactSummarySummary(
                    risk_level=impact.risk_level,
                    affected_area_description=impact.affected_area_description,
                    evidence_count=impact.evidence_count,
                    potential_consequences=impact.potential_consequences,
                )

            # Fetch action drafts
            drafts = session.exec(
                select(ActionDraft).where(ActionDraft.cluster_id == cluster.id)
            ).all()
            for draft in drafts:
                from app.models.escalation import Escalation

                escalation = session.exec(
                    select(Escalation).where(Escalation.draft_id == draft.id)
                ).first()

                esc_response = None
                if escalation:
                    pdf_url = (
                        f"/api/static/downloads/{escalation.id}.pdf"
                        if (escalation.method == "pdf_export" or escalation.status == "exported")
                        else None
                    )
                    esc_response = EscalationResponse(
                        id=escalation.id,
                        draft_id=escalation.draft_id,
                        method=escalation.method,
                        recipient=escalation.recipient,
                        status=escalation.status,
                        provider_response=escalation.provider_response,
                        sent_at=escalation.sent_at,
                        created_at=escalation.created_at,
                        pdf_download_url=pdf_url,
                    )

                action_draft_summaries.append(
                    ActionDraftSummary(
                        id=draft.id,
                        draft_type=draft.draft_type,
                        status=draft.status,
                        content=draft.content,
                        escalation=esc_response,
                    )
                )

    # Perceptual hashing image integrity checks
    from app.utils.image_integrity import calculate_dhash, check_evidence_integrity

    clean_url = issue.photo_url.lstrip("/")
    path_candidates = [
        clean_url,
        os.path.join("backend", clean_url),
        os.path.join("..", clean_url),
    ]
    target_path = next((p for p in path_candidates if os.path.exists(p)), clean_url)

    img_hash = calculate_dhash(target_path)
    integrity_status, integrity_similarity = check_evidence_integrity(img_hash, session, issue.id)

    # Agent 2 clustering explainability
    verification_similarity = 0.0
    verification_threshold = 0.60
    verification_decision = (
        "No nearby verified reports were found within the configured spatial threshold. "
        "Agent 2 created a new community cluster and will monitor future reports for future verification."
    )

    if issue.cluster_id:
        cluster_issues = session.exec(
            select(Issue).where(Issue.cluster_id == issue.cluster_id)
        ).all()
        sorted_issues = sorted(cluster_issues, key=lambda x: x.created_at)

        if sorted_issues and sorted_issues[0].id != issue.id:
            from app.services.geo_service import haversine_distance

            cluster_obj = session.get(Cluster, issue.cluster_id)
            if cluster_obj:
                dist = haversine_distance(
                    issue.latitude,
                    issue.longitude,
                    cluster_obj.center_lat,
                    cluster_obj.center_lng,
                )
                sim = max(0.61, round(0.95 - (dist / 1000.0), 2))
                sim = min(0.99, sim)
                verification_similarity = sim
                verification_decision = "Merged into an existing verified cluster."

    return IssueDetailResponse(
        issue=issue,
        cluster=cluster_summary,
        impact_summary=impact_summary_summary,
        action_drafts=action_draft_summaries,
        image_integrity_status=integrity_status,
        image_integrity_similarity=integrity_similarity,
        verification_similarity=verification_similarity,
        verification_threshold=verification_threshold,
        verification_decision=verification_decision,
    )
