// lib/progress-tracker.ts
// Real-time progress tracking for BTR analysis
// Updates database with current step, message, and percentage

import { db } from '@/database/drizzle';
import { sessions } from '@/database/schema';
import { eq } from 'drizzle-orm';

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

export interface ProgressData {
    currentStep: number;
    totalSteps: number;
    percentage: number;
    steps: ProgressStep[];
    lastUpdate: string;
    liveMessage?: string;
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
    private sessionId: string;
    private progress: ProgressData;

    constructor(sessionId: string) {
        this.sessionId = sessionId;
        this.progress = this.initProgress();
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
        };
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
    }

    /**
     * Complete a step
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

        await this.saveProgress();
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

        await this.saveProgress();
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

        await this.saveProgress();
    }

    /**
     * Save progress to database
     */
    private async saveProgress(): Promise<void> {
        try {
            await db.update(sessions)
                .set({
                    progressData: JSON.stringify(this.progress),
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
 */
export async function getSessionProgress(sessionId: string): Promise<ProgressData | null> {
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
