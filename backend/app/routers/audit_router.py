"""
Global Audit Search & Export API Router.
"""
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, Query, Response
from sqlmodel import Session as DBSession

from app.db import get_session
from app.services.audit_service import AuditService

router = APIRouter(prefix="/audit", tags=["Global Audit Search & Exports"])

@router.get("/search")
def search_audit_log(
    q: Optional[str] = Query(None, alias="q"),
    issue_id: Optional[str] = None,
    actor_id: Optional[str] = None,
    action: Optional[str] = None,
    limit: int = 50,
    db: DBSession = Depends(get_session)
):
    """Global search across case transition audit logs."""
    return AuditService.search_audit_log(db, query_str=q, issue_id=issue_id, actor_id=actor_id, action=action, limit=limit)

@router.get("/export")
def export_audit_log(
    format: str = Query("csv", pattern="^(csv|json)$"),
    issue_id: Optional[str] = None,
    db: DBSession = Depends(get_session)
):
    """Export audit log as CSV or JSON."""
    if format == "csv":
        content = AuditService.export_audit_csv(db, issue_id=issue_id)
        return Response(
            content=content,
            media_type="text/csv",
            headers={"Content-Disposition": 'attachment; filename="nivaran_audit_log.csv"'}
        )
    else:
        content = AuditService.export_audit_json(db, issue_id=issue_id)
        return Response(
            content=content,
            media_type="application/json",
            headers={"Content-Disposition": 'attachment; filename="nivaran_audit_log.json"'}
        )
