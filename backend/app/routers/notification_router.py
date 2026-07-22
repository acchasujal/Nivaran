"""
Notification Center & User Preferences API Router.
"""
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlmodel import Session as DBSession, select

from app.db import get_session
from app.models.notification import Notification, NotificationPreference, Announcement
from app.models.user import User
from app.services.notification_service import NotificationService
from app.dependencies.auth_deps import get_current_user, get_optional_user

router = APIRouter(tags=["Notification Center & Preferences"])

# Response / Request Schemas
class NotificationResponse(BaseModel):
    id: str
    title: str
    message: str
    category: str
    timestamp: str
    read: bool
    caseId: Optional[str] = None

class NotificationPreferenceUpdateRequest(BaseModel):
    email_enabled: Optional[bool] = None
    whatsapp_enabled: Optional[bool] = None
    sms_enabled: Optional[bool] = None
    push_enabled: Optional[bool] = None
    quiet_hours_start: Optional[str] = None
    quiet_hours_end: Optional[str] = None
    digest_frequency: Optional[str] = None
    language: Optional[str] = None

class CreateAnnouncementRequest(BaseModel):
    title: str
    content: str
    target_role: Optional[str] = "all"

@router.get("/notifications", response_model=List[NotificationResponse])
def get_notifications(
    category: Optional[str] = None,
    unread_only: Optional[bool] = False,
    current_user: User = Depends(get_current_user),
    db: DBSession = Depends(get_session)
):
    """Retrieve active notifications for the current user."""
    notifs = NotificationService.get_user_notifications(db, current_user.id, category=category, unread_only=unread_only or False)
    res = []
    for n in notifs:
        res.append(NotificationResponse(
            id=n.id,
            title=n.title,
            message=n.message,
            category=n.category,
            timestamp=n.created_at.isoformat(),
            read=n.read,
            caseId=n.case_id
        ))
    return res

@router.get("/notifications/unread-count")
def get_unread_count(
    current_user: User = Depends(get_current_user),
    db: DBSession = Depends(get_session)
):
    """Get total count of unread notifications."""
    count = NotificationService.get_unread_count(db, current_user.id)
    return {"unread_count": count}

@router.patch("/notifications/{id}/read", response_model=NotificationResponse)
def mark_notification_read(
    id: str,
    current_user: User = Depends(get_current_user),
    db: DBSession = Depends(get_session)
):
    """Mark a notification as read."""
    n = NotificationService.mark_as_read(db, id, current_user.id)
    return NotificationResponse(
        id=n.id,
        title=n.title,
        message=n.message,
        category=n.category,
        timestamp=n.created_at.isoformat(),
        read=n.read,
        caseId=n.case_id
    )

@router.patch("/notifications/read-all")
def mark_all_notifications_read(
    current_user: User = Depends(get_current_user),
    db: DBSession = Depends(get_session)
):
    """Mark all notifications as read for current user."""
    count = NotificationService.mark_all_as_read(db, current_user.id)
    return {"status": "success", "updated_count": count}

@router.delete("/notifications/{id}")
def delete_notification(
    id: str,
    current_user: User = Depends(get_current_user),
    db: DBSession = Depends(get_session)
):
    """Delete / Archive a notification by ID."""
    success = NotificationService.delete_notification(db, id, current_user.id)
    if not success:
        raise HTTPException(status_code=404, detail="Notification not found")
    return {"status": "success", "message": f"Notification {id} removed"}

@router.get("/preferences/notifications")
def get_notification_preferences(
    current_user: User = Depends(get_current_user),
    db: DBSession = Depends(get_session)
):
    """Get communication channel preferences for current user."""
    return NotificationService.get_user_preferences(db, current_user.id)

@router.put("/preferences/notifications")
def update_notification_preferences(
    req: NotificationPreferenceUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: DBSession = Depends(get_session)
):
    """Update communication channel preferences for current user."""
    return NotificationService.update_user_preferences(
        db,
        user_id=current_user.id,
        email_enabled=req.email_enabled,
        whatsapp_enabled=req.whatsapp_enabled,
        sms_enabled=req.sms_enabled,
        push_enabled=req.push_enabled,
        quiet_hours_start=req.quiet_hours_start,
        quiet_hours_end=req.quiet_hours_end,
        digest_frequency=req.digest_frequency,
        language=req.language
    )

@router.post("/announcements", status_code=status.HTTP_201_CREATED)
def create_announcement(
    req: CreateAnnouncementRequest,
    current_user: User = Depends(get_current_user),
    db: DBSession = Depends(get_session)
):
    """Broadcast a public system announcement."""
    if current_user.role not in ["admin", "officer"]:
        raise HTTPException(status_code=403, detail="Only officers or admins can create system announcements")

    anc = Announcement(
        title=req.title,
        content=req.content,
        target_role=req.target_role or "all",
        created_by_id=current_user.id
    )
    db.add(anc)
    db.commit()
    db.refresh(anc)
    return {"status": "success", "announcement_id": anc.id, "title": anc.title}

@router.get("/announcements")
def list_announcements(
    db: DBSession = Depends(get_session)
):
    """List active system announcements."""
    announcements = db.exec(select(Announcement).order_by(Announcement.created_at.desc())).all()
    return announcements
