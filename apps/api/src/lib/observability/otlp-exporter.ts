import { config } from '../../config/index.js';
import { logger } from '../../utils/logger.js';

type OtlpAttributeValue = string | number | boolean;

export interface OtlpSpanExportInput {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  name: string;
  startTimeUnixNano: string;
  endTimeUnixNano: string;
  attributes?: Record<string, OtlpAttributeValue>;
  statusCode?: number;
}

let inFlightExports = 0;
let droppedExports = 0;
const MAX_IN_FLIGHT_EXPORTS = 25;

function toNanoTimestamp(ms: number): string {
  return `${Math.floor(ms * 1_000_000)}`;
}

function toAnyValue(value: OtlpAttributeValue): Record<string, unknown> {
  if (typeof value === 'string') {
    return { stringValue: value };
  }
  if (typeof value === 'boolean') {
    return { boolValue: value };
  }
  if (Number.isInteger(value)) {
    return { intValue: value };
  }
  return { doubleValue: value };
}

export function getOtlpExporterStats(): {
  inFlightExports: number;
  droppedExports: number;
  enabled: boolean;
} {
  return {
    inFlightExports,
    droppedExports,
    enabled: Boolean(config.observability?.otelEnabled && config.observability?.otlpEndpoint),
  };
}

export function toSpanTimeRange(startMs: number, endMs: number): {
  startTimeUnixNano: string;
  endTimeUnixNano: string;
} {
  return {
    startTimeUnixNano: toNanoTimestamp(startMs),
    endTimeUnixNano: toNanoTimestamp(endMs),
  };
}

export async function emitOtlpSpan(input: OtlpSpanExportInput): Promise<void> {
  const observabilityConfig = config.observability;
  if (!observabilityConfig?.otelEnabled || !observabilityConfig.otlpEndpoint) {
    return;
  }

  if (inFlightExports >= MAX_IN_FLIGHT_EXPORTS) {
    droppedExports += 1;
    return;
  }

  inFlightExports += 1;

  const endpoint = observabilityConfig.otlpEndpoint;
  const resourceAttributes = [
    { key: 'service.name', value: { stringValue: observabilityConfig.serviceName } },
    { key: 'service.instance.id', value: { stringValue: `pid:${process.pid}` } },
    { key: 'deployment.environment', value: { stringValue: config.app.nodeEnv } },
  ];

  const spanAttributes = Object.entries(input.attributes ?? {}).map(([key, value]) => ({
    key,
    value: toAnyValue(value),
  }));

  const payload = {
    resourceSpans: [
      {
        resource: {
          attributes: resourceAttributes,
        },
        scopeSpans: [
          {
            scope: {
              name: 'ai-pandit-api',
              version: '1.0.0',
            },
            spans: [
              {
                traceId: input.traceId.replace(/-/g, ''),
                spanId: input.spanId.replace(/-/g, '').slice(0, 16),
                parentSpanId: input.parentSpanId?.replace(/-/g, '').slice(0, 16),
                name: input.name,
                kind: 2,
                startTimeUnixNano: input.startTimeUnixNano,
                endTimeUnixNano: input.endTimeUnixNano,
                attributes: spanAttributes,
                status: input.statusCode && input.statusCode >= 500
                  ? { code: 2, message: `HTTP ${input.statusCode}` }
                  : { code: 1 },
              },
            ],
          },
        ],
      },
    ],
  };

  try {
    await fetch(endpoint, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    logger.warn('OTLP span export failed', {
      endpoint,
      error: error instanceof Error ? error.message : String(error),
    });
  } finally {
    inFlightExports = Math.max(0, inFlightExports - 1);
  }
}
