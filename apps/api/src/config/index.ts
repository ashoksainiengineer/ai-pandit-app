/**
 * Professional AI-Pandit Unified Configuration System
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
  PORT: z.string().transform((v) => {
    // Handle space-separated or multiple ports (HF occasionally passes junk)
    const first = v.split(/[\s,]/)[0];
    return Number(first) || 7860;
  }).default('7860'),
  BACKEND_URL: z.string().url().optional(),
  FRONTEND_URL: z.string().optional().transform(v => {
    if (!v) return undefined;
    // If multiple URLs passed (space-separated), take the first valid one
    const first = v.trim().split(/\s+/)[0];
    return first;
  }),
  ALLOWED_ORIGINS: z.string().trim().optional(),

  // Database Configuration (Turso)
  TURSO_DATABASE_URL: z.string().trim().min(1, 'Turso database URL is required'),
  TURSO_AUTH_TOKEN: z.string().trim().min(1, 'Turso auth token is required'),

  // AI Configuration
  AI_API_KEY: z.string().trim().min(1, 'AI_API_KEY is required'),
  AI_BASE_URL: z.string().trim().url({ message: "AI_BASE_URL is required (e.g., https://api.groq.com/openai/v1 or https://openrouter.ai/api/v1)" }),
  AI_MODEL: z.string().trim().min(1, 'AI_MODEL is required'),
  AI_MODEL_REASONER: z.string().trim().optional(),
  AI_MAX_TOKENS: z.string().min(1).transform(Number).default('32768'),
  AI_THINKING_BUDGET: z.string().min(1).transform(Number).default('24576'),
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
  CLERK_SECRET_KEY: z.string().trim().min(1, 'Clerk secret key is required'),
  CLERK_WEBHOOK_SECRET: z.string().trim().optional(),

  // Encryption
  ENCRYPTION_SECRET: z.string().trim().min(32, 'ENCRYPTION_SECRET must be at least 32 characters'),

  // Feature Flags
  ENABLE_DETAILED_LOGGING: z.string().transform((v) => v === 'true').default('false'),
  ENABLE_PRECISION_ENHANCEMENT: z.string().transform((v) => v === 'true').default('true'),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().min(1, 'RATE_LIMIT_WINDOW_MS is required').transform(Number),
  RATE_LIMIT_MAX_REQUESTS: z.string().min(1, 'RATE_LIMIT_MAX_REQUESTS is required').transform(Number),

  // Provider Optimization
  AI_PROVIDER_ORDER: z.string().default('').transform(s => s ? s.split(',') : []),
  AI_MAX_CONCURRENCY: z.string().optional().transform((v) => v ? Number(v) : undefined),
  AI_REASONER_IDENTIFIERS: z.string().trim().default('reasoner,r1').transform(s => s.split(',')),
  // Reasoning configuration modes
  AI_REASONING_MODE: z.enum(['include_reasoning', 'reasoning_format_raw', 'auto', 'none']).default('include_reasoning'),
  AI_REASONING_EFFORT: z.enum(['low', 'medium', 'high', 'default']).default('medium'),
  // Per-stage output token limits — tune individually for quality vs speed
  AI_STAGE2_MAX_TOKENS: z.string().transform(Number).default('32768'),
  AI_STAGE4_MAX_TOKENS: z.string().transform(Number).default('32768'),
  AI_STAGE6_MAX_TOKENS: z.string().transform(Number).default('32768'),

  // AI Parallelism & Performance
  AI_PARALLEL_CONCURRENCY: z.string().transform(Number).default('2'),
  AI_PARALLEL_STAGGER_MS: z.string().transform(Number).default('2000'),

  // BTR Logic Thresholds
  BTR_STAGE2_MAX_ROUNDS: z.string().transform(Number).default('5'),
  BTR_STAGE4_MAX_ROUNDS: z.string().transform(Number).default('3'),
  BTR_STAGE6_MAX_ROUNDS: z.string().transform(Number).default('3'),

  // Dynamic Scaling
  AI_BATCH_SIZE_MIN: z.string().transform(Number).default('5'),
  AI_BATCH_SIZE_MAX: z.string().transform(Number).default('10'),
  AI_SURVIVAL_RATE_BASE: z.string().transform(Number).default('0.35'),
  AI_SURVIVAL_ELASTICITY_FACTOR: z.string().transform(Number).default('1.1'),

  BTR_CLUSTER_THRESHOLD_MINS: z.string().transform(Number).default('2'),
  BTR_FALLBACK_PROMOTED_SCORE: z.string().transform(Number).default('85'),
  BTR_FALLBACK_REJECTED_SCORE: z.string().transform(Number).default('40'),

  // Grid Configuration (Now configurable)
  BTR_REFINEMENT_GRID_MINS: z.string().transform(Number).default('5'),
  BTR_MICRO_GRID_MINS: z.string().transform(Number).default('0.5'),
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
    console.error('\nPlease check your environment variables/secrets on Hugging Face.');

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
  reasonerModel: env.AI_MODEL_REASONER || env.AI_MODEL,
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

  // Reasoner model identifiers for special protocol handling
  reasonerIdentifiers: env.AI_REASONER_IDENTIFIERS,
  // How to request reasoning from the provider (configurable, not hardcoded)
  reasoningMode: env.AI_REASONING_MODE,
  reasoningEffort: env.AI_REASONING_EFFORT,
  // Per-stage output token limits
  stage2MaxTokens: env.AI_STAGE2_MAX_TOKENS,
  stage4MaxTokens: env.AI_STAGE4_MAX_TOKENS,
  stage6MaxTokens: env.AI_STAGE6_MAX_TOKENS,
  // Batching & Scaling
  batchSizeMin: env.AI_BATCH_SIZE_MIN,
  batchSizeMax: env.AI_BATCH_SIZE_MAX,
  survivalRateBase: env.AI_SURVIVAL_RATE_BASE,
  survivalElasticityFactor: env.AI_SURVIVAL_ELASTICITY_FACTOR,
  // Parallelism
  parallelConcurrency: env.AI_PARALLEL_CONCURRENCY,
  parallelStaggerMs: env.AI_PARALLEL_STAGGER_MS,
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
  enablePrecisionEnhancement: env.ENABLE_PRECISION_ENHANCEMENT,
} as const;

// ═════════════════════════════════════════════════════════════════════════════
// BTR PROCESSING CONFIGURATION
// ═════════════════════════════════════════════════════════════════════════════

export const btrConfig = {
  // Batch processing
  stage2MaxRounds: env.BTR_STAGE2_MAX_ROUNDS,
  stage4MaxRounds: env.BTR_STAGE4_MAX_ROUNDS,
  stage6MaxRounds: env.BTR_STAGE6_MAX_ROUNDS,
  clusterThreshold: env.BTR_CLUSTER_THRESHOLD_MINS,
  fallbackPromotedScore: env.BTR_FALLBACK_PROMOTED_SCORE,
  fallbackRejectedScore: env.BTR_FALLBACK_REJECTED_SCORE,

  // Refinement grid
  refinementGridMinutes: env.BTR_REFINEMENT_GRID_MINS,
  refinementGridInterval: 60, // 1 minute (fixed internal constant)
  microGridMinutes: env.BTR_MICRO_GRID_MINS,
  microGridInterval: 6, // 6 seconds (fixed internal constant)

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
  precisionMinConsensus: 85,
  precisionConfidenceLevel: 'VERY_HIGH' as const,
} as const;

// ═════════════════════════════════════════════════════════════════════════════
// LOGGING CONFIGURATION
// ═════════════════════════════════════════════════════════════════════════════

export const loggingConfig = {
  level: env.ENABLE_DETAILED_LOGGING ? 'debug' : 'info',
  format: env.NODE_ENV === 'production' ? 'json' : 'pretty',
  includeTimestamp: true,
  includeStackTrace: env.NODE_ENV !== 'production',
  redactFields: [
    'apiKey',
    'authToken',
    'password',
    'secret',
    'token',
    'sid',
    'Authorization',
    'clerkSecretKey',
    'internalApiKey'
  ],
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
