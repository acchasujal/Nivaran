# CivicPulse Component Library Specification

**Status:** Production component-library specification  
**Scope:** Reusable citizen, institutional, internal, responsive, offline-aware, and accessible UI components  
**Audience:** Design-system engineers, feature engineers, QA, accessibility, content, and visual-regression owners  
**Canonical inputs:** `docs/00_START_HERE/` through `docs/07_ADR/`, [Production UI Specification](../08_UI_SPECIFICATION/PRODUCTION_UI_SPECIFICATION.md), and [Frontend Engineering Blueprint](../09_FRONTEND_ENGINEERING/FRONTEND_ENGINEERING_BLUEPRINT.md)

This document specifies components; it does not contain React, TypeScript, Tailwind, CSS, HTML, or implementation code. It is subordinate to the immutable product, UX, UI, and frontend architecture decisions. A component may not change navigation, screen purpose, lifecycle semantics, or product language.

---

## 1. Component-Library Philosophy

CivicPulse components make evidence, responsibility, uncertainty, community, and impact legible. A component is production-ready only when its visual appearance, behavior, content, accessibility, responsive behavior, offline behavior, performance profile, and test contract are known.

### Library goals

- Reusable without hiding domain meaning.
- Composable without creating uncontrolled prop combinations.
- Accessible by default, not through feature-side patches.
- Responsive from 320px to large displays and 200% text scaling.
- Themeable through semantic tokens only.
- Offline-aware where data can be captured, viewed, or queued.
- Performant on low-end Android and slow networks.
- Testable in isolation and in real user journeys.
- Future-proof for multilingual content, institutional roles, and evolving lifecycle events.

### Non-goals

- Generic visual freedom that weakens the civic language.
- Feature-specific API calls inside library components.
- A component for every one-off layout.
- Generic “status” semantics that erase the distinction between AI inference, government action, and verified resolution.
- Decorative animation or gamification.

### Semantic hierarchy

```text
Evidence → Trust → Community → Accountability → Impact
```

Every component must make clear which part of this chain it serves.

---

## 2. Universal Component Contract

Every component specification and implementation must document the fields below. The category matrices later in this document provide component-specific values.

### 2.1 Required metadata

| Field | Requirement |
|---|---|
| Purpose | One sentence describing the user need |
| Problem solved | The failure avoided or task enabled |
| Owner | Design-system, feature, platform, or institutional team |
| Dependencies | Primitives, tokens, adapters, and data contracts |
| Variants | Exhaustive supported visual/semantic variants |
| Properties | Required, optional, defaults, validation, and event semantics |
| Slots | Named leading, trailing, header, body, footer, media, and action slots |
| States | Default, hover, focus, pressed, disabled, loading, success, error, offline, skeleton, empty |
| Accessibility | ARIA, keyboard, focus, screen reader, touch, reduced motion, contrast |
| Responsive | Compact, standard, wide, and large-display behavior |
| Composition | Allowed parents, children, and sibling relationships |
| Interaction | Motion, transitions, feedback, and cancellation behavior |
| Tokens | Spacing, type, radius, elevation, motion, color, and icon families |
| Performance | Loading, memoization, virtualization, and render budget |
| Testing | Unit, component, accessibility, visual, integration, and E2E coverage |
| Anti-patterns | Incorrect, unsafe, inaccessible, or expensive usage |

### 2.2 Public properties

Public properties use semantic concepts, not implementation details. Required properties must be listed before optional properties. Defaults must be deterministic. Properties representing user-visible text accept localized content or message IDs, never hard-coded feature copy inside a reusable primitive.

### 2.3 Slots

Slots are named and bounded. A component may expose `leading`, `trailing`, `media`, `header`, `body`, `footer`, and `actions` only when each slot has an identified semantic purpose. Arbitrary child injection is not permitted on components that enforce a reading order, status structure, or security boundary.

### 2.4 State model

| State | Required behavior |
|---|---|
| Default | Fully usable, no misleading placeholder state |
| Hover | Pointer-only enhancement; never the only affordance |
| Focus | High-contrast ring and visible focus target |
| Pressed | Immediate acknowledgement without layout shift |
| Disabled | Semantically disabled; explain why when action is unavailable |
| Loading | Preserve context, prevent duplicate action, announce meaningful progress |
| Success | Confirm only server- or domain-authoritative success |
| Error | Explain what failed, what was preserved, and recovery action |
| Offline | State whether viewing, editing, or queueing is available |
| Skeleton | Match expected structure; never use for an error or empty result |
| Empty | Explain absence and offer the next relevant action |

### 2.5 Universal accessibility

- Minimum touch target: 48×48px with 8px separation.
- Camera shutter and equivalent capture action: 72×72px.
- Keyboard operation uses native expected patterns.
- Dialogs and sheets trap focus and restore it to the trigger.
- Status is never conveyed by color alone.
- Images have meaningful alt text or an explicit decorative role.
- Dynamic state changes use polite live regions; urgent failures use assertive alerts.
- Content reflows at 200% text scaling with no clipping or horizontal scrolling.
- Reduced motion removes non-essential movement.
- Map interactions always have a list equivalent.

### 2.6 Universal responsive behavior

- **Compact 320–599px:** single column, 16px margins, bottom sheets, list-first, sticky primary actions.
- **Standard 600–1023px:** two-column layouts where content remains readable; sidebar may be compact.
- **Wide 1024px+:** capped content columns, left rail, queue tables, split detail panes where appropriate.
- **Large displays:** increase whitespace and content grouping, not text density or dashboard widget count.
- **Indic scripts:** allow wrapping and variable line height; do not truncate essential labels.

### 2.7 Universal tokens

Use only semantic tokens from [DESIGN_TOKENS.md](../03_Design_System/DESIGN_TOKENS.md): 4px spacing scale; Noto Sans and Indic families; 14px citizen-facing caption floor; 16px body; 8px cards; 12px dialogs; 16px sheet tops; flat surfaces; 120/200/320ms motion; evidence slate; government indigo; community violet; AI amber; verified green; warning amber; danger red.

### 2.8 Universal testing

Every component must have:

- property and variant unit tests;
- keyboard and focus tests;
- accessible name/role/state tests;
- long-copy and Indic-script tests;
- compact, standard, wide, 200% zoom, high-contrast, and reduced-motion visual states;
- loading, error, empty, and offline stories where applicable;
- integration coverage for its owning feature;
- no console warnings in supported states.

---

## 3. Library Organization

```text
src/design-system/
├─ primitives/
│  ├─ foundation/
│  ├─ buttons/
│  ├─ forms/
│  ├─ overlays/
│  └─ feedback/
├─ composites/
│  ├─ evidence/
│  ├─ timeline/
│  ├─ navigation/
│  └─ status/
├─ patterns/
│  ├─ government/
│  ├─ community/
│  ├─ analytics/
│  └─ maps/
├─ layouts/
├─ tokens/
├─ icons/
├─ content/
└─ testing/
```

### Organization rules

- `primitives/` never imports feature APIs.
- `composites/` may combine primitives and view models but does not fetch.
- `patterns/` may depend on adapters and feature-owned public contracts but remains reusable across screens.
- Feature-specific implementations remain under `features/<feature>/components/`.
- A component is promoted into the library only after two real consumers, an accessibility review, and an API review.

### Dependency direction

```text
tokens → primitives → composites → patterns → feature screens
core platform → all approved layers
feature APIs → feature screens only
```

No reverse import from the library into a feature, no feature-to-feature private import, and no page-level styling contract hidden inside a library component.

---

## 4. Foundation Components

| Component | Purpose / owner | Variants and public properties | Slots and states | Accessibility / responsive / composition | Tokens, performance, tests, anti-patterns |
|---|---|---|---|---|---|
| Typography | Apply canonical type roles; Design System | `display`, `heading`, `body`, `caption`, `label`, `mono`; required `children`, optional `tone`, `as`, `truncate` default false | Body slot only; all universal states except loading | Correct semantic element; no visual heading without document heading; wraps at all widths; composes in every surface | Type/line-height tokens; no runtime cost; test hierarchy, wrapping, Indic text; never use caption for body content |
| Icon | Consistent outline meaning; Design System | required icon name and accessible label policy; optional size, tone, decorative | Default, focus only when interactive; no standalone loading | Decorative icons hidden from AT; informative icons labeled; 48px wrapper when interactive | Icon tokens; static import only; test labels and contrast; never use icon alone for a critical action |
| Divider | Separate related content; Design System | horizontal/vertical, semantic tone, inset | Default/focus-adjacent | `separator` semantics only when it represents a separator; responsive inset | Border token; zero layout JS; test orientation; never replace heading/grouping structure |
| Avatar | Represent anonymous or identified person/org; Profile team | anonymous, person, organization, verified; required identity level; optional image, name, size | Loading image, fallback initials, error, offline cached | Alt text follows identity visibility; 32/40/48px visual sizes with 48px interactive wrapper | Radius and neutral tokens; lazy-load remote image; test privacy masking; never expose hidden identity in alt text |
| Logo | Brand recognition; Design System | full, mark, monochrome, reversed; required accessible label when meaningful | Default/loading asset failure | Link wrapper has “CivicPulse home”; scales without blur | Asset token; inline critical mark, lazy full logo; test contrast; never use logo as decoration in place of page title |
| Illustration | Explain empty/help states; Design System | empty, offline, error, resolved, how-it-works; required meaning; optional size | Loading placeholder, reduced-motion static | Decorative by default with adjacent text; no information only in artwork | Static optimized assets; test reduced motion; never use illustration to replace recovery copy |
| Surface | Semantic background/elevation boundary; Design System | page, card, inset, dialog, sheet, interactive; required semantic role; optional border | Hover/focus for interactive, disabled, offline | Never creates inaccessible click target; responsive padding follows density | Surface/radius/elevation tokens; no unnecessary shadow; test contrast; never nest arbitrary elevated cards |
| Container | Constrain readable content; Layout team | page, reading, narrow, wide, full-bleed; required width policy; optional gutters | Loading skeleton may inherit dimensions | 16px compact gutters, capped reading width; composes with all layouts | Spacing tokens; no measurement JS; test 320/200%; never use nested containers to hide overflow |

### Foundation composition

Typography, Icon, Divider, Avatar, Logo, Illustration, Surface, and Container may compose freely with buttons, forms, feedback, navigation, and feature composites. Foundation components may not contain API calls, routing decisions, map providers, or domain statuses.

---

## 5. Button Components

| Component | Purpose / variants | Properties, slots, defaults | States and interaction | Accessibility / composition | Performance, tests, anti-patterns |
|---|---|---|---|---|---|
| Primary Button | One main action; filled primary | required label/onAction; optional leading/trailing icon, type, disabled, loading; default type button | hover/focus/pressed/disabled/loading/success/error; 120ms feedback; loading locks duplicate submit | Native button semantics; focus ring; 48px height; all sizes responsive; composes with forms/dialogs | Static; test keyboard, double-submit, contrast; never use two competing primaries |
| Secondary Button | Supporting action; outlined | Same contract as Primary; default visual secondary | Universal states | Native button; 48px; stacks on compact widths when paired | Static; test ordering; never make destructive action look secondary |
| Tertiary Button | Low-emphasis navigation/disclosure | label required; optional icon, href/action; default inline | hover/focus/pressed/disabled | Must retain visible focus and 48px hit area even when text is compact | Static; test link/button semantics; never use for irreversible action |
| Danger Button | Explicit destructive/rejection action | required confirmation policy and label; optional destructive reason | hover/focus/pressed/disabled/loading/error | Announces destructive intent; paired with cancel; no color-only danger | Static; test confirmation and focus; never use for normal failure recovery |
| Ghost Button | Contextual low-surface action | label required; optional tone and icon | universal states | Contrast must pass on its actual surface; 48px target | Static; test surface variations; never use for primary submit |
| FAB | Start/resume Report flow | required label/action; optional expanded label; default centered | expanded, collapsed-on-scroll, focus, pressed, disabled, offline | Accessible name includes “Report”; 48px wrapper, 72px only for capture; never covers content | Minimal transform only; test scroll and reduced motion; never contain hidden navigation |
| Icon Button | Compact action with tooltip | required icon and accessible label; optional tooltip, pressed, disabled | universal states | 48px target; tooltip cannot be only label; keyboard tooltip behavior | Static; test name and tooltip; never use unlabeled icon buttons |
| Split Button | Primary action + adjacent alternatives | required primary action and menu items; default primary selected | menu open, focus, disabled, loading | Menu keyboard pattern; focus returns to trigger; avoid on compact mobile | Lazy menu only if large; test escape/arrow keys; never hide required action in menu |
| Loading Button | Explicit in-flight mutation | required label and loading label; optional progress | loading only during authoritative operation | `aria-busy`, disabled duplicate action, polite announcement | Static; test mutation cancellation; never fake completion |

Buttons may compose with forms, dialogs, cards, navigation, and feedback. They may not contain raw API error text or decide permissions.

---

## 6. Form Components

All form components are controlled by the form architecture described in the [Frontend Engineering Blueprint](../09_FRONTEND_ENGINEERING/FRONTEND_ENGINEERING_BLUEPRINT.md). They expose label, description, error, required, disabled, and validation state contracts consistently.

| Component | Purpose / owner | Properties and variants | States / slots | Accessibility / responsive | Performance, tests, anti-patterns |
|---|---|---|---|---|---|
| Text Field | Short single-line input; Design System | required name/label; optional value, default, type, inputMode, maxLength, autocomplete, description, error, required | idle/focus/dirty/disabled/loading/error/success/offline; leading/trailing slots | Label linked by ID, error linked, 48px height, keyboard type; full-width compact | Native input; test validation and long Indic text; never placeholder-only label |
| Textarea | Context or document editing | required name/label; optional rows, maxLength, resize policy, character count, error | same + autosaving | Announce character count without every keystroke; scrollable document at mobile; full width | Debounced autosave owned by feature; test paste/IME; never truncate legal text silently |
| Search | Case/location/keyword search | required label and submit behavior; optional debounce, scope, suggestions, clear | idle/focus/typing/loading/results/empty/error/offline | Combobox semantics only with full keyboard contract; 48px; suggestions below field | Debounce/cancel requests; test escape and no-results; never search hidden private data |
| Select | Finite option selection | required label/options/value; optional placeholder, grouped options, disabled items | open/focus/loading/error/disabled | Native select preferred where it meets design; otherwise tested listbox; mobile native-like behavior | No large option list render without virtualization; test keyboard; never hide current value |
| Autocomplete | Searchable controlled selection | required query/value/onSelect; optional async source, empty copy, max results | typing/loading/results/empty/error/offline | Combobox with active descendant and focus restoration | Cancel stale requests; test IME and screen readers; never accept unvalidated free text where selection is required |
| Checkbox | Independent boolean/multi-select | required label/name; optional checked/default, indeterminate, description | unchecked/checked/indeterminate/focus/disabled/error | Native semantics; label target 48px; group error summary | Static; test indeterminate and form reset; never use checkbox for mutually exclusive choice |
| Radio | One choice from group | required name/options/value; optional descriptions, disabled options | selected/unselected/focus/disabled/error | Fieldset/legend, arrow-key group behavior | Static; test group semantics; never use color-only selected state |
| Switch | Immediate preference toggle | required label; optional checked, onChange, disabled, confirmation | on/off/focus/disabled/loading | Switch semantics and visible label; use for settings, not form submission decisions | Avoid optimistic external actions; test announcement; never use for ambiguous wording |
| Slider | Bounded numeric preference | required min/max/value/label; optional step, marks, output format | focus/drag/keyboard/disabled/error | Keyboard arrows/Home/End; output announced; touch target 48px | Lightweight; test precision and locale; never use for severity without explaining meaning |
| File Upload | General file selection | required accepted types/size policy/label; optional multiple, queue, progress, retry | idle/selecting/uploading/validating/accepted/rejected/queued/offline/error | File input remains available; errors inline and summary; keyboard drop zone | Stream/resize through image adapter; test cancel/retry; never trust client MIME alone |
| Image Upload | Civic evidence capture/upload | required evidence policy; optional camera/file actions, preview, alt editor | same as File Upload plus preview/retake/privacy | Camera action 72px; privacy and EXIF copy; image alt text editable | Lazy previews, revoke URLs, offline queue; test large files/permissions; never persist raw EXIF |
| Location Picker | Confirm evidence location | required value/onChange; optional geolocation, search, manual coordinates, privacy precision | locating/located/manual/denied/offline/error | Map + structured fallback; no focus trap in map; sticky confirm on compact | Lazy map; test denied permission and list parity; never block manual path |
| OTP | Verify phone/session | required length/label/submit; optional resend timer | empty/partial/complete/loading/error/expired/offline | One logical field or correctly grouped inputs; announce resend timer carefully | No logging values; test paste/autofill; never reveal account existence |
| Date Picker | Select civic date | required label/value; optional min/max, locale, disabled dates | closed/open/focus/error/disabled | Keyboard calendar grid, text entry fallback, locale-aware | Lazy calendar; test Indic locale and timezone; never infer local date from UTC silently |
| Time Picker | Select appointment/time event | required label/value; optional interval, min/max, locale | same as Date Picker | Text fallback and locale formatting; announce selected value | Static; test DST/timezone; never use for server timestamps without timezone policy |

### Form composition

Fields compose inside FormSection, Dialog, BottomSheet, and screen layouts. They may not own submission, navigation, server mutation, or route redirects. Feature forms own schemas, autosave, and mutation orchestration.

---

## 7. Evidence Components

| Component | Purpose / owner | Variants and properties | Slots / states | Accessibility / responsive / composition | Performance, tests, anti-patterns |
|---|---|---|---|---|---|
| Evidence Card | Summarize one evidence item | photo, voice, document-reference; required media, alt, timestamp, locality, visibility, status; optional actor | media, metadata, actions; loading/error/offline/restricted | Alt and visible metadata; action area keyboardable; stacks compact | Thumbnail only, lazy media; test privacy and alt; never expose exact restricted location |
| Evidence Gallery | Browse case evidence | grid, strip, grouped timeline; required items; optional selection/multiple | loading/skeleton/empty/error/offline/restricted | Keyboard arrows, focus management, count announced; one column compact | Virtualize large galleries, lazy load; test 1/large/restricted; never preload all full-resolution assets |
| Evidence Viewer | Inspect one evidence item | image/audio/document preview; required source/alt; optional download/share permission | loading/error/offline/restricted/fullscreen | Dialog focus trap, escape close, captions/transcript where applicable | Lazy full asset and object URL cleanup; test zoom/keyboard; never permit unauthorized download |
| Image Comparison | Compare original and repair evidence | side-by-side, slider, stacked; required before/after labels and sources | loading/missing side/error/offline | Slider has keyboard alternative and static labels; no meaning by movement only | Load derivatives; test reduced motion and mobile stack; never call repair verified automatically |
| Evidence Checklist | Explain validation results | accepted, rejected, pending; required checks with labels and recovery | success/error/pending/offline | Each check has icon + text + announcement; ordered list | Static; test mixed results; never expose internal hash/score terminology |
| Evidence Timeline | Show evidence chronology | compact/full; required events; optional grouping | skeleton/empty/error/offline | Uses Timeline Event contract and chronological DOM order | Virtualize long history; test out-of-order server data; never reorder silently |
| Upload Progress | Show media operation | determinate, indeterminate, queued; required label and status; optional percent/retry/cancel | uploading/validating/complete/error/offline | `progressbar` only when determinate; live status; action keyboardable | Avoid polling for local progress; test cancellation/retry; never claim server acceptance from client progress |

Evidence components use slate evidence tokens, never AI or verified colors for raw media. They compose with Case Timeline, Report Flow, Dialog, Bottom Sheet, and Repair Verification.

---

## 8. Timeline Components

Timeline components represent events, not arbitrary cards. Every event must contain what happened, who confirmed it, when, source/evidence, and next action where applicable.

| Component | Purpose / owner | Variants and properties | States / interaction | Accessibility / composition | Performance, tests, anti-patterns |
|---|---|---|---|---|---|
| Timeline | Chronological case narrative | compact/full, reverse-loading, grouped-by-day; required events and current status | loading/empty/error/offline/partial; expand event | Ordered list semantics; current event announced; preserves focus/scroll | Virtualize only with anchor preservation; test chronology; never split citizen story into tabs |
| Timeline Event | Generic event foundation | confirmed, pending, future, failed; required statement/actor/time | hover/focus/expanded/loading/error | Landmark-free list item with heading; expandable details keyboardable | Flat layout; test long copy; never show event without actor/time |
| Status Event | System/case status transition | submitted, evidence-checked, community-case, sent, acknowledged, response, repair-reported, verified, resolved | pending/confirmed/reopened | Icon + text + owner; live announce only on meaningful new event | Static; test state mapping; never map internal status directly to citizen label |
| Government Event | Official institutional action | acknowledgement, assignment, response, repair-report; required institution/role/source | pending/confirmed/error | Indigo event semantics; official identity accessible | Lazy attachments; test authorization and source; never imply official event from an email send alone |
| Community Event | Contribution or group change | match, contributor-added, evidence-confirmed, case-shared | pending/confirmed/restricted | Violet semantics; identity visibility honored | Static; test anonymous contributors; never expose hidden membership |
| AI Event | Machine assistance explanation | classification, summary, grouping suggestion; required plain-language claim and uncertainty | suggestion/accepted/rejected/pending | Amber semantics; “not human-confirmed” text; no raw score | Static; test jargon guard; never render raw model output unfiltered |
| Repair Event | Department-reported work | reported-repaired, partial, recurrence | reported/pending-verification/reopened | Must distinguish report from verification; attach evidence | Lazy before/after assets; test missing photo; never mark resolved |
| Verification Event | Human/community confirmation | community-verified, officer-confirmed, unresolved, contested | pending/confirmed/contested/error | Green only for confirmed resolution; actor/criteria visible | Static; test multiple verifiers; never turn one vote into official closure |

---

## 9. Map Components

| Component | Purpose / owner | Variants and properties | States / slots | Accessibility / responsive / composition | Performance, tests, anti-patterns |
|---|---|---|---|---|---|
| Map | Geographic context | discovery, location-picker, officer; required adapter, viewport, privacy policy | loading/ready/no-data/error/offline/permission-denied | `aria-hidden` with list fallback; compact starts list; map never sole navigation | Lazy-load provider; test cleanup/large marker sets; never initialize at app root |
| Marker | Represent one case/location | active, confirmed, resolved, selected, restricted; required case ID, position, label | default/hover/focus/selected/clustered | Accessible equivalent in list; visible icon+label; privacy precision applied | Reuse instances; test selection parity; never expose raw lat/lng in label |
| Marker Cluster | Represent grouped cases | count, selected, expanded; required count/area | loading/selected/error | Announces count and area; tap opens list or expands | Cluster server/client strategy documented; test dense city; never hide individual cases permanently |
| Location Card | Preview a map result | compact/full; required case/locality/status; optional photo, action | loading/error/restricted/offline | Bottom-sheet-ready, 48px actions, readable at 320px | Thumbnail lazy; test no-image state; never duplicate full case timeline |
| Map Controls | Pan/zoom/list/location controls | zoom, recenter, locate, map-list toggle; required allowed controls | disabled/loading/permission-denied | Labels/tooltips and keyboard where map library permits; list toggle always available | Minimal listeners; test reduced motion; never hide list equivalent |
| Location Search | Find a place | address, locality, case ID; required query/onSelect; optional suggestions | typing/loading/results/empty/error/offline | Combobox contract; manual coordinate fallback | Debounce/cancel; test locale and offline; never reveal restricted case coordinates |

Map components depend on the map adapter, not directly on Leaflet/MapLibre objects. Feature discovery owns map data and URL state.

---

## 10. Navigation Components

| Component | Purpose / owner | Variants and properties | States / slots | Accessibility / responsive / composition | Performance, tests, anti-patterns |
|---|---|---|---|---|---|
| App Bar | Route/case context | citizen, institutional, internal; required title; optional back, action, profile | default, scrolled, offline | Landmark/banner rules; title remains visible; compact collapses secondary actions | Static; test route title and back restoration; never contain technical ticker |
| Bottom Navigation | Three-item mobile navigation | Home, Report FAB, My Reports only; required active route | active/focus/disabled/offline | Navigation landmark, current route, 48px targets; no hidden fourth item | Static; test deep-link active state; never add feature tabs |
| Sidebar | Desktop/tablet primary navigation | expanded, collapsed; same three primary destinations | active/focus/collapsed/offline | Labels remain available to AT; collapse button labeled | Static; test keyboard and narrow desktop; never own route permissions |
| Breadcrumb | Contextual hierarchy | public, institutional, case; required items; optional current | default/focus | `navigation` landmark and current page semantics; compact may collapse | Static; test long locality; never replace mobile back action when hierarchy is unnecessary |
| Tabs | Local non-narrative mode switch | filter, settings, document formats; required tabs/value | active/focus/disabled/loading | Only used where content is not a chronological case story; correct tab pattern | Mount active panel only when safe; test arrow keys; never use for case lifecycle sections |
| Profile Menu | Secondary account/settings access | anonymous, citizen, institutional; required trigger | closed/open/loading/auth error | Menu keyboard pattern, focus restoration, privacy-safe identity | Lazy menu; test escape; never expose role-changing action without confirmation |
| Drawer | Secondary navigation or broad filter | left/right; required open state and title | closed/open/loading | Modal or non-modal mode explicit; focus policy | Mount on demand; test focus/scroll lock; never use for primary report steps |
| Bottom Sheet | Mobile contextual content | preview, form, confirmation; required title/open state | closed/open/loading/error/offline | Focus trap for modal sheet; drag gesture has button close alternative | Animate 200ms/320ms as appropriate; test reduced motion; never hide a required action below unreachable content |

---

## 11. Feedback Components

| Component | Purpose / owner | Variants and properties | States / slots | Accessibility / responsive / composition | Performance, tests, anti-patterns |
|---|---|---|---|---|---|
| Snackbar | Short reversible confirmation | success, info, warning, error; required message; optional action/duration | queued/visible/dismissed | `status` or `alert` based on urgency; action keyboardable; 3s default only for non-critical | Portal and queue cap; test announcements; never use for critical error alone |
| Toast | Lightweight transient feedback | neutral/success/warning; required message | visible/dismissed | Non-critical `status`; do not steal focus | Small portal; test stacking; never use to confirm legal dispatch without durable timeline event |
| Banner | Persistent page state | offline, privacy, system, draft, warning; required message | visible/dismissed/actionable | Landmark/role; close only when safe; compact full width | Static; test persistence; never hide required safety information by default |
| Alert | Inline important message | info, warning, error, success; required title/message | default/actionable | `alert` for urgent only; icon + text; linked recovery | Static; test focus on validation summary; never use red for ordinary pending |
| Progress | Operation progress | determinate, indeterminate, step; required label/status | running/complete/error/offline | Correct progress semantics and live label | Lightweight; test unknown progress; never fake percentage |
| Skeleton | Reserve expected layout | text/card/media/timeline/queue; required shape contract | visible/hidden | Hidden from AT or labeled as loading region | CSS-only preferred; test layout shift; never use for long-running operation without explanation |
| Empty State | Explain no data | no-cases, no-reports, no-results, no-notifications, no-evidence | default/offline/filter-empty | Heading, reason, next action; illustration decorative | Static; test every filter combination; never imply failure |
| Error State | Explain recoverable failure | network, permission, validation, server, contract; required recovery | default/retrying/offline | Focus summary only when user action is blocked; recovery button labeled | Static; test error normalization; never render raw provider errors |
| Offline Banner | Persistent connectivity state | offline, reconnecting, sync-pending, sync-failed | visible/updated/dismissible only when safe | `status` live region, last sync timestamp | Core provider subscription only; test flapping connectivity; never disappear while pending work exists |
| Loading Indicator | Small named wait | spinner, dots, step; required accessible label | running/stopped/error | `aria-busy` or status, never spinner-only for >2s | CSS/Motion token; test reduced motion; never block a page with an unlabeled spinner |

---

## 12. Government Components

| Component | Purpose / owner | Variants and properties | States / composition | Accessibility / responsive | Performance, tests, anti-patterns |
|---|---|---|---|---|---|
| Queue Row | Review assigned cases | normal, overdue, high-risk, acknowledged; required case/owner/status/age | loading/error/selected/disabled | Table row with action names, not color-only urgency; stacks compact | Virtualize long queues; test sorting and permissions; never show unassigned responsibility |
| Official Response Card | Show institutional response | acknowledgement, clarification, response, closure; required institution/actor/time/source | pending/confirmed/contested | Indigo official semantics; source and actor announced | Lazy attachments; test privacy; never infer official response from client text |
| SLA Badge | Show deadline state | upcoming, due, overdue, paused; required deadline/clock/source | loading/error/unknown | Text date plus icon; avoid flashing urgency | Static date formatting; test locale/timezone; never display unsupported SLA |
| Department Badge | Identify responsible department | ward, roads, water, sanitation, unknown; required name/jurisdiction | assigned/unassigned/changed | Institution label and accessible icon | Static; test long names; never imply endorsement or blame |
| Repair Form | Capture department repair report | required description/date/location/photo; optional note | draft/validating/submitting/saved/error/offline | RHF/Zod contract; error summary; after-photo required by policy | Queue-safe upload; test duplicate submission; never set resolved locally |
| Verification Card | Compare repair claim and evidence | reported, partial, verified, contested; required before/after/status | loading/missing/error/offline | Clear actor and verification criteria; button alternatives to slider | Lazy comparison assets; test three outcomes; never equate “reported repaired” with verified |

---

## 13. Community Components

| Component | Purpose / owner | Variants and properties | States / composition | Accessibility / responsive | Performance, tests, anti-patterns |
|---|---|---|---|---|---|
| Community Match | Explain group relationship | confident, uncertain, new-case; required count/area/explanation | loading/accepted/separate/error | Violet semantics and plain language; actions are explicit | Static plus thumbnails; test privacy and uncertain match; never force a match |
| Contributor Card | Show contribution without exposing excess identity | anonymous, named, organization, verified role; required visibility policy | loading/restricted/removed | Accessible identity label; hidden data stays hidden in DOM | Lazy avatar; test anonymity; never reveal contact details |
| Volunteer Card | Assign local verification role | available, assigned, paused; required role/area/permission | loading/error/offline | Action labels explain responsibility; 48px targets | Static; test role limits; never imply official authority |
| Verification Vote | Record factual community confirmation | confirm, not-repaired, uncertain, unsafe; required case/criteria | idle/submitted/duplicate/offline/error | Radio/choice semantics; explain impact before submission | No optimistic closure; test repeat/undo; never use popularity score |
| Community Banner | Explain collective impact | joined, invite, progress, privacy; required message/action | visible/dismissed/offline | Banner semantics and clear action | Static; test long copy; never use outrage or shaming language |

---

## 14. Analytics Components

Analytics are institutional components. Public citizen surfaces may use a small evidence-backed summary, never raw operational dashboards.

| Component | Purpose / owner | Variants and properties | States / composition | Accessibility / responsive | Performance, tests, anti-patterns |
|---|---|---|---|---|---|
| Charts | Show evidence-backed trends | line, bar, stacked, distribution; required data/units/date range/methodology | loading/empty/error/small-sample | Data table or text summary equivalent; no color-only series | Lazy-load chart library; test small sample and locale; never omit methodology |
| Stat Card | Show one bounded metric | verified, pending, time, count; required label/value/source/date | loading/empty/stale/error | Label/value/subtext readable at 200%; icon not sole meaning | Static; test large numerals; never show vanity metric without purpose |
| Trend Card | Show change over time | rising/falling/stable/insufficient data; required metric/period/basis | loading/empty/error | Direction plus text; avoid red/green alone | Compute outside render; test timezone and sample; never imply causation |
| Heatmap | Show spatial concentration | ward, category, density; required geometry/legend/methodology | loading/empty/error/offline | List/table alternative; legend labels and scale | Lazy canvas/SVG; test large data; never publish restricted precision |
| Metric Card | Show audited operational measure | acceptance, acknowledgement, resolution, accessibility; required value/denominator/period | loading/stale/error/small-sample | Methodology expandable and available to AT | Static; test denominator zero; never display unsupported percentage |

---

## 15. Dialog Components

| Component | Purpose / owner | Variants and properties | States / slots | Accessibility / responsive | Performance, tests, anti-patterns |
|---|---|---|---|---|---|
| Dialog | Focused interruption | standard, wide, document, form; required title/open/close | open/closing/loading/error | Modal role, labelled title, focus trap/restore, escape policy | Mount on demand; test background scroll lock; never put an entire route in a dialog |
| Confirmation | Confirm reversible/important action | neutral, warning, destructive; required action/cancel labels and consequence | default/submitting/error | Focus primary/cancel order based on risk; clear consequence | Static; test enter/escape; never use ambiguous “Continue” |
| Approval Dialog | Human legal consent | draft type, recipient, evidence count, editable summary; required approve/reject | loading/error/approved/blocked | Readable document, explicit responsibility, no auto-submit | Document content virtualized only if safe; test server gate; never approve optimistically |
| Delete Dialog | Confirm data removal | draft, local queue, profile; required item and retention consequence | default/submitting/error/success | Destructive semantics, recovery information, focus restore | Static; test double action; never delete server data from client-only assumption |
| Permission Dialog | Explain browser/device permission | camera, location, notifications, storage; required purpose/continue/skip | request/denied/granted/unavailable | Plain language, no fake browser prompt; keyboardable | No repeated prompt loops; test denial and manual fallback; never gate all reporting on optional permission |

---

## 16. Layout Patterns

Layouts are not visual components that invent product behavior; they provide predictable regions for screen composition.

| Pattern | Responsibility | Required regions | Responsive behavior | Anti-pattern |
|---|---|---|---|---|
| Citizen Shell | Home/report/my reports navigation | app bar, content, bottom nav/FAB, offline banner | rail replaces bottom nav on wide screens | Adding primary nav items |
| Case Timeline Layout | Evidence-to-impact narrative | sticky case header, timeline, contextual action | single column compact; capped reading width | Tabs for lifecycle stages |
| Report Flow Layout | Resumable capture sequence | step context, main form, primary action, save/offline state | sticky action compact; no hidden steps | Losing state on route change |
| Institutional Queue Layout | Dense operational review | rail, filters, queue, detail region | table wide; stacked rows compact | Exposing personal data outside jurisdiction |
| Document Review Layout | Read/edit/approve | document, evidence context, actions, legal notice | document stacks; actions remain reachable | Sending before approval |

---

## 17. Public API and Export Strategy

### Public package surface

The library exposes only reviewed public components, token helpers, accessibility helpers, and testing utilities through explicit category entry points:

```text
design-system/foundation
design-system/buttons
design-system/forms
design-system/evidence
design-system/timeline
design-system/maps
design-system/navigation
design-system/feedback
design-system/government
design-system/community
design-system/analytics
design-system/dialogs
design-system/layouts
```

Feature-private components are never exported through the public library entry point.

### Naming

- Public names are semantic nouns: `EvidenceCard`, `GovernmentEvent`, `OfflineBanner`.
- Avoid implementation names such as `AgentCard`, `ProviderStatus`, or `MapboxMarker`.
- Variants are documented values, not unbounded CSS escape hatches.
- Event callbacks use domain language: approval requested, repair verification submitted, case followed.

### Internal API

Internal exports may include token plumbing, adapter interfaces, test hooks, and provider-specific map/media utilities. They require an owning team and may not be consumed by feature code without review.

### Versioning

- Patch: bug fix with unchanged semantics.
- Minor: additive variant/property or accessible enhancement.
- Major: changed default, removed variant, changed DOM/keyboard contract, or semantic meaning.
- Product lifecycle labels require a coordinated canonical-document review before a major library change.

### Deprecation

Deprecations include a replacement, migration note, warning in development, Storybook migration example, and removal target. Deprecated components remain accessible and token-compliant until removal; never silently alias a changed semantic component.

---

## 18. Documentation Standard

Every Storybook entry and component page contains:

1. Purpose.
2. Problem solved.
3. Owner.
4. Supported variants.
5. Required and optional properties with defaults.
6. Named slots.
7. Full state gallery.
8. Keyboard and screen-reader behavior.
9. Compact, standard, wide, and large-display examples.
10. Offline behavior where applicable.
11. Token usage.
12. Performance notes.
13. Testing checklist.
14. Do/Don’t examples.
15. Related components and owning feature.
16. Migration/deprecation note when applicable.

### Do

- Use the semantic variant that matches the domain event.
- Preserve labels and accessible descriptions.
- Use the component’s loading/error/offline states.
- Keep evidence and responsibility visible.

### Don’t

- Override tokens for a single screen.
- Put raw API/provider text into content slots.
- Use a verified component for an AI suggestion.
- hide critical actions inside hover-only UI.
- Use a map component without its list fallback.

---

## 19. Quality Gates

No component is production-ready until all gates pass.

### Design review

- Matches canonical UI specification and token semantics.
- Has one clear purpose and owner.
- Does not alter IA, navigation, or product behavior.
- Distinguishes evidence, AI assistance, government action, community contribution, and verified resolution.

### Accessibility review

- WCAG 2.2 AA contrast.
- Keyboard complete.
- Focus trap/restore where applicable.
- Screen-reader names, roles, states, and announcements.
- Map/list parity.
- 200% zoom, high contrast, reduced motion, 320px width.
- Indic-script and long-copy validation.

### Engineering review

- Public API has no feature leakage.
- State ownership is correct.
- Runtime schemas and error behavior are defined.
- No secret or sensitive data exposure.
- Mutation idempotency and retry behavior are safe.
- Offline behavior is explicit.

### Performance review

- No unnecessary root-bundle dependency.
- Lazy media/map/chart behavior documented.
- Render and interaction budget measured.
- Large lists/gallery virtualization considered.
- No avoidable layout shift.

### QA review

- Unit and component tests.
- Accessibility tests.
- Visual regression states.
- Feature integration tests.
- Critical E2E journeys.
- Offline/reconnect tests where applicable.
- Error, empty, and permission-denied coverage.

---

## 20. Implementation Sequence

### Stage 1 — Foundation

Implement and test Typography, Icon, Divider, Avatar, Logo, Illustration, Surface, Container, semantic tokens, focus primitives, and live-region primitives.

### Stage 2 — Actions and feedback

Implement buttons, FAB, Icon Button, Dialog, Bottom Sheet, Snackbar, Toast, Banner, Alert, Progress, Skeleton, Empty State, Error State, Offline Banner, and Loading Indicator.

### Stage 3 — Forms and media

Implement Text Field, Textarea, Search, Select, Autocomplete, Checkbox, Radio, Switch, Slider, File Upload, Image Upload, Location Picker, OTP, Date Picker, and Time Picker with RHF/Zod integration contracts.

### Stage 4 — Evidence and timeline

Implement Evidence Card, Gallery, Viewer, Image Comparison, Checklist, Upload Progress, Timeline, and event variants.

### Stage 5 — Navigation and maps

Implement App Bar, Bottom Navigation, Sidebar, Breadcrumb, Tabs, Profile Menu, Drawer, Bottom Sheet, Map adapter, Marker, Marker Cluster, Location Card, Map Controls, and Location Search.

### Stage 6 — Domain patterns

Implement Government, Community, Analytics, and Approval components with permission, privacy, and methodology contracts.

### Stage 7 — Adoption and hardening

Migrate feature screens, remove duplicate legacy components, validate bundle budgets, run full accessibility/visual/E2E matrix, and publish the stable public API.

---

## 21. Final Component Review

The library is complete only when:

- every reusable component has a named owner;
- every public property, default, state, slot, and variant is documented;
- every component has a tested accessible interaction model;
- every data-bearing component has loading, error, empty, and offline behavior where applicable;
- every map component has a list equivalent;
- every media component respects EXIF, privacy, caching, and lazy-loading rules;
- every government and repair component distinguishes reported, acknowledged, verified, and resolved states;
- every analytics component exposes methodology and sample-size context;
- every dialog restores focus and protects background content;
- every public export is versioned and documented;
- no library component contains feature API calls or implementation-specific jargon;
- design, accessibility, engineering, performance, and QA reviews have all passed.

The component library succeeds when CivicPulse can grow from citizen reporting to national civic accountability without visual drift, semantic ambiguity, accessibility regressions, or repeated frontend invention.
