/**
 * Unit tests for redis-queue.ts
 *
 * Fully mocks ioredis, @ai-pandit/db, @ai-pandit/db/jobs, and drizzle-orm.
 * NO real Redis or DB connections are made.
 *
 * vitest hoists vi.mock to file-top. All values referenced by mock factories
 * must be defined via vi.hoisted() to prevent initialization order errors.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── vi.hoisted: shared state across mock factories ───────────────────────

const hoisted = vi.hoisted(() => ({
  /** Each call to new Redis() pushes an instance here */
  createdInstances: [] as Array<Record<string, unknown>>,

  /** Calls to the Redis constructor: [url, opts][] */
  redisConstructorCalls: [] as Array<[string, Record<string, unknown>]>,

  /** DB update chain — returning() resolves this */
  returningResult: [] as unknown[],

  /** Override for getLatestJobForSession return sequence */
  latestJobResults: [] as Array<unknown | null>,
}));

// ─── Mock @ai-pandit/db/jobs ──────────────────────────────────────────────

vi.mock('@ai-pandit/db/jobs', () => ({
  getLatestJobForSession: vi.fn(async (_sessionId: string) => {
    // Shift from a queue if results are provided, else null
    if (hoisted.latestJobResults.length > 0) {
      return hoisted.latestJobResults.shift();
    }
    return null;
  }),
}));

// ─── Mock @ai-pandit/db ───────────────────────────────────────────────────

vi.mock('@ai-pandit/db', () => ({
  db: {
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => ({
          returning: vi.fn(async () => hoisted.returningResult),
        })),
      })),
    })),
  },
}));

// ─── Mock @ai-pandit/db/schema ───────────────────────────────────────────

vi.mock('@ai-pandit/db/schema', () => ({
  jobs: {},
}));

// ─── Mock drizzle-orm ────────────────────────────────────────────────────

vi.mock('drizzle-orm', () => ({
  and: vi.fn((...args: unknown[]) => args),
  eq: vi.fn((a: unknown, b: unknown) => ({ type: 'eq', left: a, right: b })),
  lte: vi.fn((a: unknown, b: unknown) => ({ type: 'lte', left: a, right: b })),
  or: vi.fn((...args: unknown[]) => args),
}));

// ─── Mock ioredis ─────────────────────────────────────────────────────────

vi.mock('ioredis', () => {
  class MockIORedis {
    private _listeners: Record<string, Array<(...args: unknown[]) => void>> = {};
    private _status = 'wait';
    private _connectDelay = 0;

    constructor(url: string, opts: Record<string, unknown>) {
      hoisted.redisConstructorCalls.push([url, opts]);
      hoisted.createdInstances.push(this as unknown as Record<string, unknown>);

      // Capture connectTimeout for timeout simulation
      this._connectTimeout = opts.connectTimeout as number ?? 10000;

      return new Proxy(this, {
        get: (t, p) => {
          if (p === 'status') return t._status;
          const v = (t as Record<string, unknown>)[p as string];
          return typeof v === 'function' ? (v as Function).bind(t) : v;
        },
      }) as unknown as MockIORedis;
    }

    private _connectTimeout: number;

    get status() { return this._status; }

    connect = vi.fn(async () => {
      this._status = 'connecting';
      await new Promise<void>((r) => setTimeout(r, this._connectDelay));
      this._status = 'ready';
      (this._listeners['ready'] || []).forEach((fn) => fn());
      (this._listeners['connect'] || []).forEach((fn) => fn());
    });

    quit = vi.fn(async () => { this._status = 'end'; });
    disconnect = vi.fn(() => { this._status = 'end'; });

    on = vi.fn((event: string, fn: (...args: unknown[]) => void) => {
      (this._listeners[event] ??= []).push(fn);
      return this;
    });
    once = vi.fn((event: string, fn: (...args: unknown[]) => void) => {
      (this._listeners[event] ??= []).push(fn);
      return this;
    });
    off = vi.fn((event: string, fn: (...args: unknown[]) => void) => {
      if (this._listeners[event]) {
        this._listeners[event] = this._listeners[event].filter((l) => l !== fn);
      }
      return this;
    });
    removeAllListeners = vi.fn(() => {
      this._listeners = {};
    });

    // Redis commands
    lpop = vi.fn(async () => null);
    lpush = vi.fn(async () => 1);
    rpush = vi.fn(async () => 1);
    lrem = vi.fn(async () => 0);
    ltrim = vi.fn(async () => 'OK');
    blpop = vi.fn(async () => null);
    zadd = vi.fn(async () => 1);
    zrem = vi.fn(async () => 0);
    zrangebyscore = vi.fn(async () => []);

    // Test helpers
    __emit(event: string, ...args: unknown[]) {
      (this._listeners[event] || []).forEach((fn) => fn(...args));
    }
    __setStatus(s: string) { this._status = s; }
    __setConnectDelay(ms: number) { this._connectDelay = ms; }
  }

  return { Redis: MockIORedis, default: MockIORedis };
});

// ═══════════════════════════════════════════════════════════════════════════
// IMPORTS (after mocks so they resolve to mocked modules)
// ═══════════════════════════════════════════════════════════════════════════

import { createRedisQueueClient } from '../redis-queue.js';
import type { RedisQueueClient } from '../redis-queue.js';
import { getLatestJobForSession } from '@ai-pandit/db/jobs';
import { db } from '@ai-pandit/db';

const MockGetLatestJob = vi.mocked(getLatestJobForSession);
const MockDb = vi.mocked(db);

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════

function createClient(opts: Record<string, unknown> = {}): RedisQueueClient {
  return createRedisQueueClient({
    url: 'redis://localhost:6379',
    tls: false,
    connectTimeout: 1000,
    ...opts,
  });
}

/** Get the most recently constructed Redis mock instance */
function mockRedis(): Record<string, unknown> {
  return hoisted.createdInstances[hoisted.createdInstances.length - 1];
}

/** Build a fake DB Job object matching the Job type shape */
function makeJob(sessionId: string, overrides: Record<string, unknown> = {}) {
  return {
    id: `job-${sessionId}`,
    sessionId,
    userId: 'user-test',
    kind: 'btr_rectification',
    status: 'queued',
    currentStage: null,
    cursorJson: null,
    checkpointJson: null,
    progressPercent: 0,
    priority: 100,
    attempt: 1,
    maxAttempts: 3,
    retryCount: 0,
    retryReasonCode: null,
    nextRetryAt: null,
    queuedAt: new Date().toISOString(),
    startedAt: null,
    heartbeatAt: null,
    finishedAt: null,
    cancelRequestedAt: null,
    errorCode: null,
    errorMessage: null,
    resultJson: null,
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

/** Set up db.update() chain so returning() resolves `rows` */
function mockDbReturning(rows: unknown[]) {
  hoisted.returningResult = rows;
  MockDb.update.mockReturnValue({
    set: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue(rows),
      }),
    }),
  });
}

/** Queue a getLatestJobForSession result for the next call */
function queueLatestJobResult(result: unknown | null) {
  hoisted.latestJobResults.push(result);
}

// ═══════════════════════════════════════════════════════════════════════════
// LIFECYCLE
// ═══════════════════════════════════════════════════════════════════════════

beforeEach(() => {
  vi.clearAllMocks();
  hoisted.createdInstances.length = 0;
  hoisted.redisConstructorCalls.length = 0;
  hoisted.returningResult = [];
  hoisted.latestJobResults.length = 0;
  mockDbReturning([]);
});

// ═══════════════════════════════════════════════════════════════════════════
// TESTS: createRedisQueueClient — Interface
// ═══════════════════════════════════════════════════════════════════════════

describe('createRedisQueueClient', () => {
  it('returns an object with all expected methods', () => {
    const client = createClient();
    expect(typeof client.claimNextJob).toBe('function');
    expect(typeof client.claimNextJobBlocking).toBe('function');
    expect(typeof client.enqueueSession).toBe('function');
    expect(typeof client.scheduleRetry).toBe('function');
    expect(typeof client.moveToDeadLetter).toBe('function');
    expect(typeof client.disconnect).toBe('function');
    expect(typeof client.isHealthy).toBe('function');
  });

  it('creates distinct instances for multiple calls', () => {
    const c1 = createClient();
    const c2 = createClient();
    expect(c1).not.toBe(c2);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// TESTS: isHealthy()
// ═══════════════════════════════════════════════════════════════════════════

describe('isHealthy()', () => {
  it('returns false before connection (lazyConnect, status = wait)', () => {
    const client = createClient();
    expect(client.isHealthy()).toBe(false);
  });

  it('returns true after ensureConnected triggers connection', async () => {
    const client = createClient();
    await client.claimNextJob();
    expect(client.isHealthy()).toBe(true);
  });

  it('returns false after disconnect()', async () => {
    const client = createClient();
    await client.claimNextJob();
    expect(client.isHealthy()).toBe(true);
    await client.disconnect();
    expect(client.isHealthy()).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// TESTS: claimNextJob()
// ═══════════════════════════════════════════════════════════════════════════

describe('claimNextJob()', () => {
  it('returns null when the ready queue is empty', async () => {
    const client = createClient();
    const r = mockRedis();
    (r.lpop as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const result = await client.claimNextJob();
    expect(result).toBeNull();
  });

  it('returns null when sessionId is in queue but getLatestJob returns null', async () => {
    const client = createClient();
    const r = mockRedis();
    (r.lpop as ReturnType<typeof vi.fn>).mockResolvedValueOnce('session-orphan');
    // default: getLatestJob returns null

    const result = await client.claimNextJob();
    expect(result).toBeNull();
    expect(MockGetLatestJob).toHaveBeenCalledWith('session-orphan');
  });

  it('returns null when DB job exists but claimByDbId fails (race)', async () => {
    const client = createClient();
    const r = mockRedis();
    (r.lpop as ReturnType<typeof vi.fn>).mockResolvedValueOnce('session-race');
    queueLatestJobResult(makeJob('session-race'));
    mockDbReturning([]); // claim failed

    const result = await client.claimNextJob();
    expect(result).toBeNull();
    // Should push back to queue
    expect(r.lpush).toHaveBeenCalledWith(expect.stringContaining('ready'), 'session-race');
  });

  it('successfully claims a job', async () => {
    const client = createClient();
    const r = mockRedis();
    (r.lpop as ReturnType<typeof vi.fn>).mockResolvedValueOnce('session-ok');
    const job = makeJob('session-ok');
    queueLatestJobResult(job);
    const claimed = { ...job, status: 'running', startedAt: new Date().toISOString() };
    mockDbReturning([claimed]);

    const result = await client.claimNextJob();
    expect(result).not.toBeNull();
    expect(result!.sessionId).toBe('session-ok');
    expect(result!.status).toBe('running');
    expect(MockGetLatestJob).toHaveBeenCalledWith('session-ok');
    expect(MockDb.update).toHaveBeenCalled();
  });

  it('skips orphaned IDs and claims the next valid one', async () => {
    const client = createClient();
    const r = mockRedis();

    (r.lpop as ReturnType<typeof vi.fn>).mockResolvedValueOnce('session-bad');
    queueLatestJobResult(null);
    (r.lpop as ReturnType<typeof vi.fn>).mockResolvedValueOnce('session-good');
    const good = makeJob('session-good');
    queueLatestJobResult(good);
    mockDbReturning([{ ...good, status: 'running' }]);

    const result = await client.claimNextJob();
    expect(result).not.toBeNull();
    expect(result!.sessionId).toBe('session-good');
    expect(r.lpop).toHaveBeenCalledTimes(2);
  });

  it('promotes due retries before claiming', async () => {
    const client = createClient();
    const r = mockRedis();

    (r.zrangebyscore as ReturnType<typeof vi.fn>).mockResolvedValueOnce(['session-retry']);
    queueLatestJobResult(makeJob('session-retry', { status: 'retrying' }));
    (r.lpop as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    await client.claimNextJob();
    expect(r.zrem).toHaveBeenCalledWith(expect.stringContaining('delayed'), 'session-retry');
    expect(r.lpush).toHaveBeenCalledWith(expect.stringContaining('ready'), 'session-retry');
  });

  it('removes delayed entries whose DB job is not queued/retrying', async () => {
    const client = createClient();
    const r = mockRedis();

    (r.zrangebyscore as ReturnType<typeof vi.fn>).mockResolvedValueOnce(['session-stale']);
    queueLatestJobResult(makeJob('session-stale', { status: 'completed' }));
    (r.lpop as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    await client.claimNextJob();
    expect(r.zrem).toHaveBeenCalledWith(expect.stringContaining('delayed'), 'session-stale');
    // Should not lpush to ready
    const lpushCalls = (r.lpush as ReturnType<typeof vi.fn>).mock.calls.filter(
      (c: unknown[]) => c[1] === 'session-stale',
    );
    expect(lpushCalls.length).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// TESTS: claimNextJobBlocking()
// ═══════════════════════════════════════════════════════════════════════════

describe('claimNextJobBlocking()', () => {
  it('returns job immediately if available without BLPOP', async () => {
    const client = createClient();
    const r = mockRedis();

    (r.lpop as ReturnType<typeof vi.fn>).mockResolvedValueOnce('session-fast');
    queueLatestJobResult(makeJob('session-fast'));
    mockDbReturning([{ ...makeJob('session-fast'), status: 'running' }]);

    const result = await client.claimNextJobBlocking();
    expect(result).not.toBeNull();
    expect(result!.sessionId).toBe('session-fast');
    expect(r.blpop).not.toHaveBeenCalled();
  });

  it('blocks via BLPOP when queue is empty, then claims job', async () => {
    const client = createClient();
    const r = mockRedis();

    (r.lpop as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    (r.blpop as ReturnType<typeof vi.fn>).mockResolvedValue(['ready-key', 'session-blocked']);
    queueLatestJobResult(makeJob('session-blocked'));
    mockDbReturning([{ ...makeJob('session-blocked'), status: 'running' }]);

    const result = await client.claimNextJobBlocking(10);
    expect(result).not.toBeNull();
    expect(result!.sessionId).toBe('session-blocked');
    expect(r.blpop).toHaveBeenCalledWith(expect.stringContaining('ready'), 10);
  });

  it('returns null when BLPOP times out', async () => {
    const client = createClient();
    const r = mockRedis();
    (r.lpop as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    (r.blpop as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const result = await client.claimNextJobBlocking(5);
    expect(result).toBeNull();
  });

  it('returns null when BLPOP finds session but getLatestJob returns null', async () => {
    const client = createClient();
    const r = mockRedis();
    (r.lpop as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    (r.blpop as ReturnType<typeof vi.fn>).mockResolvedValue(['key', 'session-ghost']);
    queueLatestJobResult(null);

    const result = await client.claimNextJobBlocking();
    expect(result).toBeNull();
  });

  it('uses default BLPOP_TIMEOUT_SECONDS (30) when no timeout passed', async () => {
    const client = createClient();
    const r = mockRedis();
    (r.lpop as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    (r.blpop as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    await client.claimNextJobBlocking();
    expect(r.blpop).toHaveBeenCalledWith(expect.any(String), 30);
  });

  it('promotes due retries before blocking', async () => {
    const client = createClient();
    const r = mockRedis();
    (r.lpop as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    (r.zrangebyscore as ReturnType<typeof vi.fn>).mockResolvedValueOnce(['session-pending']);
    queueLatestJobResult(makeJob('session-pending', { status: 'retrying' }));
    (r.blpop as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    await client.claimNextJobBlocking();
    expect(r.zrem).toHaveBeenCalledWith(expect.stringContaining('delayed'), 'session-pending');
    expect(r.lpush).toHaveBeenCalledWith(expect.stringContaining('ready'), 'session-pending');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// TESTS: enqueueSession()
// ═══════════════════════════════════════════════════════════════════════════

describe('enqueueSession()', () => {
  it('removes existing entry (dedup) and RPUSHes to ready queue', async () => {
    const client = createClient();
    const r = mockRedis();

    await client.enqueueSession('session-new');

    expect(r.lrem).toHaveBeenCalledWith(expect.stringContaining('ready'), 0, 'session-new');
    expect(r.rpush).toHaveBeenCalledWith(expect.stringContaining('ready'), 'session-new');
    expect(
      (r.lrem as ReturnType<typeof vi.fn>).mock.invocationCallOrder[0],
    ).toBeLessThan(
      (r.rpush as ReturnType<typeof vi.fn>).mock.invocationCallOrder[0],
    );
  });

  it('triggers ensureConnected before enqueuing', async () => {
    const client = createClient();
    expect(client.isHealthy()).toBe(false);
    await client.enqueueSession('s');
    expect(client.isHealthy()).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// TESTS: scheduleRetry()
// ═══════════════════════════════════════════════════════════════════════════

describe('scheduleRetry()', () => {
  it('removes from ready and adds to delayed sorted set with future score', async () => {
    const client = createClient();
    const r = mockRedis();
    const beforeCall = Date.now();

    await client.scheduleRetry('session-delayed', 120000);

    expect(r.lrem).toHaveBeenCalledWith(expect.stringContaining('ready'), 0, 'session-delayed');
    expect(r.zadd).toHaveBeenCalledTimes(1);
    const [key, score, member] = (r.zadd as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(key).toContain('delayed');
    expect(score).toBeGreaterThanOrEqual(beforeCall + 120000);
    expect(member).toBe('session-delayed');
  });

  it('handles zero delay (immediate retry)', async () => {
    const client = createClient();
    const r = mockRedis();
    const beforeCall = Date.now();

    await client.scheduleRetry('instant', 0);

    const [, score] = (r.zadd as ReturnType<typeof vi.fn>).mock.calls[0];
    // Allow ±1ms tolerance for clock resolution
    expect(score).toBeGreaterThanOrEqual(beforeCall);
    expect(score).toBeLessThanOrEqual(beforeCall + 10);
  });

  it('triggers connection before scheduling', async () => {
    const client = createClient();
    expect(client.isHealthy()).toBe(false);
    await client.scheduleRetry('session-z', 5000);
    expect(client.isHealthy()).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// TESTS: moveToDeadLetter()
// ═══════════════════════════════════════════════════════════════════════════

describe('moveToDeadLetter()', () => {
  it('LPUSHes JSON entry to DLQ with reason and timestamp', async () => {
    const client = createClient();
    const r = mockRedis();

    await client.moveToDeadLetter('session-dead', { error: 'Max retries', code: 'MAX_RETRIES' });

    expect(r.lpush).toHaveBeenCalledTimes(1);
    const [key, value] = (r.lpush as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(key).toContain('dlq');
    const parsed = JSON.parse(value as string);
    expect(parsed.sessionId).toBe('session-dead');
    expect(parsed.error).toBe('Max retries');
    expect(parsed.code).toBe('MAX_RETRIES');
    expect(parsed.movedAt).toEqual(expect.any(String));
  });

  it('trims DLQ to last 10,000 entries after LPUSH', async () => {
    const client = createClient();
    const r = mockRedis();

    await client.moveToDeadLetter('session-trim', { reason: 'overflow' });

    expect(r.ltrim).toHaveBeenCalledWith(expect.stringContaining('dlq'), 0, 9999);
    expect(
      (r.lpush as ReturnType<typeof vi.fn>).mock.invocationCallOrder[0],
    ).toBeLessThan(
      (r.ltrim as ReturnType<typeof vi.fn>).mock.invocationCallOrder[0],
    );
  });

  it('handles empty reason object', async () => {
    const client = createClient();
    const r = mockRedis();

    await client.moveToDeadLetter('session-empty', {});

    const [, value] = (r.lpush as ReturnType<typeof vi.fn>).mock.calls[0];
    const parsed = JSON.parse(value as string);
    expect(parsed.sessionId).toBe('session-empty');
    expect(parsed.movedAt).toEqual(expect.any(String));
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// TESTS: disconnect()
// ═══════════════════════════════════════════════════════════════════════════

describe('disconnect()', () => {
  it('removes all listeners and calls quit()', async () => {
    const client = createClient();
    const r = mockRedis();
    await client.enqueueSession('s1');
    await client.disconnect();

    expect(r.removeAllListeners).toHaveBeenCalledOnce();
    expect(r.quit).toHaveBeenCalledOnce();
  });

  it('falls back to disconnect() if quit() throws', async () => {
    const client = createClient();
    const r = mockRedis();
    (r.quit as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('QUIT failed'));

    await client.disconnect();

    expect(r.quit).toHaveBeenCalled();
    expect(r.disconnect).toHaveBeenCalled();
  });

  it('can be called multiple times without error', async () => {
    const client = createClient();
    await client.enqueueSession('s1');
    await client.disconnect();
    await expect(client.disconnect()).resolves.toBeUndefined();
  });

  it('sets isHealthy to false after disconnect', async () => {
    const client = createClient();
    await client.enqueueSession('s1');
    expect(client.isHealthy()).toBe(true);
    await client.disconnect();
    expect(client.isHealthy()).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// TESTS: Error Handling
// ═══════════════════════════════════════════════════════════════════════════

describe('error handling', () => {
  it('logs Redis errors to console.error', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const client = createClient();
    const r = mockRedis();

    (r as any).__emit('error', new Error('Connection refused'));

    expect(spy).toHaveBeenCalledWith('[RedisQueue] Connection error:', 'Connection refused');
    spy.mockRestore();
    await client.disconnect();
  });

  it('logs connect event to console.log', async () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    createClient();
    const r = mockRedis();

    (r as any).__emit('connect');

    expect(spy).toHaveBeenCalledWith('[RedisQueue] Connected');
    spy.mockRestore();
  });

  it('logs disconnection message after disconnect', async () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const client = createClient();
    await client.enqueueSession('s1');
    await client.disconnect();

    expect(spy).toHaveBeenCalledWith('[RedisQueue] Disconnected');
    spy.mockRestore();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// TESTS: Edge Cases
// ═══════════════════════════════════════════════════════════════════════════

describe('edge cases', () => {
  it('claimNextJob batches up to REDIS_CLAIM_BATCH_SIZE (50)', async () => {
    const client = createClient();
    const r = mockRedis();

    const ids = Array.from({ length: 60 }, (_, i) => `session-${i}`);
    for (const id of ids) {
      (r.lpop as ReturnType<typeof vi.fn>).mockResolvedValueOnce(id);
      queueLatestJobResult(null);
    }

    await client.claimNextJob();
    expect((r.lpop as ReturnType<typeof vi.fn>).mock.calls.length).toBeLessThanOrEqual(50);
  });

  it('ensureConnected times out when connect hangs and status is connecting', async () => {
    // Use the 'connecting' path which has explicit timeout handling
    const client = createClient({ connectTimeout: 500 });
    const r = mockRedis();

    // Set status to 'connecting' so ensureConnected uses the wait+timeout path
    (r as any).__setStatus('connecting');
    // Do NOT emit 'ready' — so the timeout fires

    await expect(client.claimNextJob()).rejects.toThrow('Redis connection timeout');
  }, 5000);

  it('ensureConnected waits when status is connecting, then succeeds on ready', async () => {
    const client = createClient();
    const r = mockRedis();

    (r as any).__setStatus('connecting');
    // Emit ready after short delay
    setTimeout(() => {
      (r as any).__setStatus('ready');
      (r as any).__emit('ready');
    }, 50);

    (r.lpop as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const result = await client.claimNextJob();
    expect(result).toBeNull();
  });

  it('scheduleRetry with large delay does not overflow', async () => {
    const client = createClient();
    const r = mockRedis();

    await client.scheduleRetry('session-big', 3600000);

    const [, score] = (r.zadd as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(typeof score).toBe('number');
    expect(Number.isFinite(score)).toBe(true);
  });

  it('multiple enqueueSession calls for same ID are deduplicated', async () => {
    const client = createClient();
    const r = mockRedis();

    await client.enqueueSession('dup');
    await client.enqueueSession('dup');
    await client.enqueueSession('dup');

    expect(r.lrem).toHaveBeenCalledTimes(3);
    expect(r.rpush).toHaveBeenCalledTimes(3);
    for (const call of (r.lrem as ReturnType<typeof vi.fn>).mock.calls) {
      expect(call[2]).toBe('dup');
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// TESTS: Connection Lifecycle — uses hoisted.redisConstructorCalls
// ═══════════════════════════════════════════════════════════════════════════

describe('connection lifecycle', () => {
  it('creates Redis client with lazyConnect: true', () => {
    createClient();
    const [url, opts] = hoisted.redisConstructorCalls[0];
    expect(url).toBe('redis://localhost:6379');
    expect(opts).toMatchObject({ lazyConnect: true });
  });

  it('passes custom queuePrefix to Redis keys', async () => {
    const client = createClient({ queuePrefix: 'custom:prefix' });
    const r = mockRedis();

    await client.enqueueSession('session-prefix');

    const lremKey = (r.lrem as ReturnType<typeof vi.fn>).mock.calls[0][0];
    const rpushKey = (r.rpush as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(lremKey).toContain('custom:prefix');
    expect(rpushKey).toContain('custom:prefix');
  });

  it('passes TLS config when tls is true', () => {
    createClient({ url: 'rediss://secure.upstash.com:6379', tls: true });
    const [, opts] = hoisted.redisConstructorCalls[hoisted.redisConstructorCalls.length - 1];
    expect(opts).toMatchObject({ tls: { rejectUnauthorized: false } });
  });

  it('omits TLS when tls is explicitly false', () => {
    createClient({ url: 'redis://localhost:6379', tls: false });
    const [, opts] = hoisted.redisConstructorCalls[hoisted.redisConstructorCalls.length - 1];
    expect(opts).toHaveProperty('tls', undefined);
  });

  it('respects custom connectTimeout', () => {
    createClient({ connectTimeout: 5000 });
    const [, opts] = hoisted.redisConstructorCalls[hoisted.redisConstructorCalls.length - 1];
    expect(opts).toMatchObject({ connectTimeout: 5000 });
  });

  it('logs disconnect message via console.log', async () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const client = createClient();
    await client.enqueueSession('s1');
    await client.disconnect();
    expect(spy).toHaveBeenCalledWith('[RedisQueue] Disconnected');
    spy.mockRestore();
  });
});
