import { getTokenWithRetry } from './auth-utils';

const READINESS_MAX_ATTEMPTS = 12;
const READINESS_DELAY_MS = 1000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function waitForAnalysisSessionReady(
  backendUrl: string,
  sessionId: string,
  getToken: () => Promise<string | null>
): Promise<boolean> {
  const normalizedBackendUrl = backendUrl.replace(/\/$/, '');

  for (let attempt = 1; attempt <= READINESS_MAX_ATTEMPTS; attempt++) {
    const token = await getTokenWithRetry(getToken, { skipCache: attempt > 1 });
    const headers: HeadersInit = token
      ? { Authorization: `Bearer ${token}` }
      : {};

    try {
      const res = await fetch(
        `${normalizedBackendUrl}/api/queue/progress?sessionId=${encodeURIComponent(sessionId)}`,
        {
          method: 'GET',
          headers,
          cache: 'no-store',
          credentials: 'include',
        }
      );

      if (res.ok) {
        return true;
      }

      if (res.status === 401 || res.status === 403) {
        return false;
      }
    } catch {
      // Retry transient network failures.
    }

    await sleep(READINESS_DELAY_MS);
  }

  return false;
}
