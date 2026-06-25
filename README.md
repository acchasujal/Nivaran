# CivicPulse

**Evidence-driven civic accountability platform.** Citizens report local infrastructure issues with a photo; the platform verifies, clusters, and converts evidence into real action artifacts — complaint drafts, RTI requests, and escalation emails — instead of a passive reporting dashboard.

---

## Setup Instructions

### Prerequisites
* Python 3.11+
* Node 18+
* A Gemini API key (Google AI Studio)
* SendGrid API key and verified sender email for the Escalation Agent

### Local Development (Windows Command Prompt)

To run the project on Windows using `cmd.exe`:

#### 1. Running the Backend
Open a Command Prompt window and execute:
```cmd
cd backend
python -m venv venv
call venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
uvicorn app.main:app --reload --port 8000
```
*(Make sure to populate your keys in the newly created `.env` file.)*

#### 2. Running the Frontend
Open a second Command Prompt window and execute:
```cmd
cd frontend
npm install
copy .env.example .env
npm run dev
```
*(Point `VITE_API_BASE_URL` in the frontend `.env` file to your backend server URL e.g. `http://localhost:8000`)*

---

## Folder Structure

```
civicpulse/
├── backend/
│   ├── app/
│   │   ├── agents/          # agent_1_intake.py ... agent_5_escalation.py
│   │   ├── models/          # SQLModel/Pydantic schemas
│   │   ├── routers/         # FastAPI route modules
│   │   ├── services/        # gemini_client, email_client, pdf_export
│   │   └── main.py
│   ├── tests/
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   └── api/
│   └── package.json
└── docs/                    # platform design documentation
```
