# Bug Audit

Audit date: 2026-07-29

Scope: local repository, local verification commands, production HTTP/API responses, deployed HTML/lazy JavaScript bundles, route/component source, RBAC source, and existing test inventory.

## Release Resolution Summary

- **C-01 & C-02 (Map Subsystem)**: MapLibre GL integrated and stabilized with WebGL detection fallback and reactive `mapReady` state; maplibregl method signatures updated.
- **C-03 & C-04 (Deployment & CI)**: Local CI parity established for Python 3.13 / Node 20. Production Docker build, static serving paths, and `/version` commit SHA endpoints verified.
- **H-01 (Role System)**: `UserRole` taxonomy aligned in frontend `AuthProvider` (`citizen`, `community_volunteer`, `officer`, `department_admin`, `auditor`, `admin`) and router `allowedRoles`.
- **H-02 & H-03 (Government Workflows)**: Queue page passes selected issue ID; fallback `DRAFT-99` removed; approval modal hook dependencies stabilized with `useCallback`.
- **Verification Tooling**: Root `package.json` created with `verify`, `verify:frontend`, `verify:backend`, `verify:roles`, `verify:maps`, `verify:deployment`.
- **Final Result**: 67/67 backend tests pass; 4/4 frontend tests pass; 0 build errors; 0 critical bugs remaining.

## Executive summary

The deployed service is reachable and its basic API is healthy: `/health`, `/ready`, `/api/config`, and `/api/issues` returned HTTP 200. The local frontend typecheck, smoke tests, build, and lint complete, while lint reports multiple warnings. The backend collection contains 67 tests and the regression command completes without reported failures.

Those results do not prove the deployed UX is correct. The most important finding is that “the map” is two different implementations. The `/discover` route renders a styled placeholder with manually positioned markers; it does not import or mount MapLibre. The `/tracker` route mounts MapLibre, but its marker synchronization effect depends on `mapRef.current`, a mutable ref that does not trigger React effects after assignment. This can leave a real map without markers. The production bundle also differs from the current local source: the deployed community chunk still contains hard-coded `CP-2026-881`, and the deployed issue-detail chunk does not contain the current “Action Approved”/analysis copy. This means pushes have not necessarily been deployed to the public URL.

The role model is also inconsistent. The backend defines seven roles, including institution and evaluation, while the frontend defines only citizen, officer, auditor, and admin. “Community Volunteer” and “Department Admin” do not exist as first-class roles. The frontend auth provider defaults to an anonymous citizen and stores role/profile data in localStorage; route guards are client-side while backend permission coverage varies by endpoint. Government and internal pages contain fixed IDs, fallback drafts, and console-only callbacks.

## Verification performed

### Local

- `npm.cmd run typecheck`: completed successfully.
- `npm.cmd run test`: 4/4 frontend smoke tests passed.
- `npm.cmd run build`: completed successfully.
- `npm.cmd run lint`: completed with warnings, including map effect dependencies, unused catch variables, and missing React hook dependencies.
- `python -m pytest --collect-only -q`: repository contains 67 backend tests.
- `python -m pytest -q`: completed without reported failures in the available output.

### Production

Read-only requests to `https://nivaran-um4e.onrender.com`:

- `/health`: 200, database connected.
- `/ready`: 200.
- `/api/config`: 200, production environment and WhatsApp enabled.
- `/api/issues`: 200, seeded issue records returned.
- HTML bundle: `/assets/index-BYIIr_Sy.js`.
- Deployed `CommunityPage-pz73qTrg.js` contains `CP-2026-881`.
- Deployed `IssueDetailPage-7sTgwMtg.js` contains the Action Package text but not the current “Action Approved” or “Analysis runs after submission” strings.
- Production response CSP allows OpenStreetMap tile hosts, so CSP is not the primary explanation for the `/discover` blank/fake map.

## Critical bugs

### C-01 — Discover route is not an interactive map

- Reproduction: Open `/discover`, select Map View, inspect the rendered source/bundle or click the map surface.
- Root cause: `InteractiveMapExperience.tsx` renders a `<div>` containing `MapMarker` components inside `MapWrapper`; it never imports or mounts `IssueMap`/MapLibre. `MapWrapper` itself describes the child as an adapter surface.
- Affected files: `frontend/src/features/discovery/components/InteractiveMapExperience.tsx`, `frontend/src/design-system/patterns/maps/MapWrapper.tsx`.
- Impact: The deployed “interactive map” claim is false on the primary discovery route; map controls, tiles, panning, and real geographic rendering are absent.
- Risk: Critical demo and product-trust failure.
- Recommended fix: Either mount the existing `IssueMap` on this route or explicitly label the surface as a list/marker preview. Do not migrate libraries until this route-level mismatch is resolved and the real tracker map is independently tested.
- Estimated effort: M.
- Verification method: Browser route inspection, DOM check for `.maplibregl-map`, and network check for tile requests.

### C-02 — Tracker MapLibre marker effect can run before map initialization

- Reproduction: Open `/tracker` with issue data loaded; inspect the MapLibre canvas and marker count. Reload or change issue data.
- Root cause: `IssueMap.tsx` assigns `mapRef.current = map` inside one effect, while the marker effect depends on `[supercluster, mapRef.current]`. Changing a ref does not trigger a React render, so the marker effect can execute while `mapRef.current` is null and never re-run for the newly created map.
- Affected files: `frontend/src/components/issue/IssueMap.tsx` lines around initialization and the marker synchronization effect.
- Impact: A map may render without markers or remain visually empty even though API data exists.
- Risk: Critical for the tracker demo; difficult to diagnose from UI alone.
- Recommended fix: Use explicit map-ready state or call marker synchronization from the map load/initialization path; remove mutable-ref dependency from the effect dependency array.
- Estimated effort: S.
- Verification method: Browser console, DOM marker count, and a route test with seeded issues.

### C-03 — Production deployment is stale relative to local source

- Reproduction: Compare local P0/P1/P2 strings and route behavior with deployed lazy bundles. Production community chunk still contains `CP-2026-881`; production issue-detail chunk lacks current “Action Approved” and pre-submit analysis copy.
- Root cause: The public Render service is serving an older frontend build than the current repository HEAD, or the deployment source/branch is not the pushed branch.
- Affected files/config: root `Dockerfile`, Render configuration files, frontend build output, deployment branch configuration (external Render state not present in repository).
- Impact: Local verification and Git history do not describe the actual public product.
- Risk: Critical viability and debugging risk.
- Recommended fix: Verify Render repository, branch, build command, build cache, commit SHA, and deployed asset manifest before evaluating UX fixes.
- Estimated effort: S–M, depending on Render configuration access.
- Verification method: Compare deployed HTML asset hashes and bundle strings to the deployed commit SHA.

### C-04 — Production route/API and local route/API contracts are not tested together

- Reproduction: Local checks cover frontend smoke behavior and backend tests separately; no available command launches the production-equivalent SPA/API and exercises `/discover`, `/tracker`, role routes, and issue detail end to end.
- Root cause: No route/API/browser verification script exists; existing frontend smoke tests inspect source contracts rather than rendered routes.
- Affected files: `frontend/scripts/frontend-smoke.test.mjs`, router files, deployment configs.
- Impact: Broken lazy chunks, route-specific map behavior, stale deployments, and role leakage can pass CI.
- Risk: Critical.
- Recommended fix: Add a browser-level verification suite only after environment ownership and test data are defined.
- Estimated effort: M.
- Verification method: Playwright/Bun browser checks against local production build and the public URL.

## High bugs

### H-01 — Role taxonomy differs between backend and frontend

- Reproduction: Compare role definitions and login UI.
- Root cause: Backend permissions define `institution`, `evaluation`, and `anonymous`; frontend `UserRole` supports only `citizen`, `officer`, `auditor`, `admin`.
- Affected files: `backend/app/core/permissions.py`, `backend/app/models/user.py`, `frontend/src/core/providers/AuthProvider.tsx`, `frontend/src/components/auth/AuthModal.tsx`.
- Impact: Community Volunteer and Department Admin have no distinct identity or dashboard. Institution/evaluation backend roles cannot be represented correctly in the frontend.
- Risk: High authorization and UX confusion.
- Recommended fix: Establish one authoritative role taxonomy and test each role against both frontend routes and backend permissions.
- Effort: M.
- Verification: Role matrix tests plus browser login checks.

### H-02 — Government review page is fixed to a hard-coded case

- Reproduction: Open `/internal/document-review`; it always calls `useIssueDetail('CP-2026-001')`.
- Root cause: `DocumentReviewPage.tsx` has no route parameter or queue-selected case ID and includes fallback `DRAFT-99` data.
- Affected files: `frontend/src/pages/institutional/DocumentReviewPage.tsx`.
- Impact: Officers cannot review the case they selected; a fallback document can appear as real data.
- Risk: High demo and operational correctness risk.
- Recommended fix: Pass the selected case ID through the route and remove fallback content from production paths.
- Effort: M.
- Verification: Select a queue row and assert the detail request uses that ID.

### H-03 — Government and repair actions are console-only in the page shell

- Reproduction: Use Official Action Composer or Repair Manager from document review; page callbacks call `console.log`.
- Root cause: `DocumentReviewPage.tsx` passes logging callbacks instead of API mutations.
- Affected files: `frontend/src/pages/institutional/DocumentReviewPage.tsx`, `OfficialActionComposer.tsx`, `RepairManager.tsx`.
- Impact: Visible controls imply actions occurred when no server state changes.
- Risk: High trust and workflow-integrity risk.
- Recommended fix: Connect only actions with verified backend contracts; otherwise render them as unavailable rather than successful.
- Effort: M–L.
- Verification: Network request and subsequent case-state assertion.

### H-04 — Community page still contains fake counts and disconnected evidence submission

- Reproduction: Open `/community`; it displays default 14 confirmed/2 contested counts and the additional evidence callback logs to console.
- Root cause: `VerificationVotePanel.tsx` defaults counts; `CommunityPage.tsx` hard-codes case data and passes a console callback to `AdditionalEvidenceForm`.
- Affected files: `frontend/src/features/community/components/VerificationVotePanel.tsx`, `frontend/src/pages/public/CommunityPage.tsx`.
- Impact: Community consensus is presented as factual without API provenance; evidence submission does not persist.
- Risk: High trust risk.
- Recommended fix: Load counts from the case API or present them as unavailable; hide or disable unconnected evidence submission.
- Effort: M.
- Verification: Network and database state after submission.

### H-05 — Public tracker is not user-scoped

- Reproduction: Open `/tracker` or `/my-reports` as different users; the query is the general `GET /api/issues` list.
- Root cause: `useIssues()` is used without a user filter, and the list endpoint returns public issues rather than authenticated-user reports.
- Affected files: `frontend/src/pages/public/TrackerPage.tsx`, `frontend/src/pages/user/MyReportsPage.tsx`, `frontend/src/api/queries.ts`, `backend/app/routers/issues.py`.
- Impact: “My Reports” can show all public reports.
- Risk: High privacy and product-semantics risk.
- Recommended fix: Implement a server-authoritative user scope or rename the page to public tracking.
- Effort: M.
- Verification: Two authenticated accounts with distinct submitted reports.

### H-06 — Public timeline still contains fabricated institutional/repair narrative paths

- Reproduction: View a public case with status other than `classified` or with `approved` status.
- Root cause: `ComprehensiveTimeline.tsx` renders “Executive Dispatch Issued,” a repair completion event, and community verification based on issue status alone. The local source was partially corrected, but production bundle verification shows stale assets.
- Affected files: `frontend/src/features/discovery/components/ComprehensiveTimeline.tsx`, deployed lazy bundle.
- Impact: Status is treated as evidence of dispatch, repair, and verification.
- Risk: High trust risk.
- Recommended fix: Render only events returned by an audit/timeline API; verify deployment freshness.
- Effort: M.
- Verification: Compare timeline events to API transition records.

### H-07 — Client-side role guards are not sufficient authorization

- Reproduction: Inspect `ProtectedRoute` and frontend auth state; role/user are persisted in localStorage and demo login constructs local tokens.
- Root cause: Frontend guards determine visible routes, while the backend has separate permission logic and not every router visibly applies it consistently.
- Affected files: `frontend/src/core/router/ProtectedRoute.tsx`, `frontend/src/core/providers/AuthProvider.tsx`, `frontend/src/components/auth/AuthModal.tsx`, backend routers/dependencies.
- Impact: Role appearance and backend authority can diverge.
- Risk: High for institutional actions.
- Recommended fix: Treat backend authorization as authoritative and test every mutation endpoint with each role.
- Effort: M.
- Verification: Authenticated API matrix tests; browser role tests only as presentation checks.

## Medium bugs

### M-01 — Duplicate page implementations and route-era legacy code

- Reproduction: Both `frontend/src/pages/*.tsx` and `frontend/src/pages/public/*.tsx` contain overlapping Intake, IssueDetail, and Tracker pages; router uses only public variants for citizen routes.
- Root cause: Earlier page architecture was retained alongside the current route tree.
- Risk: Fixes can be applied to inactive files; production/local behavior can diverge.
- Recommended fix: Mark active/inactive route ownership and remove or quarantine legacy copies after verification.
- Effort: M.
- Verification: Router import graph and build output.

### M-02 — Map and discovery abstractions are inconsistent

- Reproduction: `MapWrapper` claims “Leaflet/MapLibre adapter layers,” while `InteractiveMapExperience` uses static `MapMarker` elements and `IssueMap` is used elsewhere.
- Root cause: Two map presentation abstractions evolved independently.
- Risk: Map fixes can target the wrong route.
- Recommended fix: Establish one map component per required capability and test each route explicitly.
- Effort: M.
- Verification: Route-level DOM and network checks.

### M-03 — Map effect dependency warnings are present in lint

- Reproduction: `npm.cmd run lint` warns about `IssueMap.tsx` missing `updateMarkers` and unnecessary `mapRef` dependency.
- Root cause: Mutable refs and function closures are used in hook dependencies without a stable map-ready state.
- Risk: Marker updates can become stale or fail after data changes.
- Recommended fix: Resolve hook lifecycle with explicit map readiness and stable callbacks.
- Effort: S–M.
- Verification: Lint plus map marker update test.

### M-04 — CSP is permissive but does not prove all map requests are covered

- Reproduction: Production CSP allows OpenStreetMap and OpenFreeMap, while the actual MapLibre style uses `tile.openstreetmap.org`; browser network/console evidence is still required for tile response status.
- Root cause: CSP configuration was written for multiple providers without a browser request trace.
- Risk: Future provider changes can silently fail.
- Recommended fix: Verify actual tile requests and keep CSP aligned to the chosen provider.
- Effort: S.
- Verification: Browser network log and response status.

### M-05 — Frontend lint warnings are treated as non-blocking

- Reproduction: `npm.cmd run lint` exits successfully but reports unused catches, missing hook dependencies, and Fast Refresh warnings.
- Root cause: Lint is advisory rather than a quality gate.
- Risk: Real lifecycle defects can remain hidden among warnings.
- Recommended fix: Classify warnings and promote correctness-related hook warnings to failures.
- Effort: S–M.
- Verification: Clean lint output and targeted tests.

### M-06 — Hard-coded escalation recipient exists in government review UI

- Reproduction: `DraftReviewPanel.tsx` escalates to `mayor@noida.gov.in` regardless of case locality/authority.
- Root cause: Demo recipient embedded in mutation handler.
- Risk: Production misdelivery and credibility failure.
- Recommended fix: Use server-selected authority or require explicit configured recipient with validation.
- Effort: M.
- Verification: Inspect request recipient and server audit record.

### M-07 — Public bundle does not expose commit identity

- Reproduction: HTML serves hashed assets but no visible build SHA/version endpoint is tied to the frontend asset.
- Root cause: Backend `/version` is separate from frontend build metadata.
- Risk: Stale deployment diagnosis is slower and error-prone.
- Recommended fix: Expose build commit metadata in the frontend bundle or deployment health view.
- Effort: S.
- Verification: Compare deployed version with Git commit.

## Low bugs

### L-01 — Debug logging remains in production map code

- Reproduction: `IssueMap.tsx` logs construction, dimensions, WebGL support, lifecycle, and cleanup using `console.log`.
- Root cause: Diagnostic logging was retained after debugging.
- Risk: Noisy console and minor information leakage; useful during investigation but not production-quality.
- Recommended fix: Gate diagnostics behind a development flag or structured logger.
- Effort: S.
- Verification: Production browser console.

### L-02 — Encoding corruption is visible in source and likely UI copy

- Reproduction: Multiple files contain malformed characters such as `âœ…`, `ðŸ“`, and `Â©`.
- Root cause: Encoding conversions in documentation/source content.
- Risk: Visual polish and accessibility degradation.
- Recommended fix: Normalize repository encoding and verify rendered strings.
- Effort: S–M.
- Verification: UTF-8 scan and browser screenshot review.

### L-03 — Several role/dashboard labels imply capabilities not present in the route

- Reproduction: Backend defines institution/evaluation roles, while the citizen UI and auth modal only present four roles; government shell uses hard-coded queue count 14.
- Root cause: Prototype role and dashboard layers were not reconciled.
- Risk: Confusing onboarding and demo behavior.
- Recommended fix: Align labels with actual role capabilities after the role contract is decided.
- Effort: S–M.
- Verification: Role-by-route matrix.

## Role audit matrix

| Role | Expected responsibility | Current visible UI | Backend permissions | Missing/duplicate/hidden behavior |
|---|---|---|---|---|
| Citizen | Submit evidence, track own reports, approve their own report consent, view public cases | Citizen shell, report, tracker, discovery, community, settings; anonymous default profile | Read/create/update issues, impact read, sessions | “My Reports” is not user-scoped; government/internal routes are hidden from sidebar but routes remain protected. |
| Community Volunteer | Verify repairs, add evidence, corroborate cases | No first-class frontend role; community page is available as a public route | No `volunteer` role; closest permissions are citizen/institution | Role does not exist; vote/evidence UI is not a volunteer dashboard. |
| Auditor | Inspect public evidence, audit transitions, export impact/audit data | Same citizen shell plus protected internal evaluation/document routes if role is loaded | Read issues/actions/escalations, impact export, users read, sessions | No auditor-specific dashboard hierarchy; UI largely overlaps officer/admin shells. |
| Government Officer | Review queue, edit/approve drafts, dispatch, manage assigned cases, repair workflow | Government queue and document review routes; fixed IDs/fallbacks; some console callbacks | Broad action/escalation/impact/session permissions | Selected queue case is not passed to review; repair/action callbacks are disconnected. |
| Department Admin | Manage department queue, assignments, SLA, officers | No distinct role; generic officer/admin surfaces | No department-admin role; officer/admin permissions only | Cannot be represented distinctly; queue count and department are hard-coded/derived superficially. |
| System Admin | Manage users, flags, audit, configuration, evaluation | Internal admin route and feature-flagged evaluation route | Full admin permissions including user/evaluation management | Frontend local role switching is demo-oriented; no proven production admin identity flow. |

## UX consistency findings

- Duplicate active/inactive page files exist.
- `/discover` map is a placeholder, while `/tracker` uses a different map implementation.
- Hard-coded IDs: `CP-2026-001`, `CP-2026-881`, `DRAFT-99`.
- Console-only callbacks: document review actions/repair, community evidence, map location search, officer verification.
- Fake/default data: community 14/2 counts, queue count 14, fallback draft, seeded/demo role profiles.
- Incorrect status semantics: `approved` has historically been rendered as resolved/verified in multiple components; some local paths were corrected but production is stale.
- Loading/pipeline states: case detail polling exists, but map and route-level failures have no unified browser verification.
- Role leakage: backend role taxonomy exceeds frontend role taxonomy; localStorage demo role state can make the UI appear authorized independently of server authority.
- Responsive risk: MapLibre and fixed-height map containers have not been browser-verified at mobile breakpoints; desktop/map layout relies on nested `h-full` containers.

## Technical debt findings

- Duplicate page architecture.
- Two incompatible map rendering approaches.
- Mutable-ref React effect lifecycle in `IssueMap`.
- Static/local storage uploads and process-local background tasks remain production risks.
- In-memory dHash/cache fallback is not shared across instances.
- Public issue list is not user-scoped for tracker semantics.
- Multiple deployment configurations and no deployed commit identity.
- Lint warnings are non-blocking.
- Backend and frontend role taxonomies diverge.
- Stale production bundle versus repository HEAD.

## Recommended debugging order

1. Establish deployed commit/build identity and deployment freshness.
2. Verify `/discover` and `/tracker` separately in a real browser with console/network capture.
3. Fix or explicitly relabel the discovery placeholder map; then resolve tracker MapLibre lifecycle if reproduced.
4. Verify role/API authorization with a matrix, not only frontend route guards.
5. Remove or disable hard-coded/console-only production actions.
6. Add route-level browser verification before implementing any new feature.
