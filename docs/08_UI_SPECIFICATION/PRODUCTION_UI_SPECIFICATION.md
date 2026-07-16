# CivicPulse Production UI Specification

**Status:** Design-ready specification  
**Scope:** Production citizen, community, government, and internal evaluation experiences  
**Audience:** Product design, UX research, accessibility, frontend, backend, QA, content, and governance teams  
**Normative sources:** [VISION.md](../01_Product/VISION.md), [PRINCIPLES.md](../01_Product/PRINCIPLES.md), [ARCHITECTURE.md](../02_Architecture/ARCHITECTURE.md), [DESIGN_LANGUAGE.md](../03_Design_System/DESIGN_LANGUAGE.md), [DESIGN_TOKENS.md](../03_Design_System/DESIGN_TOKENS.md), [IDS.md](../03_Design_System/IDS.md), [VISUAL_LANGUAGE.md](../03_Design_System/VISUAL_LANGUAGE.md), [ACCESSIBILITY.md](../04_UX/ACCESSIBILITY.md), [INFORMATION_ARCHITECTURE.md](../04_UX/INFORMATION_ARCHITECTURE.md), [JOURNEYS.md](../04_UX/JOURNEYS.md), [SCREEN_BLUEPRINTS.md](../04_UX/SCREEN_BLUEPRINTS.md), and the ADRs in [07_ADR](../07_ADR/).

This document specifies product behavior and visual intent. It does not prescribe React, HTML, Tailwind, CSS, or implementation structure.

---

## 1. Global Design Philosophy

CivicPulse is a calm civic records service: exact, unhurried, legible, accountable, and quietly Indian. The interface is a witness, not a megaphone. Evidence, official responses, repairs, and uncertainty are more visually important than brand decoration.

The product story is always:

> Evidence → Trust → Community → Accountability → Impact

Every screen must answer three questions:

1. What is known?
2. Who owns the next action?
3. What can I do now?

### Global rules

- One primary action per screen.
- One case has one continuous chronological story; do not split the citizen narrative into tabs.
- AI assistance is visible as assistance, never as authority.
- Citizen-facing copy uses plain-language verbs and a Grade 6–8 reading level.
- No citizen-facing agent names, confidence numbers, hashes, API codes, or provider names.
- Every status includes a state, owner, timestamp, and next expected event.
- Evidence, community, government, AI assistance, and verified resolution use distinct semantic colors and icons.
- Flat surfaces are the default; elevation indicates interruption or focus, not importance.
- No emoji in citizen or officer views.

### Experience tiers

| Tier | Audience | Information policy |
|---|---|---|
| Citizen | Public users, contributors, seniors | Plain language, progressive disclosure, privacy-first |
| Institutional | Officers, commissioners, NGOs | Authenticated operational detail and audit context |
| Internal | Judges, developers, moderators | Technical traces, seeded scenarios, diagnostics |

---

## 2. Product Shell and Navigation

### Citizen shell

The primary navigation has exactly three items:

1. **Home** — nearby cases in List or Map mode.
2. **Report** — centered FAB that starts or resumes reporting.
3. **My Reports** — submitted, followed, and awaiting-action cases.

Profile, Settings, Help, Learn, language, and accessibility controls live in a contextual profile menu rather than primary navigation.

### Desktop and tablet shell

Use a collapsible left rail with the same three primary destinations. The rail may expand to show labels and collapse to icons, but must never hide the current route from assistive technology. Secondary controls appear at the bottom of the rail.

### Mobile shell

Use the three-item bottom bar. The Report FAB is centered and visually dominant without obscuring content. The FAB contracts while scrolling down and expands while scrolling up. Maintain a 48px minimum target, with the camera shutter at 72px.

### Global header

The header contains page title or case title, location/context where useful, and one contextual action. It does not contain technical health indicators, evaluation controls, or rapid-moving status tickers.

### Global case header

On a case screen, keep a compact sticky header containing:

- Case title and locality.
- Current status badge.
- Next-action owner.
- Last verified update.
- Privacy visibility.

The header collapses to title + status on small screens.

---

## 3. Design Tokens and Visual System

Use the canonical values in [DESIGN_TOKENS.md](../03_Design_System/DESIGN_TOKENS.md). The following usage rules are normative.

### Typography

- Primary: Noto Sans with native Indic-script support.
- Technical traces only: Noto Sans Mono.
- Display: 28px mobile / 32px desktop, semibold, 1.3 line height.
- Heading: 20px mobile / 24px desktop, semibold, 1.3 line height.
- Body: 16px, regular, 1.5 line height.
- Caption: 14px, regular or medium, 1.5 line height.
- No citizen-facing text below 14px, including timestamps, labels, chips, or helper copy.
- Use tabular numerals in counters, tables, timelines, and SLA values.

### Color semantics

| Meaning | Token family | Required companion |
|---|---|---|
| Evidence | Slate | Photo/evidence icon and label |
| Government | Deep indigo | Official seal or institution icon |
| Community | Violet | Group icon and contributor count |
| AI assistance | Muted amber | Spark icon and uncertainty wording |
| Verified resolution | Muted green | Shield/check icon and confirming actor |
| Warning/deadline | Deep amber | Clock/warning icon and date |
| Failure/rejection | Deep red | Alert icon and recovery action |

AI assistance and verified resolution must never share a hue family.

### Layout

- 4px spacing base: 4/8/12/16/24/32/48/64px.
- Minimum mobile page margin: 16px.
- Body copy maximum width: 680px.
- Cards use 8px radius and flat resting surfaces.
- Dialogs use 12px radius and the highest elevation.
- Mobile bottom sheets use 16px top radius.
- Timelines use a flat vertical rule, not individual floating cards for every event.

### Breakpoints and density

- Compact: 320–599px.
- Standard: 600–1023px.
- Wide: 1024px and above.
- At 200% text scaling, content must reflow without clipping or horizontal scrolling.
- Prefer list mode as the default on mobile to reduce data use.

---

## 4. Complete Product UI: Screen Specifications

The following 30 screens form the production UI. Every screen supports loading, empty, error, offline, accessibility, and responsive states as specified below.

### Screen 01 — Public Landing

- **Purpose:** Prove the evidence-to-impact loop in under 30 seconds.
- **Primary users:** First-time visitors, citizens, judges.
- **Entry:** Root URL, shared public link.
- **Primary CTA:** Report an issue.
- **Secondary CTAs:** See nearby cases; Learn how CivicPulse works.
- **Hierarchy:** Resolved-case before/after evidence → plain-language promise → current case status → contribution choices.
- **Visual emphasis:** Real evidence and verified impact; calm neutral background.
- **Motion:** One restrained before/after reveal; no autoplay carousel.
- **Trust:** Show who verified the repair and when.
- **AI visibility:** One sentence explaining AI assistance, no model name.
- **Mobile:** Single-column hero; evidence comparison stacks vertically.
- **Edge cases:** No nearby resolved case uses a methodology card and active case instead.

### Screen 02 — Home / Discover

- **Purpose:** Find nearby active, confirmed, and resolved cases.
- **Primary CTA:** Report FAB.
- **Secondary controls:** List/Map toggle, search, filter chips, location selector.
- **Default:** List mode on mobile; remember user preference on larger screens.
- **List item:** Evidence thumbnail, issue title, locality, status, contributor count, next owner, last update.
- **Map:** Decorative/navigation aid only; every action has a list equivalent.
- **Offline:** Cached cases with persistent “You are offline” banner and disabled map notice.
- **Empty:** Explain that no cases are visible for the selected area; offer report action.
- **Accessibility:** Screen-reader mode defaults to list and hides the map canvas.

### Screen 03 — Report Entry

- **Purpose:** Start a new report or resume a saved draft.
- **Primary CTA:** Capture photo.
- **Secondary CTA:** Upload from files; Report through WhatsApp; Use voice.
- **Hierarchy:** Why evidence matters → capture choices → privacy note → saved draft indicator.
- **Privacy:** Explain location precision and audience before capture.
- **Offline:** Allow local draft creation and queue submission.
- **Edge cases:** Existing unfinished draft gets a clear resume/discard choice.

### Screen 04 — Camera Viewfinder

- **Purpose:** Capture clear infrastructure evidence.
- **Primary CTA:** 72px shutter.
- **Secondary:** Flash, switch camera, cancel.
- **Guidance:** Short overlay: “Keep the issue in frame. Avoid faces where possible.”
- **Motion:** Shutter feedback at 320ms; respect reduced motion.
- **Security:** Strip EXIF before upload; explain if relevant without exposing raw metadata.
- **Failure:** Camera permission denial gives instructions plus file-picker fallback.

### Screen 05 — Evidence Review

- **Purpose:** Let the contributor inspect and accept the image.
- **Primary CTA:** Use photo.
- **Secondary:** Retake; crop/rotate where supported.
- **Hierarchy:** Image → clarity guidance → privacy check → action.
- **Validation:** Plain-language local quality check; never show raw blur scores.
- **Error:** “We could not read this photo. Try a clearer, well-lit shot of the issue.”
- **Accessibility:** Generated alt text is editable and read aloud.

### Screen 06 — Location Confirmation

- **Purpose:** Confirm where the issue occurred.
- **Primary CTA:** Confirm location in sticky bottom action bar.
- **Secondary:** Search address; drag pin; enter location manually.
- **Hierarchy:** Approximate map/location → locality label → privacy precision control.
- **A11y:** Replace map with address search and structured locality fields.
- **Denied GPS:** Explain permission failure and offer manual entry without blocking progress.
- **Offline:** Save coordinates locally; defer map tiles and reverse geocoding.

### Screen 07 — Evidence Trust Gate

- **Purpose:** Explain whether the submission can proceed.
- **Primary CTA:** Continue automatically on success; retry or replace on failure.
- **Checklist:** Clear photo; infrastructure visible; location available; no obvious duplicate.
- **Visual:** Evidence/slate and verified/green semantics; no AI score.
- **Failure:** Explain exactly what failed and how to recover.
- **Trust:** State that automated checks assist review and do not prove the issue conclusively.

### Screen 08 — AI Understanding Summary

- **Purpose:** Present the system’s preliminary understanding.
- **Primary CTA:** Confirm summary / continue.
- **Copy:** “We see a possible pothole in this photo. A human has not confirmed it yet.”
- **Visual:** Muted amber assistance surface with spark icon.
- **Controls:** Correct category; edit description; report uncertainty.
- **Never show:** Agent names, confidence decimals, model names, or raw prompts.
- **Loading:** Named steps such as “Reading the photo” and “Checking nearby reports.”

### Screen 09 — Community Match

- **Purpose:** Show whether the report joins an existing local case.
- **Primary CTA:** Join this case / Start a new case.
- **Secondary:** View case; keep separate; share with neighbors.
- **Hierarchy:** Nearby evidence preview → contributor count → what joining changes → privacy.
- **Copy:** “Your report joined 4 other reports nearby. Together, they show a wider problem.”
- **Uncertainty:** If the match is uncertain, keep the report separate and explain why.

### Screen 10 — Human Approval Gate

- **Purpose:** Obtain explicit consent before external action.
- **Primary CTA:** Approve and send.
- **Secondary:** Edit first; save for later; do not send.
- **Hierarchy:** Recipient → document purpose → evidence basis → legal/plain-language notice → consent.
- **Editing:** Full text remains editable; changes are attributable and reversible.
- **Trust:** “You are responsible for approving this document. CivicPulse does not provide legal advice.”
- **Security:** No external dispatch before approved state is confirmed by the server.

### Screen 11 — Submission Success

- **Purpose:** Confirm what happened and establish expectations.
- **Primary CTA:** Track this report.
- **Secondary:** Share case; return home.
- **Copy:** “Your report was sent to the Ward Office on [date]. We will show you when they respond.”
- **Must show:** Case ID, next owner, expected update, privacy state, cluster contribution.
- **Avoid:** Celebration animations or claims that the issue is solved.

### Screen 12 — My Reports

- **Purpose:** Track submitted, followed, pending-review, and repair-verification cases.
- **Primary CTA:** Open a case.
- **Secondary:** Filter by status; resume draft; change notification settings.
- **List item:** Case title, locality, current state, last verified event, next action.
- **Empty:** Explain how to report or follow a case.
- **Anonymous tracking:** Support device-saved tracking links without forced account creation.

### Screen 13 — Case Detail Timeline

- **Purpose:** Tell the complete case story in chronological order.
- **Sticky header:** Case name, status, next owner, last update.
- **Timeline events:** Submission, validation, community match, government delivery, acknowledgement, response, repair, verification, resolution.
- **Event anatomy:** What happened; who confirmed it; when; evidence; next step.
- **Primary CTA:** Contextual—approve, contribute, acknowledge, verify repair, or follow.
- **Progressive disclosure:** Legal drafts and technical evidence expand inline.
- **No tabs:** Preserve the single narrative.

### Screen 14 — Notifications

- **Purpose:** Present actionable updates without fatigue.
- **Primary CTA:** Open affected case.
- **Grouping:** Immediate high-value alerts; daily digest for low urgency.
- **Events:** Draft ready, officer acknowledgement, repair reported, resolution confirmed.
- **Accessibility:** Each notification includes event, actor, time, and action in one sentence.
- **Offline:** Queue read state locally and reconcile later.

### Screen 15 — Profile

- **Purpose:** Manage identity, contribution attribution, and assistance preferences.
- **Primary CTA:** Save profile changes.
- **Defaults:** Anonymous public identity; optional verified identity.
- **Controls:** Name visibility, language, accessibility mode, notification channel.
- **Trust:** Explain how profile information is used and who can see it.

### Screen 16 — Settings and Privacy

- **Purpose:** Control privacy, language, accessibility, location precision, and data retention.
- **Primary CTA:** Save settings.
- **Required controls:** Exact-location visibility, photo visibility, deletion request, export data, language, reduced motion, high contrast.
- **Danger actions:** Require clear confirmation and explain consequences.

### Screen 17 — Search and Discovery Results

- **Purpose:** Find cases by location, keyword, or case ID.
- **Primary CTA:** Open result.
- **Results:** Active first, then confirmed, then resolved; show locality and status.
- **Empty:** Suggest spelling, broader area, or report action.
- **Privacy:** Never reveal hidden exact locations through search.

### Screen 18 — Help and Learn

- **Purpose:** Explain CivicPulse, evidence, AI limits, RTI, privacy, and verification.
- **Primary CTA:** Return to the relevant action.
- **Structure:** Short answer first; expandable detail; language selector.
- **Tone:** Calm clerk; no promotional claims unsupported by methodology.

### Screen 19 — Government Workspace Queue

- **Purpose:** Let authenticated officers review assigned cases.
- **Primary CTA:** Acknowledge or open case.
- **Table columns:** Case, locality, category, age, SLA state, owner, last update.
- **Filters:** Department, severity, age, acknowledgement, response status.
- **Density:** Desktop table; stacked priority rows on tablet/mobile.
- **Security:** Only assigned jurisdiction and permitted data are visible.

### Screen 20 — Officer Case Review

- **Purpose:** Establish official understanding and responsibility.
- **Primary CTA:** Acknowledge case.
- **Secondary:** Assign department; request clarification; add internal note.
- **Hierarchy:** Evidence cluster → citizen context → jurisdiction → SLA → response action.
- **Trust:** Officer identity and institution are explicit.
- **Communication:** Web update is mirrored to the citizen timeline.

### Screen 21 — Officer Resolution Workflow

- **Purpose:** Record work completed and attach repair evidence.
- **Primary CTA:** Report repair.
- **Required:** Repair description, date, location confirmation, after-photo, responsible department.
- **State:** “Reported repaired” remains distinct from “Community verified.”
- **Fallback:** Officers may use email/WhatsApp structured replies; unparseable replies go to moderation.

### Screen 22 — Commissioner Analytics

- **Purpose:** Understand systemic infrastructure patterns.
- **Primary CTA:** Open priority case or ward trend.
- **Charts:** Only evidence-backed metrics with methodology, sample size, and date range.
- **Small samples:** Mandatory disclaimer below 10 cases.
- **Never show:** Unverified officer rankings or fabricated performance scores.

### Screen 23 — Repair Verification

- **Purpose:** Let citizens or volunteers compare repair evidence.
- **Primary CTA:** Confirm repair / report unresolved.
- **Layout:** Before/after comparison, location, date, verifier identity level.
- **States:** Looks repaired; partially repaired; not repaired; unsafe to verify.
- **Trust:** One person’s confirmation is evidence, not automatic closure.

### Screen 24 — Resolution Confirmation

- **Purpose:** Close a case only when criteria are met.
- **Primary CTA:** Confirm resolution.
- **Secondary:** Reopen case; report recurrence.
- **Required:** Resolution basis, confirming actors, timestamp, remaining uncertainty.
- **Public learning:** Show what changed and what evidence supported closure.

### Screen 25 — Authentication

- **Purpose:** Offer optional identity and required institutional sign-in.
- **Citizen:** Passwordless or phone-based access; anonymous contribution remains available where safe.
- **Institutional:** Strong authentication, role, jurisdiction, session expiry.
- **Error:** Explain recovery without exposing whether an account exists.

### Screen 26 — Offline Workspace

- **Purpose:** Preserve reporting and tracking during weak connectivity.
- **Primary CTA:** Save locally / retry sync.
- **Visible:** Pending uploads, queued changes, storage usage, last successful sync.
- **Security:** Encrypt sensitive local data where platform capability permits; explain device risk.

### Screen 27 — Loading and Processing

- **Purpose:** Make waiting understandable.
- **Pattern:** Skeleton for unknown content; named progress steps after 2 seconds.
- **Copy:** “Checking the photo,” “Checking the location,” “Looking for nearby reports.”
- **Never:** Artificial countdowns, spinner-only waits, or raw backend stage names.
- **Recovery:** Allow safe exit with state preservation.

### Screen 28 — Error and Recovery

- **Purpose:** Explain failure and preserve agency.
- **Required:** What happened, what was preserved, what to do next, retry action.
- **Network:** Keep local report state.
- **Validation:** Point to the affected evidence or field.
- **Server:** Use plain-language status with support/reference ID behind advanced details.

### Screen 29 — Internal Evaluation

- **Purpose:** Demonstrate and test the complete pipeline.
- **Access:** Authenticated internal route `/evaluate`, feature flagged.
- **Contains:** Seeded scenarios, technical traces, model/provider data, event replay, test reset.
- **Rule:** Never visible in public citizen or officer navigation.

### Screen 30 — Moderation and Safety Review

- **Purpose:** Resolve abuse, privacy, fraud, and unparseable officer replies.
- **Primary CTA:** Resolve review item.
- **Required:** Evidence, reason, action history, privacy impact, reviewer identity.
- **Safety:** Hide personal data by default; require reason for disclosure.
- **Audit:** Every moderation decision is timestamped and reversible where appropriate.

---

## 5. Component Library

### Buttons and actions

- Primary filled button: one per screen, 48px minimum height.
- Secondary outlined button: supporting action only.
- Tertiary text action: low-risk navigation or disclosure.
- Destructive action: deep red, explicit label, confirmation where irreversible.
- Icon-only action: 48px target, visible tooltip, accessible name, never the only route to a critical function.
- FAB: centered Report action; label available to screen readers and expanded state.

### Evidence components

- Evidence card: image, alt text, locality, timestamp, privacy label, evidence status.
- Evidence gallery: responsive grid with full-screen viewer and keyboard navigation.
- Before/after comparison: draggable and button-based comparison; labels remain visible.
- Evidence checklist: icon + text + result; no color-only state.

### Timeline components

- Timeline rule: 2px semantic-neutral vertical line.
- Event marker: status icon and accessible label.
- Event card: event statement, actor, timestamp, evidence, next action.
- Future event: visually distinct from confirmed event.
- Expanded event: preserves scroll position and focus.

### Government components

- Official event card: institution, officer role, action, timestamp, source.
- SLA badge: remaining/overdue language plus date; never urgency theatrics.
- Queue row: case, owner, age, status, action.
- Resolution form: required repair evidence and explicit “reported repaired” state.

### Community components

- Community match card: contributor count, radius/locality, match explanation, privacy.
- Contributor chip: public name or anonymous label, role, verification level.
- Shared-case banner: contribution impact and invitation action.
- Verification vote: factual confirmation states, not popularity score.

### Inputs and search

- Labels always visible; helper text below; errors inline.
- Search supports address, keyword, and case ID with structured result groups.
- Selects show current choice without requiring reopening to understand state.
- File input states: idle, selecting, uploading, validating, accepted, rejected, queued offline.
- Location input always has manual fallback.

### Maps and lists

- Map is a complementary view, never the sole source of case access.
- Every marker has an equivalent list item.
- Pins use icon + label semantics and cluster at low zoom.
- Pin tap opens a bottom sheet preview; full case opens from the preview.
- List mode supports keyboard navigation, filtering, sorting, and screen readers.

### Dialogs, sheets, and snackbars

- Dialogs are for consent, destructive actions, or focused review.
- Bottom sheets are for mobile contextual previews and short forms.
- Background scroll locks while open.
- Focus traps and focus restoration are mandatory.
- Persistent states use banners; short confirmations use snackbars.
- Snackbars remain long enough to read and include action where recovery matters.

### Status chips and progress

Every chip includes icon, label, and accessible status text. Required lifecycle vocabulary:

`Submitted` → `Evidence checked` → `Community case` → `Sent to authority` → `Acknowledged` → `Response received` → `Repair reported` → `Repair verified` → `Resolved`.

Do not expose internal pipeline states in citizen or officer copy.

---

## 6. Motion Specification

Use canonical motion values from [DESIGN_TOKENS.md](../03_Design_System/DESIGN_TOKENS.md): 120ms micro, 200ms standard, 320ms long, with `cubic-bezier(0.2, 0, 0, 1)`.

| Interaction | Motion | Meaning |
|---|---|---|
| Camera shutter | 320ms thumbnail/shutter response | Evidence captured |
| Upload progress | Linear, interruptible | Evidence moving to safety |
| Validation | Step reveal, no celebratory burst | System checking evidence |
| Community match | Gentle count/connection transition | New collective context |
| Timeline update | Insert at correct chronological position | Record changed |
| Government acknowledgement | Indigo event reveal | Official action recorded |
| Repair report | Before/after fade, no confetti | Work is claimed, not yet verified |
| Resolution | Calm shield/check transition | Evidence-backed closure |
| Offline sync | Queue-to-synced transition | Local work reached server |
| Notification | Slide/fade only | New information |

Reduced-motion mode removes movement and uses opacity or immediate state changes. Motion must never delay a primary action or imply certainty beyond the event data.

---

## 7. Microcopy Specification

### Voice

Calm clerk: exact, human, unhurried, constructive, non-accusatory.

### Required patterns

| Context | Copy |
|---|---|
| Accepted evidence | “This photo is clear enough to review.” |
| Uncertain interpretation | “We may be seeing a pothole. A person has not confirmed it yet.” |
| Community match | “Your report joined 4 other reports nearby.” |
| Draft ready | “A complaint is ready for you to review.” |
| Approval | “Review this document before sending it to the Ward Office.” |
| Delivery | “Sent to the Ward Office on 14 July.” |
| Acknowledgement | “The Ward Office confirmed that it received this case.” |
| Repair reported | “The department reported that the issue was repaired.” |
| Verification | “Please compare the new photo with the original evidence.” |
| Error | “We could not read this photo. Try a clearer, well-lit image.” |
| Offline | “You are offline. Your saved report will upload when you reconnect.” |
| Empty | “No cases are visible here yet. You can report the first one.” |

### Banned patterns

- “Agent 1,” “Haversine,” “dhash,” “confidence: 0.91.”
- “202 Accepted,” “SendGrid,” or raw server errors.
- “Your report mattered!” before impact is known.
- “Government failed” without an evidence-backed status.
- “AI verified” when only automated classification occurred.
- Legal language implying CivicPulse is representing the citizen.

---

## 8. Accessibility Validation

The implementation is not design-complete until all of the following pass:

- Body text contrast ≥4.5:1; large text and icons ≥3:1.
- No citizen-facing text below 14px.
- All controls have keyboard operation with Tab, Enter, or Space.
- Focus ring remains visible and high contrast.
- Dialogs and sheets trap focus and restore focus on close.
- Touch targets are at least 48×48px with 8px separation.
- Camera shutter is at least 72×72px.
- Images have useful alt text; citizen photos support correction.
- Dynamic status changes use polite live regions; urgent alerts use assertive live regions.
- Map canvas is excluded from screen readers and replaced by an equivalent list/search experience.
- Status is never communicated by color alone.
- Text reflows at 200% zoom without clipping or horizontal scrolling.
- Reduced-motion preferences are respected.
- Plain-language review passes Grade 6–8 comprehension.
- Hindi and other supported scripts are tested for clipping, line height, and wrapping.

### Accessibility test matrix

Test every screen with keyboard-only navigation, NVDA/JAWS, VoiceOver, TalkBack, 200% zoom, high contrast, reduced motion, color-vision simulation, 320px width, and a slow 3G profile.

---

## 9. Responsive Validation

### Compact mobile

- List is default; map is optional.
- One-column content with 16px margins.
- Sticky bottom primary action when the decision is location, approval, or verification.
- Long documents become readable sections, not compressed desktop pages.
- Bottom sheets replace hover and desktop popovers.

### Tablet

- Two-column evidence/detail layouts where useful.
- Persistent case summary may sit beside the timeline.
- Map and list may share the viewport if both retain minimum readable dimensions.

### Desktop

- Left rail plus capped content column.
- Government queue may use a table with a detail pane.
- Case timeline remains the primary citizen narrative even on wide screens.
- Do not add dashboard widgets merely to fill empty space.

### Performance expectations

- First meaningful public content should appear before map tiles.
- Lazy-load maps, image galleries, and non-critical charts.
- Serve responsive image sizes and preserve an accessible text fallback.
- Preserve report state across navigation, refresh, failure, and offline transitions.

---

## 10. Security and Privacy UI Requirements

- Explain exact-location visibility before submission.
- Strip EXIF and prevent accidental exposure of personal metadata.
- Default public identity to anonymous.
- Show who can see exact coordinates and evidence.
- Use authenticated institutional surfaces for officer and commissioner data.
- Never expose internal evaluation controls through citizen routes.
- Provide deletion/export requests and clear retention language.
- Mask personal contact details in public timelines.
- Keep moderation and disclosure decisions auditable.

---

## 11. Engineering Handoff Notes

The design handoff must include:

1. A state matrix for every screen: loading, empty, error, offline, success, permission denied, and partial data.
2. A semantic status/event schema shared by citizen, officer, notification, and timeline surfaces.
3. A content catalog with translations and accessible labels separate from layout definitions.
4. A component contract for keyboard behavior, focus management, touch target, and live-region behavior.
5. An image pipeline contract covering resizing, EXIF stripping, alt text, thumbnails, and offline queueing.
6. A map/list parity test proving every map action is available in list mode.
7. A privacy test proving public pages cannot reveal restricted coordinates or contributor identity.
8. A lifecycle test proving “sent,” “acknowledged,” “repair reported,” “repair verified,” and “resolved” are distinct backend states.
9. A performance budget for 3G, low-end Android, and large image uploads.
10. A visual regression suite at compact, standard, wide, 200% zoom, high contrast, and reduced motion.

Production deployment follows the PostgreSQL decision in [ADR-007](../07_ADR/ADR-007-PostgreSQL-Production.md); local test doubles must not change user-visible semantics.

---

## 12. Consistency Validation

Before release, review the entire product against these invariants:

- The same lifecycle labels mean the same thing everywhere.
- AI assistance never uses verified green.
- Government events always identify institution, actor, and time.
- Community events always identify contribution and visibility.
- A case always has a current owner and next action.
- A timeline is chronological and does not silently reorder events.
- A public case never reveals restricted personal information.
- Citizen screens never expose implementation jargon.
- Every critical map interaction has a list equivalent.
- Every failure preserves recoverable user work.
- Every success claim is tied to evidence and an explicit confirming actor.
- The primary action remains visually singular on every screen.

### Cross-product review questions

- Does the screen lower uncertainty or merely display activity?
- Is the user closer to resolution after this interaction?
- Could a senior citizen understand the next action without assistance?
- Can a screen-reader user reach the same outcome without the map?
- Is the product claiming more than its evidence proves?
- Does the screen distinguish AI inference from human or government confirmation?

---

## 13. Final Design Review

### Strengths to preserve

- Evidence-first intake.
- Human approval before legal dispatch.
- One continuous case timeline.
- Three-item citizen navigation.
- Plain-language AI gating.
- Existing-channel government workflow through email, SMS, and WhatsApp.
- PostgreSQL production architecture.
- Calm, records-office visual language.

### Release blockers

1. No equivalent accessible list experience for every map action.
2. No complete repair-verification and resolution state model.
3. Incomplete privacy and identity controls.
4. Technical jargon leaking into citizen surfaces.
5. Unclear distinction between government-reported repair and independently verified repair.
6. Missing robust offline state preservation and sync feedback.
7. Missing multilingual typography and content validation.
8. Public and internal evaluation experiences not fully isolated.

### Final standard

CivicPulse is ready for production UI implementation only when a citizen can submit evidence, understand what happened, see who owns the next action, receive an accountable government update, verify the repair, and reach the same outcome through keyboard, screen reader, low bandwidth, local language, or assisted channels.

The interface is successful when the technology becomes quiet and the evidence, responsibility, and impact become unmistakable.
