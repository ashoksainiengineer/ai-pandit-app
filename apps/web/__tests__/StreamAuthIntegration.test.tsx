/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useStreamProgress } from '../lib/use-stream-progress';
import { useStreamStore } from '../lib/store/stream-store';

// Mock dependencies
vi.mock('../lib/secure-logger', () => ({
    logger: { info: vi.fn(), debug: vi.fn(), warn: vi.fn(), error: vi.fn() }
}));

vi.mock('../lib/config/env', () => ({
    env: {
        api: {
            backendUrl: 'http://api.test',
            huggingFaceToken: 'hf-test-token'
        },
        clerk: {
            publishableKey: 'pk_test_123'
        }
    }
}));

vi.mock('../lib/auth-utils', () => ({
    getTokenWithRetry: vi.fn(async (getToken: any) => await getToken())
}));

// Mock EventSource
class MockEventSource {
    url: string;
    onopen: (() => void) | null = null;
    onmessage: ((ev: any) => void) | null = null;
    onerror: ((err: any) => void) | null = null;
    readyState: number = 0; // CONNECTING

    constructor(url: string) {
        this.url = url;
        window.dispatchEvent(new CustomEvent('mock-es-created', { detail: this }));
    }

    close = vi.fn();

    // Test helpers
    simulateOpen() {
        this.readyState = 1; // OPEN
        if (this.onopen) this.onopen();
    }
    simulateMessage(data: any) {
        if (this.onmessage) this.onmessage({ data: JSON.stringify(data) });
    }
    simulateError(err: any = {}) {
        if (this.onerror) this.onerror(err);
    }
}

global.EventSource = MockEventSource as any;

describe('StreamAuthIntegration: useStreamProgress', () => {
    let mockGetToken: any;

    beforeEach(() => {
        vi.useFakeTimers();
        vi.clearAllMocks();
        mockGetToken = vi.fn().mockResolvedValue('valid-test-token-long-enough');
        useStreamStore.getState().clearStore();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('should append token as "sid" query parameter for SSE', async () => {
        let capturedES: MockEventSource | null = null;
        window.addEventListener('mock-es-created', (e: any) => {
            capturedES = e.detail;
        });

        renderHook(() => useStreamProgress('session-123', 'http://api.test', mockGetToken));

        await act(async () => {
            await vi.runAllTimersAsync();
        });

        expect(capturedES).not.toBeNull();
        expect(capturedES!.url).toContain('sid=valid-test-token-long-enough');
    });

    it('should trigger re-auth on 401 error message', async () => {
        let esInstances: MockEventSource[] = [];
        window.addEventListener('mock-es-created', (e: any) => {
            esInstances.push(e.detail);
        });

        renderHook(() => useStreamProgress('session-123', 'http://api.test', mockGetToken));

        await act(async () => {
            await vi.runAllTimersAsync();
        });

        expect(esInstances.length).toBe(1);

        // Simulate 401 data error
        act(() => {
            esInstances[0].simulateMessage({
                type: 'error',
                code: 'AUTH_FAILED',
                error: 'Token expired'
            });
        });

        // Should close first and start second attempt
        expect(esInstances[0].close).toHaveBeenCalled();

        await act(async () => {
            await vi.advanceTimersByTimeAsync(1000);
        });

        expect(esInstances.length).toBe(2);
        expect(mockGetToken).toHaveBeenCalledTimes(2);
    });

    it('should set up proactive refresh interval', async () => {
        renderHook(() => useStreamProgress('session-123', 'http://api.test', mockGetToken));

        // Advance by 45 minutes
        await act(async () => {
            await vi.advanceTimersByTimeAsync(45 * 60 * 1000);
        });

        // 1 for initial connect, 1 for proactive refresh
        expect(mockGetToken).toHaveBeenCalledTimes(2);
    });

    it('should fall back to polling with auth headers if SSE fails', async () => {
        let es: MockEventSource | null = null;
        window.addEventListener('mock-es-created', (e: any) => {
            es = e.detail;
        });

        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => ({ success: true, status: 'streaming', progress: {} })
        });

        renderHook(() => useStreamProgress('session-123', 'http://api.test', mockGetToken));

        await act(async () => {
            await vi.runAllTimersAsync();
        });

        // Simulate SSE timeout fallback
        act(() => {
            vi.advanceTimersByTime(11000); // SSE_TIMEOUT is 10s
        });

        expect(es!.close).toHaveBeenCalled();

        await act(async () => {
            await vi.runAllTimersAsync();
        });

        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining('sid=valid-test-token-long-enough'),
            expect.objectContaining({
                headers: expect.objectContaining({
                    'Authorization': 'Bearer valid-test-token-long-enough'
                })
            })
        );
    });
});
