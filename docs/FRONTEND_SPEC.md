# FRONTEND_SPEC.md

## Pages / Routes

| Route | Page | Purpose |
|---|---|---|
| `/` | IntakePage | Submit a new issue (photo, location, note) |
| `/tracker` | TrackerPage | Public map + list of all issues/clusters |
| `/issue/:id` | IssueDetailPage | Evidence timeline, impact summary, drafts, approve/send |

## Components

| Component | Props | Notes |
|---|---|---|
| `PhotoUploader` | `onCapture(file)` | camera or file input, client-side resize before upload |
| `LocationPicker` | `onLocate({lat,lng})` | auto-GPS with manual map-pin fallback |
| `IssueCard` | `issue` | used in TrackerPage list and cluster views |
| `MapView` | `issues[]`, `clusters[]` | wraps Google Maps JS API |
| `ImpactSummaryPanel` | `impactSummary` | renders affected_area / risk_level / evidence_count — **never renders a numeric "score" field, since none exists in the schema** |
| `DraftCard` | `draft`, `onApprove`, `onReject` | shows disclaimer text prominently for `rti`/`complaint` types |
| `EscalationButton` | `draftId`, `method` | disabled unless draft.status === 'approved' |
| `StatusBadge` | `status` | shared across issue/draft/escalation statuses |
| `AgentProgressTimeline` | `activeAgentNumber` | Displays real-time progress timeline across the 5 agents: Agent 1 (Issue Understanding), Agent 2 (Verification), Agent 3 (Impact Intelligence), Agent 4 (Action Generator), Agent 5 (Escalation) |

## State
- No global store. Each page fetches its own data on mount via `src/api/*.ts` wrappers around `fetch`.
- `IssueDetailPage` holds local state: `{issue, cluster, impactSummary, drafts}`, refetched after any mutating action (approve, escalate) — never optimistically marks something as sent.

## Hooks
- `useIssue(id)` — fetch + refetch issue detail.
- `useGeolocation()` — wraps browser geolocation API with a manual-pin fallback.

## Loading States
- Skeleton card for `IssueCard` while tracker list loads.
- Spinner + "Analyzing photo..." while Agent 1/2 run synchronously after submit (this call may take several seconds — show real progress text, not a fake progress bar tied to a fixed timer).

## Error States
- `ai_unavailable` (502) → toast: "Couldn't analyze the photo. Try again." with retry button — never silently substitutes a placeholder classification.
- `validation_error` (422) → inline field errors on IntakePage form.
- Escalation `failed` → DraftCard shows real `provider_response` text, not a generic "error."

## Empty States
- TrackerPage with zero issues: "No reports yet — be the first to flag a community issue."
- IssueDetailPage before threshold crossed: "Evidence is being gathered. Drafts generate automatically once enough reports confirm this issue." (no draft section shown yet)

## Accessibility Requirements
- All interactive elements keyboard-navigable; map markers have accessible labels (issue type + severity).
- Color is never the only signal for `risk_level`/`status` — always paired with text label.

## Responsive Design Rules
- Mobile-first: IntakePage optimized for phone camera capture as primary flow.
- TrackerPage: map collapses to list-only view below 480px width, with a toggle to expand the map.
