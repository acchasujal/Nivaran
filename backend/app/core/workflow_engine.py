"""
Finite State Machine (FSM) & SLA Calculation Engine for CivicPulse Government Workflow.
"""
from typing import Dict, List, Set, Optional, Tuple, Any
from datetime import datetime, timedelta, timezone
from sqlmodel import Session, select
from fastapi import HTTPException, status

from app.models.issue import Issue
from app.models.case import CaseTransition, CaseAssignment

# All Workflow States
STATE_CLASSIFIED = "classified"
STATE_CLUSTERED = "clustered"
STATE_PENDING_REVIEW = "pending_review"
STATE_DRAFTED = "drafted"
STATE_APPROVED = "approved"
STATE_ESCALATED = "escalated"
STATE_ACKNOWLEDGED = "acknowledged"
STATE_ASSIGNED = "assigned"
STATE_WORK_IN_PROGRESS = "work_in_progress"
STATE_INSPECTION = "inspection"
STATE_REPAIR_COMPLETED = "repair_completed"
STATE_VERIFICATION_REQUESTED = "verification_requested"
STATE_VERIFIED = "verified"
STATE_RESOLVED = "resolved"
STATE_CLOSED = "closed"
STATE_REOPENED = "reopened"
STATE_CANCELLED = "cancelled"

# FSM Transition Rules Matrix
ALLOWED_TRANSITIONS: Dict[str, Set[str]] = {
    STATE_CLASSIFIED: {STATE_CLUSTERED, STATE_PENDING_REVIEW, STATE_DRAFTED, STATE_CANCELLED},
    STATE_CLUSTERED: {STATE_PENDING_REVIEW, STATE_DRAFTED, STATE_CANCELLED},
    STATE_PENDING_REVIEW: {STATE_DRAFTED, STATE_APPROVED, STATE_CANCELLED},
    STATE_DRAFTED: {STATE_APPROVED, STATE_ESCALATED, STATE_CANCELLED},
    STATE_APPROVED: {STATE_ESCALATED, STATE_ACKNOWLEDGED, STATE_ASSIGNED, STATE_CANCELLED},
    STATE_ESCALATED: {STATE_ACKNOWLEDGED, STATE_ASSIGNED, STATE_WORK_IN_PROGRESS, STATE_CANCELLED},
    STATE_ACKNOWLEDGED: {STATE_ASSIGNED, STATE_WORK_IN_PROGRESS, STATE_CANCELLED},
    STATE_ASSIGNED: {STATE_WORK_IN_PROGRESS, STATE_INSPECTION, STATE_CANCELLED},
    STATE_WORK_IN_PROGRESS: {STATE_INSPECTION, STATE_REPAIR_COMPLETED, STATE_CANCELLED},
    STATE_INSPECTION: {STATE_REPAIR_COMPLETED, STATE_WORK_IN_PROGRESS, STATE_CANCELLED},
    STATE_REPAIR_COMPLETED: {STATE_VERIFICATION_REQUESTED, STATE_VERIFIED, STATE_RESOLVED, STATE_WORK_IN_PROGRESS},
    STATE_VERIFICATION_REQUESTED: {STATE_VERIFIED, STATE_RESOLVED, STATE_REPAIR_COMPLETED, STATE_WORK_IN_PROGRESS},
    STATE_VERIFIED: {STATE_RESOLVED, STATE_CLOSED},
    STATE_RESOLVED: {STATE_CLOSED, STATE_REOPENED},
    STATE_CLOSED: {STATE_REOPENED},
    STATE_REOPENED: {STATE_ASSIGNED, STATE_WORK_IN_PROGRESS},
    STATE_CANCELLED: set(),
}

# SLA Target Days by Severity (Severity 1 to 5)
SLA_TARGET_DAYS: Dict[int, int] = {
    5: 2,  # Critical hazards -> 48h SLA target
    4: 5,  # High priority -> 5 days
    3: 7,  # Moderate priority -> 7 days
    2: 14, # Low priority -> 14 days
    1: 30, # Advisory -> 30 days
}

def validate_transition(current_state: str, target_state: str) -> bool:
    """Validate if target_state is a permitted transition from current_state."""
    allowed = ALLOWED_TRANSITIONS.get(current_state, set())
    return target_state in allowed

def record_transition(
    db: Session,
    issue_id: str,
    previous_state: str,
    new_state: str,
    action: str,
    actor_id: Optional[str] = None,
    actor_role: str = "system",
    actor_department: Optional[str] = None,
    reason: Optional[str] = None,
    metadata: Optional[Dict[str, Any]] = None
) -> CaseTransition:
    """Record an immutable transition event in the case audit trail."""
    transition = CaseTransition(
        issue_id=issue_id,
        actor_id=actor_id,
        actor_role=actor_role,
        actor_department=actor_department,
        previous_state=previous_state,
        new_state=new_state,
        action=action,
        reason=reason,
        metadata_json=metadata or {}
    )
    db.add(transition)
    db.commit()
    db.refresh(transition)
    return transition

def calculate_case_sla(created_at_iso: str, severity: int = 3) -> Dict[str, Any]:
    """Calculate SLA target timestamp, time remaining hours, and overdue status."""
    try:
        if created_at_iso.endswith("Z"):
            created_at_iso = created_at_iso[:-1] + "+00:00"
        created_dt = datetime.fromisoformat(created_at_iso)
        if created_dt.tzinfo is None:
            created_dt = created_dt.replace(tzinfo=timezone.utc)
    except Exception:
        created_dt = datetime.now(timezone.utc)

    target_days = SLA_TARGET_DAYS.get(severity, 7)
    sla_deadline = created_dt + timedelta(days=target_days)
    now = datetime.now(timezone.utc)

    diff_seconds = (sla_deadline - now).total_seconds()
    time_remaining_hours = round(diff_seconds / 3600.0, 1)
    is_overdue = diff_seconds < 0

    return {
        "severity": severity,
        "target_days": target_days,
        "sla_deadline": sla_deadline.isoformat(),
        "time_remaining_hours": time_remaining_hours,
        "is_overdue": is_overdue
    }
