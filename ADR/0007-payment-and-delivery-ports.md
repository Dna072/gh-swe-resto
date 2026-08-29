# ADR 0007 — Payment and delivery provider ports

## Status

Accepted

## Context

Stripe and Wolt are likely first vendors. Swish and Foodora may follow. Credentials are not available in Phase 0.

## Decision

Define `PaymentProvider` and `DeliveryProvider`. Ship `MockPaymentProvider` and `MockDeliveryProvider` for tests. `StripePaymentProvider` and `WoltDriveProvider` are adapters, not claimed production integrations. `FoodoraProvider` is an explicit unimplemented boundary.

## Consequences

Core order flow never imports Stripe or Wolt.
