interface RequestSample {
  ts: number;
  durationMs: number;
  statusCode: number;
  method: string;
  path: string;
}

export interface SloSnapshot {
  windowMs: number;
  sampleSize: number;
  errorCount: number;
  errorRatePercent: number;
  latency: {
    p50: number;
    p95: number;
    p99: number;
    max: number;
  };
}

const MAX_SAMPLES = 5000;
const samples: RequestSample[] = [];

export function recordRequestSample(sample: RequestSample): void {
  samples.push(sample);
  if (samples.length > MAX_SAMPLES) {
    samples.splice(0, samples.length - MAX_SAMPLES);
  }
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) {
    return 0;
  }
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1));
  return sorted[index] ?? 0;
}

export function getSloSnapshot(windowMs = 5 * 60 * 1000): SloSnapshot {
  const now = Date.now();
  const windowSamples = samples.filter((s) => s.ts >= now - windowMs);
  const latencySorted = windowSamples.map((s) => s.durationMs).sort((a, b) => a - b);
  const errorCount = windowSamples.filter((s) => s.statusCode >= 500).length;
  const errorRatePercent = windowSamples.length > 0
    ? Number(((errorCount / windowSamples.length) * 100).toFixed(2))
    : 0;

  return {
    windowMs,
    sampleSize: windowSamples.length,
    errorCount,
    errorRatePercent,
    latency: {
      p50: percentile(latencySorted, 50),
      p95: percentile(latencySorted, 95),
      p99: percentile(latencySorted, 99),
      max: latencySorted.at(-1) ?? 0,
    },
  };
}

export function getSloAlerts(options: {
  windowMs: number;
  minSampleSize: number;
  errorRateAlertPercent: number;
  p95LatencyAlertMs: number;
}): Array<{ code: string; severity: 'warning' | 'critical'; message: string }> {
  const snapshot = getSloSnapshot(options.windowMs);
  const alerts: Array<{ code: string; severity: 'warning' | 'critical'; message: string }> = [];

  if (snapshot.sampleSize < options.minSampleSize) {
    return alerts;
  }

  if (snapshot.errorRatePercent >= options.errorRateAlertPercent) {
    alerts.push({
      code: 'SLO_ERROR_RATE_ALERT',
      severity: 'critical',
      message: `errorRate=${snapshot.errorRatePercent}% threshold=${options.errorRateAlertPercent}%`,
    });
  }

  if (snapshot.latency.p95 >= options.p95LatencyAlertMs) {
    alerts.push({
      code: 'SLO_P95_LATENCY_ALERT',
      severity: 'warning',
      message: `p95=${snapshot.latency.p95}ms threshold=${options.p95LatencyAlertMs}ms`,
    });
  }

  return alerts;
}

export function __resetSloSamplesForTests(): void {
  samples.splice(0, samples.length);
}
