import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
            exclude: ['node_modules', 'dist', '**/*.d.ts', 'src/types/**/*'],
        },
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
        // Required for Swiss Ephemeris binary initialization in tests
        setupFiles: ['./src/lib/__tests__/setup.ts'],
        pool: 'forks',
        // @ts-ignore - Vitest 4 top-level pool options
        forks: {
            singleFork: true,
        },
        env: {
            NODE_ENV: 'test',
            TURSO_DATABASE_URL: 'libsql://test.db',
            TURSO_AUTH_TOKEN: 'test-token',
            AI_API_KEY: 'test-key',
            AI_MODEL: 'test-model',
            AI_TIMEOUT_MS: '60000',
            REQUEST_TIMEOUT_MS: '30000',
            MAX_CONCURRENT_SESSIONS: '3',
            HEAP_THRESHOLD_GB: '4',
            RSS_THRESHOLD_GB: '8',
            CLERK_SECRET_KEY: 'sk_test_123',
            ENCRYPTION_SECRET: 'test-secret-at-least-32-chars-long-12345',
            RATE_LIMIT_WINDOW_MS: '60000',
            RATE_LIMIT_MAX_REQUESTS: '100',
        },
    },
});
