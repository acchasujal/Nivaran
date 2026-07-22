"""
FastAPI Dependencies for Authentication, Token Extraction, and RBAC / ABAC Permissions.
"""
from typing import Optional, List, Callable
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from sqlmodel import Session as DBSession, select

from app.db import get_session
from app.models.user import User, Session
from app.utils.security import decode_jwt_token
from app.core.permissions import has_permission, ROLE_ADMIN, ROLE_OFFICER, ROLE_INSTITUTION, ROLE_EVALUATION

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)

def get_optional_user(
    request: Request,
    token: Optional[str] = Depends(oauth2_scheme),
    db: DBSession = Depends(get_session)
) -> Optional[User]:
    """Retrieve user if valid Bearer token provided, else None."""
    if not token:
        # Check header manually if scheme didn't extract
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]

    if not token:
        return None

    payload = decode_jwt_token(token)
    if not payload or payload.get("type") != "access":
        return None

    user_id = payload.get("sub")
    if not user_id:
        return None

    user = db.exec(select(User).where(User.id == user_id)).first()
    if not user or not user.is_active:
        return None

    return user

def get_current_user(
    user: Optional[User] = Depends(get_optional_user)
) -> User:
    """Retrieve authenticated active user, throwing 401 Unauthorized if missing."""
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user

def require_roles(allowed_roles: List[str]):
    """Dependency factory checking if authenticated user has one of the allowed roles."""
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Operation not permitted. Required role: {', '.join(allowed_roles)}"
            )
        return current_user
    return role_checker

def require_permission(permission: str):
    """Dependency factory checking if authenticated user's role grants specific permission."""
    def permission_checker(current_user: User = Depends(get_current_user)) -> User:
        if not has_permission(current_user.role, permission):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Operation not permitted. Missing permission: {permission}"
            )
        return current_user
    return permission_checker

# Specialized Role Dependencies
require_admin = require_roles([ROLE_ADMIN])
require_officer = require_roles([ROLE_OFFICER, ROLE_ADMIN])
require_institution = require_roles([ROLE_INSTITUTION, ROLE_ADMIN])
require_evaluation = require_roles([ROLE_EVALUATION, ROLE_ADMIN])
