# API Compatibility Report — CivicPulse RC1

## Frontend-to-Backend Contract Matrix

| Feature Area | Frontend Hook / Component | Backend Endpoint | Status |
| :--- | :--- | :--- | :---: |
| Authentication | `AuthProvider.tsx` | `POST /api/auth/token`, `GET /api/auth/me` | Verified 100% |
| Offline Sync | `OfflineProvider.tsx` | `POST /api/sync/session`, `POST /api/sync/chunks`, `POST /api/sync/finalize` | Verified 100% |
| Government Workflow | `GovernmentWorkspace.tsx` | `GET /api/cases`, `POST /api/cases/{id}/assign`, `POST /api/cases/{id}/repair-complete` | Verified 100% |
| Community Verification | `CommunityDashboard.tsx` | `POST /api/cases/{id}/request-verification`, `POST /api/cases/{id}/verify` | Verified 100% |
| Notifications | `useNotificationsStore.ts` | `GET /api/notifications`, `GET /api/notifications/unread-count`, `PATCH /api/notifications/{id}/read` | Verified 100% |
| Analytics | `AnalyticsDashboard.tsx` | `GET /api/analytics/platform`, `GET /api/analytics/government` | Verified 100% |
| Global Audit Log | `AuditWorkspace.tsx` | `GET /api/audit/search`, `GET /api/audit/export` | Verified 100% |
