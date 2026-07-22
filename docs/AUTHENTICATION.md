# CivicPulse Authentication & Security Architecture

## Overview
CivicPulse backend utilizes standard OAuth2 with JSON Web Tokens (JWT) for authentication and role-based / attribute-based access control (RBAC / ABAC).

## Key Components

### 1. Token Strategy
- **Access Tokens**: Short-lived (60 min by default), signed with HS256 algorithm. Contains user identity (`sub`), assigned role (`role`), and full permission claim list (`permissions`).
- **Refresh Tokens**: Long-lived (7 days by default), stored hashed (SHA-256) in the database for instant session tracking and instant revocation.

### 2. Token Rotation & Reuse Protection
When `/api/auth/refresh` is invoked with a valid refresh token:
1. The old refresh token is marked as `is_revoked = True`.
2. A new access token and a brand new refresh token are generated.
3. If an already revoked refresh token is presented, the system detects compromise and **instantly revokes ALL active sessions and refresh tokens for that user**.

### 3. Hashing Standards
- User passwords are hashed using `passlib` with `bcrypt` (cost factor tuned for production security).
- Refresh tokens are hashed using SHA-256 before persistence in database table `refresh_tokens`.

### 4. HTTP-Only Cookie Support
When logging in via web browsers, the refresh token is delivered in a `SameSite=Lax`, `HttpOnly` cookie (`civicpulse_refresh`) in addition to JSON response payloads.
