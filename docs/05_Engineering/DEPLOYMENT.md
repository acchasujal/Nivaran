# CivicPulse: Production Deployment Guide

This document defines the container configurations, environment variables, Google Cloud Run deployments, and CI/CD pipelines.

---

## 1. Container Configuration

CivicPulse is deployed as a containerized FastAPI backend serving the static SPA build.

### Dockerfile (Conceptual)
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8080
CMD ["gunicorn", "-k", "uvicorn.workers.UvicornWorker", "-b", "0.0.0.0:8080", "app.main:app"]
```

---

## 2. Environment Variables & Secret Manager

The runtime requires access to external API keys, secured using Google Secret Manager and injected at startup:

| Variable Name | Source | Purpose |
| :--- | :--- | :--- |
| `GEMINI_API_KEY` | Secret Manager | Powers Agent 1-4 reasoning and classification |
| `SENDGRID_API_KEY` | Secret Manager | Dispatches escalation notifications |
| `DATABASE_URL` | Secret Manager | PostgreSQL database connection string |
| `GOOGLE_MAPS_API_KEY` | Secret Manager | Map tile visual rendering |
| `FRONTEND_ORIGIN` | Env Config | Restricts CORS requests |

---

## 3. Automated CI/CD (Google Cloud Build)

*   **Trigger:** Commits pushed to the `main` branch.
*   **Build Pipeline:**
    1.  Runs `npm run build` inside `frontend/` to generate static builds.
    2.  Compiles the Docker container.
    3.  Pushes the container to Artifact Registry.
    4.  Deploys the container to Google Cloud Run, pointing to Secret Manager keys.
