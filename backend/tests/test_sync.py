"""
Unit & Integration Tests for Offline Sync, Idempotency & Resumable Media Uploads.
"""
import io
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.db import get_session

def test_idempotency_replay_protection(client: TestClient):
    key = "IDEM-TEST-12345"
    payload = {
        "filename": "pothole_evidence.jpg",
        "file_size": 2048,
        "mime_type": "image/jpeg",
        "total_chunks": 1
    }

    # Initial request
    res1 = client.post("/api/uploads", json=payload, headers={"Idempotency-Key": key})
    assert res1.status_code == 201
    data1 = res1.json()

    # Replay request with SAME key and SAME payload
    res2 = client.post("/api/uploads", json=payload, headers={"Idempotency-Key": key})
    assert res2.status_code == 201
    assert res2.headers.get("X-Cache-Replay") == "true"
    assert res2.json()["session_id"] == data1["session_id"]

    # Replay request with SAME key but DIFFERENT payload -> mismatch error!
    diff_payload = {
        "filename": "different_file.jpg",
        "file_size": 9999,
        "mime_type": "image/jpeg"
    }
    res3 = client.post("/api/uploads", json=diff_payload, headers={"Idempotency-Key": key})
    assert res3.status_code == 422
    assert "mismatch" in res3.json()["detail"].lower()

def test_resumable_chunked_upload_flow(client: TestClient):
    chunk_1 = b"PART_1_HEADER_BYTES_"
    chunk_2 = b"PART_2_BODY_BYTES_FOOTER"
    total_size = len(chunk_1) + len(chunk_2)

    # 1. Create upload session (2 chunks)
    init_res = client.post("/api/uploads", json={
        "filename": "chunked_test.jpg",
        "file_size": total_size,
        "mime_type": "image/jpeg",
        "total_chunks": 2
    })
    assert init_res.status_code == 201
    sess_id = init_res.json()["session_id"]

    # 2. Upload Chunk 0
    c0_res = client.patch(
        f"/api/uploads/{sess_id}?chunk_index=0",
        files={"file": ("chunk0.dat", io.BytesIO(chunk_1), "application/octet-stream")}
    )
    assert c0_res.status_code == 200
    assert c0_res.json()["uploaded_chunks"] == [0]

    # 3. Upload Chunk 1
    c1_res = client.patch(
        f"/api/uploads/{sess_id}?chunk_index=1",
        files={"file": ("chunk1.dat", io.BytesIO(chunk_2), "application/octet-stream")}
    )
    assert c1_res.status_code == 200
    assert c1_res.json()["uploaded_chunks"] == [0, 1]

    # 4. Complete upload
    comp_res = client.post(f"/api/uploads/{sess_id}/complete")
    assert comp_res.status_code == 200
    comp_data = comp_res.json()
    assert comp_data["status"] == "completed"
    assert "asset_id" in comp_data
    assert comp_data["file_size"] == total_size

def test_batch_offline_sync_and_conflict_resolution(client: TestClient):
    drafts_payload = {
        "drafts": [
            {
                "id": "DRAFT-OFFLINE-001",
                "latitude": 19.1196,
                "longitude": 72.8791,
                "user_note": "First offline reported pothole"
            },
            {
                "id": "DRAFT-OFFLINE-002",
                "latitude": 19.1197, # Extremely close -> proximity duplicate conflict
                "longitude": 72.8792,
                "user_note": "Second offline reported pothole nearby"
            }
        ]
    }

    res = client.post("/api/sync", json=drafts_payload)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    assert data["processed_count"] == 2
    assert len(data["jobs"]) == 2

    # Second draft should have triggered a merged conflict association
    second_job = data["jobs"][1]
    assert second_job["conflict_id"] is not None

def test_list_and_get_sync_jobs(client: TestClient):
    # Submit draft
    client.post("/api/issues/draft", json={
        "id": "DRAFT-GET-TEST",
        "latitude": 19.0500,
        "longitude": 72.8500,
        "user_note": "Draft get test"
    })

    jobs_res = client.get("/api/sync/jobs")
    assert jobs_res.status_code == 200
    jobs_list = jobs_res.json()
    assert len(jobs_list) >= 1

    job_id = jobs_list[0]["id"]
    detail_res = client.get(f"/api/sync/jobs/{job_id}")
    assert detail_res.status_code == 200
    assert detail_res.json()["client_draft_id"] == "DRAFT-GET-TEST"
