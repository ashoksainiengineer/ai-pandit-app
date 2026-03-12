# AI-Pandit Execution Job List (Cloud Run Web + API + Worker + Neon + Redis/Upstash + Clerk)

Last updated: 2026-03-12  
Purpose: Step-by-step execution checklist for migrating this repo safely without full rewrite.

## Current Progress Snapshot (Updated)

Status date: 2026-03-12

- Branch created: `migration/cloudrun-neon-worker-split`
- API service deployed: `https://api-service-7tjuxigfoq-as.a.run.app`
- Worker service deployed: `https://worker-service-7tjuxigfoq-as.a.run.app`
- Core infra ready: GCP APIs, Neon, Upstash Redis, Secret Manager, Artifact Registry
- Runtime secret injection verified in Cloud Run services
- Feature flags implemented in API runtime:
  - `USE_ASYNC_JOB_PIPELINE`
  - `USE_NEW_STREAM_PATH`
- Durable worker attempt tracking implemented via `job_attempts`
- GitHub Actions Cloud Run deploy workflow added
- Artifact Registry cleanup workflow added
- Idle-cost hardening applied:
  - API can scale to zero
  - worker `minScale` removed
  - worker CPU throttling enabled
- Next coding start point: Cloud Run web wiring + end-to-end smoke tests

## 1) Final Stack Lock (Approved)

- Frontend: `Cloud Run` (Next.js standalone web service)
- Backend API: `Cloud Run` (Node.js/TypeScript)
- Backend Worker: `Cloud Run` (Node.js/TypeScript)
- Database: `Neon Postgres`
- Queue/Cache/Progress Bus: `Redis` (`Upstash`)
- Auth: `Clerk`

## 2) Additional Required Components (Yes, these are needed)

- Object storage: `Google Cloud Storage` (reports/artifacts/log exports)
- Secrets: `Google Secret Manager`
- Observability: `OpenTelemetry + Cloud Logging + Cloud Monitoring`
- CI/CD: `GitHub Actions`
- Container registry: `Artifact Registry` (or GitHub Container Registry)
- IaC (recommended): `Terraform` (phase-2)

## 3) Non-Negotiable Architecture Rules

1. Never run full analysis in one HTTP request.
2. API returns quickly with `jobId`; worker does long-running processing.
3. Every stage writes checkpoints (`resume` must work after crash/restart).
4. Queue must be durable and idempotent.
5. Progress stream must read from persisted `job_events`, not only memory.

## 4) Repo Strategy (Do this, not new repo)

- Use same monorepo.
- Create migration branch: `migration/cloudrun-neon-worker-split`
- Do incremental rollout with feature flags.
- Keep old path as fallback until new path is proven.

## 5) Execution Plan (Ordered Job List)

## Phase 0: Setup and Baseline (Day 1-2)

- [x] Create migration branch.
- [x] Freeze architecture docs:
  - `docs/CLOUD_RUN_COMPLETE_ARCHITECTURE_BLUEPRINT.md`
  - `docs/FREE_TO_ENTERPRISE_IMPLEMENTATION_MASTER_PLAN.md`
- [x] Add feature flags:
  - `USE_ASYNC_JOB_PIPELINE`
  - `USE_NEW_STREAM_PATH`
- [ ] Record baseline metrics from current system:
  - average runtime per analysis
  - failure rate
  - current queue wait
  - memory pressure points

## Phase 1: Data Model (Week 1)

- [ ] Add DB tables (Drizzle migration):
  - `jobs`
  - `job_attempts`
  - `job_events`
  - `idempotency_keys`
  - `artifacts`
- [ ] Add indexes:
  - `jobs(status, created_at)`
  - `job_events(job_id, sequence_no)`
  - `idempotency_keys(user_id, key)`
- [ ] Add strict status enum:
  - `queued`, `running`, `retrying`, `failed`, `completed`, `cancelled`
- [ ] Add optimistic lock/version field on `jobs`.

## Phase 2: API Split (Week 1-2)

- [ ] Add `POST /api/jobs`:
  - validates request
  - writes `session + job`
  - enqueues `jobId`
  - returns immediately
- [ ] Add `GET /api/jobs/:id` status endpoint.
- [ ] Add `POST /api/jobs/:id/cancel`.
- [ ] Add idempotency-key handling on submit route.
- [ ] Enforce typed response format for all new endpoints.

## Phase 3: Worker Service (Week 2-3)

- [x] Create `apps/worker` service.
- [ ] Connect worker to Redis queue.
- [ ] Move one BTR stage first (pilot stage).
- [ ] Implement chunk handler contract:
  - input: `jobId`, `stage`, `cursor`
  - output: `nextStage/cursor`, `progress`, `checkpoint`
- [x] Persist `job_events` with sequence numbers.
- [ ] Implement retry with exponential backoff.
- [ ] Implement dead-letter handling after max attempts.
- [ ] Implement heartbeat every N seconds for stuck detection.

## Phase 4: Progress Streaming (Week 3)

- [x] Update SSE stream source to DB-backed `job_events`.
- [x] Implement reconnect with `lastEventId` cursor support.
- [ ] Add fallback polling endpoint if stream disconnects.
- [ ] Ensure stream payload contracts are typed in shared package.

## Phase 5: Infra Deployment (Week 3-4)

- [x] Cloud Run service `api-service` deployed (placeholder image).
- [x] Cloud Run service `worker-service` deployed (placeholder image).
- [x] Set separate scaling:
  - API high concurrency, low CPU/mem
  - Worker low concurrency (1-2), higher CPU/mem
- [x] Neon DB created + pooled connection configured.
- [x] Upstash Redis instance configured.
- [x] Secret Manager secrets created for core credentials.

Phase 5 note:
- runtime secret injection in deployed Cloud Run services is complete
- CI/CD deploy workflow wiring is still pending
- current worker deployment is intentionally cost-optimized for idle environments and may need a different scale policy before production traffic

## Phase 6: Reliability and Safety (Week 4)

- [ ] Add timeout budgets per stage.
- [ ] Add cancellation boundaries at chunk transitions.
- [ ] Add crash recovery test: worker restart should resume from checkpoint.
- [ ] Add duplicate-submit test: one idempotent job only.
- [ ] Add poison job simulation and DLQ validation.

## Phase 7: Observability and Cost Guardrails (Week 4-5)

- [ ] Add structured logs with `requestId`, `jobId`, `userId`.
- [ ] Add metrics:
  - queue depth
  - active workers
  - stage duration
  - retries
  - failure reason codes
- [ ] Add alerts:
  - queue backlog threshold
  - retry storm
  - worker OOM/restart spike
- [ ] Add cost alerts for Cloud Run, Neon, Upstash.
- [ ] Add per-user and per-job AI budget caps.

## Phase 8: Rollout (Week 5)

- [ ] Internal canary: 5% traffic on new pipeline.
- [ ] 25% -> 50% -> 100% rollout with monitoring gates.
- [ ] Keep old flow fallback enabled until 7-day stable window.
- [ ] Remove dead code only after stability confirmation.

## 6) Required Environment Variables

## Shared

- `NODE_ENV`
- `AI_API_KEY`
- `ENCRYPTION_SECRET`
- `NEXT_PUBLIC_BACKEND_URL`

## API Service

- `NEON_DATABASE_URL`
- `REDIS_URL`
- `REDIS_TOKEN` (if Upstash)
- `CLERK_SECRET_KEY`
- `UPSTASH_REDIS_REST_URL` (if REST mode used)
- `UPSTASH_REDIS_REST_TOKEN`

## Worker Service

- `NEON_DATABASE_URL`
- `REDIS_URL`
- `REDIS_TOKEN`
- `AI_API_KEY`
- `MAX_WORKER_CONCURRENCY`
- `MAX_STAGE_RETRIES`

## Web Service

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `NEXT_PUBLIC_BACKEND_URL`
- `NEXT_PUBLIC_APP_URL`
- `FRONTEND_URL`

## 7) Definition of Done (Project-Level)

- [ ] API response p95 < 500ms for submit/status endpoints.
- [ ] Multi-hour analysis runs successfully without single-request dependency.
- [ ] Worker crash/restart resumes jobs from last checkpoint.
- [ ] No queue/job loss in load tests.
- [ ] Frontend progress remains consistent across reconnects.
- [ ] All critical flows covered by tests and runbooks.

## 8) First 3 Tasks to Start Immediately

1. Create `jobs` + `job_events` tables and migration.
2. Implement `POST /api/jobs` immediate-return endpoint.
3. Scaffold `apps/worker` with queue consume loop and one pilot stage.

## 9) Notes on Remaining Components

You asked "aur kuch baaki hain?"

Yes, minimum additional production components are:
- Object storage (for artifacts/reports)
- Secrets manager
- Centralized observability
- CI/CD pipeline

Without these, system runs but enterprise reliability will be weak.
