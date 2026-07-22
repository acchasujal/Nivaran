"""
Authentication & Session Management API Router.
"""
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field
from fastapi import APIRouter, Depends, HTTPException, status, Request, Response
from sqlmodel import Session as DBSession, select

from app.db import get_session
from app.models.user import User, Session
from app.services.auth_service import AuthService
from app.dependencies.auth_deps import get_current_user, get_optional_user, require_admin

router = APIRouter(prefix="/auth", tags=["Authentication & Sessions"])

# Pydantic Request / Response Schemas
class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    remember_me: Optional[bool] = False

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    name: str = Field(min_length=2)
    role: Optional[str] = "citizen"
    department: Optional[str] = None
    phone: Optional[str] = None

class RefreshTokenRequest(BaseModel):
    refresh_token: str

class UserProfileResponse(BaseModel):
    id: str
    email: str
    name: str
    role: str
    department: Optional[str] = None
    avatarUrl: Optional[str] = None
    phone: Optional[str] = None
    is_verified: bool = False

class AuthTokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserProfileResponse

class SessionResponse(BaseModel):
    id: str
    user_id: str
    token_jti: str
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    device_type: Optional[str] = "browser"
    is_active: bool
    created_at: str
    last_activity_at: str

@router.post("/login", response_model=AuthTokenResponse)
def login(
    req: LoginRequest,
    request: Request,
    response: Response,
    db: DBSession = Depends(get_session)
):
    """Authenticate user with email/password and return JWT tokens and profile."""
    ip = request.client.host if request.client else "127.0.0.1"
    agent = request.headers.get("User-Agent", "unknown")

    user = AuthService.authenticate_user(db, email=req.email, password=req.password, ip_address=ip, user_agent=agent)
    tokens = AuthService.create_user_tokens(db, user=user, ip_address=ip, user_agent=agent)

    # Set HTTP-Only Refresh Token Cookie for web browsers
    cookie_max_age = 7 * 24 * 3600 if req.remember_me else None
    response.set_cookie(
        key="civicpulse_refresh",
        value=tokens["refresh_token"],
        httponly=True,
        secure=False, # Set True in SSL production
        samesite="lax",
        max_age=cookie_max_age
    )
    return tokens

@router.post("/register", response_model=UserProfileResponse, status_code=status.HTTP_201_CREATED)
def register(
    req: RegisterRequest,
    db: DBSession = Depends(get_session)
):
    """Register a new citizen or officer user account."""
    user = AuthService.register_user(
        db,
        email=req.email,
        password=req.password,
        name=req.name,
        role=req.role or "citizen",
        department=req.department,
        phone=req.phone
    )
    return UserProfileResponse(
        id=user.id,
        email=user.email,
        name=user.name,
        role=user.role,
        department=user.department,
        avatarUrl=user.avatar_url,
        phone=user.phone,
        is_verified=user.is_verified
    )

@router.post("/anonymous", response_model=AuthTokenResponse)
def anonymous_login(
    request: Request,
    db: DBSession = Depends(get_session)
):
    """Issue temporary JWT session token for anonymous citizen submission flow."""
    ip = request.client.host if request.client else "127.0.0.1"
    agent = request.headers.get("User-Agent", "unknown")
    return AuthService.create_anonymous_session(db, ip_address=ip, user_agent=agent)

@router.post("/refresh", response_model=AuthTokenResponse)
def refresh_token(
    req: Optional[RefreshTokenRequest] = None,
    request: Request = None,
    db: DBSession = Depends(get_session)
):
    """Rotate Refresh Token and return new Access + Refresh Token pair."""
    token_str = None
    if req and req.refresh_token:
        token_str = req.refresh_token
    elif request:
        token_str = request.cookies.get("civicpulse_refresh")

    if not token_str:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token is required (body or cookie)"
        )

    ip = request.client.host if request and request.client else "127.0.0.1"
    agent = request.headers.get("User-Agent", "unknown") if request else "unknown"

    return AuthService.refresh_tokens(db, refresh_token_str=token_str, ip_address=ip, user_agent=agent)

@router.post("/logout")
def logout(
    req: Optional[RefreshTokenRequest] = None,
    request: Request = None,
    response: Response = None,
    current_user: User = Depends(get_current_user),
    db: DBSession = Depends(get_session)
):
    """Logout current session by revoking refresh token."""
    token_str = None
    if req and req.refresh_token:
        token_str = req.refresh_token
    elif request:
        token_str = request.cookies.get("civicpulse_refresh")

    if token_str:
        AuthService.revoke_refresh_token(db, token_str)

    if response:
        response.delete_cookie(key="civicpulse_refresh")

    return {"status": "success", "message": "Successfully logged out of session"}

@router.post("/logout-all")
def logout_all(
    response: Response = None,
    current_user: User = Depends(get_current_user),
    db: DBSession = Depends(get_session)
):
    """Revoke all active refresh tokens and terminate all active sessions for current user."""
    count = AuthService.revoke_all_user_sessions(db, current_user.id)
    if response:
        response.delete_cookie(key="civicpulse_refresh")

    return {"status": "success", "terminated_sessions": count, "message": "All sessions terminated"}

@router.get("/me", response_model=UserProfileResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """Return currently authenticated user profile."""
    return UserProfileResponse(
        id=current_user.id,
        email=current_user.email,
        name=current_user.name,
        role=current_user.role,
        department=current_user.department,
        avatarUrl=current_user.avatar_url,
        phone=current_user.phone,
        is_verified=current_user.is_verified
    )

@router.get("/session")
def get_current_session_info(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: DBSession = Depends(get_session)
):
    """Return current session metadata."""
    auth_header = request.headers.get("Authorization", "")
    ip = request.client.host if request.client else "127.0.0.1"
    agent = request.headers.get("User-Agent", "unknown")
    
    return {
        "user_id": current_user.id,
        "email": current_user.email,
        "role": current_user.role,
        "ip_address": ip,
        "user_agent": agent,
        "authenticated": True
    }

@router.get("/sessions", response_model=List[SessionResponse])
def list_active_sessions(
    current_user: User = Depends(get_current_user),
    db: DBSession = Depends(get_session)
):
    """List all active device sessions for current user."""
    sessions = db.exec(
        select(Session).where(Session.user_id == current_user.id, Session.is_active == True)
    ).all()

    res = []
    for s in sessions:
        res.append(SessionResponse(
            id=s.id,
            user_id=s.user_id,
            token_jti=s.token_jti,
            ip_address=s.ip_address,
            user_agent=s.user_agent,
            device_type=s.device_type,
            is_active=s.is_active,
            created_at=s.created_at.isoformat(),
            last_activity_at=s.last_activity_at.isoformat()
        ))
    return res

@router.delete("/sessions/{session_id}")
def terminate_session(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: DBSession = Depends(get_session)
):
    """Terminate a specific active session by ID."""
    session = db.exec(select(Session).where(Session.id == session_id)).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Check ownership unless admin
    if session.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to terminate this session")

    session.is_active = False
    db.add(session)

    # Revoke associated refresh token if present
    rf = db.exec(select(AuthService).where(AuthService == session.token_jti)).first()
    db.commit()

    return {"status": "success", "message": f"Session {session_id} terminated"}
