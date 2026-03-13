# Production-Ready Roadmap (Architecture-Aligned)

Date: 12 March 2026  
Primary reference: `docs/CURRENT_ARCHITECTURE_SNAPSHOT.md`  
Execution mode: strict architecture alignment

## 1. Goal

Ship the current stack to production with predictable reliability:
1. `apps/web` (Next.js)
2. `apps/api` (Express orchestration)
3. `apps/worker` (external worker runtime)
4. `services/ephemeris` (Skyfield FastAPI service)
5. Neon/Postgres durable job model

## 2. Non-Negotiables

1. All work must align with `docs/CURRENT_ARCHITECTURE_SNAPSHOT.md`.
2. No roadmap item may depend on legacy WASM runtime behavior.
3. Fast gate and release gate must stay deterministic.
4. Security and ownership checks cannot be relaxed to make tests pass.

## 3. Production Readiness Definition

Production-ready means all of these are true:
1. Skyfield ephemeris path is stable and validated against trusted datasets.
2. Queue/job lifecycle is reliable under retries, restarts, and cancellation.
3. SSE + polling recovery works without state loss for active sessions.
4. Auth + session ownership checks hold across all write/read paths.
5. Deploy scripts, secrets, and health/readiness checks are consistent across web/api/worker/ephemeris.
6. CI gates enforce this contract continuously.

## 4. Current Baseline (From Architecture Snapshot)

1. Ephemeris provider contract is Skyfield-first.
2. Durable jobs/events/artifacts schema exists and is active.
3. Queue driver abstraction exists (`db_polling`, `redis_bullmq`).
4. External worker runtime and graceful drain are implemented.
5. Stream reconnection + persisted event replay path exists.
6. Architecture drift remains in legacy tests/naming and lint debt.

## 5. Phase Plan

## Phase A: Contract Lock and Drift Triage

Objective:
Freeze working contracts and remove ambiguity in what is “correct”.

Tasks:
1. Audit tests and scripts into `keep / rewrite / delete` buckets against architecture snapshot.
2. Mark all legacy-assumption tests for rewrite/delete.
3. Ensure `docs/CURRENT_ARCHITECTURE_SNAPSHOT.md` and this roadmap stay in sync.

Exit criteria:
1. Triage list completed for `apps/api`, `apps/web`, `services/ephemeris`.
2. No active test in required gates depends on removed architecture.

## Phase B: Ephemeris Reliability Closure

Objective:
Make Skyfield service and API adapter production-stable.

Tasks:
1. Validate strict contracts for:
   - `/health`, `/ready`
   - `/v1/positions/batch`
   - `/v1/sunrise`
2. Expand trusted gold dataset coverage and run strict validator.
3. Validate timeout/error mapping from API `skyfield-client` into user-safe errors.
4. Verify operational kernel behavior (startup/deferred load/recovery).

Exit criteria:
1. `test:ephemeris:high-precision` green.
2. `test:ephemeris:gold:strict` green with trusted set.
3. No P0/P1 ephemeris correctness issue open.

## Phase C: Queue + Worker Hardening

Objective:
Guarantee deterministic lifecycle behavior under load and failure.

Tasks:
1. Validate transitions: queued -> running -> completed/failed/cancelled/retrying.
2. Validate idempotency key behavior under duplicate submissions.
3. Validate startup recovery of interrupted jobs.
4. Validate dead-letter/report artifact persistence.
5. Validate `db_polling` path as primary production lane.
6. Validate `redis_bullmq` path as supported alternate lane (if enabled).

Exit criteria:
1. No orphaned jobs after recovery tests.
2. Retry and cancellation semantics verified in automated tests.
3. Worker readiness/health behavior validated in deploy-like runs.

## Phase D: Stream + Progress Consistency

Objective:
Ensure real-time UX is resilient and consistent with durable job state.

Tasks:
1. Validate SSE behavior for fresh connect, reconnect, and terminal states.
2. Validate `Last-Event-ID` replay with persisted events.
3. Validate polling fallback behavior under SSE failure/timeouts.
4. Validate session ownership enforcement for stream/progress endpoints.

Exit criteria:
1. No duplicate/missing terminal events in replay scenarios.
2. Polling and SSE return equivalent session truth for active/complete/failed states.
3. No unauthorized stream/progress data access paths.

## Phase E: Web/API Integration Closure

Objective:
Ensure Next.js proxy layer and API contract are production-consistent.

Tasks:
1. Validate all `/api/analysis/*` proxy routes and auth forwarding.
2. Validate backend URL and environment contract in web config.
3. Validate rectify dashboard/session actions with external worker mode.
4. ✅ Remove/flag outdated UI naming that implies legacy runtime dependency (COMPLETED).

Exit criteria:
1. End-to-end analysis flow stable via web proxy routes.
2. No auth-token forwarding regressions.
3. No architecture-misaligned UI messaging on critical flows.

## Phase F: Security + Compliance Closure

Objective:
Lock operational security before release.

Tasks:
1. Run secret-safety preflight in release gate.
2. Validate encryption/decryption boundaries in session fields.
3. Validate ownership checks on all session/job/event access paths.
4. Validate rate limiting and anti-abuse constraints.

Exit criteria:
1. No high-severity security finding open.
2. Release gate blocks unsafe env/secrets usage.
3. Unauthorized access tests are green.

## Phase G: Release Engineering and Rollout

Objective:
Ship safely with measurable canary confidence.

Tasks:
1. Freeze release candidate (only blocker fixes allowed).
2. Run full release gate.
3. Deploy sequence:
   - ephemeris
   - api
   - worker
   - web
4. Canary rollout and monitor:
   - API readiness/error rates
   - worker backlog and retries
   - stream reconnect/error rates
   - ephemeris health and latency

Exit criteria:
1. Release gate green.
2. Canary metrics stable.
3. Rollout completed without P0 incident.

## 6. Required Verification Commands

Core:
1. `npm run lint`
2. `npm run test`
3. `npm run test:e2e:smoke`

API critical:
1. `npm -w @ai-pandit/api run phase3:verify`
2. `npm -w @ai-pandit/api run test:full:deterministic`
3. `npm -w @ai-pandit/api run phase5:verify`
4. `npm -w @ai-pandit/api run phase6:release-gate`

Ephemeris:
1. `npm -w @ai-pandit/api run test:ephemeris:high-precision`
2. `npm -w @ai-pandit/api run test:ephemeris:gold:strict`

Worker:
1. `npm -w @ai-pandit/worker run typecheck`

## 7. Operating Cadence

1. Daily:
   - pick top architecture-aligned blocker
   - implement minimal reversible diff
   - run relevant verification matrix
2. Twice weekly:
   - drift review (`CURRENT_ARCHITECTURE_SNAPSHOT.md` vs code reality)
3. Weekly:
   - release readiness scorecard by phase

## 8. Ownership Model

1. Ephemeris reliability owner: service + adapter contract.
2. Queue/worker owner: lifecycle + recovery + retries.
3. Streaming owner: SSE/poll parity + replay integrity.
4. Web integration owner: proxy/auth/session UX flow.
5. Release owner: deploy gates + rollout checks.

## 9. Change Control

Any architecture-impacting change must update both:
1. `docs/CURRENT_ARCHITECTURE_SNAPSHOT.md`
2. `docs/PRODUCTION_READY_ROADMAP.md`

If not updated together, change is incomplete.
