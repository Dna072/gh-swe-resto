# ADR 0006 — Guest checkout with hashed access tokens

## Status

Accepted

## Context

Account creation must not be required. Sequential Firestore ids must not be public.

## Decision

Orders get `GH{n}` public numbers and a high-entropy access token. Only the SHA-256 hash is stored. Guests cannot query the orders collection from the client.

## Consequences

Tracking URLs must include the token. Password-reset style leakage of the URL is treated as order access.
