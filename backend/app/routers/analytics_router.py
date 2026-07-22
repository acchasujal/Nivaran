"""
Analytics API Router.
"""
from typing import Dict, Any
from fastapi import APIRouter, Depends
from sqlmodel import Session as DBSession

from app.db import get_session
from app.services.analytics_service import AnalyticsService

router = APIRouter(prefix="/analytics", tags=["Analytics & Telemetry"])

@router.get("/platform")
def get_platform_analytics(db: DBSession = Depends(get_session)):
    """Executive platform overview analytics."""
    return AnalyticsService.get_platform_analytics(db)

@router.get("/government")
def get_government_analytics(db: DBSession = Depends(get_session)):
    """Government and officer performance analytics."""
    return AnalyticsService.get_government_analytics(db)

@router.get("/community")
def get_community_analytics(db: DBSession = Depends(get_session)):
    """Community engagement and verification analytics."""
    return AnalyticsService.get_community_analytics(db)

@router.get("/notifications")
def get_notification_analytics(db: DBSession = Depends(get_session)):
    """Notification delivery throughput analytics."""
    return AnalyticsService.get_notification_analytics(db)

@router.get("/officers")
def get_officer_analytics(db: DBSession = Depends(get_session)):
    """Officer productivity metrics."""
    return AnalyticsService.get_government_analytics(db)["officer_productivity"]

@router.get("/departments")
def get_department_analytics(db: DBSession = Depends(get_session)):
    """Department metrics."""
    return AnalyticsService.get_government_analytics(db)
