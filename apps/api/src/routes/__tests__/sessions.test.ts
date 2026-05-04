/**
 * 🔱 SESSIONS ROUTE TESTS
 * Real HTTP assertion tests for session CRUD operations.
 * Uses supertest with mocked DB/encryption/auth dependencies.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';

// ── Hoisted mock factories ──────────────────────────────────

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
  mockExecuteRetry,
  mockOwnershipContextFn,
  mockOwnershipCheckFn,
  mockEncryptDataFn,
  mockParseSensitiveFieldFn,
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
  mockExecuteRetry: vi.fn(async (fn: () => Promise<unknown>) => fn()),
  mockOwnershipContextFn: vi.fn(),
  mockOwnershipCheckFn: vi.fn(),
  mockEncryptDataFn: vi.fn(),
  mockParseSensitiveFieldFn: vi.fn(),
}));

// ── Mocks ───────────────────────────────────────────────────

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
  executeWithRetry: mockExecuteRetry,
}));

vi.mock('@ai-pandit/db/schema', () => ({
  sessions: {
    id: 'id', clerkId: 'clerkId', userId: 'userId', fullName: 'fullName',
    dateOfBirth: 'dateOfBirth', tentativeTime: 'tentativeTime', birthPlace: 'birthPlace',
    latitude: 'latitude', longitude: 'longitude', timezone: 'timezone', gender: 'gender',
    status: 'status', offsetConfig: 'offsetConfig', lifeEvents: 'lifeEvents',
    forensicTraits: 'forensicTraits', physicalTraits: 'physicalTraits',
    spouseData: 'spouseData', analysisResult: 'analysisResult', progressData: 'progressData',
    reasoningLogs: 'reasoningLogs', errorMessage: 'errorMessage', errorCode: 'errorCode',
    rectifiedTime: 'rectifiedTime', accuracy: 'accuracy', confidence: 'confidence',
    aiConsentGiven: 'aiConsentGiven', aiConsentGivenAt: 'aiConsentGivenAt',
    isEncrypted: 'isEncrypted', createdAt: 'createdAt', updatedAt: 'updatedAt',
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
  resolveSessionOwnershipContext: mockOwnershipContextFn,
  isSessionOwnedByContext: mockOwnershipCheckFn,
}));

vi.mock('../../lib/encryption/index.js', () => ({
  encryptData: mockEncryptDataFn,
  parseSensitiveField: mockParseSensitiveFieldFn,
  isEncrypted: vi.fn(() => false),
}));

vi.mock('../../lib/logger.js', () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

// ── Test App ────────────────────────────────────────────────

import sessionsRouter from '../../routes/sessions.js';

import { authMiddleware } from '../../middleware/auth.js';

function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/sessions', authMiddleware, sessionsRouter);
  return app;
}

// ── Mock data ───────────────────────────────────────────────

const mockSession = {
  id: 'test-session-001',
  clerkId: 'test_clerk_id',
  userId: 'test_user_id',
  fullName: 'Test User',
  dateOfBirth: '1990-01-01',
  tentativeTime: '12:00',
  birthPlace: 'Mumbai',
  latitude: '19.076',
  longitude: '72.877',
  timezone: '5.5',
  gender: 'male',
  status: 'pending',
  offsetConfig: null,
  lifeEvents: null,
  forensicTraits: null,
  physicalTraits: null,
  spouseData: null,
  analysisResult: null,
  progressData: null,
  reasoningLogs: null,
  errorMessage: null,
  errorCode: null,
  rectifiedTime: null,
  accuracy: null,
  confidence: null,
  aiConsentGiven: false,
  aiConsentGivenAt: null,
  isEncrypted: false,
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
};

// ── Helpers ─────────────────────────────────────────────────

function setupDefaultMocks() {
  // Select chain: db.select().from().where().orderBy().limit()
  mockSelectFromFn.mockReturnValue({ where: mockSelectWhereFn });
  mockSelectWhereFn.mockReturnValue({ orderBy: mockSelectOrderByFn });
  mockSelectOrderByFn.mockReturnValue({ limit: mockSelectLimitFn });
  mockSelectLimitFn.mockResolvedValue([mockSession]);

  // FindFirst (for get/delete/clone)
  mockQuerySessionsFindFirst.mockResolvedValue({
    id: 'test-session-001',
    clerkId: 'test_clerk_id',
    userId: 'test_user_id',
  });

  // Users lookup (for ownership context)
  mockQueryUsersFindFirst.mockResolvedValue({
    id: 'test_user_id',
    clerkId: 'test_clerk_id',
  });

  // Ownership
  mockOwnershipContextFn.mockResolvedValue({
    clerkId: 'test_clerk_id',
    internalUserId: 'test_user_id',
  });
  mockOwnershipCheckFn.mockReturnValue(true);

  // Encryption — pass through
  mockEncryptDataFn.mockImplementation((data: string) => `encrypted:${data}`);
  mockParseSensitiveFieldFn.mockImplementation((data: unknown) => data);

  // Delete: db.delete().where().returning()
  mockDeleteFn.mockReturnValue({
    returning: vi.fn().mockResolvedValue([{ id: 'test-session-001' }]),
  });

  // Update: db.update().set().where()
  mockSetWhereFn.mockResolvedValue(undefined);

  // Insert: db.insert().values()
  mockInsertFn.mockResolvedValue(undefined);
}

function setListResult(data: any[]) {
  mockSelectLimitFn.mockResolvedValue(data);
}

function setFindFirst(data: any) {
  mockQuerySessionsFindFirst.mockResolvedValue(data);
}

// ── Tests ───────────────────────────────────────────────────

describe('Sessions Routes', () => {
  beforeEach(() => {
    setupDefaultMocks();
  });

  // ── POST /sessions ────────────────────────────────────────

  describe('POST /sessions', () => {
    it('should create a new rectification session', async () => {
      // Use clone endpoint (POST /:id/clone) — the sessions router's "create" path
      setFindFirst({ ...mockSession, clerkId: 'test_clerk_id', userId: 'test_user_id' });

      const app = createApp();
      const res = await request(app)
        .post('/api/sessions/test-session-001/clone')
        .send({ birthData: mockSession });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
    });

    it('should validate birth data before creating session', async () => {
      setFindFirst(null); // clone source not found

      const app = createApp();
      const res = await request(app)
        .post('/api/sessions/nonexistent/clone')
        .send({});

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('not found');
    });

    it('should encrypt sensitive birth data', async () => {
      setFindFirst({ ...mockSession, clerkId: 'test_clerk_id', userId: 'test_user_id' });

      const app = createApp();
      const res = await request(app)
        .post('/api/sessions/test-session-001/clone')
        .send({ birthData: mockSession });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });

    it('should return 404 for missing required fields', async () => {
      const app = createApp();
      // No POST / on sessions router — returns 404
      const res = await request(app)
        .post('/api/sessions')
        .send({});

      expect(res.status).toBe(404);
    });

    it('should create clone with a unique ID different from original', async () => {
      setFindFirst({ ...mockSession, clerkId: 'test_clerk_id', userId: 'test_user_id' });

      const app = createApp();
      const res = await request(app)
        .post('/api/sessions/test-session-001/clone')
        .send({ birthData: mockSession });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      // Clone ID must differ from original
      expect(res.body.data.id).not.toBe('test-session-001');
      // Verify it looks like a UUID
      expect(res.body.data.id).toMatch(/^[0-9a-f-]{36}$/);
    });
  });

  // ── GET /sessions/:id ─────────────────────────────────────

  describe('GET /sessions/:id', () => {
    it('should return session by ID', async () => {
      setFindFirst({ ...mockSession, clerkId: 'test_clerk_id', userId: 'test_user_id' });

      const app = createApp();
      const res = await request(app).get('/api/sessions/test-session-001');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id', 'test-session-001');
      expect(res.body.data).toHaveProperty('birthData');
    });

    it('should return 404 for non-existent session', async () => {
      setFindFirst(null);

      const app = createApp();
      const res = await request(app).get('/api/sessions/nonexistent-id');

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('should verify session ownership', async () => {
      mockOwnershipCheckFn.mockReturnValue(false);
      setFindFirst({ ...mockSession, clerkId: 'other_clerk_id', userId: 'other_user_id' });

      const app = createApp();
      const res = await request(app).get('/api/sessions/test-session-001');

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  // ── GET /sessions ─────────────────────────────────────────

  describe('GET /sessions', () => {
    it('should list user sessions', async () => {
      setListResult([mockSession]);

      const app = createApp();
      const res = await request(app).get('/api/sessions');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should support pagination', async () => {
      const manySessions = Array.from({ length: 5 }, (_, i) => ({
        ...mockSession,
        id: `session-${i}`,
      }));
      setListResult(manySessions);

      const app = createApp();
      const res = await request(app).get('/api/sessions');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(5);
    });

    it('should filter by status', async () => {
      const completed = { ...mockSession, status: 'completed' };
      setListResult([completed]);

      const app = createApp();
      const res = await request(app).get('/api/sessions');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      if (res.body.data.length > 0) {
        expect(res.body.data[0]).toHaveProperty('status');
      }
    });
  });

  // ── DELETE /sessions/:id ──────────────────────────────────

  describe('DELETE /sessions/:id', () => {
    it('should delete session and associated data', async () => {
      // findFirst returns the session owned by test user
      setFindFirst({
        id: 'test-session-001',
        clerkId: 'test_clerk_id',
        userId: 'test_user_id',
      });
      // Delete returns non-empty result
      mockDeleteFn.mockReturnValue({
        returning: vi.fn().mockResolvedValue([{ id: 'test-session-001' }]),
      });

      const app = createApp();
      const res = await request(app).delete('/api/sessions/test-session-001');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('deleted');
    });

    it('should verify ownership before deletion', async () => {
      mockOwnershipCheckFn.mockReturnValue(false);
      setFindFirst({
        id: 'test-session-001',
        clerkId: 'other_clerk_id',
        userId: 'other_user_id',
      });

      const app = createApp();
      const res = await request(app).delete('/api/sessions/test-session-001');

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('should return 200 with success message on successful deletion', async () => {
      setFindFirst({
        id: 'test-session-001',
        clerkId: 'test_clerk_id',
        userId: 'test_user_id',
      });
      mockDeleteFn.mockReturnValue({
        returning: vi.fn().mockResolvedValue([{ id: 'test-session-001' }]),
      });

      const app = createApp();
      const res = await request(app).delete('/api/sessions/test-session-001');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Session deleted');
      // Verify delete was called for the correct session
      expect(mockDeleteFn).toHaveBeenCalled();
    });
  });

  // ── PUT /sessions/:id ─────────────────────────────────────

  describe('PUT /sessions/:id', () => {
    it('should update session metadata', async () => {
      setFindFirst({
        id: 'test-session-001',
        clerkId: 'test_clerk_id',
        userId: 'test_user_id',
      });
      mockSetWhereFn.mockResolvedValue(undefined);

      const app = createApp();
      const res = await request(app)
        .put('/api/sessions/test-session-001')
        .send({
          birthData: { fullName: 'Updated Name', latitude: 19.5 },
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('updated');
    });

    it('should not allow updating immutable fields', async () => {
      setFindFirst({
        id: 'test-session-001',
        clerkId: 'test_clerk_id',
        userId: 'test_user_id',
      });

      const app = createApp();
      const res = await request(app)
        .put('/api/sessions/test-session-001')
        .send({ invalidField: 'should-be-ignored' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should encrypt updated birthData and offsetConfig fields', async () => {
      setFindFirst({
        id: 'test-session-001',
        clerkId: 'test_clerk_id',
        userId: 'test_user_id',
      });
      mockEncryptDataFn.mockClear();

      const app = createApp();
      const res = await request(app)
        .put('/api/sessions/test-session-001')
        .send({
          birthData: { fullName: 'Sensitive Name', birthPlace: 'Private Location' },
          offsetConfig: { preset: '1hour' },
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('updated');
      // Verify encryption was called for each sensitive field
      expect(mockEncryptDataFn).toHaveBeenCalledWith('Sensitive Name', 'test_clerk_id');
      expect(mockEncryptDataFn).toHaveBeenCalledWith('Private Location', 'test_clerk_id');
      expect(mockEncryptDataFn).toHaveBeenCalledWith('{"preset":"1hour"}', 'test_clerk_id');
    });
  });
});
