# Meridian Fusion Cuisine

Production-grade online ordering and operations platform for Meridian Fusion Cuisine in Uppsala, Sweden. The kitchen starts with Ghanaian plates and will add more meals over time.

This is not a marketing site. It is a modular monolith for menu, cart, guest checkout, payments, delivery, kitchen operations, and administration — hosted on Google Cloud Platform.

**Current status:** Phases 7–9. Guests can track live order status, apply promotion codes, and see when the kitchen has paused ordering. Staff can pause the storefront, manage promotions, refund paid orders, and follow courier tracking links. Status emails are queued through the notification service (mock email locally).

Meal photographs must be real kitchen photos uploaded by an admin. The storefront never ships AI-generated food. Until a photograph is uploaded, customers see a branded “Photo coming soon” treatment.

## Stack

| Layer | Choice |
| --- | --- |
| App | Next.js 16, TypeScript, React 19, Tailwind CSS 4 |
| Database | Cloud Firestore (single transactional source of truth) |
| Auth | Firebase Authentication |
| Hosting | Cloud Run (scale to zero, max instance cap) |
| Files | Cloud Storage |
| Secrets | Secret Manager |
| Async | Cloud Tasks / Pub/Sub |
| Payments | `PaymentProvider` → Stripe adapter (sandbox until tested) |
| Delivery | `DeliveryProvider` → Wolt Drive boundary + Foodora stub |

Do **not** introduce Neon, Supabase, AWS, Azure, Cloud SQL, or GKE in this phase.

## Local setup

Requirements: Node 22, Java 21 (Firestore emulator), npm.

```bash
cp .env.example .env.local
npm install
npm run emulators   # in a second terminal
npm run dev
```

Never point local development at a production Firebase project.

## GCP showcase

The same app runs on Cloud Run for a team demo. Firestore holds the menu and orders; Cloud Storage holds photographs. Payments and delivery stay mocked until Stripe and Wolt keys exist. You need a GCP project with billing enabled, then:

```bash
gcloud auth login
GCP_PROJECT_ID=your-project-id ./scripts/gcp-showcase-deploy.sh
```

See [DEPLOYMENT.md](DEPLOYMENT.md) for what we need from you and for GitHub Actions deploy.

Useful commands:

```bash
npm run lint
npm run typecheck
npm test
npm run test:rules
npm run build
```

## Documentation

- [DESIGN.md](DESIGN.md)
- [ARCHITECTURE.md](ARCHITECTURE.md)
- [DATABASE.md](DATABASE.md)
- [SECURITY.md](SECURITY.md)
- [DEPLOYMENT.md](DEPLOYMENT.md)
- [API.md](API.md)
- [TESTING.md](TESTING.md)
- [OPERATIONS.md](OPERATIONS.md)
- [COSTS.md](COSTS.md)
- [ADR/](ADR/)

## Phase plan

0. Architecture, Firestore, security, providers, CI
1. Design system
2. Customer menu and cart UI
3. Delivery and checkout
4. Orders, kitchen, printing
5. Payments
6. Live delivery providers
7. Tracking — **this release**
8. Admin CMS — **this release**
9. Notifications — **this release**
10. Analytics and hardening

The public catalog is a demo seed (`src/infrastructure/seed/ghana-menu.ts`). Admins can edit meals, homepage copy, photographs, delivery pricing, promotions, and pause ordering at `/admin`. Local development applies `ADMIN_DEV_TOKEN` automatically (`dev-admin-token` unless you set another). Uploaded photographs persist in `data/local-catalog.json` and are served from `/api/media`.
