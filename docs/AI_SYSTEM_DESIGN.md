# AI_SYSTEM_DESIGN.md

Model: Gemini 2.0 Flash, structured (JSON-schema) output mode for Agents 1–4. Agent 5 makes no AI call — it performs a real action using Agent 4's approved output.

---

## Agent 1 — Issue Understanding

**Input Schema**
```json
{ "photo_base64": "string", "latitude": "float", "longitude": "float", "user_note": "string|null" }
```

**Prompt strategy:** Vision + text, single call. System instruction constrains output to the defined enum/range — never asked to estimate anything about a government entity.

**Output Schema**
```json
{
  "issue_type": "road_damage | lighting | water | waste | other",
  "severity": "integer 1-5",
  "description": "string, <= 280 chars",
  "credibility_score": "float 0.0-1.0", // AI-assessed float representing image quality, clarity, and visual integrity, as well as classification confidence. Strictly evidence-based; never implies personal user credibility.
  "image_flags": ["clear" | "blurry" | "duplicate_visual" | "low_confidence"]
}
```

**Validation Logic:** Reject and retry once if `severity` outside 1–5 or `issue_type` not in enum. After one failed retry, return 502 `ai_unavailable` rather than guessing a default.

**Failure Handling:** If Gemini call errors or times out (>15s), return 502. Never substitute a hardcoded fake classification.

---

## Agent 2 — Issue Verification

**Input Schema**
```json
{ "issue": "Agent1 output", "nearby_clusters": "[cluster objects within 300m]" }
```

**Logic:** Primarily deterministic (haversine distance + issue_type match), with Gemini called only to assess whether a free-text description plausibly matches an existing cluster's description (semantic dedup), since this is a genuine reasoning step, not arithmetic.

**Output Schema**
```json
{ "is_duplicate_of_cluster": "uuid|null", "confidence": "float 0.0-1.0", "create_new_cluster": "boolean" }
```

**Validation Logic:** If `confidence` ambiguous (0.4–0.6 band), default to creating a new cluster rather than guessing a merge — false-merges corrupt evidence counts, which Truth 2 treats as a credibility risk.

---

## Agent 3 — Impact Intelligence

**Timing/Trigger:** Runs asynchronously as a FastAPI `BackgroundTask` ONLY when the cluster's report count crosses the escalation threshold (`cluster.report_count >= ESCALATION_THRESHOLD`).

**Input Schema**
```json
{ "cluster": "cluster object", "member_issues": "[issue objects]" }
```

**Prompt strategy:** Long-context single call over all member issue descriptions + counts. System instruction explicitly forbids generating any numeric "performance score," ranking, or claim about a named official/department — output must stay in the affected-area/consequence/risk-level vocabulary defined in `ARCHITECTURAL_TRUTHS.md` Truth 6.

**Output Schema**
```json
{
  "affected_area_description": "string",
  "potential_consequences": "string",
  "risk_level": "low | moderate | high",
  "evidence_count": "integer"
}
```

**Validation Logic:** Reject output if it contains a numeric score not present in the defined schema, or if it names a specific real official/department as "responsible" — regenerate with a stricter system instruction. This check is a hard gate, not a style preference.

---

## Agent 4 — Action Generator

**Timing/Trigger:** Runs asynchronously as a FastAPI `BackgroundTask` immediately after Agent 3 successfully completes for a cluster that has crossed `ESCALATION_THRESHOLD`.

**Input Schema**
```json
{ "cluster": "cluster object", "impact_summary": "Agent3 output", "member_issues": "[issue objects]" }
```

**Prompt strategy:** Three separate generations (or one call returning all three fields) — complaint, RTI draft, community summary. Template + Gemini-filled facts strictly from `member_issues`/`impact_summary` — no invented dates, officials, or statistics.

**Output Schema**
```json
{
  "complaint_draft": "string — includes evidence summary and request for resolution",
  "rti_draft": "string — must begin with 'AI-generated draft. Review before submission.' and contain only facts present in input data",
  "community_summary": "string — public-facing, evidence-based, no political-intelligence framing"
}
```

**Validation Logic:** Hard-fail (reject, do not save) if `rti_draft` lacks the disclaimer string, or if any draft references a statistic not derivable from `impact_summary`/`member_issues`.

---

## Agent 5 — Escalation Agent (non-AI action layer)

**Input Schema**
```json
{ "draft_id": "uuid (status must be 'approved')", "method": "email | pdf_export", "recipient": "string|null" }
```

**Logic:** No Gemini call. `method=email` → SendGrid HTTP API send via `email_client.py`; `method=pdf_export` → render `action_drafts.content` to PDF via `pdf_export.py`. If `method=email` fails and `AGENT5_PDF_FALLBACK=true` is set, it automatically generates a PDF fallback and returns the download link, writing a single escalation record with status `exported` and capturing the email error details. This is the one agent in the pipeline that performs a real action outside the analytics/display layer, per Truth 3.

**Output Schema**
```json
{ "status": "sent | failed | exported", "provider_response": "string" }
```

**Failure Handling:** SendGrid HTTP API/export errors are captured verbatim in `provider_response` and `status=failed` (unless PDF fallback succeeds) — never overwritten with an optimistic "sent."

---

## Model Selection Rationale
Gemini 2.0 Flash chosen for: native multimodal (Vision) input in Agent 1, structured-output mode for reliable JSON across all agents, and long-context window for Agent 3's multi-issue synthesis — all required by the submission's Google Technologies criterion.

## Safety Constraints (project-specific, on top of platform safety)
- No agent may output a claim implying verified fact about a real named individual's job performance.
- No agent may upgrade a draft's status to "approved" or "sent" — those transitions require an explicit human action (`PATCH /action-drafts/{id}`, then `POST /escalations`).
