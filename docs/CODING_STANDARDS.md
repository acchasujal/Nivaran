# CODING_STANDARDS.md

## Naming Conventions
- Python: `snake_case` for functions/variables, `PascalCase` for classes/Pydantic models.
- TypeScript/React: `camelCase` for functions/variables, `PascalCase` for components.

## Folder Conventions
- Backend: `app/{agents,models,routers,services}/` — no business logic in `main.py` beyond app/router wiring.
- Frontend: `src/{pages,components,api}/` — no API `fetch` calls inside components; always go through `src/api/*.ts`.

## File Naming
- Backend agent files: `agent_{n}_{name}.py` (matches `ARCHITECTURAL_TRUTHS.md` agent numbering exactly — never renumber without updating that file).
- Frontend components: `PascalCase.tsx`; hooks: `useX.ts`.

## Component Naming
- One component per file, file name === export name.

## API Naming
- REST nouns, plural resources (`/issues`, `/clusters`, `/action-drafts`, `/escalations`) — matches `API_CONTRACTS.md` exactly. Any new endpoint must be added to that file before being merged.

## Database Naming
- Table names: plural snake_case (`issues`, `action_drafts`). Foreign keys: `{singular_table}_id`.

## Type Safety Rules
- Backend: every endpoint has a Pydantic request and response model — no raw dict returns.
- Frontend: every API wrapper function has a typed return; no `any` on agent output types (mirror schemas from `AI_SYSTEM_DESIGN.md`).

## Error Handling Rules
- Never catch-and-suppress an exception silently. Either handle it meaningfully (return the defined error response) or let it propagate to the centralized handler.
- Never substitute a fabricated/default value for a failed AI call (violates Truth 2/7 — this is a project-specific hard rule, not just a style preference).

## Logging Rules
- No `print()` in backend code — use the configured logger.
- Never log full photo binary/base64 data — log file metadata only.

## Testing Rules
- Minimum: one test per agent verifying schema-conformant output handling and the "reject malformed output" path (see `AI_SYSTEM_DESIGN.md` validation logic per agent).
- One integration test for the full happy-path pipeline (`POST /issues` → ... → `POST /escalations`) using a mocked Gemini client and a mocked SendGrid email client.

## Documentation Rules
- Any new endpoint, table, or agent requires a corresponding update to `API_CONTRACTS.md`, `DATABASE_SCHEMA.md`, or `AI_SYSTEM_DESIGN.md` in the same PR/commit — not after.

## Code Review Rules (solo-dev adaptation)
- Before merging any agent-related change, explicitly re-check it against `ARCHITECTURAL_TRUTHS.md` Truths 2–4 — this is the project's actual highest-risk failure mode (fabricated metrics, false agentic claims, overclaimed legal authority).
