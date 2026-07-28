# Release Checklist — Nivaran v1.0.0

## Pre-Release Verification

- [x] **Backend CI**: 67/67 pytest unit and integration tests passing (`python -m pytest`).
- [x] **Frontend Quality**: `oxlint` passes with 0 errors (24 warnings).
- [x] **Type Safety**: `tsc -b` typecheck passes with 0 errors across 251 files.
- [x] **Smoke Tests**: 4/4 Node.js frontend smoke tests passing.
- [x] **Frontend Production Build**: `vite build` completed successfully, producing optimized bundle chunks.
- [x] **Root Verification Script**: `npm run verify` passes end-to-end.

## Architecture & Configuration

- [x] **Render Deployment Configuration**: `render.yaml` and `Dockerfile` aligned for single-container FastAPI + React static distribution.
- [x] **Container Health Checks**: `/health`, `/ready`, `/version`, `/api/config` endpoints active.
- [x] **Map Subsystem**: MapLibre GL integrated with WebGL fallback and responsive resizing.
- [x] **Role System Reconciliation**: 6 roles supported across backend and frontend (`citizen`, `community_volunteer`, `officer`, `department_admin`, `auditor`, `admin`).

## Status

**READY FOR PRODUCTION DEPLOYMENT**
