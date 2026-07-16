# Security Policy

CivicPulse is designed for production-grade security, protecting municipal data and public evidence integrity.

## Security Controls

### 1. Data Ingestion & Media Sanitization
- **EXIF Metadata Stripping**: All uploaded civic evidence photos are automatically processed upon receipt. Original EXIF metadata, GPS coordinates embedded in headers, and camera details are completely stripped using Pillow before the file is stored.
- **Resolution Verification**: Minimum dimensions of `300x300px` are required to maintain evidence quality. Maximum dimensions of `4096x4096px` are enforced to prevent resource exhaustion attacks (e.g., Pixel Floods).

### 2. API Protection & Rate Limiting
- **Token-Bucket Rate Limiting**: The public issue intake endpoints are protected by an in-memory token-bucket rate limiter that restricts submission abuse.
- **Dynamic CORS Lockdown**: Cross-Origin Resource Sharing (CORS) is strictly locked down to authorized frontend origins configured dynamically via environment variables (`FRONTEND_ORIGIN`).

### 3. Server Hardening
- **HTTP Security Headers**: CivicPulse API responses carry helmet-equivalent security headers:
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `X-XSS-Protection: 1; mode=block`
  - `Strict-Transport-Security` (HSTS) with standard `includeSubDomains` max-age constraints.
