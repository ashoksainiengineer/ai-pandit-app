import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { mockQuery, MockPool } = vi.hoisted(() => {
  const query = vi.fn();

  return {
    mockQuery: query,
    MockPool: vi.fn(function MockPool() {
      return {
        query,
        end: vi.fn(),
      };
    }),
  };
});

vi.mock('pg', () => ({
  Pool: MockPool,
}));

vi.mock('drizzle-orm/node-postgres', () => ({
  drizzle: vi.fn(() => ({
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  })),
}));

import { checkDatabaseHealth, executeWithTimeout } from '../drizzle.js';

describe('Postgres database connectivity and timeout resilience', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('reports healthy status when the database responds', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ '?column?': 1 }] });

    const health = await checkDatabaseHealth();

    expect(health.healthy).toBe(true);
    expect(health.error).toBeUndefined();
  });

  it('surfaces connection errors through the health check result', async () => {
    mockQuery.mockRejectedValueOnce(new Error('Connection refused'));

    const health = await checkDatabaseHealth();

    expect(health.healthy).toBe(false);
    expect(health.error).toBe('Connection refused');
  });

  it('enforces query timeouts for slow operations', async () => {
    const slowOperation = () =>
      new Promise((resolve) => {
        setTimeout(() => resolve('done'), 1000);
      });

    const promise = executeWithTimeout(slowOperation, 100);
    const assertion = expect(promise).rejects.toThrow('Query timeout after 100ms');

    await vi.advanceTimersByTimeAsync(200);
    await assertion;
  });
});
