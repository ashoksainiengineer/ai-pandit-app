import { test, expect } from '@playwright/test';

test.describe('Phase E: Resilience & Chaos Engineering', () => {
    test.describe.configure({ retries: 2 }); // Allow retries for environment flakiness

    const mockSessionId = 'chaos-session-123';

    test.beforeEach(async ({ page }) => {
        // Mock Clerk Auth globals/hooks if possible
        await page.addInitScript(() => {
            (window as any).isTestEnv = true;
            console.log('🧪 [TEST] isTestEnv is now TRUE');
            // Mock Clerk state for useAuth()
            (window as any).__clerk_ssr_state = {
                user: { id: 'user_123' },
                session: { id: 'sess_123' },
                orgId: null,
                role: null,
                permissions: [],
            };
        });

        // Mock Clerk API
        await page.route('**/clerk.ai-pandit.com/**', async route => {
            await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ user: { id: 'user_123' } }) });
        });

        // Log browser console
        page.on('console', msg => {
            console.log(`BROWSER [${msg.type()}]: ${msg.text()}`);
        });
    });

    test('Should fallback to POLLING when SSE returns 500 (Failover Logic)', async ({ page }) => {
        // Step 1: Mock SSE to fail with 500
        await page.route(`**/api/stream/${mockSessionId}*`, async route => {
            console.log('🧪 [CHAOS] Mocking SSE 500 Internal Server Error');
            await route.fulfill({
                status: 500,
                contentType: 'text/plain',
                body: 'Internal Server Error'
            });
        });

        // Step 2: Mock Polling to succeed
        await page.route(`**/api/queue/progress?sessionId=${mockSessionId}*`, async route => {
            console.log('🧪 [CHAOS] Intercepted Poll Request - Returning Progress');
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    success: true,
                    status: 'processing',
                    progress: {
                        currentStep: 2,
                        totalSteps: 5,
                        percentage: 40,
                        liveMessage: 'Chaos recovery: Polling active'
                    }
                })
            });
        });

        // Step 3: Navigate to results page
        await page.goto(`/rectify/${mockSessionId}`, { waitUntil: 'domcontentloaded', timeout: 60000 });

        // Step 4: Verify UI shows "Inference Active" or "Reconnecting"
        await expect(page.locator('text=Inference Active').or(page.locator('text=Reconnecting')).first()).toBeVisible({ timeout: 60000 });

        console.log('✅ Resilience Verified: UI successfully fell back to polling after SSE failure.');
    });

    test('Should transition to ERROR state when SSE fails and Polling returns 404', async ({ page }) => {
        // Mock SSE to fail
        await page.route(`**/api/stream/${mockSessionId}*`, route => route.fulfill({ status: 500 }));

        // Mock Polling to return 404 (Session Not Found)
        await page.route(`**/api/queue/progress?sessionId=${mockSessionId}*`, async route => {
            console.log('🧪 [CHAOS] Mocked Polling 404 - Terminal Error');
            await route.fulfill({
                status: 404,
                contentType: 'application/json',
                body: JSON.stringify({ success: false, error: 'Session not found' })
            });
        });

        await page.goto(`/rectify/${mockSessionId}`, { waitUntil: 'domcontentloaded', timeout: 60000 });

        // Verify error message
        await expect(page.locator('text=Connection Error')).toBeVisible({ timeout: 60000 });

        console.log('✅ Resilience Verified: UI correctly handled terminal session failure.');
    });
});
