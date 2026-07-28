# Nivaran Evaluation Matrix

This is a portfolio-level evaluation record for the currently implemented workflow. It documents observable contracts and existing verification coverage; it does not claim that the broader municipal platform is complete.

## Critical workflow contracts

| Area | Observable contract | Existing verification |
|---|---|---|
| Evidence gate | Invalid media is rejected before issue persistence. | `backend/tests/test_stage_0.py` |
| Intake classification | Valid evidence produces structured issue type, severity, description, and credibility. | `backend/tests/test_agent_1.py` |
| Clustering | Nearby same-type evidence can merge; uncertain matches default safely to a new cluster. | `backend/tests/test_agent_2.py` |
| Action generation | Thresholded clusters produce impact data and action drafts with RTI disclaimer validation. | `backend/tests/test_agent_3.py`, `test_agent_4.py` |
| Approval boundary | Escalation rejects drafts that are not approved. | `backend/tests/test_agent_5.py` |
| Dispatch fallback | Email failure can produce a PDF fallback when configured. | `backend/tests/test_agent_5.py` |
| Community verification | A verification vote is accepted through the case API. | `backend/tests/test_case_workflow.py` |
| Authentication | Login, refresh rotation, logout, anonymous sessions, and RBAC are covered. | `backend/tests/test_auth.py`, `test_production_remediation.py` |
| Alternate intake | WhatsApp greeting, media, location, full flow, idempotency, and status callbacks are covered. | `backend/tests/test_whatsapp_webhook.py` |
| Frontend safety | Citizen shell does not mount internal evaluation; offline flow does not invent a case ID. | `frontend/scripts/frontend-smoke.test.mjs` |

## Local verification commands

```text
cd frontend && npm.cmd run typecheck
cd frontend && npm.cmd run test
cd frontend && npm.cmd run build
cd backend && python -m pytest -q
```

## Scope boundary

This matrix does not claim complete durable job processing, object storage, municipal authority routing, full repair/resolution lifecycle, native offline media synchronization, multilingual/voice intake, or model-quality benchmarking. Those remain portfolio-scale work beyond the current verified core.
