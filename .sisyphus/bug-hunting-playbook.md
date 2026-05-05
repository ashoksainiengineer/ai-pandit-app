# 🔱 AI-Pandit Bug Hunting Playbook

> **Classification**: Internal Security Assessment  
> **Date**: May 4, 2026  
> **Scope**: Full-stack monorepo (7 packages, 2 services)  
> **Methodology**: Attack-surface-driven reconnaissance → vulnerability classification → evidence verification → risk scoring

---

## Table of Contents

1. [Reconnaissance Methodology](#1-reconnaissance-methodology)
2. [Attack Surface Taxonomy](#2-attack-surface-taxonomy)
3. [Vulnerability Classification Matrix](#3-vulnerability-classification-matrix)
4. [Critical Finding Deep-Dives](#4-critical-finding-deep-dives)
5. [Hunting Checklist by Layer](#5-hunting-checklist-by-layer)
6. [Tooling & Automation](#6-tooling--automation)
7. [Remediation Playbook](#7-remediation-playbook)

---

## 1. Reconnaissance Methodology

### Phase 1: Architecture Mapping (30 min)
- Read AGENTS.md, README.md, all package.json files
- Map the service dependency graph: Web → API → DB/Worker/Ephemeris
- Identify auth layer (Clerk), encryption layer (AES-256-GCM), database layer (Drizzle + Neon)
- Map CI/CD pipeline (Cloud Run, Vercel, GitHub Actions)

### Phase 2: Surface Enumeration (7 parallel agents, ~7 min)
```
Agent 1: Map ALL Express API routes + middleware chains + auth gates
Agent 2: Find ALL encryption/hashing/token/crypto operations
Agent 3: Find ALL database queries + raw SQL + dynamic query building
Agent 4: Find ALL Zod schemas + AppError hierarchy + error leakage
Agent 5: Map ALL auth patterns (Clerk, sessions, tokens, CORS)
Agent 6: Find ALL race conditions (queues, async state, SSE, Zustand)
Agent 7: Catalog ALL dependencies + CVEs across packages
```

### Phase 3: Evidence Verification (per finding)
For each finding, read the actual source file, confirm the vulnerable pattern exists, document the exact lines, and assess exploitability.

### Phase 4: Risk Scoring
- **CRITICAL**: Auth bypass, data exposure, RCE, CVSS ≥ 9.0
- **HIGH**: Race condition with data corruption, injection, auth bypass with constraints
- **MEDIUM**: Information leakage, DoS, missing validation, deprecated EOL packages
- **LOW**: Defense-in-depth gaps, test-only issues, theoretical concerns

---

## 2. Attack Surface Taxonomy

### Surface 1: Authentication & Authorization
| Component | Technology | Key Files |
|-----------|-----------|-----------|
| Frontend Auth | `@clerk/nextjs` v6.37.4 | `apps/web/middleware.ts` |
| API Auth | `@clerk/backend` v1.34.0 (v2.31.0 resolved) | `apps/api/src/middleware/auth.ts` |
| Webhook Auth | Svix signatures | `apps/web/app/api/webhooks/clerk/route.ts` |
| Stream Auth | Single-use UUID tickets | `apps/api/src/lib/stream-ticket-manager.ts` |
| Ownership | `isSessionOwnedByContext()` | `apps/api/src/lib/session-ownership.ts` |
| Admin Auth | `requireAdmin()` DB role check | `apps/api/src/routes/admin.ts` |

### Surface 2: Data at Rest
| What | Algorithm | Key Files |
|------|-----------|-----------|
| Birth data | AES-256-GCM + scrypt (v4) | `apps/api/src/lib/encryption/DANGER_DO_NOT_MODIFY.ts` |
| Client encryption | AES-256-GCM + scrypt (mirror) | `apps/web/lib/crypto.ts` |
| Life events | AES-256-GCM (server-side) | `apps/api/src/routes/sessions.ts` |
| Analysis results | AES-256-GCM (server-side) | `apps/api/src/lib/jobs/job-service.ts` |
| Token signing | ENCRYPTION_SECRET (reuse) | `apps/api/src/config/index.ts:250` |

### Surface 3: Data in Transit
| Layer | Protection |
|-------|-----------|
| Web ↔ API | Bearer token (Clerk JWT) + HTTPS (Cloud Run) |
| API ↔ DB | Neon connection string (TLS) |
| API ↔ Redis | Upstash (TLS) |
| API ↔ Ephemeris | HTTP (localhost/Cloud Run internal) |
| Backend Proxy | `apps/web/lib/server/backend-proxy.ts` |

### Surface 4: Input Validation
| Layer | Mechanism | Coverage |
|-------|-----------|----------|
| API body validation | `validateBody(ZodSchema)` | Queue submit, consent only |
| API params validation | `validateParams(ZodSchema)` | Consent sessionId only |
| AI prompt injection | `security-guard.ts` regex patterns | All AI inputs |
| XSS output | `xss-sanitizer.ts` HTML entities | AI content display |
| Environment validation | `envSchema.safeParse()` | Startup only |

### Surface 5: Concurrency & State
| Component | Mechanism | Risk |
|-----------|-----------|------|
| Job queue | In-memory Set + DB-polling | TOCTOU |
| Stream connections | Global EventEmitter + Maps | Buffer races |
| Session events | 7 concurrent Maps | Data loss |
| Frontend state | Zustand stores | Double-flush |

### Surface 6: Dependencies
| Category | Count | CVEs |
|----------|-------|------|
| Critical | 3 | Clerk route bypass (CVSS 9.1), Clerk auth bypass, jsPDF injection |
| High | 12 | path-to-regexp ReDoS, undici smuggling, vite traversal |
| Moderate | 20 | picomatch, minimatch, yaml |
| Low | 6 | Various |
| Deprecated EOL | 11 | eslint@8, glob@7, rimraf@3, inflight |

---

## 3. Vulnerability Classification Matrix

### Injection Vulnerabilities
| ID | Type | Location | User Input | Risk |
|----|------|----------|-----------|------|
| SQLI-001 | String interpolation in SQL | `security-audit.test.ts:201` | UUID (indirect) | LOW |
| XSS-001 | Missing sanitizeString in API schema | `middleware/validation.ts:15` | User fullName | **HIGH** |
| PROMPT-001 | AI prompt injection | `security-guard.ts` - blocked | User traits | MITIGATED |

### Broken Authentication
| ID | Type | Location | Impact | Risk |
|----|------|----------|--------|------|
| AUTH-001 | Webhook route NOT in public matcher | `middleware.ts:5-15` | Clerk webhooks blocked | **CRITICAL** |
| AUTH-002 | Unprotected /api/routes-test | `routes/index.ts:123` | Unauthenticated access | **HIGH** |
| AUTH-003 | Inconsistent ownership check | `candidate-detail.ts:45` | Horizontal privilege escalation | MEDIUM |
| AUTH-004 | 16 `req.clerkId!` non-null assertions | Multiple files | Null deref on bypass | MEDIUM |
| AUTH-005 | Stream ticket in-memory only | `stream-ticket-manager.ts:57` | Multi-instance failure | MEDIUM |

### Cryptographic Failures
| ID | Type | Location | Impact | Risk |
|----|------|----------|--------|------|
| CRYPTO-001 | ENCRYPTION_SECRET reused as jwtSecret | `config/index.ts:250` | Key compromise expands blast radius | MEDIUM |
| CRYPTO-002 | MD5 in test-runner.js | `test-runner.js:137` | Weak hash precedent | LOW |

### Information Disclosure
| ID | Type | Location | Impact | Risk |
|----|------|----------|--------|------|
| INFO-001 | Stack trace in dev error responses | `errors/index.ts:149` | If NODE_ENV leaks to prod | MEDIUM |
| INFO-002 | Session IDs in error messages | `errors/index.ts:198` | URL enumeration | LOW |
| INFO-003 | Raw error messages to client | `routes/sessions.ts:65` | Internal path disclosure | MEDIUM |
| INFO-004 | Health metrics endpoint world-readable | `routes/health.ts` | Queue stats, SLO exposure | LOW |

### Race Conditions
| ID | Type | Location | Impact | Risk |
|----|------|----------|--------|------|
| RACE-001 | TOCTOU in claimNextQueuedSession | `queue-manager.ts:311-331` | Double-processing | **HIGH** |
| RACE-002 | cancelSession DB/flush NOT atomic | `queue-manager.ts:530-567` | Data corruption | **HIGH** |
| RACE-003 | scheduleRetry phantom processor | `queue-manager.ts:659-662` | Duplicate processing | **HIGH** |
| RACE-004 | SessionEventManager buffer race | `session-events.ts:300-351` | Silent data loss | **HIGH** |
| RACE-005 | _markAsProcessing double-add | `queue-manager.ts:356-369` | State inconsistency | MEDIUM |
| RACE-006 | releaseProcessingSlot multi-path | `queue-manager.ts` (6 call sites) | Slot leak | MEDIUM |
| RACE-007 | Zustand thinkingBuffer double-flush | `stream-store.ts:172-375` | UI glitch | LOW |

### Missing Input Validation
| ID | Type | Location | Impact | Risk |
|----|------|----------|--------|------|
| VAL-001 | No body validation on PUT /sessions/:id | `sessions.ts:140` | Malformed data, XSS | **HIGH** |
| VAL-002 | No schema on cancel sessionId | `queue.ts:191` | Injection if stored unsafely | LOW |
| VAL-003 | No schema on requeue sessionId | `queue.ts:236-237` | Injection if stored unsafely | LOW |
| VAL-004 | Admin query params unvalidated | `admin.ts:339-342` | Type confusion | LOW |
| VAL-005 | Schema duplication (BirthDataSchema) | `validation.ts` vs `core.ts` | Divergent validation | MEDIUM |

### Supply Chain
| ID | Type | Location | Impact | Risk |
|----|------|----------|--------|------|
| SUPPLY-001 | Clerk CVEs (CVSS 9.1 × 2) | `@clerk/nextjs`, `@clerk/shared` | Route protection bypass | **CRITICAL** |
| SUPPLY-002 | jsPDF CVE (CVSS 8.1) | `jspdf@4.2.0` | PDF Object Injection | HIGH |
| SUPPLY-003 | drizzle-kit declared as "latest" | `web/package.json` | Non-reproducible builds | MEDIUM |
| SUPPLY-004 | Clerk backend version drift | `api/package.json` (^1.26.2 → 2.31.0) | Shadowed dependency | MEDIUM |
| SUPPLY-005 | No Python lockfile | `services/ephemeris/` | Non-reproducible | MEDIUM |
| SUPPLY-006 | ESLint 8 EOL deprecated | Multiple packages | Unsupported security rules | MEDIUM |

---

## 4. Critical Finding Deep-Dives

### 🔴 CRITICAL-1: Clerk Webhook Route Blocked by Next.js Middleware
**File**: `apps/web/middleware.ts`, lines 5-18
**CVSS**: 7.5 (High) — DoS of user sync
**Status**: ⚠️ CONFIRMED

The `isPublicRoute` matcher (lines 5-15) lists 10 routes. The Clerk webhook endpoint at `/api/webhooks/clerk` is **NOT** in this list. Clerk's `clerkMiddleware` calls `auth.protect()` on ALL non-public routes (line 18), which will redirect unauthenticated requests to `/sign-in`. Since Clerk webhook requests come from Clerk's servers (not a browser), they have no Clerk session cookie and will be **redirected to sign-in** instead of processed.

**Impact**: User creation/update/deletion webhooks silently stop working. New users won't be synced to the local `users` table, breaking the session ownership resolution used by all API routes.

**Verification**: `npm run dev`, then send a POST to `/api/webhooks/clerk` without a Clerk session cookie. Expect redirect to `/sign-in`.

**Fix**: Add `'/api/webhooks/clerk(.*)'` to the `isPublicRoute` matcher at line 5-15.

---

### 🔴 CRITICAL-2: Unprotected /api/routes-test Endpoint
**File**: `apps/api/src/routes/index.ts`, lines 122-129
**CVSS**: 5.3 (Medium) — Information disclosure
**Status**: ⚠️ CONFIRMED

```typescript
router.get('/routes-test', (req, res) => {
  res.json({ success: true, message: 'API sub-router reached', path: req.path });
});
```

This route is mounted at `/api/routes-test` with **NO authentication middleware** and **NO rate limiting**. Any unauthenticated user can probe this endpoint to confirm the API is alive and collect the request path.

**Fix**: Remove the route entirely (it's a debug artifact), or gate behind `authMiddleware` and restrict to development.

---

### 🔴 HIGH-1: XSS via Missing sanitizeString in API BirthDataSchema
**File**: `apps/api/src/middleware/validation.ts`, line 15 vs `packages/shared/src/types/core.ts`, line 121

The shared package's `BirthDataSchema` applies `.transform(sanitizeString)` to `fullName` and `birthPlace` fields (stripping `<script>`, `javascript:` URLs, etc.). The **duplicated schema** in `middleware/validation.ts` does NOT apply this transform. When `POST /api/queue` or `POST /api/calculate` validates input using the middleware schema (line 105: `schema.parse(req.body)`), XSS payloads in `fullName` pass through unsanitized.

Additionally, the API schema's `tentativeTime` regex (line 17) accepts both `HH:MM` and `HH:MM:SS`, while the shared schema (line 123) only accepts `HH:MM:SS`.

**Fix**: Remove the duplicate schemas from `middleware/validation.ts` and import from `@ai-pandit/shared/types/core.ts` instead.

---

### 🔴 HIGH-2: TOCTOU Race in claimNextQueuedSession
**File**: `apps/api/src/lib/queue-manager.ts`, lines 305-336

```typescript
async function claimNextQueuedSession(): Promise<string | null> {
  const claimedJob = await queueDriver.claimNextQueuedJob();       // line 306
  // ... DB update to 'processing' (line 311-319)
  const rowsAffected = getRowsAffected(updateResult);               // line 321
  if (rowsAffected === 0) { /* fail */ }                            // line 322
  activeProcessingIds.add(claimedJob.sessionId);                    // line 331
  processingStartTimes.set(claimedJob.sessionId, Date.now());       // line 332
  return claimedJob.sessionId;
}
```

The DB update (line 311) and in-memory state mutation (line 331) are **not in a transaction**. Two concurrent calls to `runQueueIteration()` can both call `claimNextQueuedSession()`. Since `queueDriver.claimNextQueuedJob()` may return the same job twice (depends on driver), and the `activeProcessingIds` Set check happens AFTER the DB update, both calls pass the guard and the same session gets processed twice.

**Fix**: Use `SELECT ... FOR UPDATE SKIP LOCKED` in the DB driver, or use a Redis-based distributed lock, or make the in-memory Set check happen BEFORE the DB update with Promise-based mutex.

---

### 🔴 HIGH-3: SessionEventManager Buffer Data Loss
**File**: `apps/api/src/lib/session-events.ts`, lines 300-351

The 200ms broadcast interval reads and clears `thinkingBroadcastBuffer`:
```
setInterval → entries = Array.from(thinkingBroadcastBuffer);    // read
              thinkingBroadcastBuffer.clear();                   // clear
              broadcast entries                                  // send
```

While `bufferThinking()` adds entries to the SAME buffer at any time. Entries added during the iteration (between read and clear) are **silently lost** because the Map is cleared after reading.

**Fix**: Use a swap pattern: `const batch = thinkingBroadcastBuffer; thinkingBroadcastBuffer = new Map();` then process `batch`.

---

## 5. Hunting Checklist by Layer

### 🔍 Frontend (apps/web) - 12 checks

- [ ] `middleware.ts`: Are ALL public routes listed? Missing webhooks? Missing warmup endpoints?
- [ ] `route-handler.ts`: Does `withRouteHandler()` correctly reject missing userId?
- [ ] `backend-proxy.ts`: Is the Bearer token correctly forwarded?
- [ ] `api-client.ts`: Does it handle token expiry gracefully?
- [ ] `auth-utils.ts`: Are garbage tokens ('null', 'undefined') cleaned?
- [ ] All route.ts files: Manual `auth()` calls vs `withRouteHandler()` wrapper consistency?
- [ ] `server/audit.ts`: Are login/logout events logged without leaking PII?
- [ ] `crypto.ts`: Does client-side encryption match server-side algorithm?
- [ ] `xss-sanitizer.ts`: Are all AI output paths sanitized?
- [ ] `secure-logger.ts`: Does `sendBeacon` leak PII in URL/userAgent?
- [ ] Zustand `stream-store.ts`: Are race conditions around buffers handled?
- [ ] `use-stream-progress.ts`: Does token refresh race with SSE reconnection?

### 🔍 Backend (apps/api) - 18 checks

- [ ] `routes/index.ts`: Are there ANY unprotected routes besides health?
- [ ] ALL route files: Is `req.clerkId!` safe? Any path where clerkId could be null?
- [ ] `middleware/auth.ts`: 15-min clock skew too generous?
- [ ] `middleware/validation.ts`: Schemas match shared package? XSS sanitization present?
- [ ] `errors/index.ts`: Stack traces included in any error path to production?
- [ ] `config/index.ts`: Any hardcoded secrets? Key reuse between systems?
- [ ] `encryption/`: IV always random? User bound to ciphertext? Timing-safe comparison?
- [ ] `queue-manager.ts`: ALL state mutations atomic? DB+memory paired?
- [ ] `session-events.ts`: Buffer operations atomic? GC interval safe?
- [ ] `stream-ticket-manager.ts`: Multi-instance support? Ticket TTL enforced?
- [ ] `session-ownership.ts`: Used consistently across ALL session-accessing routes?
- [ ] `progress-tracker.ts`: Active instances tracked correctly?
- [ ] `calculation-cache.ts`: Expiry logic correct?
- [ ] `memory-manager.ts`: Concurrency limit busy-wait safe?
- [ ] `cancellation-manager.ts`: Does it extend AppError or raw Error?
- [ ] AI prompt `security-guard.ts`: Are ALL jailbreak patterns blocked?
- [ ] `db-cleanup.ts`: Scheduled cleanup safe under load?
- [ ] Rate limiters: In-memory store sufficient for deployment topology?

### 🔍 Database (packages/db) - 6 checks

- [ ] `schema.ts`: Check constraints correct? Indexes cover query patterns?
- [ ] `jobs.ts`: Optimistic concurrency `version` column correct? Retry logic safe?
- [ ] `drizzle.ts`: Connection pool configured correctly? Lazy init race-free?
- [ ] Any raw `db.execute()` with string interpolation? (grep for `${`)
- [ ] All `insert` operations handle `onConflict`?
- [ ] Migration scripts idempotent?

### 🔍 Worker (apps/worker) - 5 checks

- [ ] `worker.ts`: Shutdown graceful? In-flight jobs completed?
- [ ] `activeCount` atomic? Used for health check?
- [ ] Job completion + session update transactional?
- [ ] Worker crash recovery: orphaned jobs detected?
- [ ] Health check endpoint exposed?

### 🔍 Ephemeris (services/ephemeris) - 4 checks

- [ ] `pyproject.toml`: Dependencies pinned? Lockfile present?
- [ ] API endpoints: Any auth required? (internal service)
- [ ] Batch operations: Rate limiting? Memory safety?
- [ ] Error handling: Python exceptions leak stack traces?

### 🔍 CI/CD & Infrastructure - 5 checks

- [ ] `cloudbuild.yaml`: Secrets not in plaintext? Build args safe?
- [ ] GitHub Actions: Token permissions minimal? `pull_request_target` safe?
- [ ] `Dockerfile`: Multi-stage build? No secrets in layers?
- [ ] Deployment scripts: Idempotent? Health gates before traffic switch?
- [ ] Environment templates: No production defaults committed?

---

## 6. Tooling & Automation

### Static Analysis (run every PR)
```bash
npm audit                                    # Vulnerable dependencies
npm run test:security:dependencies           # audit-ci --moderate
npm run lint                                 # ESLint across all packages
npm run test                                 # Full test suite
```

### Dynamic Analysis (weekly/monthly)
```bash
npm run test:security:api                    # ZAP API scan
npm run test:security:snyk                   # Snyk vulnerability scan
npm run test:mutation                        # Stryker mutation testing
npm run test:e2e:full                        # Full cross-browser E2E
npm run test:e2e:a11y                        # Accessibility audit
```

### Manual Audit (quarterly)
- [ ] Review ALL `db.execute()` calls for string interpolation
- [ ] Review ALL `req.clerkId!` for null safety
- [ ] Review ALL `JSON.parse()` calls for Zod validation
- [ ] Review ALL `try/catch` blocks for silent swallowing
- [ ] Review ALL `setTimeout/setInterval` for cleanup
- [ ] Verify environment variables in production match schema
- [ ] Run `npm audit` and triage all findings

### Pre-Deployment Gate
```bash
npm run test:ci                              # lint + unit + integration + e2e smoke + coverage
npm run test:security:dependencies           # audit-ci
npm run deploy:staging:preflight             # Staging deployment checks
```

---

## 7. Remediation Playbook

### Immediate (0-24 hours)
1. **Add `/api/webhooks/clerk` to public routes** — unblock Clerk webhooks
2. **Remove `/api/routes-test`** or gate behind auth
3. **Upgrade Clerk SDK** — fix 3 critical CVEs (CVSS 9.1):
   ```
   @clerk/nextjs → ≥ 6.39.3
   @clerk/shared → ≥ 3.47.5
   @clerk/clerk-react → ≥ 5.61.6
   @clerk/backend → ≥ 2.33.3
   ```
4. **Run `npm audit fix`** — resolves 28 auto-fixable vulns

### Short-term (1-7 days)
5. **Eliminate schema duplication** — import `BirthDataSchema` from shared package
6. **Fix TOCTOU in `claimNextQueuedSession`** — use `SELECT ... FOR UPDATE SKIP LOCKED` or distributed lock
7. **Fix SessionEventManager buffer race** — use swap pattern for thread-safe buffer clearing
8. **Add Zod validation** to `PUT /api/sessions/:id` body
9. **Pin `drizzle-kit`** in web/package.json from `"latest"` to specific version
10. **Add Python lockfile** to ephemeris service (`uv lock`)

### Medium-term (1-2 sprints)
11. **Migrate ESLint 8 → 9** (EOL, no longer supported)
12. **Replace deprecated packages** (`glob@7`, `rimraf@3`, `inflight`)
13. **Fix non-null assertions** — add `validateClerkId()` utility with proper error
14. **Normalize ownership checks** — use `isSessionOwnedByContext()` everywhere
15. **Add Redis-backed stream tickets** for multi-instance Cloud Run
16. **Add Redis-backed rate limiting** for multi-instance deployments
17. **Remove stack trace from error responses** in ALL environments
18. **Consolidate error classes** — `CancellationError` in cancellation-manager should extend AppError
19. **Replace `getErrorMessage()`** with proper `sendError()` utility in sessions.ts

### Long-term (next quarter)
20. **Evaluate Express 5 migration** — path-to-regexp fix, better error handling
21. **Add CSP headers audit** — ensure no inline scripts in production
22. **Add Content Security Policy reporting** — monitor violations
23. **Implement distributed locking** for all queue operations
24. **Add integration tests for concurrent access** — simulate multi-request scenarios
25. **Add CI pipeline for `npm audit`** — fail builds on critical/high

---

## Appendix A: File Index of All Security-Sensitive Code

| Category | File | Lines | Concern |
|----------|------|-------|---------|
| Auth Gateway | `apps/web/middleware.ts` | 5-18 | Webhook route missing from public matcher |
| Auth Gateway | `apps/web/app/api/webhooks/clerk/route.ts` | 1-104 | Svix verification, user sync |
| Auth Gateway | `apps/api/src/middleware/auth.ts` | 1-195 | Clerk token verification, 15min skew |
| Auth Gateway | `apps/api/src/lib/stream-ticket-manager.ts` | 1-145 | Single-use tickets, in-memory |
| Auth Gateway | `apps/api/src/lib/session-ownership.ts` | 1-60 | ClerkId vs userId matching |
| Encryption | `apps/api/src/lib/encryption/DANGER_DO_NOT_MODIFY.ts` | 1-400+ | AES-256-GCM + scrypt v4 |
| Encryption | `apps/api/src/lib/encryption/index.ts` | 1-50+ | Multi-secret fallback |
| Encryption | `apps/web/lib/crypto.ts` | 1-200+ | Client-side mirror |
| Config | `apps/api/src/config/index.ts` | 250 | ENCRYPTION_SECRET as jwtSecret |
| Validation | `apps/api/src/middleware/validation.ts` | 14-23 | Missing sanitizeString |
| Validation | `packages/shared/src/types/core.ts` | 117-132 | Canonical schema with XSS protection |
| Errors | `apps/api/src/errors/index.ts` | 149 | Stack trace leak |
| Queue | `apps/api/src/lib/queue-manager.ts` | 305-336 | TOCTOU claim |
| Queue | `apps/api/src/lib/queue-manager.ts` | 530-567 | Cancel/flush race |
| Queue | `apps/api/src/lib/queue-manager.ts` | 356-369 | Double-add |
| Streaming | `apps/api/src/lib/session-events.ts` | 300-351 | Buffer data loss |
| Routes | `apps/api/src/routes/index.ts` | 123 | Unprotected routes-test |
| Routes | `apps/api/src/routes/sessions.ts` | 140 | Unvalidated body |
| Routes | `apps/api/src/routes/candidate-detail.ts` | 45 | Simple clerkId check |
| Test | `apps/api/src/__tests__/security-audit.test.ts` | 201 | String interpolation |
| Deps | `apps/web/package.json` | — | `drizzle-kit: "latest"`, Clerk CVEs |
| Deps | `apps/api/package.json` | — | `@clerk/backend: ^1.26.2` (resolves 2.31.0) |

---

## Appendix B: Quick Reference — Common Vulnerability Patterns to Hunt

```
Pattern 1: auth.protect() gate bypass
  → Check middleware.ts public routes are complete
  → Check all routes have either public list entry OR manual auth check

Pattern 2: req.clerkId! without guard
  → Grep for 'req\.clerkId!' — verify authMiddleware is always upstream

Pattern 3: raw SQL with template literals
  → Grep for 'db\.execute\(' and 'sql\`' — verify no user input

Pattern 4: try { } catch { /* empty */ }
  → Grep for 'catch\s*\(\s*\)' and 'catch\s*\(\s*_\s*\)'
  → Verify error is at least logged

Pattern 5: JSON.parse without Zod
  → Grep for 'JSON\.parse' — verify Zod schema .parse() follows

Pattern 6: Shared mutable state without locking
  → Grep for 'const .* = new Map|Set' at module level
  → Verify all operations are safe under concurrency

Pattern 7: In-memory state for distributed system
  → Check if deployment is single-instance or multi-instance
  → If multi-instance: all Map/Set state needs Redis backend

Pattern 8: setTimeout/setInterval without cleanup
  → Grep for 'setInterval' and 'setTimeout'
  → Verify cleanup (clearInterval/timeout) exists on shutdown

Pattern 9: ENV secrets in error messages or logs
  → Check error message construction doesn't include secret values
  → Check secure-logger redaction covers all key names

Pattern 10: Version ranges that allow breaking changes
  → Grep for '^0\.' in package.json — allows minor bumps in pre-1.0 packages
  → Prefer exact versions for security-critical deps
```
