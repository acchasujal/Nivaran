from fastapi import APIRouter, Depends, HTTPException, status
from app.models.impact_summary import ImpactSummary
from app.models.cluster import Cluster
from app.db import get_session
from sqlmodel import Session
from datetime import datetime

router = APIRouter(prefix="/clusters/{id}/impact", tags=["impact"])

@router.post("", response_model=ImpactSummary, status_code=status.HTTP_200_OK)
async def trigger_impact(
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
    
    # Return placeholder ImpactSummary
    placeholder_summary = ImpactSummary(
        cluster_id=id,
        affected_area_description="Placeholder affected area",
        potential_consequences="Placeholder consequences",
        risk_level="moderate",
        evidence_count=cluster.report_count,
        generated_at=datetime.utcnow().isoformat() + "Z"
    )
    return placeholder_summary
