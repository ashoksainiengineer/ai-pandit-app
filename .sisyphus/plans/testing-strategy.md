# 🔱 AI-Pandit — Complete Testing Strategy

**Date**: 2026-05-02
**Author**: Sisyphus (First Principles + Industry Research)
**Status**: IN PROGRESS

---

## 📊 Current State

| Package | Test Files | Test Script | Test Health (Desloppify) | Status |
|---------|-----------|-------------|--------------------------|--------|
| `apps/api` | 104 | ✅ | 55.2% | 🟡 Mock-heavy, needs integration tests |
| `apps/web` | 51 | ✅ | 100% (mechanical) | 🟡 Component tests OK, missing integration |
| `apps/worker` | 1 | ❌ | Not scored | 🔴 No npm test script |
| `packages/db` | 6 | ✅ | Not scored | 🔴 Schema tests are existence-only |
| `packages/shared` | 4 | ✅ | Not scored | 🟢 Good contract tests |
| `packages/worker-runtime` | 0 | ❌ | Not scored | 🔴 Completely untested |
| `e2e` | 12 | ✅ | Not scored | 🟡 Flaky, uses full `npm run dev` |
| `services/ephemeris` | 1 | ❌ | Not scored | 🔴 Single test file, no CI step |

**Key Gaps**:
1. 3 integration config files referenced in package.json don't exist
2. 233+ `vi.mock()` in 55 API files — tests implementation, not behavior
3. No test database infrastructure (Docker, seed data, factories)
4. No Clerk auth test setup for E2E
5. Web tests allowed to fail in CI (`continue-on-error: true`)

---

## 🏗️ First Principles Architecture

```
                    ┌──────────────────────────────────────────┐
                    │           E2E (Playwright)               │
                    │   Full production stack, real browser     │
                    │   Auth: Clerk setup → storageState reuse  │
                    │   Fail threshold: 100%                    │
                    ├──────────────────────────────────────────┤
                    │      Integration (Vitest + Supertest)     │
                    │   Real DB (Docker Postgres), real routes  │
                    │   Mocked externals: Clerk, Skyfield, AI   │
                    │   Fail threshold: 100%                    │
                    ├──────────────────────────────────────────┤
                    │         Unit (Vitest)                     │
                    │   Pure functions, no I/O, no mocks        │
                    │   Factory pattern + Zod validation        │
                    │   Fail threshold: 100%                    │
                    └──────────────────────────────────────────┘

        ┌──────────────┼──────────────┐
        │              │              │
   Contract Tests  Performance    Security Tests
   (Zod schemas)   (k6 load)      (ZAP, audit-ci)
```

**Testing Pyramid Ratio Target**: 70% Unit / 20% Integration / 10% E2E

---

## 📐 File Structure

```
ai-pandit-app/
├── vitest.workspace.ts                 # Monorepo workspace config
├── docker-compose.test.yml             # Test Postgres + Redis
│
├── apps/
│   ├── api/
│   │   ├── vitest.config.ts
│   │   ├── vitest.integration.config.ts # ← CREATE (missing)
│   │   ├── vitest.setup.ts             # DB init, tables, seeds
│   │   ├── src/
│   │   │   ├── __tests__/
│   │   │   │   ├── helpers/
│   │   │   │   │   ├── test-app.ts     # Express test app factory
│   │   │   │   │   └── test-context.ts # Auth context factory
│   │   │   │   └── factories/
│   │   │   │       ├── user.factory.ts
│   │   │   │       ├── session.factory.ts
│   │   │   │       └── birth-input.factory.ts
│   │   │   ├── lib/
│   │   │   │   └── __tests__/          # Unit tests (co-located)
│   │   │   │       ├── encryption.test.ts
│   │   │   │       ├── queue-manager.test.ts
│   │   │   │       └── ...
│   │   │   └── routes/
│   │   │       └── __tests__/          # Route integration tests
│   │   │           ├── sessions.test.ts
│   │   │           ├── health.test.ts
│   │   │           ├── calculate.test.ts
│   │   │           └── stream.test.ts
│   │   └── scripts/
│   │       └── setup-test-db.sh        # Test DB initialization
│   │
│   ├── web/
│   │   ├── vitest.config.ts
│   │   ├── vitest.setup.ts             # jest-dom, Clerk mock, env vars
│   │   └── src/
│   │       ├── components/
│   │       │   └── __tests__/          # Component tests (co-located)
│   │       ├── lib/
│   │       │   └── **/__tests__/       # Hook + util tests
│   │       └── app/
│   │           └── (routes)/
│   │               └── __tests__/      # Page-level tests
│   │
│   └── worker/
│       ├── vitest.config.ts
│       └── src/
│           ├── worker.test.ts
│           └── __tests__/
│
├── packages/
│   ├── db/
│   │   ├── vitest.config.ts
│   │   ├── vitest.integration.config.ts # ← CREATE (missing)
│   │   ├── vitest.setup.ts             # Test DB connection + migrations
│   │   ├── drizzle.config.test.ts
│   │   ├── src/
│   │   │   ├── __tests__/
│   │   │   │   ├── factories/
│   │   │   │   │   ├── user.factory.ts
│   │   │   │   │   └── session.factory.ts
│   │   │   │   ├── schema.test.ts      # Constraint + index tests
│   │   │   │   ├── jobs.test.ts        # Job CRUD tests
│   │   │   │   └── helpers/
│   │   │   │       └── setup-test-db.sql
│   │   │   └── schema/
│   │   └── test/
│   │       └── migrations/             # Test-specific migrations
│   │
│   ├── shared/
│   │   ├── vitest.config.ts
│   │   └── src/
│   │       └── __tests__/
│   │           ├── types.test.ts       # Contract tests
│   │           ├── schemas.test.ts
│   │           └── btr-types.test.ts
│   │
│   └── worker-runtime/
│       ├── vitest.config.ts            # ← CREATE (missing)
│       └── src/
│           └── __tests__/
│
├── services/
│   └── ephemeris/
│       ├── tests/
│       │   ├── conftest.py             # ← CREATE (missing)
│       │   ├── fixtures/
│       │   │   └── ephemeris_fixtures.py
│       │   ├── test_house_systems.py
│       │   ├── test_planet_positions.py ← CREATE (new)
│       │   └── test_btr_engine.py      ← CREATE (new)
│       └── test_data/
│           └── de440s.bsp              # Mini ephemeris for tests
│
├── e2e/
│   ├── fixtures/
│   │   ├── birth-chart.page.ts
│   │   └── dashboard.page.ts
│   ├── auth.setup.ts                   # Clerk auth setup
│   ├── smoke.spec.ts
│   ├── core-flow.spec.ts
│   ├── birth-chart.spec.ts             ← CREATE (new)
│   └── visual/
│       └── birth-chart-visual.spec.ts  ← CREATE (new)
│
├── load-tests/
│   ├── btr-api-load.js                 ← CREATE (new)
│   └── smoke-test.js
│
├── playwright.config.ts
├── docker-compose.test.yml             ← CREATE (new)
└── .env.test                           ← CREATE (new)
```

---

## 🔧 Component-Specific Patterns

### 1. Drizzle ORM Testing

```typescript
// vitest.setup.ts — Transaction rollback pattern
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import * as schema from '../src/schema';

let pool: Pool;
export let db: ReturnType<typeof drizzle>;

beforeAll(async () => {
  pool = new Pool({ connectionString: process.env.TEST_DATABASE_URL });
  db = drizzle(pool, { schema });
  await migrate(db, { migrationsFolder: './drizzle' });
});

beforeEach(async () => {
  await pool.query('BEGIN');
});

afterEach(async () => {
  await pool.query('ROLLBACK'); // Transaction rollback = clean slate
});

afterAll(async () => {
  await pool.end();
});
```

```typescript
// Factory pattern
// packages/db/src/__tests__/factories/user.factory.ts
export async function createUser(overrides: Partial<NewUser> = {}) {
  const [user] = await db.insert(schema.users).values({
    id: crypto.randomUUID(),
    clerkId: `test-clerk-${crypto.randomUUID().slice(0, 8)}`,
    email: `test-${crypto.randomUUID().slice(0, 8)}@example.com`,
    role: 'user',
    ...overrides,
  }).returning();
  return user;
}
```

### 2. Express API Testing

```typescript
// helpers/test-app.ts
import express from 'express';
import { mockAuthMiddleware } from './mock-auth';
import { mockRateLimit } from './mock-rate-limit';

export function createTestApp(routes: any, options: { clerkId?: string } = {}) {
  const app = express();
  app.use(express.json());
  
  // Override auth middleware for tests
  app.use((req, _res, next) => {
    req.clerkId = options.clerkId || 'test_clerk_id';
    req.userId = 'test_user_id';
    next();
  });
  
  app.use('/api', routes);
  return app;
}
```

### 3. Next.js Component Testing

```typescript
// Global mocks
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn(), back: vi.fn() }),
  usePathname: () => '/test',
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('@clerk/nextjs', () => ({
  useUser: () => ({ isSignedIn: true, user: { id: 'user-123', fullName: 'Test User' } }),
  useAuth: () => ({ getToken: vi.fn().mockResolvedValue('test-token') }),
  SignedIn: ({ children }: any) => children,
  SignedOut: () => null,
}));
```

### 4. SSE/Streaming Testing

```typescript
// Test SSE endpoint
it('receives progress events in order', async () => {
  const events: any[] = [];
  const es = new EventSource(
    `http://localhost:${port}/api/stream/${sessionId}`,
    { headers: { Authorization: `Bearer ${authToken}` } }
  );

  await new Promise<void>((resolve) => {
    es.onmessage = (event) => {
      events.push(JSON.parse(event.data));
      if (events[events.length - 1].status === 'complete') {
        es.close();
        resolve();
      }
    };
  });

  expect(events).toHaveLength(4);
  expect(events[0]).toHaveProperty('status', 'initializing');
});
```

### 5. Encryption Testing

```typescript
describe('AES-256-GCM', () => {
  it('roundtrips correctly', () => { /* encrypt→decrypt→assert equal */ });
  it('produces unique IVs', () => { /* encrypt same text twice → different output */ });
  it('fails with wrong key', () => { /* decrypt with wrong key → throws */ });
  it('detects tampering', () => { /* flip bit → throws */ });
  it('handles Unicode (नमस्ते)', () => { /* roundtrip Hindi text */ });
  it('handles empty string', () => { /* roundtrip '' */ });
  it('rejects too-short ciphertext', () => { /* decrypt('') → throws */ });
});
```

### 6. Playwright E2E

```typescript
// auth.setup.ts — Run once before all tests
setup('authenticate with Clerk', async ({ page }) => {
  await page.goto('/sign-in');
  await page.fill('[name="email"]', process.env.E2E_CLERK_EMAIL!);
  await page.fill('[name="password"]', process.env.E2E_CLERK_PASSWORD!);
  await page.click('button[type="submit"]');
  await page.waitForURL('/dashboard');
  await page.context().storageState({ path: 'playwright/.auth/user.json' });
});
```

### 7. k6 Load Testing

```javascript
export const options = {
  scenarios: {
    steady: { executor: 'constant-arrival-rate', rate: 50, duration: '5m' },
    spike: { executor: 'ramping-vus', stages: [
      { duration: '1m', target: 100 },
      { duration: '3m', target: 100 },
      { duration: '1m', target: 0 },
    ]},
  },
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.01'],
  },
};
```

---

## 📋 Implementation Plan

### Phase 1: Critical Infrastructure (Day 1)
- [ ] Create `docker-compose.test.yml` with Postgres 16 + Redis
- [ ] Create `.env.test` with test database credentials
- [ ] Create missing `vitest.integration.config.ts` files (api, db, ephemeris)
- [ ] Add test script to `apps/worker/package.json`
- [ ] Create test script for `packages/worker-runtime`
- [ ] Create `vitest.workspace.ts` at root

### Phase 2: Test Utilities (Day 1-2)
- [ ] Create `apps/api/src/__tests__/helpers/test-app.ts`
- [ ] Create `apps/api/src/__tests__/helpers/test-context.ts`
- [ ] Create `apps/api/src/__tests__/helpers/mock-auth.ts`
- [ ] Create `apps/api/src/__tests__/factories/user.factory.ts`
- [ ] Create `apps/api/src/__tests__/factories/session.factory.ts`
- [ ] Create `apps/api/src/__tests__/factories/birth-input.factory.ts`
- [ ] Create `packages/db/src/__tests__/factories/user.factory.ts`
- [ ] Create `packages/db/src/__tests__/helpers/setup-test-db.sql`

### Phase 3: Test Quality Improvement (Day 2-3)
- [ ] Convert `schema.test.ts` from existence checks to constraint tests
- [ ] Convert `api.integration.test.ts` from placeholder to real endpoint tests
- [ ] Fix `MainPageIntegration.test.tsx` incomplete cancel test
- [ ] Convert `sessions.test.ts` placeholder tests to real assertions
- [ ] Convert `calculate.test.ts` placeholder tests to real assertions
- [ ] Add real assertions to `health.test.ts`

### Phase 4: Integration Test Expansion (Day 3-4)
- [ ] Create integration tests for `/api/sessions` CRUD
- [ ] Create integration tests for `/api/calculate` (BTR pipeline)
- [ ] Create integration tests for `/api/stream` (SSE endpoint)
- [ ] Create integration tests for `/api/queue` status + cancel
- [ ] Create integration tests for `/api/admin` (with test admin user)

### Phase 5: New Test Coverage (Day 4-5)
- [ ] Create `packages/worker-runtime/src/__tests__/runtime.test.ts`
- [ ] Create `services/ephemeris/tests/conftest.py`
- [ ] Create `services/ephemeris/tests/fixtures/ephemeris_fixtures.py`
- [ ] Create `services/ephemeris/tests/test_planet_positions.py`
- [ ] Create `services/ephemeris/tests/test_btr_engine.py`

### Phase 6: E2E + Performance (Day 5-6)
- [ ] Create `e2e/fixtures/birth-chart.page.ts`
- [ ] Create `e2e/fixtures/dashboard.page.ts`
- [ ] Create `e2e/auth.setup.ts` (Clerk)
- [ ] Create `e2e/birth-chart.spec.ts`
- [ ] Create `load-tests/btr-api-load.js`
- [ ] Create `load-tests/smoke-test.js`

### Phase 7: CI/CD Integration (Day 6-7)
- [ ] Add Docker services to CI workflow
- [ ] Add migration + seed step before integration tests
- [ ] Remove `continue-on-error` for web tests
- [ ] Add Python test step to CI
- [ ] Add k6 load test step (scheduled, not PR)
- [ ] Add coverage reporting with thresholds

### Phase 8: Documentation (Day 7)
- [ ] `docs/TESTING.md` — Quick start guide for developers
- [ ] `docs/TESTING_STRATEGY.md` — Full strategy document
- [ ] Update `AGENTS.md` with testing commands matrix
- [ ] Add testing section to `README.md`

---

## 🎯 Success Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Test files with real assertions | ~70% | 100% |
| Integration tests | ~10 | 30+ |
| E2E tests | 12 | 20+ |
| Python tests | 4 | 20+ |
| k6 load tests | 0 | 3 |
| Coverage (API) | Not measured | 70%+ |
| Test health (Desloppify) | 55.2% | 85%+ |
| CI test run time | N/A | <15 min |
| Worker tests in CI | ❌ | ✅ |
| Web tests in CI (fail-safe) | continue-on-error | strict |

---

*End of Testing Strategy Document*
