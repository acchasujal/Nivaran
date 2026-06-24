import os
import asyncio
import time
import logging
from typing import Type, TypeVar, Optional, Any
from pydantic import BaseModel, ValidationError
from fastapi import HTTPException, status
from google import genai
from google.genai import types

logger = logging.getLogger("civicpulse")

T = TypeVar("T", bound=BaseModel)

class GeminiClient:
    def __init__(self, api_key: Optional[str] = None, client: Optional[Any] = None):
        """
        Initializes the Gemini API Client.
        If a pre-configured client is passed, it is used directly (useful for testing/mocking).
        Otherwise, it initializes a new genai.Client.
        """
        if client:
            self.client = client
        else:
            k = api_key or settings_key()
            if k:
                self.client = genai.Client(api_key=k)
            else:
                self.client = genai.Client()

    async def generate_structured_output(
        self,
        prompt: str,
        response_schema: Type[T],
        system_instruction: Optional[str] = None,
        image_data: Optional[bytes] = None,
        image_mime_type: Optional[str] = None,
        timeout: float = 15.0,
    ) -> T:
        """
        Generates structured JSON output from Gemini matching the Pydantic schema response_schema.
        Enforces a timeout of 15 seconds (default).
        Retries exactly once on validation failure or API error, then raises HTTPException 502.
        """
        contents = [prompt]
        if image_data:
            mime = image_mime_type or "image/jpeg"
            contents.append(
                types.Part.from_bytes(
                    data=image_data,
                    mime_type=mime
                )
            )

        config = types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=response_schema,
        )
        if system_instruction:
            config.system_instruction = system_instruction

        max_attempts = 2
        for attempt in range(1, max_attempts + 1):
            start_time = time.time()
            try:
                # Call async API under client.aio.models
                response = await asyncio.wait_for(
                    self.client.aio.models.generate_content(
                        model=settings_model(),
                        contents=contents,
                        config=config,
                    ),
                    timeout=timeout
                )

                if not response.text:
                    raise ValueError("Gemini returned empty response text")

                # Parse and validate the response against response_schema
                validated_data = response_schema.model_validate_json(response.text)

                latency_ms = int((time.time() - start_time) * 1000)
                logger.info(
                    f"gemini_call_success | attempt={attempt} | latency_ms={latency_ms}"
                )
                return validated_data

            except asyncio.TimeoutError:
                logger.error(
                    f"gemini_call_timeout | attempt={attempt} | timeout={timeout}s"
                )
                if attempt == max_attempts:
                    raise HTTPException(
                        status_code=status.HTTP_502_BAD_GATEWAY,
                        detail={"error": "ai_unavailable", "retryable": True}
                    )
            except ValidationError as e:
                logger.error(
                    f"gemini_validation_error | attempt={attempt} | error={str(e)}"
                )
                if attempt == max_attempts:
                    raise HTTPException(
                        status_code=status.HTTP_502_BAD_GATEWAY,
                        detail={"error": "ai_unavailable", "retryable": True}
                    )
            except Exception as e:
                logger.error(
                    f"gemini_api_error | attempt={attempt} | error={str(e)}"
                )
                if attempt == max_attempts:
                    raise HTTPException(
                        status_code=status.HTTP_502_BAD_GATEWAY,
                        detail={"error": "ai_unavailable", "retryable": True}
                    )

def settings_key() -> Optional[str]:
    try:
        from app.config import settings
        return settings.GEMINI_API_KEY
    except ImportError:
        return os.environ.get("GEMINI_API_KEY")

def settings_model() -> str:
    try:
        from app.config import settings
        return settings.GEMINI_MODEL
    except (ImportError, AttributeError):
        return os.environ.get("GEMINI_MODEL", "gemini-2.0-flash")

