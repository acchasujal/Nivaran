# CivicPulse v4

**Evidence-driven civic accountability platform.** Citizens report local infrastructure issues with a photo; the system verifies, aggregates, and converts evidence into real action artifacts — complaint drafts, RTI drafts, and escalation emails — instead of a passive reporting dashboard.

Built for VIBE2SHIP (Coding Ninjas × Google for Developers), June 22–29, 2026. Problem Statement 2 — Community Hero.

---

## Problem Being Solved

Citizens already report civic issues (potholes, broken streetlights, water leaks, waste). The bottleneck is not reporting — it's that reports disappear with no consequence and no compiled evidence trail. CivicPulse does not claim to know government performance. It turns citizen-submitted evidence into structured, defensible, action-ready documents.

## Core Insight

> The problem is accountability, not reporting. The fix is evidence, not fabricated scores.

CivicPulse never claims to measure official government performance. Every output is traceable to user-submitted evidence (photos, descriptions, report frequency). See `PROJECT_CONTEXT.md` → Critical Rules for AI Agents.

## Features

| Feature | Description |
|---|---|
| Photo-based issue intake | Gemini Vision extracts issue type, severity, description from an unstructured photo |
| Duplicate / cluster detection | Groups reports of the same real-world issue, raises confidence with repeat reports |
| Impact Intelligence | Evidence-based summary: affected area, report frequency, risk level — no invented scores |
| Action Generator | Drafts a complaint, an RTI draft, and a Community Issue Summary from accumulated evidence |
| Escalation Agent | Sends the complaint/RTI draft by email and/or exports a PDF — a real action, not just display |
| Public Issue Tracker | Map + list of open issues, evidence count, and escalation status — all self-reported and labeled as such |

## User Flow

1. Citizen photographs an issue, adds location (auto GPS) and optional note.
2. Agent 1 classifies the issue (type, severity, description, evidence metadata).
3. Agent 2 checks for duplicates/clusters nearby and assigns a confidence level.
4. Agent 3 synthesizes Impact Intelligence (affected area, frequency, consequence narrative) — evidence-based, not a fabricated score.
5. Once an issue crosses a report-count threshold, Agent 4 drafts a Complaint, an RTI Draft (labeled "AI-generated draft — review before submission"), and a Community Issue Summary.
6. User reviews and approves; Agent 5 sends the draft by email and/or generates a PDF export — the one real external action in the pipeline.
7. The issue, its evidence count, and escalation status appear on the public tracker.

## Screenshots

_Placeholder — add screenshots before submission:_
- `docs/screenshots/intake.png`
- `docs/screenshots/impact-intelligence.png`
- `docs/screenshots/action-drafts.png`
- `docs/screenshots/public-tracker.png`

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite + Tailwind |
| Backend | FastAPI (Python) |
| AI | Gemini 2.0 Flash (Vision + text) via Google AI Studio API |
| Database | SQLite (hackathon scope) |
| Maps | Google Maps JavaScript API |
| Email / Escalation | SendGrid HTTP API for real outbound send |
| PDF Export | WeasyPrint or reportlab |
| Deployment | Google AI Studio deployment (required) + Render/Railway for FastAPI backend if needed |

## Setup Instructions

### Prerequisites
- Python 3.11+
- Node 18+
- A Gemini API key (Google AI Studio)
- SendGrid API key and verified sender email for the Escalation Agent

### Local Development

```bash
# Backend
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # fill in GEMINI_API_KEY, SENDGRID_API_KEY, SENDGRID_FROM_EMAIL, DATABASE_URL
uvicorn app.main:app --reload --port 8000

# Frontend
cd frontend
npm install
cp .env.example .env   # fill in VITE_API_BASE_URL, VITE_GOOGLE_MAPS_KEY
npm run dev
```

### Deployment
1. Deploy backend (Render/Railway) with environment variables set.
2. Deploy/connect via Google AI Studio per `https://ai.google.dev/gemini-api/docs/aistudio-deploying` (mandatory submission requirement).
3. Point frontend `VITE_API_BASE_URL` at the deployed backend.
4. Verify the deployed link is publicly accessible before submission.

## Folder Structure

```
civicpulse/
├── backend/
│   ├── app/
│   │   ├── agents/          # agent_1_intake.py ... agent_5_escalation.py
│   │   ├── models/          # SQLModel/Pydantic schemas
│   │   ├── routers/         # FastAPI route modules
│   │   ├── services/        # gemini_client, email_client, pdf_export
│   │   └── main.py
│   ├── tests/
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   └── api/
│   └── package.json
└── docs/                    # this documentation suite
```

## Environment Variables

| Variable | Location | Purpose |
|---|---|---|
| `GEMINI_API_KEY` | backend | Gemini API access |
| `DATABASE_URL` | backend | SQLite file path or connection string |
| `SENDGRID_API_KEY` / `SENDGRID_FROM_EMAIL` | backend | SendGrid API key and verified sender email for real outbound send |
| `GOOGLE_MAPS_KEY` | backend (server-side proxy) | Geocoding if needed |
| `VITE_API_BASE_URL` | frontend | Backend base URL |
| `VITE_GOOGLE_MAPS_KEY` | frontend | Map rendering |
