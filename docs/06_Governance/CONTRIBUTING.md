# CivicPulse: Contributor Guidelines

This document details folder structures, naming conventions, version rules, and the Canonical Concept Ownership Matrix for all engineers and designers contributing to CivicPulse.

---

## 1. Documentation Branching & Versioning

*   **Doc Versions:** Major revisions (e.g., changing spacing scales or adding database columns) increment the documentation minor/major version (e.g., `v1.1` to `v1.2`).
*   **PR Rules:** Documentation modifications must accompany any pull request that updates API endpoints, database schemas, or visual styles.
*   **Archiving:** Deprecated documents are moved to `docs/08_Archive/` with the file prefix `DEPRECATED_`.

---

## 2. Canonical Concept Ownership Matrix

Every concept in the repository must have exactly **one** canonical document. Refer to the list below before editing:

| Category | Concept | Canonical File |
| :--- | :--- | :--- |
| **Product** | Core Manifesto / Vision | [VISION.md](file:///d:/Projects/CivicPulse/docs/01_Product/VISION.md) |
| | Missions & Principles | [PRINCIPLES.md](file:///d:/Projects/CivicPulse/docs/01_Product/PRINCIPLES.md) |
| | Mission Statement | [MISSION.md](file:///d:/Projects/CivicPulse/docs/01_Product/MISSION.md) |
| | Roadmaps & Metrics | [ROADMAP.md](file:///d:/Projects/CivicPulse/docs/01_Product/ROADMAP.md) |
| **Architecture** | System Design & Schemas | [ARCHITECTURE.md](file:///d:/Projects/CivicPulse/docs/02_Architecture/ARCHITECTURE.md) |
| | Security Controls | [SECURITY.md](file:///d:/Projects/CivicPulse/docs/02_Architecture/SECURITY.md) |
| **Design System** | Brand Tone & Microcopy | [DESIGN_LANGUAGE.md](file:///d:/Projects/CivicPulse/docs/03_Design_System/DESIGN_LANGUAGE.md) |
| | Visual Layout & Tokens | [VISUAL_LANGUAGE.md](file:///d:/Projects/CivicPulse/docs/03_Design_System/VISUAL_LANGUAGE.md) |
| | Color & Spacing CSS Vars | [DESIGN_TOKENS.md](file:///d:/Projects/CivicPulse/docs/03_Design_System/DESIGN_TOKENS.md) |
| | Interaction & Easing Rules | [IDS.md](file:///d:/Projects/CivicPulse/docs/03_Design_System/IDS.md) |
| **UX** | Sitemap Routing & Modules | [INFORMATION_ARCHITECTURE.md](file:///d:/Projects/CivicPulse/docs/04_UX/INFORMATION_ARCHITECTURE.md) |
| | Personas & User Journeys | [JOURNEYS.md](file:///d:/Projects/CivicPulse/docs/04_UX/JOURNEYS.md) |
| | 30-Screen Layout Specs | [SCREEN_BLUEPRINTS.md](file:///d:/Projects/CivicPulse/docs/04_UX/SCREEN_BLUEPRINTS.md) |
| | WCAG 2.2 AA Compliance | [ACCESSIBILITY.md](file:///d:/Projects/CivicPulse/docs/04_UX/ACCESSIBILITY.md) |
| **Engineering** | Client App Setup | [FRONTEND.md](file:///d:/Projects/CivicPulse/docs/05_Engineering/FRONTEND.md) |
| | Server Dev Setup | [BACKEND.md](file:///d:/Projects/CivicPulse/docs/05_Engineering/BACKEND.md) |
| | Server Hardening & Cloud Run | [DEPLOYMENT.md](file:///d:/Projects/CivicPulse/docs/05_Engineering/DEPLOYMENT.md) |
| | Unit Tests & Mocks | [TESTING.md](file:///d:/Projects/CivicPulse/docs/05_Engineering/TESTING.md) |
| **Governance** | Historical Decisions Log | [DECISIONS.md](file:///d:/Projects/CivicPulse/docs/06_Governance/DECISIONS.md) |
| | ADR Files | [07_ADR/](file:///d:/Projects/CivicPulse/docs/07_ADR/) |

---

## 3. Change Governance Matrix

When a primary file updates, all downstream child files must be reviewed for alignment:

| Trigger Document Update | Required Review Scope | Reason |
| :--- | :--- | :--- |
| `VISION.md` | `DESIGN_LANGUAGE.md`, `ARCHITECTURE.md` | Core values shape brand and engineering requirements. |
| `DESIGN_LANGUAGE.md` | `VISUAL_LANGUAGE.md`, `INFORMATION_ARCHITECTURE.md` | Brand voice rules determine color systems and visual sitemaps. |
| `VISUAL_LANGUAGE.md` | `SCREEN_BLUEPRINTS.md` | Changing visual tokens (radii, colors) alters components on screens. |
| `INFORMATION_ARCHITECTURE.md` | `JOURNEYS.md`, `SCREEN_BLUEPRINTS.md` | Sitemap changes modify persona navigation paths. |

---

## 4. Cross-Referencing Rules

Never duplicate rules. Link back to canonical files using absolute file links and anchor tags:
*   *Correct:* `Verify element color contrast values against the floors in [ACCESSIBILITY.md](file:///d:/Projects/CivicPulse/docs/04_UX/ACCESSIBILITY.md#1-core-visual-standards).`
*   *Incorrect:* `All elements must maintain a contrast ratio of 4.5:1.`
