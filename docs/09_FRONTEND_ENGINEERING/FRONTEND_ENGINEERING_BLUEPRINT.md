# CivicPulse Frontend Engineering Blueprint

**Status:** Architecture-ready blueprint  
**Scope:** React citizen, community, government, and internal evaluation clients  
**Audience:** Frontend engineers, staff engineers, QA, accessibility, security, design systems, and product teams  
**Immutable sources:** `docs/00_START_HERE/` through `docs/07_ADR/`  
**Target stack:** React 19, Vite, TypeScript, Tailwind CSS v4, shadcn/ui, React Router, TanStack Query, React Hook Form, Zod, Motion, and Leaflet or MapLibre

This document defines architecture, boundaries, contracts, and engineering rules. It contains no React, TypeScript, Tailwind, HTML, or implementation code. Product meaning, IA, screen behavior, visual tokens, and governance remain owned by the canonical documents in `docs/00_START_HERE/` through `docs/07_ADR/`.

---

## 1. Frontend Engineering Philosophy

The frontend is a trustworthy rendering and interaction layer for evidence, community, government responsibility, and measurable impact. It must make complexity available to the right audience without making citizens carry it.

### Principles

1. **Feature isolation:** A case, report, community, government, and evaluation capability owns its UI, queries, schemas, and tests.
2. **Server state is not local state:** API data belongs to TanStack Query; transient interaction state belongs to components or feature hooks.
3. **The URL is shareable state:** Search, filters, selected case, and view mode belong in URL parameters when a user can share or refresh them.
4. **Forms are explicit state machines:** Draft, validating, queued, submitting, accepted, rejected, and synchronized states are first-class.
5. **Offline is a product mode:** It is not an exception page or a hidden retry loop.
6. **Accessibility is architecture:** Focus, semantics, live regions, reduced motion, map parity, and text scale are component contracts.
7. **Progressive enhancement:** A case remains usable without maps, animation, JavaScript-only gestures, or a fast network.
8. **Minimal render surface:** Subscribe components only to the state they need; avoid page-wide invalidation.
9. **Evidence outranks decoration:** Images, chronology, ownership, and verification are the dominant content.
10. **The frontend never authorizes what the backend has not authorized:** Human approval and permission gates are enforced server-side and represented honestly client-side.

### Non-goals

- Replacing the backend domain model in client state.
- Duplicating API validation rules as the source of truth.
- Hiding errors to create a smoother demo.
- Exposing internal agent names or provider details in citizen routes.
- Creating a second design-token system inside feature CSS.
- Treating a map as the only case navigation surface.

---

## 2. Project Structure

### Purpose

Provide predictable ownership boundaries so multiple engineers can work without creating a shared-component dumping ground.

### Target structure

```text
frontend/
├─ public/
├─ src/
│  ├─ app/
│  │  ├─ AppProviders
│  │  ├─ router
│  │  ├─ route-boundaries
│  │  └─ app-config
│  ├─ core/
│  │  ├─ api/                 # HTTP client, DTO transport, error normalization
│  │  ├─ auth/                # session, permissions, protected-route policy
│  │  ├─ connectivity/        # online state and sync coordination
│  │  ├─ storage/              # versioned local persistence adapters
│  │  ├─ telemetry/            # privacy-safe logging and performance events
│  │  └─ i18n/                 # locale loading and message formatting
│  ├─ design-system/
│  │  ├─ primitives/           # shadcn/ui-derived accessible primitives
│  │  ├─ composites/           # evidence, timeline, status, government components
│  │  ├─ tokens/               # token consumption and themes
│  │  └─ icons/
│  ├─ layouts/
│  │  ├─ CitizenLayout
│  │  ├─ InstitutionalLayout
│  │  └─ InternalLayout
│  ├─ features/
│  │  ├─ discovery/
│  │  ├─ cases/
│  │  ├─ reporting/
│  │  ├─ my-reports/
│  │  ├─ community/
│  │  ├─ government/
│  │  ├─ notifications/
│  │  ├─ profile/
│  │  ├─ help/
│  │  ├─ moderation/
│  │  └─ evaluation/
│  ├─ routes/                  # route modules only; feature composition stays in features
│  ├─ shared/
│  │  ├─ feedback/             # loading, empty, error, offline
│  │  ├─ media/                # image viewer, upload primitives
│  │  ├─ navigation/
│  │  ├─ overlays/
│  │  └─ utilities/
│  ├─ assets/
│  └─ test/
├─ e2e/
├─ storybook/
└─ tooling/
```

### Feature module contract

Each feature owns:

- public components;
- route-level screens;
- query and mutation hooks;
- Zod response/request schemas;
- feature types derived from schemas;
- local state hooks;
- accessibility tests;
- loading, empty, error, and offline states;
- feature documentation and Storybook stories.

Feature modules may import `core`, `design-system`, `layouts`, and approved `shared` modules. They may not import another feature’s private files. Cross-feature behavior is exposed through an explicit public API or composed at route level.

### Location rules

- `app/`: application composition only.
- `core/`: cross-cutting runtime capabilities, never product-specific UI.
- `design-system/`: reusable visual and interaction contracts, never case-specific API calls.
- `features/`: product behavior.
- `routes/`: URL composition and access policy, never domain logic.
- `shared/`: genuinely generic primitives only.

### Anti-patterns

- A single `components/` directory containing every component.
- Feature API calls from presentational components.
- `utils.ts` as an unbounded miscellaneous file.
- Global context for server data.
- Importing a page from another feature.
- Copying types from backend responses into unrelated feature files.

### Migration example

The current `src/pages/IntakePage.tsx` becomes a reporting route composed from `features/reporting/`. Current `src/api/queries.ts` is split by feature into typed query modules. Current `components/issue/` is divided between `design-system/composites`, `features/cases`, and `features/discovery` according to ownership.

---

## 3. Routing Architecture

### Purpose

Make access boundaries, lazy loading, deep linking, error recovery, and nested layouts explicit.

### Route families

| Family | Examples | Access |
|---|---|---|
| Public | `/`, `/cases/:caseId`, `/learn`, `/help` | Anonymous |
| Citizen | `/report`, `/my-reports`, `/settings` | Anonymous with optional session; some actions require identity |
| Institutional | `/gov`, `/gov/cases/:caseId`, `/gov/analytics` | Authenticated role and jurisdiction |
| Internal | `/evaluate`, `/moderation` | Feature flag plus role permission |

### Routing rules

- Root resolves to the public Home/Discover experience.
- `/report` is a resumable flow, not a page with hidden multi-step state.
- `/cases/:caseId` is the canonical shareable case URL.
- `/my-reports` may show device-saved tracking links for anonymous users.
- Institutional routes render under a separate authenticated layout and never inherit citizen navigation accidentally.
- Internal evaluation routes require both an enabled feature flag and an internal permission.
- Unknown routes render a branded, accessible not-found state with a route-appropriate recovery action.
- Route-level code is lazy-loaded by family; shared shell and critical primitives load first.
- Route transitions preserve scroll position where the ADR requires it; case timelines restore the user’s last meaningful position.

### Route boundary responsibilities

Each route boundary handles:

- access check;
- feature flag check;
- data preloading where useful;
- error boundary placement;
- document title and landmark labels;
- analytics consent policy;
- offline capability declaration.

### Protected-route policy

The client may redirect for user experience, but it must not treat client-side permission checks as security. All institutional permissions are rechecked by the API. Unauthorized responses become a safe access state, not an infinite redirect loop.

### Dependencies

React Router, route-level lazy loading, `core/auth`, `core/telemetry`, and `core/connectivity`.

### Anti-patterns

- Route guards embedded in button handlers.
- Fetching all application data at the root route.
- Rendering internal evaluation controls conditionally inside citizen pages.
- Encoding workflow state only in component memory.
- Treating a 401 as a generic network failure.

---

## 4. Component Architecture

### Purpose

Make visual consistency and accessibility reusable without over-generalizing domain behavior.

### Atomic hierarchy

1. **Primitives:** Button, input, dialog, sheet, focus ring, label, live region, icon button.
2. **Design composites:** StatusChip, EvidenceCard, TimelineEvent, OfficialEvent, SLAIndicator, SearchField, OfflineBanner.
3. **Feature composites:** CommunityMatch, DraftApproval, RepairVerification, CaseHeader, GovernmentQueueRow.
4. **Layouts:** Citizen shell, institutional shell, timeline layout, queue layout.
5. **Screens:** Route-level composition with no reusable visual primitive definitions.

### Component contract

Every reusable component documents:

- purpose and intended audience;
- public props and event semantics;
- keyboard behavior;
- focus behavior;
- loading/empty/error/offline states;
- responsive behavior;
- semantic color and icon requirements;
- test selectors only where accessible selectors are insufficient;
- Storybook states.

### Ownership rules

- A primitive may not import feature APIs.
- A design composite may accept domain-shaped view models, but it must not fetch data.
- A feature composite may use feature hooks and schemas.
- A page coordinates features but should not contain reusable visual logic.
- A component may be promoted to shared only after two real use cases and an accessibility review.

### Dependencies

shadcn/ui and Radix primitives for interaction semantics; the canonical token layer; Lucide or the approved outline icon set; Motion only for meaningful state communication.

### Anti-patterns

- “God components” that fetch, transform, validate, and render.
- Boolean prop explosions such as `isSmall`, `isCompact`, `isGovernment`, and `isMobile` replacing variants.
- Styling that bypasses tokens.
- A generic `Card` that accepts arbitrary children and becomes an unowned layout system.
- Visual-only disabled states without semantic disabled behavior.

---

## 5. State Architecture

### Purpose

Place each state in the narrowest correct owner and make persistence, synchronization, and recovery predictable.

### State classification

| State | Owner | Examples |
|---|---|---|
| Local UI | Component or feature hook | Dialog open, selected photo, view mode |
| Server | TanStack Query | Cases, timeline, drafts, officer queue |
| Form | React Hook Form | Report fields, approval, repair verification |
| URL | Router/search params | Search, filters, selected case, map/list mode |
| Persistent | Versioned storage adapter | Report draft, anonymous tracking link, preferences |
| Connectivity | Core provider | Online/offline, pending sync, last sync |
| Auth | Core auth provider | Session, role, jurisdiction, expiry |

### Server-state rules

- Query keys are structured and stable: resource, identity, filters, locale, and permission scope.
- Query functions return validated domain data, never raw Axios responses.
- Mutations invalidate or update only affected keys.
- Polling is state-aware and stops when the lifecycle reaches a stable state.
- Never mirror server data into a global store solely to make it accessible.

### Optimistic updates

Only use optimistic updates for reversible, low-risk local interactions such as read state, filter preference, or follow toggles. Never optimistically claim evidence acceptance, government acknowledgement, repair, resolution, or external dispatch.

### Persistent state

All local records have a schema version, created time, last updated time, expiry policy, and migration strategy. Sensitive media and personal data require an explicit storage decision; do not place unrestricted raw files in local storage.

### Anti-patterns

- Storing query responses in Context.
- Duplicating form values across component state and React Hook Form.
- Persisting credentials or access tokens in arbitrary browser storage.
- Using polling as a substitute for event design.
- Updating UI to “resolved” before the server confirms the state.

---

## 6. API Architecture

### Purpose

Provide one typed, observable, privacy-aware boundary between UI and backend.

### Folder location

`src/core/api/` owns the HTTP transport and error normalization. Each feature owns its endpoint definitions under `features/<name>/api/`.

### HTTP client

The client owns:

- base URL and environment validation;
- timeout and cancellation;
- credentials policy;
- request correlation ID;
- auth refresh behavior if applicable;
- response content-type checks;
- normalized error mapping;
- safe telemetry without sensitive payloads.

Feature code owns endpoint paths, request schemas, response schemas, query keys, and domain transformations.

### DTO and domain separation

API DTOs represent transport shape. Domain view models represent the UI’s needs. Transform at the feature boundary so backend naming or optional fields do not leak across the component tree.

Every response used by a critical screen is validated with Zod at runtime. A schema failure is an observable data-contract error, not silently coerced into an empty state.

### Error categories

```text
validation        → inline field recovery
authentication     → sign-in or session recovery
authorization     → safe access state
not-found         → route-specific missing case state
rate-limit        → retry-after guidance
network           → offline/queued recovery
provider          → human-readable retry state
contract          → generic safe error + telemetry reference
unknown           → error boundary or retryable fallback
```

### Retry policy

- Retry idempotent reads for transient network/5xx failures with bounded backoff.
- Do not automatically retry external dispatch, approval, repair submission, or other non-idempotent mutations without an idempotency key.
- Respect server retry hints.
- Stop retrying when offline and move work to the appropriate queue.

### Polling and streaming

Polling is permitted only for active processing or pending institutional updates, is visibility-aware, and stops on terminal states. Prefer server events or invalidation when the backend supports them. Polling must never create a constant battery/network drain on low-end devices.

### Anti-patterns

- API calls directly from JSX event expressions.
- Catching every error and returning `[]`.
- Exposing provider response text to citizens.
- Mutating query-cache objects in place.
- Assuming a successful HTTP response means a civic action reached resolution.

---

## 7. Forms Architecture

### Purpose

Make every citizen and institutional form resumable, accessible, validated, and safe under weak connectivity.

### Folder location

`features/reporting/forms/`, `features/cases/forms/`, and `features/government/forms/`. Shared field primitives live in `design-system/primitives/forms/`.

### Rules

- React Hook Form owns field state, touched state, dirty state, and submission state.
- Zod schemas define client validation and are aligned with backend contracts without replacing server validation.
- Labels are persistent; placeholders are examples, not labels.
- Errors appear beside the affected field and in a summary for screen readers.
- Validation should be incremental but not hostile: do not block typing with premature errors.
- Submit buttons expose pending state and cannot be double-submitted.
- Destructive or external actions require explicit confirmation.
- All forms support keyboard submission and predictable focus movement.

### Report flow

The report flow is a resumable state machine:

`idle → evidence-selected → evidence-reviewed → location-confirmed → trust-checking → summary-review → community-match → draft-review → approved → queued/sent`.

The backend remains authoritative for trust, draft approval, and dispatch. The client may show progress but may not invent a completed transition.

### Autosave and drafts

- Debounce non-sensitive text drafts.
- Persist a versioned draft with an expiry and explicit discard action.
- Persist a media reference through the image/offline queue, not an unbounded base64 string.
- Restore focus and step context when resuming.
- Surface stale or conflicted drafts instead of overwriting silently.

### Anti-patterns

- `useState` scattered across a multi-step form.
- Validation only on submit.
- Error text at the bottom of a long page with no field association.
- Discarding captured evidence on a transient network error.
- Treating browser permission denial as a fatal form error.

---

## 8. Map Architecture

### Purpose

Provide useful geographic context without making maps a performance, accessibility, or privacy dependency.

### Technology boundary

Use Leaflet or MapLibre behind `features/discovery/map/`. Feature code consumes a map adapter interface; it must not depend directly on provider-specific marker objects.

### Responsibilities

- viewport and selected case synchronization;
- clustering and decluttering;
- marker lifecycle and cleanup;
- tile loading/error handling;
- location permission and manual fallback;
- list/map parity;
- privacy-safe coordinate precision;
- low-bandwidth and offline fallback.

### Rules

- List mode is the default on mobile and for screen-reader users.
- Every marker has a list-equivalent case item and action.
- Marker clusters show count and a useful accessible label.
- Marker taps open a small preview sheet; full case detail is a deliberate action.
- Do not render a map until case content and list fallback are available.
- Do not expose exact coordinates when case privacy policy restricts them.
- Fit bounds only when the user requests or when entering a new result set; never fight manual panning.
- Clean up markers, listeners, and tile subscriptions on unmount.

### Performance

- Lazy-load the map library and tiles.
- Render only visible or clustered markers.
- Avoid recreating marker data on every unrelated render.
- Use simplified marker assets and responsive tile configuration.
- Disable map mode offline with a clear banner and retain cached list results.

### Accessibility

The map canvas is `aria-hidden` and never the sole interaction surface. A structured list supports search, filtering, selection, and navigation without map knowledge.

### Anti-patterns

- Provider objects stored in global React state.
- Map initialization blocking first content.
- Infowindows as the only case detail access.
- Geolocation requested without a user action.
- Exact coordinates placed in URLs, analytics, or public logs.

---

## 9. Image Architecture

### Purpose

Move evidence safely from camera or file input to validated, performant, privacy-preserving case media.

### Pipeline

`capture/select → client type/size check → preview → orientation normalization → optional resize/compression → EXIF removal → local queue/cache decision → multipart upload → server validation → responsive derivatives → lazy display`.

### Rules

- Accept JPEG, PNG, and WEBP within the backend’s documented dimension and size limits.
- Never trust client MIME or dimensions as security validation; backend validation remains authoritative.
- Strip EXIF before local persistence where possible and always before server storage.
- Keep the original evidence immutable once accepted; edits create a new derivative or draft state.
- Generate meaningful alt text and allow citizen correction.
- Use responsive thumbnails for lists and full resolution only in deliberate viewers.
- Cancel and retry uploads without losing the report draft.
- Use content-addressed or server-issued media IDs rather than arbitrary local filenames.

### Caching

Public derivatives may use cache headers according to privacy policy. Restricted evidence must not be placed in a shared public cache. Revoke object URLs when previews are discarded.

### Offline queue

The queue stores encrypted or protected metadata, upload status, retry count, and a resumable media reference. It must provide explicit user controls to retry, remove, or inspect queued work.

### Anti-patterns

- Base64 images in global state.
- Rendering a full-resolution image for every list card.
- Showing EXIF or raw server paths to citizens.
- Declaring upload success before the server returns an accepted media record.

---

## 10. Design Token Integration

### Purpose

Ensure engineering consumes the canonical design system rather than recreating visual decisions in feature code.

### Ownership

Token definitions remain canonical in `docs/03_Design_System/DESIGN_TOKENS.md`. The frontend token implementation is generated or synchronized into `src/design-system/tokens/`; engineers do not invent parallel hex values or spacing scales.

### Required token groups

- Noto Sans and Indic-script font families.
- 4px spacing scale.
- Typography roles and line heights.
- Neutral, evidence, government, community, AI-assistance, verified, warning, and danger colors.
- Border radii and elevations.
- 120/200/320ms motion durations and standard easing.
- Focus ring and high-contrast variants.

### Themes

- Default light theme is the production baseline.
- High-contrast mode strengthens contrast without changing semantic meaning.
- Dark mode, if introduced, must preserve the semantic separation between AI assistance and verified resolution and must be tested with all supported scripts.
- Token consumers use semantic names, never raw color names in feature code.

### Anti-patterns

- Hand-picked colors for a single screen.
- Text size below the canonical citizen floor.
- Shadows used to imply importance.
- Motion values embedded directly in component behavior.

---

## 11. Accessibility Architecture

### Purpose

Make WCAG 2.2 AA behavior a shared platform capability rather than a final visual audit.

### Core layer

`core/accessibility/` provides reduced-motion detection, live-region primitives, focus restoration, announcement helpers, and assistive-mode preferences. `design-system/primitives/` owns semantic markup and keyboard contracts.

### Required contracts

- Landmarks and heading hierarchy are valid on every route.
- Every image has useful alt text or an explicit decorative role.
- Every status has text and icon semantics, not color alone.
- Dialogs and sheets trap focus and restore it on close.
- Menus, comboboxes, tabs where genuinely required, and lists use tested keyboard patterns.
- Dynamic processing and upload changes use polite live regions; urgent failures use assertive alerts.
- Map interactions have list equivalents.
- Text scales to 200% without clipping or horizontal scroll.
- Reduced motion disables non-essential movement.
- Touch targets are at least 48×48px with 8px separation; camera shutter is 72px.

### Testing ownership

Primitive accessibility tests run with the component. Feature accessibility tests verify full journeys, including focus order, error summary, live updates, and map/list parity.

### Anti-patterns

- `aria-label` used to hide an otherwise meaningless control.
- Clickable `div` elements.
- Focus outlines removed globally.
- Announcing every background refresh.
- Treating a screen-reader-only list as an afterthought with different functionality.

---

## 12. Performance Strategy

### Purpose

Deliver a trustworthy experience on low-end Android devices and slow networks without weakening evidence quality.

### Code splitting

- Load the citizen shell and critical primitives first.
- Lazy-load reporting camera capabilities, maps, government workspace, evaluation, rich document viewers, and analytics.
- Split by route family and by heavy capability, not by every tiny component.
- Prefetch the next likely route after a confirmed user intent, not on initial load.

### Rendering

- Keep server query subscriptions near the components that use them.
- Memoize expensive derived cluster/group calculations.
- Virtualize long case lists and government queues.
- Avoid animation-driven layout recalculation.
- Use stable keys based on domain IDs, never array indexes for mutable timelines.
- Profile before adding memoization; keep the code React Compiler-ready by avoiding mutation and unstable side effects.

### Media and network

- Render responsive thumbnails.
- Prioritize text and case status before map tiles and non-critical charts.
- Use cancellation for abandoned searches and uploads.
- Respect `Save-Data` and reduced-motion preferences where available.

### Budgets

Set and monitor budgets for first content, route JS, initial image bytes, map bytes, long tasks, and interaction latency on a representative low-end Android/3G profile. A build cannot be considered production-ready without a recorded baseline and regression threshold.

### Anti-patterns

- Importing map libraries in the root bundle.
- Polling every route every few seconds.
- Rendering all images at full size.
- Large global contexts that rerender the shell.
- Performance optimizations that hide loading state or reduce evidence readability.

---

## 13. Offline Strategy

### Purpose

Allow citizens to capture, review, and safely queue work when connectivity is unreliable.

### Capabilities by state

| State | Behavior |
|---|---|
| Online | Normal API reads and writes |
| Intermittent | Preserve drafts, retry reads, show connectivity status |
| Offline | View cached cases, create local report draft, queue media and metadata |
| Syncing | Show per-item progress and allow safe cancellation |
| Conflict | Present server/local versions and require explicit resolution |
| Failed sync | Preserve work, show reason, offer retry/remove |

### Queue design

Each queue item has an ID, operation type, schema version, dependency list, idempotency key, created time, retry count, last error category, and user-visible status. Processing is serialized for dependent report steps and bounded for battery/network safety.

### Conflict policy

- Never silently overwrite a server-confirmed government event.
- Local draft text may be merged or presented side-by-side.
- Case status always defers to the server.
- Media upload retries are idempotent.
- User sees unresolved conflicts in My Reports.

### Storage policy

Use a versioned IndexedDB-backed adapter or equivalent abstraction; do not scatter browser storage calls across features. Provide expiry and clear-data behavior. Sensitive content must have a documented local protection policy.

### Anti-patterns

- “Offline” badge with no actual queue.
- Retrying forever in the background.
- Losing a photo because the network failed after capture.
- Treating cached status as current without a timestamp.

---

## 14. Testing Strategy

### Purpose

Prove contracts across unit behavior, browser interaction, accessibility, visual fidelity, data states, and offline recovery.

### Test layers

| Layer | Scope | Examples |
|---|---|---|
| Unit | Pure functions and adapters | Status mapping, queue transitions, image constraints, URL state |
| Component | Primitives and composites | Focus trap, error association, status semantics, evidence card |
| Feature integration | Query + form + UI | Report flow, draft approval, repair verification |
| API contract | DTO schemas and error mapping | Response validation, auth/permission mapping |
| Accessibility | Automated + manual | Keyboard, live regions, 200% zoom, screen readers |
| Visual regression | Token and layout stability | Screen states at compact/standard/wide and themes |
| End-to-end | Critical missions | Submit, track, approve, officer acknowledge, verify repair |
| Offline E2E | Connectivity changes | Capture offline, queue, reconnect, conflict, recovery |
| Performance | Realistic devices/network | 3G, low-end Android, large media, map disabled |

### Required critical journeys

1. Citizen captures and submits evidence.
2. Citizen recovers from denied location permission.
3. Citizen resumes a saved draft after refresh.
4. Citizen sees a community match and opens the canonical case.
5. Citizen approves and sends a draft exactly once.
6. Officer acknowledgement appears as an official timeline event.
7. Officer reports repair with evidence.
8. Citizen verifies or rejects the repair.
9. User completes the list experience without a map.
10. User completes the core report journey offline and syncs later.

### Test data

Fixtures must include active, uncertain, rejected, acknowledged, repair-reported, verified, resolved, partial, restricted, offline, and malformed cases. Seeded evaluation data is never used as the only test data for citizen flows.

### Quality gates

- Typecheck and lint clean.
- API schemas validated.
- No critical accessibility violations.
- Critical E2E flows pass on compact mobile and desktop.
- Visual regression reviewed for token and copy changes.
- Offline queue recovery tested with forced process termination.
- Bundle and performance budgets respected.

---

## 15. Error Architecture

### Purpose

Contain failures, preserve user work, provide an honest recovery path, and create privacy-safe diagnostics.

### Boundary levels

1. **App boundary:** Last-resort shell failure; offers reload and support reference.
2. **Layout boundary:** Citizen/institutional shell failure; preserves other route families where safe.
3. **Route boundary:** Page-specific failure with retry/back navigation.
4. **Feature boundary:** Case/report/map/draft failure with feature-specific fallback.
5. **Operation state:** Inline API, form, upload, and sync errors.

### Fallback rules

- Errors state what happened, what was preserved, and what the user can do next.
- Retry is bounded and visible.
- Cached content is labeled with its last update time.
- A missing map falls back to list mode.
- A failed image derivative falls back to accessible text and original-safe thumbnail where permitted.
- A failed external dispatch never appears as sent.
- Error telemetry excludes photos, notes, coordinates, contact details, tokens, and full documents.

### Error copy

Use the calm-clerk voice. Raw status codes and provider names belong behind an internal reference, never in citizen copy.

### Anti-patterns

- A global error boundary that reloads and loses drafts.
- Empty state for a failed query.
- Toast-only critical errors.
- Logging serialized API payloads.

---

## 16. Security Architecture

### Purpose

Protect credentials, evidence, personal data, and external actions at the client boundary without pretending the browser is a trusted authority.

### Rules

- Never ship backend secrets, Gemini keys, SendGrid keys, database URLs, or privileged tokens in the frontend bundle.
- Environment variables are limited to public configuration such as API origin, public map configuration, build version, and feature flag defaults.
- Prefer secure, HttpOnly, SameSite session cookies for authenticated sessions; if token-based auth is required, document the threat model and storage policy.
- Sanitize and encode user-generated text before rendering; rich draft content uses a constrained, reviewed renderer.
- Never use unsanitized HTML injection for AI drafts, provider responses, or officer messages.
- Enforce CSP compatibility and avoid dynamic script injection except through a reviewed map loader.
- Do not place exact coordinates, personal contact details, or private media in analytics events, URLs, or console logs.
- Add CSRF protection to credentialed mutations where the backend requires it.
- External approvals and escalations use server-enforced state gates and idempotency keys.
- Clear sensitive local state on logout or explicit data deletion.

### Dependencies

Backend security controls in `docs/02_Architecture/SECURITY.md`, auth/session service, CSP headers, API error mapper, and storage adapter.

### Anti-patterns

- Assuming a hidden route is protected.
- Trusting client-side role checks.
- Rendering AI text as HTML.
- Sending raw coordinates to analytics.
- Storing bearer tokens in arbitrary local storage.

---

## 17. Developer Guidelines

### Naming

- Components: PascalCase nouns.
- Hooks: `use` + behavior/resource.
- Query keys: stable resource-first arrays.
- Schemas: `...Schema`; DTOs: `...Dto`; view models: `...ViewModel`.
- Events: past-tense domain events such as `caseAcknowledged`.
- Avoid internal AI agent names in citizen-facing message identifiers.

### Imports

Use path aliases for `app`, `core`, `design-system`, `features`, `layouts`, and `shared`. Feature private files are not importable from outside the feature boundary. Avoid barrel files that conceal circular dependencies; use deliberate public entry points.

### Linting and formatting

Run the repository’s formatter and linter in CI. Rules must catch unused imports, unsafe type escapes, hooks violations, accessibility issues, and accidental debug logging. Formatting is automatic; code review focuses on behavior and boundaries.

### Storybook

Storybook covers primitives, design composites, and critical feature composites. Every story includes default, loading, error, empty, offline, keyboard, long-copy, and high-contrast variants where relevant. Storybook is not a substitute for route-level E2E.

### Documentation

Each feature README records purpose, route ownership, API dependencies, state machine, privacy classification, accessibility behavior, and test commands. Changes to product semantics update the canonical product/UX documents rather than hiding decisions in code comments.

### Code ownership

- Design system team: primitives, tokens, interaction contracts.
- Citizen experience team: discovery, reporting, my reports, cases.
- Institutional team: government, NGO, moderation.
- Platform team: API, auth, storage, connectivity, telemetry, performance.
- Accessibility owner: release gates and assistive technology matrix.

---

## 18. Anti-pattern Catalogue

| Anti-pattern | Why it fails | Required alternative |
|---|---|---|
| Page-first folder structure | Couples unrelated domains and blocks parallel work | Feature-first modules |
| Global server-data context | Causes broad rerenders and stale copies | TanStack Query |
| Map-only case access | Excludes assistive and low-bandwidth users | Map + equivalent list |
| Optimistic dispatch/resolution | Creates false public accountability | Server-confirmed lifecycle |
| Raw AI/provider copy | Breaks trust and readability | Plain-language message mapper |
| Unbounded polling | Drains network and battery | Visibility/state-aware refresh |
| Local-storage scatter | Impossible migrations and privacy review | Versioned storage adapter |
| Generic error-as-empty | Hides failure and loses recovery | Explicit error state |
| Component prop explosion | Creates untestable variants | Semantic variants and composition |
| Full-resolution image lists | Slow low-end devices | Responsive derivatives |
| Feature-to-feature private imports | Hidden coupling and cycles | Public feature APIs or route composition |
| Client-only authorization | Not a security boundary | Backend permission enforcement |
| CSS/token overrides per screen | Visual drift | Canonical semantic tokens |
| Unreviewed dependency additions | Bundle/security risk | Architecture review and budget check |

---

## 19. Migration Strategy

Migration is incremental and must preserve the current production journey while moving ownership to the target architecture.

### Phase A — Establish platform boundaries

- Create `app`, `core`, `design-system`, `layouts`, `features`, and `routes` shells.
- Preserve existing routes behind compatibility route modules.
- Introduce typed environment configuration, API error normalization, and query-key conventions.
- Add global error boundaries and connectivity provider.

### Phase B — Extract design primitives

- Establish shadcn/ui/Radix-derived primitives.
- Synchronize canonical tokens.
- Move focus, dialog, button, status, form, live-region, and feedback behavior into primitives.
- Add Storybook states and accessibility tests.

### Phase C — Migrate reporting

- Move `IntakePage`, `PhotoUploader`, `PhotoPreview`, `LocationPicker`, and report mutations into `features/reporting`.
- Replace local multi-step state with React Hook Form plus a versioned report draft.
- Add image pipeline and offline queue boundaries.
- Preserve server approval and validation semantics.

### Phase D — Migrate discovery and cases

- Move `TrackerPage`, `IssueMap`, `IssueCard`, and filters into `features/discovery`.
- Move issue detail, timeline, evidence, drafts, and escalation into `features/cases`.
- Introduce map adapter and list/map parity.
- Replace technical citizen copy through a message catalog.

### Phase E — Institutional and internal surfaces

- Add authenticated layouts and permission boundaries.
- Create government queue/review/resolution modules.
- Isolate evaluation and moderation routes behind feature flags and roles.

### Phase F — Remove compatibility debt

- Delete legacy page-level API imports.
- Remove old broad component directories after ownership migration.
- Remove duplicate tokens, obsolete route names, and demo controls from citizen bundles.
- Update tests and canonical docs.

### Migration rules

- One feature moves at a time.
- No simultaneous redesign disguised as refactoring.
- Each migrated route must preserve user-visible semantics unless an approved canonical UX document changes.
- Use strangler boundaries and adapters rather than a flag-day rewrite.
- Record each architectural change in `docs/06_Governance/DECISIONS.md` when it affects an owned concept.

---

## 20. Implementation Roadmap

### Milestone 0 — Architecture baseline

**Exit criteria:** target folders, dependency policy, environment validation, error taxonomy, query conventions, and CI quality gates documented and reviewed.

### Milestone 1 — Design-system foundation

**Exit criteria:** semantic tokens, typography, accessible primitives, focus behavior, dialogs/sheets, status chips, feedback states, and Storybook baseline available.

### Milestone 2 — Citizen shell and discovery

**Exit criteria:** Home, Report FAB, My Reports, responsive shell, list-first discovery, map adapter, search/filter URL state, and offline banner work without feature-specific duplication.

### Milestone 3 — Evidence/reporting flow

**Exit criteria:** camera/file intake, review, location fallback, EXIF-safe media boundary, React Hook Form/Zod validation, local draft resume, upload retry, and accessible trust gate are complete.

### Milestone 4 — Case timeline and human approval

**Exit criteria:** canonical case route, chronological events, progressive disclosure, draft editing, explicit approval, idempotent dispatch, and honest error states are complete.

### Milestone 5 — Offline and notifications

**Exit criteria:** queue, sync, conflict handling, notification grouping, read state, and low-connectivity E2E coverage are complete.

### Milestone 6 — Institutional workflows

**Exit criteria:** authenticated government queue, case acknowledgement, response, repair evidence, moderation fallback, and permission-tested views are complete.

### Milestone 7 — Production hardening

**Exit criteria:** performance budgets, visual regression, screen-reader matrix, security review, CSP compatibility, bundle analysis, PostgreSQL-backed contract tests, and deployment verification pass.

---

## 21. Architecture Review Checklist

Before merging a frontend feature, reviewers answer:

- Does the feature belong to the correct module?
- Is server state separated from local and form state?
- Are request and response schemas validated?
- Are loading, empty, error, offline, permission-denied, and partial states specified?
- Is the primary action singular and honest?
- Can a keyboard and screen-reader user complete the mission?
- Does every map action have a list equivalent?
- Does the feature preserve drafts across network failure?
- Are semantic tokens used instead of local visual values?
- Are personal data, coordinates, media, and logs handled according to privacy policy?
- Are mutations idempotent where retries are possible?
- Is the feature covered by unit, component, integration, accessibility, and E2E tests at the appropriate level?
- Does this change require an update to a canonical document or ADR?

The frontend architecture is complete only when it can support evidence, trust, community, accountability, and impact consistently across citizen, institutional, offline, accessible, and low-bandwidth experiences.
