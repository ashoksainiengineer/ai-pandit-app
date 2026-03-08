import { z } from 'zod';

// ═════════════════════════════════════════════════════════════════════════════
// ENVIRONMENT SCHEMA
// ═════════════════════════════════════════════════════════════════════════════

const envSchema = z.object({
    // App Environment
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.string().transform((v) => Number(v.split(/[\s,]/)[0])).default('7860'),
    BACKEND_URL: z.string().url().optional(),
    FRONTEND_URL: z.string().optional().transform(v => v?.trim().split(/\s+/)[0]),
    ALLOWED_ORIGINS: z.string().trim().default('http://localhost:3000'),

    // Database Configuration (Turso)
    TURSO_DATABASE_URL: z.string().min(1, 'TURSO_DATABASE_URL is required'),
    TURSO_AUTH_TOKEN: z.string().min(1, 'TURSO_AUTH_TOKEN is required'),

    // AI Configuration
    AI_API_KEY: z.string().min(1, 'AI_API_KEY is required'),
    AI_BASE_URL: z.string().url().default('https://api.openai.com/v1'),
    AI_MODEL: z.string().default('gpt-4o'),
    AI_REASONER_IDENTIFIERS: z.string().default('reasoner,r1,o1,think'),
    AI_REASONING_MODE: z.enum(['include_reasoning', 'none', 'auto', 'reasoning_format_raw']).default('auto'),
    AI_MAX_TOKENS: z.string().transform(Number).default('32768'),
    AI_TIMEOUT_MS: z.string().transform(Number).default('3600000'),
    REQUEST_TIMEOUT_MS: z.string().transform(Number).default('3600000'),

    // BTR Specific AI Config
    AI_STAGE2_MAX_TOKENS: z.string().transform(Number).default('2048'),
    AI_STAGE4_MAX_TOKENS: z.string().transform(Number).default('8192'),
    AI_STAGE6_MAX_TOKENS: z.string().transform(Number).default('16384'),
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
    EPHEMERIS_STRICT_MODE: z
        .string()
        .default('true')
        .transform((v) => ['1', 'true', 'yes', 'on'].includes(v.toLowerCase())),

    // Security Configuration
    CLERK_SECRET_KEY: z.string().min(1, 'CLERK_SECRET_KEY is required'),
    // Memory/Queue/Performance fields removed from env for simplicity

    ENCRYPTION_SECRET: z.string().min(32, 'ENCRYPTION_SECRET must be at least 32 chars'),
    MAX_CONCURRENT_SESSIONS: z.string().transform(Number).default('3'),
    HEAP_THRESHOLD_GB: z.string().transform(Number).default('12'),

    // Rate Limiting
    RATE_LIMIT_WINDOW_MS: z.string().transform(Number).default('60000'),
    RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).default('100'),
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

        console.error('\n❌ CONFIGURATION ERROR: The engine cannot start due to missing environment variables.');
        console.error('Check your Hugging Face Space "Secrets" settings:');
        console.error(errors.join('\n'));
        console.error('\n⚠️  ACTION REQUIRED: Ensure all required variables are set correctly in the HF Space console.\n');
        throw new Error(`Configuration Validation Failed:\n${errors.join('\n')}`);
    }

    return result.data;
}

const env = parseEnv();

// Warn on likely provider/model mismatch to catch misconfigured deployments early.
if (env.AI_BASE_URL.toLowerCase().includes('groq.com') && env.AI_MODEL === 'gpt-4o') {
    console.warn('[CONFIG] AI_BASE_URL points to GROQ but AI_MODEL is still default gpt-4o. Set AI_MODEL explicitly for GROQ deployment.');
}

// ═════════════════════════════════════════════════════════════════════════════
// CONFIGURATION OBJECTS
// ═════════════════════════════════════════════════════════════════════════════

export const appConfig = {
    nodeEnv: env.NODE_ENV,
    isProduction: env.NODE_ENV === 'production',
    isDevelopment: env.NODE_ENV === 'development',
    isTest: env.NODE_ENV === 'test',
    backendUrl: env.BACKEND_URL,
    frontendUrl: env.FRONTEND_URL,
    allowedOrigins: env.ALLOWED_ORIGINS,
};

export const serverConfig = {
    port: env.PORT,
    requestTimeoutMs: env.REQUEST_TIMEOUT_MS,
    env: env.NODE_ENV,
};

export const aiConfig = {
    apiKey: env.AI_API_KEY,
    baseUrl: env.AI_BASE_URL,
    model: env.AI_MODEL,
    modelReasoner: env.AI_MODEL, // Hardcoded to match AI_MODEL
    maxTokens: env.AI_MAX_TOKENS,
    timeoutMs: env.AI_TIMEOUT_MS,
    reasonerIdentifiers: env.AI_REASONER_IDENTIFIERS.split(','),
    // Advanced fields removed for extreme simplicity
    reasoningMode: env.AI_REASONING_MODE,
    reasoningEffort: 'default' as 'low' | 'medium' | 'high' | 'default', // Hardcoded
    temperature: 0.7, // Hardcoded
    retryAttempts: 3, // Hardcoded
    retryDelayMs: 5000, // Hardcoded
    stage2MaxTokens: env.AI_STAGE2_MAX_TOKENS,
    stage4MaxTokens: env.AI_STAGE4_MAX_TOKENS,
    stage6MaxTokens: env.AI_STAGE6_MAX_TOKENS,
    parallelConcurrency: env.AI_PARALLEL_CONCURRENCY,
    parallelStaggerMs: env.AI_PARALLEL_STAGGER_MS,
    batchSizeMin: env.AI_BATCH_SIZE_MIN,
    batchSizeMax: env.AI_BATCH_SIZE_MAX,
    survivalRateBase: env.AI_SURVIVAL_RATE_BASE,
    survivalElasticityFactor: env.AI_SURVIVAL_ELASTICITY_FACTOR,
    reasonerModel: env.AI_MODEL,
};

export const dbConfig = {
    url: env.TURSO_DATABASE_URL,
    authToken: env.TURSO_AUTH_TOKEN,
};

export const encryptionConfig = {
    secret: env.ENCRYPTION_SECRET,
};

export const securityConfig = {
    clerkSecretKey: env.CLERK_SECRET_KEY,
    encryptionSecret: env.ENCRYPTION_SECRET,
    rateLimitWindowMs: env.RATE_LIMIT_WINDOW_MS,
    rateLimitMaxRequests: env.RATE_LIMIT_MAX_REQUESTS,
    jwtSecret: env.ENCRYPTION_SECRET, // Use encryptionSecret instead of jwtSecret
};

export const memoryConfig = {
    heapThresholdGB: env.HEAP_THRESHOLD_GB,
    rssThresholdGB: env.HEAP_THRESHOLD_GB + 2,
    pressureThresholdGB: Math.floor(env.HEAP_THRESHOLD_GB * 0.8),
    criticalThresholdGB: Math.floor(env.HEAP_THRESHOLD_GB * 0.95),
    gcThresholdGB: 10, // Hardcoded for HF 16GB RAM tier
};

export const performanceConfig = {
    maxConcurrentSessions: env.MAX_CONCURRENT_SESSIONS,
    rssThresholdGB: env.HEAP_THRESHOLD_GB + 2,
    heapThresholdGB: env.HEAP_THRESHOLD_GB,
};

export const config = {
    app: appConfig,
    server: serverConfig,
    ai: aiConfig,
    db: dbConfig,
    encryption: encryptionConfig,
    security: securityConfig,
    memory: memoryConfig,
    performance: performanceConfig,
    btr: {
        stage2MaxRounds: env.BTR_STAGE2_MAX_ROUNDS,
        stage4MaxRounds: env.BTR_STAGE4_MAX_ROUNDS,
        stage6MaxRounds: env.BTR_STAGE6_MAX_ROUNDS,
        clusterThreshold: env.BTR_CLUSTER_THRESHOLD_MINS,
        fallbackPromotedScore: 85, // Hardcoded
        fallbackRejectedScore: 30, // Hardcoded
    },
    ephemeris: {
        strictMode: env.EPHEMERIS_STRICT_MODE,
    },
    timeouts: {
        requestMs: env.AI_TIMEOUT_MS,
        aiMs: env.AI_TIMEOUT_MS,
    },
    queue: {
        maxConcurrent: env.MAX_CONCURRENT_SESSIONS,
        pollIntervalMs: 5000,
        maxSize: 100,
        staleTimeoutMs: 7200000, // 2 Hours hardcoded
        baseAnalysisTime: 240, // Hardcoded
        contentionMultiplier: 0.1, // Hardcoded
    },
    logging: {
        level: 'info',
        format: 'json',
        redactFields: ['apiKey', 'token', 'secret', 'password', 'authorization', 'clerkId'],
        includeStackTrace: true,
        prettyPrint: false,
    },
};

export default config;
