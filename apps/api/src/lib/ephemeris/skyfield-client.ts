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
  try {
    return await response.json();
  } catch (error) {
    throw new SkyfieldServiceError('Skyfield service returned a non-JSON response', response.status, error);
  }
}

async function requestJson<TRequest, TResponse>(
  path: string,
  body: TRequest,
  schema: { parse: (value: unknown) => TResponse }
): Promise<TResponse> {
  const controller = new AbortController();
  const ephemerisConfig = getEphemerisClientConfig();
  const timeout = setTimeout(() => controller.abort(), ephemerisConfig.serviceTimeoutMs);

  try {
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
    if (error instanceof SkyfieldServiceError) {
      throw error;
    }

    throw new SkyfieldServiceError(`Skyfield service request failed for ${path}`, undefined, error);
  } finally {
    clearTimeout(timeout);
  }
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
  return requestJson('/v1/positions/batch', validated, EphemerisServiceBatchResponseSchema);
}

export async function fetchSkyfieldSunrise(
  request: EphemerisServiceSunriseRequest
): Promise<EphemerisServiceSunriseResponse> {
  const validated = EphemerisServiceSunriseRequestSchema.parse(request);
  return requestJson('/v1/sunrise', validated, EphemerisServiceSunriseResponseSchema);
}
