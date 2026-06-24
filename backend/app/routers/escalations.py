from fastapi import APIRouter, Depends, HTTPException, status
from typing import Optional
from pydantic import BaseModel, field_validator
from app.models.escalation import Escalation
from app.models.action_draft import ActionDraft
from app.db import get_session
from sqlmodel import Session
from datetime import datetime

router = APIRouter(prefix="/escalations", tags=["escalations"])

class EscalationRequest(BaseModel):
    draft_id: str
    method: str
    recipient: Optional[str] = None

    @field_validator("method")
    @classmethod
    def validate_method(cls, v: str) -> str:
        if v not in {"email", "pdf_export"}:
            raise ValueError("method must be 'email' or 'pdf_export'")
        return v

class EscalationResponse(BaseModel):
    id: str
    draft_id: str
    method: str
    recipient: Optional[str] = None
    status: str
    provider_response: Optional[str] = None
    sent_at: Optional[str] = None
    created_at: str
    pdf_download_url: Optional[str] = None

@router.post("", response_model=EscalationResponse, status_code=status.HTTP_201_CREATED)
async def create_escalation(
    payload: EscalationRequest,
    session: Session = Depends(get_session)
):
    # Fetch action draft
    draft = session.get(ActionDraft, payload.draft_id)
    if not draft:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Draft not found"
        )
    
    # HARD GATE: If draft.status != "approved" -> return 403
    if draft.status != "approved":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"error": "draft_not_approved"}
        )
    
    # Validation rules
    if payload.method == "email":
        if not payload.recipient or "@" not in payload.recipient:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail={"error": "validation_error", "fields": {"recipient": "Valid email recipient is required for email method"}}
            )
            
    # Return placeholder escalation
    now_str = datetime.utcnow().isoformat() + "Z"
    if payload.method == "email":
        return EscalationResponse(
            id="placeholder-escalation-uuid",
            draft_id=payload.draft_id,
            method="email",
            recipient=payload.recipient,
            status="sent",
            provider_response="250 OK",
            sent_at=now_str,
            created_at=now_str
        )
    else:
        return EscalationResponse(
            id="placeholder-escalation-uuid",
            draft_id=payload.draft_id,
            method="pdf_export",
            status="exported",
            provider_response="PDF generated successfully",
            sent_at=now_str,
            created_at=now_str,
            pdf_download_url="/api/static/downloads/placeholder.pdf"
        )

@router.get("/{id}", response_model=EscalationResponse)
async def get_escalation(
    id: str,
    session: Session = Depends(get_session)
):
    escalation = session.get(Escalation, id)
    if not escalation:
        raise HTTPException(status_code=404, detail="Escalation not found")
    
    # Map to response model
    return EscalationResponse(
        id=escalation.id,
        draft_id=escalation.draft_id,
        method=escalation.method,
        recipient=escalation.recipient,
        status=escalation.status,
        provider_response=escalation.provider_response,
        sent_at=escalation.sent_at,
        created_at=escalation.created_at,
        pdf_download_url="/api/static/downloads/placeholder.pdf" if escalation.method == "pdf_export" else None
    )
