# Production Deployment Guide

## Overview
CivicPulse backend is containerized via multi-stage Docker build and ready for deployment on Cloud Run, AWS ECS, or Kubernetes.

## Container Build
```bash
cd backend
docker build -t civicpulse-backend:latest .
```

## Running with Docker Compose
```bash
docker-compose up -d
```
Exposes:
- Backend API: `http://localhost:8000`
- Redis Cache: `localhost:6379`
