import pytest
import os
import io
import shutil
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from sqlmodel import SQLModel, create_engine, Session, select
from app.db import get_session
from app.main import app
from app.models.issue import Issue
from app.dependencies import get_evidence_validator
from app.services.evidence_validation import Stage0Result, Stage0Checks

test_sqlite_file = "test_stage0_nivaran.db"
test_engine = create_engine(f"sqlite:///{test_sqlite_file}", connect_args={"check_same_thread": False})

def override_get_session():
    with Session(test_engine) as session:
        yield session

async def override_validate_evidence_photo(photo_bytes: bytes, mime_type: str):
    if os.environ.get("TEST_STAGE0_INVALID") == "1":
        return Stage0Result(
            accepted=False,
            failure="DOCUMENT",
            confidence=0.99,
            detected_object="Document",
            checks=Stage0Checks(file=True, quality=True, scene=False, infrastructure=False, issue=False),
            message="Unsupported submission: Document detected.",
            suggestion="Please upload a real photograph showing a local civic infrastructure issue instead of a document or certificate."
        )
    return Stage0Result(
        accepted=True,
        failure=None,
        confidence=1.0,
        detected_object="Pothole",
        checks=Stage0Checks(file=True, quality=True, scene=True, infrastructure=True, issue=True),
        message="Valid photo",
        suggestion="Valid"
    )

app.dependency_overrides[get_session] = override_get_session
app.dependency_overrides[get_evidence_validator] = lambda: override_validate_evidence_photo

@pytest.fixture(autouse=True)
def setup_db():
    app.dependency_overrides[get_session] = override_get_session
    app.dependency_overrides[get_evidence_validator] = lambda: override_validate_evidence_photo
    if os.path.exists("static/uploads"):
        shutil.rmtree("static/uploads", ignore_errors=True)
    os.makedirs("static/uploads", exist_ok=True)
    
    SQLModel.metadata.create_all(test_engine)
    with patch("app.db.engine", test_engine):
        yield
    SQLModel.metadata.drop_all(test_engine)
    test_engine.dispose()
    app.dependency_overrides.pop(get_session, None)
    app.dependency_overrides.pop(get_evidence_validator, None)
    
    if os.path.exists(test_sqlite_file):
        try:
            os.remove(test_sqlite_file)
        except Exception:
            pass

def test_stage_0_invalid_media_rejected():
    # Set env var to trigger invalid response
    os.environ["TEST_STAGE0_INVALID"] = "1"
    try:
        client = TestClient(app)
        
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
        with Session(test_engine) as session:
            db_issues = session.exec(select(Issue)).all()
            assert len(db_issues) == 0
    finally:
        os.environ.pop("TEST_STAGE0_INVALID", None)

