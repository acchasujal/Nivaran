# Architecture Decision Record: ADR-007-PostgreSQL-Production

## Status
**Approved** (2026-07-16)

---

## Context
While SQLite (WAL mode) is lightweight and simple for local testing, it lacks support for concurrent write scalability and lacks built-in geospacial querying tools needed for production.

---

## Decision
PostgreSQL is the standard database engine for production deployments.
*   **Abstractions:** The FastAPI backend uses SQLAlchemy/SQLModel to support both databases.
*   **Indices:** Enforce database indexes on foreign keys (`cluster_id`, `draft_id`, `issue_type`) to optimize spatial query performances.

---

## Alternatives Considered
*   **SQLite-Only Production:** Rejected. Fails under concurrent write loads and lacks scalability for multi-instance scaling.

---

## Consequences
*   **Scalability:** Supports concurrent requests and multi-instance cloud deployments.
*   **Code Portability:** Maintains database neutrality in local development.

---

## Related Documents
*   [ARCHITECTURE.md](file:///d:/Projects/CivicPulse/docs/02_Architecture/ARCHITECTURE.md#3-database-schema-sqlmodel-postgresql)
*   [BACKEND.md](file:///d:/Projects/CivicPulse/docs/05_Engineering/BACKEND.md)
