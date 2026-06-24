import uuid
from datetime import datetime
from sqlmodel import SQLModel, Field

class Cluster(SQLModel, table=True):
    __tablename__ = "clusters"

    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    area_label: str
    center_lat: float
    center_lng: float
    report_count: int = Field(default=1)
    first_reported_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat() + "Z")
    last_reported_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat() + "Z")
