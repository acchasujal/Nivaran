# CivicPulse: Interaction Design System (IDS)

This document defines navigation paradigms, interactive components, motion transitions, form behaviors, and map interactions for CivicPulse.

---

## 1. Navigation Rules

*   **Mobile Navigation:** Bottom bar with exactly 3 items: `Home` (Map/List), `Report` (FAB), and `My Reports`.
*   **Desktop/Tablet:** Left rail (collapsible) with the same three items. Secondary items (Profile, Settings, Help) at the bottom.
*   **Back Navigation:** System back buttons and in-app back chevrons behave identically, preserving scroll positions and list filters.
*   **State Preservation:** If a user exits the report flow mid-step, state is cached locally. Tapping the Report FAB resumes where they left off.

---

## 2. Motion Easing & Durations

*   **Durations:**
    *   *Micro (hover, focus, toggles):* 120ms
    *   *Standard (page slide, panel expand):* 200ms
    *   *Long (modal pop, success animation):* 320ms
*   **Easing:** Standard curve `cubic-bezier(0.2, 0, 0, 1)` for all transitions.
*   **Reduced Motion:** When OS-level reduced motion is detected, transition times fall to 0ms or simple opacity cross-fades.
*   **Wait Indicators:** Skeletons are used for unknown load times. If loading exceeds 2 seconds, display named progress steps ("Checking location...").

---

## 3. Interactive Components

*   **Buttons:** One primary filled brand button per screen. Destructive operations require double confirmation.
*   **FAB (Floating Action Button):** Located at the bottom center. Collapses to a compact circle on scroll down; expands on scroll up.
*   **Lists:** Row-based layouts separated by thin rules. Cards at rest are flat with a thin border; elevation is reserved for active focus states.
*   **Banners & Snackbars:** Banners sit at the top for persistent states (e.g., offline mode). Snackbars confirm background actions and auto-dismiss in 3 seconds.

---

## 4. Input & Form Interactions

*   **Camera Intake:** Launches immediately upon entering the Report Flow. The capture button is sized at `72x72px` for ease of touch.
*   **Location Selection:** Centered on current GPS coordinates. User confirms by clicking a sticky confirmation button at the bottom.
*   **Autofocus:** Prevent auto-popping mobile keyboards. Only autofocus inputs when a user explicitly taps into a text field.

---

## 5. Map Interactions

*   **Default View:** Standard List view to minimize mobile data consumption.
*   **Map Toggle:** A floating toggle button swaps between Map and List with a standard cross-fade.
*   **Pin Tap:** Opens a bottom modal contextual sheet showing report previews. Tapping the preview opens the detail timeline.
*   **GPS Denied:** Centers on the default city center and prompts the user to manually type or drop a pin.
*   **Offline State:** Map view is disabled, showing a passive "Map unavailable offline" notification.
