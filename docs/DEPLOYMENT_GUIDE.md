# Nivaran Deployment & Operations Guide

## Overview
Nivaran is deployed as a single multi-stage Docker container on Render, connected to external Neon PostgreSQL, Upstash Redis, Cloudinary Media Storage, and Gemini Vision API.

---

## Environment Configuration

Configure the following environment variables in your deployment dashboard:

```env
ENVIRONMENT=production
DATABASE_URL=postgresql://<user>:<password>@<neon-db-host>/nivaran
REDIS_URL=rediss://:<password>@<upstash-redis-host>:6379

# Gemini Key Pool (minimum 2-4 keys recommended)
GEMINI_API_KEYS=key1,key2,key3
GEMINI_MODEL=gemini-2.5-flash

# Production Image Storage (Cloudinary)
STORAGE_PROVIDER=cloudinary
CLOUDINARY_CLOUD_NAME=<your-cloud-name>
CLOUDINARY_API_KEY=<your-api-key>
CLOUDINARY_API_SECRET=<your-api-secret>
```

---

## Render Deployment (`render.yaml`)

Nivaran uses `render.yaml` for zero-configuration Docker web service deployment.

```yaml
services:
  - type: web
    name: nivaran-backend
    env: docker
    dockerfilePath: ./Dockerfile
    dockerContext: .
    envVars:
      - key: DATABASE_URL
        fromDatabase:
          name: nivaran-db
          property: connectionString
      - key: GEMINI_API_KEYS
        sync: false
      - key: CLOUDINARY_CLOUD_NAME
        sync: false
      - key: CLOUDINARY_API_KEY
        sync: false
      - key: CLOUDINARY_API_SECRET
        sync: false
      - key: ENVIRONMENT
        value: production
```

---

## Pre-Deployment Release Checklist

- [x] **Backend CI**: Run `python -m pytest` (69/69 passing).
- [x] **Frontend Build**: Run `npm run build` (0 TypeScript errors).
- [x] **Cloudinary Credentials**: Set `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`.
- [x] **Gemini API Keys**: Set `GEMINI_API_KEYS` with comma-separated keys.
- [x] **Database & Redis**: Verify active Neon PostgreSQL and Upstash Redis connections.
