# API

Trusted Next.js Route Handlers. Provider credentials never appear in responses.

Guest checkout, customer accounts, payment, live tracking, promotions, restaurant pause, staff invites, and branded transactional email are wired. The mock payment provider confirms locally. Stripe is used when `PAYMENT_PROVIDER=stripe` and keys are set. Delivery webhooks update order and delivery status. Emails go through `NotificationService` (Amazon SES when `EMAIL_PROVIDER=ses`, otherwise mock).

## Customer

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/menu` | Public catalog with server-resolved display prices |
| GET | `/api/menu/:slug` | One meal plus modifier groups |
| POST | `/api/cart/quote` | Server-priced cart |
| POST | `/api/delivery/check` | Postcode against restaurant delivery areas |
| POST | `/api/marketing/signup` | Email + required consent (in-memory) |
| POST | `/api/analytics/track` | Storefront events |
| POST | `/api/delivery/quote` | Zone + mock-provider quote (fee from seed zones) |
| POST | `/api/orders` | Idempotent order create (`Idempotency-Key`). Signed-in customers send `X-Customer-Token` so the order is attached to the account |
| GET | `/api/orders/:id` | Order (`?token=` guest, or `X-Customer-Token`) |
| GET | `/api/orders/lookup` | Lookup by `GH` number + token |
| POST | `/api/orders/:id/cancel` | Customer/admin cancel |
| POST | `/api/orders/:id/pay` | Guest payment (mock succeeds; Stripe session when configured) |
| POST | `/api/orders/:id/reorder` | Rebuild a cart from a snapshot |
| POST | `/api/orders/:id/review` | Signed-in customer review of a delivered order |
| POST | `/api/account/register` | Create a customer account and send a welcome email |
| POST | `/api/account/login` | Local/memory password login (Firebase client is used when configured) |
| POST | `/api/account/password-reset` | Branded reset email (does not reveal whether the address exists) |
| GET | `/api/account/me` | Current customer profile |
| GET | `/api/account/orders` | Order history, current orders, and review state |
| POST | `/api/payments/webhook` | Verified provider webhook (`x-mock-signature` for mock) |
| GET | `/api/delivery/:id` | Delivery status (`?token=` or `X-Customer-Token` — order id or provider delivery id) |

## Admin

All admin routes require a verified ID token and `AuthorizationService`.

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/admin/orders` | Kitchen/admin order list |
| GET | `/api/admin/orders/:id` | Staff order detail |
| PATCH | `/api/admin/orders/:id` | `send_to_kitchen`, `claim`, or validated status transition |
| POST | `/api/admin/orders/:id/print` | Enqueue / reprint kitchen ticket |
| POST | `/api/admin/orders/:id/refund` | Full refund of a paid order (emails `ORDER_REFUNDED`) |
| GET / POST | `/api/admin/staff` | List staff; invite OWNER/MANAGER/KITCHEN/… (sends SES invite) |
| GET / POST | `/api/admin/bootstrap-owner` | One-time first OWNER using `ADMIN_DEV_TOKEN` (locked after success) |
| GET / PUT | `/api/admin/restaurant-settings` | Pause or resume ordering |
| GET / PUT | `/api/admin/promotions` | List and save promotion codes |
| GET / PUT | `/api/admin/delivery-settings` | Last-mile providers and customer delivery pricing |
| GET / PUT | `/api/admin/delivery-zones` | Delivery areas (postcodes guests can order from) |
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
| POST | `/api/admin/media/cleanup` | Purge `PENDING_DELETE` photograph objects |

Local development may send `Authorization: Bearer $ADMIN_DEV_TOKEN`. Production accepts that token only for `POST /api/admin/bootstrap-owner`, and only until the first owner exists. All other production admin APIs require a Firebase staff token.

## Errors

Clients receive a stable `{ code, message }` body. Stack traces, Firestore errors, and vendor payloads stay in Cloud Logging.

## Idempotency

`POST /api/orders` and payment/delivery creates require `Idempotency-Key`. Replays return the original resource.
