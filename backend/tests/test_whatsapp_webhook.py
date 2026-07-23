"""
test_whatsapp_webhook.py

Tests for the WhatsApp webhook conversation flow.
Covers: greeting, photo step, location step, note/submit step,
Stage-0 rejection, feature flag disabled behaviour, session management,
MessageSid idempotency, and status callbacks.
"""

import os
import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from fastapi.testclient import TestClient
from sqlmodel import Session, select

from app.main import app
from app.db import engine
from app.models.issue import Issue
from app.core.redis_cache import cache_manager


def _twilio_form(
    from_number: str = "whatsapp:+919876543210",
    body: str = "",
    num_media: int = 0,
    media_url: str = "",
    media_content_type: str = "",
    latitude: str = "",
    longitude: str = "",
    message_sid: str = "",
) -> dict:
    data = {
        "From": from_number,
        "Body": body,
        "NumMedia": str(num_media),
    }
    if message_sid:
        data["MessageSid"] = message_sid
    if num_media > 0:
        data["MediaUrl0"] = media_url
        data["MediaContentType0"] = media_content_type
    if latitude:
        data["Latitude"] = latitude
        data["Longitude"] = longitude
    return data


@pytest.fixture
def client():
    return TestClient(app, raise_server_exceptions=False)


@pytest.fixture(autouse=True)
def enable_whatsapp(monkeypatch):
    """Enable WhatsApp feature flag for all tests in this module."""
    monkeypatch.setattr("app.routers.whatsapp.settings.WHATSAPP_ENABLED", True)
    monkeypatch.setattr("app.routers.whatsapp.settings.TWILIO_AUTH_TOKEN", "")  # skip sig validation


@pytest.fixture(autouse=True)
def reset_sessions():
    """Clear session key space before each test."""
    clean_phone = "+919876543210"
    cache_manager.delete(f"whatsapp:session:{clean_phone}")
    cache_manager.delete("whatsapp:session:+911111111111")
    cache_manager.delete("whatsapp:session:+912222222222")
    yield
    cache_manager.delete(f"whatsapp:session:{clean_phone}")


# 1x1 8-bit RGB JPEG bytes for testing PIL decode
TINY_JPEG_BYTES = (
    b"\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x01\x00`\x00`\x00\x00"
    b"\xff\xdb\x00C\x00\x08\x06\x06\x07\x06\x05\x08\x07\x07\x07\t\t"
    b"\x08\xa0\x0c\x14\x0d\x0c\x0b\x0b\x0c\x19\x12\x13\x0f\x14\x1d\x1a"
    b"\x1f\x1e\x1d\x1a\x1c\x1c $.' \",#\x1c\x1c(7),01444\x1f'9=82<.342"
    b"\xff\xc0\x00\x0b\x08\x00\x01\x00\x01\x01\x01\x11\x00\xff\xc4\x00"
    b"\x1f\x00\x00\x01\x05\x01\x01\x01\x01\x01\x01\x00\x00\x00\x00\x00"
    b"\x00\x00\x00\x01\x02\x03\x04\x05\x06\x07\x08\t\n\x0b\xff\xda\x00"
    b"\x08\x01\x01\x00\x00?\x00\xbf\x00\xff\xd9"
)


def post_webhook(client, message_sid: str = "", **kwargs) -> tuple[int, str]:
    """POST to the webhook and return status code and response body text."""
    import uuid
    sid = message_sid or f"MS{uuid.uuid4().hex[:16]}"
    resp = client.post(
        "/api/whatsapp/webhook",
        data=_twilio_form(message_sid=sid, **kwargs),
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    return resp.status_code, resp.text


def test_whatsapp_disabled_returns_503(monkeypatch):
    monkeypatch.setattr("app.routers.whatsapp.settings.WHATSAPP_ENABLED", False)
    client = TestClient(app, raise_server_exceptions=False)
    resp = client.post(
        "/api/whatsapp/webhook",
        data=_twilio_form(body="Hi"),
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    assert resp.status_code == 503


def test_greeting_sends_welcome_message(client):
    status_code, twiml = post_webhook(client, body="Hi")
    assert status_code == 200
    assert "Namaste! Welcome to Nivaran." in twiml
    assert "photo" in twiml.lower()


def test_hello_also_triggers_welcome(client):
    status_code, twiml = post_webhook(client, body="hello")
    assert status_code == 200
    assert "Namaste! Welcome to Nivaran." in twiml


@patch("app.routers.whatsapp._download_media", new_callable=AsyncMock)
def test_photo_step_advances_session(mock_download, client):
    mock_download.return_value = (TINY_JPEG_BYTES, "image/jpeg")

    post_webhook(client, body="Hi")
    status_code, twiml = post_webhook(
        client,
        num_media=1,
        media_url="https://twilio.com/media/test.jpg",
        media_content_type="image/jpeg",
    )
    assert status_code == 200
    assert "photo received" in twiml.lower()
    assert "location" in twiml.lower()
    mock_download.assert_awaited_once()


@patch("app.routers.whatsapp._download_media", new_callable=AsyncMock)
def test_failed_media_download_does_not_advance_state(mock_download, client):
    mock_download.side_effect = Exception("HTTP 401 Unauthorized")

    post_webhook(client, body="Hi")
    status_code, twiml = post_webhook(
        client,
        num_media=1,
        media_url="https://api.twilio.com/media/bad.jpg",
        media_content_type="image/jpeg",
    )
    assert status_code == 200
    assert "couldn't process" in twiml.lower() or "download" in twiml.lower() or "photo" in twiml.lower()

    from app.routers.whatsapp import _get_or_create_session, STEP_AWAITING_PHOTO
    sess = _get_or_create_session("whatsapp:+919876543210")
    assert sess.step == STEP_AWAITING_PHOTO


@patch("app.routers.whatsapp._download_media", new_callable=AsyncMock)
def test_location_step_advances_session(mock_download, client):
    mock_download.return_value = (TINY_JPEG_BYTES, "image/jpeg")

    post_webhook(client, body="Hi")
    post_webhook(client, num_media=1, media_url="https://twilio.com/media/test.jpg", media_content_type="image/jpeg")

    status_code, twiml = post_webhook(client, latitude="19.0760", longitude="72.8777")
    assert status_code == 200
    assert "location received" in twiml.lower()
    assert "skip" in twiml.lower()


@patch("app.routers.whatsapp._download_media", new_callable=AsyncMock)
@patch("app.routers.whatsapp.create_issue_from_bytes", new_callable=AsyncMock)
def test_full_flow_returns_case_id(mock_create, mock_download, client):
    mock_download.return_value = (TINY_JPEG_BYTES, "image/jpeg")

    fake_issue = MagicMock()
    fake_issue.id = "iss-test-12345"
    fake_issue.issue_type = "road_damage"
    fake_issue.status = "classified"
    fake_issue.credibility_score = 0.88
    mock_create.return_value = fake_issue

    post_webhook(client, body="Hi")
    post_webhook(client, num_media=1, media_url="https://twilio.com/media/test.jpg", media_content_type="image/jpeg")
    post_webhook(client, latitude="19.0760", longitude="72.8777")

    status_code, twiml = post_webhook(client, body="skip")
    assert status_code == 200
    assert "Report submitted successfully" in twiml
    assert "NIV-ISS-TEST" in twiml or "iss-test-12345" in twiml
    assert "Road Damage" in twiml
    mock_create.assert_awaited_once()


@patch("app.routers.whatsapp._download_media", new_callable=AsyncMock)
@patch("app.routers.whatsapp.create_issue_from_bytes", new_callable=AsyncMock)
def test_idempotent_duplicate_messages_skipped(mock_create, mock_download, client):
    mock_download.return_value = (TINY_JPEG_BYTES, "image/jpeg")

    import uuid
    unique_sid = f"MS_IDEMPOTENT_{uuid.uuid4().hex[:12]}"

    # Send first message with explicit MessageSid
    status_code1, twiml1 = post_webhook(client, message_sid=unique_sid, body="Hi")
    assert status_code1 == 200
    assert "Namaste" in twiml1

    # Resend exact same MessageSid
    status_code2, twiml2 = post_webhook(client, message_sid=unique_sid, body="Hi")
    assert status_code2 == 200
    assert twiml2 == "<Response/>"


def test_status_callback_endpoint(client):
    resp = client.post(
        "/api/whatsapp/status",
        data={"MessageSid": "SM123", "MessageStatus": "delivered"},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    assert resp.status_code == 200
    assert "<Response/>" in resp.text
