# ADR 0001 — GCP serverless platform

## Status

Accepted

## Context

The restaurant needs a production ordering platform with low fixed cost and no Kubernetes operations.

## Decision

Host the system on Google Cloud: Cloud Run, Firestore, Cloud Storage, Secret Manager, Cloud Tasks, Pub/Sub, Cloud Logging, Cloud Monitoring. Do not use AWS, Azure, Neon, Supabase, Cloud SQL, or GKE in V1.

## Consequences

Vendor concentration on GCP. Repository and provider ports exist so a future PostgreSQL move does not rewrite the domain layer.
