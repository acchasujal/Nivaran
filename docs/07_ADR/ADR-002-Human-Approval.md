# Architecture Decision Record: ADR-002-Human-Approval

## Status
**Approved** (2026-07-16)

---

## Context
CivicPulse generates statutory Right to Information (RTI) drafts and official grievances. Filing legal notices in a citizen's name using fully automated AI pipelines introduces legal liabilities and violates the user's agency.

---

## Decision
No draft or escalation package may be submitted to external government endpoints (email, CPGRAMS APIs) without explicit, manual human consent. 
*   Generated documents must render as editable text.
*   Citizens must explicitly review and tap "Approve & Send" to authorize.
*   The API enforces a hard state gate: `POST /api/escalations` rejects any draft not marked `status="approved"`.

---

## Alternatives Considered
*   **Fully Automated Ingestion to Escalation:** Rejected. Poses severe legal risks if the AI generates hallucinated statistics, false accusations, or sends filings without consent.

---

## Consequences
*   **Legal Compliance:** Preserves citizen consent and legal agency, protecting the platform and users.
*   **Trust:** Strengthens the legal credibility of filings since users check the drafts before they are sent.
*   **Friction:** Adds a step for citizens, but is mitigated by a highly optimized, single-tap review panel.

---

## Related Documents
*   [VISION.md](file:///d:/Projects/CivicPulse/docs/01_Product/VISION.md)
*   [ARCHITECTURE.md](file:///d:/Projects/CivicPulse/docs/02_Architecture/ARCHITECTURE.md)
*   [SCREEN_BLUEPRINTS.md](file:///d:/Projects/CivicPulse/docs/04_UX/SCREEN_BLUEPRINTS.md#screen-10-human-approval-gate)
