/**
 * Environment Configuration
 * Centralized, type-safe configuration for frontend environment variables
 */

function getEnvVar(key: string, defaultValue?: string): string {
  const value = process.env[key];
  if (value === undefined) {
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function getEnvVarOptional(key: string): string | undefined {
  return process.env[key];
}

function parseBoolean(value: string | undefined, defaultValue: boolean): boolean {
  if (value === undefined) return defaultValue;
  return value.toLowerCase() === 'true';
}

function parseNumber(value: string | undefined, defaultValue: number): number {
  if (value === undefined) return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

// Validate required environment variables on load
function validateEnv(): void {
  const required = ['NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY'];
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach((key) => console.error(`  • ${key}`));
    console.error('\nPlease check your .env.local file');

    if (process.env.NODE_ENV === 'production') {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
  }
}

// Run validation
validateEnv();

export const env = {
  clerk: {
    publishableKey: getEnvVar('NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY'),
    signInUrl: getEnvVar('NEXT_PUBLIC_CLERK_SIGN_IN_URL', '/sign-in'),
    signUpUrl: getEnvVar('NEXT_PUBLIC_CLERK_SIGN_UP_URL', '/sign-up'),
    afterSignInUrl: getEnvVar('NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL', '/dashboard'),
    afterSignUpUrl: getEnvVar('NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL', '/dashboard'),
  },

  api: {
    backendUrl: getEnvVar('NEXT_PUBLIC_BACKEND_URL', 'http://localhost:8080'),
    internalApiKey: getEnvVarOptional('INTERNAL_API_KEY'),
  },

  app: {
    url: getEnvVarOptional('NEXT_PUBLIC_APP_URL'),
    vercelUrl: getEnvVarOptional('NEXT_PUBLIC_VERCEL_URL'),
    isProduction: process.env.NODE_ENV === 'production',
    isDevelopment: process.env.NODE_ENV === 'development',
  },

  features: {
    enableAnalytics: parseBoolean(getEnvVarOptional('NEXT_PUBLIC_ENABLE_ANALYTICS'), false),
    enableDebug: parseBoolean(getEnvVarOptional('NEXT_PUBLIC_ENABLE_DEBUG'), false),
  },

  warmup: {
    enabled: parseBoolean(getEnvVarOptional('ENABLE_WARMUP'), true),
    intervalMinutes: parseNumber(getEnvVarOptional('WARMUP_INTERVAL_MINUTES'), 2),
    timeoutMs: parseNumber(getEnvVarOptional('WARMUP_TIMEOUT_MS'), 5000),
    endpoints: ['/api/ping', '/api/health'],
  },
} as const;

export type Env = typeof env;
