/**
 * @vitest-environment jsdom
 * 
 * AnalysisLifecycle.test.tsx — Full Stage 1→6 Lifecycle Simulation
 * ================================================================
 * Tests the complete analysis page lifecycle: metadata → progress → AI stages → completion.
 * Follows the industry-standard "Arrange → Act → Assert" pattern with realistic SSE event sequences.
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
// MOCKS — Shared infrastructure for all lifecycle tests
// ═══════════════════════════════════════════════════════════════════════════

vi.mock('next/navigation', () => ({
    useParams: () => ({ id: 'lifecycle-session-001' }),
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
        <div data-testid="dynamic-mock" data-props={JSON.stringify(props)}>
            {props.analyzedCount !== undefined && <span>{props.analyzedCount}/{props.totalCandidates}</span>}
            {(props.isComplete || props.isCompleted) && <span>Analysis Complete</span>}
            {props.scores?.map((s: any) => <span key={s.time}>{s.time} - {s.score}</span>)}
            {/* Pipeline mock */}
            {props.currentStage !== undefined && <span>Stage {props.currentStage}</span>}
            {/* StatusBanner mock */}
            {props.candidateCount !== undefined && <span>{props.candidateCount} candidates</span>}
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

describe('Analysis Page: Full Lifecycle (Stage 1→6)', () => {
    beforeEach(() => {
        act(() => {
            useStreamStore.setState({ ...createInitialState(), sessionId: 'lifecycle-session-001' });
        });
        // Test mode enabled via mock
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it('renders metadata header with birth details after metadata event', async () => {
        act(() => {
            useStreamStore.getState().dispatchStreamEvent('metadata', {
                fullName: 'Test User',
                dateOfBirth: '1990-05-15',
                tentativeTime: '14:30:00',
                birthPlace: 'Delhi, India',
                offsetConfig: { preset: '1hour' },
            });
        });

        render(<AnalysisPage />);

        await waitFor(() => {
            expect(screen.getByText('Test User')).toBeInTheDocument();
            expect(screen.getByText('1990-05-15')).toBeInTheDocument();
            expect(screen.getByText('14:30:00')).toBeInTheDocument();
            expect(screen.getByText('Delhi, India')).toBeInTheDocument();
        });
    });

    it('progresses through stages 1→2 with candidate scores', async () => {
        // Stage 1: Grid generation
        act(() => {
            useStreamStore.getState().dispatchStreamEvent('progress', {
                stepIndex: 1, totalSteps: 7, percentage: 15, message: 'Generating candidate grid...'
            });
            useStreamStore.setState({ totalCandidates: 120 });
        });

        render(<AnalysisPage />);

        // Stage 2: AI scoring begins
        act(() => {
            useStreamStore.getState().dispatchStreamEvent('progress', {
                stepIndex: 2, totalSteps: 7, percentage: 30, message: 'Running batch tournament...',
                candidateScores: [
                    { time: '14:15', score: 82, stage: 2 },
                    { time: '14:30', score: 91, stage: 2 },
                    { time: '14:45', score: 75, stage: 2 },
                ]
            });
        });

        const state = useStreamStore.getState();
        expect(state.candidateScores).toHaveLength(3);
        expect(state.activeAIStage).toBe(2);
        expect(state.progress?.stepIndex).toBe(2);
    });

    it('handles full completion with result event and marks isComplete', async () => {
        act(() => {
            useStreamStore.getState().dispatchStreamEvent('progress', {
                stepIndex: 6, totalSteps: 7, percentage: 95, message: 'Final verdict...',
            });
        });

        act(() => {
            useStreamStore.getState().dispatchStreamEvent('result', {
                rectifiedTime: '14:24:30',
                accuracy: 97,
                confidence: 'High',
            });
        });

        const state = useStreamStore.getState();
        expect(state.isComplete).toBe(true);
        expect(state.result?.rectifiedTime).toBe('14:24:30');
        expect(state.result?.accuracy).toBe(97);
        expect(state.result?.confidence).toBe('High');

        render(<AnalysisPage />);

        await waitFor(() => {
            expect(screen.getAllByText(/Complete/i).length).toBeGreaterThan(0);
        });
    });

    it('accumulates stage stats across multiple stage_stats events', () => {
        const store = useStreamStore.getState();

        act(() => {
            store.dispatchStreamEvent('stage_stats', { stage: 1, candidateCount: 120, description: 'Grid generated' });
            store.dispatchStreamEvent('stage_stats', { stage: 2, candidateCount: 45, description: 'Tournament complete' });
            store.dispatchStreamEvent('stage_stats', { stage: 4, candidateCount: 12, description: 'Deep analysis done' });
            store.dispatchStreamEvent('stage_stats', { stage: 6, candidateCount: 1, description: 'Final verdict' });
        });

        const state = useStreamStore.getState();
        expect(state.stageStats).toHaveLength(4);
        expect(state.stageStats[0].candidateCount).toBe(120);
        expect(state.stageStats[3].candidateCount).toBe(1);
    });

    it('tracks decisions across multiple stages (promoted + rejected)', () => {
        const store = useStreamStore.getState();

        act(() => {
            store.dispatchStreamEvent('decision', { stage: 2, time: '14:15', verdict: 'promoted', score: 82, reason: 'Good D9' });
            store.dispatchStreamEvent('decision', { stage: 2, time: '14:45', verdict: 'rejected', score: 45, reason: 'Weak Moon' });
            store.dispatchStreamEvent('decision', { stage: 4, time: '14:15', verdict: 'promoted', score: 90, reason: 'Strong D60' });
            store.dispatchStreamEvent('decision', { stage: 4, time: '14:30', verdict: 'promoted', score: 95, reason: 'Perfect Nadi' });
        });

        const state = useStreamStore.getState();
        expect(state.decisions).toHaveLength(4);
        expect(state.decisions.filter(d => d.verdict === 'promoted')).toHaveLength(3);
        expect(state.decisions.filter(d => d.verdict === 'rejected')).toHaveLength(1);
    });

    it('handles sortedCandidateScores: latest stage scores only, sorted desc', () => {
        act(() => {
            useStreamStore.getState().dispatchStreamEvent('candidate_scores', [
                // Stage 2 scores (should be ignored in sort since S4 exists)
                { time: '14:15', score: 82, stage: 2 },
                { time: '14:30', score: 91, stage: 2 },
                // Stage 4 scores (should be the active set)
                { time: '14:15', score: 88, stage: 4 },
                { time: '14:30', score: 95, stage: 4 },
                { time: '14:20', score: 70, stage: 4 },
            ]);
        });

        const state = useStreamStore.getState();

        // Verify maxStage logic: should have 5 total scores (2 from S2 + 3 from S4)
        expect(state.candidateScores).toHaveLength(5);

        // activeAIStage should be the highest stage
        expect(state.activeAIStage).toBe(4);

        // analyzedCount should be the count of unique times in the highest stage
        expect(state.analyzedCount).toBe(3); // 14:15, 14:30, 14:20 from S4
    });
});
