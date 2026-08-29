# Database

**Engine:** Cloud Firestore (Native).  
**Source of truth:** Firestore only. PostgreSQL is not implemented.  
**Schema version:** `1` (`src/domains/shared/types.ts`).

Money is stored as integer **öre**. `129 SEK = 12900`.

## Access patterns

| Need | Query | Bound |
| --- | --- | --- |
| Public menu | `restaurants/{id}/menuItems` ordered by `displayOrder` | 50 |
| Item by slug | `slug ==` | 1 |
| Featured meals | `isFeatured == true` | 8–12 |
| Guest order | Server lookup by id + hashed access token | 1 |
| Member orders | `customerId ==` + `createdAt desc` | 20 |
| Kitchen board | `restaurantId + orderStatus + createdAt` | today's open orders, paginated |
| Admin orders | `restaurantId + createdAt` + optional status | 20–50 |
| Inventory reservation | transactional get/set on `inventory/{sku}` | 1 per SKU |
| Promotion | `code ==` then usage doc | 1 + 1 |
| Idempotent checkout | `idempotencyKeys/{key}` | 1 |

Unbounded list-all-customers or list-all-orders queries are forbidden.

## Collections

```
_meta/schema
restaurants/{restaurantId}
  menuCategories/{categoryId}
  menuItems/{itemId}
  modifierGroups/{groupId}          options embedded (bounded)
  deliveryZones/{zoneId}
  promotions/{promotionId}
  inventory/{sku}
  counters/orders                   { value: number }
  aggregates/{yyyy-mm-dd}
  plans/{planId}
restaurants/_usages/promotionUsages/{promotionId}__{customerKey}
customers/{customerId}              member id == Firebase uid
  addresses/{addressId}
users/{uid}                         staff records
orders/{orderId}
  events/{eventId}
payments/{paymentId}
deliveries/{deliveryId}
printJobs/{printJobId}
notifications/{notificationId}
reviews/{reviewId}
auditLogs/{logId}
idempotencyKeys/{key}
memberships/{membershipId}
webhookEvents/{eventId}
```

Document IDs are opaque. Customers see `publicOrderNumber` values such as `GH1048`.

## Important documents

### Restaurant

Public identity, timezone `Europe/Stockholm`, weekend day list, kitchen capacity (orders per 15 minutes), ordering paused flag, pickup address.

### Menu item

Matches the product model: weekday/weekend prices, availability window, allergens, dietary tags, modifier group ids, kitchen portion grams, inventory SKU.

### Order (immutable commercial snapshot)

Items, modifier names and prices, address, customer, totals, payment/delivery status, hashed guest access token, idempotency key, optional internal cost fields (never sent to the client).

### Inventory

`availableQuantity` is the sellable portion count. Transactions refuse a write that would go negative.

## Indexes

Declared in `firestore.indexes.json`. Composite indexes cover kitchen status lists, customer history, featured items, and public order-number lookup.

## Transactions

Used for:

- order create + inventory decrement + promotion usage + sequence + idempotency
- inventory adjustments
- order status changes that race (confirm / cancel)

Independent writes are not treated as atomic.

## Realtime

Allowed:

- kitchen order board (staff, filtered, today's open statuses)
- customer tracking page for a single authorized order
- admin attention queue for delivery failures

Not allowed:

- menu, profile, historical lists, restaurant settings

## Reads / writes (cost)

A typical guest checkout: ~8–15 reads (item, groups, promo, zone) and 4–7 writes (order, inventory, usage, idempotency, sequence). Kitchen polling should use a listener per board, not per card.

## Migrations

Versioned scripts live in `scripts/migrations`. Rollback is a Firestore export restore, not a destructive down migration.

## Backup

See [OPERATIONS.md](OPERATIONS.md). Enable scheduled Firestore exports to a dedicated backup bucket.
