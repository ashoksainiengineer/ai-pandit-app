export interface CandidateScore {
    time: string;
    score: number;
    stage: number;
    rank?: number;
}
export interface ProgressStep {
    id: string;
    name: string;
    icon: string;
    status: 'pending' | 'running' | 'complete' | 'error';
    message?: string;
    details?: string[];
    startedAt?: string;
    completedAt?: string;
}
export interface AIThinkingData {
    stage: number;
    candidateTime?: string;
    chunks: string[];
    fullText: string;
}
export interface ProgressData {
    currentStep: number;
    totalSteps: number;
    percentage: number;
    steps: ProgressStep[];
    lastUpdate: string;
    liveMessage?: string;
    candidateScores: CandidateScore[];
    lastAIThinking?: AIThinkingData;
}
export declare const ANALYSIS_STEPS: Omit<ProgressStep, 'status'>[];
export declare class ProgressTracker {
    private static activeInstances;
    private sessionId;
    private progress;
    private candidateBuffers;
    constructor(sessionId: string);
    /**
     * Get active in-memory instance
     */
    static getInstance(sessionId: string): ProgressTracker | undefined;
    private initProgress;
    /**
     * Update AI thinking logs - PURE MEMORY STREAMING
     * No DB Connection overhead for tokens
     */
    private candidateLogs;
    /**
     * Update AI thinking logs - PURE MEMORY STREAMING with ISOLATION
     * Prevents interleaving of parallel candidate streams
     */
    updateAIThinking(text: string, stage: number, candidateTime?: string): Promise<void>;
    /**
     * Heartbeat to keep session alive in DB
     * Called automatically during progress updates but can be called manually
     */
    pulse(): Promise<void>;
    /**
     * Start a step
     */
    startStep(stepId: string, message?: string): Promise<void>;
    /**
     * Update current step with live message
     */
    updateMessage(message: string, details?: string[]): Promise<void>;
    /**
     * Complete a step - PERSISTENT FLUSH
     * This is where we save AI thinking to DB as it's a major milestone
     */
    completeStep(stepId: string, details?: string[]): Promise<void>;
    /**
     * Mark step as error
     */
    errorStep(stepId: string, error: string): Promise<void>;
    /**
     * Complete all progress
     */
    complete(): Promise<void>;
    /**
     * Add and persist candidate score
     */
    addCandidateScore(score: CandidateScore): Promise<void>;
    /**
     * Save progress to database
     * @param includeThinking Set to true for MAJOR flushes (stage completion) to save DB writes
     */
    private saveProgress;
    /**
     * Get current progress
     */
    getProgress(): ProgressData;
}
/**
 * Get progress for a session
 * 🚀 PRIORITIZES IN-MEMORY STATE FOR STREAMING
 */
export declare function getSessionProgress(sessionId: string): Promise<ProgressData | null>;
//# sourceMappingURL=progress-tracker.d.ts.map