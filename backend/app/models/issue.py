import uuid
from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field
from pydantic import field_validator

ALLOWED_ISSUE_TYPES = {"road_damage", "street_lighting", "garbage", "water", "footpath", "dumping"}
ALLOWED_STATUSES = {"classified", "clustered", "pending_review", "drafted", "approved", "escalated"}

class Issue(SQLModel, table=True):
    __tablename__ = "issues"

    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    photo_url: str
    latitude: float
    longitude: float
    user_note: Optional[str] = Field(default=None, nullable=True)
    issue_type: str
    severity: int
    description: str
    credibility_score: float
    cluster_id: Optional[str] = Field(default=None, foreign_key="clusters.id", nullable=True)
    status: str = Field(default="classified")
    created_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat() + "Z")

    @field_validator("issue_type")
    @classmethod
    def validate_issue_type(cls, v: str) -> str:
        if v not in ALLOWED_ISSUE_TYPES:
            raise ValueError(f"issue_type must be one of {ALLOWED_ISSUE_TYPES}")
        return v

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: str) -> str:
        if v not in ALLOWED_STATUSES:
            raise ValueError(f"status must be one of {ALLOWED_STATUSES}")
        return v

    @field_validator("severity")
    @classmethod
    def validate_severity(cls, v: int) -> int:
        if not (1 <= v <= 5):
            raise ValueError("severity must be between 1 and 5")
        return v

    @field_validator("credibility_score")
    @classmethod
    def validate_credibility_score(cls, v: float) -> float:
        if not (0.0 <= v <= 1.0):
            raise ValueError("credibility_score must be between 0.0 and 1.0")
        return v
