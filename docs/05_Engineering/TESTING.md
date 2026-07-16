# CivicPulse: Testing & Verification Guide

This document registers the testing frameworks, execution commands, and mock configurations used to verify code correctness.

---

## 1. Backend Testing (pytest)

Our backend code uses `pytest` and `httpx` to verify API routing logic, agent schemas, and database model relationships.

### Running Backend Tests
```bash
# Navigate to backend folder
cd backend

# Activate virtual environment
venv\Scripts\activate

# Run the test suite
pytest -v
```

---

## 2. API Mocking & Offline Configurations

*   **Gemini API Mocks:** To avoid token costs and API request failures during unit test execution, the `gemini_client.py` services utilize mock return JSON structures matching the expected Pydantic schemas.
*   **SendGrid Mocks:** Email dispatches are intercepted using a local file logger fallback inside testing mock environments.
*   **Database Testing:** Local testing runs against an in-memory SQLite database (`sqlite:///:memory:`) which compiles from the SQLModel classes dynamically.
