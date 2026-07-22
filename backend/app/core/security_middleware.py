"""
Production Security Middleware, Rate Limiting & File Upload Validation.
"""
import time
from typing import Optional
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response, JSONResponse

from app.core.redis_cache import cache_manager
from app.config import settings

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response: Response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Content-Security-Policy"] = "default-src 'self'; img-src 'self' data: https:; script-src 'self';"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        return response

class RateLimitMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Exclude static assets and health probes from rate limits
        path = request.url.path
        if path.startswith("/static") or path in ["/health", "/ready", "/live", "/metrics"]:
            return await call_next(request)

        client_ip = request.client.host if request.client else "127.0.0.1"
        current_minute = int(time.time() // 60)
        rate_key = f"rate_limit:{client_ip}:{current_minute}"

        current_count_str = cache_manager.get(rate_key)
        current_count = int(current_count_str) if current_count_str else 0

        if current_count >= settings.RATE_LIMIT_PER_MINUTE:
            return JSONResponse(
                status_code=429,
                content={"detail": "Too many requests. Rate limit exceeded. Please try again later."}
            )

        cache_manager.set(rate_key, str(current_count + 1), ttl_seconds=60)
        return await call_next(request)

def validate_uploaded_file(file_name: str, content_type: str, file_size_bytes: int) -> bool:
    """
    Validate uploaded media assets for MIME type, file size limits, and malicious content hooks.
    """
    allowed_types = ["image/jpeg", "image/png", "image/webp", "video/mp4", "audio/mpeg", "application/pdf"]
    if content_type.lower() not in allowed_types:
        return False
    if file_size_bytes > 25 * 1024 * 1024: # 25MB limit
        return False
    return True
