# ADR 0010 — Cloud Run and Firestore cost caps

## Status

Accepted

## Context

An accidental loop or bot crawl must not create an unbounded bill.

## Decision

Cap Cloud Run at 5 instances by default. Paginate every list. Prohibit unbounded queries and global listeners. Set GCP budgets before production traffic.

## Consequences

A true launch-day spike may need a temporary max-instance increase with monitoring.
