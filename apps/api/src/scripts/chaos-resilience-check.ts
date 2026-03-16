import { runCapacityValidation } from './capacity-validation.js';
import { logger } from '../lib/logger.js';

interface Scenario {
  name: 'ai_timeout_spike' | 'db_latency_spike' | 'queue_outage';
  urlEnv: string;
  profile: 'burst' | 'sustained';
}

const SCENARIOS: Scenario[] = [
  { name: 'ai_timeout_spike', urlEnv: 'CHAOS_AI_SPIKE_URL', profile: 'burst' },
  { name: 'db_latency_spike', urlEnv: 'CHAOS_DB_SPIKE_URL', profile: 'sustained' },
  { name: 'queue_outage', urlEnv: 'CHAOS_QUEUE_OUTAGE_URL', profile: 'burst' },
];

async function main(): Promise<void> {
  const baseFallbackUrl = process.env.CHAOS_BASE_URL ?? 'http://localhost:3001/api/health/live';
  const token = process.env.LOAD_TEST_TOKEN;
  const timeoutMs = Number(process.env.LOAD_TEST_TIMEOUT_MS ?? 10000);

  const gateP95Ms = Number(process.env.SLO_GATE_P95_MS ?? process.env.SLO_P95_LATENCY_ALERT_MS ?? 5000);
  const gateErrorRatePercent = Number(process.env.SLO_GATE_ERROR_RATE_PERCENT ?? process.env.SLO_ERROR_RATE_ALERT_PERCENT ?? 5);
  const gateMinSamples = Number(process.env.SLO_GATE_MIN_SAMPLES ?? 20);
  const gateMinSuccessRatePercent = Number(process.env.SLO_GATE_MIN_SUCCESS_RATE_PERCENT ?? 90);

  const results: Array<Record<string, unknown>> = [];
  let allPassed = true;

  for (const scenario of SCENARIOS) {
    const targetUrl = process.env[scenario.urlEnv] ?? baseFallbackUrl;

    const result = await runCapacityValidation({
      profile: scenario.profile,
      targetUrl,
      method: 'GET',
      token,
      timeoutMs,
      gateP95Ms,
      gateErrorRatePercent,
      gateMinSamples,
      gateMinSuccessRatePercent,
    });

    results.push({
      scenario: scenario.name,
      profile: scenario.profile,
      url: targetUrl,
      gate: result.gate,
      latencyMs: result.latencyMs,
      errorRatePercent: result.errorRatePercent,
      throughputRps: result.throughputRps,
      sampleCount: result.sampleCount,
    });

    if (!result.gate.pass) {
      allPassed = false;
    }
  }

  logger.info('Chaos resilience check completed', {
    ranAt: new Date().toISOString(),
    allPassed,
    note: 'This harness validates resilience under externally injected faults. Configure CHAOS_* URLs to fault-enabled targets.',
    results,
  });

  if (!allPassed) {
    process.exit(1);
  }
}

void main();
