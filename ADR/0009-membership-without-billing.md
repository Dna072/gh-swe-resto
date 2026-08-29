# ADR 0009 — Membership architecture without V1 billing

## Status

Accepted

## Context

Subscriptions and loyalty are on the roadmap but must not delay launch.

## Decision

Model `Membership`, `Plan`, and `Benefit`. `MembershipService` can answer “is this customer an active member?”. No Stripe Billing, no points ledger, no referral graph in V1.

## Consequences

Promotions can already be marked `memberOnly`. Billing is a later phase.
