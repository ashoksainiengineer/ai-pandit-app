/**
 * API Routes Integration Tests
 *
 * Industry-standard integration tests for REST API endpoints.
 * Tests HTTP layer with actual Express app instance.
 */

import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import { createBirthInput, TEST_TIMEOUTS } from '../../lib/__tests__/test-utils.js';
import healthRouter from '../health.js';
import { initEphemerisProvider } from '../../lib/ephemeris.js';

// ── Hoisted mocks ──────────────────────────────────────────
const {
  mockSelectFromFn,
  mockSelectWhereFn,
  mockSelectOrderByFn,
  mockSelectLimitFn,
  mockSetWhereFn,
  mockDeleteFn,
  mockInsertFn,
  mockQuerySessionsFindFirst,
  mockQueryUsersFindFirst,
} = vi.hoisted(() => ({
  mockSelectFromFn: vi.fn(),
  mockSelectWhereFn: vi.fn(),
  mockSelectOrderByFn: vi.fn(),
  mockSelectLimitFn: vi.fn(),
  mockSetWhereFn: vi.fn(),
  mockDeleteFn: vi.fn(),
  mockInsertFn: vi.fn(),
  mockQuerySessionsFindFirst: vi.fn(),
  mockQueryUsersFindFirst: vi.fn(),
}));

const { mockCreateJob, mockGetJobIdempotencyKey } = vi.hoisted(() => ({
  mockCreateJob: vi.fn(),
  mockGetJobIdempotencyKey: vi.fn(() => 'test-idempotency-key'),
}));

// ── Shared mocks ───────────────────────────────────────────
vi.mock('@ai-pandit/db', () => ({
  db: {
    select: () => ({ from: mockSelectFromFn }),
    update: () => ({ set: vi.fn().mockReturnValue({ where: mockSetWhereFn }) }),
    delete: () => ({ where: mockDeleteFn }),
    insert: () => ({ values: mockInsertFn }),
    query: {
      sessions: { findFirst: mockQuerySessionsFindFirst },
      users: { findFirst: mockQueryUsersFindFirst },
    },
  },
  executeWithRetry: vi.fn(async (fn: () => Promise<unknown>) => fn()),
}));

vi.mock('@ai-pandit/db/schema', () => ({
  sessions: {
    id: 'id', clerkId: 'clerkId', userId: 'userId', fullName: 'fullName',
    dateOfBirth: 'dateOfBirth', tentativeTime: 'tentativeTime', birthPlace: 'birthPlace',
    latitude: 'latitude', longitude: 'longitude', timezone: 'timezone', gender: 'gender',
    status: 'status', createdAt: 'createdAt', updatedAt: 'updatedAt',
  },
  users: { id: 'id', clerkId: 'clerkId' },
}));

vi.mock('../../middleware/auth.js', () => ({
  authMiddleware: (req: any, _res: any, next: any) => {
    req.clerkId = req.headers['x-test-clerk-id'] || 'test_clerk_id';
    next();
  },
  AuthenticatedRequest: {} as any,
}));

vi.mock('../../lib/session-ownership.js', () => ({
  resolveSessionOwnershipContext: vi.fn(async (clerkId: string) => ({
    clerkId,
    internalUserId: 'test_user_id',
  })),
  isSessionOwnedByContext: vi.fn(() => true),
}));

vi.mock('../../lib/encryption/index.js', () => ({
  encryptData: vi.fn((data: string) => `encrypted:${data}`),
  parseSensitiveField: vi.fn((data: unknown) => data),
  isEncrypted: vi.fn(() => false),
}));

vi.mock('../../lib/logger.js', () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

vi.mock('../../lib/jobs/job-service.js', () => ({
  createQueuedBirthRectificationJob: mockCreateJob,
  getJobIdempotencyKey: mockGetJobIdempotencyKey,
}));

vi.mock('../../config/index.js', () => ({
  config: {
    app: { nodeEnv: 'test', isDevelopment: true, isProduction: false },
    server: { port: 7860 },
    performance: { maxConcurrentSessions: 10 },
    queue: { executionMode: 'auto', maxActiveJobsPerUser: 5 },
    ai: { model: 'test-model' },
    security: { encryptionSecret: 'test-key-32-chars-long-here!!' },
  },
}));

vi.mock('../../errors/index.js', () => ({
  CalculationError: class CalculationError extends Error { statusCode = 500; code = 'CALCULATION_ERROR'; },
  AppError: class AppError extends Error {
    statusCode = 500;
    constructor(public code: string, message: string, public details?: Record<string, unknown>) { super(message); }
  },
  UnauthorizedError: class UnauthorizedError extends Error { statusCode = 401; },
  ForbiddenError: class ForbiddenError extends Error { statusCode = 403; },
  getErrorStatusCode: vi.fn((error: any) => error?.statusCode ?? 500),
  getErrorResponse: vi.fn((error: any) => ({
    error: { code: error?.code ?? 'INTERNAL_ERROR', message: error?.message ?? 'An error occurred' },
  })),
}));

vi.mock('../../utils/response.js', () => ({
  sendSuccess: vi.fn((res: any, data: any) => {
    res.status(200).json({ success: true, data });
  }),
  sendError: vi.fn((res: any, error: any) => {
    const status = error?.statusCode ?? 500;
    res.status(status).json({ success: false, error: { message: error?.message ?? 'Error' } });
  }),
}));

// ── Late imports (after mocks) ─────────────────────────────
import calculateRouter from '../calculate.js';
import sessionsRouter from '../sessions.js';

// ── Test App ───────────────────────────────────────────────
function createTestApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/health', healthRouter);
  app.use('/api/calculate', calculateRouter);
  app.use('/api/sessions', sessionsRouter);
  return app;
}

// ── Helpers ────────────────────────────────────────────────
function setupSessionMocks() {
  mockSelectFromFn.mockReturnValue({ where: mockSelectWhereFn });
  mockSelectWhereFn.mockReturnValue({ orderBy: mockSelectOrderByFn });
  mockSelectOrderByFn.mockReturnValue({ limit: mockSelectLimitFn });
  mockSelectLimitFn.mockResolvedValue([{
    id: 'session-001', clerkId: 'test_clerk_id', userId: 'test_user_id',
    fullName: 'encrypted:Test User', dateOfBirth: 'encrypted:1990-01-01',
    tentativeTime: 'encrypted:12:00', birthPlace: 'encrypted:Mumbai',
    latitude: '19.076', longitude: '72.877', timezone: '5.5', gender: 'male',
    status: 'pending', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  }]);
  mockQuerySessionsFindFirst.mockResolvedValue({
    id: 'session-001', clerkId: 'test_clerk_id', userId: 'test_user_id',
  });
  mockQueryUsersFindFirst.mockResolvedValue({ id: 'test_user_id', clerkId: 'test_clerk_id' });
  mockDeleteFn.mockReturnValue({ returning: vi.fn().mockResolvedValue([{ id: 'session-001' }]) });
  mockInsertFn.mockResolvedValue(undefined);
  mockSetWhereFn.mockResolvedValue(undefined);
}

// ── Tests ──────────────────────────────────────────────────

describe('API Routes - Integration Tests', () => {
  let app: express.Application;

  beforeAll(async () => {
    app = createTestApp();
    await initEphemerisProvider();
  }, TEST_TIMEOUTS.INTEGRATION);

  describe('Health Endpoints', () => {
    describe('Given a GET request to /api/health/live', () => {
      it('Then should return alive status', async () => {
        const response = await request(app)
          .get('/api/health/live')
          .expect(200);

        expect(response.body).toHaveProperty('alive', true);
      }, TEST_TIMEOUTS.UNIT);
    });
  });

  describe('Response Format Standards', () => {
    describe('When API returns a success response', () => {
      it('Then should follow standard success format', async () => {
        const response = await request(app)
          .get('/api/health/live')
          .expect(200);

        // Standard response format check
        expect(response.body).toBeDefined();
        expect(typeof response.body).toBe('object');
        expect(response.status).toBe(200);
      }, TEST_TIMEOUTS.UNIT);
    });

    describe('When API returns an error response', () => {
      it('Then should follow standard error format for 404', async () => {
        const response = await request(app)
          .get('/api/nonexistent')
          .expect(404);

        expect(response.status).toBe(404);
      }, TEST_TIMEOUTS.UNIT);
    });
  });

  describe('CORS and Security Headers', () => {
    describe('When receiving API responses', () => {
      it('Then should include appropriate headers', async () => {
        const response = await request(app)
          .get('/api/health/live')
          .expect(200);

        // Check for common headers
        expect(response.headers).toBeDefined();
        expect(response.headers['content-type']).toContain('application/json');
      }, TEST_TIMEOUTS.UNIT);
    });
  });

  // ── Real API endpoint tests ──────────────────────────────

  describe('Calculate Endpoint', () => {
    beforeEach(() => {
      vi.clearAllMocks();
      mockCreateJob.mockResolvedValue({
        job: {
          id: 'job-001',
          sessionId: 'session-001',
          status: 'queued',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        idempotentReplay: false,
        queue: { position: 1, estimatedWaitSeconds: 30 },
      });
    });

    describe('POST /api/calculate', () => {
      it('should initiate birth time rectification and return job details', async () => {
        const birthInput = createBirthInput();
        const response = await request(app)
          .post('/api/calculate')
          .set('x-test-clerk-id', 'test_clerk_id')
          .send(birthInput);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('sessionId');
        expect(response.body.data).toHaveProperty('jobId', 'job-001');
        expect(response.body.data.status).toBe('queued');
      });

      it('should return 400 for invalid birth data', async () => {
        mockCreateJob.mockRejectedValue(
          Object.assign(new Error('Invalid birth data'), { statusCode: 400 })
        );

        const response = await request(app)
          .post('/api/calculate')
          .set('x-test-clerk-id', 'test_clerk_id')
          .send({ invalid: 'data' });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      });

      it('should handle missing required fields', async () => {
        mockCreateJob.mockRejectedValue(
          Object.assign(new Error('Missing required fields'), { statusCode: 400 })
        );

        const response = await request(app)
          .post('/api/calculate')
          .set('x-test-clerk-id', 'test_clerk_id')
          .send({});

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      });
    });
  });

  describe('Sessions Endpoint', () => {
    beforeEach(() => {
      vi.clearAllMocks();
      setupSessionMocks();
    });

    describe('GET /api/sessions', () => {
      it('should list user sessions with correct format', async () => {
        const response = await request(app)
          .get('/api/sessions')
          .set('x-test-clerk-id', 'test_clerk_id');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data)).toBe(true);
      });
    });

    describe('GET /api/sessions/:id', () => {
      it('should return a specific session by ID', async () => {
        mockQuerySessionsFindFirst.mockResolvedValue({
          id: 'session-001',
          clerkId: 'test_clerk_id',
          userId: 'test_user_id',
        });

        const response = await request(app)
          .get('/api/sessions/session-001')
          .set('x-test-clerk-id', 'test_clerk_id');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('id', 'session-001');
      });

      it('should return 404 for non-existent session', async () => {
        mockQuerySessionsFindFirst.mockResolvedValue(null);

        const response = await request(app)
          .get('/api/sessions/nonexistent')
          .set('x-test-clerk-id', 'test_clerk_id');

        expect(response.status).toBe(404);
        expect(response.body.success).toBe(false);
      });
    });
  });
});
