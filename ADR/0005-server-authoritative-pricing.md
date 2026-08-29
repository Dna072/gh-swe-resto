# ADR 0005 — Server-authoritative pricing and inventory

## Status

Accepted

## Context

Clients can be tampered with. Weekday/weekend prices and last portions must be correct.

## Decision

`PricingService` and `OrderService` recalculate every quote. Inventory decrements run inside a transaction and cannot go negative. Historical order snapshots never update when the menu changes.

## Consequences

The browser may display prices but cannot submit a trusted total.
