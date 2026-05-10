/**
 * 🔱 EXHAUSTIVE AUTH MIDDLEWARE TESTS
 * Industry-standard coverage for Clerk JWT authentication middleware.
 * Tests every token scenario, every edge case.
 */
import {
  describe,
  it,
  expect,
  vi,
  beforeEach
} from 'vitest';
import { Response, NextFunction } from 'express';

// Mock @clerk/backend BEFORE importing auth module
// Mock auth provider (clerk-provider.js) — auth middleware now uses clerkAuthProvider.verifyToken
vi.mock('../../lib/auth/clerk-provider.js', () => ({
    clerkAuthProvider: {
        verifyToken: vi.fn(),
    },
    getClerkAdminClient: vi.fn(() => ({
        users: { getUser: vi.fn() },
    })),
}));

// Mock logger
vi.mock('../../lib/logger.js', () => ({
    logger: {
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
    },
}));

// Mock fs to prevent file writes
vi.mock('fs', () => ({
    default: { appendFileSync: vi.fn() },
    appendFileSync: vi.fn(),
}));

import { authMiddleware, AuthenticatedRequest } from '../auth.js';
import { clerkAuthProvider } from '../../lib/auth/clerk-provider.js';

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════

function createMockReq(overrides: Partial<AuthenticatedRequest> = {}): AuthenticatedRequest {
    return {
        headers: {},
        query: {},
        url: '/api/test',
        originalUrl: '/api/test',
        method: 'GET',
        path: '/test',
        ip: '127.0.0.1',
        ...overrides,
    } as unknown as AuthenticatedRequest;
}

function createMockRes(): Response {
    const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis(),
        setHeader: vi.fn().mockReturnThis(),
        flushHeaders: vi.fn(),
        write: vi.fn(),
        end: vi.fn(),
        flush: vi.fn(),
    } as unknown as Response;
    return res;
}

// ═══════════════════════════════════════════════════════════════════════════
// TESTS
// ═══════════════════════════════════════════════════════════════════════════

describe('Auth Middleware - Token Extraction', () => {
    const next = vi.fn() as unknown as NextFunction;

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should reject request with no token', async () => {
        const req = createMockReq({ headers: {} as any });
        const res = createMockRes();

        await authMiddleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            success: false,
            code: 'UNAUTHORIZED',
        }));
        expect(next).not.toHaveBeenCalled();
    });

    it('should extract token from Bearer header', async () => {
        const mockVerify = vi.mocked(clerkAuthProvider.verifyToken);
        mockVerify.mockResolvedValue({ identity: { userId: 'user_123', providerId: 'user_123', sessionId: 'sess_abc', provider: 'clerk' }, error: null });

        const req = createMockReq({
            headers: { authorization: 'Bearer valid_token_123' } as any,
        });
        const res = createMockRes();

        await authMiddleware(req, res, next);

        expect(mockVerify).toHaveBeenCalledWith('valid_token_123');
        expect(next).toHaveBeenCalled();
        expect(req.externalId).toBe('user_123');
        expect(req.sessionId).toBe('sess_abc');
    });

    it('should ignore query token and only use Authorization header', async () => {
        const mockVerify = vi.mocked(clerkAuthProvider.verifyToken);
        mockVerify.mockResolvedValue({ identity: { userId: 'user_header', providerId: 'user_header', sessionId: 'sess_h', provider: 'clerk' }, error: null });

        const req = createMockReq({
            headers: { authorization: 'Bearer header_token' } as any,
            query: { sid: 'query_token' } as any,
        });
        const res = createMockRes();

        await authMiddleware(req, res, next);

        expect(mockVerify).toHaveBeenCalledWith('header_token');
        expect(next).toHaveBeenCalled();
    });
});

describe('Auth Middleware - Malformed Token Handling', () => {
    const next = vi.fn() as unknown as NextFunction;

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should reject token "null" as invalid', async () => {
        const req = createMockReq({
            headers: { authorization: 'Bearer null' } as any,
        });
        const res = createMockRes();

        await authMiddleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
    });

    it('should reject token "undefined" as invalid', async () => {
        const req = createMockReq({
            headers: { authorization: 'Bearer undefined' } as any,
        });
        const res = createMockRes();

        await authMiddleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
    });

    it('should correctly intercept and clean "[object Object]" before it hits verifyToken', async () => {
        const mockVerify = vi.mocked(clerkAuthProvider.verifyToken);
        mockVerify.mockRejectedValue(new Error('Malformed token'));

        const req = createMockReq({
            headers: { authorization: 'Bearer [object Object]' } as any,
        });
        const res = createMockRes();

        await authMiddleware(req, res, next);

        // Fix from Bug 6: substring(7) extracts the full string which gets caught in the cleanup guard.
        expect(mockVerify).not.toHaveBeenCalled();
        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(401);
    });

    it('should reject Authorization header without "Bearer " prefix', async () => {
        const req = createMockReq({
            headers: { authorization: 'Basic some_token' } as any,
        });
        const res = createMockRes();

        await authMiddleware(req, res, next);

        // Without Bearer prefix, token extraction fails
        expect(res.status).toHaveBeenCalledWith(401);
    });
});

describe('Auth Middleware - Clerk Verification Failures', () => {
    const next = vi.fn() as unknown as NextFunction;

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should return 401 when verifyToken returns no sub', async () => {
        const mockVerify = vi.mocked(clerkAuthProvider.verifyToken);
        mockVerify.mockResolvedValue({ identity: null, error: 'Token verified but missing subject (sub) claim' });

        const req = createMockReq({
            headers: { authorization: 'Bearer valid_but_nosub' } as any,
        });
        const res = createMockRes();

        await authMiddleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            code: 'INVALID_SESSION',
        }));
        expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 when verifyToken throws (expired token)', async () => {
        const mockVerify = vi.mocked(clerkAuthProvider.verifyToken);
        mockVerify.mockRejectedValue(new Error('Token expired'));

        const req = createMockReq({
            headers: { authorization: 'Bearer expired_token' } as any,
        });
        const res = createMockRes();

        await authMiddleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            code: 'AUTH_FAILED',
        }));
    });

    it('should return 401 when verifyToken throws (network error)', async () => {
        const mockVerify = vi.mocked(clerkAuthProvider.verifyToken);
        mockVerify.mockRejectedValue(new Error('Network error'));

        const req = createMockReq({
            headers: { authorization: 'Bearer some_token' } as any,
        });
        const res = createMockRes();

        await authMiddleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
    });
});

describe('Auth Middleware - Stream Request Special Handling', () => {
    const next = vi.fn() as unknown as NextFunction;

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should send SSE error format for stream request with no token', async () => {
        const req = createMockReq({
            headers: {} as any,
            originalUrl: '/api/stream/some-session-id',
        });
        const res = createMockRes();

        await authMiddleware(req, res, next);

        // Should NOT call res.status().json() — should use SSE format instead
        expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/event-stream');
        expect(res.write).toHaveBeenCalled();
        expect(res.end).toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalled();
    });

    it('should send SSE error format for stream request with failed verification', async () => {
        const mockVerify = vi.mocked(clerkAuthProvider.verifyToken);
        mockVerify.mockRejectedValue(new Error('Token revoked'));

        const req = createMockReq({
            headers: { authorization: 'Bearer revoked_token' } as any,
            originalUrl: '/api/stream/some-session-id',
        });
        const res = createMockRes();

        await authMiddleware(req, res, next);

        expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/event-stream');
        expect(res.write).toHaveBeenCalled();
        expect(res.end).toHaveBeenCalled();
    });
});
