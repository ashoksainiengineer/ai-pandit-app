
// lib/progress-tracker.ts
// Real-time progress tracking for BTR analysis
// Updates database with current step, message, and percentage
// Also emits SSE events for real-time streaming

import { db } from '@ai-pandit/db';
import { sessions } from '@ai-pandit/db/schema';
import { eq } from 'drizzle-orm';
import {
  emitProgress,
  emitError,
  emitCandidateScore,
  emitAIContext,
  emitEstimatedTime,
  emitAIThinking
} from './session-events.js';
import { logger } from '../utils/logger.js';
import { safeJsonParse } from './utils/safe-json-parse.js';
import type { CandidateScore, ProgressStep, AIThinkingData, AIContextData, ProgressData } from '@ai-pandit/shared';
export type { CandidateScore, ProgressStep, AIThinkingData, AIContextData, ProgressData };

// Analysis Pipeline Steps
export const ANALYSIS_STEPS: Omit<ProgressStep, 'status'>[] = [
    { id: 'init', name: 'Initializing Engine', icon: '🚀' },
    { id: 'grid', name: 'Stage 1: Grid Generation', icon: '📊' },
    { id: 'coarse', name: 'Stage 2: Batch Tournament', icon: '🏆' },
    { id: 'fine', name: 'Stage 3: Refinement Grid', icon: '🔬' },
    { id: 'deep', name: 'Stage 4: Deep Analysis', icon: '⚔️' },
    { id: 'micro', name: 'Stage 5: Micro Precision', icon: '📐' },
    { id: 'final', name: 'Final Verdict', icon: '🔱' },
];

function extractPersistenceErrorCode(error: unknown): string | null {
    if (!error || typeof error !== 'object') {
        return null;
    }

    if ('code' in error && typeof (error as { code?: unknown }).code === 'string') {
        return (error as { code: string }).code;
    }

    if ('cause' in error) {
        return extractPersistenceErrorCode((error as { cause?: unknown }).cause);
    }

    return null;
}

function shouldPropagatePersistenceFailure(error: unknown): boolean {
    if (process.env.NODE_ENV === 'production') {
        return true;
    }

    const code = extractPersistenceErrorCode(error);
    return code !== 'ECONNREFUSED' && code !== 'SQLITE_CANTOPEN' && code !== 'SQLITE_BUSY';
}



const _activeInstances = new Map<string, ProgressTracker>();

export function clearAllActiveInstances(): void {
  _activeInstances.clear();
}

export class ProgressTracker {
    private sessionId: string;
    private progress: ProgressData;
    private persistenceDisabled: boolean;

    private candidateBuffers: Map<string, string> = new Map();
    private lastPulseTime: number = 0;
    private lastSaveTime: number = 0; // Separated throttle for DB saves

    constructor(sessionId: string) {
        this.sessionId = sessionId;
        this.progress = this.initProgress();
        this.persistenceDisabled = process.env.NODE_ENV === 'test';
        // Register this instance for real-time polling
        _activeInstances.set(sessionId, this);
    }

    /**
     * Get active in-memory instance
     */
    public static getInstance(sessionId: string): ProgressTracker | undefined {
        return _activeInstances.get(sessionId);
    }

    public static clearInstance(sessionId: string): void {
        _activeInstances.delete(sessionId);
    }


    private initProgress(): ProgressData {
        return {
            currentStep: 0,
            totalSteps: ANALYSIS_STEPS.length,
            percentage: 0,
            steps: ANALYSIS_STEPS.map(step => ({
                ...step,
                status: 'pending' as const,
            })),
            lastUpdate: new Date().toISOString(),
            candidateScores: [],
            lastAIThinking: undefined,
            stageHistory: {},
            calculationLogs: [],
            estimatedTimeRemaining: 0,
        };
    }

    /**
     * Update AI thinking logs - PURE MEMORY STREAMING
     * No DB Connection overhead for tokens
     */
    private candidateLogs = new Map<string, string>();

    /**
     * Update AI thinking logs - PURE MEMORY STREAMING with ISOLATION
     * Prevents interleaving of parallel candidate streams
     */
    async updateAIThinking(text: string, stage: number, candidateTime: string = 'general'): Promise<void> {

        // 1. Append to ISOLATED Candidate Log
        const currentLog = this.candidateLogs.get(candidateTime) || '';
        const updatedLog = currentLog + text;
        this.candidateLogs.set(candidateTime, updatedLog);

        // 2. Update Display State (Snapshot of this candidate)
        // This ensures the UI sees a coherent stream for the *latest active* candidate
        this.progress.lastAIThinking = {
            stage,
            candidateTime,
            chunks: [], // UI can parse chunks from fullText if needed
            fullText: updatedLog
        };

        // Real-time memory sync for stage history
        if (!this.progress.stageHistory) this.progress.stageHistory = {};

        // Memory logging for diagnosis
        if (Math.random() < 0.05) {
            let totalMemoryEstimate = 0;
            this.candidateLogs.forEach(v => { totalMemoryEstimate += v.length; });
            logger.debug('[ProgressTracker] candidate log memory snapshot', {
                stage,
                approxKb: Math.round(totalMemoryEstimate / 1024),
                candidateStreams: this.candidateLogs.size
            });
        }

        // Memory protection: cap thinking and stage history
        // Increased for Deep Results Archive (100KB per stage)
        const MEMORY_LIMIT = 100000;

        const truncatedLog = updatedLog.length > MEMORY_LIMIT ? updatedLog.slice(-MEMORY_LIMIT) : updatedLog;
        this.candidateLogs.set(candidateTime, truncatedLog);
        this.progress.stageHistory[stage] = truncatedLog;

        if (this.progress.lastAIThinking) {
            this.progress.lastAIThinking.fullText = truncatedLog;
        }

        // Keep stageHistory lean - remove very old stages if memory is tight
        const stages = Object.keys(this.progress.stageHistory).map(Number).sort((a, b) => a - b);
        if (stages.length > 10) {
            delete this.progress.stageHistory[stages[0]]; // Remove oldest stage
        }

        // ❌ NO DB SAVE - Pure Stream as requested
        // BUT update lastActive for GC
        _activeInstances.set(this.sessionId, this);

        // 💓 DEBOUNCED DB PULSE: Keep session alive in DB during long AI streaming
        // Only update DB every 30 seconds to save IO but prevent stale cleanup (30 mins)
        const now = Date.now();
        if (now - this.lastPulseTime > 30000) {
            this.lastPulseTime = now;
            this.saveProgress(true).catch(err => logger.warn('Heartbeat pulse failed', { error: (err as Error)?.message || err })); // Persist progress explicitly
        }
    }

    /**
     * Add calculation log - PERSISTENT
     */
    async addCalculationLog(candidateTime: string, log: string): Promise<void> {
        if (!this.progress.calculationLogs) this.progress.calculationLogs = [];
        this.progress.calculationLogs.push({ candidateTime, log });

        // Limit log size (Memory Protection)
        if (this.progress.calculationLogs.length > 500) {
            this.progress.calculationLogs = this.progress.calculationLogs.slice(-500);
        }

        // We emit the individual log via the existing event system (handled by the caller or specialized method)
        // This method primarily ensures the log is in the state and will be saved to DB
        await this.saveProgress();
    }

    /**
     * Update ETA
     */
    async updateETA(seconds: number): Promise<void> {
        this.progress.estimatedTimeRemaining = seconds;
        emitEstimatedTime(this.sessionId, seconds);
        await this.saveProgress();
    }

    /**
     * Explicitly flush all buffers and add a mandatory stabilization pause.
     * Ensures all async thinking streams are fully transmitted before next stage.
     */
    async flush(message: string = "Stabilizing reasoning streams..."): Promise<void> {
        // 1. Emit final thinking buffer if any
        if (this.candidateBuffers.size > 0) {
            for (const [ct, buf] of this.candidateBuffers.entries()) {
                if (buf) emitAIThinking(this.sessionId, buf, this.progress.currentStep, ct);
            }
            this.candidateBuffers.clear();
        }

        // 2. Clear thinking display to prevent "zombie" text from previous stage
        this.progress.lastAIThinking = undefined;

        // 3. Update message and wait
        await this.updateMessage(message);

        // 4. Mandatory cooling period for SSE consistency
        await new Promise(resolve => setTimeout(resolve, 1500));

        await this.saveProgress(true);
    }

    /**
     * Update AI Context (Ground Truth Display)
     */
    async updateAIContext(context: AIContextData): Promise<void> {
        this.progress.aiContext = context;
        this.progress.lastUpdate = new Date().toISOString();

        // Emit Real-Time Event for Frontend
        emitAIContext(this.sessionId, context);

        // We don't necessarily need to save to DB for every context switch if it's high freq,
        // but for batch sample it's low freq enough.
        await this.saveProgress(false);
    }

    /**
     * Heartbeat to keep session alive in DB
     * Called automatically during progress updates but can be called manually
     */
    async pulse(): Promise<void> {
        this.progress.lastUpdate = new Date().toISOString();
        await this.saveProgress(false); // Quick pulse without thinking logs
    }

    /**
     * Start a step
     */
    async startStep(stepId: string, message?: string): Promise<void> {
        const stepIndex = this.progress.steps.findIndex(s => s.id === stepId);
        if (stepIndex === -1) return;

        this.progress.currentStep = stepIndex;
        this.progress.steps[stepIndex].status = 'running';
        this.progress.steps[stepIndex].startedAt = new Date().toISOString();
        this.progress.steps[stepIndex].message = message;
        this.progress.percentage = Math.round((stepIndex / this.progress.totalSteps) * 100);
        this.progress.lastUpdate = new Date().toISOString();
        this.progress.liveMessage = message;

        // ⏱️ Initialize global session start time on first step (Robust Safety Net)
        if (stepId === 'init' || !this.progress.startedAt) {
            this.progress.startedAt = new Date().toISOString();
        }

        this.progress.lastUpdate = new Date().toISOString();
        await this.saveProgress(true); // Force DB flush on step boundaries

        // Emit SSE event for real-time streaming
        emitProgress(
            this.sessionId,
            stepId,
            stepIndex,
            this.progress.totalSteps,
            message || `Starting ${this.progress.steps[stepIndex].name}`,
            undefined,
            this.progress.startedAt
        );
    }

    /**
     * Update current step with live message
     */
    async updateMessage(message: string, details?: string[]): Promise<void> {
        const currentIndex = this.progress.currentStep;
        if (currentIndex >= 0 && currentIndex < this.progress.steps.length) {
            this.progress.steps[currentIndex].message = message;
            if (details) {
                this.progress.steps[currentIndex].details = details;
            }
        }
        this.progress.liveMessage = message;
        this.progress.lastUpdate = new Date().toISOString();

        await this.saveProgress();

        // Emit SSE event for real-time streaming
        emitProgress(
            this.sessionId,
            this.progress.steps[currentIndex]?.id || 'unknown',
            currentIndex,
            this.progress.totalSteps,
            message,
            details,
            this.progress.startedAt
        );
    }

    /**
     * Update percentage manually
     */
    async updatePercentage(percentage: number): Promise<void> {
        this.progress.percentage = percentage;
        this.progress.lastUpdate = new Date().toISOString();
        await this.saveProgress();

        // Emit update
        emitProgress(
            this.sessionId,
            this.progress.steps[this.progress.currentStep]?.id || 'unknown',
            this.progress.currentStep,
            this.progress.totalSteps,
            this.progress.liveMessage || '',
            undefined,
            this.progress.startedAt
        );
    }

    /**
     * Update sub-progress within a stage
     * Calculates overall percentage based on current stage index and sub-step completion
     */
    async updateSubProgress(currentSubStep: number, totalSubSteps: number): Promise<void> {
        const stepIndex = this.progress.currentStep;
        const totalSteps = this.progress.totalSteps;

        // Base percentage for the current stage
        const basePercentage = (stepIndex / totalSteps) * 100;

        // Percentage weight of a single stage
        const stepWeight = (1 / totalSteps) * 100;

        // Calculate intra-stage progress (clamped between 0 and 0.99 of the stage weight)
        const subProgress = Math.min(0.99, currentSubStep / totalSubSteps) * stepWeight;

        const finalPercentage = Math.round(basePercentage + subProgress);

        if (finalPercentage !== this.progress.percentage) {
            await this.updatePercentage(finalPercentage);
        }
    }

    /**
     * Complete a step - PERSISTENT FLUSH
     * This is where we save AI thinking to DB as it's a major milestone
     */
    async completeStep(stepId: string, details?: string[]): Promise<void> {
        const stepIndex = this.progress.steps.findIndex(s => s.id === stepId);
        if (stepIndex === -1) return;

        this.progress.steps[stepIndex].status = 'complete';
        this.progress.steps[stepIndex].completedAt = new Date().toISOString();
        if (details) {
            this.progress.steps[stepIndex].details = details;
        }

        // Calculate percentage based on completed steps
        const completedCount = this.progress.steps.filter(s => s.status === 'complete').length;
        this.progress.percentage = Math.round((completedCount / this.progress.totalSteps) * 100);
        this.progress.lastUpdate = new Date().toISOString();

        // Persistent flush: save thinking to DB on stage completion
        await this.saveProgress(true);

        // Emit SSE event for real-time streaming
        emitProgress(
            this.sessionId,
            stepId,
            stepIndex,
            this.progress.totalSteps,
            `Completed ${this.progress.steps[stepIndex].name}`,
            details
        );
    }

    /**
     * Mark step as error
     */
    async errorStep(stepId: string, error: string): Promise<void> {
        const stepIndex = this.progress.steps.findIndex(s => s.id === stepId);
        if (stepIndex === -1) return;

        this.progress.steps[stepIndex].status = 'error';
        this.progress.steps[stepIndex].message = error;
        this.progress.lastUpdate = new Date().toISOString();

        await this.saveProgress(true); // Save state on error

        // Emit SSE error event
        emitError(this.sessionId, error, stepId);

        // Allow some time for error to be read before cleanup?
        // Actually, we should probably keep failed sessions in memory for a bit too.
    }

    /**
     * Complete all progress
     * Clears ephemeral data from database to save storage
     */
    async complete(): Promise<void> {
        this.progress.percentage = 100;
        this.progress.liveMessage = 'Analysis complete!';
        this.progress.lastUpdate = new Date().toISOString();

        // No pruning: keep all calculation logs and candidate scores for long-term audit
        // Only reasoning (lastAIThinking/stageHistory) is filtered in saveProgress()

        await this.saveProgress(true); // Final flush

        // Cleanup memory after short delay (preserve for immediate polling)
        setTimeout(() => {
            _activeInstances.delete(this.sessionId);
        }, 120000); // Keep in memory for 2 minutes after completion
    }


    /**
     * Add and persist candidate score
     */
    public async addCandidateScore(score: CandidateScore): Promise<void> {
        this.progress.candidateScores.push(score);

        // Emit event directly
        emitCandidateScore(
            this.sessionId,
            score.time.toString(),
            score.score || score.overallScore || 0,
            score.stage || 0,
            score.rank,
            score.minifiedEph,
            score.fullEph,
            score.batch
        );

        await this.saveProgress();
    }

    /**
     * Save progress to database
     * @param includeThinking Set to true for MAJOR flushes (stage completion) to save DB writes
     */
    private async saveProgress(includeThinking: boolean = false): Promise<void> {
        try {
            if (this.persistenceDisabled) {
                return;
            }

            // Throttled DB Writes
            // Database round-trips are expensive. We only flush if:
            // 1. It's a major flush (includeThinking = true)
            // Throttle regular saves (non-thinking checkpoints) to 10s to reduce DB load
            if (!includeThinking && Date.now() - this.lastSaveTime < 10000) {
                return;
            }

            this.lastSaveTime = Date.now();

            // Data persistence with volatile reasoning
            // We persist everything except AI thinking logs (stageHistory and lastAIThinking)
            // as per user request for "No permanent reasoning store".
            const dbProgress = { ...this.progress };

            // Data persistence
            // We now PERSIST stageHistory (Reasoning Logs) as per "Industry Standard" request.
            // But we still strip `lastAIThinking` as it's a transient UI state, not a permanent log.

            // 🗑️ STRIP ONLY TRANSIENT UI STATE
            delete dbProgress.lastAIThinking;

            let progressJson = JSON.stringify(dbProgress);

            // 💾 Size Limit Check: Truncate if too huge
            const MAX_DB_SIZE = 500000;
            if (progressJson.length > MAX_DB_SIZE) {
                // If calculation logs are huge, prune them first
                if (dbProgress.calculationLogs && dbProgress.calculationLogs.length > 200) {
                    dbProgress.calculationLogs = dbProgress.calculationLogs.slice(-200);
                    progressJson = JSON.stringify(dbProgress);
                }
                // If still too large, prune candidate scores
                if (progressJson.length > MAX_DB_SIZE && dbProgress.candidateScores && dbProgress.candidateScores.length > 500) {
                    dbProgress.candidateScores = dbProgress.candidateScores.slice(-500);
                    progressJson = JSON.stringify(dbProgress);
                }
            }

            await db.update(sessions)
                .set({
                    progressData: progressJson,
                    updatedAt: new Date().toISOString(),
                })
                .where(eq(sessions.id, this.sessionId));
        } catch (error) {
            logger.error('Failed to save progress', { sessionId: this.sessionId, includeThinking, error });
            // In test/dev, missing local DB connectivity should not abort the in-memory pipeline.
            if (shouldPropagatePersistenceFailure(error)) {
                if (includeThinking) {
                    throw error;
                }
                return;
            }

            this.persistenceDisabled = true;
        }
    }

    /**
     * Get current progress
     */
    getProgress(): ProgressData {
        return this.progress;
    }

    /**
     * Get full stage history (Reasoning Logs)
     */
    getStageHistory(): Record<number, string> | undefined {
        return this.progress.stageHistory;
    }

    /**
     * Get AI reasoning log for a specific candidate
     * Used by candidate-detail API for on-demand loading
     */
    getCandidateLog(candidateTime: string): string | undefined {
        return this.candidateLogs.get(candidateTime);
    }

    /**
     * Get score data for a specific candidate
     */
    getCandidateScoreByTime(candidateTime: string, stage?: number): CandidateScore | undefined {
        if (stage !== undefined) {
            return this.progress.candidateScores.find(
                s => s.time === candidateTime && s.stage === stage
            );
        }
        // Return the highest-stage score for this time
        const matches = this.progress.candidateScores.filter(s => s.time === candidateTime);
        return matches.sort((a, b) => (b.stage || 0) - (a.stage || 0))[0];
    }

    /**
     * Get all candidate times that have reasoning logs
     */
    getAllCandidateLogTimes(): string[] {
        return Array.from(this.candidateLogs.keys());
    }
}

// ═════════════════════════════════════════════════════════════════════════════
// STATIC HELPER FUNCTIONS
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Get progress for a session
 * Prioritizes in-memory state for streaming
 */
export async function getSessionProgress(sessionId: string): Promise<ProgressData | null> {

    // 1. Check In-Memory (Real-time)
    const activeInstance = ProgressTracker.getInstance(sessionId);
    if (activeInstance) {
        return activeInstance.getProgress();
    }

    // 2. Fallback to Database (Persistence)
    try {
        const result = await db.select({ progressData: sessions.progressData })
            .from(sessions)
            .where(eq(sessions.id, sessionId))
            .limit(1);

        if (result.length === 0 || !result[0].progressData) {
            return null;
        }

        try { return safeJsonParse<ProgressData>((result[0].progressData || "{}") as string, null as unknown as ProgressData); } catch (error) { logger.warn('[PROGRESS-TRACKER] Corrupt progress data, returning null', { error }); return null; }
    } catch (error) {
        logger.error('Failed to get progress', { sessionId, error });
        return null;
    }
}
