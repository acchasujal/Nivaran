import uuid
from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field
from pydantic import field_validator, model_validator

ALLOWED_METHODS = {"email", "pdf_export"}
ALLOWED_ESCALATION_STATUSES = {"sent", "failed", "exported"}

class Escalation(SQLModel, table=True):
    __tablename__ = "escalations"

    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    draft_id: str = Field(foreign_key="action_drafts.id")
    method: str
    recipient: Optional[str] = Field(default=None, nullable=True)
    status: str
    provider_response: Optional[str] = Field(default=None, nullable=True)
    sent_at: Optional[str] = Field(default=None, nullable=True)
    created_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat() + "Z")

    @field_validator("method")
    @classmethod
    def validate_method(cls, v: str) -> str:
        if v not in ALLOWED_METHODS:
            raise ValueError(f"method must be one of {ALLOWED_METHODS}")
        return v

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: str) -> str:
        if v not in ALLOWED_ESCALATION_STATUSES:
            raise ValueError(f"status must be one of {ALLOWED_ESCALATION_STATUSES}")
        return v

    @model_validator(mode="after")
    def validate_recipient_if_email(self) -> "Escalation":
        if self.method == "email":
            if not self.recipient or "@" not in self.recipient:
                raise ValueError("recipient is required and must be a valid email when method is email")
        return self
