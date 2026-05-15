import { db } from '@ai-pandit/db';
import { sessions } from '@ai-pandit/db/schema';
import { eq } from 'drizzle-orm';
import {
  emitProgress,
  emitError,
  emitCandidateScore,
  emitAIContext,
  emitEstimatedTime,
  emitAIThinking,
} from '@ai-pandit/shared/session-events';
import { safeJsonParse } from '@ai-pandit/shared';
import { getRedisEventStore } from '@ai-pandit/shared/event-store';
import type { CandidateScore, ProgressStep, AIThinkingData, AIContextData, ProgressData } from '@ai-pandit/shared';

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
    if (!error || typeof error !== 'object') return null;
    if ('code' in error && typeof (error as { code?: unknown }).code === 'string') {
        return (error as { code: string }).code;
    }
    if ('cause' in error) {
        return extractPersistenceErrorCode((error as { cause?: unknown }).cause);
    }
    return null;
}

function shouldPropagatePersistenceFailure(error: unknown): boolean {
    if (process.env.NODE_ENV === 'production') return true;
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
    private lastSaveTime: number = 0;

    constructor(sessionId: string) {
        this.sessionId = sessionId;
        this.progress = this.initProgress();
        this.persistenceDisabled = process.env.NODE_ENV === 'test';
        _activeInstances.set(sessionId, this);
    }

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

    private candidateLogs = new Map<string, string>();

    async updateAIThinking(text: string, stage: number, candidateTime: string = 'general'): Promise<void> {
        const currentLog = this.candidateLogs.get(candidateTime) || '';
        const updatedLog = currentLog + text;
        this.candidateLogs.set(candidateTime, updatedLog);

        this.progress.lastAIThinking = {
            stage,
            candidateTime,
            chunks: [],
            fullText: updatedLog,
        };

        if (!this.progress.stageHistory) this.progress.stageHistory = {};

        if (Math.random() < 0.05) {
            let totalMemoryEstimate = 0;
            this.candidateLogs.forEach(v => { totalMemoryEstimate += v.length; });
            console.debug('[ProgressTracker] candidate log memory snapshot', {
                stage,
                approxKb: Math.round(totalMemoryEstimate / 1024),
                candidateStreams: this.candidateLogs.size,
            });
        }

        const MEMORY_LIMIT = 100000;
        const truncatedLog = updatedLog.length > MEMORY_LIMIT ? updatedLog.slice(-MEMORY_LIMIT) : updatedLog;
        this.candidateLogs.set(candidateTime, truncatedLog);
        this.progress.stageHistory[stage] = truncatedLog;

        if (this.progress.lastAIThinking) {
            this.progress.lastAIThinking.fullText = truncatedLog;
        }

        const stages = Object.keys(this.progress.stageHistory).map(Number).sort((a, b) => a - b);
        if (stages.length > 10) {
            delete this.progress.stageHistory[stages[0]];
        }

        _activeInstances.set(this.sessionId, this);

        const now = Date.now();
        if (now - this.lastPulseTime > 30000) {
            this.lastPulseTime = now;
            this.saveProgress(true).catch(err => console.warn('Heartbeat pulse failed', { error: (err as Error)?.message || err }));
        }

        if (now - this.lastSaveTime > 2000) {
            const redisStore = getRedisEventStore();
            redisStore.storeThinking(this.sessionId, candidateTime, { stage, text: updatedLog }).catch(() => {});
        }
    }

    async addCalculationLog(candidateTime: string, log: string): Promise<void> {
        if (!this.progress.calculationLogs) this.progress.calculationLogs = [];
        this.progress.calculationLogs.push({ candidateTime, log });
        if (this.progress.calculationLogs.length > 500) {
            this.progress.calculationLogs = this.progress.calculationLogs.slice(-500);
        }
        await this.saveProgress();
    }

    async updateETA(seconds: number): Promise<void> {
        this.progress.estimatedTimeRemaining = seconds;
        emitEstimatedTime(this.sessionId, seconds);
        await this.saveProgress();
    }

    async flush(message: string = "Stabilizing reasoning streams..."): Promise<void> {
        if (this.candidateBuffers.size > 0) {
            for (const [ct, buf] of this.candidateBuffers.entries()) {
                if (buf) emitAIThinking(this.sessionId, buf, this.progress.currentStep, ct);
            }
            this.candidateBuffers.clear();
        }
        this.progress.lastAIThinking = undefined;
        await this.updateMessage(message);
        await new Promise(resolve => setTimeout(resolve, 1500));
        await this.saveProgress(true);
    }

    async updateAIContext(context: AIContextData): Promise<void> {
        this.progress.aiContext = context;
        this.progress.lastUpdate = new Date().toISOString();
        emitAIContext(this.sessionId, context);
        await this.saveProgress(false);
    }

    async pulse(): Promise<void> {
        this.progress.lastUpdate = new Date().toISOString();
        await this.saveProgress(false);
    }

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

        if (stepId === 'init' || !this.progress.startedAt) {
            this.progress.startedAt = new Date().toISOString();
        }

        this.progress.lastUpdate = new Date().toISOString();
        await this.saveProgress(true);

        emitProgress(
            this.sessionId,
            stepId,
            stepIndex,
            this.progress.totalSteps,
            message || `Starting ${this.progress.steps[stepIndex].name}`,
            undefined,
            this.progress.startedAt,
        );
    }

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

        emitProgress(
            this.sessionId,
            this.progress.steps[currentIndex]?.id || 'unknown',
            currentIndex,
            this.progress.totalSteps,
            message,
            details,
            this.progress.startedAt,
        );
    }

    async updatePercentage(percentage: number): Promise<void> {
        this.progress.percentage = percentage;
        this.progress.lastUpdate = new Date().toISOString();
        await this.saveProgress();

        emitProgress(
            this.sessionId,
            this.progress.steps[this.progress.currentStep]?.id || 'unknown',
            this.progress.currentStep,
            this.progress.totalSteps,
            this.progress.liveMessage || '',
            undefined,
            this.progress.startedAt,
        );
    }

    async updateSubProgress(currentSubStep: number, totalSubSteps: number): Promise<void> {
        const stepIndex = this.progress.currentStep;
        const totalSteps = this.progress.totalSteps;
        const basePercentage = (stepIndex / totalSteps) * 100;
        const stepWeight = (1 / totalSteps) * 100;
        const subProgress = Math.min(0.99, currentSubStep / totalSubSteps) * stepWeight;
        const finalPercentage = Math.round(basePercentage + subProgress);

        if (finalPercentage !== this.progress.percentage) {
            await this.updatePercentage(finalPercentage);
        }
    }

    async completeStep(stepId: string, details?: string[]): Promise<void> {
        const stepIndex = this.progress.steps.findIndex(s => s.id === stepId);
        if (stepIndex === -1) return;

        this.progress.steps[stepIndex].status = 'complete';
        this.progress.steps[stepIndex].completedAt = new Date().toISOString();
        if (details) {
            this.progress.steps[stepIndex].details = details;
        }

        const completedCount = this.progress.steps.filter(s => s.status === 'complete').length;
        this.progress.percentage = Math.round((completedCount / this.progress.totalSteps) * 100);
        this.progress.lastUpdate = new Date().toISOString();

        await this.saveProgress(true);

        emitProgress(
            this.sessionId,
            stepId,
            stepIndex,
            this.progress.totalSteps,
            `Completed ${this.progress.steps[stepIndex].name}`,
            details,
        );
    }

    async errorStep(stepId: string, error: string): Promise<void> {
        const stepIndex = this.progress.steps.findIndex(s => s.id === stepId);
        if (stepIndex === -1) return;

        this.progress.steps[stepIndex].status = 'error';
        this.progress.steps[stepIndex].message = error;
        this.progress.lastUpdate = new Date().toISOString();

        await this.saveProgress(true);
        emitError(this.sessionId, error, stepId);
    }

    async complete(): Promise<void> {
        this.progress.percentage = 100;
        this.progress.liveMessage = 'Analysis complete!';
        this.progress.lastUpdate = new Date().toISOString();
        await this.saveProgress(true);
        setTimeout(() => {
            _activeInstances.delete(this.sessionId);
        }, 120000);
    }

    public async addCandidateScore(score: CandidateScore): Promise<void> {
        this.progress.candidateScores.push(score);
        emitCandidateScore(
            this.sessionId,
            score.time.toString(),
            score.score || score.overallScore || 0,
            score.stage || 0,
            score.rank,
            score.minifiedEph,
            score.fullEph,
            score.batch,
        );
        await this.saveProgress();
    }

    private async saveProgress(includeThinking: boolean = false): Promise<void> {
        try {
            if (this.persistenceDisabled) return;

            const now = Date.now();
            const throttleMs = includeThinking ? 0 : 5000;
            if (now - this.lastSaveTime < throttleMs) return;

            this.lastSaveTime = now;

            if (!includeThinking) {
                const redisStore = getRedisEventStore();
                await redisStore.storeContext(this.sessionId, {
                    currentStep: this.progress.currentStep,
                    percentage: this.progress.percentage,
                    liveMessage: this.progress.liveMessage,
                    estimatedTimeRemaining: this.progress.estimatedTimeRemaining,
                    lastUpdate: now,
                });
                return;
            }

            const dbProgress = { ...this.progress };
            delete dbProgress.lastAIThinking;

            let progressJson = JSON.stringify(dbProgress);

            const MAX_DB_SIZE = 500000;
            if (progressJson.length > MAX_DB_SIZE) {
                if (dbProgress.calculationLogs && dbProgress.calculationLogs.length > 200) {
                    dbProgress.calculationLogs = dbProgress.calculationLogs.slice(-200);
                    progressJson = JSON.stringify(dbProgress);
                }
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
            console.error('Failed to save progress', { sessionId: this.sessionId, includeThinking, error });
            if (!includeThinking) return;
            if (shouldPropagatePersistenceFailure(error)) throw error;
            this.persistenceDisabled = true;
        }
    }

    getProgress(): ProgressData {
        return this.progress;
    }

    getStageHistory(): Record<number, string> | undefined {
        return this.progress.stageHistory;
    }

    getCandidateLog(candidateTime: string): string | undefined {
        return this.candidateLogs.get(candidateTime);
    }

    getCandidateScoreByTime(candidateTime: string, stage?: number): CandidateScore | undefined {
        if (stage !== undefined) {
            return this.progress.candidateScores.find(s => s.time === candidateTime && s.stage === stage);
        }
        const matches = this.progress.candidateScores.filter(s => s.time === candidateTime);
        return matches.sort((a, b) => (b.stage || 0) - (a.stage || 0))[0];
    }

    getAllCandidateLogTimes(): string[] {
        return Array.from(this.candidateLogs.keys());
    }
}

export async function getSessionProgress(sessionId: string): Promise<ProgressData | null> {
    const activeInstance = ProgressTracker.getInstance(sessionId);
    if (activeInstance) {
        return activeInstance.getProgress();
    }

    const redisStore = getRedisEventStore();
    try {
        const [context, thinking, rawScores] = await Promise.all([
            redisStore.getContext(sessionId),
            redisStore.getThinking(sessionId),
            redisStore.getCandidateScores(sessionId),
        ]);

        if (context && typeof context === 'object') {
            const ctx = context as Partial<ProgressData> & { lastUpdate?: number };

            let lastAIThinking: AIThinkingData | undefined;
            const thinkingEntries = Array.from(thinking.entries());
            if (thinkingEntries.length > 0) {
                const [ct, data] = thinkingEntries[0];
                lastAIThinking = {
                    stage: data.stage,
                    candidateTime: ct,
                    chunks: [],
                    fullText: data.text,
                };
            }

            const candidateScores: CandidateScore[] = (rawScores as Array<Record<string, unknown>>)
                .filter(s => s && s.time)
                .map(s => ({
                    time: String(s.time),
                    score: Number(s.score) || 0,
                    stage: Number(s.stage) || 0,
                    rank: s.rank as number | undefined,
                    batch: s.batch as number | undefined,
                    minifiedEph: s.minifiedEph as CandidateScore['minifiedEph'],
                    fullEph: s.fullEph as CandidateScore['fullEph'],
                }));

            const redisProgress: ProgressData = {
                currentStep: ctx.currentStep ?? 0,
                totalSteps: ANALYSIS_STEPS.length,
                percentage: ctx.percentage ?? 0,
                steps: ANALYSIS_STEPS.map(step => ({ ...step, status: 'pending' as const })),
                lastUpdate: ctx.lastUpdate ? new Date(ctx.lastUpdate).toISOString() : new Date().toISOString(),
                candidateScores,
                estimatedTimeRemaining: ctx.estimatedTimeRemaining ?? 0,
                liveMessage: ctx.liveMessage,
                lastAIThinking,
                stageHistory: Object.fromEntries(
                    thinkingEntries.map(([ct, data]) => [data.stage, data.text]),
                ),
            };
            return redisProgress;
        }
    } catch (error) {
        console.warn('[PROGRESS-TRACKER] Redis read failed', { sessionId, error });
    }

    return null;
}
