# DATABASE_SCHEMA.md

Engine: SQLite (with WAL mode enabled). All timestamps UTC, ISO 8601 strings.

## Table: `issues`
**Purpose:** One row per citizen-submitted report.

| Field | Type | Constraints | Notes |
|---|---|---|---|
| `id` | TEXT (UUID) | PK | |
| `photo_url` | TEXT | NOT NULL | stored file path or object storage URL |
| `latitude` | REAL | NOT NULL | |
| `longitude` | REAL | NOT NULL | |
| `user_note` | TEXT | nullable | optional free-text from reporter |
| `issue_type` | TEXT | NOT NULL | enum: `road_damage`, `lighting`, `water`, `waste`, `other` |
| `severity` | INTEGER | NOT NULL, 1–5 | from Agent 1 |
| `description` | TEXT | NOT NULL | Gemini-generated summary |
| `credibility_score` | REAL | NOT NULL, 0.0–1.0 | from Agent 1, evidence-based (image clarity, quality, visual integrity, and classification confidence); never represents or implies the personal credibility or trustworthiness of the reporter |
| `cluster_id` | TEXT (UUID) | FK → `clusters.id`, nullable | set by Agent 2 |
| `status` | TEXT | NOT NULL | `classified`, `clustered`, `drafted`, `escalated` |
| `created_at` | TEXT | NOT NULL | |

## Table: `clusters`
**Purpose:** Groups issues referring to the same real-world problem.

| Field | Type | Constraints | Notes |
|---|---|---|---|
| `id` | TEXT (UUID) | PK | |
| `area_label` | TEXT | NOT NULL | self-reported area name, e.g. nearest landmark/street — **never an official ward/jurisdiction performance claim** |
| `center_lat` | REAL | NOT NULL | |
| `center_lng` | REAL | NOT NULL | |
| `report_count` | INTEGER | NOT NULL, default 1 | increments as new issues join cluster |
| `first_reported_at` | TEXT | NOT NULL | |
| `last_reported_at` | TEXT | NOT NULL | |

## Table: `impact_summaries`
**Purpose:** Agent 3 output. Evidence-based, never a fabricated score.

| Field | Type | Constraints | Notes |
|---|---|---|---|
| `id` | TEXT (UUID) | PK | |
| `cluster_id` | TEXT (UUID) | FK → `clusters.id`, NOT NULL | |
| `affected_area_description` | TEXT | NOT NULL | |
| `potential_consequences` | TEXT | NOT NULL | generated narrative grounded in evidence_count + issue_type |
| `risk_level` | TEXT | NOT NULL | enum: `low`, `moderate`, `high` — derived from severity + report_count, **not** an invented government metric |
| `evidence_count` | INTEGER | NOT NULL | = cluster.report_count at time of generation |
| `generated_at` | TEXT | NOT NULL | |

## Table: `action_drafts`
**Purpose:** Agent 4 output. All rows carry the draft disclaimer in `content`.

| Field | Type | Constraints | Notes |
|---|---|---|---|
| `id` | TEXT (UUID) | PK | |
| `cluster_id` | TEXT (UUID) | FK → `clusters.id`, NOT NULL | |
| `draft_type` | TEXT | NOT NULL | enum: `complaint`, `rti`, `community_summary` |
| `content` | TEXT | NOT NULL | full document text, must begin with "AI-generated draft. Review before submission." for `rti` drafts |
| `status` | TEXT | NOT NULL | `pending_review`, `approved`, `rejected` |
| `created_at` | TEXT | NOT NULL | |
| `reviewed_at` | TEXT | nullable | |

## Table: `escalations`
**Purpose:** Agent 5 output — the real external action and its actual outcome.

| Field | Type | Constraints | Notes |
|---|---|---|---|
| `id` | TEXT (UUID) | PK | |
| `draft_id` | TEXT (UUID) | FK → `action_drafts.id`, NOT NULL | |
| `method` | TEXT | NOT NULL | enum: `email`, `pdf_export` |
| `recipient` | TEXT | nullable | required if method=email |
| `status` | TEXT | NOT NULL | `sent`, `failed`, `exported` — **must reflect the real provider response, never assumed success** |
| `provider_response` | TEXT | nullable | raw SMTP/export result, for debugging and credibility ("show the real send") |
| `sent_at` | TEXT | nullable | |
| `created_at` | TEXT | NOT NULL | |

## Entity Relationship Description
```
issues       (many) ──► clusters        (one)
clusters     (one)  ──► impact_summaries (many, one active at a time)
clusters     (one)  ──► action_drafts    (many)
action_drafts(one)  ──► escalations      (many)
```

## Future Migrations (not in hackathon scope)
- Add `users` table if accounts/auth are introduced post-hackathon.
- Move `photo_url` to object storage (S3/GCS) instead of local disk for multi-instance deployment.
- Add `verification_votes` table if community verification (citizens confirm resolution) is added — explicitly Tier 3, ship only if ahead of schedule.
