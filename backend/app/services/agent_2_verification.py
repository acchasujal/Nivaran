import json
import logging
from typing import Optional, List
from pydantic import BaseModel, Field
from sqlmodel import Session, select
from datetime import datetime, timezone

from app.models.issue import Issue
from app.models.cluster import Cluster
from app.services.geo_service import haversine_distance
from app.services.gemini_client import GeminiClient

logger = logging.getLogger("civicpulse")

class Agent2Output(BaseModel):
    is_duplicate_of_cluster: Optional[str] = Field(
        default=None,
        description="The UUID of the cluster this issue is a duplicate of, or null if it is not a duplicate."
    )
    confidence: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Confidence score between 0.0 and 1.0 that this issue is a duplicate."
    )
    create_new_cluster: bool = Field(
        ...,
        description="True if a new cluster should be created, False if it should be merged with an existing cluster."
    )

async def verify_and_cluster_issue(
    issue: Issue,
    session: Session,
    gemini_client: Optional[GeminiClient] = None
) -> None:
    import time
    start_time = time.time()
    try:
        await _verify_and_cluster_issue_impl(issue, session, gemini_client)
        latency_ms = int((time.time() - start_time) * 1000)
        logger.info(json.dumps({
            "agent": "Agent2",
            "issue_id": issue.id,
            "latency_ms": latency_ms,
            "success": True
        }))
    except Exception as e:
        latency_ms = int((time.time() - start_time) * 1000)
        logger.info(json.dumps({
            "agent": "Agent2",
            "issue_id": issue.id,
            "latency_ms": latency_ms,
            "success": False
        }))
        raise e

async def _verify_and_cluster_issue_impl(
    issue: Issue,
    session: Session,
    gemini_client: Optional[GeminiClient] = None
) -> None:
    """
    Agent 2: Issue Verification.
    Checks for duplicate issues/clusters within 300m of the same issue type.
    Calls Gemini for semantic deduplication on descriptions.
    """
    if gemini_client is None:
        gemini_client = GeminiClient()

    # 1. Query all clusters
    clusters = session.exec(select(Cluster)).all()

    # 2. Filter for clusters within 300m and having matching issue_type
    candidate_clusters = []
    for cluster in clusters:
        dist = haversine_distance(
            issue.latitude,
            issue.longitude,
            cluster.center_lat,
            cluster.center_lng
        )
        if dist <= 300.0:
            # Check if this cluster contains issues of the same issue_type
            first_issue_in_cluster = session.exec(
                select(Issue)
                .where(Issue.cluster_id == cluster.id)
                .limit(1)
            ).first()
            if first_issue_in_cluster and first_issue_in_cluster.issue_type == issue.issue_type:
                # Get all issues in this cluster to compile their descriptions
                cluster_issues = session.exec(
                    select(Issue).where(Issue.cluster_id == cluster.id)
                ).all()
                candidate_clusters.append((cluster, cluster_issues))

    target_cluster = None

    # 3. If candidates exist, call Gemini semantic dedup
    if candidate_clusters:
        prompt_data = {
            "issue": {
                "issue_type": issue.issue_type,
                "description": issue.description,
                "user_note": issue.user_note
            },
            "nearby_clusters": [
                {
                    "id": c.id,
                    "area_label": c.area_label,
                    "descriptions": [i.description for i in c_issues if i.description]
                }
                for c, c_issues in candidate_clusters
            ]
        }

        system_instruction = (
            "You are Agent 2 (Issue Verification) for CivicPulse. Analyze if the new issue report "
            "is a duplicate of any existing nearby clusters of the same issue type. "
            "A cluster represents a single real-world problem (e.g. a specific pothole, a specific broken streetlight). "
            "For each candidate cluster, you are provided its ID, area label, and issue descriptions. "
            "If the new issue describes the exact same real-world problem as one of the candidate clusters, "
            "set is_duplicate_of_cluster to that cluster's ID, confidence to your confidence level (0.0-1.0), "
            "and create_new_cluster to false. "
            "If it is not a duplicate or you are unsure, set is_duplicate_of_cluster to null, confidence accordingly, "
            "and create_new_cluster to true. "
            "Be conservative: if you are unsure (confidence in the 0.4-0.6 range, e.g. 0.5), "
            "default to creating a new cluster by setting create_new_cluster to true and is_duplicate_of_cluster to null."
        )

        try:
            # We call Gemini to evaluate semantic similarity
            gemini_result = await gemini_client.generate_structured_output(
                prompt=json.dumps(prompt_data),
                response_schema=Agent2Output,
                system_instruction=system_instruction
            )

            # Apply the confidence-band default-to-new rule:
            # - If confidence in [0.4, 0.6] range -> default to new cluster (create_new_cluster=True, is_duplicate_of_cluster=None)
            # - If confidence < 0.4 -> new cluster
            # - If create_new_cluster is True -> new cluster
            # - Otherwise if is_duplicate_of_cluster matches a valid candidate ID and confidence > 0.6 -> merge
            
            matched_cluster_id = gemini_result.is_duplicate_of_cluster
            confidence = gemini_result.confidence
            
            if 0.4 <= confidence <= 0.6:
                logger.info(f"agent_2_ambiguous_confidence | confidence={confidence} | defaulting to new cluster")
            elif confidence < 0.4:
                logger.info(f"agent_2_low_confidence | confidence={confidence} | creating new cluster")
            elif gemini_result.create_new_cluster:
                logger.info("agent_2_create_new_cluster_flag_true | creating new cluster")
            elif matched_cluster_id:
                # Find the matched cluster among candidates
                matched_cand = next((c for c, _ in candidate_clusters if c.id == matched_cluster_id), None)
                if matched_cand:
                    target_cluster = matched_cand
                    logger.info(f"agent_2_duplicate_match | cluster_id={matched_cluster_id} | confidence={confidence}")
                else:
                    logger.warning(f"agent_2_returned_invalid_cluster_id | id={matched_cluster_id}")
        except Exception as e:
            logger.error(f"agent_2_gemini_call_failed_using_failsafe | error={str(e)}")
            # Fail-safe behavior: log and create new cluster (do not raise exception here)
            target_cluster = None

    # 4. Create or update cluster
    if target_cluster:
        # Update existing cluster
        target_cluster.report_count += 1
        target_cluster.last_reported_at = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
        session.add(target_cluster)
        
        issue.cluster_id = target_cluster.id
        issue.status = "clustered"
        session.add(issue)
        session.commit()
        session.refresh(issue)
        logger.info(f"agent_2_cluster_updated | cluster_id={target_cluster.id} | report_count={target_cluster.report_count}")
    else:
        # Create new cluster
        area_label = issue.user_note[:100] if issue.user_note else f"Area near {issue.latitude:.4f}, {issue.longitude:.4f}"
        new_cluster = Cluster(
            area_label=area_label,
            center_lat=issue.latitude,
            center_lng=issue.longitude,
            report_count=1,
            first_reported_at=datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
            last_reported_at=datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
        )
        session.add(new_cluster)
        session.commit()
        session.refresh(new_cluster)
        
        issue.cluster_id = new_cluster.id
        issue.status = "clustered"
        session.add(issue)
        session.commit()
        session.refresh(issue)
        logger.info(f"agent_2_cluster_created | cluster_id={new_cluster.id}")
