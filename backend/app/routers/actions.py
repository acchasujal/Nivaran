from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from pydantic import BaseModel, field_validator
from app.models.action_draft import ActionDraft
from app.models.cluster import Cluster
from app.models.impact_summary import ImpactSummary
from app.db import get_session
from app.services.agent_4_action_generator import generate_action_drafts
from sqlmodel import Session, select
from datetime import datetime, timezone
import logging

logger = logging.getLogger("civicpulse")

router = APIRouter(tags=["actions"])

class DraftStatusUpdateRequest(BaseModel):
    status: str

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: str) -> str:
        if v not in {"approved", "rejected"}:
            raise ValueError("status must be 'approved' or 'rejected'")
        return v

class GenerateDraftsResponse(BaseModel):
    drafts: List[ActionDraft]

@router.post("/clusters/{id}/generate-drafts", response_model=GenerateDraftsResponse, status_code=status.HTTP_201_CREATED)
async def generate_drafts(
    id: str,
    session: Session = Depends(get_session)
):
    # Check if cluster exists
    cluster = session.get(Cluster, id)
    if not cluster:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cluster not found"
        )
    
    # Check if impact summary exists
    impact = session.exec(select(ImpactSummary).where(ImpactSummary.cluster_id == id)).first()
    if not impact:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"error": "no_impact_summary_yet", "message": "No impact summary yet — generate that first"}
        )
    
    try:
        drafts = await generate_action_drafts(cluster_id=id, session=session, force_regenerate=True)
        return GenerateDraftsResponse(drafts=drafts)
    except HTTPException as he:
        raise he
    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"error": "no_impact_summary_yet", "message": str(ve)}
        )
    except Exception as e:
        logger.error(f"manual_generate_drafts_failed | cluster_id={id} | error={str(e)}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail={"error": "ai_unavailable", "retryable": True}
        )

class DraftUpdateRequest(BaseModel):
    status: Optional[str] = None
    content: Optional[str] = None

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v not in {"approved", "rejected", "pending_review"}:
            raise ValueError("status must be 'approved', 'rejected', or 'pending_review'")
        return v

class ImproveDraftRequest(BaseModel):
    content: str
    prompt: Optional[str] = None

class ImproveDraftResponse(BaseModel):
    refined_text: str

@router.patch("/action-drafts/{id}", response_model=ActionDraft, status_code=status.HTTP_200_OK)
async def update_draft(
    id: str,
    payload: DraftUpdateRequest,
    session: Session = Depends(get_session)
):
    draft = session.get(ActionDraft, id)
    if not draft:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Draft not found")
    
    if payload.status is not None:
        draft.status = payload.status
        draft.reviewed_at = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
    
    if payload.content is not None:
        # Enforce RTI disclaimer prefix if it's an RTI draft
        if draft.draft_type == "rti":
            disclaimer = "AI-generated draft. Review before submission."
            if not payload.content.startswith(disclaimer):
                payload.content = f"{disclaimer}\n{payload.content}"
        draft.content = payload.content
        
    session.add(draft)
    session.commit()
    session.refresh(draft)
    
    return draft

@router.post("/action-drafts/{id}/improve", response_model=ImproveDraftResponse, status_code=status.HTTP_200_OK)
async def improve_draft(
    id: str,
    payload: ImproveDraftRequest,
    session: Session = Depends(get_session)
):
    draft = session.get(ActionDraft, id)
    if not draft:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Draft not found")

    from app.services.gemini_client import GeminiClient
    client = GeminiClient()

    system_instruction = (
        "You are an expert civic advocate and legal paralegal in India. "
        "Your task is to refine and improve the writing, grammar, vocabulary, tone, and structure of a draft complaint or RTI. "
        "Ensure the output is highly professional, formal, persuasive, and authoritative. "
        "CRITICAL: Do NOT alter the core meaning, facts, names, dates, localities, or severity. "
        "If the draft begins with 'AI-generated draft. Review before submission.', you MUST keep that disclaimer exactly at the beginning."
    )

    user_instruction = (
        f"Please refine and improve the following text:\n\n{payload.content}\n\n"
    )
    if payload.prompt:
        user_instruction += f"User feedback/guidance to apply while refining:\n{payload.prompt}\n"

    class RefinedDraftSchema(BaseModel):
        refined_text: str

    try:
        res = await client.generate_structured_output(
            prompt=user_instruction,
            response_schema=RefinedDraftSchema,
            system_instruction=system_instruction
        )
        return ImproveDraftResponse(refined_text=res.refined_text)
    except Exception as e:
        logger.error(f"improve_draft_failed | id={id} | error={str(e)}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Gemini model was unable to refine this draft."
        )
