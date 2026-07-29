import pytest
import os
import io
import json
import shutil
from unittest.mock import patch, MagicMock, AsyncMock
from fastapi.testclient import TestClient
from sqlmodel import Session, select
from app.models.issue import Issue
from app.models import Cluster, ImpactSummary, ActionDraft, Escalation

@pytest.fixture(autouse=True)
def setup_static_dirs():
    if os.path.exists("static/uploads"):
        shutil.rmtree("static/uploads", ignore_errors=True)
    os.makedirs("static/uploads", exist_ok=True)
    
    if os.path.exists("static/downloads"):
        shutil.rmtree("static/downloads", ignore_errors=True)
    os.makedirs("static/downloads", exist_ok=True)

    yield

    if os.path.exists("static/uploads"):
        shutil.rmtree("static/uploads", ignore_errors=True)

def test_create_issue_success(client: TestClient, session: Session):
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
        photo_file = (
            "pothole.png",
            io.BytesIO(b"dummy_pothole_image_bytes"),
            "image/png"
        )
        
        response = client.post(
            "/api/issues",
            data={
                "latitude": 19.076,
                "longitude": 72.8777,
                "user_note": "Pothole near post office"
            },
            files={"photo": photo_file}
        )
        
        assert response.status_code == 201
        data = response.json()
        
        assert data["issue_type"] == "road_damage"
        assert data["severity"] == 4
        assert data["description"] == "Large potholes on the main road."
        assert data["credibility_score"] == 0.95
        assert data["status"] == "clustered"
        assert "photo_url" in data
        assert data["photo_url"].startswith("/static/uploads/")
        
        saved_filename = data["photo_url"].split("/")[-1]
        saved_filepath = os.path.join("static/uploads", saved_filename)
        assert os.path.exists(saved_filepath)
        
        db_issues = session.exec(select(Issue)).all()
        assert len(db_issues) == 1
        assert db_issues[0].id == data["id"]
        assert db_issues[0].issue_type == "road_damage"
        assert db_issues[0].severity == 4
        assert db_issues[0].user_note == "Pothole near post office"

def test_create_issue_retry_on_invalid_severity_then_success(client: TestClient, session: Session):
    mock_response_invalid = MagicMock()
    mock_response_invalid.text = json.dumps({
        "issue_type": "road_damage",
        "severity": 99,
        "description": "Pothole in the road.",
        "credibility_score": 0.85,
        "image_flags": ["clear"]
    })
    
    mock_response_valid = MagicMock()
    mock_response_valid.text = json.dumps({
        "issue_type": "road_damage",
        "severity": 3,
        "description": "Pothole in the road.",
        "credibility_score": 0.85,
        "image_flags": ["clear"]
    })
    
    mock_models = AsyncMock()
    mock_models.generate_content.side_effect = [mock_response_invalid, mock_response_valid]
    
    mock_client_instance = MagicMock()
    mock_client_instance.aio.models = mock_models
    
    with patch("app.services.gemini_client.genai.Client", return_value=mock_client_instance):
        photo_file = (
            "pothole.png",
            io.BytesIO(b"dummy_pothole_image_bytes"),
            "image/png"
        )
        
        response = client.post(
            "/api/issues",
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
        
        db_issues = session.exec(select(Issue)).all()
        assert len(db_issues) == 1
        assert db_issues[0].severity == 3

def test_create_issue_retry_on_invalid_severity_then_fail_502(client: TestClient, session: Session):
    mock_response_invalid = MagicMock()
    mock_response_invalid.text = json.dumps({
        "issue_type": "road_damage",
        "severity": 99,
        "description": "Pothole in the road.",
        "credibility_score": 0.85,
        "image_flags": ["clear"]
    })
    
    mock_models = AsyncMock()
    mock_models.generate_content.side_effect = [mock_response_invalid, mock_response_invalid]
    
    mock_client_instance = MagicMock()
    mock_client_instance.aio.models = mock_models
    
    with patch("app.services.gemini_client.genai.Client", return_value=mock_client_instance):
        photo_file = (
            "pothole.png",
            io.BytesIO(b"dummy_pothole_image_bytes"),
            "image/png"
        )
        
        response = client.post(
            "/api/issues",
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
        
        db_issues = session.exec(select(Issue)).all()
        assert len(db_issues) == 0
            
        upload_dir = "static/uploads"
        if os.path.exists(upload_dir):
            files = os.listdir(upload_dir)
            assert len(files) == 0

def test_create_issue_gemini_exception_returns_502(client: TestClient, session: Session):
    mock_models = AsyncMock()
    mock_models.generate_content.side_effect = Exception("Gemini client error")
    
    mock_client_instance = MagicMock()
    mock_client_instance.aio.models = mock_models
    
    with patch("app.services.gemini_client.genai.Client", return_value=mock_client_instance):
        photo_file = (
            "pothole.png",
            io.BytesIO(b"dummy_pothole_image_bytes"),
            "image/png"
        )
        
        response = client.post(
            "/api/issues",
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
        
        db_issues = session.exec(select(Issue)).all()
        assert len(db_issues) == 0
            
        upload_dir = "static/uploads"
        if os.path.exists(upload_dir):
            files = os.listdir(upload_dir)
            assert len(files) == 0
