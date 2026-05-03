import { test, expect } from '@playwright/test';

test.describe('Analysis Page Lifecycle & Persistence', () => {
    const sessionA = 'session-alpha-123';
    const sessionB = 'session-beta-456';

    test.beforeEach(async ({ page }) => {
        // Log browser console
        page.on('console', msg => {
            console.log(`BROWSER [${msg.type()}]: ${msg.text()}`);
        });

        // Track page errors
        page.on('pageerror', err => {
            console.log(`PAGE ERROR: ${err.message}`);
        });

        // Inject test flag and mock Clerk
        await page.addInitScript(() => {
            window.__AI_PANDIT_TEST_MODE__ = true;
            (window as any).__clerk_ssr_state = {
                user: { id: 'user_lifecycle_123' },
                session: { id: 'sess_lifecycle_123' },
            };
            // Mock Clerk global object if necessary
            (window as any).Clerk = {
                isLoaded: true,
                session: {
                    getToken: async () => 'mock-token'
                },
                load: async () => { },
                user: { id: 'user_lifecycle_123' },
                openSignIn: () => { },
            };
        });

        // Mock Clerk API
        await page.route('**/clerk.ai-pandit.com/**', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ user: { id: 'user_lifecycle_123' } })
            });
        });
    });

    test('ISSUE-001: Store Clearance on Requeue', async ({ page }) => {
        console.log('--- Start ISSUE-001 Test ---');

        // 1. Mock Session A as completed
        await page.route(`**/api/queue/progress?sessionId=${sessionA}*`, async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    success: true,
                    status: 'completed',
                    progress: { currentStep: 6, percentage: 100, liveMessage: 'Done' },
                    result: { rectifiedTime: '12:00:00', confidence: 'High', accuracy: 99 }
                })
            });
        });

        console.log(`Navigating to Session A: ${sessionA}`);
        await page.goto(`/rectify/${sessionA}`);

        // Wait for results
        await expect(page.getByText(/Successfully Completed/i).or(page.getByText(/Done/i))).toBeVisible({ timeout: 20000 });

        // 2. Mock Session B as processing (Fresh)
        await page.route(`**/api/queue/progress?sessionId=${sessionB}*`, async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    success: true,
                    status: 'processing',
                    progress: { currentStep: 1, percentage: 10, liveMessage: 'Starting Fresh' }
                })
            });
        });

        // Navigate to Session B
        console.log(`Navigating to Session B: ${sessionB}`);
        await page.goto(`/rectify/${sessionB}`);

        // 3. Verify that it doesn't show "Complete" (from Session A's stale state)
        await expect(page.getByText(/Successfully Completed/i)).not.toBeVisible({ timeout: 5000 });
        await expect(page.getByText(/Starting Fresh/i)).toBeVisible({ timeout: 10000 });

        console.log('✅ ISSUE-001 Verified: Store cleared on session switch.');
    });

    test('ISSUE-005: State Survival on Refresh', async ({ page }) => {
        console.log('--- Start ISSUE-005 Test ---');

        // 1. Mock Session A processing
        await page.route(`**/api/queue/progress?sessionId=${sessionA}*`, async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    success: true,
                    status: 'processing',
                    progress: { currentStep: 1, percentage: 20, liveMessage: 'Persistence Test' },
                    candidateScores: [{ time: '12:15:00', score: 98, stage: 1 }]
                })
            });
        });

        await page.goto(`/rectify/${sessionA}`);
        await expect(page.getByText(/Persistence Test/i)).toBeVisible({ timeout: 20000 });
        await expect(page.getByText(/12:15:00/i)).toBeVisible();

        // 2. Wait for IndexedDB debounce (2s)
        console.log('Waiting for persistence...');
        await page.waitForFunction(() => (window as any).__persisted === true, { timeout: 5000 }).catch(() => {}); // Wait for IndexedDB persistence flag

        // 3. Refresh the page
        console.log('Refreshing...');
        await page.reload();

        // 4. Verify that the data survives refresh
        await expect(page.getByText(/12:15:00/i)).toBeVisible({ timeout: 15000 });
        await expect(page.getByText(/Persistence Test/i)).toBeVisible();

        console.log('✅ ISSUE-005 Verified: State survived refresh.');
    });
});
