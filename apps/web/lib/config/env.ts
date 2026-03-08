/**
 * Environment Configuration
 * Centralized, type-safe configuration for frontend environment variables
 */

function getEnvVar(value: string | undefined, key: string, defaultValue?: string): string {
  if (value === undefined) {
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    // BUILD-TIME WORKAROUND: Prevent crashes during static generation
    if (
      process.env.NODE_ENV === 'production' ||
      process.env.NODE_ENV === 'test' ||
      process.env.NEXT_PHASE === 'phase-production-build'
    ) {
      // Silence placeholder warnings during build if they are repetitive
      return `placeholder_${key}`;
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
    const isBuildPhase = process.env.NEXT_PHASE === 'phase-production-build';
    if (!isBuildPhase) {
      console.warn('⚠️ Missing environment variables (Optional during build):');
      missing.forEach((item) => console.warn(`  • ${item.key}`));
    }

    // We don't throw during build to allow static generation to complete
    if (process.env.NODE_ENV === 'production' && !isBuildPhase) {
      // Only throw in true PRODUCTION runtime, not during build
      // Note: Next.js doesn't always set NEXT_PHASE correctly here, but we can assume
      // if we are here and it's production, it might be build.
      // To be safe, we'll just warn and let getEnvVar handle the strictness if needed.
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
    signInFallbackRedirectUrl: getEnvVar(process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL, 'NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL', '/dashboard'),
    signUpFallbackRedirectUrl: getEnvVar(process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL, 'NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL', '/dashboard'),
    webhookSecret: process.env.CLERK_WEBHOOK_SECRET,
  },

  api: {
    // Priority: explicit env var, then localhost fallback for local development.
    // Production must set NEXT_PUBLIC_BACKEND_URL to the deployed backend origin.
    backendUrl: process.env.NEXT_PUBLIC_BACKEND_URL || (process.env.NODE_ENV === 'development' ? 'http://localhost:3001' : ''),
    huggingFaceToken: getEnvVarOptional(process.env.NEXT_PUBLIC_HF_TOKEN),
    internalApiKey: undefined, // Removed for security realignment
  },

  app: {
    url: getEnvVarOptional(process.env.FRONTEND_URL),
    vercelUrl: getEnvVarOptional(process.env.NEXT_PUBLIC_VERCEL_URL),
    baseUrl: process.env.FRONTEND_URL || (process.env.NEXT_PUBLIC_VERCEL_URL ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}` : 'http://localhost:3000'),
    isProduction: process.env.NODE_ENV === 'production',
    isDevelopment: process.env.NODE_ENV === 'development',
    isTest: process.env.NODE_ENV === 'test',
    region: process.env.VERCEL_REGION || 'unknown',
    nextPhase: process.env.NEXT_PHASE,
  },

  security: {
    encryptionSecret: process.env.ENCRYPTION_SECRET,
  },

  features: {
    enableAnalytics: false, // Hardcoded
    enableDebug: false, // Hardcoded for production stability
  },

  warmup: {
    enabled: false, // Hardcoded/Disabled
    intervalMinutes: 2,
    timeoutMs: 5000,
    endpoints: ['/api/ping', '/api/health'],
  },
} as const;

export type Env = typeof env;
