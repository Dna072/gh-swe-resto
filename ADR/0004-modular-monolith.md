# ADR 0004 — Modular monolith on Cloud Run

## Status

Accepted

## Context

One restaurant, one team, one deployable.

## Decision

Ship a single Next.js service. Split by domain folders, not microservices.

## Consequences

Shared process and deploy cadence. Extract a worker later only if Cloud Run request timeouts cannot host retries.
