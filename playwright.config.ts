import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    testDir: './e2e',
    timeout: 60 * 1000,
    expect: {
        timeout: 10 * 1000,
    },
    fullyParallel: false,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 1,
    workers: 1,
    reporter: 'html',
    use: {
        baseURL: 'http://127.0.0.1:43110',
        trace: 'on-first-retry',
        navigationTimeout: 45 * 1000,
    },
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
    ],
    webServer: {
        command: 'npm -w @ai-pandit/web run dev -- -p 43110',
        url: 'http://127.0.0.1:43110',
        reuseExistingServer: !process.env.CI,
        timeout: 120 * 1000,
        env: {
            ...process.env,
            AI_API_KEY: process.env.AI_API_KEY || 'test-key',
            CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY || 'sk_test_local_placeholder',
            ENCRYPTION_SECRET: process.env.ENCRYPTION_SECRET || '0123456789abcdef0123456789abcdef',
            NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:
                process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || 'pk_test_Y2xlcmsuZXhhbXBsZS5hcHAk',
            NEON_DATABASE_URL: process.env.NEON_DATABASE_URL || 'postgresql://postgres:postgres@127.0.0.1:5432/postgres',
            DATABASE_URL: process.env.DATABASE_URL || 'postgresql://postgres:postgres@127.0.0.1:5432/postgres',
        },
    },
});
