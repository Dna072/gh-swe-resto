# Deployment

Next.js standalone image → Artifact Registry → Cloud Run in `europe-north1`.

The storefront, checkout, kitchen board, and admin run as **one Cloud Run service**. Menu and orders persist in **Cloud Firestore**. Meal photographs persist in **Cloud Storage**. Stripe and Wolt stay mocked until you add those keys.

## Team showcase (fastest path)

### What we need from you

| Item | Required? | Why |
| --- | --- | --- |
| A GCP project id with **billing enabled** | **Yes** | Cloud Run, Firestore, Cloud Storage, and Cloud Build bill here |
| Permission to enable APIs and deploy | **Yes** | Owner, or Editor plus Service Usage Admin |
| `gcloud` installed and `gcloud auth login` | **Yes** | The script uses your user credentials |
| One visit to [Firebase console](https://console.firebase.google.com/) if the script cannot auto-link Firebase | Maybe | Google sometimes requires you to accept Firebase terms on a new project |
| `npx firebase-tools login` if rules deploy fails | Maybe | Deploys `firestore.rules`, indexes, and `storage.rules` |
| A token the team will paste on `/admin` | Optional | Defaults to `showcase-admin-token` |
| Stripe / Wolt | **No** | Still mocked. We will wire them when you have sandbox keys |

The agent cannot create a GCP project, enable billing, or accept Firebase terms on your account. After you have a project id, run the script (or share the id and we can retry if this environment has `gcloud` auth).

### Deploy

```bash
gcloud auth login
GCP_PROJECT_ID=your-project-id ./scripts/gcp-showcase-deploy.sh
```

Optional:

```bash
export GCP_REGION=europe-north1
export ADMIN_DEV_TOKEN='a-team-only-token'
export SERVICE_NAME=ghana-restaurant-showcase
```

The script enables APIs, creates the `apps` Artifact Registry repo if needed, builds the image, and deploys Cloud Run.

If Cloud Build reports `build step 0 "gcr.io/cloud-builders/docker" failed`, Firebase rules already deployed — only the container image failed. Open the Cloud Build log URL from the terminal (not just the one-line summary). Common causes:

- Default Cloud Build machine ran out of memory or hit the 10-minute timeout while installing `firebase-tools` or tracing the Next.js standalone output
- An older clone of this repo (pull `main` / this PR, then re-run the script)

This repo now uses a larger Cloud Build machine, omits emulator-only packages from the image, and keeps Next.js file tracing off the whole working directory.

After it finishes you get:

- Storefront URL
- `/api/health`
- `/admin` and `/kitchen` — paste the admin token (Cloud Run does **not** auto-fill it)

### Showcase behaviour

| Setting | Value | Reason |
| --- | --- | --- |
| `APP_ENV` | `staging` | Allows an admin token; production rejects `ADMIN_DEV_TOKEN` |
| `DATA_STORE` | `firestore` | Menu, orders, and homepage persist across instances |
| Payments / delivery / email | mock | Stripe and Wolt later |
| Max instances | 2 | Shared Firestore; still cost-capped |
| Min instances | 0 | Scale to zero overnight |
| CPU / memory | 1 / 512Mi | Cost-safe default |

The script creates a Firestore Native database, a photo bucket (`{project}-resto-assets`), deploys rules when Firebase CLI can, and seeds the demo menu via `POST /api/admin/seed`.

## Cloud Run settings (later environments)

| Setting | Showcase | Staging / production default |
| --- | --- | --- |
| CPU | 1 | 1 |
| Memory | 512Mi | 512Mi |
| Concurrency | 80 | 80 |
| Min instances | 0 | 0 |
| Max instances | 1 | 5 |
| Timeout | 60s | 60s |
| Port | 8080 | 8080 |

Raise max instances only after monitoring. Never leave it unlimited.

## Secrets (production)

Mount from Secret Manager when you leave the mock providers:

- `FIREBASE_PRIVATE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `WOLT_DRIVE_API_KEY`
- SMTP credentials

Public Firebase web config may be `NEXT_PUBLIC_*`. Do not put admin credentials in `NEXT_PUBLIC_*`.

`/api/admin/local-session` only returns a bootstrap token on a local machine. Cloud Run never publishes `ADMIN_DEV_TOKEN`.

## CI

`.github/workflows/ci.yml` runs lint, typecheck, unit tests, Firestore rules tests, and a production build.

`.github/workflows/deploy.yml` deploys only on explicit **workflow_dispatch** (`showcase`, `staging`, or `production`) after GitHub is connected to GCP.

GitHub environment secrets (when you want Actions to deploy):

- `GCP_PROJECT_ID`
- `GCP_WORKLOAD_IDENTITY_PROVIDER`
- `GCP_DEPLOY_SERVICE_ACCOUNT`
- `ADMIN_DEV_TOKEN` (showcase/staging only)

Optional variable: `GCP_REGION` (default `europe-north1`).

## First-time production GCP (later)

1. Create `ghana-restaurant-dev|staging|prod` Firebase projects.
2. Enable Firestore Native, Auth, Storage, Artifact Registry, Cloud Run, Secret Manager, Cloud Tasks, Cloud Logging, Cloud Monitoring.
3. Create a deploy service account (Run admin, Artifact Registry writer, Secret accessor).
4. Connect GitHub via Workload Identity Federation.
5. `firebase deploy --only firestore:rules,firestore:indexes,storage --project <env>`.
6. Deploy Cloud Run from the workflow with `APP_ENV=production` and a GCS bucket for photographs.

## Rollback

- Cloud Run: route traffic to the previous revision.
- Firestore (when in use): restore the last daily export (see OPERATIONS.md).
- Rules: redeploy the previous `firestore.rules` from git.

## Environments

Never share Firestore databases across environments. Never use production Stripe or Wolt keys in development or showcase.
