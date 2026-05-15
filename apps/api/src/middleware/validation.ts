import { Request, Response, NextFunction } from 'express';
import { z, ZodIssue } from 'zod';

// ═════════════════════════════════════════════════════════════════════════════
// VALIDATION SCHEMAS
// ═════════════════════════════════════════════════════════════════════════════

// TimeOffsetConfigSchema kept locally (not in shared package)
export const TimeOffsetConfigSchema = z.object({
    preset: z.enum(['30min', '1hour', '2hours', '4hours', '6hours', '12hours', 'seconds-30', 'seconds-6']).optional(),
    customMinutes: z.number().min(1).max(720).optional(),
    description: z.string().optional(),
});

// XSS sanitizer (mirrors shared package's sanitizeString)
const sanitizeString = (val: string) => {
    return val
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '')
        .trim();
};

// BirthDataSchema with XSS protection (BUG-004: added sanitizeString transforms)
export const BirthDataSchema = z.object({
    fullName: z.string().min(1, 'Full name is required').max(100).transform(sanitizeString),
    // BUG-FIX: Added refine to validate actual calendar date, not just format
    dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD').refine((val) => {
      const [y, m, d] = val.split('-').map(Number);
      const dt = new Date(Date.UTC(y, m - 1, d));
      return dt.getUTCFullYear() === y && dt.getUTCMonth() + 1 === m && dt.getUTCDate() === d;
    }, 'Invalid calendar date'),
    tentativeTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/, 'Time must be a valid HH:MM or HH:MM:SS format'),
    birthPlace: z.string().min(1).max(200).transform(sanitizeString),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    timezone: z.number().min(-12).max(14),
    gender: z.enum(['male', 'female', 'other']),
});

export const LifeEventSchema = z.object({
    id: z.string().optional(),
    category: z.string(), // changed from enum to string to support custom categories
    eventType: z.string().min(1),
    datePrecision: z.enum(['exact_date_time', 'exact_date', 'date_range', 'month_year', 'month_range', 'year_range']),
    eventDate: z.string(),
    endDate: z.string().optional(),
    eventTime: z.string().optional(),
    description: z.string().max(2000).optional(),
    importance: z.enum(['low', 'medium', 'high', 'critical']),
}).passthrough();

export const QueueSubmitSchema = z.object({
    birthData: BirthDataSchema,
    lifeEvents: z.array(LifeEventSchema).min(3, 'At least 3 life events required'),
    offsetConfig: TimeOffsetConfigSchema,
    spouseData: z.any().optional(),
});

// Session creation schema — lifeEvents and offsetConfig are optional for draft creation
export const SessionCreateSchema = z.object({
    birthData: BirthDataSchema,
    lifeEvents: z.array(z.any()).optional(),
    offsetConfig: TimeOffsetConfigSchema.optional(),
    spouseData: z.any().optional(),
});

// ═════════════════════════════════════════════════════════════════════════════
// VALIDATION MIDDLEWARE
// ═════════════════════════════════════════════════════════════════════════════

export function validateBody(schema: z.ZodSchema) {
    return (req: Request, res: Response, next: NextFunction) => {
        try {
            const validated = schema.parse(req.body);
            req.body = validated;
            next();
        } catch (error) {
            if (isZodError(error)) {
                const issues = error.issues.map((i: ZodIssue) => `${i.path.join('.')}: ${i.message}`);
                res.status(400).json({
                    error: 'Validation Error',
                    issues,
                });
                return;
            }
            next(error);
        }
    };
}

export function validateParams(schema: z.ZodSchema) {
    return (req: Request, res: Response, next: NextFunction) => {
        try {
            const validated = schema.parse(req.params);
            req.params = validated as Record<string, string>;
            next();
        } catch (error) {
            if (isZodError(error)) {
                res.status(400).json({
                    error: 'Invalid Parameters',
                    issues: error.issues,
                });
                return;
            }
            next(error);
        }
    };
}

// Type guard helper
function isZodError(error: unknown): error is z.ZodError {
    return error instanceof z.ZodError;
}

// UUID param validator
export const UuidParamSchema = z.object({
    id: z.string().uuid(),
});

// Session update schema for partial updates (BUG-012: added body validation)
export const SessionUpdateSchema = z.object({
    birthData: BirthDataSchema.partial().optional(),
    lifeEvents: z.array(z.any()).optional(),
    spouseData: z.any().optional(),
    offsetConfig: z.any().optional(),
}).passthrough();