# Security

## Principles

- Sensitive mutations run on Cloud Run with the Firebase Admin SDK.
- Firestore rules are a second control plane, not the only one.
- Frontend role checks are never authorization.
- Secrets stay in Secret Manager or local env files that are not committed.
- Guest orders are protected by an unguessable access token. The raw token is not stored; only `sha256` is persisted.

## Authentication

Firebase Authentication:

- Email/password, verification, password reset
- Account deletion through a trusted API (Phase 8+)
- Google/Apple later
- Guest checkout without an account

Admin SDK runs only on the server. Custom claims:

```
{ role: "OWNER" | "MANAGER" | "KITCHEN" | "DISPATCHER" | "FINANCE" | "MARKETING", restaurantId }
```

Customers have no staff claim. Missing claim is treated as `CUSTOMER`.

## RBAC

| Permission | OWNER | MANAGER | KITCHEN | DISPATCHER | FINANCE | MARKETING |
| --- | --- | --- | --- | --- | --- | --- |
| orders:transition | ✓ | ✓ | ✓ | ✓ | | |
| orders:refund | ✓ | ✓ | | | ✓ | |
| menu:write | ✓ | ✓ | | | | |
| inventory:adjust | ✓ | ✓ | ✓ | | | |
| promotions:write | ✓ | ✓ | | | | ✓ |
| payments:read | ✓ | ✓ | | | ✓ | |
| users:write | ✓ | | | | | |

Enforced by `AuthorizationService` on every admin API.

## Firestore rules

Customers can read their own customer doc and orders where `customerId == uid`.

Nobody can write from the client to:

- orders
- payments
- inventory
- promotions
- counters
- audit logs
- idempotency keys
- webhook receipts

Kitchen can read orders and inventory. Finance can read payments. Marketing cannot read payments.

Rules are tested in `tests/rules/firestore.rules.test.ts`.

## Guest access

`GET /api/orders/:id` (Phase 4) will require either:

- a signed-in customer that owns the order, or
- `accessToken` that hashes to `order.accessTokenHash`

Sequential Firestore IDs are never shown.

## Payments

- No raw card data
- Webhook signatures verified
- Event ids stored for duplicate protection
- Idempotency keys on create and refund

## HTTP

Next.js sets `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, and a baseline CSP.

## GDPR

- Collect only checkout and account fields that are needed
- Account deletion and export methods exist on `CustomerService`
- Privacy and terms routes belong to later UI phases
- Audit logs avoid storing full addresses or emails when an id is enough

## Rate limiting

Application-level limiting will sit on checkout, payment, and login routes in Phase 3–5. Cloud Armor / Cloud Run max instances already cap cost spikes.
