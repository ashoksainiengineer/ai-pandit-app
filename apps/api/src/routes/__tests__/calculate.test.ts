import { beforeEach, describe, expect, it, vi } from 'vitest';
import express from 'express';
import request from 'supertest';
import calculateRouter from '../../routes/calculate.js';
import { AppError, ErrorCodes, ValidationError } from '../../errors/index.js';

const {
    mockCreateQueuedBirthRectificationJob,
    mockGetJobIdempotencyKey,
    mockResolveSessionOwnershipContext,
} = vi.hoisted(() => ({
    mockCreateQueuedBirthRectificationJob: vi.fn(),
    mockGetJobIdempotencyKey: vi.fn(),
    mockResolveSessionOwnershipContext: vi.fn(),
}));

vi.mock('../../middleware/auth.js', () => ({
    authMiddleware: vi.fn((req: { clerkId?: string }, _res: unknown, next: () => void) => {
        req.clerkId = 'test_user_calc';
        next();
    }),
}));

vi.mock('../../lib/logger.js', () => ({
    logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

vi.mock('../../lib/jobs/job-service.js', () => ({
    createQueuedBirthRectificationJob: mockCreateQueuedBirthRectificationJob,
    getJobIdempotencyKey: mockGetJobIdempotencyKey,
}));

vi.mock('../../lib/session-ownership.js', () => ({
    resolveSessionOwnershipContext: mockResolveSessionOwnershipContext,
}));

function createApp(): express.Express {
    const app = express();
    app.use(express.json());
    app.use('/api/calculate', calculateRouter);
    return app;
}

const VALID_REQUEST = {
    birthData: {
        fullName: 'John Doe',
        dateOfBirth: '1990-01-15',
        tentativeTime: '08:30:00',
        birthPlace: 'Mumbai, India',
        latitude: 19.076,
        longitude: 72.8777,
        timezone: 5.5,
        gender: 'male',
    },
    lifeEvents: [
        { eventType: 'Marriage', category: 'marriage', eventDate: '2015-06-15', datePrecision: 'exact_date', importance: 'high', description: 'Married' },
        { eventType: 'First Job', category: 'career', eventDate: '2012-07-01', datePrecision: 'exact_date', importance: 'medium', description: 'Started job' },
        { eventType: 'Graduation', category: 'education', eventDate: '2011-05-20', datePrecision: 'exact_date', importance: 'medium', description: 'Graduated' },
    ],
    forensicTraits: {
        faceShape: 'oval',
    },
    offsetConfig: { preset: '1hour' as const, description: 'Standard offset' },
};

describe('Calculate Route', () => {
    let app: express.Express;

    beforeEach(() => {
        vi.clearAllMocks();
        app = createApp();
        mockResolveSessionOwnershipContext.mockResolvedValue({
            clerkId: 'test_user_calc',
            internalUserId: 'internal-uuid-123',
        });
        mockGetJobIdempotencyKey.mockReturnValue(undefined);
    });

    it('returns queued session details on success', async () => {
        mockCreateQueuedBirthRectificationJob.mockResolvedValueOnce({
            job: {
                id: 'job-123',
                sessionId: 'session-123',
                status: 'queued',
            },
            queue: {
                position: 1,
                estimatedWaitSeconds: 30,
            },
            idempotentReplay: false,
        });

        const res = await request(app).post('/api/calculate').send(VALID_REQUEST);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toMatchObject({
            sessionId: 'session-123',
            jobId: 'job-123',
            position: 1,
            estimatedWaitSeconds: 30,
            status: 'queued',
            idempotentReplay: false,
        });
        expect(mockResolveSessionOwnershipContext).toHaveBeenCalledWith('test_user_calc');
        expect(mockCreateQueuedBirthRectificationJob).toHaveBeenCalledWith({
            clerkId: 'test_user_calc',
            ownershipContext: {
                clerkId: 'test_user_calc',
                internalUserId: 'internal-uuid-123',
            },
            body: VALID_REQUEST,
            idempotencyKey: undefined,
        });
    });

    it('forwards idempotency key to the job service', async () => {
        mockGetJobIdempotencyKey.mockReturnValueOnce('idem-123');
        mockCreateQueuedBirthRectificationJob.mockResolvedValueOnce({
            job: {
                id: 'job-456',
                sessionId: 'session-456',
                status: 'queued',
            },
            queue: {
                position: 2,
                estimatedWaitSeconds: 60,
            },
            idempotentReplay: true,
        });

        const res = await request(app).post('/api/calculate').send(VALID_REQUEST);

        expect(res.status).toBe(200);
        expect(res.body.data.idempotentReplay).toBe(true);
        expect(mockCreateQueuedBirthRectificationJob).toHaveBeenCalledWith(
            expect.objectContaining({ idempotencyKey: 'idem-123' })
        );
    });

    it('returns structured validation errors from the job service', async () => {
        mockCreateQueuedBirthRectificationJob.mockRejectedValueOnce(
            new ValidationError('Validation failed', {
                fields: [{ field: 'lifeEvents', message: 'At least 3 life events are required' }],
            })
        );

        const res = await request(app).post('/api/calculate').send(VALID_REQUEST);

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.error).toMatchObject({
            code: ErrorCodes.VALIDATION_ERROR,
            message: 'Validation failed',
            details: {
                fields: [{ field: 'lifeEvents', message: 'At least 3 life events are required' }],
            },
        });
    });

    it('returns queue-full errors without leaking internals', async () => {
        mockCreateQueuedBirthRectificationJob.mockRejectedValueOnce(
            new AppError(ErrorCodes.QUEUE_FULL, 'Processing queue is full. Please try again later.')
        );

        const res = await request(app).post('/api/calculate').send(VALID_REQUEST);

        expect(res.status).toBe(503);
        expect(res.body.success).toBe(false);
        expect(res.body.error).toMatchObject({
            code: ErrorCodes.QUEUE_FULL,
            message: 'Processing queue is full. Please try again later.',
        });
    });
});
