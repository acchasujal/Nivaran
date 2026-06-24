import pytest
import os
import io
import json
import shutil
from unittest.mock import patch, MagicMock, AsyncMock
from fastapi.testclient import TestClient
from sqlmodel import SQLModel, create_engine, Session, select
from app.db import get_session
from app.main import app
from app.models.issue import Issue
from app.models import Cluster, ImpactSummary, ActionDraft, Escalation

# Create database for testing (file-based to work across different sessions/connections)
test_sqlite_file = "test_civicpulse.db"
test_engine = create_engine(f"sqlite:///{test_sqlite_file}", connect_args={"check_same_thread": False})

def override_get_session():
    with Session(test_engine) as session:
        yield session

app.dependency_overrides[get_session] = override_get_session

@pytest.fixture(autouse=True)
def setup_db():
    app.dependency_overrides[get_session] = override_get_session
    # Clean and recreate static directories
    if os.path.exists("static/uploads"):
        shutil.rmtree("static/uploads")
    os.makedirs("static/uploads", exist_ok=True)
    
    if os.path.exists("static/downloads"):
        shutil.rmtree("static/downloads")
    os.makedirs("static/downloads", exist_ok=True)

    # Initialize tables
    SQLModel.metadata.create_all(test_engine)
    yield
    SQLModel.metadata.drop_all(test_engine)
    app.dependency_overrides.pop(get_session, None)
    
    # Clean up database file
    if os.path.exists(test_sqlite_file):
        try:
            os.remove(test_sqlite_file)
        except Exception:
            pass

    # Clean up static directories after test
    if os.path.exists("static/uploads"):
        shutil.rmtree("static/uploads")

def test_create_issue_success():
    # D1 Acceptance Criterion: POST /issues with a real pothole photo returns 201 with correct issue_type, severity, description, credibility_score
    mock_response = MagicMock()
    mock_response.text = json.dumps({
        "issue_type": "road_damage",
        "severity": 4,
        "description": "Large potholes on the main road.",
        "credibility_score": 0.95,
        "image_flags": ["clear"]
    })
    
    mock_models = AsyncMock()
    mock_models.generate_content.return_value = mock_response
    
    mock_client_instance = MagicMock()
    mock_client_instance.aio.models = mock_models
    
    with patch("app.services.gemini_client.genai.Client", return_value=mock_client_instance):
        client = TestClient(app)
        
        photo_file = (
            "pothole.png",
            io.BytesIO(b"dummy_pothole_image_bytes"),
            "image/png"
        )
        
        response = client.post(
            "/issues",
            data={
                "latitude": 19.076,
                "longitude": 72.8777,
                "user_note": "Pothole near post office"
            },
            files={"photo": photo_file}
        )
        
        assert response.status_code == 201
        data = response.json()
        
        # Verify response structure and correctness
        assert data["issue_type"] == "road_damage"
        assert data["severity"] == 4
        assert data["description"] == "Large potholes on the main road."
        assert data["credibility_score"] == 0.95
        assert data["status"] == "clustered"
        assert "photo_url" in data
        assert data["photo_url"].startswith("/static/uploads/")
        
        # Verify photo actually saved
        saved_filename = data["photo_url"].split("/")[-1]
        saved_filepath = os.path.join("static/uploads", saved_filename)
        assert os.path.exists(saved_filepath)
        
        # Verify DB insertion
        with Session(test_engine) as session:
            db_issues = session.exec(select(Issue)).all()
            assert len(db_issues) == 1
            assert db_issues[0].id == data["id"]
            assert db_issues[0].issue_type == "road_damage"
            assert db_issues[0].severity == 4
            assert db_issues[0].user_note == "Pothole near post office"

def test_create_issue_retry_on_invalid_severity_then_success():
    # D2 Acceptance Criterion Part 1: Patched output with severity: 99 triggers retry, succeeds on next try
    mock_response_invalid = MagicMock()
    mock_response_invalid.text = json.dumps({
        "issue_type": "road_damage",
        "severity": 99, # Invalid severity outside 1-5
        "description": "Pothole in the road.",
        "credibility_score": 0.85,
        "image_flags": ["clear"]
    })
    
    mock_response_valid = MagicMock()
    mock_response_valid.text = json.dumps({
        "issue_type": "road_damage",
        "severity": 3, # Valid severity
        "description": "Pothole in the road.",
        "credibility_score": 0.85,
        "image_flags": ["clear"]
    })
    
    mock_models = AsyncMock()
    mock_models.generate_content.side_effect = [mock_response_invalid, mock_response_valid]
    
    mock_client_instance = MagicMock()
    mock_client_instance.aio.models = mock_models
    
    with patch("app.services.gemini_client.genai.Client", return_value=mock_client_instance):
        client = TestClient(app)
        
        photo_file = (
            "pothole.png",
            io.BytesIO(b"dummy_pothole_image_bytes"),
            "image/png"
        )
        
        response = client.post(
            "/issues",
            data={
                "latitude": 19.076,
                "longitude": 72.8777,
                "user_note": "A nasty pothole here"
            },
            files={"photo": photo_file}
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["severity"] == 3
        assert mock_models.generate_content.call_count == 2
        
        # Verify db has the record
        with Session(test_engine) as session:
            db_issues = session.exec(select(Issue)).all()
            assert len(db_issues) == 1
            assert db_issues[0].severity == 3

def test_create_issue_retry_on_invalid_severity_then_fail_502():
    # D2 Acceptance Criterion Part 2: Patched output with severity: 99 triggers retry; if retry also invalid -> 502 returned, no data saved
    mock_response_invalid = MagicMock()
    mock_response_invalid.text = json.dumps({
        "issue_type": "road_damage",
        "severity": 99, # Invalid severity outside 1-5
        "description": "Pothole in the road.",
        "credibility_score": 0.85,
        "image_flags": ["clear"]
    })
    
    mock_models = AsyncMock()
    mock_models.generate_content.side_effect = [mock_response_invalid, mock_response_invalid]
    
    mock_client_instance = MagicMock()
    mock_client_instance.aio.models = mock_models
    
    with patch("app.services.gemini_client.genai.Client", return_value=mock_client_instance):
        client = TestClient(app)
        
        photo_file = (
            "pothole.png",
            io.BytesIO(b"dummy_pothole_image_bytes"),
            "image/png"
        )
        
        response = client.post(
            "/issues",
            data={
                "latitude": 19.076,
                "longitude": 72.8777,
                "user_note": "A nasty pothole here"
            },
            files={"photo": photo_file}
        )
        
        assert response.status_code == 502
        assert response.json() == {"detail": {"error": "ai_unavailable", "retryable": True}}
        assert mock_models.generate_content.call_count == 2
        
        # Verify NO data is saved in DB
        with Session(test_engine) as session:
            db_issues = session.exec(select(Issue)).all()
            assert len(db_issues) == 0
            
        # Verify no files are left in the static upload directory
        # Because we clean up files if create_issue raises an exception
        upload_dir = "static/uploads"
        if os.path.exists(upload_dir):
            files = os.listdir(upload_dir)
            assert len(files) == 0

def test_create_issue_gemini_exception_returns_502():
    # D3 Acceptance Criterion: Patched Gemini client raising an exception -> POST /issues returns 502, not 200
    mock_models = AsyncMock()
    mock_models.generate_content.side_effect = Exception("Gemini client error")
    
    mock_client_instance = MagicMock()
    mock_client_instance.aio.models = mock_models
    
    with patch("app.services.gemini_client.genai.Client", return_value=mock_client_instance):
        client = TestClient(app)
        
        photo_file = (
            "pothole.png",
            io.BytesIO(b"dummy_pothole_image_bytes"),
            "image/png"
        )
        
        response = client.post(
            "/issues",
            data={
                "latitude": 19.076,
                "longitude": 72.8777,
                "user_note": "A nasty pothole here"
            },
            files={"photo": photo_file}
        )
        
        assert response.status_code == 502
        assert response.json() == {"detail": {"error": "ai_unavailable", "retryable": True}}
        assert mock_models.generate_content.call_count == 2
        
        # Verify NO data is saved in DB
        with Session(test_engine) as session:
            db_issues = session.exec(select(Issue)).all()
            assert len(db_issues) == 0
            
        # Verify no files are left on disk
        upload_dir = "static/uploads"
        if os.path.exists(upload_dir):
            files = os.listdir(upload_dir)
            assert len(files) == 0
