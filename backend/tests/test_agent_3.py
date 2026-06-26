import pytest
import os
import io
import json
import shutil
from unittest.mock import patch, MagicMock, AsyncMock
from fastapi.testclient import TestClient
from sqlmodel import SQLModel, create_engine, Session, select
from datetime import datetime

from app.db import get_session
from app.main import app
from app.models.issue import Issue
from app.models.cluster import Cluster
from app.models.impact_summary import ImpactSummary
from app.config import settings

test_sqlite_file = "test_agent3_civicpulse.db"
test_engine = create_engine(f"sqlite:///{test_sqlite_file}", connect_args={"check_same_thread": False})

def override_get_session():
    with Session(test_engine) as session:
        yield session

@pytest.fixture(autouse=True)
def setup_db():
    app.dependency_overrides[get_session] = override_get_session
    if os.path.exists("static/uploads"):
        shutil.rmtree("static/uploads", ignore_errors=True)
    os.makedirs("static/uploads", exist_ok=True)
    
    SQLModel.metadata.create_all(test_engine)
    
    # Save original settings to restore later
    orig_threshold = settings.ESCALATION_THRESHOLD
    orig_override = settings.DEMO_THRESHOLD_OVERRIDE
    
    # Patch app.db.engine with test_engine so BackgroundTasks use the test database
    with patch("app.db.engine", test_engine):
        yield
    
    # Restore original settings
    settings.ESCALATION_THRESHOLD = orig_threshold
    settings.DEMO_THRESHOLD_OVERRIDE = orig_override
    
    SQLModel.metadata.drop_all(test_engine)
    app.dependency_overrides.pop(get_session, None)
    
    if os.path.exists(test_sqlite_file):
        try:
            os.remove(test_sqlite_file)
        except Exception:
            pass
    if os.path.exists("static/uploads"):
        shutil.rmtree("static/uploads", ignore_errors=True)

def test_agent_3_threshold_reached():
    # Set threshold to 2
    settings.DEMO_THRESHOLD_OVERRIDE = 2

    # Mock response for Agent 1 (intake)
    mock_response_agent1 = MagicMock()
    mock_response_agent1.text = json.dumps({
        "issue_type": "road_damage",
        "severity": 4,
        "description": "Pothole at Main St",
        "credibility_score": 0.9,
        "image_flags": ["clear"]
    })

    # Mock response for Agent 3 (impact intelligence)
    mock_response_agent3 = MagicMock()
    mock_response_agent3.text = json.dumps({
        "affected_area_description": "Main St intersection area",
        "potential_consequences": "High risk of vehicle damage",
        "risk_level": "moderate",
        "evidence_count": 2
    })

    mock_models = AsyncMock()
    # First submit is Agent 1, second submit is Agent 1, then Agent 3 runs in background
    # Let's mock generate_content to return appropriate values
    mock_models.generate_content.side_effect = [
        mock_response_agent1,  # Submit 1 (Agent 1 call)
        mock_response_agent1,  # Submit 2 (Agent 1 call)
        mock_response_agent3   # Agent 3 call (triggered in background)
    ]

    mock_client_instance = MagicMock()
    mock_client_instance.aio.models = mock_models

    # Mock Agent 2 (clustering) to merge the second issue into the first cluster
    # First submission -> creates cluster
    # Second submission -> merges into same cluster
    first_cluster_id = None

    async def mock_generate_structured_output(*args, **kwargs):
        nonlocal first_cluster_id
        schema = kwargs.get("response_schema")
        from app.services.agent_2_verification import Agent2Output
        from app.services.agent_1_intake import Agent1Output
        from app.services.agent_3_impact import Agent3Output
        
        if schema == Agent1Output:
            return Agent1Output(
                issue_type="road_damage",
                severity=4,
                description="Pothole at Main St",
                credibility_score=0.9,
                image_flags=["clear"]
            )
        elif schema == Agent2Output:
            return Agent2Output(
                is_duplicate_of_cluster=first_cluster_id,
                confidence=0.95,
                create_new_cluster=False
            )
        elif schema == Agent3Output:
            return Agent3Output(
                affected_area_description="Main St intersection area",
                potential_consequences="High risk of vehicle damage",
                risk_level="moderate",
                evidence_count=2
            )
        raise ValueError(f"Unexpected schema {schema}")

    with patch("app.services.gemini_client.genai.Client", return_value=mock_client_instance), \
         patch("app.services.gemini_client.GeminiClient.generate_structured_output", side_effect=mock_generate_structured_output):
        client = TestClient(app)

        # 1. Post first issue (report count = 1, threshold = 2)
        photo_1 = ("pothole1.png", io.BytesIO(b"pothole_bytes_1"), "image/png")
        response1 = client.post(
            "/api/issues",
            data={"latitude": 19.0760, "longitude": 72.8777, "user_note": "Pothole A"},
            files={"photo": photo_1}
        )
        assert response1.status_code == 201
        res1_data = response1.json()
        first_cluster_id = res1_data["cluster_id"]
        assert first_cluster_id is not None

        # Verify no impact summary is written to database yet
        with Session(test_engine) as session:
            summary = session.exec(
                select(ImpactSummary).where(ImpactSummary.cluster_id == first_cluster_id)
            ).first()
            assert summary is None

        # 2. Post second issue within same cluster (report count = 2, threshold = 2 -> met)
        photo_2 = ("pothole2.png", io.BytesIO(b"pothole_bytes_2"), "image/png")
        response2 = client.post(
            "/api/issues",
            data={"latitude": 19.0765, "longitude": 72.8777, "user_note": "Pothole B"},
            files={"photo": photo_2}
        )
        assert response2.status_code == 201

        # Check impact summary was created in background
        with Session(test_engine) as session:
            summary = session.exec(
                select(ImpactSummary).where(ImpactSummary.cluster_id == first_cluster_id)
            ).first()
            assert summary is not None
            assert summary.affected_area_description == "Main St intersection area"
            assert summary.potential_consequences == "High risk of vehicle damage"
            assert summary.risk_level == "moderate"
            assert summary.evidence_count == 2

def test_agent_3_threshold_not_reached():
    # Set threshold to 3
    settings.DEMO_THRESHOLD_OVERRIDE = 3

    mock_response_agent1 = MagicMock()
    mock_response_agent1.text = json.dumps({
        "issue_type": "road_damage",
        "severity": 4,
        "description": "Pothole at Main St",
        "credibility_score": 0.9,
        "image_flags": ["clear"]
    })

    mock_models = AsyncMock()
    mock_models.generate_content.return_value = mock_response_agent1
    mock_client_instance = MagicMock()
    mock_client_instance.aio.models = mock_models

    with patch("app.services.gemini_client.genai.Client", return_value=mock_client_instance):
        client = TestClient(app)

        # Post issue (report count = 1, threshold = 3 -> not met)
        photo = ("pothole.png", io.BytesIO(b"pothole_bytes"), "image/png")
        response = client.post(
            "/api/issues",
            data={"latitude": 19.0760, "longitude": 72.8777, "user_note": "Pothole A"},
            files={"photo": photo}
        )
        assert response.status_code == 201
        res_data = response.json()
        cluster_id = res_data["cluster_id"]

        # Verify no impact summary is written
        with Session(test_engine) as session:
            summary = session.exec(
                select(ImpactSummary).where(ImpactSummary.cluster_id == cluster_id)
            ).first()
            assert summary is None

def test_agent_3_gemini_failure():
    # Set threshold to 1
    settings.DEMO_THRESHOLD_OVERRIDE = 1

    # Mock Agent 1 success
    mock_response_agent1 = MagicMock()
    mock_response_agent1.text = json.dumps({
        "issue_type": "road_damage",
        "severity": 4,
        "description": "Pothole at Main St",
        "credibility_score": 0.9,
        "image_flags": ["clear"]
    })

    mock_models = AsyncMock()
    # First call succeeds (Agent 1), second call fails (Agent 3 in background)
    mock_models.generate_content.side_effect = [
        mock_response_agent1,
        Exception("Gemini API Overloaded")
    ]
    mock_client_instance = MagicMock()
    mock_client_instance.aio.models = mock_models

    with patch("app.services.gemini_client.genai.Client", return_value=mock_client_instance):
        client = TestClient(app)

        photo = ("pothole.png", io.BytesIO(b"pothole_bytes"), "image/png")
        # Issue submission must succeed even if background task fails (Rule 6)
        response = client.post(
            "/api/issues",
            data={"latitude": 19.0760, "longitude": 72.8777, "user_note": "Pothole A"},
            files={"photo": photo}
        )
        assert response.status_code == 201
        res_data = response.json()
        cluster_id = res_data["cluster_id"]

        # Verify no impact summary was created due to failure
        with Session(test_engine) as session:
            summary = session.exec(
                select(ImpactSummary).where(ImpactSummary.cluster_id == cluster_id)
            ).first()
            assert summary is None

def test_agent_3_validation_gate_success():
    # Set threshold to 1
    settings.DEMO_THRESHOLD_OVERRIDE = 1

    # Mock Agent 1 success
    mock_response_agent1 = MagicMock()
    mock_response_agent1.text = json.dumps({
        "issue_type": "road_damage",
        "severity": 4,
        "description": "Pothole at Main St",
        "credibility_score": 0.9,
        "image_flags": ["clear"]
    })

    # Agent 3: First response contains forbidden "Officer Sharma has resolved"
    # Second response is clean
    mock_response_failed = MagicMock()
    mock_response_failed.text = json.dumps({
        "affected_area_description": "Officer Sharma has resolved the issue near the market",
        "potential_consequences": "None since it is resolved",
        "risk_level": "low",
        "evidence_count": 1
    })

    mock_response_success = MagicMock()
    mock_response_success.text = json.dumps({
        "affected_area_description": "Local market area near Main St",
        "potential_consequences": "High risk of pedestrian falls",
        "risk_level": "moderate",
        "evidence_count": 1
    })

    mock_models = AsyncMock()
    # Calls:
    # 1. Agent 1 (intake) -> mock_response_agent1
    # 2. Agent 3 Attempt 1 -> mock_response_failed (triggers ValidationError due to validation logic)
    # 3. Agent 3 Attempt 2 -> mock_response_success (succeeds)
    mock_models.generate_content.side_effect = [
        mock_response_agent1,
        mock_response_failed,
        mock_response_success
    ]
    mock_client_instance = MagicMock()
    mock_client_instance.aio.models = mock_models

    with patch("app.services.gemini_client.genai.Client", return_value=mock_client_instance):
        client = TestClient(app)

        photo = ("pothole.png", io.BytesIO(b"pothole_bytes"), "image/png")
        response = client.post(
            "/api/issues",
            data={"latitude": 19.0760, "longitude": 72.8777, "user_note": "Pothole A"},
            files={"photo": photo}
        )
        assert response.status_code == 201
        res_data = response.json()
        cluster_id = res_data["cluster_id"]

        # The summary should be created with the clean, second-attempt content
        with Session(test_engine) as session:
            summary = session.exec(
                select(ImpactSummary).where(ImpactSummary.cluster_id == cluster_id)
            ).first()
            assert summary is not None
            assert summary.affected_area_description == "Local market area near Main St"
            assert "Officer Sharma" not in summary.affected_area_description
            assert summary.risk_level == "moderate"

def test_agent_3_validation_gate_hard_fail():
    # Set threshold to 1
    settings.DEMO_THRESHOLD_OVERRIDE = 1

    # Mock Agent 1 success
    mock_response_agent1 = MagicMock()
    mock_response_agent1.text = json.dumps({
        "issue_type": "road_damage",
        "severity": 4,
        "description": "Pothole at Main St",
        "credibility_score": 0.9,
        "image_flags": ["clear"]
    })

    # Both attempts contain the forbidden string
    mock_response_failed = MagicMock()
    mock_response_failed.text = json.dumps({
        "affected_area_description": "Officer Sharma has resolved the issue near the market",
        "potential_consequences": "None since it is resolved",
        "risk_level": "low",
        "evidence_count": 1
    })

    mock_models = AsyncMock()
    # Calls:
    # 1. Agent 1 (intake) -> mock_response_agent1
    # 2. Agent 3 Attempt 1 -> mock_response_failed (raises ValidationError)
    # 3. Agent 3 Attempt 2 -> mock_response_failed (raises ValidationError, then 502)
    mock_models.generate_content.side_effect = [
        mock_response_agent1,
        mock_response_failed,
        mock_response_failed
    ]
    mock_client_instance = MagicMock()
    mock_client_instance.aio.models = mock_models

    with patch("app.services.gemini_client.genai.Client", return_value=mock_client_instance):
        client = TestClient(app)

        photo = ("pothole.png", io.BytesIO(b"pothole_bytes"), "image/png")
        response = client.post(
            "/api/issues",
            data={"latitude": 19.0760, "longitude": 72.8777, "user_note": "Pothole A"},
            files={"photo": photo}
        )
        assert response.status_code == 201
        res_data = response.json()
        cluster_id = res_data["cluster_id"]

        # No summary should be created since it hard-failed both attempts
        with Session(test_engine) as session:
            summary = session.exec(
                select(ImpactSummary).where(ImpactSummary.cluster_id == cluster_id)
            ).first()
            assert summary is None

def test_manual_trigger_impact_success():
    # Set up database with cluster and issue
    with Session(test_engine) as session:
        cluster = Cluster(area_label="Test Area", center_lat=19.0760, center_lng=72.8777, report_count=1)
        session.add(cluster)
        session.commit()
        session.refresh(cluster)

        issue = Issue(
            photo_url="/static/uploads/test.jpg",
            latitude=19.0760,
            longitude=72.8777,
            issue_type="road_damage",
            severity=4,
            description="Pothole",
            credibility_score=0.8,
            cluster_id=cluster.id,
            status="clustered"
        )
        session.add(issue)
        session.commit()
        
        cluster_id = cluster.id

    # Mock Agent 3 Gemini call
    mock_response_agent3 = MagicMock()
    mock_response_agent3.text = json.dumps({
        "affected_area_description": "Manual trigger area",
        "potential_consequences": "None",
        "risk_level": "low",
        "evidence_count": 1
    })

    mock_models = AsyncMock()
    mock_models.generate_content.return_value = mock_response_agent3
    mock_client_instance = MagicMock()
    mock_client_instance.aio.models = mock_models

    with patch("app.services.gemini_client.genai.Client", return_value=mock_client_instance):
        client = TestClient(app)
        
        # Trigger manual endpoint
        response = client.post(f"/api/clusters/{cluster_id}/impact")
        assert response.status_code == 200
        data = response.json()
        assert data["affected_area_description"] == "Manual trigger area"
        assert data["risk_level"] == "low"

        # Verify it was saved to DB
        with Session(test_engine) as session:
            summary = session.exec(
                select(ImpactSummary).where(ImpactSummary.cluster_id == cluster_id)
            ).first()
            assert summary is not None
            assert summary.affected_area_description == "Manual trigger area"
