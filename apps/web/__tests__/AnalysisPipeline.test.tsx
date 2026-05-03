/**
 * @vitest-environment jsdom
 * 
 * AnalysisPipeline.test.tsx — SSE → Store → UI Integration Tests
 * ==============================================================
 * Simulates a realistic SSE event sequence through the Zustand store
 * and verifies the full data pipeline without actual network calls.
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
vi.mock('@/lib/test-mode-context', () => ({
    TestModeProvider: ({ children }: any) => children,
    useTestMode: () => true,
    TestModeContext: { Provider: ({ children }: any) => children },
}));

import AnalysisPage from '../app/rectify/[id]/page';
import { useStreamStore, createInitialState } from '../lib/store/stream-store';

// ═══════════════════════════════════════════════════════════════════════════
// MOCKS
// ═══════════════════════════════════════════════════════════════════════════

vi.mock('next/navigation', () => ({
    useParams: () => ({ id: 'pipeline-session-001' }),
    useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
}));

vi.mock('@clerk/nextjs', () => ({
    useAuth: () => ({
        getToken: vi.fn().mockResolvedValue('test-token'),
        isLoaded: true,
        isSignedIn: true,
    }),
}));

vi.mock('framer-motion', () => ({
    motion: {
        div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
        button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
    },
    AnimatePresence: ({ children }: any) => <>{children}</>,
}));

vi.mock('../lib/use-stream-progress', () => ({
    useStreamProgress: vi.fn(() => ({
        connectionState: { status: 'streaming', lastError: null },
    })),
}));

vi.mock('next/dynamic', () => ({
    default: () => (props: any) => (
        <div data-testid="dynamic-mock">
            {props.analyzedCount !== undefined && <span data-testid="analyzed-count">{props.analyzedCount}</span>}
            {(props.isComplete || props.isCompleted) && <span>Analysis Complete</span>}
            {props.scores?.map((s: any) => <span key={s.time} data-testid={`score-${s.time}`}>{s.time}: {s.score}</span>)}
            {props.candidateCount !== undefined && <span data-testid="candidate-count">{props.candidateCount} candidates</span>}
        </div>
    )
}));

vi.mock('next/link', () => ({
    default: ({ children, href, ...props }: any) => <a href={href} {...props}>{children}</a>,
}));

vi.mock('../lib/secure-logger', () => ({
    logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

vi.mock('../lib/config', () => ({
    env: { api: { backendUrl: 'http://localhost:3001' } },
}));

vi.mock('../lib/api-client', () => ({
    APIClient: { create: vi.fn() },
}));

vi.mock('./actions', () => ({
    cancelAnalysis: vi.fn(),
    restartAnalysis: vi.fn(),
}));

vi.mock('idb-keyval', () => ({
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
}));

vi.mock('@/components/rectify/AnalysisErrorBoundary', () => ({
    AnalysisErrorBoundary: ({ children }: any) => <>{children}</>,
    SectionErrorBoundary: ({ children }: any) => <>{children}</>,
}));

// ═══════════════════════════════════════════════════════════════════════════
// TESTS
// ═══════════════════════════════════════════════════════════════════════════

describe('Analysis Pipeline: SSE → Store → UI Integration', () => {
    beforeEach(() => {
        act(() => {
            useStreamStore.setState({
                ...createInitialState(),
                sessionId: 'pipeline-session-001',
                totalCandidates: 120,
            });
        });
        // Test mode enabled via mock
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it('simulates a realistic SSE event sequence: metadata → progress → scores → complete', async () => {
        // Phase 1: Metadata arrives
        act(() => {
            useStreamStore.getState().dispatchStreamEvent('metadata', {
                fullName: 'Pipeline Test User',
                dateOfBirth: '1985-03-20',
                tentativeTime: '09:00:00',
                birthPlace: 'Mumbai, India',
                timezone: 'Asia/Kolkata',
                offsetConfig: { preset: '1hour' },
            });
        });

        render(<AnalysisPage />);

        await waitFor(() => {
            expect(screen.getByText('Pipeline Test User')).toBeInTheDocument();
        });

        // Phase 2: Stage 1 progress
        act(() => {
            useStreamStore.getState().dispatchStreamEvent('progress', {
                stepIndex: 1, totalSteps: 7, percentage: 15, message: 'Grid generation...',
            });
        });

        // Phase 3: Stage 2 scores arrive
        act(() => {
            useStreamStore.getState().dispatchStreamEvent('candidate_scores', [
                { time: '08:30', score: 72, stage: 2 },
                { time: '09:00', score: 88, stage: 2 },
                { time: '09:15', score: 65, stage: 2 },
                { time: '09:30', score: 91, stage: 2 },
            ]);
        });

        let state = useStreamStore.getState();
        expect(state.candidateScores).toHaveLength(4);
        expect(state.activeAIStage).toBe(2);

        // Phase 4: Stage 4 starts (fewer candidates, higher precision)
        act(() => {
            useStreamStore.getState().dispatchStreamEvent('progress', {
                stepIndex: 4, totalSteps: 7, percentage: 60, message: 'Deep analysis...',
            });
            useStreamStore.getState().dispatchStreamEvent('candidate_scores', [
                { time: '09:00', score: 92, stage: 4 },
                { time: '09:30', score: 95, stage: 4 },
            ]);
        });

        state = useStreamStore.getState();
        // Should have 6 total scores (4 from S2 + 2 from S4)
        expect(state.candidateScores).toHaveLength(6);
        expect(state.activeAIStage).toBe(4);
        expect(state.analyzedCount).toBe(2); // 2 unique times in S4

        // Phase 5: Completion
        act(() => {
            useStreamStore.getState().dispatchStreamEvent('result', {
                rectifiedTime: '09:30:15',
                accuracy: 96,
                confidence: 'Very High',
            });
        });

        state = useStreamStore.getState();
        expect(state.isComplete).toBe(true);
        expect(state.result?.rectifiedTime).toBe('09:30:15');
    });

    it('verifies candidate_score_v2 event type works identically to candidate_score', () => {
        act(() => {
            useStreamStore.getState().dispatchStreamEvent('candidate_score_v2', {
                time: '10:15', score: 87, stage: 2
            });
        });

        const state = useStreamStore.getState();
        expect(state.candidateScores).toHaveLength(1);
        expect(state.candidateScores[0].score).toBe(87);
    });

    it('verifies "complete" event type works identically to "result"', () => {
        act(() => {
            useStreamStore.getState().dispatchStreamEvent('complete', {
                rectifiedTime: '11:45:00',
                accuracy: 93,
                confidence: 'High',
            });
        });

        const state = useStreamStore.getState();
        expect(state.isComplete).toBe(true);
        expect(state.result?.rectifiedTime).toBe('11:45:00');
    });

    it('verifies store handles rapid-fire events without data loss', () => {
        const store = useStreamStore.getState();

        // Simulate rapid-fire: 50 candidates scored in quick succession
        act(() => {
            for (let i = 0; i < 50; i++) {
                store.dispatchStreamEvent('candidate_score', {
                    time: `10:${String(i).padStart(2, '0')}`,
                    score: 50 + i,
                    stage: 2,
                });
            }
        });

        const state = useStreamStore.getState();
        expect(state.candidateScores).toHaveLength(50);

        // Also verify analyzedCount matches unique count in latest stage
        expect(state.analyzedCount).toBe(50);
    });

    it('preserves result data even when error happens after completion', () => {
        act(() => {
            useStreamStore.getState().dispatchStreamEvent('result', {
                rectifiedTime: '14:24:30',
                accuracy: 97,
                confidence: 'Very High',
            });
        });

        // Simulate a late error (e.g., cleanup failure)
        act(() => {
            useStreamStore.getState().dispatchStreamEvent('error', {
                message: 'Late cleanup error after completion'
            });
        });

        const state = useStreamStore.getState();
        // Result should still be preserved
        expect(state.result?.rectifiedTime).toBe('14:24:30');
        // But error flag should be set and isComplete reset to false
        expect(state.error).toBe('Late cleanup error after completion');
        expect(state.isComplete).toBe(false);
    });
});
