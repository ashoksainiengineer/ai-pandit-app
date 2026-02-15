/**
 * API Client with Error Handling, Timeouts, and Automatic Retries
 * Provides a robust wrapper around fetch with proper error handling
 */

import { logger } from './logger';
import { env } from './config';

interface ApiClientConfig {
  baseUrl?: string;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

interface RequestConfig extends RequestInit {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  status: number;
  ok: boolean;
}

// Default configuration
const DEFAULT_CONFIG: Required<ApiClientConfig> = {
  baseUrl: env.api.backendUrl,
  timeout: 30000, // 30 seconds
  retries: 3,
  retryDelay: 1000, // 1 second
};

// Custom error classes
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public statusText: string,
    public data?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class NetworkError extends Error {
  constructor(message: string = 'Network error. Please check your connection.') {
    super(message);
    this.name = 'NetworkError';
  }
}

export class TimeoutError extends Error {
  constructor(message: string = 'Request timed out. Please try again.') {
    super(message);
    this.name = 'TimeoutError';
  }
}

export class AuthError extends Error {
  constructor(message: string = 'Authentication required. Please sign in.') {
    super(message);
    this.name = 'AuthError';
  }
}

/**
 * Check if an error is retryable
 */
function isRetryableError(error: unknown): boolean {
  if (error instanceof NetworkError) return true;
  if (error instanceof TimeoutError) return true;
  if (error instanceof ApiError) {
    // Retry on server errors (5xx) and rate limiting (429)
    return error.status >= 500 || error.status === 429;
  }
  return false;
}

/**
 * Delay function for retry backoff
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Fetch with timeout
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new TimeoutError();
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Make an API request with automatic retry logic
 */
async function makeRequest<T>(
  endpoint: string,
  config: RequestConfig = {}
): Promise<ApiResponse<T>> {
  const {
    timeout = DEFAULT_CONFIG.timeout,
    retries = DEFAULT_CONFIG.retries,
    retryDelay = DEFAULT_CONFIG.retryDelay,
    ...fetchOptions
  } = config;

  const url = endpoint.startsWith('http')
    ? endpoint
    : `${DEFAULT_CONFIG.baseUrl}${endpoint}`;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      logger.debug(`API request attempt ${attempt + 1}/${retries}`, { url, method: fetchOptions.method });

      const response = await fetchWithTimeout(url, fetchOptions, timeout);

      // Handle 401 - Unauthorized
      if (response.status === 401) {
        // Redirect to login or trigger auth refresh
        if (typeof window !== 'undefined') {
          window.location.href = '/sign-in';
        }
        throw new AuthError();
      }

      // Handle 403 - Forbidden
      if (response.status === 403) {
        throw new ApiError(
          'You do not have permission to access this resource.',
          403,
          'Forbidden'
        );
      }

      // Parse response
      let data: T | null = null;
      const contentType = response.headers.get('content-type');

      if (contentType?.includes('application/json')) {
        data = await response.json();
      } else if (response.status !== 204) {
        const text = await response.text();
        data = text as unknown as T;
      }

      // Handle error responses
      if (!response.ok) {
        const errorMessage = (data as any)?.message || (data as any)?.error || `Request failed with status ${response.status}`;
        throw new ApiError(errorMessage, response.status, response.statusText, data);
      }

      return {
        data,
        error: null,
        status: response.status,
        ok: true,
      };

    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't retry auth errors
      if (error instanceof AuthError) {
        throw error;
      }

      // Check if we should retry
      if (attempt < retries - 1 && isRetryableError(error)) {
        const backoffDelay = retryDelay * Math.pow(2, attempt);
        logger.warn(`Request failed, retrying in ${backoffDelay}ms`, { error: lastError.message });
        await delay(backoffDelay);
        continue;
      }

      // If not retryable or last attempt, throw
      throw error;
    }
  }

  // This should not be reached, but TypeScript needs it
  throw lastError || new Error('Request failed');
}

/**
 * API Client methods
 */
export const apiClient = {
  /**
   * GET request
   */
  async get<T>(endpoint: string, config: RequestConfig = {}): Promise<ApiResponse<T>> {
    return makeRequest<T>(endpoint, { ...config, method: 'GET' });
  },

  /**
   * POST request
   */
  async post<T>(endpoint: string, body: unknown, config: RequestConfig = {}): Promise<ApiResponse<T>> {
    return makeRequest<T>(endpoint, {
      ...config,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...config.headers,
      },
      body: JSON.stringify(body),
    });
  },

  /**
   * PUT request
   */
  async put<T>(endpoint: string, body: unknown, config: RequestConfig = {}): Promise<ApiResponse<T>> {
    return makeRequest<T>(endpoint, {
      ...config,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...config.headers,
      },
      body: JSON.stringify(body),
    });
  },

  /**
   * PATCH request
   */
  async patch<T>(endpoint: string, body: unknown, config: RequestConfig = {}): Promise<ApiResponse<T>> {
    return makeRequest<T>(endpoint, {
      ...config,
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...config.headers,
      },
      body: JSON.stringify(body),
    });
  },

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string, config: RequestConfig = {}): Promise<ApiResponse<T>> {
    return makeRequest<T>(endpoint, { ...config, method: 'DELETE' });
  },
};

/**
 * Hook for handling API errors with toast notifications
 * Usage: const { handleError } = useApiError();
 */
export function useApiError() {
  const handleError = (error: unknown): string => {
    if (error instanceof AuthError) {
      return 'Please sign in to continue.';
    }

    if (error instanceof TimeoutError) {
      return 'The request took too long. Please try again.';
    }

    if (error instanceof NetworkError) {
      return 'Network connection failed. Please check your internet connection.';
    }

    if (error instanceof ApiError) {
      // Return user-friendly message based on status code
      switch (error.status) {
        case 400:
          return error.message || 'Invalid request. Please check your input.';
        case 403:
          return 'You do not have permission to perform this action.';
        case 404:
          return 'The requested resource was not found.';
        case 409:
          return 'This action conflicts with the current state. Please refresh and try again.';
        case 422:
          return error.message || 'Validation failed. Please check your input.';
        case 429:
          return 'Too many requests. Please wait a moment and try again.';
        case 500:
          return 'An unexpected error occurred. Our team has been notified.';
        case 502:
        case 503:
        case 504:
          return 'Service temporarily unavailable. Please try again later.';
        default:
          return error.message || 'An unexpected error occurred.';
      }
    }

    if (error instanceof Error) {
      return error.message;
    }

    return 'An unexpected error occurred.';
  };

  return { handleError };
}

export default apiClient;
