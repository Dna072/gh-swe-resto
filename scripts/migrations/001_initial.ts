/**
 * Schema version 1 — initial Firestore structure.
 *
 * Firestore has no SQL migrations. This script is the recorded structural
 * baseline. Apply only against development or staging unless a production
 * backfill plan is approved.
 *
 * Collections created:
 * - _meta/schema
 * - restaurants/{id} plus menu, inventory, zones, promotions, counters
 * - orders, customers, users, payments, deliveries, printJobs, auditLogs
 *
 * Rollback: restore the previous Firestore export. Do not delete live orders.
 */
export const MIGRATION = {
  version: 1,
  id: "001_initial",
  description: "Create the Phase 0 restaurant document model and counters.",
};

export async function up(): Promise<void> {
  throw new Error("Apply through a trusted Admin SDK job with an explicit project target.");
}

export async function down(): Promise<void> {
  throw new Error("Rollback is an export restore, not an in-place destructive down migration.");
}
