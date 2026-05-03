/**
 * @vitest-environment jsdom
 * 
 * AnalysisContainers.test.tsx — Per-Container Unit Tests
 * ======================================================
 * Tests individual containers: metadata header, cancel/confirm flow,
 * completion result display, and error states.
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
vi.mock('@/lib/test-mode-context', () => ({
    TestModeProvider: ({ children }: any) => children,
    useTestMode: () => true,
    TestModeContext: { Provider: ({ children }: any) => children },
}));

import AnalysisPage from '../app/rectify/[id]/page';
import { useStreamStore, createInitialState } from '../lib/store/stream-store';
import { useStreamProgress } from '../lib/use-stream-progress';

// ═══════════════════════════════════════════════════════════════════════════
// MOCKS
// ═══════════════════════════════════════════════════════════════════════════

vi.mock('next/navigation', () => ({
    useParams: () => ({ id: 'container-test-session' }),
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
        <div data-testid="dynamic-mock" data-component-type={props.title || props.currentStage || 'generic'}>
            {props.isComplete && <span>Analysis Complete</span>}
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

const mockCancelAnalysis = vi.fn().mockResolvedValue({ success: true });
const mockRestartAnalysis = vi.fn().mockResolvedValue({ success: true });

vi.mock('./actions', () => ({
    cancelAnalysis: (...args: any[]) => mockCancelAnalysis(...args),
    restartAnalysis: (...args: any[]) => mockRestartAnalysis(...args),
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

describe('Analysis Page: Container Unit Tests', () => {
    beforeEach(() => {
        // Reset mock to default streaming state before each test
        (useStreamProgress as any).mockReturnValue({
            connectionState: { status: 'streaming', lastError: null },
        });
        act(() => {
            useStreamStore.setState({
                ...createInitialState(),
                sessionId: 'container-test-session',
                totalCandidates: 100,
            });
        });
        vi.clearAllMocks();
    });


    // ═════ Metadata Header Container ═════

    describe('Metadata Header Container', () => {
        it('renders fullName as the page title', async () => {
            act(() => {
                useStreamStore.getState().dispatchStreamEvent('metadata', {
                    fullName: 'Narendra Modi',
                    dateOfBirth: '1950-09-17',
                });
            });

            render(<AnalysisPage />);

            await waitFor(() => {
                expect(screen.getByText('Narendra Modi')).toBeInTheDocument();
            });
        });

        it('renders "Birth Time Analysis" as fallback when no fullName', async () => {
            render(<AnalysisPage />);

            await waitFor(() => {
                expect(screen.getByText('Birth Time Analysis')).toBeInTheDocument();
            });
        });

        it('renders offset config with ±minutes notation', async () => {
            act(() => {
                useStreamStore.getState().dispatchStreamEvent('metadata', {
                    fullName: 'Test',
                    tentativeTime: '11:00:00',
                    offsetConfig: { preset: '30min', minutes: 30 },
                });
            });

            render(<AnalysisPage />);

            await waitFor(() => {
                expect(screen.getByText('11:00:00')).toBeInTheDocument();
                expect(screen.getByText('±30min')).toBeInTheDocument();
            });
        });
    });

    // ═════ Cancel/Confirm Flow ═════

    describe('Cancel/Confirm Flow', () => {
        it('shows Stop button during active analysis', async () => {
            act(() => {
                useStreamStore.setState({
                    ...useStreamStore.getState(),
                    progress: { step: 'grid', stepIndex: 1, totalSteps: 7, percentage: 10, message: 'Working...' },
                });
            });

            render(<AnalysisPage />);

            await waitFor(() => {
                expect(screen.getByText('Stop')).toBeInTheDocument();
            });
        });

        it('shows Confirm/Keep Running after clicking Stop', async () => {
            act(() => {
                useStreamStore.setState({
                    ...useStreamStore.getState(),
                    progress: { step: 'grid', stepIndex: 1, totalSteps: 7, percentage: 10, message: 'Working...' },
                });
            });

            render(<AnalysisPage />);
            const stopBtn = screen.getByText('Stop');
            fireEvent.click(stopBtn);

            await waitFor(() => {
                expect(screen.getByText('Confirm')).toBeInTheDocument();
                expect(screen.getByText('Keep Running')).toBeInTheDocument();
            });
        });

        it('does NOT show Stop button when analysis isComplete', async () => {
            act(() => {
                useStreamStore.setState({
                    ...useStreamStore.getState(),
                    isComplete: true,
                    result: { rectifiedTime: '14:24', accuracy: 95, confidence: 'High' },
                });
            });

            render(<AnalysisPage />);

            await waitFor(() => {
                expect(screen.queryByText('Stop')).not.toBeInTheDocument();
            });
        });
    });

    // ═════ Error Display States ═════

    describe('Error Display States', () => {
        it('shows error display when stream has error and no result', async () => {
            (useStreamProgress as any).mockReturnValue({
                connectionState: { status: 'error', lastError: 'Backend Timeout (504)' },
            });

            act(() => {
                useStreamStore.setState({
                    ...useStreamStore.getState(),
                    error: 'Backend Timeout (504)',
                });
            });

            render(<AnalysisPage />);

            await waitFor(() => {
                expect(screen.getByText('Connection Error')).toBeInTheDocument();
                expect(screen.getByText('Backend Timeout (504)')).toBeInTheDocument();
            });
        });

        it('shows Retry button on error page', async () => {
            (useStreamProgress as any).mockReturnValue({
                connectionState: { status: 'error', lastError: 'Network failure' },
            });

            act(() => {
                useStreamStore.setState({
                    ...useStreamStore.getState(),
                    error: 'Network failure',
                });
            });

            render(<AnalysisPage />);

            await waitFor(() => {
                const retryBtn = screen.getByRole('button', { name: /retry/i });
                expect(retryBtn).toBeInTheDocument();
            });
        });
    });

    // ═════ Session ID Rendering ═════

    describe('Session ID Display', () => {
        it('shows truncated sessionId in the header', async () => {
            // Ensure no error state and a valid streaming connection
            (useStreamProgress as any).mockReturnValue({
                connectionState: { status: 'streaming', lastError: null },
            });

            act(() => {
                useStreamStore.setState({
                    ...useStreamStore.getState(),
                    error: null,
                    progress: { step: 'grid', stepIndex: 1, totalSteps: 7, percentage: 10, message: 'Working...' },
                });
            });

            render(<AnalysisPage />);

            await waitFor(() => {
                // sessionId is 'container-test-session', truncated to first 8 chars
                expect(screen.getByText('containe')).toBeInTheDocument();
            });
        });
    });

    // ═════ Cancelled/Failed States ═════

    describe('Cancelled/Failed States', () => {
        it('shows "Analysis Stopped" banner when metadata status is cancelled', async () => {
            // Set metadata with cancelled status via setState (dispatchStreamEvent resets on pending/queued)
            act(() => {
                useStreamStore.setState({
                    ...useStreamStore.getState(),
                    metadata: { fullName: 'Cancelled User', status: 'cancelled' },
                    // Also need some data so the page doesn't show loading
                    progress: { step: 'grid', stepIndex: 1, totalSteps: 7, percentage: 10, message: 'Stopped' },
                });
            });

            render(<AnalysisPage />);

            await waitFor(() => {
                expect(screen.getByText('Analysis Stopped')).toBeInTheDocument();
            });
        });

        it('shows "Analysis Failed" banner when metadata status is failed', async () => {
            act(() => {
                useStreamStore.setState({
                    ...useStreamStore.getState(),
                    metadata: { fullName: 'Failed User', status: 'failed' },
                    progress: { step: 'grid', stepIndex: 1, totalSteps: 7, percentage: 10, message: 'Failed' },
                });
            });

            render(<AnalysisPage />);

            await waitFor(() => {
                expect(screen.getByText('Analysis Failed')).toBeInTheDocument();
            });
        });
    });
});
