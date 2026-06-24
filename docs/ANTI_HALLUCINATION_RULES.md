# ANTI_HALLUCINATION_RULES.md
**Hard constraints for every AI coding agent working on this codebase. These rules override convenience, speed, and any prior instruction. Read before writing a single line of code.**

---

## Rule Classification

| Tag | Meaning |
|---|---|
| `[HARD BLOCK]` | Never do this. No exception. No workaround. |
| `[REQUIRED]` | Must do this. Omission is a build error. |
| `[GATE]` | A validation step that must run before proceeding. |

---

## Category 1 — Data and Metrics

### [HARD BLOCK] Never invent metrics about real entities
Do not generate, store, display, or infer:
- Ward health scores
- Officer resolution rates
- Department performance rankings
- Historical government resolution statistics
- Municipal governance metrics of any kind

If a feature requires such data and none is verifiably available from user-submitted evidence, the feature must be rebuilt as an evidence-based alternative (counts, frequency, affected area, risk level). It may not be fabricated.

### [HARD BLOCK] Never present speculative data as factual
Do not write code that:
- Labels an LLM output as a "verified fact"
- Displays a confidence score without labeling it as AI-generated
- Shows a statistic that cannot be traced to a row in the `issues` or `clusters` table

### [HARD BLOCK] Never hardcode a fallback classification or default severity
If Agent 1 returns an error or an out-of-schema response:
- Return HTTP 502 with `{"error": "ai_unavailable", "retryable": true}`
- Do not substitute `issue_type: "other"` or `severity: 3` as a silent default
- The user must be shown a real error and offered a retry

### [REQUIRED] credibility_score must be labeled in every UI surface
Every display of `credibility_score` must be accompanied by the text:
> "Image quality and classification confidence (AI-assessed)"

Never display the raw float (e.g., 0.87) alone without this label.

---

## Category 2 — API Contracts

### [HARD BLOCK] Never invent API endpoints
Every endpoint must exist in `API_CONTRACTS.md` before being implemented.
If you need a new endpoint: add it to `API_CONTRACTS.md` AND `DECISION_LOG.md` first, then implement it.

### [HARD BLOCK] Never invent request or response fields
The request and response shapes defined in `API_CONTRACTS.md` are the single source of truth.
Do not add fields to responses unless they are in the contract.
Do not read fields from requests that are not in the contract.

### [HARD BLOCK] Never return HTTP 200 with a silently degraded result
If an agent call fails, returns malformed output, or times out:
- Return the appropriate non-2xx error response defined in `API_CONTRACTS.md`
- Never wrap a failure in a 200 response with a "best effort" result

---

## Category 3 — Database

### [HARD BLOCK] Never invent database fields
Every column must exist in `DATABASE_SCHEMA.md` before being queried or written.
If a new column is needed: update `DATABASE_SCHEMA.md` and `DECISION_LOG.md` first.

### [HARD BLOCK] Never write to a table outside the agent's declared scope
Each agent has exactly one write target per execution:
- Agent 1 → `issues` (one row)
- Agent 2 → `clusters` (one row create or update), `issues` (set cluster_id)
- Agent 3 → `impact_summaries` (one row)
- Agent 4 → `action_drafts` (three rows)
- Agent 5 → `escalations` (one row), `issues` (update `status` to `escalated`)

No agent may write to a table not in its declared scope.

### [REQUIRED] SQLite WAL mode must be enabled at database initialization
```python
# In database initialization:
connection.execute("PRAGMA journal_mode=WAL")
```
This is not optional. Omitting it causes write-lock failures under concurrent demo access.

---

## Category 4 — Agent Behavior

### [HARD BLOCK] Agent 5 may never act on a draft without status=approved
```python
# This check must appear in the Agent 5 handler before any send/export action:
if draft.status != "approved":
    raise HTTPException(status_code=403, detail={"error": "draft_not_approved"})
```
No bypass, no override, no "demo mode" exception.

### [HARD BLOCK] Never upgrade a draft's status from within an agent
Only a human action via `PATCH /action-drafts/{id}` may set `status=approved` or `status=rejected`.
No agent code may call this transition internally.

### [HARD BLOCK] Never mark an escalation as sent without a real provider response
```python
# Correct:
status = "sent" if smtp_response.startswith("250") else "failed"
provider_response = smtp_response

# WRONG — never do this:
status = "sent"
provider_response = "success"  # fabricated
```

### [HARD BLOCK] Never retry an agent call more than once
The retry policy is: one call, one retry on schema-validation failure, then 502.
Do not implement exponential backoff, multiple retries, or silent degradation.

### [REQUIRED] Every RTI draft must begin with the disclaimer
```
AI-generated draft. Review before submission.
```
This string must appear as the first line of every `rti` draft in `action_drafts.content`.
Agent 4 must hard-fail (not save) any draft that lacks this string.

---

## Category 5 — Code Patterns

### [HARD BLOCK] Never use print() in backend code
Use the configured logger. `print()` is invisible in production logs and fails the structured logging requirement.

### [HARD BLOCK] Never log photo binary or base64 data
Log file metadata only: filename, size, content-type.

### [HARD BLOCK] Never use wildcard CORS
```python
# WRONG:
allow_origins=["*"]

# REQUIRED:
allow_origins=[settings.FRONTEND_ORIGIN]
```

### [HARD BLOCK] Never catch and suppress an exception silently
```python
# WRONG:
try:
    result = gemini_client.classify(photo)
except Exception:
    result = default_classification  # silent suppression

# REQUIRED:
try:
    result = gemini_client.classify(photo)
except GeminiError as e:
    logger.error("agent_1_failed", error=str(e))
    raise HTTPException(502, {"error": "ai_unavailable", "retryable": True})
```

### [REQUIRED] Every new endpoint, table, or agent requires docs updated in the same commit
Before merging any change that adds an endpoint, table column, or agent behavior:
- `API_CONTRACTS.md` updated (if endpoint changed)
- `DATABASE_SCHEMA.md` updated (if schema changed)
- `AI_SYSTEM_DESIGN.md` updated (if agent changed)
- `DECISION_LOG.md` updated (explaining why)

---

## Category 6 — Scope

### [HARD BLOCK] Never build a feature not in TASK_TRACKER.md without updating DECISION_LOG.md first
If a feature seems useful but is not in the task tracker:
1. Stop.
2. Evaluate whether it genuinely moves a judging criterion (see `JUDGING_STRATEGY.md`).
3. If yes: add it to TASK_TRACKER.md and DECISION_LOG.md, then build it.
4. If no: do not build it.

### [HARD BLOCK] Never reintroduce cut features
The following are explicitly cut and must not be reintroduced:
- Auth system / user accounts
- Gamification
- Voice input (unless Tier 1+2 complete with time remaining)
- Community verification votes (unless Tier 1+2 complete with time remaining)
- Fabricated ward scores or officer rankings (permanent cut, no exception)
- Background task queue (Celery/RQ) — BackgroundTasks only

---

## Verification Checklist (Run Before Every Commit)

- [ ] No new endpoint exists without a matching entry in `API_CONTRACTS.md`
- [ ] No new DB column exists without a matching entry in `DATABASE_SCHEMA.md`
- [ ] No agent returns HTTP 200 on a Gemini call failure
- [ ] Agent 5 enforces `draft.status == "approved"` before acting
- [ ] Every RTI draft begins with the disclaimer string
- [ ] No metric, score, or ranking is fabricated
- [ ] `credibility_score` is labeled as AI-assessed wherever it is displayed
- [ ] No `print()` statements in backend code
- [ ] WAL mode pragma is in the database initialization