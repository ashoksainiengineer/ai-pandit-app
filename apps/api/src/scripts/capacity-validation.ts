import fs from 'node:fs';
import path from 'node:path';
import { logger } from '../lib/logger.js';

interface ProfileConfig {
  name: 'normal' | 'burst' | 'sustained';
  durationSec: number;
  rps: number;
  concurrency: number;
}

interface RunResult {
  profile: ProfileConfig['name'];
  startedAt: string;
  finishedAt: string;
  targetUrl: string;
  method: string;
  sampleCount: number;
  successCount: number;
  errorCount: number;
  droppedDueToConcurrency: number;
  errorRatePercent: number;
  throughputRps: number;
  latencyMs: {
    p50: number;
    p95: number;
    p99: number;
    max: number;
  };
  gate: {
    pass: boolean;
    reasons: string[];
    thresholds: {
      p95Ms: number;
      errorRatePercent: number;
      minSamples: number;
      minSuccessRatePercent: number;
    };
  };
}

const PROFILES: Record<ProfileConfig['name'], ProfileConfig> = {
  normal: { name: 'normal', durationSec: 60, rps: 5, concurrency: 10 },
  burst: { name: 'burst', durationSec: 45, rps: 30, concurrency: 60 },
  sustained: { name: 'sustained', durationSec: 180, rps: 15, concurrency: 30 },
};

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) {
    return 0;
  }
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1));
  return sorted[idx] ?? 0;
}

function getArgValue(name: string): string | undefined {
  const prefix = `--${name}=`;
  const found = process.argv.find((arg) => arg.startsWith(prefix));
  return found ? found.slice(prefix.length) : undefined;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function issueRequest(options: {
  url: string;
  method: string;
  timeoutMs: number;
  token?: string;
}): Promise<{ ok: boolean; durationMs: number; status: number }> {
  const started = Date.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs);

  try {
    const response = await fetch(options.url, {
      method: options.method,
      signal: controller.signal,
      headers: options.token
        ? { Authorization: `Bearer ${options.token}` }
        : undefined,
    });

    return {
      ok: response.ok,
      durationMs: Date.now() - started,
      status: response.status,
    };
  } catch {
    return {
      ok: false,
      durationMs: Date.now() - started,
      status: 0,
    };
  } finally {
    clearTimeout(timeout);
  }
}

export async function runCapacityValidation(options: {
  profile: ProfileConfig['name'];
  targetUrl: string;
  method: string;
  token?: string;
  timeoutMs: number;
  gateP95Ms: number;
  gateErrorRatePercent: number;
  gateMinSamples: number;
  gateMinSuccessRatePercent: number;
}): Promise<RunResult> {
  const profile = PROFILES[options.profile];
  const startedAt = new Date().toISOString();
  const startedMs = Date.now();

  let inFlight = 0;
  let droppedDueToConcurrency = 0;
  const latencies: number[] = [];
  let successCount = 0;
  let errorCount = 0;
  const pending: Promise<void>[] = [];

  for (let second = 0; second < profile.durationSec; second += 1) {
    for (let i = 0; i < profile.rps; i += 1) {
      if (inFlight >= profile.concurrency) {
        droppedDueToConcurrency += 1;
        continue;
      }

      inFlight += 1;
      const delayMs = Math.floor((1000 / profile.rps) * i);
      const p = (async () => {
        if (delayMs > 0) {
          await sleep(delayMs);
        }
        const outcome = await issueRequest({
          url: options.targetUrl,
          method: options.method,
          timeoutMs: options.timeoutMs,
          token: options.token,
        });

        latencies.push(outcome.durationMs);
        if (outcome.ok) {
          successCount += 1;
        } else {
          errorCount += 1;
        }
      })().finally(() => {
        inFlight = Math.max(0, inFlight - 1);
      });

      pending.push(p);
    }

    await sleep(1000);
  }

  await Promise.all(pending);

  const finishedAt = new Date().toISOString();
  const totalDurationSec = Math.max(1, (Date.now() - startedMs) / 1000);
  const sorted = [...latencies].sort((a, b) => a - b);
  const sampleCount = sorted.length;
  const errorRatePercent = sampleCount > 0
    ? Number(((errorCount / sampleCount) * 100).toFixed(2))
    : 100;
  const successRatePercent = sampleCount > 0
    ? Number(((successCount / sampleCount) * 100).toFixed(2))
    : 0;

  const gateReasons: string[] = [];
  const p95 = percentile(sorted, 95);
  if (sampleCount < options.gateMinSamples) {
    gateReasons.push(`Insufficient samples: ${sampleCount} < ${options.gateMinSamples}`);
  }
  if (p95 > options.gateP95Ms) {
    gateReasons.push(`p95 latency breach: ${p95}ms > ${options.gateP95Ms}ms`);
  }
  if (errorRatePercent > options.gateErrorRatePercent) {
    gateReasons.push(`error rate breach: ${errorRatePercent}% > ${options.gateErrorRatePercent}%`);
  }
  if (successRatePercent < options.gateMinSuccessRatePercent) {
    gateReasons.push(`success rate breach: ${successRatePercent}% < ${options.gateMinSuccessRatePercent}%`);
  }

  return {
    profile: profile.name,
    startedAt,
    finishedAt,
    targetUrl: options.targetUrl,
    method: options.method,
    sampleCount,
    successCount,
    errorCount,
    droppedDueToConcurrency,
    errorRatePercent,
    throughputRps: Number((sampleCount / totalDurationSec).toFixed(2)),
    latencyMs: {
      p50: percentile(sorted, 50),
      p95,
      p99: percentile(sorted, 99),
      max: sorted.at(-1) ?? 0,
    },
    gate: {
      pass: gateReasons.length === 0,
      reasons: gateReasons,
      thresholds: {
        p95Ms: options.gateP95Ms,
        errorRatePercent: options.gateErrorRatePercent,
        minSamples: options.gateMinSamples,
        minSuccessRatePercent: options.gateMinSuccessRatePercent,
      },
    },
  };
}

async function main(): Promise<void> {
  const profileArg = (getArgValue('profile') ?? 'normal') as ProfileConfig['name'];
  const profile = PROFILES[profileArg] ? profileArg : 'normal';

  const targetUrl = getArgValue('url') ?? process.env.LOAD_TEST_URL ?? 'http://localhost:3001/api/health/live';
  const method = (getArgValue('method') ?? process.env.LOAD_TEST_METHOD ?? 'GET').toUpperCase();
  const token = getArgValue('token') ?? process.env.LOAD_TEST_TOKEN;
  const timeoutMs = Number(getArgValue('timeoutMs') ?? process.env.LOAD_TEST_TIMEOUT_MS ?? 10000);

  const gateP95Ms = Number(getArgValue('gateP95') ?? process.env.SLO_GATE_P95_MS ?? process.env.SLO_P95_LATENCY_ALERT_MS ?? 5000);
  const gateErrorRatePercent = Number(getArgValue('gateErrorRate') ?? process.env.SLO_GATE_ERROR_RATE_PERCENT ?? process.env.SLO_ERROR_RATE_ALERT_PERCENT ?? 5);
  const gateMinSamples = Number(getArgValue('gateMinSamples') ?? process.env.SLO_GATE_MIN_SAMPLES ?? 20);
  const gateMinSuccessRatePercent = Number(getArgValue('gateMinSuccessRate') ?? process.env.SLO_GATE_MIN_SUCCESS_RATE_PERCENT ?? 95);

  const result = await runCapacityValidation({
    profile,
    targetUrl,
    method,
    token,
    timeoutMs,
    gateP95Ms,
    gateErrorRatePercent,
    gateMinSamples,
    gateMinSuccessRatePercent,
  });

  const reportDir = path.join(process.cwd(), 'docs', 'load-reports');
  fs.mkdirSync(reportDir, { recursive: true });
  const safeTs = new Date().toISOString().replace(/[:.]/g, '-');
  const reportPath = path.join(reportDir, `capacity-${profile}-${safeTs}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(result, null, 2));

  logger.info('Capacity validation completed', { reportPath, ...result });

  if (!result.gate.pass) {
    process.exit(1);
  }
}

void main();
