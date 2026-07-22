# CI/CD Pipeline Specification

## GitHub Actions Workflow
File: `.github/workflows/ci-cd.yml`
- Triggers on push and pull request to `main`.
- Runs pytest suite with Redis service container.
- Builds production Docker image `civicpulse-backend:latest`.
