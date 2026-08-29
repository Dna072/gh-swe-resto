# Architecture

Ghana Restaurant is a **modular monolith**. One Next.js application on Cloud Run owns the customer site, admin APIs, and trusted server logic.

```
Browser / kitchen tablet
        │
        ▼
   Cloud Run (Next.js)
        │
        ├── Firebase Auth
        ├── Firestore          transactional data
        ├── Cloud Storage      images and generated files
        ├── Secret Manager
        ├── Cloud Tasks        notifications, print, provider retries
        └── Pub/Sub            analytics events (later → BigQuery)
```

## Why this shape

- One restaurant, one codebase, low operating cost.
- Server-authoritative pricing, inventory, promotions, and order transitions.
- Repository and provider interfaces keep Firestore, Stripe, and Wolt out of domain services.
- Selective realtime (kitchen board, live tracking) — not menu browsing.

## Domain map

```
src/domains
  auth            RBAC, actors, authorization
  customers       profiles, GDPR export
  menu            categories, items, modifiers
  cart            server quotes
  pricing         weekday/weekend and modifier math
  promotions      codes, limits, stacking guards
  inventory       portion reservations
  orders          state machine, snapshots, guest access
  payments        PaymentProvider + webhook idempotency
  delivery        DeliveryProvider + zone/quote selection
  notifications   email now, SMS/WhatsApp later
  printing        PrintJob + ticket payload
  analytics       product events + contribution margin
  memberships     plan/benefit/loyalty placeholders (no billing)
```

Business services depend on interfaces. Firestore implementations live in `src/infrastructure/firestore`. In-memory implementations exist for tests.

## Request flow

1. Customer browses a cached/SSR menu (no realtime listener).
2. `CartService` prices lines from current menu data.
3. Checkout calls `OrderService.create` with an idempotency key.
4. A transaction reserves inventory, records promotion usage, and writes the order snapshot.
5. `PaymentService` creates a provider session. Webhooks mark the order paid.
6. Kitchen staff transition the order through the state machine via server APIs.
7. `DeliveryService` creates a courier job through the selected provider.
8. Tracking uses a bounded realtime listener on that order only.

## Environments

| Name | Firebase project | Notes |
| --- | --- | --- |
| development | emulator or `ghana-restaurant-dev` | default |
| staging | `ghana-restaurant-staging` | Stripe test, mock/Wolt sandbox |
| production | `ghana-restaurant-prod` | Secret Manager only |

## Unresolved questions

See the Phase 0 report in the pull request. The architecture is ready for Phase 1 without answering them.
