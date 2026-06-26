# CivicPulse — Google Cloud Run Production Deployment Guide

This guide details how to build and deploy the entire CivicPulse application (React frontend + FastAPI backend) as a single container on Google Cloud Run.

---

## 1. Prerequisites

1. Install the [Google Cloud SDK](https://cloud.google.com/sdk/docs/install).
2. Authenticate and configure your active project:
   ```bash
   gcloud auth login
   gcloud config set project [YOUR_PROJECT_ID]
   ```
3. Enable the required GCP APIs:
   ```bash
   gcloud services enable run.googleapis.com \
                          artifactregistry.googleapis.com \
                          cloudbuild.googleapis.com \
                          secretmanager.googleapis.com
   ```

---

## 2. Secrets & Environment Variables Configuration

For production security, sensitive API keys must be stored in **Google Secret Manager**. Non-sensitive parameters are managed using standard container environment variables.

### Secret Manager Bindings (Required)
| Secret Name | Maps to Container Env | Purpose |
|---|---|---|
| `gemini-api-key` | `GEMINI_API_KEY` | Google Gemini API Authentication Key |
| `sendgrid-api-key` | `SENDGRID_API_KEY` | SendGrid Mail Dispatch API Key |

### Environment Variables
| Variable Name | Purpose | Required / Optional |
|---|---|---|
| `SENDGRID_FROM_EMAIL` | SendGrid Verified Sender Email Address | **Required** |
| `APP_BASE_URL` | Deployed URL (configured post-deployment) | **Required** |
| `LOG_LEVEL` | Logging level detail (e.g. `info`, `debug`) | Optional (Default: `info`) |

---

## 3. Step-by-Step Deployment Commands

### Step 3.1: Create Secrets in Secret Manager
Run the following commands to create the secrets and store their values:
```bash
echo -n "YOUR_GEMINI_KEY" | gcloud secrets create gemini-api-key --data-file=-
echo -n "YOUR_SENDGRID_KEY" | gcloud secrets create sendgrid-api-key --data-file=-
```

### Step 3.2: Grant Secret Access to the Service Account
By default, Cloud Run uses the default Compute service account. Grant it permission to read the secrets:
```bash
PROJECT_NUMBER=$(gcloud projects describe [YOUR_PROJECT_ID] --format="value(projectNumber)")

gcloud secrets add-iam-policy-binding gemini-api-key \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

gcloud secrets add-iam-policy-binding sendgrid-api-key \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

### Step 3.3: Create Artifact Registry Repository
Create a repository in Artifact Registry to store the built container image:
```bash
gcloud artifacts repositories create civicpulse-repo \
  --repository-format=docker \
  --location=us-central1 \
  --description="CivicPulse Production Repository"
```

### Step 3.4: Build the Container Image
Run Cloud Build to compile React assets, package Python dependencies, and build the Docker image:
```bash
gcloud builds submit --tag us-central1-docker.pkg.dev/[YOUR_PROJECT_ID]/civicpulse-repo/civicpulse:latest
```

### Step 3.5: Deploy to Cloud Run with Startup Probes and Secrets
Deploy the container. We specify `max-instances=1` and `concurrency=1` to guarantee SQLite safety under the Free Tier, mount the secrets, and specify the health probe:
```bash
gcloud run deploy civicpulse \
  --image us-central1-docker.pkg.dev/[YOUR_PROJECT_ID]/civicpulse-repo/civicpulse:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --cpu 1 \
  --memory 512Mi \
  --min-instances 0 \
  --max-instances 1 \
  --concurrency 1 \
  --timeout 300 \
  --set-secrets="GEMINI_API_KEY=gemini-api-key:latest,SENDGRID_API_KEY=sendgrid-api-key:latest" \
  --set-env-vars="SENDGRID_FROM_EMAIL=[YOUR_EMAIL],LOG_LEVEL=info" \
  --startup-probe-type=http \
  --startup-probe-path=/health \
  --startup-probe-failure-threshold=10
```

### Step 3.6: Configure the Service URL (Post-Deployment)
Once deployed, retrieve the generated service URL:
```bash
gcloud run services describe civicpulse --region us-central1 --format="value(status.url)"
```
Update the service configuration to set `APP_BASE_URL` with your actual live URL:
```bash
gcloud run services update civicpulse \
  --region us-central1 \
  --update-env-vars="APP_BASE_URL=[YOUR_LIVE_SERVICE_URL]"
```

---

## 4. Deployment & Resource Verification

After deployment, run the following verification command to audit the deployed container:
```bash
gcloud run services describe civicpulse --region us-central1
```

Verify the active service details match:
- **Service URL**: Active public HTTPS URL.
- **Active Revision**: Ensure traffic is routed 100% to the latest revision.
- **Container Image**: Pointing to Artifact Registry `us-central1-docker.pkg.dev/[PROJECT]/civicpulse-repo/civicpulse:latest`.
- **Resources**: CPU is set to `1` and Memory is set to `512MiB`.
- **Scaling Limits**: `max-instances=1` and `concurrency=1` to guarantee SQLite database safety.
- **Secret bindings**: `GEMINI_API_KEY` and `SENDGRID_API_KEY` bound to their respective Secret Manager keys.
- **Environment Variables**: `SENDGRID_FROM_EMAIL`, `APP_BASE_URL`, and `LOG_LEVEL` configured correctly.

---

## 5. Judge Smoke-Test Checklist

Verify the deployed application using the following step-by-step checklist:

* [ ] **Home Page Loads**: Navigate to the live service HTTPS URL. The CivicPulse Intake landing page must render immediately without errors.
* [ ] **Upload Image**: Drag or select a road damage, lighting, or waste issue photo in the file uploader.
* [ ] **Gemini Classification**: Verify the visual evidence is classified and annotated (issue type, severity, credibility score) on completion.
* [ ] **Cluster Detection**: Verify the issue is clustered or a new cluster is successfully created in the spatial bounding area.
* [ ] **Impact Assessment**: Verify that the community report count, citizen impacts, and risks are computed.
* [ ] **AI Reasoning Visible**: Open the details section; verify the agent milestones and classification descriptions render correctly.
* [ ] **Complaint Generated**: Navigate to the generated documents; check that the formal complaint letter layout renders properly.
* [ ] **PDF Generated**: Click to download the official escalation PDF and verify the document opens and displays content correctly.
* [ ] **Email Sent**: Submit the approved complaint draft to an email inbox, verify that it delivers successfully, and matches the content.
* [ ] **Tracker Updates**: Navigate to `/tracker` or refresh the tracker view to see the newly logged issue appearing in the list.
* [ ] **Detail Timeline Renders**: Click the issue in the tracker; ensure the step-by-step Agent visual timeline compiles and renders.
* [ ] **Browser Refresh Works**: Press reload (F5) on any SPA sub-path (e.g. `/tracker` or `/issue/...`). The page must load correctly without raising a 404.
* [ ] **No Frontend Console Errors**: Open browser Developer Tools (F12); verify there are no unhandled JavaScript exceptions or console errors.
* [ ] **No Backend Errors**: Verify in GCP Cloud Run Log Explorer that no traceback errors or database locks are present.

---

## 5. Troubleshooting & FAQ

### Ephemeral Storage Reset
Since SQLite is local inside the container, database state is ephemeral. If the container scales down to zero or restarts, the database will revert to its initial state.
- **For Hackathons**: `--max-instances=1` is sufficient to prevent split-brain issues.
- **For Production**: Migrate SQLite to a managed database like Cloud SQL (PostgreSQL) and update the `DATABASE_URL` environment variable.

### 502 Bad Gateway / AI Unavailable
- Verify your `GEMINI_API_KEY` is active and has sufficient quota.
- Check Cloud Run logs: `gcloud beta run services logs tail civicpulse --region us-central1`.

---

## 6. Rollback Instructions

To roll back to a previous working revision:
1. List all active revisions:
   ```bash
   gcloud run revisions list --service civicpulse --region us-central1
   ```
2. Route 100% of traffic back to the target stable revision:
   ```bash
   gcloud run services update-traffic civicpulse \
     --region us-central1 \
     --to-revisions [REVISION_NAME]=100
   ```
