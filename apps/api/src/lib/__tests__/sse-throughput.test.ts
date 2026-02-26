import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sessionEvents } from '../session-events.js';

describe('🧠 Phase M: SSE Throughput & Memory Resilience', () => {
    const sessionId = 'throughput-test-session';

    beforeEach(() => {
        sessionEvents.cleanup(sessionId);
    });

    it('should maintain monotonic sequence and log events correctly', () => {
        for (let i = 0; i < 100; i++) {
            const seq = sessionEvents.getNextSeq(sessionId);
            expect(seq).toBe(i + 1);
            sessionEvents.logEvent(sessionId, seq, { type: 'ai_thinking', chunk: `chunk-${i}`, stage: 1 } as any);
        }

        const missed = sessionEvents.getEventsSince(sessionId, 50);
        expect(missed.length).toBe(50);
        expect(missed[0].seq).toBe(51);
        expect((missed[0].event as any).chunk).toBe('chunk-50');
        expect((missed[49].event as any).chunk).toBe('chunk-99');
    });

    it('should respect MAX_EVENT_LOG_SIZE (2000) and evict old events with 20% buffer', () => {
        // Fill up beyond limit (MAX_EVENT_LOG_SIZE = 2000)
        // Eviction happens when log.length > 2000 -> removes oldest 400 (20%)
        for (let i = 0; i < 2005; i++) {
            const seq = sessionEvents.getNextSeq(sessionId);
            sessionEvents.logEvent(sessionId, seq, { type: 'progress', message: `msg-${i}` } as any);
        }

        // Access private eventLogs for verification
        const eventLogs = (sessionEvents as any).eventLogs;
        const log = eventLogs.get(sessionId);

        // Should have evicted 400 events when it hit 2001
        // 2001 - 400 = 1601. Then 4 more added = 1605.
        expect(log.length).toBe(1605);

        // Oldest remaining event should be seq 401
        expect(log[0].seq).toBe(401);

        // Continued filling
        for (let i = 0; i < 500; i++) {
            const seq = sessionEvents.getNextSeq(sessionId);
            sessionEvents.logEvent(sessionId, seq, { type: 'progress', message: `msg-pt2-${i}` } as any);
        }

        // Hit 2105 -> evict 400 -> 1705
        expect(log.length).toBe(1705);
    });

    it('should handle concurrent thinking streams for different candidates without cross-talk', () => {
        sessionEvents.appendToThinkingBuffer(sessionId, 1, 'Hello ', '12:00');
        sessionEvents.appendToThinkingBuffer(sessionId, 1, 'World', '12:00');
        sessionEvents.appendToThinkingBuffer(sessionId, 1, 'Deep ', '12:05');
        sessionEvents.appendToThinkingBuffer(sessionId, 1, 'Dive', '12:05');

        const buffers = sessionEvents.getThinkingBuffers(sessionId);
        expect(buffers.length).toBe(2);

        const b1 = buffers.find(b => b.candidateTime === '12:00');
        const b2 = buffers.find(b => b.candidateTime === '12:05');

        expect(b1?.text).toBe('Hello World');
        expect(b2?.text).toBe('Deep Dive');
    });

    it('should garbage collect stale sessions after TTL', async () => {
        vi.useFakeTimers();

        // Create an active session
        sessionEvents.getNextSeq(sessionId);

        // Mock current time to be 2 hours later
        const twoHours = 2 * 60 * 60 * 1000;
        vi.advanceTimersByTime(twoHours);

        // Trigger GC (manually calling private method via any)
        (sessionEvents as any).garbageCollect();

        // Session should be cleaned up
        const emitter = (sessionEvents as any).emitters.get(sessionId);
        expect(emitter).toBeUndefined();

        vi.useRealTimers();
    });
});
