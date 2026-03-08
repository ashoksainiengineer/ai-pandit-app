/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import AnalysisPage from '../app/rectify/[id]/page';
import { useStreamStore } from '../lib/store/stream-store';
import { useStreamProgress } from '../lib/use-stream-progress';

// Mock Next.js hooks
vi.mock('next/navigation', () => ({
    useParams: () => ({ id: 'test-session-123' }),
    useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
}));

// Mock Clerk
vi.mock('@clerk/nextjs', () => ({
    useAuth: () => ({
        getToken: vi.fn().mockResolvedValue('test-token'),
        isLoaded: true,
        isSignedIn: true,
    }),
}));

// Mock Framer Motion
vi.mock('framer-motion', () => ({
    motion: {
        div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    },
    AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock useStreamProgress
vi.mock('../lib/use-stream-progress', () => ({
    useStreamProgress: vi.fn(() => ({
        connectionState: { status: 'streaming', lastError: null },
    })),
}));

// Robust mock for dynamic components
vi.mock('next/dynamic', () => ({
    default: () => (props: any) => (
        <div
            data-testid="dynamic-mock"
            data-props={JSON.stringify(props)}
        >
            {props.analyzedCount !== undefined && <span>{props.analyzedCount}/{props.totalCandidates}</span>}
            {(props.isComplete || props.isCompleted) && <span>Analysis Complete</span>}
            {props.scores?.map((s: any) => <span key={s.time}>{s.time} - {s.score}</span>)}
        </div>
    )
}));

describe('Analysis Page: Heavy Streaming & Fault Injection', () => {
    beforeEach(() => {
        act(() => {
            useStreamStore.getState().clearStore();
            useStreamStore.getState().setSessionId('test-session-123');
            useStreamStore.setState({ totalCandidates: 100 });
        });
        // NOT using fake timers for the simple version to avoid any clash with waitFor
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it('handles progress updates and reflects final state', async () => {
        render(<AnalysisPage />);

        act(() => {
            useStreamStore.getState().dispatchStreamEvent('progress', {
                percentage: 50,
                stepIndex: 3,
                message: 'Processing intermediate results...',
                candidateScores: [{ time: '12:00:00', score: 80, stage: 3 }]
            });
        });

        act(() => {
            useStreamStore.setState({ analyzedCount: 100, isComplete: true, activeAIStage: 6 });
        });

        await waitFor(() => {
            expect(screen.getAllByText(/Complete/i).length).toBeGreaterThan(0);
        });
    });

    it('handles recovery from catastrophic stream disconnection', async () => {
        const { rerender } = render(<AnalysisPage />);

        act(() => {
            useStreamStore.setState({ analyzedCount: 45, totalCandidates: 100 });
        });

        (useStreamProgress as any).mockReturnValue({
            connectionState: { status: 'error', lastError: 'SSE Connection Lost' },
        });

        rerender(<AnalysisPage />);

        expect(screen.getByText(/Connection Error/i)).toBeInTheDocument();

        // Simulate recovery in the hook source
        (useStreamProgress as any).mockReturnValue({
            connectionState: { status: 'streaming', lastError: null },
        });

        const retryBtn = screen.getByRole('button', { name: /retry/i });
        fireEvent.click(retryBtn);

        // Rerender to pick up the new hook value
        rerender(<AnalysisPage />);

        await waitFor(() => {
            expect(screen.queryByText(/Connection Error/i)).not.toBeInTheDocument();
        });
    });

    it('gracefully handles malformed stream packets', async () => {
        render(<AnalysisPage />);

        act(() => {
            useStreamStore.setState({ analyzedCount: 10, totalCandidates: 100 });
        });

        act(() => {
            useStreamStore.getState().dispatchStreamEvent('progress', {} as any);
        });

        expect(useStreamStore.getState().analyzedCount).toBeGreaterThanOrEqual(10);
    });

    it('updates refined results in real-time', async () => {
        render(<AnalysisPage />);

        act(() => {
            useStreamStore.getState().dispatchStreamEvent('candidate_scores', [
                { time: '12:05:00', score: 92, stage: 2 }
            ]);
        });

        expect(screen.getByText(/12:05:00/)).toBeInTheDocument();
    });
});
