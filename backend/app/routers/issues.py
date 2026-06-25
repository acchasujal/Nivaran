from fastapi import APIRouter, File, UploadFile, Form, Depends, HTTPException, status, BackgroundTasks
from typing import Optional, List
from pydantic import BaseModel
import os
import uuid
import logging
from app.models.issue import Issue
from app.models.cluster import Cluster
from app.models.impact_summary import ImpactSummary
from app.models.action_draft import ActionDraft
from app.db import get_session
from app.config import settings
from app.services.agent_1_intake import analyze_issue_photo
from app.services.agent_2_verification import verify_and_cluster_issue
from app.services.agent_3_impact import analyze_cluster_impact
from app.services.agent_4_action_generator import generate_action_drafts
from sqlmodel import Session, select

logger = logging.getLogger("civicpulse")

router = APIRouter(prefix="/issues", tags=["issues"])

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

class ActionDraftSummary(BaseModel):
    id: str
    draft_type: str
    status: str
    content: str

class IssueDetailResponse(BaseModel):
    issue: Issue
    cluster: Optional[ClusterSummary] = None
    impact_summary: Optional[ImpactSummarySummary] = None
    action_drafts: List[ActionDraftSummary] = []

async def run_agent_3_background(cluster_id: str):
    from app.db import engine
    with Session(engine) as session:
        try:
            logger.info(f"agent_3_background_trigger | cluster_id={cluster_id}")
            await analyze_cluster_impact(cluster_id=cluster_id, session=session)
            logger.info(f"agent_3_background_success | cluster_id={cluster_id}")

            logger.info(f"agent_4_background_trigger | cluster_id={cluster_id}")
            await generate_action_drafts(cluster_id=cluster_id, session=session)
            logger.info(f"agent_4_background_success | cluster_id={cluster_id}")

            # Transition all issues in this cluster to "drafted"
            issues = session.exec(select(Issue).where(Issue.cluster_id == cluster_id)).all()
            for issue in issues:
                issue.status = "drafted"
                session.add(issue)
            session.commit()
            logger.info(f"agent_4_background_status_transition_complete | cluster_id={cluster_id}")

        except Exception as e:
            logger.error(f"agent_3_or_4_background_failed | cluster_id={cluster_id} | error={str(e)}")

@router.post("", response_model=Issue, status_code=status.HTTP_201_CREATED)
async def create_issue(
    photo: UploadFile = File(...),
    latitude: float = Form(...),
    longitude: float = Form(...),
    user_note: Optional[str] = Form(None),
    background_tasks: BackgroundTasks = None,
    session: Session = Depends(get_session)
):
    # Validate file type
    if photo.content_type not in ["image/jpeg", "image/png"]:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"error": "validation_error", "fields": {"photo": "Must be jpg or png"}}
        )
    
    # Check coords
    if not (-90.0 <= latitude <= 90.0) or not (-180.0 <= longitude <= 180.0):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"error": "validation_error", "fields": {"coordinates": "Latitude or longitude out of range"}}
        )

    # Ensure uploads directory exists
    UPLOAD_DIR = "static/uploads"
    os.makedirs(UPLOAD_DIR, exist_ok=True)

    # Generate unique filename for photo
    file_extension = os.path.splitext(photo.filename)[1]
    if not file_extension:
        file_extension = ".png" if photo.content_type == "image/png" else ".jpg"
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    photo_path = os.path.join(UPLOAD_DIR, unique_filename)

    # Read photo and save locally
    photo_bytes = await photo.read()
    with open(photo_path, "wb") as f:
        f.write(photo_bytes)

    try:
        # Call Agent 1 Intake Analysis
        agent1_result = await analyze_issue_photo(
            photo_bytes=photo_bytes,
            mime_type=photo.content_type,
            user_note=user_note
        )
    except Exception as e:
        # Clean up photo file if AI classification fails
        if os.path.exists(photo_path):
            try:
                os.remove(photo_path)
            except Exception:
                pass
        raise e

    # Create and save DB record
    db_issue = Issue(
        photo_url=f"/static/uploads/{unique_filename}",
        latitude=latitude,
        longitude=longitude,
        user_note=user_note,
        issue_type=agent1_result.issue_type,
        severity=agent1_result.severity,
        description=agent1_result.description,
        credibility_score=agent1_result.credibility_score,
        status="classified"
    )

    session.add(db_issue)
    session.commit()
    session.refresh(db_issue)

    try:
        await verify_and_cluster_issue(db_issue, session)
    except Exception as e:
        logger.error(f"agent_2_failed_entirely | error={str(e)}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail={"error": "ai_unavailable", "retryable": True}
        )

    # Check if threshold crossed for Agent 3 triggering
    if db_issue.cluster_id and background_tasks:
        cluster = session.get(Cluster, db_issue.cluster_id)
        if cluster and cluster.report_count >= settings.threshold:
            background_tasks.add_task(run_agent_3_background, cluster.id)

    return db_issue

@router.get("", response_model=IssuesListResponse)
async def list_issues(
    cluster_id: Optional[str] = None,
    limit: int = 50,
    session: Session = Depends(get_session)
):
    # Query issues from DB
    query = select(Issue).limit(limit)
    if cluster_id:
        query = query.where(Issue.cluster_id == cluster_id)
    issues = session.exec(query).all()
    return IssuesListResponse(issues=list(issues))

@router.get("/{id}", response_model=IssueDetailResponse)
async def get_issue(
    id: str,
    session: Session = Depends(get_session)
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
                report_count=cluster.report_count
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
                    potential_consequences=impact.potential_consequences
                )
            
            # Fetch action drafts
            drafts = session.exec(
                select(ActionDraft).where(ActionDraft.cluster_id == cluster.id)
            ).all()
            for draft in drafts:
                action_draft_summaries.append(
                    ActionDraftSummary(
                        id=draft.id,
                        draft_type=draft.draft_type,
                        status=draft.status,
                        content=draft.content
                    )
                )

    return IssueDetailResponse(
        issue=issue,
        cluster=cluster_summary,
        impact_summary=impact_summary_summary,
        action_drafts=action_draft_summaries
    )
