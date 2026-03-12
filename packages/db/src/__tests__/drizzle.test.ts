import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { mockQuery, mockEnd, MockPool } = vi.hoisted(() => {
  const query = vi.fn();
  const end = vi.fn();

  return {
    mockQuery: query,
    mockEnd: end,
    MockPool: vi.fn(function MockPool() {
      return {
        query,
        end,
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

import {
  checkDatabaseHealth,
  closeDatabaseConnection,
  executeWithRetry,
  executeWithTimeout,
} from '../drizzle.js';

describe('database helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('reports a healthy database when SELECT 1 succeeds', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ '?column?': 1 }] });

    const health = await checkDatabaseHealth();

    expect(health.healthy).toBe(true);
    expect(health.error).toBeUndefined();
  });

  it('reports unhealthy status when the connection fails', async () => {
    mockQuery.mockRejectedValueOnce(new Error('Connection failed'));

    const health = await checkDatabaseHealth();

    expect(health.healthy).toBe(false);
    expect(health.error).toBe('Connection failed');
  });

  it('resolves executeWithTimeout when the operation finishes in time', async () => {
    const operation = vi.fn().mockResolvedValue('success');
    const promise = executeWithTimeout(operation, 1000);
    const assertion = expect(promise).resolves.toBe('success');

    await vi.runAllTimersAsync();
    await assertion;
  });

  it('rejects executeWithTimeout when the operation exceeds the timeout', async () => {
    const operation = vi.fn(() => new Promise<string>(() => undefined));

    const promise = executeWithTimeout(operation, 1000);
    const assertion = expect(promise).rejects.toThrow('Query timeout after 1000ms');
    await vi.advanceTimersByTimeAsync(1500);
    await assertion;
  });

  it('retries transient Postgres-style failures until success', async () => {
    const operation = vi
      .fn()
      .mockRejectedValueOnce(new Error('connection terminated unexpectedly'))
      .mockRejectedValueOnce(new Error('too many connections'))
      .mockResolvedValueOnce('success');

    const promise = executeWithRetry(operation, 3);
    const assertion = expect(promise).resolves.toBe('success');

    await vi.advanceTimersByTimeAsync(1200);
    await vi.advanceTimersByTimeAsync(2200);
    await assertion;
    expect(operation).toHaveBeenCalledTimes(3);
  });

  it('does not retry non-transient query errors', async () => {
    const operation = vi.fn().mockRejectedValue(new Error('column "oops" does not exist'));

    await expect(executeWithRetry(operation, 3)).rejects.toThrow('column "oops" does not exist');
    expect(operation).toHaveBeenCalledTimes(1);
  });

  it('closes the underlying pool cleanly', async () => {
    await closeDatabaseConnection();
    expect(mockEnd).toHaveBeenCalledTimes(1);
  });
});
