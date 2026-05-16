import { z } from 'zod';
import type { EphemerisHouseSystem } from '@ai-pandit/shared/types';

// ═══════════════════════════════════════════════════════════════
// DEPLOYMENT DEFAULTS
// ═══════════════════════════════════════════════════════════════

const DEFAULTS = {
  ALLOWED_ORIGINS: 'http://localhost:3000',
  AI_BASE_URL: 'https://api.groq.com/openai/v1',
  EPHEMERIS_SERVICE_URL: 'http://localhost:8000',
} as const;

// ═══════════════════════════════════════════════════════════════
// ENVIRONMENT SCHEMA

const envSchema = z.object({
    // App Environment
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.string().transform((v) => Number(v.split(/[\s,]/)[0])).default('7860'),
    BACKEND_URL: z.string().url().optional(),
    FRONTEND_URL: z.string().optional().transform(v => v?.trim().split(/\s+/)[0]),
    ALLOWED_ORIGINS: z.string().trim().default(DEFAULTS.ALLOWED_ORIGINS),

    // Database Configuration (Neon Postgres)
    NEON_DATABASE_URL: z.string().min(1).optional(),
    DATABASE_URL: z.string().min(1).optional(),
    POSTGRES_URL: z.string().min(1).optional(),

    // AI Configuration
    AI_API_KEY: z.string().min(1, 'AI_API_KEY is required'),
    AI_BASE_URL: z.string().url().default(DEFAULTS.AI_BASE_URL),
    AI_MODEL: z.string().default('openai/gpt-oss-120b'),
    AI_REASONER_IDENTIFIERS: z.string().default('reasoner,r1,o1,think'),
    AI_REASONING_MODE: z.enum(['include_reasoning', 'none', 'auto', 'reasoning_format_raw']).default('auto'),
    AI_MAX_TOKENS: z.string().transform(Number).default('32768'),
    AI_TIMEOUT_MS: z.string().transform(Number).default('3600000'),
    REQUEST_TIMEOUT_MS: z.string().transform(Number).default('3600000'),

    // BTR Specific AI Config - MAX TOKENS for GPT-OSS-120B (Groq API)
    // Using max available tokens for deep analysis
    AI_STAGE2_MAX_TOKENS: z.string().transform(Number).default('32768'),  // Max for batch tournament
    AI_STAGE4_MAX_TOKENS: z.string().transform(Number).default('32768'),  // Max for deep analysis
    AI_STAGE6_MAX_TOKENS: z.string().transform(Number).default('32768'),  // Max for final precision
    AI_BATCH_SIZE_MIN: z.string().transform(Number).default('5'),
    AI_BATCH_SIZE_MAX: z.string().transform(Number).default('10'),
    AI_SURVIVAL_RATE_BASE: z.string().transform(Number).default('0.35'),
    AI_SURVIVAL_ELASTICITY_FACTOR: z.string().transform(Number).default('1.1'),
    AI_PARALLEL_CONCURRENCY: z.string().transform(Number).default('3'),
    AI_PARALLEL_STAGGER_MS: z.string().transform(Number).default('500'),

    BTR_STAGE2_MAX_ROUNDS: z.string().transform(Number).default('5'),
    BTR_STAGE4_MAX_ROUNDS: z.string().transform(Number).default('5'),
    BTR_STAGE6_MAX_ROUNDS: z.string().transform(Number).default('5'),
    BTR_CLUSTER_THRESHOLD_MINS: z.string().transform(Number).default('5'),
    EPHEMERIS_PROVIDER: z.enum(['skyfield', 'algorithmic']).default('skyfield'),
    EPHEMERIS_STRICT_MODE: z
        .string()
        .default('true')
        .transform((v) => ['1', 'true', 'yes', 'on'].includes(v.toLowerCase())),
    EPHEMERIS_ALLOW_ALGORITHMIC_FALLBACK: z
        .string()
        .default('false')
        .transform((v) => ['1', 'true', 'yes', 'on'].includes(v.toLowerCase())),
    EPHEMERIS_SERVICE_URL: z.string().url().default(DEFAULTS.EPHEMERIS_SERVICE_URL),
    EPHEMERIS_SERVICE_TIMEOUT_MS: z.string().transform(Number).default('15000'),
    EPHEMERIS_BATCH_SIZE: z.string().transform(Number).default('250'),
    EPHEMERIS_HOUSE_SYSTEM: z.enum(['whole_sign', 'equal', 'placidus']).default('whole_sign'),
    EPHEMERIS_API_KEY: z.string().optional(),

    // Security Configuration
    CLERK_SECRET_KEY: z.string().min(1, 'CLERK_SECRET_KEY is required'),
    // Memory/Queue/Performance fields removed from env for simplicity

    ENCRYPTION_SECRET: z.string().min(32, 'ENCRYPTION_SECRET must be at least 32 chars'),
    MAX_CONCURRENT_SESSIONS: z.string().transform(Number).default('3'),
    HEAP_THRESHOLD_GB: z.string().transform(Number).default('12'),

    // Rate Limiting
    RATE_LIMIT_WINDOW_MS: z.string().transform(Number).default('60000'),
    RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).default('100'),
    MAX_ACTIVE_JOBS_PER_USER: z.string().transform(Number).default('2'),
    MAX_ACTIVE_JOBS_FREE: z.string().transform(Number).default('2'),
    MAX_ACTIVE_JOBS_PRO: z.string().transform(Number).default('5'),
    MAX_ACTIVE_JOBS_ENTERPRISE: z.string().transform(Number).default('12'),
    LOAD_SHED_QUEUE_DEPTH: z.string().transform(Number).default('80'),
    JOB_EXECUTION_MODE: z.enum(['inline', 'external_worker']).default('inline'),
    REDIS_URL: z.string().url().min(1, 'REDIS_URL is required for Redis-based job queue'),
    REDIS_TLS: z
        .string()
        .default('false')
        .transform((v) => ['1', 'true', 'yes', 'on'].includes(v.toLowerCase())),
    REDIS_QUEUE_NAME: z.string().default('ai-pandit:btr:jobs'),
    WORKER_POLL_INTERVAL_MS: z.string().transform(Number).default('2000'),
    WORKER_RECOVERY_ALERT_THRESHOLD: z.string().transform(Number).default('1'),
    JOB_SYNC_POLL_INTERVAL_MS: z.string().transform(Number).default('2000'),
    OTEL_ENABLED: z
        .string()
        .default('false')
        .transform((v) => ['1', 'true', 'yes', 'on'].includes(v.toLowerCase())),
    OTEL_SERVICE_NAME: z.string().default('ai-pandit-api'),
    OTEL_EXPORTER_OTLP_ENDPOINT: z.string().url().optional(),
    OTEL_TRACE_SAMPLE_RATIO: z.string().transform(Number).default('1'),
    TRACE_HEADER_NAME: z.string().default('x-trace-id'),
    SLO_WINDOW_MS: z.string().transform(Number).default('300000'),
    SLO_MIN_SAMPLE_SIZE: z.string().transform(Number).default('20'),
    SLO_ERROR_RATE_ALERT_PERCENT: z.string().transform(Number).default('5'),
    SLO_P95_LATENCY_ALERT_MS: z.string().transform(Number).default('5000'),
    USE_ASYNC_JOB_PIPELINE: z
        .string()
        .default('true')
        .transform((v) => ['1', 'true', 'yes', 'on'].includes(v.toLowerCase())),
    USE_NEW_STREAM_PATH: z
        .string()
        .default('true')
        .transform((v) => ['1', 'true', 'yes', 'on'].includes(v.toLowerCase())),
    GCS_BUCKET: z.string().min(1).optional(),
    GCS_ARTIFACT_PREFIX: z.string().default('analysis-artifacts'),
    ARTIFACT_RETENTION_DAYS: z.string().transform(Number).default('30'),
});

// ═════════════════════════════════════════════════════════════════════════════
// PARSE AND VALIDATE ENVIRONMENT
// ═════════════════════════════════════════════════════════════════════════════

function parseEnv() {
    const result = envSchema.safeParse(process.env);

    if (!result.success) {
        const errors = result.error.errors.map(
            (e) => `  • ${e.path.join('.')}: ${e.message}`
        );

        console.error('\nCONFIGURATION ERROR: The engine cannot start due to missing environment variables.');
        console.error('Check your runtime environment configuration:');
        console.error(errors.join('\n'));
        console.error('\nACTION REQUIRED: Ensure all required variables are set correctly in the deployment environment.\n');
        throw new Error(`Configuration Validation Failed:\n${errors.join('\n')}`);
    }

    const env = result.data;
    const resolvedDatabaseUrl =
        env.NEON_DATABASE_URL ||
        env.DATABASE_URL ||
        env.POSTGRES_URL;

    if (!resolvedDatabaseUrl) {
        throw new Error(
            'Configuration Validation Failed:\n  • NEON_DATABASE_URL or DATABASE_URL is required'
        );
    }


    return {
        ...env,
        RESOLVED_DATABASE_URL: resolvedDatabaseUrl,
    };
}

let _cachedEnv: ReturnType<typeof parseEnv> | null = null;

/** Shared env accessor; callers in test contexts can inject process.env before first call */
export function ensureEnv(): ReturnType<typeof parseEnv> {
  if (!_cachedEnv) {
    _cachedEnv = parseEnv();
  }
  return _cachedEnv;
}

// ═════════════════════════════════════════════════════════════════════════════
// CONFIGURATION OBJECTS — fully lazy
// ═════════════════════════════════════════════════════════════════════════════
// These are NOT created at module load time. Instead we export a Proxy that
// creates each sub-config lazily on first property access. This means
// `import { config }` will NOT validate env vars — only accessing actual
// config values will. This is critical for cross-stack compatibility:
// the worker can import API modules without triggering env validation.

function lazyProp<T extends object>(fn: () => T): T {
    let val: T | undefined;
    const handler: ProxyHandler<object> = {
        get(_, prop) {
            if (val === undefined) val = fn();
            return (val as any)[prop];
        },
        ownKeys() {
            if (val === undefined) val = fn();
            return Reflect.ownKeys(val!);
        },
        getOwnPropertyDescriptor(_, prop) {
            if (val === undefined) val = fn();
            return Object.getOwnPropertyDescriptor(val!, prop);
        },
    };
    return new Proxy({}, handler) as T;
}

function buildFullConfig() {
    const e = ensureEnv();
    return {
        app: {
            nodeEnv: e.NODE_ENV,
            isProduction: e.NODE_ENV === 'production',
            isDevelopment: e.NODE_ENV === 'development',
            isTest: e.NODE_ENV === 'test',
            backendUrl: e.BACKEND_URL,
            frontendUrl: e.FRONTEND_URL,
            allowedOrigins: e.ALLOWED_ORIGINS,
        },
        server: {
            port: e.PORT,
            requestTimeoutMs: e.REQUEST_TIMEOUT_MS,
            env: e.NODE_ENV,
        },
        ai: {
            apiKey: e.AI_API_KEY,
            baseUrl: e.AI_BASE_URL,
            model: e.AI_MODEL,
            modelReasoner: e.AI_MODEL,
            maxTokens: e.AI_MAX_TOKENS,
            timeoutMs: e.AI_TIMEOUT_MS,
            reasonerIdentifiers: e.AI_REASONER_IDENTIFIERS.split(','),
            reasoningMode: e.AI_REASONING_MODE,
            reasoningEffort: 'default' as 'low' | 'medium' | 'high' | 'default',
            temperature: 0.7,
            retryAttempts: 3,
            retryDelayMs: 5000,
            stage2MaxTokens: e.AI_STAGE2_MAX_TOKENS,
            stage4MaxTokens: e.AI_STAGE4_MAX_TOKENS,
            stage6MaxTokens: e.AI_STAGE6_MAX_TOKENS,
            parallelConcurrency: e.AI_PARALLEL_CONCURRENCY,
            parallelStaggerMs: e.AI_PARALLEL_STAGGER_MS,
            batchSizeMin: e.AI_BATCH_SIZE_MIN,
            batchSizeMax: e.AI_BATCH_SIZE_MAX,
            survivalRateBase: e.AI_SURVIVAL_RATE_BASE,
            survivalElasticityFactor: e.AI_SURVIVAL_ELASTICITY_FACTOR,
            reasonerModel: e.AI_MODEL,
        },
        db: { url: e.RESOLVED_DATABASE_URL, provider: 'postgres' as const },
        encryption: { secret: e.ENCRYPTION_SECRET },
        security: {
            clerkSecretKey: e.CLERK_SECRET_KEY,
            encryptionSecret: e.ENCRYPTION_SECRET,
            rateLimitWindowMs: e.RATE_LIMIT_WINDOW_MS,
            rateLimitMaxRequests: e.RATE_LIMIT_MAX_REQUESTS,
        },
        memory: {
            heapThresholdGB: e.HEAP_THRESHOLD_GB,
            rssThresholdGB: e.HEAP_THRESHOLD_GB + 2,
            pressureThresholdGB: Math.floor(e.HEAP_THRESHOLD_GB * 0.8),
            criticalThresholdGB: Math.floor(e.HEAP_THRESHOLD_GB * 0.95),
            gcThresholdGB: 10,
        },
        performance: {
            maxConcurrentSessions: e.MAX_CONCURRENT_SESSIONS,
            rssThresholdGB: e.HEAP_THRESHOLD_GB + 2,
            heapThresholdGB: e.HEAP_THRESHOLD_GB,
            jobExecutionMode: e.JOB_EXECUTION_MODE,
            workerPollIntervalMs: e.WORKER_POLL_INTERVAL_MS,
        },
        btr: {
            stage2MaxRounds: e.BTR_STAGE2_MAX_ROUNDS,
            stage4MaxRounds: e.BTR_STAGE4_MAX_ROUNDS,
            stage6MaxRounds: e.BTR_STAGE6_MAX_ROUNDS,
            clusterThreshold: e.BTR_CLUSTER_THRESHOLD_MINS,
            fallbackPromotedScore: 85,
            fallbackRejectedScore: 30,
        },
        ephemeris: {
            provider: e.EPHEMERIS_PROVIDER,
            strictMode: e.EPHEMERIS_STRICT_MODE,
            allowAlgorithmicFallback: e.EPHEMERIS_ALLOW_ALGORITHMIC_FALLBACK,
            serviceUrl: e.EPHEMERIS_SERVICE_URL,
            serviceTimeoutMs: e.EPHEMERIS_SERVICE_TIMEOUT_MS,
            batchSize: e.EPHEMERIS_BATCH_SIZE,
            apiKey: e.EPHEMERIS_API_KEY,
            houseSystem: e.EPHEMERIS_HOUSE_SYSTEM as EphemerisHouseSystem,
        },
        timeouts: {
            requestMs: e.AI_TIMEOUT_MS,
            aiMs: e.AI_TIMEOUT_MS,
        },
        queue: {
            maxConcurrent: e.MAX_CONCURRENT_SESSIONS,
            maxActiveJobsPerUser: e.MAX_ACTIVE_JOBS_PER_USER,
            maxActiveJobsByTier: {
                free: e.MAX_ACTIVE_JOBS_FREE,
                pro: e.MAX_ACTIVE_JOBS_PRO,
                enterprise: e.MAX_ACTIVE_JOBS_ENTERPRISE,
            },
            loadShedQueueDepth: e.LOAD_SHED_QUEUE_DEPTH,
            pollIntervalMs: e.WORKER_POLL_INTERVAL_MS,
            recoveryAlertThreshold: e.WORKER_RECOVERY_ALERT_THRESHOLD,
            syncPollIntervalMs: e.JOB_SYNC_POLL_INTERVAL_MS,
            maxSize: 100,
            staleTimeoutMs: 7200000,
            baseAnalysisTime: 240,
            contentionMultiplier: 0.1,
            executionMode: e.JOB_EXECUTION_MODE,
            architecture: 'redis_bullmq' as const,
            redis: { url: e.REDIS_URL, tls: e.REDIS_TLS, queueName: e.REDIS_QUEUE_NAME },
        },
        storage: {
            gcsBucket: e.GCS_BUCKET,
            artifactPrefix: e.GCS_ARTIFACT_PREFIX,
            artifactRetentionDays: e.ARTIFACT_RETENTION_DAYS,
        },
        observability: {
            otelEnabled: e.OTEL_ENABLED,
            serviceName: e.OTEL_SERVICE_NAME,
            otlpEndpoint: e.OTEL_EXPORTER_OTLP_ENDPOINT,
            traceSampleRatio: e.OTEL_TRACE_SAMPLE_RATIO,
            traceHeaderName: e.TRACE_HEADER_NAME,
            slo: {
                windowMs: e.SLO_WINDOW_MS,
                minSampleSize: e.SLO_MIN_SAMPLE_SIZE,
                errorRateAlertPercent: e.SLO_ERROR_RATE_ALERT_PERCENT,
                p95LatencyAlertMs: e.SLO_P95_LATENCY_ALERT_MS,
            },
        },
        logging: {
            level: 'info' as const,
            format: 'json' as const,
            redactFields: ['apiKey', 'token', 'secret', 'password', 'authorization', 'externalId'],
            includeStackTrace: true,
            prettyPrint: false,
        },
        features: {
            useAsyncJobPipeline: e.USE_ASYNC_JOB_PIPELINE,
            useNewStreamPath: e.USE_NEW_STREAM_PATH,
        },
    };
}

export const config: ReturnType<typeof buildFullConfig> = lazyProp(buildFullConfig);
export default config;

// Individual config exports (lazy — created on first access, not at module load time)
export const appConfig = lazyProp(() => config.app);
export const serverConfig = lazyProp(() => config.server);
export const aiConfig = lazyProp(() => config.ai);
export const dbConfig = lazyProp(() => config.db);
export const encryptionConfig = lazyProp(() => config.encryption);
export const securityConfig = lazyProp(() => config.security);
export const memoryConfig = lazyProp(() => config.memory);
export const performanceConfig = lazyProp(() => config.performance);
export const storageConfig = lazyProp(() => config.storage);
