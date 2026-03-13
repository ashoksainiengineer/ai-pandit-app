# Frontend-Backend Architecture Impact Analysis

**Date:** 13 March 2026
**Last Updated:** 13 March 2026 (Post Line-by-Line Audit)
**Status:** CRITICAL - Multiple Breaking Changes Identified
**Risk Level:** HIGH

---

## Executive Summary

Backend mein major architecture changes hue hain, jiska frontend par **significant impact** hoga. **Sabse bada change: Turso (libSQL/SQLite) → Neon (PostgreSQL) migration** hai, jo directly frontend code ko affect karta hai.

**Line-by-Line Audit Complete:** 15+ files audited, 5 CRITICAL issues identified

---

## 1. Major Backend Changes & Frontend Impact

### 1.1 Database Migration: Turso → Neon Postgres [CRITICAL]

| Aspect | Before | After | Frontend Impact |
|--------|--------|-------|-----------------|
| **Database** | Turso (libSQL/SQLite) | Neon (PostgreSQL) | **HIGH** |
| **Connection** | @libsql/client | @neondatabase/serverless | Package updates needed |
| **Schema** | SQLite dialect | Postgres dialect | Drizzle migrations needed |
| **Edge/Server** | Edge-compatible | Serverful (Node.js) | No change, but deployment impacts |

#### 🔴 CRITICAL: Raw SQL Compatibility Issue

**File:** `apps/web/lib/server/favorite-store.ts` (Lines 30-42)
```typescript
// CURRENT CODE (SQLite syntax) - WILL BREAK with Neon
await pool.query(`
  CREATE TABLE IF NOT EXISTS session_favorites (
    id TEXT PRIMARY KEY,
    clerkId TEXT NOT NULL,
    sessionId TEXT NOT NULL,
    createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP::text,  -- SQLite cast
    updatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP::text,
    FOREIGN KEY (sessionId) REFERENCES sessions(id) ON DELETE CASCADE
  )
`);
```

**Status:** ✅ FIXED

**Issue:**
- Uses `pool.query()` with SQLite-specific syntax
- `CURRENT_TIMESTAMP::text` is SQLite casting
- Neon uses PostgreSQL syntax: `CURRENT_TIMESTAMP::timestamptz`
- Table creation may fail on Neon

**Fix Applied:**
```typescript
// NEON COMPATIBLE - Applied to favorite-store.ts
await pool.query(`
  CREATE TABLE IF NOT EXISTS session_favorites (
    id TEXT PRIMARY KEY,
    clerk_id TEXT NOT NULL,                          -- snake_case for Postgres
    session_id TEXT NOT NULL,                        -- snake_case for Postgres
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,  -- Postgres type
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,  -- Postgres type
    CONSTRAINT fk_session FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
  )
`);
```

#### Affected Frontend Files (Direct DB Access):

| File | Line | Issue | Risk |
|------|------|-------|------|
| `lib/server/session-ownership.ts` | 1-28 | Uses `@ai-pandit/db` | HIGH |
| `lib/server/session-write-guards.ts` | 1-26 | Pure logic, no DB | LOW |
| `lib/server/favorite-store.ts` | 1-119 | **Raw SQL + pool access** | **CRITICAL** |
| `lib/server/user-sync.ts` | 1-46 | Uses `@ai-pandit/db` | HIGH |
| `lib/server/backend-proxy.ts` | 1-48 | HTTP proxy only | NONE |
| `app/api/sessions/route.ts` | 4, 139 | Direct DB + "Turso" comment | HIGH |
| `app/api/sessions/[id]/route.ts` | 3-4 | Direct DB access | HIGH |
| `app/api/sessions/[id]/favorite/route.ts` | 3-4 | Direct DB access | HIGH |

#### 🔍 Line-by-Line Audit: UI References to Turso

| File | Line | Current Text | Issue |
|------|------|--------------|-------|
| `app/api/sessions/route.ts` | 139 | `// 3. Insert into Turso via Drizzle` | Comment outdated |
| `components/landing/Problem.tsx` | 133 | `{ label: 'Database', value: 'Turso (libSQL)' }` | Tech stack label |
| `components/landing/Solution.tsx` | 114 | `{ name: 'Database', tech: 'Turso' }` | Backend component label |
| `components/landing/TechStack.tsx` | 66 | `{ name: 'Turso (SQLite)' }` | Tech item name |
| `components/landing/TechnologyStack.tsx` | 79 | `{ label: 'SQLite + Turso' }` | Grid label |
| `app/privacy/page.tsx` | 443 | `"stored in Turso (libSQL)"` | Privacy policy text |
| `components/landing/AIThinkingBox.tsx` | 26 | `"Connecting to Turso database..."` | Animation sequence |
| `app/rectify/page.tsx` | 259, 277 | Comments referencing "Turso" and "HF Backend" | Comments outdated |

**Status:** ✅ COMPLETED - All Turso references updated to Neon Postgres
- `app/api/sessions/route.ts` - Comment updated
- `components/landing/Problem.tsx` - Tech spec label updated
- `components/landing/Solution.tsx` - Backend component label updated
- `components/landing/TechStack.tsx` - Tech item name updated
- `components/landing/TechnologyStack.tsx` - Grid label updated
- `app/privacy/page.tsx` - Privacy policy text updated
- `components/landing/AIThinkingBox.tsx` - Animation sequence already updated
- `app/rectify/page.tsx` - Comments updated
- `components/Footer.tsx` - Footer text updated

---

### 1.2 Session Ownership Model Changes

| Aspect | Before | After | Impact |
|--------|--------|-------|--------|
| **Ownership Check** | Clerk ID only | Clerk ID OR internal userId | **MEDIUM** |
| **User Sync** | On-demand | Explicit sync flow | **MEDIUM** |
| **Session Write Guards** | Basic | Field-level protection | **LOW** |

#### Affected Code:

**`apps/web/lib/server/session-ownership.ts`**
```typescript
// Current implementation - WORKING
export interface SessionOwnershipContext {
  clerkId: string;
  internalUserId: string | null;
}

export function buildOwnedSessionWhereClause(sessionId: string, context: SessionOwnershipContext) {
  const ownershipPredicate = context.internalUserId
    ? or(eq(sessions.clerkId, context.clerkId), eq(sessions.userId, context.internalUserId))
    : eq(sessions.clerkId, context.clerkId);
  return and(eq(sessions.id, sessionId), ownershipPredicate);
}
```

**Status:** ✅ Already aligned with backend

---

### 1.3 Job + Queue Architecture Changes

| Aspect | Before | After | Impact |
|--------|--------|-------|--------|
| **Execution Mode** | Inline (monolithic) | External Worker | **HIGH** |
| **Queue Driver** | In-memory | db_polling / redis_bullmq | **MEDIUM** |
| **Job States** | Simple | Complex (queued/running/completed/failed/cancelled/retrying) | **MEDIUM** |
| **Progress Tracking** | Simple polling | SSE + Polling + Event Replay | **LOW** |

#### Frontend Impact:

**Session Status Handling:**

Current frontend status checks in:
- `apps/web/components/dashboard/SessionCard.tsx:124`
- `apps/web/app/debug-analysis/[id]/page.tsx:243-244`
- `apps/web/app/rectify/[id]/page.tsx:238-239`

```typescript
// Current status checks
const isLive = ['processing', 'pending', 'queued'].includes(session.status);

if (metadata?.status === 'cancelled') setCancelled(true);
else if (metadata?.status && ['pending', 'queued', 'processing'].includes(metadata.status)) 
  setCancelled(false);
```

**Status:** ⚠️ May need update for new job states (`retrying`)

#### API Endpoints:

| Endpoint | Before | After | Status |
|----------|--------|-------|--------|
| `/api/analysis/queue` | Direct calc | Queue job | ✅ Proxy handles |
| `/api/analysis/progress` | Session status | Job + Session status | ⚠️ Verify contract |
| `/api/analysis/requeue` | Not present | Requeue cancelled job | ✅ New feature |
| `/api/stream` | Basic SSE | Replay-capable SSE | ⚠️ Verify Last-Event-ID |

---

### 1.4 Ephemeris Architecture Change

| Aspect | Before | After | Impact |
|--------|--------|-------|--------|
| **Provider** | Swiss Ephemeris (WASM) | Skyfield (Python FastAPI) | **LOW** (cleanup done) |
| **Location** | Frontend + Backend | Backend only | **MEDIUM** |
| **Precision** | 0.0001° | Same | No change |

**Status:** ✅ Naming cleanup completed

Remaining UI references to update:
```
apps/web/lib/ephemeris.ts:4     # Comment: "Frontend doesn't have access to Swiss..."
apps/web/app/api/health/route.ts:55 # Mode: 'swiss-ephemeris' → 'skyfield'
```

---

### 1.5 Authentication & Proxy Changes

**Current Proxy Flow:**
```
Frontend → Web Server Route → Backend API
                ↓
         Clerk Auth + Token Forward
```

**Key Files:**
- `apps/web/lib/server/backend-proxy.ts` - Proxy implementation
- `apps/web/app/api/analysis/queue/route.ts` - Queue proxy
- `apps/web/app/api/analysis/progress/route.ts` - Progress proxy

**Status:** ✅ Working correctly

---

## 2. Critical Migration Checklist

### Phase 1: Database Layer (HIGH PRIORITY)

- [ ] Update `packages/db` to use Neon Postgres
  ```typescript
  // Before
  import { createClient } from '@libsql/client';
  
  // After
  import { neon } from '@neondatabase/serverless';
  import { drizzle } from 'drizzle-orm/neon-http';
  ```

- [ ] Update Drizzle config for Postgres
- [ ] Create migration scripts
- [ ] Test schema compatibility

### Phase 2: Frontend Server Routes (HIGH PRIORITY)

- [ ] Update `apps/web/lib/server/session-ownership.ts`
- [ ] Update `apps/web/lib/server/session-write-guards.ts`
- [ ] Verify `apps/web/app/api/sessions/route.ts`
- [ ] Verify `apps/web/app/api/sessions/[id]/route.ts`
- [ ] Verify `apps/web/app/api/user/favorites/route.ts`

### Phase 3: UI Text Updates (MEDIUM PRIORITY)

- [ ] Update all "Turso" references to "Neon Postgres"
- [ ] Update technology stack descriptions
- [ ] Update AIThinkingBox sequence messages

### Phase 4: API Contract Verification (MEDIUM PRIORITY)

- [ ] Verify `/api/analysis/queue` response format
- [ ] Verify `/api/analysis/progress` response format
- [ ] Verify `/api/stream` SSE format
- [ ] Verify `/api/analysis/requeue` functionality

### Phase 5: Integration Testing (HIGH PRIORITY)

- [ ] End-to-end flow: Submit → Queue → Process → Results
- [ ] Session ownership enforcement
- [ ] Favorite functionality
- [ ] Stream reconnection
- [ ] Job cancellation/requeue

---

## 3. Known Risk Areas

### Risk 1: Direct DB Access in Frontend Server Routes

**Problem:** Frontend server routes directly access database via `@ai-pandit/db`:

```typescript
// apps/web/app/api/sessions/route.ts
import { db } from '@ai-pandit/db';  // This needs Neon migration
import { sessions, users } from '@ai-pandit/db/schema';
```

**Impact:** HIGH - Will break if db package switches to Neon without compatibility layer

**Mitigation:** 
- Ensure `packages/db` exports compatible interface
- Test all server routes after db migration

### Risk 2: Session Status States

**Problem:** Frontend checks for `['processing', 'pending', 'queued']` but backend now has `retrying` state.

**Impact:** MEDIUM - UI may not show correct status for retrying jobs

**Mitigation:**
- Add `'retrying'` to isLive checks
- Update status badges

### Risk 3: Environment Variables

**Problem:** Database URL format changed

| Before | After |
|--------|-------|
| `TURSO_DATABASE_URL` | `NEON_DATABASE_URL` |
| `TURSO_AUTH_TOKEN` | (Removed) |

**Impact:** HIGH - Deployment will fail without env var updates

**Mitigation:**
- Update `.env.example`
- Update `.env.local.example`
- Update deployment scripts
- Update GitHub secrets

---

## 4. Testing Strategy

### Unit Tests

```bash
# Test server utilities
npm -w @ai-pandit/web run test -- lib/server/

# Test API routes
npm -w @ai-pandit/web run test -- app/api/
```

### Integration Tests

```bash
# E2E smoke tests
npm run test:e2e:smoke

# Full E2E suite
npm run test:e2e
```

### Manual Verification Checklist

- [ ] Create new session
- [ ] Submit analysis (queue job)
- [ ] View progress via SSE
- [ ] View progress via polling fallback
- [ ] Cancel job
- [ ] Requeue job
- [ ] View results
- [ ] Clone session
- [ ] Delete session
- [ ] Add/remove favorites

---

## 5. Deployment Considerations

### Environment Variables Update

Required in all environments:

```bash
# Remove these
TURSO_DATABASE_URL
TURSO_AUTH_TOKEN

# Add these
NEON_DATABASE_URL="postgresql://..."
```

### Secret Manager Updates

Update Google Secret Manager:
- Remove: `turso-database-url`, `turso-auth-token`
- Add/Update: `neon-database-url`

### Deployment Sequence

1. **Phase 1:** Update packages/db (Neon migration)
2. **Phase 2:** Update apps/api (already done)
3. **Phase 3:** Update apps/web server routes
4. **Phase 4:** Update apps/worker (already done)
5. **Phase 5:** Deploy all services
6. **Phase 6:** Run E2E verification

---

## 6. Files Requiring Updates

### Critical (Will Break)

```
packages/db/src/drizzle.ts              # Database connection
packages/db/src/schema.ts               # Schema definitions
apps/web/lib/server/session-ownership.ts # Uses db
apps/web/lib/server/favorite-store.ts   # Uses db
apps/web/app/api/sessions/route.ts      # Uses db
apps/web/app/api/sessions/[id]/route.ts # Uses db
```

### Important (Should Update)

```
apps/web/components/landing/Problem.tsx       # Turso reference
apps/web/components/landing/Solution.tsx      # Turso reference
apps/web/components/landing/TechStack.tsx     # Turso reference
apps/web/components/landing/AIThinkingBox.tsx # Turso reference
apps/web/app/privacy/page.tsx                 # Turso reference
```

### Verify (May Need Updates)

```
apps/web/lib/use-stream-progress.ts           # Job states
apps/web/components/dashboard/SessionCard.tsx # Status checks
apps/web/app/rectify/[id]/page.tsx            # Status checks
```

---

## 7. Summary

### What's Working ✅

- Ephemeris naming cleanup (Swiss → Skyfield)
- Backend API architecture (Express + Skyfield)
- Worker architecture (polling + graceful drain)
- Session ownership model
- Proxy layer (Clerk auth forwarding)
- SSE/Polling progress tracking

### What Needs Attention ⚠️

- **Database migration** (Turso → Neon) - CRITICAL
- Environment variable updates
- Frontend server routes database compatibility
- UI text updates (Turso references)
- Job status state handling

### Recommended Action Plan

1. **Week 1:** Complete database migration in `packages/db`
2. **Week 2:** Update frontend server routes and test
3. **Week 3:** UI text cleanup and integration testing
4. **Week 4:** Staging deployment and E2E verification
5. **Week 5:** Production deployment with monitoring

---

**Last Updated:** 13 March 2026  
**Owner:** Engineering Team  
**Next Review:** Before staging deployment
