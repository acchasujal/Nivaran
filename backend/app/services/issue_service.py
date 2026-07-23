"""
issue_service.py — Shared Issue Creation Pipeline

The single implementation of the issue intake pipeline:
  Stage-0 Validation → Agent 1 Classification → Agent 2 Clustering → DB Write → Threshold Check

Both the web router (issues.py) and the WhatsApp router (whatsapp.py) call
`create_issue_from_bytes()` directly. There is no httpx self-call, no code
duplication, and no separate validation logic per channel.
"""

from __future__ import annotations

import logging
import os
import time
import uuid
import json
from typing import Optional, Callable, Awaitable

from fastapi import BackgroundTasks, HTTPException, status
from sqlmodel import Session, select

from app.config import settings
from app.models.cluster import Cluster
from app.models.issue import Issue
from app.services.agent_1_intake import analyze_issue_photo
from app.services.agent_2_verification import verify_and_cluster_issue
from app.services.agent_3_impact import analyze_cluster_impact
from app.services.agent_4_action_generator import generate_action_drafts
from app.services.evidence_validation import Stage0Result, validate_evidence_photo

logger = logging.getLogger("nivaran")

UPLOAD_DIR = "static/uploads"


# ---------------------------------------------------------------------------
# Custom exception for Stage-0 rejection
# Callers (web router, WhatsApp router) format the response for their channel.
# ---------------------------------------------------------------------------

class IssueValidationError(Exception):
    """Raised when Stage-0 rejects a photo. Carries the full Stage0Result."""

    def __init__(self, stage0_result: Stage0Result) -> None:
        self.stage0_result = stage0_result
        super().__init__(stage0_result.message)


# ---------------------------------------------------------------------------
# Background task (shared by both channels)
# ---------------------------------------------------------------------------

async def _run_agent_3_background(cluster_id: str) -> None:
    """Run Agent 3 → Agent 4 as a background task after threshold is crossed."""
    from app.db import engine  # local import avoids circular dependency

    with Session(engine) as session:
        try:
            logger.info(f"agent_3_background_trigger | cluster_id={cluster_id}")
            await analyze_cluster_impact(cluster_id=cluster_id, session=session)
            logger.info(f"agent_3_background_success | cluster_id={cluster_id}")

            logger.info(f"agent_4_background_trigger | cluster_id={cluster_id}")
            await generate_action_drafts(cluster_id=cluster_id, session=session)
            logger.info(f"agent_4_background_success | cluster_id={cluster_id}")

            # Transition all issues in this cluster to "drafted"
            issues = session.exec(
                select(Issue).where(Issue.cluster_id == cluster_id)
            ).all()
            for issue in issues:
                issue.status = "drafted"
                session.add(issue)
            session.commit()
            logger.info(
                f"agent_4_background_status_transition_complete | cluster_id={cluster_id}"
            )
        except Exception as e:
            logger.error(
                f"agent_3_or_4_background_failed | cluster_id={cluster_id} | error={str(e)}"
            )


# ---------------------------------------------------------------------------
# Main shared service function
# ---------------------------------------------------------------------------

async def create_issue_from_bytes(
    *,
    photo_bytes: bytes,
    mime_type: str,
    latitude: float,
    longitude: float,
    user_note: Optional[str],
    community_choice: Optional[str] = "join",
    background_tasks: BackgroundTasks,
    session: Session,
    validator: Optional[Callable[..., Awaitable[Stage0Result]]] = None,
) -> Issue:
    """
    Full issue creation pipeline shared by all reporting channels.

    Steps:
      1. Validate MIME type and coordinate ranges (cheap, immediate).
      2. Save photo to disk.
      3. Stage-0 Validation Gate (local heuristics + Gemini Vision).
         Raises IssueValidationError on rejection (caller formats the error).
      4. Agent 1 — Issue Classification (Gemini Vision structured output).
      5. DB write (Issue row).
      6. Agent 2 — Spatial Verification & Clustering.
      7. Threshold check — schedule Agent 3+4 as BackgroundTask if met.
      8. Return the created Issue.

    The `validator` parameter allows tests to inject a mock Stage-0 function
    without touching the FastAPI dependency system. Defaults to the real
    `validate_evidence_photo` when not provided.

    Raises:
        HTTPException(422)  — invalid MIME type or coordinate range.
        IssueValidationError — Stage-0 rejected the photo.
        HTTPException(502)  — Gemini call failed (retryable).
    """
    _validator = validator or validate_evidence_photo
    # ------------------------------------------------------------------
    # 1. Cheap validations (no AI cost)
    # ------------------------------------------------------------------
    if mime_type not in ("image/jpeg", "image/png"):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"error": "validation_error", "fields": {"photo": "Must be jpg or png"}},
        )

    if not (-90.0 <= latitude <= 90.0) or not (-180.0 <= longitude <= 180.0):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "error": "validation_error",
                "fields": {"coordinates": "Latitude or longitude out of range"},
            },
        )

    # ------------------------------------------------------------------
    # 2. Save photo to disk
    # ------------------------------------------------------------------
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    ext = ".png" if mime_type == "image/png" else ".jpg"
    unique_filename = f"{uuid.uuid4()}{ext}"
    photo_path = os.path.join(UPLOAD_DIR, unique_filename)

    from PIL import Image
    import io

    try:
        img = Image.open(io.BytesIO(photo_bytes))
        # Discard EXIF metadata by copying pixel data into a new Image object
        clean_img = Image.new(img.mode, img.size)
        clean_img.paste(img)
        clean_img.save(photo_path, format=img.format)
    except Exception as e:
        logger.warning(f"exif_stripping_failed | error={str(e)} | falling back to raw save")
        with open(photo_path, "wb") as f:
            f.write(photo_bytes)

    # ------------------------------------------------------------------
    # 3. Pipeline execution with transaction safety
    # ------------------------------------------------------------------
    try:
        # 3.1 Stage-0 Validation Gate
        stage0_result = await _validator(
            photo_bytes=photo_bytes,
            mime_type=mime_type,
        )
        if not stage0_result.accepted:
            raise IssueValidationError(stage0_result)

        # 3.2 Agent 1 — Classification
        start_time = time.time()
        agent1_result = await analyze_issue_photo(
            photo_bytes=photo_bytes,
            mime_type=mime_type,
            user_note=user_note,
        )

        # Map Agent 1 outputs to DB-allowed types
        mapped_issue_type = agent1_result.issue_type
        if mapped_issue_type == "lighting":
            mapped_issue_type = "street_lighting"
        elif mapped_issue_type in ("waste", "other"):
            mapped_issue_type = "garbage"

        # 3.3 DB write
        db_issue = Issue(
            photo_url=f"/static/uploads/{unique_filename}",
            latitude=latitude,
            longitude=longitude,
            user_note=user_note,
            issue_type=mapped_issue_type,
            severity=agent1_result.severity,
            description=agent1_result.description,
            credibility_score=agent1_result.credibility_score,
            status="classified",
        )
        session.add(db_issue)
        session.commit()
        session.refresh(db_issue)

        latency_ms = int((time.time() - start_time) * 1000)
        logger.info(
            json.dumps({"agent": "Agent1", "issue_id": db_issue.id, "latency_ms": latency_ms, "success": True})
        )

        # 3.4 Agent 2 — Verification & Clustering
        if community_choice == "new":
            logger.info(f"community_choice=new | skipping spatial clustering for issue {db_issue.id}")
        else:
            await verify_and_cluster_issue(db_issue, session)

    except IssueValidationError as exc:
        session.rollback()
        _cleanup(photo_path)
        raise exc
    except HTTPException as exc:
        session.rollback()
        _cleanup(photo_path)
        raise exc
    except Exception as e:
        session.rollback()
        _cleanup(photo_path)
        logger.error(f"pipeline_execution_failed | error={str(e)}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail={"error": "ai_unavailable", "retryable": True},
        ) from e

    # ------------------------------------------------------------------
    # 7. Threshold check → schedule Agents 3+4 if cluster threshold crossed
    # ------------------------------------------------------------------
    if db_issue.cluster_id:
        cluster = session.get(Cluster, db_issue.cluster_id)
        if cluster and cluster.report_count >= settings.threshold:
            background_tasks.add_task(_run_agent_3_background, cluster.id)

    return db_issue


# ---------------------------------------------------------------------------
# Internal helper
# ---------------------------------------------------------------------------

def _cleanup(path: str) -> None:
    """Remove a partially-saved photo on pipeline failure."""
    try:
        if os.path.exists(path):
            os.remove(path)
    except Exception as exc:
        logger.warning(f"photo_cleanup_failed | path={path} | error={str(exc)}")
