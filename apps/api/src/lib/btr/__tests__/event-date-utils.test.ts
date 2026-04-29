import { describe, expect, it } from 'vitest';
import { getRepresentativeEventDateTime, resolveEventDateWindow } from '../event-date-utils.js';

type EventDateInput = Parameters<typeof resolveEventDateWindow>[0];

describe('event-date-utils', () => {
  it('creates full-day window for exact_date', () => {
    const window = resolveEventDateWindow({
      datePrecision: 'exact_date',
      eventDate: '2017-12-11',
    } satisfies EventDateInput);

    expect(window.startDate).toBe('2017-12-11');
    expect(window.endDate).toBe('2017-12-11');
    expect(window.isApproximate).toBe(false);
  });

  it('creates month window for month_year', () => {
    const window = resolveEventDateWindow({
      datePrecision: 'month_year',
      eventDate: '2015-02',
    } satisfies EventDateInput);

    expect(window.startDate).toBe('2015-02-01');
    expect(window.endDate).toBe('2015-02-28');
    expect(window.isApproximate).toBe(true);
  });

  it('creates year window for year_range and respects end year', () => {
    const window = resolveEventDateWindow({
      datePrecision: 'year_range',
      eventDate: '1998',
      endDate: '2001',
    } satisfies EventDateInput);

    expect(window.startDate).toBe('1998-01-01');
    expect(window.endDate).toBe('2001-12-31');
  });

  it('supports legacy year_range values encoded as full date', () => {
    const window = resolveEventDateWindow({
      datePrecision: 'year_range',
      eventDate: '1998-06-15',
      endDate: '2001-03-20',
    } satisfies EventDateInput);

    expect(window.startDate).toBe('1998-01-01');
    expect(window.endDate).toBe('2001-12-31');
  });

  it('returns midpoint representative for range precision', () => {
    const representative = getRepresentativeEventDateTime({
      datePrecision: 'date_range',
      eventDate: '2010-01-01',
      endDate: '2010-01-03',
    } satisfies EventDateInput);

    expect(representative.eventDate).toBe('2010-01-02');
    expect(representative.window.isApproximate).toBe(true);
  });

  it('supports Date object inputs for backward compatibility', () => {
    const window = resolveEventDateWindow({
      datePrecision: 'exact_date',
      eventDate: new Date('2017-12-11T06:30:00Z'),
    } satisfies EventDateInput);

    expect(window.startDate).toBe('2017-12-11');
    expect(window.endDate).toBe('2017-12-11');
  });

  it('keeps midpoint date/time stable at UTC boundaries for cross-day ranges', () => {
    const representative = getRepresentativeEventDateTime({
      datePrecision: 'date_range',
      eventDate: '2020-01-01',
      endDate: '2020-01-02',
    } satisfies EventDateInput);

    expect(representative.eventDate).toBe('2020-01-01');
    expect(representative.eventTime).toBe('23:59:59');
    expect(representative.window.startDate).toBe('2020-01-01');
    expect(representative.window.endDate).toBe('2020-01-02');
    expect(representative.window.midpointMs).toBe(Date.UTC(2020, 0, 1, 23, 59, 59, 999));
  });

  it('treats Date object inputs as UTC-normalized dates regardless of original timezone offset', () => {
    const window = resolveEventDateWindow({
      datePrecision: 'exact_date',
      eventDate: new Date('2017-12-11T23:30:00-11:00'),
    } satisfies EventDateInput);

    expect(window.startDate).toBe('2017-12-12');
    expect(window.endDate).toBe('2017-12-12');
    expect(window.representativeTime).toBe('11:59:59');
  });
});
