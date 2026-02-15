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
    SessionEvent
} from '../types/index.js';
import { db } from '../database/drizzle.js';

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
    SessionEvent
};

// ═════════════════════════════════════════════════════════════════════════════
// GLOBAL SESSION EVENT EMITTER
// ═════════════════════════════════════════════════════════════════════════════

class SessionEventManager {
    private emitters: Map<string, EventEmitter> = new Map();
    private lastContexts: Map<string, AIContextEvent> = new Map();
    // 🧠 Store accumulated thinking text per session { sessionId: { stage: number, text: string } }
    private thinkingBuffers: Map<string, { stage: number; text: string; candidateTime?: string }> = new Map();
    // 🧮 Store recent calculation logs for immediate UI feedback on connect (Circular Buffer-ish)
    private calculationLogBuffers: Map<string, CalculationLogEvent[]> = new Map();
    // 📊 Store ALL candidate scores for session history replay (Persistence)
    private candidateScoreBuffers: Map<string, CandidateScoreEvent[]> = new Map();
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
            emitter.setMaxListeners(10); // Allow multiple SSE connections
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
            this.lastContexts.set(sessionId, event);
        }
        if (event.type === 'calculation_log') {
            this.appendToCalculationBuffer(sessionId, event);
        }
        if (event.type === 'candidate_score_v2' || event.type === 'candidate_score') {
            this.appendToCandidateScoreBuffer(sessionId, event);
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
     * Append text to thinking buffer or start new
     */
    appendToThinkingBuffer(sessionId: string, stage: number, text: string, candidateTime?: string): void {
        this.touch(sessionId);
        const current = this.thinkingBuffers.get(sessionId);

        // If new stage or no buffer, start flesh
        if (!current || current.stage !== stage) {
            console.log(`📝 Starting New Thinking Buffer: ${sessionId?.slice(0, 8)} | Stage ${stage}`);
            this.thinkingBuffers.set(sessionId, { stage, text, candidateTime });
        } else {
            // Append to existing
            // Don't log every append, too noisy
            current.text += text;
            current.candidateTime = candidateTime || current.candidateTime;
        }
    }

    /**
     * Get accumulated thinking text
     */
    getThinkingBuffer(sessionId: string): { stage: number; text: string; candidateTime?: string } | undefined {
        this.touch(sessionId);
        const buffer = this.thinkingBuffers.get(sessionId);
        // console.log(`📖 Reading Thinking Buffer: ${sessionId?.slice(0, 8)} | Found=${!!buffer} | Len=${buffer?.text?.length}`);
        return buffer;
    }

    /**
     * Append to calculation log buffer (Keep last 50)
     */
    appendToCalculationBuffer(sessionId: string, log: CalculationLogEvent): void {
        // No need to touch() here as it's called by emit() which touches
        if (!this.calculationLogBuffers.has(sessionId)) {
            this.calculationLogBuffers.set(sessionId, []);
        }
        const buffer = this.calculationLogBuffers.get(sessionId)!;
        buffer.push(log);
        // 🔱 GOD MODE: NO LIMITS. We keep every single candidate log for the entire session.
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

        // Remove existing score for same time (Update implicitly) or append?
        // Actually, we want to keep history if it moves stages? 
        // No, current state usually suffices. Frontend filters by time.
        // Let's just push. Frontend handles dedupe.

        // Optional: Replace if existing to keep buffer small?
        const existingIdx = buffer.findIndex(c => c.time === scoreEvent.time);
        if (existingIdx >= 0) {
            buffer[existingIdx] = scoreEvent; // Update in place
        } else {
            buffer.push(scoreEvent);
        }
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
    details?: string[]
): void {
    sessionEvents.emit(sessionId, {
        type: 'progress',
        step,
        stepIndex,
        totalSteps,
        percentage: Math.round((stepIndex / totalSteps) * 100),
        message,
        details,
    });
}

export function emitAIThinking(
    sessionId: string,
    chunk: string,
    stage: number,
    candidateTime?: string
): void {
    // console.log('🔥 emitAIThinking called:', { sessionId: sessionId?.slice(0, 8), stage, chunkLen: chunk?.length, candidateTime });

    // 🧠 Store content for reconnects
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
    minifiedEph?: { sun: string; moon: string; ascendant: string }
): void {
    console.log(`⚡ Emit Candidate Score: ${sessionId} | ${time} | ${score}`);
    sessionEvents.emit(sessionId, {
        type: 'candidate_score_v2',
        time,
        score,
        stage,
        rank,
        minifiedEph,
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
    });
}

export function emitCalculationLog(
    sessionId: string,
    data: Omit<CalculationLogEvent, 'type' | 'logId'>
): void {
    sessionEvents.emit(sessionId, {
        type: 'calculation_log',
        logId: crypto.randomUUID(),
        ...data
    });
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

/**
 * Manually cleanup session resources (used for re-queuing)
 */
export function cleanupSession(sessionId: string): void {
    sessionEvents.cleanup(sessionId);
}
