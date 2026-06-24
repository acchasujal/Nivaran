# FEATURE_REGISTRY.md

| Feature | Status | Dependencies | Owner | Files Involved | API Deps | AI Deps | Risk | Notes |
|---|---|---|---|---|---|---|---|---|
| Photo intake & classification | Tier 1 — not started | Gemini API key | solo dev | `agent_1_intake.py`, `IntakePage` | `POST /issues` | Agent 1 | Medium | Accuracy on real civic photos must be spot-checked with ~15-20 real test photos before Day 2 ends |
| Duplicate/cluster detection | Tier 1 — not started | Issue intake | solo dev | `agent_2_verification.py`, `geo_service.py` | internal to `/issues` | Agent 2 (partial) | Medium | Confidence-band default-to-new-cluster rule must be implemented, not skipped |
| Public tracker (map + list) | Tier 1 — not started | Cluster data | solo dev | `TrackerPage`, `MapView` | `GET /issues` | none | Low | Must label all data "self-reported" in UI copy |
| Impact Intelligence | Tier 1 — not started | Cluster + 1 escalation threshold logic | solo dev | `agent_3_impact.py`, `ImpactSummaryPanel` | `POST /clusters/{id}/impact` | Agent 3 | Medium | Output validator (no invented score) is a hard gate, not optional |
| Action Generator (complaint/RTI/summary) | Tier 2 — not started | Impact summary | solo dev | `agent_4_action_generator.py`, `DraftCard` | `POST /clusters/{id}/generate-drafts` | Agent 4 | Medium-High | RTI disclaimer string check is a hard gate |
| Human approval step | Tier 1 (required before Agent 5) | Action drafts | solo dev | `PATCH /action-drafts/{id}` | — | none | Low | Cannot be skipped — Agent 5 enforces draft.status==approved |
| Escalation Agent (real send/export) | Tier 2 — not started | Approved draft, SendGrid API key | solo dev | `agent_5_escalation.py`, `email_client.py`, `pdf_export.py` | `POST /escalations` | none (action layer) | High | This is the single most important live-demo proof point — test the real send well before Day 6 |
| Agent Progress Timeline | Tier 1 — not started | none | solo dev | `AgentProgressTimeline.tsx`, `IssueDetailPage` | none | none | Low | Visual tracking timeline across the 5 agents displayed on the detail page to emphasize agentic depth |
| Voice note input | Tier 3 — stretch | Issue intake | solo dev | — | — | Agent 1 (audio) | Medium | Ship only if Tier 1+2 complete with time remaining |
| Community verification votes | Tier 3 — stretch | Tracker | solo dev | — | — | none | Low | Out of scope unless ahead of schedule |
| Gamification | Cut | — | — | — | — | — | — | Explicitly excluded per `PROJECT_CONTEXT.md` — adds nothing to credibility or accountability story |
