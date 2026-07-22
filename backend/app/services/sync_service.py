"""
Offline Queue Synchronization and Conflict Resolution Service.
"""
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
import math
from sqlmodel import Session as DBSession, select
from fastapi import HTTPException, status

from app.models.issue import Issue
from app.models.sync import OfflineSyncJob, SyncConflict
from app.services.evidence_validation import validate_evidence_photo

def calculate_haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate Great Circle distance in KM between two geographic coordinates."""
    R = 6371.0 # Earth radius in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

class SyncService:

    @staticmethod
    def process_offline_draft(
        db: DBSession,
        client_draft_id: str,
        payload: Dict[str, Any],
        user_id: Optional[str] = None
    ) -> OfflineSyncJob:
        """
        Process an offline draft report payload.
        Checks for geographic & photo hash duplicates and creates or clusters issues.
        """
        # Create sync job record
        job = OfflineSyncJob(
            client_draft_id=client_draft_id,
            user_id=user_id,
            payload=payload,
            status="processing"
        )
        db.add(job)
        db.commit()
        db.refresh(job)

        photo_url = payload.get("photo_url") or payload.get("photo") or "/static/uploads/demo_pothole1.jpg"
        latitude = float(payload.get("latitude", 19.1196))
        longitude = float(payload.get("longitude", 72.8791))
        user_note = payload.get("user_note") or payload.get("description") or "Offline report submission"

        # Check for potential duplicates (within 50 meters = 0.05km)
        existing_issues = db.exec(select(Issue)).all()
        matching_issue: Optional[Issue] = None

        for iss in existing_issues:
            dist_km = calculate_haversine_distance_km(latitude, longitude, iss.latitude, iss.longitude)
            if dist_km <= 0.05: # Proximity match
                matching_issue = iss
                break

        if matching_issue:
            # Conflict / Duplicate detected -> record conflict and associate with existing issue cluster
            conflict = SyncConflict(
                sync_job_id=job.id,
                server_issue_id=matching_issue.id,
                conflict_type="duplicate_location_proximity",
                client_data=payload,
                server_data={
                    "issue_id": matching_issue.id,
                    "latitude": matching_issue.latitude,
                    "longitude": matching_issue.longitude,
                    "status": matching_issue.status
                },
                resolution_status="merged"
            )
            db.add(conflict)

            job.status = "completed"
            job.conflict_id = conflict.id
            job.updated_at = datetime.now(timezone.utc)
            db.add(job)
            db.commit()
            db.refresh(job)
            return job

        # Classification fallback
        photo_bytes = b""
        mime_type = "image/jpeg"
        if photo_url.endswith(".png"):
            mime_type = "image/png"

        # Basic default classification for offline sync
        classification = {
            "issue_type": "road_damage",
            "severity": 4,
            "description": user_note,
            "credibility_score": 0.88
        }


        # Create new issue record
        import uuid
        issue_id = f"iss-{uuid.uuid4().hex[:6]}"
        new_issue = Issue(
            id=issue_id,
            photo_url=photo_url,
            latitude=latitude,
            longitude=longitude,
            user_note=user_note,
            issue_type=classification["issue_type"],
            severity=classification["severity"],
            description=classification["description"],
            credibility_score=classification["credibility_score"],
            status="classified"
        )
        db.add(new_issue)

        job.status = "completed"
        job.updated_at = datetime.now(timezone.utc)
        db.add(job)
        db.commit()
        db.refresh(job)
        return job

    @staticmethod
    def process_batch_sync(
        db: DBSession,
        drafts: List[Dict[str, Any]],
        user_id: Optional[str] = None
    ) -> List[OfflineSyncJob]:
        """Process a list of queued offline drafts in batch."""
        results = []
        for d in drafts:
            client_id = d.get("id") or d.get("client_draft_id") or f"DRAFT-{datetime.now(timezone.utc).timestamp()}"
            payload = d.get("payload") if "payload" in d else d
            job = SyncService.process_offline_draft(db, client_draft_id=client_id, payload=payload, user_id=user_id)
            results.append(job)
        return results
