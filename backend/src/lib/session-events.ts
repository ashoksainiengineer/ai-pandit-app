// backend/src/lib/session-events.ts
// Global EventEmitter for real-time session progress streaming

import { EventEmitter } from 'events';
import crypto from 'crypto';
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
} from '../types/index.js';

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
    // ⏱️ Track last activity for garbage collection
    private lastActive: Map<string, number> = new Map();

    constructor() {
        // Run garbage collection every 10 minutes
        setInterval(() => this.garbageCollect(), 10 * 60 * 1000);
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
     * Clean up emitter when session completes
     */
    cleanup(sessionId: string): void {
        console.log(`🧹 Cleaning up session resources: ${sessionId?.slice(0, 8)}`);
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
        if (!this.calculationLogBuffers.has(sessionId)) {
            this.calculationLogBuffers.set(sessionId, []);
        }
        const buffer = this.calculationLogBuffers.get(sessionId)!;
        buffer.push(log);
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
        this.decisionBuffers.get(sessionId)!.push(decision);
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
                console.log(`🗑️ Robust Garbage Collection: Removing stale session ${sessionId?.slice(0, 8)}`);
                this.cleanup(sessionId);
                cleaned++;
            }
        }
        if (cleaned > 0) {
            console.log(`🧹 GC Complete: Cleaned ${cleaned} stale sessions.`);
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

    sessionEvents.emit(sessionId, {
        type: 'ai_thinking',
        chunk,
        stage,
        candidateTime,
    });
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
    console.log(`⚡ Emit Candidate Score: ${sessionId} | ${time} | ${score}`);
    sessionEvents.emit(sessionId, {
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
    console.log('🎉 emitComplete CALLED:', { sessionId: sessionId?.slice(0, 8), rectifiedTime, accuracy, confidence });
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
