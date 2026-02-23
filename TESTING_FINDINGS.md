# 🐛 Issues & Findings — Discovered During Testing

> This file documents all bugs, security gaps, and code-quality issues found during the heavy testing audit.
> Each entry includes severity, location, and a recommended fix.

---

## 🔴 CRITICAL

### 1. Encryption Does NOT Provide User-Level Isolation
- **File**: `apps/api/src/lib/encryption/DANGER_DO_NOT_MODIFY.ts`
- **Issue**: The `userId` parameter passed to `encryptData`/`decryptData` does **not** affect the AES key derivation. Any `userId` can decrypt any ciphertext encrypted by any other user, because the key is derived solely from the global `ENCRYPTION_SECRET` env variable.
- **Impact**: If an attacker gains access to one encrypted session's data, they can decrypt ALL sessions using any arbitrary userId.
- **Fix**: Derive the AES key using `PBKDF2(ENCRYPTION_SECRET + userId)` or use userId as AAD (Additional Authenticated Data) in AES-GCM.

---

## 🟡 MEDIUM

### 2. BirthData Schema Accepts Invalid Hours (25:00:00)
- **File**: `apps/api/src/middleware/validation.ts` → `BirthDataSchema`
- **Issue**: The `tentativeTime` field uses regex `\d{2}:\d{2}(:\d{2})?` which validates format but not value ranges. `25:00:00`, `99:99:99` all pass validation.
- **Impact**: Invalid birth times could be processed, causing incorrect astrological calculations.
- **Note**: The `calculate.ts` route has a stricter schema (`([01]\d|2[0-3]):([0-5]\d)`) but the middleware schema does not.
- **Fix**: Use the stricter regex in both schemas, or unify them.

### 3. Bearer Token Split Bypasses Cleanup Check
- **File**: `apps/api/src/middleware/auth.ts` (line 57-67)
- **Issue**: `'Bearer [object Object]'.split(' ')[1]` produces `'[object'`, not `'[object Object]'`. The cleanup check on line 65 (`token === '[object Object]'`) never matches, so the garbage token `'[object'` gets sent to Clerk's `verifyToken`, wasting an API call.
- **Impact**: Minor — Clerk will reject it anyway. But it wastes a network round-trip and could trigger rate limiting from Clerk.
- **Fix**: Use `authHeader.slice(7)` instead of `split(' ')[1]` to get everything after "Bearer ".

### 4. Fuzzy Date Parser — Year Regex Takes Priority Over All Specific Patterns
- **File**: `apps/web/lib/fuzzy-date-parser.ts` (lines 31-41)
- **Issue**: The year regex `\b(19\d{2}|20\d{2})\b` (rule #2) matches ANY input containing a 4-digit year BEFORE the more specific patterns are checked (part-of-year, quarter, approximate, season, month-year). This means:
  - `"late 1999"` → parsed as year `1999` instead of `Sep-Dec 1999`
  - `"q1 2024"` → parsed as year `2024` instead of `Jan-Mar 2024`
  - `"around 2000"` → parsed as year `2000` instead of `1999-2001`
  - `"summer 2010"` → parsed as year `2010` instead of `Apr-Jun 2010`
  - `"May 2005"` → parsed as year `2005` instead of `May 2005`
- **Impact**: **HIGH** — All quarter-based, season-based, approximate, part-of-year, and month-year parsing is effectively dead code. Only age-based parsing (rule #1) works correctly because it runs before the year regex.
- **Fix**: Reorder rules: check specific patterns (season, month-year, part-of-year, quarter, approximate) BEFORE the generic year regex. Or use negative lookahead in the year regex to skip when preceded by qualifiers.

### 5. Sessions PUT Route Does NOT Encrypt `offsetConfig`
- **File**: `apps/api/src/routes/sessions.ts` (line 183)
- **Issue**: The PUT update handler stores `offsetConfig` as `JSON.stringify(body.offsetConfig)` — without encryption. Meanwhile, all other sensitive JSON fields (`lifeEvents`, `physicalTraits`, `forensicTraits`, `spouseData`) are properly encrypted via `encryptData()` before storage.
- **Impact**: `offsetConfig` contains the user's birth time offset preference (e.g., "±2 hours"), which is sensitive time-rectification data stored in plaintext. This inconsistency also means the GET endpoint's `parseSensitiveField()` call for offsetConfig may fail or return garbled data if it expects encrypted input.
- **Fix**: Change line 183 to: `updateData.offsetConfig = encryptData(JSON.stringify(body.offsetConfig), clerkId);`

### 6. Consensus Engine — `checkPrakritiLagnaMatch` Has Redundant/Always-True Condition
- **File**: `apps/api/src/lib/consensus-engine.ts` (lines 758-766)
- **Issue**: The function returns `element === prakritiElement || (element === 'fire' && prakritiElement === 'fire') || (element === 'water' && prakritiElement === 'water')`. The second and third conditions are already covered by `element === prakritiElement` — they are redundant and always true when the first condition is true.
- **Impact**: Low — functionally correct but misleading. It suggests the developer intended additional special-case logic for fire/water elements but accidentally wrote the same check. Any future refactoring might incorrectly assume these are separate rules.
- **Fix**: Either simplify to just `return element === prakritiElement;` or implement the actually intended special-case logic (perhaps partial match for dual-dosha like `vata-pitta`).

### 7. Queue Route — `dateOfBirth` Validation Inconsistency
- **File**: `apps/api/src/routes/queue.ts`
- **Issue**: The queue submit endpoint validates `dateOfBirth` with `new Date(dateOfBirth)` and checks `isNaN(d.getTime())`, but this accepts many malformed inputs that `Date()` constructor processes loosely (e.g., `"2024-13-01"` creates `2025-01-01` via date rollover, `"2024/05/15"` works but isn't ISO format). The `calculate.ts` route uses a stricter Zod schema with proper regex.
- **Impact**: Users could submit birth dates that auto-correct silently (e.g., Feb 30 → Mar 2), leading to incorrect astrological calculations without any error feedback.
- **Fix**: Use the same strict validation as `calculate.ts`, or use `date-fns/isValid` + `parseISO` for strict ISO 8601 parsing.

### 8. Session Events — Unbounded Calculation Buffer (Memory Leak)
- **File**: `apps/api/src/lib/session-events.ts` → `appendToCalculationBuffer()`
- **Issue**: The `calculationBuffers` map appends logs without any limit. For long-running sessions with hundreds of candidates, this accumulates unbounded memory. The code comment says "Keep last 50" but no truncation logic exists.
- **Impact**: **HIGH** — On HF Spaces Free Tier (16GB RAM), long BTR sessions can OOM crash the server. Each log entry can be 500+ bytes, and sessions generate 100+ logs per candidate × 100+ candidates = 10,000+ entries in memory.
- **Fix**: Add `if (buffer.length > 50) buffer.shift();` after each push.

### 9. Progress Route — `dateOfBirth` Sent Without Encryption in Metadata
- **File**: `apps/api/src/routes/progress.ts` (line 105)
- **Issue**: The progress endpoint sends `dateOfBirth: queueStatus.session?.dateOfBirth` directly from the queue status, while `fullName` and `offsetConfig` are properly decrypted via `parseSensitiveField()`. If `dateOfBirth` is stored encrypted, this sends encrypted garbage; if it's plaintext, it's a PII exposure inconsistency.
- **Impact**: Either malformed data on frontend or unencrypted PII depending on how the value is stored.
- **Fix**: Consistently apply `parseSensitiveField()` to `dateOfBirth` like other sensitive fields.

### 10. Secure Logger — `child()` Method Drops Context
- **File**: `apps/web/lib/secure-logger.ts` (line 252-256)
- **Issue**: The `child()` method accepts a context object but ignores it completely. It creates a new `SecureLogger` with the same config but the context parameter is never stored or applied. This means logs from `logger.child({ component: 'StreamProgress' })` are identical to `logger` — no component tag is added.
- **Impact**: **MEDIUM** — Makes debugging harder in production since logs from `streamLogger` and `logger` are indistinguishable. The `streamLogger` export exists but adds zero value.
- **Fix**: Store context in the SecureLogger instance and prepend it to all log messages.

---

## 🟢 LOW

### 11. Debug Log File Written on Every Auth Request
- **File**: `apps/api/src/middleware/auth.ts` (line 37)
- **Issue**: `fs.appendFileSync(LOG_FILE, logEntry)` writes to `requeue_debug.txt` on every authenticated request. This is a synchronous I/O operation on the main thread.
- **Impact**: Performance degradation under load; disk fill-up in production.
- **Fix**: Remove or gate behind `NODE_ENV === 'development'`.

### 12. VimshottariDashaEntrySchema Accepts Empty Strings
- **File**: `packages/shared/src/schemas.ts` (lines 10-17)
- **Issue**: All 6 fields (`maha`, `antar`, `pratyantar`, `sukshma`, `prana`, `startEnd`) use `z.string()` without `.min(1)`. This means empty strings `""` are valid entries, which would produce malformed dasha analysis data sent to the AI.
- **Impact**: Empty dasha entries silently pass validation and get processed by the BTR pipeline, causing garbage AI analysis.
- **Fix**: Add `.min(1)` to all 6 string fields, or use `.nonempty()`.

### 13. ProgressTracker — Dual Throttle Creates Stale Data Window
- **File**: `apps/api/src/lib/progress-tracker.ts` (lines 139, 431)
- **Issue**: `updateAIThinking()` pulses DB every 30s (`now - lastPulseTime > 30000`), but `saveProgress()` throttles non-major writes at 10s (`Date.now() - lastPulseTime < 10000`). Both use the same `lastPulseTime` variable. A 30s AI thinking pulse resets the timer, blocking all non-major `saveProgress` calls for the next 10 seconds. This creates a 10-20s window of stale progress data in the DB for polling clients.
- **Impact**: Polling clients see outdated progress for 10-20 seconds after an AI thinking pulse. Stream (SSE) clients are unaffected since they read in-memory state.
- **Fix**: Use separate timestamps for the pulse and save throttles.

### 14. SSE Stream Response Flush `TypeError` Crash (Medium)
- **Location:** `apps/api/src/routes/stream.ts`
- **Issue:** The SSE setup route forcefully calls `res.flushHeaders()` and `res.flush()` to bypass intermediate proxy buffering without validating that the response socket actually implements these methods (highly platform-dependent). If the underlying socket drops or the environment is customized, it triggers an unhandled `TypeError` crash that converts a successful SSE heartbeat into an `INTERNAL_ERROR`.
- **Fix:** Added `typeof (res as any).flush === 'function'` typeguard wrapping around all aggressive event flushes.

### 15. Queue Processor Background Memory Leak / Infinite Loop (High - Testing & Stability)
- **Location:** `apps/api/src/lib/queue-manager.ts`
- **Issue:** The `startQueueProcessor()` spins up a perpetual background `while(isProcessorRunning)` loop. There was no exposed mechanism to shut down the processor cleanly, leading to `ERR_WORKER_OUT_OF_MEMORY` in testing environments, and potential phantom CPU drains if the main queue application is re-initialized or dynamically scaled down in production.
- **Fix:** Exported a dedicated `stopQueueProcessor()` method and rigorously applied it during teardown to prevent hanging promises and database connection leaks.

---

*Last updated: 2026-02-23 — Round 4 (38 suites / 618 tests)*
