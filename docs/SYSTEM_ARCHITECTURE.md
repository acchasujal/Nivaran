# Nivaran System Architecture

Nivaran is an AI-powered Civic Operations & Public Accountability platform designed for hackathon demonstration and production scale.

## High-Level Architecture

```
                               ┌────────────────────────────────┐
                               │     React 18 + Vite Frontend    │
                               │   (TypeScript, Tailwind CSS)   │
                               └───────────────┬────────────────┘
                                               │ HTTPS / REST
                                               ▼
                               ┌────────────────────────────────┐
                               │       FastAPI Backend API      │
                               │       (Uvicorn / Docker)       │
                               └───────┬───────┬───────┬────────┘
                                       │       │       │
                ┌──────────────────────┘       │       └──────────────────────┐
                ▼                              ▼                              ▼
┌──────────────────────────────┐ ┌───────────────────────────┐ ┌─────────────────────────────┐
│  Gemini Vision API Key Pool  │ │ Cloudinary Storage / Local│ │ Neon PostgreSQL / Upstash   │
│ (Round-Robin, 429 Failover)  │ │  (Pillow Image Optimizer) │ │ (Spatial & Async Workflow)  │
└──────────────────────────────┘ └───────────────────────────┘ └─────────────────────────────┘
```

---

## Key Subsystems

### 1. Gemini Vision AI Reliability (`gemini_client.py`)
- **Key Pool**: Rotates across comma-separated `GEMINI_API_KEYS`.
- **Round-Robin Scheduling**: Thread-safe key selection pointer.
- **Per-Key Cooldown**: On receiving HTTP 429 / Rate Limit error, marks failing key in a 60-second cooldown and instantly retries on the next healthy key in the pool.
- **Timeout**: 20.0s Vision call timeout.

### 2. Media Asset Pipeline (`storage_provider.py`)
- **Provider Abstraction**: `StorageProvider` interface with `CloudinaryStorageProvider` (production) and `LocalStorageProvider` (dev/CI).
- **Optimization Pipeline**: Magic bytes validation (`JPEG`, `PNG`, `WebP`), resizing to max 2048px, 80% JPEG quality compression, EXIF device privacy stripping, and GPS coordinate extraction.

### 3. Non-Blocking Intake & AI Auto-Fill (`issues.py`)
- `/issues/analyze-image`: Streams image bytes to Cloudinary and Gemini Vision API concurrently. Returns structured auto-fill JSON (`category`, `title`, `description`, `severity`, `department`, `confidence`).
- **Manual Fallback**: If AI fails or times out, returns `ai_available: false` with default fields without failing upload or blocking user submission.
- `/issues/nearby`: Spatial radius query returning duplicate reports within 200 meters.

---

## Core API Endpoints

- `POST /issues/analyze-image`: Upload image & return AI auto-fill JSON.
- `POST /issues`: Create civic issue report.
- `GET /issues`: List civic issues with filters.
- `GET /issues/nearby`: Check nearby duplicates by lat/lng radius.
- `GET /issues/{issue_id}`: Retrieve issue detail audit trail.
