import './load-env.js';
import { resolveSmokeBearerToken } from './get-smoke-token.js';

interface SessionListItem {
  id: string;
  status?: string;
}

const backendUrlRaw = process.env.SMOKE_BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL;
const useTestBypass = process.env.SMOKE_TEST_BYPASS === 'true';
const maxPolls = Number(process.env.SMOKE_MAX_POLLS || 18);
const pollIntervalMs = Number(process.env.SMOKE_POLL_INTERVAL_MS || 5000);

if (!backendUrlRaw) {
  throw new Error('Missing backend target. Set SMOKE_BACKEND_URL or NEXT_PUBLIC_BACKEND_URL to the deployed API service.');
}

const backendUrl = backendUrlRaw.replace(/\/$/, '');

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildHeaders(): HeadersInit {
  const bearerToken = process.env.SMOKE_CLERK_BEARER_TOKEN || process.env.CLERK_BEARER_TOKEN || '';
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (bearerToken) {
    headers.Authorization = `Bearer ${bearerToken}`;
  }

  if (useTestBypass) {
    headers['x-test-bypass-auth'] = 'super-secret-test-key';
  }

  return headers;
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${backendUrl}${path}`, {
    ...init,
    headers: {
      ...buildHeaders(),
      ...(init?.headers || {}),
    },
  });

  let payload: any = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} ${path}: ${JSON.stringify(payload)}`);
  }

  return payload as T;
}

async function main(): Promise<void> {
  if (!useTestBypass) {
    process.env.SMOKE_CLERK_BEARER_TOKEN = await resolveSmokeBearerToken();
  }

  const sessionsResponse = await requestJson<{ success: boolean; data: SessionListItem[] }>('/api/sessions', { method: 'GET' });
  if (!sessionsResponse.success) {
    throw new Error('Failed to list sessions');
  }

  const completed = sessionsResponse.data.find((s) => s.status === 'complete');
  if (!completed) {
    throw new Error('No completed session found to clone');
  }

  console.log(`[SMOKE] Using completed template session: ${completed.id}`);

  const cloneResponse = await requestJson<{ success: boolean; data?: { id: string } }>(
    `/api/sessions/${encodeURIComponent(completed.id)}/clone`,
    { method: 'POST' }
  );

  const clonedSessionId = cloneResponse.data?.id;
  if (!cloneResponse.success || !clonedSessionId) {
    throw new Error('Clone route did not return a valid cloned session id');
  }

  console.log(`[SMOKE] Clone created: ${clonedSessionId}`);

  const requeueResponse = await requestJson<{ success: boolean }>(
    '/api/queue/requeue',
    {
      method: 'POST',
      body: JSON.stringify({ sessionId: clonedSessionId }),
    }
  );

  if (!requeueResponse.success) {
    throw new Error('Requeue failed');
  }

  console.log('[SMOKE] Requeue accepted. Polling progress...');

  let terminalStatus: string | null = null;
  for (let attempt = 1; attempt <= maxPolls; attempt += 1) {
    await sleep(pollIntervalMs);
    const progress = await requestJson<{ status?: string; errorMessage?: string }>(
      `/api/queue/progress?sessionId=${encodeURIComponent(clonedSessionId)}`,
      { method: 'GET' }
    );

    const status = progress.status || 'unknown';
    console.log(`[SMOKE] poll=${attempt} status=${status}`);
    if (status === 'complete' || status === 'failed' || status === 'cancelled' || status === 'error') {
      terminalStatus = status;
      break;
    }
  }

  const deleteResponse = await requestJson<{ success: boolean }>(
    `/api/sessions/${encodeURIComponent(clonedSessionId)}`,
    { method: 'DELETE' }
  );
  if (!deleteResponse.success) {
    throw new Error('Delete failed for cloned session');
  }

  console.log(`[SMOKE] Cleanup delete success for ${clonedSessionId}`);
  console.log(`SMOKE_RESULT: template=${completed.id} clone=${clonedSessionId} terminalStatus=${terminalStatus ?? 'non-terminal'}`);
}

main().catch((error) => {
  console.error('[SMOKE] Failed:', error instanceof Error ? error.message : String(error));
  process.exit(1);
});
