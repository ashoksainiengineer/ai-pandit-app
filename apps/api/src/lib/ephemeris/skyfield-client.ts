import {
  EphemerisServiceBatchRequestSchema,
  EphemerisServiceBatchResponseSchema,
  EphemerisServiceHealthResponseSchema,
  EphemerisServiceSingleRequestSchema,
  EphemerisServiceSunriseRequestSchema,
  EphemerisServiceSunriseResponseSchema,
} from '@ai-pandit/shared/schemas';
import type {
  EphemerisServiceChartResponse,
  EphemerisServiceBatchRequest,
  EphemerisServiceBatchResponse,
  EphemerisServiceHealthResponse,
  EphemerisServiceSingleRequest,
  EphemerisServiceSunriseRequest,
  EphemerisServiceSunriseResponse,
} from '@ai-pandit/shared/types';
import { config } from '../../config/index.js';
import { CalculationError } from '../../errors/index.js';
import { logger } from '../../utils/logger.js';

interface ResolvedEphemerisClientConfig {
  serviceUrl: string;
  serviceTimeoutMs: number;
}

const DEFAULT_EPHEMERIS_CLIENT_CONFIG: ResolvedEphemerisClientConfig = {
  serviceUrl: 'http://localhost:8000',
  serviceTimeoutMs: 15000,
};

function getEphemerisClientConfig(): ResolvedEphemerisClientConfig {
  return {
    ...DEFAULT_EPHEMERIS_CLIENT_CONFIG,
    ...(config as { ephemeris?: Partial<ResolvedEphemerisClientConfig> } | undefined)?.ephemeris,
  };
}

export class SkyfieldServiceError extends CalculationError {
  constructor(
    message: string,
    public readonly serviceStatusCode?: number,
    public readonly causeValue?: unknown
  ) {
    super(message, {
      serviceStatusCode,
      cause: causeValue,
      serviceUrl: getEphemerisClientConfig().serviceUrl,
    });
    this.name = 'SkyfieldServiceError';
  }
}

async function parseJsonResponse(response: Response): Promise<unknown> {
  const contentType = response.headers.get('content-type') || '';
  const url = response.url;
  
  try {
    return await response.json();
  } catch (error) {
    let bodyPreview = '';
    try {
      const text = await response.clone().text();
      bodyPreview = text.slice(0, 1000);
    } catch {
      bodyPreview = '<unreadable>';
    }

    logger.error('[SKYFIELD] Non-JSON response from ephemeris service', {
      status: response.status,
      statusText: response.statusText,
      contentType,
      url,
      bodyPreview,
    });

    throw new SkyfieldServiceError(
      `Skyfield service returned a non-JSON response (status: ${response.status}, url: ${url}, type: ${contentType}, body: ${bodyPreview.slice(0, 300)}...)`,
      response.status,
      error
    );
  }
}

async function requestJson<TRequest, TResponse>(
  path: string,
  body: TRequest,
  schema: { parse: (value: unknown) => TResponse },
  options?: { retries?: number; timeoutMs?: number }
): Promise<TResponse> {
  const ephemerisConfig = getEphemerisClientConfig();
  const maxRetries = options?.retries ?? 2;
  const timeoutMs = options?.timeoutMs ?? ephemerisConfig.serviceTimeoutMs;

  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      if (attempt > 0) {
        logger.info(`[SKYFIELD] Retry attempt ${attempt}/${maxRetries} for ${path}`);
        // Exponential backoff: 1s, 2s
        await new Promise(r => setTimeout(r, attempt * 1000));
      }

      const response = await fetch(new URL(path, ephemerisConfig.serviceUrl), {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      const payload = await parseJsonResponse(response);

      if (!response.ok) {
        throw new SkyfieldServiceError(
          `Skyfield service request failed for ${path}`,
          response.status,
          payload
        );
      }

      return schema.parse(payload);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (error instanceof SkyfieldServiceError) {
        // Retry on 5xx errors and network errors
        if (error.serviceStatusCode && error.serviceStatusCode >= 500 && error.serviceStatusCode < 600) {
          continue;
        }
        throw error;
      }

      // Retry on network/abort errors
      if (lastError.message.includes('abort') || lastError.message.includes('fetch failed')) {
        continue;
      }

      throw new SkyfieldServiceError(`Skyfield service request failed for ${path}`, undefined, error);
    } finally {
      clearTimeout(timeout);
    }
  }

  throw lastError || new SkyfieldServiceError(`Skyfield service request failed after ${maxRetries} retries for ${path}`);
}

export async function fetchSkyfieldHealth(): Promise<EphemerisServiceHealthResponse> {
  const controller = new AbortController();
  const ephemerisConfig = getEphemerisClientConfig();
  const timeout = setTimeout(() => controller.abort(), ephemerisConfig.serviceTimeoutMs);

  try {
    const response = await fetch(new URL('/health', ephemerisConfig.serviceUrl), {
      method: 'GET',
      signal: controller.signal,
    });
    const payload = await parseJsonResponse(response);

    if (!response.ok) {
      throw new SkyfieldServiceError('Skyfield health check failed', response.status, payload);
    }

    return EphemerisServiceHealthResponseSchema.parse(payload);
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchSkyfieldChart(
  request: EphemerisServiceSingleRequest
): Promise<EphemerisServiceChartResponse> {
  const validated = EphemerisServiceSingleRequestSchema.parse(request);
  const batchRequest: EphemerisServiceBatchRequest = {
    ...validated,
    timestampsUtc: [validated.timestampUtc],
  };

  const response = await fetchSkyfieldCharts(batchRequest);
  const chart = response.charts[0];

  if (!chart) {
    throw new SkyfieldServiceError('Skyfield batch response did not include a chart');
  }

  return chart;
}

export async function fetchSkyfieldCharts(
  request: EphemerisServiceBatchRequest
): Promise<EphemerisServiceBatchResponse> {
  const validated = EphemerisServiceBatchRequestSchema.parse(request);
  // Batch requests can take longer - use extended timeout and more retries
  const batchSize = validated.timestampsUtc.length;
  const timeoutMs = Math.max(30000, batchSize * 200); // ~200ms per chart, min 30s
  return requestJson('/v1/positions/batch', validated, EphemerisServiceBatchResponseSchema, {
    retries: 3,
    timeoutMs,
  });
}

export async function fetchSkyfieldSunrise(
  request: EphemerisServiceSunriseRequest
): Promise<EphemerisServiceSunriseResponse> {
  const validated = EphemerisServiceSunriseRequestSchema.parse(request);
  return requestJson('/v1/sunrise', validated, EphemerisServiceSunriseResponseSchema);
}
