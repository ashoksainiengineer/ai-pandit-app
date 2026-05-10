/**
 * 🔱 ADMIN INTEGRATION TESTS
 * Integration tests for admin dashboard routes.
 * Tests admin-only access enforcement (403 for non-admin) and metrics endpoint.
 * Mocks DB queries and auth middleware to control admin vs non-admin behavior.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';

// ── Configurable mock values ────────────────────────────────

let mockUserRole = 'admin';
let mockIsActive = true;

function setUserAsAdmin() {
  mockUserRole = 'admin';
  mockIsActive = true;
}

function setUserAsNonAdmin() {
  mockUserRole = 'user';
  mockIsActive = true;
}

function setUserInactive() {
  mockUserRole = 'admin';
  mockIsActive = false;
}

// ── Mocks ───────────────────────────────────────────────────

vi.mock('@ai-pandit/db', () => {
  // Generic query builder that returns a configurable value
  const createQueryBuilder = () => {
    const qb: any = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      groupBy: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      offset: vi.fn().mockReturnThis(),
      leftJoin: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      values: vi.fn().mockReturnThis(),
      returning: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
    };
    // Default: resolve with empty array or count result
    const defaultResult = [{ count: 5 }];
    qb.then = function (resolve: any) {
      resolve(defaultResult);
    };
    return qb;
  };

  return {
    db: Object.assign(createQueryBuilder(), {
      query: {
        users: {
          findFirst: vi.fn(async () => ({
            externalId: 'test_clerk_id',
            isActive: mockIsActive,
            role: mockUserRole,
          })),
        },
        sessions: {
          findFirst: vi.fn(async () => null),
        },
      },
    }),
    executeWithRetry: vi.fn(async (fn: () => Promise<unknown>) => fn()),
  };
});

vi.mock('@ai-pandit/db/jobs', () => ({
  getLatestArtifactForJobByKind: vi.fn(async () => null),
  listDeadLetterArtifacts: vi.fn(async () => []),
}));

vi.mock('@ai-pandit/db/schema', () => ({
  sessions: {
    id: 'id', externalId: 'externalId', userId: 'userId', fullName: 'fullName',
    dateOfBirth: 'dateOfBirth', tentativeTime: 'tentativeTime',
    birthPlace: 'birthPlace', status: 'status', createdAt: 'createdAt',
    updatedAt: 'updatedAt', completedAt: 'completedAt',
    startedProcessingAt: 'startedProcessingAt',
    accuracy: 'accuracy', confidence: 'confidence', rectifiedTime: 'rectifiedTime',
  },
  users: {
    id: 'id', externalId: 'externalId', email: 'email', fullName: 'fullName',
    isActive: 'isActive', role: 'role', lastLoginAt: 'lastLoginAt',
  },
  jobs: {
    id: 'id', sessionId: 'sessionId', status: 'status', retryCount: 'retryCount',
    retryReasonCode: 'retryReasonCode', nextRetryAt: 'nextRetryAt',
    errorCode: 'errorCode', errorMessage: 'errorMessage',
    attempt: 'attempt', maxAttempts: 'maxAttempts',
    checkpointJson: 'checkpointJson', cursorJson: 'cursorJson',
    finishedAt: 'finishedAt', updatedAt: 'updatedAt',
  },
}));

vi.mock('drizzle-orm', () => ({
  eq: vi.fn((...args: any[]) => args),
  and: vi.fn((...args: any[]) => args),
  gte: vi.fn((...args: any[]) => args),
  desc: vi.fn((...args: any[]) => args),
  sql: vi.fn((...args: any[]) => args),
  count: vi.fn(() => ({ count: 'count' })),
}));

vi.mock('../../middleware/auth.js', () => ({
  authMiddleware: (req: any, _res: any, next: any) => {
    req.externalId = `test_clerk_${mockUserRole}`;
    next();
  },
  AuthenticatedRequest: {} as any,
}));

vi.mock('../../lib/logger.js', () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

vi.mock('../../config/index.js', () => ({
  config: {
    app: { nodeEnv: 'test' },
    features: {},
    security: {},
  },
}));

// ── Test App ────────────────────────────────────────────────

import adminRouter from '../../routes/admin.js';
import { authMiddleware } from '../../middleware/auth.js';

function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/admin', authMiddleware, adminRouter);
  return app;
}

let app: express.Express;

// ── Tests ───────────────────────────────────────────────────

describe('Admin Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    app = createApp();
  });

  // ── HEAD /api/admin/db-check ──────────────────────────────

  describe('HEAD /api/admin/db-check', () => {
    it('should return 200 for uptime bot health checks', async () => {
      const res = await request(app).head('/api/admin/db-check');
      expect(res.status).toBe(200);
    });
  });

  // ── GET /api/admin/metrics ────────────────────────────────

  describe('GET /api/admin/metrics', () => {
    it('should return 200 with dashboard metrics for admin user', async () => {
      setUserAsAdmin();

      const res = await request(app).get('/api/admin/metrics');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
      // Verify the metrics response shape
      expect(res.body.data).toHaveProperty('totalReadings');
      expect(res.body.data).toHaveProperty('activeReadings');
      expect(res.body.data).toHaveProperty('completedReadings');
      expect(res.body.data).toHaveProperty('successRate');
      expect(res.body.data).toHaveProperty('averageProcessingTime');
      expect(res.body.data).toHaveProperty('totalUsers');
      expect(res.body.data).toHaveProperty('activeUsers');
      expect(res.body.data).toHaveProperty('readingsToday');
      expect(res.body.data).toHaveProperty('readingsThisWeek');
      expect(res.body.data).toHaveProperty('readingsThisMonth');
      // All values should be numbers
      Object.values(res.body.data).forEach((val) => {
        expect(typeof val).toBe('number');
      });
    });

    it('should return 403 when user is not an admin', async () => {
      setUserAsNonAdmin();

      const res = await request(app).get('/api/admin/metrics');

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatchObject({
        code: 'FORBIDDEN',
        message: 'Admin access required',
      });
    });

    it('should return 403 when user is not active', async () => {
      setUserInactive();

      const res = await request(app).get('/api/admin/metrics');

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });
  });

  // ── GET /api/admin/readings ───────────────────────────────

  describe('GET /api/admin/readings', () => {
    it('should return 200 with paginated readings for admin', async () => {
      setUserAsAdmin();

      const res = await request(app).get('/api/admin/readings?page=1&limit=10');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
      expect(res.body.meta).toBeDefined();
      expect(res.body.meta.pagination).toBeDefined();
      expect(res.body.meta.pagination.page).toBe(1);
      expect(res.body.meta.pagination.limit).toBe(10);
    });

    it('should support status filter on readings', async () => {
      setUserAsAdmin();

      const res = await request(app).get('/api/admin/readings?status=complete');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should return 403 for non-admin user', async () => {
      setUserAsNonAdmin();

      const res = await request(app).get('/api/admin/readings');

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });

  // ── GET /api/admin/analytics/timeseries ───────────────────

  describe('GET /api/admin/analytics/timeseries', () => {
    it('should return 200 with time series data', async () => {
      setUserAsAdmin();

      const res = await request(app).get('/api/admin/analytics/timeseries?days=7');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
      expect(Array.isArray(res.body.data)).toBe(true);
      // Each data point should have date and readings
      if (res.body.data.length > 0) {
        expect(res.body.data[0]).toHaveProperty('date');
        expect(res.body.data[0]).toHaveProperty('readings');
      }
    });

    it('should return 403 for non-admin user', async () => {
      setUserAsNonAdmin();

      const res = await request(app).get('/api/admin/analytics/timeseries');

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });

  // ── GET /api/admin/db-check ───────────────────────────────

  describe('GET /api/admin/db-check', () => {
    it('should return 200 with database diagnostics for admin', async () => {
      setUserAsAdmin();

      const res = await request(app).get('/api/admin/db-check');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.diagnostics).toBeDefined();
      expect(res.body.diagnostics.database).toBe('Neon Postgres');
      expect(res.body.diagnostics.connected).toBe(true);
      expect(typeof res.body.diagnostics.latencyMs).toBe('number');
      expect(res.body.diagnostics.stats).toBeDefined();
    });

    it('should return 403 for non-admin user', async () => {
      setUserAsNonAdmin();

      const res = await request(app).get('/api/admin/db-check');

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });

  // ── GET /api/admin/readings/:id ───────────────────────────

  describe('GET /api/admin/readings/:id', () => {
    it('should return a response for valid reading lookup', async () => {
      setUserAsAdmin();

      const res = await request(app).get('/api/admin/readings/some-id');

      // Route always gets some mock data, so it returns 200
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
    });

    it('should return 403 for non-admin user', async () => {
      setUserAsNonAdmin();

      const res = await request(app).get('/api/admin/readings/some-id');

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });
});
