"""
Idempotency utility module to prevent duplicate request processing and enable safe retries.
"""
import hashlib
import json
from typing import Optional, Dict, Any, Tuple
from datetime import datetime, timedelta, timezone
from sqlmodel import Session, select
from fastapi import Request, Response
from fastapi.responses import JSONResponse

from app.models.sync import IdempotencyKey

def compute_request_hash(path: str, body_bytes: bytes) -> str:
    """Compute SHA-256 hash of endpoint path + body payload."""
    hasher = hashlib.sha256()
    hasher.update(path.encode("utf-8"))
    hasher.update(body_bytes)
    return hasher.hexdigest()

def check_idempotency(
    db: Session,
    key_str: str,
    path: str,
    body_bytes: bytes,
    user_id: Optional[str] = None
) -> Tuple[Optional[Response], Optional[IdempotencyKey]]:
    """
    Check if an Idempotency-Key has already been processed.
    Returns (cached_response, existing_key_record).
    """
    if not key_str:
        return None, None

    req_hash = compute_request_hash(path, body_bytes)
    record = db.exec(select(IdempotencyKey).where(IdempotencyKey.id == key_str)).first()

    if record:
        now = datetime.now(timezone.utc)
        expires_at = record.expires_at
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)

        if expires_at < now:
            # Key expired -> remove and allow re-execution
            db.delete(record)
            db.commit()
            return None, None

        # Detect request tampering (same key used with different payload/path)
        if record.request_hash != req_hash:
            cached_resp = JSONResponse(
                status_code=422,
                content={
                    "detail": "Idempotency key payload mismatch. The same key cannot be reused with a different request payload."
                }
            )
            return cached_resp, record

        # Return cached response replay
        try:
            content = json.loads(record.response_body)
        except Exception:
            content = {"detail": record.response_body}

        cached_resp = JSONResponse(
            status_code=record.status_code,
            content=content,
            headers={"X-Cache-Replay": "true", "Idempotency-Key": key_str}
        )
        return cached_resp, record

    return None, None

def save_idempotency(
    db: Session,
    key_str: str,
    path: str,
    body_bytes: bytes,
    status_code: int,
    response_content: Any,
    user_id: Optional[str] = None,
    ttl_hours: int = 24
) -> IdempotencyKey:
    """Persist response payload associated with an Idempotency-Key."""
    if not key_str:
        return None

    req_hash = compute_request_hash(path, body_bytes)
    if isinstance(response_content, (dict, list)):
        resp_body_str = json.dumps(response_content)
    else:
        resp_body_str = str(response_content)

    expires_at = datetime.now(timezone.utc) + timedelta(hours=ttl_hours)

    record = IdempotencyKey(
        id=key_str,
        user_id=user_id,
        request_hash=req_hash,
        request_path=path,
        status_code=status_code,
        response_body=resp_body_str,
        expires_at=expires_at
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record
