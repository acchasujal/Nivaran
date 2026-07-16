# Architecture Decision Record: ADR-003-Three-Item-Navigation

## Status
**Approved** (2026-07-16)

---

## Context
Early designs featured multiple complex navigation items (Discover, Cases, Tracker, Community, Learn, Settings), leading to menu bloat and high interaction friction, especially for mobile users on low-end devices.

---

## Decision
The primary mobile bottom navigation is restricted to exactly three items:
1.  **Home:** A consolidated view toggling between Map and List representations of nearby cases.
2.  **Report (FAB):** Visual trigger to launch the Camera and start the Report Flow.
3.  **My Reports:** A personal tracking dashboard.

Secondary workspaces (Community, Learn, Settings) are demoted to profile cards or contextual menus.

---

## Alternatives Considered
*   **5-Tab Navigation Bar:** Rejected. Multi-tab navigation overwhelmed users, created redundant paths for finding issues, and reduced valuable thumb zones.

---

## Consequences
*   **Friction Reduction:** Dramatically simplifies mobile user flows, making reporting and tracking accessible.
*   **Design Cleanliness:** Encourages visual restraint, removing dashboard noise.

---

## Related Documents
*   [IDS.md](file:///d:/Projects/CivicPulse/docs/03_Design_System/IDS.md)
*   [INFORMATION_ARCHITECTURE.md](file:///d:/Projects/CivicPulse/docs/04_UX/INFORMATION_ARCHITECTURE.md)
*   [SCREEN_BLUEPRINTS.md](file:///d:/Projects/CivicPulse/docs/04_UX/SCREEN_BLUEPRINTS.md)
