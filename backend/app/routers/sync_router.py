"""
Offline Synchronization, Idempotency & Resumable Upload API Router.
"""
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, HTTPException, status, Request, Response, UploadFile, File, Header
from sqlmodel import Session as DBSession, select

from app.db import get_session
from app.models.user import User
from app.models.sync import UploadSession, MediaAsset, OfflineSyncJob, SyncConflict
from app.services.upload_service import UploadService
from app.services.sync_service import SyncService
from app.utils.idempotency import check_idempotency, save_idempotency
from app.dependencies.auth_deps import get_optional_user

router = APIRouter(tags=["Offline Sync & Media Uploads"])

# Pydantic Schemas
class CreateUploadSessionRequest(BaseModel):
    filename: str
    file_size: int
    mime_type: str
    total_chunks: Optional[int] = 1
    expected_sha256: Optional[str] = None

class CreateUploadSessionResponse(BaseModel):
    session_id: str
    filename: str
    file_size: int
    mime_type: str
    total_chunks: int
    status: str
    expires_at: str

class BatchSyncRequest(BaseModel):
    drafts: List[Dict[str, Any]]

class SyncJobResponse(BaseModel):
    id: str
    client_draft_id: str
    status: str
    conflict_id: Optional[str] = None
    created_at: str
    updated_at: str

# 1. Resumable Upload Endpoints
@router.post("/uploads", response_model=CreateUploadSessionResponse, status_code=status.HTTP_201_CREATED)
async def create_upload_session(
    req: CreateUploadSessionRequest,
    request: Request,
    idempotency_key: Optional[str] = Header(None, alias="Idempotency-Key"),
    current_user: Optional[User] = Depends(get_optional_user),
    db: DBSession = Depends(get_session)
):
    """Initiate a resumable media upload session."""
    body_bytes = await request.body()
    cached_resp, _ = check_idempotency(db, idempotency_key, request.url.path, body_bytes)
    if cached_resp:
        return cached_resp

    user_id = current_user.id if current_user else None
    session_rec = UploadService.create_upload_session(
        db,
        filename=req.filename,
        file_size=req.file_size,
        mime_type=req.mime_type,
        total_chunks=req.total_chunks or 1,
        expected_sha256=req.expected_sha256,
        user_id=user_id
    )

    res_data = {
        "session_id": session_rec.id,
        "filename": session_rec.filename,
        "file_size": session_rec.file_size,
        "mime_type": session_rec.mime_type,
        "total_chunks": session_rec.total_chunks,
        "status": session_rec.status,
        "expires_at": session_rec.expires_at.isoformat()
    }

    if idempotency_key:
        save_idempotency(db, idempotency_key, request.url.path, body_bytes, 201, res_data, user_id=user_id)

    return res_data

@router.patch("/uploads/{session_id}")
async def upload_chunk(
    session_id: str,
    chunk_index: int = 0,
    file: UploadFile = File(...),
    current_user: Optional[User] = Depends(get_optional_user),
    db: DBSession = Depends(get_session)
):
    """Upload a specific chunk for an active upload session."""
    user_id = current_user.id if current_user else None
    session_rec = UploadService.save_chunk(db, session_id=session_id, chunk_index=chunk_index, chunk_file=file, user_id=user_id)
    return {
        "session_id": session_rec.id,
        "status": session_rec.status,
        "uploaded_chunks": session_rec.uploaded_chunks,
        "total_chunks": session_rec.total_chunks,
        "bytes_uploaded": session_rec.bytes_uploaded
    }

@router.post("/uploads/{session_id}/complete")
async def complete_upload_session(
    session_id: str,
    current_user: Optional[User] = Depends(get_optional_user),
    db: DBSession = Depends(get_session)
):
    """Assemble all chunks, verify checksum, and finalize media asset."""
    user_id = current_user.id if current_user else None
    asset = UploadService.complete_upload(db, session_id=session_id, user_id=user_id)
    return {
        "status": "completed",
        "asset_id": asset.id,
        "file_path": asset.file_path,
        "file_size": asset.file_size,
        "sha256_hash": asset.sha256_hash
    }

@router.delete("/uploads/{session_id}")
async def cancel_upload_session(
    session_id: str,
    current_user: Optional[User] = Depends(get_optional_user),
    db: DBSession = Depends(get_session)
):
    """Cancel an active upload session and purge temporary data."""
    user_id = current_user.id if current_user else None
    success = UploadService.cancel_upload(db, session_id=session_id, user_id=user_id)
    if not success:
        raise HTTPException(status_code=404, detail="Upload session not found")
    return {"status": "cancelled", "session_id": session_id}


# 2. Offline Synchronization Endpoints
@router.post("/sync")
async def batch_sync_offline_queue(
    req: BatchSyncRequest,
    request: Request,
    idempotency_key: Optional[str] = Header(None, alias="Idempotency-Key"),
    current_user: Optional[User] = Depends(get_optional_user),
    db: DBSession = Depends(get_session)
):
    """Batch synchronize queued client offline drafts."""
    body_bytes = await request.body()
    cached_resp, _ = check_idempotency(db, idempotency_key, request.url.path, body_bytes)
    if cached_resp:
        return cached_resp

    user_id = current_user.id if current_user else None
    jobs = SyncService.process_batch_sync(db, drafts=req.drafts, user_id=user_id)

    res_jobs = []
    for j in jobs:
        res_jobs.append({
            "id": j.id,
            "client_draft_id": j.client_draft_id,
            "status": j.status,
            "conflict_id": j.conflict_id,
            "created_at": j.created_at.isoformat(),
            "updated_at": j.updated_at.isoformat()
        })

    res_data = {"status": "success", "processed_count": len(res_jobs), "jobs": res_jobs}

    if idempotency_key:
        save_idempotency(db, idempotency_key, request.url.path, body_bytes, 200, res_data, user_id=user_id)

    return res_data

@router.get("/sync/jobs", response_model=List[SyncJobResponse])
def list_sync_jobs(
    current_user: Optional[User] = Depends(get_optional_user),
    db: DBSession = Depends(get_session)
):
    """List offline sync jobs."""
    user_id = current_user.id if current_user else None
    query = select(OfflineSyncJob)
    if user_id:
        query = query.where(OfflineSyncJob.user_id == user_id)
    
    jobs = db.exec(query).all()
    res = []
    for j in jobs:
        res.append(SyncJobResponse(
            id=j.id,
            client_draft_id=j.client_draft_id,
            status=j.status,
            conflict_id=j.conflict_id,
            created_at=j.created_at.isoformat(),
            updated_at=j.updated_at.isoformat()
        ))
    return res

@router.get("/sync/jobs/{job_id}")
def get_sync_job_details(
    job_id: str,
    db: DBSession = Depends(get_session)
):
    """Get details of a specific sync job."""
    job = db.exec(select(OfflineSyncJob).where(OfflineSyncJob.id == job_id)).first()
    if not job:
        raise HTTPException(status_code=404, detail="Sync job not found")

    conflict = None
    if job.conflict_id:
        c_rec = db.exec(select(SyncConflict).where(SyncConflict.id == job.conflict_id)).first()
        if c_rec:
            conflict = {
                "id": c_rec.id,
                "server_issue_id": c_rec.server_issue_id,
                "conflict_type": c_rec.conflict_type,
                "resolution_status": c_rec.resolution_status
            }

    return {
        "id": job.id,
        "client_draft_id": job.client_draft_id,
        "status": job.status,
        "payload": job.payload,
        "conflict": conflict,
        "created_at": job.created_at.isoformat(),
        "updated_at": job.updated_at.isoformat()
    }

@router.post("/issues/draft")
async def create_issue_draft(
    request: Request,
    idempotency_key: Optional[str] = Header(None, alias="Idempotency-Key"),
    current_user: Optional[User] = Depends(get_optional_user),
    db: DBSession = Depends(get_session)
):
    """Create a client issue draft on server."""
    body_bytes = await request.body()
    cached_resp, _ = check_idempotency(db, idempotency_key, request.url.path, body_bytes)
    if cached_resp:
        return cached_resp

    try:
        payload = await request.json()
    except Exception:
        payload = {}

    client_id = payload.get("id") or f"DRAFT-{datetime.now(timezone.utc).timestamp()}"
    user_id = current_user.id if current_user else None

    job = SyncService.process_offline_draft(db, client_draft_id=client_id, payload=payload, user_id=user_id)
    res_data = {
        "status": "created",
        "sync_job_id": job.id,
        "client_draft_id": job.client_draft_id,
        "job_status": job.status
    }

    if idempotency_key:
        save_idempotency(db, idempotency_key, request.url.path, body_bytes, 200, res_data, user_id=user_id)

    return res_data
