import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const appendJobEventMock = vi.fn();
const getLatestJobForSessionMock = vi.fn();

vi.mock('@ai-pandit/db/jobs', () => ({
  appendJobEvent: appendJobEventMock,
  getLatestJobForSession: getLatestJobForSessionMock,
}));

vi.mock('../logger.js', () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

describe('SessionEventManager persistence filter', () => {
  const SESSION_ID = 'persist-filter-session';

  beforeEach(async () => {
    vi.resetModules();
    appendJobEventMock.mockReset();
    getLatestJobForSessionMock.mockReset();
    getLatestJobForSessionMock.mockResolvedValue({ id: 'job-123' });
    process.env.NODE_ENV = 'production';
  });

  afterEach(async () => {
    const { sessionEvents } = await import('../session-events.js');
    sessionEvents.cleanup(SESSION_ID);
    process.env.NODE_ENV = 'test';
  });

  it('persists durable progress events', async () => {
    const { sessionEvents } = await import('../session-events.js');

    sessionEvents.emit(SESSION_ID, {
      type: 'progress',
      step: 'grid',
      stepIndex: 1,
      totalSteps: 7,
      percentage: 14,
      message: 'Stage 1',
    } as any);

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(getLatestJobForSessionMock).toHaveBeenCalledWith(SESSION_ID);
    expect(appendJobEventMock).toHaveBeenCalledTimes(1);
    expect(appendJobEventMock.mock.calls[0][0]).toMatchObject({
      jobId: 'job-123',
      sessionId: SESSION_ID,
      eventType: 'progress',
    });
  });

  it('persists ai_thinking events for replayability', async () => {
    const { sessionEvents } = await import('../session-events.js');

    sessionEvents.emit(SESSION_ID, {
      type: 'ai_thinking',
      chunk: 'thinking...',
      stage: 2,
      candidateTime: 'R1-B1',
    } as any);

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(getLatestJobForSessionMock).toHaveBeenCalledWith(SESSION_ID);
    expect(appendJobEventMock).toHaveBeenCalledTimes(1);
    expect(appendJobEventMock.mock.calls[0][0]).toMatchObject({
      jobId: 'job-123',
      sessionId: SESSION_ID,
      eventType: 'ai_thinking',
    });
  });

  it('persists candidate score snapshots for replayability', async () => {
    const { sessionEvents } = await import('../session-events.js');

    sessionEvents.emit(SESSION_ID, {
      type: 'candidate_scores',
      data: [{ type: 'candidate_score_v2', time: '10:30:00', score: 80, stage: 2 }],
    } as any);

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(getLatestJobForSessionMock).toHaveBeenCalledWith(SESSION_ID);
    expect(appendJobEventMock).toHaveBeenCalledTimes(1);
    expect(appendJobEventMock.mock.calls[0][0]).toMatchObject({
      jobId: 'job-123',
      sessionId: SESSION_ID,
      eventType: 'candidate_scores',
    });
  });

  it('persists decision events for replayability', async () => {
    const { sessionEvents } = await import('../session-events.js');

    sessionEvents.emit(SESSION_ID, {
      type: 'decision',
      stage: 2,
      time: '10:30:00',
      verdict: 'promoted',
      score: 80,
      reason: 'Contextual AI scoring',
      batch: 1,
    } as any);

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(getLatestJobForSessionMock).toHaveBeenCalledWith(SESSION_ID);
    expect(appendJobEventMock).toHaveBeenCalledTimes(1);
    expect(appendJobEventMock.mock.calls[0][0]).toMatchObject({
      jobId: 'job-123',
      sessionId: SESSION_ID,
      eventType: 'decision',
    });
  });
});
