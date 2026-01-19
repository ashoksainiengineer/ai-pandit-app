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
export interface ProgressData {
    currentStep: number;
    totalSteps: number;
    percentage: number;
    steps: ProgressStep[];
    lastUpdate: string;
    liveMessage?: string;
    candidateScores: CandidateScore[];
}
export declare const ANALYSIS_STEPS: Omit<ProgressStep, 'status'>[];
export declare class ProgressTracker {
    private sessionId;
    private progress;
    constructor(sessionId: string);
    private initProgress;
    /**
     * Start a step
     */
    startStep(stepId: string, message?: string): Promise<void>;
    /**
     * Update current step with live message
     */
    updateMessage(message: string, details?: string[]): Promise<void>;
    /**
     * Complete a step
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
     */
    private saveProgress;
    /**
     * Get current progress
     */
    getProgress(): ProgressData;
}
/**
 * Get progress for a session
 */
export declare function getSessionProgress(sessionId: string): Promise<ProgressData | null>;
//# sourceMappingURL=progress-tracker.d.ts.map