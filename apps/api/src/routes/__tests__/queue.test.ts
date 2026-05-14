import { beforeEach, describe, expect, it, vi } from 'vitest';
import express from 'express';
import request from 'supertest';
import queueRouter from '../../routes/queue.js';
import { AppError, ErrorCodes } from '../../errors/index.js';

const {
    dbMock,
    mockExecuteWithRetry,
    mockCreateQueuedBirthRectificationJob,
    mockGetJobIdempotencyKey,
    mockResolveSessionOwnershipContext,
    mockIsSessionOwnedByContext,
    mockGetQueueStatus,
    mockCancelSession,
    mockFlushSessionTrash,
    mockAddToQueue,
    mockStartQueueProcessor,
} = vi.hoisted(() => ({
    dbMock: {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
        update: vi.fn().mockReturnThis(),
        set: vi.fn().mockReturnThis(),
        insert: vi.fn(() => ({ values: vi.fn().mockResolvedValue(undefined) })),
        query: {
            jobs: {
                findFirst: vi.fn().mockResolvedValue(null),
            },
        },
    },
    mockExecuteWithRetry: vi.fn((fn: () => unknown) => fn()),
    mockCreateQueuedBirthRectificationJob: vi.fn(),
    mockGetJobIdempotencyKey: vi.fn(),
    mockResolveSessionOwnershipContext: vi.fn(),
    mockIsSessionOwnedByContext: vi.fn(),
    mockGetQueueStatus: vi.fn(),
    mockCancelSession: vi.fn(),
    mockFlushSessionTrash: vi.fn(),
    mockAddToQueue: vi.fn(),
    mockStartQueueProcessor: vi.fn(),
}));

vi.mock('@ai-pandit/db', () => ({
    db: dbMock,
    executeWithRetry: mockExecuteWithRetry,
}));

vi.mock('@ai-pandit/db/schema', () => ({
    sessions: { id: 'id', externalId: 'externalId', userId: 'userId', status: 'status' },
    jobs: { id: 'id', sessionId: 'sessionId', status: 'status', createdAt: 'createdAt' },
    users: {},
}));

vi.mock('drizzle-orm', () => ({
    eq: vi.fn((...args: unknown[]) => args),
    desc: vi.fn((col: unknown) => col),
}));

vi.mock('../../middleware/auth.js', () => ({
    authMiddleware: vi.fn((req: { externalId?: string; sessionId?: string }, _res: unknown, next: () => void) => {
        req.externalId = 'test_clerk_id';
        req.sessionId = 'test_session_id';
        next();
    }),
    clerk: {},
}));

vi.mock('../../lib/logger.js', () => ({
    logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

vi.mock('../../lib/queue-manager.js', () => ({
    addToQueue: mockAddToQueue,
    getQueueStatus: mockGetQueueStatus,
    startQueueProcessor: mockStartQueueProcessor,
    cancelSession: mockCancelSession,
    flushSessionTrash: mockFlushSessionTrash,
}));

vi.mock('../../lib/session-ownership.js', () => ({
    resolveSessionOwnershipContext: mockResolveSessionOwnershipContext,
    isSessionOwnedByContext: mockIsSessionOwnedByContext,
}));

vi.mock('../../lib/jobs/job-service.js', () => ({
    createQueuedBirthRectificationJob: mockCreateQueuedBirthRectificationJob,
    getJobIdempotencyKey: mockGetJobIdempotencyKey,
}));

function createApp(): express.Express {
    const app = express();
    app.use(express.json());
    app.use('/api/queue', queueRouter);
    return app;
}

const validSubmitBody = {
    birthData: {
        fullName: 'Test User',
        dateOfBirth: '1990-05-15',
        tentativeTime: '14:30:00',
        birthPlace: 'Delhi',
        latitude: 28.6,
        longitude: 77.2,
        timezone: 5.5,
        gender: 'male',
    },
    lifeEvents: [
        { eventType: 'marriage', category: 'relationship', eventDate: '2015-01-01', datePrecision: 'exact_date', description: 'Got married', importance: 'high' },
        { eventType: 'career', category: 'work', eventDate: '2012-06-01', datePrecision: 'exact_date', description: 'First job', importance: 'medium' },
        { eventType: 'health', category: 'health', eventDate: '2018-03-15', datePrecision: 'exact_date', description: 'Surgery', importance: 'medium' },
    ],
    offsetConfig: { preset: '2hours' },
};

describe('Queue Route', () => {
    let app: express.Express;

    beforeEach(() => {
        vi.clearAllMocks();
        app = createApp();

        mockResolveSessionOwnershipContext.mockResolvedValue({
            externalId: 'test_clerk_id',
            internalUserId: 'internal_user_id_123',
        });
        mockIsSessionOwnedByContext.mockImplementation((session, context) => {
            if (!session) return false;
            if (session.externalId && session.externalId === context.externalId) return true;
            if (context.internalUserId && session.userId === context.internalUserId) return true;
            return false;
        });
        mockGetJobIdempotencyKey.mockReturnValue(undefined);
        dbMock.limit.mockResolvedValue([]);
        mockGetQueueStatus.mockResolvedValue({
            status: 'queued',
            position: 1,
            estimatedWaitSeconds: 60,
            totalInQueue: 1,
        });
        mockCancelSession.mockResolvedValue(true);
        mockFlushSessionTrash.mockResolvedValue(undefined);
        mockAddToQueue.mockResolvedValue({
            success: true,
            sessionId: 'test-session',
            position: 1,
            estimatedWaitSeconds: 60,
        });
    });

    describe('POST /api/queue', () => {
        it('returns queued session details on valid submission', async () => {
            mockCreateQueuedBirthRectificationJob.mockResolvedValueOnce({
                job: { id: 'job-123', sessionId: 'session-123', status: 'queued' },
                queue: { position: 1, estimatedWaitSeconds: 60 },
                idempotentReplay: false,
            });
            dbMock.limit.mockResolvedValueOnce([
                { id: 'session-123', externalId: 'test_clerk_id', userId: 'internal_user_id_123', status: 'pending' },
            ]);

            const res = await request(app).post('/api/queue').send(validSubmitBody);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toMatchObject({
                sessionId: 'session-123',
                jobId: 'job-123',
                position: 1,
                estimatedWaitSeconds: 60,
                status: 'queued',
                message: 'Your request is in queue at position 1',
            });
        });

        it('returns validation errors from the job service', async () => {
            mockCreateQueuedBirthRectificationJob.mockRejectedValueOnce(
                new AppError(ErrorCodes.VALIDATION_ERROR, 'Validation failed', {
                    fields: [{ field: 'birthData.fullName', message: 'Required' }],
                })
            );

            const res = await request(app).post('/api/queue').send(validSubmitBody);

            expect(res.status).toBe(400);
            expect(res.body.error).toMatchObject({
                code: ErrorCodes.VALIDATION_ERROR,
                message: 'Validation failed',
            });
        });

        it('returns queue-full errors from the job service', async () => {
            mockCreateQueuedBirthRectificationJob.mockRejectedValueOnce(
                new AppError(ErrorCodes.QUEUE_FULL, 'Processing queue is full. Please try again later.')
            );

            const res = await request(app).post('/api/queue').send(validSubmitBody);

            expect(res.status).toBe(503);
            expect(res.body.error).toMatchObject({
                code: ErrorCodes.QUEUE_FULL,
                message: 'Processing queue is full. Please try again later.',
            });
        });
    });

    describe('GET /api/queue', () => {
        it('returns 400 if sessionId is missing', async () => {
            const res = await request(app).get('/api/queue');

            expect(res.status).toBe(400);
            expect(res.body).toMatchObject({
                success: false,
                error: { code: 'VALIDATION_ERROR', message: 'sessionId is required' },
            });
        });

        it('returns 404 if session is not found', async () => {
            dbMock.limit.mockResolvedValueOnce([]);

            const res = await request(app).get('/api/queue?sessionId=missing-session');

            expect(res.status).toBe(404);
            expect(res.body).toMatchObject({
                success: false,
                error: { code: 'RESOURCE_NOT_FOUND', message: 'Session not found' },
            });
        });

        it('returns queue status for owned sessions', async () => {
            dbMock.limit.mockResolvedValueOnce([
                { id: 'session-123', externalId: 'test_clerk_id', userId: 'internal_user_id_123', status: 'queued' },
            ]);

            const res = await request(app).get('/api/queue?sessionId=session-123');

            expect(res.status).toBe(200);
            expect(res.body).toMatchObject({
                success: true,
                data: {
                    status: 'queued',
                    position: 1,
                    estimatedWaitSeconds: 60,
                    totalInQueue: 1,
                },
            });
        });
    });

    describe('POST /api/queue/cancel', () => {
        it('returns 400 if sessionId is missing', async () => {
            const res = await request(app).post('/api/queue/cancel').send({});

            expect(res.status).toBe(400);
            expect(res.body).toMatchObject({
                success: false,
                error: { code: 'VALIDATION_ERROR', message: 'sessionId is required' },
            });
        });

        it('cancels owned sessions', async () => {
            dbMock.limit.mockResolvedValueOnce([
                { id: 'session-123', externalId: 'test_clerk_id', userId: 'internal_user_id_123' },
            ]);

            const res = await request(app).post('/api/queue/cancel').send({ sessionId: 'session-123' });

            expect(res.status).toBe(200);
            expect(res.body).toMatchObject({
                success: true,
                message: 'Session cancelled',
            });
            expect(mockCancelSession).toHaveBeenCalledWith('session-123');
        });
    });

    describe('POST /api/queue/requeue', () => {
        it('returns 404 if session is not found', async () => {
            dbMock.limit.mockResolvedValueOnce([]);

            const res = await request(app).post('/api/queue/requeue').send({ sessionId: 'missing-session' });

            expect(res.status).toBe(404);
            expect(res.body).toMatchObject({
                success: false,
                error: { code: 'RESOURCE_NOT_FOUND', message: 'Session not found' },
            });
        });

        it('requeues a failed legacy session owned by internal user', async () => {
            mockAddToQueue.mockResolvedValue({
                success: true,
                sessionId: 'legacy-session',
                position: 1,
                estimatedWaitSeconds: 60,
            });
            mockResolveSessionOwnershipContext.mockResolvedValue({ userId: 'internal_user_id_123', isInternal: true });
            mockIsSessionOwnedByContext.mockReturnValue(true);
            dbMock.limit
                .mockResolvedValueOnce([
                    { id: 'legacy-session', externalId: 'legacy_clerk', userId: 'internal_user_id_123', status: 'failed', errorMessage: 'boom' },
                ])
                .mockResolvedValueOnce([
                    { status: 'pending', errorMessage: null },
                ])
                .mockResolvedValueOnce([
                    { status: 'pending', errorMessage: null },
                ]);

            const res = await request(app).post('/api/queue/requeue').send({ sessionId: 'legacy-session' });

            expect(res.status).toBe(200);
            expect(res.body).toMatchObject({
                success: true,
                data: {
                    sessionId: 'legacy-session',
                    position: 1,
                    estimatedWaitSeconds: 60,
                },
            });
            expect(mockFlushSessionTrash).toHaveBeenCalledWith('legacy-session');
            expect(mockStartQueueProcessor).toHaveBeenCalled();
        });
    });
});
