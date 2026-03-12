import { describe, expect, it } from 'vitest';
import {
  artifacts,
  auditLogs,
  calculations,
  dataRetention,
  idempotencyKeys,
  jobAttempts,
  jobEvents,
  jobs,
  payments,
  sessionFavorites,
  sessions,
  users,
} from '../schema.js';

describe('database schema exports', () => {
  it('preserves the core existing tables', () => {
    expect(users).toHaveProperty('id');
    expect(users).toHaveProperty('clerkId');
    expect(sessions).toHaveProperty('id');
    expect(sessions).toHaveProperty('userId');
    expect(sessions).toHaveProperty('status');
    expect(sessionFavorites).toHaveProperty('sessionId');
    expect(calculations).toHaveProperty('ephemerisData');
    expect(payments).toHaveProperty('amountPaise');
    expect(auditLogs).toHaveProperty('action');
    expect(dataRetention).toHaveProperty('scheduledDeletionAt');
  });

  it('adds durable job orchestration tables required for async processing', () => {
    expect(jobs).toHaveProperty('sessionId');
    expect(jobs).toHaveProperty('status');
    expect(jobs).toHaveProperty('checkpointJson');
    expect(jobs).toHaveProperty('version');
    expect(jobs).toHaveProperty('retryCount');
    expect(jobs).toHaveProperty('retryReasonCode');
    expect(jobs).toHaveProperty('nextRetryAt');

    expect(jobAttempts).toHaveProperty('jobId');
    expect(jobAttempts).toHaveProperty('attemptNo');
    expect(jobAttempts).toHaveProperty('outcome');

    expect(jobEvents).toHaveProperty('jobId');
    expect(jobEvents).toHaveProperty('sequenceNo');
    expect(jobEvents).toHaveProperty('payloadJson');

    expect(idempotencyKeys).toHaveProperty('userId');
    expect(idempotencyKeys).toHaveProperty('requestHash');
    expect(idempotencyKeys).toHaveProperty('jobId');

    expect(artifacts).toHaveProperty('jobId');
    expect(artifacts).toHaveProperty('kind');
    expect(artifacts).toHaveProperty('uri');
  });
});
