import pytest
import os
import io
import shutil
from unittest.mock import patch
from fastapi.testclient import TestClient
from sqlmodel import Session, select
from app.main import app
from app.models.issue import Issue
from app.dependencies import get_evidence_validator

def test_stage_0_invalid_media_rejected(client: TestClient, session: Session):
    os.environ["TEST_STAGE0_INVALID"] = "1"
    try:
        if os.path.exists("static/uploads"):
            shutil.rmtree("static/uploads", ignore_errors=True)
        os.makedirs("static/uploads", exist_ok=True)

        photo_file = (
            "certificate.png",
            io.BytesIO(b"dummy_certificate_image_bytes"),
            "image/png"
        )
        
        response = client.post(
            "/api/issues",
            data={
                "latitude": 19.076,
                "longitude": 72.8777,
                "user_note": "My certificate"
            },
            files={"photo": photo_file}
        )
        
        assert response.status_code == 400
        data = response.json()
        assert data["detail"]["error"] == "validation_gate_failed"
        assert data["detail"]["accepted"] is False
        assert data["detail"]["failure"] == "DOCUMENT"
        assert "Document" in data["detail"]["detected_object"]
        
        # Verify no files saved
        files = os.listdir("static/uploads")
        assert len(files) == 0
        
        # Verify no issues created in DB
        db_issues = session.exec(select(Issue)).all()
        assert len(db_issues) == 0
    finally:
        os.environ.pop("TEST_STAGE0_INVALID", None)
