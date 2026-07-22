"""
Security utilities for password hashing, JWT creation, token validation, and revocation.
"""
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any, Tuple
import jwt
import hashlib
from passlib.context import CryptContext

from app.config import settings

# Password Hashing Context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    """Hash a plain text password using bcrypt."""
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: Optional[str]) -> bool:
    """Verify a plain password against its bcrypt hash."""
    if not hashed_password:
        return False
    try:
        return pwd_context.verify(plain_password, hashed_password)
    except Exception:
        return False

def hash_token(token: str) -> str:
    """SHA-256 hash of refresh token for secure database storage."""
    return hashlib.sha256(token.encode("utf-8")).hexdigest()

def create_access_token(
    user_id: str,
    role: str,
    permissions: list[str],
    email: Optional[str] = None,
    name: Optional[str] = None,
    department: Optional[str] = None,
    expires_delta: Optional[timedelta] = None
) -> Tuple[str, str, datetime]:
    """
    Generate a short-lived JWT Access Token.
    Returns (token_string, jti, expiry_datetime).
    """
    import uuid
    jti = f"AT-{uuid.uuid4().hex}"
    now = datetime.now(timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    payload = {
        "sub": user_id,
        "jti": jti,
        "email": email or "",
        "name": name or "",
        "role": role,
        "department": department or "",
        "permissions": permissions,
        "type": "access",
        "iss": settings.JWT_ISSUER,
        "aud": settings.JWT_AUDIENCE,
        "iat": int(now.timestamp()),
        "exp": int(expire.timestamp()),
    }

    token = jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    return token, jti, expire

def create_refresh_token(
    user_id: str,
    device_info: Optional[str] = None,
    expires_delta: Optional[timedelta] = None
) -> Tuple[str, str, datetime]:
    """
    Generate a long-lived JWT Refresh Token.
    Returns (token_string, jti, expiry_datetime).
    """
    import uuid
    jti = f"RT-{uuid.uuid4().hex}"
    now = datetime.now(timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)

    payload = {
        "sub": user_id,
        "jti": jti,
        "type": "refresh",
        "device_info": device_info or "unknown",
        "iss": settings.JWT_ISSUER,
        "aud": settings.JWT_AUDIENCE,
        "iat": int(now.timestamp()),
        "exp": int(expire.timestamp()),
    }

    token = jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    return token, jti, expire

def decode_jwt_token(token: str) -> Optional[Dict[str, Any]]:
    """Decode and validate signature & standard claims of a JWT."""
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
            audience=settings.JWT_AUDIENCE,
            issuer=settings.JWT_ISSUER,
        )
        return payload
    except jwt.PyJWTError:
        return None
