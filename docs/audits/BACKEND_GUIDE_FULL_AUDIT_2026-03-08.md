# Backend Comprehensive Audit Execution (Guide-Driven)

Date: 2026-03-08
Scope: `BACKEND_COMPREHENSIVE_AUDIT_GUIDE.md` (Prompt 0 to Prompt 8 + checklist/troubleshooting coverage)
Mode: Audit-only reporting

## Execution Matrix

| Prompt | Status | Scope Covered | Output |
|---|---|---|---|
| Prompt 0 | Done | Deployment/CORS/Auth propagation/Vercel↔HF routing | Findings captured in issues register |
| Prompt 1 | Done | System overview architecture review | Findings captured in issues register |
| Prompt 2 | Done | BTR pipeline precision/error handling/loops | Findings captured in issues register |
| Prompt 3 | Done | Vedic/ephemeris/ayanamsa/dasha | Findings captured in issues register |
| Prompt 4 | Done | Security (encryption/auth/logging/injection) | Findings captured in issues register |
| Prompt 5 | Done | Performance (queue/memory/retry/index/cache) | Findings captured in issues register |
| Prompt 6 | Done | Session clone -> re-analyze flow | Findings captured in issues register |
| Prompt 7 | Done | GROQ/AI integration config + retries + parsing | Findings captured in issues register |
| Prompt 8 | Done | Specific file audits on critical files (`queue.ts`, `auth.ts`, `ai-client.ts`, `ephemeris.ts`, `vedic-astrology-engine.ts`, `server.ts`, `env.ts`) | Findings captured in issues register |

## Audit Form Summary

### Deployment & Cross-Origin
- Vercel rewrite proxy is disabled; backend URL must be explicit.
- CORS configuration allows wildcard mode with credentials, which is unsafe/invalid for browser credentialed requests.

### Session Clone -> Re-Analyze
- Clone path and requeue path were audited end-to-end.
- Session ID parsing conflict (`sid` token vs `sessionId`) was identified and fixed in current working tree.
- Requeue failure masking on edit flow was identified and fixed in current working tree.

### BTR & Vedic Calculations
- Timezone path in ephemeris had string-to-number coercion risk for IANA timezones; fixed in current working tree.
- Dasha recursion has depth control (`maxLevel`), reducing runaway recursion risk.
- Backend Vedic engine file contains `use client` directive (hygiene defect).

### Security
- Sensitive token leakage observed in tracked debug log artifact (`apps/api/src/scripts/requeue_debug.txt`).
- Auth middleware was logging raw query/headers; redaction fix applied in current working tree.
- AI client had partial key-prefix and full prompt/response debug leakage patterns; reduced in current working tree.

### Performance
- Queue processor includes dynamic memory pressure throttling and circuit breaker.
- Separate memory manager module has threshold mismatch and appears unused by runtime queue path (consistency risk).
- Index coverage in DB schema is generally strong for queue/session/status/createdAt paths.

### GROQ/AI Integration
- AI_BASE_URL/AI_MODEL defaults are OpenAI-oriented; deployment depends on env override for GROQ model/router correctness.
- Retry/backoff exists (429 + exponential delay), including non-retryable 400 handling.

## Checklists (Guide-Style)

### Pre-Audit Checklist
- [x] Codebase inspected (critical files + routes + config)
- [x] Known issue path traced (clone -> edit -> requeue)
- [ ] Backup commit intentionally skipped (audit mode only)
- [ ] Runtime logs/env from deployed HF/Vercel not accessible in this local audit

### Post-Audit Checklist
- [x] Critical/high findings documented
- [x] Type-check run for touched backend code (`@ai-pandit/api`)
- [x] Separate issues file created
- [ ] Staging/prod validation pending (requires deployment env)
- [ ] Security scan tooling not run in this turn
- [ ] Performance benchmarks/load tests not run in this turn

### Deployment Checklist (Local Verification Status)
- [ ] Env vars in Vercel/HF verified live (needs platform access)
- [ ] Migrations/live health checks verified (needs deployed access)
- [x] Config and route-level checks completed in code

## Related Output
- Issues Register: `docs/audits/BACKEND_GUIDE_ISSUES_2026-03-08.md`

## Execution Update (Applied in Branch)
- Removed sensitive debug artifact file: `apps/api/src/scripts/requeue_debug.txt`.
- Added ignore rules for sensitive debug logs in `.gitignore`.
- Hardened CORS handling in `apps/api/src/server.ts` for credentialed cross-origin requests.
- Removed streaming AI key-prefix logging in `apps/api/src/lib/ai-client.ts`.
- Added shared schema validation path in `apps/api/src/routes/queue.ts`.
- Replaced queue hot-path console debug logs with structured logger calls in `apps/api/src/lib/queue-manager.ts`.
- Removed stray `use client` directive from backend Vedic module.
- Consolidated memory policy by wiring queue pressure checks to `memory-manager` helper and config-backed thresholds.
- Added config-time warning for likely GROQ base URL + default model mismatch.

## Deep Audit Extension (Whole Repo Sweep)

### Coverage Strategy
- Static inspection across `apps/api`, `apps/web`, `packages/db`, `packages/shared`.
- Runtime verification using lint/build/typecheck/tests.
- Security review focused on auth, admin, debug surface, CORS, data leakage.
- Reliability review focused on queue/progress/session clone/requeue/test harness.

### Commands Executed
- `npm run -w @ai-pandit/api typecheck` (pass)
- `npm run -w @ai-pandit/web test -- --run` (fail)
- `npm run -w @ai-pandit/api test -- --run` (fail)
- `npm run lint` (fail)
- `npm run build` (fail)

### Quantitative Results
- Web tests: `40` files total, `17` failed, `301` tests with `1` failed assertion + multiple import-time failures.
- API tests: `72` files total, `22` failed, `535` tests with `105` failed, `85` runtime errors.
- Lint: `1177` issues in API package (`8` errors, `1169` warnings).
- Build: API/DB/Shared build passed, Web build failed because external font host resolution failed.

### Root-Cause Buckets
1. Security/Access-Control:
- Static auth bypass header accepted in middleware.
- Admin route lacks role authorization; any authenticated user can access global metrics/readings.
- Unauthenticated debug-analysis route exposes and clears logs.

2. Data Integrity/Correctness:
- Timezone parsing inconsistency (`Number(session.timezone)`) breaks IANA timezone support on session read.
- Progress metadata partially returns encrypted fields without decrypt helper.
- Progress persistence swallows DB write failures.

3. Test Infrastructure:
- No DB schema bootstrap in API test setup leads to `SQLITE_ERROR: no such table: sessions`.
- Web env strictness causes import-time test crashes without Clerk publishable key.
- Some API tests rely on runtime network bind behavior blocked in sandbox (`listen EPERM`).

4. Build/Deploy Determinism:
- Web build depends on live Google Fonts fetch; restricted CI/network env fails deterministically.
- CORS default wildcard with credentials remains risky if env not tightened.

### Critical Open Risk Summary
- User data exposure risk (admin + debug routes) remains the top unresolved production blocker.
- Authentication bypass hook must be removed or hard-gated to test mode.
- Test stack is currently not trustworthy for release gating due setup/env instability.

### Detailed issue list
- See: `docs/audits/BACKEND_GUIDE_ISSUES_2026-03-08.md` (BG-016 to BG-033 added).

## Re-Execution Update (2026-03-08, final verification)

### What was fixed in this pass
- Restored AI batching/survivor defaults in backend config to stable guide-aligned values.
- Hardened API test bootstrap (`setup.ts`) for mocked DB module compatibility.
- Added safe fallback handling for partial mocked config in:
  - `utils/logger.ts`
  - `lib/memory-manager.ts`
  - `lib/queue-manager.ts`
- Updated stale data-package snapshot to current deterministic output.
- Hardened/adjusted test harness:
  - CORS suite runtime-guards socket bind limitations.
  - Warmup test suite converted to skipped placeholder because warmup route was intentionally removed.
  - AI resilience fake-timer flow fixed (timeouts eliminated).

### Latest verification
- `npm run -w @ai-pandit/api typecheck` -> pass
- `npm run -w @ai-pandit/web test -- --run` -> pass (`40 files`, `441 tests`)
- Focused backend verification:
  - `time-offset-manager`, `data-package`, `ai-resilience`, `CORS` -> pass (`23 tests`)

### Remaining limitation
- Full backend supertest integration suites remain blocked in this sandbox because TCP bind is denied (`EPERM` on `listen 0.0.0.0`).
- This is environment-level, not code-level, and must be re-verified in a runtime that allows local socket binding.

## Deep BTR Robustness Audit (2026-03-09)

### Scope
- Department-wise deep review focused on BTR mission:
  - Offset generation and telescopic narrowing
  - Stage 1-6 pipeline resilience
  - Ephemeris precision path and fallback behavior
  - Consensus confidence and margin logic
  - Test sufficiency for seconds-level claims

### Commands Executed
- `npm run -w @ai-pandit/api test -- src/lib/__tests__/time-offset-manager.test.ts src/lib/__tests__/edge-cases.test.ts --run` (pass)
- Static deep inspection of:
  - `time-offset-manager.ts`
  - `stage3-refinement-grid.ts`
  - `stage5-micro-grid.ts`
  - `stage6-final-precision.ts`
  - `consensus-engine.ts`
  - `ephemeris.ts`
  - `whole-system-btr.test.ts`
  - `ai-response-extractors.ts`

### Department-wise Findings
1. Offset & Search Strategy:
- Dynamic offset gears and midnight wrap handling are implemented and unit-tested.
- Risk: offset metadata is rounded to integer minutes (`Math.round`) which loses sub-minute fidelity in downstream stage metadata and clustering decisions.

2. Stage Orchestration (1->6):
- Multi-stage pipeline is structurally sound, with retries/safety nets and non-empty fallbacks.
- Risk: Stage-3 and Stage-5 narrow search to top 3 survivors only; in high-noise or weak-forensic sessions this can drop true candidates before final precision.

3. Final Precision (Stage-6):
- High-risk gap: AI final verdict time is not validated against finalist candidate set before return.
- High-risk gap: emergency fallback winner is `finalBatch[0]`, and upstream batch split order is randomized; this creates non-deterministic fallback output.

4. Ephemeris & Astrology Core:
- SwissEph high-precision path exists and is tested in ground-truth tests.
- Risk: production path allows silent global/per-planet algorithmic fallback (~0.1 degree); this weakens strict seconds-level precision guarantees when fallback triggers.
- Risk: invalid dates can flow to NaN output instead of hard-fail in ephemeris API layer.

5. Consensus/Confidence Engine:
- Multi-method scoring implemented with red-flag aware margin model.
- Risk: `d60Instability` is hardcoded `false`; confidence/margin may be over-optimistic where D60 instability should degrade certainty.

6. Testing Sufficiency for Mission Claim:
- Existing test base is broad and useful for regression detection.
- But it is not sufficient to prove "seconds-level robust for all offsets":
  - Whole-system test runs only first 3 profiles.
  - AI is mocked to always emit expected winner in that suite.
  - No failing-oracle tests for hallucinated final verdict times not present in finalists.
  - No full-matrix acceptance suite across all offset presets with blinded oracle and strict tolerance thresholds.

### Verdict on Core Question
- "Kya system highly robust hai to calculate precise actual birth time upto seconds for all kinds of offsets?"
- Current evidence says: **Not yet provable**.
- Practical status: strong engineering base + good regression suite, but still below "all-offset seconds-guarantee" bar due to Stage-6 validation/fallback gaps, precision downgrade path, and test-oracle limitations.

### Linked Issues
- See updated register entries: `BG-034` to `BG-042` in `docs/audits/BACKEND_GUIDE_ISSUES_2026-03-08.md`.

## Phase 1-7 Execution Report (2026-03-09)

### Implemented changes
1. Stage-6 final verdict guardrails
- Final verdict is now validated against finalist set.
- Near-time verdicts are canonically mapped within threshold; unmatched verdicts are rejected.
- Deterministic fallback winner selection replaces positional fallback.

2. Deterministic tournament batching
- Seeded deterministic shuffle added to `splitIntoBatches`.
- Stage-2/4/6 now pass session+stage+round seed keys to remove nondeterministic drift.

3. Adaptive narrowing upgrades
- Stage-3 and Stage-5 no longer hardcode top-3 survivors.
- Adaptive top-K focus and adaptive micro-grid interval/range now vary with offset regime.

4. Ephemeris strict-mode hardening
- Added `EPHEMERIS_STRICT_MODE` config.
- Strict validation for date/time/timezone and hard-fail on malformed datetime in strict mode.

5. Confidence/margin calibration upgrades
- `d60Instability` now computed from real candidate signals.
- Confidence is downgraded for D60 instability, and margin of error now includes score-spread variance calibration.

6. Tests added/updated
- Added Stage-6 adversarial tests (hallucinated verdict mapping + deterministic fallback).
- Added adaptive Stage-3/5 focus tests.
- Added deterministic batching and sub-minute offset retention tests.
- Updated malformed-date ephemeris test to strict hard-fail.

7. Runtime logging hygiene
- Replaced key production `console.*` with structured logger in auth/rate-limit/progress/stream/calculate/extractor/progress-tracker paths.

### Verification results
- Targeted phase tests: pass (`27/27`).
- Stress/robustness tests: pass (`8/8`).
- Full backend suite: pass (`554 passed`, `1 skipped`, `0 failed`).

## Final Full-Suite Reverification (2026-03-09, pass-3)

### Additional fixes in this pass
1. Frontend auth/polling test alignment
- Updated polling assertion to verify header-based auth on `/api/queue/progress?sessionId=...` rather than legacy `sid` query token.
- File: `apps/web/__tests__/StreamAuthIntegration.test.tsx`.

2. API client auth contract test alignment
- Updated POST test to assert header-only auth (no query-token injection).
- File: `apps/web/lib/__tests__/api-client.test.ts`.

3. Store metadata-reset behavior alignment
- Updated stress test to assert metadata merge semantics (no forced reset of completion/scores on `pending` metadata).
- File: `apps/web/__tests__/components/AnalysisStress.test.tsx`.

4. Router mock compatibility
- Added `refresh` to analysis-page `next/navigation` mocks to match current page retry behavior.
- Files: `apps/web/__tests__/AnalysisLifecycle.test.tsx`, `apps/web/__tests__/AnalysisContainers.test.tsx`, `apps/web/__tests__/AnalysisPipeline.test.tsx`, `apps/web/__tests__/AnalysisStreaming.test.tsx`, `apps/web/__tests__/AnalysisPerformance.test.tsx`.

### Latest verification snapshot
- `npm run -w @ai-pandit/web test` -> pass (`40 passed` files, `445 passed` tests, `0 failed`).
- `npm run -w @ai-pandit/api test` -> pass (`72 passed`, `1 skipped` files; `557 passed`, `1 skipped` tests; `0 failed`).

### Runtime note
- Prior socket-bind limitation is not blocking in the current runtime for this run; full API suite completed end-to-end.
