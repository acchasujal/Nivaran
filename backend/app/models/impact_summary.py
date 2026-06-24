import uuid
from datetime import datetime
from sqlmodel import SQLModel, Field
from pydantic import field_validator

ALLOWED_RISK_LEVELS = {"low", "moderate", "high"}

class ImpactSummary(SQLModel, table=True):
    __tablename__ = "impact_summaries"

    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    cluster_id: str = Field(foreign_key="clusters.id")
    affected_area_description: str
    potential_consequences: str
    risk_level: str
    evidence_count: int
    generated_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat() + "Z")

    @field_validator("risk_level")
    @classmethod
    def validate_risk_level(cls, v: str) -> str:
        if v not in ALLOWED_RISK_LEVELS:
            raise ValueError(f"risk_level must be one of {ALLOWED_RISK_LEVELS}")
        return v
