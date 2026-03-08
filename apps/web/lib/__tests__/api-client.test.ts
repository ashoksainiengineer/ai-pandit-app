import { describe, it, expect, vi, beforeEach } from 'vitest';

// ═══════════════════════════════════════════════════════════════════════════
// MOCKS — Must mock the auth-utils module that APIClient imports
// ═══════════════════════════════════════════════════════════════════════════

vi.mock('./config', () => ({
    env: { API_URL: 'http://localhost:3001' },
}));

vi.mock('./secure-logger', () => ({
    logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

// Mock getTokenWithRetry to bypass the retry loop and return immediately
vi.mock('./auth-utils', () => ({
    getTokenWithRetry: vi.fn(async (getToken: any) => {
        const token = await getToken();
        return token;
    }),
}));

// Mock global fetch
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

import { APIClient } from '../api-client';

// A valid token must be >20 chars for getTokenWithRetry to accept it
const VALID_TOKEN = 'test-token-that-is-longer-than-20-chars';

describe('APIClient - Unit Tests', () => {

    beforeEach(() => {
        vi.clearAllMocks();
        mockFetch.mockReset();
    });

    // ═════ POST ═════

    describe('POST', () => {
        it('should send POST request with JSON body and auth header', async () => {
            mockFetch.mockResolvedValueOnce({
                status: 200,
                json: async () => ({ success: true }),
            });

            const getToken = vi.fn().mockResolvedValue(VALID_TOKEN);
            const result = await APIClient.post('/api/calculate', { data: 'test' }, getToken);

            expect(result).toEqual({ success: true });
            expect(mockFetch).toHaveBeenCalledTimes(1);
            const [, options] = mockFetch.mock.calls[0];
            expect(options.method).toBe('POST');
            expect(options.headers['Content-Type']).toBe('application/json');
            expect(options.headers['Authorization']).toContain('Bearer');
        });

        it('should not include token as query parameter (header-only auth)', async () => {
            mockFetch.mockResolvedValueOnce({
                status: 200,
                json: async () => ({ success: true }),
            });

            const getToken = vi.fn().mockResolvedValue(VALID_TOKEN);
            await APIClient.post('/api/test', {}, getToken);

            const [url] = mockFetch.mock.calls[0];
            expect(url).toBe('/api/test');
        });



        it('should throw on network error', async () => {
            mockFetch.mockRejectedValueOnce(new Error('Network failure'));

            const getToken = vi.fn().mockResolvedValue(VALID_TOKEN);
            await expect(APIClient.post('/api/test', {}, getToken)).rejects.toThrow('Network failure');
        });
    });

    // ═════ GET ═════

    describe('GET', () => {
        it('should send GET request with auth header when getToken provided', async () => {
            mockFetch.mockResolvedValueOnce({
                status: 200,
                json: async () => ({ data: ['item1'] }),
            });

            const getToken = vi.fn().mockResolvedValue(VALID_TOKEN);
            const result = await APIClient.get('/api/sessions', getToken);

            expect(result).toEqual({ data: ['item1'] });
            expect(mockFetch).toHaveBeenCalledTimes(1);
            const [, options] = mockFetch.mock.calls[0];
            expect(options.method).toBe('GET');
            expect(options.headers['Authorization']).toContain('Bearer');
        });

        it('should send GET request without auth when no getToken provided', async () => {
            mockFetch.mockResolvedValueOnce({
                status: 200,
                json: async () => ({ status: 'ok' }),
            });

            const result = await APIClient.get('/api/health');

            expect(result).toEqual({ status: 'ok' });
            const [, options] = mockFetch.mock.calls[0];
            expect(options.headers['Authorization']).toBeUndefined();
        });

        it('should throw on network error', async () => {
            mockFetch.mockRejectedValueOnce(new Error('DNS resolution failed'));
            await expect(APIClient.get('/api/health')).rejects.toThrow('DNS resolution');
        });
    });
});
