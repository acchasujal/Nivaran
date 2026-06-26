# TASK_TRACKER.md
**Ordered build list. Every task has a dependency, effort estimate, and acceptance criterion. Do not start work on P1 until all P0 items pass their acceptance criteria on the deployed URL.**

---

## Priority Definitions

| Level | Meaning | Rule |
|---|---|---|
| P0 | Demo fails without this | Do not start P1 until all P0 items are done and verified |
| P1 | Moves judging score | Build after P0 verified on deployed URL |
| P2 | Polish only | Build only if you finish Day 5 with hours to spare |
| CUT | Do not build | Documented below — never reintroduce |

---

## Pre-Build Blockers (Do Before Writing Any Agent Code)

These are not code tasks. They are resolved first, on Day 1, before any implementation begins.

| # | Task | Effort | Acceptance Criterion |
|---|---|---|---|
| PRE-1 | Resolve Google AI Studio deployment requirement | 1h | Confirmed in writing: does "Google AI Studio" mean use Gemini API (→ Railway/Render OK) or deploy via Google Cloud Run (→ different backend plan)? Do not guess. |
| PRE-2 | Start SendGrid account + domain verification | 1h | SendGrid account created, domain DNS records added, verification email sent. (Verification takes 24–72h — cannot be started later.) |
| PRE-3 | Design DEMO_THRESHOLD_OVERRIDE env var | 30min | `.env.demo` file drafted with `ESCALATION_THRESHOLD=1`, `DEMO_MODE=true`, `AGENT5_PDF_FALLBACK=true`. No code yet — just the config design confirmed. |

---

## P0 — Core Pipeline and Infrastructure

### P0-A: FastAPI Skeleton and Database

| # | Task | Depends On | Effort | Acceptance Criterion | Status |
|---|---|---|---|---|---|
| A1 | FastAPI app skeleton + router wiring | None | 1h | `uvicorn app.main:app --reload` starts with no errors | **Completed** |
| A2 | SQLite models (5 tables per DATABASE_SCHEMA.md) | A1 | 1.5h | All 5 tables created on startup; schema matches DATABASE_SCHEMA.md exactly | **Completed** |
| A3 | `PRAGMA journal_mode=WAL` in DB init | A2 | 15min | Verified: `PRAGMA journal_mode` returns `wal` after startup | **Completed** |
| A4 | Pydantic/SQLModel schemas for all tables | A2 | 1h | All models importable; field names match DATABASE_SCHEMA.md exactly | **Completed** |

### P0-B: Gemini Client

| # | Task | Depends On | Effort | Acceptance Criterion | Status |
|---|---|---|---|---|---|
| B1 | `gemini_client.py` — structured output call | A1 | 2h | One manual test call returns schema-conformant JSON for a real photo | **Completed** |
| B2 | Retry logic (once then 502) | B1 | 30min | Deliberately malformed Gemini output triggers retry; second failure returns 502 not a default | **Completed** |
| B3 | Timeout enforcement (15s) | B1 | 30min | Patched Gemini call that sleeps 20s returns 502, not a hanging request | **Completed** |


### P0-C: Demo Seeding Script

| # | Task | Depends On | Effort | Acceptance Criterion | Status |
|---|---|---|---|---|---|
| C1 | `scripts/seed_demo.py` — populates 2 clusters with 3+ issues each | A3, A4 | 2h | Running the script creates 6+ issues across 2 clusters in SQLite; TrackerPage shows populated state | **Completed** |
| C2 | Demo photo assets (6–8 real civic issue photos) | None | 1h | Photos sourced (real, not stock), labeled by issue_type, stored in `scripts/demo_assets/` | **Completed** |

### P0-D: Agent 1

| # | Task | Depends On | Effort | Acceptance Criterion |
|---|---|---|---|---|
| D1 | `agent_1_intake.py` — Vision classification | B1, B2, B3 | 2h | `POST /issues` with a real pothole photo returns 201 with correct issue_type, severity, description, credibility_score |
| D2 | Schema validation + retry gate | D1 | 30min | Patched output with `severity: 99` triggers retry; if retry also invalid → 502 returned, no data saved |
| D3 | Failure path: 502 on Gemini error | D1 | 15min | Patched Gemini client raising an exception → POST /issues returns 502, not 200 |

### P0-E: Agent 2

| # | Task | Depends On | Effort | Acceptance Criterion |
|---|---|---|---|---|
| E1 | `geo_service.py` — haversine distance | None | 30min | Unit test: two Mumbai coordinates 200m apart returns < 300; two 500m apart returns > 300 |
| E2 | `agent_2_verification.py` — proximity query + cluster create/update | D1, E1 | 2h | Second report within 300m of first (same issue_type) correctly increments cluster.report_count |
| E3 | Gemini semantic dedup call | E2, B1 | 1h | Two reports with similar descriptions but no geographic proximity: confidence < 0.4 → separate clusters |
| E4 | Confidence-band default-to-new rule | E3 | 15min | Patched Gemini returning confidence=0.5 → new cluster created (not merged) |

### P0-F: Agent 3

| # | Task | Depends On | Effort | Acceptance Criterion | Status |
|---|---|---|---|---|---|
| F1 | `agent_3_impact.py` — impact intelligence | B1, A4 | 2h | impact_summaries row created with affected_area_description, risk_level, evidence_count matching cluster | **Completed** |
| F2 | BackgroundTask integration in POST /issues | F1, E2 | 30min | POST /issues returns 201 immediately; if threshold crossed, Agent 3 impact summary appears within 5s | **Completed** |
| F3 | Output validator (reject fabricated score / named officials) | F1 | 30min | Patched Gemini output containing "Officer Sharma has resolved" → rejected, regenerated, failure logged | **Completed** |

### P0-G: Agent 4

| # | Task | Depends On | Effort | Acceptance Criterion | Status |
|---|---|---|---|---|---|
| G1 | `agent_4_action_generator.py` — 3 draft types | B1, F1 | 2.5h | Three action_drafts rows created (complaint, rti, community_summary) when ESCALATION_THRESHOLD reached | **Completed** |
| G2 | RTI disclaimer hard gate | G1 | 30min | Patched Gemini output without disclaimer string → rejected, regenerated; if still missing → 502, no row written | **Completed** |
| G3 | BackgroundTask integration (fires only at threshold) | G1, F2 | 30min | With ESCALATION_THRESHOLD=3: impact summary and drafts appear only after 3rd report; with DEMO_THRESHOLD_OVERRIDE=1: after 1st | **Completed** |

### P0-H: Agent 5

| # | Task | Depends On | Effort | Acceptance Criterion | Status |
|---|---|---|---|---|---|
| H1 | `email_client.py` — SendGrid HTTP API | PRE-2 | 1.5h | A real test email arrives in a real inbox from the SendGrid-configured domain | **Completed** |
| H2 | `pdf_export.py` — WeasyPrint/reportlab | None | 1.5h | PDF renders, downloads, and opens correctly with full draft content | **Completed** |
| H3 | `agent_5_escalation.py` — email + PDF, approved-only gate | G1, H1, H2 | 2h | POST /escalations on unapproved draft → 403; on approved draft with method=email → email sent and escalations row written with real provider_response | **Completed** |
| H4 | Auto PDF fallback on email failure | H1, H2, H3 | 30min | With AGENT5_PDF_FALLBACK=true: if SendGrid returns non-202, PDF export runs automatically; a single escalation row is written with status='exported' | **Completed** |

### P0-I: Frontend Core

| # | Task | Depends On | Effort | Acceptance Criterion | Status |
|---|---|---|---|---|---|
| I1 | `IntakePage` — photo upload + GPS | D1 | 3h | Can submit a real photo with auto-GPS location; shows "Analyzing photo..." during wait; retry button on 502 | **Completed** |
| I2 | `TrackerPage` — list view (no map required) | E2 | 2h | Shows issues from seeded dataset; each card shows issue_type, severity, evidence_count, escalation status; "self-reported" label visible | **Completed** |
| I3 | `IssueDetailPage` — evidence + impact + drafts | F1, G1 | 2.5h | Shows impact summary (risk_level, affected_area, evidence_count); shows 3 draft cards; credibility_score displayed with "AI-assessed" label | **Completed** |
| I4 | `ApprovalModal` — consequential UX | G1 | 1.5h | Modal copy: "You are authorizing a real escalation on behalf of [N] community reports for [area]. This will send an email to [recipient]." Approve button prominent. Approve action calls PATCH /action-drafts/{id}. | **Completed** |
| I5 | `EscalationButton` — calls POST /escalations | H3, I4 | 1h | Button disabled if draft.status != 'approved'; on click, triggers email then shows PDF download link if email fails | **Completed** |
| I6 | `AgentProgressTimeline` component | I3 | 1h | Component displays progress timeline of the 5 agents with completion checkmarks/states, integrated on the IssueDetailPage | **Completed** |

### P0-J: Deployment

| # | Task | Depends On | Effort | Acceptance Criterion | Status |
|---|---|---|---|---|---|
| J1 | Backend deployment (target TBD per PRE-1) | All P0 A–H | 3h | Backend accessible at public URL; `GET /issues` returns 200 with seeded data | **Completed** |
| J2 | Frontend deployment (Vercel) | I1–I5 | 1h | Frontend accessible at public URL; connected to deployed backend | **Completed** |
| J3 | End-to-end smoke test on deployed URLs | J1, J2 | 1h | Submit real photo via deployed frontend → classified → clustered → impact summary → draft → approve → email sent OR PDF downloaded; all from public URLs | **Completed** |

---

## P1 — Ship After All P0 Verified on Deployed URL

| # | Task | Depends On | Effort | Acceptance Criterion | Judging Criterion |
|---|---|---|---|---|---|
| P1-1 | Google Maps JS integration (TrackerPage) | I2 | 3h | Map renders with issue pins clustered by cluster_id; each pin shows issue_type and report_count on click | Google Technologies |
| P1-2 | credibility_score UI tooltip | I3 | 30min | Tooltip text: "Image quality and classification confidence (AI-assessed)" displayed on hover/tap next to credibility_score | Technical Credibility |
| P1-3 | Structured JSON agent logging | All agents | 1h | Terminal logs show `{agent, issue_id, latency_ms, success}` for every agent call | Technical Execution |
| P1-4 | IP rate limiting (POST /issues, POST /escalations) | J1 | 30min | More than 10 requests/min from same IP returns 429 | Technical Execution |
| P1-5 | CORS lockdown to frontend origin | J1 | 15min | `allow_origins=[settings.FRONTEND_ORIGIN]` — not wildcard | Technical Execution |

---

## P2 — Build Only With Surplus Time on Day 5

| # | Task | Effort | Acceptance Criterion |
|---|---|---|---|
| P2-1 | Map clustering visual (colored markers per issue_type) | 2h | Pins visually differentiated by issue type and cluster membership |
| P2-2 | TrackerPage filters (by issue_type, risk_level) | 1h | Dropdown filters applied client-side; URL param preserved on refresh |
| P2-3 | Skeleton loading states on TrackerPage | 1h | IssueCard skeletons shown while data loads |
| P2-4 | Mobile-first responsive polish on IntakePage | 1h | IntakePage usable on 375px-width phone without horizontal scroll |

---

## CUT — Do Not Build

These are documented once, finally. Never reintroduce.

| Feature | Reason |
|---|---|
| Auth / user accounts | 7-day build scope; adds 1+ day for zero judging benefit |
| Gamification (streaks, badges, leaderboards) | Irrelevant to accountability story; no judging benefit |
| Voice input | Tier 3 — only if all P0+P1 complete with surplus time |
| Community verification votes | Tier 3 — only if all P0+P1 complete with surplus time |
| Celery / RQ background task queue | FastAPI BackgroundTasks is sufficient; Celery adds Redis dependency |
| Real-time WebSocket push | Frontend polling is sufficient for hackathon scale |
| Fabricated ward scores or officer rankings | Permanently cut. Never reintroduce. |

---

## Day-by-Day Schedule

| Day | Date | Focus | End-of-Day Gate |
|---|---|---|---|
| **Day 1** | June 24 | PRE-1, PRE-2, PRE-3, A1–A4, B1–B3, C2 | FastAPI boots · DB tables created with WAL · Gemini call returns structured JSON for real photo |
| **Day 2** | June 25 | D1–D3, E1–E4, C1, I1 | A1+A2 chained · issue submitted via IntakePage appears in DB · seeding script works |
| **Day 3** | June 26 | F1–F3, I2, I3 (partial) | Agent 3 produces impact summary · TrackerPage shows seeded data · validator gate rejects bad output |
| **Day 4** | June 27 | G1–G3, I3 (complete), I4, I5 | Full A1→A4 chain works · approved draft visible in IssueDetailPage · ApprovalModal functional |
| **Day 5** | June 28 | H1–H4, J1–J3, P1-1 through P1-5 | Real email in real inbox from deployed URL · PDF downloads · deployed link publicly accessible |
| **Day 6** | June 29 | 10+ demo rehearsals · README · Google Doc · submit | Submit before deadline with margin · see DEMO_DAY_PLAYBOOK.md |

---

## Cut Protocol (Apply If Behind Schedule)

| Condition | Cut |
|---|---|
| Day 2 milestone not hit by end of Day 2 | Cut Google Maps (P1-1). Ship list-only TrackerPage. |
| Day 3 milestone not hit by end of Day 3 | Run Agent 3 synchronously (drop BackgroundTask). Accept the latency. |
| Day 4 milestone not hit by end of Day 4 | Cut PDF export (P0-H2). Ship email-only Agent 5. |
| Day 5 email send not working on deployed URL | Flip to PDF-only Agent 5. Frame as "submission-ready PDF package." |
| Day 5 both email and PDF unstable | Ship A1→A4 with a `.txt` download on DraftCard. Remove Agent 5 claim from demo narrative. Surface honest state. |