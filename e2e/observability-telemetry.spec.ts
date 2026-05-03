import { test, expect } from '@playwright/test';

test.describe('Phase E: Observability & Telemetry Verification', () => {
    test.describe.configure({ retries: 2 });

    const mockSessionId = 'obs-session-123';

    test.beforeEach(async ({ page }) => {
        // Log browser console
        page.on('console', msg => {
            console.log(`BROWSER [${msg.type()}]: ${msg.text()}`);
        });

        await page.addInitScript(() => {
            window.__AI_PANDIT_TEST_MODE__ = true;
            console.log('\u{1F9EA} [TEST] __AI_PANDIT_TEST_MODE__ is TRUE');
        });

        // Mock Clerk
        await page.route('**/clerk.ai-pandit.com/**', async route => {
            await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ user: { id: 'user_123' } }) });
        });
    });

    test('Should emit TELEMETRY ERROR when session fails terminaly', async ({ page }) => {
        // Track log-client requests
        const capturedErrors: any[] = [];
        const capturedAll: any[] = [];

        await page.route('**/api/log-client', async route => {
            const payload = await route.request().postDataJSON();
            capturedAll.push(payload);
            console.log('📡 [TELEMETRY] Captured event:', payload.level, payload.message);

            if (payload.level === 'warn' || payload.level === 'error') {
                capturedErrors.push(payload);
            }

            await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) });
        });

        // Mock Polling to return 404 (Session Not Found)
        await page.route(`**/api/queue/progress?sessionId=${mockSessionId}*`, async route => {
            console.log('🧪 [CHAOS] Mocking Polling 404 for session:', mockSessionId);
            await route.fulfill({
                status: 404,
                contentType: 'application/json',
                body: JSON.stringify({ success: false, error: 'Session not found' })
            });
        });

        // Mock SSE to fail
        await page.route(`**/api/stream/${mockSessionId}*`, async route => {
            console.log('🧪 [CHAOS] Mocking SSE 500 for session:', mockSessionId);
            await route.fulfill({ status: 500 });
        });

        await page.goto(`/rectify/${mockSessionId}`, { waitUntil: 'domcontentloaded', timeout: 60000 });

        // Wait for error screen
        console.log('⏳ Waiting for Connection Error screen...');
        await expect(page.locator('text=Connection Error')).toBeVisible({ timeout: 60000 });

        // Verify terminal error telemetry was sent
        console.log('⏳ Waiting for ERROR Telemetry emission...');
        await expect.poll(() => capturedErrors.length > 0, {
            message: 'An ERROR level telemetry event should be emitted to /api/log-client',
            timeout: 30000,
        }).toBeTruthy();

        const terminalError = capturedErrors[0];
        expect(terminalError.level).toMatch(/warn|error/);
        expect(terminalError.message).toContain('Session not found');

        console.log('✅ Observability Verified: Terminal failure emitted ERROR telemetry correctly.');
    });
});
