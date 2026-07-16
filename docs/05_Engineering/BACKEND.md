# CivicPulse: Backend Engineering Guide

This document covers the FastAPI environment setup, database engines, and routing patterns.

---

## 1. Local Developer Setup

### Prerequisites
*   Python 3.11+
*   Virtual environment engine (`venv`)

### Running Locally
```bash
# Navigate to backend folder
cd backend

# Create python virtual environment
python -m venv venv

# Activate virtual environment (Windows)
venv\Scripts\activate

# Install requirements
pip install -r requirements.txt

# Start the uvicorn development server
uvicorn app.main:app --reload
```

---

## 2. Directory Structure

```
backend/app/
├── agents/
│   ├── agent_1_intake.py          # Category classifier
│   ├── agent_2_verification.py    # Radius deduplicator
│   ├── agent_3_impact.py          # Impact analysis (Async Task)
│   ├── agent_4_action_generator.py # Legal RTI/complaint drafter
│   └── agent_5_escalation.py      # SendGrid dispatch / PDF export
├── models/
│   └── (SQLModel classes per database table)
├── routers/
│   ├── issues.py
│   ├── clusters.py
│   └── escalations.py
└── main.py
```

---

## 3. Database Configurations

*   **Local Development:** Defaults to SQLite with WAL (Write-Ahead Logging) enabled.
*   **Production Deployment:** PostgreSQL. The database connection pooling and migrations are managed using SQLAlchemy / SQLModel abstractions to ensure environment neutrality.
