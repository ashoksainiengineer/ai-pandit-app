# Backend Production Test Blueprint (Industry-Standard)

Last updated: 2026-03-12
Scope: `apps/api`, `packages/db`, `packages/shared`

## Objective

Design and enforce a backend test program that is production-grade for correctness, security, reliability, performance, resiliency, and operability.

## Standards Baseline (Primary Sources)

- OWASP API Security Top 10 (2023)
  - https://owasp.org/API-Security/editions/2023/en/0x00-header/
- OWASP ASVS (verification standard)
  - https://owasp.org/www-project-application-security-verification-standard/
- OpenAPI Specification (contract-first API)
  - https://spec.openapis.org/oas/latest.html
- PostgreSQL Transaction Isolation + Locking
  - https://www.postgresql.org/docs/current/transaction-iso.html
  - https://www.postgresql.org/docs/current/explicit-locking.html
- Server-Sent Events behavior (`Last-Event-ID`)
  - https://html.spec.whatwg.org/multipage/server-sent-events.html
- Cloud Run runtime, timeout, concurrency, service auth
  - https://cloud.google.com/run/docs/configuring/request-timeout
  - https://cloud.google.com/run/docs/configuring/concurrency
  - https://cloud.google.com/run/docs/authenticating/service-to-service
- OpenTelemetry HTTP semantic conventions
  - https://opentelemetry.io/docs/specs/semconv/http/http-spans/
- Vitest mocking and performance guidance
  - https://vitest.dev/guide/mocking.html
  - https://vitest.dev/guide/improving-performance.html

## Test Taxonomy (What must exist)

1. Unit tests
- Pure logic, deterministic functions, parsing, scoring, security guards.

2. Component/service tests
- Job service, queue manager, SSE stream manager, encryption adapter, artifact storage.

3. Contract tests
- Shared Zod/OpenAPI response contracts and backward-compat checks.

4. Integration tests
- Route + middleware + DB repository behavior together.

5. Reliability/resilience tests
- Retry, cancellation, crash recovery, race conditions, duplicate suppression, checkpoint resume.

6. Performance tests
- Throughput, latency SLO assertions, memory ceilings, queue backpressure.

7. Security tests
- IDOR, auth bypass, request smuggling patterns, prompt injection, payload fuzzing, secret redaction.

8. Operational tests
- Health/readiness/metrics integrity, alert trigger simulation, runbook smoke scripts.

## Subsystem Matrix (Required coverage)

1. Auth + ownership
- Token verification edge cases (null/undefined/object token).
- Stream policy and ticket validation.
- Cross-user access denial (IDOR).

2. API contracts
- All endpoints return standardized `sendSuccess/sendError` schema.
- Error code mapping stability.
- Backward-compatible fields for frontend polling and SSE replay.

3. Queue + job lifecycle
- Enqueue idempotency key behavior and hash mismatch conflict.
- CAS race when multiple workers claim same job.
- Retry exhaustion and dead-letter artifact creation.
- Cancel transition boundaries and terminal state safety.

4. Persistence layer
- Transaction rollback safety.
- Unique key conflict handling (`23505`) under parallel submits.
- Isolation-sensitive read/write behavior for queue claims.

5. SSE + polling consistency
- `Last-Event-ID` incremental replay.
- Partial missed windows with persisted event source.
- Duplicate suppression across in-memory and persisted replays.
- Fallback polling sync correctness.

6. Encryption compatibility
- Legacy format support (3-part and 4-part data where applicable).
- Decryption migration paths and invalid payload handling.
- Sensitive field non-leakage in logs and error bodies.

7. BTR core pipeline
- Stage-by-stage contract invariants.
- Data package completeness (no missing required AI fields).
- Out-of-candidate failure semantics and fallback correctness.

8. Ephemeris + astronomy reliability
- Provider parity checks (Swiss/Skyfield where enabled).
- High-latitude and boundary-time test vectors.
- Non-silent fallback behavior in strict precision mode.

9. Observability + operations
- Request ID propagation.
- Trace context propagation.
- Structured logs include required correlation identifiers.
- Metrics shape stability for dashboards/alerts.

## Edge-Case Checklist (Must test)

- Invalid but regex-valid dates (`YYYY-MM-DD` overflow).
- Queue duplicate submission storms (same and different idempotency payloads).
- Worker restart mid-stage with checkpoint replay.
- Network flap during SSE stream and re-subscription with cursor.
- DB transient errors vs permanent failures.
- GCS unavailable fallback for artifact persistence.
- Malicious payload depth/size and nested sensitive keys.
- Timezone and polar-location birth inputs.

## CI Gate Criteria (Production readiness)

1. Fast gate (PR)
- Unit + contract + critical integration suites mandatory.
- No flaky-test retries in green path.

2. Slow gate (nightly)
- Performance, stress, chaos/restart, and long-running reliability suites.

3. Release gate
- Cloud Run smoke flow (`web -> api -> worker`) + metrics/alerts verification.
- Security regression suite must pass.

## New test files added in this update

- `apps/api/src/middleware/__tests__/request-id.test.ts`
- `apps/api/src/lib/jobs/__tests__/artifact-storage.test.ts`
- `apps/api/src/lib/jobs/__tests__/job-service.validation-idempotency.test.ts`

## Immediate next additions recommended

1. `apps/api/src/lib/jobs/__tests__/job-service.transactional-failure.test.ts`
- Force transaction error + assert no partial session/job residue.

2. `apps/api/src/lib/jobs/__tests__/job-service.idempotency-race.test.ts`
- Parallel same-key submit under unique violation and replay correctness.

3. `apps/api/src/routes/__tests__/jobs.sync.resilience.test.ts`
- Corrupt/missing event payloads + cursor drift across reconnect loops.

4. `apps/api/src/lib/__tests__/queue-manager.restart-chaos.test.ts`
- Randomized crash points and deterministic resume outcome assertions.

5. `apps/api/src/routes/__tests__/response-contract.snapshotless.test.ts`
- Schema-based validation for every route response (no snapshot brittleness).
