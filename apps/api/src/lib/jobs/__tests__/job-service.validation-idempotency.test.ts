import { beforeEach, describe, expect, it, vi } from 'vitest';

const { executeWithRetryMock, syncUserMock, selectQueue } = vi.hoisted(() => ({
  executeWithRetryMock: vi.fn(async <T>(fn: () => Promise<T>) => fn()),
  syncUserMock: vi.fn(async () => 'internal-user-1'),
  selectQueue: [] as unknown[][],
}));

function createSelectBuilder() {
  return {
    from: vi.fn().mockReturnThis(),
    innerJoin: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn(async () => (selectQueue.length > 0 ? selectQueue.shift() ?? [] : [])),
  };
}

vi.mock('@ai-pandit/db', () => ({
  db: {
    select: vi.fn(() => createSelectBuilder()),
    transaction: vi.fn(),
  },
  executeWithRetry: executeWithRetryMock,
}));

vi.mock('@ai-pandit/db/schema', () => ({
  idempotencyKeys: { userId: 'userId', key: 'key', requestHash: 'requestHash', jobId: 'jobId' },
  jobs: { id: 'id', sessionId: 'sessionId' },
  sessions: { id: 'id', clerkId: 'clerkId', userId: 'userId', aiConsentGiven: 'aiConsentGiven' },
  users: { id: 'id', role: 'role' },
}));

vi.mock('drizzle-orm', () => ({
  and: vi.fn((...args: unknown[]) => ({ op: 'and', args })),
  eq: vi.fn((left: unknown, right: unknown) => ({ op: 'eq', left, right })),
}));

vi.mock('@ai-pandit/shared', () => ({
  CalculateRequestSchema: {
    safeParse: vi.fn((value: unknown) => ({ success: true, data: value })),
    parse: vi.fn((value: unknown) => value),
  },
}));

vi.mock('../../queue-manager.js', () => ({
  addToQueue: vi.fn(async () => ({ success: true, position: 1, estimatedWaitSeconds: 10 })),
  cancelSession: vi.fn(),
  startQueueProcessor: vi.fn(),
}));

vi.mock('../../time-offset-manager.js', () => ({
  validateOffsetConfig: vi.fn(() => ({ valid: true })),
}));

vi.mock('../../encryption/index.js', () => ({
  encryptData: vi.fn((value: string) => `enc:${value}`),
}));

vi.mock('../../user-sync.js', () => ({
  syncUser: syncUserMock,
}));

vi.mock('../../session-ownership.js', () => ({
  isSessionOwnedByContext: vi.fn(() => true),
}));

import { ErrorCodes, ValidationError } from '../../../errors/index.js';
import {
  createQueuedBirthRectificationJob,
  getJobIdempotencyKey,
} from '../job-service.js';

const baseBody = {
  birthData: {
    fullName: 'Test User',
    dateOfBirth: '1990-01-10',
    tentativeTime: '10:30',
    birthPlace: 'Delhi',
    latitude: 28.6139,
    longitude: 77.209,
    timezone: 5.5,
    gender: 'male',
  },
  lifeEvents: [
    {
      type: 'career',
      date: '2015-06-01',
      description: 'Started first job',
      confidence: 'high',
    },
  ],
  forensicTraits: {
    bodyType: 'athletic',
  },
  physicalTraits: {
    complexion: 'wheatish',
  },
  offsetConfig: { type: 'minutes', value: 60 },
};

describe('job-service validation + idempotency guardrails', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    selectQueue.length = 0;
  });

  it('extracts idempotency key from header and trims whitespace', () => {
    const req = {
      headers: {
        'idempotency-key': '  idem-key-123  ',
      },
    } as unknown as { headers: Record<string, string> };

    expect(getJobIdempotencyKey(req as any)).toBe('idem-key-123');
  });

  it('rejects silent date overflow (invalid calendar date)', async () => {
    const payload = {
      ...baseBody,
      birthData: {
        ...baseBody.birthData,
        dateOfBirth: '2024-02-31',
      },
    };

    await expect(
      createQueuedBirthRectificationJob({
        clerkId: 'clerk_1',
        ownershipContext: { clerkId: 'clerk_1', internalUserId: 'internal-user-1' },
        body: payload,
      })
    ).rejects.toBeInstanceOf(ValidationError);

    expect(syncUserMock).not.toHaveBeenCalled();
  });

  it('blocks idempotency key reuse with different request payload hash', async () => {
    selectQueue.push([{ role: 'user' }]);
    selectQueue.push([]); // global queued
    selectQueue.push([]); // global running
    selectQueue.push([]); // global retrying
    selectQueue.push([]); // user queued
    selectQueue.push([]); // user running
    selectQueue.push([]); // user retrying
    selectQueue.push([
      {
        requestHash: 'a-different-hash',
        jobId: 'job-existing-123',
      },
    ]);

    await expect(
      createQueuedBirthRectificationJob({
        clerkId: 'clerk_1',
        ownershipContext: { clerkId: 'clerk_1', internalUserId: 'internal-user-1' },
        body: baseBody,
        idempotencyKey: 'idem-xyz',
      })
    ).rejects.toMatchObject({
      code: ErrorCodes.DUPLICATE_REQUEST,
    });

    expect(executeWithRetryMock).toHaveBeenCalled();
  });

  it('returns explicit 429 contract details when per-user tier limit is exceeded', async () => {
    selectQueue.push([{ role: 'pro' }]);
    selectQueue.push([]); // global queued
    selectQueue.push([]); // global running
    selectQueue.push([]); // global retrying
    selectQueue.push([{ id: 'u1' }, { id: 'u2' }, { id: 'u3' }, { id: 'u4' }, { id: 'u5' }]); // user queued
    selectQueue.push([]); // user running
    selectQueue.push([]); // user retrying

    await expect(
      createQueuedBirthRectificationJob({
        clerkId: 'clerk_1',
        ownershipContext: { clerkId: 'clerk_1', internalUserId: 'internal-user-1' },
        body: baseBody,
      })
    ).rejects.toMatchObject({
      code: ErrorCodes.RATE_LIMIT_EXCEEDED,
      details: expect.objectContaining({
        reason: 'PER_USER_ACTIVE_LIMIT',
        contractVersion: '2026-03-12',
        retryable: true,
        httpStatusHint: 429,
      }),
    });
  });
});
