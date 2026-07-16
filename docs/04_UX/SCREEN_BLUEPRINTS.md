# CivicPulse: Screen Blueprints

This document outlines the detailed specifications, actions, components, states, and responsive behaviors for the 30 screens of the CivicPulse platform.

---

## 1. Design Council Rulings

*   **3-Item Bottom Navigation:** `Home`, `Report` (center FAB), and `My Reports` are the only primary routes. Search and secondary destinations live behind a contextual "More" menu on the profile card.
*   **Progressive Timeline Scroll:** The Case detail layout is a single, continuous chronological scroll. Tabbed panel views are rejected for citizen interactions.
*   **Demo & Evaluation:** Gated behind internal authentication routes `/evaluate` with feature flags rather than using public-facing routes or a separate subdomain.

---

## 2. Public Screens (1–11)

### Screen 1: Landing
*   **Purpose:** Prove the evidence-to-impact loop via a real resolved case in under 30 seconds.
*   **Primary Action:** "Report an issue" (routes to `/report`).
*   **Secondary Action:** "See what's happening near you", "Learn how this works".
*   **Components:** Hero Card (Photo before/after), Status Badge, Platform Manifesto block.

### Screen 2: Home / Discover
*   **Purpose:** See nearby active civic issues and decide to act.
*   **Primary Action:** Center Floating Action Button (FAB) "Report".
*   **Secondary Actions:** List/Map view toggle, Filter Chips (Pending, Confirmed, Resolved).
*   **States:** *Offline:* Shows cached results with a top offline banner.

### Screen 3: Report Issue
*   **Purpose:** Initiation step of the Report Flow.
*   **Primary Action:** "Capture Photo" (launches camera).
*   **Secondary Action:** "Upload from Files" (file picker fallback).

### Screen 4: Camera Viewfinder
*   **Purpose:** Point and capture clear evidence of infrastructure failure.
*   **Primary Action:** Shutter Button (72x72px circular touch target).
*   **Secondary Action:** Toggle Flash, Cancel.

### Screen 5: Evidence Review
*   **Purpose:** Review captured evidence for visual clarity.
*   **Primary Action:** "Use Photo" (proceeds to location).
*   **Secondary Action:** "Retake Photo".
*   **Validation:** Automated local blur check. If poor, alerts with retake instructions.

### Screen 6: Location Confirmation
*   **Purpose:** Pinpoint the geographic location of the issue.
*   **Primary Action:** "Confirm Location" (sticky bottom bar).
*   **Secondary Actions:** Manual address search, drag pin marker.
*   **A11y Fallback:** Screen readers bypass the map view entirely, prompting with a text search field.

### Screen 7: Evidence Trust Gate
*   **Purpose:** Deterministic validation check.
*   **Primary Action:** Auto-proceeds to summary on validation success.
*   **Components:** Plain-language validation checklist ("Clear photo ✓", "Infrastructure verified ✓").

### Screen 8: AI Understanding Summary
*   **Purpose:** Display system classification results plainly without engineering jargon.
*   **Layout:** Muted amber background (AI-Assistance color), auto-dismisses in 2 seconds.
*   **Microcopy:** *"We see a pothole. A human verification officer hasn't reviewed this yet."*

### Screen 9: Community Match
*   **Purpose:** Spatial cluster confirmation showing collective neighborhood leverage.
*   **Microcopy:** *"Your report has joined 4 others nearby. Together, this creates a stronger case."*
*   **Primary Action:** "Continue to Escalation".

### Screen 10: Human Approval Gate
*   **Purpose:** Consent to drafting and sending legal dispatches.
*   **Primary Action:** "Send as-is".
*   **Secondary Action:** "Edit first" (opens inline editor text field).

### Screen 11: Success
*   **Purpose:** Confirm dispatch and set citizen expectation.
*   **Microcopy:** *"Report received. Filed to Ward Office on [Date]. We will notify you of updates."*
*   **Primary Action:** "Track this report" (opens `/cases/:id`).

---

## 3. Citizen Workspace Screens (12–16)

### Screen 12: My Reports
*   **Purpose:** Central hub of user submissions and followed cases.
*   **Primary Action:** Click report card to view detail.

### Screen 13: Report Detail Timeline
*   **Purpose:** Chronological story of a case's lifecycle.
*   **Layout:** Fixed top header (Status, Location, Next Action owner). Scrolling chronological timeline showing:
    1.  Original Submission (photo, coordinates, timestamp).
    2.  Community Clustering event (if applicable).
    3.  Government Dispatch & Acknowledgement.
    4.  Resolution (Before/After side-by-side photos and verification stamp).
*   **Primary CTA:** Context-sensitive. E.g., displays "Verify Repair" only when government reports closure.

### Screens 14–16: Notifications, Profile, & Settings
*   **Notifications:** Batching alerts.
*   **Profile:** Anonymous by default; optional authentication credentials.
*   **Settings:** Language selection, location precision controls, and Accessibility Mode toggle.

---

## 4. Government & Institutional Screens (19–22)

### Screen 19: Government Workspace Queue
*   **Purpose:** Authenticated queue of cases assigned to a specific ward or officer.
*   **Layout:** Filterable data table (by category, age, and SLA status).

### Screen 20: Case Review (Officer)
*   **Purpose:** Officer's review of evidence clusters, descriptions, and citizen coordinates.
*   **Primary Action:** "Acknowledge Case" or "Update Status".

### Screen 21: Resolution Workflow (Officer)
*   **Purpose:** Log repair details with evidence.
*   **Primary Action:** Submit status change, requiring an attached repair photo.

### Screen 22: Analytics (Commissioner)
*   **Purpose:** Ward-level trends and efficiency tracking.
*   **Constraints:** Small-sample disclaimers are mandatory if computed metrics use fewer than 10 cases.
