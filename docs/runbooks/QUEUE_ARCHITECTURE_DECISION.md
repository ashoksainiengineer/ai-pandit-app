# Queue Architecture Decision

Last updated: 2026-03-12

## Decision

The production queue architecture is now explicitly `db_polling`.

- `jobs` remains the source of truth for lifecycle state.
- `job_attempts` remains the source of truth for worker lease history and restart recovery.
- `job_events` remains the source of truth for durable stream replay and polling fallback.
- Workers claim `queued` or due `retrying` jobs directly from Postgres and honor `nextRetryAt`.

## Why This Path Was Accepted

- The codebase already ships a durable DB-backed queue with idempotency, retry metadata, heartbeat tracking, and replayable event storage.
- A Redis move would add another control plane before the DB-backed lifecycle model is fully exhausted.
- Current operational requirements are better served by improving recovery, DLQ inspection, and metrics on the existing path.

## Operational Rules

- `QUEUE_ARCHITECTURE=db_polling` is the only accepted runtime mode.
- `JOB_EXECUTION_MODE=external_worker` is the production worker mode.
- Retry wake-up is driven by `jobs.nextRetryAt`.
- Worker restart recovery converts interrupted `running` jobs back into `retrying` with `retryReasonCode=worker_restart`.

## Docs Cleanup Guidance

Treat any old Redis/Upstash queue references as historical planning material unless the document explicitly says "future option".

- Accepted production queue: DB polling.
- Accepted event replay transport: `job_events` plus SSE `Last-Event-ID`.
- Accepted frontend polling fallback: `GET /api/jobs/:jobId/sync`.
