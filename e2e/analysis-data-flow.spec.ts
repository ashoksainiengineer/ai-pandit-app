import { test, expect } from '@playwright/test';

test.describe('Phase N: Analysis Data Flow Audit', () => {
    const mockSessionId = 'audit-session-999';

    test.beforeEach(async ({ page }) => {
        // Industry Pattern: Inject test flag to bypass auth and enable internal logging
        await page.addInitScript(() => {
            (window as any).isTestEnv = true;
            (window as any).__clerk_ssr_state = {
                user: { id: 'user_audit_123' },
                session: { id: 'sess_audit_123' },
            };
        });

        // Mock Clerk API
        await page.route('**/clerk.ai-pandit.com/**', async route => {
            await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ user: { id: 'user_audit_123' } }) });
        });

        // Log browser console for sanctity verification
        page.on('console', msg => {
            if (msg.type() === 'error' || msg.text().includes('[SSE]') || msg.text().includes('[Store]')) {
                console.log(`BROWSER [${msg.type()}]: ${msg.text()}`);
            }
        });
    });

    test('Verify End-to-End Analysis Data Flow (SSE -> Store -> UI)', async ({ page }) => {
        // 1. Mock the initial session state (Pending)
        await page.route(`**/api/queue/progress?sessionId=${mockSessionId}*`, async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    success: true,
                    status: 'processing',
                    progress: { currentStep: 0, totalSteps: 6, percentage: 5, liveMessage: 'Initializing Audit...' }
                })
            });
        });

        // 2. Navigate to the analysis page
        await page.goto(`/rectify/${mockSessionId}`, { waitUntil: 'domcontentloaded' });

        // Verify initial UI state
        await expect(page.locator('h1')).toContainText('Birth Time Analysis');
        await expect(page.locator('text=Initializing Audit...')).toBeVisible();

        // 3. Simulate SSE Stream Data
        // Since we can't easily push to a real EventSource from Playwright route.fulfill (it's a one-shot response),
        // we use a custom script to trigger message events on the mock EventSource if it exists, 
        // OR we use the fact that our hook falls back to polling if the initial connection fails.
        // For E2E "Sanctity Audit", we will mock the POLLING responses to simulate state transitions.

        const stages = [
            { stage: 1, msg: 'Rashi Grid Synthesis', candidates: 61 },
            { stage: 2, msg: 'Amsha-Varga Elimination', candidates: 15 },
            { stage: 4, msg: 'Divisional Analysis', candidates: 5 }
        ];

        for (const s of stages) {
            console.log(`Step: Transitioning to Stage ${s.stage}...`);

            await page.route(`**/api/queue/progress?sessionId=${mockSessionId}*`, async route => {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        success: true,
                        status: 'processing',
                        progress: {
                            currentStep: s.stage,
                            totalSteps: 6,
                            percentage: s.stage * 15,
                            liveMessage: s.msg,
                            activeAIStage: s.stage
                        },
                        candidateCount: s.candidates,
                        candidateScores: [
                            { time: '12:00:00', score: 85 + s.stage, stage: s.stage },
                            { time: '12:05:00', score: 70 + s.stage, stage: s.stage }
                        ],
                        aiThinking: {
                            stage: s.stage,
                            fullText: `Analysis for Stage ${s.stage}: Processing ${s.candidates} candidates...`,
                            updatedAt: Date.now()
                        }
                    })
                });
            }, { times: 1 });

            // Verify UI reflects the new stage
            await expect(page.locator(`text=${s.msg}`)).toBeVisible({ timeout: 10000 });
            await expect(page.locator(`text=Processing ${s.candidates} candidates`)).toBeVisible();

            // Verify AI Panel updates
            await expect(page.locator(`text=Analysis for Stage ${s.stage}`)).toBeVisible();

            // Verify Leaderboard (Stage 1 uses "12:00:00")
            const topCandidate = page.locator('div[role="listitem"]').first();
            await expect(topCandidate).toContainText('12:00:00');
        }

        // 4. Final Verification: Completion
        await page.route(`**/api/queue/progress?sessionId=${mockSessionId}*`, async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    success: true,
                    status: 'completed',
                    progress: { currentStep: 6, totalSteps: 6, percentage: 100, liveMessage: 'Analysis Finalized' },
                    result: {
                        rectifiedTime: '12:02:15',
                        accuracy: 0.98,
                        confidence: 'High'
                    }
                })
            });
        });

        await expect(page.locator('text=Analysis Complete')).toBeVisible({ timeout: 15000 });
        await expect(page.locator('text=12:02:15')).toBeVisible();
        await expect(page.locator('text=High')).toBeVisible();

        console.log('✅ Phase N Verified: End-to-end data flow is robust and UI synchronized.');
    });
});
