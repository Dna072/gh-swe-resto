# ADR 0008 — Selective Firestore realtime

## Status

Accepted

## Context

Realtime listeners are a cost and complexity multiplier.

## Decision

Use listeners only for the kitchen board, single-order tracking, and delivery-attention views. Menu, profiles, and history stay request/response.

## Consequences

Kitchen UX is live. Menu pages can be cached and statically generated later.
