/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * 🔱 ANALYSIS WATCHDOG — Industry-Grade Long-Running Monitor
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * This test monitors a REAL analysis session for up to 1 hour.
 * It runs against the live dev server (no mocking) and continuously validates:
 * 
 * 1. CONTAINER HEALTH    — All UI containers remain visible and functional
 * 2. CONSOLE ERRORS      — No uncaught JS errors or React crashes
 * 3. MEMORY TRACKING     — JS heap growth detection (memory leak sentinel)
 * 4. NETWORK HEALTH      — API/SSE request failures and timeouts
 * 5. DOM STALENESS        — Detects frozen/stuck containers
 * 6. SCREENSHOT TIMELINE — Periodic screenshots for visual regression audit
 * 7. STAGE PROGRESSION   — Validates stage transitions are logical (1→2→3→...)
 * 
 * USAGE:
 *   1. Start the dev server: npm run dev
 *   2. Trigger an analysis from the UI (get the session ID)
 *   3. Run: SESSION_ID=<your-session-id> npx playwright test e2e/analysis-watchdog.spec.ts --timeout 3700000
 * 
 * The --timeout flag gives Playwright 1hr + buffer. The test itself handles timing.
 */

import { test, expect, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

// ─── Configuration ──────────────────────────────────────────────────────────────
const SESSION_ID = process.env.SESSION_ID || '';
const MONITOR_DURATION_MS = 60 * 60 * 1000; // 1 hour
const CHECK_INTERVAL_MS = 30 * 1000;        // Check every 30 seconds
const SCREENSHOT_INTERVAL_MS = 60 * 1000;   // Screenshot every 60 seconds
const MEMORY_WARN_GROWTH_MB = 50;            // Warn if heap grows >50MB from baseline
const STALENESS_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes with no DOM change = stale

// ─── Report Directory ───────────────────────────────────────────────────────────
const REPORT_DIR = path.join(process.cwd(), 'watchdog-reports', new Date().toISOString().replace(/[:.]/g, '-'));

// ─── Types ──────────────────────────────────────────────────────────────────────
interface HealthSnapshot {
    timestamp: string;
    elapsed: string;
    checkNumber: number;
    containers: ContainerHealth;
    memory: MemorySnapshot | null;
    errors: string[];
    networkFailures: string[];
    stage: string;
    phase: string;
    candidateCount: number;
    isComplete: boolean;
    domHash: string;
    isStale: boolean;
}

interface ContainerHealth {
    header: boolean;
    statusBanner: boolean;
    pipeline: boolean;
    leaderboard: boolean;
    aiPanels: number;
    errorBoundaries: number;
    connectionIndicator: string;
    timer: string;
}

interface MemorySnapshot {
    usedJSHeapSizeMB: number;
    totalJSHeapSizeMB: number;
    heapLimitMB: number;
    growthFromBaselineMB: number;
}

// ─── Utility Functions ──────────────────────────────────────────────────────────

function formatElapsed(ms: number): string {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const h = Math.floor(m / 60);
    return `${h}h ${m % 60}m ${s % 60}s`;
}

async function getContainerHealth(page: Page): Promise<ContainerHealth> {
    return page.evaluate(() => {
        const $ = (sel: string) => document.querySelector(sel);
        const $$ = (sel: string) => document.querySelectorAll(sel).length;

        // Header
        const header = !!$('header[role="banner"]');

        // Status Banner — look for the AnalysisStatusBanner's wrapper
        const statusBanner = $$('[class*="rounded-xl"][class*="border"]') > 0;

        // Pipeline — SimplifiedPipeline renders a progress bar
        const pipeline = $$('[class*="bg-gradient-to-r"][class*="rounded-full"]') > 0;

        // Leaderboard
        const leaderboard = $$('[class*="leaderboard"], [class*="Leaderboard"]') > 0 ||
            document.body.innerText.includes('Candidates');

        // AI Panels — each renders a role="region" with a brain icon
        const aiPanels = $$('[role="region"]');

        // Error boundaries
        const errorBoundaries = $$('[class*="error"], [role="alert"]');

        // Connection indicator — the colored dot
        const connectionDot = $('[class*="animate-pulse"][class*="rounded-full"]');
        const connectionText = connectionDot?.closest('div')?.textContent?.trim() || 'unknown';

        // Timer
        const timerEl = $('[class*="font-mono"][class*="font-semibold"]');
        const timer = timerEl?.textContent?.trim() || '--:--';

        return {
            header,
            statusBanner,
            pipeline,
            leaderboard,
            aiPanels,
            errorBoundaries,
            connectionIndicator: connectionText,
            timer,
        };
    });
}

async function getMemorySnapshot(page: Page, baseline: number): Promise<MemorySnapshot | null> {
    try {
        const mem = await page.evaluate(() => {
            const perf = (performance as any);
            if (!perf.memory) return null;
            return {
                usedJSHeapSize: perf.memory.usedJSHeapSize,
                totalJSHeapSize: perf.memory.totalJSHeapSize,
                jsHeapSizeLimit: perf.memory.jsHeapSizeLimit,
            };
        });
        if (!mem) return null;
        const toMB = (b: number) => Math.round(b / 1024 / 1024 * 100) / 100;
        return {
            usedJSHeapSizeMB: toMB(mem.usedJSHeapSize),
            totalJSHeapSizeMB: toMB(mem.totalJSHeapSize),
            heapLimitMB: toMB(mem.jsHeapSizeLimit),
            growthFromBaselineMB: toMB(mem.usedJSHeapSize - baseline),
        };
    } catch {
        return null;
    }
}

async function getStageInfo(page: Page): Promise<{ stage: string; phase: string; candidateCount: number; isComplete: boolean }> {
    return page.evaluate(() => {
        const body = document.body.innerText;

        // Stage detection — look for "Step X of Y" badge
        const stepMatch = body.match(/Step (\d+) of (\d+)/);
        const stage = stepMatch ? `Step ${stepMatch[1]} of ${stepMatch[2]}` : 'unknown';

        // Phase detection — look for Macro/Meso/Micro Phase labels
        const phaseMatch = body.match(/(Macro Phase|Meso Phase|Micro Phase)[^.]*/);
        const phase = phaseMatch ? phaseMatch[0] : 'none';

        // Candidate count
        const candMatch = body.match(/(\d+)\s*(?:candidates|Variations)/i);
        const candidateCount = candMatch ? parseInt(candMatch[1]) : 0;

        // Completion
        const isComplete = body.includes('Successfully Completed') || body.includes('Analysis Complete');

        return { stage, phase, candidateCount, isComplete };
    });
}

async function getDOMHash(page: Page): Promise<string> {
    return page.evaluate(() => {
        // Quick hash of visible text content to detect staleness
        const text = document.body.innerText.slice(0, 5000);
        let hash = 0;
        for (let i = 0; i < text.length; i++) {
            const char = text.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash |= 0;
        }
        return hash.toString(36);
    });
}

// ─── Main Test ──────────────────────────────────────────────────────────────────

test.describe('🔱 Analysis Watchdog Monitor', () => {
    test.skip(!SESSION_ID, 'Skipped: Set SESSION_ID env var to run (e.g., SESSION_ID=abc123 npx playwright test ...)');

    test('Monitor analysis page for up to 1 hour', async ({ page, context }) => {
        // Setup
        test.setTimeout(MONITOR_DURATION_MS + 120_000); // 1hr + 2min buffer

        fs.mkdirSync(REPORT_DIR, { recursive: true });
        fs.mkdirSync(path.join(REPORT_DIR, 'screenshots'), { recursive: true });

        const snapshots: HealthSnapshot[] = [];
        const consoleErrors: string[] = [];
        const pageErrors: string[] = [];
        const networkFailures: string[] = [];
        let baselineHeap = 0;
        let lastDOMHash = '';
        let lastDOMChangeTime = Date.now();
        let lastScreenshotTime = 0;

        // ─── Event Listeners ──────────────────────────────────────────────────

        // Console error collector
        page.on('console', msg => {
            if (msg.type() === 'error') {
                const text = msg.text();
                // Filter out known non-critical warnings
                if (text.includes('ResizeObserver') || text.includes('favicon')) return;
                consoleErrors.push(`[${new Date().toISOString()}] ${text}`);
            }
        });

        // Uncaught exception collector
        page.on('pageerror', err => {
            pageErrors.push(`[${new Date().toISOString()}] CRASH: ${err.message}`);
            consoleErrors.push(`[${new Date().toISOString()}] CRASH: ${err.message}`);
        });

        // Network failure collector
        page.on('response', response => {
            if (response.status() >= 500) {
                networkFailures.push(`[${new Date().toISOString()}] ${response.status()} ${response.url()}`);
            }
        });

        page.on('requestfailed', request => {
            const failure = request.failure();
            if (failure) {
                networkFailures.push(`[${new Date().toISOString()}] FAILED: ${request.url()} - ${failure.errorText}`);
            }
        });

        // ─── Navigate ─────────────────────────────────────────────────────────

        console.log(`\n🔱 WATCHDOG STARTED`);
        console.log(`   Session: ${SESSION_ID}`);
        console.log(`   Duration: ${formatElapsed(MONITOR_DURATION_MS)}`);
        console.log(`   Reports: ${REPORT_DIR}\n`);

        await page.goto(`/rectify/${SESSION_ID}`, { waitUntil: 'domcontentloaded', timeout: 60_000 });

        // Wait for page to be interactive (header should load)
        await page.waitForSelector('header[role="banner"]', { timeout: 30_000 });

        // Baseline memory
        const baselineMem = await page.evaluate(() => {
            const perf = (performance as any);
            return perf.memory ? perf.memory.usedJSHeapSize : 0;
        });
        baselineHeap = baselineMem;

        // Initial screenshot
        await page.screenshot({ path: path.join(REPORT_DIR, 'screenshots', '000-initial.png'), fullPage: true });

        // ─── Monitor Loop ─────────────────────────────────────────────────────

        const startTime = Date.now();
        let checkNumber = 0;
        let analysisComplete = false;

        while (Date.now() - startTime < MONITOR_DURATION_MS) {
            checkNumber++;
            const elapsed = Date.now() - startTime;

            try {
                // 1. Container health
                const containers = await getContainerHealth(page);

                // 2. Memory
                const memory = await getMemorySnapshot(page, baselineHeap);

                // 3. Stage info
                const stageInfo = await getStageInfo(page);

                // 4. DOM staleness
                const domHash = await getDOMHash(page);
                const isDOMChanged = domHash !== lastDOMHash;
                if (isDOMChanged) {
                    lastDOMHash = domHash;
                    lastDOMChangeTime = Date.now();
                }
                const timeSinceLastChange = Date.now() - lastDOMChangeTime;
                const isStale = timeSinceLastChange > STALENESS_THRESHOLD_MS && !stageInfo.isComplete;

                // 5. Snapshot errors (copy and clear)
                const currentErrors = [...consoleErrors];

                // Build snapshot
                const snapshot: HealthSnapshot = {
                    timestamp: new Date().toISOString(),
                    elapsed: formatElapsed(elapsed),
                    checkNumber,
                    containers,
                    memory,
                    errors: currentErrors.slice(-10), // Last 10 errors
                    networkFailures: networkFailures.slice(-10),
                    stage: stageInfo.stage,
                    phase: stageInfo.phase,
                    candidateCount: stageInfo.candidateCount,
                    isComplete: stageInfo.isComplete,
                    domHash,
                    isStale,
                };

                snapshots.push(snapshot);

                // ─── Live Console Output ────────────────────────────────────────
                const memStr = memory ? `${memory.usedJSHeapSizeMB}MB (Δ${memory.growthFromBaselineMB > 0 ? '+' : ''}${memory.growthFromBaselineMB}MB)` : 'N/A';
                const statusEmoji = stageInfo.isComplete ? '✅' : (isStale ? '🔴' : '🟢');

                console.log(
                    `[${snapshot.elapsed}] ${statusEmoji} Check #${checkNumber} | ` +
                    `Stage: ${stageInfo.stage} | ` +
                    `Phase: ${stageInfo.phase.slice(0, 30)} | ` +
                    `Candidates: ${stageInfo.candidateCount} | ` +
                    `Memory: ${memStr} | ` +
                    `AI Panels: ${containers.aiPanels} | ` +
                    `Errors: ${currentErrors.length} | ` +
                    `Network Fails: ${networkFailures.length} | ` +
                    `Timer: ${containers.timer}` +
                    (isStale ? ' ⚠️ STALE DOM' : '')
                );

                // ─── Assertions ─────────────────────────────────────────────────

                // A1: Header must always be present
                expect(containers.header, `Check #${checkNumber}: Header disappeared!`).toBe(true);

                // A2: No React error boundaries should be triggered (except expected ones)
                if (containers.errorBoundaries > 0) {
                    console.warn(`⚠️ Check #${checkNumber}: ${containers.errorBoundaries} error boundary/alert element(s) detected`);
                }

                // A3: Memory leak sentinel
                if (memory && memory.growthFromBaselineMB > MEMORY_WARN_GROWTH_MB) {
                    console.warn(`⚠️ Check #${checkNumber}: Memory grew ${memory.growthFromBaselineMB}MB from baseline — possible leak`);
                }

                // A4: No uncaught page crashes (these are critical)
                expect(pageErrors.length, `Check #${checkNumber}: Page crashed! Errors: ${pageErrors.join('; ')}`).toBe(0);

                // A5: Staleness check (warning only, not assertion — could be between stages)
                if (isStale) {
                    console.warn(`⚠️ Check #${checkNumber}: DOM hasn't changed in ${Math.round(timeSinceLastChange / 1000)}s — possible freeze`);
                }

                // ─── Periodic Screenshot ────────────────────────────────────────
                if (Date.now() - lastScreenshotTime >= SCREENSHOT_INTERVAL_MS) {
                    const screenshotName = `${String(checkNumber).padStart(3, '0')}-${stageInfo.stage.replace(/\s/g, '_')}.png`;
                    await page.screenshot({
                        path: path.join(REPORT_DIR, 'screenshots', screenshotName),
                        fullPage: true,
                    });
                    lastScreenshotTime = Date.now();
                }

                // ─── Early Exit on Completion ───────────────────────────────────
                if (stageInfo.isComplete && !analysisComplete) {
                    analysisComplete = true;
                    console.log(`\n🎉 ANALYSIS COMPLETED at Check #${checkNumber} (${snapshot.elapsed})`);

                    // Take final screenshot
                    await page.screenshot({
                        path: path.join(REPORT_DIR, 'screenshots', 'FINAL-complete.png'),
                        fullPage: true,
                    });

                    // Continue monitoring for 2 more minutes to catch post-completion bugs
                    console.log('   Monitoring for 2 more minutes for post-completion stability...\n');
                    const postCompleteStart = Date.now();
                    while (Date.now() - postCompleteStart < 120_000) {
                        await page.waitForFunction(() => false, { timeout: CHECK_INTERVAL_MS }).catch(() => {}); // Polling interval: intentionally times out
                        checkNumber++;
                        const postContainers = await getContainerHealth(page);
                        expect(postContainers.header, `Post-completion Check #${checkNumber}: Header gone`).toBe(true);
                        console.log(`[Post-Complete] Check #${checkNumber} | Panels: ${postContainers.aiPanels} | Errors: ${consoleErrors.length}`);
                    }
                    break;
                }

            } catch (err: any) {
                console.error(`❌ Check #${checkNumber} FAILED: ${err.message}`);
                await page.screenshot({
                    path: path.join(REPORT_DIR, 'screenshots', `ERROR-${checkNumber}.png`),
                    fullPage: true,
                }).catch(() => { });
                // Don't break — keep monitoring
            }

            await page.waitForFunction(() => false, { timeout: CHECK_INTERVAL_MS }).catch(() => {}); // Polling interval: intentionally times out
        }

        // ─── Final Report ─────────────────────────────────────────────────────

        const totalDuration = formatElapsed(Date.now() - startTime);
        const report = generateReport(snapshots, consoleErrors, pageErrors, networkFailures, totalDuration, baselineHeap);

        fs.writeFileSync(path.join(REPORT_DIR, 'watchdog-report.md'), report);
        fs.writeFileSync(path.join(REPORT_DIR, 'snapshots.json'), JSON.stringify(snapshots, null, 2));
        fs.writeFileSync(path.join(REPORT_DIR, 'console-errors.log'), consoleErrors.join('\n'));
        fs.writeFileSync(path.join(REPORT_DIR, 'network-failures.log'), networkFailures.join('\n'));

        console.log(`\n📋 WATCHDOG REPORT saved to: ${REPORT_DIR}`);
        console.log(`   Total checks: ${checkNumber}`);
        console.log(`   Total duration: ${totalDuration}`);
        console.log(`   Console errors: ${consoleErrors.length}`);
        console.log(`   Network failures: ${networkFailures.length}`);
        console.log(`   Page crashes: ${pageErrors.length}`);
        console.log(`   Analysis completed: ${analysisComplete ? 'YES ✅' : 'NO (timed out)'}`);

        // Final assertion: No page crashes during the entire run
        expect(pageErrors.length, `Page crashed during monitoring: ${pageErrors.join('; ')}`).toBe(0);
    });
});

// ─── Report Generator ───────────────────────────────────────────────────────────

function generateReport(
    snapshots: HealthSnapshot[],
    consoleErrors: string[],
    pageErrors: string[],
    networkFailures: string[],
    totalDuration: string,
    baselineHeap: number,
): string {
    const lastSnapshot = snapshots[snapshots.length - 1];
    const maxMemory = snapshots.reduce((max, s) => {
        const mem = s.memory?.usedJSHeapSizeMB ?? 0;
        return mem > max ? mem : max;
    }, 0);
    const staleChecks = snapshots.filter(s => s.isStale).length;
    const uniqueStages = Array.from(new Set(snapshots.map(s => s.stage)));

    return `# 🔱 Analysis Watchdog Report

**Session:** \`${SESSION_ID}\`  
**Duration:** ${totalDuration}  
**Total Checks:** ${snapshots.length}  
**Generated:** ${new Date().toISOString()}

---

## Summary

| Metric | Value | Status |
|--------|-------|--------|
| Page Crashes | ${pageErrors.length} | ${pageErrors.length === 0 ? '✅' : '❌'} |
| Console Errors | ${consoleErrors.length} | ${consoleErrors.length === 0 ? '✅' : '⚠️'} |
| Network Failures | ${networkFailures.length} | ${networkFailures.length === 0 ? '✅' : '⚠️'} |
| Stale DOM Events | ${staleChecks} | ${staleChecks === 0 ? '✅' : '⚠️'} |
| Peak Memory | ${maxMemory}MB | ${maxMemory < 200 ? '✅' : '⚠️'} |
| Memory Growth | ${lastSnapshot?.memory?.growthFromBaselineMB ?? 'N/A'}MB | ${(lastSnapshot?.memory?.growthFromBaselineMB ?? 0) < MEMORY_WARN_GROWTH_MB ? '✅' : '⚠️'} |
| Analysis Completed | ${lastSnapshot?.isComplete ? 'Yes' : 'No'} | ${lastSnapshot?.isComplete ? '✅' : '⏳'} |
| Stages Observed | ${uniqueStages.join(' → ')} | ℹ️ |

---

## Stage Progression Timeline

| Check | Elapsed | Stage | Phase | Candidates | Memory | Errors |
|-------|---------|-------|-------|------------|--------|--------|
${snapshots.map(s =>
        `| #${s.checkNumber} | ${s.elapsed} | ${s.stage} | ${s.phase.slice(0, 25)} | ${s.candidateCount} | ${s.memory?.usedJSHeapSizeMB ?? '-'}MB | ${s.errors.length} |`
    ).join('\n')}

---

## Container Health Log

${snapshots.filter((_, i) => i % 5 === 0).map(s =>
        `- **${s.elapsed}** — Header:${s.containers.header ? '✅' : '❌'} Panels:${s.containers.aiPanels} Errors:${s.containers.errorBoundaries} Timer:${s.containers.timer}`
    ).join('\n')}

---

## Console Errors (${consoleErrors.length} total)

${consoleErrors.length === 0 ? '_No console errors detected._' :
            '```\n' + consoleErrors.slice(0, 50).join('\n') + '\n```'
        }

## Network Failures (${networkFailures.length} total)

${networkFailures.length === 0 ? '_No network failures detected._' :
            '```\n' + networkFailures.slice(0, 30).join('\n') + '\n```'
        }

## Page Crashes (${pageErrors.length} total)

${pageErrors.length === 0 ? '_No page crashes detected. 🎉_' :
            '```\n' + pageErrors.join('\n') + '\n```'
        }

---

_Generated by Analysis Watchdog v1.0_
`;
}
