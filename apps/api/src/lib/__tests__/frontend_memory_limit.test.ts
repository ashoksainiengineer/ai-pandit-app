import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { sessionEvents, emitAIThinking, emitCandidateScore, emitCalculationLog } from '../session-events.js';

describe('🔥 HEAVY MEMORY STRESS AUDIT (BROWSER OOM PREVENTION)', () => {

    const SESSION_ID = 'memory-stress-999';

    beforeEach(() => {
        vi.clearAllMocks();
        sessionEvents.cleanup(SESSION_ID);
    });

    afterEach(() => {
        sessionEvents.cleanup(SESSION_ID);
    });

    it('should strictly truncate the Last-Event-ID replay log to 2000 events to prevent GB-sized reconnection payloads', () => {
        // Simulate a 5-hour run that emits 50,000 tiny events
        for (let i = 0; i < 50000; i++) {
            // Internal method to bypass the wrapper for sheer volume testing
            sessionEvents.emit(SESSION_ID, { type: 'ping', timestamp: 'now' } as any);
            // We need to use sendSequencedEvent simulator to test the logEvent function
            sessionEvents.logEvent(SESSION_ID, i, { type: 'progress', step: 'deep', percentage: 50 } as any);
        }

        // If a user reconnects after 5 hours, what is the maximum number of events the server will dump on them?
        // It MUST be clamped to MAX_EVENT_LOG_SIZE (2000) to prevent the browser tab from freezing
        const replayPayload = sessionEvents.getEventsSince(SESSION_ID, 0);

        expect(replayPayload.length).toBeLessThanOrEqual(2000);
        expect(replayPayload.length).toBeGreaterThan(0);

        // Assert we kept the MOST RECENT events, not the oldest ones
        expect(replayPayload[replayPayload.length - 1].seq).toBe(49999);
    });

    it('should not leak memory on Calculation Logs buffers (Limit to 50)', () => {
        for (let i = 0; i < 1000; i++) {
            emitCalculationLog(SESSION_ID, { candidateTime: '10:00', message: `Log ${i}`, category: 'ruler' });
        }

        const calcLogs = sessionEvents.getCalculationBuffer(SESSION_ID);
        expect(calcLogs?.length).toBeLessThanOrEqual(50);
        expect(calcLogs?.[calcLogs.length - 1].message).toBe('Log 999');
    });

    it('should overwrite Candidate Scores to prevent memory bloat over 50,000 candidate evaluations', () => {
        // Multi-stage BTR scans thousands of times.
        // Stage 1 might scan 1440 times:
        for (let m = 0; m < 1440; m++) {
            emitCandidateScore(SESSION_ID, `time_${m}`, Math.random() * 50, 1);
        }

        let scoreBuffer = sessionEvents.getCandidateScoreBuffer(SESSION_ID);
        expect(scoreBuffer?.length).toBe(1440); // 1 per time

        // Stage 3 refines the top 100 times. It shouldn't add 100 MORE objects, it MUST overwrite the existing array slots:
        for (let refine = 0; refine < 100; refine++) {
            emitCandidateScore(SESSION_ID, `time_${refine}`, 99.9, 3);
        }

        scoreBuffer = sessionEvents.getCandidateScoreBuffer(SESSION_ID);

        // Memory size MUST remain exactly 1440, not 1540
        expect(scoreBuffer?.length).toBe(1440);

        // Verify the overwrite worked for UI freshness
        const refinedScore = scoreBuffer?.find(c => c.time === 'time_0');
        expect(refinedScore?.score).toBe(99.9);
        expect(refinedScore?.stage).toBe(3);
    });

    it('should clamp the decision buffer to 200 items max', () => {
        for (let i = 0; i < 1000; i++) {
            sessionEvents.emit(SESSION_ID, {
                type: 'decision',
                title: `Cut ${i}`,
                rationale: 'Too low',
                stage: 2,
                impact: 'negative',
                candidatesAffected: 1
            });
        }

        const decisionBuffer = sessionEvents.getDecisionBuffer(SESSION_ID);
        expect(decisionBuffer?.length).toBeLessThanOrEqual(200);
        expect(decisionBuffer?.[decisionBuffer.length - 1].title).toBe('Cut 999');
    });
});
