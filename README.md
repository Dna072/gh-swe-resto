# Ghana Restaurant

Production-grade online ordering and operations platform for a Ghanaian restaurant launching in Uppsala, Sweden.

This is not a marketing site. It is a modular monolith for menu, cart, guest checkout, payments, delivery, kitchen operations, and administration — hosted on Google Cloud Platform.

**Current status:** Phase 2 customer menu and cart. Homepage, `/menu`, meal customisation, and a server-quoted cart. Checkout is Phase 3.

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
2. Customer menu and cart UI — **this release**
3. Delivery and checkout
4. Orders, kitchen, printing
5. Payments
6. Live delivery providers
7. Tracking
8. Admin CMS
9. Notifications
10. Analytics and hardening

The public catalog is a demo seed (`src/infrastructure/seed/ghana-menu.ts`) until admin CMS lands.
