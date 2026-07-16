# CivicPulse: User Journeys

This document outlines the primary user personas and their end-to-end journeys through CivicPulse.

---

## 1. The Citizen

### Profile
Residents experiencing infrastructure failure first-hand. Typically stressed, time-limited, and using mobile devices outdoors.

### Journey
1.  **Entry:** Opens `/` or scans a local flyer QR code.
2.  **Reporting:** Launches `/report` -> takes photo -> GPS auto-selects location -> confirms.
3.  **Deduplication:** System displays: *"Matches 4 other reports nearby. Your evidence has joined this active case."*
4.  **Escalation:** Review and approve the AI-drafted complaint/RTI letter.
5.  **Tracking:** Receives an SMS link. Tracks status updates passively on the chronological timeline.
6.  **Resolution:** A repair is posted. The citizen uploads a confirmation after-photo. Case resolves.

---

## 2. The Senior Citizen

### Profile
Low digital literacy, potential visual impairment, using older smartphones. Requires assisted or voice-first channels.

### Journey
1.  **Entry:** Uses WhatsApp Intake or WhatsApp Voice.
2.  **Reporting:** Sends a photo or speaks a voice message: *"There's a big hole on SV Road outside the temple."*
3.  **Processing:** System transcribes voice -> extracts intent -> maps location.
4.  **Feedback:** System responds on WhatsApp with a plain-text local-language translation of the status.
5.  **Verification:** A volunteer verifies repairs on their behalf in-person.

---

## 3. The Volunteer

### Profile
Active neighborhood advocate. Willing to verify repairs, add supplementary photos, and flag duplicates.

### Journey
1.  **Discovery:** Browses the Home list to find unresolved cases nearby.
2.  **Contribution:** Walks to a site to capture high-quality photos. Uploads them to append to the case.
3.  **Verification:** Inspects government-reported fixes. Uploads a verified after-photo to trigger terminal resolution.

---

## 4. The NGO Coordinator

### Profile
Community organizers aggregating local issues to advocate for municipal budget increases.

### Journey
1.  **Onboarding:** Claims an organization profile, linking their NGO registration.
2.  **Dossier Compilation:** Selects a clustered case. Generates and edits a comprehensive dossier of all 20+ citizen photos.
3.  **Escalation:** Exports the dossier as a signed PDF packages for official RTIs or legal campaigns.

---

## 5. The Ward Officer

### Profile
Municipal staff managing queues, resolving complaints under tight schedules, using email or SMS.

### Journey
1.  **Notification:** Receives a structured email/WhatsApp containing one-line summaries and photos.
2.  **Acknowledgement:** Replies `ACK` directly to the email/message. The system updates the public timeline automatically.
3.  **Action:** Dispatches maintenance crews. Once fixed, replies with a photo and the text `FIXED`.
4.  **Resolution:** System logs the update and notifies the citizen cluster for confirmation.

---

## 6. The Judge / Evaluator

### Profile
Hackathon judges or municipal commissioners evaluating platform utility in a short time window.

### Journey
1.  **Access:** Navigates to `/evaluate`.
2.  **Execution:** Triggers the pre-seeded scenario pipeline. Inspects how Agent 1-5 transitions process.
3.  **Verification:** Reviews the database, logs, and generated drafts, verifying the evidence chain of custody.
