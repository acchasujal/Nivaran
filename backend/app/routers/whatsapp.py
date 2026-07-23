"""
whatsapp.py — WhatsApp Reporting Channel (Twilio Sandbox Adapter)

Architecture:
  Twilio sends a POST to /api/whatsapp/webhook on every incoming message.
  This router handles:
    - Twilio signature validation (supporting HTTPS reverse proxies like Render)
    - Redis-backed / in-memory fallback session state machine
    - Twilio MessageSid idempotency to prevent duplicate reports
    - Full conversational flow: Greeting -> Photo -> Location -> Description -> Confirmation
    - TwiML XML responses with robust top-level error handling
"""

from __future__ import annotations

import base64
import json
import logging
import time
from dataclasses import dataclass, field
from typing import Optional

import httpx
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request, Response, status
from sqlmodel import Session
from twilio.request_validator import RequestValidator
from twilio.twiml.messaging_response import MessagingResponse

from app.config import settings
from app.core.redis_cache import cache_manager
from app.db import get_session
from app.services.issue_service import IssueValidationError, create_issue_from_bytes

logger = logging.getLogger("nivaran")

router = APIRouter(prefix="/whatsapp", tags=["whatsapp"])

# Session TTL — 30 minutes
SESSION_TTL_SECONDS = 1800

# Step constants
STEP_IDLE = 0
STEP_AWAITING_PHOTO = 1
STEP_AWAITING_LOCATION = 2
STEP_AWAITING_NOTE = 3


@dataclass
class WhatsAppSession:
    step: int = STEP_IDLE
    photo_bytes: Optional[bytes] = None
    mime_type: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    last_active: float = field(default_factory=time.time)

    def touch(self) -> None:
        self.last_active = time.time()

    def is_expired(self) -> bool:
        return (time.time() - self.last_active) > SESSION_TTL_SECONDS

    def to_dict(self) -> dict:
        return {
            "step": self.step,
            "photo_bytes": base64.b64encode(self.photo_bytes).decode("ascii") if self.photo_bytes else None,
            "mime_type": self.mime_type,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "last_active": self.last_active,
        }

    @classmethod
    def from_dict(cls, d: dict) -> WhatsAppSession:
        photo_b64 = d.get("photo_bytes")
        photo_bytes = base64.b64decode(photo_b64.encode("ascii")) if photo_b64 else None
        return cls(
            step=d.get("step", STEP_IDLE),
            photo_bytes=photo_bytes,
            mime_type=d.get("mime_type"),
            latitude=d.get("latitude"),
            longitude=d.get("longitude"),
            last_active=d.get("last_active", time.time()),
        )


def _session_key(phone: str) -> str:
    clean_phone = phone.replace(" ", "").replace("-", "")
    return f"whatsapp:session:{clean_phone}"


def _get_or_create_session(phone: str) -> WhatsAppSession:
    key = _session_key(phone)
    raw = cache_manager.get(key)
    if raw:
        try:
            data = json.loads(raw)
            sess = WhatsAppSession.from_dict(data)
            if not sess.is_expired():
                sess.touch()
                return sess
        except Exception as err:
            logger.warning(f"whatsapp_session_parse_error | phone={phone} | error={err}")

    sess = WhatsAppSession()
    _save_session(phone, sess)
    return sess


def _save_session(phone: str, session: WhatsAppSession) -> None:
    session.touch()
    key = _session_key(phone)
    cache_manager.set(key, json.dumps(session.to_dict()), ttl_seconds=SESSION_TTL_SECONDS)


def _reset_session(phone: str) -> None:
    key = _session_key(phone)
    cache_manager.delete(key)


# ---------------------------------------------------------------------------
# Twilio adapter helpers
# ---------------------------------------------------------------------------

async def _download_media(media_url: str) -> tuple[bytes, str]:
    """Download photo from Twilio CDN using basic auth."""
    auth = None
    if settings.TWILIO_ACCOUNT_SID and settings.TWILIO_AUTH_TOKEN:
        auth = (settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)

    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.get(media_url, auth=auth)
        resp.raise_for_status()
        mime_type = resp.headers.get("content-type", "image/jpeg").split(";")[0].strip()
        return resp.content, mime_type


def _twiml_reply(body: str) -> Response:
    """Build a Twilio MessagingResponse XML response."""
    mr = MessagingResponse()
    mr.message(body)
    return Response(content=str(mr), media_type="application/xml")


def _validate_twilio_signature(request: Request, form_dict: dict) -> bool:
    """Validate Twilio request signature, accounting for reverse-proxy HTTPS headers."""
    if not settings.TWILIO_AUTH_TOKEN:
        return True  # Testing mode — no auth token configured

    validator = RequestValidator(settings.TWILIO_AUTH_TOKEN)
    signature = request.headers.get("X-Twilio-Signature", "")

    url = str(request.url)
    x_forwarded_proto = request.headers.get("x-forwarded-proto", "")
    if x_forwarded_proto == "https" and url.startswith("http://"):
        url = "https://" + url[7:]

    try:
        return validator.validate(url, form_dict, signature)
    except Exception as exc:
        logger.warning(f"twilio_signature_validation_exception | error={exc}")
        return False


def _humanize_issue_type(issue_type: str) -> str:
    mapping = {
        "road_damage": "Road Damage",
        "street_lighting": "Street Lighting",
        "garbage": "Garbage Overflow",
        "water": "Water Leakage",
        "footpath": "Broken Footpath",
        "dumping": "Illegal Dumping",
    }
    return mapping.get(issue_type, issue_type.replace("_", " ").title())


# ---------------------------------------------------------------------------
# Message composers
# ---------------------------------------------------------------------------

def _msg_welcome() -> str:
    return (
        "Namaste! Welcome to Nivaran.\n\n"
        "I can help you report a civic issue.\n\n"
        "Please send a clear photo of the problem."
    )


def _msg_photo_received() -> str:
    return (
        "Photo received.\n"
        "Now share the location of the issue using WhatsApp's location feature.\n\n"
        "_Tap 📎 attachment → Location → Share Location_"
    )


def _msg_location_received() -> str:
    return (
        "Location received.\n"
        "Briefly describe the problem, or reply SKIP."
    )


def _msg_success(issue_id: str, issue_type: str, status_str: str, base_url: str) -> str:
    case_code = f"NIV-{issue_id[:8].upper()}" if "-" in issue_id or len(issue_id) > 10 else issue_id
    tracking_url = f"{base_url.rstrip('/')}/tracker?selected={issue_id}"
    return (
        f"Report submitted successfully.\n\n"
        f"Case ID: {case_code}\n"
        f"Issue: {_humanize_issue_type(issue_type)}\n"
        f"Status: {status_str.title()}\n\n"
        f"Track:\n"
        f"{tracking_url}\n\n"
        f"Thank you for helping improve your neighbourhood."
    )


def _msg_stage0_rejection(message: str, suggestion: str) -> str:
    return (
        f"❌ Photo not accepted\n\n"
        f"{message}\n\n"
        f"💡 Suggestion: {suggestion}\n\n"
        f"Please send a new photo to try again."
    )


def _msg_error_fallback() -> str:
    return (
        "Something went wrong while processing your report. "
        "Your information has been saved where possible. Please try again by typing *Hi*."
    )


# ---------------------------------------------------------------------------
# Webhook endpoint
# ---------------------------------------------------------------------------

@router.post("/webhook")
async def whatsapp_webhook(
    request: Request,
    background_tasks: BackgroundTasks,
    session: Session = Depends(get_session),
):
    """
    Twilio WhatsApp webhook. Called for every incoming message.
    Returns TwiML XML (always HTTP 200 to Twilio).
    """
    if not settings.WHATSAPP_ENABLED:
        return Response(
            content="WhatsApp channel is not enabled on this deployment.",
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        )

    try:
        form_raw = await request.form()
        form_dict = {k: str(v) for k, v in form_raw.items()}

        # Verify Twilio signature
        if not _validate_twilio_signature(request, form_dict):
            logger.warning("whatsapp_invalid_signature | possible spoofed request")
            raise HTTPException(status_code=403, detail="Invalid Twilio signature")

        message_sid: str = form_dict.get("MessageSid", "")
        from_number: str = form_dict.get("From", "")
        body_text: str = form_dict.get("Body", "").strip()
        num_media: int = int(form_dict.get("NumMedia", "0"))
        media_url: Optional[str] = form_dict.get("MediaUrl0") if num_media > 0 else None
        media_type: Optional[str] = form_dict.get("MediaContentType0") if num_media > 0 else None
        latitude_str: Optional[str] = form_dict.get("Latitude")
        longitude_str: Optional[str] = form_dict.get("Longitude")

        # Idempotency check via Twilio MessageSid
        if message_sid:
            msg_key = f"whatsapp:msg:{message_sid}"
            if cache_manager.get(msg_key):
                logger.info(f"whatsapp_duplicate_message_skipped | sid={message_sid}")
                return Response(content="<Response/>", media_type="application/xml")
            cache_manager.set(msg_key, "1", ttl_seconds=86400)

        has_image = bool(media_url and media_type and media_type.startswith("image/"))
        has_location = bool(latitude_str and longitude_str)

        logger.info(
            f"whatsapp_message | sid={message_sid} | from={from_number} | "
            f"body={body_text[:40]!r} | has_image={has_image} | has_location={has_location}"
        )

        wa_session = _get_or_create_session(from_number)

        # Triggers for starting/resetting session
        greeting_triggers = {"hi", "hello", "start", "help", "report", "complaint", "issue"}
        is_greeting = body_text.lower() in greeting_triggers

        if is_greeting and not has_image and not has_location:
            _reset_session(from_number)
            wa_session = _get_or_create_session(from_number)
            wa_session.step = STEP_AWAITING_PHOTO
            _save_session(from_number, wa_session)
            return _twiml_reply(_msg_welcome())

        # Standard new session fallback if session is idle
        if wa_session.step == STEP_IDLE:
            _reset_session(from_number)
            wa_session = _get_or_create_session(from_number)
            wa_session.step = STEP_AWAITING_PHOTO
            _save_session(from_number, wa_session)
            return _twiml_reply(_msg_welcome())

        # ------------------------------------------------------------------
        # Step 1: Awaiting photo
        # ------------------------------------------------------------------
        if wa_session.step == STEP_AWAITING_PHOTO:
            if not has_image:
                return _twiml_reply("📷 Please send a *photo* of the civic issue to continue.")

            try:
                photo_bytes, resolved_mime = await _download_media(media_url)
                if resolved_mime == "image/jpg":
                    resolved_mime = "image/jpeg"
                if resolved_mime not in ("image/jpeg", "image/png"):
                    resolved_mime = media_type or "image/jpeg"

                from PIL import Image
                import io
                with Image.open(io.BytesIO(photo_bytes)) as test_img:
                    test_img.verify()
            except Exception as exc:
                logger.error(f"whatsapp_media_download_failed | error={str(exc)}")
                return _twiml_reply(
                    "⚠️ We couldn't download or decode your photo. Please send a clear JPEG or PNG photo."
                )

            wa_session.photo_bytes = photo_bytes
            wa_session.mime_type = resolved_mime
            wa_session.step = STEP_AWAITING_LOCATION
            _save_session(from_number, wa_session)
            return _twiml_reply(_msg_photo_received())

        # ------------------------------------------------------------------
        # Step 2: Awaiting location
        # ------------------------------------------------------------------
        if wa_session.step == STEP_AWAITING_LOCATION:
            if not has_location:
                return _twiml_reply(
                    "📍 Please use WhatsApp → Attach → Location to share the issue location."
                )

            try:
                lat = float(latitude_str)
                lng = float(longitude_str)
                if not (-90.0 <= lat <= 90.0) or not (-180.0 <= lng <= 180.0):
                    raise ValueError("Location out of range")
                wa_session.latitude = lat
                wa_session.longitude = lng
            except (TypeError, ValueError):
                return _twiml_reply("📍 Couldn't read your location coordinates. Please share your location using WhatsApp's Location attachment.")

            wa_session.step = STEP_AWAITING_NOTE
            _save_session(from_number, wa_session)
            return _twiml_reply(_msg_location_received())

        # ------------------------------------------------------------------
        # Step 3: Awaiting optional description -> Submit
        # ------------------------------------------------------------------
        if wa_session.step == STEP_AWAITING_NOTE:
            user_note = None if body_text.lower() == "skip" else body_text or None

            if wa_session.photo_bytes is None or wa_session.latitude is None or wa_session.longitude is None:
                _reset_session(from_number)
                return _twiml_reply("⚠️ Session data was incomplete. Please start again by sending *Hi*.")

            try:
                db_issue = await create_issue_from_bytes(
                    photo_bytes=wa_session.photo_bytes,
                    mime_type=wa_session.mime_type or "image/jpeg",
                    latitude=wa_session.latitude,
                    longitude=wa_session.longitude,
                    user_note=user_note,
                    background_tasks=background_tasks,
                    session=session,
                )
            except IssueValidationError as exc:
                r = exc.stage0_result
                # Reset to photo step for retry
                wa_session.step = STEP_AWAITING_PHOTO
                wa_session.photo_bytes = None
                wa_session.mime_type = None
                _save_session(from_number, wa_session)
                return _twiml_reply(
                    _msg_stage0_rejection(
                        message=r.message,
                        suggestion=r.suggestion,
                    )
                )

            _reset_session(from_number)

            return _twiml_reply(
                _msg_success(
                    issue_id=db_issue.id,
                    issue_type=db_issue.issue_type,
                    status_str=db_issue.status,
                    base_url=settings.APP_BASE_URL or "https://nivaran-um4e.onrender.com",
                )
            )

        # Default fallback
        _reset_session(from_number)
        return _twiml_reply(_msg_welcome())

    except HTTPException as http_exc:
        raise http_exc
    except Exception as exc:
        logger.error(f"whatsapp_webhook_unhandled_error | error={str(exc)}", exc_info=True)
        return _twiml_reply(_msg_error_fallback())


@router.post("/status")
async def whatsapp_status(request: Request):
    """Twilio outbound status callback endpoint."""
    try:
        form = await request.form()
        sid = form.get("MessageSid")
        status_val = form.get("MessageStatus")
        logger.info(f"whatsapp_status_update | sid={sid} | status={status_val}")
    except Exception as err:
        logger.warning(f"whatsapp_status_parse_error | error={err}")
    return Response(content="<Response/>", media_type="application/xml")
