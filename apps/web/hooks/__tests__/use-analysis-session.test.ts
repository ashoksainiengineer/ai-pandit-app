import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useAnalysisSession } from '../use-analysis-session';

// Mutable mock state so tests can change values
const mockConnectionState = { status: 'idle' as const, url: '', lastError: null };
const mockStreamStoreState = {
    isComplete: false,
    error: null,
    progress: null,
    candidateScores: [],
    advancedSignals: null,
    result: null,
    startedAt: null,
    allSteps: [],
    metadata: null,
    activeAIStage: null,
    analyzedCount: 0,
    totalCandidates: 0,
    candidatesByStage: {},
    stageHistory: [],
    stageStats: [],
};
let mockTestMode = false;

// Mock dependencies
vi.mock('@/lib/use-stream-progress', () => ({
    useStreamProgress: vi.fn(() => ({
        connectionState: mockConnectionState,
    })),
}));

vi.mock('@/lib/store/stream-store', () => ({
    useStreamStore: vi.fn((selector: any) => {
        return selector ? selector(mockStreamStoreState) : mockStreamStoreState;
    }),
}));

vi.mock('zustand/react/shallow', () => ({
    useShallow: (fn: any) => fn,
}));

vi.mock('@/lib/test-mode-context', () => ({
    useTestMode: () => mockTestMode,
}));

describe('useAnalysisSession', () => {
    const mockGetToken = vi.fn().mockResolvedValue('mock-token');

    beforeEach(() => {
        vi.clearAllMocks();
        mockConnectionState.status = 'idle';
        mockConnectionState.lastError = null;
        mockTestMode = false;
        Object.assign(mockStreamStoreState, {
            isComplete: false,
            error: null,
            progress: null,
            candidateScores: [],
            result: null,
            startedAt: null,
            allSteps: [],
            metadata: null,
            activeAIStage: null,
            candidatesByStage: {},
            stageHistory: {},
        });
    });

    it('should be importable and return expected shape', () => {
        mockConnectionState.status = 'streaming';
        const { result } = renderHook(() =>
            useAnalysisSession('session-123', true, true, mockGetToken)
        );

        expect(result.current).toBeDefined();
        expect(result.current.connectionState).toBeDefined();
        expect(result.current.isConnected).toBe(true);
        expect(result.current.isComplete).toBe(false);
        expect(result.current.streamError).toBeNull();
        expect(result.current.progress).toBeNull();
        expect(result.current.candidateScores).toEqual([]);
        expect(result.current.result).toBeNull();
        expect(result.current.startedAt).toBeNull();
        expect(result.current.allSteps).toEqual([]);
        expect(result.current.metadata).toBeNull();
        expect(result.current.activeAIStage).toBeNull();
        expect(result.current.candidatesByStage).toEqual({});
        expect(result.current.stageHistory).toEqual({});
        expect(result.current.elapsedSeconds).toBe(0);
        expect(result.current.hasError).toBe(false);
        expect(result.current.errorMessage).toBe('Unknown error');
        expect(result.current.hasData).toBe(false);
    });

    it('should not connect when not loaded or signed in and not in test mode', () => {
        mockConnectionState.status = 'idle';
        const { result } = renderHook(() =>
            useAnalysisSession('session-123', false, false, mockGetToken)
        );

        expect(result.current.isConnected).toBe(false);
    });

    it('should connect in test mode even when not signed in', () => {
        mockTestMode = true;
        mockConnectionState.status = 'streaming';
        const { result } = renderHook(() =>
            useAnalysisSession('session-123', false, false, mockGetToken)
        );

        expect(result.current.isConnected).toBe(true);
    });
});
