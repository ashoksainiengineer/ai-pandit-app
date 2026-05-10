import fs from 'node:fs';
import { defineConfig } from 'vitest/config';
import path from 'path';
import dotenv from 'dotenv';

const envFiles = [
    path.resolve(__dirname, '.env.local'),
    path.resolve(__dirname, '.env'),
    path.resolve(__dirname, '../../.env.local'),
    path.resolve(__dirname, '../../.env'),
];

const localSecretFiles = [
    path.resolve(__dirname, '../../local/dev-runtime.env'),
    path.resolve(__dirname, '../../local/cloudrun.env'),
];

for (const envFile of envFiles) {
    if (fs.existsSync(envFile)) {
        dotenv.config({ path: envFile, override: false });
    }
}

for (const envFile of localSecretFiles) {
    if (fs.existsSync(envFile)) {
        dotenv.config({ path: envFile, override: true });
    }
}

const envOrDefault = (key: string, fallback: string): string => process.env[key] ?? fallback;

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
        testTimeout: 30000,
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
            exclude: ['node_modules', 'dist', '**/*.d.ts', 'src/types/**/*'],
        },
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
        // Shared ephemeris/database test bootstrap
        setupFiles: ['./src/lib/__tests__/setup.ts'],
        pool: 'forks',
        forks: {
            singleFork: true,
        },
        env: {
            NODE_ENV: envOrDefault('NODE_ENV', 'test'),
            NEON_DATABASE_URL: envOrDefault('NEON_DATABASE_URL', 'postgresql://postgres:postgres@127.0.0.1:5432/postgres'),
            DATABASE_URL: envOrDefault('DATABASE_URL', 'postgresql://postgres:postgres@127.0.0.1:5432/postgres'),
            AI_API_KEY: envOrDefault('AI_API_KEY', 'test-key'),
            AI_MODEL: envOrDefault('AI_MODEL', 'test-model'),
            AI_TIMEOUT_MS: envOrDefault('AI_TIMEOUT_MS', '60000'),
            REQUEST_TIMEOUT_MS: envOrDefault('REQUEST_TIMEOUT_MS', '30000'),
            MAX_CONCURRENT_SESSIONS: envOrDefault('MAX_CONCURRENT_SESSIONS', '3'),
            HEAP_THRESHOLD_GB: envOrDefault('HEAP_THRESHOLD_GB', '4'),
            RSS_THRESHOLD_GB: envOrDefault('RSS_THRESHOLD_GB', '8'),
            CLERK_SECRET_KEY: envOrDefault('CLERK_SECRET_KEY', 'sk_test_123'),
            REDIS_URL: envOrDefault('REDIS_URL', 'redis://localhost:6379'),
            REDIS_TLS: envOrDefault('REDIS_TLS', 'false'),
            ENCRYPTION_SECRET: envOrDefault('ENCRYPTION_SECRET', 'test-secret-at-least-32-chars-long-12345'),
            RATE_LIMIT_WINDOW_MS: envOrDefault('RATE_LIMIT_WINDOW_MS', '60000'),
            RATE_LIMIT_MAX_REQUESTS: envOrDefault('RATE_LIMIT_MAX_REQUESTS', '100'),
            EPHEMERIS_PROVIDER: envOrDefault('EPHEMERIS_PROVIDER', 'skyfield'),
            EPHEMERIS_ALLOW_ALGORITHMIC_FALLBACK: envOrDefault('EPHEMERIS_ALLOW_ALGORITHMIC_FALLBACK', 'false'),
            EPHEMERIS_SERVICE_URL: envOrDefault('EPHEMERIS_SERVICE_URL', 'http://localhost:8000'),
            EPHEMERIS_SERVICE_TIMEOUT_MS: envOrDefault('EPHEMERIS_SERVICE_TIMEOUT_MS', '15000'),
            SKIP_EPHEMERIS_INIT: envOrDefault('SKIP_EPHEMERIS_INIT', 'false'),
            RUN_HIGH_PRECISION_EPHEMERIS_TESTS: envOrDefault('RUN_HIGH_PRECISION_EPHEMERIS_TESTS', 'false'),
        },
    },
});
