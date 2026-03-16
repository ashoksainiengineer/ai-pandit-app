# Subsystem Hardening Roadmap

This document tracks the subsystem-by-subsystem hardening order for local development against the real stack.

## Execution Order

1. Shared runtime contract
2. Ephemeris service
3. API core
4. Queue lane (`db_polling` first, `redis_bullmq` second)
5. Worker
6. Web app
7. End-to-end integration flows

## Definition Of Ready

Each subsystem is only considered ready when all of the following are true:

- startup path works locally without placeholder infrastructure
- health and readiness endpoints reflect real dependency state
- required external dependencies are reachable
- subsystem-specific verification commands pass
- one real workflow check succeeds

## Current Status

### 1. Shared runtime contract

Status: PASS

Verified locally against the real stack:

- `bash apps/api/scripts/doctor.sh`
- `gcloud --version`
- Neon connectivity via `@ai-pandit/db` health check
- Upstash Redis connectivity via `ioredis`

Notes:

- Node, local workspace, and Google Cloud SDK are present.
- Neon database is reachable.
- Upstash Redis is reachable.
- Runtime contract currently resolves to `redis_bullmq + external_worker + skyfield + no algorithmic fallback`.

### 2. Ephemeris service

Status: PASS

Completed during subsystem 1 hardening because it is a startup dependency for the API:

- bootstrapped `.venv` with `npm run setup:ephemeris`
- downloaded `de440s.bsp` with `npm run ephemeris:download-kernel`
- verified `http://127.0.0.1:8000/health`
- verified `http://127.0.0.1:8000/ready`

Observed runtime state:

- kernel loaded successfully
- readiness returns HTTP 200
- local service is using the expected Skyfield kernel

Additional verification:

- isolated contract run passes from `apps/api`: `npx vitest run src/lib/ephemeris/__tests__/contract.test.ts`
- direct 100-chart batch request to `/v1/positions/batch` succeeds locally in under the contract threshold

Open note:

- the full `npm -w @ai-pandit/api run test` suite still reported one ephemeris batch-contract failure under broader suite load, but this was not reproducible when the ephemeris subsystem was exercised in isolation.

### 3. API core

Status: PASS

Verified locally:

- API process is running locally on port `7860`
- `http://127.0.0.1:7860/health` returns HTTP 200
- `http://127.0.0.1:7860/ready` returns HTTP 200 with database and ephemeris ready
- `http://127.0.0.1:7860/api/health/ready` now returns the same dependency truth as root `/ready`
- `http://127.0.0.1:7860/api/health/metrics` returns HTTP 200
- `npm -w @ai-pandit/api run lint`
- `npm -w @ai-pandit/api run typecheck`
- `npx vitest run src/middleware/__tests__/BackendAuth.test.ts src/routes/__tests__/health.test.ts src/__tests__/smoke.test.ts`
- local smoke flow can clone, requeue, poll, cancel, and clean up against the real stack

Open note:

- the local smoke flow remains non-terminal in `external_worker` mode until the worker subsystem is running, which is expected and will be validated in the next subsystem.
- BTR boundary-warning regression is fixed: the API result now preserves boundary-sensitive finalist/consensus warnings instead of only emitting warnings for the final timestamp's strict critical-danger state.
- Verified with `npm -w @ai-pandit/api run typecheck` and targeted regression `npm -w @ai-pandit/api run test -- --run src/lib/btr/__tests__/btr-pipeline.integration.test.ts -t "detect and report boundary warnings"`.

### 4. Queue lane

Status: IN PROGRESS

Planned approach:

- validate `db_polling` lane first as the simpler durable baseline
- then validate `redis_bullmq` transport with the real Upstash configuration
- confirm enqueue, claim, retry, and recovery behavior

Current verification signal:

- queue verification surface is now aligned with the real local env instead of placeholder test overrides
- `npm -w @ai-pandit/api run test -- --run src/routes/__tests__/queue.test.ts src/lib/__tests__/queue-manager.test.ts` passes
- `npm -w @ai-pandit/api run smoke:duplicate-flow:local` now uses the repo-local env and verifies clone -> requeue -> queue progress -> cancel -> cleanup on the real local stack
- current local runtime resolves to `redis_bullmq + external_worker`, so requeued work remains queued until the worker subsystem is running, which is expected at this stage
- `db_polling` still needs its own explicit real-stack verification pass before this subsystem can be marked PASS

### 5. Worker

Status: NOT STARTED

Planned approach:

- start the worker against the real local stack
- verify `/health` and `/ready`
- submit a real job and confirm claim/heartbeat/drain behavior

### 6. Web app

Status: NOT STARTED

Planned approach:

- run locally with development Clerk keys and real backend URL
- confirm auth bootstraps, session creation, and analysis submission UI flows

### 7. End-to-end integration flows

Status: NOT STARTED

Planned approach:

- validate the happy path first: sign-in -> session create -> enqueue -> worker execution -> result visibility
- then validate degraded paths and retries

## Next Fix Target

Next subsystem to harden: Queue lane (`db_polling` first, `redis_bullmq` second).

Immediate focus:

1. validate enqueue -> claim -> retry/cancel -> completion transitions against the real local stack
2. confirm `db_polling` as the durable baseline lane before validating `redis_bullmq`
3. once queue semantics are green, move to worker execution on top of the verified lane
