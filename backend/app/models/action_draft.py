import uuid
from datetime import datetime, timezone
from typing import Optional
from sqlmodel import SQLModel, Field
from pydantic import field_validator, model_validator

ALLOWED_DRAFT_TYPES = {"complaint", "rti", "community_summary"}
ALLOWED_DRAFT_STATUSES = {"pending_review", "approved", "rejected"}
RTI_DISCLAIMER = "AI-generated draft. Review before submission."

class ActionDraft(SQLModel, table=True):
    __tablename__ = "action_drafts"

    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    cluster_id: str = Field(foreign_key="clusters.id")
    draft_type: str
    content: str
    status: str = Field(default="pending_review")
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"))
    reviewed_at: Optional[str] = Field(default=None, nullable=True)

    @field_validator("draft_type")
    @classmethod
    def validate_draft_type(cls, v: str) -> str:
        if v not in ALLOWED_DRAFT_TYPES:
            raise ValueError(f"draft_type must be one of {ALLOWED_DRAFT_TYPES}")
        return v

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: str) -> str:
        if v not in ALLOWED_DRAFT_STATUSES:
            raise ValueError(f"status must be one of {ALLOWED_DRAFT_STATUSES}")
        return v

    @model_validator(mode="after")
    def validate_rti_disclaimer(self) -> "ActionDraft":
        if self.draft_type == "rti":
            if not self.content.startswith(RTI_DISCLAIMER):
                raise ValueError(f"RTI draft content must start with: '{RTI_DISCLAIMER}'")
        return self
