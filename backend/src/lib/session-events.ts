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
    type: 'candidate_score';
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

export interface ErrorEvent {
    type: 'error';
    message: string;
    stage?: string;
}

export type SessionEvent =
    | ProgressEvent
    | AIThinkingEvent
    | EphemerisEvent
    | CandidateScoreEvent
    | CompleteEvent
    | ErrorEvent;

// ═════════════════════════════════════════════════════════════════════════════
// GLOBAL SESSION EVENT EMITTER
// ═════════════════════════════════════════════════════════════════════════════

class SessionEventManager {
    private emitters: Map<string, EventEmitter> = new Map();

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
    }

    /**
     * Clean up emitter when session completes
     */
    cleanup(sessionId: string): void {
        const emitter = this.emitters.get(sessionId);
        if (emitter) {
            emitter.removeAllListeners();
            this.emitters.delete(sessionId);
        }
    }

    /**
     * Check if session has active listeners
     */
    hasListeners(sessionId: string): boolean {
        const emitter = this.emitters.get(sessionId);
        return emitter ? emitter.listenerCount('event') > 0 : false;
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
    sessionEvents.emit(sessionId, {
        type: 'candidate_score',
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
