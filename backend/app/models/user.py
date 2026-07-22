from typing import Optional, List
from datetime import datetime, timezone
import uuid
from sqlmodel import SQLModel, Field, Relationship

class User(SQLModel, table=True):
    __tablename__ = "users"

    id: str = Field(default_factory=lambda: f"USR-{uuid.uuid4().hex[:8].upper()}", primary_key=True, index=True)
    email: str = Field(unique=True, index=True, nullable=False)
    hashed_password: Optional[str] = Field(default=None, nullable=True)
    name: str = Field(default="Anonymous User")
    role: str = Field(default="citizen", index=True) # citizen, officer, auditor, admin, institution, evaluation, anonymous
    department: Optional[str] = Field(default=None)
    avatar_url: Optional[str] = Field(default=None)
    phone: Optional[str] = Field(default=None)
    is_active: bool = Field(default=True)
    is_verified: bool = Field(default=False)
    institution_id: Optional[str] = Field(default=None, index=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    last_login_at: Optional[datetime] = Field(default=None)

    refresh_tokens: List["RefreshToken"] = Relationship(back_populates="user", sa_relationship_kwargs={"cascade": "all, delete-orphan"})
    sessions: List["Session"] = Relationship(back_populates="user", sa_relationship_kwargs={"cascade": "all, delete-orphan"})
    login_history: List["LoginHistory"] = Relationship(back_populates="user", sa_relationship_kwargs={"cascade": "all, delete-orphan"})

class Role(SQLModel, table=True):
    __tablename__ = "roles"

    id: str = Field(primary_key=True)
    name: str = Field(unique=True, index=True)
    description: str = Field(default="")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Permission(SQLModel, table=True):
    __tablename__ = "permissions"

    id: str = Field(primary_key=True)
    name: str = Field(unique=True, index=True)
    description: str = Field(default="")

class RefreshToken(SQLModel, table=True):
    __tablename__ = "refresh_tokens"

    id: str = Field(primary_key=True) # jti
    user_id: str = Field(foreign_key="users.id", index=True)
    token_hash: str = Field(nullable=False, index=True)
    expires_at: datetime = Field(nullable=False)
    is_revoked: bool = Field(default=False, index=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    replaced_by_jti: Optional[str] = Field(default=None)
    device_info: Optional[str] = Field(default=None)
    ip_address: Optional[str] = Field(default=None)

    user: User = Relationship(back_populates="refresh_tokens")

class Session(SQLModel, table=True):
    __tablename__ = "device_sessions"

    id: str = Field(default_factory=lambda: f"SES-{uuid.uuid4().hex[:12].upper()}", primary_key=True, index=True)
    user_id: str = Field(foreign_key="users.id", index=True)
    token_jti: str = Field(nullable=False, index=True)
    ip_address: Optional[str] = Field(default=None)
    user_agent: Optional[str] = Field(default=None)
    device_type: Optional[str] = Field(default="browser")
    is_active: bool = Field(default=True, index=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    last_activity_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    user: User = Relationship(back_populates="sessions")

class LoginHistory(SQLModel, table=True):
    __tablename__ = "login_history"

    id: str = Field(default_factory=lambda: f"LOG-{uuid.uuid4().hex[:12].upper()}", primary_key=True)
    user_id: Optional[str] = Field(default=None, foreign_key="users.id", index=True)
    email: str = Field(index=True)
    status: str = Field(default="success") # success, failed_password, user_not_found, locked
    ip_address: Optional[str] = Field(default=None)
    user_agent: Optional[str] = Field(default=None)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    user: Optional[User] = Relationship(back_populates="login_history")
