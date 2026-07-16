# Architecture Decision Record: ADR-005-Hide-AI-Jargon

## Status
**Approved** (2026-07-16)

---

## Context
Exposing engineering parameters (such as `Agent 1`, `Haversine`, `dhash`, `confidence: 0.91`, `SendGrid 202`) to citizens undermines the platform's accessibility and can erode trust by making the system feel overly complex.

---

## Decision
All citizen-facing copy must use plain-language verbs. 
*   **System internal names:** Banned from citizen-facing routes.
*   **AI narrations:** Described as plain claims (e.g., *"We see a pothole. Unconfirmed by humans"*).
*   **Technical Details:** Developer logs, confidence breakdowns, and metadata are isolated to the `/evaluate` test route or collapsed under expandable, advanced-user cards.

---

## Alternatives Considered
*   **Displaying Technical Traces:** Rejected. While helpful for debugging, it creates cognitive load and confuses the core citizen audience.

---

## Consequences
*   **Readability:** Lowers the reading comprehension floor to a Grade 6–8 level.
*   **Authenticity:** Keeps the focus on verified evidence and human accountability rather than AI hype.

---

## Related Documents
*   [DESIGN_LANGUAGE.md](file:///d:/Projects/CivicPulse/docs/03_Design_System/DESIGN_LANGUAGE.md)
*   [ACCESSIBILITY.md](file:///d:/Projects/CivicPulse/docs/04_UX/ACCESSIBILITY.md)
