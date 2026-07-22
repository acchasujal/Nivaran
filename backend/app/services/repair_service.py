"""
Repair Completion Verification & Community Voting Service.
"""
from typing import Optional, Dict, Any, List
from datetime import datetime, timezone
from sqlmodel import Session as DBSession, select
from fastapi import HTTPException, status

from app.models.issue import Issue
from app.models.case import RepairVerification, ResolutionRecord
from app.core.workflow_engine import (
    STATE_REPAIR_COMPLETED,
    STATE_VERIFICATION_REQUESTED,
    STATE_VERIFIED,
    STATE_RESOLVED,
    validate_transition,
    record_transition
)

class RepairService:

    @staticmethod
    def submit_repair_completion(
        db: DBSession,
        issue_id: str,
        after_photo_url: str,
        officer_id: Optional[str] = None,
        officer_notes: Optional[str] = None,
        repair_cost: Optional[float] = None,
        contractor_name: Optional[str] = None
    ) -> RepairVerification:
        """Log repair completion with before/after photos and update workflow state."""
        issue = db.exec(select(Issue).where(Issue.id == issue_id)).first()
        if not issue:
            raise HTTPException(status_code=404, detail="Issue not found")

        prev_state = issue.status
        target_state = STATE_REPAIR_COMPLETED

        if not validate_transition(prev_state, target_state):
            # Allow fallback force transition if case is in active resolution phase
            if prev_state not in [STATE_WORK_IN_PROGRESS, STATE_ASSIGNED, STATE_ACKNOWLEDGED, STATE_ESCALATED]:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Cannot transition case from '{prev_state}' to '{target_state}'"
                )

        verification = RepairVerification(
            issue_id=issue.id,
            officer_id=officer_id,
            before_photo_url=issue.photo_url,
            after_photo_url=after_photo_url,
            officer_notes=officer_notes,
            repair_cost=repair_cost,
            contractor_name=contractor_name,
            verification_status="pending_community",
            ai_confidence_score=0.94 # Simulates before/after vision comparison score
        )
        db.add(verification)

        issue.status = target_state
        db.add(issue)
        db.commit()
        db.refresh(verification)

        record_transition(
            db,
            issue_id=issue.id,
            previous_state=prev_state,
            new_state=target_state,
            action="repair_complete",
            actor_id=officer_id,
            actor_role="officer",
            reason=officer_notes or "Repair completed by field team."
        )
        return verification

    @staticmethod
    def record_community_vote(
        db: DBSession,
        issue_id: str,
        vote_passed: bool,
        user_id: Optional[str] = None
    ) -> RepairVerification:
        """Record a citizen verification vote and auto-resolve case when consensus is reached."""
        verification = db.exec(select(RepairVerification).where(RepairVerification.issue_id == issue_id)).first()
        if not verification:
            raise HTTPException(status_code=404, detail="No active repair verification record found for issue")

        if vote_passed:
            verification.community_votes_passed += 1
        else:
            verification.community_votes_failed += 1

        # Consensus check: 2 positive votes mark verification as passed
        if verification.community_votes_passed >= 2:
            verification.verification_status = "verified_passed"
            issue = db.exec(select(Issue).where(Issue.id == issue_id)).first()
            if issue and issue.status != STATE_VERIFIED:
                prev_state = issue.status
                issue.status = STATE_VERIFIED
                db.add(issue)
                record_transition(
                    db,
                    issue_id=issue.id,
                    previous_state=prev_state,
                    new_state=STATE_VERIFIED,
                    action="verify",
                    actor_id=user_id,
                    actor_role="citizen",
                    reason="Community consensus reached: Repair verified."
                )

        db.add(verification)
        db.commit()
        db.refresh(verification)
        return verification
