# CivicPulse: Visual Language System (VLS)

This document defines the visual system, typography pairings, color usage rules, surface hierarchy, and asset guidelines for CivicPulse.

---

## 1. Visual Manifesto

A national civic platform's visual language should be forgettable in the way a well-built bridge is forgettable — nobody photographs the bridge, they just get across safely. CivicPulse's visual language exists to disappear behind the evidence it's showing. The photo of the pothole, the officer's reply, the repair — those are the content. Restraint is the trust mechanism itself, made visible.

---

## 2. Typography Pairings & Scales

*   **Primary Font Family:** Humanist sans-serif variable font family with native Indic-script support (e.g., `Noto Sans` paired with `Noto Sans Devanagari` / `Noto Sans Tamil`). Variable font weighting restricts payload sizes for 3G cellular speeds.
*   **Numerals:** Tabular figures are mandatory across all tables, lists, and metadata counters to prevent visual jitter when numbers refresh.
*   **Caps & Floors:** Captions and metadata have a hard minimum size of `14px` on any citizen-facing screen. Monospace is reserved exclusively for developer trace panels.

| Role | Weight | Size (Mobile) | Size (Desktop) | Usage |
| :--- | :--- | :--- | :--- | :--- |
| **Display** | Semibold | 28px (1.3 LH) | 32px (1.3 LH) | Primary page / case titles |
| **Heading** | Semibold | 20px (1.3 LH) | 24px (1.3 LH) | Section headers |
| **Body** | Regular | 16px (1.5 LH) | 16px (1.5 LH) | General text and descriptions |
| **Caption** | Regular/Medium | 14px (1.5 LH) | 14px (1.5 LH) | Timestamps, metadata, micro-details |

---

## 3. Color Usage Rules

All text and interactive element pairings must satisfy the contrast floors defined in [ACCESSIBILITY.md](file:///d:/Projects/CivicPulse/docs/04_UX/ACCESSIBILITY.md).

*   **Primary:** Reserved for critical user actions (Primary buttons, active nav indicators).
*   **Neutral:** Warm paper/ink scale carrying 90% of the screen weight to support a calm visual rhythm.
*   **Evidence:** Cool slate tint applied to photo metadata chips and raw GPS coordinates.
*   **Government:** Deep institutional blue family, paired with the seal icon, reserved for authenticated officer events.
*   **AI-Assistance:** Muted amber/purple tint, paired with the spark glyph, indicating machine inference.
    *   *Non-negotiable rule:* AI-Assistance and Trust/Verified must never share a hue family. A citizen must distinguish "what the AI thinks" vs "what is confirmed" by color alone.
*   **Trust / Verified:** Shield-badge green family, reserved for authenticated human-verified repair resolutions.

---

## 4. Spacing, Borders, & Surface Elevations

*   **Spacing Rhythm:** 4px base spacing scale (`4/8/12/16/24/32/48/64px`). Enforced margin minimum of 16px on mobile viewports.
*   **Layout Capping:** Body text columns are capped at a maximum width of `680px` to maintain comfortable readability.
*   **Surface System:**
    *   *Cards:* Flat at rest (`elevation-0`). Subtle border at rest, elevating slightly (`elevation-1`) on hover/focus states only.
    *   *Dialogs:* Highest elevation (`elevation-3`) with a dimmed backdrop and scroll-locked background.
    *   *Timelines:* Flat vertical layout connected by a thin divider rule. No individual shadow boxes for events.

---

## 5. Iconography & Visual Assets

*   **Icon Family:** Outlined, consistent 2px stroke icon set.
*   **Filled Icons:** Reserved exclusively to highlight active states in the bottom navigation rail.
*   **Visual Assets:** Emojis are strictly banned from all citizen and officer views. Empty states utilize flat, geometric, quietly Indian line illustrations in warm neutral tones.
