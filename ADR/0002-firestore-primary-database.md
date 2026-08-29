# ADR 0002 — Firestore as the transactional database

## Status

Accepted

## Context

The access patterns are document-oriented: menus, order snapshots, kitchen boards, guest tokens.

## Decision

Cloud Firestore Native is the only transactional database. BigQuery is reserved for later analytics. No dual-write to SQL.

## Consequences

Queries must stay bounded and indexed. Structural changes use versioned application migrations rather than SQL DDL.
