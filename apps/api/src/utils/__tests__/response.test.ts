/**
 * 🔱 RESPONSE UTILITIES TESTS
 * Tests standardized API response formatting.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Response } from 'express';

const mockStatus = vi.fn().mockReturnThis();
const mockJson = vi.fn().mockReturnThis();
const mockSetHeader = vi.fn().mockReturnThis();
const mockSend = vi.fn().mockReturnThis();

function createMockRes(): Response {
    return {
        status: mockStatus,
        json: mockJson,
        setHeader: mockSetHeader,
        send: mockSend,
    } as unknown as Response;
}

vi.mock('../../errors/index.js', () =>
 ({
    AppError: class AppError extends Error {
        code: string;
        statusCode: number;
        details?: Record<string, unknown>;
        constructor(code: string, message: string, details?: Record<string, unknown>) {
            super(message);
            this.name = 'AppError';
            this.code = code;
            this.statusCode = code === 'RATE_LIMIT_EXCEEDED' ? 429 : 500;
            this.details = details;
        }
        toJSON() {
            return {
                error: {
                    code: this.code,
                    message: this.message,
                    statusCode: this.statusCode,
                    details: this.details,
                },
            };
        }
    },
    getErrorStatusCode: vi.fn((error: unknown) =>
 {
        if (error && typeof error === 'object' && 'statusCode' in error) {
            return (error as any).statusCode;
        }
        return 500;
    }),
    getErrorResponse: vi.fn((error: unknown) =>
 {
        if (error && typeof error === 'object' && 'toJSON' in error) {
            return (error as any).toJSON();
        }
        return {
            error: {
                code: 'INTERNAL_ERROR',
                message: 'An error occurred',
            },
        };
    }),
}));

import {
    sendSuccess,
    sendCreated,
    sendNoContent,
    sendPaginated,
    sendError,
    sendValidationError,
    sendUnauthorized,
    sendForbidden,
    sendNotFound,
    sendConflict,
    sendRateLimit,
    sendServiceUnavailable,
    sendQueueStatus,
    sendBtrResult,
} from '../response.js';

describe('sendSuccess', () =>
 {
    beforeEach(() =>
 {
        vi.clearAllMocks();
    });

    it('should send 200 with success payload', () =>
 {
        const res = createMockRes();
        sendSuccess(res, { id: 1, name: 'Test' });

        expect(mockStatus).toHaveBeenCalledWith(200);
        expect(mockJson).toHaveBeenCalledWith(
            expect.objectContaining({
                success: true,
                data: { id: 1, name: 'Test' },
            })
        );
    });

    it('should include meta fields when provided', () =>
 {
        const res = createMockRes();
        sendSuccess(res, { ok: true }, 200, { requestId: 'req-1' });

        const payload = mockJson.mock.calls[0][0];
        expect(payload.meta.requestId).toBe('req-1');
        expect(payload.meta.timestamp).toBeDefined();
    });

    it('should use custom status code', () =>
 {
        const res = createMockRes();
        sendSuccess(res, {}, 202);

        expect(mockStatus).toHaveBeenCalledWith(202);
    });
});

describe('sendCreated', () =>
 {
    beforeEach(() =>
 {
        vi.clearAllMocks();
    });

    it('should send 201 with data', () =>
 {
        const res = createMockRes();
        sendCreated(res, { id: 'new-id' });

        expect(mockStatus).toHaveBeenCalledWith(201);
        expect(mockJson).toHaveBeenCalledWith(
            expect.objectContaining({
                success: true,
                data: { id: 'new-id' },
            })
        );
    });
});

describe('sendNoContent', () =>
 {
    beforeEach(() =>
 {
        vi.clearAllMocks();
    });

    it('should send 204 with no body', () =>
 {
        const res = createMockRes();
        sendNoContent(res);

        expect(mockStatus).toHaveBeenCalledWith(204);
        expect(mockSend).toHaveBeenCalled();
    });
});

describe('sendPaginated', () =>
 {
    beforeEach(() =>
 {
        vi.clearAllMocks();
    });

    it('should calculate totalPages and include pagination meta', () =>
 {
        const res = createMockRes();
        sendPaginated(res, {
            items: [{ id: 1 }, { id: 2 }],
            total: 50,
            page: 1,
            limit: 10,
        });

        const payload = mockJson.mock.calls[0][0];
        expect(payload.success).toBe(true);
        expect(payload.meta.pagination.totalPages).toBe(5);
        expect(payload.meta.pagination.page).toBe(1);
        expect(payload.meta.pagination.limit).toBe(10);
        expect(payload.meta.pagination.total).toBe(50);
    });
});

describe('sendError', () =>
 {
    beforeEach(() =>
 {
        vi.clearAllMocks();
    });

    it('should send structured error with status code', () =>
 {
        const res = createMockRes();
        const err = new Error('DB fail');
        sendError(res, err, 'req-err');

        expect(mockStatus).toHaveBeenCalledWith(500);
        const payload = mockJson.mock.calls[0][0];
        expect(payload.success).toBe(false);
        expect(payload.meta.requestId).toBe('req-err');
    });

    it('should set Retry-After header for 429 with retryAfterSeconds', () =>
 {
        const res = createMockRes();
        const err = {
            statusCode: 429,
            toJSON() {
                return { error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests', details: { retryAfterSeconds: 30 } } };
            },
        };
        sendError(res, err, 'req-rl');

        expect(mockSetHeader).toHaveBeenCalledWith('Retry-After', '30');
        expect(mockSetHeader).toHaveBeenCalledWith('X-RateLimit-Contract', 'v2026-03-12');
    });
});

describe('sendValidationError', () =>
 {
    beforeEach(() =>
 {
        vi.clearAllMocks();
    });

    it('should send 400 with validation error code', () =>
 {
        const res = createMockRes();
        sendValidationError(res, 'Invalid date format', { field: 'dateOfBirth' }, 'req-val');

        expect(mockStatus).toHaveBeenCalledWith(400);
        const payload = mockJson.mock.calls[0][0];
        expect(payload.error.code).toBe('VALIDATION_ERROR');
        expect(payload.error.message).toBe('Invalid date format');
        expect(payload.error.details).toEqual({ field: 'dateOfBirth' });
    });
});

describe('sendUnauthorized', () =>
 {
    beforeEach(() =>
 {
        vi.clearAllMocks();
    });

    it('should send 401 with default message', () =>
 {
        const res = createMockRes();
        sendUnauthorized(res);

        expect(mockStatus).toHaveBeenCalledWith(401);
        const payload = mockJson.mock.calls[0][0];
        expect(payload.error.code).toBe('UNAUTHORIZED');
        expect(payload.error.message).toBe('Authentication required');
    });

    it('should accept custom message', () =>
 {
        const res = createMockRes();
        sendUnauthorized(res, 'Token expired', 'req-auth');

        const payload = mockJson.mock.calls[0][0];
        expect(payload.error.message).toBe('Token expired');
        expect(payload.meta.requestId).toBe('req-auth');
    });
});

describe('sendForbidden', () =>
 {
    beforeEach(() =>
 {
        vi.clearAllMocks();
    });

    it('should send 403 with default message', () =>
 {
        const res = createMockRes();
        sendForbidden(res);

        expect(mockStatus).toHaveBeenCalledWith(403);
        const payload = mockJson.mock.calls[0][0];
        expect(payload.error.code).toBe('FORBIDDEN');
    });
});

describe('sendNotFound', () =>
 {
    beforeEach(() =>
 {
        vi.clearAllMocks();
    });

    it('should send 404 with resource name and identifier', () =>
 {
        const res = createMockRes();
        sendNotFound(res, 'Session', 'sess-123', 'req-nf');

        expect(mockStatus).toHaveBeenCalledWith(404);
        const payload = mockJson.mock.calls[0][0];
        expect(payload.error.message).toBe('Session not found: sess-123');
        expect(payload.error.details).toEqual({ resource: 'Session', identifier: 'sess-123' });
    });

    it('should send 404 without identifier', () =>
 {
        const res = createMockRes();
        sendNotFound(res, 'User');

        const payload = mockJson.mock.calls[0][0];
        expect(payload.error.message).toBe('User not found');
        expect(payload.error.details).toEqual({ resource: 'User' });
    });
});

describe('sendConflict', () =>
 {
    beforeEach(() =>
 {
        vi.clearAllMocks();
    });

    it('should send 409 with conflict details', () =>
 {
        const res = createMockRes();
        sendConflict(res, 'Session already exists', { sessionId: 'dup' }, 'req-cf');

        expect(mockStatus).toHaveBeenCalledWith(409);
        const payload = mockJson.mock.calls[0][0];
        expect(payload.error.code).toBe('CONFLICT');
    });
});

describe('sendRateLimit', () =>
 {
    beforeEach(() =>
 {
        vi.clearAllMocks();
    });

    it('should send 429 with Retry-After header', () =>
 {
        const res = createMockRes();
        sendRateLimit(res, 60, 'req-rl');

        expect(mockStatus).toHaveBeenCalledWith(429);
        expect(mockSetHeader).toHaveBeenCalledWith('Retry-After', 60);
        const payload = mockJson.mock.calls[0][0];
        expect(payload.error.code).toBe('RATE_LIMIT_EXCEEDED');
    });

    it('should send 429 without retry after when not provided', () =>
 {
        const res = createMockRes();
        sendRateLimit(res);

        expect(mockSetHeader).not.toHaveBeenCalled();
    });
});

describe('sendServiceUnavailable', () =>
 {
    beforeEach(() =>
 {
        vi.clearAllMocks();
    });

    it('should send 503 with default message', () =>
 {
        const res = createMockRes();
        sendServiceUnavailable(res);

        expect(mockStatus).toHaveBeenCalledWith(503);
        const payload = mockJson.mock.calls[0][0];
        expect(payload.error.code).toBe('SERVICE_UNAVAILABLE');
    });
});

describe('sendQueueStatus', () =>
 {
    beforeEach(() =>
 {
        vi.clearAllMocks();
    });

    it('should wrap queue status in success response', () =>
 {
        const res = createMockRes();
        const status = {
            sessionId: 'sess-1',
            status: 'processing' as const,
            position: 2,
        };
        sendQueueStatus(res, status, 'req-qs');

        expect(mockStatus).toHaveBeenCalledWith(200);
        const payload = mockJson.mock.calls[0][0];
        expect(payload.success).toBe(true);
        expect(payload.data.sessionId).toBe('sess-1');
    });
});

describe('sendBtrResult', () =>
 {
    beforeEach(() =>
 {
        vi.clearAllMocks();
    });

    it('should wrap BTR result in success response', () =>
 {
        const res = createMockRes();
        const result = {
            sessionId: 'sess-1',
            rectifiedTime: '14:30:15',
            accuracy: 95,
            confidence: 'HIGH' as const,
            precisionLevel: 'seconds' as const,
            marginOfError: 2,
            methodsUsed: ['dasha', 'transit'],
            processingTimeMs: 1200,
            analysisResult: {},
        };
        sendBtrResult(res, result, 'req-btr');

        expect(mockStatus).toHaveBeenCalledWith(200);
        const payload = mockJson.mock.calls[0][0];
        expect(payload.success).toBe(true);
        expect(payload.data.confidence).toBe('HIGH');
    });
});
