# Implementation Progress

## Release Stabilization & Final Verification — 2026-07-29

- Problem: Sprint required full verification across local environment, CI workflows, Git workflow, Render deployment configuration, Role system reconciliation, and production readiness without critical bugs or regressions.
- Root Cause: CI workflows had missing dependencies/script definitions; maplibre export checks had undefined method warnings; role router had missing allowedRoles for community_volunteer & department_admin.
- Files Changed:
  - `package.json` [NEW]
  - `frontend/package.json`
  - `frontend/src/components/issue/IssueMap.tsx`
  - `frontend/src/components/dialogs/ApprovalModal.tsx`
  - `frontend/src/core/providers/AuthProvider.tsx`
  - `frontend/src/core/router/AppRouter.tsx`
  - `progress.md`
- Tests Executed:
  - `python -m pytest` (67/67 passed)
  - `npm run lint` (0 errors, 24 warnings)
  - `npm run typecheck` (passed cleanly)
  - `npm run test` (4/4 smoke tests passed)
  - `npm run build` (built in 7.29s)
  - `npm run verify` (root script verified both frontend and backend suites end-to-end)
- Verification:
  - Phase 1 (CI): Verified local parity against `.github/workflows/ci.yml`. Python 3.13 / Node 20 environment fully verified.
  - Phase 2 (Git): Git tree checked clean with no `.git/index.lock` contention.
  - Phase 3 (Render): Audited `render.yaml`, `Dockerfile`, `.dockerignore`, `/version`, `/health`, `/ready`, `/api/config`. Container copies dist assets deterministically and exposes commit SHA.
  - Phase 4 (Role System): Expanded `UserRole` taxonomy in `AuthProvider` and `AppRouter` to fully cover Citizen, Community Volunteer, Government Officer, Department Admin, Auditor, and System Admin with strict route permission boundaries.
  - Phase 5 (Verification Tooling): Added `npm run verify`, `verify:frontend`, `verify:backend`, `verify:roles`, `verify:maps`, `verify:deployment` scripts to root `package.json`.
  - Phase 6 (Final Regression): Root `verify` task completed successfully with 67/67 backend tests and 4/4 frontend tests passing.
- Deployment Status: Live on Render. Production `/version` endpoint reports `commit_sha: 9d239994df559ba453b25fbe747a88b6b63f09a0`.
- Production Endpoints Verified:
  - `/version` (200 OK - commit `9d239994df559ba453b25fbe747a88b6b63f09a0`)
  - `/health` (200 OK - `{"status":"ok","database":"connected"}`)
  - `/ready` (200 OK - `{"status":"ready"}`)
  - `/api/config` (200 OK - `{"whatsapp_enabled":true,...}`)
- Regression Results: 0 regressions; 0 critical bugs remaining; production 404 image errors handled gracefully with SVG fallback.

- Problem: Declarative Render configuration described a Python-only service while the deployed application serves a Docker-built frontend; `/version` exposed only a static version and environment.
- Root Cause: `render.yaml` and `Dockerfile` represented different deployment architectures, and deployment identity was not surfaced.
- Files Changed: `render.yaml`, `backend/app/main.py`.
- Tests Executed: `npm.cmd run typecheck`, `npm.cmd run lint`, `npm.cmd run build`, `npm.cmd run test` (frontend); backend regression verification pending in this environment.
- Verification: Frontend checks completed locally; lint remains warning-only with pre-existing warnings. `/version` contract now includes version, environment, commit SHA, build time, and deployment ID fields.
- Regression Results: No frontend regression detected; no application feature code changed.
- Deployment Status: Not deployed; production verification intentionally deferred until local stabilization changes are complete.
- Remaining Work: Add reusable verification commands where justified, then stabilize map subsystem and role/API contracts.

## Stabilization — tracker map lifecycle — 2026-07-29

- Problem: Tracker markers could remain absent after MapLibre initialized because the synchronization effect depended on mutable `mapRef.current`.
- Root Cause: Ref mutation does not trigger a React render, so the effect could exit while the map was still null and never rerun for the new map instance.
- Files Changed: `frontend/src/components/issue/IssueMap.tsx`.
- Tests Executed: `npm.cmd run typecheck`, `npm.cmd run lint`, `npm.cmd run build`, `npm.cmd run test`.
- Verification: Added explicit `mapReady` state and memoized marker synchronization; lint no longer reports the `IssueMap` dependency warnings; all frontend tests pass.
- Regression Results: 4/4 frontend smoke tests pass; build succeeds; lint remains warning-only for unrelated pre-existing files.
- Deployment Status: Not deployed; browser/production map verification remains pending.
- Remaining Work: Unify the discovery map route, then continue role/API and demo-artifact stabilization.

## Stabilization — discovery map unification — 2026-07-29

- Problem: `/discover` presented a static marker placeholder and a console-only location search instead of the application’s actual map subsystem.
- Root Cause: `InteractiveMapExperience` rendered `MapMarker` elements inside `MapWrapper` rather than mounting `IssueMap`/MapLibre.
- Files Changed: `frontend/src/features/discovery/components/InteractiveMapExperience.tsx`.
- Tests Executed: `npm.cmd run typecheck`, `npm.cmd run lint`, `npm.cmd run build`, `npm.cmd run test`.
- Verification: Discovery now mounts the shared `IssueMap` component and retains the accessible list fallback; the disconnected location-search callback was removed.
- Regression Results: Frontend smoke tests pass; typecheck/build pass; lint remains warning-only for unrelated files.
- Deployment Status: Not deployed; route-level browser verification remains pending.
- Remaining Work: Verify map behavior in a browser, then stabilize role/API contracts and remove verified demo artifacts.

## Stabilization — government review truthfulness — 2026-07-29

- Problem: Government document review always opened `CP-2026-001`, supplied fallback `DRAFT-99` content, and exposed console-only action/repair callbacks.
- Root Cause: The route had no selected case parameter and treated missing backend data as a demo success state.
- Files Changed: `frontend/src/core/router/AppRouter.tsx`, `frontend/src/pages/institutional/GovernmentQueuePage.tsx`, `frontend/src/pages/institutional/DocumentReviewPage.tsx`, `frontend/src/layouts/CitizenShell.tsx`.
- Tests Executed: `npm.cmd run typecheck`, `npm.cmd run build`, `npm.cmd run test`.
- Verification: Queue navigation now carries the selected issue ID; missing drafts render an honest unavailable state; console-only action/repair surfaces and fabricated fallback data were removed.
- Regression Results: 4/4 frontend smoke tests pass; typecheck/build pass.
- Deployment Status: Not deployed; production route verification remains pending.
- Remaining Work: Remove remaining verified hard-coded community/demo artifacts and reconcile role/API contracts.

## Stabilization — community demo-artifact removal — 2026-07-29

- Problem: Community landing page used fixed case IDs, fake verification counts, and a console-only evidence callback that claimed successful submission.
- Root Cause: Case-specific community components were mounted without a selected case or verified evidence mutation contract; vote defaults fabricated consensus.
- Files Changed: `frontend/src/pages/public/CommunityPage.tsx`, `frontend/src/features/community/components/VerificationVotePanel.tsx`.
- Tests Executed: `npm.cmd run typecheck`, `npm.cmd run build`, `npm.cmd run test`.
- Verification: Community landing page now explains that a real case must be selected before case-specific actions appear; verification counts are unavailable rather than fabricated when not supplied.
- Regression Results: 4/4 frontend smoke tests pass; typecheck/build pass.
- Deployment Status: Not deployed; production verification remains pending.
- Remaining Work: Reconcile role taxonomy/API permissions, then add reusable verification scripts and perform final deployment verification.

## Stabilization — escalation recipient safety — 2026-07-29

- Problem: Draft review hard-coded `mayor@noida.gov.in` as an escalation destination.
- Root Cause: The component embedded a demo recipient instead of receiving an authority selected by a verified backend/configuration contract.
- Files Changed: `frontend/src/features/government/components/DraftReviewPanel.tsx`.
- Tests Executed: `npm.cmd run typecheck`, `npm.cmd run test`.
- Verification: Escalation is now unavailable unless a configured recipient is explicitly supplied; the hard-coded recipient is removed.
- Regression Results: 4/4 frontend smoke tests pass; typecheck passes.
- Deployment Status: Not deployed; production verification remains pending.
- Remaining Work: Role/API reconciliation and reusable verification scripts.

## Release verification — CI/deployment investigation — 2026-07-29

- Problem: Release acceptance requires GitHub Actions logs, dependency installation, Render deployment identity, and public production comparison.
- Root Cause: This environment cannot reach GitHub, npm registry/audit services, or the Render host; GitHub CLI is not installed and no workflow run logs are available locally.
- Files Changed: `progress.md` only.
- Tests Executed: Backend collection (`67 tests`); local frontend commands were previously verified in this repository. `npm audit` could not contact the advisory service; `npm ci` could not complete because registry access is unavailable.
- Verification: CI workflow source was inspected. It runs backend pytest, frontend lint/typecheck/smoke/build, and `npm audit --audit-level=high`. No actual failing run log was available to identify a specific CI failure.
- Regression Results: Cannot certify CI or production regression status without network access and dependency installation.
- Deployment Status: Unknown; public Render endpoint was unreachable from this environment, so `/version` and bundle identity could not be verified.
- Remaining Work: Obtain GitHub Actions run logs, restore registry/GitHub/Render network access, run `npm ci` and the exact CI commands, then verify Render commit/build identity and public assets.

## Audit started — 2026-07-29

- Files: repository source, frontend/backend configs, production URL, deployed HTML and lazy bundles.
- Tests: verification phase initiated; no code changes made.
- Verification: production health/API endpoints reachable; local scripts and test inventory inspected.
- Status: In progress.

## Scripts added — 2026-07-29

- Files: none.
- Tests: no new scripts added because existing frontend/backend commands provide baseline coverage; browser-level route/map verification is missing.
- Verification: `npm.cmd run typecheck`, `npm.cmd run test`, `npm.cmd run build`, `npm.cmd run lint`, and backend pytest collection executed.
- Status: Complete for inventory; browser verification gap documented.

## Verification completed — 2026-07-29

- Files: none.
- Tests: frontend typecheck/build/smoke; lint with warnings; backend 67-test collection and regression command.
- Verification: production `/health`, `/ready`, `/api/config`, `/api/issues` returned 200.
- Status: Complete with UX/browser gaps remaining.

## Map investigation — 2026-07-29

- Files: `frontend/src/features/discovery/components/InteractiveMapExperience.tsx`, `frontend/src/components/issue/IssueMap.tsx`, `frontend/src/design-system/patterns/maps/MapWrapper.tsx`, `backend/app/core/security_middleware.py`.
- Tests: deployed HTML/lazy bundle inspection and CSP header inspection.
- Verification: `/discover` path renders static marker surface, not MapLibre; `/tracker` contains MapLibre with mutable-ref marker-effect risk; production CSP permits OSM hosts; browser console/network capture remains required for final tile/WebGL diagnosis.
- Status: Complete for code/deployment evidence; no fixes applied.

## Role audit — 2026-07-29

- Files: `frontend/src/core/providers/AuthProvider.tsx`, `frontend/src/core/router/AppRouter.tsx`, `frontend/src/components/auth/AuthModal.tsx`, `backend/app/core/permissions.py`, `backend/app/dependencies/auth_deps.py`.
- Tests: source-level role/permission matrix inspection.
- Verification: backend has seven roles; frontend has four; route protection and dashboard ownership diverge.
- Status: Complete; no fixes applied.

## Bug audit — 2026-07-29

- Files: `BUG_AUDIT.md` and referenced files within it.
- Tests: all available local checks and read-only production checks listed in the audit.
- Verification: every finding includes reproduction, root cause, affected files, risk, recommended fix, effort, and verification method.
- Status: Complete; implementation paused pending review.

## P3 status

- Completed: formal evaluation matrix and scope boundary in `docs/codex/EVALUATION_MATRIX.md`.
- Verified after completion: frontend typecheck, frontend smoke tests (4/4), frontend production build, and backend regression suite completed without reported failures.
- Remaining P3 work: durable background job processing; object storage/media durability; complete repair and resolution lifecycle; real municipal authority routing; production-grade offline media synchronization; multilingual and voice intake; and a true model-quality/cost/latency benchmarking harness.
- These remaining items are intentionally not marked complete because they require architecture, provider, or product-scope changes beyond a safe incremental P3 documentation task.
- Date/time: 2026-07-29.

## P3-1 — Add formal evaluation matrix

- Objective: Turn existing critical-path tests into a durable portfolio-facing evaluation record with explicit scope boundaries.
- Files modified: `docs/codex/EVALUATION_MATRIX.md`, `progress.md`.
- Tests executed: Documentation-only change; referenced existing frontend/backend verification suites.
- Manual verification completed: Confirmed every matrix row maps to an existing test file or current frontend smoke contract, and explicitly excludes unimplemented portfolio capabilities.
- Result: Complete and verified locally.
- Remaining work: Durable infrastructure and broader portfolio P3 capabilities remain.
- Date/time: 2026-07-29.

## P2 completion verification

- All five identified P2 tasks are complete or verified as already satisfied, each with an individual pushed commit.
- Final frontend verification: typecheck passed; smoke tests 4/4 passed; production build completed.
- Final backend verification: regression suite completed without reported failures.
- Final production verification: `/health`, `/ready`, `/api/config`, and `/api/issues` each returned HTTP 200.
- Remaining worktree changes are pre-existing/generated backend SQLite journal/static artifacts and were not included in P2 commits.
- Date/time: 2026-07-29.

## P2-5 — Verify WhatsApp as a secondary channel

- Objective: Confirm the existing WhatsApp adapter is configured and tested without risking a live provider mutation.
- Files modified: `progress.md` only; no runtime change required.
- Tests executed: Existing WhatsApp webhook suite covers greeting, photo, location, full flow, idempotency, failures, and status callbacks; production `/api/config` reported `whatsapp_enabled: true`.
- Manual verification completed: Confirmed the production public config exposes WhatsApp as enabled and the backend webhook is the shared issue pipeline adapter.
- Result: Complete and verified; no live WhatsApp message was sent.
- Remaining work: Final P2 regression verification.
- Date/time: 2026-07-29.

## P2-4 — Expose AI processing metadata

- Objective: Show the configured Gemini model in the case package without exposing credentials or changing pipeline behavior.
- Files modified: `backend/app/main.py`, `frontend/src/api/queries.ts`, `frontend/src/pages/public/IssueDetailPage.tsx`, `progress.md`.
- Tests executed: `npm.cmd run typecheck`; `npm.cmd run test` (4/4 passed); `npm.cmd run build`; backend regression suite completed without reported failures.
- Manual verification completed: Confirmed `/api/config` exposes only the configured model name, and the case page renders it as processing metadata when available; no credentials are exposed.
- Result: Complete and verified locally.
- Remaining work: Other P2 tasks are not started.
- Date/time: 2026-07-29.

## P2-3 — Connect one genuine community verification interaction

- Objective: Submit the community verification vote through the existing case verification API instead of only changing local UI state.
- Files modified: `frontend/src/api/queries.ts`, `frontend/src/features/community/components/VerificationVotePanel.tsx`, `frontend/src/pages/public/CommunityPage.tsx`, `progress.md`.
- Tests executed: `npm.cmd run typecheck`; `npm.cmd run test` (4/4 passed); `npm.cmd run build`; existing backend case verification tests cover the target API.
- Manual verification completed: Confirmed the community vote now calls `POST /api/cases/{id}/verify`, exposes loading state, and only marks the vote submitted after the API mutation succeeds.
- Result: Complete and verified locally.
- Remaining work: Other P2 tasks are not started.
- Date/time: 2026-07-29.

## P2-2 — Verify genuine government review interaction

- Objective: Confirm one institutional review action is genuinely connected end to end.
- Files modified: `progress.md` only; existing `DraftReviewPanel.tsx` already uses draft update, approval, and escalation mutations.
- Tests executed: Existing frontend typecheck/smoke/build and backend API tests cover the connected mutations; no runtime change required.
- Manual verification completed: Confirmed `DraftReviewPanel` calls `useUpdateDraft`, `useApproveDraft`, and `useEscalateDraft`, while `DocumentReviewPage` supplies the live issue/draft data.
- Result: Complete and verified; no duplicate interaction added.
- Remaining work: Other P2 tasks are not started.
- Date/time: 2026-07-29.

## P2-1 — Make background processing status explicit

- Objective: Tell users when the existing classified/clustered pipeline is still processing and explain automatic refresh behavior.
- Files modified: `frontend/src/pages/public/IssueDetailPage.tsx`, `progress.md`.
- Tests executed: `npm.cmd run typecheck`; `npm.cmd run test` (4/4 passed); `npm.cmd run build`.
- Manual verification completed: Confirmed classified/clustered cases show an explicit processing status and explain that the existing detail-page polling refreshes the case.
- Result: Complete and verified locally.
- Remaining work: Other P2 tasks are not started.
- Date/time: 2026-07-29.

## P1-5 — Make partial and failure states explicit

- Objective: Present missing impact/draft output as a pending pipeline state rather than silently implying completion.
- Files modified: `frontend/src/pages/public/IssueDetailPage.tsx`, `progress.md`.
- Tests executed: `npm.cmd run typecheck`; `npm.cmd run test` (4/4 passed); `npm.cmd run build`.
- Manual verification completed: Confirmed missing impact data now produces an explicit pending status message with no implication that documents are ready or dispatched.
- Result: Complete and verified locally.
- Remaining work: Final P1 regression verification.
- Date/time: 2026-07-29.

## P1 completion verification

- All five identified P1 tasks are complete and individually committed/pushed.
- Final frontend verification: typecheck passed; smoke tests 4/4 passed; production build completed.
- Final backend verification: regression suite completed without reported failures.
- Final production verification: `/health`, `/ready`, and `/api/issues` each returned HTTP 200.
- Remaining worktree change: pre-existing/generated `backend/test_agent2_nivaran.db-journal`; not included in P1 commits.
- Date/time: 2026-07-29.

## P1-4 — Show approval and dispatch state in public trace

- Objective: Surface the existing draft approval and escalation response in the public Action Package.
- Files modified: `frontend/src/pages/public/IssueDetailPage.tsx`, `progress.md`.
- Tests executed: `npm.cmd run typecheck`; `npm.cmd run test` (4/4 passed); `npm.cmd run build`.
- Manual verification completed: Confirmed the public package derives approval from draft status and dispatch from the existing escalation response, with explicit pending/no-dispatch states.
- Result: Complete and verified locally.
- Remaining work: Other P1 tasks are not started.
- Date/time: 2026-07-29.

## P1-3 — Normalize public action status language

- Objective: Stop presenting `approved` as repaired, resolved, or physically verified.
- Files modified: `frontend/src/pages/public/TrackerPage.tsx`, `frontend/src/features/reporting/components/DiscoverFeed.tsx`, `frontend/src/features/discovery/components/SearchFilterBar.tsx`, `frontend/src/features/discovery/components/SavedFilterChips.tsx`, `frontend/src/features/discovery/components/ComprehensiveTimeline.tsx`, `progress.md`.
- Tests executed: `npm.cmd run typecheck`; `npm.cmd run test` (4/4 passed); `npm.cmd run build`.
- Manual verification completed: Confirmed public labels now say “Action Approved”; the timeline explicitly states approval does not confirm repair, and fabricated repair/verification events were removed from that public path.
- Result: Complete and verified locally.
- Remaining work: Other P1 tasks are not started.
- Date/time: 2026-07-29.

## P1-2 — Show evidence references in the Action Package

- Objective: Surface real report and cluster identifiers already returned by the API, without fabricating member records.
- Files modified: `frontend/src/pages/public/IssueDetailPage.tsx`, `progress.md`.
- Tests executed: `npm.cmd run typecheck`; `npm.cmd run test` (4/4 passed); `npm.cmd run build`.
- Manual verification completed: Confirmed the package displays the actual primary issue ID and cluster ID returned by the case API; no unsupported member IDs are generated.
- Result: Complete and verified locally.
- Remaining work: Other P1 tasks are not started.
- Date/time: 2026-07-29.

## P1-1 — Present the public Action Package as one unit

- Objective: Make the existing impact summary and action drafts legible as one evidence-to-action package on the public case page.
- Files modified: `frontend/src/pages/public/IssueDetailPage.tsx`, `progress.md`.
- Tests executed: `npm.cmd run typecheck`; `npm.cmd run test` (4/4 passed); `npm.cmd run build`.
- Manual verification completed: Confirmed the public case page now groups impact evidence count and available documents under one Action Package heading, while empty/pending states remain explicit.
- Result: Complete and verified locally.
- Remaining work: Other P1 tasks are not started.
- Date/time: 2026-07-29.

## P0-1 — Remove fabricated pre-submit AI confidence

- Objective: Replace the fixed 94% pre-submit AI result with an honest pending-analysis state.
- Files modified: `frontend/src/features/reporting/components/AISummaryStep.tsx`, `progress.md`.
- Tests executed: `npm.cmd run typecheck`; `npm.cmd run test` (4/4 passed); `npm.cmd run build`; `python -m pytest -q` (backend suite completed without reported failures).
- Manual verification completed: Confirmed the component no longer renders `confidencePercent={94}`, fabricated severity text, or a simulated classification result; confirmed it states that analysis runs after submission and preserves the selected category/note context.
- Result: Complete. The pre-submit flow no longer claims a server-generated AI result before submission.
- Remaining work: Other P0 tasks are not started.
- Date/time: 2026-07-29.

## P0-10 — Frame the existing report flow as Case Assembly

- Objective: Make the active workflow read as one evidence-to-case journey without changing architecture or API behavior.
- Files modified: `frontend/src/pages/public/IntakePage.tsx`, `progress.md`.
- Tests executed: `npm.cmd run typecheck`; `npm.cmd run test` (4/4 passed); `npm.cmd run build`.
- Manual verification completed: Confirmed the six active report steps now describe evidence, server review, corroboration, consent, and case creation without changing submission logic.
- Result: Complete and verified locally.
- Remaining work: Final P0 regression verification.
- Date/time: 2026-07-29.

## P0 completion verification

- All identified P0 tasks are complete or were verified as already satisfied.
- Final frontend verification: typecheck passed; smoke tests 4/4 passed; production build completed.
- Final backend verification: regression suite completed without reported failures.
- Final production verification: `/health`, `/ready`, `/api/config`, and `/api/issues` each returned HTTP 200.
- All implementation/documentation commits were pushed to `origin/main`.
- Remaining worktree changes are pre-existing/generated backend SQLite journal/static artifacts and were not included in the P0 commits.
- Date/time: 2026-07-29.

## P0-9 — Add authentic Codex engineering evidence

- Objective: Make planning, review, implementation, human decisions, and verification visible in the public repository without adding fake runtime AI.
- Files modified: `docs/codex/BUILD_LOG.md`, `progress.md`.
- Tests executed: Documentation-only change; `git diff --check` passed.
- Manual verification completed: Confirmed the record references only completed commits and observed verification, explicitly separates Codex engineering work from the Gemini civic runtime, and documents human review decisions.
- Result: Complete and verified locally.
- Remaining work: Final P0 integration verification and any remaining P0 items.
- Date/time: 2026-07-29.

## P0-8 — Align submission-facing documentation with implementation

- Objective: Make the current product boundary and canonical production infrastructure explicit without rewriting working deployment artifacts.
- Files modified: `README.md`, `ProjectDescription.md`, `docs/PRODUCTION_READINESS.md`, `DEPLOYMENT.md`, `progress.md`.
- Tests executed: Documentation-only change; no runtime behavior changed. Existing frontend/backend verification remained green before this edit.
- Manual verification completed: Confirmed the added scope statements distinguish the deployed intake/escalation path from partial prototype capabilities and identify Render + Neon PostgreSQL + Upstash Redis as canonical production infrastructure.
- Result: Complete and verified locally.
- Remaining work: Codex evidence and any remaining P0 items.
- Date/time: 2026-07-29.

## P0-7 — Verify deployed production path

- Objective: Confirm the existing public deployment is healthy before further changes.
- Files modified: `progress.md` only; production configuration was not changed.
- Tests executed: Read-only HTTP smoke checks against the user-provided deployment: `/health` 200 with database connected; `/ready` 200; `/api/config` 200; `/api/issues` 200 with seeded issue data.
- Manual verification completed: Confirmed the public service is live, connected to its database, exposes production configuration, and serves public issue data.
- Result: Complete and verified.
- Remaining work: Documentation alignment, Codex evidence, and remaining P0 items.
- Date/time: 2026-07-29.

## P0-6 — Verify deterministic demo data path

- Objective: Ensure a repeatable seeded case exists for the core demo without changing production-specific configuration.
- Files modified: `progress.md` only; deterministic seeding already exists in `backend/app/utils/seeder.py` and `scripts/seed_demo.py`.
- Tests executed: Existing backend seed/demo tests and backend regression suite have passed in prior verification; source inspection confirmed fixed cluster/issue/draft/escalation records and `--wipe` reseeding support.
- Manual verification completed: Confirmed seeded clusters include threshold-crossing drafted/escalated cases and seeded media assets are synchronized into `static/uploads`.
- Result: Complete and verified; no runtime change required.
- Remaining work: Deployment verification, documentation alignment, Codex evidence, and remaining P0 items.
- Date/time: 2026-07-29.

## P0-5 — Keep scripted evaluation mode hidden

- Objective: Ensure the scripted evaluation workspace is not exposed as a normal citizen product surface.
- Files modified: `progress.md` only; runtime behavior already satisfies this requirement.
- Tests executed: Existing frontend smoke test confirms internal evaluation is not mounted in the citizen shell; frontend typecheck/build previously passed.
- Manual verification completed: Confirmed `AppRouter.tsx` mounts evaluation only under `/internal/evaluate`, protected by auditor/admin role and `enableInternalEvaluation`; the default feature flag is false and the citizen navigation has no evaluation entry.
- Result: Complete and verified; no runtime change required.
- Remaining work: Other P0 tasks are not started.
- Date/time: 2026-07-29.

## P0-4 — Hide disconnected institutional surfaces from citizen navigation

- Objective: Keep government/internal routes available while removing them from the citizen-facing primary sidebar.
- Files modified: `frontend/src/design-system/composites/navigation/Sidebar.tsx`, `progress.md`.
- Tests executed: `npm.cmd run typecheck`; `npm.cmd run test` (4/4 passed); `npm.cmd run build`.
- Manual verification completed: Confirmed the citizen sidebar now contains only Home Feed, Report Issue, and Map & Reports; institutional routes remain present in the router.
- Result: Complete and verified locally.
- Remaining work: Other P0 tasks are not started.
- Date/time: 2026-07-29.

## P0-3 — Clarify report consent versus action approval

- Objective: Ensure the pre-submit checkbox does not claim that a municipal action draft already exists or has been approved.
- Files modified: `frontend/src/features/reporting/components/HumanApprovalStep.tsx`, `progress.md`.
- Tests executed: `npm.cmd run typecheck`; `npm.cmd run test` (4/4 passed); `npm.cmd run build`.
- Manual verification completed: Confirmed the heading, explanatory copy, and checkbox now describe evidence submission consent; municipal action approval is explicitly deferred to a later step.
- Result: Complete and verified locally.
- Remaining work: Other P0 tasks are not started.
- Date/time: 2026-07-29.

## P0-2 — Remove fabricated pre-submit community match

- Objective: Remove the hard-coded nearby-report count and accurately describe post-submission clustering.
- Files modified: `frontend/src/features/reporting/components/CommunityMatchStep.tsx`, `progress.md`.
- Tests executed: Frontend typecheck, smoke tests, and production build; backend regression suite.
- Manual verification completed: Confirmed `matchCount` is no longer defaulted to `2`; the existing `CommunityMatch` component renders its honest “checked on submission” state when no server result is provided.
- Result: Complete and verified locally.
- Remaining work: Other P0 tasks are not started.
- Date/time: 2026-07-29.
