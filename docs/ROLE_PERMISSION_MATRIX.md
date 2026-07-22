# Role & Permission Matrix (RBAC / ABAC)

## System Roles
1. **citizen**: Standard citizen user. Can report issues, track status, view public impact, and manage personal sessions.
2. **officer**: Municipal Ward Officer. Can view issues, create/approve action drafts, create escalations, view impact, and dispatch WhatsApp alerts.
3. **auditor**: Independent Auditor. Read-only access across issues, actions, escalations, impact, and user audit logs.
4. **admin**: System Administrator. Full unrestricted access across all resources, users, sessions, and system configurations.
5. **institution**: External Institutional partner (NGO / Media / Legal). Can view issues, create action drafts, and export impact summaries.
6. **evaluation**: Internal Evaluation framework account. Has access to evaluation benchmarks and system metrics.
7. **anonymous**: Unauthenticated citizen reporting session. Limited read/create access.

## Permission Matrix

| Permission | citizen | officer | auditor | admin | institution | evaluation | anonymous |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| `issues:read` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `issues:create` | ✓ | ✓ | | ✓ | ✓ | | ✓ |
| `issues:update` | ✓ | ✓ | | ✓ | | | |
| `issues:delete` | | | | ✓ | | | |
| `actions:read` | | ✓ | ✓ | ✓ | ✓ | ✓ | |
| `actions:create` | | ✓ | | ✓ | ✓ | | |
| `actions:approve` | | ✓ | | ✓ | | | |
| `escalations:read` | | ✓ | ✓ | ✓ | | ✓ | |
| `escalations:create` | | ✓ | | ✓ | | | |
| `escalations:resolve` | | | | ✓ | | | |
| `impact:read` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `impact:export` | | ✓ | ✓ | ✓ | ✓ | | |
| `whatsapp:dispatch` | | ✓ | | ✓ | | | |
| `users:read` | | | ✓ | ✓ | | | |
| `users:manage` | | | | ✓ | | | |
| `sessions:read` | ✓ | ✓ | ✓ | ✓ | ✓ | | |
| `sessions:revoke` | ✓ | ✓ | | ✓ | ✓ | | |
| `evaluation:access` | | | | ✓ | | ✓ | |
