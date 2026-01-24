"use strict";
// lib/progress-tracker.ts
// Real-time progress tracking for BTR analysis
// Updates database with current step, message, and percentage
// Also emits SSE events for real-time streaming
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProgressTracker = exports.ANALYSIS_STEPS = void 0;
exports.getSessionProgress = getSessionProgress;
const drizzle_js_1 = require("../database/drizzle.js");
const schema_js_1 = require("../database/schema.js");
const drizzle_orm_1 = require("drizzle-orm");
const session_events_js_1 = require("./session-events.js");
// 🔱 GOD-TIER BTR v6.0 STEPS (6-Stage Pipeline)
exports.ANALYSIS_STEPS = [
    { id: 'init', name: 'Initializing', icon: '🚀' },
    { id: 'grid', name: 'Stage 1: Adaptive Grid Generation', icon: '📊' },
    { id: 'coarse', name: 'Stage 2: AI Coarse Elimination', icon: '🧠' },
    { id: 'fine', name: 'Stage 3: Fine Grid Expansion', icon: '🔬' },
    { id: 'deep', name: 'Stage 4: AI Deep Analysis', icon: '⚔️' },
    { id: 'micro', name: 'Stage 5: Micro Grid + D60', icon: '📐' },
    { id: 'final', name: 'Stage 6: AI Final Precision', icon: '🔱' },
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
    lastPulseTime = 0;
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
            stageHistory: {},
            calculationLogs: [],
            estimatedTimeRemaining: 0,
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
            chunks: [], // UI can parse chunks from fullText if needed
            fullText: updatedLog
        };
        // 🏛️ Real-time memory sync for stage history
        if (!this.progress.stageHistory)
            this.progress.stageHistory = {};
        // 🔥 GOD-TIER MEMORY PROTECTION: Cap thinking and stage history
        // On HF, we cannot afford to keep 50KB strings in multiple maps.
        const MEMORY_LIMIT = 5000;
        const truncatedLog = updatedLog.length > MEMORY_LIMIT ? updatedLog.slice(-MEMORY_LIMIT) : updatedLog;
        this.candidateLogs.set(candidateTime, truncatedLog);
        this.progress.stageHistory[stage] = truncatedLog;
        if (this.progress.lastAIThinking) {
            this.progress.lastAIThinking.fullText = truncatedLog;
        }
        // Keep stageHistory lean - remove very old stages if memory is tight
        const stages = Object.keys(this.progress.stageHistory).map(Number).sort((a, b) => a - b);
        if (stages.length > 5) {
            delete this.progress.stageHistory[stages[0]]; // Remove oldest stage
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
     * Add calculation log - PERSISTENT
     */
    async addCalculationLog(candidateTime, log) {
        if (!this.progress.calculationLogs)
            this.progress.calculationLogs = [];
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
    async updateETA(seconds) {
        this.progress.estimatedTimeRemaining = seconds;
        (0, session_events_js_1.emitEstimatedTime)(this.sessionId, seconds);
        await this.saveProgress();
    }
    /**
     * Update AI Context (Ground Truth Display)
     */
    async updateAIContext(context) {
        this.progress.aiContext = context;
        this.progress.lastUpdate = new Date().toISOString();
        // Emit Real-Time Event for Frontend
        (0, session_events_js_1.emitAIContext)(this.sessionId, context);
        // We don't necessarily need to save to DB for every context switch if it's high freq,
        // but for batch sample it's low freq enough.
        await this.saveProgress(false);
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
        // ⏱️ Initialize global session start time on first step
        if (stepId === 'prana' && !this.progress.startedAt) {
            this.progress.startedAt = this.progress.steps[stepIndex].startedAt;
        }
        await this.saveProgress();
        // Emit SSE event for real-time streaming
        (0, session_events_js_1.emitProgress)(this.sessionId, stepId, stepIndex, this.progress.totalSteps, message || `Starting ${this.progress.steps[stepIndex].name}`, undefined);
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
        (0, session_events_js_1.emitProgress)(this.sessionId, this.progress.steps[currentIndex]?.id || 'unknown', currentIndex, this.progress.totalSteps, message, details);
    }
    /**
     * Update percentage manually
     */
    async updatePercentage(percentage) {
        this.progress.percentage = percentage;
        this.progress.lastUpdate = new Date().toISOString();
        await this.saveProgress();
        // Emit update
        (0, session_events_js_1.emitProgress)(this.sessionId, this.progress.steps[this.progress.currentStep]?.id || 'unknown', this.progress.currentStep, this.progress.totalSteps, this.progress.liveMessage || '', undefined);
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
        (0, session_events_js_1.emitProgress)(this.sessionId, stepId, stepIndex, this.progress.totalSteps, `Completed ${this.progress.steps[stepIndex].name}`, details);
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
        (0, session_events_js_1.emitError)(this.sessionId, error, stepId);
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
        (0, session_events_js_1.emitCandidateScore)(this.sessionId, score.time, score.score, score.stage, score.rank);
        await this.saveProgress();
    }
    /**
     * Save progress to database
     * @param includeThinking Set to true for MAJOR flushes (stage completion) to save DB writes
     */
    async saveProgress(includeThinking = false) {
        try {
            // 🚀 GOD-TIER OPTIMIZATION: Throttled DB Writes
            // On HF Free Tier, Turso DB round-trips are expensive.
            // We only flush if:
            // 1. It's a major flush (includeThinking = true)
            // 2. 10 seconds have passed since last write
            if (!includeThinking && Date.now() - this.lastPulseTime < 10000) {
                return; // Skip minor update to save IO
            }
            this.lastPulseTime = Date.now();
            // 🛡️ [TURSO OPTIMIZED] Data Minimization
            const dbProgress = { ...this.progress };
            // Limit thinking history to save space
            if (!includeThinking) {
                delete dbProgress.lastAIThinking;
            }
            let progressJson = JSON.stringify(dbProgress);
            // 💾 Size Limit Check: Truncate if too huge (Turso fallback)
            if (progressJson.length > 95000) {
                if (dbProgress.calculationLogs && dbProgress.calculationLogs.length > 50) {
                    dbProgress.calculationLogs = dbProgress.calculationLogs.slice(-50);
                    progressJson = JSON.stringify(dbProgress);
                }
                if (progressJson.length > 95000 && dbProgress.lastAIThinking) {
                    dbProgress.lastAIThinking.fullText = dbProgress.lastAIThinking.fullText.slice(-10000);
                    progressJson = JSON.stringify(dbProgress);
                }
            }
            await drizzle_js_1.db.update(schema_js_1.sessions)
                .set({
                progressData: progressJson,
                updatedAt: new Date().toISOString(),
            })
                .where((0, drizzle_orm_1.eq)(schema_js_1.sessions.id, this.sessionId));
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
        const result = await drizzle_js_1.db.select({ progressData: schema_js_1.sessions.progressData })
            .from(schema_js_1.sessions)
            .where((0, drizzle_orm_1.eq)(schema_js_1.sessions.id, sessionId))
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