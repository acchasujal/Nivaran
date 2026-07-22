"""
Authentication, Token Rotation, Session Tracking, and Authorization Service.
"""
from typing import Optional, Dict, Any, List, Tuple
from datetime import datetime, timezone, timedelta
from sqlmodel import Session as DBSession, select
from fastapi import HTTPException, status

from app.models.user import User, RefreshToken, Session, LoginHistory
from app.core.permissions import (
    get_role_permissions,
    ROLE_CITIZEN,
    ROLE_ANONYMOUS,
    ROLE_OFFICER,
    ROLE_ADMIN,
    ROLE_INSTITUTION
)
from app.utils.security import (
    verify_password,
    hash_password,
    create_access_token,
    create_refresh_token,
    decode_jwt_token,
    hash_token
)

class AuthService:

    @staticmethod
    def authenticate_user(db: DBSession, email: str, password: str, ip_address: Optional[str] = None, user_agent: Optional[str] = None) -> User:
        """Authenticate user with email and password, logging history."""
        user = db.exec(select(User).where(User.email == email)).first()
        
        if not user:
            # Log failed login attempt
            log = LoginHistory(
                email=email,
                status="user_not_found",
                ip_address=ip_address,
                user_agent=user_agent
            )
            db.add(log)
            db.commit()
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )

        if not user.is_active:
            log = LoginHistory(
                user_id=user.id,
                email=email,
                status="account_disabled",
                ip_address=ip_address,
                user_agent=user_agent
            )
            db.add(log)
            db.commit()
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User account is inactive"
            )

        if not verify_password(password, user.hashed_password):
            log = LoginHistory(
                user_id=user.id,
                email=email,
                status="failed_password",
                ip_address=ip_address,
                user_agent=user_agent
            )
            db.add(log)
            db.commit()
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )

        # Log successful login
        user.last_login_at = datetime.now(timezone.utc)
        db.add(user)

        log = LoginHistory(
            user_id=user.id,
            email=email,
            status="success",
            ip_address=ip_address,
            user_agent=user_agent
        )
        db.add(log)
        db.commit()
        db.refresh(user)
        return user

    @staticmethod
    def create_user_tokens(
        db: DBSession,
        user: User,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        device_info: Optional[str] = None
    ) -> Dict[str, Any]:
        """Generate access and refresh tokens, persist refresh token and device session."""
        permissions = get_role_permissions(user.role)
        
        access_token, access_jti, access_exp = create_access_token(
            user_id=user.id,
            role=user.role,
            permissions=permissions,
            email=user.email,
            name=user.name,
            department=user.department
        )

        refresh_token_str, refresh_jti, refresh_exp = create_refresh_token(
            user_id=user.id,
            device_info=device_info
        )

        # Persist Refresh Token
        rf_token = RefreshToken(
            id=refresh_jti,
            user_id=user.id,
            token_hash=hash_token(refresh_token_str),
            expires_at=refresh_exp,
            is_revoked=False,
            device_info=device_info or user_agent,
            ip_address=ip_address
        )
        db.add(rf_token)

        # Persist / Update Device Session
        session = Session(
            user_id=user.id,
            token_jti=refresh_jti,
            ip_address=ip_address,
            user_agent=user_agent,
            device_type=device_info or "browser",
            is_active=True
        )
        db.add(session)
        db.commit()

        return {
            "access_token": access_token,
            "refresh_token": refresh_token_str,
            "token_type": "bearer",
            "expires_in": int((access_exp - datetime.now(timezone.utc)).total_seconds()),
            "user": {
                "id": user.id,
                "email": user.email,
                "name": user.name,
                "role": user.role,
                "department": user.department,
                "avatarUrl": user.avatar_url,
                "phone": user.phone,
                "is_verified": user.is_verified,
            }
        }

    @staticmethod
    def refresh_tokens(
        db: DBSession,
        refresh_token_str: str,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> Dict[str, Any]:
        """Validate refresh token and execute Token Rotation (reissuing access and refresh tokens)."""
        payload = decode_jwt_token(refresh_token_str)
        if not payload or payload.get("type") != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired refresh token"
            )

        jti = payload.get("jti")
        user_id = payload.get("sub")

        # Check token record in database
        stored_rf = db.exec(select(RefreshToken).where(RefreshToken.id == jti)).first()
        if not stored_rf:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Refresh token not found or revoked"
            )

        # Security check: reuse of revoked token indicates compromise -> revoke ALL sessions for user!
        if stored_rf.is_revoked:
            AuthService.revoke_all_user_sessions(db, user_id)
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Revoked refresh token reuse detected. All sessions terminated."
            )

        # Check expiration
        now = datetime.now(timezone.utc)
        expires_at = stored_rf.expires_at
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        if expires_at < now:
            stored_rf.is_revoked = True
            db.add(stored_rf)
            db.commit()
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Refresh token expired"
            )

        # Fetch User
        user = db.exec(select(User).where(User.id == user_id)).first()
        if not user or not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User inactive or removed"
            )

        # Execute Rotation: Revoke old token, issue new tokens
        permissions = get_role_permissions(user.role)
        new_access_token, _, access_exp = create_access_token(
            user_id=user.id,
            role=user.role,
            permissions=permissions,
            email=user.email,
            name=user.name,
            department=user.department
        )

        new_refresh_token_str, new_refresh_jti, new_refresh_exp = create_refresh_token(
            user_id=user.id,
            device_info=stored_rf.device_info
        )

        # Mark old token as revoked & replaced
        stored_rf.is_revoked = True
        stored_rf.replaced_by_jti = new_refresh_jti
        db.add(stored_rf)

        # Deactivate associated old session
        old_session = db.exec(select(Session).where(Session.token_jti == jti)).first()
        if old_session:
            old_session.is_active = False
            db.add(old_session)

        # Add new refresh token & session
        new_rf_token = RefreshToken(
            id=new_refresh_jti,
            user_id=user.id,
            token_hash=hash_token(new_refresh_token_str),
            expires_at=new_refresh_exp,
            is_revoked=False,
            device_info=stored_rf.device_info,
            ip_address=ip_address or stored_rf.ip_address
        )
        db.add(new_rf_token)

        new_session = Session(
            user_id=user.id,
            token_jti=new_refresh_jti,
            ip_address=ip_address or stored_rf.ip_address,
            user_agent=user_agent,
            device_type=stored_rf.device_info or "browser",
            is_active=True
        )
        db.add(new_session)
        db.commit()

        return {
            "access_token": new_access_token,
            "refresh_token": new_refresh_token_str,
            "token_type": "bearer",
            "expires_in": int((access_exp - now).total_seconds()),
            "user": {
                "id": user.id,
                "email": user.email,
                "name": user.name,
                "role": user.role,
                "department": user.department,
                "avatarUrl": user.avatar_url,
                "phone": user.phone,
                "is_verified": user.is_verified,
            }
        }

    @staticmethod
    def create_anonymous_session(db: DBSession, ip_address: Optional[str] = None, user_agent: Optional[str] = None) -> Dict[str, Any]:
        """Create or issue an anonymous citizen token without credentials."""
        import uuid
        anon_id = f"ANON-{uuid.uuid4().hex[:6].upper()}"
        anon_user = User(
            id=anon_id,
            email=f"{anon_id.lower()}@anonymous.civicpulse.org",
            name="Anonymous Citizen",
            role=ROLE_ANONYMOUS,
            is_active=True,
            is_verified=False
        )
        db.add(anon_user)
        db.commit()
        db.refresh(anon_user)

        return AuthService.create_user_tokens(db, anon_user, ip_address=ip_address, user_agent=user_agent, device_info="anonymous-session")

    @staticmethod
    def register_user(
        db: DBSession,
        email: str,
        password: str,
        name: str,
        role: str = ROLE_CITIZEN,
        department: Optional[str] = None,
        phone: Optional[str] = None,
        institution_id: Optional[str] = None
    ) -> User:
        """Register a new user account."""
        existing = db.exec(select(User).where(User.email == email)).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email address already registered"
            )

        hashed_pw = hash_password(password)
        new_user = User(
            email=email,
            hashed_password=hashed_pw,
            name=name,
            role=role,
            department=department,
            phone=phone,
            institution_id=institution_id,
            is_active=True,
            is_verified=True if role == ROLE_CITIZEN else False
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        return new_user

    @staticmethod
    def revoke_refresh_token(db: DBSession, refresh_token_str: str) -> bool:
        """Revoke a single refresh token and deactivate its session."""
        payload = decode_jwt_token(refresh_token_str)
        if not payload:
            return False
        jti = payload.get("jti")
        if not jti:
            return False

        rf = db.exec(select(RefreshToken).where(RefreshToken.id == jti)).first()
        if rf:
            rf.is_revoked = True
            db.add(rf)
        
        session = db.exec(select(Session).where(Session.token_jti == jti)).first()
        if session:
            session.is_active = False
            db.add(session)

        db.commit()
        return True

    @staticmethod
    def revoke_all_user_sessions(db: DBSession, user_id: str) -> int:
        """Revoke all active refresh tokens and terminate all active sessions for a user."""
        tokens = db.exec(select(RefreshToken).where(RefreshToken.user_id == user_id, RefreshToken.is_revoked == False)).all()
        for t in tokens:
            t.is_revoked = True
            db.add(t)

        sessions = db.exec(select(Session).where(Session.user_id == user_id, Session.is_active == True)).all()
        count = len(sessions)
        for s in sessions:
            s.is_active = False
            db.add(s)

        db.commit()
        return count
