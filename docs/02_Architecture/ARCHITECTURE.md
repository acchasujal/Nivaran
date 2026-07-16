# CivicPulse: Technical Architecture Specification

This document details the system design, data flows, schemas, and integration strategy for CivicPulse.

---

## 1. System Architecture Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                        Citizens                              │
│   🌐 Web App          💬 WhatsApp (Twilio) 📱 Mobile (future) │
│   (List / Map Home)   (Intake Bot)         (Planned)         │
└────────┬──────────────────┬──────────────────────────────────┘
         │                  │
         ▼                  ▼
┌─────────────────┐  ┌─────────────────┐
│  issues.py      │  │  whatsapp.py    │
│  (Web router)   │  │  (Webhook)      │
└────────┬────────┘  └────────┬────────┘
         │                    │
         └──────────┬─────────┘
                    │
                    ▼
         ┌──────────────────────┐
         │   issue_service.py   │  ← Shared Intake Pipeline
         └──────────┬───────────┘
                    │
         ┌──────────▼───────────┐     ┌─────────────────────┐
         │   FastAPI Backend    │────►│   Gemini API        │
         │   (Python 3.11+)     │◄────│   (2.5 Flash / Pro) │
         └──────────┬───────────┘     └─────────────────────┘
                    │         │
         ┌──────────┘         └────────────┐
         ▼                                  ▼
 ┌──────────────┐              ┌─────────────────────┐
 │ SQLModel DB  │              │ SendGrid HTTP API   │
 │ (PostgreSQL) │              │ ReportLab PDF       │
 └──────────────┘              └─────────────────────┘
```

---

## 2. Shared Ingestion Pipeline & Multi-Channel Input

The WhatsApp channel serves as a thin adapter parsing webhook payloads from Twilio, maintaining a lightweight session, and invoking the shared `issue_service.py` functions directly to prevent code duplication or redundant HTTP calls.

---

## 3. Database Schema (SQLModel / PostgreSQL)

### 3.1 `issues` Table
*   `id`: UUID (PK, Indexed)
*   `photo_url`: TEXT (Stored path)
*   `latitude`: FLOAT, `longitude`: FLOAT
*   `user_note`: TEXT (Nullable, optional citizen context)
*   `issue_type`: VARCHAR (Category: `road_damage`, `lighting`, `water`, `waste`, `other`)
*   `severity`: INTEGER (1 to 5 scale)
*   `description`: TEXT (AI-synthesized description)
*   `credibility_score`: FLOAT (0.0 to 1.0)
*   `cluster_id`: UUID (FK -> `clusters.id`, Indexed, Nullable)
*   `status`: VARCHAR (`pending`, `classified`, `clustered`, `drafted`, `escalated`, `resolved`)
*   `created_at`: TIMESTAMP

### 3.2 `clusters` Table
*   `id`: UUID (PK)
*   `area_label`: VARCHAR (Geographic descriptor)
*   `center_lat`: FLOAT, `center_lng`: FLOAT
*   `report_count`: INTEGER
*   `first_reported_at`: TIMESTAMP, `last_reported_at`: TIMESTAMP
*   `status`: VARCHAR (`active`, `actioned`, `resolved`)

### 3.3 `impact_summaries` Table
*   `id`: UUID (PK)
*   `cluster_id`: UUID (FK -> `clusters.id`, Indexed)
*   `affected_area_description`: TEXT
*   `potential_consequences`: TEXT
*   `risk_level`: VARCHAR (`low`, `moderate`, `high`)
*   `evidence_count`: INTEGER
*   `generated_at`: TIMESTAMP

### 3.4 `action_drafts` Table
*   `id`: UUID (PK)
*   `cluster_id`: UUID (FK -> `clusters.id`, Indexed)
*   `draft_type`: VARCHAR (`complaint`, `rti`, `community_summary`)
*   `content`: TEXT (Draft text containing legal and statutory context)
*   `status`: VARCHAR (`pending_review`, `approved`, `rejected`)
*   `created_at`: TIMESTAMP, `reviewed_at`: TIMESTAMP (Nullable)

### 3.5 `escalations` Table
*   `id`: UUID (PK)
*   `draft_id`: UUID (FK -> `action_drafts.id`, Indexed)
*   `method`: VARCHAR (`email`, `pdf_export`, `cpgrams_api`)
*   `recipient`: VARCHAR (Nullable)
*   `status`: VARCHAR (`sent`, `failed`, `exported`)
*   `provider_response`: TEXT (Raw HTTP or SMTP return log, Nullable)
*   `sent_at`: TIMESTAMP, `created_at`: TIMESTAMP

---

## 4. REST API Endpoint Registry

### Public Intake & Tracking
*   `POST /api/issues`: Submit new evidence. Accepts image upload + coordinates. Triggers Agent 1 (Classification) and Agent 2 (Clustering) synchronously.
*   `GET /api/issues`: List all issues. Supports pagination, area filtering, and `cluster_id` mapping.
*   `GET /api/issues/{id}`: Detailed issue page showing timeline, cluster associations, and pending actions.

### Clusters & Action Management
*   `GET /api/clusters/{id}`: Fetch group metrics, member photos, and geographic center.
*   `POST /api/clusters/{id}/impact`: Force regenerates the impact summary (Agent 3).
*   `POST /api/clusters/{id}/generate-drafts`: Force rebuilds official grievance/RTI letters (Agent 4).
*   `PATCH /api/action-drafts/{id}`: Transition draft state (`approved` or `rejected`). Human-only endpoint.

### Escalation Dispatch
*   `POST /api/escalations`: Trigger dispatch (Agent 5). Requires approved draft. Sends via email or PDF wrapper.
*   `GET /api/escalations/{id}`: Fetch raw logs and delivery signatures.

---

## 5. WhatsApp & CPGRAMS Integration Architectures

To ensure absolute clarity regarding pilot execution and future scale, we document both states:

### 5.1 WhatsApp Reporting Interface
*   **Current State:** Twilio Sandbox webhook receiver. Parses incoming user messages, maps voice transcription calls via Gemini Multimodal, and pushes photos/coordinates to `issue_service.py`. Conversation session state is kept in-memory.
*   **Future Architecture:** Meta Cloud API Direct Integration. Scales sessions via Redis Cache, supports interactive quick-reply buttons for category confirmations, and utilizes WhatsApp Template Messages for outbound status update notifications.

### 5.2 CPGRAMS / DARPG National Escalation
*   **Current State:** Simulated dispatch via SendGrid HTTP API to target email addresses, with a fallback to local PDF file generation when SendGrid is unavailable.
*   **Future Architecture:** Direct integration with the national CPGRAMS API (via DARPG credentials). Automated filing of validated citizen clusters, generating a national tracking ID which is synced back to the CivicPulse database via a daily cron job.

---

## 6. Evaluation & Demo Controls
To protect public credibility, the Hackathon Judge Demonstration Workspace lives behind the `/evaluate` endpoint of the main application. It is restricted by feature flags (`ENABLE_DEMO_CONTROLS=true`) and role-based access controls to prevent public exposure.
