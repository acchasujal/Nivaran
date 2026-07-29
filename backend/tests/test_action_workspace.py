import pytest
import os
import io
import json
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from sqlmodel import Session, select
from pydantic import BaseModel

from app.models.cluster import Cluster
from app.models.action_draft import ActionDraft

def test_patch_draft_content_and_status(client: TestClient, session: Session):
    # 1. Seed database with action draft
    cluster = Cluster(area_label="Workspace St", center_lat=19.0760, center_lng=72.8777, report_count=1)
    session.add(cluster)
    session.commit()
    session.refresh(cluster)

    draft = ActionDraft(
        cluster_id=cluster.id,
        draft_type="complaint",
        content="Original Complaint Body text",
        status="pending_review"
    )
    session.add(draft)
    session.commit()
    session.refresh(draft)
    draft_id = draft.id

    # 2. Patch both status and content
    response = client.patch(
        f"/api/action-drafts/{draft_id}",
        json={"status": "approved", "content": "Updated Complaint Body content text"}
    )
    assert response.status_code == 200
    res_data = response.json()
    assert res_data["status"] == "approved"
    assert res_data["content"] == "Updated Complaint Body content text"

    # 3. Verify in Database
    db_draft = session.get(ActionDraft, draft_id)
    assert db_draft is not None
    assert db_draft.status == "approved"
    assert db_draft.content == "Updated Complaint Body content text"

def test_improve_draft_gemini(client: TestClient, session: Session):
    # 1. Seed database with action draft
    cluster = Cluster(area_label="Workspace St", center_lat=19.0760, center_lng=72.8777, report_count=1)
    session.add(cluster)
    session.commit()
    session.refresh(cluster)

    draft = ActionDraft(
        cluster_id=cluster.id,
        draft_type="complaint",
        content="Unrefined Text",
        status="pending_review"
    )
    session.add(draft)
    session.commit()
    session.refresh(draft)
    draft_id = draft.id

    class RefinedDraftSchema(BaseModel):
        refined_text: str

    mock_refined_data = MagicMock()
    mock_refined_data.refined_text = "Refined and polished content."

    with patch("app.services.gemini_client.GeminiClient.generate_structured_output", return_value=mock_refined_data):
        response = client.post(
            f"/api/action-drafts/{draft_id}/improve",
            json={"content": "Current Text to refine", "prompt": "Make it formal"}
        )
        assert response.status_code == 200
        res_data = response.json()
        assert res_data["refined_text"] == "Refined and polished content."
