from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
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

@router.patch("/action-drafts/{id}", response_model=ActionDraft, status_code=status.HTTP_200_OK)
async def update_draft_status(
    id: str,
    payload: DraftStatusUpdateRequest,
    session: Session = Depends(get_session)
):
    draft = session.get(ActionDraft, id)
    if not draft:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Draft not found")
    
    # Update status
    draft.status = payload.status
    draft.reviewed_at = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
    
    # Save (in skeleton, we'll write to DB to verify model behavior)
    session.add(draft)
    session.commit()
    session.refresh(draft)
    
    return draft
