# AGENT_ONBOARDING.md
**Read this file first. Should take under 5 minutes. Then read `PROJECT_CONTEXT.md` and `ARCHITECTURAL_TRUTHS.md` before touching code.**

## Project Summary
CivicPulse v4: citizens report local infrastructure issues with a photo. The system classifies, verifies/clusters, generates an evidence-based impact summary, drafts a complaint/RTI/community-summary, and — after human approval — actually sends an email or exports a PDF. The differentiator is real action grounded in real evidence, not a fabricated-metrics dashboard.

## Architecture Summary
5 agents, in sequence: Issue Understanding → Issue Verification → Impact Intelligence → Action Generator → Escalation Agent. FastAPI backend, SQLite, React/Vite frontend, Gemini 2.0 Flash for Agents 1–4, SendGrid/PDF for Agent 5. Full detail: `ARCHITECTURE.md`.

## Current Status
Pre-build. Documentation suite complete (this file + 12 others). No code written yet. Next action: Day 1 milestone — Gemini Vision call returning structured JSON from a real photo (see `TASK_TRACKER.md`).

## Active Tasks
See `TASK_TRACKER.md`, Epic 1, Day 1–2 tasks. Currently nothing in progress.

## Important Files
| File | Why it matters |
|---|---|
| `ARCHITECTURAL_TRUTHS.md` | The non-negotiable constraints — read before writing any agent code |
| `PROJECT_CONTEXT.md` | What to build / never build, and the Critical Rules for AI Agents |
| `API_CONTRACTS.md` | Exact request/response shapes — do not invent fields |
| `DATABASE_SCHEMA.md` | Exact table/field definitions |
| `AI_SYSTEM_DESIGN.md` | Per-agent input/output schemas and validation gates |

## Known Bugs
None yet — no code exists.

## Constraints (do not violate)
1. Never generate or accept a fabricated performance score/ranking about a real official, department, or government entity (`ARCHITECTURAL_TRUTHS.md` Truth 2).
2. Every agent pipeline must include at least one real external action — currently Agent 5's email send / PDF export (Truth 3).
3. RTI drafts must always begin with the disclaimer: "AI-generated draft. Review before submission." (Truth 4).
4. Use "Community Issue Summary" / "Impact Intelligence" language — never "officer ranking," "councilor brief," or "performance score" (Truth 5).
5. Agent 5 may only act on a draft with `status: approved` — never bypass the human-approval gate.

## Coding Rules
See `CODING_STANDARDS.md` in full. The single most important one for this project: never substitute a fabricated or default value when an AI call fails or output fails validation — surface the failure, don't paper over it.
