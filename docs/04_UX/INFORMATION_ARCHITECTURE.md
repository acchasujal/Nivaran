# CivicPulse: Information Architecture (IA)

This document defines the sitemap, routes, modules, and cross-cutting notification strategies for CivicPulse.

---

## 1. Information Density Tiers

We enforce a strict separation of concerns, dividing access into three distinct user tiers to prevent developer logs and technical details from leaking into citizen-facing views:

1.  **Citizen Tier (Tiers 1–3):** Public proof of impact, list/map home, chronological timeline, and legal drafts. Clean language, no technical jargon.
2.  **Institutional Tier (Tiers 4–5):** Government queues, commissioner dashboards, and NGO management workspaces. Protected by authentication.
3.  **Internal Tier (Tier 6):** Seeded scenario controls and pipeline verification tools. Gated behind role-based access and developer flags.

---

## 2. Navigation Modules

### Primary Modules (Core Loop)
1.  **Home (Discover & Cases):** A single map/list toggle view displaying nearby resolved and active cases.
2.  **Report Flow (Contribute):** The entry point to capture evidence (photo), confirm location, and submit.
3.  **My Reports (Activity):** Personal dashboard of followed cases, pending draft approvals, and local submissions.

### Supporting Modules
*   **Settings & Help:** Nested under the profile/settings dropdown to avoid cluttering primary navigation spaces.
*   **Government Workspace:** Separate authenticated surface sharing only the underlying Case data schema.

---

## 3. Sitemap Route Table

| Route | Purpose | Access Tier | Primary Action | Exit Path |
| :--- | :--- | :--- | :--- | :--- |
| `/` | Map/List view of nearby cases | Citizen | Find case or report issue | Opens Case or starts Report |
| `/cases/:id` | Unified chronological timeline | Citizen | Track status / verify repair | Returns to `/` or `/my-reports` |
| `/report` | Evidence upload and location pin | Citizen | Upload photo and confirm location | Submits and routes to `/cases/:id` |
| `/my-reports` | User submissions and draft approvals | Citizen | Approve draft / track followed | Opens specific Case detail |
| `/gov` | Authenticated queue for officers | Institutional | Open assigned cases | Opens `/gov/cases/:id` |
| `/gov/cases/:id` | Officer case detail and status updates | Institutional | Update status / attach repair evidence | Returns to `/gov` queue |
| `/evaluate` | Seeded scenario controls for testing | Internal | Load demo cases / test pipelines | Exits session |

---

## 4. Search & Discovery

*   **Scope:** Single keyword/address search input located inline on the Home screen.
*   **Intent:** Searches cases by keyword (e.g., "pothole"), location name, or Case ID.
*   **Results:** Grouped dynamically with active cases listed first. Does not cross-search help articles or government rules.

---

## 5. Notification Matrix

| Trigger Event | Target Channel | Urgency | User Action Needed |
| :--- | :--- | :--- | :--- |
| **Evidence classified** | In-app | Low | None (passive status change) |
| **Cluster joined** | In-app | Low | None (noted in timeline) |
| **Draft ready for review** | Push + SMS | High | Citizen must approve/edit legal notice |
| **Officer acknowledged** | Push + Email | Medium | None (noted in timeline) |
| **Officer reported repair**| Push + WhatsApp| High | Citizen or volunteer must verify repair |
| **Case resolved** | Push + Email | Medium | None (completion milestone) |

*   **Anti-Fatigue Rule:** Batch multiple updates into a single daily summary to avoid notification spam.
