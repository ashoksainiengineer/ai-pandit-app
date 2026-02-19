import { Request, Response, NextFunction } from 'express';
import { z, ZodIssue } from 'zod';

// ═════════════════════════════════════════════════════════════════════════════
// VALIDATION SCHEMAS
// ═════════════════════════════════════════════════════════════════════════════

export const TimeOffsetConfigSchema = z.object({
    preset: z.enum(['30min', '1hour', '2hours', '4hours', '6hours', '12hours', 'seconds-30', 'seconds-6']).optional(),
    customMinutes: z.number().min(1).max(720).optional(),
    description: z.string().optional(),
});

export const BirthDataSchema = z.object({
    fullName: z.string().min(1, 'Full name is required').max(100),
    dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
    tentativeTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Time must be HH:MM or HH:MM:SS'),
    birthPlace: z.string().min(1).max(200),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    timezone: z.number().min(-12).max(14),
    gender: z.enum(['male', 'female', 'other']),
});

export const LifeEventSchema = z.object({
    id: z.string().optional(),
    category: z.enum([
        'education', 'career', 'marriage', 'children', 'family',
        'health', 'financial', 'travel', 'spiritual', 'legal',
        'public_life', 'karmic_events', 'identity_shifts', 'other'
    ]),
    eventType: z.string().min(1),
    datePrecision: z.enum(['exact_date_time', 'exact_date', 'date_range', 'month_year', 'month_range', 'year_range']),
    eventDate: z.string(),
    endDate: z.string().optional(),
    eventTime: z.string().optional(),
    description: z.string().max(500).optional(),
    importance: z.enum(['low', 'medium', 'high', 'critical']),
});

export const ForensicTraitsSchema = z.object({
    physical: z.object({
        facialStructure: z.object({
            forehead: z.enum(['broad', 'narrow', 'average', 'sloping']).optional(),
            eyeShape: z.enum(['deep_set', 'prominent', 'almond', 'round', 'small']).optional(),
            noseType: z.enum(['sharp', 'blunt', 'aquiline', 'long', 'small']).optional(),
            noseShape: z.enum(['sharp', 'blunt', 'aquiline', 'long', 'small']).optional(),
            teethAlignment: z.enum(['perfect', 'crooked', 'gap', 'large', 'small']).optional(),
            voicePitch: z.enum(['deep', 'high', 'medium', 'soft', 'raspy']).optional(),
            jawLine: z.enum(['strong', 'soft', 'average', 'angular']).optional(),
        }).passthrough().optional(),
        skinHair: z.object({
            texture: z.enum(['dry', 'oily', 'combination', 'sensitive']).optional(),
            hairType: z.enum(['straight', 'curly', 'wavy', 'thin', 'thick', 'bald']).optional(),
            complexion: z.enum(['very_fair', 'fair', 'medium', 'dark', 'very_dark']).optional(),
            marks: z.array(z.string()).optional(),
        }).passthrough().optional(),
        build: z.enum(['slim', 'medium', 'athletic', 'heavy', 'very_heavy']).optional(),
        height: z.object({
            cm: z.number().min(50).max(250).optional(),
            feet: z.number().min(1).max(8).optional(),
            inches: z.number().min(0).max(11).optional(),
        }).passthrough().optional(),
    }).passthrough().optional(),
    psychographic: z.object({
        speechStyle: z.enum(['fast_loud', 'measured_soft', 'argumentative', 'concise', 'talkative']).optional(),
        decisionMaking: z.enum(['impulsive', 'deliberate', 'indecisive', 'intuitive']).optional(),
        stressResponse: z.enum(['aggressive', 'withdrawn', 'anxious', 'calm']).optional(),
        sleepCycle: z.enum(['night_owl', 'early_bird', 'irregular', 'deep_sleeper']).optional(),
        temperament: z.enum(['short_tempered', 'patient', 'jovial', 'melancholic', 'optimistic']).optional(),
    }).passthrough().optional(),
    biological: z.object({
        prakriti: z.enum(['vata', 'pitta', 'kapha', 'vata-pitta', 'pitta-kapha', 'vata-kapha']).optional(),
        sensitivity: z.object({
            heat: z.enum(['high', 'medium', 'low']).optional(),
            cold: z.enum(['high', 'medium', 'low']).optional(),
        }).passthrough().optional(),
        recurringHealthIssues: z.array(z.string()).optional(),
    }).passthrough().optional(),
    family: z.object({
        siblingPosition: z.enum(['eldest', 'middle', 'youngest', 'only_child']).optional(),
        brotherCount: z.number().min(0).max(20).optional(),
        sisterCount: z.number().min(0).max(20).optional(),
        fatherStatusAtBirth: z.enum(['struggling', 'stable', 'prosperous', 'highly_distinguished']).optional(),
        motherHealthAtBirth: z.enum(['excellent', 'normal', 'weak', 'complicated']).optional(),
        firstChildInfo: z.object({
            gender: z.enum(['male', 'female']),
            yearOfBirth: z.number(),
        }).optional(),
    }).passthrough().optional(),
}).passthrough().optional();

export const QueueSubmitSchema = z.object({
    birthData: BirthDataSchema,
    lifeEvents: z.array(LifeEventSchema).min(3, 'At least 3 life events required'),
    offsetConfig: TimeOffsetConfigSchema,
    forensicTraits: ForensicTraitsSchema.optional(),
    physicalTraits: z.any().optional(), // Legacy
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