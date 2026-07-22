"""
Government Workspace, Case Lifecycle & Audit Timeline API Router.
"""
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlmodel import Session as DBSession, select

from app.db import get_session
from app.models.issue import Issue
from app.models.case import Department, CaseAssignment, CaseTransition, RepairVerification, ResolutionRecord
from app.models.user import User
from app.core.workflow_engine import (
    ALLOWED_TRANSITIONS,
    validate_transition,
    record_transition,
    calculate_case_sla,
    STATE_ASSIGNED,
    STATE_ACKNOWLEDGED,
    STATE_WORK_IN_PROGRESS,
    STATE_ESCALATED,
    STATE_REPAIR_COMPLETED,
    STATE_VERIFICATION_REQUESTED,
    STATE_VERIFIED,
    STATE_RESOLVED,
    STATE_CLOSED,
    STATE_REOPENED,
)
from app.services.repair_service import RepairService
from app.dependencies.auth_deps import get_current_user, get_optional_user, require_officer

router = APIRouter(prefix="/cases", tags=["Government Workflow & Case Lifecycle"])

# Pydantic Request / Response Schemas
class AssignCaseRequest(BaseModel):
    department_id: Optional[str] = None
    assigned_officer_id: Optional[str] = None
    notes: Optional[str] = None

class TransitionRequest(BaseModel):
    reason: Optional[str] = None

class RepairCompleteRequest(BaseModel):
    after_photo_url: str
    officer_notes: Optional[str] = None
    repair_cost: Optional[float] = None
    contractor_name: Optional[str] = None

class VerificationVoteRequest(BaseModel):
    vote_passed: bool

class ResolveCaseRequest(BaseModel):
    resolution_summary: str
    resolution_type: Optional[str] = "repaired"

class CaseTimelineEvent(BaseModel):
    id: str
    issue_id: str
    action: str
    previous_state: str
    new_state: str
    actor_id: Optional[str] = None
    actor_role: str
    actor_department: Optional[str] = None
    reason: Optional[str] = None
    timestamp: str

@router.get("")
def list_cases(
    department_id: Optional[str] = None,
    status_filter: Optional[str] = None,
    overdue_only: Optional[bool] = False,
    db: DBSession = Depends(get_session)
):
    """List all government cases with SLA metrics and status filters."""
    query = select(Issue)
    if status_filter:
        query = query.where(Issue.status == status_filter)

    issues = db.exec(query).all()
    results = []

    for iss in issues:
        sla = calculate_case_sla(iss.created_at, iss.severity)
        if overdue_only and not sla["is_overdue"]:
            continue

        results.append({
            "id": iss.id,
            "photo_url": iss.photo_url,
            "latitude": iss.latitude,
            "longitude": iss.longitude,
            "issue_type": iss.issue_type,
            "severity": iss.severity,
            "status": iss.status,
            "created_at": iss.created_at,
            "sla": sla
        })

    return {"count": len(results), "cases": results}

@router.get("/{id}")
def get_case_details(
    id: str,
    db: DBSession = Depends(get_session)
):
    """Get full case details including assignment, repair verification, and SLA metrics."""
    issue = db.exec(select(Issue).where(Issue.id == id)).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Case not found")

    assignment = db.exec(select(CaseAssignment).where(CaseAssignment.issue_id == id)).first()
    repair = db.exec(select(RepairVerification).where(RepairVerification.issue_id == id)).first()
    resolution = db.exec(select(ResolutionRecord).where(ResolutionRecord.issue_id == id)).first()
    sla = calculate_case_sla(issue.created_at, issue.severity)

    return {
        "issue": issue,
        "assignment": assignment,
        "repair_verification": repair,
        "resolution": resolution,
        "sla": sla
    }

@router.post("/{id}/assign")
def assign_case(
    id: str,
    req: AssignCaseRequest,
    current_user: User = Depends(get_current_user),
    db: DBSession = Depends(get_session)
):
    """Assign case to a specific department or officer."""
    issue = db.exec(select(Issue).where(Issue.id == id)).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Case not found")

    prev_state = issue.status
    target_state = STATE_ASSIGNED

    assignment = CaseAssignment(
        issue_id=issue.id,
        department_id=req.department_id,
        assigned_officer_id=req.assigned_officer_id,
        assigned_by_id=current_user.id,
        notes=req.notes
    )
    db.add(assignment)

    issue.status = target_state
    db.add(issue)
    db.commit()

    record_transition(
        db,
        issue_id=issue.id,
        previous_state=prev_state,
        new_state=target_state,
        action="assign",
        actor_id=current_user.id,
        actor_role=current_user.role,
        actor_department=current_user.department,
        reason=req.notes or f"Case assigned to officer {req.assigned_officer_id or req.department_id}"
    )

    return {"status": "success", "case_id": issue.id, "state": target_state}

@router.post("/{id}/acknowledge")
def acknowledge_case(
    id: str,
    current_user: User = Depends(get_current_user),
    db: DBSession = Depends(get_session)
):
    """Officer acknowledges receipt of assigned case."""
    issue = db.exec(select(Issue).where(Issue.id == id)).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Case not found")

    prev_state = issue.status
    target_state = STATE_ACKNOWLEDGED

    issue.status = target_state
    db.add(issue)
    db.commit()

    record_transition(
        db,
        issue_id=issue.id,
        previous_state=prev_state,
        new_state=target_state,
        action="acknowledge",
        actor_id=current_user.id,
        actor_role=current_user.role,
        actor_department=current_user.department,
        reason="Receipt acknowledged by assigned officer."
    )
    return {"status": "success", "case_id": issue.id, "state": target_state}

@router.post("/{id}/accept")
def accept_case(
    id: str,
    current_user: User = Depends(get_current_user),
    db: DBSession = Depends(get_session)
):
    """Officer accepts case and moves to work in progress."""
    issue = db.exec(select(Issue).where(Issue.id == id)).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Case not found")

    prev_state = issue.status
    target_state = STATE_WORK_IN_PROGRESS

    issue.status = target_state
    db.add(issue)
    db.commit()

    record_transition(
        db,
        issue_id=issue.id,
        previous_state=prev_state,
        new_state=target_state,
        action="accept",
        actor_id=current_user.id,
        actor_role=current_user.role,
        actor_department=current_user.department,
        reason="Case accepted for active municipal repair."
    )
    return {"status": "success", "case_id": issue.id, "state": target_state}

@router.post("/{id}/escalate")
def escalate_case(
    id: str,
    req: TransitionRequest,
    current_user: User = Depends(get_current_user),
    db: DBSession = Depends(get_session)
):
    """Escalate overdue or critical case."""
    issue = db.exec(select(Issue).where(Issue.id == id)).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Case not found")

    prev_state = issue.status
    target_state = STATE_ESCALATED

    issue.status = target_state
    db.add(issue)
    db.commit()

    record_transition(
        db,
        issue_id=issue.id,
        previous_state=prev_state,
        new_state=target_state,
        action="escalate",
        actor_id=current_user.id,
        actor_role=current_user.role,
        actor_department=current_user.department,
        reason=req.reason or "Case escalated due to SLA threshold breach."
    )
    return {"status": "success", "case_id": issue.id, "state": target_state}

@router.post("/{id}/repair-complete")
def complete_repair(
    id: str,
    req: RepairCompleteRequest,
    current_user: User = Depends(get_current_user),
    db: DBSession = Depends(get_session)
):
    """Log repair completion with before/after photos."""
    verification = RepairService.submit_repair_completion(
        db,
        issue_id=id,
        after_photo_url=req.after_photo_url,
        officer_id=current_user.id,
        officer_notes=req.officer_notes,
        repair_cost=req.repair_cost,
        contractor_name=req.contractor_name
    )
    return {"status": "success", "verification_id": verification.id, "verification_status": verification.verification_status}

@router.post("/{id}/request-verification")
def request_verification(
    id: str,
    current_user: User = Depends(get_current_user),
    db: DBSession = Depends(get_session)
):
    """Transition case to verification_requested for citizen validation."""
    issue = db.exec(select(Issue).where(Issue.id == id)).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Case not found")

    prev_state = issue.status
    target_state = STATE_VERIFICATION_REQUESTED

    issue.status = target_state
    db.add(issue)
    db.commit()

    record_transition(
        db,
        issue_id=issue.id,
        previous_state=prev_state,
        new_state=target_state,
        action="request_verification",
        actor_id=current_user.id,
        actor_role=current_user.role,
        reason="Community on-site verification requested."
    )
    return {"status": "success", "case_id": issue.id, "state": target_state}

@router.post("/{id}/verify")
def submit_verification_vote(
    id: str,
    req: VerificationVoteRequest,
    current_user: Optional[User] = Depends(get_optional_user),
    db: DBSession = Depends(get_session)
):
    """Submit a citizen verification vote."""
    user_id = current_user.id if current_user else None
    verification = RepairService.record_community_vote(db, issue_id=id, vote_passed=req.vote_passed, user_id=user_id)
    return {
        "status": "success",
        "verification_status": verification.verification_status,
        "votes_passed": verification.community_votes_passed,
        "votes_failed": verification.community_votes_failed
    }

@router.post("/{id}/resolve")
def resolve_case(
    id: str,
    req: ResolveCaseRequest,
    current_user: User = Depends(get_current_user),
    db: DBSession = Depends(get_session)
):
    """Mark case as resolved."""
    issue = db.exec(select(Issue).where(Issue.id == id)).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Case not found")

    prev_state = issue.status
    target_state = STATE_RESOLVED

    issue.status = target_state
    db.add(issue)

    res_rec = ResolutionRecord(
        issue_id=issue.id,
        resolution_summary=req.resolution_summary,
        resolved_by_id=current_user.id,
        resolution_type=req.resolution_type or "repaired"
    )
    db.add(res_rec)
    db.commit()

    record_transition(
        db,
        issue_id=issue.id,
        previous_state=prev_state,
        new_state=target_state,
        action="resolve",
        actor_id=current_user.id,
        actor_role=current_user.role,
        reason=req.resolution_summary
    )
    return {"status": "success", "case_id": issue.id, "state": target_state}

@router.post("/{id}/close")
def close_case(
    id: str,
    current_user: User = Depends(get_current_user),
    db: DBSession = Depends(get_session)
):
    """Archive and close case."""
    issue = db.exec(select(Issue).where(Issue.id == id)).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Case not found")

    prev_state = issue.status
    target_state = STATE_CLOSED

    issue.status = target_state
    db.add(issue)
    db.commit()

    record_transition(
        db,
        issue_id=issue.id,
        previous_state=prev_state,
        new_state=target_state,
        action="close",
        actor_id=current_user.id,
        actor_role=current_user.role,
        reason="Case finalized and archived."
    )
    return {"status": "success", "case_id": issue.id, "state": target_state}

@router.post("/{id}/reopen")
def reopen_case(
    id: str,
    req: TransitionRequest,
    current_user: User = Depends(get_current_user),
    db: DBSession = Depends(get_session)
):
    """Reopen a resolved or closed case."""
    issue = db.exec(select(Issue).where(Issue.id == id)).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Case not found")

    prev_state = issue.status
    target_state = STATE_REOPENED

    issue.status = target_state
    db.add(issue)
    db.commit()

    record_transition(
        db,
        issue_id=issue.id,
        previous_state=prev_state,
        new_state=target_state,
        action="reopen",
        actor_id=current_user.id,
        actor_role=current_user.role,
        reason=req.reason or "Case reopened due to recurring defect."
    )
    return {"status": "success", "case_id": issue.id, "state": target_state}

@router.get("/{id}/timeline", response_model=List[CaseTimelineEvent])
def get_case_timeline(
    id: str,
    db: DBSession = Depends(get_session)
):
    """Retrieve full immutable audit timeline for a case."""
    transitions = db.exec(
        select(CaseTransition).where(CaseTransition.issue_id == id).order_by(CaseTransition.created_at.asc())
    ).all()

    res = []
    for t in transitions:
        res.append(CaseTimelineEvent(
            id=t.id,
            issue_id=t.issue_id,
            action=t.action,
            previous_state=t.previous_state,
            new_state=t.new_state,
            actor_id=t.actor_id,
            actor_role=t.actor_role,
            actor_department=t.actor_department,
            reason=t.reason,
            timestamp=t.created_at.isoformat()
        ))
    return res

@router.get("/{id}/audit")
def get_case_audit_log(
    id: str,
    db: DBSession = Depends(get_session)
):
    """Retrieve detailed audit log details for a case."""
    transitions = db.exec(
        select(CaseTransition).where(CaseTransition.issue_id == id).order_by(CaseTransition.created_at.asc())
    ).all()
    return {"issue_id": id, "audit_count": len(transitions), "transitions": transitions}
