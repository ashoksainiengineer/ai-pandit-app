/**
 * 🔱 EXHAUSTIVE PROGRESS TRACKER TESTS
 * Tests ProgressTracker class: init, steps, percentage, AI thinking,
 * candidate scores, memory limits, stage history, static helpers
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ═══════════════════════════════════════════════════════════════════════════
// MOCKS
// ═══════════════════════════════════════════════════════════════════════════

vi.mock('@ai-pandit/db', () => ({
    db: {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
        update: vi.fn().mockReturnThis(),
        set: vi.fn().mockReturnThis(),
    },
}));

vi.mock('@ai-pandit/db/schema', () => ({
    sessions: { id: 'id', progressData: 'progressData', updatedAt: 'updatedAt' },
}));

vi.mock('drizzle-orm', () => ({
    eq: vi.fn((...args: any[]) => args),
    and: vi.fn((...args: any[]) => args),
    isNotNull: vi.fn((col: any) => col),
}));

vi.mock('../session-events.js', () => ({
    emitProgress: vi.fn(),
    emitComplete: vi.fn(),
    emitError: vi.fn(),
    emitCandidateScore: vi.fn(),
    emitAIContext: vi.fn(),
    emitEstimatedTime: vi.fn(),
    emitAIThinking: vi.fn(),
}));

vi.mock('../logger.js', () => ({
    logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

vi.mock('../redis-event-store.js', () => ({
    getRedisEventStore: vi.fn(() => ({
        storeContext: vi.fn().mockResolvedValue(undefined),
        getContext: vi.fn().mockResolvedValue(null),
        storeThinking: vi.fn().mockResolvedValue(undefined),
        getThinking: vi.fn().mockResolvedValue(new Map()),
        isAvailable: vi.fn().mockReturnValue(true),
        storeCalculationLog: vi.fn().mockResolvedValue(undefined),
        storeCandidateScore: vi.fn().mockResolvedValue(undefined),
    })),
}));
import { ProgressTracker, ANALYSIS_STEPS, getSessionProgress } from '../progress-tracker.js';
import { db } from '@ai-pandit/db';

// ═══════════════════════════════════════════════════════════════════════════
// ANALYSIS STEPS DEFINITION
// ═══════════════════════════════════════════════════════════════════════════

describe('ProgressTracker - ANALYSIS_STEPS', () => {
    it('should define 7 analysis steps', () => {
        expect(ANALYSIS_STEPS.length).toBe(7);
    });

    it('should have unique IDs', () => {
        const ids = ANALYSIS_STEPS.map(s => s.id);
        expect(new Set(ids).size).toBe(ids.length);
    });

    it('each step should have id, name, icon', () => {
        for (const step of ANALYSIS_STEPS) {
            expect(step.id).toBeDefined();
            expect(step.name).toBeDefined();
            expect(step.icon).toBeDefined();
        }
    });

    it('should start with init and end with final', () => {
        expect(ANALYSIS_STEPS[0].id).toBe('init');
        expect(ANALYSIS_STEPS[ANALYSIS_STEPS.length - 1].id).toBe('final');
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// CONSTRUCTOR & INITIALIZATION
// ═══════════════════════════════════════════════════════════════════════════

describe('ProgressTracker - Constructor', () => {
    afterEach(() => {
        ProgressTracker.clearInstance('test-session');
    });

    it('should create an instance with initial progress', () => {
        const tracker = new ProgressTracker('test-session');
        const progress = tracker.getProgress();
        expect(progress.currentStep).toBe(0);
        expect(progress.totalSteps).toBe(7);
        expect(progress.percentage).toBe(0);
        expect(progress.steps.length).toBe(7);
    });

    it('should register in static instances', () => {
        new ProgressTracker('test-session');
        expect(ProgressTracker.getInstance('test-session')).toBeDefined();
    });

    it('all steps should start as pending', () => {
        const tracker = new ProgressTracker('test-session');
        for (const step of tracker.getProgress().steps) {
            expect(step.status).toBe('pending');
        }
    });

    it('should initialize with empty candidate scores', () => {
        const tracker = new ProgressTracker('test-session');
        expect(tracker.getProgress().candidateScores).toEqual([]);
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// STATIC INSTANCE MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════

describe('ProgressTracker - Static Instance Management', () => {
    afterEach(() => {
        ProgressTracker.clearInstance('test-a');
        ProgressTracker.clearInstance('test-b');
    });

    it('should return undefined for non-existent session', () => {
        expect(ProgressTracker.getInstance('nonexistent')).toBeUndefined();
    });

    it('should clear instance', () => {
        new ProgressTracker('test-a');
        ProgressTracker.clearInstance('test-a');
        expect(ProgressTracker.getInstance('test-a')).toBeUndefined();
    });

    it('should manage multiple instances independently', () => {
        const a = new ProgressTracker('test-a');
        const b = new ProgressTracker('test-b');
        expect(ProgressTracker.getInstance('test-a')).toBe(a);
        expect(ProgressTracker.getInstance('test-b')).toBe(b);
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// STEP LIFECYCLE
// ═══════════════════════════════════════════════════════════════════════════

describe('ProgressTracker - Step Lifecycle', () => {
    let tracker: ProgressTracker;

    beforeEach(() => {
        tracker = new ProgressTracker('test-steps');
    });

    afterEach(() => {
        ProgressTracker.clearInstance('test-steps');
    });

    it('startStep should mark step as running', async () => {
        await tracker.startStep('init', 'Starting...');
        const progress = tracker.getProgress();
        expect(progress.steps[0].status).toBe('running');
        expect(progress.steps[0].startedAt).toBeDefined();
    });

    it('startStep should set percentage', async () => {
        await tracker.startStep('grid');
        const progress = tracker.getProgress();
        expect(progress.percentage).toBeGreaterThan(0);
    });

    it('startStep should set startedAt on first step', async () => {
        await tracker.startStep('init');
        expect(tracker.getProgress().startedAt).toBeDefined();
    });

    it('completeStep should mark step as complete', async () => {
        await tracker.startStep('init');
        await tracker.completeStep('init', ['Initialized']);
        const progress = tracker.getProgress();
        expect(progress.steps[0].status).toBe('complete');
        expect(progress.steps[0].completedAt).toBeDefined();
    });

    it('errorStep should mark step with error', async () => {
        await tracker.startStep('init');
        await tracker.errorStep('init', 'Failed to initialize');
        expect(tracker.getProgress().steps[0].status).toBe('error');
        expect(tracker.getProgress().steps[0].message).toBe('Failed to initialize');
    });

    it('should ignore non-existent step IDs', async () => {
        await tracker.startStep('nonexistent');
        // Should not crash, currentStep should stay at 0
        expect(tracker.getProgress().currentStep).toBe(0);
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// MESSAGE & PERCENTAGE UPDATES
// ═══════════════════════════════════════════════════════════════════════════

describe('ProgressTracker - Message & Percentage', () => {
    let tracker: ProgressTracker;

    beforeEach(() => {
        tracker = new ProgressTracker('test-msg');
    });

    afterEach(() => ProgressTracker.clearInstance('test-msg'));

    it('updateMessage should set live message', async () => {
        await tracker.startStep('init');
        await tracker.updateMessage('Processing grid...');
        expect(tracker.getProgress().liveMessage).toBe('Processing grid...');
    });

    it('updatePercentage should set percentage', async () => {
        await tracker.updatePercentage(50);
        expect(tracker.getProgress().percentage).toBe(50);
    });

    it('updateSubProgress should calculate correct percentage', async () => {
        await tracker.startStep('grid');
        await tracker.updateSubProgress(5, 10);
        const pct = tracker.getProgress().percentage;
        expect(pct).toBeGreaterThan(0);
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// AI THINKING & MEMORY LIMITS
// ═══════════════════════════════════════════════════════════════════════════

describe('ProgressTracker - AI Thinking', () => {
    let tracker: ProgressTracker;

    beforeEach(() => {
        tracker = new ProgressTracker('test-thinking');
    });

    afterEach(() => ProgressTracker.clearInstance('test-thinking'));

    it('should store AI thinking text', async () => {
        await tracker.updateAIThinking('Analyzing dasha...', 2, 'candidate-1');
        const thinking = tracker.getProgress().lastAIThinking;
        expect(thinking).toBeDefined();
        expect(thinking!.fullText).toContain('Analyzing dasha...');
        expect(thinking!.stage).toBe(2);
    });

    it('should accumulate text for same candidate', async () => {
        await tracker.updateAIThinking('Part 1.', 2, 'candidate-1');
        await tracker.updateAIThinking('Part 2.', 2, 'candidate-1');
        expect(tracker.getProgress().lastAIThinking!.fullText).toContain('Part 1.');
        expect(tracker.getProgress().lastAIThinking!.fullText).toContain('Part 2.');
    });

    it('should enforce 100KB memory limit per candidate', async () => {
        const bigChunk = 'x'.repeat(110000);
        await tracker.updateAIThinking(bigChunk, 2, 'big-candidate');
        const thinking = tracker.getProgress().lastAIThinking!;
        expect(thinking.fullText.length).toBeLessThanOrEqual(100000);
    });

    it('should store stage history', async () => {
        await tracker.updateAIThinking('Stage 1 text', 1);
        await tracker.updateAIThinking('Stage 2 text', 2);
        const history = tracker.getStageHistory();
        expect(history).toBeDefined();
        expect(history![1]).toContain('Stage 1 text');
        expect(history![2]).toContain('Stage 2 text');
    });

    it('should prune oldest stage when > 10 stages', async () => {
        for (let i = 1; i <= 12; i++) {
            await tracker.updateAIThinking(`Stage ${i}`, i);
        }
        const history = tracker.getStageHistory()!;
        const stages = Object.keys(history).map(Number);
        expect(stages.length).toBeLessThanOrEqual(11); // 12 - 1 pruned
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// CANDIDATE SCORES
// ═══════════════════════════════════════════════════════════════════════════

describe('ProgressTracker - Candidate Scores', () => {
    let tracker: ProgressTracker;

    beforeEach(() => {
        tracker = new ProgressTracker('test-scores');
    });

    afterEach(() => ProgressTracker.clearInstance('test-scores'));

    it('should add candidate score', async () => {
        await tracker.addCandidateScore({ time: '14:30', score: 85, stage: 2, rank: 1 } as any);
        expect(tracker.getProgress().candidateScores.length).toBe(1);
    });

    it('should accumulate multiple scores', async () => {
        await tracker.addCandidateScore({ time: '14:30', score: 85, stage: 2 } as any);
        await tracker.addCandidateScore({ time: '14:35', score: 90, stage: 2 } as any);
        expect(tracker.getProgress().candidateScores.length).toBe(2);
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// COMPLETION
// ═══════════════════════════════════════════════════════════════════════════

describe('ProgressTracker - Complete', () => {
    let tracker: ProgressTracker;

    beforeEach(() => {
        tracker = new ProgressTracker('test-complete');
    });

    afterEach(() => ProgressTracker.clearInstance('test-complete'));

    it('should set percentage to 100', async () => {
        await tracker.complete();
        expect(tracker.getProgress().percentage).toBe(100);
    });

    it('should set live message to Analysis complete!', async () => {
        await tracker.complete();
        expect(tracker.getProgress().liveMessage).toBe('Analysis complete!');
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// STATIC HELPER: getSessionProgress
// ═══════════════════════════════════════════════════════════════════════════

describe('getSessionProgress', () => {
    afterEach(() => ProgressTracker.clearInstance('test-helper'));

    it('should return in-memory progress if active', async () => {
        const tracker = new ProgressTracker('test-helper');
        await tracker.startStep('init', 'Starting');
        const progress = await getSessionProgress('test-helper');
        expect(progress).toBeDefined();
        expect(progress!.currentStep).toBe(0);
    });

    it('should return null if no active instance and Redis has no data', async () => {
        const progress = await getSessionProgress('db-session');
        expect(progress).toBeNull();
    });

    it('should return null if not found anywhere', async () => {
        const progress = await getSessionProgress('nonexistent');
        expect(progress).toBeNull();
    });

    it('should return null on Redis error', async () => {
        const { getRedisEventStore } = await import('../redis-event-store.js');
        vi.mocked(getRedisEventStore).mockReturnValueOnce({
            storeContext: vi.fn().mockResolvedValue(undefined),
            getContext: vi.fn().mockRejectedValueOnce(new Error('Redis down')),
            isAvailable: vi.fn().mockReturnValue(true),
        } as any);
        const progress = await getSessionProgress('error-session');
        expect(progress).toBeNull();
    });
});
