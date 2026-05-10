/**
 * 🔱 STREAM INTEGRATION TESTS
 * Integration tests for SSE stream endpoint.
 * Exercises actual route logic with mocked auth and DB dependencies.
 * Focus: auth enforcement, session validation, SSE response format.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import { EventEmitter } from 'events';

// ── Hoisted mock factories ──────────────────────────────────

let mockQueryResults: any[] = [];
let queryResultIndex = 0;

const {
  mockResolveOwnershipContextFn,
  mockIsOwnedByContextFn,
  mockGetQueueStatusFn,
  mockGetSessionProgressFn,
  mockParseSensitiveFieldFn,
  mockSafeDecryptFn,
  mockGetPersistedEventsFn,
  mockGetPersistedEventsSinceFn,
  mockGetLatestJobForSessionFn,
} = vi.hoisted(() => ({
  mockResolveOwnershipContextFn: vi.fn(),
  mockIsOwnedByContextFn: vi.fn(),
  mockGetQueueStatusFn: vi.fn(),
  mockGetSessionProgressFn: vi.fn(),
  mockParseSensitiveFieldFn: vi.fn(),
  mockSafeDecryptFn: vi.fn(),
  mockGetPersistedEventsFn: vi.fn(async () => []),
  mockGetPersistedEventsSinceFn: vi.fn(async (): Promise<any[]> => []),
  mockGetLatestJobForSessionFn: vi.fn(async () => null),
}));

// ── Mock DB ─────────────────────────────────────────────────

vi.mock('@ai-pandit/db', () => {
  const createQueryBuilder = () => {
    const qb: any = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
    };
    qb.then = function (resolve: any) {
      const res = mockQueryResults[queryResultIndex];
      queryResultIndex = Math.min(queryResultIndex + 1, mockQueryResults.length - 1);
      resolve(res || []);
    };
    return qb;
  };

  return {
    db: {
      select: vi.fn(() => createQueryBuilder()),
      update: vi.fn(() => createQueryBuilder()),
      delete: vi.fn(() => createQueryBuilder()),
      query: { sessions: { findFirst: vi.fn() } },
    },
    getLatestJobForSession: mockGetLatestJobForSessionFn,
    executeWithRetry: vi.fn(async (fn: () => Promise<unknown>) => fn()),
  };
});

vi.mock('@ai-pandit/db/schema', () => ({
  sessions: {
    id: 'id', externalId: 'externalId', userId: 'userId', status: 'status',
    errorMessage: 'errorMessage', updatedAt: 'updatedAt',
    analysisResult: 'analysisResult', fullName: 'fullName',
    offsetConfig: 'offsetConfig', lifeEvents: 'lifeEvents',
    dateOfBirth: 'dateOfBirth', tentativeTime: 'tentativeTime',
    birthPlace: 'birthPlace', completedAt: 'completedAt',
    startedProcessingAt: 'startedProcessingAt',
  },
  
}));

vi.mock('drizzle-orm', () => ({
  eq: vi.fn((col: any, val: any) => ({ op: 'eq', col, val })),
  and: vi.fn(),
}));

// ── Mock Auth Middleware ─────────────────────────────────────

vi.mock('../../middleware/auth.js', () => ({
  authMiddleware: (req: any, _res: any, next: any) => {
    const authHeader = req.headers.authorization;
    if (authHeader === 'Bearer VALID_TOKEN') {
      req.externalId = 'valid_clerk_001';
    } else if (authHeader === 'Bearer OTHER_USER') {
      req.externalId = 'other_clerk_002';
    }
    // If no valid auth header, externalId stays undefined
    next();
  },
  AuthenticatedRequest: {} as any,
}));

vi.mock('../../lib/logger.js', () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

vi.mock('../../lib/progress-tracker.js', () => ({
  getSessionProgress: mockGetSessionProgressFn,
}));

vi.mock('../../lib/queue-manager.js', () => ({
  getQueueStatus: mockGetQueueStatusFn,
}));

vi.mock('../../lib/encryption/index.js', () => ({
  getApiEncryption: vi.fn(() => ({
    encrypt: vi.fn(),
    decrypt: mockSafeDecryptFn,
    parseField: mockParseSensitiveFieldFn,
    isEncrypted: vi.fn(() => false),
  })),
}));

vi.mock('../../lib/session-ownership.js', () => ({
  resolveSessionOwnershipContext: mockResolveOwnershipContextFn,
  isSessionOwnedByContext: mockIsOwnedByContextFn,
}));

vi.mock('../../config/index.js', () => ({
  aiConfig: { model: 'test-ai-model' },
  config: {
    features: { useNewStreamPath: true },
    app: { nodeEnv: 'test' },
  },
}));

vi.mock('../../lib/jobs/job-event-stream.js', () => ({
  getPersistedSessionEvents: mockGetPersistedEventsFn,
  getPersistedSessionEventsSince: mockGetPersistedEventsSinceFn,
}));

// ── Mock sessionEvents emitter ──────────────────────────────

const mockEmitter = new EventEmitter();
vi.mock('../../lib/session-events.js', () => ({
  sessionEvents: {
    getEmitter: vi.fn(() => mockEmitter),
    getLastContext: vi.fn(() => null),
    getThinkingBuffers: vi.fn(() => []),
    getCalculationBuffer: vi.fn(() => []),
    getCandidateScoreBuffer: vi.fn(() => []),
    getDecisionBuffer: vi.fn(() => []),
    getNextSeq: vi.fn(() => 1),
    logEvent: vi.fn(),
    getEventsSince: vi.fn(() => []),
  },
}));

// ── Test App ────────────────────────────────────────────────

import streamRouter from '../../routes/stream.js';

function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/stream', streamRouter);
  return app;
}

let app: express.Express;

// ── Helpers ─────────────────────────────────────────────────

function setMockResults(results: any[]) {
  mockQueryResults = results;
  queryResultIndex = 0;
}

function parseSSE(text: string) {
  const lines = text.split('\n');
  const data: any[] = [];
  for (const line of lines) {
    if (line.startsWith('data: ')) {
      try {
        const jsonStr = line.replace('data: ', '').trim();
        if (jsonStr) data.push(JSON.parse(jsonStr));
      } catch {
        // ignore malformed SSE
      }
    }
  }
  return data;
}

function setupDefaultMocks() {
  mockResolveOwnershipContextFn.mockImplementation(async (externalId: string) => ({
    externalId,
    internalUserId: externalId === 'valid_clerk_001' ? 'user_001' : null,
  }));
  mockIsOwnedByContextFn.mockImplementation(
    (session: { externalId?: string; userId?: string } | null, ctx: { externalId: string; internalUserId: string | null }) => {
      if (!session) return false;
      if (session.externalId === ctx.externalId) return true;
      if (ctx.internalUserId && session.userId === ctx.internalUserId) return true;
      return false;
    }
  );
  mockParseSensitiveFieldFn.mockImplementation((val: unknown) => val);
  mockSafeDecryptFn.mockImplementation((val: unknown) => val);
  mockGetSessionProgressFn.mockResolvedValue({ currentStep: 1, totalSteps: 7, percentage: 14 });
  mockGetQueueStatusFn.mockResolvedValue({
    status: 'processing',
    position: 0,
    estimatedWaitSeconds: 0,
    totalInQueue: 1,
    session: { fullName: 'Test', offsetConfig: null, userId: 'user_001' },
  });
}

// ── Tests ───────────────────────────────────────────────────

describe('Stream Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupDefaultMocks();
    app = createApp();
  });

  afterEach(() => {
    mockEmitter.removeAllListeners();
  });

  // ── OPTIONS /api/stream ───────────────────────────────────

  describe('OPTIONS /api/stream/:sessionId', () => {
    it('should return 204 with CORS headers for preflight', async () => {
      const res = await request(app)
        .options('/api/stream/sess-1')
        .set('Origin', 'http://localhost:3000');

      expect(res.status).toBe(204);
      expect(res.headers['access-control-allow-origin']).toBe('http://localhost:3000');
      expect(res.headers['access-control-allow-credentials']).toBe('true');
      expect(res.headers['access-control-allow-methods']).toContain('GET');
    });
  });

  // ── Auth Enforcement ──────────────────────────────────────

  describe('Authentication enforcement', () => {
    it('should return SSE error UNAUTHORIZED when no auth header is present', async () => {
      const res = await request(app).get('/api/stream/sess-auth-1');
      const sse = parseSSE(res.text);

      expect(res.headers['content-type']).toContain('text/event-stream');
      expect(sse[0].type).toBe('error');
      expect(sse[0].code).toBe('UNAUTHORIZED');
      expect(sse[0].message).toContain('Authentication required');
    });

    it('should return SSE error UNAUTHORIZED for malformed auth token', async () => {
      const res = await request(app)
        .get('/api/stream/sess-auth-2')
        .set('Authorization', 'malformed-token');

      const sse = parseSSE(res.text);
      expect(sse[0].type).toBe('error');
      expect(sse[0].code).toBe('UNAUTHORIZED');
    });
  });

  // ── Session Validation ────────────────────────────────────

  describe('Session validation', () => {
    it('should return SSE error NOT_FOUND for non-existent session', async () => {
      setMockResults([[]]); // DB returns empty

      const res = await request(app)
        .get('/api/stream/nonexistent-session')
        .set('Authorization', 'Bearer VALID_TOKEN');

      const sse = parseSSE(res.text);
      expect(res.headers['content-type']).toContain('text/event-stream');
      expect(sse[0].type).toBe('error');
      expect(sse[0].code).toBe('NOT_FOUND');
      expect(sse[0].message).toBe('Session not found');
    });

    it('should return SSE error FORBIDDEN when session belongs to another user', async () => {
      setMockResults([[{ externalId: 'other_owner', userId: 'owner_999', status: 'pending' }]]);

      const res = await request(app)
        .get('/api/stream/sess-other')
        .set('Authorization', 'Bearer VALID_TOKEN');

      const sse = parseSSE(res.text);
      expect(sse[0].type).toBe('error');
      expect(sse[0].code).toBe('FORBIDDEN');
      expect(sse[0].message).toBe('Access denied');
    });
  });

  // ── Terminal States ───────────────────────────────────────

  describe('Terminal state handling', () => {
    it('should return terminal_state for completed sessions', async () => {
      setMockResults([[
        {
          externalId: 'valid_clerk_001',
          userId: 'user_001',
          status: 'complete',
          analysisResult: JSON.stringify({ rectifiedTime: '12:34:56', accuracy: 96 }),
          errorMessage: null,
          updatedAt: new Date().toISOString(),
        },
      ]]);

      const res = await request(app)
        .get('/api/stream/sess-done')
        .set('Authorization', 'Bearer VALID_TOKEN');

      const sse = parseSSE(res.text);
      expect(res.headers['content-type']).toContain('text/event-stream');
      expect(sse[0].type).toBe('terminal_state');
      expect(sse[0].status).toBe('complete');
    });

    it('should return terminal_state for failed sessions with error message', async () => {
      setMockResults([[
        {
          externalId: 'valid_clerk_001',
          userId: 'user_001',
          status: 'failed',
          errorMessage: 'Analysis engine OOM',
          updatedAt: new Date().toISOString(),
        },
      ]]);

      const res = await request(app)
        .get('/api/stream/sess-failed')
        .set('Authorization', 'Bearer VALID_TOKEN');

      const sse = parseSSE(res.text);
      expect(sse[0].type).toBe('terminal_state');
      expect(sse[0].status).toBe('failed');
      expect(sse[0].errorMessage).toBe('Analysis engine OOM');
    });
  });

  // ── Active SSE Stream ─────────────────────────────────────

  describe('Active SSE stream for valid session', () => {
    it('should open SSE connection with correct headers for active session', { timeout: 5000 }, async () => {
      setMockResults([[{ externalId: 'valid_clerk_001', userId: 'user_001', status: 'processing' }]]);

      let responseText = '';
      let gotHeaders = false;
      let gotConnected = false;

      await new Promise<void>((resolve) => {
        const req = request(app)
          .get('/api/stream/sess-active')
          .set('Authorization', 'Bearer VALID_TOKEN')
          .buffer()
          .parse((res, cb) => {
            // Capture headers as soon as they arrive
            if (res.headers['content-type']?.includes('text/event-stream')) {
              gotHeaders = true;
            }

            res.on('data', (chunk: Buffer) => {
              const chunkStr = chunk.toString();
              responseText += chunkStr;
              if (chunkStr.includes('"connected"')) {
                gotConnected = true;
                // Send complete to close gracefully
                mockEmitter.emit('event', { type: 'complete' });
              }
            });
            res.on('end', () => {
              cb(null, responseText);
              resolve();
            });
          });
        req.end();

        // Safety timeout
        setTimeout(() => resolve(), 3000);
      });

      expect(gotHeaders).toBe(true);
      expect(gotConnected).toBe(true);
      expect(responseText).toContain('connected');
    });

    it('should send SSE content-type even for error responses', async () => {
      setMockResults([[]]); // session not found

      const res = await request(app)
        .get('/api/stream/sess-missing')
        .set('Authorization', 'Bearer VALID_TOKEN');

      expect(res.headers['content-type']).toContain('text/event-stream');
    });
  });
});
