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
    console.warn(`🚀 [DEBUG] APIClient POST: ${url}`);
    const token = await this.getAuthToken(getToken);

    if (!token) {
      console.error(`❌ [DEBUG] CRITICAL: Token retrieval FAILED for: ${url}. Request will likely 401.`);
      // Continue anyway to see backend response, but with loud warning
    } else {
      console.warn(`✅ [DEBUG] Token retrieval SUCCESS (len: ${token.length})`);
    }

    // DUAL-CHANNEL AUTH: Header + Query Param
    const separator = url.includes('?') ? '&' : '?';
    const finalUrl = token ? `${url}${separator}sid=${encodeURIComponent(token)}` : url;

    try {
      const res = await fetch(finalUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : 'Bearer missing'
        },
        body: JSON.stringify(body),
        credentials: 'include'
      });

      const data = await res.json();
      console.warn(`📩 [DEBUG] Response Status: ${res.status}`, data);

      return data;
    } catch (error: any) {
      console.error(`🔥 [DEBUG] Network error during POST: ${url}`, error.message);
      throw error;
    }
  }

  /**
   * Authenticated GET request
   */
  public static async get(url: string, getToken?: () => Promise<string | null>) {
    console.warn(`🔍 [DEBUG] APIClient GET: ${url}`);
    const headers: HeadersInit = {};
    let finalUrl = url;

    if (getToken) {
      const token = await this.getAuthToken(getToken);
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        const separator = url.includes('?') ? '&' : '?';
        finalUrl = `${url}${separator}sid=${encodeURIComponent(token)}`;
        console.warn(`✅ [DEBUG] Token acquired for GET (prefix: ${token.substring(0, 10)}...)`);
      } else {
        console.warn(`⚠️ [DEBUG] Token retrieval failed for GET: ${url}`);
      }
    }

    try {
      const res = await fetch(finalUrl, {
        method: 'GET',
        headers,
        credentials: 'include'
      });

      const data = await res.json();
      console.log(`📩 [DEBUG] Response from ${url}:`, { status: res.status });

      return data;
    } catch (error: any) {
      console.error(`🔥 [DEBUG] GET failed: ${url}`, error.message);
      throw error;
    }
  }
}
