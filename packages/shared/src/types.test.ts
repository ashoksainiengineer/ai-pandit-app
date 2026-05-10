import { describe, it, expect } from 'vitest';
import type {
  BirthData,
  Gender,
  EventCategory,
  DatePrecision,
  EventImportance,
  SessionStatus,
  LifeEvent,
  RectificationSession,
  JobStatus,
  JobKind,
  QueueStatus,
  ValidationInput,
  BTRInput,
  BTROutput,
  OffsetPreset,
} from './types.js';
import {
  BirthDataSchema,
  LifeEventSchema,
  CalculateRequestSchema,
  OffsetConfigSchema,
  JobSummarySchema,
  JobDetailSchema,
  JobStatusSchema,
  JobKindSchema,
  JobEventRecordSchema,
  JobEventsResponseSchema,
  JobSyncResponseSchema,
  CreateJobResponseSchema,
  CancelJobResponseSchema,
  DeadLetterArtifactSummarySchema,
  EphemerisServiceLocationSchema,
  EphemerisServiceBaseRequestSchema,
  EphemerisServiceSingleRequestSchema,
  EphemerisServiceBatchRequestSchema,
  EphemerisServiceSunriseRequestSchema,
  EphemerisServicePlanetPositionSchema,
  EphemerisServiceHousesSchema,
  EphemerisServiceChartResponseSchema,
  EphemerisServiceBatchResponseSchema,
  EphemerisServiceSunriseResponseSchema,
  EphemerisServiceHealthResponseSchema,
} from './types.js';

// ─── factories ───────────────────────────────────────────────────────────────

const validBirthData = (overrides: Partial<BirthData> = {}): BirthData => ({
  fullName: 'Test Person',
  dateOfBirth: '1990-01-15',
  tentativeTime: '12:30:00',
  birthPlace: 'New Delhi, India',
  latitude: 28.6139,
  longitude: 77.209,
  timezone: 5.5,
  gender: 'male',
  ...overrides,
});

const validLifeEvent = (overrides: Partial<LifeEvent> = {}): LifeEvent => ({
  id: 'evt_test_1',
  eventType: 'Wedding',
  category: 'marriage',
  eventDate: '2010-05-15',
  datePrecision: 'exact_date',
  description: 'Got married',
  importance: 'high',
  ...overrides,
});

// ═══════════════════════════════════════════════════════════════════════════════
// Gender
// ═══════════════════════════════════════════════════════════════════════════════

describe('Gender', () => {
  it('accepts valid gender values', () => {
    const m: Gender = 'male';
    const f: Gender = 'female';
    const o: Gender = 'other';
    expect(m).toBe('male');
    expect(f).toBe('female');
    expect(o).toBe('other');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// EventCategory
// ═══════════════════════════════════════════════════════════════════════════════

describe('EventCategory', () => {
  it('includes all expected categories', () => {
    const categories: EventCategory[] = [
      'education', 'career', 'marriage', 'children', 'family',
      'health', 'financial', 'finance', 'travel', 'spiritual',
      'legal', 'public_life', 'karmic_events', 'identity_shifts',
      'promotion', 'business', 'property', 'relocation', 'accident',
      'death_relative', 'divorce', 'surgery', 'inheritance', 'awards', 'other',
    ];
    expect(categories).toHaveLength(25);
    expect(categories).toContain('marriage');
    expect(categories).toContain('career');
    expect(categories).toContain('other');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// DatePrecision
// ═══════════════════════════════════════════════════════════════════════════════

describe('DatePrecision', () => {
  it('includes all precision levels', () => {
    const levels: DatePrecision[] = [
      'exact_date_time', 'exact_date', 'date_range',
      'month_year', 'month_range', 'year_range',
    ];
    expect(levels).toHaveLength(6);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// EventImportance
// ═══════════════════════════════════════════════════════════════════════════════

describe('EventImportance', () => {
  it('has four importance levels', () => {
    const levels: EventImportance[] = ['low', 'medium', 'high', 'critical'];
    expect(levels).toHaveLength(4);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// SessionStatus
// ═══════════════════════════════════════════════════════════════════════════════

describe('SessionStatus', () => {
  it('has exactly five valid status values (no cancelled, no completed)', () => {
    const statuses: SessionStatus[] = [
      'pending', 'queued', 'processing', 'complete', 'failed',
    ];
    expect(statuses).toHaveLength(5);
    expect(statuses).toContain('pending');
    expect(statuses).toContain('queued');
    expect(statuses).toContain('processing');
    expect(statuses).toContain('complete');
    expect(statuses).toContain('failed');
    // @ts-expect-error — 'completed' is not a valid SessionStatus
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _bad1: SessionStatus = 'completed';
    // 'cancelled' is now a valid SessionStatus — test removed
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// BirthData & BirthDataSchema
// ═══════════════════════════════════════════════════════════════════════════════

describe('BirthData', () => {
  describe('interface shape', () => {
    it('accepts valid birth data with all fields', () => {
      const bd: BirthData = validBirthData();
      expect(bd.fullName).toBe('Test Person');
      expect(bd.dateOfBirth).toBe('1990-01-15');
      expect(bd.tentativeTime).toBe('12:30:00');
      expect(bd.birthPlace).toBe('New Delhi, India');
      expect(bd.latitude).toBe(28.6139);
      expect(bd.longitude).toBe(77.209);
      expect(bd.timezone).toBe(5.5);
      expect(bd.gender).toBe('male');
    });
  });

  describe('BirthDataSchema.parse', () => {
    it('parses a fully valid payload', () => {
      const result = BirthDataSchema.parse(validBirthData());
      expect(result.fullName).toBe('Test Person');
      expect(result.timezone).toBe(5.5);
    });

    it('applies sanitizeString to fullName — strips script tags and inner content', () => {
      const result = BirthDataSchema.parse(
        validBirthData({ fullName: '<script>alert(1)</script> John' }),
      );
      expect(result.fullName).toBe('John');
    });

    it('applies sanitizeString to birthPlace', () => {
      const result = BirthDataSchema.parse(
        validBirthData({ birthPlace: '  <script>hack</script>  Mumbai  ' }),
      );
      expect(result.birthPlace).toBe('Mumbai');
    });

    it('rejects missing gender', () => {
      const res = BirthDataSchema.safeParse(
        validBirthData({ gender: undefined } as unknown as BirthData),
      );
      expect(res.success).toBe(false);
    });

    it('accepts valid gender values', () => {
      const withGender = BirthDataSchema.parse(validBirthData({ gender: 'female' }));
      expect(withGender.gender).toBe('female');
  });

  });

  describe('BirthDataSchema.safeParse — validation', () => {
    it('rejects empty fullName', () => {
      const res = BirthDataSchema.safeParse(validBirthData({ fullName: '' }));
      expect(res.success).toBe(false);
      if (!res.success) {
        const paths = res.error.issues.map((i) => i.path[0]);
        expect(paths).toContain('fullName');
      }
    });

    it('rejects invalid dateOfBirth format', () => {
      const res = BirthDataSchema.safeParse(
        validBirthData({ dateOfBirth: '15-01-1990' }),
      );
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.issues[0].path[0]).toBe('dateOfBirth');
      }
    });

    it('rejects invalid tentativeTime format', () => {
      const res = BirthDataSchema.safeParse(
        validBirthData({ tentativeTime: '12:30 PM' }),
      );
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.issues[0].path[0]).toBe('tentativeTime');
      }
    });

    it('rejects latitude out of range', () => {
      const res = BirthDataSchema.safeParse(validBirthData({ latitude: 91 }));
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.issues[0].path[0]).toBe('latitude');
      }
    });

    it('rejects longitude out of range', () => {
      const res = BirthDataSchema.safeParse(validBirthData({ longitude: -181 }));
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.issues[0].path[0]).toBe('longitude');
      }
    });

    it('rejects timezone out of range', () => {
      const res = BirthDataSchema.safeParse(validBirthData({ timezone: 15 }));
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.issues[0].path[0]).toBe('timezone');
      }
    });

    it('rejects invalid gender enum value', () => {
      const res = BirthDataSchema.safeParse(
        validBirthData({ gender: 'unknown' as Gender }),
      );
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.issues[0].path[0]).toBe('gender');
      }
    });

    it('rejects missing required field (fullName)', () => {
      const { fullName, ...rest } = validBirthData();
      const res = BirthDataSchema.safeParse(rest);
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.issues[0].path[0]).toBe('fullName');
      }
    });

    it('rejects wrong type for timezone (string instead of number)', () => {
      const res = BirthDataSchema.safeParse(
        validBirthData({ timezone: 'Asia/Kolkata' as unknown as number }),
      );
      expect(res.success).toBe(false);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// LifeEvent & LifeEventSchema
// ═══════════════════════════════════════════════════════════════════════════════

describe('LifeEvent', () => {
  describe('interface shape', () => {
    it('accepts a minimum valid event', () => {
      const ev: LifeEvent = {
        id: 'evt_test_1',
        eventType: 'Job start',
        category: 'career',
        eventDate: '2020-03-01',
        datePrecision: 'exact_date',
        description: 'Started new job',
        importance: 'medium',
      };
      expect(ev.eventType).toBe('Job start');
      expect(ev.category).toBe('career');
      expect(ev.eventDate).toBe('2020-03-01');
      expect(ev.datePrecision).toBe('exact_date');
    });

    it('accepts optional fields', () => {
      const ev: LifeEvent = {
        id: 'evt_abc123',
        eventType: 'Graduation',
        category: 'education',
        eventDate: '2014-06-01',
        datePrecision: 'exact_date',
        eventTime: '10:00:00',
        endDate: '2018-06-01',
        description: 'Completed degree',
        importance: 'high',
        icon: '🎓',
        color: '#FF0000',
        ageAtEvent: 24,
      };
      expect(ev.id).toBe('evt_abc123');
      expect(ev.eventTime).toBe('10:00:00');
      expect(ev.endDate).toBe('2018-06-01');
      expect(ev.icon).toBe('🎓');
      expect(ev.ageAtEvent).toBe(24);
    });

    it('supports month_year precision', () => {
      const ev: LifeEvent = {
        id: 'evt_test_1',
        eventType: 'Promotion',
        category: 'career',
        eventDate: '2022-06',
        datePrecision: 'month_year',
        description: 'Promoted to senior',
        importance: 'high',
      };
      expect(ev.datePrecision).toBe('month_year');
      expect(ev.eventDate).toBe('2022-06');
    });

    it('supports year_range precision with endDate', () => {
      const ev: LifeEvent = {
        id: 'evt_test_1',
        eventType: 'University',
        category: 'education',
        eventDate: '2014',
        endDate: '2018',
        datePrecision: 'year_range',
        description: 'Undergrad years',
        importance: 'medium',
      };
      expect(ev.datePrecision).toBe('year_range');
      expect(ev.endDate).toBe('2018');
    });
  });

  describe('LifeEventSchema.parse', () => {
    it('parses a complete valid event', () => {
      const result = LifeEventSchema.parse(
        validLifeEvent({ id: 'evt_test01', eventTime: '10:00' }),
      );
      expect(result.eventType).toBe('Wedding');
      expect(result.category).toBe('marriage');
      expect(result.importance).toBe('high');
    });

    it('strips script tags from eventType via sanitizeString', () => {
      const result = LifeEventSchema.parse(
        validLifeEvent({ eventType: '<script>xss</script>Wedding' }),
      );
      expect(result.eventType).toBe('Wedding');
    });

    it('defaults importance to medium when omitted', () => {
      const { importance, ...rest } = validLifeEvent();
      const result = LifeEventSchema.parse(rest);
      expect(result.importance).toBe('medium');
    });

    it('generates id when omitted (optional)', () => {
      const { id, ...rest } = validLifeEvent();
      const result = LifeEventSchema.parse(rest);
      expect(result.id).toBeUndefined();
    });

    it('allows passthrough of unknown keys', () => {
      const result = LifeEventSchema.parse({
        ...validLifeEvent(),
        customField: 'extra',
      });
      expect((result as Record<string, unknown>).customField).toBe('extra');
    });
  });

  describe('LifeEventSchema.safeParse — validation', () => {
    it('rejects missing eventType', () => {
      const { eventType, ...rest } = validLifeEvent();
      const res = LifeEventSchema.safeParse(rest);
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.issues[0].path[0]).toBe('eventType');
      }
    });

    it('rejects missing eventDate', () => {
      const { eventDate, ...rest } = validLifeEvent();
      const res = LifeEventSchema.safeParse(rest);
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.issues[0].path[0]).toBe('eventDate');
      }
    });

    it('rejects missing datePrecision', () => {
      const { datePrecision, ...rest } = validLifeEvent();
      const res = LifeEventSchema.safeParse(rest);
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.issues[0].path[0]).toBe('datePrecision');
      }
    });

    it('rejects invalid datePrecision value', () => {
      const res = LifeEventSchema.safeParse(
        validLifeEvent({ datePrecision: 'unknown' as DatePrecision }),
      );
      expect(res.success).toBe(false);
    });

    it('requires eventTime when datePrecision is exact_date_time', () => {
      const res = LifeEventSchema.safeParse(
        validLifeEvent({ datePrecision: 'exact_date_time', eventTime: undefined }),
      );
      expect(res.success).toBe(false);
      if (!res.success) {
        const timeIssue = res.error.issues.find((i) => i.path[0] === 'eventTime');
        expect(timeIssue).toBeDefined();
      }
    });

    it('accepts exact_date_time when eventTime is provided', () => {
      const res = LifeEventSchema.safeParse(
        validLifeEvent({
          datePrecision: 'exact_date_time',
          eventTime: '14:30:00',
        }),
      );
      expect(res.success).toBe(true);
    });

    it('rejects exact_date with bad date format', () => {
      const res = LifeEventSchema.safeParse(
        validLifeEvent({ datePrecision: 'exact_date', eventDate: 'not-a-date' }),
      );
      expect(res.success).toBe(false);
    });

    it('rejects date_range with bad endDate format', () => {
      const res = LifeEventSchema.safeParse(
        validLifeEvent({
          datePrecision: 'date_range',
          eventDate: '2020-01-01',
          endDate: 'bad-date',
        }),
      );
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.issues.some((i) => i.path[0] === 'endDate')).toBe(true);
      }
    });

    it('rejects month_year with invalid month format', () => {
      const res = LifeEventSchema.safeParse(
        validLifeEvent({ datePrecision: 'month_year', eventDate: 'not-a-month' }),
      );
      expect(res.success).toBe(false);
    });

    it('rejects year_range with invalid year format', () => {
      const res = LifeEventSchema.safeParse(
        validLifeEvent({ datePrecision: 'year_range', eventDate: 'not-a-year' }),
      );
      expect(res.success).toBe(false);
    });

    it('rejects endDate before eventDate in date_range', () => {
      const res = LifeEventSchema.safeParse(
        validLifeEvent({
          datePrecision: 'date_range',
          eventDate: '2020-06-01',
          endDate: '2020-01-01',
        }),
      );
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.issues.some((i) => i.path[0] === 'endDate')).toBe(true);
      }
    });

    it('accepts date_range with valid endDate after startDate', () => {
      const res = LifeEventSchema.safeParse(
        validLifeEvent({
          datePrecision: 'date_range',
          eventDate: '2020-01-01',
          endDate: '2020-12-31',
        }),
      );
      expect(res.success).toBe(true);
    });

    it('allows null for optional fields', () => {
      const res = LifeEventSchema.safeParse(
        validLifeEvent({ description: undefined, endDate: undefined, eventTime: undefined }),
      );
      expect(res.success).toBe(true);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// CalculateRequestSchema
// ═══════════════════════════════════════════════════════════════════════════════

describe('CalculateRequestSchema', () => {
  const validRequest = () => ({
    birthData: validBirthData(),
    lifeEvents: [
      validLifeEvent({ id: 'evt_1', eventDate: '2010-05-15' }),
      validLifeEvent({ id: 'evt_2', eventDate: '2015-03-20' }),
      validLifeEvent({ id: 'evt_3', eventDate: '2020-08-10' }),
    ],
    offsetConfig: {
      preset: '30min' as const,
      customMinutes: 15,
      description: 'test offset',
    },
  });

  it('parses a valid calculate request', () => {
    const result = CalculateRequestSchema.parse(validRequest());
    expect(result.birthData.fullName).toBe('Test Person');
    expect(result.lifeEvents).toHaveLength(3);
  });

  it('rejects fewer than 3 life events', () => {
    const req = {
      ...validRequest(),
      lifeEvents: [validLifeEvent({ id: 'evt_1', eventDate: '2010-05-15' })],
    };
    const res = CalculateRequestSchema.safeParse(req);
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error.issues[0].path[0]).toBe('lifeEvents');
    }
  });

  it('rejects more than 100 life events', () => {
    const hundredOne = Array.from({ length: 101 }, (_, i) =>
      validLifeEvent({ id: `evt_${i}`, eventDate: '2010-05-15' }),
    );
    const res = CalculateRequestSchema.safeParse({
      ...validRequest(),
      lifeEvents: hundredOne,
    });
    expect(res.success).toBe(false);
  });

  });

// ═══════════════════════════════════════════════════════════════════════════════
// OffsetConfigSchema
// ═══════════════════════════════════════════════════════════════════════════════

describe('OffsetConfigSchema', () => {
  it('parses a valid offset config', () => {
    const result = OffsetConfigSchema.parse({
      preset: '1hour',
      customMinutes: 30,
      description: 'test',
    });
    expect(result.preset).toBe('1hour');
    expect(result.customMinutes).toBe(30);
  });

  it('requires description', () => {
    const res = OffsetConfigSchema.safeParse({ preset: '30min' });
    expect(res.success).toBe(false);
  });

  it('rejects invalid preset', () => {
    const res = OffsetConfigSchema.safeParse({ preset: '5hours' });
    expect(res.success).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// JobStatus & JobStatusSchema
// ═══════════════════════════════════════════════════════════════════════════════

describe('JobStatus', () => {
  it('has six valid statuses', () => {
    const statuses: JobStatus[] = [
      'queued', 'running', 'retrying', 'failed', 'completed', 'cancelled',
    ];
    expect(statuses).toHaveLength(6);
  });

  it('JobStatusSchema parses valid statuses', () => {
    expect(JobStatusSchema.parse('queued')).toBe('queued');
    expect(JobStatusSchema.parse('completed')).toBe('completed');
    expect(JobStatusSchema.parse('cancelled')).toBe('cancelled');
  });

  it('JobStatusSchema rejects invalid', () => {
    expect(JobStatusSchema.safeParse('pending').success).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// JobKind
// ═══════════════════════════════════════════════════════════════════════════════

describe('JobKind', () => {
  it('has only btr_rectification', () => {
    const kind: JobKind = 'btr_rectification';
    expect(kind).toBe('btr_rectification');
    expect(JobKindSchema.parse('btr_rectification')).toBe('btr_rectification');
    expect(JobKindSchema.safeParse('other').success).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// JobSummarySchema
// ═══════════════════════════════════════════════════════════════════════════════

describe('JobSummarySchema', () => {
  const validJobSummary = () => ({
    id: 'job_001',
    sessionId: 'ses_001',
    userId: 'usr_001',
    kind: 'btr_rectification' as const,
    status: 'queued' as const,
    progressPercent: 0,
    attempt: 0,
    maxAttempts: 3,
    retryCount: 0,
    queuedAt: '2025-01-01T00:00:00.000Z',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
  });

  it('parses valid job summary', () => {
    const result = JobSummarySchema.parse(validJobSummary());
    expect(result.id).toBe('job_001');
    expect(result.status).toBe('queued');
  });

  it('rejects negative progressPercent', () => {
    const res = JobSummarySchema.safeParse({
      ...validJobSummary(),
      progressPercent: -1,
    });
    expect(res.success).toBe(false);
  });

  it('rejects progressPercent > 100', () => {
    const res = JobSummarySchema.safeParse({
      ...validJobSummary(),
      progressPercent: 101,
    });
    expect(res.success).toBe(false);
  });

  it('rejects empty id', () => {
    const res = JobSummarySchema.safeParse({ ...validJobSummary(), id: '' });
    expect(res.success).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// JobDetailSchema
// ═══════════════════════════════════════════════════════════════════════════════

describe('JobDetailSchema', () => {
  const validDetail = () => ({
    id: 'job_001',
    sessionId: 'ses_001',
    userId: 'usr_001',
    kind: 'btr_rectification' as const,
    status: 'queued' as const,
    progressPercent: 50,
    attempt: 0,
    maxAttempts: 3,
    retryCount: 0,
    queuedAt: '2025-01-01T00:00:00.000Z',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
    version: 0,
  });

  it('parses a valid job detail', () => {
    const result = JobDetailSchema.parse(validDetail());
    expect(result.version).toBe(0);
  });

  it('allows nullable result, checkpoint, cursor', () => {
    const result = JobDetailSchema.parse({
      ...validDetail(),
      result: null,
      checkpoint: null,
      cursor: null,
      sessionStatus: null,
    });
    expect(result.result).toBeNull();
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// JobEventRecordSchema
// ═══════════════════════════════════════════════════════════════════════════════

describe('JobEventRecordSchema', () => {
  const valid = () => ({
    id: 'evt_rec_1',
    jobId: 'job_001',
    sessionId: 'ses_001',
    sequenceNo: 0,
    eventType: 'stage_start',
    payload: { stage: 'quickScan' },
    createdAt: '2025-01-01T00:00:00.000Z',
  });

  it('parses valid event record', () => {
    const result = JobEventRecordSchema.parse(valid());
    expect(result.eventType).toBe('stage_start');
  });

  it('rejects negative sequenceNo', () => {
    const res = JobEventRecordSchema.safeParse({ ...valid(), sequenceNo: -1 });
    expect(res.success).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Ephemeris Service Schemas
// ═══════════════════════════════════════════════════════════════════════════════

describe('EphemerisServiceLocationSchema', () => {
  it('parses valid location', () => {
    const result = EphemerisServiceLocationSchema.parse({
      latitude: 28.6,
      longitude: 77.2,
    });
    expect(result.latitude).toBe(28.6);
  });

  it('rejects latitude out of range', () => {
    expect(EphemerisServiceLocationSchema.safeParse({ latitude: 91, longitude: 0 }).success).toBe(false);
  });

  it('allows altitudeMeters optional', () => {
    const result = EphemerisServiceLocationSchema.parse({
      latitude: 0, longitude: 0, altitudeMeters: 500,
    });
    expect(result.altitudeMeters).toBe(500);
  });
});

describe('EphemerisServiceChartResponseSchema', () => {
  const valid = () => ({
    timestampUtc: '2025-01-01T00:00:00.000Z',
    julianDayUt: 2460678.5,
    julianDayTt: 2460678.50074,
    ayanamsha: 24.1,
    planets: [
      {
        body: 'sun', tropicalLongitude: 280.5, tropicalLatitude: 0,
        distanceAu: 0.983, longitudeSpeed: 1.02, retrograde: false,
      },
    ],
    houses: {
      ascendantTropical: 123.4,
      mcTropical: 56.7,
      houseCuspsTropical: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    },
  });

  it('parses valid chart response', () => {
    const result = EphemerisServiceChartResponseSchema.parse(valid());
    expect(result.planets).toHaveLength(1);
  });

  it('rejects wrong houseCuspsTropical length', () => {
    const inv = valid();
    inv.houses.houseCuspsTropical = [1, 2, 3];
    expect(EphemerisServiceChartResponseSchema.safeParse(inv).success).toBe(false);
  });
});

describe('EphemerisServiceHealthResponseSchema', () => {
  const valid = () => ({
    service: 'ephemeris' as const,
    status: 'healthy' as const,
    ready: true,
    kernelLoaded: true,
    kernelFile: 'de441.bsp',
    timestamp: '2025-01-01T00:00:00.000Z',
    version: '1.0.0',
  });

  it('parses healthy response', () => {
    const result = EphemerisServiceHealthResponseSchema.parse(valid());
    expect(result.service).toBe('ephemeris');
    expect(result.ready).toBe(true);
  });

  it('allows error to be null', () => {
    const result = EphemerisServiceHealthResponseSchema.parse({
      ...valid(), error: null,
    });
    expect(result.error).toBeNull();
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Type-level compile-time verification (interface conformance)
// ═══════════════════════════════════════════════════════════════════════════════

describe('Type-level interface exports', () => {
  it('RectificationSession has correct shape', () => {
    const s: RectificationSession = {
      id: 'ses_x',
      userId: 'u1',
      externalId: 'c1',
      fullName: 'Test',
      dateOfBirth: '1990-01-01',
      tentativeTime: '12:00:00',
      birthPlace: 'Delhi',
      latitude: 28.6,
      longitude: 77.2,
      timezone: 5.5,
      gender: 'male',
      lifeEvents: [],
      status: 'pending',
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: '2025-01-01T00:00:00.000Z',
    };
    expect(s.status).toBe('pending');
  });

  it('BTRInput has correct shape', () => {
    const input: BTRInput = {
      birthDate: '1990-01-01',
      timeEstimate: '12:00',
      offsetConfig: { preset: '1hour' as const, description: 'test' },
      lifeEvents: [
        { id: 'evt_test_1',
          eventType: 'Graduation',
          category: 'education',
          eventDate: '2014-06',
          datePrecision: 'month_year',
          description: 'test',
          importance: 'medium',
        },
      ],
      latitude: 28.6,
      longitude: 77.2,
      timezone: 5.5,
    };
    expect(input.birthDate).toBe('1990-01-01');
  });

  it('BTROutput has correct shape', () => {
    const out: BTROutput = {
      rectifiedTime: '12:34:56',
      accuracy: 98.5,
      confidence: 'High',
      processingTime: 120,
      analysis: {
        eventAnalysis: [],
        alternativeTimes: [],
        weakPoints: [],
        recommendations: [],
      },
    };
    expect(out.rectifiedTime).toBe('12:34:56');
  });

  it('ValidationInput has correct shape', () => {
    const vi: ValidationInput = {
      candidate: {
        time: '12:00',
        ephemeris: {
          planets: {
            sun: { sign: 'Aries', degree: 10, longitude: 10, latitude: 0, nakshatra: 'Ashwini', lord: 'Mars', retro: false, speed: 1, distance: 1, isCombust: false, dignity: 'neutral', house: 1 },
            moon: { sign: 'Taurus', degree: 15, longitude: 45, latitude: 0, nakshatra: 'Rohini', lord: 'Venus', retro: false, speed: 12, distance: 0.0025, isCombust: false, dignity: 'own', house: 2 },
            mercury: { sign: 'Gemini', degree: 5, longitude: 65, latitude: 0, nakshatra: 'Mrigashira', lord: 'Mercury', retro: false, speed: 1.5, distance: 1, isCombust: false, dignity: 'own', house: 3 },
            venus: { sign: 'Cancer', degree: 20, longitude: 110, latitude: 0, nakshatra: 'Pushya', lord: 'Moon', retro: false, speed: 1.2, distance: 1.7, isCombust: false, dignity: 'neutral', house: 4 },
            mars: { sign: 'Leo', degree: 8, longitude: 128, latitude: 0, nakshatra: 'Magha', lord: 'Sun', retro: true, speed: -0.5, distance: 2.5, isCombust: false, dignity: 'friend', house: 5 },
            jupiter: { sign: 'Virgo', degree: 12, longitude: 162, latitude: 0, nakshatra: 'Uttara Phalguni', lord: 'Mercury', retro: false, speed: 0.2, distance: 6, isCombust: false, dignity: 'neutral', house: 6 },
            saturn: { sign: 'Libra', degree: 25, longitude: 205, latitude: 0, nakshatra: 'Swati', lord: 'Venus', retro: false, speed: 0.03, distance: 10, isCombust: false, dignity: 'exalted', house: 7 },
            rahu: { sign: 'Scorpio', degree: 5, longitude: 215, latitude: 0, nakshatra: 'Anuradha', lord: 'Saturn', retro: true, speed: 0, distance: 0, isCombust: false, dignity: 'neutral', house: 8 },
            ketu: { sign: 'Taurus', degree: 5, longitude: 35, latitude: 0, nakshatra: 'Krittika', lord: 'Venus', retro: true, speed: 0, distance: 0, isCombust: false, dignity: 'neutral', house: 2 },
          },
          ascendant: { sign: 'Capricorn', degree: 15, nakshatra: 'Shravana', longitude: 285 },
          houses: [],
        },
        dasha: {},
        vargas: {},
        kpData: {},
      },
      events: [
        validLifeEvent({ id: 'evt_x', eventDate: '2010-05-15', datePrecision: 'exact_date' }),
      ],
      tentativeTime: '12:00',
    };
    expect(vi.candidate.time).toBe('12:00');
    expect(vi.events).toHaveLength(1);
  });

  it('OffsetPreset supports all presets', () => {
    const p: OffsetPreset = 'seconds-6';
    expect(p).toBe('seconds-6');
  });

  it('QueueStatus has four values', () => {
    const s: QueueStatus[] = ['queued', 'processing', 'complete', 'failed'];
    expect(s).toHaveLength(4);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Remaining schema smoke tests
// ═══════════════════════════════════════════════════════════════════════════════

describe('Remaining schemas — basic parse', () => {
  it('CreateJobResponseSchema', () => {
    const r = CreateJobResponseSchema.parse({
      job: {
        id: 'j1', sessionId: 's1', userId: 'u1', kind: 'btr_rectification', status: 'queued',
        progressPercent: 0, attempt: 0, maxAttempts: 3, retryCount: 0,
        queuedAt: '2025-01-01T00:00:00.000Z', createdAt: '2025-01-01T00:00:00.000Z', updatedAt: '2025-01-01T00:00:00.000Z', version: 0,
      },
      idempotentReplay: false,
    });
    expect(r.idempotentReplay).toBe(false);
  });

  it('CancelJobResponseSchema', () => {
    const r = CancelJobResponseSchema.parse({
      job: {
        id: 'j1', sessionId: 's1', userId: 'u1', kind: 'btr_rectification', status: 'queued',
        progressPercent: 0, attempt: 0, maxAttempts: 3, retryCount: 0,
        queuedAt: '2025-01-01T00:00:00.000Z', createdAt: '2025-01-01T00:00:00.000Z', updatedAt: '2025-01-01T00:00:00.000Z', version: 0,
      },
      cancelled: true,
    });
    expect(r.cancelled).toBe(true);
  });

  it('DeadLetterArtifactSummarySchema', () => {
    const r = DeadLetterArtifactSummarySchema.parse({
      id: 'd1', jobId: 'j1', uri: 'gs://bucket/file', createdAt: '2025-01-01T00:00:00.000Z', metadata: null,
    });
    expect(r.uri).toBe('gs://bucket/file');
  });

  it('JobEventsResponseSchema', () => {
    const r = JobEventsResponseSchema.parse({
      jobId: 'j1', sessionId: 's1', since: 0,
      events: [{ id: 'e1', jobId: 'j1', sessionId: 's1', sequenceNo: 1, eventType: 'stage_start', payload: {}, createdAt: '2025-01-01T00:00:00.000Z' }],
    });
    expect(r.events).toHaveLength(1);
  });

  it('JobSyncResponseSchema', () => {
    const r = JobSyncResponseSchema.parse({
      job: {
        id: 'j1', sessionId: 's1', userId: 'u1', kind: 'btr_rectification', status: 'queued',
        progressPercent: 0, attempt: 0, maxAttempts: 3, retryCount: 0,
        queuedAt: '2025-01-01T00:00:00.000Z', createdAt: '2025-01-01T00:00:00.000Z', updatedAt: '2025-01-01T00:00:00.000Z', version: 0,
      },
      since: 0, latestSequenceNo: 0, events: [],
      recommendedPollIntervalMs: 5000, replayMode: 'incremental',
    });
    expect(r.replayMode).toBe('incremental');
  });

  it('EphemerisServiceBaseRequestSchema', () => {
    const r = EphemerisServiceBaseRequestSchema.parse({
      location: { latitude: 0, longitude: 0 },
    });
    expect(r.ayanamshaMode).toBe('lahiri');
    expect(r.houseSystem).toBe('placidus');
    expect(r.nodeMode).toBe('true');
  });

  it('EphemerisServiceSingleRequestSchema', () => {
    const r = EphemerisServiceSingleRequestSchema.parse({
      location: { latitude: 0, longitude: 0 },
      timestampUtc: '2025-01-01T00:00:00.000Z',
    });
    expect(r.timestampUtc).toBe('2025-01-01T00:00:00.000Z');
  });

  it('EphemerisServiceBatchRequestSchema', () => {
    const r = EphemerisServiceBatchRequestSchema.parse({
      location: { latitude: 0, longitude: 0 },
      timestampsUtc: ['2025-01-01T00:00:00.000Z'],
    });
    expect(r.timestampsUtc).toHaveLength(1);
  });

  it('EphemerisServiceSunriseRequestSchema', () => {
    const r = EphemerisServiceSunriseRequestSchema.parse({
      startTimestampUtc: '2025-01-01T00:00:00.000Z',
      endTimestampUtc: '2025-01-01T23:59:59.999Z',
      location: { latitude: 0, longitude: 0 },
    });
    expect(r.startTimestampUtc).toBe('2025-01-01T00:00:00.000Z');
  });

  it('EphemerisServiceSunriseResponseSchema - allows null', () => {
    const r = EphemerisServiceSunriseResponseSchema.parse({ sunriseTimestampUtc: null });
    expect(r.sunriseTimestampUtc).toBeNull();
  });

  it('EphemerisServiceBatchResponseSchema', () => {
    const r = EphemerisServiceBatchResponseSchema.parse({ charts: [] });
    expect(r.charts).toHaveLength(0);
  });

  it('EphemerisServicePlanetPositionSchema', () => {
    const r = EphemerisServicePlanetPositionSchema.parse({
      body: 'sun', tropicalLongitude: 280, tropicalLatitude: 0,
      distanceAu: 1, longitudeSpeed: 1, retrograde: false,
    });
    expect(r.body).toBe('sun');
  });

  it('EphemerisServiceHousesSchema', () => {
    const r = EphemerisServiceHousesSchema.parse({
      ascendantTropical: 120, mcTropical: 45,
      houseCuspsTropical: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    });
    expect(r.houseCuspsTropical).toHaveLength(12);
  });
});
