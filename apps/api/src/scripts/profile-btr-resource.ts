import 'dotenv/config';
import crypto from 'node:crypto';
import { createServer, IncomingMessage, ServerResponse } from 'node:http';
import { initEphemerisProvider, cleanup as triggerEphemerisCleanup } from '../lib/ephemeris.js';
import { executeSecondsPrecisionRectification } from '../lib/seconds-precision-btr.js';
import type { ForensicTraits, LifeEvent, SecondsPrecisionInput } from '@ai-pandit/shared';
import { TEST_PROFILES, type TestProfile } from '../lib/btr/__tests__/dataset/test-profiles.js';
import { MODI_BLINDED_PROFILE } from '../lib/btr/__tests__/dataset/modi-blinded-profile.js';
import { db, closeDatabaseConnection } from '@ai-pandit/db';
import { users, sessions } from '@ai-pandit/db/schema';
import { eq } from 'drizzle-orm';

type ProfilePreset = 'virat' | 'modi-blinded' | 'mixed';

interface CliOptions {
  concurrency: number;
  offsetMinutes: number;
  events: number;
  aiPort: number;
  streamChunkDelayMs: number;
  streamInitialDelayMs: number;
  profilePreset: ProfilePreset;
  useMockAI: boolean;
}

interface UsageSample {
  elapsedMs: number;
  rssMB: number;
  heapUsedMB: number;
}

interface UsageSummary {
  elapsedMs: number;
  cpuMs: number;
  avgCpuPercentOneCore: number;
  peakRssMB: number;
  peakHeapUsedMB: number;
  baselineRssMB: number;
  baselineHeapUsedMB: number;
  samples: UsageSample[];
}

interface AnalysisRunSummary {
  sessionId: string;
  rectifiedTime: string;
  confidence: string;
  accuracy: number;
  processingTimeMs: number;
}

const DEFAULTS: CliOptions = {
  concurrency: 1,
  offsetMinutes: 30,
  events: 12,
  aiPort: 5051,
  streamChunkDelayMs: 8,
  streamInitialDelayMs: 250,
  profilePreset: 'mixed',
  useMockAI: true,
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseArgs(argv: string[]): CliOptions {
  const options = { ...DEFAULTS };

  for (const arg of argv) {
    if (!arg.startsWith('--')) continue;
    const [rawKey, rawValue] = arg.slice(2).split('=');
    const key = rawKey.trim();
    const value = (rawValue ?? '').trim();

    if (!value) continue;

    if (key === 'concurrency') options.concurrency = Math.max(1, Number(value) || DEFAULTS.concurrency);
    if (key === 'offset') options.offsetMinutes = Math.max(1, Number(value) || DEFAULTS.offsetMinutes);
    if (key === 'events') options.events = Math.max(1, Number(value) || DEFAULTS.events);
    if (key === 'ai-port') options.aiPort = Math.max(1024, Number(value) || DEFAULTS.aiPort);
    if (key === 'chunk-delay-ms') options.streamChunkDelayMs = Math.max(0, Number(value) || DEFAULTS.streamChunkDelayMs);
    if (key === 'initial-delay-ms') options.streamInitialDelayMs = Math.max(0, Number(value) || DEFAULTS.streamInitialDelayMs);
    if (key === 'profile' && (value === 'virat' || value === 'modi-blinded' || value === 'mixed')) {
      options.profilePreset = value;
    }
    if (key === 'mock-ai') options.useMockAI = value.toLowerCase() !== 'false';
  }

  return options;
}

function parseCandidateTimes(text: string): string[] {
  const matches = text.match(/\b\d{2}:\d{2}:\d{2}\b/g) ?? [];
  return Array.from(new Set(matches));
}

function buildMockReasoning(prompt: string): string {
  const candidateTimes = parseCandidateTimes(prompt);
  const fallbackTimes = ['10:28:00', '10:29:00', '10:30:00'];
  const usableTimes = candidateTimes.length > 0 ? candidateTimes : fallbackTimes;
  const verdictTime = usableTimes[0];

  const scores = usableTimes.slice(0, Math.min(12, usableTimes.length)).map((time, index) => ({
    time,
    score: Math.max(55, 96 - (index * 3)),
    reason: `Mock stream score for ${time}`,
  }));

  const verdict = {
    time: verdictTime,
    accuracy: 92,
    confidence: 'HIGH',
    margin: 4,
  };

  const header = [
    'MOCK AI STREAM FOR RESOURCE PROFILING',
    `<FINAL_SCORES>${JSON.stringify(scores)}</FINAL_SCORES>`,
    `<FINAL_VERDICT>${JSON.stringify(verdict)}</FINAL_VERDICT>`,
    'The following reasoning payload is intentionally long to simulate real thinking streams.',
  ].join('\n');

  const filler = 'Detailed astro-correlation across dasha, varga, transit, and forensic layers. ';
  const expanded = filler.repeat(65); // > 1500 chars to pass short-response guard

  return `${header}\n${expanded}`;
}

async function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
    req.on('error', reject);
  });
}

function writeJson(res: ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
}

async function startMockAI(port: number, chunkDelayMs: number, initialDelayMs: number): Promise<() => Promise<void>> {
  const server = createServer(async (req, res) => {
    if (req.method !== 'POST' || req.url !== '/chat/completions') {
      writeJson(res, 404, { error: 'Not Found' });
      return;
    }

    let payload: {
      stream?: boolean;
      messages?: Array<{ role?: string; content?: string }>;
    } = {};

    try {
      const raw = await readBody(req);
      payload = JSON.parse(raw) as {
        stream?: boolean;
        messages?: Array<{ role?: string; content?: string }>;
      };
    } catch {
      writeJson(res, 400, { error: 'Invalid JSON' });
      return;
    }

    const prompt = payload.messages?.map((m) => m.content ?? '').join('\n') ?? '';
    const reasoning = buildMockReasoning(prompt);

    if (!payload.stream) {
      writeJson(res, 200, {
        id: 'mock-non-stream',
        object: 'chat.completion',
        choices: [
          {
            message: {
              role: 'assistant',
              content: '',
              reasoning,
            },
            finish_reason: 'stop',
          },
        ],
        usage: {
          prompt_tokens: 200,
          completion_tokens: Math.max(200, Math.round(reasoning.length / 4)),
          total_tokens: 200 + Math.max(200, Math.round(reasoning.length / 4)),
        },
      });
      return;
    }

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    });

    if (initialDelayMs > 0) {
      await sleep(initialDelayMs);
    }

    const chunkSize = 110;
    for (let i = 0; i < reasoning.length; i += chunkSize) {
      const chunk = reasoning.slice(i, i + chunkSize);
      const ssePayload = {
        id: 'mock-stream',
        choices: [{ delta: { reasoning: chunk } }],
      };

      res.write(`data: ${JSON.stringify(ssePayload)}\n\n`);
      if (chunkDelayMs > 0) {
        await sleep(chunkDelayMs);
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();
  });

  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, '127.0.0.1', () => resolve());
  });

  return async () => {
    await new Promise<void>((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
  };
}

function startUsageMonitor(intervalMs = 250): { stop: () => UsageSummary } {
  const startNs = process.hrtime.bigint();
  const startCpu = process.cpuUsage();
  const baselineMem = process.memoryUsage();
  const samples: UsageSample[] = [];

  let peakRssMB = baselineMem.rss / 1024 / 1024;
  let peakHeapUsedMB = baselineMem.heapUsed / 1024 / 1024;

  const sample = (): void => {
    const elapsedMs = Number(process.hrtime.bigint() - startNs) / 1_000_000;
    const mem = process.memoryUsage();
    const rssMB = mem.rss / 1024 / 1024;
    const heapUsedMB = mem.heapUsed / 1024 / 1024;

    if (rssMB > peakRssMB) peakRssMB = rssMB;
    if (heapUsedMB > peakHeapUsedMB) peakHeapUsedMB = heapUsedMB;

    samples.push({
      elapsedMs,
      rssMB,
      heapUsedMB,
    });
  };

  sample();
  const timer = setInterval(sample, intervalMs);

  return {
    stop: () => {
      clearInterval(timer);
      sample();

      const elapsedMs = Number(process.hrtime.bigint() - startNs) / 1_000_000;
      const cpu = process.cpuUsage(startCpu);
      const cpuMs = (cpu.user + cpu.system) / 1000;
      const avgCpuPercentOneCore = elapsedMs > 0 ? (cpuMs / elapsedMs) * 100 : 0;

      return {
        elapsedMs,
        cpuMs,
        avgCpuPercentOneCore,
        peakRssMB,
        peakHeapUsedMB,
        baselineRssMB: baselineMem.rss / 1024 / 1024,
        baselineHeapUsedMB: baselineMem.heapUsed / 1024 / 1024,
        samples,
      };
    },
  };
}

function normalizeLifeEvents(profile: TestProfile, limit: number): LifeEvent[] {
  const events = profile.lifeEvents.slice(0, limit).map((event, index) => {
    const normalized = {
      id: typeof event.id === 'string' ? event.id : crypto.randomUUID(),
      category: typeof event.category === 'string' ? event.category : 'career',
      eventType: typeof event.eventType === 'string' ? event.eventType : 'event',
      datePrecision: typeof event.datePrecision === 'string' ? event.datePrecision : 'exact_date',
      eventDate: typeof event.eventDate === 'string' ? event.eventDate : '2000-01-01',
      endDate: typeof event.endDate === 'string' ? event.endDate : undefined,
      eventTime: typeof event.eventTime === 'string' ? event.eventTime : undefined,
      description:
        typeof event.description === 'string'
          ? event.description
          : typeof event.notes === 'string'
            ? event.notes
            : `Event ${index + 1}`,
      importance: typeof event.importance === 'string' ? event.importance : 'medium',
    };

    return normalized as unknown as LifeEvent;
  });

  return events.length > 0 ? events : [
    {
      id: crypto.randomUUID(),
      category: 'career',
      eventType: 'job',
      datePrecision: 'exact_date',
      eventDate: '2018-01-01',
      description: 'Fallback event',
      importance: 'medium',
    } as unknown as LifeEvent,
  ];
}

function pickProfiles(concurrency: number, profilePreset: ProfilePreset): TestProfile[] {
  if (profilePreset === 'modi-blinded') {
    return Array.from({ length: concurrency }, () => MODI_BLINDED_PROFILE);
  }

  if (profilePreset === 'virat') {
    const virat = TEST_PROFILES.find((p) => p.fullName.toLowerCase().includes('virat')) ?? TEST_PROFILES[0];
    return Array.from({ length: concurrency }, () => virat);
  }

  const pool = [MODI_BLINDED_PROFILE, ...TEST_PROFILES];
  return Array.from({ length: concurrency }, (_, i) => pool[i % pool.length]);
}

function buildInputs(options: CliOptions): SecondsPrecisionInput[] {
  const profiles = pickProfiles(options.concurrency, options.profilePreset);

  return profiles.map((profile, index) => ({
    sessionId: `profile-${Date.now()}-${index}-${crypto.randomUUID().slice(0, 8)}`,
    dateOfBirth: profile.dateOfBirth,
    tentativeTime: profile.tentativeTime,
    latitude: profile.latitude,
    longitude: profile.longitude,
    timezone: String(profile.timezone),
    lifeEvents: normalizeLifeEvents(profile, options.events),
    offsetConfig: {
      preset: 'custom',
      customMinutes: options.offsetMinutes,
      description: `Profiling ±${options.offsetMinutes}m`,
    },
    forensicTraits: (profile.forensicTraits ?? {}) as ForensicTraits,
  }));
}

async function ensureProfilingUser(): Promise<{ userId: string; clerkId: string }> {
  const clerkId = 'clerk_profile_resource_bot';
  const existing = await db.select({ id: users.id }).from(users).where(eq(users.clerkId, clerkId)).limit(1);

  if (existing.length > 0) {
    return { userId: existing[0].id, clerkId };
  }

  const userId = crypto.randomUUID();
  const now = new Date().toISOString();
  await db.insert(users).values({
    id: userId,
    clerkId,
    email: 'profile-bot@local.test',
    createdAt: now,
    updatedAt: now,
  });

  return { userId, clerkId };
}

async function insertSessionRows(inputs: SecondsPrecisionInput[]): Promise<void> {
  const { userId, clerkId } = await ensureProfilingUser();
  const now = new Date().toISOString();

  for (const input of inputs) {
    await db.insert(sessions).values({
      id: input.sessionId,
      userId,
      clerkId,
      fullName: 'Profiling Session',
      dateOfBirth: input.dateOfBirth,
      tentativeTime: input.tentativeTime,
      birthPlace: 'Profiling',
      latitude: input.latitude,
      longitude: input.longitude,
      timezone: String(input.timezone),
      forensicTraits: JSON.stringify(input.forensicTraits ?? {}),
      lifeEvents: JSON.stringify(input.lifeEvents ?? []),
      offsetConfig: JSON.stringify(input.offsetConfig),
      status: 'processing',
      createdAt: now,
      updatedAt: now,
    });
  }
}

async function cleanupSessionRows(inputs: SecondsPrecisionInput[]): Promise<void> {
  for (const input of inputs) {
    await db.delete(sessions).where(eq(sessions.id, input.sessionId));
  }
}

function estimateRecommendedConcurrency(summary: UsageSummary, requestedConcurrency: number): {
  memoryBoundMax: number;
  cpuBoundMax: number;
  recommended: number;
  perAnalysisRssMB: number;
  perAnalysisCpuPercentOneCore: number;
} {
  const totalRamMB = 16 * 1024;
  const safeRamBudgetMB = totalRamMB * 0.75;
  const safeCpuBudgetPercent = 200 * 0.85; // 2 vCPU target with headroom

  const rssDeltaMB = Math.max(1, summary.peakRssMB - summary.baselineRssMB);
  const perAnalysisRssMB = Math.max(1, rssDeltaMB / requestedConcurrency);
  const perAnalysisCpuPercentOneCore = Math.max(1, summary.avgCpuPercentOneCore / requestedConcurrency);

  const memoryBoundMax = Math.max(1, Math.floor(safeRamBudgetMB / perAnalysisRssMB));
  const cpuBoundMax = Math.max(1, Math.floor(safeCpuBudgetPercent / perAnalysisCpuPercentOneCore));
  const recommended = Math.max(1, Math.min(memoryBoundMax, cpuBoundMax));

  return {
    memoryBoundMax,
    cpuBoundMax,
    recommended,
    perAnalysisRssMB,
    perAnalysisCpuPercentOneCore,
  };
}

async function run(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  const startTimestamp = new Date().toISOString();
  let inputs: SecondsPrecisionInput[] = [];

  console.log('=== BTR Resource Profiling Start ===');
  console.log(JSON.stringify({
    startTimestamp,
    options,
    nodeEnv: process.env.NODE_ENV,
    aiBaseUrl: process.env.AI_BASE_URL,
  }, null, 2));

  const stopMockAI = options.useMockAI
    ? await startMockAI(
      options.aiPort,
      options.streamChunkDelayMs,
      options.streamInitialDelayMs,
    )
    : null;

  try {
    await initEphemerisProvider();

    inputs = buildInputs(options);
    await insertSessionRows(inputs);
    const usageMonitor = startUsageMonitor(250);

    const startedAt = Date.now();
    const results = await Promise.all(inputs.map(async (input): Promise<AnalysisRunSummary> => {
      const result = await executeSecondsPrecisionRectification(input);
      return {
        sessionId: input.sessionId,
        rectifiedTime: result.rectifiedTime,
        confidence: result.confidence,
        accuracy: result.accuracy,
        processingTimeMs: result.processingTimeMs,
      };
    }));
    const usageSummary = usageMonitor.stop();
    const completedAt = Date.now();
    const recommendation = estimateRecommendedConcurrency(usageSummary, options.concurrency);

    const output = {
      startedAt: new Date(startedAt).toISOString(),
      completedAt: new Date(completedAt).toISOString(),
      wallClockMs: completedAt - startedAt,
      config: options,
      usageSummary: {
        elapsedMs: Math.round(usageSummary.elapsedMs),
        cpuMs: Math.round(usageSummary.cpuMs),
        avgCpuPercentOneCore: Number(usageSummary.avgCpuPercentOneCore.toFixed(2)),
        peakRssMB: Number(usageSummary.peakRssMB.toFixed(2)),
        peakHeapUsedMB: Number(usageSummary.peakHeapUsedMB.toFixed(2)),
        baselineRssMB: Number(usageSummary.baselineRssMB.toFixed(2)),
      },
      concurrencyEstimateFor2vCPU16GB: {
        perAnalysisRssMB: Number(recommendation.perAnalysisRssMB.toFixed(2)),
        perAnalysisCpuPercentOneCore: Number(recommendation.perAnalysisCpuPercentOneCore.toFixed(2)),
        memoryBoundMax: recommendation.memoryBoundMax,
        cpuBoundMax: recommendation.cpuBoundMax,
        recommendedMaxConcurrent: recommendation.recommended,
      },
      runResults: results,
    };

    console.log('=== BTR Resource Profiling Result ===');
    console.log(JSON.stringify(output, null, 2));

  } finally {
    if (inputs.length > 0) {
      await cleanupSessionRows(inputs).catch(() => undefined);
    }
    if (stopMockAI) {
      await stopMockAI();
    }
    triggerEphemerisCleanup();
  }
}

run()
  .then(async () => {
    await closeDatabaseConnection().catch(() => undefined);
    process.exit(0);
  })
  .catch(async (error) => {
    console.error('Profiling run failed:', error instanceof Error ? error.message : String(error));
    await closeDatabaseConnection().catch(() => undefined);
    process.exit(1);
  });
