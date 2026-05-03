/**
 * 🔱 AI-Pandit Centralized Type Definitions
 * ==========================================
 * Single source of truth for all types used across the backend.
 * Organized by domain for maintainability.
 */

// ═════════════════════════════════════════════════════════════════════════════
// CORE / BASE TYPES
// ═════════════════════════════════════════════════════════════════════════════

import { z } from 'zod';

// ZOD SCHEMAS (co-located with TypeScript interfaces)
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

export type Gender = 'male' | 'female' | 'other';

export type EventCategory =
  | 'education'
  | 'career'
  | 'marriage'
  | 'children'
  | 'family'
  | 'health'
  | 'financial'
  | 'finance'
  | 'travel'
  | 'spiritual'
  | 'legal'
  | 'public_life'
  | 'karmic_events'
  | 'identity_shifts'
  | 'promotion'
  | 'business'
  | 'property'
  | 'relocation'
  | 'accident'
  | 'death_relative'
  | 'divorce'
  | 'surgery'
  | 'inheritance'
  | 'awards'
  | 'other';

export type DatePrecision =
  | 'exact_date_time'
  | 'exact_date'
  | 'date_range'
  | 'month_year'
  | 'month_range'
  | 'year_range';

export type EventImportance = 'low' | 'medium' | 'high' | 'critical';

export type SessionStatus =
  | 'pending'
  | 'queued'
  | 'processing'
  | 'complete'
  | 'failed';

// ═════════════════════════════════════════════════════════════════════════════
// BIRTH DATA TYPES
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Core birth data for rectification
 */
export interface BirthData {
  fullName: string;
  dateOfBirth: string;
  tentativeTime: string;
  birthPlace: string;
  latitude: number;
  longitude: number;
  timezone: number;
  gender: Gender;
}

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
    gender: z.enum(['male', 'female', 'other']),
});

/**
 * Physical traits for forensic matching
 */
export interface PhysicalTraits {
  height?: {
    cm: number;
    feet: number;
    inches: number;
  };
  build: 'slim' | 'medium' | 'athletic' | 'heavy' | 'very_heavy';
  complexion: 'very_fair' | 'fair' | 'medium' | 'dark' | 'very_dark';
  faceShape: 'round' | 'oval' | 'square' | 'long' | 'heart' | 'pear';
  eyeColor: string;
  hairColor: string;
  hairType?: 'straight' | 'curly' | 'wavy' | 'thin' | 'thick';
  prakriti?: 'vata' | 'pitta' | 'kapha' | 'vata-pitta' | 'pitta-kapha' | 'vata-kapha';
  noseType?: 'sharp' | 'blunt' | 'aquiline' | 'long' | 'small';
  specialFeatures?: string;
  overallDescription?: string;
}

// ═════════════════════════════════════════════════════════════════════════════
// FORENSIC TRAITS TYPES
// ═════════════════════════════════════════════════════════════════════════════

export interface FacialStructure {
  forehead: string | 'broad' | 'narrow' | 'average' | 'sloping';
  eyeShape: string | 'deep_set' | 'prominent' | 'almond' | 'round' | 'small';
  noseType: string | 'sharp' | 'blunt' | 'aquiline' | 'long' | 'small';
  noseShape?: string;
  jawLine?: string;
  teethAlignment: string | 'perfect' | 'crooked' | 'gap' | 'large' | 'small';
  voicePitch: string | 'deep' | 'high' | 'medium' | 'soft' | 'raspy';
}

export interface SkinHair {
  texture: 'dry' | 'oily' | 'combination' | 'sensitive';
  hairType: 'straight' | 'curly' | 'wavy' | 'thin' | 'thick' | 'bald';
  complexion: 'very_fair' | 'fair' | 'medium' | 'dark' | 'very_dark';
  marks: string[];
}

/**
 * Psychographic/DNA characteristics
 */
export interface PsychographicDNA {
  speechStyle: 'fast_loud' | 'measured_soft' | 'argumentative' | 'concise' | 'talkative';
  decisionMaking: 'impulsive' | 'deliberate' | 'indecisive' | 'intuitive';
  stressResponse: 'aggressive' | 'withdrawn' | 'anxious' | 'calm';
  sleepCycle: 'night_owl' | 'early_bird' | 'irregular' | 'deep_sleeper';
  temperament: 'short_tempered' | 'patient' | 'jovial' | 'melancholic' | 'optimistic';
}

/**
 * Biological markers (Ayurvedic)
 */
export interface BiologicalMarkers {
  prakriti: 'vata' | 'pitta' | 'kapha' | 'vata-pitta' | 'pitta-kapha' | 'vata-kapha';
  sensitivity: {
    heat: 'high' | 'medium' | 'low';
    cold: 'high' | 'medium' | 'low';
  };
  recurringHealthIssues: string[];
}

export interface FamilyNarrativeMatrix {
  siblingPosition: 'eldest' | 'middle' | 'youngest' | 'only_child';
  brotherCount: number;
  sisterCount: number;
  fatherStatusAtBirth: 'struggling' | 'stable' | 'prosperous' | 'highly_distinguished';
  motherHealthAtBirth: 'excellent' | 'normal' | 'weak' | 'complicated';
  firstChildInfo?: {
    gender: 'male' | 'female';
    yearOfBirth: number;
  };
}

export interface ForensicTraits {
  physical: {
    facialStructure: FacialStructure;
    skinHair: SkinHair;
    build: 'slim' | 'medium' | 'athletic' | 'heavy' | 'very_heavy';
    height: { cm: number; feet: number; inches: number };
  };
  psychographic: PsychographicDNA;
  biological: BiologicalMarkers;
  family: FamilyNarrativeMatrix;
}

// ═════════════════════════════════════════════════════════════════════════════
// LIFE EVENT TYPES
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Life event for rectification
 */
export interface LifeEvent {
  id: string;
  category: EventCategory;
  eventType: string;
  datePrecision: DatePrecision;
  eventDate: string;
  endDate?: string;
  eventTime?: string;
  description: string;
  importance: EventImportance;
  icon?: string;
  color?: string;
  ageAtEvent?: number;
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
    category: z.enum(['education', 'career', 'marriage', 'children', 'family', 'health', 'financial', 'finance', 'travel', 'spiritual', 'legal', 'public_life', 'karmic_events', 'identity_shifts', 'promotion', 'business', 'property', 'relocation', 'accident', 'death_relative', 'divorce', 'surgery', 'inheritance', 'awards', 'other']),
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
}).passthrough().superRefine((event, ctx) => { // passthrough: allows dynamic pipeline fields (icon, color, ageAtEvent, etc.)
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

// ═════════════════════════════════════════════════════════════════════════════
// TIME OFFSET TYPES
// ═════════════════════════════════════════════════════════════════════════════

export type OffsetPreset =
  | '30min'
  | '1hour'
  | '2hours'
  | '4hours'
  | '6hours'
  | '12hours'
  | 'seconds-30'
  | 'seconds-6';

export interface TimeOffsetConfig {
  preset?: OffsetPreset;
  customMinutes?: number;
  description: string;
}

export const OffsetConfigSchema = z.object({
    preset: z.enum(['30min', '1hour', '2hours', '4hours', '6hours', '12hours', 'seconds-30', 'seconds-6']),
    customMinutes: z.number().min(1).max(720).optional(),
    description: z.string(),
});

export interface CandidateTime {
  time: string;
  offsetMinutes: number;
  offsetDescription: string;
  candidateDate?: string;
  dayOffset?: number;
  candidateKey?: string;
  rank?: number;
  batchIndex?: number;
  priority?: number;
}

// ═════════════════════════════════════════════════════════════════════════════
// QUEUE TYPES
// ═════════════════════════════════════════════════════════════════════════════

export type QueueStatus = 'queued' | 'processing' | 'complete' | 'failed';

export interface QueuePosition {
  sessionId: string;
  status: QueueStatus;
  position: number;
  estimatedWaitSeconds: number;
  totalInQueue: number;
  createdAt: string;
  session?: Record<string, unknown>;
}

export interface QueueSubmitResult {
  success: boolean;
  sessionId?: string;
  position?: number;
  estimatedWaitSeconds?: number;
  error?: string;
  errorCode?: 'QUEUE_FULL' | 'RATE_LIMIT_EXCEEDED';
  retryAfterSeconds?: number;
}

export type JobStatus =
  | 'queued'
  | 'running'
  | 'retrying'
  | 'failed'
  | 'completed'
  | 'cancelled';

export const JobStatusSchema = z.enum([
    'queued',
    'running',
    'retrying',
    'failed',
    'completed',
    'cancelled',
]);

export type JobKind = 'btr_rectification';

export const JobKindSchema = z.enum(['btr_rectification']);

export interface JobSummary {
  id: string;
  sessionId: string;
  userId: string;
  kind: JobKind;
  status: JobStatus;
  currentStage?: string | null;
  progressPercent: number;
  attempt: number;
  maxAttempts: number;
  retryCount: number;
  retryReasonCode?: string | null;
  nextRetryAt?: string | null;
  queuedAt: string;
  startedAt?: string | null;
  heartbeatAt?: string | null;
  finishedAt?: string | null;
  cancelRequestedAt?: string | null;
  errorCode?: string | null;
  errorMessage?: string | null;
  createdAt: string;
  updatedAt: string;
}

export const JobSummarySchema = z.object({
    id: z.string().min(1),
    sessionId: z.string().min(1),
    userId: z.string().min(1),
    kind: JobKindSchema,
    status: JobStatusSchema,
    currentStage: z.string().nullable().optional(),
    progressPercent: z.number().int().min(0).max(100),
    attempt: z.number().int().min(0),
    maxAttempts: z.number().int().min(1),
    retryCount: z.number().int().min(0),
    retryReasonCode: z.string().nullable().optional(),
    nextRetryAt: z.string().datetime().nullable().optional(),
    queuedAt: z.string().datetime(),
    startedAt: z.string().datetime().nullable().optional(),
    heartbeatAt: z.string().datetime().nullable().optional(),
    finishedAt: z.string().datetime().nullable().optional(),
    cancelRequestedAt: z.string().datetime().nullable().optional(),
    errorCode: z.string().nullable().optional(),
    errorMessage: z.string().nullable().optional(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
});

export interface JobDetail extends JobSummary {
  version: number;
  result?: Record<string, unknown> | null;
  checkpoint?: Record<string, unknown> | null;
  cursor?: Record<string, unknown> | null;
  sessionStatus?: string | null;
}

export const JobDetailSchema = JobSummarySchema.extend({
    version: z.number().int().min(0),
    result: z.record(z.unknown()).nullable().optional(),
    checkpoint: z.record(z.unknown()).nullable().optional(),
    cursor: z.record(z.unknown()).nullable().optional(),
    sessionStatus: z.string().nullable().optional(),
});

export interface JobEventRecord {
  id: string;
  jobId: string;
  sessionId: string;
  sequenceNo: number;
  eventType: string;
  stage?: string | null;
  payload: Record<string, unknown>;
  createdAt: string;
}

export const JobEventRecordSchema = z.object({
    id: z.string().min(1),
    jobId: z.string().min(1),
    sessionId: z.string().min(1),
    sequenceNo: z.number().int().min(0),
    eventType: z.string().min(1),
    stage: z.string().nullable().optional(),
    payload: z.record(z.unknown()),
    createdAt: z.string().datetime(),
});

export interface JobEventsResponse {
  jobId: string;
  sessionId: string;
  since: number;
  events: JobEventRecord[];
}

export const JobEventsResponseSchema = z.object({
    jobId: z.string().min(1),
    sessionId: z.string().min(1),
    since: z.number().int().min(0),
    events: z.array(JobEventRecordSchema),
});

export interface JobSyncResponse {
  job: JobDetail;
  since: number;
  latestSequenceNo: number;
  events: JobEventRecord[];
  recommendedPollIntervalMs: number;
  replayMode: 'incremental' | 'snapshot';
}

export const JobSyncResponseSchema = z.object({
    job: JobDetailSchema,
    since: z.number().int().min(0),
    latestSequenceNo: z.number().int().min(0),
    events: z.array(JobEventRecordSchema),
    recommendedPollIntervalMs: z.number().int().positive(),
    replayMode: z.enum(['incremental', 'snapshot']),
});

export interface DeadLetterArtifactSummary {
  id: string;
  jobId: string;
  sessionId?: string | null;
  uri: string;
  createdAt: string;
  metadata: Record<string, unknown> | null;
}

export const DeadLetterArtifactSummarySchema = z.object({
    id: z.string().min(1),
    jobId: z.string().min(1),
    sessionId: z.string().nullable().optional(),
    uri: z.string().min(1),
    createdAt: z.string().datetime(),
    metadata: z.record(z.unknown()).nullable(),
});

export interface CreateJobResponse {
  job: JobDetail;
  idempotentReplay: boolean;
}

export const CreateJobResponseSchema = z.object({
    job: JobDetailSchema,
    idempotentReplay: z.boolean(),
});

export interface CancelJobResponse {
  job: JobDetail;
  cancelled: boolean;
}

export const CancelJobResponseSchema = z.object({
    job: JobDetailSchema,
    cancelled: z.boolean(),
});

// ═════════════════════════════════════════════════════════════════════════════
// PROGRESS TRACKING TYPES
// ═════════════════════════════════════════════════════════════════════════════

export interface ProgressStep {
  id: string;
  name: string;
  icon: string;
  status: 'pending' | 'running' | 'complete' | 'error';
  message?: string;
  details?: string[];
  startedAt?: string;
  completedAt?: string;
}

/**
 * AI thinking data for streaming
 */
export interface AIThinkingData {
  stage: number;
  candidateTime?: string;
  chunks: string[];
  fullText: string;
}

export interface AIContextData {
  stage: number;
  candidateTime: string;
  planetaryInfo: {
    ascendant: string;
    sun: string;
    moon: string;
  };
  dasha: string;
  divCharts?: string;
  groundTruth?: Record<string, unknown>;
}

export interface CandidateScore {
  time: string | Date;
  score?: number;
  stage?: number;
  rank?: number;
  batch?: number;
  minifiedEph?: { sun: string; moon: string; ascendant: string };
  fullEph?: Record<string, string>; // 🔱 NEW: High-precision ephemeris payload

  // Advanced God-Tier Properties
  timeString?: string;
  overallScore?: number;
  confidenceLevel?: 'STANDARD_PRECISION' | 'VERY_HIGH' | 'HIGH' | 'MEDIUM' | 'LOW' | string;
  marginOfErrorSeconds?: number;
  methodScores?: Record<string, number>;
  eventMatches?: Array<Record<string, unknown>>;
  transitMatches?: Array<Record<string, unknown>>;
  redFlags?: string[];
  keyEvidence?: string[];
}

export interface ProgressData {
  currentStep: number;
  totalSteps: number;
  percentage: number;
  steps: ProgressStep[];
  lastUpdate: string;
  liveMessage?: string;
  startedAt?: string;
  candidateScores: CandidateScore[];
  lastAIThinking?: AIThinkingData;
  aiContext?: AIContextData;
  stageHistory?: Record<number, string>;
  calculationLogs?: Array<{ candidateTime: string; log: string }>;
  estimatedTimeRemaining?: number;
}

// ═════════════════════════════════════════════════════════════════════════════
// SESSION EVENT TYPES
// ═════════════════════════════════════════════════════════════════════════════

export interface ProgressEvent {
  type: 'progress';
  step: string;
  stepIndex: number;
  totalSteps: number;
  percentage: number;
  message: string;
  details?: string[];
  startedAt?: string;
}

export interface AIThinkingEvent {
  type: 'ai_thinking';
  chunk: string;
  stage: number;
  candidateTime?: string;
}

export interface EphemerisEvent {
  type: 'ephemeris';
  candidateTime: string;
  ascendant: { sign: string; degree: number };
  moonSign: string;
  moonNakshatra: string;
}

export interface CandidateScoreEvent {
  type: 'candidate_score' | 'candidate_score_v2';
  time: string;
  score: number;
  stage: number;
  batch?: number;
  rank?: number;
  minifiedEph?: { sun: string; moon: string; ascendant: string };
  fullEph?: Record<string, string>; // 🔱 NEW: High-precision ephemeris payload
}

export interface CandidateScoresEvent {
  type: 'candidate_scores';
  data: CandidateScoreEvent[];
}

export interface CompleteEvent {
  type: 'complete';
  rectifiedTime: string;
  accuracy: number;
  confidence: string;
}

export interface AIContextEvent {
  type: 'ai_context';
  stage: number;
  candidateTime: string;
  planetaryInfo?: {
    sun: string;
    moon: string;
    ascendant: string;
  };
  dasha?: string;
  divCharts?: string;
  contextHits?: string[];
  round?: number;
  batch?: number;
  totalBatches?: number;
  candidatesInBatch?: number | Array<{
    time: string;
    ascendant?: string;
    moon?: string;
  }>;
  lifeEventsCount?: number;
  hasForensicTraits?: boolean;
}

export interface DecisionEvent {
  type: 'decision';
  stage: number;
  time: string;
  verdict: 'promoted' | 'rejected';
  score: number;
  reason: string;
  batch?: number;
}

export interface CalculationLogEvent {
  type: 'calculation_log';
  logId: string;
  candidateTime: string;
  sunPos: string;
  moonPos: string;
  ascendant: string;
  dashaObj?: string;
}

export interface ErrorEvent {
  type: 'error';
  message: string;
  stage?: string;
}

export interface StageStatsEvent {
  type: 'stage_stats';
  stage: number;
  candidateCount: number;
  description: string;
}

export interface EstimatedTimeEvent {
  type: 'estimated_time';
  seconds: number;
}

/**
 * Union type of all session events
 */
export type SessionEvent =
  | ProgressEvent
  | AIThinkingEvent
  | EphemerisEvent
  | CandidateScoreEvent
  | CandidateScoresEvent
  | CompleteEvent
  | ErrorEvent
  | AIContextEvent
  | CalculationLogEvent
  | StageStatsEvent
  | EstimatedTimeEvent
  | DecisionEvent;

// ═════════════════════════════════════════════════════════════════════════════
// AI CLIENT TYPES
// ═════════════════════════════════════════════════════════════════════════════

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIResponse {
  success: boolean;
  thinking?: string;
  content: string;
  tokensUsed?: number;
  error?: string;
}

// ═════════════════════════════════════════════════════════════════════════════
// EPHEMERIS / ASTROLOGY TYPES
// ═════════════════════════════════════════════════════════════════════════════

export interface ShadbalaBreakdown {
  sthana: number;
  dig: number;
  kaala: number;
  cheshta: number;
  naisargika: number;
  total: number;
}

export interface PlanetPosition {
  sign: string;
  degree: number;
  longitude: number;
  latitude: number;
  nakshatra: string;
  nakshatraPada?: number;
  lord: string;
  retro: boolean;
  speed: number;
  longitudeSpeed?: number;
  distance: number;
  isCombust: boolean;
  dignity: string;
  house: number;
}

export interface HousePosition {
  houseNumber: number;
  sign: string;
  degree: number;
  cusp: number;
  lord: string;
  subLord?: string;
}

export interface DivisionalChart {
  id: string;
  planets: Record<string, PlanetPosition>;
  ascendant: {
    sign: string;
    degree: number;
    longitude: number;
  };
}

export interface EphemerisData {
  planets: {
    sun: PlanetPosition;
    moon: PlanetPosition;
    mercury: PlanetPosition;
    venus: PlanetPosition;
    mars: PlanetPosition;
    jupiter: PlanetPosition;
    saturn: PlanetPosition;
    rahu: PlanetPosition;
    ketu: PlanetPosition;
  };
  ascendant: {
    sign: string;
    degree: number;
    nakshatra: string;
    longitude: number;
    subLord?: string;
  };
  houses: HousePosition[];
  divisionalCharts?: Record<string, DivisionalChart>;
  ashtakavarga?: Record<string, number | number[]>;
  shadbala?: Record<string, ShadbalaBreakdown>;
  kpCusps?: number[];
}

export interface MinifiedEphemeris {
  sun: string;
  moon: string;
  ascendant: string;
}

export type EphemerisAyanamsaMode = 'lahiri';

export type EphemerisHouseSystem = 'whole_sign' | 'equal' | 'placidus';

export type EphemerisNodeMode = 'true' | 'mean';

export type EphemerisServiceBodyName =
  | 'sun'
  | 'moon'
  | 'mercury'
  | 'venus'
  | 'mars'
  | 'jupiter'
  | 'saturn'
  | 'rahu'
  | 'ketu';

export interface EphemerisServiceLocation {
  latitude: number;
  longitude: number;
  altitudeMeters?: number;
}

export const EphemerisServiceLocationSchema = z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    altitudeMeters: z.number().min(-500).max(12000).optional(),
});

export interface EphemerisServiceBaseRequest {
  location: EphemerisServiceLocation;
  ayanamshaMode?: EphemerisAyanamsaMode;
  houseSystem?: EphemerisHouseSystem;
  nodeMode?: EphemerisNodeMode;
}

export const EphemerisServiceBaseRequestSchema = z.object({
    location: EphemerisServiceLocationSchema,
    ayanamshaMode: z.enum(['lahiri']).default('lahiri'),
    houseSystem: z.enum(['whole_sign', 'equal', 'placidus']).default('placidus'),
    nodeMode: z.enum(['true', 'mean']).default('true'),
});

export interface EphemerisServiceSingleRequest extends EphemerisServiceBaseRequest {
  timestampUtc: string;
}

export const EphemerisServiceSingleRequestSchema = EphemerisServiceBaseRequestSchema.extend({
    timestampUtc: z.string().datetime(),
});

export interface EphemerisServiceBatchRequest extends EphemerisServiceBaseRequest {
  timestampsUtc: string[];
}

export const EphemerisServiceBatchRequestSchema = EphemerisServiceBaseRequestSchema.extend({
    timestampsUtc: z.array(z.string().datetime()).min(1).max(500),
});

export interface EphemerisServiceSunriseRequest {
  startTimestampUtc: string;
  endTimestampUtc: string;
  location: EphemerisServiceLocation;
}

export const EphemerisServiceSunriseRequestSchema = z.object({
    startTimestampUtc: z.string().datetime(),
    endTimestampUtc: z.string().datetime(),
    location: EphemerisServiceLocationSchema,
});

export interface EphemerisServicePlanetPosition {
  body: EphemerisServiceBodyName;
  tropicalLongitude: number;
  tropicalLatitude: number;
  siderealLongitude?: number;
  distanceAu: number;
  longitudeSpeed: number;
  latitudeSpeed?: number;
  retrograde: boolean;
}

export const EphemerisServicePlanetPositionSchema = z.object({
    body: z.enum(['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'rahu', 'ketu']),
    tropicalLongitude: z.number(),
    tropicalLatitude: z.number(),
    siderealLongitude: z.number().optional(),
    distanceAu: z.number(),
    longitudeSpeed: z.number(),
    latitudeSpeed: z.number().optional(),
    retrograde: z.boolean(),
});

export interface EphemerisServiceHouses {
  ascendantTropical: number;
  mcTropical: number;
  houseCuspsTropical: number[];
  ascendantSidereal?: number;
  houseCuspsSidereal?: number[];
}

export const EphemerisServiceHousesSchema = z.object({
    ascendantTropical: z.number(),
    mcTropical: z.number(),
    houseCuspsTropical: z.array(z.number()).length(12),
    ascendantSidereal: z.number().optional(),
    houseCuspsSidereal: z.array(z.number()).length(12).optional(),
});

export interface EphemerisServiceChartResponse {
  timestampUtc: string;
  julianDayUt: number;
  julianDayTt: number;
  ayanamsha: number;
  planets: EphemerisServicePlanetPosition[];
  houses: EphemerisServiceHouses;
}

export const EphemerisServiceChartResponseSchema = z.object({
    timestampUtc: z.string().datetime(),
    julianDayUt: z.number(),
    julianDayTt: z.number(),
    ayanamsha: z.number(),
    planets: z.array(EphemerisServicePlanetPositionSchema),
    houses: EphemerisServiceHousesSchema,
});

export interface EphemerisServiceBatchResponse {
  charts: EphemerisServiceChartResponse[];
}

export const EphemerisServiceBatchResponseSchema = z.object({
    charts: z.array(EphemerisServiceChartResponseSchema),
});

export interface EphemerisServiceSunriseResponse {
  sunriseTimestampUtc: string | null;
}

export const EphemerisServiceSunriseResponseSchema = z.object({
    sunriseTimestampUtc: z.string().datetime().nullable(),
});

export interface EphemerisServiceHealthResponse {
  service: 'ephemeris';
  status: 'healthy' | 'degraded' | 'unhealthy';
  ready: boolean;
  kernelLoaded: boolean;
  kernelFile: string;
  timestamp: string;
  version: string;
  error?: string | null;
}

export const EphemerisServiceHealthResponseSchema = z.object({
    service: z.literal('ephemeris'),
    status: z.enum(['healthy', 'degraded', 'unhealthy']),
    ready: z.boolean(),
    kernelLoaded: z.boolean(),
    kernelFile: z.string(),
    timestamp: z.string().datetime(),
    version: z.string(),
    error: z.string().nullable().optional(),
});

// ═════════════════════════════════════════════════════════════════════════════
// KP (KRISHNAMURTI PADDHATI) TYPES
// ═════════════════════════════════════════════════════════════════════════════

/**
 * KP Sub-lord data
 */
export interface KPSubLordData {
  readonly starLord: string;
  readonly subLord: string;
  readonly subSubLord: string;
  readonly subSubSubLord: string;
  readonly subSpan: number;
  readonly positionInSub: number;
}

/**
 * KP Cuspal data
 */
export interface KPCuspalData {
  readonly house: number;
  readonly cusp: number;
  readonly sign: string;
  readonly starLord: string;
  readonly subLord: string;
  readonly subSubLord: string;
}

/**
 * KP Event correlation
 */
export interface KPEventCorrelation {
  readonly eventId: string;
  readonly eventDate: Date;
  readonly dashaLord: string;
  readonly dashaLordAsCuspalSubLord: boolean;
  readonly dashaLordAsStarLord: boolean;
  readonly correlationScore: number;
  readonly timingPrecision: 'exact' | 'close' | 'approximate';
}

// ═════════════════════════════════════════════════════════════════════════════
// CONSENSUS ENGINE TYPES
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Consensus scores from all validation methods
 */
export interface ConsensusScores {
  vimshottari: number;
  yogini: number;
  chara: number;
  kalachakra: number;
  kp: number;
  ashtakavarga: number;
  varga: number;
  transit: number;
  forensic: number;
  ai: number;
  nadi?: number;
  prana?: number;
}

export interface ValidationDetail {
  method: string;
  score: number;
  maxScore: number;
  status: 'pass' | 'warning' | 'fail';
  details: string;
  criticalFindings: string[];
}

export interface RedFlags {
  sandhiBirth: boolean;
  gandanta: boolean;
  dashaSandhi: boolean;
  conflictingMethods: boolean;
  weakSignificators: boolean;
  d60Instability: boolean;
  forensicMismatch: boolean;
}

export interface ConsensusResult {
  scores: ConsensusScores;
  overallConsensus: number;
  confidenceLevel: 'STANDARD_PRECISION' | 'VERY_HIGH' | 'HIGH' | 'MEDIUM' | 'LOW';
  marginOfError: number;
  validationDetails: ValidationDetail[];
  redFlags: RedFlags;
  keyEvidence: string[];
  recommendations: string[];
  validatedAt: Date;
}

export interface ValidationInput {
  candidate: {
    time: string;
    ephemeris: EphemerisData;
    dasha: Record<string, unknown>;
    vargas: Record<string, unknown>;
    kpData: Record<string, unknown>;
    aiScore?: number;
    birthDate?: string;
  };
  events: LifeEvent[];
  forensicProfile: ForensicTraits;
  tentativeTime: string;
}

// ═════════════════════════════════════════════════════════════════════════════
// PRECISION BTR TYPES
// ═════════════════════════════════════════════════════════════════════════════

export interface PrecisionEnhancement {
  kpSubLords: Record<string, {
    starLord: string;
    subLord: string;
    subSubLord: string;
    subSubSubLord: string;
  }>;
  cuspalSubLords: Record<number, {
    house: number;
    cusp: number;
    sign: string;
    starLord: string;
    subLord: string;
    subSubLord: string;
  }>;
  consensus: ConsensusResult;
  isPrecisionStandard: boolean;
  recommendedPrecision: 'seconds' | 'sub-seconds' | 'minutes';
}

export interface CandidateWithPrecisionData {
  time: string;
  offsetMinutes: number;
  ephemeris: EphemerisData;
  dasha: Record<string, unknown>;
  vargas: Record<string, unknown>;
  kpData: Record<string, unknown>;
  precision?: PrecisionEnhancement;
}

// ═════════════════════════════════════════════════════════════════════════════
// BTR INPUT/OUTPUT TYPES
// ═════════════════════════════════════════════════════════════════════════════

export interface BTRInput {
  birthDate: string;
  timeEstimate: string;
  offsetConfig: TimeOffsetConfig;
  lifeEvents: LifeEvent[];
  latitude: number;
  longitude: number;
  timezone: number;
  physicalTraits?: PhysicalTraits;
}

export interface CandidateAnalysis {
  time: string;
  offsetMinutes: number;
  offsetDescription: string;
  ephemerisData: EphemerisData;
  quickScore: number;
  eventMatches: number;
  shouldAnalyzeWithAI: boolean;
  reason: string;
  metadata?: {
    isTentativeOrNeighbor?: boolean;
    d60Stability?: Record<string, unknown>;
    protected?: boolean;
    [key: string]: unknown | boolean | undefined;
  };
}

export interface RankedCandidates {
  topCandidates: CandidateAnalysis[];
  allCandidates: CandidateAnalysis[];
  totalAnalyzed: number;
}

export interface AIAnalysisResult {
  time: string;
  offsetMinutes: number;
  offsetDescription: string;
  score: number;
  confidence: 'High' | 'Medium' | 'Low';
  analysis: string;
  thinking: string;
  eventMatches: {
    eventType: string;
    matches: boolean;
    reason: string;
  }[];
  recommendation: string;
  dashaAnalysis: string;
  transitAnalysis: string;
}

export interface TopCandidatesAnalysis {
  candidates: AIAnalysisResult[];
  topRecommendation: AIAnalysisResult;
  alternativeOptions: AIAnalysisResult[];
  processingTime: number;
}

export interface BTROutput {
  rectifiedTime: string;
  accuracy: number;
  confidence: 'High' | 'Medium' | 'Low';
  processingTime: number;
  analysis: {
    eventAnalysis: Array<{
      eventDate: string;
      expectedPlanets: string[];
      actualPlanets: string[];
      matchScore: number;
    }>;
    alternativeTimes: Array<{ time: string; score: number }>;
    weakPoints: string[];
    recommendations: string[];
  };
  thinking?: string;
  ephemeris?: EphemerisData;
}

// ═════════════════════════════════════════════════════════════════════════════
// SECONDS PRECISION BTR TYPES
// ═════════════════════════════════════════════════════════════════════════════

export interface SecondsPrecisionInput {
  sessionId: string;
  dateOfBirth: string;
  tentativeTime: string;
  latitude: number;
  longitude: number;
  timezone: string | number;
  lifeEvents: LifeEvent[];
  offsetConfig: TimeOffsetConfig;
  physicalTraits?: PhysicalTraits;
  forensicTraits: ForensicTraits;
  spouseData?: {
    dateOfBirth: string;
    birthTime: string;
    latitude: number;
    longitude: number;
    timezone: string | number;
  };
  abortSignal?: AbortSignal;
}

export interface SecondsPrecisionResult {
  rectifiedTime: string;
  accuracy: number;
  confidence: string;
  precisionLevel: 'seconds';
  marginOfError: number;
  stagesCompleted: number;
  boundaryWarnings: string[];
  methodsUsed: string[];
  processingTimeMs: number;
  analysisResult: {
    summary: string;
    finalCandidate: {
      time: string;
      score: number;
      thinking: string;
    };
    alternatives: Array<{ time: string; score: number }>;
    stageHistory: Record<number, { candidatesIn: number; candidatesOut: number }>;
  };
  narrativeManifest?: {
    birthContext: string;
    technicalHighlight: string;
    spiritualSummary: string;
  };
}

export interface BoundarySafetyResult {
  isSafe: boolean;
  warnings: BoundaryWarning[];
  nakshatraDistance: number;
  lagnaDistance: number;
  houseDistance: number;
  overallRisk: 'low' | 'medium' | 'high';
  recommendations: string[];
}

export interface BoundaryWarning {
  type: 'nakshatra' | 'lagna' | 'house' | 'dasha';
  message: string;
  distanceSeconds: number;
  severity: 'low' | 'medium' | 'high';
}

// ═════════════════════════════════════════════════════════════════════════════
// SESSION / DATABASE TYPES
// ═════════════════════════════════════════════════════════════════════════════

export interface RectificationSession {
  id: string;
  userId: string;
  clerkId: string;
  fullName: string;
  dateOfBirth: string;
  tentativeTime: string;
  birthPlace: string;
  latitude: number;
  longitude: number;
  timezone: string | number;
  gender?: string;
  physicalTraits?: PhysicalTraits;
  lifeEvents: LifeEvent[];
  offsetConfig?: TimeOffsetConfig;
  rectifiedTime?: string;
  accuracy?: number;
  confidence?: string;
  analysisResult?: unknown;
  progressData?: string;
  status: SessionStatus;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface MasterAnalysisArchive {
  version: string;
  sessionId: string;
  generatedAt: string;
  birthContext: {
    name: string;
    originalTime: string;
    location: string;
    offsetScan: string;
  };
  finalResult: {
    time: string;
    accuracy: number;
    confidence: string;
    marginOfError: number;
    methodsUsed: string[];
  };
  reasoning: {
    discovery: string;
    refinement: string;
    precision: string;
    summary: string;
  };
  technicalProof: {
    ephemeris: EphemerisData;
    boundarySafety: {
      nakshatra: { distance: number; warning?: string };
      lagna: { distance: number; warning?: string };
      dasha: { distance: number; warning?: string };
    };
    methodologyBreakdown: {
      [key: string]: { score: number; verdict: string; details?: string };
    };
    contextualCorrelation?: number;
  };
  alternatives: Array<{
    time: string;
    score: number;
    reason: string;
  }>;
}

// ═════════════════════════════════════════════════════════════════════════════
// API / REQUEST TYPES
// ═════════════════════════════════════════════════════════════════════════════

export interface CalculateRequest {
  birthData: BirthData;
  lifeEvents: LifeEvent[];
  physicalTraits?: PhysicalTraits;
  forensicTraits?: ForensicTraits;
  offsetConfig: TimeOffsetConfig;
}

export const CalculateRequestSchema = z.object({
    birthData: BirthDataSchema,
    lifeEvents: z.array(LifeEventSchema)
        .min(3, "At least 3 life events are required")
        .max(100, "Maximum 100 life events allowed"),
    physicalTraits: z.record(z.unknown()).optional().nullable(),
    forensicTraits: z.record(z.unknown()).optional().nullable(),
    offsetConfig: OffsetConfigSchema,
});

export interface CalculateResponse {
  success: boolean;
  data?: {
    sessionId: string;
    position: number;
    estimatedWaitSeconds: number;
    status: string;
  };
  error?: string;
}

// ═════════════════════════════════════════════════════════════════════════════
// EVENT CONSTANTS
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Event types by category
 */
export const EVENT_TYPES: Record<EventCategory, string[]> = {
  education: ['School admission', 'College admission', 'Graduation', 'Higher studies'],
  career: ['Job start', 'Job change', 'Promotion', 'Business start'],
  marriage: ['Engagement', 'Wedding', 'Divorce'],
  children: ['Pregnancy', 'Birth', 'Adoption'],
  family: ['Parent death', 'Sibling birth', 'Family event'],
  health: ['Major illness', 'Surgery', 'Recovery', 'Accident'],
  financial: ['Money gain', 'Property purchase', 'Business deal'],
  finance: ['Money gain', 'Property purchase', 'Business deal'],
  travel: ['Long journey', 'Relocation', 'International travel'],
  spiritual: ['Spiritual awakening', 'Meditation retreat', 'Religious event'],
  legal: ['Court case started', 'Legal win', 'Court verdict'],
  public_life: ['Award', 'Fame spike', 'Public recognition'],
  karmic_events: ['Sudden windfall', 'Natural disaster', 'Pet loss'],
  identity_shifts: ['Weight transform', 'Nickname change', 'Appearance shift'],
  promotion: ['Promotion', 'Role expansion', 'Recognition'],
  business: ['Business launch', 'Partnership', 'Major deal'],
  property: ['Property purchase', 'House move', 'Land acquisition'],
  relocation: ['City move', 'Country move', 'Permanent relocation'],
  accident: ['Accident', 'Emergency injury', 'Near-miss'],
  death_relative: ['Parent death', 'Relative death', 'Family bereavement'],
  divorce: ['Separation', 'Divorce filing', 'Divorce finalization'],
  surgery: ['Surgery', 'Procedure', 'Hospital admission'],
  inheritance: ['Inheritance received', 'Estate settlement', 'Will dispute'],
  awards: ['Award', 'Prize', 'Public recognition'],
  other: ['Custom event'],
};

// ═════════════════════════════════════════════════════════════════════════════
// LEGACY EXPORTS (for backward compatibility during refactoring)
// ═════════════════════════════════════════════════════════════════════════════

/** @deprecated Use PlanetPosition directly */
export type _PlanetPosition = PlanetPosition;

/** @deprecated Use LifeEvent directly */
export type _LifeEvent = LifeEvent;

// ═════════════════════════════════════════════════════════════════════════════