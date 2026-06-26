# CivicPulse Production Deployment Readme

This folder contains the files and configuration necessary to deploy the entire CivicPulse application to Google Cloud Run as a single service.

## Core Files

- [Dockerfile](file:///d:/Projects/CivicPulse/Dockerfile): Multi-stage container build file (React compilation -> python runner).
- [DEPLOYMENT.md](file:///d:/Projects/CivicPulse/DEPLOYMENT.md): Complete guide with required commands, variables, smoke tests, and rollback instructions.
- [.env.example](file:///d:/Projects/CivicPulse/.env.example): Production environment variables template.

## Quick Start Deployment

1. Make sure GCP CLI is configured, and APIs are enabled:
   ```bash
   gcloud services enable run.googleapis.com \
                          artifactregistry.googleapis.com \
                          cloudbuild.googleapis.com \
                          secretmanager.googleapis.com
   ```

2. Create secrets in Secret Manager and grant access to the service account:
   ```bash
   # Create secrets
   echo -n "YOUR_GEMINI_KEY" | gcloud secrets create gemini-api-key --data-file=-
   echo -n "YOUR_SENDGRID_KEY" | gcloud secrets create sendgrid-api-key --data-file=-

   # Grant access to default Compute service account
   PROJECT_NUMBER=$(gcloud projects describe [YOUR_PROJECT_ID] --format="value(projectNumber)")
   gcloud secrets add-iam-policy-binding gemini-api-key \
       --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
       --role="roles/secretmanager.secretAccessor"
   gcloud secrets add-iam-policy-binding sendgrid-api-key \
       --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
       --role="roles/secretmanager.secretAccessor"
   ```

3. Create your Artifact Registry:
   ```bash
   gcloud artifacts repositories create civicpulse-repo --repository-format=docker --location=us-central1
   ```

4. Build and submit the container:
   ```bash
   gcloud builds submit --tag us-central1-docker.pkg.dev/[YOUR_PROJECT_ID]/civicpulse-repo/civicpulse:latest
   ```

5. Deploy to Cloud Run:
   ```bash
   gcloud run deploy civicpulse \
     --image us-central1-docker.pkg.dev/[YOUR_PROJECT_ID]/civicpulse-repo/civicpulse:latest \
     --platform managed \
     --region us-central1 \
     --allow-unauthenticated \
     --max-instances 1 \
     --concurrency 1 \
     --set-secrets="GEMINI_API_KEY=gemini-api-key:latest,SENDGRID_API_KEY=sendgrid-api-key:latest" \
     --set-env-vars="SENDGRID_FROM_EMAIL=[YOUR_EMAIL],LOG_LEVEL=info" \
     --startup-probe-type=http \
     --startup-probe-path=/health \
     --startup-probe-failure-threshold=10
   ```

6. Once deployment is complete, fetch the URL and set `APP_BASE_URL`:
   ```bash
   gcloud run services describe civicpulse --region us-central1 --format="value(status.url)"
   gcloud run services update civicpulse \
     --region us-central1 \
     --update-env-vars="APP_BASE_URL=[DEPLOYED_URL]"
   ```

For detailed troubleshooting, verification logs, and the official Judge Smoke-Test Checklist, please refer to the main [DEPLOYMENT.md](file:///d:/Projects/CivicPulse/DEPLOYMENT.md).
