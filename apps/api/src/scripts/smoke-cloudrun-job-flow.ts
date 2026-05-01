import './load-env.js';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { logger } from '../lib/logger.js';
import { resolveSmokeBearerToken } from './get-smoke-token.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DEFAULT_SMOKE_PAYLOAD_PATH = path.resolve(__dirname, 'fixtures', 'smoke-job-payload.json');
const BASE_POLL_INTERVAL_MS = 10000;
const RATE_LIMIT_POLL_INTERVAL_MS = 45000;
const RUNNING_QUEUE_POLL_EVERY = 3;
const DEFAULT_SMOKE_TIMEOUT_MS = 20 * 60 * 1000;

function formatUnknownError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'object' && error !== null) {
    try {
      return JSON.stringify(error, Object.getOwnPropertyNames(error));
    } catch {
      return String(error);
    }
  }

  return String(error);
}

interface JobCreateResponse {
  success: boolean;
  data?: {
    job?: {
      id: string;
      sessionId: string;
    };
  };
}

interface JobSyncResponse {
  success: boolean;
  data?: {
    job?: {
      id: string;
      status?: string;
      errorCode?: string | null;
      errorMessage?: string | null;
      sessionStatus?: string | null;
    };
    latestSequenceNo?: number;
    events?: Array<{
      sequenceNo: number;
      eventType: string;
      stage: string | null;
    }>;
  };
}

interface QueueResponse {
  success: boolean;
  data?: {
    status?: string;
    error?: string;
    position?: number;
    estimatedWaitSeconds?: number;
  };
}

interface SseEventEnvelope {
  type?: string;
  status?: string;
  message?: string;
  [key: string]: unknown;
}

async function loadPayload(): Promise<Record<string, unknown>> {
  const payloadPath = process.env.SMOKE_PAYLOAD_PATH || DEFAULT_SMOKE_PAYLOAD_PATH;
  const raw = await fs.readFile(payloadPath, 'utf8');
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch (error) {
    logger.error('Failed to parse smoke payload JSON', { payloadPath, error });
    throw new Error(`Invalid JSON in smoke payload file: ${payloadPath}`);
  }
}
  const payloadPath = process.env.SMOKE_PAYLOAD_PATH || DEFAULT_SMOKE_PAYLOAD_PATH;
  const raw = await fs.readFile(payloadPath, 'utf8');
  return JSON.parse(raw) as Record<string, unknown>;
}

async function createJob(
  apiBaseUrl: string,
  token: string,
  payload: Record<string, unknown>
): Promise<{ jobId: string; sessionId: string }> {
  const response = await fetch(`${apiBaseUrl}/api/jobs`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Idempotency-Key': `smoke-${Date.now()}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Job creation failed with HTTP ${response.status}`);
  }

  const body = (await response.json()) as JobCreateResponse;
  const job = body.data?.job;
  if (!body.success || !job?.id || !job.sessionId) {
    throw new Error('Job creation response did not include job identifiers');
  }

  return {
    jobId: job.id,
    sessionId: job.sessionId,
  };
}

async function openSmokeStream(
  apiBaseUrl: string,
  token: string,
  sessionId: string,
): Promise<void> {
  const response = await fetch(`${apiBaseUrl}/api/stream/${sessionId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'text/event-stream',
    },
  });

  if (!response.ok || !response.body) {
    throw new Error(`SSE stream failed with HTTP ${response.status}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { value, done } = await reader.read();
    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    const frames = buffer.split('\n\n');
    buffer = frames.pop() ?? '';

    for (const frame of frames) {
      const dataLine = frame
        .split('\n')
        .find((line) => line.startsWith('data: '));

      if (!dataLine) {
        continue;
      }

      try {
        const payload = JSON.parse(dataLine.slice(6)) as SseEventEnvelope;
        logger.info('Smoke SSE event received', {
          sessionId,
          type: payload.type,
          status: payload.status,
        });

        if (payload.type === 'connected' || payload.type === 'metadata' || payload.type === 'ai_thinking') {
          await reader.cancel();
          return;
        }

        if (payload.type === 'error') {
          throw new Error(`Analysis error: ${payload.message || 'Unknown error'}`);
        }

        if (payload.type === 'complete') {
          result = payload.result as AnalysisResult;
          await reader.cancel();
          return;
        }
      } catch (parseError) {
        logger.warn('Failed to parse SSE data line', { dataLine: dataLine.slice(0, 100), error: parseError });
        continue;
      }
      logger.info('Smoke SSE event received', {
        sessionId,
        type: payload.type,
        status: payload.status,
      });

      if (payload.type === 'connected' || payload.type === 'metadata' || payload.type === 'ai_thinking') {
        await reader.cancel();
        return;
      }
    }
  }
}

async function waitForTerminalState(
  apiBaseUrl: string,
  token: string,
  jobId: string,
  sessionId: string,
  timeoutMs: number
): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  let since = 0;
  let pollIntervalMs = BASE_POLL_INTERVAL_MS;
  let pollCount = 0;

  while (Date.now() < deadline) {
    try {
      pollCount += 1;
      const syncResponse = await fetch(`${apiBaseUrl}/api/jobs/${jobId}/sync?since=${since}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!syncResponse.ok) {
        throw new Error(`Job sync failed with HTTP ${syncResponse.status}`);
      }

      const syncPayload = (await syncResponse.json()) as JobSyncResponse;
      const job = syncPayload.data?.job;
      const latestSequenceNo = syncPayload.data?.latestSequenceNo ?? since;
      const recentEvents = syncPayload.data?.events ?? [];
      pollIntervalMs = BASE_POLL_INTERVAL_MS;

      if (latestSequenceNo > since) {
        logger.info('Smoke job sync advanced', {
          jobId,
          sessionId,
          status: job?.status,
          sessionStatus: job?.sessionStatus,
          latestSequenceNo,
          recentEventTypes: recentEvents.map((event) => event.eventType),
        });
        since = latestSequenceNo;
      }

      let queueStatus: string | undefined;
      let queuePosition: number | null = null;
      let queueEta: number | null = null;

      const shouldPollQueue = !job?.status || job.status === 'queued' || job.status === 'retrying' || (pollCount % RUNNING_QUEUE_POLL_EVERY === 0);
      if (shouldPollQueue) {
        const queueResponse = await fetch(`${apiBaseUrl}/api/queue?sessionId=${sessionId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!queueResponse.ok) {
          throw new Error(`Queue poll failed with HTTP ${queueResponse.status}`);
        }

        const queuePayload = (await queueResponse.json()) as QueueResponse;
        queueStatus = queuePayload.data?.status;
        queuePosition = queuePayload.data?.position ?? null;
        queueEta = queuePayload.data?.estimatedWaitSeconds ?? null;

        logger.info('Smoke queue status polled', {
          jobId,
          sessionId,
          jobStatus: job?.status,
          queueStatus,
          position: queuePosition,
          estimatedWaitSeconds: queueEta,
        });
      }

      if (queueStatus === 'complete' || job?.status === 'completed') {
        return;
      }

      if (queueStatus === 'failed' || queueStatus === 'cancelled' || job?.status === 'failed' || job?.status === 'cancelled') {
        throw new Error(job?.errorMessage || `Job ended with status ${job?.status || queueStatus}`);
      }
    } catch (error) {
      const message = formatUnknownError(error);
      if (message.includes('HTTP 429')) {
        pollIntervalMs = RATE_LIMIT_POLL_INTERVAL_MS;
      }

      logger.warn('Smoke polling transient failure', {
        jobId,
        sessionId,
        error: message,
        nextPollInMs: pollIntervalMs,
      });
    }

    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
  }

  throw new Error(`Timed out waiting for terminal job state after ${timeoutMs}ms`);
}

async function main(): Promise<void> {
  const apiBaseUrl = (process.env.SMOKE_API_BASE_URL || process.env.NEXT_PUBLIC_BACKEND_URL || '').replace(/\/+$/, '');
  if (!apiBaseUrl) {
    throw new Error('SMOKE_API_BASE_URL or NEXT_PUBLIC_BACKEND_URL is required');
  }

  const token = await resolveSmokeBearerToken();

  const timeoutMs = Number.parseInt(process.env.SMOKE_TIMEOUT_MS ?? String(DEFAULT_SMOKE_TIMEOUT_MS), 10);
  const payload = await loadPayload();

  const { jobId, sessionId } = await createJob(apiBaseUrl, token, payload);
  logger.info('Smoke job created', { jobId, sessionId });

  await openSmokeStream(apiBaseUrl, token, sessionId);
  await waitForTerminalState(apiBaseUrl, token, jobId, sessionId, timeoutMs);
  logger.info('Smoke flow reached terminal state', { jobId, sessionId });
}

main().catch((error) => {
  logger.error('Cloud Run smoke flow failed', {
    error: formatUnknownError(error),
  });
  process.exitCode = 1;
});
