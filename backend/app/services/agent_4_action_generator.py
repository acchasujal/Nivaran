import logging
import time
import json
from typing import Optional, List
from sqlmodel import Session, select

from pydantic import BaseModel, Field, model_validator
from app.models.action_draft import ActionDraft
from app.models.issue import Issue
from app.services.gemini_client import GeminiClient
from app.services.agent_3_impact import generate_merged_impact_and_drafts

logger = logging.getLogger("civicpulse")

class Agent4Output(BaseModel):
    complaint_draft: str = Field(..., description="Evidence-based formal complaint draft")
    rti_draft: str = Field(..., description="Formal RTI (Right to Information) draft. MUST begin with disclaimer.")
    community_summary: str = Field(..., description="Public-facing community evidence summary")

    @model_validator(mode="after")
    def validate_content(self) -> 'Agent4Output':
        if not self.rti_draft.strip().startswith("AI-generated draft. Review before submission."):
            logger.warning("agent_4_validation_failure | RTI draft did not start with disclaimer")
            raise ValueError("RTI draft content must start with: 'AI-generated draft. Review before submission.'")
        return self

async def generate_action_drafts(
    cluster_id: str,
    session: Session,
    gemini_client: Optional[GeminiClient] = None,
    force_regenerate: bool = False
) -> List[ActionDraft]:
    start_time = time.time()
    issue_id = "N/A"
    try:
        issues = session.exec(select(Issue).where(Issue.cluster_id == cluster_id)).all()
        if issues:
            issue_id = issues[0].id

        drafts = await _generate_action_drafts_impl(
            cluster_id=cluster_id,
            session=session,
            gemini_client=gemini_client,
            force_regenerate=force_regenerate
        )
        latency_ms = int((time.time() - start_time) * 1000)
        logger.info(json.dumps({
            "agent": "Agent4",
            "issue_id": issue_id,
            "latency_ms": latency_ms,
            "success": True
        }))
        return drafts
    except Exception as e:
        latency_ms = int((time.time() - start_time) * 1000)
        logger.info(json.dumps({
            "agent": "Agent4",
            "issue_id": issue_id,
            "latency_ms": latency_ms,
            "success": False
        }))
        raise e

async def _generate_action_drafts_impl(
    cluster_id: str,
    session: Session,
    gemini_client: Optional[GeminiClient] = None,
    force_regenerate: bool = False
) -> List[ActionDraft]:
    """
    Agent 4: Action Generator.
    Delegates to the merged analysis function to retrieve or generate draft briefs.
    """
    _, drafts = await generate_merged_impact_and_drafts(
        cluster_id=cluster_id,
        session=session,
        gemini_client=gemini_client,
        force_regenerate=force_regenerate
    )
    return drafts
