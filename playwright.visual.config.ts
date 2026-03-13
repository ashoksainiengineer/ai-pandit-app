/**
 * Playwright Visual Regression Testing Configuration
 * 
 * Industry-standard visual testing for UI consistency.
 * 
 * Run: npx playwright test --config=playwright.visual.config.ts
 */

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    testDir: './tests/visual',
    timeout: 60 * 1000,
    expect: {
        timeout: 10 * 1000,
        toHaveScreenshot: {
            maxDiffPixels: 100,
            threshold: 0.2,
        },
    },
    fullyParallel: false,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: 1,
    reporter: [
        ['html', { open: 'never' }],
        ['list'],
    ],
    use: {
        baseURL: process.env.BASE_URL || 'http://127.0.0.1:43110',
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
        viewport: { width: 1280, height: 720 },
    },
    projects: [
        {
            name: 'visual-chromium',
            use: { 
                ...devices['Desktop Chrome'],
                viewport: { width: 1280, height: 720 },
            },
        },
        {
            name: 'visual-mobile',
            use: { 
                ...devices['iPhone 14'],
            },
        },
        {
            name: 'visual-tablet',
            use: { 
                ...devices['iPad (gen 7)'],
            },
        },
    ],
    webServer: {
        command: 'npm -w @ai-pandit/web run dev -- -p 43110',
        url: 'http://127.0.0.1:43110',
        reuseExistingServer: !process.env.CI,
        timeout: 120 * 1000,
    },
});
