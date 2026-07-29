"""
Authentication and Session Management Unit & Integration Tests.
"""
import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session


from app.main import app
from app.db import get_session
from app.utils.security import create_access_token, create_refresh_token, decode_jwt_token, hash_password
from app.models.user import User, RefreshToken, DeviceSession as UserSession

from app.services.auth_service import AuthService
from app.core.permissions import ROLE_ADMIN, ROLE_OFFICER, ROLE_CITIZEN, ROLE_ANONYMOUS

@pytest.fixture(autouse=True)
def seed_auth_user(session: Session):
    test_user = User(
        id="USR-TEST01",
        email="testuser@nivaran.org",
        hashed_password=hash_password("Secret123!"),
        name="Test User",
        role=ROLE_CITIZEN,
        is_active=True,
        is_verified=True
    )
    session.add(test_user)
    session.commit()

def test_jwt_token_generation_and_decoding():
    token, jti, expire = create_access_token(
        user_id="USR-001",
        role=ROLE_CITIZEN,
        permissions=["issues:read"],
        email="citizen@nivaran.org"
    )
    payload = decode_jwt_token(token)
    assert payload is not None
    assert payload["sub"] == "USR-001"
    assert payload["role"] == ROLE_CITIZEN
    assert payload["type"] == "access"
    assert "issues:read" in payload["permissions"]

def test_login_success(client: TestClient):
    res = client.post("/api/auth/login", json={
        "email": "testuser@nivaran.org",
        "password": "Secret123!"
    })
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["user"]["email"] == "testuser@nivaran.org"
    assert data["user"]["role"] == ROLE_CITIZEN

def test_login_invalid_password(client: TestClient):
    res = client.post("/api/auth/login", json={
        "email": "testuser@nivaran.org",
        "password": "WrongPassword!"
    })
    assert res.status_code == 401

def test_token_refresh_rotation(client: TestClient):
    login_res = client.post("/api/auth/login", json={
        "email": "testuser@nivaran.org",
        "password": "Secret123!"
    })
    initial_rt = login_res.json()["refresh_token"]

    refresh_res = client.post("/api/auth/refresh", json={"refresh_token": initial_rt})
    assert refresh_res.status_code == 200
    refreshed_data = refresh_res.json()
    new_rt = refreshed_data["refresh_token"]
    assert new_rt != initial_rt

    # Try reusing initial refresh token -> should be rejected!
    reused_res = client.post("/api/auth/refresh", json={"refresh_token": initial_rt})
    assert reused_res.status_code == 401

def test_logout_and_revocation(client: TestClient):
    login_res = client.post("/api/auth/login", json={
        "email": "testuser@nivaran.org",
        "password": "Secret123!"
    })
    at = login_res.json()["access_token"]
    rt = login_res.json()["refresh_token"]

    logout_res = client.post(
        "/api/auth/logout",
        json={"refresh_token": rt},
        headers={"Authorization": f"Bearer {at}"}
    )
    assert logout_res.status_code == 200

    # Refresh should fail after logout
    refresh_res = client.post("/api/auth/refresh", json={"refresh_token": rt})
    assert refresh_res.status_code == 401

def test_anonymous_session(client: TestClient):
    res = client.post("/api/auth/anonymous")
    assert res.status_code == 200
    data = res.json()
    assert data["user"]["role"] == ROLE_ANONYMOUS
    assert data["user"]["name"] == "Anonymous Citizen"

def test_me_and_sessions_endpoints(client: TestClient):
    login_res = client.post("/api/auth/login", json={
        "email": "testuser@nivaran.org",
        "password": "Secret123!"
    })
    at = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {at}"}

    me_res = client.get("/api/auth/me", headers=headers)
    assert me_res.status_code == 200
    assert me_res.json()["id"] == "USR-TEST01"

    sessions_res = client.get("/api/auth/sessions", headers=headers)
    assert sessions_res.status_code == 200
    sessions_list = sessions_res.json()
    assert len(sessions_list) >= 1
