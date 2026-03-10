import { z } from 'zod';

export const PlanetDataSchema = z.object({
    sign: z.string(),
    degree: z.union([z.number(), z.string()]),
    nakshatra: z.string().optional(),
    house: z.number().optional(),
}).passthrough();

export const VimshottariDashaEntrySchema = z.object({
    maha: z.string().min(1),
    antar: z.string().min(1),
    pratyantar: z.string().min(1),
    sukshma: z.string().optional(),
    prana: z.string().optional(),
    startEnd: z.string()
});

// ZERO-TRUST Transit Validation
export const TransitPlanetSchema = z.string().min(1).refine(val => val.includes('| H'), {
    message: 'Transit planet must include house position indicator (| H)'
});

export const TransitDataEntrySchema = z.object({
    dasha: z.string().min(1).refine(val => val !== 'Unknown', {
        message: 'Dasha sequence must not be Unknown'
    }),
    signatures: z.array(z.string()),
    planets: z.record(z.string(), TransitPlanetSchema),
    doubleTransit: z.any().optional(),
});

export const CandidateDataPackageSchema = z.object({
    time: z.string(),
    offsetMinutes: z.number(),
    ascendant: z.object({
        sign: z.string(),
        degree: z.string(),
        nakshatra: z.string().optional(),
    }),
    planets: z.record(z.string(), PlanetDataSchema),
    houseLords: z.record(z.union([z.string(), z.number()]), z.string()),
    vimshottariDasha: z.array(VimshottariDashaEntrySchema).min(1),
    transitData: z.record(z.string(), TransitDataEntrySchema).optional(),
}).passthrough();

// ═════════════════════════════════════════════════════════════════════════════
// CALCULATION & EVENT SCHEMAS (Centralized Contract)
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Sanitize string to prevent XSS (Internal helper for schemas)
 */
const sanitizeString = (val: string) => {
    return val
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '')
        .trim();
};

/**
 * Life Event validation schema
 */
const YEAR_PATTERN = /^\d{4}$/;
const MONTH_PATTERN = /^\d{4}-\d{2}$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/;

function isDayLike(value: string): boolean {
    return DATE_PATTERN.test(value);
}

function isMonthLike(value: string): boolean {
    return MONTH_PATTERN.test(value) || DATE_PATTERN.test(value);
}

function isYearLike(value: string): boolean {
    return YEAR_PATTERN.test(value) || MONTH_PATTERN.test(value) || DATE_PATTERN.test(value);
}

function toPrecisionKey(value: string, precision: 'day' | 'month' | 'year'): string | null {
    if (precision === 'day' && isDayLike(value)) return value;
    if (precision === 'month' && isMonthLike(value)) return isDayLike(value) ? value.slice(0, 7) : value;
    if (precision === 'year' && isYearLike(value)) return value.slice(0, 4);
    return null;
}

export const LifeEventSchema = z.object({
    id: z.string()
        .regex(
            /^(?:[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|evt_[A-Za-z0-9_-]+|custom_[A-Za-z0-9_-]+|[A-Za-z0-9_-]{1,128})$/i,
            'Invalid event id format'
        )
        .optional(),
    eventType: z.string()
        .min(1, "Event type is required")
        .max(100, "Event type must be less than 100 characters")
        .transform(sanitizeString),
    category: z.string(),
    eventDate: z.string().min(1, "Event date is required"),
    eventTime: z.string().regex(TIME_PATTERN, "Invalid time format (HH:MM or HH:MM:SS required)").optional().nullable(),
    endDate: z.string().optional().nullable(),
    datePrecision: z.enum(['exact_date_time', 'exact_date', 'month_year', 'month_range', 'year_range', 'date_range']),
    description: z.string()
        .max(2000, "Description must be less than 2000 characters")
        .transform(sanitizeString)
        .optional()
        .nullable(),
    importance: z.enum(['high', 'medium', 'low', 'critical']).default('medium'),
    createdAt: z.string().datetime().optional(),
    updatedAt: z.string().datetime().optional(),
}).passthrough().superRefine((event, ctx) => {
    const endDate = event.endDate ?? undefined;

    switch (event.datePrecision) {
        case 'exact_date':
        case 'exact_date_time': {
            if (!isDayLike(event.eventDate)) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ['eventDate'],
                    message: 'Invalid date format (YYYY-MM-DD required for exact date)',
                });
            }
            if (event.datePrecision === 'exact_date_time' && !event.eventTime) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ['eventTime'],
                    message: 'eventTime is required when datePrecision is exact_date_time',
                });
            }
            break;
        }

        case 'date_range': {
            if (!isDayLike(event.eventDate)) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ['eventDate'],
                    message: 'Invalid date range start (YYYY-MM-DD required)',
                });
            }
            if (endDate && !isDayLike(endDate)) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ['endDate'],
                    message: 'Invalid date range end (YYYY-MM-DD required)',
                });
            }
            break;
        }

        case 'month_year': {
            if (!isMonthLike(event.eventDate)) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ['eventDate'],
                    message: 'Invalid month-year format (YYYY-MM expected)',
                });
            }
            break;
        }

        case 'month_range': {
            if (!isMonthLike(event.eventDate)) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ['eventDate'],
                    message: 'Invalid month range start (YYYY-MM expected)',
                });
            }
            if (endDate && !isMonthLike(endDate)) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ['endDate'],
                    message: 'Invalid month range end (YYYY-MM expected)',
                });
            }
            break;
        }

        case 'year_range': {
            if (!isYearLike(event.eventDate)) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ['eventDate'],
                    message: 'Invalid year range start (YYYY expected)',
                });
            }
            if (endDate && !isYearLike(endDate)) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ['endDate'],
                    message: 'Invalid year range end (YYYY expected)',
                });
            }
            break;
        }

        default:
            break;
    }

    if (endDate) {
        const precisionKey = event.datePrecision === 'year_range'
            ? 'year'
            : (event.datePrecision === 'month_range' ? 'month' : 'day');
        const startKey = toPrecisionKey(event.eventDate, precisionKey);
        const endKey = toPrecisionKey(endDate, precisionKey);
        if (startKey && endKey && endKey < startKey) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['endDate'],
                message: 'endDate must be on or after eventDate',
            });
        }
    }
});

/**
 * Birth Data validation schema
 */
export const BirthDataSchema = z.object({
    fullName: z.string()
        .min(1, "Full name is required")
        .max(100, "Name must be less than 100 characters")
        .transform(sanitizeString),
    dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD required)"),
    tentativeTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/, "Invalid time format (HH:MM:SS required)"),
    birthPlace: z.string()
        .min(1, "Birth place is required")
        .max(200, "Birth place must be less than 200 characters")
        .transform(sanitizeString),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    timezone: z.number().min(-12).max(14),
    gender: z.enum(['male', 'female', 'other']).optional(),
});

/**
 * Offset Config validation schema
 */
export const OffsetConfigSchema = z.object({
    preset: z.enum(['30min', '1hour', '2hours', '4hours', '6hours', '12hours', 'seconds-30', 'seconds-6']),
    customMinutes: z.number().min(1).max(720).optional(),
    description: z.string().default(''),
});

/**
 * Main Calculation Request validation schema
 */
export const CalculateRequestSchema = z.object({
    birthData: BirthDataSchema,
    lifeEvents: z.array(LifeEventSchema)
        .min(3, "At least 3 life events are required")
        .max(100, "Maximum 100 life events allowed"),
    physicalTraits: z.record(z.any()).optional().nullable(),
    forensicTraits: z.record(z.any()).optional().nullable(),
    offsetConfig: OffsetConfigSchema,
});

export function validateCandidateDataForAI(pkg: any) {
    try {
        return CandidateDataPackageSchema.parse(pkg);
    } catch (err) {
        throw err;
    }
}
