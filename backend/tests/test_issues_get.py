import pytest
import os
import shutil
from fastapi.testclient import TestClient
from sqlmodel import SQLModel, create_engine, Session, select
from app.db import get_session
from app.main import app
from app.models.issue import Issue
from app.models.cluster import Cluster
from app.models.impact_summary import ImpactSummary
from app.models.action_draft import ActionDraft

test_sqlite_file = "test_issues_get_civicpulse.db"
test_engine = create_engine(f"sqlite:///{test_sqlite_file}", connect_args={"check_same_thread": False})

def override_get_session():
    with Session(test_engine) as session:
        yield session

@pytest.fixture(autouse=True)
def setup_db():
    app.dependency_overrides[get_session] = override_get_session
    SQLModel.metadata.create_all(test_engine)
    
    yield
    
    SQLModel.metadata.drop_all(test_engine)
    app.dependency_overrides.pop(get_session, None)
    
    if os.path.exists(test_sqlite_file):
        try:
            os.remove(test_sqlite_file)
        except Exception:
            pass

def test_get_issue_detail_includes_extended_fields():
    # Insert mock records into the test database
    with Session(test_engine) as session:
        cluster = Cluster(
            area_label="Test Proximity Intersection",
            center_lat=19.0760,
            center_lng=72.8777,
            report_count=3
        )
        session.add(cluster)
        session.commit()
        session.refresh(cluster)

        issue = Issue(
            photo_url="/static/uploads/test_photo.jpg",
            latitude=19.0760,
            longitude=72.8777,
            issue_type="road_damage",
            severity=4,
            description="Large road pothole",
            credibility_score=0.92,
            cluster_id=cluster.id,
            status="drafted"
        )
        session.add(issue)
        session.commit()
        session.refresh(issue)

        impact = ImpactSummary(
            cluster_id=cluster.id,
            affected_area_description="Main street and surrounding corridors",
            potential_consequences="High probability of tire blowouts and lane-weaving collisions",
            risk_level="high",
            evidence_count=3,
            generated_at="2026-06-25T10:00:00Z"
        )
        session.add(impact)

        draft = ActionDraft(
            cluster_id=cluster.id,
            draft_type="complaint",
            content="To the municipal commissioner, I wish to register a formal complaint regarding...",
            status="approved"
        )
        session.add(draft)
        session.commit()
        session.refresh(draft)

        from app.models.escalation import Escalation
        escalation = Escalation(
            draft_id=draft.id,
            method="email",
            recipient="ward.office@example.gov",
            status="sent",
            provider_response="250 OK Message accepted",
            sent_at="2026-06-25T11:00:00Z"
        )
        session.add(escalation)
        session.commit()
        
        issue_id = issue.id
        expected_consequences = impact.potential_consequences
        expected_draft_content = draft.content

    # Request API details
    client = TestClient(app)
    response = client.get(f"/api/issues/{issue_id}")
    assert response.status_code == 200
    
    data = response.json()
    
    # 1. Verify general details
    assert data["issue"]["id"] == issue_id
    assert data["cluster"]["area_label"] == "Test Proximity Intersection"
    
    # 2. Verify extended ImpactSummarySummary fields
    assert data["impact_summary"] is not None
    assert data["impact_summary"]["risk_level"] == "high"
    assert data["impact_summary"]["potential_consequences"] == expected_consequences
    
    # 3. Verify extended ActionDraftSummary fields
    assert len(data["action_drafts"]) == 1
    assert data["action_drafts"][0]["draft_type"] == "complaint"
    assert data["action_drafts"][0]["status"] == "approved"
    assert data["action_drafts"][0]["content"] == expected_draft_content
    
    # 4. Verify nested escalation fields
    assert data["action_drafts"][0]["escalation"] is not None
    assert data["action_drafts"][0]["escalation"]["method"] == "email"
    assert data["action_drafts"][0]["escalation"]["recipient"] == "ward.office@example.gov"
    assert data["action_drafts"][0]["escalation"]["status"] == "sent"
    assert data["action_drafts"][0]["escalation"]["provider_response"] == "250 OK Message accepted"

