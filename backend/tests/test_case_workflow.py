"""
Unit & Integration Tests for Government Workflow, Case Lifecycle, Repair Verification & SLA Engine.
"""
import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, SQLModel, create_engine
from sqlmodel.pool import StaticPool

from app.main import app
from app.db import get_session
from app.models.issue import Issue
from app.models.user import User
from app.core.permissions import ROLE_OFFICER, ROLE_ADMIN, ROLE_CITIZEN
from app.core.workflow_engine import (
    validate_transition,
    calculate_case_sla,
    STATE_ASSIGNED,
    STATE_ACKNOWLEDGED,
    STATE_WORK_IN_PROGRESS,
    STATE_REPAIR_COMPLETED,
    STATE_VERIFIED,
    STATE_RESOLVED,
    STATE_CLOSED
)
from app.utils.security import create_access_token, hash_password

@pytest.fixture(name="session")
def session_fixture():
    engine = create_engine(
        "sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool
    )
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        # Seed test officer and issue
        officer = User(
            id="USR-OFFICER-TEST",
            email="officer_test@mcgm.gov.in",
            hashed_password=hash_password("Pass123!"),
            name="Officer Test",
            role=ROLE_OFFICER,
            department="Roads & Infrastructure",
            is_active=True
        )
        issue = Issue(
            id="iss-workflow-001",
            photo_url="/static/uploads/demo_pothole1.jpg",
            latitude=19.1196,
            longitude=72.8791,
            user_note="Dangerous pothole",
            issue_type="road_damage",
            severity=5, # SLA target 48h
            description="Deep pothole near Andheri Metro pillar",
            credibility_score=0.94,
            status="classified",
            created_at="2026-07-20T10:00:00Z"
        )

        session.add(officer)
        session.add(issue)
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

def test_fsm_transition_validation():
    assert validate_transition("classified", "clustered") is True
    assert validate_transition("classified", "assigned") is False
    assert validate_transition("assigned", "work_in_progress") is True
    assert validate_transition("resolved", "closed") is True
    assert validate_transition("cancelled", "assigned") is False

def test_sla_calculation_metrics():
    sla = calculate_case_sla("2026-07-20T10:00:00Z", severity=5)
    assert sla["severity"] == 5
    assert sla["target_days"] == 2
    assert "sla_deadline" in sla

def test_complete_government_case_lifecycle(client: TestClient):
    token, _, _ = create_access_token("USR-OFFICER-TEST", ROLE_OFFICER, ["issues:read"], "officer_test@mcgm.gov.in")
    headers = {"Authorization": f"Bearer {token}"}

    case_id = "iss-workflow-001"

    # 1. Assign Case
    assign_res = client.post(f"/api/cases/{case_id}/assign", json={
        "department_id": "DEP-ROADS",
        "assigned_officer_id": "USR-OFFICER-TEST",
        "notes": "Assigned to Ward Assistant Engineer"
    }, headers=headers)
    assert assign_res.status_code == 200
    assert assign_res.json()["state"] == STATE_ASSIGNED

    # 2. Acknowledge Case
    ack_res = client.post(f"/api/cases/{case_id}/acknowledge", headers=headers)
    assert ack_res.status_code == 200
    assert ack_res.json()["state"] == STATE_ACKNOWLEDGED

    # 3. Accept Case (Work In Progress)
    accept_res = client.post(f"/api/cases/{case_id}/accept", headers=headers)
    assert accept_res.status_code == 200
    assert accept_res.json()["state"] == STATE_WORK_IN_PROGRESS

    # 4. Repair Complete
    repair_res = client.post(f"/api/cases/{case_id}/repair-complete", json={
        "after_photo_url": "/static/uploads/demo_after1.jpg",
        "officer_notes": "Asphalt patch applied and leveled.",
        "repair_cost": 45000.0,
        "contractor_name": "Mumbai Civic Infra Ltd"
    }, headers=headers)
    assert repair_res.status_code == 200
    assert repair_res.json()["verification_status"] == "pending_community"

    # 5. Community Verification Votes (2 positive votes trigger verified state)
    v1 = client.post(f"/api/cases/{case_id}/verify", json={"vote_passed": True})
    assert v1.status_code == 200

    v2 = client.post(f"/api/cases/{case_id}/verify", json={"vote_passed": True})
    assert v2.status_code == 200
    assert v2.json()["verification_status"] == "verified_passed"

    # 6. Resolve Case
    resolve_res = client.post(f"/api/cases/{case_id}/resolve", json={
        "resolution_summary": "Pothole completely repaired and verified by local residents.",
        "resolution_type": "repaired"
    }, headers=headers)
    assert resolve_res.status_code == 200
    assert resolve_res.json()["state"] == STATE_RESOLVED

    # 7. Audit Timeline Inspection
    timeline_res = client.get(f"/api/cases/{case_id}/timeline")
    assert timeline_res.status_code == 200
    events = timeline_res.json()
    assert len(events) >= 5
    actions = [e["action"] for e in events]
    assert "assign" in actions
    assert "repair_complete" in actions
    assert "resolve" in actions
