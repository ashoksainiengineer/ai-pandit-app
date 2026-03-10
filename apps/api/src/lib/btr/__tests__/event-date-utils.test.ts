import { describe, expect, it } from 'vitest';
import { getRepresentativeEventDateTime, resolveEventDateWindow } from '../event-date-utils.js';

describe('event-date-utils', () => {
  it('creates full-day window for exact_date', () => {
    const window = resolveEventDateWindow({
      datePrecision: 'exact_date',
      eventDate: '2017-12-11',
    } as any);

    expect(window.startDate).toBe('2017-12-11');
    expect(window.endDate).toBe('2017-12-11');
    expect(window.isApproximate).toBe(false);
  });

  it('creates month window for month_year', () => {
    const window = resolveEventDateWindow({
      datePrecision: 'month_year',
      eventDate: '2015-02',
    } as any);

    expect(window.startDate).toBe('2015-02-01');
    expect(window.endDate).toBe('2015-02-28');
    expect(window.isApproximate).toBe(true);
  });

  it('creates year window for year_range and respects end year', () => {
    const window = resolveEventDateWindow({
      datePrecision: 'year_range',
      eventDate: '1998',
      endDate: '2001',
    } as any);

    expect(window.startDate).toBe('1998-01-01');
    expect(window.endDate).toBe('2001-12-31');
  });

  it('supports legacy year_range values encoded as full date', () => {
    const window = resolveEventDateWindow({
      datePrecision: 'year_range',
      eventDate: '1998-06-15',
      endDate: '2001-03-20',
    } as any);

    expect(window.startDate).toBe('1998-01-01');
    expect(window.endDate).toBe('2001-12-31');
  });

  it('returns midpoint representative for range precision', () => {
    const representative = getRepresentativeEventDateTime({
      datePrecision: 'date_range',
      eventDate: '2010-01-01',
      endDate: '2010-01-03',
    } as any);

    expect(representative.eventDate).toBe('2010-01-02');
    expect(representative.window.isApproximate).toBe(true);
  });

  it('supports Date object inputs for backward compatibility', () => {
    const window = resolveEventDateWindow({
      datePrecision: 'exact_date',
      eventDate: new Date('2017-12-11T06:30:00Z'),
    } as any);

    expect(window.startDate).toBe('2017-12-11');
    expect(window.endDate).toBe('2017-12-11');
  });
});
