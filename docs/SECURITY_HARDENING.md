# Security Hardening Specification

## Security Measures
- **Security Headers**: `SecurityHeadersMiddleware` sets `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `X-XSS-Protection`, `Content-Security-Policy`, `Strict-Transport-Security`.
- **Rate Limiting**: `RateLimitMiddleware` limits requests per IP/minute.
- **File Upload Protection**: Content-Type validation and 25MB file size boundaries.
