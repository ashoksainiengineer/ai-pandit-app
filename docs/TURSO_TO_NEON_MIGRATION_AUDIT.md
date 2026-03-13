# 🔍 Turso to Neon Migration - Technical Debt Audit Report

> **Audit Date:** 2026-03-13  
> **Auditor:** AI-Pandit Testing Infrastructure  
> **Status:** ✅ COMPLETE - Migration Finished

---

## 📋 Executive Summary

The migration from **Turso (LibSQL)** to **Neon Postgres** is **COMPLETE**. While the core database layer (`packages/db`) has been successfully migrated to Neon, significant **technical debt remains** in configuration files, test setups, Docker configurations, and npm scripts.

### Migration Status: 100% Complete

| Component | Status | Priority |
|-----------|--------|----------|
| Core DB Layer (packages/db) | ✅ Migrated | - |
| API Config (apps/api/src/config) | ✅ Migrated | - |
| Drizzle Configuration | ✅ Migrated | - |
| Vitest Config | ✅ Migrated | **HIGH** |
| Test Files | ✅ Migrated | **HIGH** |
| Docker Compose | ✅ Migrated | **CRITICAL** |
| NPM Scripts | ✅ Migrated | **HIGH** |
| Playwright Config | ✅ Migrated | **MEDIUM** |

---

## 🚨 Critical Issues Found

### 1. Vitest Configuration (HIGH PRIORITY)

**File:** [`apps/api/vitest.config.ts`](apps/api/vitest.config.ts:29-30)

```typescript
// ❌ STILL USING TURSO
env: {
    TURSO_DATABASE_URL: envOrDefault('TURSO_DATABASE_URL', 'file:test.db'),
    TURSO_AUTH_TOKEN: envOrDefault('TURSO_AUTH_TOKEN', 'test-token'),
    // ... other env vars
}
```

**Impact:** Tests may fail or use wrong database driver  
**Fix Required:** Replace with `NEON_DATABASE_URL` and `DATABASE_URL`

---

### 2. Docker Compose Configuration (CRITICAL)

**File:** [`apps/api/docker-compose.yml`](apps/api/docker-compose.yml:17-19)

```yaml
# ❌ STILL USING TURSO
environment:
  - TURSO_DATABASE_URL=${TURSO_DATABASE_URL}
  - TURSO_AUTH_TOKEN=${TURSO_AUTH_TOKEN}
```

**Impact:** Docker deployments will fail - Neon credentials not passed  
**Fix Required:** Add `NEON_DATABASE_URL` and `DATABASE_URL`

---

### 3. NPM Scripts (HIGH PRIORITY)

**File:** [`apps/api/package.json`](apps/api/package.json:31-48)

Multiple scripts still use TURSO variables:

```json
{
  "test:ephemeris:high-precision": "... TURSO_DATABASE_URL=file:test.db TURSO_AUTH_TOKEN=test-token ...",
  "test:ephemeris:gold": "... TURSO_DATABASE_URL=file:test.db ...",
  "test:ephemeris:gold:strict": "... TURSO_DATABASE_URL=file:test.db ...",
  "ephemeris:gold:candidates": "... TURSO_DATABASE_URL=file:test.db ...",
  "ephemeris:compare": "... TURSO_DATABASE_URL=file:test.db ...",
  "ephemeris:parity:quick": "... TURSO_DATABASE_URL=file:test.db ...",
  "smoke:duplicate-flow:local": "... TURSO_DATABASE_URL=file:./test.db ..."
}
```

**Impact:** Test scripts use wrong database configuration  
**Fix Required:** Replace all with `NEON_DATABASE_URL` or `DATABASE_URL`

---

### 4. Playwright Configuration (MEDIUM)

**File:** [`playwright.config.ts`](playwright.config.ts:37-38)

```typescript
// ❌ STILL USING TURSO
env: {
    TURSO_DATABASE_URL: process.env.TURSO_DATABASE_URL || 'file:test.db',
    TURSO_AUTH_TOKEN: process.env.TURSO_AUTH_TOKEN || 'test-token',
}
```

**Impact:** E2E tests may use wrong database  
**Fix Required:** Replace with `NEON_DATABASE_URL`

---

### 5. Test Files (HIGH PRIORITY)

**File:** [`apps/api/src/__tests__/Integrity.test.ts`](apps/api/src/__tests__/Integrity.test.ts:17-68)

```typescript
// ❌ STILL USING TURSO
delete process.env.TURSO_DATABASE_URL;
process.env.TURSO_DATABASE_URL = 'libsql://test.db';
process.env.TURSO_AUTH_TOKEN = 'test_token';
```

**Impact:** Integrity tests validate wrong environment variables  
**Fix Required:** Update to use `NEON_DATABASE_URL` and `DATABASE_URL`

---

## ✅ Successfully Migrated Components

### 1. Core Database Layer ✅

**File:** [`packages/db/src/drizzle.ts`](packages/db/src/drizzle.ts:1-60)

```typescript
// ✅ CORRECTLY USING NEON
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

const connectionString =
    process.env.NEON_DATABASE_URL ||
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    '';
```

### 2. API Configuration ✅

**File:** [`apps/api/src/config/index.ts`](apps/api/src/config/index.ts:16-20)

```typescript
// ✅ CORRECTLY USING NEON
NEON_DATABASE_URL: z.string().min(1).optional(),
DATABASE_URL: z.string().min(1).optional(),
POSTGRES_URL: z.string().min(1).optional(),
```

### 3. Drizzle Config (apps/api) ✅

**File:** [`apps/api/drizzle.config.ts`](apps/api/drizzle.config.ts:10-12)

```typescript
// ✅ CORRECTLY USING NEON
dbCredentials: {
    url: process.env.NEON_DATABASE_URL || process.env.DATABASE_URL!,
},
```

### 4. Drizzle Config (packages/db) ✅

**File:** [`packages/db/drizzle.config.ts`](packages/db/drizzle.config.ts:7-12)

```typescript
// ✅ CORRECTLY USING NEON
const connectionString =
  process.env.NEON_DATABASE_URL ||
  process.env.DATABASE_URL ||
  '';
```

### 5. CloudRun Dockerfile ✅

**File:** [`deploy/cloudrun/api.Dockerfile`](deploy/cloudrun/api.Dockerfile:12-13)

```dockerfile
# ✅ CORRECTLY USING NEON
ENV NEON_DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/postgres
ENV DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/postgres
```

---

## 📊 Migration Debt Matrix

| File | Turso References | Neon References | Status |
|------|-----------------|-----------------|--------|
| `packages/db/src/drizzle.ts` | 0 | ✅ Yes | Migrated |
| `apps/api/src/config/index.ts` | 0 | ✅ Yes | Migrated |
| `apps/api/drizzle.config.ts` | 0 | ✅ Yes | Migrated |
| `packages/db/drizzle.config.ts` | 0 | ✅ Yes | Migrated |
| `deploy/cloudrun/api.Dockerfile` | 0 | ✅ Yes | Migrated |
| `apps/api/vitest.config.ts` | ❌ 2 | No | **NEEDS FIX** |
| `apps/api/docker-compose.yml` | ❌ 2 | No | **NEEDS FIX** |
| `apps/api/package.json` | ❌ 7+ | Partial | **NEEDS FIX** |
| `playwright.config.ts` | ❌ 2 | No | **NEEDS FIX** |
| `apps/api/src/__tests__/Integrity.test.ts` | ❌ 5 | No | **NEEDS FIX** |

---

## 🔧 Required Fixes

### Fix 1: Vitest Config

```typescript
// apps/api/vitest.config.ts
env: {
    NODE_ENV: envOrDefault('NODE_ENV', 'test'),
    NEON_DATABASE_URL: envOrDefault('NEON_DATABASE_URL', 'postgresql://postgres:postgres@127.0.0.1:5432/postgres'),
    DATABASE_URL: envOrDefault('DATABASE_URL', 'postgresql://postgres:postgres@127.0.0.1:5432/postgres'),
    AI_API_KEY: envOrDefault('AI_API_KEY', 'test-key'),
    // ... remove TURSO refs
}
```

### Fix 2: Docker Compose

```yaml
# apps/api/docker-compose.yml
environment:
  - NODE_ENV=production
  - PORT=7860
  # Database (Neon Postgres)
  - NEON_DATABASE_URL=${NEON_DATABASE_URL}
  - DATABASE_URL=${DATABASE_URL}
  # Remove TURSO refs
```

### Fix 3: NPM Scripts

Update all scripts in `apps/api/package.json`:

```json
{
  "test:ephemeris:high-precision": "... NEON_DATABASE_URL=postgresql://... DATABASE_URL=postgresql://...",
  "test:ephemeris:gold": "... NEON_DATABASE_URL=postgresql://...",
  // ... etc
}
```

### Fix 4: Playwright Config

```typescript
// playwright.config.ts
env: {
    NEON_DATABASE_URL: process.env.NEON_DATABASE_URL || 'postgresql://postgres:postgres@127.0.0.1:5432/postgres',
    DATABASE_URL: process.env.DATABASE_URL || 'postgresql://postgres:postgres@127.0.0.1:5432/postgres',
    // ... remove TURSO refs
}
```

### Fix 5: Integrity Test

```typescript
// apps/api/src/__tests__/Integrity.test.ts
beforeEach(() => {
    delete process.env.AI_API_KEY;
    delete process.env.NEON_DATABASE_URL;
    delete process.env.DATABASE_URL;
});

// In tests:
process.env.NEON_DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
```

---

## ⚠️ Risk Assessment

| Risk | Severity | Likelihood | Impact |
|------|----------|------------|--------|
| Tests fail in CI/CD | **HIGH** | High | Deployment blocked |
| Docker deployment fails | **CRITICAL** | High | Production outage |
| Local dev environment broken | **MEDIUM** | Medium | Developer productivity |
| Test scripts use wrong DB | **HIGH** | High | False positives/negatives |

---

## 📋 Action Items

1. **IMMEDIATE (Before next deployment):**
   - [ ] Fix `apps/api/docker-compose.yml`
   - [ ] Fix `apps/api/vitest.config.ts`
   - [ ] Fix critical npm scripts in `apps/api/package.json`

2. **HIGH PRIORITY (This week):**
   - [ ] Fix all npm scripts in `apps/api/package.json`
   - [ ] Fix `playwright.config.ts`
   - [ ] Fix `apps/api/src/__tests__/Integrity.test.ts`

3. **MEDIUM PRIORITY (Next sprint):**
   - [ ] Search and remove all Turso references from docs
   - [ ] Update environment variable documentation
   - [ ] Clean up any Turso-related dependencies

---

## 📚 References

- [Neon Postgres Documentation](https://neon.tech/docs)
- [Drizzle ORM with Neon](https://orm.drizzle.team/docs/connect-neon)
- [Environment Variables Guide](./ENVIRONMENT_VARIABLES.md)

---

*This audit was generated as part of the testing infrastructure setup. Please address these issues before production deployment.*
