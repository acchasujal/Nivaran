"""
Notification & Preference Management Service.
"""
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
from sqlmodel import Session as DBSession, select
from fastapi import HTTPException, status

from app.models.notification import Notification, NotificationPreference, Announcement
from app.models.user import User

class NotificationService:

    @staticmethod
    def get_user_notifications(
        db: DBSession,
        user_id: str,
        category: Optional[str] = None,
        unread_only: bool = False
    ) -> List[Notification]:
        """Fetch notifications for a user."""
        query = select(Notification).where(Notification.user_id == user_id, Notification.archived == False)
        if category:
            query = query.where(Notification.category == category)
        if unread_only:
            query = query.where(Notification.read == False)
        
        query = query.order_by(Notification.created_at.desc())
        return db.exec(query).all()

    @staticmethod
    def get_unread_count(db: DBSession, user_id: str) -> int:
        """Count unread active notifications for user."""
        query = select(Notification).where(
            Notification.user_id == user_id,
            Notification.read == False,
            Notification.archived == False
        )
        return len(db.exec(query).all())

    @staticmethod
    def mark_as_read(db: DBSession, notification_id: str, user_id: str) -> Notification:
        """Mark a notification as read."""
        notif = db.exec(select(Notification).where(Notification.id == notification_id)).first()
        if not notif:
            raise HTTPException(status_code=404, detail="Notification not found")
        if notif.user_id != user_id:
            raise HTTPException(status_code=403, detail="Not authorized to modify this notification")

        notif.read = True
        db.add(notif)
        db.commit()
        db.refresh(notif)
        return notif

    @staticmethod
    def mark_all_as_read(db: DBSession, user_id: str) -> int:
        """Mark all notifications as read for a user."""
        notifs = db.exec(
            select(Notification).where(Notification.user_id == user_id, Notification.read == False)
        ).all()
        count = len(notifs)
        for n in notifs:
            n.read = True
            db.add(n)
        db.commit()
        return count

    @staticmethod
    def delete_notification(db: DBSession, notification_id: str, user_id: str) -> bool:
        """Archive / Delete a notification."""
        notif = db.exec(select(Notification).where(Notification.id == notification_id)).first()
        if not notif:
            return False
        if notif.user_id != user_id:
            raise HTTPException(status_code=403, detail="Not authorized to delete this notification")

        notif.archived = True
        db.add(notif)
        db.commit()
        return True

    @staticmethod
    def get_user_preferences(db: DBSession, user_id: str) -> NotificationPreference:
        """Fetch or initialize default notification preferences for user."""
        pref = db.exec(select(NotificationPreference).where(NotificationPreference.user_id == user_id)).first()
        if not pref:
            pref = NotificationPreference(
                user_id=user_id,
                email_enabled=True,
                whatsapp_enabled=True,
                sms_enabled=False,
                push_enabled=True,
                digest_frequency="instant",
                language="en"
            )
            db.add(pref)
            db.commit()
            db.refresh(pref)
        return pref

    @staticmethod
    def update_user_preferences(
        db: DBSession,
        user_id: str,
        email_enabled: Optional[bool] = None,
        whatsapp_enabled: Optional[bool] = None,
        sms_enabled: Optional[bool] = None,
        push_enabled: Optional[bool] = None,
        quiet_hours_start: Optional[str] = None,
        quiet_hours_end: Optional[str] = None,
        digest_frequency: Optional[str] = None,
        language: Optional[str] = None
    ) -> NotificationPreference:
        """Update notification preferences for user."""
        pref = NotificationService.get_user_preferences(db, user_id)
        if email_enabled is not None:
            pref.email_enabled = email_enabled
        if whatsapp_enabled is not None:
            pref.whatsapp_enabled = whatsapp_enabled
        if sms_enabled is not None:
            pref.sms_enabled = sms_enabled
        if push_enabled is not None:
            pref.push_enabled = push_enabled
        if quiet_hours_start is not None:
            pref.quiet_hours_start = quiet_hours_start
        if quiet_hours_end is not None:
            pref.quiet_hours_end = quiet_hours_end
        if digest_frequency is not None:
            pref.digest_frequency = digest_frequency
        if language is not None:
            pref.language = language

        pref.updated_at = datetime.now(timezone.utc)
        db.add(pref)
        db.commit()
        db.refresh(pref)
        return pref
