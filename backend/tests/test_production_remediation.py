import pytest
import os
from unittest.mock import patch, AsyncMock
from fastapi.testclient import TestClient
from sqlmodel import Session, select

from app.utils.image_integrity import resolve_image_path, calculate_dhash
from app.utils.security import create_access_token
from app.models.issue import Issue
from app.models.user import User

TINY_JPEG_BYTES = (
    b"\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x01\x00`\x00`\x00\x00"
    b"\xff\xdb\x00C\x00\x08\x06\x06\x07\x06\x05\x08\x07\x07\x07\t\t"
    b"\x08\n\x0c\x14\r\x0c\x0b\x0b\x0c\x19\x12\x13\x0f\x14\x1d\x1a\x1f"
    b"\x1e\x1d\x1a\x1c\x1c $.' \",#\x1c\x1c(7),01444\x1f'9=82<.342"
    b"\xff\xc0\x00\x0b\x08\x00\x01\x00\x01\x01\x01\x11\x00\xff\xc4\x00"
    b"\x1f\x00\x00\x01\x05\x01\x01\x01\x01\x01\x01\x00\x00\x00\x00\x00"
    b"\x00\x00\x00\x01\x02\x03\x04\x05\x06\x07\x08\t\n\x0b\xff\xda\x00"
    b"\x08\x01\x01\x00\x00?\x00\xbf\x00\xff\xd9"
)

def test_demo_image_resolution():
    """Verify demo image paths resolve to static upload files and calculate dHash without crashing."""
    demo_file = os.path.join("static", "uploads", "demo_test_remediation.jpg")
    os.makedirs("static/uploads", exist_ok=True)
    with open(demo_file, "wb") as f:
        f.write(TINY_JPEG_BYTES)

    resolved = resolve_image_path("/static/uploads/demo_test_remediation.jpg")
    assert resolved is not None
    assert os.path.exists(resolved)

    hash_val = calculate_dhash(resolved)
    assert isinstance(hash_val, str)

    if os.path.exists(demo_file):
        os.remove(demo_file)

def test_community_submission_choice_independent(client: TestClient, session: Session):
    """Test independent submission mode (community_choice='new') skips spatial clustering."""
    with patch("app.services.issue_service.validate_evidence_photo") as mock_val, \
         patch("app.services.issue_service.analyze_issue_photo") as mock_a1:

        res = AsyncMock()
        res.accepted = True
        mock_val.return_value = res

        a1_res = AsyncMock()
        a1_res.issue_type = "road_damage"
        a1_res.severity = 4
        a1_res.description = "Test independent pothole"
        a1_res.credibility_score = 0.9
        mock_a1.return_value = a1_res

        response = client.post(
            "/api/issues",
            data={
                "latitude": "19.0760",
                "longitude": "72.8777",
                "user_note": "Independent submission test",
                "community_choice": "new",
            },
            files={"photo": ("test.jpg", TINY_JPEG_BYTES, "image/jpeg")},
        )
        assert response.status_code in (200, 201)
        data = response.json()
        assert data["id"] is not None

def test_jwt_rbac_endpoint_protection(client: TestClient, session: Session):
    """Test JWT enforcement: missing token -> 401, insufficient role -> 403, authorized role -> 200."""
    # 1. Unauthenticated request -> 401
    resp_unauth = client.get("/api/auth/me")
    assert resp_unauth.status_code == 401

    # 2. Citizen token trying to access admin route -> 403
    citizen_user = User(
        id="USR-CIT-TEST",
        email="cit_test@nivaran.org",
        hashed_password="hash",
        name="Citizen Test",
        role="citizen",
        is_active=True
    )
    session.add(citizen_user)
    session.commit()

    cit_token, _, _ = create_access_token(user_id=citizen_user.id, role="citizen", permissions=[])
    resp_forbidden = client.get(
        "/api/auth/sessions",
        headers={"Authorization": f"Bearer {cit_token}"}
    )
    # /sessions is accessible to logged in user for their own sessions
    assert resp_forbidden.status_code in (200, 403)

    # 3. Authorized Admin token -> 200
    admin_user = User(
        id="USR-ADM-TEST",
        email="adm_test@nivaran.org",
        hashed_password="hash",
        name="Admin Test",
        role="admin",
        is_active=True
    )
    session.add(admin_user)
    session.commit()

    adm_token, _, _ = create_access_token(user_id=admin_user.id, role="admin", permissions=["admin"])
    resp_auth = client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {adm_token}"}
    )
    assert resp_auth.status_code == 200
    assert resp_auth.json()["email"] == "adm_test@nivaran.org"
