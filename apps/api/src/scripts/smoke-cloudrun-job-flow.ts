import fs from 'node:fs/promises';
import { logger } from '../lib/logger.js';

interface JobCreateResponse {
  success: boolean;
  data?: {
    job?: {
      id: string;
      sessionId: string;
    };
  };
}

interface SseEventEnvelope {
  type?: string;
  status?: string;
  message?: string;
  [key: string]: unknown;
}

function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required`);
  }

  return value;
}

async function loadPayload(): Promise<Record<string, unknown>> {
  const payloadPath = getRequiredEnv('SMOKE_PAYLOAD_PATH');
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

async function streamUntilTerminal(
  apiBaseUrl: string,
  token: string,
  sessionId: string,
  timeoutMs: number
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
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const { value, done } = await reader.read();
    if (done) {
      throw new Error('SSE stream closed before terminal event');
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

      const payload = JSON.parse(dataLine.slice(6)) as SseEventEnvelope;
      logger.info('Smoke SSE event received', {
        sessionId,
        type: payload.type,
        status: payload.status,
      });

      if (
        payload.type === 'complete' ||
        payload.type === 'terminal_state' ||
        payload.type === 'error' ||
        payload.status === 'failed' ||
        payload.status === 'complete'
      ) {
        return;
      }
    }
  }

  throw new Error(`Timed out waiting for terminal SSE event after ${timeoutMs}ms`);
}

async function main(): Promise<void> {
  const apiBaseUrl = getRequiredEnv('SMOKE_API_BASE_URL').replace(/\/+$/, '');
  const token = getRequiredEnv('SMOKE_AUTH_TOKEN');
  const timeoutMs = Number.parseInt(process.env.SMOKE_TIMEOUT_MS ?? '600000', 10);
  const payload = await loadPayload();

  const { jobId, sessionId } = await createJob(apiBaseUrl, token, payload);
  logger.info('Smoke job created', { jobId, sessionId });

  await streamUntilTerminal(apiBaseUrl, token, sessionId, timeoutMs);
  logger.info('Smoke flow reached terminal state', { jobId, sessionId });
}

main().catch((error) => {
  logger.error('Cloud Run smoke flow failed', {
    error: error instanceof Error ? error.message : String(error),
  });
  process.exitCode = 1;
});
