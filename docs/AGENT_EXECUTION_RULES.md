# AGENT_EXECUTION_RULES.md
**Defines exactly when each agent runs, what it may do, and what it is forbidden from doing. These rules govern all agent implementations. No agent may exceed its defined scope.**

---

## Overview

| Agent | Trigger | Sync/Async | AI Call | Real External Action |
|---|---|---|---|---|
| Agent 1 | POST /issues (always) | Synchronous | Yes — Gemini Vision | No |
| Agent 2 | POST /issues (after Agent 1 succeeds) | Synchronous | Conditional (semantic dedup only) | No |
| Agent 3 | After Agent 2 (only when cluster.report_count >= ESCALATION_THRESHOLD) | BackgroundTask (async) | Yes — Gemini Text | No |
| Agent 4 | After Agent 3 (only when cluster.report_count >= ESCALATION_THRESHOLD) | BackgroundTask (async) | Yes — Gemini Text | No |
| Agent 5 | POST /escalations (explicit human trigger only) | Synchronous | No | Yes — SendGrid email OR PDF export |

---

## Agent 1 — Issue Understanding

### Trigger Conditions
- Fires on every `POST /issues` call, unconditionally.
- Fires after file validation passes (file type, file size, coordinate validity).
- Does NOT fire if file validation fails (returns 422 before Agent 1 is called).

### Allowed Actions
- Read the uploaded photo as base64.
- Make one Gemini Vision API call with the structured-output schema.
- Make one retry call if the output fails schema validation (invalid issue_type enum or severity outside 1–5).
- Write one row to the `issues` table.

### Forbidden Actions
- Making more than one retry (fail to 502 after one retry).
- Substituting a default value for a failed or invalid classification.
- Returning HTTP 200 if the Gemini call fails or times out.
- Writing to any table other than `issues`.
- Generating any metric or claim about a real named official, department, or location.

### Failure Behavior
- Gemini call errors or times out (>15s): return 502 `{"error": "ai_unavailable", "retryable": true}`. Delete or mark the pending issue row.
- Output fails schema validation after retry: return 502. Do not save the malformed output.

### Output Constraints
```json
{
  "issue_type": "road_damage | lighting | water | waste | other",
  "severity": 1-5,
  "description": "≤280 chars",
  "credibility_score": 0.0-1.0,
  "image_flags": ["clear" | "blurry" | "duplicate_visual" | "low_confidence"]
}
```
All fields required. No additional fields. No named officials or departments in description.

---

## Agent 2 — Issue Verification

### Trigger Conditions
- Fires after Agent 1 succeeds and the issue row has status=classified.
- Fires unconditionally for every `POST /issues` call that reaches this stage.

### Allowed Actions
- Query `clusters` table for rows within 300m radius with matching issue_type.
- If candidate clusters exist: make one Gemini text call to assess semantic similarity between the new issue description and the candidate cluster's description.
- Create a new row in `clusters` if no match or low confidence.
- Update an existing `clusters` row (increment report_count, update last_reported_at) if high confidence match.
- Write `issue.cluster_id` and update `issue.status=clustered`.

### Forbidden Actions
- Merging clusters with confidence in the 0.4–0.6 band (default to new cluster in this range).
- Making more than one Gemini call per issue submission.
- Writing to any table other than `clusters` and the `cluster_id` / `status` fields of `issues`.
- Generating any claim about government performance, ward jurisdiction, or official responsibility.

### Confidence Band Handling (Hard Rule)
| Confidence | Action |
|---|---|
| >= 0.6 | Merge into existing cluster |
| 0.4–0.6 | Create new cluster (default-to-new — false merges corrupt evidence counts) |
| < 0.4 | Create new cluster |

### Failure Behavior
- Gemini semantic dedup call fails: create new cluster (fail-safe). Log the failure. Do not block the issue submission.
- If Agent 2 fails entirely: return 502. The issue row is written but cluster_id remains null.

---

## Agent 3 — Impact Intelligence

### Trigger Conditions
- Fires as a FastAPI BackgroundTask after Agent 2 completes, ONLY when the cluster's report count crosses the escalation threshold (`cluster.report_count >= ESCALATION_THRESHOLD`).
- Does NOT fire on every cluster increment.
- Can also be triggered manually via `POST /clusters/{id}/impact` (requires cluster to meet escalation threshold; returns 409 otherwise).

### Allowed Actions
- Read all `issues` rows in the cluster.
- Make one Gemini text call with all member issue descriptions as input context.
- Write one row to `impact_summaries` (upsert: replace existing row for same cluster_id).

### Forbidden Actions
- Generating any numeric "performance score," ranking, or rating about a named official or department.
- Naming a specific real official or department as "responsible" in any output field.
- Writing any field containing a statistic not derivable from the cluster's actual issue data.
- Writing to any table other than `impact_summaries`.

### Output Validation (Hard Gate)
Reject output and regenerate with stricter system instruction if:
- Output contains a numeric score field not in the defined schema.
- Output names a specific real official or department as "responsible."
- Output contains a risk_level value not in `{low, moderate, high}`.

After one failed regeneration: write `risk_level=null` and surface the failure in the API response. Do not save invalid output.

### Output Constraints
```json
{
  "affected_area_description": "string — geographic/community terms only",
  "potential_consequences": "string — derived from issue_type and severity, no invented data",
  "risk_level": "low | moderate | high",
  "evidence_count": "integer — equals cluster.report_count at time of generation"
}
```

---

## Agent 4 — Action Generator

### Trigger Conditions
- Fires as a FastAPI BackgroundTask immediately after Agent 3 successfully completes for a cluster that has crossed `ESCALATION_THRESHOLD` (env var, default 3, or overridden via `DEMO_THRESHOLD_OVERRIDE` to 1).
- Does NOT fire on every cluster increment.
- Can also be triggered manually via `POST /clusters/{id}/generate-drafts` (requires impact_summary to exist; returns 409 otherwise).

### Allowed Actions
- Read the cluster object, all member issues, and the current impact_summary.
- Make one Gemini text call returning all three draft types (or three separate calls).
- Write exactly three rows to `action_drafts`: one each for complaint, rti, community_summary.
- All rows written with status=pending_review.

### Forbidden Actions
- Writing a draft that references a statistic not present in impact_summary or member_issues.
- Writing an RTI draft that does not begin with "AI-generated draft. Review before submission."
- Writing a draft that names a real official as "responsible" for the issue.
- Upgrading any draft's status to "approved" — this is a human-only action.
- Writing to any table other than `action_drafts`.

### Disclaimer Hard Gate (Non-Negotiable)
```python
# This check must run before any action_drafts row is written:
if draft_type == "rti" and not content.startswith("AI-generated draft. Review before submission."):
    raise ValueError("RTI draft missing required disclaimer. Regenerating.")
# Regenerate once. If disclaimer still missing after regeneration: raise 502, do not save.
```

### Output Constraints
```json
{
  "complaint_draft": "string — evidence summary + resolution request, no invented statistics",
  "rti_draft": "string — MUST begin with 'AI-generated draft. Review before submission.'",
  "community_summary": "string — public-facing, evidence-based, no political-intelligence framing"
}
```

---

## Agent 5 — Escalation Agent

### Trigger Conditions
- Fires ONLY on explicit `POST /escalations` call from the user (via EscalationButton in the frontend).
- Fires ONLY if the referenced `action_drafts` row has `status=approved`.
- Never fires automatically, never fires on a timer, never fires without explicit human trigger.

### Allowed Actions
- Read the `action_drafts` row content.
- If method=email: call SendGrid HTTP API to send the draft content to the specified recipient.
- If method=pdf_export: call pdf_export.render() to produce a downloadable PDF of the draft content.
- Write one row to `escalations` with the real status and real provider_response.
- Update the parent issue status to "escalated".

### Forbidden Actions
- Acting on any draft with status != "approved". Return 403 if attempted.
- Marking escalation status="sent" without a real provider confirmation.
- Making any AI (Gemini) call. Agent 5 is a pure action layer with no AI reasoning.
- Writing to any table other than `escalations` and the `status` field of the parent `issues` row.

### Failure Behavior
- SendGrid call fails (any non-202 response): write `status=failed`, `provider_response=<real error string>`. Return 502. Do NOT attempt retry automatically.
- PDF export fails: write `status=failed`. Return 502.
- Both failure cases: the escalations row is always written with the real outcome. The user is shown the actual provider error message. Nothing is silently retried or marked as success.

### Email-to-PDF Fallback (Demo Behavior)
When `method=email`, SendGrid fails, and `AGENT5_PDF_FALLBACK=true` is set, Agent 5 automatically generates a PDF fallback. In this fallback flow, only a single escalation record is written in the database (with `status="exported"` and `provider_response` documenting the email failure). The PDF download URL is returned to the client. This fallback is the default behavior in demo mode.

---

## Execution Sequence Enforcement

```
POST /issues received
    │
    ▼
[SYNC] Validate file + coords ──► 422 if invalid (Agent 1 never called)
    │
    ▼
[SYNC] Agent 1 ──► 502 if Gemini fails (Agent 2 never called)
    │
    ▼
[SYNC] Agent 2 ──► 502 if complete failure (issue row has null cluster_id)
[201 returned to user] ──────────────────────────────────┐
    │                                                     │
    ├── [report_count < threshold] ──► done               │
    │                                                     │
    └── [report_count >= threshold]                       │
            │                                             │
            ▼ [BackgroundTask]                            │
        [ASYNC] Agent 3 ──► upsert impact summary         │
            │                                             │
            ▼                                             │
        [ASYNC] Agent 4 ──► generate drafts               │
                                                          │
[Human opens IssueDetailPage] ◄───────────────────────────┘
    │
    ▼
[Human clicks Approve on DraftCard]
    │
    ▼
PATCH /action-drafts/{id} {status: "approved"}
    │
    ▼
[Human clicks EscalationButton]
    │
    ▼
POST /escalations ──► [SYNC] Agent 5 ──► real send or export
```

---

## Environment Variables That Control Agent Behavior

| Variable | Default | Demo Value | Effect |
|---|---|---|---|
| `ESCALATION_THRESHOLD` | 3 | 1 | Number of reports required to trigger Agent 4 |
| `GEMINI_TIMEOUT_SECONDS` | 15 | 15 | Per-agent Gemini call timeout |
| `AGENT5_PDF_FALLBACK` | false | true | Auto-attempt PDF if email fails |
| `DEMO_MODE` | false | true | Enables seeded data, threshold override, verbose demo logging |