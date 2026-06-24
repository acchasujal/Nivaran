# START_HERE.md
**Read this first. Read it completely. Then read the two files it marks as mandatory before touching any code.**

---

## What Is CivicPulse?

CivicPulse is a 5-agent civic accountability platform for the VIBE2SHIP Hackathon (Coding Ninjas × Google for Developers, Problem Statement 2 — Community Hero). Deadline: June 29, 2026.

**Core loop:** Citizen photographs a local infrastructure issue → 5 AI agents classify, cluster, analyze, draft, and escalate → a real complaint/RTI draft is sent by email or exported as PDF.

**The differentiator:** Every output is traceable to user-submitted evidence. No fabricated metrics. No invented government performance data. Real action (email send / PDF export), not just display.

---

## Architecture in 60 Seconds

```
POST /issues (photo + lat/lng)
  → Agent 1: Gemini Vision → issue_type, severity, description, credibility_score
  → Agent 2: Haversine proximity + Gemini semantic dedup → cluster assignment
  → [At ESCALATION_THRESHOLD] [BackgroundTask] Agent 3: Impact Intelligence → affected_area, risk_level, evidence_count
  → [At ESCALATION_THRESHOLD] [BackgroundTask] Agent 4: Action Generator → complaint, RTI draft, community summary
  → [Human approves via UI] Agent 5: SendGrid email OR PDF export → real external action
```

Five tables: `issues`, `clusters`, `impact_summaries`, `action_drafts`, `escalations`.

Stack: FastAPI · SQLite (WAL mode) · Gemini 2.0 Flash · React/Vite/Tailwind · Google Maps JS · SendGrid · WeasyPrint/reportlab.

---

## Mandatory Reads Before Writing Any Code

| Order | File | Time | Why Mandatory |
|---|---|---|---|
| 1 | `ANTI_HALLUCINATION_RULES.md` | 3 min | Hard rules that override everything else |
| 2 | `ARCHITECTURAL_TRUTHS.md` | 3 min | Non-negotiable constraints — every agent must enforce these |
| 3 | `API_CONTRACTS.md` | 5 min | Exact endpoint contracts — never invent fields |
| 4 | `DATABASE_SCHEMA.md` | 3 min | Exact table/field definitions |
| 5 | `AI_SYSTEM_DESIGN.md` | 5 min | Per-agent input/output schemas and validation gates |

---

## Current Build State

| Status | Detail |
|---|---|
| Documentation | Complete (this suite) |
| Code | **Nothing written yet** |
| Active milestone | Day 1: FastAPI skeleton + Gemini Vision call returning structured JSON |
| Deadline | June 29, 2026 |
| Developer | Solo |
| Days remaining | ~5 |

---

## Priority System

| Level | Meaning |
|---|---|
| **P0** | Demo fails without this. Do not start P1 work until all P0 items are done. |
| **P1** | Moves judging score meaningfully. Build after P0 is verified on deployed URL. |
| **P2** | Polish only. Cut if behind. |
| **CUT** | Do not build. Documented explicitly in TASK_TRACKER.md. |

See `TASK_TRACKER.md` for the full ordered build list.

---

## Pre-Build Blockers (Resolve Before Writing Agent Code)

These three items are not code. They are resolved first, today, before any agent implementation:

1. **Google AI Studio deployment requirement** — Contact organizers / re-read submission criteria. Clarify if this means "use Gemini API" or "deploy via Google Cloud Run / Vertex AI." The answer changes the backend deployment plan. Do not deploy to Railway/Render before this is resolved.

2. **SendGrid setup + domain verification** — Domain verification takes 24–72 hours. Start the account today. Use SendGrid's HTTP API (not SMTP port 587, which venue WiFi blocks). See `DEMO_ARCHITECTURE.md`.

3. **Demo seeding script** — Must exist before any demo is run. See `DEMO_DATA_SPEC.md` for the required seeded dataset.

---

## The Single Highest-Priority Constraint

> **Never substitute a fabricated or hardcoded default value when an AI call fails.** Surface the failure. Return the defined error response. Never paper over it.

This rule appears in `ANTI_HALLUCINATION_RULES.md`, `ARCHITECTURAL_TRUTHS.md`, `CODING_STANDARDS.md`, and `AI_SYSTEM_DESIGN.md`. It is never optional.

---

## Document Map

| Document | Purpose |
|---|---|
| `START_HERE.md` | This file — primary entry point |
| `ANTI_HALLUCINATION_RULES.md` | Hard rules for AI agents — read second |
| `ARCHITECTURAL_TRUTHS.md` | Non-negotiable design constraints |
| `PROJECT_CONTEXT.md` | Mission, goals, non-goals, judging strategy |
| `ARCHITECTURE.md` | Full system design with reasoning |
| `AI_SYSTEM_DESIGN.md` | Per-agent schemas, prompts, validation |
| `AGENT_EXECUTION_RULES.md` | When agents run, what they may/must not do |
| `API_CONTRACTS.md` | Exact request/response contracts |
| `DATABASE_SCHEMA.md` | Table definitions |
| `BACKEND_SPEC.md` | Services, middleware, error handling |
| `FRONTEND_SPEC.md` | Pages, components, state |
| `CODING_STANDARDS.md` | Naming, error handling, testing |
| `TASK_TRACKER.md` | Ordered build list with acceptance criteria |
| `DEMO_ARCHITECTURE.md` | Demo flow, seeding, backup plans |
| `DEMO_DATA_SPEC.md` | Required seeded data definitions |
| `DEMO_DAY_PLAYBOOK.md` | Emergency response guide for demo day |
| `JUDGING_STRATEGY.md` | Feature-to-judging-criterion mapping |
| `DECISION_LOG.md` | Why decisions were made |
| `FEATURE_REGISTRY.md` | Feature status and risk |
| `AGENT_ONBOARDING.md` | Legacy — superseded by this file |

---

## Hard Rules (Summary — Full Detail in ANTI_HALLUCINATION_RULES.md)

1. Never invent API endpoints, fields, or contracts.
2. Never invent database fields.
3. Never fabricate metrics, scores, or performance data about real entities.
4. Never mark escalations as sent unless the provider confirms.
5. Never bypass the human approval gate for Agent 5.
6. Never claim legal authority for generated documents.
7. If an AI call fails, return 502. Never substitute a default.
8. Never build features not in TASK_TRACKER.md without updating DECISION_LOG.md first.