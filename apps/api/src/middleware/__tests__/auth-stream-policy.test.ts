import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Response, NextFunction } from 'express';

vi.mock('@clerk/backend', () => ({
    createClerkClient: vi.fn(() => ({})),
    verifyToken: vi.fn(),
}));

vi.mock('../../config/index.js', () => ({
    config: {
        app: { nodeEnv: 'production', isTest: false },
        security: { clerkSecretKey: 'test_secret_key' },
    },
}));

vi.mock('../../lib/logger.js', () => ({
    logger: {
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
    },
}));

vi.mock('../../lib/stream-ticket-manager.js', () => ({
    consumeStreamTicket: vi.fn(),
}));

vi.mock('fs', () => ({
    default: { appendFileSync: vi.fn() },
    appendFileSync: vi.fn(),
}));

import { authMiddleware, AuthenticatedRequest } from '../auth.js';
import { verifyToken } from '@clerk/backend';
import { consumeStreamTicket } from '../../lib/stream-ticket-manager.js';

function createMockReq(overrides: Partial<AuthenticatedRequest> = {}): AuthenticatedRequest {
    return {
        headers: {},
        query: {},
        url: '/api/test',
        originalUrl: '/api/test',
        method: 'GET',
        path: '/test',
        ...overrides,
    } as unknown as AuthenticatedRequest;
}

function createMockRes(): Response {
    return {
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis(),
        setHeader: vi.fn().mockReturnThis(),
        flushHeaders: vi.fn(),
        write: vi.fn(),
        end: vi.fn(),
        flush: vi.fn(),
    } as unknown as Response;
}

describe('Auth Middleware - Stream Policy (Production)', () => {
    const next = vi.fn() as unknown as NextFunction;

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should accept valid stream ticket without verifyToken', async () => {
        vi.mocked(consumeStreamTicket).mockReturnValue({
            clerkId: 'clerk_ticket_user',
            sessionId: 'session_ticket_1',
        });

        const req = createMockReq({
            originalUrl: '/api/stream/session_ticket_1',
            query: { ticket: 'ticket_abc' } as any,
        });
        const res = createMockRes();

        await authMiddleware(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(req.clerkId).toBe('clerk_ticket_user');
        expect(req.sessionId).toBe('session_ticket_1');
        expect(verifyToken).not.toHaveBeenCalled();
    });

    it('should reject sid query token for stream endpoint in production', async () => {
        const req = createMockReq({
            originalUrl: '/api/stream/session_legacy',
            query: { sid: 'legacy_sid_token' } as any,
        });
        const res = createMockRes();

        await authMiddleware(req, res, next);

        expect(next).not.toHaveBeenCalled();
        expect(verifyToken).not.toHaveBeenCalled();
        expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/event-stream');
        expect(res.write).toHaveBeenCalledWith(expect.stringContaining('"code":"UNAUTHORIZED"'));
        expect(res.end).toHaveBeenCalled();
    });

    it('should reject sid query token for non-stream endpoint too', async () => {
        const req = createMockReq({
            originalUrl: '/api/queue/progress',
            query: { sid: 'sid_non_stream' } as any,
        });
        const res = createMockRes();

        await authMiddleware(req, res, next);

        expect(verifyToken).not.toHaveBeenCalled();
        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(401);
    });

    it('should reject stream request when ticket is invalid', async () => {
        vi.mocked(consumeStreamTicket).mockReturnValue(null);

        const req = createMockReq({
            originalUrl: '/api/stream/session_invalid_ticket',
            query: { ticket: 'invalid_ticket' } as any,
        });
        const res = createMockRes();

        await authMiddleware(req, res, next);

        expect(next).not.toHaveBeenCalled();
        expect(res.write).toHaveBeenCalledWith(expect.stringContaining('"code":"UNAUTHORIZED"'));
    });
});
