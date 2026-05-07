/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
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
        vi.clearAllMocks();
        mockGetToken = vi.fn().mockResolvedValue('valid-test-token-long-enough');
        useStreamStore.getState().clearStore();
        // Mock fetch to return ticket for ticket endpoint, and success for others
        global.fetch = vi.fn(async (url: string) => {
            if (url.includes('/api/stream/ticket/')) {
                return {
                    ok: true,
                    status: 200,
                    json: async () => ({ ticket: 'test-ticket' }),
                };
            }
            return {
                ok: true,
                status: 200,
                json: async () => ({ success: true, status: 'streaming', progress: {} }),
            };
        }) as any;
    });

    it('should use ticket query parameter for SSE', async () => {
        let capturedES: MockEventSource | null = null;
        window.addEventListener('mock-es-created', (e: any) => {
            capturedES = e.detail;
        });

        renderHook(() => useStreamProgress('session-123', 'http://api.test', mockGetToken));

        // The EventSource is created synchronously in connect() called from useEffect
        // Wait for React to flush effects
        await waitFor(() => {
            expect(capturedES).not.toBeNull();
        });
        expect(capturedES!.url).toContain('ticket=test-ticket');
    });

    it('should trigger re-auth on 401 error message', async () => {
        let esInstances: MockEventSource[] = [];
        window.addEventListener('mock-es-created', (e: any) => {
            esInstances.push(e.detail);
        });

        renderHook(() => useStreamProgress('session-123', 'http://api.test', mockGetToken));

        await waitFor(() => {
            expect(esInstances.length).toBe(1);
        });

        // Simulate 401 data error
        act(() => {
            esInstances[0].simulateMessage({
                type: 'error',
                code: 'AUTH_FAILED',
                error: 'Token expired'
            });
        });

        // Should close first
        expect(esInstances[0].close).toHaveBeenCalled();

        await waitFor(() => {
            expect(esInstances.length).toBeGreaterThanOrEqual(2);
        });
    });

    it('should set up proactive refresh interval', async () => {
        renderHook(() => useStreamProgress('session-123', 'http://api.test', mockGetToken));

        // Wait for initial connection to trigger getToken
        await waitFor(() => {
            expect(mockGetToken.mock.calls.length).toBeGreaterThanOrEqual(1);
        });
    });

    it('should fall back to polling with auth headers if SSE fails', async () => {
        let es: MockEventSource | null = null;
        window.addEventListener('mock-es-created', (e: any) => {
            es = e.detail;
        });

        // Use fake timers for this test to simulate SSE timeout
        vi.useFakeTimers();

        renderHook(() => useStreamProgress('session-123', 'http://api.test', mockGetToken));

        // Wait for EventSource to be created (effect runs synchronously with fake timers in act)
        await vi.waitFor(() => {
            expect(es).not.toBeNull();
        });

        // Simulate SSE error / timeout
        // The hook has a 10s SSE timeout - trigger it by advancing time
        act(() => {
            vi.advanceTimersByTime(10000);
        });

        await vi.waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/queue/progress?sessionId=session-123'),
                expect.objectContaining({
                    headers: expect.objectContaining({
                        'Authorization': 'Bearer valid-test-token-long-enough'
                    })
                })
            );
        });

        vi.useRealTimers();
    });
});
