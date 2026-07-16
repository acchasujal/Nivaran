# CivicPulse: Accessibility Standards (WCAG 2.2 AA)

This document is the canonical reference for accessibility compliance across all CivicPulse components, layouts, and interaction flows.

---

## 1. Core Visual Standards

### 1.1 Contrast Floors
*   **Body Text:** All body text must maintain a minimum contrast ratio of `4.5:1` against its background color.
*   **Large Text & Icons:** Visual indicators, status glyphs, and headings must maintain a minimum contrast ratio of `3.0:1`.
*   **Verification:** Verified programmatically against target CSS variable tokens before deploying changes. Hand-picked hex values must not bypass this check.

### 1.2 Typography legibility
*   **Size Floor:** No citizen-facing text may fall below `14px` on mobile or desktop viewports.
*   **Scaling:** All layouts must remain responsive up to 200% OS-level font scaling without clipping, overlapping, or horizontal scrolling.
*   **Line-Height:** Enforce line-heights of at least `1.5` for body text and `1.3` for headers.

### 1.3 Color Independence
*   **Rule:** Visual state, status, or validation outcome must never be communicated using color alone.
*   **Implementation:** All status badges, notification cards, and map markers must pair color with distinct icons and labels. E.g., a green check-in-shield checkmark for "Resolved," never a generic green circle.

---

## 2. Keyboard & Interaction Behaviors

### 2.1 Keyboard Operability
*   **Interactive Elements:** Every clickable card, button, toggle, or text input must be focusable using the standard `Tab` key and actionable using `Enter` or `Space`.
*   **Focus Ring:** A persistent, high-contrast focus ring outline must render around the active focused element. Do not suppress native focus outlines without implementing a visible alternative.

### 2.2 Focus Trapping & Restoration
*   **Modals & Sheets:** When a modal dialogue or bottom sheet expands, keyboard focus must be trapped within that container. Focus is released only on container dismissal.
*   **Focus Return:** When a modal closes, focus must automatically return to the button or element that originally triggered it.

### 2.3 Touch Targets
*   **Mobile Size:** All buttons, chevrons, icons, and form triggers must maintain a minimum touch target area of `48x48px`.
*   **Mobile Shutter:** The primary camera shutter button maintains a minimum target of `72x72px`.
*   **Separation:** A minimum gap of `8px` is required between touch targets to prevent accidental triggers.

---

## 3. Screen Reader (TalkBack / VoiceOver) Guidelines

*   **Alt-Text:** Every image asset and citizen-uploaded photo must include alt-text.
    *   *Citizen photos:* Auto-generate descriptions using Gemini vision classifiers (e.g., `alt="Photo of a pothole, approximately 6 inches deep on asphalt street"`).
*   **Status Announcements:** Status pill changes must read cleanly (e.g., `aria-label="Status: Government Confirmed"`).
*   **Live Regions:** Dynamically changing elements, such as file upload progress bars, must utilize `aria-live="polite"`. Alert banners use `aria-live="assertive"`.
*   **Map Exclusions:** Interactive map canvas elements are excluded from screen readers (`aria-hidden="true"`). The system automatically defaults to a list-equivalent search and selection interface when screen reader tools are active.

---

## 4. Reading Comprehension Standards

*   **Readability:** Citizen-facing text and alerts must be written at a Grade 6–8 readability level (approx. Flesch-Kincaid scale).
*   **Jargon Exclusion:** Banish technical system diagnostics (`Agent 1`, `Haversine`, `dhash`, `500 Server Error`, `SendGrid 202`) from the citizen's viewport. Replace with clear descriptions of what occurred and what next action is expected.
