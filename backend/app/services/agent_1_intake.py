from typing import Optional, List, Literal
from pydantic import BaseModel, Field
from app.services.gemini_client import GeminiClient

class Agent1Output(BaseModel):
    issue_type: Literal["road_damage", "lighting", "water", "waste", "other"]
    severity: int = Field(..., ge=1, le=5)
    description: str = Field(..., max_length=280)
    credibility_score: float = Field(..., ge=0.0, le=1.0)
    image_flags: List[Literal["clear", "blurry", "duplicate_visual", "low_confidence"]]

async def analyze_issue_photo(
    photo_bytes: bytes,
    mime_type: str,
    user_note: Optional[str] = None,
    gemini_client: Optional[GeminiClient] = None
) -> Agent1Output:
    """
    Invokes Gemini Vision via GeminiClient to understand and classify the reported civic issue.
    """
    if gemini_client is None:
        gemini_client = GeminiClient()

    prompt = "Classify this civic infrastructure issue."
    if user_note:
        prompt += f"\nUser Note: {user_note}"

    system_instruction = (
        "You are Agent 1 (Issue Understanding) for CivicPulse. Analyze the provided image of a civic issue. "
        "Provide a structured classification. Assess the severity (1-5), describe the issue in <= 280 characters, "
        "and calculate a credibility score (0.0-1.0) based strictly on image quality, clarity, and classification confidence."
    )

    return await gemini_client.generate_structured_output(
        prompt=prompt,
        response_schema=Agent1Output,
        system_instruction=system_instruction,
        image_data=photo_bytes,
        image_mime_type=mime_type
    )
