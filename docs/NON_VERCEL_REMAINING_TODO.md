# Frontend Rollout Remaining Todo

Last updated: 2026-03-12

Purpose: single source of truth for the remaining rollout work after removing Vercel from the target stack.

## Done

- Durable job tables and repository helpers
- `POST /api/jobs`, `GET /api/jobs/:jobId`, `POST /api/jobs/:jobId/cancel`
- DB-backed `job_events` replay with `Last-Event-ID`
- Cloud Run API and worker deployment
- Secret Manager runtime injection
- Worker attempt tracking via `job_attempts`
- Health/metrics enrichment
- Cloud Run deploy workflow
- Artifact Registry cleanup workflow
- Idle-cost guard scripts
- Fallback job-events polling endpoint:
  - `GET /api/jobs/:jobId/events?since=<sequenceNo>`
- Typed shared polling contract for job-events fallback
- DLQ-style artifact persistence for permanent failures
- Cloud Run operations runbook:
  - `docs/runbooks/CLOUD_RUN_OPERATIONS.md`
- Production worker mode toggle:
  - `scripts/enable-production-worker-mode.sh`
- Dead-letter reporting views and admin inspection routes:
  - `GET /api/admin/jobs/dead-letter`
  - `GET /api/admin/jobs/:jobId/dead-letter`
- Persisted retry metadata:
  - `jobs.retryCount`
  - `jobs.retryReasonCode`
  - `jobs.nextRetryAt`
- Worker restart recovery:
  - startup recovery converts interrupted `running` jobs into immediate `retrying`
  - preserved checkpoint/heartbeat context is kept in job metadata
  - coverage in queue-manager tests
- Poison-job simulation test with safe terminal `failed` validation
- Accepted queue architecture documented:
  - `docs/runbooks/QUEUE_ARCHITECTURE_DECISION.md`
- Frontend polling fallback sync contract:
  - `GET /api/jobs/:jobId/sync`
- Shared sync/polling schemas for job-event replay and fallback polling
- Reconnect consistency coverage:
  - partial missed window
  - no persisted events
  - duplicate suppression
- Structured metrics export now includes:
  - queue depth
  - active job count
  - retry count
  - failed terminal jobs
  - active SSE count
- Cloud Monitoring alerts runbook:
  - `docs/runbooks/CLOUD_MONITORING_ALERTS.md`
- Billing/budget alert setup instructions:
  - `docs/runbooks/BUDGET_ALERTS.md`
- Artifact references for:
  - analysis result
  - reasoning log
  - result summary
  - dead-letter report
- GCS-backed artifact helper with safe fallback when bucket is unset
- Artifact retention/cleanup job:
  - `npm --workspace apps/api run artifacts:cleanup`
- Cloud Run smoke script:
  - `npm --workspace apps/api run smoke:cloudrun-job-flow`
- Authenticated worker health verification script:
  - `npm --workspace apps/api run verify:worker-health`

## Remaining

- Deploy `web-service` from `deploy/cloudrun/web.Dockerfile`
- Set frontend runtime env for self-hosted web:
  - `NEXT_PUBLIC_APP_URL`
  - `NEXT_PUBLIC_BACKEND_URL`
  - `FRONTEND_URL`
  - `ALLOWED_ORIGINS`
- Run end-to-end smoke validation for `web-service -> api-service -> worker-service`
- Re-evaluate frontend service scaling, auth callback URLs, and custom domain setup before production cutover

## Not Doing Here

- backend queue/worker re-architecture
- legacy Vercel environment wiring
- commit/push or traffic cutover decisions
