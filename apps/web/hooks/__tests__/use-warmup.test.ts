import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useWarmup } from '../use-warmup';

// Mutable mock env
let mockWarmupEnabled = true;

// Mock Clerk auth
vi.mock('@clerk/nextjs', () => ({
    useAuth: () => ({
        getToken: vi.fn().mockResolvedValue('mock-token'),
    }),
}));

// Mock env config
vi.mock('@/lib/config/env', () => ({
    env: {
        api: { backendUrl: 'http://localhost:3001' },
        get warmup() {
            return { enabled: mockWarmupEnabled };
        },
    },
}));

// Mock auth-utils
vi.mock('@/lib/auth-utils', () => ({
    getTokenWithRetry: vi.fn().mockImplementation(async (getToken: any) => getToken()),
}));

// Mock logger
vi.mock('@/lib/logger', () => ({
    logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

describe('useWarmup', () => {
    const originalFetch = global.fetch;

    beforeEach(() => {
        vi.useFakeTimers({ shouldAdvanceTime: true });
        vi.clearAllMocks();
        mockWarmupEnabled = true;
        global.fetch = vi.fn().mockResolvedValue({ ok: true });
    });

    afterEach(() => {
        vi.useRealTimers();
        global.fetch = originalFetch;
        vi.restoreAllMocks();
    });

    it('should be importable and return no values (hook has no return)', () => {
        const { result } = renderHook(() => useWarmup());
        expect(result.current).toBeUndefined();
    });

    it('should ping backend endpoints after delay', async () => {
        renderHook(() => useWarmup());

        expect(global.fetch).not.toHaveBeenCalled();

        act(() => {
            vi.advanceTimersByTime(1000);
        });

        await vi.waitFor(() => {
            expect(global.fetch).toHaveBeenCalledTimes(2);
        });

        expect(global.fetch).toHaveBeenCalledWith(
            'http://localhost:3001/api/health',
            expect.objectContaining({
                method: 'GET',
                headers: expect.objectContaining({
                    Authorization: 'Bearer mock-token',
                }),
            })
        );

        expect(global.fetch).toHaveBeenCalledWith(
            'http://localhost:3001/api/warmup',
            expect.objectContaining({
                method: 'GET',
                headers: expect.objectContaining({
                    Authorization: 'Bearer mock-token',
                }),
            })
        );
    });

    it('should only warm up once across re-renders', async () => {
        const { rerender } = renderHook(() => useWarmup());

        act(() => {
            vi.advanceTimersByTime(1000);
        });

        await vi.waitFor(() => {
            expect(global.fetch).toHaveBeenCalledTimes(2);
        });

        rerender();

        act(() => {
            vi.advanceTimersByTime(1000);
        });

        expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('should not warm up when disabled', () => {
        mockWarmupEnabled = false;

        renderHook(() => useWarmup());

        act(() => {
            vi.advanceTimersByTime(2000);
        });

        expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should handle fetch failures gracefully', async () => {
        (global.fetch as any).mockRejectedValue(new Error('Network error'));

        renderHook(() => useWarmup());

        act(() => {
            vi.advanceTimersByTime(1000);
        });

        await vi.waitFor(() => {
            expect(global.fetch).toHaveBeenCalled();
        });
    });
});
