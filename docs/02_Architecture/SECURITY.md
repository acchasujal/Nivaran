# CivicPulse: Security Policy

This document defines the security controls, data ingestion sanitization processes, API rate limit rules, and server hardening parameters for CivicPulse.

---

## 1. Data Ingestion & Media Sanitization

### 1.1 EXIF Metadata Stripping
*   **Action:** All uploaded civic evidence photos are automatically processed upon receipt.
*   **Detail:** GPS tags, camera model details, timestamp headers, and general EXIF metadata are stripped using Pillow before files are written to local disk or GCS. This prevents location doxxing of anonymous reporters.
*   **Fallback:** Coordinates are captured explicitly via browser Geolocation APIs or manual pin drops, never implicitly read from files.

### 1.2 Image Dimension & Format Validation
*   **Resolution Floor:** Minimum dimensions of `300x300px` are required to maintain evidence quality.
*   **Resolution Ceiling:** Maximum dimensions of `4096x4096px` are enforced to prevent CPU/RAM exhaustion attacks (such as image pixel flood payloads).
*   **File Size Limit:** Supported up to `8MB` per upload. Only `JPEG`, `PNG`, and `WEBP` formats are accepted.

---

## 2. API Protection & Rate Limiting

### 2.1 Token-Bucket Rate Limiting
*   **Intake Endpoint:** `POST /api/issues` is protected by a token-bucket rate limiter.
*   **Capacity:** Configured to a max burst of 10 requests, refilling at a rate of 1 token per minute per IP address.
*   **Failure Code:** `429 Too Many Requests`.

### 2.2 Cross-Origin Resource Sharing (CORS) Lockdown
*   **Frontend Origin:** Dynamic lockdown restricted to origins specified in the `FRONTEND_ORIGIN` environment variable.
*   **Credentials:** `Access-Control-Allow-Credentials` set to `true` with strict allowed headers (`Content-Type`, `Authorization`).

---

## 3. Server Hardening & Security Headers

Every HTTP response from the FastAPI engine carries the following security headers:
*   `X-Content-Type-Options: nosniff` (Prevents MIME-type sniffing).
*   `X-Frame-Options: DENY` (Mitigates clickjacking attacks).
*   `X-XSS-Protection: 1; mode=block` (Enables browser cross-site scripting filters).
*   `Content-Security-Policy (CSP)` (Restricts resource load vectors to self and trusted API subdomains).
*   `Strict-Transport-Security (HSTS)` (Enforces SSL connections for all subdomains).
