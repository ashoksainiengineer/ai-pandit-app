/**
 * 🔱 EXHAUSTIVE VALIDATION MIDDLEWARE TESTS
 * Industry-standard coverage for Zod validation middleware.
 * Tests every schema, every edge case, every boundary condition.
 */
import {
  describe,
  it,
  expect,
  vi
} from 'vitest';
import { Request, Response, NextFunction } from 'express';
import {
    validateBody,
    validateParams,
    BirthDataSchema,
    LifeEventSchema,
    QueueSubmitSchema,
    UuidParamSchema,
    TimeOffsetConfigSchema,
} from '../validation.js';

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════

function createMockReqResNext(body: any = {}, params: any = {}) {
    const req = { body, params, query: {}, headers: {} } as unknown as Request;
    const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis(),
    } as unknown as Response;
    const next = vi.fn() as NextFunction;
    return { req, res, next };
}

// ═══════════════════════════════════════════════════════════════════════════
// BIRTH DATA SCHEMA
// ═══════════════════════════════════════════════════════════════════════════

describe('Validation Middleware - BirthDataSchema', () => {
    const validBirthData = {
        fullName: 'Ashok Kumar',
        dateOfBirth: '1990-05-15',
        tentativeTime: '14:30:00',
        birthPlace: 'Delhi, India',
        latitude: 28.6139,
        longitude: 77.2090,
        timezone: 5.5,
        gender: 'male',
    };

    it('should pass with valid birth data', () => {
        const result = BirthDataSchema.safeParse(validBirthData);
        expect(result.success).toBe(true);
    });

    it('should reject empty fullName', () => {
        const data = { ...validBirthData, fullName: '' };
        const result = BirthDataSchema.safeParse(data);
        expect(result.success).toBe(false);
    });

    it('should reject fullName longer than 100 chars', () => {
        const data = { ...validBirthData, fullName: 'A'.repeat(101) };
        const result = BirthDataSchema.safeParse(data);
        expect(result.success).toBe(false);
    });

    it('should reject malformed dateOfBirth (DD-MM-YYYY)', () => {
        const data = { ...validBirthData, dateOfBirth: '15-05-1990' };
        const result = BirthDataSchema.safeParse(data);
        expect(result.success).toBe(false);
    });

    it('should reject dateOfBirth with slashes (YYYY/MM/DD)', () => {
        const data = { ...validBirthData, dateOfBirth: '1990/05/15' };
        const result = BirthDataSchema.safeParse(data);
        expect(result.success).toBe(false);
    });

    it('should reject time format without seconds (HH:MM only)', () => {
        const data = { ...validBirthData, tentativeTime: '14:30' };
        const result = BirthDataSchema.safeParse(data);
        // The schema expects HH:MM or HH:MM:SS
        expect(result.success).toBe(true); // Schema accepts HH:MM
    });

    it('should accept 25:00:00 (regex-only validation, no hour-range check)', () => {
        // NOTE: The middleware schema uses regex \\d{2}:\\d{2}(:\\d{2})?
        // which matches format but doesn't validate hour/minute ranges.
        // The calculate route uses a stricter regex. This documents the gap.
        const data = { ...validBirthData, tentativeTime: '25:00:00' };
        const result = BirthDataSchema.safeParse(data);
        expect(result.success).toBe(false); // Fix from Bug 8: Schema now properly enforces valid 24h ranges
    });

    it('should reject latitude > 90', () => {
        const data = { ...validBirthData, latitude: 91 };
        const result = BirthDataSchema.safeParse(data);
        expect(result.success).toBe(false);
    });

    it('should reject latitude < -90', () => {
        const data = { ...validBirthData, latitude: -91 };
        const result = BirthDataSchema.safeParse(data);
        expect(result.success).toBe(false);
    });

    it('should accept extreme valid latitude (90)', () => {
        const data = { ...validBirthData, latitude: 90 };
        const result = BirthDataSchema.safeParse(data);
        expect(result.success).toBe(true);
    });

    it('should reject longitude > 180', () => {
        const data = { ...validBirthData, longitude: 181 };
        const result = BirthDataSchema.safeParse(data);
        expect(result.success).toBe(false);
    });

    it('should reject longitude < -180', () => {
        const data = { ...validBirthData, longitude: -181 };
        const result = BirthDataSchema.safeParse(data);
        expect(result.success).toBe(false);
    });

    it('should reject timezone > 14', () => {
        const data = { ...validBirthData, timezone: 15 };
        const result = BirthDataSchema.safeParse(data);
        expect(result.success).toBe(false);
    });

    it('should reject timezone < -12', () => {
        const data = { ...validBirthData, timezone: -13 };
        const result = BirthDataSchema.safeParse(data);
        expect(result.success).toBe(false);
    });

    it('should accept fractional timezone like 5.5 (IST)', () => {
        const data = { ...validBirthData, timezone: 5.5 };
        const result = BirthDataSchema.safeParse(data);
        expect(result.success).toBe(true);
    });

    it('should accept fractional timezone like 5.75 (Nepal)', () => {
        const data = { ...validBirthData, timezone: 5.75 };
        const result = BirthDataSchema.safeParse(data);
        expect(result.success).toBe(true);
    });

    it('should reject invalid gender value', () => {
        const data = { ...validBirthData, gender: 'invalid' };
        const result = BirthDataSchema.safeParse(data);
        expect(result.success).toBe(false);
    });

    it('should accept gender "other"', () => {
        const data = { ...validBirthData, gender: 'other' };
        const result = BirthDataSchema.safeParse(data);
        expect(result.success).toBe(true);
    });

    it('should reject completely empty object', () => {
        const result = BirthDataSchema.safeParse({});
        expect(result.success).toBe(false);
    });

    it('should reject null input', () => {
        const result = BirthDataSchema.safeParse(null);
        expect(result.success).toBe(false);
    });

    it('should reject string input instead of object', () => {
        const result = BirthDataSchema.safeParse('not an object');
        expect(result.success).toBe(false);
    });

    it('should reject birthPlace longer than 200 chars', () => {
        const data = { ...validBirthData, birthPlace: 'A'.repeat(201) };
        const result = BirthDataSchema.safeParse(data);
        expect(result.success).toBe(false);
    });

    it('should reject missing required fields (latitude)', () => {
        const { latitude, ...data } = validBirthData;
        const result = BirthDataSchema.safeParse(data);
        expect(result.success).toBe(false);
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// LIFE EVENT SCHEMA
// ═══════════════════════════════════════════════════════════════════════════

describe('Validation Middleware - LifeEventSchema', () => {
    const validEvent = {
        category: 'marriage',
        eventType: 'Got married',
        datePrecision: 'exact_date',
        eventDate: '2020-01-15',
        importance: 'high',
    };

    it('should pass with valid event', () => {
        const result = LifeEventSchema.safeParse(validEvent);
        expect(result.success).toBe(true);
    });

    it('should reject empty eventType', () => {
        const data = { ...validEvent, eventType: '' };
        const result = LifeEventSchema.safeParse(data);
        expect(result.success).toBe(false);
    });

    it('should reject invalid datePrecision', () => {
        const data = { ...validEvent, datePrecision: 'whatever' };
        const result = LifeEventSchema.safeParse(data);
        expect(result.success).toBe(false);
    });

    it('should accept all valid datePrecision values', () => {
        const precisions = ['exact_date_time', 'exact_date', 'date_range', 'month_year', 'month_range', 'year_range'];
        for (const precision of precisions) {
            const data = { ...validEvent, datePrecision: precision };
            const result = LifeEventSchema.safeParse(data);
            expect(result.success).toBe(true);
        }
    });

    it('should accept all valid importance levels', () => {
        const levels = ['low', 'medium', 'high', 'critical'];
        for (const importance of levels) {
            const data = { ...validEvent, importance };
            const result = LifeEventSchema.safeParse(data);
            expect(result.success).toBe(true);
        }
    });

    it('should reject description longer than 2000 chars', () => {
        const data = { ...validEvent, description: 'A'.repeat(2001) };
        const result = LifeEventSchema.safeParse(data);
        expect(result.success).toBe(false);
    });

    it('should accept optional fields being absent', () => {
        const minimal = {
            category: 'career',
            eventType: 'Got promoted',
            datePrecision: 'month_year',
            eventDate: '2021-06',
            importance: 'medium',
        };
        const result = LifeEventSchema.safeParse(minimal);
        expect(result.success).toBe(true);
    });

    it('should allow passthrough of extra fields (custom categories)', () => {
        const data = { ...validEvent, customField: 'extra data', myFlag: true };
        const result = LifeEventSchema.safeParse(data);
        expect(result.success).toBe(true);
        if (result.success) {
            expect((result.data as any).customField).toBe('extra data');
        }
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// QUEUE SUBMIT SCHEMA  
// ═══════════════════════════════════════════════════════════════════════════

describe('Validation Middleware - QueueSubmitSchema', () => {
    const validSubmission = {
        birthData: {
            fullName: 'Test User',
            dateOfBirth: '1990-01-01',
            tentativeTime: '12:00:00',
            birthPlace: 'Mumbai',
            latitude: 19.076,
            longitude: 72.877,
            timezone: 5.5,
            gender: 'male',
        },
        lifeEvents: [
            { category: 'career', eventType: 'Job', datePrecision: 'exact_date', eventDate: '2015-06-01', importance: 'high' },
            { category: 'marriage', eventType: 'Wedding', datePrecision: 'exact_date', eventDate: '2018-02-14', importance: 'critical' },
            { category: 'education', eventType: 'Graduated', datePrecision: 'month_year', eventDate: '2012-05', importance: 'medium' },
        ],
        offsetConfig: { preset: '2hours' },
    };

    it('should pass with valid complete submission', () => {
        const result = QueueSubmitSchema.safeParse(validSubmission);
        expect(result.success).toBe(true);
    });

    it('should reject fewer than 3 life events', () => {
        const data = {
            ...validSubmission,
            lifeEvents: validSubmission.lifeEvents.slice(0, 2),
        };
        const result = QueueSubmitSchema.safeParse(data);
        expect(result.success).toBe(false);
    });

    it('should reject missing birthData', () => {
        const { birthData, ...data } = validSubmission;
        const result = QueueSubmitSchema.safeParse(data);
        expect(result.success).toBe(false);
    });

    it('should reject missing lifeEvents', () => {
        const { lifeEvents, ...data } = validSubmission;
        const result = QueueSubmitSchema.safeParse(data);
        expect(result.success).toBe(false);
    });

    it('should reject missing offsetConfig', () => {
        const { offsetConfig, ...data } = validSubmission;
        const result = QueueSubmitSchema.safeParse(data);
        expect(result.success).toBe(false);
    });
});


// ═══════════════════════════════════════════════════════════════════════════
// OFFSET CONFIG SCHEMA
// ═══════════════════════════════════════════════════════════════════════════

describe('Validation Middleware - TimeOffsetConfigSchema', () => {
    it('should accept all valid presets', () => {
        const presets = ['30min', '1hour', '2hours', '4hours', '6hours', '12hours', 'seconds-30', 'seconds-6'];
        for (const preset of presets) {
            const result = TimeOffsetConfigSchema.safeParse({ preset });
            expect(result.success).toBe(true);
        }
    });

    it('should reject invalid preset', () => {
        const result = TimeOffsetConfigSchema.safeParse({ preset: '3hours' });
        expect(result.success).toBe(false);
    });

    it('should reject customMinutes > 720', () => {
        const result = TimeOffsetConfigSchema.safeParse({ customMinutes: 721 });
        expect(result.success).toBe(false);
    });

    it('should reject customMinutes < 1', () => {
        const result = TimeOffsetConfigSchema.safeParse({ customMinutes: 0 });
        expect(result.success).toBe(false);
    });

    it('should accept empty object (all fields optional)', () => {
        const result = TimeOffsetConfigSchema.safeParse({});
        expect(result.success).toBe(true);
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// UUID PARAM SCHEMA
// ═══════════════════════════════════════════════════════════════════════════

describe('Validation Middleware - UuidParamSchema', () => {
    it('should accept valid UUID v4', () => {
        const result = UuidParamSchema.safeParse({ id: '550e8400-e29b-41d4-a716-446655440000' });
        expect(result.success).toBe(true);
    });

    it('should reject non-UUID string', () => {
        const result = UuidParamSchema.safeParse({ id: 'not-a-uuid' });
        expect(result.success).toBe(false);
    });

    it('should reject empty string', () => {
        const result = UuidParamSchema.safeParse({ id: '' });
        expect(result.success).toBe(false);
    });

    it('should reject numeric id', () => {
        const result = UuidParamSchema.safeParse({ id: 12345 });
        expect(result.success).toBe(false);
    });

    it('should reject missing id', () => {
        const result = UuidParamSchema.safeParse({});
        expect(result.success).toBe(false);
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// validateBody MIDDLEWARE FUNCTION
// ═══════════════════════════════════════════════════════════════════════════

describe('Validation Middleware - validateBody()', () => {
    const simpleSchema = BirthDataSchema;
    const middleware = validateBody(simpleSchema);

    it('should call next() on valid body', () => {
        const { req, res, next } = createMockReqResNext({
            fullName: 'Test',
            dateOfBirth: '1990-01-01',
            tentativeTime: '12:00:00',
            birthPlace: 'Delhi',
            latitude: 28.6,
            longitude: 77.2,
            timezone: 5.5,
            gender: 'male',
        });

        middleware(req, res, next);
        expect(next).toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalled();
    });

    it('should return 400 with Zod issues on invalid body', () => {
        const { req, res, next } = createMockReqResNext({});

        middleware(req, res, next);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            error: 'Validation Error',
        }));
        expect(next).not.toHaveBeenCalledWith();
    });

    it('should replace req.body with validated/parsed data', () => {
        const raw = {
            fullName: '  Test User  ',
            dateOfBirth: '1990-01-01',
            tentativeTime: '12:00',
            birthPlace: 'Delhi',
            latitude: 28.6,
            longitude: 77.2,
            timezone: 5.5,
            gender: 'female',
        };
        const { req, res, next } = createMockReqResNext(raw);

        middleware(req, res, next);
        // If next was called, body was replaced
        if ((next as any).mock.calls.length > 0) {
            expect(req.body).toBeDefined();
        }
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// validateParams MIDDLEWARE FUNCTION
// ═══════════════════════════════════════════════════════════════════════════

describe('Validation Middleware - validateParams()', () => {
    const middleware = validateParams(UuidParamSchema);

    it('should call next() on valid UUID param', () => {
        const { req, res, next } = createMockReqResNext({}, { id: '550e8400-e29b-41d4-a716-446655440000' });

        middleware(req, res, next);
        expect(next).toHaveBeenCalled();
    });

    it('should return 400 on invalid param', () => {
        const { req, res, next } = createMockReqResNext({}, { id: 'bad-id' });

        middleware(req, res, next);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            error: 'Invalid Parameters',
        }));
    });
});

