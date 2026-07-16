# Architecture Decision Record: ADR-004-Timeline-Not-Tabs

## Status
**Approved** (2026-07-16)

---

## Context
Case details contain diverse information: photos, metadata, updates, and legal drafts. The previous "Case Workspace" split these across five separate panels (Overview, Evidence, Timeline, Documents, Community), forcing users to navigate complex tabs.

---

## Decision
All case details are consolidated into a single, continuous chronological scroll. 
Every state transition (submission, clustering, acknowledgement, dispatch, repair, verification) is appended as a flat timeline card displaying: **What happened, Who confirmed it, and When.** Legal drafts and technical details are progressively disclosed inline on demand.

---

## Alternatives Considered
*   **Tabbed Workspace:** Rejected. Scattered data across multiple panes, hiding the narrative of the case and the status of official actions.

---

## Consequences
*   **Clarity:** The life of a case reads as a simple, scrollable story, reducing cognitive load on citizens.
*   **Uniformity:** A single layout holds all event types, simplifying both visual design and frontend coding.

---

## Related Documents
*   [IDS.md](file:///d:/Projects/CivicPulse/docs/03_Design_System/IDS.md)
*   [SCREEN_BLUEPRINTS.md](file:///d:/Projects/CivicPulse/docs/04_UX/SCREEN_BLUEPRINTS.md#screen-13-report-detail-timeline)
