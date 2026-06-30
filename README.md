# CivicPulse

> **The problem isn't that citizens can't report civic issues. It's that nothing happens after they do.**

![CivicPulse](docs/assets/civicpulse-hero.png)

CivicPulse is an AI-powered civic accountability platform that transforms verified citizen-submitted infrastructure evidence into structured community intelligence, actionable government-ready documents, and transparent escalation workflows.

Instead of generating another ticket number, CivicPulse helps citizens build evidence that is difficult to ignore.

## Live Links

🌐 **Live Demo**  
https://civicpulse-89026185279.us-central1.run.app/

📄 **Project Description**  
https://docs.google.com/document/d/1hWUT76pNRuKSaGgoruwX7dj_d7txXO5UQVcaR2jI2OI/edit?usp=sharing

---

# The Problem

Municipal grievance platforms have a reporting problem because they ultimately suffer from an accountability problem.

Current systems typically:

- Generate passive complaint tickets with little follow-up.
- Accept screenshots, certificates, selfies, and irrelevant uploads that waste review time and AI resources.
- Treat every report independently instead of identifying recurring community issues.
- Provide little assistance for citizens who want to formally escalate unresolved problems.

As a result, important civic issues often disappear into administrative queues.

---

# The Solution

CivicPulse converts a single evidence submission into an evidence-backed civic case.

The platform:

1. Validates uploaded evidence before expensive AI processing.
2. Classifies the infrastructure issue.
3. Detects nearby duplicate reports.
4. Creates community evidence clusters.
5. Assesses public impact.
6. Drafts government-ready complaint and RTI documents.
7. Requires explicit human approval.
8. Dispatches approved complaints via email or exports them as printable PDFs.

The result is not simply another complaint—it is a structured accountability workflow.

---

##  Citizen Journey

![Citizen Journey](docs/assets/user-journey.png)

# End-to-End Workflow

```
Citizen Upload
      │
      ▼
Stage-0 Evidence Validation
      │
      ▼
Issue Classification
      │
      ▼
Community Clustering
      │
      ▼
Impact Assessment
      │
      ▼
Complaint & RTI Drafting
      │
      ▼
Citizen Approval
      │
      ▼
Government Escalation
```

---

# Key Features

## Stage-0 Evidence Validation

Rejects invalid submissions before AI processing using:

- MIME validation
- Resolution validation
- File-size validation
- Blur detection
- Brightness analysis
- Perceptual hash cache
- Vision-based evidence validation

Invalid uploads such as screenshots, certificates, documents, selfies, or unrelated images are rejected immediately.

---

## AI Evidence Understanding

Analyzes verified evidence to determine:

- Issue category
- Severity
- Visual confidence
- Geographic context

---

## Community Intelligence

Nearby reports are grouped into community evidence clusters using spatial verification and semantic similarity.

Instead of isolated complaints, CivicPulse builds collective evidence.

---

## Accountability Drafts

Automatically prepares:

- Municipal Complaint
- RTI Draft
- Community Summary

Documents remain editable and require citizen approval before dispatch.

---

## Human Approval

Nothing is sent automatically.

The citizen reviews every generated draft before authorizing escalation.

---

## Government Escalation

Approved complaints can be:

- Sent via SendGrid Email
- Exported as printable PDF

Every dispatch is logged for transparency.

---

# AI Pipeline

| Stage | Responsibility |
|---------|----------------|
| Stage 0 | Evidence Validation |
| Agent 1 | Issue Classification |
| Agent 2 | Spatial Verification & Clustering |
| Agent 3 | Impact Assessment |
| Agent 4 | Accountability Drafting |
| Agent 5 | Government Escalation |

Each stage has a clearly defined responsibility and produces structured outputs for the next stage.

---
## Architecture Overview

![Technical Architecture](docs/assets/civicpulse-architecture.png)


# Architecture

```
Citizen
   │
   ▼
Photo + Location
   │
   ▼
Stage-0 Validation
(Local + AI Validation)
   │
   ├── Reject
   │
   ▼
Issue Classification
   │
   ▼
Spatial Verification
   │
   ▼
Community Cluster
   │
   ▼
Impact Analysis
   │
   ▼
Complaint & RTI Generation
   │
   ▼
Citizen Approval
   │
   ▼
Government Escalation
```

---

# Google Technologies

- Gemini (Google GenAI SDK)
- Google Maps Platform
- Google Cloud Run
- Google Cloud Build
- Google Secret Manager

---

# Tech Stack

| Layer | Technology |
|---------|------------|
| Frontend | React, Vite, TypeScript |
| Backend | FastAPI |
| Database | SQLite |
| AI | Gemini |
| Maps | Google Maps Platform |
| Email | SendGrid |
| PDF | ReportLab |
| Deployment | Docker + Google Cloud Run |

---

# Why CivicPulse?

Most civic platforms focus on **report collection**.

CivicPulse focuses on **government accountability**.

Instead of asking:

> "How can citizens report problems?"

CivicPulse asks:

> **"How can verified community evidence drive real government action?"**

The platform combines evidence validation, AI reasoning, community intelligence, human approval, and official escalation into a single workflow.

---

# Screenshots

> Replace this section with:
>
> - Landing Page
> - Evidence Submission
> - AI Pipeline
> - Operations Dashboard
> - Issue Workspace
> - Accountability Drafts
> - Government Escalation

---

# Local Setup

## Prerequisites

- Python 3.11+
- Node.js 18+
- Gemini API Key
- SendGrid API Key

## Backend

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

pip install -r requirements.txt

uvicorn app.main:app --reload
```

## Frontend

```bash
cd frontend

npm install

npm run dev
```

---

# Access Anywhere

CivicPulse supports multiple reporting channels that all share the same backend pipeline.

| Channel | Status | Purpose |
|---------|--------|--------|
| Web App | ✅ Primary | Full dashboard: submit, track, approve, escalate |
| WhatsApp | ✅ Available | Fast mobile reporting — photo + location = case filed |
| Mobile App | 🔜 Planned | Native app for iOS and Android |

The web app is the complete experience. WhatsApp is a lightweight reporting channel — citizens can submit evidence without opening a browser. All processing runs through the same backend: Stage-0 Validation → Agent Pipeline → Community Clustering → Accountability Drafts.

```
Citizen
 ├── 🌐 Web (full dashboard)
 ├── 💬 WhatsApp (fast reporting)
 └── 📱 Mobile App (future)
          │
          ▼
 Shared Issue Service
          │
 Stage-0 Validation
          │
 AI Pipeline (Agents 1–5)
          │
 Database
          │
 Human Approval
          │
 Government Escalation
```

**Multiple channels. One backend.**

### Technical Notes

- Current implementation uses **Twilio WhatsApp Sandbox** for development.
- Architecture is provider-agnostic. Migrating to Meta Cloud API requires changing only the adapter helpers in `whatsapp.py`.
- The WhatsApp channel is gated by `WHATSAPP_ENABLED=true` in the environment.

### Upcoming WhatsApp Improvements

The next evolution focuses on making WhatsApp significantly more natural and accessible while keeping the same backend pipeline unchanged. These are planned improvements — **not yet implemented**:

1. **Multilingual conversations** — Hindi, Tamil, Marathi, and other Indian languages
2. **Voice reporting** — send a voice note describing the issue
3. **Repair verification** — send a follow-up photo when the issue is fixed
4. **Smart notifications** — proactive updates when your case advances
5. **Accessibility improvements** — richer formatting for screen readers

---

# Future Vision

Potential future enhancements include:

- Repair verification using follow-up evidence
- Multi-level escalation workflows
- Regional language document generation
- Voice-based reporting
- Smart city integrations
- Government API integrations

---


# Authors

Build Solo By A Second Year Engineering Student
