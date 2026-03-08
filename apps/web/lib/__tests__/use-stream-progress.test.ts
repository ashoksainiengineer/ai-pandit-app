import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import useStreamProgress from '../use-stream-progress';
import { useStreamStore } from '../store/stream-store';

// ═══════════════════════════════════════════════════════════════════════════
// MOCKS
// ═══════════════════════════════════════════════════════════════════════════

const mockDispatchStreamEvent = vi.fn();
const mockSetSessionId = vi.fn();
const mockForceError = vi.fn();
const mockMarkComplete = vi.fn();
const mockSetLastEventId = vi.fn((seq: number) => {
    mockState.lastEventId = seq;
});

const mockState = {
    dispatchStreamEvent: mockDispatchStreamEvent,
    setSessionId: mockSetSessionId,
    setLastEventId: mockSetLastEventId,
    forceError: mockForceError,
    markComplete: mockMarkComplete,
    lastEventId: 0,
};

vi.mock('../store/stream-store', () => ({
    useStreamStore: Object.assign(
        (selector: any) => selector(mockState),
        {
            getState: () => mockState,
            subscribe: vi.fn(),
        }
    ),
}));

vi.mock('../auth-utils', () => ({
    getTokenWithRetry: vi.fn().mockResolvedValue('mock-token'),
}));

vi.mock('../secure-logger', () => ({
    logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

vi.mock('../config', () => ({
    env: { api: { backendUrl: 'http://localhost:3001' } },
}));

class MockEventSource {
    url: string;
    onopen: (() => void) | null = null;
    onmessage: ((event: any) => void) | null = null;
    onerror: ((err: any) => void) | null = null;
    readyState: number = 0;

    constructor(url: string) {
        this.url = url;
        (global as any).EventSource.instances.push(this);
    }

    close = vi.fn();

    triggerOpen() {
        this.readyState = 1;
        if (this.onopen) this.onopen();
    }

    triggerMessage(data: any, lastEventId?: string) {
        if (this.onmessage) {
            this.onmessage({
                data: JSON.stringify(data),
                lastEventId: lastEventId || null
            } as any);
        }
    }

    triggerError(err: any = new Error('Network Error')) {
        this.readyState = 2;
        if (this.onerror) this.onerror(err);
    }

    static OPEN = 1;
    static CLOSED = 2;
    static CONNECTING = 0;
    static instances: MockEventSource[] = [];
}

// @ts-ignore
global.EventSource = MockEventSource;
(global as any).EventSource.instances = [];

global.fetch = vi.fn();

// ═══════════════════════════════════════════════════════════════════════════
// TESTS
// ═══════════════════════════════════════════════════════════════════════════

describe('useStreamProgress Hook', () => {

    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers();
        (global as any).EventSource.instances = [];
        mockState.lastEventId = 0;
    });

    afterEach(() => {
        vi.clearAllTimers();
        vi.useRealTimers();
    });

    it('should initialize with idle state when no sessionId is provided', () => {
        const { result } = renderHook(() => useStreamProgress(null));
        expect(result.current.connectionState.status).toBe('idle');
        expect(mockSetSessionId).not.toHaveBeenCalled();
    });

    it('should attempt SSE connection when sessionId is provided', async () => {
        const { result } = renderHook(() => useStreamProgress('session-123', 'http://localhost:3001', async () => 'mock-token'));
        expect(result.current.connectionState.status).toBe('connecting');

        await act(async () => {
            vi.advanceTimersByTime(100);
        });

        const mockES = (global as any).EventSource.instances[0];
        expect(mockES).toBeTruthy();

        act(() => mockES.triggerOpen());
        expect(result.current.connectionState.status).toBe('streaming');

        act(() => mockES.triggerMessage({ type: 'progress', stepIndex: 1 }));
        expect(mockDispatchStreamEvent).toHaveBeenCalled();
    });

    it('should fallback to polling on SSE timeout', async () => {
        renderHook(() => useStreamProgress('session-poll-123', 'http://localhost:3001'));
        await act(async () => {
            vi.advanceTimersByTime(10500);
        });
        expect(global.fetch).toHaveBeenCalled();
    });

    it('should retry auth once before falling back to polling on SSE auth error', async () => {
        const { result } = renderHook(() => useStreamProgress('session-auth-retry', 'http://localhost:3001'));

        await act(async () => {
            vi.advanceTimersByTime(100);
        });

        const mockES = (global as any).EventSource.instances[0];
        expect(mockES).toBeTruthy();

        act(() => {
            mockES.triggerMessage({ type: 'error', code: 'UNAUTHORIZED', error: 'Invalid token' });
        });

        expect(result.current.connectionState.status).toBe('connecting');

        await act(async () => {
            vi.advanceTimersByTime(1000);
        });

        expect((global as any).EventSource.instances.length).toBe(2);
        const secondES = (global as any).EventSource.instances[1];
        expect(secondES).not.toBe(mockES);
    });

    it('should implement exponential backoff on polling failures', async () => {
        (global.fetch as any).mockRejectedValue(new Error('Network Error'));
        const { result } = renderHook(() => useStreamProgress('session-backoff', 'http://localhost:3001'));

        await act(async () => {
            vi.advanceTimersByTime(10500);
        });

        expect(result.current.connectionState.status).toBe('polling');

        await act(async () => {
            vi.advanceTimersByTime(100);
        });

        const fetchCallsBefore = (global.fetch as any).mock.calls.length;

        await act(async () => {
            vi.advanceTimersByTime(5000);
        });
        expect((global.fetch as any).mock.calls.length).toBe(fetchCallsBefore);

        await act(async () => {
            vi.advanceTimersByTime(3000);
        });
        expect((global.fetch as any).mock.calls.length).toBeGreaterThan(fetchCallsBefore);
    });

    it('should handle 429 rate limiting by waiting longer', async () => {
        (global.fetch as any).mockResolvedValueOnce({ status: 429, ok: false });
        const { result } = renderHook(() => useStreamProgress('session-429', 'http://localhost:3001'));

        await act(async () => {
            vi.advanceTimersByTime(10500);
        });

        await act(async () => {
            vi.advanceTimersByTime(100);
        });

        expect(result.current.connectionState.status).toBe('rate_limited');

        const fetchCallsBefore = (global.fetch as any).mock.calls.length;

        await act(async () => {
            vi.advanceTimersByTime(15000);
        });
        expect((global.fetch as any).mock.calls.length).toBe(fetchCallsBefore);

        await act(async () => {
            vi.advanceTimersByTime(16000);
        });
        expect((global.fetch as any).mock.calls.length).toBeGreaterThan(fetchCallsBefore);
    });

    it('should ignore and log malformed JSON chunks from SSE without crashing', async () => {
        const { result } = renderHook(() => useStreamProgress('session-fuzz', 'http://localhost:3001'));

        await act(async () => {
            vi.advanceTimersByTime(100);
        });

        const mockES = (global as any).EventSource.instances[0];
        act(() => mockES.triggerOpen());

        const initialStatus = result.current.connectionState.status;

        // Simulate malformed JSON
        act(() => {
            if (mockES.onmessage) {
                mockES.onmessage({ data: '{{{ invalid json' } as any);
            }
        });

        // Hook should NOT crash and should stay in streaming state
        expect(result.current.connectionState.status).toBe(initialStatus);

        const { logger } = await import('../secure-logger');
        expect(logger.warn).toHaveBeenCalledWith('Failed to parse SSE message');
    });

    it('should handle partial or empty data structures gracefully', async () => {
        const { result } = renderHook(() => useStreamProgress('session-partial', 'http://localhost:3001'));

        await act(async () => {
            vi.advanceTimersByTime(100);
        });

        const mockES = (global as any).EventSource.instances[0];
        act(() => mockES.triggerOpen());

        // Send unexpected data shape
        act(() => {
            mockES.triggerMessage({ unexpected_field: 'garbage' });
        });

        expect(result.current.connectionState.status).toBe('streaming');
        expect(mockDispatchStreamEvent).toHaveBeenCalled();
    });

    it('should close EventSource and clear timers on unmount to prevent leaks', async () => {
        const { unmount } = renderHook(() => useStreamProgress('session-leak', 'http://localhost:3001'));

        await act(async () => {
            vi.advanceTimersByTime(100);
        });

        const mockES = (global as any).EventSource.instances[0];
        expect(mockES).toBeTruthy();

        unmount();

        expect(mockES.close).toHaveBeenCalled();
    });

    it('should cleanup previous connection when sessionId changes', async () => {
        const { rerender } = renderHook(({ sid }) => useStreamProgress(sid, 'http://localhost:3001'), {
            initialProps: { sid: 'session-1' }
        });

        await act(async () => {
            vi.advanceTimersByTime(100);
        });

        const es1 = (global as any).EventSource.instances[0];
        expect(es1).toBeTruthy();

        // Change session
        rerender({ sid: 'session-2' });

        await act(async () => {
            vi.advanceTimersByTime(100);
        });

        expect(es1.close).toHaveBeenCalled();
        expect((global as any).EventSource.instances.length).toBe(2);
        const es2 = (global as any).EventSource.instances[1];
        expect(es2).not.toBe(es1);
    });

    it('should track lastEventId from SSE messages and update store', async () => {
        const { result } = renderHook(() => useStreamProgress('session-seq', 'http://localhost:3001'));

        await act(async () => {
            vi.advanceTimersByTime(100);
        });

        const mockES = (global as any).EventSource.instances[0];
        act(() => mockES.triggerOpen());

        // Simulate message with lastEventId
        act(() => {
            mockES.triggerMessage({ type: 'progress', stepIndex: 2 }, '1337');
        });

        // Verify store was updated
        expect(mockDispatchStreamEvent).toHaveBeenNthCalledWith(2, 'progress', expect.objectContaining({ stepIndex: 2 }));
        expect(mockState.lastEventId).toBe(1337);
        expect(mockSetLastEventId).toHaveBeenCalledWith(1337);
    });

    it('should hydrate completion result in polling fallback when status is complete', async () => {
        (global.fetch as any).mockResolvedValueOnce({
            status: 200,
            ok: true,
            json: async () => ({
                status: 'complete',
                progress: { currentStep: 7, totalSteps: 7, percentage: 100, steps: [] },
                result: { rectifiedTime: '12:34:56', accuracy: 98, confidence: 'high' },
                metadata: { status: 'complete' }
            }),
        });

        const { result } = renderHook(() => useStreamProgress('session-poll-complete', 'http://localhost:3001'));

        await act(async () => {
            vi.advanceTimersByTime(10500); // trigger polling fallback
        });
        await act(async () => {
            vi.advanceTimersByTime(50);
        });

        expect(result.current.connectionState.status).toBe('finished');
        expect(mockDispatchStreamEvent).toHaveBeenCalledWith(
            'complete',
            expect.objectContaining({
                data: expect.objectContaining({ rectifiedTime: '12:34:56' })
            })
        );
    });

    it('should clear token cache and retry polling once on 401', async () => {
        const { getTokenWithRetry } = await import('../auth-utils');
        (global.fetch as any)
            .mockResolvedValueOnce({ status: 401, ok: false })
            .mockResolvedValueOnce({
                status: 200,
                ok: true,
                json: async () => ({
                    status: 'processing',
                    progress: { currentStep: 1, totalSteps: 7, percentage: 10, steps: [] },
                    metadata: { status: 'processing' }
                }),
            });

        renderHook(() => useStreamProgress('session-401-retry', 'http://localhost:3001', async () => 'mock-token'));

        await act(async () => {
            vi.advanceTimersByTime(100);
        });
        await act(async () => {
            vi.advanceTimersByTime(10500);
        });
        await act(async () => {
            vi.advanceTimersByTime(100);
        });

        expect((global.fetch as any).mock.calls.length).toBe(2);
        const retryCall = vi.mocked(getTokenWithRetry).mock.calls.find(([, options]) => options?.skipCache === true);
        expect(retryCall).toBeTruthy();
    });

    it('should handle rapid-fire SSE messages without dropping state updates', async () => {
        const { result } = renderHook(() => useStreamProgress('session-rapid', 'http://localhost:3001'));

        await act(async () => {
            vi.advanceTimersByTime(100);
        });

        const mockES = (global as any).EventSource.instances[0];
        act(() => mockES.triggerOpen());

        // Send 100 messages in one tick
        act(() => {
            for (let i = 0; i < 100; i++) {
                mockES.triggerMessage({ type: 'ai_thinking', chunk: `c-${i}`, stage: 1 });
            }
        });

        // 100 thinking messages + 1 connected message
        expect(mockDispatchStreamEvent).toHaveBeenCalledTimes(101);
    });

    it('should correctly prioritize SSE over polling when both are possible', async () => {
        const { result } = renderHook(() => useStreamProgress('session-priority', 'http://localhost:3001'));

        await act(async () => {
            vi.advanceTimersByTime(100);
        });

        expect((global as any).EventSource.instances.length).toBe(1);
        expect(global.fetch).not.toHaveBeenCalled();

        // Advance past small buffer but before SSE timeout (10s)
        await act(async () => {
            vi.advanceTimersByTime(5000);
        });

        expect(global.fetch).not.toHaveBeenCalled();
    });
});
