"use strict";
// lib/progress-tracker.ts
// Real-time progress tracking for BTR analysis
// Updates database with current step, message, and percentage
// Also emits SSE events for real-time streaming
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProgressTracker = exports.ANALYSIS_STEPS = void 0;
exports.getSessionProgress = getSessionProgress;
const drizzle_1 = require("../database/drizzle");
const schema_1 = require("../database/schema");
const drizzle_orm_1 = require("drizzle-orm");
const session_events_1 = require("./session-events");
// Define all analysis steps
exports.ANALYSIS_STEPS = [
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
class ProgressTracker {
    // 🚀 STATIC REGISTRY FOR FAST POLLING (No DB Hits)
    static activeInstances = new Map();
    sessionId;
    progress;
    candidateBuffers = new Map();
    constructor(sessionId) {
        this.sessionId = sessionId;
        this.progress = this.initProgress();
        // Register this instance for real-time polling
        ProgressTracker.activeInstances.set(sessionId, this);
    }
    /**
     * Get active in-memory instance
     */
    static getInstance(sessionId) {
        return ProgressTracker.activeInstances.get(sessionId);
    }
    initProgress() {
        return {
            currentStep: 0,
            totalSteps: exports.ANALYSIS_STEPS.length,
            percentage: 0,
            steps: exports.ANALYSIS_STEPS.map(step => ({
                ...step,
                status: 'pending',
            })),
            lastUpdate: new Date().toISOString(),
            candidateScores: [],
            lastAIThinking: undefined,
        };
    }
    /**
     * Update AI thinking logs - PURE MEMORY STREAMING
     * No DB Connection overhead for tokens
     */
    candidateLogs = new Map();
    /**
     * Update AI thinking logs - PURE MEMORY STREAMING with ISOLATION
     * Prevents interleaving of parallel candidate streams
     */
    async updateAIThinking(text, stage, candidateTime = 'general') {
        // 1. Append to ISOLATED Candidate Log
        const currentLog = this.candidateLogs.get(candidateTime) || '';
        const updatedLog = currentLog + text;
        this.candidateLogs.set(candidateTime, updatedLog);
        // 2. Update Display State (Snapshot of this candidate)
        // This ensures the UI sees a coherent stream for the *latest active* candidate
        this.progress.lastAIThinking = {
            stage,
            candidateTime,
            chunks: [], // UI can parse chunks from fullText if needed, or we safely disregard strictly for now
            fullText: updatedLog
        };
        // 3. Optional: Add to chunks if we want structured logs (but keep it simple for robustness)
        // If we switch candidates, we reset the chunks in the view model naturally above
        // For pure streaming, fullText is the source of truth.
        // Truncate individual log if too long (Memory Protection)
        if (updatedLog.length > 50000) {
            this.candidateLogs.set(candidateTime, updatedLog.slice(-50000));
            this.progress.lastAIThinking.fullText = this.candidateLogs.get(candidateTime);
        }
        // ❌ NO DB SAVE - Pure Stream as requested
        // BUT update lastActive for GC
        ProgressTracker.activeInstances.set(this.sessionId, this);
    }
    /**
     * Heartbeat to keep session alive in DB
     * Called automatically during progress updates but can be called manually
     */
    async pulse() {
        this.progress.lastUpdate = new Date().toISOString();
        await this.saveProgress(false); // Quick pulse without thinking logs
    }
    /**
     * Start a step
     */
    async startStep(stepId, message) {
        const stepIndex = this.progress.steps.findIndex(s => s.id === stepId);
        if (stepIndex === -1)
            return;
        this.progress.currentStep = stepIndex;
        this.progress.steps[stepIndex].status = 'running';
        this.progress.steps[stepIndex].startedAt = new Date().toISOString();
        this.progress.steps[stepIndex].message = message;
        this.progress.percentage = Math.round((stepIndex / this.progress.totalSteps) * 100);
        this.progress.lastUpdate = new Date().toISOString();
        this.progress.liveMessage = message;
        await this.saveProgress();
        // Emit SSE event for real-time streaming
        (0, session_events_1.emitProgress)(this.sessionId, stepId, stepIndex, this.progress.totalSteps, message || `Starting ${this.progress.steps[stepIndex].name}`, undefined);
    }
    /**
     * Update current step with live message
     */
    async updateMessage(message, details) {
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
        (0, session_events_1.emitProgress)(this.sessionId, this.progress.steps[currentIndex]?.id || 'unknown', currentIndex, this.progress.totalSteps, message, details);
    }
    /**
     * Complete a step - PERSISTENT FLUSH
     * This is where we save AI thinking to DB as it's a major milestone
     */
    async completeStep(stepId, details) {
        const stepIndex = this.progress.steps.findIndex(s => s.id === stepId);
        if (stepIndex === -1)
            return;
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
        (0, session_events_1.emitProgress)(this.sessionId, stepId, stepIndex, this.progress.totalSteps, `Completed ${this.progress.steps[stepIndex].name}`, details);
    }
    /**
     * Mark step as error
     */
    async errorStep(stepId, error) {
        const stepIndex = this.progress.steps.findIndex(s => s.id === stepId);
        if (stepIndex === -1)
            return;
        this.progress.steps[stepIndex].status = 'error';
        this.progress.steps[stepIndex].message = error;
        this.progress.lastUpdate = new Date().toISOString();
        await this.saveProgress(true); // Save state on error
        // Emit SSE error event
        (0, session_events_1.emitError)(this.sessionId, error, stepId);
        // Allow some time for error to be read before cleanup?
        // Actually, we should probably keep failed sessions in memory for a bit too.
    }
    /**
     * Complete all progress
     */
    async complete() {
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
    async addCandidateScore(score) {
        this.progress.candidateScores.push(score);
        // Emit event directly
        (0, session_events_1.emitCandidateScore)(this.sessionId, score.time, score.score, score.stage, score.rank);
        await this.saveProgress();
    }
    /**
     * Save progress to database
     * @param includeThinking Set to true for MAJOR flushes (stage completion) to save DB writes
     */
    async saveProgress(includeThinking = false) {
        try {
            // 🛡️ Data Minimization: Strip reasoning tokens/AI thinking from regular database persistence
            // We only keep it in MAJOR flushes to save Turso Write Quota
            const dbProgress = { ...this.progress };
            if (!includeThinking) {
                delete dbProgress.lastAIThinking;
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
            await drizzle_1.db.update(schema_1.sessions)
                .set({
                progressData: progressJson,
                updatedAt: new Date().toISOString(),
            })
                .where((0, drizzle_orm_1.eq)(schema_1.sessions.id, this.sessionId));
        }
        catch (error) {
            console.error('Failed to save progress:', error);
        }
    }
    /**
     * Get current progress
     */
    getProgress() {
        return this.progress;
    }
}
exports.ProgressTracker = ProgressTracker;
// ═════════════════════════════════════════════════════════════════════════════
// STATIC HELPER FUNCTIONS
// ═════════════════════════════════════════════════════════════════════════════
/**
 * Get progress for a session
 * 🚀 PRIORITIZES IN-MEMORY STATE FOR STREAMING
 */
async function getSessionProgress(sessionId) {
    // 1. Check In-Memory (Real-time)
    const activeInstance = ProgressTracker.getInstance(sessionId);
    if (activeInstance) {
        return activeInstance.getProgress();
    }
    // 2. Fallback to Database (Persistence)
    try {
        const result = await drizzle_1.db.select({ progressData: schema_1.sessions.progressData })
            .from(schema_1.sessions)
            .where((0, drizzle_orm_1.eq)(schema_1.sessions.id, sessionId))
            .limit(1);
        if (result.length === 0 || !result[0].progressData) {
            return null;
        }
        return JSON.parse(result[0].progressData);
    }
    catch (error) {
        console.error('Failed to get progress:', error);
        return null;
    }
}
//# sourceMappingURL=progress-tracker.js.map