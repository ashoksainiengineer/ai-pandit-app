import { beforeEach, describe, expect, it, vi } from 'vitest';
import express from 'express';
import request from 'supertest';

const {
  getJobDetailByIdMock,
  listJobEventsMock,
  listJobEventsSinceMock,
} = vi.hoisted(() => ({
  getJobDetailByIdMock: vi.fn(),
  listJobEventsMock: vi.fn(),
  listJobEventsSinceMock: vi.fn(),
}));

vi.mock('../../middleware/auth.js', () => ({
  authMiddleware: (req: { externalId?: string }, _res: unknown, next: () => void) => {
    req.externalId = 'clerk_test_123';
    next();
  },
}));

vi.mock('../../lib/session-ownership.js', () => ({
  resolveSessionOwnershipContext: vi.fn(async () => ({
    externalId: 'clerk_test_123',
    internalUserId: 'user_123',
  })),
}));

vi.mock('../../config/index.js', () => ({
  config: {
    queue: {
      syncPollIntervalMs: 2000,
    },
  },
}));

vi.mock('../../lib/jobs/job-service.js', () => ({
  getJobDetailById: getJobDetailByIdMock,
  cancelJobById: vi.fn(),
  createQueuedBirthRectificationJob: vi.fn(),
  getJobIdempotencyKey: vi.fn(),
}));

vi.mock('@ai-pandit/db/jobs', () => ({
  listJobEvents: listJobEventsMock,
  listJobEventsSince: listJobEventsSinceMock,
}));

import jobsRouter from '../jobs.js';

function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/jobs', jobsRouter);
  return app;
}

describe('Jobs Routes - GET /jobs/:jobId/events', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns full event history when no since query is provided', async () => {
    getJobDetailByIdMock.mockResolvedValueOnce({
      id: 'job_123',
      sessionId: 'session_123',
    });
    listJobEventsMock.mockResolvedValueOnce([
      {
        id: 'evt_1',
        jobId: 'job_123',
        sessionId: 'session_123',
        sequenceNo: 1,
        eventType: 'job.queued',
        stage: null,
        payloadJson: { status: 'queued' },
        createdAt: '2026-03-12T01:00:00.000Z',
      },
    ]);

    const res = await request(createApp()).get('/jobs/job_123/events');

    expect(res.status).toBe(200);
    expect(listJobEventsMock).toHaveBeenCalledWith('job_123');
    expect(res.body.success).toBe(true);
    expect(res.body.data.jobId).toBe('job_123');
    expect(res.body.data.since).toBe(0);
    expect(res.body.data.events).toHaveLength(1);
    expect(res.body.data.events[0]).toEqual(
      expect.objectContaining({
        id: 'evt_1',
        sequenceNo: 1,
        eventType: 'job.queued',
        payload: { status: 'queued' },
      })
    );
  });

  it('returns incremental event history when since is provided', async () => {
    getJobDetailByIdMock.mockResolvedValueOnce({
      id: 'job_123',
      sessionId: 'session_123',
    });
    listJobEventsSinceMock.mockResolvedValueOnce([
      {
        id: 'evt_5',
        jobId: 'job_123',
        sessionId: 'session_123',
        sequenceNo: 5,
        eventType: 'job.retrying',
        stage: '4',
        payloadJson: { status: 'retrying' },
        createdAt: '2026-03-12T01:05:00.000Z',
      },
    ]);

    const res = await request(createApp()).get('/jobs/job_123/events?since=4');

    expect(res.status).toBe(200);
    expect(listJobEventsSinceMock).toHaveBeenCalledWith('job_123', 4);
    expect(res.body.data.since).toBe(4);
    expect(res.body.data.events[0]).toEqual(
      expect.objectContaining({
        id: 'evt_5',
        sequenceNo: 5,
        eventType: 'job.retrying',
        stage: '4',
      })
    );
  });

  it('returns job sync payload for polling fallback consumers', async () => {
    getJobDetailByIdMock.mockResolvedValueOnce({
      id: 'job_123',
      sessionId: 'session_123',
      userId: 'user_123',
      kind: 'btr_rectification',
      status: 'retrying',
      progressPercent: 44,
      attempt: 1,
      maxAttempts: 3,
      retryCount: 1,
      retryReasonCode: 'network_error',
      nextRetryAt: '2026-03-12T01:06:00.000Z',
      queuedAt: '2026-03-12T01:00:00.000Z',
      startedAt: '2026-03-12T01:01:00.000Z',
      heartbeatAt: '2026-03-12T01:05:00.000Z',
      finishedAt: null,
      cancelRequestedAt: null,
      errorCode: 'network_error',
      errorMessage: 'socket hang up',
      createdAt: '2026-03-12T01:00:00.000Z',
      updatedAt: '2026-03-12T01:05:00.000Z',
      version: 2,
      result: null,
      checkpoint: null,
      cursor: null,
      sessionStatus: 'processing',
    });
    listJobEventsSinceMock.mockResolvedValueOnce([
      {
        id: 'evt_6',
        jobId: 'job_123',
        sessionId: 'session_123',
        sequenceNo: 6,
        eventType: 'job.retrying',
        stage: '4',
        payloadJson: { status: 'retrying' },
        createdAt: '2026-03-12T01:05:01.000Z',
      },
    ]);

    const res = await request(createApp()).get('/jobs/job_123/sync?since=5');

    expect(res.status).toBe(200);
    expect(res.body.data.latestSequenceNo).toBe(6);
    expect(res.body.data.replayMode).toBe('incremental');
    expect(res.body.data.recommendedPollIntervalMs).toBe(2000);
    expect(res.body.data.job.retryCount).toBe(1);
    expect(res.body.data.events[0]).toEqual(
      expect.objectContaining({
        id: 'evt_6',
        sequenceNo: 6,
        eventType: 'job.retrying',
      })
    );
  });
});
