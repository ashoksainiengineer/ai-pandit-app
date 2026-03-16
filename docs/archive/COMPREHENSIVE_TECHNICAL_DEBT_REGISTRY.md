# 🔱 COMPREHENSIVE TECHNICAL DEBT REGISTRY

## AI-Pandit Project - Complete Architecture Debt Analysis

> **Generated:** 2026-03-13  
> **Scope:** Full monorepo analysis (apps/web, apps/api, apps/worker, packages/*, services/ephemeris)  
> **Debt Categories:** Migration Remnants, Configuration Debt, Test Debt, Infrastructure Debt, Documentation Debt, Code Quality Debt  
> **Total Debt Items Identified:** 47

---

## 📊 Executive Summary

| Category | Items | Critical | High | Medium | Low |
|----------|-------|----------|------|--------|-----|
| **Migration Debt** | 21 | 4 | 8 | 7 | 2 |
| **Configuration Debt** | 8 | 1 | 3 | 3 | 1 |
| **Test Debt** | 6 | 0 | 3 | 2 | 1 |
| **Infrastructure Debt** | 7 | 1 | 2 | 3 | 1 |
| **Documentation Debt** | 3 | 0 | 0 | 2 | 1 |
| **Code Quality Debt** | 2 | 0 | 1 | 1 | 0 |
| **TOTAL** | **47** | **6** | **17** | **18** | **6** |

---

## 1️⃣ DATABASE MIGRATION DEBT (Turso → Neon)

### 🔴 CRITICAL - Immediate Action Required

| ID | File | Line(s) | Issue | Impact | Fix Complexity |
|----|------|---------|-------|--------|----------------|
| ~~DB-001~~ | [`.github/workflows/db-cleanup.yml`](.github/workflows/db-cleanup.yml:26-27) | 26-27 | ~~Uses `TURSO_DATABASE_URL`~~ | ✅ **FIXED** | ✅ |
| ~~DB-002~~ | [`apps/api/docker-compose.yml`](apps/api/docker-compose.yml:18-19) | 18-19 | Docker compose still passes Turso env vars only | ✅ **FIXED** | ✅ |
| ~~DB-003~~ | [`apps/api/vitest.config.ts`](apps/api/vitest.config.ts:29-30) | 29-30 | Vitest config uses `TURSO_DATABASE_URL` instead of `NEON_DATABASE_URL` | ✅ **FIXED** | ✅ |
| ~~DB-004~~ | [`apps/api/src/__tests__/Integrity.test.ts`](apps/api/src/__tests__/Integrity.test.ts:18-68) | 18-68 | Test manipulates `TURSO_DATABASE_URL` env var | ✅ **FIXED** | ✅ |

### 🟠 HIGH PRIORITY

| ID | File | Line(s) | Issue | Impact | Fix Complexity |
|----|------|---------|-------|--------|----------------|
| ~~DB-005~~ | [`apps/api/package.json`](apps/api/package.json:31-48) | 31-48 | **7 npm scripts** use `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` | ✅ **FIXED** | ✅ |
| ~~DB-006~~ | [`playwright.config.ts`](playwright.config.ts:37-38) | 37-38 | Playwright webServer env uses Turso variables | ✅ **FIXED** | ✅ |
| ~~DB-007~~ | [`apps/api/package.json`](apps/api/package.json:57) | 57 | Still depends on `@libsql/client` (unused) | ✅ **FIXED** | ✅ |
| ~~DB-008~~ | [`package-lock.json`](package-lock.json:3783-12457) | 3783+ | Lockfile contains @libsql/* dependencies | ✅ **FIXED** | ✅ |

### 🟡 MEDIUM PRIORITY

| ID | File | Line(s) | Issue | Impact | Fix Complexity |
|----|------|---------|-------|--------|----------------|
| ~~DB-009~~ | [`docs/BACKEND_ARCHITECTURE_IMPACT_ANALYSIS.md`](docs/BACKEND_ARCHITECTURE_IMPACT_ANALYSIS.md:41-68) | 41-68 | Document contains old "BEFORE" code with Turso references | ✅ Historical reference | ℹ️ |
| ~~DB-010~~ | [`docs/COMPLETE_PROJECT_AUDIT.md`](docs/COMPLETE_PROJECT_AUDIT.md:430-431) | 430-431 | Mentions legacy TURSO env vars in CI workflow docs | ✅ Historical reference | ℹ️ |
| ~~DB-011~~ | [`docs/TURSO_TO_NEON_MIGRATION_AUDIT.md`](docs/TURSO_TO_NEON_MIGRATION_AUDIT.md:1-308) | 1-308 | Entire audit doc documents already-fixed issues | ✅ Historical reference | ℹ️ |
| ~~DB-012~~ | [`docs/BACKEND_AUDIT_COMPLETE.md`](docs/BACKEND_AUDIT_COMPLETE.md:137-138) | 137-138 | Lists `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` as legacy | ✅ Historical reference | ℹ️ |
| ~~DB-013~~ | [`docs/FRONTEND_BACKEND_ARCHITECTURE_IMPACT_ANALYSIS.md`](docs/FRONTEND_BACKEND_ARCHITECTURE_IMPACT_ANALYSIS.md:354-356) | 354-356 | Lists env vars to remove (already done) | ✅ Historical reference | ℹ️ |

### 🟢 LOW PRIORITY

| ID | File | Line(s) | Issue | Impact | Fix Complexity |
|----|------|---------|-------|--------|----------------|
| ~~DB-014~~ | [`docs/BACKEND_ARCHITECTURE_IMPACT_ANALYSIS.md`](docs/BACKEND_ARCHITECTURE_IMPACT_ANALYSIS.md:112-116) | 112-116 | Comments mention "[TURSO OPTIMIZED]" in progress-tracker | ✅ Historical reference | ℹ️ |
| ~~DB-015~~ | [Comments in code](apps/api/src/lib/progress-tracker.ts:473-490) | Various | Turso-specific optimization comments | ✅ Historical reference | ℹ️ |

---

## 2️⃣ EPHEMERIS MIGRATION DEBT (Swiss Ephemeris → Skyfield)

### 🔴 CRITICAL

| ID | File | Line(s) | Issue | Impact | Fix Complexity |
|----|------|---------|-------|--------|----------------|
| ~~EPH-001~~ | [`.github/workflows/db-cleanup.yml`](.github/workflows/db-cleanup.yml:1-41) | Full file | References Turso AND needs ephemeris check | ✅ **SKYFIELD MIGRATED** | ✅ |

### 🟠 HIGH PRIORITY

| ID | File | Line(s) | Issue | Impact | Fix Complexity |
|----|------|---------|-------|--------|----------------|
| ~~EPH-002~~ | [`ephe/` directory](ephe/) | All | Contains Swiss Ephemeris binary files (~50MB) | ✅ Historical artifact (unused) | ℹ️ |
| ~~EPH-003~~ | [`scripts/download-ephemeris.sh`](scripts/download-ephemeris.sh:1-55) | 1-55 | Downloads Swiss Ephemeris files from astro.com | ✅ Historical artifact | ℹ️ |
| ~~EPH-004~~ | [`apps/api/package.json`](apps/api/package.json:101) | 101 | Keywords include "skyfield" but also old references | ✅ No impact | ✅ |

### 🟡 MEDIUM PRIORITY

| ID | File | Line(s) | Issue | Impact | Fix Complexity |
|----|------|---------|-------|--------|----------------|
| ~~EPH-005~~ | [`deploy/cloudrun/api.Dockerfile`](deploy/cloudrun/api.Dockerfile:9) | 9 | Copies `ephe/` directory (unused) | ✅ Not used in build | ✅ |
| ~~EPH-006~~ | [`deploy/cloudrun/web.Dockerfile`](deploy/cloudrun/web.Dockerfile:9) | 9 | Copies `ephe/` directory (unnecessary) | ✅ Not used in build | ✅ |
| ~~EPH-007~~ | [`deploy/cloudrun/worker.Dockerfile`](deploy/cloudrun/worker.Dockerfile:9) | 9 | Copies `ephe/` directory (unused) | ✅ Not used in build | ✅ |
| ~~EPH-008~~ | [`docs/audits/EPHEMERIS_PARITY_RUN_2026-03-12.md`](docs/audits/EPHEMERIS_PARITY_RUN_2026-03-12.md:19) | 19 | References `skyfield-swiss-parity.test.ts` | ✅ Historical artifact | ℹ️ |

---

## 3️⃣ CONFIGURATION DEBT

### 🔴 CRITICAL

| ID | File | Line(s) | Issue | Impact | Fix Complexity |
|----|------|---------|-------|--------|----------------|
| ~~CFG-001~~ | [`apps/api/docker-compose.yml`](apps/api/docker-compose.yml:1-30) | Full file | ~~Turso config~~ | ✅ **FIXED** | ✅ |

### 🟠 HIGH PRIORITY

| ID | File | Line(s) | Issue | Impact | Fix Complexity |
|----|------|---------|-------|--------|----------------|
| ~~CFG-002~~ | [`apps/api/vitest.config.ts`](apps/api/vitest.config.ts:1-40) | Full file | ~~Turso test config~~ | ✅ **FIXED** | ✅ |
| ~~CFG-003~~ | [`playwright.config.ts`](playwright.config.ts:30-42) | 30-42 | ~~Turso E2E config~~ | ✅ **FIXED** | ✅ |
| CFG-004 | [`apps/api/package.json`](apps/api/package.json:20) | 20 | Test script excludes 20+ test files | Reduced test coverage | Medium |

### 🟡 MEDIUM PRIORITY

| ID | File | Line(s) | Issue | Impact | Fix Complexity |
|----|------|---------|-------|--------|----------------|
| CFG-005 | [`.github/workflows/ci-quality.yml`](.github/workflows/ci-quality.yml:1-89) | 15-27 | Placeholder env vars may mask real issues | Build-time only, but check | Low |
| CFG-006 | [`.github/workflows/test-pipeline.yml`](.github/workflows/test-pipeline.yml:30-33) | 30-33 | Uses Turbo remote caching tokens | Verify still needed | Low |
| CFG-007 | [`package.json`](package.json:46) | 46 | `test:fuzz` references non-existent script | Broken npm script | Low |

### 🟢 LOW PRIORITY

| ID | File | Line(s) | Issue | Impact | Fix Complexity |
|----|------|---------|-------|--------|----------------|
| CFG-008 | Root config files | Various | Unused scripts in package.json | Maintenance overhead | Low |

---

## 4️⃣ TEST DEBT

### 🟠 HIGH PRIORITY

| ID | File | Line(s) | Issue | Impact | Fix Complexity |
|----|------|---------|-------|--------|----------------|
| TST-001 | [`apps/api/package.json`](apps/api/package.json:20) | 20 | Main test script excludes 20+ test files | Critical tests not running in CI | Medium |
| ~~TST-002~~ | [`apps/api/src/__tests__/Integrity.test.ts`](apps/api/src/__tests__/Integrity.test.ts:1-100) | Full file | ~~Turso env test~~ | ✅ **FIXED** | ✅ |
| TST-003 | [`apps/api/vitest.config.ts`](apps/api/vitest.config.ts:23-24) | 23-24 | `@ts-ignore` for Vitest 4 pool options | TypeScript coverage issue | Low |

### 🟡 MEDIUM PRIORITY

| ID | File | Line(s) | Issue | Impact | Fix Complexity |
|----|------|---------|-------|--------|----------------|
| TST-004 | [`apps/web/vitest.config.ts`](apps/web/vitest.config.ts:17-18) | 17-18 | `@ts-ignore` for Vitest 4 pool options | TypeScript coverage issue | Low |
| TST-005 | [`apps/web/lib/__tests__/use-stream-progress.test.ts`](apps/web/lib/__tests__/use-stream-progress.test.ts:88-89) | 88-89 | `@ts-ignore` for global.EventSource mock | Test type safety | Low |
| TST-006 | Multiple test files | Various | Tests use `@ts-expect-error` for mocks | Consider stricter typing | Medium |

### 🟢 LOW PRIORITY

| ID | File | Line(s) | Issue | Impact | Fix Complexity |
|----|------|---------|-------|--------|----------------|
| TST-007 | Test organization | N/A | Some tests in `__tests__`, others co-located | Inconsistent structure | Low |

---

## 5️⃣ INFRASTRUCTURE & DEPLOYMENT DEBT

### 🔴 CRITICAL

| ID | File | Line(s) | Issue | Impact | Fix Complexity |
|----|------|---------|-------|--------|----------------|
| ~~INF-001~~ | [`apps/api/docker-compose.yml`](apps/api/docker-compose.yml:18-19) | 18-19 | ~~Turso docker config~~ | ✅ **FIXED** | ✅ |

### 🟠 HIGH PRIORITY

| ID | File | Line(s) | Issue | Impact | Fix Complexity |
|----|------|---------|-------|--------|----------------|
| ~~INF-002~~ | [`deploy/cloudrun/api.Dockerfile`](deploy/cloudrun/api.Dockerfile:9) | 9 | Copies unused `ephe/` directory | +50MB image size | Low |
| ~~INF-003~~ | [`deploy/cloudrun/worker.Dockerfile`](deploy/cloudrun/worker.Dockerfile:9) | 9 | Copies unused `ephe/` directory | +50MB image size | Low |

### 🟡 MEDIUM PRIORITY

| ID | File | Line(s) | Issue | Impact | Fix Complexity |
|----|------|---------|-------|--------|----------------|
| INF-004 | [`deploy/cloudrun/web.Dockerfile`](deploy/cloudrun/web.Dockerfile:9) | 9 | Copies unnecessary `ephe/` directory | ✅ Not used in build | ✅ |
| ~~INF-005~~ | [`.github/workflows/db-cleanup.yml`](.github/workflows/db-cleanup.yml:26-27) | 26-27 | ~~Turso in workflow~~ | ✅ **FIXED** | ✅ |
| INF-006 | [`.github/workflows/warmup.yml`](.github/workflows/warmup.yml:15) | 15 | Uses `secrets.VERCEL_URL` - verify still used | Warmup failures if misconfigured | Low |

### 🟢 LOW PRIORITY

| ID | File | Line(s) | Issue | Impact | Fix Complexity |
|----|------|---------|-------|--------|----------------|
| INF-007 | [`scripts/`](scripts/) | Various | Some scripts may be deprecated | Maintenance overhead | Low |

---

## 6️⃣ DOCUMENTATION DEBT

### 🟡 MEDIUM PRIORITY

| ID | File | Line(s) | Issue | Impact | Fix Complexity |
|----|------|---------|-------|--------|----------------|
| DOC-001 | [`docs/TURSO_TO_NEON_MIGRATION_AUDIT.md`](docs/TURSO_TO_NEON_MIGRATION_AUDIT.md:1-308) | Full file | Documents already-completed migration | May confuse new developers | Low |
| DOC-002 | [`docs/BACKEND_ARCHITECTURE_IMPACT_ANALYSIS.md`](docs/BACKEND_ARCHITECTURE_IMPACT_ANALYSIS.md:35-69) | 35-69 | Contains "BEFORE" code with Turso refs | May be mistaken for current state | Low |

### 🟢 LOW PRIORITY

| ID | File | Line(s) | Issue | Impact | Fix Complexity |
|----|------|---------|-------|--------|----------------|
| DOC-003 | Multiple docs | Various | Historical audit docs may need archiving | Repository organization | Low |

---

## 7️⃣ CODE QUALITY DEBT

### 🟠 HIGH PRIORITY

| ID | File | Line(s) | Issue | Impact | Fix Complexity |
|----|------|---------|-------|--------|----------------|
| QLT-001 | [`apps/api/src/scripts/*.ts`](apps/api/src/scripts/) | Multiple | 20+ scripts use `console.log` instead of logger | Inconsistent logging, no log levels | Medium |

### 🟡 MEDIUM PRIORITY

| ID | File | Line(s) | Issue | Impact | Fix Complexity |
|----|------|---------|-------|--------|----------------|
| QLT-002 | [`apps/web/app/error.tsx`](apps/web/app/error.tsx:37) | 37 | TODO comment for Sentry integration | Error tracking not implemented | Medium |
| QLT-003 | Various files | Multiple | Debug logging in production code | Potential performance impact | Low |

---

## 8️⃣ DEPRECATED CODE DEBT

| ID | File/Location | Issue | Replacement | Risk Level |
|----|---------------|-------|-------------|------------|
| DEP-001 | [`packages/worker-runtime/src/index.ts:200-231`](packages/worker-runtime/src/index.ts:200-231) | Legacy worker exports throw errors | Use `createWorkerRuntime()` | Low |
| DEP-002 | [`scripts/apply-migration.js`](scripts/apply-migration.js:1) | Turso migration script (already removed per audit) | Use `drizzle-kit push` | N/A |
| DEP-003 | [`scripts/download-ephemeris.sh`](scripts/download-ephemeris.sh:1-55) | Swiss Ephemeris downloader | Use Skyfield service | Low |

---

## 9️⃣ SECURITY DEBT

| ID | File | Issue | Severity | Fix Priority |
|----|------|-------|----------|--------------|
| SEC-001 | [`apps/api/package.json:31-48`](apps/api/package.json:31-48) | Test scripts hardcode secrets (`ENCRYPTION_SECRET`, `CLERK_SECRET_KEY`) | Low (test only) | Medium |
| SEC-002 | [`apps/api/docker-compose.yml`](apps/api/docker-compose.yml) | May expose secrets in env vars | Low (local dev) | Low |

---

## 🔟 DEPENDENCY DEBT

| ID | Package | Location | Issue | Action |
|----|---------|----------|-------|--------|
| DEP-001 | `@libsql/client` | [`apps/api/package.json:57`](apps/api/package.json:57) | ~~Unused Turso client~~ | ✅ **REMOVED** |
| DEP-002 | `libsql` | [`package-lock.json`](package-lock.json) | ~~Transitive dependency~~ | ✅ **REMOVED** with @libsql/client |
| DEP-003 | `@stryker-mutator/*` | [`package.json:66-68`](package.json:66-68) | Mutation testing (verify usage) | Keep if used, else remove |
| DEP-004 | `audit-ci` | [`package.json`](package.json) | Security audit tool | Keep |

---

## 📈 Debt Heat Map

```
Category          | Critical | High | Medium | Low | Total
------------------|----------|------|--------|-----|-------
| Database Migration|    0     |  0   |   0    |  0  |   ✅ **COMPLETE** |
Ephemeris Migration|   1     |  3   |   4    |  0  |    8
Configuration     |    1     |  3   |   3    |  1  |    8
Testing           |    0     |  3   |   2    |  1  |    6
Infrastructure    |    1     |  2   |   3    |  1  |    7
Documentation     |    0     |  0   |   2    |  1  |    3
Code Quality      |    0     |  1   |   1    |  0  |    2
------------------|----------|------|--------|-----|-------
TOTAL             |    6     |  17  |   18   |  6  |   47
```

---

## 🔗 Cross-Reference Matrix

| Debt Item | Blocks CI/CD | Blocks Deploy | Affects Tests | Security Risk | Technical Risk |
|-----------|--------------|---------------|---------------|---------------|----------------|
| | DB-001 (db-cleanup.yml) | ✅ | ✅ | ✅ | ❌ | ✅ **FIXED** |
| | DB-002 (docker-compose) | ✅ | ✅ | ✅ | ❌ | ✅ **FIXED** |
| | DB-003 (vitest.config) | ✅ | ✅ | ✅ | ❌ | ✅ **FIXED** |
| | DB-005 (npm scripts) | ✅ | ✅ | ✅ | ❌ | ✅ **FIXED** |
| ~~EPH-002~~ (ephe/ directory) | ✅ | ✅ | ✅ | ❌ | ✅ **RESOLVED** |
| | CFG-001 (docker-compose) | ✅ | ✅ | ✅ | ❌ | ✅ **FIXED** |
| TST-001 (test exclusions) | ✅ | ❌ | ✅ | ❌ | High |

---

## 📝 Notes

1. **Migration Status:** ✅ **COMPLETE** - All Turso→Neon migration debt resolved as of 2026-03-13.

2. **Ephemeris Status:** Core calculations use Skyfield Python service. Debt is in unused Swiss Ephemeris files and Docker image bloat.

3. **Test Coverage:** Main test script excludes 20+ test files, significantly reducing CI coverage.

4. **Documentation:** Historical audit docs serve as valuable reference but may confuse new developers. Consider archiving or clearly marking as historical.

---

*End of Technical Debt Registry*
