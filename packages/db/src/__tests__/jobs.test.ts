import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  selectMock,
  insertValuesMock,
  updateSetMock,
  returningMock,
  insertMock,
  updateMock,
  executeWithRetryMock,
} = vi.hoisted(() => {
  const returning = vi.fn();
  const insertValues = vi.fn(() => ({ returning }));
  const updateSet = vi.fn(() => ({ where: vi.fn(() => ({ returning })) }));
  const selectLimit = vi.fn();
  const selectOrderBy = vi.fn(() => ({ limit: selectLimit }));
  const selectWhere = vi.fn(() => ({ limit: selectLimit, orderBy: selectOrderBy }));
  const select = vi.fn(() => ({ from: vi.fn(() => ({ where: selectWhere, orderBy: selectOrderBy })) }));
  const insert = vi.fn(() => ({ values: insertValues }));
  const update = vi.fn(() => ({ set: updateSet }));
  const executeWithRetry = vi.fn(async (operation: () => Promise<unknown>) => operation());

  return {
    selectMock: select,
    insertValuesMock: insertValues,
    updateSetMock: updateSet,
    returningMock: returning,
    insertMock: insert,
    updateMock: update,
    executeWithRetryMock: executeWithRetry,
  };
});

vi.mock('../drizzle.js', () => ({
  db: {
    select: selectMock,
    insert: insertMock,
    update: updateMock,
  },
  executeWithRetry: executeWithRetryMock,
}));

import {
  appendJobEvent,
  completeJobAttempt,
  createArtifact,
  createJob,
  getJobById,
  getLatestArtifactForJobByKind,
  requestJobCancellation,
  scheduleJobRetry,
  updateJobAttemptHeartbeat,
} from '../jobs.js';

describe('job repository helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates a job with durable defaults', async () => {
    const jobRow = {
      id: 'job_1',
      sessionId: 'session_1',
      userId: 'user_1',
      kind: 'btr_rectification',
      status: 'queued',
      progressPercent: 0,
      priority: 100,
      attempt: 0,
      maxAttempts: 3,
      retryCount: 0,
      retryReasonCode: null,
      nextRetryAt: null,
      queuedAt: '2026-03-11T10:00:00.000Z',
      startedAt: null,
      heartbeatAt: null,
      finishedAt: null,
      cancelRequestedAt: null,
      errorCode: null,
      errorMessage: null,
      currentStage: null,
      checkpointJson: null,
      cursorJson: null,
      resultJson: null,
      version: 0,
      createdAt: '2026-03-11T10:00:00.000Z',
      updatedAt: '2026-03-11T10:00:00.000Z',
    };
    returningMock.mockResolvedValueOnce([jobRow]);

    const job = await createJob({
      id: 'job_1',
      sessionId: 'session_1',
      userId: 'user_1',
    });

    expect(insertMock).toHaveBeenCalledTimes(1);
    expect(insertValuesMock).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'job_1',
        sessionId: 'session_1',
        userId: 'user_1',
        kind: 'btr_rectification',
        status: 'queued',
      })
    );
    expect(job).toEqual(jobRow);
  });

  it('returns a job by identifier when present', async () => {
    const jobRow = { id: 'job_2', status: 'queued' };
    const limitMock = vi.fn().mockResolvedValueOnce([jobRow]);
    const orderByMock = vi.fn(() => ({ limit: limitMock }));
    const whereMock = vi.fn(() => ({ limit: limitMock, orderBy: orderByMock }));
    const fromMock = vi.fn(() => ({ where: whereMock, orderBy: orderByMock }));
    selectMock.mockReturnValueOnce({ from: fromMock });

    const job = await getJobById('job_2');

    expect(job).toEqual(jobRow);
  });

  it('marks cancellation once and falls back to existing row when already requested', async () => {
    const updatedJob = { id: 'job_3', cancelRequestedAt: '2026-03-11T10:00:00.000Z' };
    returningMock.mockResolvedValueOnce([updatedJob]);

    const firstAttempt = await requestJobCancellation('job_3');

    expect(firstAttempt).toEqual(updatedJob);

    returningMock.mockResolvedValueOnce([]);

    const limitMock = vi.fn().mockResolvedValueOnce([updatedJob]);
    const orderByMock = vi.fn(() => ({ limit: limitMock }));
    const whereMock = vi.fn(() => ({ limit: limitMock, orderBy: orderByMock }));
    const fromMock = vi.fn(() => ({ where: whereMock, orderBy: orderByMock }));
    selectMock.mockReturnValueOnce({ from: fromMock });

    const secondAttempt = await requestJobCancellation('job_3');

    expect(secondAttempt).toEqual(updatedJob);
  });

  it('appends job events with the provided payload', async () => {
    const eventRow = {
      id: 'evt_1',
      jobId: 'job_4',
      sessionId: 'session_4',
      sequenceNo: 1,
      eventType: 'job.queued',
      stage: null,
      payloadJson: { status: 'queued' },
      createdAt: '2026-03-11T10:00:00.000Z',
    };
    returningMock.mockResolvedValueOnce([eventRow]);

    const event = await appendJobEvent({
      id: 'evt_1',
      jobId: 'job_4',
      sessionId: 'session_4',
      sequenceNo: 1,
      eventType: 'job.queued',
      payloadJson: { status: 'queued' },
    });

    expect(event).toEqual(eventRow);
    expect(insertValuesMock).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'evt_1',
        eventType: 'job.queued',
        payloadJson: { status: 'queued' },
      })
    );
  });

  it('updates attempt heartbeat and checkpoint payload', async () => {
    const attemptRow = {
      id: 'attempt_1',
      heartbeatAt: '2026-03-11T10:05:00.000Z',
      checkpointJson: { stage: 'stage_4' },
    };
    returningMock.mockResolvedValueOnce([attemptRow]);

    const attempt = await updateJobAttemptHeartbeat({
      attemptId: 'attempt_1',
      checkpointJson: { stage: 'stage_4' },
    });

    expect(attempt).toEqual(attemptRow);
    expect(updateSetMock).toHaveBeenCalledWith(
      expect.objectContaining({
        checkpointJson: { stage: 'stage_4' },
      })
    );
  });

  it('finalizes job attempts with explicit outcomes', async () => {
    const attemptRow = {
      id: 'attempt_2',
      outcome: 'failed',
      failureReason: 'network timeout',
    };
    returningMock.mockResolvedValueOnce([attemptRow]);

    const attempt = await completeJobAttempt({
      attemptId: 'attempt_2',
      outcome: 'failed',
      failureReason: 'network timeout',
    });

    expect(attempt).toEqual(attemptRow);
    expect(updateSetMock).toHaveBeenCalledWith(
      expect.objectContaining({
        outcome: 'failed',
        failureReason: 'network timeout',
      })
    );
  });

  it('creates artifacts for durable failure snapshots', async () => {
    const artifactRow = {
      id: 'artifact_1',
      jobId: 'job_5',
      sessionId: 'session_5',
      kind: 'other',
      uri: 'dlq://job/job_5',
      mimeType: 'application/json',
      metadataJson: { reason: 'max_attempts_exceeded' },
      createdAt: '2026-03-11T10:10:00.000Z',
    };
    returningMock.mockResolvedValueOnce([artifactRow]);

    const artifact = await createArtifact({
      id: 'artifact_1',
      jobId: 'job_5',
      sessionId: 'session_5',
      uri: 'dlq://job/job_5',
      metadataJson: { reason: 'max_attempts_exceeded' },
    });

    expect(artifact).toEqual(artifactRow);
    expect(insertValuesMock).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'artifact_1',
        jobId: 'job_5',
        uri: 'dlq://job/job_5',
      })
    );
  });

  it('schedules retries with reason code and wake-up timestamp', async () => {
    const jobRow = {
      id: 'job_retry_1',
      status: 'retrying',
      retryCount: 2,
      retryReasonCode: 'network_error',
      nextRetryAt: '2026-03-11T10:15:00.000Z',
    };
    returningMock.mockResolvedValueOnce([jobRow]);

    const job = await scheduleJobRetry({
      jobId: 'job_retry_1',
      retryCount: 2,
      retryReasonCode: 'network_error',
      nextRetryAt: '2026-03-11T10:15:00.000Z',
      errorMessage: 'socket hang up',
    });

    expect(job).toEqual(jobRow);
    expect(updateSetMock).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'retrying',
        retryCount: 2,
        retryReasonCode: 'network_error',
        nextRetryAt: '2026-03-11T10:15:00.000Z',
      })
    );
  });

  it('returns the latest artifact by kind for a job', async () => {
    const artifactRow = {
      id: 'artifact_report_1',
      jobId: 'job_9',
      kind: 'dead_letter_report',
      uri: 'gs://bucket/job_9/report.json',
    };
    const limitMock = vi.fn().mockResolvedValueOnce([artifactRow]);
    const orderByMock = vi.fn(() => ({ limit: limitMock }));
    const whereMock = vi.fn(() => ({ limit: limitMock, orderBy: orderByMock }));
    const fromMock = vi.fn(() => ({ where: whereMock, orderBy: orderByMock }));
    selectMock.mockReturnValueOnce({ from: fromMock });

    const artifact = await getLatestArtifactForJobByKind('job_9', 'dead_letter_report');

    expect(artifact).toEqual(artifactRow);
  });
});
