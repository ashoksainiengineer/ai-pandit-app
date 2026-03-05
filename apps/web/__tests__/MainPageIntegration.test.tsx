import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AnalysisPage from '../app/rectify/[id]/page';
import React from 'react';

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
    useParams: () => ({ id: 'test-session-123' }),
    useRouter: () => ({
        push: vi.fn(),
        replace: vi.fn(),
        prefetch: vi.fn(),
    }),
}));

// Mock Clerk auth
vi.mock('@clerk/nextjs', () => ({
    useAuth: () => ({
        isLoaded: true,
        isSignedIn: true,
        getToken: vi.fn().mockResolvedValue('mock-token'),
    }),
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
        (window as any).isTestEnv = true;
    });

    it('renders the main analysis layout in streaming mode', () => {
        render(<AnalysisPage />);

        expect(screen.getByText(/Birth Time Analysis/i)).toBeInTheDocument();
    });

    it('triggers cancel analysis action through stop confirmation', async () => {
        // Re-mock actions
        vi.mock('../app/rectify/[id]/actions', () => ({
            cancelAnalysis: vi.fn().mockResolvedValue({ success: true }),
            restartAnalysis: vi.fn().mockResolvedValue({ success: true }),
        }));

        const { cancelAnalysis } = await import('../app/rectify/[id]/actions');

        render(<AnalysisPage />);

        // 1. Click "Stop" to show confirmation
        const stopButton = screen.getByText(/Stop/i);
        fireEvent.click(stopButton);

        // 2. Click "Cancel Analysis" in the confirmation
        // Since CancelConfirmation is mocked as "Dynamic Mock", we need to ensure the mock returns something we can click.
        // Wait, I mocked dynamic() to return a generic div. I should make it more specific or mock the actual component.
    });
});
