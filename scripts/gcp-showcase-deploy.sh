#!/usr/bin/env bash
# Deploy a team showcase to Cloud Run with Firestore + Cloud Storage.
# Payments and delivery stay mocked (Stripe and Wolt come later).
set -euo pipefail

PROJECT_ID="${GCP_PROJECT_ID:-${GOOGLE_CLOUD_PROJECT:-}}"
REGION="${GCP_REGION:-europe-north1}"
SERVICE="${SERVICE_NAME:-ghana-restaurant-showcase}"
REPOSITORY="${ARTIFACT_REPO:-apps}"
ADMIN_TOKEN="${ADMIN_DEV_TOKEN:-showcase-admin-token}"
BUCKET="${GCS_ASSETS_BUCKET:-${PROJECT_ID:-}-resto-assets}"

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

resolve_gcloud_account() {
  local configured
  configured="$(gcloud config get-value account 2>/dev/null || true)"
  if [[ -n "${configured}" && "${configured}" != "(unset)" ]]; then
    printf '%s' "${configured}"
    return 0
  fi
  gcloud auth list --format='value(account)' 2>/dev/null | head -n 1 || true
}

ACCOUNT="$(resolve_gcloud_account)"
if [[ -n "${ACCOUNT}" ]]; then
  gcloud config set account "${ACCOUNT}" >/dev/null
fi

if ! gcloud auth print-access-token >/dev/null 2>&1; then
  echo "gcloud has no usable credentials yet. Starting login in this terminal…"
  echo "Complete the Cloud Shell / browser prompt, then the deploy will continue."
  gcloud auth login --update-adc
  ACCOUNT="$(resolve_gcloud_account)"
  if [[ -n "${ACCOUNT}" ]]; then
    gcloud config set account "${ACCOUNT}" >/dev/null
  fi
  gcloud config set project "${PROJECT_ID}" >/dev/null
fi

if ! gcloud auth print-access-token >/dev/null 2>&1; then
  echo "Still no gcloud access token after login." >&2
  echo "In this Cloud Shell, run these two commands yourself:" >&2
  echo "  gcloud auth login --update-adc" >&2
  echo "  gcloud auth list" >&2
  echo "You should see one account marked ACTIVE. Then re-run:" >&2
  echo "  GCP_PROJECT_ID=${PROJECT_ID} ./scripts/gcp-showcase-deploy.sh" >&2
  exit 1
fi

echo "Using gcloud account: $(gcloud config get-value account 2>/dev/null)"

echo "Enabling APIs in ${PROJECT_ID} (${REGION})…"
gcloud services enable \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com \
  logging.googleapis.com \
  monitoring.googleapis.com \
  firebase.googleapis.com \
  firestore.googleapis.com \
  firebaserules.googleapis.com \
  identitytoolkit.googleapis.com \
  storage.googleapis.com \
  --project "${PROJECT_ID}"

echo "Adding Firebase to the GCP project (safe if it is already linked)…"
TOKEN="$(gcloud auth print-access-token)"
ADD_FIREBASE_STATUS="$(curl -sS -o /tmp/add-firebase.json -w '%{http_code}' \
  -X POST \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -H "X-Goog-User-Project: ${PROJECT_ID}" \
  "https://firebase.googleapis.com/v1beta1/projects/${PROJECT_ID}:addFirebase" || true)"
if [[ "${ADD_FIREBASE_STATUS}" != "200" && "${ADD_FIREBASE_STATUS}" != "409" && "${ADD_FIREBASE_STATUS}" != "400" ]]; then
  echo "Could not auto-link Firebase (HTTP ${ADD_FIREBASE_STATUS})." >&2
  echo "Open https://console.firebase.google.com/ and add Firebase to ${PROJECT_ID}, then re-run." >&2
  cat /tmp/add-firebase.json >&2 || true
fi

if ! gcloud firestore databases describe --database="(default)" --project="${PROJECT_ID}" >/dev/null 2>&1; then
  echo "Creating Firestore Native database in ${REGION}…"
  gcloud firestore databases create \
    --database="(default)" \
    --location="${REGION}" \
    --type=firestore-native \
    --project="${PROJECT_ID}"
fi

if ! gcloud storage buckets describe "gs://${BUCKET}" --project="${PROJECT_ID}" >/dev/null 2>&1; then
  echo "Creating photo bucket gs://${BUCKET}…"
  gcloud storage buckets create "gs://${BUCKET}" \
    --project="${PROJECT_ID}" \
    --location="${REGION}" \
    --uniform-bucket-level-access
fi
gcloud storage buckets add-iam-policy-binding "gs://${BUCKET}" \
  --member=allUsers \
  --role=roles/storage.objectViewer \
  --quiet >/dev/null

PROJECT_NUMBER="$(gcloud projects describe "${PROJECT_ID}" --format='value(projectNumber)')"
CLOUD_BUILD_SA="${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com"
COMPUTE_SA="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"
gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
  --member="serviceAccount:${COMPUTE_SA}" \
  --role="roles/datastore.user" \
  --quiet >/dev/null
gcloud storage buckets add-iam-policy-binding "gs://${BUCKET}" \
  --member="serviceAccount:${COMPUTE_SA}" \
  --role="roles/storage.objectAdmin" \
  --quiet >/dev/null

if ! gcloud artifacts repositories describe "${REPOSITORY}" \
  --location="${REGION}" --project="${PROJECT_ID}" >/dev/null 2>&1; then
  echo "Creating Artifact Registry repository ${REPOSITORY}…"
  gcloud artifacts repositories create "${REPOSITORY}" \
    --repository-format=docker \
    --location="${REGION}" \
    --description="Ghana Restaurant container images" \
    --project="${PROJECT_ID}"
fi
for SA in "${CLOUD_BUILD_SA}" "${COMPUTE_SA}"; do
  gcloud artifacts repositories add-iam-policy-binding "${REPOSITORY}" \
    --location="${REGION}" \
    --project="${PROJECT_ID}" \
    --member="serviceAccount:${SA}" \
    --role="roles/artifactregistry.writer" \
    --quiet >/dev/null
done

echo "Deploying Firestore and Storage rules…"
if npx --yes firebase-tools@latest deploy \
  --only firestore:rules,firestore:indexes,storage \
  --project "${PROJECT_ID}" \
  --non-interactive; then
  echo "Firebase rules deployed."
else
  echo "Rules deploy skipped or failed. Run after firebase login:" >&2
  echo "  npx firebase-tools deploy --only firestore:rules,firestore:indexes,storage --project ${PROJECT_ID}" >&2
fi

IMAGE="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPOSITORY}/${SERVICE}:$(git rev-parse --short HEAD 2>/dev/null || echo latest)"
echo "Building ${IMAGE}…"
echo "If Cloud Build fails, open the log URL it prints — the terminal only shows that Docker step 0 exited 1."
if ! gcloud builds submit \
  --project "${PROJECT_ID}" \
  --config cloudbuild.yaml \
  --substitutions="_IMAGE=${IMAGE}"; then
  echo "Image build failed. The one-line Docker error is not the cause." >&2
  echo "Print the compiler output:" >&2
  echo "  gcloud builds log --project=${PROJECT_ID} \$(gcloud builds list --project=${PROJECT_ID} --limit=1 --format='value(id)')" >&2
  echo "Then pull the latest deploy fix and re-run:" >&2
  echo "  git fetch origin && git pull" >&2
  echo "  GCP_PROJECT_ID=${PROJECT_ID} ./scripts/gcp-showcase-deploy.sh" >&2
  exit 1
fi

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
  --max-instances 2 \
  --timeout 60 \
  --port 8080 \
  --allow-unauthenticated \
  --set-env-vars "NODE_ENV=production,APP_ENV=staging,DATA_STORE=firestore,PAYMENT_PROVIDER=mock,DELIVERY_PROVIDER=mock,EMAIL_PROVIDER=mock,ADMIN_DEV_TOKEN=${ADMIN_TOKEN},DEFAULT_RESTAURANT_ID=uppsala-main,FIREBASE_PROJECT_ID=${PROJECT_ID},GOOGLE_CLOUD_PROJECT=${PROJECT_ID},GCS_ASSETS_BUCKET=${BUCKET}"

URL="$(gcloud run services describe "${SERVICE}" --project "${PROJECT_ID}" --region "${REGION}" --format='value(status.url)')"
gcloud run services update "${SERVICE}" \
  --project "${PROJECT_ID}" \
  --region "${REGION}" \
  --update-env-vars "APP_BASE_URL=${URL}" \
  --quiet

echo "Seeding the demo menu into Firestore…"
# Do not send Authorization here. Cloud Run treats that header as a Google
# identity token and returns HTML 401 before Next.js can read ADMIN_DEV_TOKEN.
SEED_STATUS="$(curl -sS -o /tmp/seed.json -w '%{http_code}' \
  -X POST "${URL}/api/admin/seed" \
  -H "X-Admin-Token: ${ADMIN_TOKEN}" || true)"
echo "Seed HTTP ${SEED_STATUS}: $(cat /tmp/seed.json 2>/dev/null || true)"
if [[ "${SEED_STATUS}" != "200" ]]; then
  echo "Automatic seed did not finish. After this revision is serving, either:" >&2
  echo "  curl -X POST ${URL}/api/admin/seed -H 'X-Admin-Token: ${ADMIN_TOKEN}'" >&2
  echo "or open ${URL}/admin, paste the token, and click Seed demo menu." >&2
fi

echo
echo "Showcase URL: ${URL}"
echo "Health:       ${URL}/api/health"
echo "Admin:        ${URL}/admin"
echo "Kitchen:      ${URL}/kitchen"
echo
echo "Paste this admin token on /admin (not auto-filled on Cloud Run):"
echo "  ${ADMIN_TOKEN}"
echo
echo "Firestore holds the menu and orders. Photos go to gs://${BUCKET}."
echo "Stripe and Wolt stay mocked until you add those keys."
