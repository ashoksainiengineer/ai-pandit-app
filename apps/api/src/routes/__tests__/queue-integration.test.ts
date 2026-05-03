/**
 * 🔱 QUEUE INTEGRATION TESTS
 * Integration tests for queue status polling and requeue endpoints.
 * Exercises actual route logic with mocked external dependencies.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';

// ── Hoisted mock factories ──────────────────────────────────

const {
  mockSelectFromFn,
  mockSelectWhereFn,
  mockSelectLimitFn,
  mockSetWhereFn,
  mockResolveOwnershipContextFn,
  mockIsOwnedByContextFn,
  mockGetQueueStatusFn,
  mockCancelSessionFn,
  mockFlushSessionTrashFn,
  mockAddToQueueFn,
  mockStartQueueProcessorFn,
  mockCreateJobFn,
  mockGetIdempotencyKeyFn,
} = vi.hoisted(() => ({
  mockSelectFromFn: vi.fn(),
  mockSelectWhereFn: vi.fn(),
  mockSelectLimitFn: vi.fn(),
  mockSetWhereFn: vi.fn(),
  mockResolveOwnershipContextFn: vi.fn(),
  mockIsOwnedByContextFn: vi.fn(),
  mockGetQueueStatusFn: vi.fn(),
  mockCancelSessionFn: vi.fn(),
  mockFlushSessionTrashFn: vi.fn(),
  mockAddToQueueFn: vi.fn(),
  mockStartQueueProcessorFn: vi.fn(),
  mockCreateJobFn: vi.fn(),
  mockGetIdempotencyKeyFn: vi.fn(),
}));

// ── Mocks ───────────────────────────────────────────────────

vi.mock('@ai-pandit/db', () => ({
  db: {
    select: () => ({ from: mockSelectFromFn }),
    update: () => ({ set: vi.fn().mockReturnValue({ where: mockSetWhereFn }) }),
    delete: () => ({ where: vi.fn() }),
    query: {
      sessions: {
        findFirst: vi.fn(),
      },
    },
  },
  executeWithRetry: vi.fn(async (fn: () => Promise<unknown>) => fn()),
}));

vi.mock('@ai-pandit/db/schema', () => ({
  sessions: {
    id: 'id', clerkId: 'clerkId', userId: 'userId', status: 'status',
    errorMessage: 'errorMessage', analysisResult: 'analysisResult',
    progressData: 'progressData', reasoningLogs: 'reasoningLogs',
    accuracy: 'accuracy', confidence: 'confidence', rectifiedTime: 'rectifiedTime',
    updatedAt: 'updatedAt',
  },
  users: {},
}));

vi.mock('drizzle-orm', () => ({
  eq: vi.fn((...args: unknown[]) => args),
}));

vi.mock('../../middleware/auth.js', () => ({
  authMiddleware: (req: any, _res: any, next: any) => {
    req.clerkId = req.headers['x-test-clerk-id'] || 'test_clerk_id';
    next();
  },
  AuthenticatedRequest: {} as any,
}));

vi.mock('../../lib/logger.js', () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

vi.mock('../../lib/queue-manager.js', () => ({
  addToQueue: mockAddToQueueFn,
  getQueueStatus: mockGetQueueStatusFn,
  startQueueProcessor: mockStartQueueProcessorFn,
  cancelSession: mockCancelSessionFn,
  flushSessionTrash: mockFlushSessionTrashFn,
}));

vi.mock('../../lib/session-ownership.js', () => ({
  resolveSessionOwnershipContext: mockResolveOwnershipContextFn,
  isSessionOwnedByContext: mockIsOwnedByContextFn,
}));

vi.mock('../../lib/jobs/job-service.js', () => ({
  createQueuedBirthRectificationJob: mockCreateJobFn,
  getJobIdempotencyKey: mockGetIdempotencyKeyFn,
}));

vi.mock('../../errors/index.js', () => ({
  AppError: class extends Error {
    code: string;
    constructor(code: string, message: string) {
      super(message);
      this.code = code;
    }
  },
  ErrorCodes: { VALIDATION_ERROR: 'VALIDATION_ERROR', QUEUE_FULL: 'QUEUE_FULL' },
}));

// ── Test App ────────────────────────────────────────────────

import queueRouter from '../../routes/queue.js';

function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/queue', queueRouter);
  return app;
}

// ── Helpers ─────────────────────────────────────────────────

function setupDefaultMocks() {
  // Select chain: db.select().from().where().limit()
  mockSelectFromFn.mockReturnValue({ where: mockSelectWhereFn });
  mockSelectWhereFn.mockReturnValue({ limit: mockSelectLimitFn });

  // Ownership
  mockResolveOwnershipContextFn.mockResolvedValue({
    clerkId: 'test_clerk_id',
    internalUserId: 'test_user_id',
  });
  mockIsOwnedByContextFn.mockImplementation(
    (session: { clerkId?: string; userId?: string } | null, ctx: { clerkId: string; internalUserId: string | null }) => {
      if (!session) return false;
      if (session.clerkId === ctx.clerkId) return true;
      if (ctx.internalUserId && session.userId === ctx.internalUserId) return true;
      return false;
    }
  );

  // Queue status default
  mockGetQueueStatusFn.mockResolvedValue({
    status: 'queued',
    position: 3,
    estimatedWaitSeconds: 180,
    totalInQueue: 5,
  });

  // Requeue defaults
  mockFlushSessionTrashFn.mockResolvedValue(undefined);
  mockAddToQueueFn.mockResolvedValue({
    success: true,
    sessionId: 'test-session',
    position: 1,
    estimatedWaitSeconds: 60,
  });
  mockStartQueueProcessorFn.mockReturnValue(undefined);
  mockSetWhereFn.mockResolvedValue(undefined);
}

// ── Tests ───────────────────────────────────────────────────

describe('Queue Integration', () => {
  let app: express.Express;

  beforeEach(() => {
    vi.clearAllMocks();
    setupDefaultMocks();
    app = createApp();
  });

  // ── GET /api/queue (status poll) ─────────────────────────

  describe('GET /api/queue (status poll)', () => {
    it('should return 200 with queue status for a valid session', async () => {
      mockSelectLimitFn.mockResolvedValue([
        { id: 'session-001', clerkId: 'test_clerk_id', userId: 'test_user_id', status: 'queued' },
      ]);

      const res = await request(app).get('/api/queue?sessionId=session-001');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toMatchObject({
        status: 'queued',
        position: 3,
        estimatedWaitSeconds: 180,
        totalInQueue: 5,
      });
    });

    it('should return 400 when sessionId query param is missing', async () => {
      const res = await request(app).get('/api/queue');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('sessionId is required');
    });

    it('should return 404 when session is not found', async () => {
      mockSelectLimitFn.mockResolvedValue([]);

      const res = await request(app).get('/api/queue?sessionId=nonexistent');

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Session not found');
    });

    it('should return 403 when session does not belong to user', async () => {
      mockSelectLimitFn.mockResolvedValue([
        { id: 'session-other', clerkId: 'other_clerk_id', userId: 'other_user_id' },
      ]);

      const res = await request(app).get('/api/queue?sessionId=session-other');

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Unauthorized');
    });

    it('should return complete status with results for finished sessions', async () => {
      mockSelectLimitFn.mockResolvedValue([
        {
          id: 'session-done',
          clerkId: 'test_clerk_id',
          userId: 'test_user_id',
          status: 'complete',
          analysisResult: JSON.stringify({ rectifiedTime: '12:34:56', accuracy: 95 }),
          reasoningLogs: JSON.stringify([{ step: 'Dasha', score: 88 }]),
          rectifiedTime: '12:34:56',
          accuracy: 95,
          confidence: 'HIGH',
        },
      ]);
      mockGetQueueStatusFn.mockResolvedValue({ status: 'complete' });

      const res = await request(app).get('/api/queue?sessionId=session-done');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('complete');
      expect(res.body.data.rectifiedTime).toBe('12:34:56');
      expect(res.body.data.analysisResult).toEqual({ rectifiedTime: '12:34:56', accuracy: 95 });
    });

    it('should return failed status with error message', async () => {
      mockSelectLimitFn.mockResolvedValue([
        {
          id: 'session-failed',
          clerkId: 'test_clerk_id',
          userId: 'test_user_id',
          status: 'failed',
          errorMessage: 'AI model timeout',
        },
      ]);
      mockGetQueueStatusFn.mockResolvedValue({ status: 'failed' });

      const res = await request(app).get('/api/queue?sessionId=session-failed');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('failed');
      expect(res.body.data.error).toBe('AI model timeout');
    });
  });

  // ── POST /api/queue/requeue ───────────────────────────────

  describe('POST /api/queue/requeue', () => {
    it('should successfully requeue a failed session and return 200', async () => {
      // First call: verify session ownership
      mockSelectLimitFn
        .mockResolvedValueOnce([
          { id: 'session-rq1', clerkId: 'test_clerk_id', userId: 'test_user_id', status: 'failed', errorMessage: 'timeout' },
        ])
        // Second call: verify status was reset
        .mockResolvedValueOnce([
          { status: 'pending', errorMessage: null },
        ]);

      const res = await request(app)
        .post('/api/queue/requeue')
        .send({ sessionId: 'session-rq1' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toMatchObject({
        sessionId: 'session-rq1',
        position: 1,
        estimatedWaitSeconds: 60,
      });
      // Verify that trash was flushed and processor started
      expect(mockFlushSessionTrashFn).toHaveBeenCalledWith('session-rq1');
      expect(mockStartQueueProcessorFn).toHaveBeenCalled();
    });

    it('should return 400 when sessionId is missing', async () => {
      const res = await request(app)
        .post('/api/queue/requeue')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('sessionId is required');
    });

    it('should return 404 when session does not exist', async () => {
      mockSelectLimitFn.mockResolvedValue([]);

      const res = await request(app)
        .post('/api/queue/requeue')
        .send({ sessionId: 'nonexistent' });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Session not found');
    });

    it('should return 403 when session belongs to another user', async () => {
      mockSelectLimitFn.mockResolvedValue([
        { id: 'session-other', clerkId: 'other_clerk_id', userId: 'other_user_id' },
      ]);

      const res = await request(app)
        .post('/api/queue/requeue')
        .send({ sessionId: 'session-other' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Unauthorized');
    });

    it('should return 503 when queue add fails', async () => {
      mockSelectLimitFn
        .mockResolvedValueOnce([
          { id: 'session-rq2', clerkId: 'test_clerk_id', userId: 'test_user_id', status: 'failed', errorMessage: 'oom' },
        ])
        .mockResolvedValueOnce([
          { status: 'pending', errorMessage: null },
        ]);
      mockAddToQueueFn.mockResolvedValue({
        success: false,
        error: 'Queue is at capacity',
      });

      const res = await request(app)
        .post('/api/queue/requeue')
        .send({ sessionId: 'session-rq2' });

      expect(res.status).toBe(503);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Queue is at capacity');
    });
  });

  // ── POST /api/queue/requeue (legacy path param bridge) ───

  describe('POST /api/queue/:sessionId/requeue (legacy)', () => {
    it('should requeue via legacy path parameter bridge', async () => {
      mockSelectLimitFn
        .mockResolvedValueOnce([
          { id: 'session-legacy', clerkId: 'test_clerk_id', userId: 'test_user_id', status: 'failed', errorMessage: 'crash' },
        ])
        .mockResolvedValueOnce([
          { status: 'pending', errorMessage: null },
        ]);

      const res = await request(app)
        .post('/api/queue/session-legacy/requeue')
        .send({});

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.sessionId).toBe('session-legacy');
    });
  });
});
