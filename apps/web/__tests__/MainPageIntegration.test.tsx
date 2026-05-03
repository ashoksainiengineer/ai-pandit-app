import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AnalysisPage from '../app/rectify/[id]/page';
import React from 'react';

// ── Hoisted mocks for server actions ──────────────────────
const { mockCancelAnalysis, mockRestartAnalysis } = vi.hoisted(() => ({
    mockCancelAnalysis: vi.fn().mockResolvedValue({ success: true }),
    mockRestartAnalysis: vi.fn().mockResolvedValue({ success: true }),
}));

vi.mock('@/lib/test-mode-context', () => ({
    TestModeProvider: ({ children }: any) => children,
    useTestMode: () => true,
    TestModeContext: { Provider: ({ children }: any) => children },
}));

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
    useParams: () => ({ id: 'test-session-123' }),
    useRouter: () => ({
        push: vi.fn(),
        replace: vi.fn(),
        prefetch: vi.fn(),
    }),
}));

// Mock Next.js Link
vi.mock('next/link', () => ({
    default: ({ children, href, className, ...props }: any) => (
        <a href={href} className={className} {...props}>{children}</a>
    ),
}));

// Mock Clerk auth
vi.mock('@clerk/nextjs', () => ({
    useAuth: () => ({
        isLoaded: true,
        isSignedIn: true,
        getToken: vi.fn().mockResolvedValue('mock-token'),
    }),
}));

// Mock server actions for cancel/restart analysis
vi.mock('../app/rectify/[id]/actions', () => ({
    cancelAnalysis: mockCancelAnalysis,
    restartAnalysis: mockRestartAnalysis,
}));

// Mock secure-logger
vi.mock('@/lib/secure-logger', () => ({
    logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

// Mock useStreamProgress hook
vi.mock('@/lib/use-stream-progress', () => ({
    useStreamProgress: vi.fn(() => ({
        connectionState: { status: 'streaming', url: 'mock-url', lastError: null },
    })),
}));

// Mock useStreamStore
const mockClearStore = vi.fn();
const mockDispatchStreamEvent = vi.fn();
vi.mock('@/lib/store/stream-store', () => ({
    useStreamStore: vi.fn((selector) => {
        const state = {
            sessionId: 'test-session-123',
            isComplete: false,
            error: null,
            currentStage: 1,
            totalCandidates: 100,
            analyzedCount: 0,
            elapsedSeconds: 0,
            allCandidates: {},
            candidateScores: [],
            candidatesByStage: {},
            progress: null,
            result: null,
            dispatchStreamEvent: mockDispatchStreamEvent,
            setSessionId: vi.fn(),
            clearStore: mockClearStore,
            stageHistory: {},
            thinking: null,
            isConnected: true,
        };
        return selector ? selector(state) : state;
    }),
}));

// Mock dynamic components correctly for Vitest
vi.mock('next/dynamic', () => ({
    __esModule: true,
    default: () => {
        const MockedComp = (props: any) => (
            <div data-testid="dynamic-mock">
                {props.title || props.name || 'Dynamic Mock'}
            </div>
        );
        MockedComp.displayName = 'DynamicMock';
        return MockedComp;
    },
}));

// Mock framer-motion
vi.mock('framer-motion', () => ({
    motion: {
        div: ({ children, className, ...props }: any) => <div className={className} {...props}>{children}</div>,
        h1: ({ children, ...props }: any) => <h1 {...props}>{children}</h1>,
        span: ({ children, ...props }: any) => <span {...props}>{children}</span>,
        button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
    },
    AnimatePresence: ({ children }: any) => <>{children}</>,
}));

describe('MainPageIntegration (Full Lifecycle)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders the main analysis layout in streaming mode', () => {
        render(<AnalysisPage />);

        expect(screen.getByText(/Birth Time Analysis/i)).toBeInTheDocument();
    });

    it('triggers cancel analysis action through stop confirmation', async () => {
        render(<AnalysisPage />);

        // 1. Verify "Stop" button exists (analysis is running)
        const stopButton = screen.getByText(/Stop/i);
        expect(stopButton).toBeInTheDocument();

        // 2. Click "Stop" to show confirmation dialog
        fireEvent.click(stopButton);

        // 3. Verify confirmation UI appears
        await waitFor(() => {
            expect(screen.getByText('Confirm')).toBeInTheDocument();
            expect(screen.getByText('Keep Running')).toBeInTheDocument();
        });

        // 4. Click "Confirm" to trigger cancel
        const confirmButton = screen.getByText('Confirm');
        fireEvent.click(confirmButton);

        // 5. Verify cancelAnalysis was called with the correct session ID
        await waitFor(() => {
            expect(mockCancelAnalysis).toHaveBeenCalledWith('test-session-123');
        });

        // 6. After successful cancel, the Stop button should no longer be visible
        await waitFor(() => {
            expect(screen.queryByRole('button', { name: 'Stop' })).not.toBeInTheDocument();
        });
    });
});
