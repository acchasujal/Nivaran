# Architecture Decision Record: ADR-001-Evidence-First

## Status
**Approved** (2026-07-16)

---

## Context
Traditional civic complaint platforms suffer from high noise (spam, text-only complaints, irrelevant images) and lack of follow-through. Municipal departments are overwhelmed, leading to low resolution rates. We need to establish a system that guarantees the integrity of citizen reports before processing downstream AI or municipal routes.

---

## Decision
All civic submissions must begin with verified visual or voice evidence. 
A report cannot exist without:
1.  An uploaded photograph or voice capture.
2.  Verified GPS coordinates or manual location pin.
3.  Deterministic Stage-0 validation checks (blur, size, metadata checks) passing successfully.

---

## Alternatives Considered
*   **Text-Only Intake Forms:** Rejected. Encourages low-credibility reports and increases processing overhead for officers.
*   **Manual Ingestion Filtering:** Rejected. Human-only moderation is slow, costly, and scales poorly.

---

## Consequences
*   **Spam Mitigation:** Prevents database pollution and reduces API token costs by blocking invalid files instantly.
*   **Credibility:** The platform maintains a high-quality database of verifiable civic issues, building public trust.
*   **Friction:** Introduces input validation friction for citizens, but increases the probability of government action.

---

## Related Documents
*   [VISION.md](file:///d:/Projects/CivicPulse/docs/01_Product/VISION.md)
*   [SECURITY.md](file:///d:/Projects/CivicPulse/docs/02_Architecture/SECURITY.md)
