# Database migrations

Firestore is schemaless. These scripts record intentional structural changes.

Rules:

1. Increment `SCHEMA_VERSION` in `src/domains/shared/types.ts`.
2. Add a numbered script in this folder.
3. Document the backfill and rollback in `DATABASE.md`.
4. Never point a local script at production.
5. Prefer additive fields and dual-read windows over breaking renames.
