#!/usr/bin/env bash
# Deploy a team showcase to Cloud Run. Uses the in-memory catalog and mock
# payments — no Firebase, Stripe, or Wolt project is required.
set -euo pipefail

PROJECT_ID="${GCP_PROJECT_ID:-${GOOGLE_CLOUD_PROJECT:-}}"
REGION="${GCP_REGION:-europe-north1}"
SERVICE="${SERVICE_NAME:-ghana-restaurant-showcase}"
REPOSITORY="${ARTIFACT_REPO:-apps}"
ADMIN_TOKEN="${ADMIN_DEV_TOKEN:-showcase-admin-token}"

if [[ -z "${PROJECT_ID}" ]]; then
  echo "Set GCP_PROJECT_ID to your Google Cloud project id." >&2
  echo "Example: GCP_PROJECT_ID=my-project-123 ./scripts/gcp-showcase-deploy.sh" >&2
  exit 1
fi

if ! command -v gcloud >/dev/null 2>&1; then
  echo "Install the Google Cloud CLI: https://cloud.google.com/sdk/docs/install" >&2
  exit 1
fi

gcloud config set project "${PROJECT_ID}"
ACCOUNT="$(gcloud config get-value account 2>/dev/null || true)"
if [[ -z "${ACCOUNT}" || "${ACCOUNT}" == "(unset)" ]]; then
  echo "Run: gcloud auth login" >&2
  exit 1
fi

echo "Enabling APIs in ${PROJECT_ID} (${REGION})…"
gcloud services enable \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com \
  logging.googleapis.com \
  monitoring.googleapis.com \
  --project "${PROJECT_ID}"

if ! gcloud artifacts repositories describe "${REPOSITORY}" \
  --location="${REGION}" --project="${PROJECT_ID}" >/dev/null 2>&1; then
  echo "Creating Artifact Registry repository ${REPOSITORY}…"
  gcloud artifacts repositories create "${REPOSITORY}" \
    --repository-format=docker \
    --location="${REGION}" \
    --description="Ghana Restaurant container images" \
    --project="${PROJECT_ID}"
fi

PROJECT_NUMBER="$(gcloud projects describe "${PROJECT_ID}" --format='value(projectNumber)')"
CLOUD_BUILD_SA="${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com"
COMPUTE_SA="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"
for SA in "${CLOUD_BUILD_SA}" "${COMPUTE_SA}"; do
  gcloud artifacts repositories add-iam-policy-binding "${REPOSITORY}" \
    --location="${REGION}" \
    --project="${PROJECT_ID}" \
    --member="serviceAccount:${SA}" \
    --role="roles/artifactregistry.writer" \
    --quiet >/dev/null
done

IMAGE="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPOSITORY}/${SERVICE}:$(git rev-parse --short HEAD 2>/dev/null || echo latest)"
echo "Building ${IMAGE}…"
gcloud builds submit \
  --project "${PROJECT_ID}" \
  --config cloudbuild.yaml \
  --substitutions="_IMAGE=${IMAGE}"

echo "Deploying Cloud Run service ${SERVICE}…"
gcloud run deploy "${SERVICE}" \
  --project "${PROJECT_ID}" \
  --image "${IMAGE}" \
  --region "${REGION}" \
  --platform managed \
  --cpu 1 \
  --memory 512Mi \
  --concurrency 80 \
  --min-instances 0 \
  --max-instances 1 \
  --timeout 60 \
  --port 8080 \
  --allow-unauthenticated \
  --set-env-vars "NODE_ENV=production,APP_ENV=staging,PAYMENT_PROVIDER=mock,DELIVERY_PROVIDER=mock,EMAIL_PROVIDER=mock,ADMIN_DEV_TOKEN=${ADMIN_TOKEN},DEFAULT_RESTAURANT_ID=uppsala-main"

URL="$(gcloud run services describe "${SERVICE}" --project "${PROJECT_ID}" --region "${REGION}" --format='value(status.url)')"
gcloud run services update "${SERVICE}" \
  --project "${PROJECT_ID}" \
  --region "${REGION}" \
  --update-env-vars "APP_BASE_URL=${URL}" \
  --quiet

echo
echo "Showcase URL: ${URL}"
echo "Health:       ${URL}/api/health"
echo "Admin:        ${URL}/admin"
echo "Kitchen:      ${URL}/kitchen"
echo
echo "Paste this admin token on /admin (not auto-filled on Cloud Run):"
echo "  ${ADMIN_TOKEN}"
echo
echo "In-memory catalog: orders and uploads reset when the instance scales to zero."
