# AI-Pandit Current Architecture Snapshot

Last Updated: 15 May 2026
Owner: Engineering (Codex-assisted)
Status: Canonical working snapshot for ongoing refactor/stabilization work

## 1. Purpose

This file is the **single reference snapshot** of the currently implemented architecture.
Use this before making any code change, test rewrite, or roadmap update.

Rules while using this snapshot:
1. Prefer this document over assumptions from old legacy architecture.
2. Treat any test or code that contradicts this snapshot as legacy drift unless re-validated.
3. Keep changes aligned to this architecture first; then optimize.

## 2. Monorepo Topology

- `apps/web`: Next.js 15 frontend + server routes (Clerk-protected proxy layer)
- `apps/api`: Express TypeScript API (analysis orchestration, queue, streaming)
- `apps/worker`: standalone worker process (polling + job execution runtime)
- `services/ephemeris`: Python FastAPI Skyfield ephemeris microservice
- `packages/db`: Drizzle schema + Postgres/Neon data access
- `packages/shared`: shared TS types + Zod contracts used by web/api

## 3. Runtime Architecture (Current)

### 3.1 Services

1. Web (`apps/web`)
   - User-facing UI
   - Clerk auth at edge/app layer
   - Server route proxy to API (`/api/analysis/*`)

2. API (`apps/api`)
   - AuthN/AuthZ (Clerk token verification)
   - Session/job lifecycle
   - Queue orchestration + stream delivery
   - BTR processing pipeline invocation
   - Ephemeris provider abstraction (Skyfield-first)

3. Worker (`apps/worker`)
   - Dedicated queue execution loop
   - Graceful drain on SIGTERM/SIGINT
   - Cloud Run health endpoints (`/health`, `/ready`, `/live`)

4. Ephemeris (`services/ephemeris`)
   - FastAPI + Skyfield kernel (`de440s.bsp`)
   - `/v1/positions`, `/v1/positions/batch`, `/v1/sunrise`
   - `/health`, `/ready`

5. Database (Neon/Postgres)
   - Durable source of truth for sessions/jobs/events/artifacts/idempotency

### 3.2 High-Level Data Flow

1. Frontend submits analysis via Web proxy route (`/api/analysis/queue`).
2. Web proxy forwards to API `/api/queue` with Clerk Bearer token.
3. API validates input, ownership context, consent, idempotency, limits.
4. API persists `sessions` + `jobs`, enqueues through configured queue driver.
5. Worker/API queue loop claims job, runs BTR pipeline, updates progress/events/artifacts.
6. Frontend receives live progress via SSE (`/api/stream`) and/or polling (`/api/queue/progress`).
7. Final result persisted in DB and returned via progress/stream endpoints.

## 4. Ephemeris Architecture (Current)

## 4.1 Provider Contract

Defined in API config (`apps/api/src/config/index.ts`):
- `EPHEMERIS_PROVIDER`: `skyfield | algorithmic` (default `skyfield`)
- `EPHEMERIS_ALLOW_ALGORITHMIC_FALLBACK`: boolean (default `false`)
- `EPHEMERIS_STRICT_MODE`: boolean (default `true`)
- `EPHEMERIS_SERVICE_URL`: default `http://localhost:8000`
- `EPHEMERIS_HOUSE_SYSTEM`: `whole_sign | equal | placidus`

## 4.2 API Ephemeris Runtime

File: `apps/api/src/lib/ephemeris.ts`

- `initEphemerisProvider()` performs Skyfield health probe via client.
- Active mode states:
  - `skyfield`
  - `algorithmic`
  - `algorithmic-fallback`
- If Skyfield init fails and fallback disabled, API throws startup/runtime error.
- Skyfield chart is transformed to internal `EphemerisData` contract.

## 4.3 Skyfield Client Contract

File: `apps/api/src/lib/ephemeris/skyfield-client.ts`

- Uses shared Zod schemas for request/response validation.
- Endpoints used:
  - `GET /health`
  - `POST /v1/positions/batch` (single chart also routed through batch)
  - `POST /v1/sunrise`
- Timeout control from `EPHEMERIS_SERVICE_TIMEOUT_MS`.

## 4.4 Python Ephemeris Service

Core files:
- `services/ephemeris/app/main.py`
- `services/ephemeris/app/services/runtime.py`
- `services/ephemeris/app/services/calculations.py`
- `services/ephemeris/app/routes/v1/ephemeris.py`

Key behavior:
- Loads Skyfield kernel from configured data dir (`EPHEMERIS_DATA_DIR`).
- Uses Lahiri ayanamsha mode.
- Supports `whole_sign`, `equal`, `placidus` houses.
- Supports true/mean node mode.
- Returns deterministic typed payloads used by API adapter.

## 4.5 Current Migration Reality

- Legacy WASM-based ephemeris is removed from backend runtime path.
- Architecture now uses Skyfield (Python) as the primary ephemeris provider.

## 5. Job + Queue + Worker Architecture

## 5.1 Core Modes

From API config:
- `JOB_EXECUTION_MODE`: `inline | external_worker` (default production intent: `external_worker`)
- `QUEUE_ARCHITECTURE`: `db_polling | redis_bullmq` (default `db_polling`)

## 5.2 Queue Driver Abstraction

Files:
- `apps/api/src/lib/queue/index.ts`
- `apps/api/src/lib/queue/driver.ts`
- Drivers:
  - `db_polling` (`drivers/db-polling.ts`)
  - `redis_bullmq` (`drivers/redis-bullmq.ts`)

Behavior:
- DB polling is durable baseline path.
- Redis mode adds transport queues + delayed retries + DLQ list, but DB remains source of job truth.

## 5.3 Durable Job Lifecycle

Primary file: `apps/api/src/lib/jobs/job-service.ts`

Lifecycle:
1. validate request + offset + consent
2. sync user
3. enforce per-tier/global queue limits
4. create session/job and idempotency key
5. enqueue session
6. worker claims and executes
7. progress/events/artifacts persisted
8. complete/fail/retry/cancel transitions recorded

## 5.4 Worker Runtime

Files:
- `apps/api/src/lib/jobs/worker-runtime.ts`
- `apps/worker/src/worker.ts`

Boot sequence:
1. ensure DB initialized
2. init ephemeris provider
3. recover interrupted jobs
4. enter run loop (`runQueueIteration`)
5. on shutdown, stop + wait-for-drain

## 6. Streaming and Progress Architecture

## 6.1 API Endpoints

- `/api/stream` (SSE, supports reconnect + `Last-Event-ID` replay)
- `/api/queue/progress` (polling path)
- `/api/jobs/:jobId/events` + `/sync` (durable event sync)

## 6.2 Event Sources

- In-memory session event buffer
- Persisted job/session events (`job_events`) for replay and recovery

## 6.3 Frontend Transport Strategy

File: `apps/web/lib/use-stream-progress.ts`

Current behavior:
1. attempt SSE
2. fallback to polling on transport issues
3. handle 404 retry windows for eventual session visibility
4. optional auto-requeue logic when required

## 7. Data Model Snapshot (Durable Core)

Primary schema file: `packages/db/src/schema.ts`

Critical tables:
- `users`
- `sessions`
- `jobs`
- `job_attempts`
- `job_events`
- `artifacts`
- `idempotency_keys`
- `calculations`
- `session_favorites`

Key principles:
1. Jobs are durable and retry-aware (`retrying`, `nextRetryAt`, `attempt`).
2. Session remains user-visible business object.
3. Job tables provide operational correctness + replayability.
4. Artifact references are persisted for post-run diagnostics/export.

## 8. Auth, Ownership, and Security Boundaries

## 8.1 Authentication

- Clerk token verification in API middleware (`auth.ts`)
- Web server proxy requires authenticated Clerk context before forwarding

## 8.2 Authorization

- Session ownership checks via `resolveSessionOwnershipContext` + `isSessionOwnedByContext`
- Applied on queue/progress/stream/jobs/session operations

## 8.3 Sensitive Data Handling

- Encrypted fields in sessions; decrypted only with ownership context
- Preflight secret safety gate present in scripts (`scripts/preflight-env-safety.sh`)

## 9. Deployment Snapshot (Cloud Run Focus)

Deployment script: `scripts/deploy-cloud-run.sh`

Services:
1. `api-service`
2. `web-service`
3. `worker-service`

Injected runtime defaults:
- API/Worker set `JOB_EXECUTION_MODE=external_worker`
- Feature flags: `USE_ASYNC_JOB_PIPELINE=true`, `USE_NEW_STREAM_PATH=true`
- Secret manager wiring for DB/AI/Clerk/Encryption

## 10. Configuration Contract (Must-Have for Target Stack)

At minimum for production-like runs:
1. `NEON_DATABASE_URL` (or equivalent Postgres URL)
2. `AI_API_KEY`
3. `CLERK_SECRET_KEY`
4. `ENCRYPTION_SECRET`
5. `NEXT_PUBLIC_BACKEND_URL` (web -> api)
6. `EPHEMERIS_PROVIDER=skyfield`
7. `EPHEMERIS_SERVICE_URL` reachable by API/worker
8. `JOB_EXECUTION_MODE=external_worker`

Optional by mode:
- `REDIS_URL` only when `QUEUE_ARCHITECTURE=redis_bullmq`

## 11. Testing Topology (Current State)

Lanes:
1. Fast gate: `npm run test` (selected exclusions for unstable/expensive suites)
2. Full lane: `npm -w @ai-pandit/api run test:full`
3. Ephemeris strict lanes:
   - `test:ephemeris:high-precision`
   - `test:ephemeris:gold`
   - `test:ephemeris:gold:strict`
4. Release gate composite:
   - `phase6:release-gate`

Important migration note:
- Many historical tests still assert legacy architecture assumptions.
- These should be bucketed into `keep / rewrite / delete` against this snapshot.

## 12. Known Architecture Drifts to Track

1. ✅ Legacy naming cleanup completed - all `swiss` references updated to `Skyfield`.
2. Frontend helper `apps/web/lib/ephemeris.ts` still returns algorithmic placeholders for UI-only checks.
3. Excluded tests in fast gate indicate unresolved migration debt.

These drifts should be cleaned in controlled phases, not via ad-hoc patching.

## 13. Recent Architecture Changes

### 13.1 Redis Backed Polling Fallback Fix (2026-05-15)

**Problem:** When `JOB_EXECUTION_MODE=external_worker`, the API process could not access the worker's
in-memory `ProgressTracker`. The polling endpoint (`/api/queue/progress`) called `getSessionProgress()`
which fell back to Redis, but always returned `candidateScores: []` because:

- `emitCandidateScore()` was never persisting scores to Redis (the `redisStore.storeCandidateScore()`
  method existed but was never called).
- `sessionEvents.emit()` was never calling `redisStore.logEvent()` so no event replay was available
  from Redis — only in-memory and DB persistence was wired.
- The frontend store's `progress` event handler only updated `candidateScores` and `progress` state
  from polling payloads, never populating `candidatesByStage` or `stageHistory` which the
  `ReasoningPanel` depends on. These were only populated by SSE `ai_thinking` events.

**Impact:** Stages 2, 4, 6 (AI-intensive stages) showed "Waiting for reasoning data…" and the
scoreboard showed default values only, when SSE was unavailable (no Next.js proxy for EventSource).

**Files modified:**

| File | Change | Timestamp |
|------|--------|-----------|
| `apps/api/src/lib/session-events.ts` (emitCandidateScore) | Added `redisStore.storeCandidateScore()` after `bufferScore()` so every candidate score persists to Redis List | 2026-05-15 |
| `apps/api/src/lib/session-events.ts` (emit) | Added `redisStore.logEvent()` after `persistEvent()` so all events persist to Redis for cross-process replay | 2026-05-15 |
| `apps/api/src/lib/progress-tracker.ts` (getSessionProgress) | Added `redisStore.getCandidateScores()` parallel read; replaced `candidateScores: []` with mapped data from Redis | 2026-05-15 |
| `apps/web/lib/store/stream-store.ts` (progress handler) | Added parsing of `lastAIThinking` and `stageHistory` from polling payloads to populate `candidatesByStage` and `stageHistory` in the store | 2026-05-15 |

**Redis key patterns used:**

| Key | Type | Purpose |
|-----|------|---------|
| `btr:scores:{sessionId}` | List | Candidate scores (LPUSH, trim to 500, 24h TTL) |
| `session-events:log:{sessionId}` | List | Event log for replay (LPUSH, trim to 2000, 24h TTL) |
| `session-events:thinking:{sessionId}` | Hash | AI thinking buffers (already existed, now consumed by frontend polling) |

**Verification:** TypeScript clean (`tsc --noEmit`) for both `apps/api` and `apps/web`. Frontend
store tests pass (36/36). Pre-existing workspace dependency resolution issue in API test runner
(not related to this change).

## 14. Change Protocol (Use This Every Time)

Before any task:
1. Confirm affected area against this snapshot.
2. State whether change is architecture-aligned or migration-debt cleanup.
3. Update tests according to current stack (Skyfield + durable jobs + stream replay).

After any architecture-impacting change:
1. Update this file in same PR/commit.
2. Update `docs/PRODUCTION_READY_ROADMAP.md` phase status if relevant.
3. Record drift/decision in known issues register if not fully resolved.

## 15. Non-Goals for Current Phase

1. Re-introducing legacy WASM runtime fallback.
2. Supporting both old and new architecture indefinitely.
3. Broad refactor without contract-level validation.

---

If any code behavior conflicts with this file, treat it as one of:
1. outdated file content (then update this doc), or
2. architectural regression (then fix code/tests to match this doc).
