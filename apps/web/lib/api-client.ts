import { env } from './config';
import { logger } from './secure-logger';
import { getTokenWithRetry } from './auth-utils';

/**
 * 🔱 GOD-TIER API CLIENT
 * Encapsulates authentication, retries, and error handling.
 */
export class APIClient {
  private static async getAuthToken(getToken: () => Promise<string | null>): Promise<string | null> {
    return getTokenWithRetry(getToken);
  }

  /**
   * Authenticated POST request
   */
  public static async post(url: string, body: any, getToken: () => Promise<string | null>) {
    const token = await this.getAuthToken(getToken);
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
    if (env.api.huggingFaceToken) {
      (headers as Record<string, string>)['X-HF-Token'] = env.api.huggingFaceToken;
    }

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        credentials: 'include'
      });

      const data = await res.json();
      logger.debug('[APIClient] POST completed', { path: url, status: res.status });
      return data;
    } catch (error) {
      logger.error('[APIClient] POST failed', { path: url, error });
      throw error;
    }
  }

  /**
   * Authenticated GET request
   */
  public static async get(url: string, getToken?: () => Promise<string | null>) {
    const headers: HeadersInit = {};

    if (getToken) {
      const token = await this.getAuthToken(getToken);
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }
    if (env.api.huggingFaceToken) {
      (headers as Record<string, string>)['X-HF-Token'] = env.api.huggingFaceToken;
    }

    try {
      const res = await fetch(url, {
        method: 'GET',
        headers,
        credentials: 'include'
      });

      const data = await res.json();
      logger.debug('[APIClient] GET completed', { path: url, status: res.status });
      return data;
    } catch (error) {
      logger.error('[APIClient] GET failed', { path: url, error });
      throw error;
    }
  }
}
