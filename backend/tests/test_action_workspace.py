import pytest
import os
import io
import json
from unittest.mock import patch, MagicMock, AsyncMock
from fastapi.testclient import TestClient
from sqlmodel import SQLModel, create_engine, Session, select
from pydantic import BaseModel

from app.db import get_session
from app.main import app
from app.models.cluster import Cluster
from app.models.action_draft import ActionDraft

test_sqlite_file = "test_workspace_civicpulse.db"
test_engine = create_engine(f"sqlite:///{test_sqlite_file}", connect_args={"check_same_thread": False})

def override_get_session():
    with Session(test_engine) as session:
        yield session

@pytest.fixture(autouse=True)
def setup_db():
    app.dependency_overrides[get_session] = override_get_session
    SQLModel.metadata.create_all(test_engine)
    
    yield
    
    SQLModel.metadata.drop_all(test_engine)
    app.dependency_overrides.pop(get_session, None)
    if os.path.exists(test_sqlite_file):
        try:
            os.remove(test_sqlite_file)
        except Exception:
            pass

def test_patch_draft_content_and_status():
    # 1. Seed database with action draft
    with Session(test_engine) as session:
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

    client = TestClient(app)

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
    with Session(test_engine) as session:
        db_draft = session.get(ActionDraft, draft_id)
        assert db_draft is not None
        assert db_draft.status == "approved"
        assert db_draft.content == "Updated Complaint Body content text"

def test_improve_draft_gemini():
    # 1. Seed database with action draft
    with Session(test_engine) as session:
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

    # Mock GeminiClient generate_structured_output
    class RefinedDraftSchema(BaseModel):
        refined_text: str

    mock_refined_data = MagicMock()
    mock_refined_data.refined_text = "Refined and polished content."

    client = TestClient(app)

    with patch("app.services.gemini_client.GeminiClient.generate_structured_output", return_value=mock_refined_data):
        response = client.post(
            f"/api/action-drafts/{draft_id}/improve",
            json={"content": "Current Text to refine", "prompt": "Make it formal"}
        )
        assert response.status_code == 200
        res_data = response.json()
        assert res_data["refined_text"] == "Refined and polished content."
