# Deploy Martech via GCP Console (0 to 100)

End-to-end guide to deploy the Martech Cloud Run service from a fresh state using the GCP Console UI only.

> **Reference**: [Deploying container images to Cloud Run](https://docs.cloud.google.com/run/docs/deploying) · [Deploying to Cloud Run using Cloud Build](https://docs.cloud.google.com/build/docs/deploying-builds/deploy-cloud-run)

---

## 1. Create or select a project

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. In the top navigation bar, click the project selector
3. Click **New Project**, enter a name (e.g. `martech`), and click **Create**
4. Once created, select the project from the selector

---

## 2. Enable billing

1. Go to **Billing** in the left sidebar (or navigate to [console.cloud.google.com/billing](https://console.cloud.google.com/billing))
2. Click **Link a billing account**
3. Select an existing billing account or follow the prompts to create one with a payment method

---

## 3. Enable required APIs

1. Go to [**APIs & Services > Enable APIs and Services**](https://console.cloud.google.com/apis/enableflow?apiid=cloudbuild.googleapis.com,run.googleapis.com,artifactregistry.googleapis.com,cloudresourcemanager.googleapis.com,secretmanager.googleapis.com)
2. The following APIs must be enabled:
   - **Cloud Build API**
   - **Cloud Run API**
   - **Artifact Registry API**
   - **Cloud Resource Manager API**
   - **Secret Manager API**
3. Click **Enable** for each, or use the bulk-enable link above

---

## 4. Create an Artifact Registry repository

Cloud Build needs a Docker repository to store images.

1. Go to [**Artifact Registry > Repositories**](https://console.cloud.google.com/artifacts)
2. Click **Create Repository**
3. Configure:
   - **Name**: `cloud-run-source-deploy`
   - **Format**: Docker
   - **Mode**: Standard
   - **Region**: `us-east1`
4. Click **Create**

---

## 5. Grant IAM permissions to the Cloud Build service account

Cloud Build needs permission to deploy to Cloud Run, access Artifact Registry, and read secrets.

1. Go to [**Cloud Build > Settings**](https://console.cloud.google.com/cloud-build/settings)
2. Under **Service account permissions**, set the following roles to **Enabled**:
   - **Cloud Run Admin** — lets Cloud Build deploy services to Cloud Run
     - When prompted in the *Assign Service Account User Role* panel, click **Grant** to allow Cloud Build to act as the Cloud Run service account
   - **Artifact Registry Writer** — allows pulling and pushing images
   - **Cloud Storage Admin** — required for reading build artifacts
   - **Logs Writer** — allows writing to Cloud Logging

> **Docs**: [Required IAM permissions](https://docs.cloud.google.com/build/docs/deploying-builds/deploy-cloud-run#required_iam_permissions)

---

## 6. Create required secrets in Secret Manager

1. Go to [**Secret Manager**](https://console.cloud.google.com/security/secret-manager)
2. Click **Create Secret** for each of the following:

| Secret Name                  | Value                             |
|------------------------------|-----------------------------------|
| `SMTP_HOST`                  | `smtp.gmail.com`                  |
| `SMTP_PORT`                  | `587`                             |
| `SMTP_USER`                  | Gmail address for sending         |
| `SMTP_PASS`                  | Gmail App Password (16 chars)     |
| `CONTACT_DESTINATION_EMAIL`  | Inbox receiving contact form msgs |

1. For each secret:
   - Enter the **Name**
   - Enter the **Secret value** in the text field
   - Leave replication on **Automatic**
   - Click **Create Secret**

If a secret already exists, click it, then click **Add New Version** and enter the new value.

---

## 7. Deploy

Choose one of the two methods below.

### Method A — Continuous deployment via Cloud Build trigger

This is the recommended approach. Every new Git tag (e.g. `v1.2.3` from semantic-release) triggers an automatic build and deploy.

#### Connect your repository

1. Go to [**Cloud Build > Repositories**](https://console.cloud.google.com/cloud-build/repositories)
2. Click **Create Host Connection** (or **Link Repository** if a connection already exists)
3. Select **GitHub** and follow the OAuth flow to authorize access
4. After connecting, click **Link Repository** and select the `martech` repo

#### Create a build trigger

1. Go to [**Cloud Build > Triggers**](https://console.cloud.google.com/cloud-build/triggers)
2. Click **Create Trigger**
3. Configure:
   - **Name**: `martech-tag-deploy`
   - **Region**: `us-east1`
   - **Event**: Push new tag
   - **Source**: Select the connected `martech` repository
   - **Tag (regex)**: `^v.*`
   - **Configuration**: Cloud Build configuration file (repository)
   - **Cloud Build configuration file location**: `/cloudbuild.yaml`
4. Under **Substitution variables**, add:
   - `_SERVICE_NAME` = `martech`
   - `_REGION` = `us-east1`
5. Click **Create**

> **Docs**: [Create and manage build triggers](https://docs.cloud.google.com/build/docs/automating-builds/create-manage-triggers)

#### Fix an existing misconfigured trigger

If a trigger already exists but ignores `cloudbuild.yaml` from the repository (uses inline or autodetected config):

1. Go to [**Cloud Build > Triggers**](https://console.cloud.google.com/cloud-build/triggers)
2. Find the existing trigger and click **Edit**
3. Under **Configuration**, change the type to:
   - **Type**: Cloud Build configuration file
   - **Location**: Repository
   - **File location**: `/cloudbuild.yaml`
4. Under **Substitution variables**, verify:
   - `_SERVICE_NAME` = `martech`
   - `_REGION` = `us-east1`
5. Click **Save**
6. **Disable or delete** any other conflicting trigger for the same repository

---

### Method B — Manual one-time deploy from the Cloud Run console

Use this when you want to deploy a pre-built image directly, without Cloud Build triggers.

1. Go to [**Cloud Run**](https://console.cloud.google.com/run)
2. Click **Deploy Container** → **Service**
3. Select **Deploy one revision from an existing container image**
4. Enter the image URL:

   ```
   us-east1-docker.pkg.dev/YOUR_PROJECT_ID/cloud-run-source-deploy/martech:latest
   ```

5. Under **Service name**, enter `martech`
6. Under **Region**, select `us-east1`
7. Under **Authentication**, select **Allow unauthenticated invocations**
8. Click **Containers, Networking, Security** to expand advanced settings:
   - **Container port**: `8080`
   - **Memory**: `512 MiB`
   - **CPU**: `1`
9. Go to the **Secrets** tab and add each secret as an environment variable:
   - `SMTP_HOST` → secret `SMTP_HOST`, version `latest`
   - `SMTP_PORT` → secret `SMTP_PORT`, version `latest`
   - `SMTP_USER` → secret `SMTP_USER`, version `latest`
   - `SMTP_PASS` → secret `SMTP_PASS`, version `latest`
   - `CONTACT_DESTINATION_EMAIL` → secret `CONTACT_DESTINATION_EMAIL`, version `latest`
10. Click **Create** and wait for the deployment to finish
11. Click the displayed URL to verify the service is running

> **Docs**: [Deploying a new service](https://docs.cloud.google.com/run/docs/deploying#deploying_a_new_service)

---

## Make the service public (Allow unauthenticated invocations)

If your service should be publicly accessible, you can grant unauthenticated access from the Console.

- Using the Info Panel (recommended when managing permissions):

1. Go to **Cloud Run > Services** (the services list).
2. Check the checkbox next to `martech` (do not click the name).
3. If the Info Panel is not visible, click **Show info panel** (sidebar icon) in the top-right corner of the console.
4. In the Info Panel, open the **Permissions** tab.
5. Click **Add Principal**, enter `allUsers`, choose the **Cloud Run Invoker** role (`roles/run.invoker`), and click **Save**.
6. Confirm the "Allow public access" prompt if it appears.

- Using the Service Security settings (alternate):

1. Open the `martech` service.
2. Click **Edit and deploy new revision** (or the **Security** tab if present).
3. Under **Authentication**, select **Allow unauthenticated invocations** and click **Deploy** or **Save**.

---

## 8. Verify the deployment

1. Go to [**Cloud Run**](https://console.cloud.google.com/run)
2. Click the `martech` service
3. Confirm the latest revision shows a green checkmark and **100% traffic**
4. Click the **URL** at the top to open the live service
5. Check **Logs** for any startup errors

---

## Notes

### Deploying a new revision of an existing service

1. Go to [**Cloud Run**](https://console.cloud.google.com/run) and click the `martech` service
2. Click **Edit and deploy new revision**
3. Update the container image URL or configuration as needed
4. Select **Serve this revision immediately** for instant rollout, or clear it for a gradual rollout
5. Click **Deploy**

> Each configuration change creates an immutable new revision. Revisions can be rolled back from the **Revisions** tab.
