/**
 * Environment Configuration
 * Centralized, type-safe configuration for frontend environment variables
 */

function getEnvVar(value: string | undefined, key: string, defaultValue?: string): string {
  if (value === undefined) {
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    // In production, throwing here prevents the app from loading if critical keys are missing
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function getEnvVarOptional(value: string | undefined): string | undefined {
  return value;
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

// Explicit validation check
function validateEnv(): void {
  const requiredVars = [
    { key: 'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY', value: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY }
  ];

  const missing = requiredVars.filter((item) => !item.value);

  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach((item) => console.error(`  • ${item.key}`));

    if (process.env.NODE_ENV === 'production') {
      throw new Error(`Missing required environment variables: ${missing.map(m => m.key).join(', ')}`);
    }
  }
}

// Run validation
validateEnv();

export const env = {
  clerk: {
    publishableKey: getEnvVar(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY, 'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY'),
    signInUrl: getEnvVar(process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL, 'NEXT_PUBLIC_CLERK_SIGN_IN_URL', '/sign-in'),
    signUpUrl: getEnvVar(process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL, 'NEXT_PUBLIC_CLERK_SIGN_UP_URL', '/sign-up'),
    afterSignInUrl: getEnvVar(process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL, 'NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL', '/dashboard'),
    afterSignUpUrl: getEnvVar(process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL, 'NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL', '/dashboard'),
  },

  api: {
    backendUrl: (() => {
      const url = process.env.NEXT_PUBLIC_BACKEND_URL;

      if (process.env.NODE_ENV === 'production') {
        if (!url) {
          throw new Error('❌ NEXT_PUBLIC_BACKEND_URL is required in production. Set this to your Hugging Face Space URL.');
        }
        if (!url.startsWith('http')) {
          throw new Error('❌ NEXT_PUBLIC_BACKEND_URL must be an absolute URL (starting with http/https) in production.');
        }
      }

      return (url || 'http://localhost:8080').replace(/\/$/, '');
    })(),
    internalApiKey: getEnvVarOptional(process.env.INTERNAL_API_KEY),
  },

  app: {
    url: getEnvVarOptional(process.env.NEXT_PUBLIC_APP_URL),
    vercelUrl: getEnvVarOptional(process.env.NEXT_PUBLIC_VERCEL_URL),
    isProduction: process.env.NODE_ENV === 'production',
    isDevelopment: process.env.NODE_ENV === 'development',
  },

  features: {
    enableAnalytics: parseBoolean(process.env.NEXT_PUBLIC_ENABLE_ANALYTICS, false),
    enableDebug: parseBoolean(process.env.NEXT_PUBLIC_ENABLE_DEBUG, false),
  },

  warmup: {
    enabled: parseBoolean(process.env.ENABLE_WARMUP, true),
    intervalMinutes: parseNumber(process.env.WARMUP_INTERVAL_MINUTES, 2),
    timeoutMs: parseNumber(process.env.WARMUP_TIMEOUT_MS, 5000),
    endpoints: ['/api/ping', '/api/health'],
  },
} as const;

export type Env = typeof env;
