# Production Deployment Guide: Vercel & Render

The canonical deployed environment is the FastAPI service on **Render**, backed by **Neon PostgreSQL** and **Upstash Redis**, with the frontend served by the deployed application. The Vercel/Render split below remains an alternate deployment configuration for development or independent hosting.

---

## Backend Deployment (Render)

### 1. Database Setup
Render provides a managed **PostgreSQL** database. 
1. Create a **New PostgreSQL** instance in Render.
2. Note the internal/external connection strings.

### 2. FastAPI Service Setup
Create a **New Web Service** pointing to your repository:
- **Environment**: Python
- **Build Command**: `pip install -r backend/requirements.txt && alembic -c backend/alembic.ini upgrade head`
- **Start Command**: `gunicorn -k uvicorn.workers.UvicornWorker --chdir backend app.main:app --bind 0.0.0.0:$PORT`
- **Env Variables**:
  - `DATABASE_URL`: Connection string of your Render Postgres instance.
  - `GEMINI_API_KEY`: Google Gemini API credentials.
  - `SENDGRID_API_KEY`: SendGrid dispatch credentials.
  - `SENDGRID_FROM_EMAIL`: Verified sender address.
  - `FRONTEND_ORIGIN`: Comma-separated list of authorized frontend origins (e.g. `https://your-app.vercel.app`).

---

## Frontend Deployment (Vercel)

Vercel hosts the React SPA statically and manages client routing.

### 1. Project Configuration
Add a new project in Vercel pointing to the repository.
- **Framework Preset**: Vite
- **Root Directory**: `frontend`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Env Variables**:
  - `VITE_API_BASE_URL`: The HTTPS URL of your Render backend API service including `/api` (e.g., `https://nivaran-api.onrender.com/api`).

### 2. Client-side Routing
Vercel handles client routing via `frontend/vercel.json` (already configured to route all fallbacks to `index.html`).
