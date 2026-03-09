/**
 * Hugging Face Space API Client
 * Handles cold starts, retries, and wake-up detection
 */

import { logger } from './logger';
import { env } from './config';

interface HFApiConfig {
  baseUrl: string;
  timeout?: number;
  wakeUpTimeout?: number;
  retries?: number;
}

interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  isColdStart: boolean;
  retryAfter?: number;
}

const DEFAULT_CONFIG: Required<HFApiConfig> = {
  baseUrl: env.api.backendUrl,
  timeout: 10000,      // Normal timeout: 10 seconds
  wakeUpTimeout: 60000, // Cold start timeout: 60 seconds
  retries: 2,
};

/**
 * Check if error indicates HF Space is sleeping
 */
function isColdStartError(error: unknown): boolean {
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    return (
      msg.includes('timeout') ||
      msg.includes('econnrefused') ||
      msg.includes('ENOTFOUND') ||
      msg.includes('fetch failed') ||
      msg.includes('network error')
    );
  }
  return false;
}

/**
 * Fetch with cold start handling
 */
export async function fetchWithColdStartHandling<T>(
  url: string,
  options: RequestInit = {},
  config: Partial<HFApiConfig> = {}
): Promise<ApiResponse<T>> {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  const fullUrl = url.startsWith('http') ? url : `${mergedConfig.baseUrl}${url}`;

  let lastError: Error | null = null;
  let isColdStart = false;

  for (let attempt = 1; attempt <= mergedConfig.retries; attempt++) {
    try {
      const controller = new AbortController();

      // Use longer timeout for potential cold start
      const timeoutMs = isColdStart ? mergedConfig.wakeUpTimeout : mergedConfig.timeout;
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      const headers = { ...options.headers } as Record<string, string>;

      const response = await fetch(fullUrl, {
        ...options,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      return {
        data,
        error: null,
        isColdStart,
        retryAfter: isColdStart ? undefined : undefined,
      };
    } catch (error) {
      lastError = error as Error;

      if (isColdStartError(error)) {
        isColdStart = true;
        logger.warn(`HF Space cold start detected (attempt ${attempt})`);

        if (attempt < mergedConfig.retries) {
          // Wait longer for cold start wake-up
          const delay = attempt === 1 ? 5000 : 10000;
          logger.info(`Waiting ${delay}ms for HF Space to wake up...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      } else {
        // Non-cold-start error, don't retry
        break;
      }
    }
  }

  return {
    data: null,
    error: lastError?.message || 'Unknown error',
    isColdStart,
  };
}

/**
 * Check HF Space health with cold start awareness
 */
export async function checkHFHealth(config?: Partial<HFApiConfig>): Promise<{
  healthy: boolean;
  isColdStart: boolean;
  message: string;
}> {
  const result = await fetchWithColdStartHandling('/health', {}, config);

  if (result.isColdStart && result.error) {
    return {
      healthy: false,
      isColdStart: true,
      message: 'HF Space is waking up from sleep (30-60 seconds)',
    };
  }

  if (result.error) {
    return {
      healthy: false,
      isColdStart: false,
      message: result.error,
    };
  }

  return {
    healthy: true,
    isColdStart: false,
    message: 'HF Space is healthy',
  };
}

/**
 * Pre-warm HF Space (call on user interaction)
 */
export async function prewarmHFSpace(config?: Partial<HFApiConfig>): Promise<boolean> {
  try {
    const result = await fetchWithColdStartHandling('/ping', { method: 'HEAD' }, {
      ...config,
      timeout: 5000, // Quick check
    });

    return !result.error;
  } catch {
    return false;
  }
}
