# PROJECT_CONTEXT.md
**Source of truth. Every other document and every AI coding agent defers to this file in case of conflict.**

---

## Why CivicPulse Exists

Citizens already have reporting tools. The bottleneck is not reporting — it is accountability. Reports disappear into municipal systems with no compiled evidence trail, no follow-up mechanism, and no consequence. CivicPulse converts citizen-submitted photos into structured, defensible, sendable action artifacts.

**The problem being solved is not "how do citizens report issues." It is "what happens after they do."**

---

## Core Insight

> Fabricated ward scores and officer rankings are not just ethically wrong — they are strategically wrong. A judge who asks "where did this number come from?" destroys the demo. Evidence-based outputs survive that question. Invented outputs do not.

Every design decision that removed a fabricated metric and replaced it with an evidence-based alternative was correct. This must never be reversed.

---

## Product Vision

A platform where reporting an infrastructure issue produces a tangible next step — a drafted, reviewable, sendable document — within minutes, grounded entirely in evidence the user actually submitted.

---

## Core Principles (Ranked by Priority)

| Priority | Principle | Implication |
|---|---|---|
| 1 | **Evidence over invention** | Every number traces to a real submitted report. No exceptions. |
| 2 | **Action over analytics** | At least one agent performs a real external action. Display alone is not agentic AI. |
| 3 | **Accountability over reporting** | The differentiator is what happens after the report, not the report form itself. |
| 4 | **Draft, not authority** | AI-generated legal documents are always labeled as drafts for human review. |
| 5 | **Ship the core loop before adding features** | A working 3-agent loop beats a broken 5-agent loop. |

---

## What CivicPulse Builds

| Feature | Agent | Purpose |
|---|---|---|
| Photo-based issue intake | Agent 1 | Gemini Vision extracts type, severity, description from an unstructured photo |
| Duplicate/cluster detection | Agent 2 | Groups reports of the same real-world issue; raises confidence with repeat reports |
| Impact Intelligence | Agent 3 | Evidence-based: affected area, report frequency, risk level — no invented scores |
| Action Generator | Agent 4 | Drafts complaint, RTI, community summary from accumulated evidence |
| Escalation Agent | Agent 5 | Sends email (SendGrid) and/or exports PDF — a real external action |
| Public Issue Tracker | Frontend | Map + list, evidence counts, escalation status — all labeled self-reported |

---

## What CivicPulse Does NOT Build

| Non-Goal | Reason |
|---|---|
| Ward health scores / officer performance rankings | Cannot survive "where did this number come from?" — structural credibility failure |
| Legal-authority claims on generated documents | RTI/complaint drafts are assistance tools, not court filings |
| Surveillance or political profiling features | Contradicts community-evidence framing; judge red flag |
| Auth system / user accounts | 7-day build scope; rate limiting is sufficient |
| Background task queue (Celery/RQ) | Over-engineered for hackathon scale; FastAPI BackgroundTasks is sufficient |
| Gamification | Irrelevant to accountability story |
| Voice input | Tier 3 only; build only if all P0+P1 complete with time remaining |
| Community verification votes | Tier 3 only |
| Real-time push notifications | Not in scope |
| Resolution tracking (verifying the issue was fixed) | Not in scope; out of MVP |

---

## User Personas

| Persona | Goal | Pain Point Solved |
|---|---|---|
| Reporting Citizen | Document an issue with minimal effort | Gets a drafted complaint/RTI within minutes — not just a ticket number |
| Community Group | Compile evidence of a recurring problem | Cluster + impact summary makes the evidence trail presentable and sendable |
| Hackathon Judge | Assess genuine agentic AI and real-world credibility | Every output traces to real evidence; Agent 5 performs a verifiable external action |

---

## Success Criteria (Hackathon Scope)

| Criterion | Acceptance Test |
|---|---|
| Core pipeline works live | Photo → classification → cluster → impact summary → action draft → real send/export, end-to-end, on demand |
| Zero fabricated claims | No metric, score, or ranking in the UI, demo, or docs that cannot be traced to a submitted report |
| Real external action demonstrable | A real email arrives in a real inbox OR a real PDF downloads — live, on demand |
| Deployed link stable | Publicly accessible URL stable through the evaluation window, tested from mobile and desktop |
| Demo rehearsed under adversarial conditions | 10+ runs: slow Gemini, email off, no WiFi, empty tracker, judge questions |

---

## Judging Strategy

This project is scored on 5 dimensions. Every feature must map to at least one. See `JUDGING_STRATEGY.md` for full mapping.

| Judging Dimension | Estimated Weight | How CivicPulse Wins |
|---|---|---|
| Agentic AI Depth | ~25% | 5-agent chain with real external action; human-in-the-loop gate that actually gates something |
| Innovation / Differentiation | ~20% | Evidence-based accountability reframe, not reporting-plus-routing |
| Google Technologies | ~20% | Gemini 2.0 Flash Vision (primary), Google Maps JS, Cloud/AI Studio deployment |
| Real-World Impact | ~20% | RTI drafts + real send = tangible artifact; evidence-based, not invented |
| Technical Execution | ~15% | Clean architecture, error handling, no fabricated fallbacks, stable deployment |

---

## Known Tradeoffs (Documented Explicitly — Not Hidden)

| Tradeoff | Decision | Why |
|---|---|---|
| SQLite over Firebase | Faster solo build; Firebase adds auth/SDK overhead | Offset by depth of Gemini Vision usage |
| Synchronous Agent 1+2 on submit | Demo predictability | Agent 3 and 4 run as BackgroundTasks at escalation threshold to cut user-facing latency |
| No auth layer | Rate limiting by IP is sufficient for hackathon scope | Documented as known limitation, not hidden |
| Evidence-based risk level over fabricated score | Less flashy in a screenshot | Survives judge cross-examination; fabricated score does not |
| SendGrid HTTP API over raw SMTP | SMTP port 587 blocked on venue WiFi | SendGrid HTTP API works on any network |
| RTI Draft retained (not cut) | Most memorable agentic artifact | Repositioned as "AI-generated draft — review before submission" |

---

## Critical Rules For All AI Coding Agents

See `ANTI_HALLUCINATION_RULES.md` for the complete, enforced list. Summary:

1. Never invent APIs, database fields, or routes.
2. Never introduce a fabricated metric, score, or ranking about a real official, department, or government entity. This is the highest-priority constraint. No exception.
3. Never claim legal authority for generated documents.
4. Never bypass the Agent 5 human-approval gate.
5. Never return HTTP 200 with a silently degraded result.
6. If context is missing, ask — do not invent project facts.
7. Defer to this file if any other document appears to conflict with these rules.