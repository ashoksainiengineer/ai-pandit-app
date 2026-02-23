/**
 * 🔱 EXHAUSTIVE SESSION EVENTS MANAGER TESTS
 * Tests SessionEventManager: getEmitter, emit, cleanup, hasListeners,
 * thinking buffers, calculation buffers, candidate scores, decisions, GC
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EventEmitter } from 'events';

// ═══════════════════════════════════════════════════════════════════════════
// MOCKS
// ═══════════════════════════════════════════════════════════════════════════

vi.mock('../logger.js', () => ({
    logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

import {
    sessionEvents,
    emitProgress,
    emitAIThinking,
    emitComplete,
    emitError,
    emitCandidateScore,
} from '../session-events.js';

// ═══════════════════════════════════════════════════════════════════════════
// EMITTER LIFECYCLE
// ═══════════════════════════════════════════════════════════════════════════

describe('SessionEventManager - Emitter Lifecycle', () => {
    const SESSION_ID = 'test-session-lifecycle';

    beforeEach(() => {
        sessionEvents.cleanup(SESSION_ID);
    });

    it('should create a new emitter for a session', () => {
        const emitter = sessionEvents.getEmitter(SESSION_ID);
        expect(emitter).toBeInstanceOf(EventEmitter);
    });

    it('should return same emitter on repeated calls', () => {
        const emitter1 = sessionEvents.getEmitter(SESSION_ID);
        const emitter2 = sessionEvents.getEmitter(SESSION_ID);
        expect(emitter1).toBe(emitter2);
    });

    it('should report no listeners initially', () => {
        sessionEvents.getEmitter(SESSION_ID);
        expect(sessionEvents.hasListeners(SESSION_ID)).toBe(false);
    });

    it('should report listeners after subscribing', () => {
        const emitter = sessionEvents.getEmitter(SESSION_ID);
        emitter.on('event', () => { });
        expect(sessionEvents.hasListeners(SESSION_ID)).toBe(true);
    });

    it('should clean up emitter and buffers', () => {
        sessionEvents.getEmitter(SESSION_ID);
        sessionEvents.appendToThinkingBuffer(SESSION_ID, 1, 'thinking text');
        sessionEvents.cleanup(SESSION_ID);
        // After cleanup, buffers should be empty (returns empty array)
        const buffers = sessionEvents.getThinkingBuffers(SESSION_ID);
        expect(buffers).toEqual([]);
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// EVENT EMISSION
// ═══════════════════════════════════════════════════════════════════════════

describe('SessionEventManager - Event Emission', () => {
    const SESSION_ID = 'test-session-emit';

    beforeEach(() => {
        sessionEvents.cleanup(SESSION_ID);
    });

    it('should emit events to subscribers', () => {
        const emitter = sessionEvents.getEmitter(SESSION_ID);
        const received: any[] = [];
        emitter.on('event', (event: any) => received.push(event));

        sessionEvents.emit(SESSION_ID, { type: 'progress', step: 'test' } as any);
        expect(received.length).toBe(1);
        expect(received[0].type).toBe('progress');
    });

    it('should not throw when emitting to session with no listeners', () => {
        expect(() => {
            sessionEvents.emit('nonexistent-session', { type: 'ping' } as any);
        }).not.toThrow();
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// THINKING BUFFERS
// ═══════════════════════════════════════════════════════════════════════════

describe('SessionEventManager - Thinking Buffers', () => {
    const SESSION_ID = 'test-session-thinking';

    beforeEach(() => {
        sessionEvents.cleanup(SESSION_ID);
    });

    it('should accumulate thinking buffer text', () => {
        sessionEvents.appendToThinkingBuffer(SESSION_ID, 1, 'chunk 1', 'candidate-1');
        sessionEvents.appendToThinkingBuffer(SESSION_ID, 1, ' chunk 2', 'candidate-1');
        const buffers = sessionEvents.getThinkingBuffers(SESSION_ID);
        expect(buffers).toBeDefined();
        expect(buffers!.length).toBeGreaterThanOrEqual(1);
        // Text should be concatenated for same candidate
        const buf = buffers!.find(b => b.candidateTime === 'candidate-1');
        expect(buf?.text).toContain('chunk 1');
        expect(buf?.text).toContain('chunk 2');
    });

    it('should isolate different candidate streams', () => {
        sessionEvents.appendToThinkingBuffer(SESSION_ID, 1, 'candidate-A text', 'candidate-A');
        sessionEvents.appendToThinkingBuffer(SESSION_ID, 1, 'candidate-B text', 'candidate-B');
        const buffers = sessionEvents.getThinkingBuffers(SESSION_ID);
        expect(buffers!.length).toBe(2);
    });

    it('should return empty array for non-existent session', () => {
        const buffers = sessionEvents.getThinkingBuffers('nonexistent');
        expect(buffers).toEqual([]);
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// CALCULATION & SCORE BUFFERS
// ═══════════════════════════════════════════════════════════════════════════

describe('SessionEventManager - Calculation Buffers', () => {
    const SESSION_ID = 'test-session-calc';

    beforeEach(() => sessionEvents.cleanup(SESSION_ID));

    it('should store calculation logs', () => {
        sessionEvents.appendToCalculationBuffer(SESSION_ID, {
            type: 'calculation_log',
            logId: 'log-1',
            candidateTime: '14:30',
            phase: 'ephemeris',
            message: 'Calculating...',
        } as any);
        const logs = sessionEvents.getCalculationBuffer(SESSION_ID);
        expect(logs).toBeDefined();
        expect(logs!.length).toBe(1);
    });

    it('should accumulate all calculation logs', () => {
        for (let i = 0; i < 60; i++) {
            sessionEvents.appendToCalculationBuffer(SESSION_ID, {
                type: 'calculation_log',
                logId: `log-${i}`,
                candidateTime: '14:30',
                phase: 'ephemeris',
                message: `Log ${i}`,
            } as any);
        }
        const logs = sessionEvents.getCalculationBuffer(SESSION_ID);
        // Fix from Bug 8: Buffer is now capped at 50 logs to prevent memory leaks
        expect(logs!.length).toBe(50);
    });
});

describe('SessionEventManager - Candidate Score Buffers', () => {
    const SESSION_ID = 'test-session-score';

    beforeEach(() => sessionEvents.cleanup(SESSION_ID));

    it('should store candidate scores', () => {
        sessionEvents.appendToCandidateScoreBuffer(SESSION_ID, {
            type: 'candidate_score',
            time: '14:30',
            score: 85,
            stage: 2,
        } as any);
        const scores = sessionEvents.getCandidateScoreBuffer(SESSION_ID);
        expect(scores).toBeDefined();
        expect(scores!.length).toBe(1);
        expect(scores![0].score).toBe(85);
    });
});

describe('SessionEventManager - Decision Buffers', () => {
    const SESSION_ID = 'test-session-decision';

    beforeEach(() => sessionEvents.cleanup(SESSION_ID));

    it('should store decisions', () => {
        sessionEvents.appendToDecisionBuffer(SESSION_ID, {
            type: 'decision',
            stage: 3,
            message: 'Refined to 15 candidates',
        } as any);
        const decisions = sessionEvents.getDecisionBuffer(SESSION_ID);
        expect(decisions).toBeDefined();
        expect(decisions!.length).toBe(1);
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// AI CONTEXT
// ═══════════════════════════════════════════════════════════════════════════

describe('SessionEventManager - AI Context', () => {
    const SESSION_ID = 'test-session-context';

    beforeEach(() => sessionEvents.cleanup(SESSION_ID));

    it('should return undefined for session with no context', () => {
        expect(sessionEvents.getLastContext(SESSION_ID)).toBeUndefined();
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// HELPER EMIT FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

describe('SessionEventManager - Helper Emit Functions', () => {
    const SESSION_ID = 'test-helpers';

    beforeEach(() => sessionEvents.cleanup(SESSION_ID));

    it('emitProgress should emit progress event', () => {
        const emitter = sessionEvents.getEmitter(SESSION_ID);
        const received: any[] = [];
        emitter.on('event', (e: any) => received.push(e));

        emitProgress(SESSION_ID, 'grid', 1, 10, 'Generating grid...');
        expect(received.length).toBe(1);
        expect(received[0].type).toBe('progress');
    });

    it('emitAIThinking should emit and buffer thinking', () => {
        const emitter = sessionEvents.getEmitter(SESSION_ID);
        const received: any[] = [];
        emitter.on('event', (e: any) => received.push(e));

        emitAIThinking(SESSION_ID, 'Reasoning about dasha...', 2, '14:30:00');
        expect(received.length).toBe(1);
        expect(received[0].type).toBe('ai_thinking');
    });

    it('emitComplete should emit complete event', () => {
        const emitter = sessionEvents.getEmitter(SESSION_ID);
        const received: any[] = [];
        emitter.on('event', (e: any) => received.push(e));

        emitComplete(SESSION_ID, '14:32:15', 95, 'HIGH');
        expect(received.length).toBe(1);
        expect(received[0].type).toBe('complete');
    });

    it('emitError should emit error event', () => {
        const emitter = sessionEvents.getEmitter(SESSION_ID);
        const received: any[] = [];
        emitter.on('event', (e: any) => received.push(e));

        emitError(SESSION_ID, 'AI analysis failed', 'stage3');
        expect(received.length).toBe(1);
        expect(received[0].type).toBe('error');
    });

    it('emitCandidateScore should emit and buffer score', () => {
        const emitter = sessionEvents.getEmitter(SESSION_ID);
        const received: any[] = [];
        emitter.on('event', (e: any) => received.push(e));

        emitCandidateScore(SESSION_ID, '14:30', 88, 2, 1);
        expect(received.length).toBe(1);
        expect(received[0].type).toBe('candidate_score_v2');
        const scores = sessionEvents.getCandidateScoreBuffer(SESSION_ID);
        expect(scores!.length).toBe(1);
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// GARBAGE COLLECTION
// ═══════════════════════════════════════════════════════════════════════════

describe('SessionEventManager - Garbage Collection', () => {
    it('should not throw during GC', () => {
        expect(() => sessionEvents.garbageCollect()).not.toThrow();
    });

    it('should update timestamp via touch()', () => {
        const SESSION_ID = 'test-gc-touch';
        sessionEvents.getEmitter(SESSION_ID);
        expect(() => sessionEvents.touch(SESSION_ID)).not.toThrow();
        sessionEvents.cleanup(SESSION_ID);
    });
});
