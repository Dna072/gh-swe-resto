# ADR 0003 — Repository and provider ports

## Status

Accepted

## Context

Business rules must survive a later database or vendor change.

## Decision

Domain services depend on interfaces (`OrderRepository`, `PaymentProvider`, `DeliveryProvider`, `NotificationProvider`, `PrintProvider`). Firestore and vendor SDKs live under `src/infrastructure`.

## Consequences

Slightly more types up front. Unit tests run without cloud credentials.
