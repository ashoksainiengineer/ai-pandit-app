import { z } from 'zod';

// ═════════════════════════════════════════════════════════════════════════════
// ENVIRONMENT SCHEMA
// ═════════════════════════════════════════════════════════════════════════════

const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.string().transform((v) => v.split(/[\s,]/)[0]).default('7860'),

    // URLs & Origins
    BACKEND_URL: z.string().url().optional(),
    FRONTEND_URL: z.string().optional().transform(v => v?.trim().split(/\s+/)[0]),
    ALLOWED_ORIGINS: z.string().trim().optional(),

    // Database (Turso)
    TURSO_DATABASE_URL: z.string().min(1, 'TURSO_DATABASE_URL is required'),
    TURSO_AUTH_TOKEN: z.string().min(1, 'TURSO_AUTH_TOKEN is required'),

    // AI Provider (Groq/Deepseek/OpenAI compatible)
    AI_API_KEY: z.string().min(1, 'AI_API_KEY is required'),
    AI_BASE_URL: z.string().url('AI_BASE_URL must be a valid URL'),
    AI_MODEL: z.string().min(1, 'AI_MODEL is required'),
    AI_MODEL_REASONER: z.string().optional(),
    AI_MAX_TOKENS: z.string().transform(Number).default('32768'),
    AI_THINKING_BUDGET: z.string().transform(Number).default('24576'),
    AI_TIMEOUT_MS: z.string().transform(Number).default('3600000'),

    // System & Performance
    REQUEST_TIMEOUT_MS: z.string().transform(Number).default('3600000'),
    MAX_CONCURRENT_SESSIONS: z.string().transform(Number).default('5'),

    // Memory Management (Auto-scaling defaults)
    HEAP_THRESHOLD_GB: z.string().transform(Number).default('12'),
    RSS_THRESHOLD_GB: z.string().optional().transform(v => v ? Number(v) : undefined),
    PRESSURE_THRESHOLD_GB: z.string().optional().transform(v => v ? Number(v) : undefined),
    CRITICAL_THRESHOLD_GB: z.string().optional().transform(v => v ? Number(v) : undefined),

    // Security
    CLERK_SECRET_KEY: z.string().min(1, 'CLERK_SECRET_KEY is required'),
    ENCRYPTION_SECRET: z.string().min(32, 'ENCRYPTION_SECRET must be at least 32 chars'),

    // Rate Limiting
    RATE_LIMIT_WINDOW_MS: z.string().transform(Number).default('60000'),
    RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).default('100'),

    // Internal
    INTERNAL_API_KEY: z.string().optional(),
    LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
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

        if (process.env.NODE_ENV === 'production') {
            // Small delay to ensure logs are flushed
            setTimeout(() => process.exit(1), 1000);
            return result.data as any; // Never reached
        }

        if (process.env.NODE_ENV === 'test') {
            throw new Error(`Configuration Validation Failed:\n${errors.join('\n')}`);
        }

        process.exit(1);
    }

    return result.data;
}

const env = parseEnv();

// ═════════════════════════════════════════════════════════════════════════════
// CONFIGURATION OBJECTS
// ═════════════════════════════════════════════════════════════════════════════

export const appConfig = {
    nodeEnv: env.NODE_ENV,
    backendUrl: env.BACKEND_URL,
    frontendUrl: env.FRONTEND_URL,
    allowedOrigins: env.ALLOWED_ORIGINS,
};

export const serverConfig = {
    port: parseInt(env.PORT, 10),
    requestTimeoutMs: env.REQUEST_TIMEOUT_MS,
    env: env.NODE_ENV, // Compatibility with some versions of server.ts
};

export const aiConfig = {
    apiKey: env.AI_API_KEY,
    baseUrl: env.AI_BASE_URL,
    model: env.AI_MODEL,
    modelReasoner: env.AI_MODEL_REASONER,
    maxTokens: env.AI_MAX_TOKENS,
    thinkingBudget: env.AI_THINKING_BUDGET,
    timeoutMs: env.AI_TIMEOUT_MS,
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
    internalApiKey: env.INTERNAL_API_KEY,
};

const rssDefault = env.RSS_THRESHOLD_GB || (env.HEAP_THRESHOLD_GB + 2);

export const memoryConfig = {
    heapThresholdGB: env.HEAP_THRESHOLD_GB,
    rssThresholdGB: rssDefault,
    pressureThresholdGB: env.PRESSURE_THRESHOLD_GB || Math.floor(env.HEAP_THRESHOLD_GB * 0.8),
    criticalThresholdGB: env.CRITICAL_THRESHOLD_GB || Math.floor(env.HEAP_THRESHOLD_GB * 0.95),
};

export const performanceConfig = {
    maxConcurrentSessions: env.MAX_CONCURRENT_SESSIONS,
    rssThresholdGB: rssDefault,
    heapThresholdGB: env.HEAP_THRESHOLD_GB,
};

// Combined configuration object (named + default export)
export const config = {
    app: appConfig,
    server: serverConfig,
    ai: aiConfig,
    db: dbConfig,
    encryption: encryptionConfig,
    security: securityConfig,
    memory: memoryConfig,
    performance: performanceConfig,
    timeouts: {
        requestMs: env.REQUEST_TIMEOUT_MS,
        aiMs: env.AI_TIMEOUT_MS,
    },
    queue: {
        maxConcurrent: env.MAX_CONCURRENT_SESSIONS,
    },
    logging: {
        level: env.LOG_LEVEL,
        redactFields: ['apiKey', 'clerkId', 'email', 'password', 'authToken', 'secret'],
        prettyPrint: env.NODE_ENV === 'development',
    },
};

export default config;
