// backend/src/lib/session-events.ts
// Global EventEmitter for real-time session progress streaming

import { EventEmitter } from 'events';

// ═════════════════════════════════════════════════════════════════════════════
// SESSION EVENT TYPES
// ═════════════════════════════════════════════════════════════════════════════

export interface ProgressEvent {
    type: 'progress';
    step: string;
    stepIndex: number;
    totalSteps: number;
    percentage: number;
    message: string;
    details?: string[];
}

export interface AIThinkingEvent {
    type: 'ai_thinking';
    chunk: string;        // Partial thinking text
    stage: number;        // Which BTR stage (2, 5, 7)
    candidateTime?: string;
}

export interface EphemerisEvent {
    type: 'ephemeris';
    candidateTime: string;
    ascendant: { sign: string; degree: number };
    moonSign: string;
    moonNakshatra: string;
}

export interface CandidateScoreEvent {
    type: 'candidate_score' | 'candidate_score_v2';
    time: string;
    score: number;
    stage: number;
    rank?: number;
}

export interface CompleteEvent {
    type: 'complete';
    rectifiedTime: string;
    accuracy: number;
    confidence: string;
}

export interface AIContextEvent {
    type: 'ai_context';
    stage: number;
    candidateTime: string;
    planetaryInfo: {
        sun: string;
        moon: string;
        ascendant: string;
    };
    dasha: string;
    divCharts?: string;
}

export interface CalculationLogEvent {
    type: 'calculation_log';
    candidateTime: string;
    sunPos: string;
    moonPos: string;
    ascendant: string;
    dashaObj?: string; // Short dasha string
}

export interface ErrorEvent {
    type: 'error';
    message: string;
    stage?: string;
}

export interface StageStatsEvent {
    type: 'stage_stats';
    stage: number;
    candidateCount: number;
    description: string;
}

export type SessionEvent =
    | ProgressEvent
    | AIThinkingEvent
    | EphemerisEvent
    | CandidateScoreEvent
    | CompleteEvent
    | ErrorEvent
    | AIContextEvent
    | CalculationLogEvent
    | StageStatsEvent;

// ═════════════════════════════════════════════════════════════════════════════
// GLOBAL SESSION EVENT EMITTER
// ═════════════════════════════════════════════════════════════════════════════

class SessionEventManager {
    private emitters: Map<string, EventEmitter> = new Map();
    private lastContexts: Map<string, AIContextEvent> = new Map();
    // 🧠 Store accumulated thinking text per session { sessionId: { stage: number, text: string } }
    private thinkingBuffers: Map<string, { stage: number; text: string; candidateTime?: string }> = new Map();

    /**
     * Get or create an emitter for a session
     */
    getEmitter(sessionId: string): EventEmitter {
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
        const emitter = this.emitters.get(sessionId);
        if (emitter) {
            emitter.emit('event', event);
        }
        if (event.type === 'ai_context') {
            this.lastContexts.set(sessionId, event);
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
        return this.lastContexts.get(sessionId);
    }

    /**
     * Append text to thinking buffer or start new
     */
    appendToThinkingBuffer(sessionId: string, stage: number, text: string, candidateTime?: string): void {
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
        const buffer = this.thinkingBuffers.get(sessionId);
        console.log(`📖 Reading Thinking Buffer: ${sessionId?.slice(0, 8)} | Found=${!!buffer} | Len=${buffer?.text?.length}`);
        return buffer;
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
    console.log('🔥 emitAIThinking called:', { sessionId: sessionId?.slice(0, 8), stage, chunkLen: chunk?.length, candidateTime });

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
    rank?: number
): void {
    console.log(`⚡ Emit Candidate Score: ${sessionId} | ${time} | ${score}`);
    sessionEvents.emit(sessionId, {
        type: 'candidate_score_v2',
        time,
        score,
        stage,
        rank,
    });
}

export function emitComplete(
    sessionId: string,
    rectifiedTime: string,
    accuracy: number,
    confidence: string
): void {
    console.log('🎉 emitComplete CALLED:', { sessionId: sessionId?.slice(0, 8), rectifiedTime, accuracy, confidence });
    require('fs').appendFileSync('/tmp/ai-debug.log', `${new Date().toISOString()} 🎉 emitComplete: ${sessionId?.slice(0, 8)} time=${rectifiedTime} acc=${accuracy} conf=${confidence}\n`);
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
    data: Omit<CalculationLogEvent, 'type'>
): void {
    sessionEvents.emit(sessionId, {
        type: 'calculation_log',
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
