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
    minifiedEph?: {
        sun: string;
        moon: string;
        ascendant: string;
    };
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
    planetaryInfo?: {
        sun: string;
        moon: string;
        ascendant: string;
    };
    dasha?: string;
    divCharts?: string;
    contextHits?: string[];
    round?: number;
    batch?: number;
    totalBatches?: number;
    candidatesInBatch?: number;
}
export interface CalculationLogEvent {
    type: 'calculation_log';
    logId: string;
    candidateTime: string;
    sunPos: string;
    moonPos: string;
    ascendant: string;
    dashaObj?: string;
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
export interface EstimatedTimeEvent {
    type: 'estimated_time';
    seconds: number;
}
export type SessionEvent = ProgressEvent | AIThinkingEvent | EphemerisEvent | CandidateScoreEvent | CompleteEvent | ErrorEvent | AIContextEvent | CalculationLogEvent | StageStatsEvent | EstimatedTimeEvent;
declare class SessionEventManager {
    private emitters;
    private lastContexts;
    private thinkingBuffers;
    private calculationLogBuffers;
    private lastActive;
    constructor();
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
    /**
     * Get the last AI Context for a session
     */
    getLastContext(sessionId: string): AIContextEvent | undefined;
    /**
     * Append text to thinking buffer or start new
     */
    appendToThinkingBuffer(sessionId: string, stage: number, text: string, candidateTime?: string): void;
    /**
     * Get accumulated thinking text
     */
    getThinkingBuffer(sessionId: string): {
        stage: number;
        text: string;
        candidateTime?: string;
    } | undefined;
    /**
     * Append to calculation log buffer (Keep last 50)
     */
    appendToCalculationBuffer(sessionId: string, log: CalculationLogEvent): void;
    /**
     * Get recent calculation logs
     */
    getCalculationBuffer(sessionId: string): CalculationLogEvent[] | undefined;
    /**
     * Update last active timestamp
     */
    private touch;
    /**
     * Remove stale sessions (> 1 hour inactive)
     */
    private garbageCollect;
}
export declare const sessionEvents: SessionEventManager;
export declare function emitProgress(sessionId: string, step: string, stepIndex: number, totalSteps: number, message: string, details?: string[]): void;
export declare function emitAIThinking(sessionId: string, chunk: string, stage: number, candidateTime?: string): void;
export declare function emitEphemeris(sessionId: string, candidateTime: string, ascendant: {
    sign: string;
    degree: number;
}, moonSign: string, moonNakshatra: string): void;
export declare function emitCandidateScore(sessionId: string, time: string, score: number, stage: number, rank?: number, minifiedEph?: {
    sun: string;
    moon: string;
    ascendant: string;
}): void;
export declare function emitComplete(sessionId: string, rectifiedTime: string, accuracy: number, confidence: string): void;
export declare function emitError(sessionId: string, message: string, stage?: string): void;
export declare function emitAIContext(sessionId: string, data: Omit<AIContextEvent, 'type'>): void;
export declare function emitCalculationLog(sessionId: string, data: Omit<CalculationLogEvent, 'type' | 'logId'>): void;
export declare function emitStageStats(sessionId: string, stage: number, candidateCount: number, description: string): void;
export declare function emitEstimatedTime(sessionId: string, seconds: number): void;
export {};
//# sourceMappingURL=session-events.d.ts.map