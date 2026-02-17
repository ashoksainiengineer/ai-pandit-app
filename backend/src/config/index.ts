/**
 * 🔱 AI-Pandit Unified Configuration System
 * ==========================================
 * Centralized, type-safe configuration with validation.
 * Follows 12-factor app principles with environment-based config.
 */

import { z } from 'zod';

// ═════════════════════════════════════════════════════════════════════════════
// ENVIRONMENT SCHEMA VALIDATION
// ═════════════════════════════════════════════════════════════════════════════

const envSchema = z.object({
  // Server Configuration
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('3001'),
  BACKEND_URL: z.string().url().optional(),
  FRONTEND_URL: z.string().url().optional(),
  ALLOWED_ORIGINS: z.string().optional(), // Comma-separated list of allowed CORS origins

  // Database Configuration (Turso)
  TURSO_DATABASE_URL: z.string().min(1, 'Turso database URL is required'),
  TURSO_AUTH_TOKEN: z.string().min(1, 'Turso auth token is required'),

  // AI Configuration
  AI_API_KEY: z.string().min(1, 'AI_API_KEY is required'),
  AI_BASE_URL: z.string().url().default('https://openrouter.ai/api/v1'),
  AI_MODEL: z.string().min(1, 'AI_MODEL is required'),
  AI_MAX_TOKENS: z.string().min(1).transform(Number).default('65536'),
  AI_THINKING_BUDGET: z.string().min(1).transform(Number).default('49152'),
  AI_TEMPERATURE: z.string().min(1).transform(Number).default('0'),
  AI_RETRY_ATTEMPTS: z.string().min(1).transform(Number).default('3'),
  AI_RETRY_DELAY_MS: z.string().min(1).transform(Number).default('2000'),
  AI_TIMEOUT_MS: z.string().min(1, 'AI_TIMEOUT_MS is required').transform(Number),
  REQUEST_TIMEOUT_MS: z.string().min(1, 'REQUEST_TIMEOUT_MS is required').transform(Number),

  // Queue Configuration
  MAX_CONCURRENT_SESSIONS: z.string().min(1, 'MAX_CONCURRENT_SESSIONS is required').transform(Number),
  QUEUE_POLL_INTERVAL_MS: z.string().min(1).transform(Number).default('2000'),
  QUEUE_MAX_SIZE: z.string().min(1).transform(Number).default('1000'),
  QUEUE_STALE_TIMEOUT_MS: z.string().min(1).transform(Number).default('7200000'), // 2 hours

  // Memory Management
  HEAP_THRESHOLD_GB: z.string().min(1, 'HEAP_THRESHOLD_GB is required').transform(Number),
  RSS_THRESHOLD_GB: z.string().min(1, 'RSS_THRESHOLD_GB is required').transform(Number),

  // Security
  INTERNAL_API_KEY: z.string().optional(),
  CLERK_SECRET_KEY: z.string().min(1, 'Clerk secret key is required'),
  CLERK_WEBHOOK_SECRET: z.string().optional(),

  // Encryption
  ENCRYPTION_SECRET: z.string().min(32, 'ENCRYPTION_SECRET must be at least 32 characters'),

  // Feature Flags
  ENABLE_DETAILED_LOGGING: z.string().transform((v) => v === 'true').default('false'),
  ENABLE_GOD_TIER_ENHANCEMENT: z.string().transform((v) => v === 'true').default('true'),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().min(1, 'RATE_LIMIT_WINDOW_MS is required').transform(Number),
  RATE_LIMIT_MAX_REQUESTS: z.string().min(1, 'RATE_LIMIT_MAX_REQUESTS is required').transform(Number),

  // Provider Optimization
  AI_PROVIDER_ORDER: z.string().default('Google Vertex,Together,DeepInfra').transform(s => s.split(',')),
  AI_MAX_CONCURRENCY: z.string().optional().transform((v) => v ? Number(v) : undefined),
});

// ═════════════════════════════════════════════════════════════════════════════
// PARSE AND VALIDATE ENVIRONMENT
// ═════════════════════════════════════════════════════════════════════════════

function parseEnv(): z.infer<typeof envSchema> {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const errors = result.error.errors.map(
      (e) => `  • ${e.path.join('.')}: ${e.message}`
    );

    console.error('❌ Configuration Validation Failed:\n');
    console.error(errors.join('\n'));
    console.error('\nPlease check your environment variables.');
    process.exit(1);
  }

  return result.data;
}

const env = parseEnv();

// ═════════════════════════════════════════════════════════════════════════════
// CONFIGURATION OBJECTS
// ═════════════════════════════════════════════════════════════════════════════

export const serverConfig = {
  env: env.NODE_ENV,
  port: env.PORT,
  backendUrl: env.BACKEND_URL || `http://localhost:${env.PORT}`,
  isDevelopment: env.NODE_ENV === 'development',
  isProduction: env.NODE_ENV === 'production',
  isTest: env.NODE_ENV === 'test',
} as const;

export const databaseConfig = {
  url: env.TURSO_DATABASE_URL,
  authToken: env.TURSO_AUTH_TOKEN,
  connectionTimeout: 30000,
  maxRetries: 3,
} as const;

export const aiConfig = {
  apiKey: env.AI_API_KEY,
  baseUrl: env.AI_BASE_URL,
  model: env.AI_MODEL,
  maxTokens: env.AI_MAX_TOKENS,
  thinkingBudget: env.AI_THINKING_BUDGET,
  temperature: env.AI_TEMPERATURE,
  retryAttempts: env.AI_RETRY_ATTEMPTS,
  retryDelayMs: env.AI_RETRY_DELAY_MS,
  timeoutMs: env.AI_TIMEOUT_MS,

  // Provider optimization (Driven by HF env var)
  providerOrder: env.AI_PROVIDER_ORDER,
  allowFallbacks: true,
  dataCollection: 'deny' as const,

  // Parallel Processing Optimization
  // Use AI_MAX_CONCURRENCY if set, otherwise fallback to environment defaults
  maxConcurrency: env.AI_MAX_CONCURRENCY ?? (env.NODE_ENV === 'production' ? 10 : 5),
  staggerMs: 500,
} as const;

export const queueConfig = {
  maxConcurrent: env.MAX_CONCURRENT_SESSIONS,
  pollIntervalMs: env.QUEUE_POLL_INTERVAL_MS,
  maxSize: env.QUEUE_MAX_SIZE,
  staleTimeoutMs: env.QUEUE_STALE_TIMEOUT_MS,
  baseAnalysisTime: 240, // 4 minutes
  contentionMultiplier: 0.25,
} as const;

// Legacy compatibility - health.ts uses performance.rssThresholdGB
export const performanceConfig = {
  maxConcurrentSessions: env.MAX_CONCURRENT_SESSIONS,
  rssThresholdGB: env.RSS_THRESHOLD_GB,
  heapThresholdGB: env.HEAP_THRESHOLD_GB,
} as const;

// Legacy compatibility - health.ts uses app.nodeEnv
export const appConfig = {
  nodeEnv: env.NODE_ENV,
  port: env.PORT,
  isProduction: env.NODE_ENV === 'production',
  isDevelopment: env.NODE_ENV === 'development',
} as const;

// Timeout configuration for middleware
export const timeoutsConfig = {
  requestMs: 300000, // 5 minutes
  aiMs: 7200000, // 2 hours
  healthMs: 5000, // 5 seconds
} as const;

export const memoryConfig = {
  heapThresholdGB: env.HEAP_THRESHOLD_GB,
  gcThresholdGB: env.RSS_THRESHOLD_GB,
  pressureThresholdGB: 10,
  criticalThresholdGB: 12,
} as const;

export const securityConfig = {
  internalApiKey: env.INTERNAL_API_KEY,
  clerkSecretKey: env.CLERK_SECRET_KEY,
  clerkWebhookSecret: env.CLERK_WEBHOOK_SECRET,
  rateLimitWindowMs: env.RATE_LIMIT_WINDOW_MS,
  rateLimitMaxRequests: env.RATE_LIMIT_MAX_REQUESTS,
} as const;

export const encryptionConfig = {
  secret: env.ENCRYPTION_SECRET || '',
} as const;

export const featureFlags = {
  enableDetailedLogging: env.ENABLE_DETAILED_LOGGING,
  enableGodTierEnhancement: env.ENABLE_GOD_TIER_ENHANCEMENT,
} as const;

// ═════════════════════════════════════════════════════════════════════════════
// BTR PROCESSING CONFIGURATION
// ═════════════════════════════════════════════════════════════════════════════

export const btrConfig = {
  // Batch processing
  maxBatchSize: 4,
  survivorsPerBatch: 3,

  // Refinement grid
  refinementGridMinutes: 5,
  refinementGridInterval: 60, // 1 minute
  microGridMinutes: 0.5, // 30 seconds
  microGridInterval: 6, // 6 seconds

  // Precision levels
  stages: [
    { id: 'grid', name: 'Exhaustive Data Generation' },
    { id: 'coarse', name: 'Batch Tournament' },
    { id: 'fine', name: 'Refinement Grid' },
    { id: 'deep', name: 'Deep Multi-Dasha Analysis' },
    { id: 'micro', name: 'Micro Precision Grid' },
    { id: 'final', name: 'Final Precision' },
  ] as const,

  // God-Tier thresholds
  godTierMinConsensus: 85,
  godTierConfidenceLevel: 'VERY_HIGH' as const,
} as const;

// ═════════════════════════════════════════════════════════════════════════════
// LOGGING CONFIGURATION
// ═════════════════════════════════════════════════════════════════════════════

export const loggingConfig = {
  level: env.ENABLE_DETAILED_LOGGING ? 'debug' : 'info',
  format: env.NODE_ENV === 'production' ? 'json' : 'pretty',
  includeTimestamp: true,
  includeStackTrace: env.NODE_ENV !== 'production',
  redactFields: ['apiKey', 'authToken', 'password', 'secret', 'token'],
} as const;

// ═════════════════════════════════════════════════════════════════════════════
// UNIFIED CONFIG EXPORT
// ═════════════════════════════════════════════════════════════════════════════

export const config = {
  server: serverConfig,
  database: databaseConfig,
  ai: aiConfig,
  queue: queueConfig,
  memory: memoryConfig,
  security: securityConfig,
  encryption: encryptionConfig,
  features: featureFlags,
  btr: btrConfig,
  logging: loggingConfig,
  timeouts: timeoutsConfig,
  // Legacy compatibility
  performance: performanceConfig,
  app: appConfig,
} as const;

export type Config = typeof config;

export default config;
