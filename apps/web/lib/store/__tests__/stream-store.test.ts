import { describe, it, expect, beforeEach, vi } from 'vitest';
import { act } from '@testing-library/react';

// ═══════════════════════════════════════════════════════════════════════════
// MOCKS
// ═══════════════════════════════════════════════════════════════════════════

// Mock idb-keyval before importing the store
vi.mock('idb-keyval', () => ({
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
}));

import { useStreamStore, createInitialState } from '../stream-store';

describe('useStreamStore (Zustand State Management)', () => {

    beforeEach(() => {
        // Reset the store before each test
        useStreamStore.setState(createInitialState());
        vi.clearAllMocks();
    });

    // ═════ Init & Defaults ═════

    describe('Initialization', () => {
        it('should initialize with correct default state', () => {
            const state = useStreamStore.getState();
            expect(state.sessionId).toBeNull();
            expect(state.isComplete).toBe(false);
            expect(state.error).toBeNull();
            expect(state.analyzedCount).toBe(0);
        });
    });

    // ═════ Direct Actions ═════

    describe('Direct Actions', () => {
        it('should set sessionId', () => {
            useStreamStore.getState().setSessionId('test-session-123');
            expect(useStreamStore.getState().sessionId).toBe('test-session-123');
        });

        it('should force error state', () => {
            useStreamStore.getState().forceError('Simulated Failure');
            expect(useStreamStore.getState().error).toBe('Simulated Failure');
            expect(useStreamStore.getState().isComplete).toBe(false);
        });

        it('should mark complete', () => {
            useStreamStore.getState().markComplete();
            expect(useStreamStore.getState().isComplete).toBe(true);
        });

        it('should clear store and reset everything', () => {
            const store = useStreamStore.getState();
            store.setSessionId('test-session-123');
            store.forceError('Test error');
            store.markComplete();

            store.clearStore();

            const resetState = useStreamStore.getState();
            expect(resetState.sessionId).toBeNull();
            expect(resetState.error).toBeNull();
            expect(resetState.isComplete).toBe(false);
        });
    });

    // ═════ Dispatch Event (Progress) ═════

    describe('dispatchStreamEvent - Progress', () => {
        it('should successfully handle "initial_state" event', () => {
            useStreamStore.getState().dispatchStreamEvent('initial_state', {
                progress: {
                    currentStep: 1,
                    totalSteps: 5,
                    message: 'Warming up the engines...',
                    steps: [{ id: 'init', name: 'Start' }],
                    candidateScores: [{ time: '12:00', score: 85, stage: 1 }],
                    startedAt: '2026-01-01T00:00:00Z',
                }
            });

            const state = useStreamStore.getState();
            expect(state.progress?.stepIndex).toBe(1);
            expect(state.progress?.totalSteps).toBe(5);
            expect(state.progress?.message).toBe('Warming up the engines...');
            expect(state.candidateScores.length).toBe(1);
            expect(state.startedAt).toBe('2026-01-01T00:00:00Z');
        });

        it('should successfully handle "progress" event', () => {
            useStreamStore.getState().dispatchStreamEvent('progress', {
                stepIndex: 2,
                totalSteps: 7,
                message: 'Stage 2 Processing',
                percentage: 30,
            });

            const state = useStreamStore.getState();
            expect(state.progress?.stepIndex).toBe(2);
            expect(state.progress?.percentage).toBe(30);
            expect(state.progress?.message).toBe('Stage 2 Processing');
        });
    });

    // ═════ Dispatch Event (AI Thinking / rAF Batching) ═════

    describe('dispatchStreamEvent - AI Thinking', () => {
        it('should buffer "ai_thinking" chunks and flush on requestAnimationFrame', async () => {
            let rafCallback: FrameRequestCallback | null = null;
            vi.stubGlobal('requestAnimationFrame', vi.fn((cb) => {
                rafCallback = cb;
                return 1;
            }));

            useStreamStore.getState().dispatchStreamEvent('ai_thinking', {
                chunk: 'Thinking step 1...',
                stage: 1,
                candidateTime: '12:00'
            });

            // Still buffered
            expect(useStreamStore.getState().candidatesByStage[1]).toBeUndefined();
            expect(rafCallback).toBeTruthy();

            // Trigger rAF
            if (rafCallback) {
                act(() => (rafCallback as any)(0));
            }

            const state = useStreamStore.getState();
            expect(state.candidatesByStage[1]?.['12:00'].fullText).toBe('Thinking step 1...');
        });

        it('should de-duplicate replayed chunks using suffix-overlap logic', async () => {
            let rafCallback: FrameRequestCallback | null = null;
            vi.stubGlobal('requestAnimationFrame', vi.fn((cb) => {
                rafCallback = cb;
                return 1;
            }));

            const overlap = "This is exactly fifty characters long for the test";
            const chunk1 = "We are testing the deduplication logic. " + overlap;
            const chunk2 = overlap + " and this is the new suffix added.";

            // Step 1: Initial chunk
            useStreamStore.getState().dispatchStreamEvent('ai_thinking', {
                chunk: chunk1,
                stage: 1,
                candidateTime: '12:00'
            });
            if (rafCallback) act(() => (rafCallback as any)(0));

            // Step 2: Replay chunk (starts with end of previous)
            useStreamStore.getState().dispatchStreamEvent('ai_thinking', {
                chunk: chunk2,
                stage: 1,
                candidateTime: '12:00'
            });
            if (rafCallback) act(() => (rafCallback as any)(16));

            expect(useStreamStore.getState().candidatesByStage[1]?.['12:00'].fullText).toBe(chunk1 + " and this is the new suffix added.");
        });

        it('should sync activeAIStage and update displayedCandidate (selection logic)', async () => {
            let rafCallback: FrameRequestCallback | null = null;
            vi.stubGlobal('requestAnimationFrame', vi.fn((cb) => {
                rafCallback = cb;
                return 1;
            }));

            // Initial state: stage 1
            useStreamStore.setState({ activeAIStage: 1, displayedCandidate: null });

            // Send chunk for stage 2
            useStreamStore.getState().dispatchStreamEvent('ai_thinking', {
                chunk: 'Analyzing batch...',
                stage: 2,
                candidateTime: '14:30'
            });

            // 1. activeAIStage should update immediately (synchronously) to trigger panel switch
            expect(useStreamStore.getState().activeAIStage).toBe(2);

            // 2. displayedCandidate and fullText should update AFTER rAF flush
            if (rafCallback) act(() => (rafCallback as any)(0));

            const state = useStreamStore.getState();
            expect(state.candidatesByStage[2]?.['14:30'].fullText).toBe('Analyzing batch...');
            // INDUSTRY FIX: displayedCandidate should be the RAW time, not prefixed
            expect(state.displayedCandidate).toBe('14:30');
        });
    });

    // ═════ Tiered Memory & Pruning ═════

    describe('Tiered Memory & Pruning', () => {
        it('should enforce char limits based on candidate score', async () => {
            let rafCallback: FrameRequestCallback | null = null;
            vi.stubGlobal('requestAnimationFrame', vi.fn((cb) => {
                rafCallback = cb;
                return 1;
            }));

            // Set a low score (40) for this candidate
            useStreamStore.setState({
                candidateScores: [{ time: '12:00', score: 40, stage: 1 }]
            });

            // Send a large chunk (over 5KB limit)
            const largeText = 'A'.repeat(6000);
            useStreamStore.getState().dispatchStreamEvent('ai_thinking', {
                chunk: largeText,
                stage: 1,
                candidateTime: '12:00'
            });

            if (rafCallback) act(() => (rafCallback as any)(0));

            const state = useStreamStore.getState();
            const fullText = state.candidatesByStage[1]?.['12:00'].fullText;

            // 40 score -> 5,000 char limit
            expect(fullText?.length).toBe(5000);
        });

        it('should prune low-score candidates when stage completes', () => {
            // Fill stage with many candidates (over the 500 limit)
            const candidates: Record<string, any> = {};
            const scores: any[] = [];
            for (let i = 0; i < 600; i++) {
                const time = `10:${i.toString().padStart(3, '0')}`;
                // Candidates 0-99 have score 100 (top), 100-599 have score 10 (low)
                candidates[time] = { fullText: 'some data' };
                scores.push({ time, score: i < 100 ? 100 : 10, stage: 1 });
            }

            useStreamStore.setState({
                candidatesByStage: { 1: candidates },
                candidateScores: scores,
                progress: { stepIndex: 1, totalSteps: 7, message: '', step: 'grid', percentage: 10 }
            });

            // Trigger a progress event that moves to stage 2
            act(() => {
                useStreamStore.getState().dispatchStreamEvent('initial_state', {
                    progress: {
                        currentStep: 2,
                        stepIndex: 2,
                        message: 'Moving to Stage 2',
                        candidateScores: scores,
                    }
                });
            });

            const state = useStreamStore.getState();

            // Expected: Only 500 candidates remain (MAX_ACTIVE_ALL)
            expect(state.candidateScores.length).toBe(500);

            // Expected: Top scorers (0-99) are still there
            const candidate0 = state.candidateScores.find(s => s.time === '10:000');
            expect(candidate0).toBeTruthy();
        });
    });

    // ═════ Dispatch Event (Terminal States) ═════

    describe('dispatchStreamEvent - Terminal States', () => {
        it('should handle "result" event', () => {
            useStreamStore.getState().dispatchStreamEvent('result', {
                rectifiedTime: '14:30',
                confidence: 'high'
            });

            const state = useStreamStore.getState();
            expect(state.isComplete).toBe(true);
            expect(state.result?.rectifiedTime).toBe('14:30');
            expect(state.result?.confidence).toBe('high');
        });

        it('should handle "error" event', () => {
            useStreamStore.getState().dispatchStreamEvent('error', {
                message: 'Internal server error while processing'
            });

            const state = useStreamStore.getState();
            expect(state.isComplete).toBe(false);
            expect(state.error).toBe('Internal server error while processing');
        });
    });
});
