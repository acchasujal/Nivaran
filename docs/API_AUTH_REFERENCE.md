# API Auth Reference

## Base Path
`/api/auth`

## Endpoints

### 1. User Login
- **`POST /api/auth/login`**
- **Request Body**:
  ```json
  {
    "email": "officer@mcgm.gov.in",
    "password": "CivicPulse2026!",
    "remember_me": true
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "access_token": "<jwt_access_token>",
    "refresh_token": "<jwt_refresh_token>",
    "token_type": "bearer",
    "expires_in": 3600,
    "user": {
      "id": "USR-OFFICER01",
      "email": "officer@mcgm.gov.in",
      "name": "Rajesh Kumar",
      "role": "officer",
      "department": "K-East Ward Municipal Office",
      "avatarUrl": null,
      "phone": "+919820012345",
      "is_verified": true
    }
  }
  ```

### 2. User Registration
- **`POST /api/auth/register`**
- **Request Body**:
  ```json
  {
    "email": "newcitizen@civicpulse.org",
    "password": "Password123!",
    "name": "Ananya Sen",
    "role": "citizen"
  }
  ```
- **Response (201 Created)**: User Profile JSON

### 3. Anonymous Session Creation
- **`POST /api/auth/anonymous`**
- **Response (200 OK)**: Token response for anonymous citizen flow.

### 4. Refresh Token Rotation
- **`POST /api/auth/refresh`**
- **Request Body** (optional if `civicpulse_refresh` cookie present):
  ```json
  {
    "refresh_token": "<current_refresh_token>"
  }
  ```
- **Response (200 OK)**: Rotated access & refresh tokens.

### 5. Logout Session
- **`POST /api/auth/logout`**
- **Headers**: `Authorization: Bearer <access_token>`

### 6. Logout All Sessions
- **`POST /api/auth/logout-all`**
- **Headers**: `Authorization: Bearer <access_token>`

### 7. Get Current User Profile
- **`GET /api/auth/me`**
- **Headers**: `Authorization: Bearer <access_token>`

### 8. Get Session Metadata
- **`GET /api/auth/session`**
- **Headers**: `Authorization: Bearer <access_token>`

### 9. List Active Sessions
- **`GET /api/auth/sessions`**
- **Headers**: `Authorization: Bearer <access_token>`

### 10. Terminate Session
- **`DELETE /api/auth/sessions/{id}`**
- **Headers**: `Authorization: Bearer <access_token>`
