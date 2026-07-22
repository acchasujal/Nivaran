from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
import uuid
from sqlmodel import SQLModel, Field, JSON, Relationship

class IdempotencyKey(SQLModel, table=True):
    __tablename__ = "idempotency_keys"

    id: str = Field(primary_key=True, index=True) # Header key value
    user_id: Optional[str] = Field(default=None, index=True)
    request_hash: str = Field(index=True)
    request_path: str = Field()
    status_code: int = Field()
    response_body: str = Field() # JSON stringified response
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    expires_at: datetime = Field(nullable=False, index=True)

class UploadSession(SQLModel, table=True):
    __tablename__ = "upload_sessions"

    id: str = Field(default_factory=lambda: f"UPL-{uuid.uuid4().hex[:12].upper()}", primary_key=True, index=True)
    user_id: Optional[str] = Field(default=None, index=True)
    filename: str = Field(nullable=False)
    file_size: int = Field(nullable=False) # Total expected bytes
    mime_type: str = Field(nullable=False)
    expected_sha256: Optional[str] = Field(default=None)
    total_chunks: int = Field(default=1)
    uploaded_chunks: List[int] = Field(default=[], sa_type=JSON) # Array of completed chunk indices
    bytes_uploaded: int = Field(default=0)
    status: str = Field(default="pending", index=True) # pending, uploading, completed, cancelled, expired
    temp_dir: str = Field(nullable=False)
    final_file_path: Optional[str] = Field(default=None)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    expires_at: datetime = Field(nullable=False, index=True)

class MediaAsset(SQLModel, table=True):
    __tablename__ = "media_assets"

    id: str = Field(default_factory=lambda: f"MED-{uuid.uuid4().hex[:12].upper()}", primary_key=True, index=True)
    upload_session_id: str = Field(foreign_key="upload_sessions.id", index=True)
    user_id: Optional[str] = Field(default=None, index=True)
    filename: str = Field(nullable=False)
    file_path: str = Field(nullable=False)
    file_size: int = Field(nullable=False)
    mime_type: str = Field(nullable=False)
    sha256_hash: str = Field(index=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class OfflineSyncJob(SQLModel, table=True):
    __tablename__ = "offline_sync_jobs"

    id: str = Field(default_factory=lambda: f"SYNC-{uuid.uuid4().hex[:12].upper()}", primary_key=True, index=True)
    user_id: Optional[str] = Field(default=None, index=True)
    client_draft_id: str = Field(index=True)
    payload: Dict[str, Any] = Field(default={}, sa_type=JSON)
    status: str = Field(default="pending", index=True) # pending, processing, completed, conflict, failed
    conflict_id: Optional[str] = Field(default=None)
    retry_count: int = Field(default=0)
    error_message: Optional[str] = Field(default=None)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class SyncConflict(SQLModel, table=True):
    __tablename__ = "sync_conflicts"

    id: str = Field(default_factory=lambda: f"CNF-{uuid.uuid4().hex[:12].upper()}", primary_key=True, index=True)
    sync_job_id: str = Field(foreign_key="offline_sync_jobs.id", index=True)
    server_issue_id: str = Field(index=True)
    conflict_type: str = Field(default="duplicate_location_photo") # duplicate_location_photo, status_mismatch
    client_data: Dict[str, Any] = Field(default={}, sa_type=JSON)
    server_data: Dict[str, Any] = Field(default={}, sa_type=JSON)
    resolution_status: str = Field(default="pending", index=True) # pending, merged, rejected, overwritten
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
