# API

Trusted Next.js Route Handlers. Provider credentials never appear in responses.

Phase 0 ships `/api/health` only. The contracts below are the Phase 3–8 surface.

## Customer

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/api/cart/quote` | Server-priced cart |
| POST | `/api/delivery/quote` | Zone + provider quote |
| POST | `/api/orders` | Idempotent order create |
| GET | `/api/orders/:id` | Tracking (token or session) |
| POST | `/api/orders/:id/cancel` | Customer/admin cancel |
| POST | `/api/orders/:id/reorder` | Rebuild a cart from a snapshot |
| POST | `/api/payments/create` | Payment session |
| POST | `/api/payments/webhook` | Verified provider webhook |
| GET | `/api/delivery/:id` | Delivery status |

## Admin

All admin routes require a verified ID token and `AuthorizationService`.

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/admin/orders` | Paginated, filtered |
| PATCH | `/api/admin/orders/:id` | Validated status transition |
| POST | `/api/admin/orders/:id/print` | Enqueue print job |
| POST | `/api/admin/orders/:id/refund` | Full or partial refund |

## Errors

Clients receive a stable `{ code, message }` body. Stack traces, Firestore errors, and vendor payloads stay in Cloud Logging.

## Idempotency

`POST /api/orders` and payment/delivery creates require `Idempotency-Key`. Replays return the original resource.
