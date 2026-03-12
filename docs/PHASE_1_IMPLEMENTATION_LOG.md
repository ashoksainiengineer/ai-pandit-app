# Phase 1 Implementation Log

## Objective

Rebuild the Phase 1 foundation for the async job pipeline on production-grade lines:

- move the shared DB package to a clean Postgres/Neon baseline
- define durable job orchestration tables
- add typed repository helpers for Phase 2 API work
- tighten shared contracts so API and frontend can converge on one job model

## Design Decisions

### 2026-03-11

- `sessions` remains the compatibility envelope for encrypted birth-data and current UI flows.
- `jobs` becomes the orchestration source of truth for async execution.
- job reruns are allowed for the same session, so `sessionId + kind` is indexed but not unique.
- optimistic-update fields stay in the schema through `version`, `attempt`, and heartbeat metadata.
- shared job contracts are defined in `packages/shared` before Phase 2 routes are introduced.

## Changes Completed

### Database package

- switched package entrypoint to `src/index.ts` and exported job helpers as first-class package API
- removed leftover `@libsql/client` dependency from `packages/db`
- tightened `jobs` schema with:
  - `job_kind` enum
  - progress, attempt, priority, and version check constraints
  - non-unique `sessionId + kind` index for reruns
  - priority-aware status index
- added `requestHash` lookup index for idempotency records
- added typed repository helpers in `packages/db/src/jobs.ts` for:
  - create/get jobs
  - progress updates
  - completion/failure transitions
  - cancellation requests
  - attempt creation
  - event append/list
  - idempotency key create/get

### Shared contracts

- removed `any` from the queue-position contract
- added job contract types:
  - `JobKind`
  - `JobEventRecord`
- added Zod schemas:
  - `JobStatusSchema`
  - `JobKindSchema`
  - `JobSummarySchema`
  - `JobDetailSchema`
  - `JobEventRecordSchema`
  - `CreateJobResponseSchema`
  - `CancelJobResponseSchema`
- replaced `z.any()` usage in `CalculateRequestSchema` with `z.unknown()`

### Tests

- added `packages/db/src/__tests__/jobs.test.ts`
- updated DB tests to align with Postgres terminology and mocked connectivity behavior
- extended shared contract tests to cover job payloads

## Validation Status

- completed: regenerated Drizzle migration artifacts after schema tightening
- completed: built `@ai-pandit/shared`
- completed: built, typechecked, and tested `@ai-pandit/db`
- completed: applied follow-up schema delta to Neon
- completed: verified live `jobs` indexes and check constraints on Neon

### Validation Commands Run

```bash
npm --workspace @ai-pandit/shared run build
npm --workspace @ai-pandit/db run typecheck
npm --workspace @ai-pandit/db run test
npm --workspace @ai-pandit/db run build
npm --workspace @ai-pandit/db run db:generate
NEON_DATABASE_URL=... npm --workspace @ai-pandit/db run db:push
```

## Next Step

Start Phase 2 only after:

1. new jobs API contracts are wired into `apps/api`
2. session creation and job creation are executed atomically in submit routes
3. the existing queue manager is bridged from `sessionId`-only orchestration to `sessionId + jobId`

## Phase 2 Progress

### 2026-03-11

- added durable jobs API route in `apps/api/src/routes/jobs.ts`
  - `POST /api/jobs`
  - `GET /api/jobs/:jobId`
  - `POST /api/jobs/:jobId/cancel`
- added `apps/api/src/lib/jobs/job-service.ts` as the orchestration boundary for:
  - validated session + job creation
  - idempotency-key handling
  - ownership-aware job reads
  - job cancellation
- refactored legacy submit routes to use the same service:
  - `POST /api/calculate`
  - `POST /api/queue`
- bridged queue lifecycle updates back into `jobs`:
  - queued
  - started
  - completed
  - failed
  - cancelled
- added lifecycle event persistence into `job_events` from queue-manager
- fixed type debt surfaced by the Postgres migration in:
  - `calculation-cache.ts`
  - `db-cleanup.ts`
  - `progress.ts`
  - `stream.ts`

### Phase 2 Validation

```bash
npm --workspace @ai-pandit/shared run build
npm --workspace @ai-pandit/db run build
npm --workspace @ai-pandit/api run typecheck
npm --workspace @ai-pandit/api run build
```

## Next Recommended Step

1. add job-centric progress/status reads to frontend serverless proxies
2. move SSE replay source from in-memory session events to persisted `job_events`
3. extract a dedicated worker service so API no longer executes heavy BTR processing

## Phase 3 Progress

### 2026-03-11

- introduced explicit execution mode controls in `apps/api/src/config/index.ts`
  - `JOB_EXECUTION_MODE=inline|external_worker`
  - `WORKER_POLL_INTERVAL_MS`
- refactored queue orchestration to expose `runQueueIteration()` in `apps/api/src/lib/queue-manager.ts`
- changed `startQueueProcessor()` to no-op when execution mode is `external_worker`
- added standalone worker runtime in `apps/api/src/lib/jobs/worker-runtime.ts`
- added a separate worker app scaffold:
  - `apps/worker/package.json`
  - `apps/worker/tsconfig.json`
  - `apps/worker/src/worker.ts`

### Phase 3 Validation

```bash
npm install --package-lock-only
npm --workspace @ai-pandit/api run typecheck
npm --workspace @ai-pandit/api run build
npm --workspace @ai-pandit/worker run typecheck
npm --workspace @ai-pandit/worker run build
```

### Current Runtime Shape

- `JOB_EXECUTION_MODE=inline`
  - API behaves as before and runs queue processing locally
- `JOB_EXECUTION_MODE=external_worker`
  - API only accepts requests and persists jobs/sessions
  - `apps/worker` process runs the queue loop and executes heavy BTR work

### Phase 3 Queue Slice

- moved queue depth and queue position calculations to `jobs`
- moved next-claim selection to `claimNextQueuedJob()` from the shared DB package
- kept `sessions.status` synchronized only as a compatibility layer for current routes and UI
- enriched progress and stream metadata with:
  - `jobId`
  - `jobStatus`

### Phase 3 Event Replay Slice

- added persisted session-event reader in `apps/api/src/lib/jobs/job-event-stream.ts`
- updated `SessionEventManager.emit()` to persist replay-worthy stream events into `job_events`
- updated SSE reconnect flow to replay missed events from `job_events` first
- updated fresh SSE connections to replay persisted event history before falling back to in-memory buffers
- updated progress responses to include recent persisted events for job-aware polling
- hardened `appendJobEvent()` with retry-on-sequence-collision for concurrent event writers

### Cloud Run Deployment Prep

- added Cloud Run API image definition in `deploy/cloudrun/api.Dockerfile`
- added Cloud Run worker image definition in `deploy/cloudrun/worker.Dockerfile`
- added generic deployment script in `scripts/deploy-cloud-run.sh`
- added root helper scripts:
  - `npm run deploy:cloudrun:api`
  - `npm run deploy:cloudrun:worker`
- aligned API runtime config with Neon/Postgres-first environment resolution:
  - `NEON_DATABASE_URL`
  - `DATABASE_URL`
  - `POSTGRES_URL`
- added worker HTTP health server so Cloud Run can probe the worker service correctly

## Phase 3 Next Step

1. deploy `api-service` with `JOB_EXECUTION_MODE=external_worker`
2. deploy `worker-service` with concurrency `1` and higher memory
3. add dedicated integration tests for persisted SSE replay, reconnect, and duplicate sequence collision handling

## Phase 3 Deployment Update

### 2026-03-12

- installed local `gcloud` CLI in user space and used it to complete live Cloud Run rollout
- deployed API image to Cloud Run:
  - service: `api-service`
  - url: `https://api-service-7tjuxigfoq-as.a.run.app`
  - latest ready revision: `api-service-00002-8j8`
- deployed worker image to Cloud Run:
  - service: `worker-service`
  - url: `https://worker-service-7tjuxigfoq-as.a.run.app`
  - latest ready revision: `worker-service-00003-dl6`
- verified API runtime health:
  - `/api/health` returned healthy
  - database check passed
- verified worker runtime health with authenticated probe:
  - `/health` returned `healthy: true`
  - `workerStarted: true`

### Deployment Fixes Applied

- fixed `scripts/deploy-cloud-run.sh` to use a generated Cloud Build config instead of invalid `gcloud builds submit --file`
- added missing root `.dockerignore` required by both Cloud Run Dockerfiles
- fixed Cloud Run builder stages to install dev dependencies during image build:
  - `deploy/cloudrun/api.Dockerfile`
  - `deploy/cloudrun/worker.Dockerfile`
- enabled `cloudresourcemanager.googleapis.com` because Cloud Run service replacement required it

### Idle-Cost Hardening

- changed worker service from always-on idle billing shape:
  - removed `autoscaling.knative.dev/minScale: '1'`
  - changed `run.googleapis.com/cpu-throttling` from `false` to `true`
- kept worker `maxScale: '1'` to avoid accidental fan-out
- updated `scripts/deploy-cloud-run.sh` defaults so future deploys stay idle-safe:
  - API `min=0`, `max=2`
  - worker `min=0`, `max=1`
  - default deploy path now uses CPU throttling

### Important Runtime Note

- current worker service is optimized for near-zero idle cost, not always-on background polling
- with `minScale=0`, worker can scale to zero when idle
- before real async production traffic, worker autoscaling and wake-up behavior should be re-evaluated

### Additional Backend Hardening Completed

- added feature flags in API config:
  - `USE_ASYNC_JOB_PIPELINE`
  - `USE_NEW_STREAM_PATH`
- wired feature flags into:
  - jobs route mounting
  - persisted SSE replay path
- started using durable `job_attempts` records in worker execution flow:
  - attempt creation on claim
  - heartbeat updates during processing
  - final outcomes on success/failure/cancel
  - explicit `retrying` lifecycle events on retryable failures
- expanded `/health/metrics` with:
  - active durable job counts by status
  - feature-flag visibility
  - execution mode visibility

### CI/CD and Cost Automation

- added GitHub Actions workflow for Cloud Run deploy:
  - `.github/workflows/deploy-cloudrun.yml`
- added scheduled Artifact Registry cleanup workflow:
  - `.github/workflows/artifact-registry-cleanup.yml`
- added reusable cost-control scripts:
  - `scripts/enforce-idle-cost-guards.sh`
  - `scripts/cleanup-artifact-images.sh`
- added DB-backed fallback polling endpoint for job events:
  - `GET /api/jobs/:jobId/events?since=<sequenceNo>`
- added remaining non-Vercel execution backlog doc:
  - `docs/NON_VERCEL_REMAINING_TODO.md`
- added shared typed contract for job-events polling response
- added DLQ-style artifact persistence for permanent worker failures
- added Cloud Run operations runbook:
  - `docs/runbooks/CLOUD_RUN_OPERATIONS.md`
- added production worker mode toggle script:
  - `scripts/enable-production-worker-mode.sh`
