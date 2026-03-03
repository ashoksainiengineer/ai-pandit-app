// backend/src/lib/session-events.ts
// Global EventEmitter for real-time session progress streaming

import { EventEmitter } from 'events';
import crypto from 'crypto';
import { logger } from '../utils/logger.js';
import type {
    ProgressEvent,
    AIThinkingEvent,
    EphemerisEvent,
    CandidateScoreEvent,
    CompleteEvent,
    ErrorEvent,
    AIContextEvent,
    CalculationLogEvent,
    StageStatsEvent,
    EstimatedTimeEvent,
    DecisionEvent,
    SessionEvent
} from '@ai-pandit/shared';

// Re-export types for backwards compatibility
export type {
    ProgressEvent,
    AIThinkingEvent,
    EphemerisEvent,
    CandidateScoreEvent,
    CompleteEvent,
    ErrorEvent,
    AIContextEvent,
    CalculationLogEvent,
    StageStatsEvent,
    EstimatedTimeEvent,
    DecisionEvent,
    SessionEvent
};

// ═════════════════════════════════════════════════════════════════════════════
// GLOBAL SESSION EVENT EMITTER
// ═════════════════════════════════════════════════════════════════════════════

// Max events to retain per session for Last-Event-ID replay
const MAX_EVENT_LOG_SIZE = 2000;

interface SequencedEvent {
    seq: number;
    event: SessionEvent;
}

class SessionEventManager {
    private emitters: Map<string, EventEmitter> = new Map();
    private lastContexts: Map<string, AIContextEvent> = new Map();
    // 🧠 Multi-Stream Thinking Buffers: { sessionId: Map<candidateTime, { stage, text }> }
    private thinkingBuffers: Map<string, Map<string, { stage: number; text: string; candidateTime: string }>> = new Map();
    // 🧮 Store recent calculation logs for immediate UI feedback on connect
    private calculationLogBuffers: Map<string, CalculationLogEvent[]> = new Map();
    // 📊 Store ALL candidate scores for session history replay
    private candidateScoreBuffers: Map<string, CandidateScoreEvent[]> = new Map();
    // ⚖️ Store decision logs for "Funnel of Truth"
    private decisionBuffers: Map<string, DecisionEvent[]> = new Map();
    // 秤 Batch Buffers for performance (Industry Standard for Free Tiers)
    private thinkingBroadcastBuffer: Map<string, Array<{ chunk: string; stage: number; candidateTime?: string }>> = new Map();
    private scoreBroadcastBuffer: Map<string, CandidateScoreEvent[]> = new Map();
    private updateIntervals: Map<string, NodeJS.Timeout> = new Map();

    // ⏱️ Track last activity for garbage collection
    private lastActive: Map<string, number> = new Map();

    // ═══ LAST-EVENT-ID PROTOCOL (Industry SSE Standard) ═══
    // Per-session monotonic sequence counter for event ordering
    private eventSequences: Map<string, number> = new Map();
    // Per-session ordered event log for reconnection replay
    private eventLogs: Map<string, SequencedEvent[]> = new Map();

    constructor() {
        // Run garbage collection every 10 minutes
        setInterval(() => this.garbageCollect(), 10 * 60 * 1000);
    }

    /**
     * Get the next sequence number for a session (monotonically increasing)
     */
    getNextSeq(sessionId: string): number {
        const current = this.eventSequences.get(sessionId) || 0;
        const next = current + 1;
        this.eventSequences.set(sessionId, next);
        return next;
    }

    /**
     * Get current sequence number without incrementing
     */
    getCurrentSeq(sessionId: string): number {
        return this.eventSequences.get(sessionId) || 0;
    }

    /**
     * Log an event with its sequence number for replay on reconnect.
     * Capped at MAX_EVENT_LOG_SIZE to prevent unbounded memory growth.
     * Lightweight events (pings, connected) are NOT logged.
     */
    logEvent(sessionId: string, seq: number, event: SessionEvent): void {
        if (!this.eventLogs.has(sessionId)) {
            this.eventLogs.set(sessionId, []);
        }
        const log = this.eventLogs.get(sessionId)!;
        log.push({ seq, event });

        // Evict oldest events when over capacity
        if (log.length > MAX_EVENT_LOG_SIZE) {
            // Remove oldest 20% to avoid frequent shifts
            const evictCount = Math.floor(MAX_EVENT_LOG_SIZE * 0.2);
            log.splice(0, evictCount);
        }
    }

    /**
     * Get all events after a given sequence number (for Last-Event-ID replay).
     * Returns events in order, starting from lastSeq + 1.
     */
    getEventsSince(sessionId: string, lastSeq: number): SequencedEvent[] {
        const log = this.eventLogs.get(sessionId);
        if (!log || log.length === 0) return [];

        // Binary search for the first event with seq > lastSeq
        // Log is always sorted by seq (appended monotonically)
        let lo = 0, hi = log.length;
        while (lo < hi) {
            const mid = (lo + hi) >>> 1;
            if (log[mid].seq <= lastSeq) {
                lo = mid + 1;
            } else {
                hi = mid;
            }
        }
        return log.slice(lo);
    }

    /**
     * Get or create an emitter for a session
     */
    getEmitter(sessionId: string): EventEmitter {
        this.touch(sessionId);
        if (!this.emitters.has(sessionId)) {
            const emitter = new EventEmitter();
            emitter.setMaxListeners(50); // Increased for high concurrency
            this.emitters.set(sessionId, emitter);
        }
        return this.emitters.get(sessionId)!;
    }

    /**
     * Emit an event for a session
     */
    emit(sessionId: string, event: SessionEvent): void {
        this.touch(sessionId);
        const emitter = this.emitters.get(sessionId);
        if (emitter) {
            emitter.emit('event', event);
        }
        if (event.type === 'ai_context') {
            this.lastContexts.set(sessionId, event as AIContextEvent);
        }
        if (event.type === 'calculation_log') {
            this.appendToCalculationBuffer(sessionId, event as CalculationLogEvent);
        }
        if (event.type === 'candidate_score_v2' || event.type === 'candidate_score') {
            this.appendToCandidateScoreBuffer(sessionId, event as CandidateScoreEvent);
        }
        if (event.type === 'decision') {
            this.appendToDecisionBuffer(sessionId, event as DecisionEvent);
        }
    }

    /**
     * Start the broadcast interval for a session if not already running
     */
    private startBroadcastLoop(sessionId: string): void {
        if (this.updateIntervals.has(sessionId)) return;

        const interval = setInterval(() => {
            this.flushBroadcastBuffers(sessionId);
        }, 200); // 200ms batching window (Industry Standard balance)

        this.updateIntervals.set(sessionId, interval);
    }

    /**
     * Flush all batched events to the frontend
     */
    private flushBroadcastBuffers(sessionId: string): void {
        // 1. Flush AI Thinking
        const thinkingBatch = this.thinkingBroadcastBuffer.get(sessionId);
        if (thinkingBatch && thinkingBatch.length > 0) {
            // Group by candidateTime and stage to send fewer messages
            const grouped = new Map<string, { chunk: string; stage: number; candidateTime?: string }>();
            for (const item of thinkingBatch) {
                const key = `${item.stage}_${item.candidateTime || 'general'}`;
                const existing = grouped.get(key);
                if (existing) {
                    existing.chunk += item.chunk;
                } else {
                    grouped.set(key, { ...item });
                }
            }

            // Emit merged chunks
            for (const merged of grouped.values()) {
                this.emit(sessionId, {
                    type: 'ai_thinking',
                    ...merged
                });
            }
            this.thinkingBroadcastBuffer.set(sessionId, []);
        }

        // 2. Flush Scores
        const scoreBatch = this.scoreBroadcastBuffer.get(sessionId);
        if (scoreBatch && scoreBatch.length > 0) {
            this.emit(sessionId, {
                type: 'candidate_scores',
                data: scoreBatch
            } as any);
            this.scoreBroadcastBuffer.set(sessionId, []);
        }
    }

    /**
     * Buffer a thinking chunk for later broadcast
     */
    bufferThinking(sessionId: string, chunk: string, stage: number, candidateTime?: string): void {
        this.touch(sessionId);
        this.startBroadcastLoop(sessionId);

        if (!this.thinkingBroadcastBuffer.has(sessionId)) {
            this.thinkingBroadcastBuffer.set(sessionId, []);
        }
        this.thinkingBroadcastBuffer.get(sessionId)!.push({ chunk, stage, candidateTime });
    }

    /**
     * Buffer a candidate score for later broadcast
     */
    bufferScore(sessionId: string, score: CandidateScoreEvent): void {
        this.touch(sessionId);
        this.startBroadcastLoop(sessionId);

        if (!this.scoreBroadcastBuffer.has(sessionId)) {
            this.scoreBroadcastBuffer.set(sessionId, []);
        }
        this.scoreBroadcastBuffer.get(sessionId)!.push(score);
    }

    /**
     * Clean up emitter when session completes
     */
    cleanup(sessionId: string): void {
        logger.info(`Cleaning up session resources: ${sessionId?.slice(0, 8)}`);

        // Stop broadcast loop
        const interval = this.updateIntervals.get(sessionId);
        if (interval) {
            clearInterval(interval);
            this.updateIntervals.delete(sessionId);
        }

        const emitter = this.emitters.get(sessionId);
        if (emitter) {
            emitter.removeAllListeners();
            this.emitters.delete(sessionId);
        }
        this.lastContexts.delete(sessionId);
        this.thinkingBuffers.delete(sessionId);
        this.calculationLogBuffers.delete(sessionId);
        this.candidateScoreBuffers.delete(sessionId);
        this.decisionBuffers.delete(sessionId);
        this.lastActive.delete(sessionId);
        // Last-Event-ID cleanup
        this.eventSequences.delete(sessionId);
        this.eventLogs.delete(sessionId);
    }

    /**
     * Check if session has active listeners
     */
    hasListeners(sessionId: string): boolean {
        const emitter = this.emitters.get(sessionId);
        return emitter ? emitter.listenerCount('event') > 0 : false;
    }

    /**
     * Get the last AI Context for a session
     */
    getLastContext(sessionId: string): AIContextEvent | undefined {
        this.touch(sessionId);
        return this.lastContexts.get(sessionId);
    }

    /**
     * Append text to specific candidate buffer
     */
    appendToThinkingBuffer(sessionId: string, stage: number, text: string, candidateTime: string = 'general'): void {
        this.touch(sessionId);
        if (!this.thinkingBuffers.has(sessionId)) {
            this.thinkingBuffers.set(sessionId, new Map());
        }

        const sessionBufferMap = this.thinkingBuffers.get(sessionId)!;
        const key = `${stage}_${candidateTime}`;
        const current = sessionBufferMap.get(key);

        if (!current) {
            sessionBufferMap.set(key, { stage, text, candidateTime });
        } else {
            current.text += text;
        }
    }

    /**
     * Get all accumulated thinking streams for a session
     */
    getThinkingBuffers(sessionId: string): Array<{ stage: number; text: string; candidateTime: string }> {
        this.touch(sessionId);
        const map = this.thinkingBuffers.get(sessionId);
        return map ? Array.from(map.values()) : [];
    }

    /**
     * Append to calculation log buffer (Keep last 50)
     */
    appendToCalculationBuffer(sessionId: string, log: CalculationLogEvent): void {
        this.touch(sessionId);
        if (!this.calculationLogBuffers.has(sessionId)) {
            this.calculationLogBuffers.set(sessionId, []);
        }
        const buffer = this.calculationLogBuffers.get(sessionId)!;
        buffer.push(log);
        if (buffer.length > 50) {
            buffer.shift();
        }
    }

    /**
     * Append to candidate score buffer (Persistence for Sync)
     */
    appendToCandidateScoreBuffer(sessionId: string, scoreEvent: CandidateScoreEvent): void {
        this.touch(sessionId);
        if (!this.candidateScoreBuffers.has(sessionId)) {
            this.candidateScoreBuffers.set(sessionId, []);
        }
        const buffer = this.candidateScoreBuffers.get(sessionId)!;

        const existingIdx = buffer.findIndex(c => c.time === scoreEvent.time);
        if (existingIdx >= 0) {
            buffer[existingIdx] = scoreEvent;
        } else {
            buffer.push(scoreEvent);
        }
    }

    /**
     * Append to decision buffer
     */
    appendToDecisionBuffer(sessionId: string, decision: DecisionEvent): void {
        this.touch(sessionId);
        if (!this.decisionBuffers.has(sessionId)) {
            this.decisionBuffers.set(sessionId, []);
        }
        const buffer = this.decisionBuffers.get(sessionId)!;
        buffer.push(decision);
        // Limit to last 200 decisions to prevent unbounded memory growth
        if (buffer.length > 200) {
            buffer.shift();
        }
    }

    /**
     * Get decision buffer
     */
    getDecisionBuffer(sessionId: string): DecisionEvent[] | undefined {
        this.touch(sessionId);
        return this.decisionBuffers.get(sessionId);
    }

    /**
     * Get all candidate scores for sync
     */
    getCandidateScoreBuffer(sessionId: string): CandidateScoreEvent[] | undefined {
        this.touch(sessionId);
        return this.candidateScoreBuffers.get(sessionId);
    }

    /**
     * Get recent calculation logs
     */
    getCalculationBuffer(sessionId: string): CalculationLogEvent[] | undefined {
        this.touch(sessionId);
        return this.calculationLogBuffers.get(sessionId);
    }

    /**
     * Update last active timestamp
     */
    private touch(sessionId: string): void {
        this.lastActive.set(sessionId, Date.now());
    }

    /**
     * Remove stale sessions (> 1 hour inactive)
     */
    private garbageCollect(): void {
        const now = Date.now();
        const timeout = 60 * 60 * 1000; // 1 Hour TTL

        let cleaned = 0;
        for (const [sessionId, lastActive] of this.lastActive.entries()) {
            if (now - lastActive > timeout) {
                logger.info(`GC: Removing stale session ${sessionId?.slice(0, 8)}`);
                this.cleanup(sessionId);
                cleaned++;
            }
        }
        if (cleaned > 0) {
            logger.info(`GC Complete: Cleaned ${cleaned} stale sessions.`);
        }
    }
}

// Global singleton
export const sessionEvents = new SessionEventManager();

// ═════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═════════════════════════════════════════════════════════════════════════════


export function emitProgress(
    sessionId: string,
    step: string,
    stepIndex: number,
    totalSteps: number,
    message: string,
    details?: string[],
    startedAt?: string
): void {
    sessionEvents.emit(sessionId, {
        type: 'progress',
        step,
        stepIndex,
        totalSteps,
        percentage: Math.round((stepIndex / totalSteps) * 100),
        message,
        details,
        startedAt,
    });
}

export function emitAIThinking(
    sessionId: string,
    chunk: string,
    stage: number,
    candidateTime?: string
): void {
    sessionEvents.appendToThinkingBuffer(sessionId, stage, chunk, candidateTime);
    sessionEvents.bufferThinking(sessionId, chunk, stage, candidateTime);
}

export function emitEphemeris(
    sessionId: string,
    candidateTime: string,
    ascendant: { sign: string; degree: number },
    moonSign: string,
    moonNakshatra: string
): void {
    sessionEvents.emit(sessionId, {
        type: 'ephemeris',
        candidateTime,
        ascendant,
        moonSign,
        moonNakshatra,
    });
}

export function emitCandidateScore(
    sessionId: string,
    time: string,
    score: number,
    stage: number,
    rank?: number,
    minifiedEph?: { sun: string; moon: string; ascendant: string },
    fullEph?: Record<string, string>
): void {
    logger.info(`Buffer Candidate Score: ${sessionId?.slice(0, 8)} | ${time} | ${score}`);
    sessionEvents.bufferScore(sessionId, {
        type: 'candidate_score_v2',
        time,
        score,
        stage,
        rank,
        minifiedEph,
        fullEph,
    });
}

export function emitComplete(
    sessionId: string,
    rectifiedTime: string,
    accuracy: number,
    confidence: string
): void {
    logger.info('emitComplete called', { sessionId: sessionId?.slice(0, 8), rectifiedTime, accuracy, confidence });
    sessionEvents.emit(sessionId, {
        type: 'complete',
        rectifiedTime,
        accuracy,
        confidence,
    });
    // Cleanup after a delay to allow final event delivery
    setTimeout(() => sessionEvents.cleanup(sessionId), 5000);
}


export function emitError(
    sessionId: string,
    message: string,
    stage?: string
): void {
    sessionEvents.emit(sessionId, {
        type: 'error',
        message,
        stage,
    });
}

export function emitAIContext(
    sessionId: string,
    data: Omit<AIContextEvent, 'type'>
): void {
    sessionEvents.emit(sessionId, {
        type: 'ai_context',
        ...data
    } as AIContextEvent);
}

export function emitCalculationLog(
    sessionId: string,
    data: Omit<CalculationLogEvent, 'type' | 'logId'>
): void {
    sessionEvents.emit(sessionId, {
        type: 'calculation_log',
        logId: crypto.randomUUID(),
        ...data
    } as CalculationLogEvent);
}

export function emitStageStats(
    sessionId: string,
    stage: number,
    candidateCount: number,
    description: string
): void {
    sessionEvents.emit(sessionId, {
        type: 'stage_stats',
        stage,
        candidateCount,
        description
    });
}

export function emitEstimatedTime(
    sessionId: string,
    seconds: number
): void {
    sessionEvents.emit(sessionId, {
        type: 'estimated_time',
        seconds
    });
}

export function emitDecision(
    sessionId: string,
    data: Omit<DecisionEvent, 'type'>
): void {
    sessionEvents.emit(sessionId, {
        type: 'decision',
        ...data
    } as DecisionEvent);
}

/**
 * Manually cleanup session resources (used for re-queuing)
 */
export function cleanupSession(sessionId: string): void {
    sessionEvents.cleanup(sessionId);
}
