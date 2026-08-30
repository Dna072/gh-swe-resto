# API

Trusted Next.js Route Handlers. Provider credentials never appear in responses.

Phase 4 adds the kitchen board, persisted order transitions, and print tickets. Guest checkout remains from Phase 3. Payments remain Phase 5.

## Customer

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/menu` | Public catalog with server-resolved display prices |
| GET | `/api/menu/:slug` | One meal plus modifier groups |
| POST | `/api/cart/quote` | Server-priced cart |
| POST | `/api/delivery/check` | Postcode against seeded delivery zones |
| POST | `/api/marketing/signup` | Email + required consent (in-memory) |
| POST | `/api/analytics/track` | Storefront events |
| POST | `/api/delivery/quote` | Zone + mock-provider quote (fee from seed zones) |
| POST | `/api/orders` | Idempotent guest order create (`Idempotency-Key`) |
| GET | `/api/orders/:id` | Guest order (`?token=`) |
| GET | `/api/orders/lookup` | Lookup by `GH` number + token |
| POST | `/api/orders/:id/cancel` | Customer/admin cancel |
| POST | `/api/orders/:id/reorder` | Rebuild a cart from a snapshot |
| POST | `/api/payments/create` | Payment session |
| POST | `/api/payments/webhook` | Verified provider webhook |
| GET | `/api/delivery/:id` | Delivery status |

## Admin

All admin routes require a verified ID token and `AuthorizationService`.

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/admin/orders` | Kitchen/admin order list |
| GET | `/api/admin/orders/:id` | Staff order detail |
| PATCH | `/api/admin/orders/:id` | `send_to_kitchen` or validated status transition |
| POST | `/api/admin/orders/:id/print` | Enqueue / reprint kitchen ticket |
| POST | `/api/admin/media/cleanup` | Purge `PENDING_DELETE` photograph objects |
| POST | `/api/admin/orders/:id/refund` | Full or partial refund |
| GET | `/api/admin/menu` | Meals, categories, modifier groups |
| POST | `/api/admin/menu` | Create/update meal (metadata) |
| GET | `/api/admin/menu/:id` | One meal including image metadata |
| PUT | `/api/admin/menu/:id` | Update meal metadata |
| PATCH | `/api/admin/menu/:id` | Archive or restore |
| POST | `/api/admin/menu/:id/images` | Upload a real meal photograph |
| PUT | `/api/admin/menu/:id/images/:imageId` | Replace a photograph |
| PATCH | `/api/admin/menu/:id/images/:imageId` | Primary, remove (soft), or focal point |
| GET / PUT | `/api/admin/homepage` | Lightweight homepage content |
| POST | `/api/admin/homepage/hero-image` | Hero photograph (optional `mobile=true`) |

Local development may send `Authorization: Bearer $ADMIN_DEV_TOKEN`. Production requires a Firebase staff token with `menu:write` or `settings:write`. Image binaries go to Cloud Storage (or `public/uploads` in development). Firestore/in-memory records store metadata only.

## Errors

Clients receive a stable `{ code, message }` body. Stack traces, Firestore errors, and vendor payloads stay in Cloud Logging.

## Idempotency

`POST /api/orders` and payment/delivery creates require `Idempotency-Key`. Replays return the original resource.
