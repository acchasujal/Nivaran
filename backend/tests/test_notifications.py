"""
Unit & Integration Tests for Notification Center, Preferences & Announcements.
"""
import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, SQLModel, create_engine
from sqlmodel.pool import StaticPool

from app.main import app
from app.db import get_session
from app.models.user import User
from app.core.permissions import ROLE_CITIZEN, ROLE_ADMIN, ROLE_OFFICER
from app.core.event_engine import dispatch_notification_event
from app.utils.security import create_access_token, hash_password

@pytest.fixture(name="session")
def session_fixture():
    engine = create_engine(
        "sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool
    )
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        user = User(
            id="USR-NOTIF-TEST",
            email="notifuser@civicpulse.org",
            hashed_password=hash_password("Pass123!"),
            name="Notif User",
            role=ROLE_CITIZEN,
            is_active=True
        )
        session.add(user)
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

def test_notification_creation_and_unread_count(client: TestClient, session: Session):
    token, _, _ = create_access_token("USR-NOTIF-TEST", ROLE_CITIZEN, ["issues:read"], "notifuser@civicpulse.org")
    headers = {"Authorization": f"Bearer {token}"}

    # Dispatch events
    dispatch_notification_event(session, "USR-NOTIF-TEST", "Repair Dispatched", "Repair crew assigned", category="government", case_id="iss-1")
    dispatch_notification_event(session, "USR-NOTIF-TEST", "Cluster Formed", "Grouped into cluster #CL-10", category="community", case_id="iss-1")

    # Get unread count
    count_res = client.get("/api/notifications/unread-count", headers=headers)
    assert count_res.status_code == 200
    assert count_res.json()["unread_count"] == 2

    # Get list
    list_res = client.get("/api/notifications", headers=headers)
    assert list_res.status_code == 200
    items = list_res.json()
    assert len(items) == 2
    assert items[0]["read"] is False

    # Mark first read
    notif_id = items[0]["id"]
    read_res = client.patch(f"/api/notifications/{notif_id}/read", headers=headers)
    assert read_res.status_code == 200
    assert read_res.json()["read"] is True

    # Mark all read
    all_res = client.patch("/api/notifications/read-all", headers=headers)
    assert all_res.status_code == 200
    assert all_res.json()["updated_count"] == 1

def test_user_notification_preferences(client: TestClient):
    token, _, _ = create_access_token("USR-NOTIF-TEST", ROLE_CITIZEN, ["issues:read"], "notifuser@civicpulse.org")
    headers = {"Authorization": f"Bearer {token}"}

    get_pref = client.get("/api/preferences/notifications", headers=headers)
    assert get_pref.status_code == 200
    assert get_pref.json()["email_enabled"] is True

    update_pref = client.put("/api/preferences/notifications", json={
        "whatsapp_enabled": False,
        "language": "hi"
    }, headers=headers)
    assert update_pref.status_code == 200
    assert update_pref.json()["whatsapp_enabled"] is False
    assert update_pref.json()["language"] == "hi"

def test_system_announcements(client: TestClient, session: Session):
    admin_user = User(
        id="USR-ADMIN-NOTIF",
        email="admin@civicpulse.org",
        name="Admin User",
        role=ROLE_ADMIN,
        is_active=True
    )
    session.add(admin_user)
    session.commit()

    admin_token, _, _ = create_access_token("USR-ADMIN-NOTIF", ROLE_ADMIN, ["users:manage"], "admin@civicpulse.org")
    headers = {"Authorization": f"Bearer {admin_token}"}


    create_res = client.post("/api/announcements", json={
        "title": "Scheduled Maintenance",
        "content": "System will be undergo maintenance on Sunday.",
        "target_role": "all"
    }, headers=headers)
    assert create_res.status_code == 201

    list_res = client.get("/api/announcements")
    assert list_res.status_code == 200
    announcements = list_res.json()
    assert len(announcements) >= 1
    assert announcements[0]["title"] == "Scheduled Maintenance"
