# 🔱 TECHNICAL DEBT RESOLUTION ROADMAP

## AI-Pandit Project - Strategic Resolution Plan

> **Generated:** 2026-03-13  
> **Based on:** [COMPREHENSIVE_TECHNICAL_DEBT_REGISTRY.md](./COMPREHENSIVE_TECHNICAL_DEBT_REGISTRY.md)  
> **Total Debt Items:** 47  
> **Estimated Resolution Time:** 3-5 developer days (parallelizable)

---

## 📋 Resolution Strategy Overview

```mermaid
flowchart TD
    A[Phase 1: Critical Blockers] --> B[Phase 2: High Impact]
    B --> C[Phase 3: Quality & Cleanup]
    C --> D[Phase 4: Documentation]
    
    A --> A1[DB-001: Fix db-cleanup.yml]
    A --> A2[DB-002: Fix docker-compose.yml]
    A --> A3[DB-003: Fix vitest.config.ts]
    A --> A4[DB-004: Fix Integrity.test.ts]
    
    B --> B1[DB-005: Fix npm scripts]
    B --> B2[TST-001: Restore test coverage]
    B --> B3[EPH-002: Remove ephe/ directory]
    B --> B4[INF-002: Optimize Dockerfiles]
    
    C --> C1[Remove @libsql/client]
    C --> C2[Fix console.log in scripts]
    C --> C3[Clean up @ts-ignore]
    
    D --> D1[Archive old audit docs]
    D --> D2[Update README references]
```

---

## 🚨 PHASE 1: CRITICAL BLOCKERS (Day 1)

> **Goal:** Unblock CI/CD and fix immediate deployment/test failures  
> **Effort:** 1 day  
> **Items:** 6  
> **Priority:** P0 - DO NOT DEPLOY WITHOUT THESE FIXES

### Phase 1.1: CI/CD Pipeline Fixes

| Task ID | Debt Item | Action | Files | Verification |
|---------|-----------|--------|-------|--------------|
| P1-001 | DB-001 | Fix db-cleanup.yml to use Neon credentials | [`.github/workflows/db-cleanup.yml`](.github/workflows/db-cleanup.yml:26-27) | Scheduled job runs successfully |
| P1-002 | DB-002 | Update docker-compose.yml for Neon | [`apps/api/docker-compose.yml`](apps/api/docker-compose.yml:18-19) | `docker-compose up` works locally |
| P1-003 | DB-003 | Update vitest.config.ts for Neon | [`apps/api/vitest.config.ts`](apps/api/vitest.config.ts:29-30) | `npm run test` passes |
| P1-004 | DB-004 | Fix Integrity.test.ts env vars | [`apps/api/src/__tests__/Integrity.test.ts`](apps/api/src/__tests__/Integrity.test.ts:18-68) | Integrity tests pass |

#### Implementation Details:

**P1-001: Fix db-cleanup.yml**
```yaml
# BEFORE:
env:
  TURSO_DATABASE_URL: ${{ secrets.TURSO_DATABASE_URL }}
  TURSO_AUTH_TOKEN: ${{ secrets.TURSO_AUTH_TOKEN }}

# AFTER:
env:
  NEON_DATABASE_URL: ${{ secrets.NEON_DATABASE_URL }}
  DATABASE_URL: ${{ secrets.DATABASE_URL }}  # fallback
```

**P1-002: Fix docker-compose.yml**
```yaml
# BEFORE:
environment:
  - TURSO_DATABASE_URL=${TURSO_DATABASE_URL}
  - TURSO_AUTH_TOKEN=${TURSO_AUTH_TOKEN}

# AFTER:
environment:
  - NEON_DATABASE_URL=${NEON_DATABASE_URL}
  - DATABASE_URL=${DATABASE_URL}
  # Remove TURSO references
```

**P1-003: Fix vitest.config.ts**
```typescript
// BEFORE:
env: {
  TURSO_DATABASE_URL: envOrDefault('TURSO_DATABASE_URL', 'file:test.db'),
  TURSO_AUTH_TOKEN: envOrDefault('TURSO_AUTH_TOKEN', 'test-token'),
}

// AFTER:
env: {
  NEON_DATABASE_URL: envOrDefault('NEON_DATABASE_URL', 'postgresql://postgres:postgres@127.0.0.1:5432/postgres'),
  DATABASE_URL: envOrDefault('DATABASE_URL', 'postgresql://postgres:postgres@127.0.0.1:5432/postgres'),
}
```

### Phase 1.2: Verification Checklist

- [ ] `npm run test` passes in CI
- [ ] `docker-compose up` works locally
- [ ] Scheduled db-cleanup job runs without errors
- [ ] Integrity tests validate correct env vars

---

## 🔥 PHASE 2: HIGH IMPACT (Days 2-3)

> **Goal:** Fix test coverage, remove bloat, optimize infrastructure  
> **Effort:** 2 days  
> **Items:** 17  
> **Priority:** P1 - SHOULD COMPLETE BEFORE NEXT SPRINT

### Phase 2.1: NPM Scripts Migration (4-6 hours)

| Task ID | Debt Item | Action | Files |
|---------|-----------|--------|-------|
| P2-001 | DB-005 | Update 7 npm scripts to use Neon vars | [`apps/api/package.json`](apps/api/package.json:31-48) |

#### Scripts to Update:

1. `test:ephemeris:high-precision`
2. `test:ephemeris:gold`
3. `test:ephemeris:gold:strict`
4. `ephemeris:gold:candidates`
5. `ephemeris:compare`
6. `ephemeris:parity:quick`
7. `smoke:duplicate-flow:local`

#### Pattern:
```json
// BEFORE:
"script:name": "... TURSO_DATABASE_URL=file:test.db TURSO_AUTH_TOKEN=test-token ..."

// AFTER:
"script:name": "... NEON_DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/postgres ..."
```

### Phase 2.2: Test Coverage Restoration (4-6 hours)

| Task ID | Debt Item | Action | Files |
|---------|-----------|--------|-------|
| P2-002 | TST-001 | Remove excessive test exclusions | [`apps/api/package.json`](apps/api/package.json:20) |

#### Current Exclusions (20+ files):
```json
"test": "vitest run --exclude src/lib/ephemeris/__tests__/contract.test.ts 
  --exclude src/lib/btr/__tests__/whole-system-btr.test.ts 
  --exclude src/lib/btr/__tests__/synthetic-validation.test.ts 
  --exclude src/lib/btr/__tests__/btr-pipeline.integration.test.ts 
  --exclude src/lib/btr/__tests__/data-package-builder.unit.test.ts 
  --exclude src/lib/__tests__/btr_stress_robustness.test.ts 
  --exclude src/lib/__tests__/stress_benchmarks.test.ts 
  --exclude src/lib/__tests__/performance.benchmark.test.ts 
  --exclude src/routes/__tests__/stream.test.ts 
  --exclude src/__tests__/CORS.test.ts 
  --exclude src/__tests__/ProductionAudit.test.ts 
  --exclude src/__tests__/smoke.test.ts 
  --exclude src/lib/__tests__/ai-resilience.test.ts 
  --exclude src/lib/__tests__/ai_intelligence.test.ts 
  --exclude src/lib/__tests__/frontend_network_stress.test.ts 
  --exclude src/lib/__tests__/frontend_realtime_sync.test.ts 
  --exclude src/lib/__tests__/queue-claim-concurrency.test.ts 
  --exclude src/routes/__tests__/SessionIntegrity.test.ts 
  --exclude src/routes/__tests__/api.integration.test.ts 
  --exclude src/routes/__tests__/health.test.ts 
  --exclude src/lib/btr/__tests__/mixed-precision-pipeline-audit.test.ts 
  --exclude src/lib/btr/stages/__tests__/btr-model-routing.test.ts"
```

#### Strategy:
1. Review each excluded test
2. Categorize as: `keep_excluded` | `fix_and_include` | `remove_if_obsolete`
3. Create separate PR for test coverage restoration
4. Target: Reduce exclusions by 50%

### Phase 2.3: Swiss Ephemeris Cleanup (2-3 hours)

| Task ID | Debt Item | Action | Files |
|---------|-----------|--------|-------|
| P2-003 | EPH-002 | Remove ephe/ directory from git | [`ephe/`](ephe/) |
| P2-004 | EPH-003 | Archive download-ephemeris.sh | [`scripts/download-ephemeris.sh`](scripts/download-ephemeris.sh) |

#### Steps:
```bash
# 1. Remove from git tracking (keep locally if needed)
git rm -r --cached ephe/

# 2. Add to .gitignore
echo "ephe/" >> .gitignore

# 3. Archive the download script
mkdir -p scripts/archive
mv scripts/download-ephemeris.sh scripts/archive/

# 4. Commit with clear message
git commit -m "chore: remove Swiss Ephemeris files - migrated to Skyfield"
```

### Phase 2.4: Docker Optimization (3-4 hours)

| Task ID | Debt Item | Action | Files |
|---------|-----------|--------|-------|
| P2-005 | INF-002 | Remove ephe/ from api.Dockerfile | [`deploy/cloudrun/api.Dockerfile`](deploy/cloudrun/api.Dockerfile:9) |
| P2-006 | INF-003 | Remove ephe/ from worker.Dockerfile | [`deploy/cloudrun/worker.Dockerfile`](deploy/cloudrun/worker.Dockerfile:9) |
| P2-007 | INF-004 | Remove ephe/ from web.Dockerfile | [`deploy/cloudrun/web.Dockerfile`](deploy/cloudrun/web.Dockerfile:9) |

#### Changes:
```dockerfile
# Remove these lines from all Dockerfiles:
# COPY ephe ./ephe
# ENV SWISSEPH_PATH=/app/ephe
```

### Phase 2.5: E2E Test Configuration (1 hour)

| Task ID | Debt Item | Action | Files |
|---------|-----------|--------|-------|
| P2-008 | DB-006 | Update playwright.config.ts | [`playwright.config.ts`](playwright.config.ts:37-38) |

#### Changes:
```typescript
// BEFORE:
env: {
  TURSO_DATABASE_URL: process.env.TURSO_DATABASE_URL || 'file:test.db',
  TURSO_AUTH_TOKEN: process.env.TURSO_AUTH_TOKEN || 'test-token',
}

// AFTER:
env: {
  NEON_DATABASE_URL: process.env.NEON_DATABASE_URL || 'postgresql://postgres:postgres@127.0.0.1:5432/postgres',
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://postgres:postgres@127.0.0.1:5432/postgres',
}
```

### Phase 2.6: Verification Checklist

- [ ] All npm scripts use Neon vars
- [ ] Test coverage increased (target: +20%)
- [ ] Docker image size reduced by ~50MB
- [ ] E2E tests pass
- [ ] No Turso references in active config

---

## 🧹 PHASE 3: QUALITY & CLEANUP (Day 4)

> **Goal:** Remove unused dependencies, clean up code quality issues  
> **Effort:** 1 day  
> **Items:** 18  
> **Priority:** P2 - SHOULD COMPLETE THIS SPRINT

### Phase 3.1: Dependency Cleanup (3-4 hours)

| Task ID | Debt Item | Action | Files |
|---------|-----------|--------|-------|
| P3-001 | DB-007 | Remove @libsql/client from api | [`apps/api/package.json`](apps/api/package.json:57) |
| P3-002 | DEP-001 | Clean up package-lock.json | [`package-lock.json`](package-lock.json) |

#### Steps:
```bash
# 1. Remove dependency
npm uninstall @libsql/client -w @ai-pandit/api

# 2. Verify no imports remain
grep -r "@libsql/client" apps/ packages/ || echo "✅ No imports found"

# 3. Update lockfile
npm install

# 4. Verify tests still pass
npm run test
```

### Phase 3.2: Code Quality Improvements (3-4 hours)

| Task ID | Debt Item | Action | Files |
|---------|-----------|--------|-------|
| P3-003 | QLT-001 | Replace console.log with logger in scripts | [`apps/api/src/scripts/*.ts`](apps/api/src/scripts/) |
| P3-004 | TST-003 | Fix @ts-ignore in vitest configs | [`apps/api/vitest.config.ts`](apps/api/vitest.config.ts:23-24) |
| P3-005 | TST-004 | Fix @ts-ignore in web vitest config | [`apps/web/vitest.config.ts`](apps/web/vitest.config.ts:17-18) |

#### Console.log Replacement Strategy:
```typescript
// BEFORE (in scripts):
console.log('Starting process...');
console.error('Error:', err);

// AFTER:
import { logger } from '../utils/logger';
logger.info('Starting process...');
logger.error('Error:', err);
```

### Phase 3.3: TypeScript Improvements (2 hours)

| Task ID | Debt Item | Action | Files |
|---------|-----------|--------|-------|
| P3-006 | TST-005 | Fix @ts-ignore in stream progress tests | [`apps/web/lib/__tests__/use-stream-progress.test.ts`](apps/web/lib/__tests__/use-stream-progress.test.ts:88-89) |
| P3-007 | TST-006 | Review @ts-expect-error usage | Various test files |

### Phase 3.4: Configuration Cleanup (1 hour)

| Task ID | Debt Item | Action | Files |
|---------|-----------|--------|-------|
| P3-008 | CFG-007 | Fix or remove test:fuzz script | [`package.json`](package.json:46) |
| P3-009 | CFG-005 | Verify CI workflow env vars | [`.github/workflows/ci-quality.yml`](.github/workflows/ci-quality.yml) |

### Phase 3.5: Verification Checklist

- [ ] `npm run test` passes
- [ ] `npm run lint` passes
- [ ] `npm run build` succeeds
- [ ] No @libsql/client in package-lock.json
- [ ] No new console.log statements in scripts

---

## 📚 PHASE 4: DOCUMENTATION (Day 5)

> **Goal:** Archive historical docs, update references  
> **Effort:** 1 day (can parallelize with Phase 3)  
> **Items:** 6  
> **Priority:** P3 - CAN DEFER IF NEEDED

### Phase 4.1: Documentation Archival (2 hours)

| Task ID | Debt Item | Action | Files |
|---------|-----------|--------|-------|
| P4-001 | DOC-001 | Archive Turso migration audit | [`docs/TURSO_TO_NEON_MIGRATION_AUDIT.md`](docs/TURSO_TO_NEON_MIGRATION_AUDIT.md) |
| P4-002 | DB-009 | Archive backend architecture impact analysis | [`docs/BACKEND_ARCHITECTURE_IMPACT_ANALYSIS.md`](docs/BACKEND_ARCHITECTURE_IMPACT_ANALYSIS.md) |
| P4-003 | DB-010 | Review and archive old audit docs | [`docs/*AUDIT*.md`](docs/) |

#### Archival Structure:
```
docs/
├── archive/
│   ├── 2026-03-migration/
│   │   ├── TURSO_TO_NEON_MIGRATION_AUDIT.md
│   │   ├── BACKEND_ARCHITECTURE_IMPACT_ANALYSIS.md
│   │   └── FRONTEND_BACKEND_ARCHITECTURE_IMPACT_ANALYSIS.md
│   └── README.md  # Index of archived docs
├── COMPREHENSIVE_TECHNICAL_DEBT_REGISTRY.md
├── TECHNICAL_DEBT_RESOLUTION_ROADMAP.md
└── ...
```

### Phase 4.2: Comment Cleanup (1 hour)

| Task ID | Debt Item | Action | Files |
|---------|-----------|--------|-------|
| P4-004 | DB-014 | Remove [TURSO OPTIMIZED] comments | [`apps/api/src/lib/progress-tracker.ts`](apps/api/src/lib/progress-tracker.ts:473-490) |

### Phase 4.3: README Updates (2 hours)

| Task ID | Debt Item | Action | Files |
|---------|-----------|--------|-------|
| P4-005 | DOC-003 | Update main README with current stack | [`README.md`](README.md) |
| P4-006 | QLT-002 | Add Sentry setup instructions | [`docs/ERROR_TRACKING.md`](docs/ERROR_TRACKING.md) (create) |

### Phase 4.4: Verification Checklist

- [ ] Historical docs moved to archive/
- [ ] README reflects current architecture
- [ ] No [TURSO OPTIMIZED] comments in code
- [ ] Archive index created

---

## 📅 Suggested Timeline

```
Week 1:
  Day 1 (Mon): Phase 1 - Critical Blockers
  Day 2 (Tue): Phase 2.1-2.3 - Scripts & Tests
  Day 3 (Wed): Phase 2.4-2.6 - Docker & E2E
  Day 4 (Thu): Phase 3 - Quality & Cleanup
  Day 5 (Fri): Phase 4 - Documentation

Week 2:
  Mon-Fri: Buffer for reviews, testing, and unexpected issues
```

---

## 🔀 Parallelization Strategy

### Can Run in Parallel:

| Track A (Infrastructure) | Track B (Tests) | Track C (Docs) |
|--------------------------|-----------------|----------------|
| P1-001: db-cleanup.yml | P1-003: vitest.config.ts | P4-001: Archive docs |
| P1-002: docker-compose.yml | P1-004: Integrity.test.ts | P4-004: Comment cleanup |
| P2-005: Docker optimization | P2-002: Test coverage | P4-005: README updates |
| P3-001: Remove @libsql | P2-008: Playwright config | P4-006: Sentry docs |

### Sequential Dependencies:

```
P1-003 (vitest.config) → P2-002 (test coverage) → P3-003 (code quality)
P2-003 (ephe/ removal) → P2-005 (Docker optimization)
```

---

## ✅ Acceptance Criteria

### Phase 1 Complete When:
- [ ] All CI checks pass
- [ ] `npm run test` succeeds
- [ ] Docker compose works locally

### Phase 2 Complete When:
- [ ] Test coverage increased by 20%
- [ ] Docker image size reduced by 50MB
- [ ] No Turso references in npm scripts
- [ ] E2E tests pass

### Phase 3 Complete When:
- [ ] No @libsql/client dependency
- [ ] No console.log in production scripts
- [ ] All builds pass
- [ ] No new lint errors

### Phase 4 Complete When:
- [ ] Historical docs archived
- [ ] README updated
- [ ] Comments cleaned up

---

## 🎯 Success Metrics

| Metric | Before | Target | After |
|--------|--------|--------|-------|
| Turso references | 47 | 0 | TBD |
| Test coverage | ~40% | 60% | TBD |
| Docker image size | ~200MB | ~150MB | TBD |
| CI pass rate | ~85% | 100% | TBD |
| Console.log in scripts | 20+ | 0 | TBD |
| @libsql/client | Present | Removed | TBD |

---

## 🛡️ Risk Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Tests fail after removing exclusions | Medium | High | Review each test before inclusion |
| Docker builds break | Low | High | Test in staging environment |
| Missing dependency after @libsql removal | Low | Medium | Full dependency audit |
| Historical doc loss | Low | Medium | Use git history + archive |

---

## 📝 Change Log

| Date | Version | Changes |
|------|---------|---------|
| 2026-03-13 | 1.0 | Initial roadmap creation |

---

*End of Technical Debt Resolution Roadmap*
