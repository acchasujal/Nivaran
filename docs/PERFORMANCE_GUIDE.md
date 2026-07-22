# Performance Guide & Query Optimization

## Caching Strategy
- **Redis Caching**: Rate limits and transient tokens cached in Redis (with in-memory fallback).
- **Cursor Pagination**: Opaque Base64 cursors eliminate costly SQL offset queries.
