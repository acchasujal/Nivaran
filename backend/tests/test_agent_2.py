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
from app.models.cluster import Cluster
from app.services.geo_service import haversine_distance
from app.services.agent_2_verification import verify_and_cluster_issue

test_sqlite_file = "test_agent2_civicpulse.db"
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
    yield
    SQLModel.metadata.drop_all(test_engine)
    app.dependency_overrides.pop(get_session, None)
    
    if os.path.exists(test_sqlite_file):
        try:
            os.remove(test_sqlite_file)
        except Exception:
            pass
    if os.path.exists("static/uploads"):
        shutil.rmtree("static/uploads", ignore_errors=True)

def test_haversine_distance():
    # E1 Acceptance Criterion: Unit test: two Mumbai coordinates 200m apart returns < 300; two 500m apart returns > 300
    # Center Mumbai point
    lat1, lon1 = 19.0760, 72.8777
    
    # ~200m away (lat increment ~0.0018 degrees)
    lat2, lon2 = 19.0778, 72.8777
    dist_200 = haversine_distance(lat1, lon1, lat2, lon2)
    assert dist_200 < 300.0
    
    # ~500m away (lat increment ~0.0045 degrees)
    lat3, lon3 = 19.0805, 72.8777
    dist_500 = haversine_distance(lat1, lon1, lat3, lon3)
    assert dist_500 > 300.0

def test_agent_2_clustering_success_within_300m():
    # E2 Acceptance Criterion: Second report within 300m of first (same issue_type) correctly increments cluster.report_count
    # Set up mocks for Gemini Vision (Agent 1)
    mock_response_agent1 = MagicMock()
    mock_response_agent1.text = json.dumps({
        "issue_type": "road_damage",
        "severity": 4,
        "description": "Pothole at Location A",
        "credibility_score": 0.9,
        "image_flags": ["clear"]
    })
    
    mock_models = AsyncMock()
    mock_models.generate_content.return_value = mock_response_agent1
    
    mock_client_instance = MagicMock()
    mock_client_instance.aio.models = mock_models
    
    # Set up mock for Gemini Dedup (Agent 2) returning high confidence duplicate match
    # Since generate_structured_output is called on the client, we mock that method directly.
    # First we mock it for create_issue:
    # First issue has no candidate clusters, so Agent 2 won't call Gemini.
    # Second issue has candidate clusters, so Agent 2 calls Gemini.
    # We want it to return a duplicate match for the second call.
    
    with patch("app.services.gemini_client.genai.Client", return_value=mock_client_instance):
        client = TestClient(app)
        
        # 1. Post first issue at (19.0760, 72.8777)
        photo_1 = ("pothole1.png", io.BytesIO(b"pothole_bytes_1"), "image/png")
        response1 = client.post(
            "/api/issues",
            data={"latitude": 19.0760, "longitude": 72.8777, "user_note": "First pothole"},
            files={"photo": photo_1}
        )
        assert response1.status_code == 201
        res1_data = response1.json()
        assert res1_data["status"] == "clustered"
        
        first_cluster_id = res1_data["cluster_id"]
        assert first_cluster_id is not None
        
        # Verify first cluster exists with count 1
        with Session(test_engine) as session:
            cluster1 = session.get(Cluster, first_cluster_id)
            assert cluster1 is not None
            assert cluster1.report_count == 1
            
        # 2. Mock Agent 2 Gemini call for the second submission to return duplicate of first cluster
        async def mock_generate_structured_output(*args, **kwargs):
            schema = kwargs.get("response_schema")
            # If it's Agent2Output, return the duplicate match
            from app.services.agent_2_verification import Agent2Output
            if schema == Agent2Output:
                return Agent2Output(
                    is_duplicate_of_cluster=first_cluster_id,
                    confidence=0.95,
                    create_new_cluster=False
                )
            # If it's Agent1Output (which shouldn't happen here because Agent 1 uses a different path,
            # but in case it is called), return a default Agent1Output
            from app.services.agent_1_intake import Agent1Output
            if schema == Agent1Output:
                return Agent1Output(
                    issue_type="road_damage",
                    severity=4,
                    description="Another pothole nearby",
                    credibility_score=0.85,
                    image_flags=["clear"]
                )
            raise ValueError(f"Unexpected schema {schema}")
            
        with patch("app.services.gemini_client.GeminiClient.generate_structured_output", side_effect=mock_generate_structured_output):
            photo_2 = ("pothole2.png", io.BytesIO(b"pothole_bytes_2"), "image/png")
            # Submit second issue within 300m (lat = 19.0772, ~133m away)
            response2 = client.post(
                "/api/issues",
                data={"latitude": 19.0772, "longitude": 72.8777, "user_note": "Second pothole"},
                files={"photo": photo_2}
            )
            assert response2.status_code == 201
            res2_data = response2.json()
            assert res2_data["status"] == "clustered"
            assert res2_data["cluster_id"] == first_cluster_id
            
            # Verify cluster report_count incremented to 2
            with Session(test_engine) as session:
                cluster_updated = session.get(Cluster, first_cluster_id)
                assert cluster_updated.report_count == 2
                
                # Check issues
                issues = session.exec(select(Issue).where(Issue.cluster_id == first_cluster_id)).all()
                assert len(issues) == 2

def test_agent_2_no_geographic_proximity():
    # E3 Acceptance Criterion: Two reports with similar descriptions but no geographic proximity: confidence < 0.4 -> separate clusters
    mock_response_agent1 = MagicMock()
    mock_response_agent1.text = json.dumps({
        "issue_type": "road_damage",
        "severity": 4,
        "description": "Pothole at Location A",
        "credibility_score": 0.9,
        "image_flags": ["clear"]
    })
    
    mock_models = AsyncMock()
    mock_models.generate_content.return_value = mock_response_agent1
    
    mock_client_instance = MagicMock()
    mock_client_instance.aio.models = mock_models
    
    with patch("app.services.gemini_client.genai.Client", return_value=mock_client_instance):
        client = TestClient(app)
        
        # 1. Post first issue at (19.0760, 72.8777)
        photo_1 = ("pothole1.png", io.BytesIO(b"pothole_bytes_1"), "image/png")
        response1 = client.post(
            "/api/issues",
            data={"latitude": 19.0760, "longitude": 72.8777, "user_note": "First pothole"},
            files={"photo": photo_1}
        )
        assert response1.status_code == 201
        res1_data = response1.json()
        c1_id = res1_data["cluster_id"]
        
        # 2. Post second issue at (19.0850, 72.8777) - more than 300m away (~1km)
        photo_2 = ("pothole2.png", io.BytesIO(b"pothole_bytes_2"), "image/png")
        response2 = client.post(
            "/api/issues",
            data={"latitude": 19.0850, "longitude": 72.8777, "user_note": "Second pothole far away"},
            files={"photo": photo_2}
        )
        assert response2.status_code == 201
        res2_data = response2.json()
        c2_id = res2_data["cluster_id"]
        
        # Should be separate clusters since no geographic proximity (distance > 300m)
        assert c1_id != c2_id
        
        with Session(test_engine) as session:
            cluster1 = session.get(Cluster, c1_id)
            cluster2 = session.get(Cluster, c2_id)
            assert cluster1.report_count == 1
            assert cluster2.report_count == 1

def test_agent_2_low_confidence_same_proximity():
    # Verify that two issues within 300m but with low confidence (< 0.4) go to separate clusters
    mock_response_agent1 = MagicMock()
    mock_response_agent1.text = json.dumps({
        "issue_type": "road_damage",
        "severity": 4,
        "description": "Pothole at Location A",
        "credibility_score": 0.9,
        "image_flags": ["clear"]
    })
    mock_models = AsyncMock()
    mock_models.generate_content.return_value = mock_response_agent1
    mock_client_instance = MagicMock()
    mock_client_instance.aio.models = mock_models
    
    with patch("app.services.gemini_client.genai.Client", return_value=mock_client_instance):
        client = TestClient(app)
        
        # 1. Post first issue
        photo_1 = ("pothole1.png", io.BytesIO(b"pothole_bytes_1"), "image/png")
        response1 = client.post(
            "/api/issues",
            data={"latitude": 19.0760, "longitude": 72.8777, "user_note": "First pothole"},
            files={"photo": photo_1}
        )
        assert response1.status_code == 201
        res1_data = response1.json()
        c1_id = res1_data["cluster_id"]
        
        # 2. Mock Agent 2 to return confidence = 0.2 (< 0.4)
        async def mock_generate_structured_output(*args, **kwargs):
            schema = kwargs.get("response_schema")
            from app.services.agent_1_intake import Agent1Output
            from app.services.agent_2_verification import Agent2Output
            if schema == Agent1Output:
                return Agent1Output(
                    issue_type="road_damage",
                    severity=4,
                    description="Pothole at Location A",
                    credibility_score=0.9,
                    image_flags=["clear"]
                )
            elif schema == Agent2Output:
                return Agent2Output(
                    is_duplicate_of_cluster=c1_id,
                    confidence=0.2,
                    create_new_cluster=True
                )
            raise ValueError(f"Unexpected schema {schema}")
            
        with patch("app.services.gemini_client.GeminiClient.generate_structured_output", side_effect=mock_generate_structured_output):
            photo_2 = ("pothole2.png", io.BytesIO(b"pothole_bytes_2"), "image/png")
            response2 = client.post(
                "/api/issues",
                data={"latitude": 19.0772, "longitude": 72.8777, "user_note": "Second pothole"},
                files={"photo": photo_2}
            )
            assert response2.status_code == 201
            res2_data = response2.json()
            c2_id = res2_data["cluster_id"]
            
            # Since confidence is < 0.4, it should create a new cluster
            assert c1_id != c2_id

def test_agent_2_confidence_band_default_to_new():
    # E4 Acceptance Criterion: Patched Gemini returning confidence=0.5 -> new cluster created (not merged)
    mock_response_agent1 = MagicMock()
    mock_response_agent1.text = json.dumps({
        "issue_type": "road_damage",
        "severity": 4,
        "description": "Pothole at Location A",
        "credibility_score": 0.9,
        "image_flags": ["clear"]
    })
    mock_models = AsyncMock()
    mock_models.generate_content.return_value = mock_response_agent1
    mock_client_instance = MagicMock()
    mock_client_instance.aio.models = mock_models
    
    with patch("app.services.gemini_client.genai.Client", return_value=mock_client_instance):
        client = TestClient(app)
        
        # 1. Post first issue
        photo_1 = ("pothole1.png", io.BytesIO(b"pothole_bytes_1"), "image/png")
        response1 = client.post(
            "/api/issues",
            data={"latitude": 19.0760, "longitude": 72.8777, "user_note": "First pothole"},
            files={"photo": photo_1}
        )
        assert response1.status_code == 201
        res1_data = response1.json()
        c1_id = res1_data["cluster_id"]
        
        # 2. Mock Agent 2 to return confidence = 0.5 (ambiguous band)
        async def mock_generate_structured_output(*args, **kwargs):
            schema = kwargs.get("response_schema")
            from app.services.agent_1_intake import Agent1Output
            from app.services.agent_2_verification import Agent2Output
            if schema == Agent1Output:
                return Agent1Output(
                    issue_type="road_damage",
                    severity=4,
                    description="Pothole at Location A",
                    credibility_score=0.9,
                    image_flags=["clear"]
                )
            elif schema == Agent2Output:
                return Agent2Output(
                    is_duplicate_of_cluster=c1_id,
                    confidence=0.5,
                    create_new_cluster=False # Even if create_new_cluster is False, confidence in [0.4,0.6] defaults to new
                )
            raise ValueError(f"Unexpected schema {schema}")
            
        with patch("app.services.gemini_client.GeminiClient.generate_structured_output", side_effect=mock_generate_structured_output):
            photo_2 = ("pothole2.png", io.BytesIO(b"pothole_bytes_2"), "image/png")
            response2 = client.post(
                "/api/issues",
                data={"latitude": 19.0772, "longitude": 72.8777, "user_note": "Second pothole"},
                files={"photo": photo_2}
            )
            assert response2.status_code == 201
            res2_data = response2.json()
            c2_id = res2_data["cluster_id"]
            
            # Since confidence is 0.5, it should create a new cluster (default-to-new rule)
            assert c1_id != c2_id

def test_agent_2_gemini_call_failsafe():
    # Verify that if Gemini semantic dedup call fails, the submission does not block and a new cluster is created (fail-safe)
    mock_response_agent1 = MagicMock()
    mock_response_agent1.text = json.dumps({
        "issue_type": "road_damage",
        "severity": 4,
        "description": "Pothole at Location A",
        "credibility_score": 0.9,
        "image_flags": ["clear"]
    })
    mock_models = AsyncMock()
    mock_models.generate_content.return_value = mock_response_agent1
    mock_client_instance = MagicMock()
    mock_client_instance.aio.models = mock_models
    
    with patch("app.services.gemini_client.genai.Client", return_value=mock_client_instance):
        client = TestClient(app)
        
        # 1. Post first issue
        photo_1 = ("pothole1.png", io.BytesIO(b"pothole_bytes_1"), "image/png")
        response1 = client.post(
            "/api/issues",
            data={"latitude": 19.0760, "longitude": 72.8777, "user_note": "First pothole"},
            files={"photo": photo_1}
        )
        assert response1.status_code == 201
        res1_data = response1.json()
        c1_id = res1_data["cluster_id"]
        
        # 2. Mock Agent 2 Gemini call to raise an exception
        async def mock_generate_structured_output_fail(*args, **kwargs):
            schema = kwargs.get("response_schema")
            from app.services.agent_1_intake import Agent1Output
            from app.services.agent_2_verification import Agent2Output
            if schema == Agent1Output:
                return Agent1Output(
                    issue_type="road_damage",
                    severity=4,
                    description="Pothole at Location A",
                    credibility_score=0.9,
                    image_flags=["clear"]
                )
            elif schema == Agent2Output:
                raise Exception("Gemini API call timed out")
            raise ValueError(f"Unexpected schema {schema}")
            
        with patch("app.services.gemini_client.GeminiClient.generate_structured_output", side_effect=mock_generate_structured_output_fail):
            photo_2 = ("pothole2.png", io.BytesIO(b"pothole_bytes_2"), "image/png")
            response2 = client.post(
                "/api/issues",
                data={"latitude": 19.0772, "longitude": 72.8777, "user_note": "Second pothole"},
                files={"photo": photo_2}
            )
            
            # The submission must succeed (status 201) because of the fail-safe
            assert response2.status_code == 201
            res2_data = response2.json()
            c2_id = res2_data["cluster_id"]
            
            # It should have created a new cluster for the second issue instead of blocking
            assert c1_id != c2_id
            assert res2_data["status"] == "clustered"
