import pytest
import os
import io
import json
import shutil
from unittest.mock import patch, MagicMock, AsyncMock
from fastapi.testclient import TestClient
from sqlmodel import Session, select
from app.models.issue import Issue
from app.models.cluster import Cluster
from app.services.geo_service import haversine_distance

@pytest.fixture(autouse=True)
def setup_static_dirs():
    if os.path.exists("static/uploads"):
        shutil.rmtree("static/uploads", ignore_errors=True)
    os.makedirs("static/uploads", exist_ok=True)
    yield
    if os.path.exists("static/uploads"):
        shutil.rmtree("static/uploads", ignore_errors=True)

def test_haversine_distance():
    lat1, lon1 = 19.0760, 72.8777
    lat2, lon2 = 19.0778, 72.8777
    dist_200 = haversine_distance(lat1, lon1, lat2, lon2)
    assert dist_200 < 300.0
    
    lat3, lon3 = 19.0805, 72.8777
    dist_500 = haversine_distance(lat1, lon1, lat3, lon3)
    assert dist_500 > 300.0

def test_agent_2_clustering_success_within_300m(client: TestClient, session: Session):
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
        
        cluster1 = session.get(Cluster, first_cluster_id)
        assert cluster1 is not None
        assert cluster1.report_count == 1
            
        async def mock_generate_structured_output(*args, **kwargs):
            schema = kwargs.get("response_schema")
            from app.services.agent_2_verification import Agent2Output
            if schema == Agent2Output:
                return Agent2Output(
                    is_duplicate_of_cluster=first_cluster_id,
                    confidence=0.95,
                    create_new_cluster=False
                )
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
            response2 = client.post(
                "/api/issues",
                data={"latitude": 19.0772, "longitude": 72.8777, "user_note": "Second pothole"},
                files={"photo": photo_2}
            )
            assert response2.status_code == 201
            res2_data = response2.json()
            assert res2_data["status"] == "clustered"
            assert res2_data["cluster_id"] == first_cluster_id
            
            cluster_updated = session.get(Cluster, first_cluster_id)
            assert cluster_updated.report_count == 2
            
            issues = session.exec(select(Issue).where(Issue.cluster_id == first_cluster_id)).all()
            assert len(issues) == 2

def test_agent_2_no_geographic_proximity(client: TestClient, session: Session):
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
        photo_1 = ("pothole1.png", io.BytesIO(b"pothole_bytes_1"), "image/png")
        response1 = client.post(
            "/api/issues",
            data={"latitude": 19.0760, "longitude": 72.8777, "user_note": "First pothole"},
            files={"photo": photo_1}
        )
        assert response1.status_code == 201
        res1_data = response1.json()
        c1_id = res1_data["cluster_id"]
        
        photo_2 = ("pothole2.png", io.BytesIO(b"pothole_bytes_2"), "image/png")
        response2 = client.post(
            "/api/issues",
            data={"latitude": 19.0850, "longitude": 72.8777, "user_note": "Second pothole far away"},
            files={"photo": photo_2}
        )
        assert response2.status_code == 201
        res2_data = response2.json()
        c2_id = res2_data["cluster_id"]
        
        assert c1_id != c2_id
        
        cluster1 = session.get(Cluster, c1_id)
        cluster2 = session.get(Cluster, c2_id)
        assert cluster1.report_count == 1
        assert cluster2.report_count == 1

def test_agent_2_low_confidence_same_proximity(client: TestClient, session: Session):
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
        photo_1 = ("pothole1.png", io.BytesIO(b"pothole_bytes_1"), "image/png")
        response1 = client.post(
            "/api/issues",
            data={"latitude": 19.0760, "longitude": 72.8777, "user_note": "First pothole"},
            files={"photo": photo_1}
        )
        assert response1.status_code == 201
        res1_data = response1.json()
        c1_id = res1_data["cluster_id"]
        
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
            
            assert c1_id != c2_id

def test_agent_2_confidence_band_default_to_new(client: TestClient, session: Session):
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
        photo_1 = ("pothole1.png", io.BytesIO(b"pothole_bytes_1"), "image/png")
        response1 = client.post(
            "/api/issues",
            data={"latitude": 19.0760, "longitude": 72.8777, "user_note": "First pothole"},
            files={"photo": photo_1}
        )
        assert response1.status_code == 201
        res1_data = response1.json()
        c1_id = res1_data["cluster_id"]
        
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
                    create_new_cluster=False
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
            
            assert c1_id != c2_id

def test_agent_2_gemini_call_failsafe(client: TestClient, session: Session):
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
        photo_1 = ("pothole1.png", io.BytesIO(b"pothole_bytes_1"), "image/png")
        response1 = client.post(
            "/api/issues",
            data={"latitude": 19.0760, "longitude": 72.8777, "user_note": "First pothole"},
            files={"photo": photo_1}
        )
        assert response1.status_code == 201
        res1_data = response1.json()
        c1_id = res1_data["cluster_id"]
        
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
            
            assert response2.status_code == 201
            res2_data = response2.json()
            c2_id = res2_data["cluster_id"]
            
            assert c1_id != c2_id
            assert res2_data["status"] == "clustered"
