from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
import uuid
from sqlmodel import SQLModel, Field, JSON, Relationship

class Notification(SQLModel, table=True):
    __tablename__ = "notifications"

    id: str = Field(default_factory=lambda: f"NOTIF-{uuid.uuid4().hex[:10].upper()}", primary_key=True, index=True)
    user_id: str = Field(foreign_key="users.id", index=True)
    title: str = Field(nullable=False)
    message: str = Field(nullable=False)
    category: str = Field(default="status", index=True) # government, community, status, verification, system
    event_type: str = Field(default="general", index=True)
    case_id: Optional[str] = Field(default=None, index=True)
    read: bool = Field(default=False, index=True)
    archived: bool = Field(default=False, index=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), index=True)

class NotificationPreference(SQLModel, table=True):
    __tablename__ = "notification_preferences"

    id: str = Field(default_factory=lambda: f"PREF-{uuid.uuid4().hex[:10].upper()}", primary_key=True, index=True)
    user_id: str = Field(foreign_key="users.id", unique=True, index=True)
    email_enabled: bool = Field(default=True)
    whatsapp_enabled: bool = Field(default=True)
    sms_enabled: bool = Field(default=False)
    push_enabled: bool = Field(default=True)
    quiet_hours_start: Optional[str] = Field(default=None) # e.g. "22:00"
    quiet_hours_end: Optional[str] = Field(default=None)   # e.g. "07:00"
    digest_frequency: str = Field(default="instant")       # instant, daily, weekly
    language: str = Field(default="en")                    # en, hi, mr
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class NotificationDelivery(SQLModel, table=True):
    __tablename__ = "notification_deliveries"

    id: str = Field(default_factory=lambda: f"DEL-{uuid.uuid4().hex[:10].upper()}", primary_key=True, index=True)
    notification_id: str = Field(foreign_key="notifications.id", index=True)
    channel: str = Field(index=True) # in_app, email, whatsapp, sms, push
    status: str = Field(default="queued", index=True) # queued, sending, delivered, failed
    retry_count: int = Field(default=0)
    provider_response: Optional[str] = Field(default=None)
    delivered_at: Optional[datetime] = Field(default=None)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Announcement(SQLModel, table=True):
    __tablename__ = "announcements"

    id: str = Field(default_factory=lambda: f"ANC-{uuid.uuid4().hex[:10].upper()}", primary_key=True, index=True)
    title: str = Field(nullable=False)
    content: str = Field(nullable=False)
    target_role: Optional[str] = Field(default=None, index=True) # all, citizen, officer, admin
    created_by_id: Optional[str] = Field(default=None, foreign_key="users.id")
    expires_at: Optional[datetime] = Field(default=None)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
