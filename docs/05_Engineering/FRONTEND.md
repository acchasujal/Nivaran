# CivicPulse: Frontend Engineering Guide

This document covers the developer setup, directory organization, state management, and client integration rules for the React / Vite SPA frontend.

---

## 1. Local Developer Setup

### Prerequisites
*   Node.js 18+
*   npm or yarn package manager

### Running Locally
```bash
# Navigate to frontend folder
cd frontend

# Install package dependencies
npm install

# Run the local Vite dev server
npm run dev
```

---

## 2. Directory Structure

```
frontend/src/
├── api/
│   └── (typed fetch wrappers - e.g., issues.ts, clusters.ts)
├── components/
│   ├── PhotoUploader.tsx
│   ├── LocationPicker.tsx
│   ├── MapView.tsx
│   ├── IssueCard.tsx
│   └── StatusBadge.tsx
├── pages/
│   ├── IntakePage.tsx
│   ├── TrackerPage.tsx
│   └── IssueDetailPage.tsx
├── main.tsx
└── index.css
```

---

## 3. Client API Integration & Typing
*   **Method:** Strict TypeScript typing. All request and response structures map directly to the Pydantic schemas exported by the backend API.
*   **State Preservation:** If a user exits the multi-step reporting flow, input states and captured image base64 coordinates must be cached in `localStorage` to support auto-resume.
