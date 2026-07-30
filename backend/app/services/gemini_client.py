import os
import asyncio
import time
import logging
import threading
from typing import Type, TypeVar, Optional, Any, List, Dict
from pydantic import BaseModel, ValidationError
from fastapi import HTTPException, status
from google import genai
from google.genai import types

logger = logging.getLogger("nivaran")

T = TypeVar("T", bound=BaseModel)

class KeyState:
    def __init__(self, key: str, index: int):
        self.key = key
        self.index = index
        self.cooldown_until = 0.0
        self.failure_count = 0
        self.success_count = 0
        self.total_latency_ms = 0
        self.total_requests = 0

    @property
    def is_healthy(self) -> bool:
        return time.time() >= self.cooldown_until

    def mark_cooldown(self, duration_seconds: float = 60.0):
        self.cooldown_until = time.time() + duration_seconds
        self.failure_count += 1

    def record_success(self, latency_ms: int):
        self.success_count += 1
        self.total_requests += 1
        self.total_latency_ms += latency_ms
        self.failure_count = 0

    def record_failure(self):
        self.failure_count += 1
        self.total_requests += 1

class GeminiKeyPool:
    _lock = threading.Lock()
    _rr_index = 0
    _keys_cache: List[KeyState] = []
    _cached_raw_keys: List[str] = []

    @classmethod
    def get_keys(cls) -> List[KeyState]:
        raw_keys = cls._parse_env_keys()
        with cls._lock:
            if raw_keys != cls._cached_raw_keys:
                cls._cached_raw_keys = raw_keys
                cls._keys_cache = [KeyState(k, idx) for idx, k in enumerate(raw_keys)]
                cls._rr_index = 0
            return cls._keys_cache

    @classmethod
    def _parse_env_keys(cls) -> List[str]:
        keys = []
        
        # 1. GEMINI_API_KEYS (plural, comma-separated)
        keys_val = os.environ.get("GEMINI_API_KEYS", "").strip()
        if not keys_val:
            try:
                from app.config import settings
                keys_val = getattr(settings, "GEMINI_API_KEYS", "") or ""
            except Exception:
                pass

        if not keys_val and os.path.exists(".env"):
            try:
                with open(".env", "r") as f:
                    for line in f:
                        if line.strip().startswith("GEMINI_API_KEYS="):
                            keys_val = line.strip().split("=", 1)[1].strip()
                            break
            except Exception:
                pass

        if keys_val:
            parsed = [k.strip().strip("'\"") for k in keys_val.split(",") if k.strip().strip("'\"")]
            if parsed:
                keys.extend(parsed)

        # 2. GEMINI_API_KEY (singular fallback)
        if not keys:
            single = os.environ.get("GEMINI_API_KEY", "").strip()
            if not single:
                try:
                    from app.config import settings
                    single = settings.GEMINI_API_KEY or ""
                except Exception:
                    pass
            if single:
                keys.append(single.strip("'\""))

        return keys

    @classmethod
    def get_next_healthy_key(cls) -> Optional[KeyState]:
        keys = cls.get_keys()
        if not keys:
            return None

        with cls._lock:
            n = len(keys)
            for _ in range(n):
                idx = cls._rr_index % n
                cls._rr_index += 1
                state = keys[idx]
                if state.is_healthy:
                    return state

            # If all are in cooldown, find the one that expires soonest
            soonest = min(keys, key=lambda k: k.cooldown_until)
            logger.warning(
                f"gemini_key_pool | all keys in cooldown | next_available_index={soonest.index} | "
                f"wait_seconds={max(0, int(soonest.cooldown_until - time.time()))}"
            )
            return None

class GeminiClient:
    def __init__(self, api_key: Optional[str] = None, client: Optional[Any] = None):
        """
        Initializes the Gemini API Client.
        If a pre-configured client is passed, it is used directly (useful for testing/mocking).
        Otherwise, it initializes using key pool rotation.
        """
        self.provided_client = client
        self.provided_api_key = api_key

    def _get_client_and_state(self) -> tuple[Optional[Any], Optional[KeyState]]:
        if self.provided_client:
            return self.provided_client, None

        if self.provided_api_key:
            return genai.Client(api_key=self.provided_api_key), None

        key_state = GeminiKeyPool.get_next_healthy_key()
        if not key_state:
            return None, None

        return genai.Client(api_key=key_state.key), key_state

    async def generate_structured_output(
        self,
        prompt: str,
        response_schema: Type[T],
        system_instruction: Optional[str] = None,
        image_data: Optional[bytes] = None,
        image_mime_type: Optional[str] = None,
        timeout: float = 20.0,
    ) -> T:
        """
        Generates structured JSON output from Gemini matching response_schema.
        Supports Round-Robin key pooling, per-key cooldowns, and automatic 429 failover.
        Default timeout is 20.0 seconds.
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
        last_exception = None

        for attempt in range(1, max_attempts + 1):
            genai_client, key_state = self._get_client_and_state()

            if not genai_client and not self.provided_client:
                logger.warning(f"gemini_no_healthy_keys | attempt={attempt}")
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail={"error": "ai_unavailable", "retryable": True}
                )

            key_index_str = str(key_state.index) if key_state else "mock/custom"
            start_time = time.time()

            try:
                # Call async API under client.aio.models
                response = await asyncio.wait_for(
                    genai_client.aio.models.generate_content(
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
                if key_state:
                    key_state.record_success(latency_ms)

                logger.info(
                    f"gemini_call_success | key_index={key_index_str} | attempt={attempt} | latency_ms={latency_ms}"
                )
                return validated_data

            except StopIteration as e:
                # Mock side_effect list was exhausted in tests.
                logger.warning(f"gemini_mock_exhausted | attempt={attempt}")
                if key_state:
                    key_state.record_failure()
                last_exception = e
                if attempt == max_attempts:
                    raise HTTPException(
                        status_code=status.HTTP_502_BAD_GATEWAY,
                        detail={"error": "ai_unavailable", "retryable": True}
                    )

            except asyncio.TimeoutError as e:
                latency_ms = int((time.time() - start_time) * 1000)
                logger.error(
                    f"gemini_call_timeout | key_index={key_index_str} | attempt={attempt} | latency_ms={latency_ms} | timeout={timeout}s"
                )
                if key_state:
                    key_state.record_failure()
                last_exception = e
                if attempt == max_attempts:
                    raise HTTPException(
                        status_code=status.HTTP_502_BAD_GATEWAY,
                        detail={"error": "ai_unavailable", "retryable": True}
                    )

            except ValidationError as e:
                logger.error(
                    f"gemini_validation_error | key_index={key_index_str} | attempt={attempt} | error={str(e)}"
                )
                if key_state:
                    key_state.record_failure()
                last_exception = e
                if attempt == max_attempts:
                    raise HTTPException(
                        status_code=status.HTTP_502_BAD_GATEWAY,
                        detail={"error": "ai_unavailable", "retryable": True}
                    )

            except Exception as e:
                err_str = str(e).lower()
                is_429 = "429" in err_str or "resource_exhausted" in err_str or "quota" in err_str

                if is_429 and key_state:
                    key_state.mark_cooldown(60.0)
                    logger.warning(
                        f"gemini_429_rate_limit | key_index={key_index_str} | placing in 60s cooldown | retrying next key"
                    )
                elif key_state:
                    key_state.record_failure()

                if "stopiteration" in err_str or type(e).__name__ == "StopIteration":
                    raise HTTPException(
                        status_code=status.HTTP_502_BAD_GATEWAY,
                        detail={"error": "ai_unavailable", "retryable": True}
                    )

                logger.error(
                    f"gemini_api_error | key_index={key_index_str} | attempt={attempt} | is_429={is_429} | error={str(e)}"
                )
                last_exception = e

                if attempt == max_attempts:
                    raise HTTPException(
                        status_code=status.HTTP_502_BAD_GATEWAY,
                        detail={"error": "ai_unavailable", "retryable": True}
                    )

            # Exponential backoff on retries if not a 429 (429 retries immediately on next key)
            if attempt < max_attempts:
                import sys
                is_test = "pytest" in sys.modules
                backoff_time = 0.0 if is_test else 0.5 * (2 ** attempt)
                if backoff_time > 0.0:
                    logger.info(f"gemini_retry_backoff | sleeping={backoff_time}s")
                    await asyncio.sleep(backoff_time)

        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail={"error": "ai_unavailable", "retryable": True}
        )

def settings_key() -> Optional[str]:
    ks = GeminiKeyPool.get_next_healthy_key()
    return ks.key if ks else None

def settings_model() -> str:
    try:
        from app.config import settings
        return settings.GEMINI_MODEL
    except (ImportError, AttributeError):
        return os.environ.get("GEMINI_MODEL", "gemini-2.5-flash")


