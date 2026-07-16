# ARCHITECTURE.md
**System design with explicit reasoning for every architectural decision. Do not modify without updating DECISION_LOG.md.**

---

## High-Level Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                        Citizens                              │
│   🌐 Web App          💬 WhatsApp         📱 Mobile (future) │
│   (full dashboard)    (reporting channel) (planned)          │
└────────┬──────────────────┬──────────────────────────────────┘
         │                  │
         ▼                  ▼
┌─────────────────┐  ┌─────────────────┐
│  issues.py      │  │  whatsapp.py    │
│  (web router)   │  │  (webhook)      │
└────────┬────────┘  └────────┬────────┘
         │                    │
         └──────────┬─────────┘
                    │
                    ▼
         ┌──────────────────────┐
         │   issue_service.py   │  ← ONE IMPLEMENTATION
         │   Shared Pipeline    │
         └──────────┬───────────┘
                    │
         ┌──────────▼───────────┐     ┌─────────────────────┐
         │   FastAPI Backend    │────►│  Gemini 2.5 Flash   │
         │   (Python 3.11+)     │◄────│  Vision + Text      │
         └──────────┬───────────┘     └─────────────────────┘
                    │         │
        ┌───────────┘         └────────────┐
        ▼                                  ▼
 ┌──────────────┐              ┌─────────────────────┐
 │ SQLite       │              │ SendGrid HTTP API   │
 │ (WAL mode)   │              │ ReportLab PDF       │
 └──────────────┘              └─────────────────────┘
        │
        ▼
 ┌──────────────┐
 │ Google Maps  │
 │ JS API       │
 └──────────────┘
```

**Multiple channels. One backend. Zero duplicated logic.**

The WhatsApp channel is a thin adapter: it parses Twilio webhook POSTs,
advances a lightweight in-memory session, and calls `issue_service.py`
directly — no httpx self-call, no duplicated validation.

To migrate from Twilio Sandbox to Meta Cloud API: change only the two
helper functions `_download_media()` and `_send_message()` in `whatsapp.py`.
All session and service logic is provider-agnostic.

---

## Component Map

```
backend/app/
├── agents/
│   ├── agent_1_intake.py          ← Gemini Vision classification
│   ├── agent_2_verification.py   ← Proximity + semantic dedup
│   ├── agent_3_impact.py          ← Impact intelligence (BackgroundTask)
│   ├── agent_4_action_generator.py ← Draft generation
│   └── agent_5_escalation.py     ← SendGrid email + PDF export
├── models/
│   └── (SQLModel/Pydantic schemas — one file per table)
├── routers/
│   ├── issues.py                  ← POST /issues, GET /issues, GET /issues/{id}
│   ├── clusters.py                ← GET /clusters/{id}
│   ├── impact.py                  ← POST /clusters/{id}/impact
│   ├── actions.py                 ← GET+PATCH /action-drafts/{id}
│   └── escalations.py            ← POST /escalations, GET /escalations/{id}
├── services/
│   ├── gemini_client.py           ← Structured output wrapper, retry logic
│   ├── email_client.py            ← SendGrid HTTP API wrapper
│   ├── pdf_export.py              ← WeasyPrint/reportlab PDF renderer
│   └── geo_service.py            ← Haversine distance calculation
└── main.py                        ← App + router wiring only, no business logic

frontend/src/
├── pages/
│   ├── IntakePage.tsx
│   ├── TrackerPage.tsx
│   └── IssueDetailPage.tsx
├── components/
│   ├── PhotoUploader.tsx
│   ├── LocationPicker.tsx
│   ├── MapView.tsx
│   ├── IssueCard.tsx
│   ├── ImpactSummaryPanel.tsx
│   ├── DraftCard.tsx
│   ├── ApprovalModal.tsx
│   ├── EscalationButton.tsx
│   └── StatusBadge.tsx
└── api/
    └── (typed fetch wrappers — one file per resource)
```

---

## Request Lifecycle (Detailed)

### POST /issues — The Critical Path

```
1.  Validate file (jpg/png, max 8MB) and coordinates — return 422 immediately if invalid
2.  Write issue row with status=pending
3.  Agent 1 call (synchronous, max 15s):
      → Gemini Vision structured output
      → Validate schema (issue_type enum, severity 1-5)
      → If invalid: retry once with stricter system instruction
      → If retry fails: return 502, delete pending row
4.  Write issue row fields from Agent 1 output, status=classified
5.  Agent 2 call (synchronous, max 10s):
      → Query clusters within 300m radius with matching issue_type
      → If candidates exist: Gemini semantic dedup call
        → confidence >= 0.6: merge into existing cluster
        → confidence 0.4-0.6: create new cluster (default-to-new)
        → confidence < 0.4: create new cluster
      → If no candidates: create new cluster
      → Update issue.cluster_id, issue.status=clustered
      → Increment cluster.report_count
6.  Return 201 with issue object to frontend (user sees result here)
7.  [BackgroundTask] If cluster.report_count >= ESCALATION_THRESHOLD:
      → Agent 3 call (async, non-blocking):
        → Gemini long-context call over all member issue descriptions
        → Validate output (no fabricated scores, no named officials)
        → Upsert impact_summaries row for cluster
      → Agent 4 call (async, after Agent 3 succeeds):
        → Generate complaint, RTI draft, community summary
        → Validate: RTI draft begins with disclaimer; no invented statistics
        → Write 3 action_drafts rows, status=pending_review
        → Update issue.status=drafted
```

**Why Agent 3 and Agent 4 run at threshold crossing:**
In the MVP, drafts and impact summaries are only generated when there is sufficient evidence (at least `ESCALATION_THRESHOLD` reports). Running both Agent 3 and Agent 4 only when this threshold is crossed avoids unnecessary API calls and token usage on low-confidence single reports.

**Why Agent 3 and Agent 4 are BackgroundTasks:**
Two sequential synchronous Gemini calls (Agent 1 + Agent 2) can take 6–16 seconds. Adding Agent 3 and Agent 4 synchronously would extend this by another 10–15 seconds on the user-facing critical path. Running them asynchronously as `BackgroundTasks` lets the user see their classified issue immediately, while processing the impact and drafts in the background.

### PATCH /action-drafts/{id} — Human Approval Gate

```
1.  Validate status value (approved | rejected only)
2.  Write status + reviewed_at to action_drafts row
3.  Return updated draft object
```

No agent is involved. This is a pure human action. No code may call this endpoint on behalf of an agent.

### POST /escalations — Agent 5 (Real External Action)

```
1.  Fetch action_drafts row by draft_id
2.  HARD GATE: if draft.status != "approved" → return 403 immediately
3.  If method=email:
      → Validate recipient is a real email address
      → Call email_client.send() via SendGrid HTTP API
      → Capture real provider response string
      → If success: status = "sent"
      → If failure and AGENT5_PDF_FALLBACK=true:
        → Call pdf_export.render(draft.content)
        → Write PDF to temp file, get download URL
        → status = "exported"
      → If failure and AGENT5_PDF_FALLBACK=false:
        → status = "failed"
4.  If method=pdf_export:
      → Call pdf_export.render(draft.content)
      → Write PDF to temp file, get download URL
      → status = "exported"
5.  Write single escalations row with final status (sent, exported, or failed) and provider_response (capturing email error detail if fallback occurred)
6.  Update issue.status=escalated (if email sent or PDF exported)
7.  Return 201 with escalation object (including PDF download URL if exported or fallen back)
```

**Why both email AND PDF are implemented (not email with PDF as fallback):**
Email is the stronger demo proof point (external recipient, real inbox). PDF is 100% reliable with no external dependencies (works offline, works when SendGrid is unreachable). Both are P0. On demo day: attempt email first. If SendGrid call fails, show the PDF download. Never show a failed escalation without an alternative. See `DEMO_ARCHITECTURE.md`.

---

## Data Flow Diagram

```
PhotoSubmitted
    │
    ▼
IssueClassified (Agent 1) ──► [status=classified]
    │
    ▼
ClusterAssigned (Agent 2) ──► [status=clustered] ──► [returns 201 to user]
    │
    ▼ [BackgroundTask]
ImpactUpdated (Agent 3) ──► impact_summaries upserted
    │
    ├── [report_count < THRESHOLD] ──► wait for more reports
    │
    └── [report_count >= THRESHOLD]
            │
            ▼
        DraftsGenerated (Agent 4) ──► [status=drafted]
            │
            ▼ [Human approves via ApprovalModal]
        UserApproved (PATCH /action-drafts/{id})
            │
            ▼
        EscalationSent (Agent 5) ──► [status=escalated]
```

---

## Database Relationships

```
issues (many) ──► clusters (one)
clusters (one) ──► impact_summaries (one active, regenerated on each increment)
clusters (one) ──► action_drafts (three, generated at ESCALATION_THRESHOLD)
action_drafts (one) ──► escalations (one per send/export attempt)
```

---

## Architectural Decisions (With Reasoning)

| Decision | What | Why | Alternative Rejected |
|---|---|---|---|
| Gemini 2.0 Flash | Primary AI model | Native Vision input, structured-output JSON mode, long context for Agent 3, required for Google Technologies criterion | GPT-4o: not a Google technology |
| SendGrid HTTP API | Email delivery | Port 587 blocked on venue WiFi; SendGrid HTTP works on any network; better deliverability on new domains | Raw SMTP: fails at hackathon venues |
| PostgreSQL Engine | Database | Dynamic PostgreSQL and SQLite support with indexes on foreign keys for high performance | SQLite-only: not suitable for multi-instance production |
| FastAPI BackgroundTasks | Async Agent 3/4 | Cuts user-facing POST /issues latency from 3-agent to 2-agent synchronous wait | Celery/RQ: over-engineered; adds Redis dependency |
| Synchronous Agent 1+2 | On-submit pipeline | Demo predictability; failures are immediately visible to user; no polling needed for the classification result | Full async: adds polling complexity, harder to debug solo |
| WeasyPrint / reportlab | PDF export | Pure Python, no system service required; reliable on any deployment target | Puppeteer: requires Node.js subprocess; complex on Railway/Render |
| React/Vite/Tailwind | Frontend | Fast development; Tailwind utility-first avoids CSS file complexity | Next.js: SSR overhead not needed for hackathon SPA |
| Token-Bucket Rate Limiter | Security | Public write endpoints protected from automation abuse | Full auth: consumes 1+ full build days |
| Centralized Logging | Observability | Correlation IDs and JSON formatting for production tracing | Standard print logs: lacks structured queryability |

---

## Deployment Architecture

| Component | Target | Reason |
|---|---|---|
| Backend (FastAPI) | Render | Managed Python environment, dynamic gunicorn scaling |
| Frontend | Vercel | One-click deploy, automatic HTTPS, free tier |
| Database | PostgreSQL on Render | Managed database service with scaling and backup support |
| Photos | Local disk on backend host | Hackathon scope; move to GCS post-hackathon |
| Email | SendGrid HTTP API | No infrastructure to manage |
| PDF | Served as temp file from backend | Simple for hackathon; no CDN needed |

---

## Error Handling Strategy

| Error Type | Response | Frontend Behavior |
|---|---|---|
| Gemini call failure / timeout | 502 `{"error": "ai_unavailable", "retryable": true}` | Toast: "Couldn't analyze the photo. Try again." + retry button |
| Gemini output fails schema validation (after retry) | 502 same as above | Same |
| File too large / wrong type | 422 `{"error": "validation_error", "fields": {...}}` | Inline field error on IntakePage |
| Draft not approved for escalation | 403 `{"error": "draft_not_approved"}` | EscalationButton remains disabled |
| SendGrid call failure | 502 `{"error": "escalation_failed", "provider_response": "..."}` | DraftCard shows real provider_response; PDF fallback offered |
| Issue not found | 404 | Standard not-found state |

**Rule:** No endpoint returns 200 with a silently degraded result. Failures are always surfaced as non-2xx.

---

## Demo-Specific Architecture Decisions

See `DEMO_ARCHITECTURE.md` for full demo strategy. Summary of architecture-level demo decisions:

- `DEMO_THRESHOLD_OVERRIDE` env var sets ESCALATION_THRESHOLD=1 in demo mode. This does not change any agent logic — it only changes when Agent 4 triggers.
- Demo seeding script populates 6–8 pre-classified issues across 2 clusters before any live demo run. See `DEMO_DATA_SPEC.md`.
- Agent 5 attempts email first. If SendGrid HTTP call fails and AGENT5_PDF_FALLBACK=true, PDF export runs automatically as the fallback action. A single escalation row is written reflecting the final status ("exported") with SendGrid's failure message captured in provider_response. The demo can show either outcome.