import os
import uuid
import logging
import json
from typing import Optional
from sqlmodel import Session, select
from datetime import datetime, timezone
from fastapi import HTTPException, status

from app.models.escalation import Escalation
from app.models.action_draft import ActionDraft
from app.models.issue import Issue
from app.services.email_client import send_email
from app.services.pdf_export import render_draft_to_pdf
from app.config import settings

logger = logging.getLogger("civicpulse")

async def escalate_draft(
    draft_id: str,
    method: str,
    recipient: Optional[str],
    session: Session
) -> Escalation:
    import time
    start_time = time.time()
    issue_id = "N/A"
    try:
        # Fetch the draft to retrieve the cluster and get the first issue_id
        draft = session.get(ActionDraft, draft_id)
        if draft and draft.cluster_id:
            issues = session.exec(select(Issue).where(Issue.cluster_id == draft.cluster_id)).all()
            if issues:
                issue_id = issues[0].id

        escalation = await _escalate_draft_impl(
            draft_id=draft_id,
            method=method,
            recipient=recipient,
            session=session
        )
        latency_ms = int((time.time() - start_time) * 1000)
        logger.info(json.dumps({
            "agent": "Agent5",
            "issue_id": issue_id,
            "latency_ms": latency_ms,
            "success": True
        }))
        return escalation
    except Exception as e:
        latency_ms = int((time.time() - start_time) * 1000)
        logger.info(json.dumps({
            "agent": "Agent5",
            "issue_id": issue_id,
            "latency_ms": latency_ms,
            "success": False
        }))
        raise e

async def _escalate_draft_impl(
    draft_id: str,
    method: str,
    recipient: Optional[str],
    session: Session
) -> Escalation:
    """
    Agent 5: Escalation Agent.
    Performs real external actions for approved drafts.
    Updates the cluster issues' status to escalated upon success/export.
    """
    # 1. Fetch action draft
    draft = session.get(ActionDraft, draft_id)
    if not draft:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Draft not found"
        )

    # 2. HARD GATE: enforce draft status approved check
    if draft.status != "approved":
        logger.warning(f"agent_5_escalation_blocked | draft_id={draft_id} | status={draft.status}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"error": "draft_not_approved"}
        )

    # Create new escalation row configuration
    escalation_id = str(uuid.uuid4())
    now_str = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")

    escalation = Escalation(
        id=escalation_id,
        draft_id=draft_id,
        method=method,
        recipient=recipient,
        status="failed", # default
        created_at=now_str
    )

    if method == "email":
        try:
            # Attempt to send email
            response_text = await send_email(
                to_email=recipient,
                subject=f"CivicPulse Escalation - {draft.draft_type.replace('_', ' ').title()}",
                content=draft.content
            )
            escalation.status = "sent"
            escalation.provider_response = response_text
            escalation.sent_at = now_str
            session.add(escalation)

            # Transition issues to "escalated"
            issues = session.exec(select(Issue).where(Issue.cluster_id == draft.cluster_id)).all()
            for issue in issues:
                issue.status = "escalated"
                session.add(issue)
            
            session.commit()
            session.refresh(escalation)
            logger.info(f"agent_5_escalation_email_sent | escalation_id={escalation.id}")

        except Exception as e:
            logger.error(f"agent_5_email_failed_attempting_fallback | error={str(e)}")
            if settings.AGENT5_PDF_FALLBACK:
                # Run PDF fallback
                pdf_filename = f"{escalation_id}.pdf"
                pdf_path = os.path.join("static/downloads", pdf_filename)
                
                try:
                    render_draft_to_pdf(draft.content, pdf_path)
                    
                    escalation.method = "pdf_export"
                    escalation.status = "exported"
                    escalation.provider_response = f"Email failed: {str(e)}. Fell back to PDF generation."
                    escalation.sent_at = now_str
                    session.add(escalation)

                    # Transition issues to "escalated"
                    issues = session.exec(select(Issue).where(Issue.cluster_id == draft.cluster_id)).all()
                    for issue in issues:
                        issue.status = "escalated"
                        session.add(issue)
                    
                    session.commit()
                    session.refresh(escalation)
                    logger.info(f"agent_5_escalation_pdf_fallback_success | escalation_id={escalation.id}")

                except Exception as pdf_err:
                    escalation.status = "failed"
                    escalation.provider_response = f"Email failed: {str(e)}. PDF fallback failed: {str(pdf_err)}."
                    session.add(escalation)
                    session.commit()
                    raise HTTPException(
                        status_code=status.HTTP_502_BAD_GATEWAY,
                        detail={"error": "escalation_failed", "provider_response": escalation.provider_response}
                    )
            else:
                escalation.status = "failed"
                escalation.provider_response = f"Email failed: {str(e)}."
                session.add(escalation)
                session.commit()
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail={"error": "escalation_failed", "provider_response": escalation.provider_response}
                )

    elif method == "pdf_export":
        pdf_filename = f"{escalation_id}.pdf"
        pdf_path = os.path.join("static/downloads", pdf_filename)
        
        try:
            render_draft_to_pdf(draft.content, pdf_path)
            escalation.status = "exported"
            escalation.provider_response = "PDF generated successfully"
            escalation.sent_at = now_str
            session.add(escalation)

            # Transition issues to "escalated"
            issues = session.exec(select(Issue).where(Issue.cluster_id == draft.cluster_id)).all()
            for issue in issues:
                issue.status = "escalated"
                session.add(issue)
            
            session.commit()
            session.refresh(escalation)
            logger.info(f"agent_5_escalation_pdf_export_success | escalation_id={escalation.id}")

        except Exception as e:
            escalation.status = "failed"
            escalation.provider_response = f"PDF export failed: {str(e)}."
            session.add(escalation)
            session.commit()
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail={"error": "escalation_failed", "provider_response": escalation.provider_response}
            )

    return escalation
