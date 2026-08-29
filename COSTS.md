# Costs

Cost control is a product requirement.

## Expected early-stage shape

A single-location restaurant with hundreds of orders per week should stay on:

- Cloud Run scale-to-zero
- Firestore pay-per-use
- Cloud Storage for images
- Firebase Auth
- Stripe pay-as-you-go
- Wolt Drive per delivery (business cost, not GCP)

Always-on GKE, Cloud SQL, or a warm multi-instance Cloud Run service is not justified at launch.

## Cloud Run

Defaults: min 0, max 5, 512Mi, concurrency 80.

A quiet night costs nearly nothing. A traffic spike cannot create unbounded instance charges.

## Firestore

Avoid:

- Collection-wide listeners
- Reading all customers
- Rewriting large documents on every status change
- Storing images in documents

Prefer:

- Pagination (`MAX_PAGE_SIZE = 50`)
- Embedded modifier options
- Order snapshots instead of live menu joins
- One kitchen listener
- Daily aggregate docs when reports become hot

Rough checkout: low tens of reads, under 10 writes.

## Images

WebP/AVIF in Cloud Storage + Next.js image optimization. Long cache headers on public objects.

## Analytics

Do not write every `item_viewed` event into Firestore forever. Phase 10 can add Pub/Sub → BigQuery.

## Monitoring the bill

Budgets and alerts on the GCP billing account:

- Cloud Run spend
- Firestore reads
- outbound delivery/payment is tracked in restaurant ops, not only GCP

## BigQuery

Not used as a transactional store. Introduce when historical contribution-margin reporting outgrows Firestore aggregates.
