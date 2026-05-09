import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextResponse } from 'next/server';

// ── Mock auth ──────────────────────────────────────────────────────────────
vi.mock('@clerk/nextjs/server', () => ({
    auth: vi.fn(async () => ({ userId: 'clerk_test_user' })),
}));

// ── Mock environment ───────────────────────────────────────────────────────
vi.mock('@/lib/config/env', () => ({
    env: {
        security: { encryptionSecret: 'test-secret-key-for-vitest-testing-32chars!' },
        app: { backendUrl: 'http://localhost:9999', isDevelopment: true, nextPhase: 'phase-development-build' },
        clerk: { webhookSecret: 'whsec_test', publishableKey: 'pk_test' },
        api: { backendUrl: 'http://localhost:9999' },
    },
}));

// ── Mock backend proxy — return controlled responses per test ──────────────
let mockProxyResponse: NextResponse;

vi.mock('@/lib/server/backend-proxy', () => ({
    proxyBackendJson: vi.fn(async () => mockProxyResponse),
}));

// ── Mock crypto ────────────────────────────────────────────────────────────
vi.mock('@/lib/crypto', () => ({
    initializeEncryption: vi.fn(),
    encrypt: vi.fn((value: string) => `enc:${value}`),
    isEncrypted: vi.fn(() => false),
    parseSensitiveField: vi.fn((value: unknown) => value),
}));

import { PUT, DELETE } from '@/app/api/sessions/[id]/route';

function makeRequest(body?: Record<string, unknown>): Request {
    return {
        json: body ? async () => body : async () => ({}),
    } as unknown as Request;
}

describe('PUT /api/sessions/[id] — proxy to Express API', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockProxyResponse = NextResponse.json({ success: true, message: 'Session updated' }, { status: 200 });
    });

    it('should forward PUT request to backend proxy', async () => {
        const req = makeRequest({ birthData: { fullName: 'Test' } });
        const res = await PUT(req as any, { params: Promise.resolve({ id: 'sess_1' }) });
        const json = await res.json();

        expect(res.status).toBe(200);
        expect(json.success).toBe(true);
    });

    it('should forward DELETE request to backend proxy', async () => {
        const req = makeRequest();
        const res = await DELETE(req as any, { params: Promise.resolve({ id: 'sess_1' }) });
        const json = await res.json();

        expect(res.status).toBe(200);
        expect(json.success).toBe(true);
    });

    it('should return 502 when backend proxy fails', async () => {
        // Simulate proxy throwing an error
        const { proxyBackendJson } = await import('@/lib/server/backend-proxy');
        (proxyBackendJson as any).mockRejectedValueOnce(new Error('Backend unreachable'));

        const req = makeRequest({ birthData: { fullName: 'Test' } });
        const res = await PUT(req as any, { params: Promise.resolve({ id: 'sess_1' }) });
        const json = await res.json();

        expect(res.status).toBe(502);
        expect(json.success).toBe(false);
    });

    it('should propagate backend error status codes', async () => {
        mockProxyResponse = NextResponse.json(
            { success: false, error: 'Session not found' },
            { status: 404 }
        );

        const req = makeRequest({ birthData: { fullName: 'Test' } });
        const res = await PUT(req as any, { params: Promise.resolve({ id: 'sess_nonexistent' }) });
        const json = await res.json();

        expect(res.status).toBe(404);
        expect(json.error).toBe('Session not found');
    });
});
