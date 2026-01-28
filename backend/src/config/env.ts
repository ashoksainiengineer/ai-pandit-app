// ═══════════════════════════════════════════════════════════════════════════════
// ENVIRONMENT CONFIGURATION VALIDATION
// Zod-based schema validation for all environment variables
// Fails fast on startup if configuration is invalid
// ═══════════════════════════════════════════════════════════════════════════════

import { z } from 'zod';
import { logger } from '../lib/logger.js';

// ───────────────────────────────────────────────────────────────────────────────
// SCHEMA DEFINITIONS
// ───────────────────────────────────────────────────────────────────────────────

const envSchema = z.object({
  // Node.js environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().regex(/^\d+$/).transform(Number).default('7860'),
  
  // Turso Database
  TURSO_DATABASE_URL: z.string().min(1, 'TURSO_DATABASE_URL is required'),
  TURSO_AUTH_TOKEN: z.string().min(1, 'TURSO_AUTH_TOKEN is required'),
  
  // Clerk Authentication
  CLERK_SECRET_KEY: z.string().min(1, 'CLERK_SECRET_KEY is required'),
  CLERK_PUBLISHABLE_KEY: z.string().min(1, 'CLERK_PUBLISHABLE_KEY is required').optional(),
  
  // Encryption (Critical - no defaults)
  ENCRYPTION_SECRET: z.string().min(32, 'ENCRYPTION_SECRET must be at least 32 characters'),
  
  // AI Configuration
  AI_API_KEY: z.string().min(1, 'AI_API_KEY is required'),
  AI_BASE_URL: z.string().url().default('https://openrouter.ai/api/v1'),
  AI_MODEL: z.string().default('deepseek/deepseek-r1'),
  
  // Optional: Frontend URLs for CORS
  FRONTEND_URL: z.string().url().optional(),
  VERCEL_URL: z.string().optional(),
  
  // Memory/Performance Tuning
  MAX_CONCURRENT_SESSIONS: z.string().regex(/^\d+$/).transform(Number).default('3'),
  RSS_THRESHOLD_GB: z.string().regex(/^\d+$/).transform(Number).default('10'),
  HEAP_THRESHOLD_GB: z.string().regex(/^\d+$/).transform(Number).default('8'),
  
  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().regex(/^\d+$/).transform(Number).default('60000'),
  RATE_LIMIT_MAX_REQUESTS: z.string().regex(/^\d+$/).transform(Number).default('100'),
  
  // Timeouts - BTR can take 2+ hours for complex cases
  REQUEST_TIMEOUT_MS: z.string().regex(/^\d+$/).transform(Number).default('7200000'), // 2 hours
  AI_TIMEOUT_MS: z.string().regex(/^\d+$/).transform(Number).default('7200000'), // 2 hours for DeepSeek R1
});

// ═══════════════════════════════════════════════════════════════════════════════
// VALIDATION & EXPORT
// ═══════════════════════════════════════════════════════════════════════════════

let validatedEnv: z.infer<typeof envSchema>;

try {
  validatedEnv = envSchema.parse(process.env);
  
  logger.info('✅ Environment configuration validated', {
    nodeEnv: validatedEnv.NODE_ENV,
    port: validatedEnv.PORT,
    database: validatedEnv.TURSO_DATABASE_URL.split('?')[0], // Hide auth token
    aiProvider: new URL(validatedEnv.AI_BASE_URL).hostname,
    aiModel: validatedEnv.AI_MODEL,
  });
  
} catch (error) {
  if (error instanceof z.ZodError) {
    const issues = error.issues.map(i => `${i.path.join('.')}: ${i.message}`);
    
    logger.error('🔴 Environment validation failed:', { issues });
    
    // Print detailed errors to stderr for visibility
    console.error('\n╔════════════════════════════════════════════════════════════════╗');
    console.error('║  ENVIRONMENT CONFIGURATION ERRORS                              ║');
    console.error('╠════════════════════════════════════════════════════════════════╣');
    issues.forEach(issue => console.error(`║  • ${issue.padEnd(60)}║`));
    console.error('╚════════════════════════════════════════════════════════════════╝\n');
    
    throw new Error(`Environment validation failed: ${issues.join(', ')}`);
  }
  throw error;
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORT VALIDATED CONFIG
// ═══════════════════════════════════════════════════════════════════════════════

export const env = validatedEnv;

// Type-safe config object for application use
export const config = {
  app: {
    nodeEnv: validatedEnv.NODE_ENV,
    port: validatedEnv.PORT,
    isProduction: validatedEnv.NODE_ENV === 'production',
    isDevelopment: validatedEnv.NODE_ENV === 'development',
  },
  
  database: {
    url: validatedEnv.TURSO_DATABASE_URL,
    authToken: validatedEnv.TURSO_AUTH_TOKEN,
  },
  
  auth: {
    clerkSecretKey: validatedEnv.CLERK_SECRET_KEY,
    clerkPublishableKey: validatedEnv.CLERK_PUBLISHABLE_KEY,
  },
  
  encryption: {
    secret: validatedEnv.ENCRYPTION_SECRET,
  },
  
  ai: {
    apiKey: validatedEnv.AI_API_KEY,
    baseUrl: validatedEnv.AI_BASE_URL,
    model: validatedEnv.AI_MODEL,
    timeoutMs: validatedEnv.AI_TIMEOUT_MS,
  },
  
  cors: {
    frontendUrl: validatedEnv.FRONTEND_URL,
    vercelUrl: validatedEnv.VERCEL_URL,
  },
  
  performance: {
    maxConcurrentSessions: validatedEnv.MAX_CONCURRENT_SESSIONS,
    rssThresholdGB: validatedEnv.RSS_THRESHOLD_GB,
    heapThresholdGB: validatedEnv.HEAP_THRESHOLD_GB,
  },
  
  rateLimit: {
    windowMs: validatedEnv.RATE_LIMIT_WINDOW_MS,
    maxRequests: validatedEnv.RATE_LIMIT_MAX_REQUESTS,
  },
  
  timeouts: {
    requestMs: validatedEnv.REQUEST_TIMEOUT_MS,
    aiMs: validatedEnv.AI_TIMEOUT_MS,
  },
} as const;

// Freeze config to prevent runtime modifications
Object.freeze(config);
