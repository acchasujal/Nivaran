# Session Management & Device Tracking

## Overview
CivicPulse tracks active sessions and device footprints for authenticated users to enforce session security and allow users/admins to audit or revoke sessions.

## Session Model (`device_sessions`)
- **`id`**: Unique session string (e.g. `SES-A1B2C3D4E5F6`).
- **`user_id`**: User owner ID.
- **`token_jti`**: Unique JWT ID of associated refresh token.
- **`ip_address`**: Client IP address at login/refresh.
- **`user_agent`**: User-Agent header string.
- **`device_type`**: Device category (`browser`, `mobile`, `api`).
- **`is_active`**: Active status boolean flag.
- **`created_at`**: Timestamp of session initiation.
- **`last_activity_at`**: Timestamp of last refresh/token exchange.

## Session Operations
- `GET /api/auth/sessions`: List all active device sessions for the authenticated user.
- `DELETE /api/auth/sessions/{id}`: Terminate specific device session by ID.
- `POST /api/auth/logout`: Revoke current active session.
- `POST /api/auth/logout-all`: Instantly revoke all active sessions for the current user across all devices.
