# Operations Runbook

## Health & Monitoring
- **Health Check**: `GET /health`
- **Readiness Probe**: `GET /ready`
- **Liveness Probe**: `GET /live`
- **Prometheus Telemetry**: `GET /metrics`

## Incident Response
1. **Database Lock**: Inspect active SQLModel connections.
2. **Redis Outage**: System automatically falls back to in-memory cache store.
