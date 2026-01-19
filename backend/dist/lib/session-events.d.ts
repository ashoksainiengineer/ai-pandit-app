import { EventEmitter } from 'events';
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
    chunk: string;
    stage: number;
    candidateTime?: string;
}
export interface EphemerisEvent {
    type: 'ephemeris';
    candidateTime: string;
    ascendant: {
        sign: string;
        degree: number;
    };
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
export interface ErrorEvent {
    type: 'error';
    message: string;
    stage?: string;
}
export type SessionEvent = ProgressEvent | AIThinkingEvent | EphemerisEvent | CandidateScoreEvent | CompleteEvent | ErrorEvent | AIContextEvent;
declare class SessionEventManager {
    private emitters;
    /**
     * Get or create an emitter for a session
     */
    getEmitter(sessionId: string): EventEmitter;
    /**
     * Emit an event for a session
     */
    emit(sessionId: string, event: SessionEvent): void;
    /**
     * Clean up emitter when session completes
     */
    cleanup(sessionId: string): void;
    /**
     * Check if session has active listeners
     */
    hasListeners(sessionId: string): boolean;
}
export declare const sessionEvents: SessionEventManager;
export declare function emitProgress(sessionId: string, step: string, stepIndex: number, totalSteps: number, message: string, details?: string[]): void;
export declare function emitAIThinking(sessionId: string, chunk: string, stage: number, candidateTime?: string): void;
export declare function emitEphemeris(sessionId: string, candidateTime: string, ascendant: {
    sign: string;
    degree: number;
}, moonSign: string, moonNakshatra: string): void;
export declare function emitCandidateScore(sessionId: string, time: string, score: number, stage: number, rank?: number): void;
export declare function emitComplete(sessionId: string, rectifiedTime: string, accuracy: number, confidence: string): void;
export declare function emitError(sessionId: string, message: string, stage?: string): void;
export declare function emitAIContext(sessionId: string, data: Omit<AIContextEvent, 'type'>): void;
export {};
//# sourceMappingURL=session-events.d.ts.map