import pytest
import os
import io
import json
import shutil
from unittest.mock import patch, MagicMock, AsyncMock
from fastapi.testclient import TestClient
from sqlmodel import Session, select
from datetime import datetime

from app.models.issue import Issue
from app.models.cluster import Cluster
from app.models.impact_summary import ImpactSummary
from app.models.action_draft import ActionDraft
from app.config import settings

@pytest.fixture(autouse=True)
def setup_settings_and_static():
    if os.path.exists("static/uploads"):
        shutil.rmtree("static/uploads", ignore_errors=True)
    os.makedirs("static/uploads", exist_ok=True)
    
    orig_threshold = settings.ESCALATION_THRESHOLD
    orig_override = settings.DEMO_THRESHOLD_OVERRIDE
    
    yield
    
    settings.ESCALATION_THRESHOLD = orig_threshold
    settings.DEMO_THRESHOLD_OVERRIDE = orig_override
    
    if os.path.exists("static/uploads"):
        shutil.rmtree("static/uploads", ignore_errors=True)

def test_agent_4_generation_and_persistence(client: TestClient, session: Session):
    cluster = Cluster(area_label="Test St", center_lat=19.0760, center_lng=72.8777, report_count=1)
    session.add(cluster)
    session.commit()
    session.refresh(cluster)

    issue = Issue(
        photo_url="/static/uploads/issue.jpg",
        latitude=19.0760,
        longitude=72.8777,
        issue_type="waste",
        severity=3,
        description="Garbage dump",
        credibility_score=0.8,
        cluster_id=cluster.id,
        status="clustered"
    )
    session.add(issue)

    impact = ImpactSummary(
        cluster_id=cluster.id,
        affected_area_description="Near central market",
        potential_consequences="Health hazards",
        risk_level="high",
        evidence_count=1,
        generated_at="2026-06-25T00:00:00Z"
    )
    session.add(impact)
    session.commit()
    
    cluster_id = cluster.id

    mock_response_agent4 = MagicMock()
    mock_response_agent4.text = json.dumps({
        "complaint_draft": "To Municipal Commissioner, we complain about waste...",
        "rti_draft": "AI-generated draft. Review before submission.\nRequest details about garbage collection frequency.",
        "community_summary": "Our community has reported waste accumulation..."
    })

    mock_models = AsyncMock()
    mock_models.generate_content.return_value = mock_response_agent4
    mock_client_instance = MagicMock()
    mock_client_instance.aio.models = mock_models

    with patch("app.services.gemini_client.genai.Client", return_value=mock_client_instance):
        response = client.post(f"/api/clusters/{cluster_id}/generate-drafts")
        assert response.status_code == 201
        
        res_data = response.json()
        assert len(res_data["drafts"]) == 3

        drafts = session.exec(
            select(ActionDraft).where(ActionDraft.cluster_id == cluster_id)
        ).all()
        assert len(drafts) == 3
        
        complaint = next(d for d in drafts if d.draft_type == "complaint")
        rti = next(d for d in drafts if d.draft_type == "rti")
        summary = next(d for d in drafts if d.draft_type == "community_summary")

        assert complaint.content.startswith("To Municipal Commissioner")
        assert complaint.status == "pending_review"
        assert rti.content.startswith("AI-generated draft. Review before submission.")
        assert summary.content.startswith("Our community has reported")

def test_agent_4_disclaimer_retry_success(client: TestClient, session: Session):
    cluster = Cluster(area_label="Test St", center_lat=19.0760, center_lng=72.8777, report_count=1)
    session.add(cluster)
    session.commit()
    session.refresh(cluster)

    issue = Issue(
        photo_url="/static/uploads/issue.jpg",
        latitude=19.0760,
        longitude=72.8777,
        issue_type="waste",
        severity=3,
        description="Garbage dump",
        credibility_score=0.8,
        cluster_id=cluster.id,
        status="clustered"
    )
    session.add(issue)

    impact = ImpactSummary(
        cluster_id=cluster.id,
        affected_area_description="Near central market",
        potential_consequences="Health hazards",
        risk_level="high",
        evidence_count=1,
        generated_at="2026-06-25T00:00:00Z"
    )
    session.add(impact)
    session.commit()
    
    cluster_id = cluster.id

    mock_response_failed = MagicMock()
    mock_response_failed.text = json.dumps({
        "complaint_draft": "Complaint",
        "rti_draft": "This draft lacks the disclaimer entirely.",
        "community_summary": "Summary"
    })

    mock_response_success = MagicMock()
    mock_response_success.text = json.dumps({
        "complaint_draft": "Complaint",
        "rti_draft": "AI-generated draft. Review before submission.\nRequest info.",
        "community_summary": "Summary"
    })

    mock_models = AsyncMock()
    mock_models.generate_content.side_effect = [
        mock_response_failed,
        mock_response_success
    ]
    mock_client_instance = MagicMock()
    mock_client_instance.aio.models = mock_models

    with patch("app.services.gemini_client.genai.Client", return_value=mock_client_instance):
        response = client.post(f"/api/clusters/{cluster_id}/generate-drafts")
        assert response.status_code == 201
        
        drafts = session.exec(
            select(ActionDraft).where(ActionDraft.cluster_id == cluster_id)
        ).all()
        assert len(drafts) == 3
        rti = next(d for d in drafts if d.draft_type == "rti")
        assert rti.content.startswith("AI-generated draft. Review before submission.")

def test_agent_4_disclaimer_retry_hard_fail(client: TestClient, session: Session):
    cluster = Cluster(area_label="Test St", center_lat=19.0760, center_lng=72.8777, report_count=1)
    session.add(cluster)
    session.commit()
    session.refresh(cluster)

    issue = Issue(
        photo_url="/static/uploads/issue.jpg",
        latitude=19.0760,
        longitude=72.8777,
        issue_type="waste",
        severity=3,
        description="Garbage dump",
        credibility_score=0.8,
        cluster_id=cluster.id,
        status="clustered"
    )
    session.add(issue)

    impact = ImpactSummary(
        cluster_id=cluster.id,
        affected_area_description="Near central market",
        potential_consequences="Health hazards",
        risk_level="high",
        evidence_count=1,
        generated_at="2026-06-25T00:00:00Z"
    )
    session.add(impact)
    session.commit()
    
    cluster_id = cluster.id

    mock_response_failed = MagicMock()
    mock_response_failed.text = json.dumps({
        "complaint_draft": "Complaint",
        "rti_draft": "This draft lacks the disclaimer entirely.",
        "community_summary": "Summary"
    })

    mock_models = AsyncMock()
    mock_models.generate_content.side_effect = [
        mock_response_failed,
        mock_response_failed
    ]
    mock_client_instance = MagicMock()
    mock_client_instance.aio.models = mock_models

    with patch("app.services.gemini_client.genai.Client", return_value=mock_client_instance):
        response = client.post(f"/api/clusters/{cluster_id}/generate-drafts")
        assert response.status_code == 502
        
        drafts = session.exec(
            select(ActionDraft).where(ActionDraft.cluster_id == cluster_id)
        ).all()
        assert len(drafts) == 0

def test_agent_4_gemini_failure(client: TestClient, session: Session):
    cluster = Cluster(area_label="Test St", center_lat=19.0760, center_lng=72.8777, report_count=1)
    session.add(cluster)
    session.commit()
    session.refresh(cluster)

    issue = Issue(
        photo_url="/static/uploads/issue.jpg",
        latitude=19.0760,
        longitude=72.8777,
        issue_type="waste",
        severity=3,
        description="Garbage dump",
        credibility_score=0.8,
        cluster_id=cluster.id,
        status="clustered"
    )
    session.add(issue)

    impact = ImpactSummary(
        cluster_id=cluster.id,
        affected_area_description="Near central market",
        potential_consequences="Health hazards",
        risk_level="high",
        evidence_count=1,
        generated_at="2026-06-25T00:00:00Z"
    )
    session.add(impact)
    session.commit()
    
    cluster_id = cluster.id

    mock_models = AsyncMock()
    mock_models.generate_content.side_effect = Exception("API limit exceeded")
    mock_client_instance = MagicMock()
    mock_client_instance.aio.models = mock_models

    with patch("app.services.gemini_client.genai.Client", return_value=mock_client_instance):
        response = client.post(f"/api/clusters/{cluster_id}/generate-drafts")
        assert response.status_code == 502

def test_agent_4_automatic_trigger_on_issue_creation(client: TestClient, session: Session):
    settings.DEMO_THRESHOLD_OVERRIDE = 1

    mock_response_agent1 = MagicMock()
    mock_response_agent1.text = json.dumps({
        "issue_type": "waste",
        "severity": 3,
        "description": "Garbage pile on corner",
        "credibility_score": 0.8,
        "image_flags": ["clear"]
    })

    mock_response_agent3 = MagicMock()
    mock_response_agent3.text = json.dumps({
        "affected_area_description": "Corner area",
        "potential_consequences": "Odor and flies",
        "risk_level": "moderate",
        "evidence_count": 1
    })

    mock_response_agent4 = MagicMock()
    mock_response_agent4.text = json.dumps({
        "complaint_draft": "Complaint content...",
        "rti_draft": "AI-generated draft. Review before submission.\nRequest details...",
        "community_summary": "Summary content..."
    })

    mock_models = AsyncMock()
    mock_models.generate_content.side_effect = [
        mock_response_agent1,
        mock_response_agent3,
        mock_response_agent4
    ]
    mock_client_instance = MagicMock()
    mock_client_instance.aio.models = mock_models

    with patch("app.services.gemini_client.genai.Client", return_value=mock_client_instance):
        photo = ("waste.png", io.BytesIO(b"waste_image_bytes"), "image/png")
        response = client.post(
            "/api/issues",
            data={"latitude": 19.0760, "longitude": 72.8777, "user_note": "Trash buildup"},
            files={"photo": photo}
        )
        assert response.status_code == 201
        res_data = response.json()
        cluster_id = res_data["cluster_id"]
        issue_id = res_data["id"]

        drafts = session.exec(
            select(ActionDraft).where(ActionDraft.cluster_id == cluster_id)
        ).all()
        assert len(drafts) == 3

        issue_saved = session.get(Issue, issue_id)
        assert issue_saved.status == "drafted"
