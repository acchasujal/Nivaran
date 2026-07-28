# Changelog — Nivaran

## [1.0.0-release] - 2026-07-29

### Fixed
- **CI Workflows**: Resolved MapLibre GL `supported()` export check warnings in `IssueMap.tsx` and dependency array warnings in `ApprovalModal.tsx`.
- **Git Workflow**: Cleaned up uncommitted file lock issues and ensured clean status on `main`.
- **Role Reconciliation**: Expanded frontend `UserRole` taxonomy in `AuthProvider` and `AppRouter` `allowedRoles` to fully support Citizen, Community Volunteer, Government Officer, Department Admin, Auditor, and System Admin roles.
- **Render Deployment**: Synchronized Docker single-container asset copy pipeline with FastAPI `/version` commit SHA metadata.

### Added
- **Root Verification Tooling**: Added `package.json` with scripts:
  - `verify` (runs complete frontend & backend suite)
  - `verify:frontend`
  - `verify:backend`
  - `verify:roles`
  - `verify:maps`
  - `verify:deployment`
- **Release Documentation**: Added `RELEASE_CHECKLIST.md` and updated `progress.md` & `BUG_AUDIT.md`.
