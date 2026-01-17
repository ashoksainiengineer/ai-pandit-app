"use strict";
// lib/progress-tracker.ts
// Real-time progress tracking for BTR analysis
// Updates database with current step, message, and percentage
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProgressTracker = exports.ANALYSIS_STEPS = void 0;
exports.getSessionProgress = getSessionProgress;
const drizzle_js_1 = require("../database/drizzle.js");
const schema_js_1 = require("../database/schema.js");
const drizzle_orm_1 = require("drizzle-orm");
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
    sessionId;
    progress;
    constructor(sessionId) {
        this.sessionId = sessionId;
        this.progress = this.initProgress();
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
        };
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
    }
    /**
     * Complete a step
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
        await this.saveProgress();
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
        await this.saveProgress();
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
        await this.saveProgress();
    }
    /**
     * Save progress to database
     */
    async saveProgress() {
        try {
            await drizzle_js_1.db.update(schema_js_1.sessions)
                .set({
                progressData: JSON.stringify(this.progress),
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
 */
async function getSessionProgress(sessionId) {
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