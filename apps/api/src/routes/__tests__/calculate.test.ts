/**
 * 🔱 CALCULATE ROUTE TESTS
 * Real HTTP assertion tests for BTR calculation flow:
 *   POST /api/calculate     — submit BTR
 *   GET  /api/jobs/:jobId   — check status
 *   POST /api/jobs/:jobId/cancel — cancel
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';

// ── Mock values ─────────────────────────────────────────────

const defaultJobResult = {
  job: {
    id: 'job-001',
    sessionId: 'session-001',
    status: 'queued',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  idempotentReplay: false,
  queue: { position: 1, estimatedWaitSeconds: 30 },
};

const defaultJobDetail = {
  id: 'job-001',
  sessionId: 'session-001',
  status: 'processing',
  stage: 'stage2_dasha',
  retryCount: 0,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const defaultCancelResult = {
  cancelled: true,
  jobId: 'job-001',
  status: 'cancelled',
};

// ── Mock Setup ──────────────────────────────────────────────

vi.mock('@ai-pandit/db', () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    query: {
      sessions: { findFirst: vi.fn() },
      users: { findFirst: vi.fn() },
    },
  },
  executeWithRetry: vi.fn(async (fn: () => Promise<unknown>) => fn()),
}));

vi.mock('@ai-pandit/db/schema', () => ({
  sessions: {
    id: 'id', clerkId: 'clerkId', userId: 'userId', status: 'status',
    createdAt: 'createdAt',
  },
  users: { id: 'id', clerkId: 'clerkId' },
  jobs: {
    id: 'id', status: 'status', sessionId: 'sessionId', retryCount: 'retryCount',
  },
}));

vi.mock('@ai-pandit/db/jobs', () => ({
  listJobEvents: vi.fn(async () => []),
  listJobEventsSince: vi.fn(async () => []),
  getLatestArtifactForJobByKind: vi.fn(async () => null),
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

vi.mock('../../lib/logger.js', () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

vi.mock('../../lib/jobs/job-service.js', () => ({
  createQueuedBirthRectificationJob: vi.fn(),
  getJobDetailById: vi.fn(),
  cancelJobById: vi.fn(),
  getJobIdempotencyKey: vi.fn(() => 'test-idempotency-key'),
}));

vi.mock('../../config/index.js', () => ({
  config: {
    app: {
      nodeEnv: 'test',
      isDevelopment: true,
      isProduction: false,
      allowedOrigins: '*',
      frontendUrl: 'http://localhost:3000',
    },
    server: { port: 7860, requestTimeoutMs: 30000 },
    performance: { maxConcurrentSessions: 10, rssThresholdGB: 4, heapThresholdGB: 2 },
    queue: {
      maxActiveJobsPerUser: 5,
      maxActiveJobsByTier: {},
      loadShedQueueDepth: 100,
      executionMode: 'auto',
      architecture: 'bullmq',
      recoveryAlertThreshold: 5,
      syncPollIntervalMs: 5000,
    },
    ai: { model: 'test-model' },
    ephemeris: { provider: 'skyfield' },
    security: {
      clerkSecretKey: 'sk_test_123',
      encryptionSecret: 'test-key-32-chars-long-here!!',
    },
    features: { useAsyncJobPipeline: true },
    observability: {},
  },
}));

vi.mock('../../errors/index.js', () => ({
  UnauthorizedError: class UnauthorizedError extends Error {
    statusCode = 401;
    code = 'UNAUTHORIZED';
    constructor() { super('Unauthorized'); }
  },
  ForbiddenError: class ForbiddenError extends Error {
    statusCode = 403;
    code = 'FORBIDDEN';
    constructor(msg?: string) { super(msg || 'Forbidden'); }
  },
  getErrorStatusCode: vi.fn((error: any) => error?.statusCode ?? 500),
  getErrorResponse: vi.fn((error: any) => ({
    error: {
      code: error?.code ?? 'INTERNAL_ERROR',
      message: error?.message ?? 'An error occurred',
    },
  })),
}));

// ── Test App ────────────────────────────────────────────────

import calculateRouter from '../../routes/calculate.js';
import jobsRouter from '../../routes/jobs.js';

import { authMiddleware } from '../../middleware/auth.js';

function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/calculate', authMiddleware, calculateRouter);
  app.use('/api/jobs', jobsRouter);
  return app;
}

// ── Helpers ─────────────────────────────────────────────────

const serviceMod = await import('../../lib/jobs/job-service.js');
const mockCreateJob = vi.mocked(serviceMod.createQueuedBirthRectificationJob);
const mockGetJobDetail = vi.mocked(serviceMod.getJobDetailById);
const mockCancelJob = vi.mocked(serviceMod.cancelJobById);

function setCreateResult(result: any) {
  mockCreateJob.mockResolvedValue(result);
}

function setJobDetail(detail: any) {
  mockGetJobDetail.mockResolvedValue(detail);
}

function setCancelResult(result: any) {
  mockCancelJob.mockResolvedValue(result);
}

// ── Tests ───────────────────────────────────────────────────

describe('Calculate Routes', () => {
  let app: express.Application;

  beforeEach(() => {
    vi.clearAllMocks();
    app = createApp();
    setCreateResult(defaultJobResult);
    setJobDetail(defaultJobDetail);
    setCancelResult(defaultCancelResult);
  });

  // ── POST /calculate ───────────────────────────────────────

  describe('POST /calculate/btr', () => {
    it('should initiate birth time rectification', async () => {
      const res = await request(app)
        .post('/api/calculate')
        .send({
          sessionId: 'session-001',
          dateOfBirth: '1990-01-01',
          tentativeTime: '12:00',
          latitude: 19.076,
          longitude: 72.877,
          timezone: 5.5,
          gender: 'male',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('sessionId', 'session-001');
      expect(res.body.data).toHaveProperty('jobId', 'job-001');
      expect(res.body.data.status).toBe('queued');
    });

    it('should validate birth data before calculation', async () => {
      mockCreateJob.mockRejectedValue(
        Object.assign(new Error('Invalid birth data'), {
          statusCode: 400, code: 'VALIDATION_ERROR',
        })
      );

      const res = await request(app)
        .post('/api/calculate')
        .send({ invalid: 'data' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBeDefined();
    });

    it('should require minimum life events', async () => {
      mockCreateJob.mockRejectedValue(
        Object.assign(new Error('Insufficient life events for accurate BTR'), {
          statusCode: 400, code: 'VALIDATION_ERROR',
        })
      );

      const res = await request(app)
        .post('/api/calculate')
        .send({
          sessionId: 'session-001',
          dateOfBirth: '1990-01-01',
          tentativeTime: '12:00',
          latitude: 19.076,
          longitude: 72.877,
          timezone: 5.5,
          lifeEvents: [],
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should handle ephemeris service failures', async () => {
      mockCreateJob.mockRejectedValue(
        Object.assign(new Error('Ephemeris service unavailable'), {
          statusCode: 503, code: 'SERVICE_UNAVAILABLE',
        })
      );

      const res = await request(app)
        .post('/api/calculate')
        .send({
          sessionId: 'session-002',
          dateOfBirth: '1990-01-01',
          tentativeTime: '12:00',
          latitude: 19.076,
          longitude: 72.877,
          timezone: 5.5,
          gender: 'male',
        });

      expect(res.status).toBe(503);
      expect(res.body.success).toBe(false);
    });

    it('should return job ID for tracking', async () => {
      setCreateResult({
        ...defaultJobResult,
        job: { ...defaultJobResult.job, id: 'trackable-job-42' },
      });

      const res = await request(app)
        .post('/api/calculate')
        .send({
          sessionId: 'session-003',
          dateOfBirth: '1990-01-01',
          tentativeTime: '12:00',
          latitude: 19.076,
          longitude: 72.877,
          timezone: 5.5,
          gender: 'male',
        });

      expect(res.body.data.jobId).toBe('trackable-job-42');
      expect(res.body.data).toHaveProperty('position', 1);
      expect(res.body.data).toHaveProperty('estimatedWaitSeconds', 30);
    });
  });

  // ── GET /jobs/:jobId (status check) ───────────────────────

  describe('GET /calculate/status/:jobId', () => {
    it('should return calculation progress', async () => {
      setJobDetail({
        ...defaultJobDetail,
        status: 'processing',
        stage: 'stage2_dasha',
      });

      const res = await request(app).get('/api/jobs/job-001');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id', 'job-001');
      expect(res.body.data).toHaveProperty('status', 'processing');
    });

    it('should handle completed calculations', async () => {
      setJobDetail({
        ...defaultJobDetail,
        status: 'completed',
        result: { rectifiedTime: '12:05:30', accuracy: 95 },
      });

      const res = await request(app).get('/api/jobs/job-complete');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('status', 'completed');
    });

    it('should handle failed calculations', async () => {
      setJobDetail({
        ...defaultJobDetail,
        status: 'failed',
        errorMessage: 'Ephemeris calculation error',
      });

      const res = await request(app).get('/api/jobs/job-failed');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('status', 'failed');
    });
  });

  // ── POST /jobs/:jobId/cancel ──────────────────────────────

  describe('POST /calculate/cancel/:jobId', () => {
    it('should cancel running calculation', async () => {
      setCancelResult({
        cancelled: true,
        jobId: 'job-001',
        status: 'cancelled',
      });

      const res = await request(app)
        .post('/api/jobs/job-001/cancel')
        .send({});

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('cancelled', true);
    });

    it('should not allow canceling completed jobs', async () => {
      mockCancelJob.mockRejectedValue(
        Object.assign(new Error('Cannot cancel completed job'), {
          statusCode: 400, code: 'INVALID_STATE',
        })
      );

      const res = await request(app)
        .post('/api/jobs/job-completed/cancel')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });
});
