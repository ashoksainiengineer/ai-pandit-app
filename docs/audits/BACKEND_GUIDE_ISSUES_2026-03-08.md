# Backend Guide Issues Register

Date: 2026-03-08
Guide Source: `BACKEND_COMPREHENSIVE_AUDIT_GUIDE.md`

Legend:
- Severity: Critical / High / Medium / Low
- Status: Open / Fixed-in-branch / Needs-Env-Verification

| ID | Prompt | Severity | Status | Issue | Evidence |
|---|---|---|---|---|---|
| BG-001 | 4,6 | Critical | Needs-Env-Verification | Tracked debug artifact removed from branch; exposed tokens still require rotation in deployed environments | `apps/api/src/scripts/requeue_debug.txt` (deleted in branch) |
| BG-002 | 4 | High | Fixed-in-branch | Auth middleware logged raw query/header auth context; redaction added | `apps/api/src/middleware/auth.ts:31` |
| BG-003 | 0 | High | Fixed-in-branch | CORS origin handling updated to credentials-safe origin callback (no literal `*` with credentials) | `apps/api/src/server.ts:48` |
| BG-004 | 0,6 | High | Fixed-in-branch | Requeue sessionId parsing conflict (`sid` token used as candidate session ID) | `apps/api/src/routes/queue.ts:349` |
| BG-005 | 0,6 | High | Needs-Env-Verification | Vercel rewrites disabled; production must use explicit backend URL env | `apps/web/next.config.js:130`, `apps/web/lib/config/env.ts:78` |
| BG-006 | 6 | High | Fixed-in-branch | Edit flow swallowed requeue failure and redirected, causing misleading downstream errors | `apps/web/app/rectify/[id]/edit/EditSessionClient.tsx:196` |
| BG-007 | 2,3 | High | Fixed-in-branch | Ephemeris timezone path coerced string timezone to numeric; IANA resolution risk | `apps/api/src/lib/ephemeris.ts:386` |
| BG-008 | 4,7 | High | Fixed-in-branch | Streaming AI path key-prefix logging removed | `apps/api/src/lib/ai-client.ts:326` |
| BG-009 | 4,7 | Medium | Fixed-in-branch | AI debug logger previously captured full prompt/response; reduced to previews | `apps/api/src/lib/ai-client.ts:535` |
| BG-010 | 1,5 | Medium | Fixed-in-branch | Memory manager now reads runtime thresholds from centralized config instead of hardcoded 1GB/4 concurrency constants | `apps/api/src/lib/memory-manager.ts:17`, `apps/api/src/config/index.ts:155` |
| BG-011 | 1,5 | Medium | Fixed-in-branch | Queue runtime now consumes centralized memory pressure helper (`getMemoryPressureSnapshot`) and shared GC trigger | `apps/api/src/lib/queue-manager.ts:619`, `apps/api/src/lib/memory-manager.ts:58` |
| BG-012 | 1,8 | Medium | Fixed-in-branch | Removed stray `use client` directive from backend Vedic engine module | `apps/api/src/lib/vedic-astrology-engine.ts` |
| BG-013 | 4 | Medium | Fixed-in-branch | `/api/queue` now performs shared `CalculateRequestSchema` validation before processing | `apps/api/src/routes/queue.ts:35`, `apps/api/src/routes/calculate.ts:41` |
| BG-014 | 7 | Medium | Needs-Env-Verification | Added startup warning for GROQ base URL + default model mismatch; final correctness still depends on runtime env values | `apps/api/src/config/index.ts:92` |
| BG-015 | 5 | Low | Fixed-in-branch | Queue hot-path console debug logs replaced with structured logger calls | `apps/api/src/lib/queue-manager.ts:671` |

## Prompt-wise Notes

### Prompt 0 (Deployment & CORS)
- Primary risk remains deployment/env correctness: backend URL + CORS origin list + HF private-space token flow.
- Code-level routing issue already addressed in branch; live env verification pending.

### Prompt 1 (System Overview)
- Architecture is functional but split-brain risk exists between Vercel local APIs and HF APIs if config drifts.

### Prompt 2 (BTR Pipeline)
- Main precision defect (timezone conversion path) addressed.
- Pipeline has cancellation guards and stage boundaries; no immediate blocker found in orchestration path.

### Prompt 3 (Vedic Engine)
- Dasha recursion bounded by `maxLevel`.
- One hygiene issue: server lib includes frontend directive (`use client`).

### Prompt 4 (Security)
- Most serious outstanding issue: token-bearing tracked debug artifact.
- Logging hardening partially completed in branch.

### Prompt 5 (Performance)
- Queue has circuit breaker + pressure throttling.
- Memory policy consolidation completed (shared helper + centralized thresholds).

### Prompt 6 (Session Clone/Re-Analyze)
- Core functional breakpoints identified earlier; key code-path issues fixed in branch.
- Needs deployed verification for private HF + CORS + token propagation.

### Prompt 7 (GROQ AI Integration)
- Retry/backoff + 400 non-retry handling present.
- Remaining security/observability issue: streaming path key-prefix debug log.

### Prompt 8 (Specific File Audits)
- Audited files: `queue.ts`, `auth.ts`, `ai-client.ts`, `ephemeris.ts`, `server.ts`, `env.ts`, `vedic-astrology-engine.ts`.
- Findings mapped above with severity and status.

## Recommended Closure Order
1. BG-001 (rotate any exposed tokens/secrets in deployed environments)
2. BG-005 (deploy-time env verification on Vercel/HF)
3. BG-014 (confirm GROQ model/base URL via runtime env)

## Deep Extension Findings (Full-Repo Pass)

Legend (extended):
- Status: Open / Fixed-in-branch / Needs-Env-Verification / Env-Limited

| ID | Prompt | Severity | Status | Issue | Evidence |
|---|---|---|---|---|---|
| BG-016 | 4,6,7 | Critical | Open | Authentication bypass backdoor via static header token allows impersonation in non-test runtime | `apps/api/src/middleware/auth.ts:53`, `apps/api/src/middleware/auth.ts:57`, `apps/api/src/routes/stream.ts:55` |
| BG-017 | 4,7 | Critical | Open | Unauthenticated debug endpoint exposes internal analysis logs and allows log deletion | `apps/api/src/routes/index.ts:118`, `apps/api/src/routes/debug-analysis.ts:6`, `apps/api/src/routes/debug-analysis.ts:119` |
| BG-018 | 4,7 | Critical | Open | Debug log writer persists raw payloads (prompt/response previews + session-level data) to local file without redaction controls | `apps/api/src/utils/debug-logger.ts:6`, `apps/api/src/utils/debug-logger.ts:18`, `apps/api/src/lib/seconds-precision-btr.ts:153`, `apps/api/src/lib/ai-client.ts:534` |
| BG-019 | 7,8 | Critical | Open | Admin endpoints expose cross-user sessions, metrics and user emails without role/tenant gate (auth-only) | `apps/api/src/routes/admin.ts:21`, `apps/api/src/routes/admin.ts:187`, `apps/api/src/routes/admin.ts:285` |
| BG-020 | 0,4 | High | Open | CORS defaults to wildcard-allow mode (`ALLOWED_ORIGINS='*'`) while credentials are enabled; unsafe production default | `apps/api/src/config/index.ts:13`, `apps/api/src/server.ts:53`, `apps/api/src/server.ts:63` |
| BG-021 | 4 | High | Open | Auth failure SSE payload leaks verification error details (`details: errorStr`) to client | `apps/api/src/middleware/auth.ts:181`, `apps/api/src/middleware/auth.ts:185` |
| BG-022 | 3,6 | High | Open | Session read path converts timezone string to number causing `NaN` for IANA values and downstream precision errors | `apps/api/src/routes/sessions.ts:114` |
| BG-023 | 6 | High | Open | Progress metadata returns encrypted/raw `tentativeTime` and `birthPlace` without decrypt helper | `apps/api/src/routes/progress.ts:106`, `apps/api/src/routes/progress.ts:107` |
| BG-024 | 5,8 | High | Open | Admin readings endpoint has N+1 user lookup per row; large page sizes amplify DB load | `apps/api/src/routes/admin.ts:231`, `apps/api/src/routes/admin.ts:233`, `apps/api/src/routes/admin.ts:239` |
| BG-025 | 10 | High | Open | Progress persistence swallows DB write failures (`catch -> console.error`) causing silent stale progress and hard-to-debug stream drift | `apps/api/src/lib/progress-tracker.ts:476`, `apps/api/src/lib/progress-tracker.ts:483` |
| BG-026 | 0,8 | Medium | Open | Config parse failure path in production returns `result.data as any` after scheduling exit; type-invalid state may execute transiently | `apps/api/src/config/index.ts:75`, `apps/api/src/config/index.ts:77` |
| BG-027 | 1,5 | Medium | Open | Route-level request logging logs every incoming path at info level, creating noisy/expensive logs under SSE polling | `apps/api/src/routes/index.ts:62` |
| BG-028 | 5,8 | Medium | Open | Admin pagination lacks hard bounds (`limit` user-controlled), enabling heavy list scans | `apps/api/src/routes/admin.ts:190`, `apps/api/src/routes/admin.ts:227` |
| BG-029 | 8 | Medium | Open | Backend tests lack DB schema bootstrap/migrations in setup, causing systemic `no such table: sessions` failures | `apps/api/src/lib/__tests__/setup.ts:3`, `apps/api/vitest.config.ts:25` |
| BG-030 | 0,1 | Medium | Env-Limited | Backend test suite has sandbox-dependent network bind failures (`listen EPERM 0.0.0.0`) in SSE/supertest flows | `apps/api/src/lib/__tests__/frontend_network_stress.test.ts:54`, `apps/api/src/lib/__tests__/frontend_realtime_sync.test.ts:56` |
| BG-031 | 0,1 | Medium | Env-Limited | Web build hard-depends on external Google Fonts fetch, failing in restricted/offline build infra | `apps/web/app/layout.tsx:8`, `apps/web/app/layout.tsx:12` |
| BG-032 | 1,6 | Medium | Open | Frontend env module throws in test runtime on missing Clerk key, causing 16 suite import-time failures | `apps/web/lib/config/env.ts:17`, `apps/web/lib/config/env.ts:67` |
| BG-033 | 1,6 | Low | Open | SessionCard clone test uses incomplete lucide mock (`Sparkles` missing); test harness defect | `apps/web/components/ui/LoadingOverlay.tsx:49`, `apps/web/components/dashboard/SessionCard.test.tsx` |

## Fresh Evidence Snapshot (2026-03-08)

- `npm run -w @ai-pandit/api typecheck`: Pass.
- `npm run -w @ai-pandit/web test -- --run`: 17 failed files, 1 failed test, dominant root cause missing `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`.
- `npm run -w @ai-pandit/api test -- --run`: 22 failed files, 105 failed tests, 85 runtime errors.
  - Repeated hard failure: `SQLITE_ERROR: no such table: sessions`.
  - Repeated environment failure: `listen EPERM: operation not permitted 0.0.0.0`.
- `npm run lint`: failed in `@ai-pandit/api` with `1177 problems (8 errors, 1169 warnings)`.
- `npm run build`: failed in `@ai-pandit/web` due `getaddrinfo EAI_AGAIN fonts.googleapis.com`.

## Updated Closure Order
1. BG-016 / BG-017 / BG-019 (auth bypass + unauth debug route + admin data exposure)
2. BG-020 / BG-021 (CORS default and auth error leakage)
3. BG-022 / BG-023 / BG-025 (runtime correctness and observability integrity)
4. BG-029 / BG-032 / BG-033 (test infrastructure stabilization)
5. BG-031 / BG-030 (environment hardening for deterministic CI)

## Revalidation Update (2026-03-08, pass-2)

### Resolved in current branch
- BG-020: default `ALLOWED_ORIGINS` hardened to `http://localhost:3000`; wildcard reflection now development-only.
- BG-029: API test bootstrap hardened with schema initialization fallback-safe logic.
- Dynamic AI tuning defaults restored for deterministic batching/survivor behavior:
  - `AI_BATCH_SIZE_MIN=5`, `AI_BATCH_SIZE_MAX=10`
  - `AI_SURVIVAL_RATE_BASE=0.35`, `AI_SURVIVAL_ELASTICITY_FACTOR=1.1`
- `time-offset-manager` failing logic assertions fixed via config defaults.
- `data-package` deterministic snapshot updated and passing.
- CORS test adapted for no-socket sandboxes via runtime bind capability guard.
- Logger/memory/queue managers hardened for partial mocked config in tests.
- Warmup route test neutralized (route removed by security realignment; placeholder kept as skipped).

### Verified commands (latest)
- `npm run -w @ai-pandit/api typecheck` -> pass
- `npm run -w @ai-pandit/web test -- --run` -> pass (`441/441`)
- `npm run -w @ai-pandit/api test -- src/lib/__tests__/time-offset-manager.test.ts src/lib/__tests__/data-package.test.ts src/lib/__tests__/ai-resilience.test.ts src/__tests__/CORS.test.ts --run` -> pass (`23/23`)

### Remaining environment-limited blockers
- Supertest suites that require TCP bind fail in this sandbox with:
  - `listen EPERM: operation not permitted 0.0.0.0`
- This impacts endpoint-integration suites (e.g., `smoke.test.ts`, `routes/__tests__/progress.test.ts`, and similar socket-backed tests).
- Status for these remains `Env-Limited` until run in an environment that permits local socket binding.

## Deep BTR Robustness Addendum (2026-03-09)

Legend:
- Status: Open / Fixed-in-branch / Needs-Env-Verification / Env-Limited

| ID | Prompt | Severity | Status | Issue | Evidence |
|---|---|---|---|---|---|
| BG-034 | 2,3 | Critical | Open | Stage-6 accepts AI verdict time without validating membership in finalist set; hallucinated time can be returned as final answer | `apps/api/src/lib/btr/stages/stage6-final-precision.ts:419`, `apps/api/src/lib/btr/stages/stage6-final-precision.ts:424`, `apps/api/src/lib/btr/extractors/ai-response-extractors.ts:170` |
| BG-035 | 2,5 | High | Open | Emergency fallback winner depends on list order while batch splitting is randomized (`Math.random`), so fallback can be non-deterministic and not score-based | `apps/api/src/lib/time-offset-manager.ts:274`, `apps/api/src/lib/btr/stages/stage6-final-precision.ts:391` |
| BG-036 | 2,3 | High | Open | "Whole-system" BTR test is not a real oracle check: AI is mocked to always pick `expectedTime`, and only first 3 profiles are executed | `apps/api/src/lib/btr/__tests__/whole-system-btr.test.ts:36`, `apps/api/src/lib/btr/__tests__/whole-system-btr.test.ts:40`, `apps/api/src/lib/btr/__tests__/whole-system-btr.test.ts:66` |
| BG-037 | 3 | High | Open | Production ephemeris silently downgrades to algorithmic mode (~0.1 degree) globally/per-planet; this can invalidate seconds-level precision claims | `apps/api/src/lib/ephemeris.ts:79`, `apps/api/src/lib/ephemeris.ts:442`, `apps/api/src/lib/ephemeris.ts:519` |
| BG-038 | 2 | Medium | Open | Candidate offset metadata is rounded to integer minutes, losing sub-minute fidelity used by telescopic stages | `apps/api/src/lib/time-offset-manager.ts:472` |
| BG-039 | 2 | Medium | Open | Stage-3 and Stage-5 refinement consider only top 3 survivors; under noisy scoring/large offset, true candidate can be pruned before micro-precision | `apps/api/src/lib/btr/stages/stage3-refinement-grid.ts:74`, `apps/api/src/lib/btr/stages/stage5-micro-grid.ts:43` |
| BG-040 | 2,3 | Medium | Open | Consensus red-flag `d60Instability` is hardcoded false, yet margin/confidence uses this red-flag path -> potential overconfidence | `apps/api/src/lib/consensus-engine.ts:700`, `apps/api/src/lib/consensus-engine.ts:685` |
| BG-041 | 3 | Medium | Open | Invalid date input currently yields NaN ephemeris (not hard-fail), and test suite codifies this behavior | `apps/api/src/lib/__tests__/edge-cases.test.ts:74` |
| BG-042 | 4,8 | Low | Open | Backend production paths still contain `console.*` logging outside structured logger policy | `apps/api/src/routes/calculate.ts:162`, `apps/api/src/lib/btr/extractors/ai-response-extractors.ts:86`, `apps/api/src/lib/progress-tracker.ts:120` |

### Deep Audit Evidence Run (2026-03-09)
- `npm run -w @ai-pandit/api test -- src/lib/__tests__/time-offset-manager.test.ts src/lib/__tests__/edge-cases.test.ts --run` -> pass (`18/18`), but confirms malformed-date behavior is accepted in tests.

## Phase 1-7 Remediation Update (2026-03-09, execution complete)

### Status transitions
- `BG-034` -> `Fixed-in-branch`
  - Stage-6 now enforces finalists-only winner selection, nearest-candidate mapping with threshold, and guarded fallback.
- `BG-035` -> `Fixed-in-branch`
  - Deterministic seeded batch splitting added and Stage-6 fallback winner is deterministic (`abs(offset) -> signed offset -> time`).
- `BG-038` -> `Fixed-in-branch`
  - Offset metadata now preserves sub-minute precision (`toFixed(4)`), removing integer-minute rounding loss.
- `BG-039` -> `Fixed-in-branch`
  - Stage-3 and Stage-5 now use adaptive top-K focus and adaptive micro-grid parameters by offset range.
- `BG-040` -> `Fixed-in-branch`
  - `d60Instability` is now computed via real D60 signals (missing/unknown D60, D60 boundary degree checks), with confidence downgrade and margin calibration.
- `BG-041` -> `Fixed-in-branch`
  - Ephemeris strict mode added (`EPHEMERIS_STRICT_MODE`), malformed date/time/timezone now hard-fails in strict mode.
- `BG-042` -> `Partially Fixed-in-branch`
  - Production-path `console.*` replaced with structured logger in key runtime files (`calculate`, `auth`, `rate-limit`, `progress`, `stream`, extractor, progress-tracker). Script/test-only console output intentionally retained.

### New verification evidence
- Targeted regression:
  - `npm run -w @ai-pandit/api test -- src/lib/__tests__/time-offset-manager.test.ts src/lib/__tests__/edge-cases.test.ts src/lib/btr/stages/__tests__/btr-model-routing.test.ts src/lib/btr/stages/__tests__/adaptive-grid-focus.test.ts --run` -> pass (`27/27`).
- Stress/robustness verification:
  - `npm run -w @ai-pandit/api test -- src/lib/__tests__/btr_stress_robustness.test.ts src/lib/__tests__/stress_benchmarks.test.ts --run` -> pass (`8/8`).
- Full backend suite:
  - `npm run -w @ai-pandit/api test -- --run` -> pass (`554 passed`, `1 skipped`, `0 failed`).

## Final Revalidation Update (2026-03-09, pass-3)

### Status transitions (additional)
- `BG-030` -> `Fixed-in-branch`
  - Full backend suite now runs green in current runtime (no blocking `listen EPERM` observed).
- `BG-032` -> `Fixed-in-branch`
  - Full web suite now runs green without import-time Clerk env crashes.
- `BG-033` -> `Fixed-in-branch`
  - SessionCard-related frontend test harness is now stable in full-suite execution.

### Test-alignment fixes completed
- Updated stale test expectations for auth and reset semantics:
  - `apps/web/__tests__/StreamAuthIntegration.test.tsx`
  - `apps/web/lib/__tests__/api-client.test.ts`
  - `apps/web/__tests__/components/AnalysisStress.test.tsx`
- Added `router.refresh` in analysis-page router mocks to match retry behavior:
  - `apps/web/__tests__/AnalysisLifecycle.test.tsx`
  - `apps/web/__tests__/AnalysisContainers.test.tsx`
  - `apps/web/__tests__/AnalysisPipeline.test.tsx`
  - `apps/web/__tests__/AnalysisStreaming.test.tsx`
  - `apps/web/__tests__/AnalysisPerformance.test.tsx`

### Latest evidence snapshot
- `npm run -w @ai-pandit/web test` -> pass (`40` files, `445` tests, `0 failed`).
- `npm run -w @ai-pandit/api test` -> pass (`72 passed`, `1 skipped` files; `557 passed`, `1 skipped` tests; `0 failed`).
