/**
 * 🔱 EXHAUSTIVE CANCELLATION MANAGER TESTS
 * Tests createAbortController, getAbortSignal, abortSession,
 * cleanupController, isSessionCancelled, throwIfCancelled,
 * CancellationError, isCancellationError
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ═══════════════════════════════════════════════════════════════════════════
// MOCKS
// ═══════════════════════════════════════════════════════════════════════════

vi.mock('@ai-pandit/db', () => ({
    db: {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
    },
}));

vi.mock('@ai-pandit/db/schema', () => ({
    sessions: { id: 'id', status: 'status', errorMessage: 'errorMessage' },
}));

vi.mock('drizzle-orm', () => ({
    eq: vi.fn((...args: any[]) => args),
}));

vi.mock('../logger.js', () => ({
    logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

import {
    createAbortController,
    getAbortSignal,
    abortSession,
    cleanupController,
    isSessionCancelled,
    throwIfCancelled,
    CancellationError,
    isCancellationError,
} from '../cancellation-manager.js';
import { db } from '@ai-pandit/db';

// ═══════════════════════════════════════════════════════════════════════════
// ABORT CONTROLLER LIFECYCLE
// ═══════════════════════════════════════════════════════════════════════════

describe('Cancellation Manager - AbortController Lifecycle', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Reset: cleanup any leftover controllers
        cleanupController('test-session');
        cleanupController('session-a');
        cleanupController('session-b');
    });

    it('should create and return an AbortController', () => {
        const controller = createAbortController('test-session');
        expect(controller).toBeInstanceOf(AbortController);
        expect(controller.signal.aborted).toBe(false);
    });

    it('should return AbortSignal for existing session', () => {
        createAbortController('test-session');
        const signal = getAbortSignal('test-session');
        expect(signal).toBeDefined();
        expect(signal!.aborted).toBe(false);
    });

    it('should return undefined signal for non-existent session', () => {
        const signal = getAbortSignal('nonexistent');
        expect(signal).toBeUndefined();
    });

    it('should replace existing controller on re-create', () => {
        const controller1 = createAbortController('test-session');
        const controller2 = createAbortController('test-session');
        expect(controller2).not.toBe(controller1);
        // Original should NOT be aborted (design: clean replace, not abort)
        expect(controller1.signal.aborted).toBe(false);
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// ABORT SESSION
// ═══════════════════════════════════════════════════════════════════════════

describe('Cancellation Manager - abortSession', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        cleanupController('test-session');
    });

    it('should abort an active session and return true', () => {
        const controller = createAbortController('test-session');
        const result = abortSession('test-session');
        expect(result).toBe(true);
        expect(controller.signal.aborted).toBe(true);
    });

    it('should return false for non-existent session', () => {
        const result = abortSession('nonexistent');
        expect(result).toBe(false);
    });

    it('should cleanup controller after abort', () => {
        createAbortController('test-session');
        abortSession('test-session');
        const signal = getAbortSignal('test-session');
        expect(signal).toBeUndefined();
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// CLEANUP CONTROLLER
// ═══════════════════════════════════════════════════════════════════════════

describe('Cancellation Manager - cleanupController', () => {
    it('should remove controller without aborting', () => {
        const controller = createAbortController('test-session');
        cleanupController('test-session');
        expect(controller.signal.aborted).toBe(false);
        expect(getAbortSignal('test-session')).toBeUndefined();
    });

    it('should not throw for non-existent session', () => {
        expect(() => cleanupController('nonexistent')).not.toThrow();
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// IS SESSION CANCELLED (DB-based)
// ═══════════════════════════════════════════════════════════════════════════

describe('Cancellation Manager - isSessionCancelled', () => {
    beforeEach(() => vi.clearAllMocks());

    it('should return true if session not found in DB', async () => {
        (db.limit as any).mockResolvedValueOnce([]);
        const result = await isSessionCancelled('nonexistent');
        expect(result).toBe(true);
    });

    it('should return true if status=failed AND errorMessage includes "Cancelled by user"', async () => {
        (db.limit as any).mockResolvedValueOnce([{ status: 'failed', errorMessage: 'Cancelled by user' }]);
        const result = await isSessionCancelled('test-session');
        expect(result).toBe(true);
    });

    it('should return false if status=failed with OTHER error message', async () => {
        (db.limit as any).mockResolvedValueOnce([{ status: 'failed', errorMessage: 'AI analysis failed' }]);
        const result = await isSessionCancelled('test-session');
        expect(result).toBe(false);
    });

    it('should return false if status=processing', async () => {
        (db.limit as any).mockResolvedValueOnce([{ status: 'processing', errorMessage: null }]);
        const result = await isSessionCancelled('test-session');
        expect(result).toBe(false);
    });

    it('should return false if status=complete', async () => {
        (db.limit as any).mockResolvedValueOnce([{ status: 'complete', errorMessage: null }]);
        const result = await isSessionCancelled('test-session');
        expect(result).toBe(false);
    });

    it('should return false (fail-open) on DB error', async () => {
        (db.limit as any).mockRejectedValueOnce(new Error('DB connection failed'));
        const result = await isSessionCancelled('test-session');
        expect(result).toBe(false);
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// THROW IF CANCELLED
// ═══════════════════════════════════════════════════════════════════════════

describe('Cancellation Manager - throwIfCancelled', () => {
    beforeEach(() => vi.clearAllMocks());

    it('should throw CancellationError if signal is already aborted', async () => {
        const ac = new AbortController();
        ac.abort();
        await expect(throwIfCancelled('test', ac.signal)).rejects.toThrow(CancellationError);
    });

    it('should throw CancellationError if DB says cancelled', async () => {
        (db.limit as any).mockResolvedValueOnce([{ status: 'failed', errorMessage: 'Cancelled by user' }]);
        await expect(throwIfCancelled('test')).rejects.toThrow(CancellationError);
    });

    it('should NOT throw if session is processing normally', async () => {
        (db.limit as any).mockResolvedValueOnce([{ status: 'processing', errorMessage: null }]);
        await expect(throwIfCancelled('test')).resolves.toBeUndefined();
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// CANCELLATION ERROR CLASS
// ═══════════════════════════════════════════════════════════════════════════

describe('Cancellation Manager - CancellationError', () => {
    it('should be an instance of Error', () => {
        const err = new CancellationError();
        expect(err).toBeInstanceOf(Error);
        expect(err.name).toBe('CancellationError');
    });

    it('should have custom message', () => {
        const err = new CancellationError('Custom cancel message');
        expect(err.message).toBe('Custom cancel message');
    });

    it('should have default message', () => {
        const err = new CancellationError();
        expect(err.message).toBe('Operation cancelled');
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// IS CANCELLATION ERROR
// ═══════════════════════════════════════════════════════════════════════════

describe('Cancellation Manager - isCancellationError', () => {
    it('should return true for CancellationError', () => {
        expect(isCancellationError(new CancellationError())).toBe(true);
    });

    it('should return true for AbortError', () => {
        const err = new Error('aborted');
        err.name = 'AbortError';
        expect(isCancellationError(err)).toBe(true);
    });

    it('should return false for regular Error', () => {
        expect(isCancellationError(new Error('something'))).toBe(false);
    });

    it('should return false for non-Error', () => {
        expect(isCancellationError('not an error')).toBe(false);
        expect(isCancellationError(null)).toBe(false);
    });
});
