// lib/progress-tracker.ts
// Real-time progress tracking for BTR analysis
// Updates database with current step, message, and percentage
// Also emits SSE events for real-time streaming

import { db } from '../database/drizzle.js';
import { sessions } from '../database/schema.js';
import { eq } from 'drizzle-orm';
import { emitProgress, emitComplete, emitError, emitCandidateScore, emitAIContext } from './session-events.js';

// ═════════════════════════════════════════════════════════════════════════════

export interface CandidateScore {
    time: string;
    score: number;
    stage: number;
    rank?: number;
}

// ═════════════════════════════════════════════════════════════════════════════
// PROGRESS STEPS DEFINITION
// ═════════════════════════════════════════════════════════════════════════════

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

export interface AIContextData {
    stage: number;
    candidateTime: string;
    planetaryInfo: {
        ascendant: string;
        sun: string;
        moon: string;
    };
    dasha: string;
    divCharts?: string;
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
    aiContext?: AIContextData;
    stageHistory?: Record<number, string>; // 🏛️ Persistent reasoning history per stage
}


// Define all analysis steps
export const ANALYSIS_STEPS: Omit<ProgressStep, 'status'>[] = [
    { id: 'init', name: 'Initializing Analysis', icon: '🚀' },
    { id: 'ephemeris', name: 'Calculating Planetary Positions', icon: '🔭' },
    { id: 'houses', name: 'Determining House Cusps', icon: '🏠' },
    { id: 'candidates', name: 'Generating Candidate Times', icon: '⏰' },
    { id: 'dasha', name: 'Analyzing Vimshottari Dasha', icon: '📊' },
    { id: 'divisional', name: 'Processing Divisional Charts', icon: '📐' },
    { id: 'events', name: 'Correlating Life Events', icon: '📅' },
    { id: 'physical', name: 'Matching Physical Traits', icon: '👤' },
    { id: 'ai', name: 'AI Cross-Verification', icon: '🤖' },
    { id: 'final', name: 'Finalizing Results', icon: '✨' },
];

// ═════════════════════════════════════════════════════════════════════════════
// PROGRESS TRACKER CLASS
// ═════════════════════════════════════════════════════════════════════════════

export class ProgressTracker {
    // 🚀 STATIC REGISTRY FOR FAST POLLING (No DB Hits)
    private static activeInstances = new Map<string, ProgressTracker>();

    private sessionId: string;
    private progress: ProgressData;

    private candidateBuffers: Map<string, string> = new Map();
    private lastPulseTime: number = 0;

    constructor(sessionId: string) {
        this.sessionId = sessionId;
        this.progress = this.initProgress();
        // Register this instance for real-time polling
        ProgressTracker.activeInstances.set(sessionId, this);
    }

    /**
     * Get active in-memory instance
     */
    public static getInstance(sessionId: string): ProgressTracker | undefined {
        return ProgressTracker.activeInstances.get(sessionId);
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

        // 🏛️ Real-time memory sync for stage history
        if (!this.progress.stageHistory) this.progress.stageHistory = {};
        this.progress.stageHistory[stage] = updatedLog;

        // 3. Optional: Add to chunks if we want structured logs (but keep it simple for robustness)
        // If we switch candidates, we reset the chunks in the view model naturally above
        // For pure streaming, fullText is the source of truth.

        // Truncate individual log if too long (Memory Protection)
        if (updatedLog.length > 50000) {
            this.candidateLogs.set(candidateTime, updatedLog.slice(-50000));
            this.progress.lastAIThinking.fullText = this.candidateLogs.get(candidateTime)!;
        }

        // ❌ NO DB SAVE - Pure Stream as requested
        // BUT update lastActive for GC
        ProgressTracker.activeInstances.set(this.sessionId, this);

        // 💓 DEBOUNCED DB PULSE: Keep session alive in DB during long AI streaming
        // Only update DB every 30 seconds to save IO but prevent stale cleanup (30 mins)
        const now = Date.now();
        if (now - this.lastPulseTime > 30000) {
            this.lastPulseTime = now;
            this.pulse().catch(err => console.error('Heartbeat pulse failed:', err));
        }
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

        await this.saveProgress();

        // Emit SSE event for real-time streaming
        emitProgress(
            this.sessionId,
            stepId,
            stepIndex,
            this.progress.totalSteps,
            message || `Starting ${this.progress.steps[stepIndex].name}`,
            undefined
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
            details
        );
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

        // 🛡️ PERSISTENT FLUSH: Save thinking to DB on stage completion
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
     */
    async complete(): Promise<void> {
        this.progress.percentage = 100;
        this.progress.liveMessage = 'Analysis complete!';
        this.progress.lastUpdate = new Date().toISOString();

        // Mark any remaining steps as complete
        this.progress.steps.forEach(step => {
            if (step.status !== 'complete' && step.status !== 'error') {
                step.status = 'complete';
                step.completedAt = new Date().toISOString();
            }
        });

        await this.saveProgress(true); // Final flush

        // Cleanup memory after short delay (preserve for immediate polling)
        setTimeout(() => {
            ProgressTracker.activeInstances.delete(this.sessionId);
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
            score.time,
            score.score,
            score.stage,
            score.rank
        );

        await this.saveProgress();
    }

    /**
     * Save progress to database
     * @param includeThinking Set to true for MAJOR flushes (stage completion) to save DB writes
     */
    private async saveProgress(includeThinking: boolean = false): Promise<void> {
        try {
            // 🛡️ [TURSO OPTIMIZED] Data Minimization
            // We only keep the active reasoning in MAJOR flushes (includeThinking=true)
            const dbProgress = { ...this.progress };
            if (!includeThinking) {
                // Remove transient fields for heartbeat/minor updates
                delete dbProgress.lastAIThinking;

                // Keep stageHistory BUT limit size if not a major flush
                // Actually, stageHistory should always stay in DB once snapshotted
            }

            // 💾 Size Limit Check: Truncate if too huge (Turso fallback)
            let progressJson = JSON.stringify(dbProgress);
            if (progressJson.length > 90000) {
                // If still too big even with optimization, truncate thinking logs
                if (dbProgress.lastAIThinking) {
                    dbProgress.lastAIThinking.fullText = dbProgress.lastAIThinking.fullText.slice(-20000);
                    dbProgress.lastAIThinking.chunks = [];
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
            console.error('Failed to save progress:', error);
        }
    }

    /**
     * Get current progress
     */
    getProgress(): ProgressData {
        return this.progress;
    }
}

// ═════════════════════════════════════════════════════════════════════════════
// STATIC HELPER FUNCTIONS
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Get progress for a session
 * 🚀 PRIORITIZES IN-MEMORY STATE FOR STREAMING
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

        return JSON.parse(result[0].progressData) as ProgressData;
    } catch (error) {
        console.error('Failed to get progress:', error);
        return null;
    }
}
