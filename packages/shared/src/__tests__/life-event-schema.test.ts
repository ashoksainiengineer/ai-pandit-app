import { describe, expect, it } from 'vitest';
import { LifeEventSchema } from '../schemas.js';

describe('LifeEventSchema precision-aware date validation', () => {
  const base = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    eventType: 'Marriage',
    category: 'marriage',
    importance: 'high' as const,
  };

  it('accepts exact date', () => {
    const parsed = LifeEventSchema.safeParse({
      ...base,
      datePrecision: 'exact_date',
      eventDate: '2017-12-11',
    });

    expect(parsed.success).toBe(true);
  });

  it('accepts month-level and year-level formats', () => {
    const month = LifeEventSchema.safeParse({
      ...base,
      datePrecision: 'month_year',
      eventDate: '2015-01',
    });

    const yearRange = LifeEventSchema.safeParse({
      ...base,
      datePrecision: 'year_range',
      eventDate: '1998',
      endDate: '2001',
    });

    expect(month.success).toBe(true);
    expect(yearRange.success).toBe(true);
  });

  it('accepts legacy prefixed event ids for backward compatibility', () => {
    const parsed = LifeEventSchema.safeParse({
      ...base,
      id: 'evt_abc123xyz',
      datePrecision: 'exact_date',
      eventDate: '2017-12-11',
    });

    expect(parsed.success).toBe(true);
  });

  it('accepts simple alphanumeric ids used by legacy datasets', () => {
    const parsed = LifeEventSchema.safeParse({
      ...base,
      id: '1',
      datePrecision: 'exact_date',
      eventDate: '2017-12-11',
    });

    expect(parsed.success).toBe(true);
  });

  it('accepts legacy month/year ranges encoded as full dates', () => {
    const monthRange = LifeEventSchema.safeParse({
      ...base,
      datePrecision: 'month_range',
      eventDate: '2015-01-01',
      endDate: '2015-03-01',
    });

    const yearRange = LifeEventSchema.safeParse({
      ...base,
      datePrecision: 'year_range',
      eventDate: '1998-01-01',
      endDate: '2001-12-31',
    });

    expect(monthRange.success).toBe(true);
    expect(yearRange.success).toBe(true);
  });

  it('rejects invalid format for precision', () => {
    const invalid = LifeEventSchema.safeParse({
      ...base,
      datePrecision: 'exact_date',
      eventDate: '2017-12',
    });

    expect(invalid.success).toBe(false);
  });

  it('requires eventTime for exact_date_time precision', () => {
    const invalid = LifeEventSchema.safeParse({
      ...base,
      datePrecision: 'exact_date_time',
      eventDate: '2017-12-11',
    });

    expect(invalid.success).toBe(false);
  });

  it('rejects reverse ranges', () => {
    const invalid = LifeEventSchema.safeParse({
      ...base,
      datePrecision: 'month_range',
      eventDate: '2020-05',
      endDate: '2020-01',
    });

    expect(invalid.success).toBe(false);
  });
});
