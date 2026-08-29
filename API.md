# API

Trusted Next.js Route Handlers. Provider credentials never appear in responses.

Phase 2 ships the public catalog, cart quote, and delivery-area check. Checkout and payments remain Phase 3+.

## Customer

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/menu` | Public catalog with server-resolved display prices |
| GET | `/api/menu/:slug` | One meal plus modifier groups |
| POST | `/api/cart/quote` | Server-priced cart |
| POST | `/api/delivery/check` | Postcode against seeded delivery zones |
| POST | `/api/marketing/signup` | Email + required consent (in-memory) |
| POST | `/api/analytics/track` | Storefront events |
| POST | `/api/delivery/quote` | Zone + provider quote (Phase 3) |
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
