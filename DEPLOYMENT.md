# Deployment

## Target

Next.js standalone image → Artifact Registry → Cloud Run in `europe-north1`.

Firebase project and Cloud Run service are environment-specific. Local machines use the emulator.

## Cloud Run settings (cost-safe defaults)

| Setting | Value |
| --- | --- |
| CPU | 1 |
| Memory | 512Mi |
| Concurrency | 80 |
| Min instances | 0 |
| Max instances | 5 |
| Timeout | 60s |
| Port | 8080 |
| CPU boost | optional for cold start |

Raise max instances only after monitoring. Never leave it unlimited.

## Secrets

Mount from Secret Manager, for example:

- `FIREBASE_PRIVATE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `WOLT_DRIVE_API_KEY`
- SMTP credentials

Public Firebase web config may be `NEXT_PUBLIC_*`. Admin credentials must not.

## CI

`.github/workflows/ci.yml` runs lint, typecheck, unit tests, Firestore rules tests, and production build.

`.github/workflows/deploy.yml` deploys only on explicit `workflow_dispatch` after GCP Workload Identity is configured. Push to `main` does not auto-deploy until those secrets exist.

## First-time GCP

1. Create `ghana-restaurant-dev|staging|prod` Firebase projects.
2. Enable Firestore Native, Auth, Storage, Artifact Registry, Cloud Run, Secret Manager, Cloud Tasks, Cloud Logging, Cloud Monitoring.
3. Create a deploy service account with least privilege (Run admin, Artifact Registry writer, Secret accessor).
4. Connect GitHub via Workload Identity Federation.
5. Deploy rules: `firebase deploy --only firestore:rules,firestore:indexes,storage --project <env>`.
6. Deploy the Cloud Run service from the workflow.

## Rollback

- Cloud Run: traffic to the previous revision.
- Firestore: restore the last daily export (see OPERATIONS.md).
- Rules: redeploy the previous `firestore.rules` from git.

## Environments

Never share Firestore databases across environments. Never use production Stripe or Wolt keys in development.
