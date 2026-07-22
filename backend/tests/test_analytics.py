"""
Unit & Integration Tests for Analytics, Cursor Pagination, Audit Search & Observability.
"""
import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, SQLModel, create_engine
from sqlmodel.pool import StaticPool

from app.main import app
from app.db import get_session
from app.utils.pagination import encode_cursor, decode_cursor
from app.models.issue import Issue
from app.models.case import CaseTransition

@pytest.fixture(name="session")
def session_fixture():
    engine = create_engine(
        "sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool
    )
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        issue = Issue(
            id="iss-analytics-1",
            photo_url="/static/uploads/demo_pothole1.jpg",
            latitude=19.1196,
            longitude=72.8791,
            user_note="Test analytics issue",
            issue_type="road_damage",
            severity=4,
            description="Deep pothole",
            credibility_score=0.9,
            status="resolved",
            created_at="2026-07-20T10:00:00Z"
        )
        transition = CaseTransition(
            issue_id="iss-analytics-1",
            actor_role="officer",
            previous_state="work_in_progress",
            new_state="resolved",
            action="resolve",
            reason="Pothole repaired"
        )
        session.add(issue)
        session.add(transition)
        session.commit()
        yield session

@pytest.fixture(name="client")
def client_fixture(session: Session):
    def get_session_override():
        return session

    app.dependency_overrides[get_session] = get_session_override
    client = TestClient(app)
    yield client
    app.dependency_overrides.clear()

def test_cursor_token_encoding_and_decoding():
    ts = "2026-07-22T12:00:00Z"
    item_id = "iss-12345"
    token = encode_cursor(ts, item_id)
    assert token is not None

    decoded = decode_cursor(token)
    assert decoded is not None
    assert decoded[0] == ts
    assert decoded[1] == item_id

def test_platform_and_government_analytics_endpoints(client: TestClient):
    res_platform = client.get("/api/analytics/platform")
    assert res_platform.status_code == 200
    p_data = res_platform.json()
    assert "total_issues_logged" in p_data
    assert "resolution_rate_percent" in p_data

    res_gov = client.get("/api/analytics/government")
    assert res_gov.status_code == 200
    g_data = res_gov.json()
    assert "active_officers_count" in g_data

def test_global_audit_search_and_export(client: TestClient):
    search_res = client.get("/api/audit/search?q=repaired")
    assert search_res.status_code == 200
    search_items = search_res.json()
    assert len(search_items) >= 1

    csv_export = client.get("/api/audit/export?format=csv")
    assert csv_export.status_code == 200
    assert "text/csv" in csv_export.headers["content-type"]
    assert "audit_id" in csv_export.text

    json_export = client.get("/api/audit/export?format=json")
    assert json_export.status_code == 200
    assert "application/json" in json_export.headers["content-type"]

def test_observability_and_health_endpoints(client: TestClient):
    health_res = client.get("/health")
    assert health_res.status_code == 200
    assert health_res.json()["status"] == "ok"

    ready_res = client.get("/ready")
    assert ready_res.status_code == 200

    live_res = client.get("/live")
    assert live_res.status_code == 200

    metrics_res = client.get("/metrics")
    assert metrics_res.status_code == 200
    assert "total_requests" in metrics_res.json()
