import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { sessionEvents, emitProgress, emitAIThinking, emitCandidateScore } from '../session-events.js';
import { executeWithRetry } from '@ai-pandit/db';

// Mock dependencies
vi.mock('@ai-pandit/db', () => ({
    db: {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        set: vi.fn().mockReturnThis()
    },
    executeWithRetry: vi.fn((fn) => fn())
}));

describe('📡 FRONTEND REAL-TIME SYNC AUDIT (SSE)', () => {

    const SESSION_ID = 'test-realtime-session-123';

    beforeEach(() => {
        vi.clearAllMocks();
        sessionEvents.cleanup(SESSION_ID);

        // Mock executeWithRetry to resolve our Auth check
        const executeWithRetryMock = executeWithRetry as unknown as {
            mockResolvedValue: (value: unknown) => void;
        };
        executeWithRetryMock.mockResolvedValue([{ id: SESSION_ID, externalId: 'test_user_123', userId: 'user_internal' }]);
    });

    afterEach(() => {
        sessionEvents.cleanup(SESSION_ID);
    });

    it('should correctly stream structured progress events to the frontend UI container', async () => {
        // Supertest handles streams differently. We mock the internal event emitter directly
        // to prove the payload structure matches what the UI expects.

        // Instead of a full HTTP stream which is tricky in vitest without an active server,
        // we test the core event manager that feeds the stream.

        // 1. Simulate UI Connecting to Stream
        const emitter = sessionEvents.getEmitter(SESSION_ID);

        const receivedEvents: any[] = [];
        emitter.on('event', (data: any) => {
            receivedEvents.push(data);
        });

        // 2. Engine Step 1: Grid Building
        emitProgress(SESSION_ID, 'grid', 1, 7, 'Generating Candidates', ['Found 400 possible times']);

        // 3. Engine Stage 4: AI Thinking Stream (Simulating LLM chunking)
        emitAIThinking(SESSION_ID, 'Analyzing D60 Lagna...', 4, '10:28:00');
        emitAIThinking(SESSION_ID, ' Shifted to Gemini. Matching astrological traits.', 4, '10:28:00');

        // 4. Engine Stage: Candidate Score
        emitCandidateScore(SESSION_ID, '10:28:00', 95.5, 4, 1);

        // Allow broadcast window (200ms) to flush
        await new Promise(r => setTimeout(r, 300));

        // 5. Assertions on UI Payload Structure
        // Optimized engine merges 2 thinking chunks into 1 event during the 200ms flush window
        expect(receivedEvents.length).toBe(3);

        // Progress UI Container Payload
        const progressEvent = receivedEvents.find(e => e.type === 'progress');
        expect(progressEvent).toBeDefined();
        expect(progressEvent?.step).toBe('grid');
        expect(progressEvent?.percentage).toBe(14); // 1/7 * 100
        expect(progressEvent?.details[0]).toBe('Found 400 possible times');

        // AI Terminal/Reasoning UI Container Payload
        const aiEvents = receivedEvents.filter(e => e.type === 'ai_thinking');
        expect(aiEvents.length).toBe(1); // Merged!
        expect(aiEvents[0].chunk).toContain('Analyzing D60 Lagna...');
        expect(aiEvents[0].chunk).toContain('Gemini');
        expect(aiEvents[0].candidateTime).toBe('10:28:00');

        // Leaderboard UI Container Payload
        // Optimized engine sends batched scores under 'candidate_scores' type
        const batchEvent = receivedEvents.find(e => e.type === 'candidate_scores');
        expect(batchEvent).toBeDefined();
        const batchData = ((batchEvent as { data?: Array<{ time?: string; score?: number }> })?.data) ?? [];
        const scoreEvent = batchData.find((s) => s.time === '10:28:00');
        expect(scoreEvent).toBeDefined();
        expect(scoreEvent?.score).toBe(95.5);
    });

    it('should buffer AI completely if user connects mid-generation (Last-Event-ID or Buffer)', () => {
        // 1. Engine emits before UI connects
        emitAIThinking(SESSION_ID, 'Part 1: The ascendant is Virgo. ', 4, '09:00:00');
        emitAIThinking(SESSION_ID, 'Part 2: Jupiter strongly aspecting. ', 4, '09:00:00');

        // 2. UI Connects Late
        const buffers = sessionEvents.getThinkingBuffers(SESSION_ID);

        // Ensure the UI terminal gets the full stitched message instantly on connect
        expect(buffers.length).toBe(1);
        expect(buffers[0].text).toBe('Part 1: The ascendant is Virgo. Part 2: Jupiter strongly aspecting. ');
        expect(buffers[0].candidateTime).toBe('09:00:00');
        expect(buffers[0].stage).toBe(4);
    });

    it('should strictly limit score memory buffers to prevent memory crashes on heavy parallel testing', () => {
        // Simulate massive amount of score events (e.g. Stage 2 scanning 1000 candidates)
        for (let i = 0; i < 50; i++) {
            emitCandidateScore(SESSION_ID, `time_${i}`, Math.random() * 100, 2);
        }

        const scoreBuffer = sessionEvents.getCandidateScoreBuffer(SESSION_ID);
        // Ensure buffer exists and is tracked properly for UI reconnects
        expect(scoreBuffer?.length).toBe(50);

        // Assert that duplicate candidate times overwrite instead of bloating memory
        emitCandidateScore(SESSION_ID, 'time_0', 99.9, 3); // Updates existing
        expect(sessionEvents.getCandidateScoreBuffer(SESSION_ID)?.length).toBe(50);
        expect(sessionEvents.getCandidateScoreBuffer(SESSION_ID)?.find(c => c.time === 'time_0')?.score).toBe(99.9);
    });
});
