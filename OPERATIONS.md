# Operations

## Observability

- **Cloud Logging:** JSON logs from `src/lib/logging/logger.ts`. Secrets are redacted.
- **Cloud Monitoring:** request latency, 5xx, Cloud Run instance count, Firestore error rate.

Suggested alerts:

- Cloud Run 5xx > 2% for 5 minutes
- Instance count at max for 10 minutes
- Payment webhook failures
- Order create failures
- Delivery provider errors (`DELIVERY ATTENTION REQUIRED`)
- Print job failures

## Backups

Enable daily Firestore exports to `gs://<project>-firestore-backups`. Retention: 30 days minimum. Test a restore in staging before launch.

Recovery:

1. Pause ordering (`restaurants/{id}` flag — Phase 8).
2. Restore the export to a new database or the same database if data loss is confirmed.
3. Reconcile Stripe/Wolt using provider dashboards vs `payments` and `orders`.
4. Resume ordering.

## Disaster recovery

| Failure | Customer impact | Recovery |
| --- | --- | --- |
| Cloud Run outage | Site down | Previous revision / second region later |
| Firestore outage | No new orders | Queue phone orders; replay after restore |
| Stripe down | Checkout blocked | Show friendly payment error; do not fake paid |
| Wolt down | Delivery attention | Kitchen packs; dispatcher assigns alternate or self-delivery |
| Foodora down | Same | Alternate provider |
| Email down | Tracking still works | Cloud Tasks retry; SMS later |
| Printer down | Kitchen still has the board | Browser reprint; print job remains queued |

The restaurant must be able to identify paid orders from Firestore + Stripe even if a courier API is down.

## Retention

- Orders and payments: keep for legal/accounting period
- Audit logs: 2 years
- Analytics events: do not keep unbounded in Firestore; use Pub/Sub → BigQuery later
- Guest access tokens: hash only

## On-call

Until a second location exists, OWNER/MANAGER watch payment and delivery failure alerts during opening hours.
