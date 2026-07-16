# Architecture Decision Record: ADR-006-WhatsApp-Government-Workflow

## Status
**Approved** (2026-07-16)

---

## Context
Ward officers rarely adopt new SaaS dashboards or check external web portals due to time constraints and existing institutional workflows. Forcing officers to use a web portal reduces adoption rates and stalls resolution tracking.

---

## Decision
The primary daily workflow for government officers will operate through existing channels (Email, SMS, and WhatsApp). 
*   **Alerts:** Sent to the officer's email/WhatsApp as structured alerts.
*   **Acknowledge:** Officers reply `ACK` to auto-advance the case state.
*   **Resolution:** Officers reply with a photo and the text `FIXED` to log a repair.
*   **Web Portal:** Maintained as a secondary system of record and audit.

---

## Alternatives Considered
*   **Mandatory Web Dashboard Workflow:** Rejected. Higher barrier to entry for municipal workers, risking slow adoption and stale cases.

---

## Consequences
*   **Adoption Rate:** Officers interact with CivicPulse within their existing communication flows, increasing response rates.
*   **Input Parsing:** The backend must handle unstructured text/photo parsing, with a fallback queue to human moderators for unparseable replies.

---

## Related Documents
*   [ARCHITECTURE.md](file:///d:/Projects/CivicPulse/docs/02_Architecture/ARCHITECTURE.md#5-whatsapp-cpgrams-integration-architectures)
*   [JOURNEYS.md](file:///d:/Projects/CivicPulse/docs/04_UX/JOURNEYS.md#5-the-ward-officer)
