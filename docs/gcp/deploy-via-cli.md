# Deploy Martech via gcloud CLI (0 to 100)

End-to-end guide to deploy the Martech Cloud Run service from a fresh state using the `gcloud` CLI only.

> **Reference**: [Deploying to Cloud Run using Cloud Build](https://docs.cloud.google.com/build/docs/deploying-builds/deploy-cloud-run) · [Deploying container images to Cloud Run](https://docs.cloud.google.com/run/docs/deploying)

---

## 1. Install and configure gcloud

```bash
# Install the Google Cloud CLI (if not already installed)
# https://docs.cloud.google.com/sdk/docs/install

# Authenticate
gcloud auth login

# Set your project
gcloud config set project YOUR_PROJECT_ID

# Confirm active project
gcloud config get-value project
```

---

## 2. Link a billing account

```bash
# List available billing accounts
gcloud billing accounts list

# Link billing account to your project
gcloud billing projects link YOUR_PROJECT_ID --billing-account=BILLING_ACCOUNT_ID
```

> You cannot **create** a billing account via CLI — that requires selecting a payment method in the GCP Console.

---

## 3. Enable required APIs

```bash
gcloud services enable \
  cloudbuild.googleapis.com \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  cloudresourcemanager.googleapis.com \
  secretmanager.googleapis.com
```

---

## 4. Create an Artifact Registry repository

Cloud Build needs a Docker repository to push images to.

```bash
gcloud artifacts repositories create cloud-run-source-deploy \
  --repository-format=docker \
  --location=us-east1 \
  --description="Docker images for Cloud Run deployments"
```

---

## 5. Grant IAM permissions to the Cloud Build service account

Cloud Build must be allowed to deploy to Cloud Run, read/write Artifact Registry, and access secrets.

```bash
# Retrieve the Cloud Build service account email
PROJECT_NUMBER=$(gcloud projects describe YOUR_PROJECT_ID --format='value(projectNumber)')
CB_SA="${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com"

# Grant required roles
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:${CB_SA}" \
  --role="roles/run.admin"

gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:${CB_SA}" \
  --role="roles/artifactregistry.writer"

gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:${CB_SA}" \
  --role="roles/secretmanager.secretAccessor"

gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:${CB_SA}" \
  --role="roles/iam.serviceAccountUser"

gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:${CB_SA}" \
  --role="roles/storage.admin"

gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:${CB_SA}" \
  --role="roles/logging.logWriter"
```

> **Docs**: [Required IAM permissions for Cloud Build → Cloud Run](https://docs.cloud.google.com/build/docs/deploying-builds/deploy-cloud-run#required_iam_permissions)

---

## 6. Create required secrets in Secret Manager

The Martech service depends on five secrets. Create each one before the first deploy.

```bash
echo -n "smtp.gmail.com"          | gcloud secrets create SMTP_HOST --data-file=-
echo -n "587"                     | gcloud secrets create SMTP_PORT --data-file=-
echo -n "your-email@gmail.com"    | gcloud secrets create SMTP_USER --data-file=-
echo -n "your-app-password"       | gcloud secrets create SMTP_PASS --data-file=-
echo -n "info@martechsd.com"      | gcloud secrets create CONTACT_DESTINATION_EMAIL --data-file=-
```

If the secrets already exist, add a new version instead:

```bash
echo -n "new-value" | gcloud secrets versions add SECRET_NAME --data-file=-
```

| Secret Name                  | Description                       |
|------------------------------|-----------------------------------|
| `SMTP_HOST`                  | `smtp.gmail.com`                  |
| `SMTP_PORT`                  | `587`                             |
| `SMTP_USER`                  | Gmail address for sending         |
| `SMTP_PASS`                  | Gmail App Password (16 chars)     |
| `CONTACT_DESTINATION_EMAIL`  | Inbox receiving contact form msgs |

---

## 7. Deploy

Choose one of the three methods below.

### Method A — One-time submit via Cloud Build (uses `cloudbuild.yaml`)

```bash
# From the repository root:
gcloud builds submit \
  --config=cloudbuild.yaml \
  --region=us-east1 \
  --substitutions=SHORT_SHA=$(git rev-parse --short HEAD)
```

This uses the `cloudbuild.yaml` in this repo, which:

1. Builds the Docker image
2. Pushes it to Artifact Registry
3. Deploys to Cloud Run in `us-east1`

> **Docs**: [Building and deploying an image](https://docs.cloud.google.com/build/docs/deploying-builds/deploy-cloud-run#building_and_deploying_an_image)

---

### Method B — Continuous deployment via Cloud Build trigger (tag-based)

Set up a trigger so every new Git tag (e.g. `v1.2.3` from semantic-release) automatically builds and deploys.

```bash
# Connect your GitHub repository first (one-time, requires browser):
# https://console.cloud.google.com/cloud-build/repositories

# Then create the tag-based trigger:
gcloud builds triggers create github \
  --name="martech-tag-deploy" \
  --region=us-east1 \
  --repo-owner="YOUR_GITHUB_USERNAME" \
  --repo-name="martech" \
  --tag-pattern="^v.*" \
  --build-config="cloudbuild.yaml"
```

The `--tag-pattern="^v.*"` matches any tag starting with `v` (e.g. `v1.0.0`).

> **Docs**: [Continuous deployment](https://docs.cloud.google.com/build/docs/deploying-builds/deploy-cloud-run#continuous_deployment) · [Create and manage build triggers](https://docs.cloud.google.com/build/docs/automating-builds/create-manage-triggers)

---

### Method C — Direct deploy without Cloud Build

Skip Cloud Build entirely and let `gcloud` build and deploy in a single command:

```bash
gcloud run deploy martech \
  --source=. \
  --region=us-east1 \
  --platform=managed \
  --allow-unauthenticated \
  --port=8080 \
  --memory=512Mi \
  --cpu=1 \
  --set-secrets="SMTP_HOST=SMTP_HOST:latest,SMTP_PORT=SMTP_PORT:latest,SMTP_USER=SMTP_USER:latest,SMTP_PASS=SMTP_PASS:latest,CONTACT_DESTINATION_EMAIL=CONTACT_DESTINATION_EMAIL:latest"
```

`--source=.` instructs gcloud to detect the `Dockerfile` in the current directory, build the image with Cloud Build, push it to Artifact Registry, and then deploy it — all automatically.

> **Docs**: [Deploy from source code](https://docs.cloud.google.com/run/docs/deploying-source-code)

---

## Make the service public (Allow unauthenticated invocations)

You can make the `martech` service publicly accessible either with a short `gcloud` command or via the GCP Console UI.

- CLI (quick):

```bash
gcloud run services add-iam-policy-binding martech \
  --member="allUsers" \
  --role="roles/run.invoker" \
  --region=us-east1 \
  --platform=managed
```

Note: Granting `allUsers` the Invoker role makes the service public. Only do this for public sites or APIs.

---

## 8. Verify the deployment

```bash
# List Cloud Run services
gcloud run services list --region=us-east1

# Describe the deployed service
gcloud run services describe martech --region=us-east1

# Get the service URL
gcloud run services describe martech \
  --region=us-east1 \
  --format='value(status.url)'
```

---

## Notes

### Re-deploying an existing service

Any call to `gcloud run deploy` creates an immutable new revision. Traffic is routed to it immediately unless you use `--no-traffic`.