# CivicPulse: AI-Powered Civic Escalation & Deduplication Engine

## 1. Problem Statement
Municipal grievance systems suffer from two major bottlenecks: **evidence integrity** and **processing friction**.
1. **Evidence and Pipeline Pollution**: Citizens often submit duplicate photos, screenshots, certificates, selfies, or completely irrelevant images. This floods municipal databases, wastes expensive AI tokens, and consumes valuable human review hours.
2. **Action and Resolution Bottleneck**: Traditional platforms function merely as passive logging systems. They generate a ticket number, but the report vanishes into administrative queues with no compiled evidence trail, no statutory legal backing (such as the Right to Information Act), and no follow-up mechanism.

Without a system that actively verifies, clusters, and escalates citizen evidence into legally sound dispatches, public accountability remains stalled.

---

## 2. Solution Overview
CivicPulse is an active civic accountability platform that converts raw photo uploads of infrastructure failures into structured, sendable legal dispatches within minutes, backed by a verified community evidence ledger.
1. **Deterministic Stage-0 Validation Gate**: A local image-processing pipeline (brightness, contrast, and PIL blur metrics) coupled with an image difference hashing (dhash) cache. If not cached, it runs a conservative Gemini 2.0 Vision check to filter out selfies, documents, and screenshots instantly—preventing database pollution and saving LLM costs.
2. **Multi-Agent Engine (Observe → Reason → Create → Act)**:
   - **Agent 1 (Intake Classifier)**: Categorizes the issue, determines severity, and rates visual credibility.
   - **Agent 2 (Verification & Clusterer)**: Deduplicates incoming issues within a 300-meter radius using Haversine formulas and semantic description comparisons.
   - **Agent 3 (Impact Analyst)**: Synthesizes cumulative risk (affected area footprint and neighborhood safety hazards).
   - **Agent 4 (Action Generator)**: Drafts official complaints (meeting DARPG/CPGRAMS standards) and legally binding Section 6(1) Right to Information (RTI) applications.
   - **Agent 5 (Escalation)**: Dispatches drafts via the SendGrid email API with a fallback to local PDF package exports.
3. **Public Transparency Ledger**: A real-time operations dashboard presenting active issues on an interactive map, deduplication metrics, and an active "Silence Ledger" tracking municipal wait times.

---

## 3. Innovation Highlights
- **Evidence Over Invention**: Unlike other systems that fabricate municipal ward scores or officer performance rankings (which collapse under judge questioning), CivicPulse computes everything deterministically from real evidence (e.g., active cluster density and verified wait days).
- **Draft, Not Authority**: Generated documents are clearly marked as AI drafts with mandatory disclaimers, preserving legal accountability.
- **Single-Call Merged Analysis**: Merges Agent 3 and Agent 4 generation into a single structural Gemini API call to reduce latency and execution cost in production.

---

## 4. Google Technologies
- **Gemini 2.0 (via Google GenAI SDK)**: Powers the vision-based Stage 0 validation, intake classification, semantic deduplication, and structured drafting (with Pydantic schemas).
- **Google Maps JavaScript API**: Drives the interactive operations dashboard, mapping geographic clusters with auto-fitting map bounds and safety markers.
- **Google Cloud Run**: Serves the containerized SPA (React and FastAPI) with scale-to-zero serverless efficiency.
- **Google Secret Manager & Cloud Build**: Secures API keys and automates continuous integration and deployment.

---

## 5. Differentiators
- **Statutory Power**: Generates draft RTI applications under Section 6(1) of the Indian Right to Information Act, 2005. This gives citizens statutory leverage rather than just another ticket ID.
- **Double Gate System**: Integrates a local Pillow-based check and a Gemini-powered visual filter to block spam before downstream work begins.
- **Verifiable Execution Logs**: Every email dispatched or PDF exported has its response status and timestamp logged to the public database, preventing "ghost" escalations.

---

## 6. Expected Impact
- **80%+ Reduction in Processing Latency**: Automatically drafts and formats grievance communications, saving hours of manual citizen preparation.
- **Zero Spam DB Pollution**: Stage-0 blocks invalid/unrelated uploads immediately, saving up to 90% of downstream AI query fees.
- **Power in Numbers**: Spatial clustering combines scattered reports of a single problem (like a road cave-in) into a single, high-severity dossier, ensuring ward engineers prioritize it.
