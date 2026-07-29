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
from app.models.action_draft import ActionDraft
from app.models.escalation import Escalation
from app.config import settings

@pytest.fixture(autouse=True)
def setup_settings_and_static():
    if os.path.exists("static/uploads"):
        try:
            shutil.rmtree("static/uploads")
        except Exception:
            pass
    if os.path.exists("static/downloads"):
        try:
            shutil.rmtree("static/downloads")
        except Exception:
            pass
    os.makedirs("static/uploads", exist_ok=True)
    os.makedirs("static/downloads", exist_ok=True)
    
    orig_api_key = settings.SENDGRID_API_KEY
    orig_fallback = settings.AGENT5_PDF_FALLBACK
    
    yield
    
    settings.SENDGRID_API_KEY = orig_api_key
    settings.AGENT5_PDF_FALLBACK = orig_fallback
    
    if os.path.exists("static/uploads"):
        try:
            shutil.rmtree("static/uploads")
        except Exception:
            pass
    if os.path.exists("static/downloads"):
        try:
            shutil.rmtree("static/downloads")
        except Exception:
            pass

def test_approved_email_success(client: TestClient, session: Session):
    cluster = Cluster(area_label="Main St", center_lat=19.0760, center_lng=72.8777, report_count=1)
    session.add(cluster)
    session.commit()
    session.refresh(cluster)

    issue = Issue(
        photo_url="/static/uploads/issue.jpg",
        latitude=19.0760,
        longitude=72.8777,
        issue_type="waste",
        severity=3,
        description="Garbage",
        credibility_score=0.8,
        cluster_id=cluster.id,
        status="drafted"
    )
    session.add(issue)

    draft = ActionDraft(
        cluster_id=cluster.id,
        draft_type="complaint",
        content="Formal complaint content",
        status="approved"
    )
    session.add(draft)
    session.commit()
    
    draft_id = draft.id
    cluster_id = cluster.id
    issue_id = issue.id

    settings.SENDGRID_API_KEY = "SG.test_key"
    
    with patch("app.services.agent_5_escalation.send_email", return_value="202 Accepted") as mock_send:
        response = client.post(
            "/api/escalations",
            json={
                "draft_id": draft_id,
                "method": "email",
                "recipient": "ward@example.gov"
            }
        )
        assert response.status_code == 201
        res_data = response.json()
        assert res_data["status"] == "sent"
        assert res_data["provider_response"] == "202 Accepted"
        
        mock_send.assert_called_once_with(
            to_email="ward@example.gov",
            subject="nivaran Escalation - Complaint",
            content="Formal complaint content"
        )

        escalation = session.exec(select(Escalation).where(Escalation.draft_id == draft_id)).first()
        assert escalation is not None
        assert escalation.status == "sent"
        assert escalation.provider_response == "202 Accepted"

        issue_db = session.get(Issue, issue_id)
        assert issue_db.status == "escalated"

def test_unapproved_draft_blocked(client: TestClient, session: Session):
    cluster = Cluster(area_label="Main St", center_lat=19.0760, center_lng=72.8777, report_count=1)
    session.add(cluster)
    session.commit()
    session.refresh(cluster)

    draft = ActionDraft(
        cluster_id=cluster.id,
        draft_type="complaint",
        content="Formal complaint content",
        status="pending_review"
    )
    session.add(draft)
    session.commit()
    
    draft_id = draft.id

    response = client.post(
        "/api/escalations",
        json={
            "draft_id": draft_id,
            "method": "email",
            "recipient": "ward@example.gov"
        }
    )
    assert response.status_code == 403
    assert response.json()["detail"] == {"error": "draft_not_approved"}

    escalations = session.exec(select(Escalation)).all()
    assert len(escalations) == 0

def test_email_failure_pdf_fallback(client: TestClient, session: Session):
    cluster = Cluster(area_label="Main St", center_lat=19.0760, center_lng=72.8777, report_count=1)
    session.add(cluster)
    session.commit()
    session.refresh(cluster)

    issue = Issue(
        photo_url="/static/uploads/issue.jpg",
        latitude=19.0760,
        longitude=72.8777,
        issue_type="waste",
        severity=3,
        description="Garbage",
        credibility_score=0.8,
        cluster_id=cluster.id,
        status="drafted"
    )
    session.add(issue)

    draft = ActionDraft(
        cluster_id=cluster.id,
        draft_type="complaint",
        content="Formal complaint content",
        status="approved"
    )
    session.add(draft)
    session.commit()
    
    draft_id = draft.id
    issue_id = issue.id

    settings.SENDGRID_API_KEY = "SG.test_key"
    settings.AGENT5_PDF_FALLBACK = True
    
    with patch("app.services.agent_5_escalation.send_email", side_effect=Exception("Connection timed out")):
        response = client.post(
            "/api/escalations",
            json={
                "draft_id": draft_id,
                "method": "email",
                "recipient": "ward@example.gov"
            }
        )
        assert response.status_code == 201
        res_data = response.json()
        assert res_data["status"] == "exported"
        assert res_data["method"] == "pdf_export"
        assert "Fell back to PDF generation" in res_data["provider_response"]
        assert res_data["pdf_download_url"] is not None

        escalation_id = res_data["id"]
        pdf_path = os.path.join("static/downloads", f"{escalation_id}.pdf")
        assert os.path.exists(pdf_path)

        escalation = session.get(Escalation, escalation_id)
        assert escalation is not None
        assert escalation.status == "exported"
        assert escalation.method == "pdf_export"

        issue_db = session.get(Issue, issue_id)
        assert issue_db.status == "escalated"

def test_email_failure_no_fallback(client: TestClient, session: Session):
    cluster = Cluster(area_label="Main St", center_lat=19.0760, center_lng=72.8777, report_count=1)
    session.add(cluster)
    session.commit()
    session.refresh(cluster)

    issue = Issue(
        photo_url="/static/uploads/issue.jpg",
        latitude=19.0760,
        longitude=72.8777,
        issue_type="waste",
        severity=3,
        description="Garbage",
        credibility_score=0.8,
        cluster_id=cluster.id,
        status="drafted"
    )
    session.add(issue)

    draft = ActionDraft(
        cluster_id=cluster.id,
        draft_type="complaint",
        content="Formal complaint content",
        status="approved"
    )
    session.add(draft)
    session.commit()
    
    draft_id = draft.id
    issue_id = issue.id

    settings.SENDGRID_API_KEY = "SG.test_key"
    settings.AGENT5_PDF_FALLBACK = False
    
    with patch("app.services.agent_5_escalation.send_email", side_effect=Exception("Connection timed out")):
        response = client.post(
            "/api/escalations",
            json={
                "draft_id": draft_id,
                "method": "email",
                "recipient": "ward@example.gov"
            }
        )
        assert response.status_code == 502
        
        escalation = session.exec(select(Escalation).where(Escalation.draft_id == draft_id)).first()
        assert escalation is not None
        assert escalation.status == "failed"
        assert "Connection timed out" in escalation.provider_response

        issue_db = session.get(Issue, issue_id)
        assert issue_db.status == "drafted"

def test_pdf_export_success(client: TestClient, session: Session):
    cluster = Cluster(area_label="Main St", center_lat=19.0760, center_lng=72.8777, report_count=1)
    session.add(cluster)
    session.commit()
    session.refresh(cluster)

    issue = Issue(
        photo_url="/static/uploads/issue.jpg",
        latitude=19.0760,
        longitude=72.8777,
        issue_type="waste",
        severity=3,
        description="Garbage",
        credibility_score=0.8,
        cluster_id=cluster.id,
        status="drafted"
    )
    session.add(issue)

    draft = ActionDraft(
        cluster_id=cluster.id,
        draft_type="complaint",
        content="Formal complaint content",
        status="approved"
    )
    session.add(draft)
    session.commit()
    
    draft_id = draft.id
    issue_id = issue.id

    response = client.post(
        "/api/escalations",
        json={
            "draft_id": draft_id,
            "method": "pdf_export"
        }
    )
    assert response.status_code == 201
    res_data = response.json()
    assert res_data["status"] == "exported"
    assert res_data["method"] == "pdf_export"
    assert res_data["pdf_download_url"] is not None

    escalation_id = res_data["id"]
    pdf_path = os.path.join("static/downloads", f"{escalation_id}.pdf")
    assert os.path.exists(pdf_path)

    escalation = session.get(Escalation, escalation_id)
    assert escalation is not None
    assert escalation.status == "exported"
    
    issue_db = session.get(Issue, issue_id)
    assert issue_db.status == "escalated"
