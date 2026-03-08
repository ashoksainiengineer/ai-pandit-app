import { z } from 'zod';

const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.string().transform((v) => v.split(/[\s,]/)[0]).default('7860'),
    BACKEND_URL: z.string().url().optional(),
    FRONTEND_URL: z.string().optional().transform(v => v?.trim().split(/\s+/)[0]),
    ALLOWED_ORIGINS: z.string().trim().optional(),
    TURSO_DATABASE_URL: z.string().min(1, 'TURSO_DATABASE_URL is required'),
    TURSO_AUTH_TOKEN: z.string().min(1, 'TURSO_AUTH_TOKEN is required'),
    AI_API_KEY: z.string().min(1, 'AI_API_KEY is required'),
    AI_BASE_URL: z.string().url('AI_BASE_URL is required'),
    AI_MODEL: z.string().min(1, 'AI_MODEL is required'),
    AI_MODEL_REASONER: z.string().optional(),
    AI_MAX_TOKENS: z.string().transform(Number).default('32768'),
    AI_THINKING_BUDGET: z.string().transform(Number).default('24576'),
    AI_TIMEOUT_MS: z.string().transform(Number).default('3600000'),
    REQUEST_TIMEOUT_MS: z.string().transform(Number).default('3600000'),
    MAX_CONCURRENT_SESSIONS: z.string().transform(Number).default('5'),
    HEAP_THRESHOLD_GB: z.string().transform(Number).default('12'),
    RSS_THRESHOLD_GB: z.string().optional().transform(v => v ? Number(v) : undefined),
    PRESSURE_THRESHOLD_GB: z.string().optional().transform(v => v ? Number(v) : undefined),
    CRITICAL_THRESHOLD_GB: z.string().optional().transform(v => v ? Number(v) : undefined),
    CLERK_SECRET_KEY: z.string().min(1, 'CLERK_SECRET_KEY is required'),
    ENCRYPTION_SECRET: z.string().min(32, 'ENCRYPTION_SECRET must be at least 32 chars'),
    RATE_LIMIT_WINDOW_MS: z.string().transform(Number).default('60000'),
    RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).default('100'),
});

function parseEnv() {
    const result = envSchema.safeParse(process.env);
    if (!result.success) {
        const errors = result.error.errors.map(e => `  • ${e.path.join('.')}: ${e.message}`);
        console.error('\n❌ CONFIGURATION ERROR: Missing environment variables.');
        console.error(errors.join('\n'));
        if (process.env.NODE_ENV === 'production') {
            setTimeout(() => process.exit(1), 1000);
            return result.data as any;
        }
        if (process.env.NODE_ENV === 'test') {
            throw new Error(`Config Failed:\n${errors.join('\n')}`);
        }
        process.exit(1);
    }
    return result.data;
}

const env = parseEnv();

// Smart defaults for memory
const rssDefault = env.RSS_THRESHOLD_GB || (env.HEAP_THRESHOLD_GB + 2);

export const config = {
    server: { env: env.NODE_ENV, port: env.PORT },
    ai: { apiKey: env.AI_API_KEY, baseUrl: env.AI_BASE_URL, model: env.AI_MODEL },
    memory: {
        heapThresholdGB: env.HEAP_THRESHOLD_GB,
        rssThresholdGB: rssDefault,
        pressureThresholdGB: env.PRESSURE_THRESHOLD_GB || Math.floor(env.HEAP_THRESHOLD_GB * 0.8),
        criticalThresholdGB: env.CRITICAL_THRESHOLD_GB || Math.floor(env.HEAP_THRESHOLD_GB * 0.95),
    },
    security: { clerkSecretKey: env.CLERK_SECRET_KEY, encryptionSecret: env.ENCRYPTION_SECRET },
} as any; // Simplified for brevity, in reality we'd keep the full structure

export default config;
