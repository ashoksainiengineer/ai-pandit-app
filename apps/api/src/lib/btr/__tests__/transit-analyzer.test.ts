import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../ephemeris.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../ephemeris.js')>();
  return {
    ...actual,
    calculateEphemeris: vi.fn(),
  };
});

vi.mock('../../logger.js', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

import { calculateEphemeris } from '../../ephemeris.js';
import { resolveEventDateWindow, getRepresentativeEventDateTime } from '../event-date-utils.js';
import {
  analyzeTransitForEvent,
  batchAnalyzeTransits,
  calculateTransitMatchScore,
} from '../transit-analyzer.js';

const calculateEphemerisMock = vi.mocked(calculateEphemeris);
type EventDateInput = Parameters<typeof resolveEventDateWindow>[0];

function mockTransitEphemeris() {
  calculateEphemerisMock.mockResolvedValue({
    planets: {
      saturn: { sign: 'Aries', degree: 10, longitude: 10, retro: false },
      jupiter: { sign: 'Aries', degree: 15, longitude: 15, retro: false },
      rahu: { sign: 'Aries', degree: 20, longitude: 20, retro: false },
      ketu: { sign: 'Libra', degree: 20, longitude: 200, retro: false },
    },
  } as any);
}

describe('TransitAnalyzer flexible date precision handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTransitEphemeris();
  });

  it('uses representative midpoint date/time for ranged event windows', async () => {
    const expected = getRepresentativeEventDateTime({
      eventDate: '2012-04',
      endDate: '2012-06',
      datePrecision: 'month_range',
    } satisfies EventDateInput);

    const result = await analyzeTransitForEvent({
      eventDate: '2012-04',
      endDate: '2012-06',
      datePrecision: 'month_range',
      eventCategory: 'marriage',
      birthLatitude: 28.6139,
      birthLongitude: 77.209,
      birthTimezone: 5.5,
      birthAscendantSign: 'Aries',
    });

    expect(calculateEphemerisMock).toHaveBeenCalledWith(
      expected.eventDate,
      expected.eventTime,
      28.6139,
      77.209,
      5.5,
    );
    expect(result.eventDate.toISOString().slice(0, 19)).toBe(
      new Date(resolveEventDateWindow({
        eventDate: '2012-04',
        endDate: '2012-06',
        datePrecision: 'month_range',
      } satisfies EventDateInput).midpointMs).toISOString().slice(0, 19)
    );
  });

  it('stores batch analysis by both date and date#id keys when id is present', async () => {
    const results = await batchAnalyzeTransits(
      [
        {
          id: 'evt_abc123',
          date: '1998',
          endDate: '2001',
          datePrecision: 'year_range',
          category: 'career',
        },
      ],
      {
        latitude: 28.6139,
        longitude: 77.209,
        timezone: 5.5,
        ascendantSign: 'Aries',
      },
    );

    expect(results.has('1998')).toBe(true);
    expect(results.has('1998#evt_abc123')).toBe(true);
  });

  it('returns match eventDate as resolved midpoint for range events', async () => {
    const matches = await calculateTransitMatchScore(
      [
        {
          id: 'evt_abc123',
          date: '1998',
          endDate: '2001',
          datePrecision: 'year_range',
          category: 'career',
        },
      ],
      {
        latitude: 28.6139,
        longitude: 77.209,
        timezone: 5.5,
        ascendantSign: 'Aries',
      },
    );

    const expectedMidpoint = new Date(resolveEventDateWindow({
      eventDate: '1998',
      endDate: '2001',
      datePrecision: 'year_range',
    } satisfies EventDateInput).midpointMs);

    expect(matches).toHaveLength(1);
    expect(matches[0].eventId).toBe('evt_abc123');
    expect(matches[0].eventDate.toISOString().slice(0, 19)).toBe(expectedMidpoint.toISOString().slice(0, 19));
  });

  it('uses exact_date_time literal directly without timezone-driven date shifts', async () => {
    const expected = getRepresentativeEventDateTime({
      eventDate: '2017-12-11',
      eventTime: '00:15:00',
      datePrecision: 'exact_date_time',
    } satisfies EventDateInput);

    const result = await analyzeTransitForEvent({
      eventDate: '2017-12-11',
      eventTime: '00:15:00',
      datePrecision: 'exact_date_time',
      eventCategory: 'marriage',
      birthLatitude: 28.6139,
      birthLongitude: 77.209,
      birthTimezone: -11,
      birthAscendantSign: 'Aries',
    });

    expect(calculateEphemerisMock).toHaveBeenCalledWith(
      expected.eventDate,
      expected.eventTime,
      28.6139,
      77.209,
      -11,
    );
    expect(result.eventDate.getTime()).toBe(Date.UTC(2017, 11, 11, 0, 15, 0, 0));
  });

  it('keeps range-midpoint eventDate stable across extreme birth timezones', async () => {
    const event = {
      eventDate: '2020-01-01',
      endDate: '2020-01-02',
      datePrecision: 'date_range' as const,
      eventCategory: 'career',
      birthLatitude: 28.6139,
      birthLongitude: 77.209,
      birthAscendantSign: 'Aries',
    };

    const westResult = await analyzeTransitForEvent({
      ...event,
      birthTimezone: -12,
    });
    const eastResult = await analyzeTransitForEvent({
      ...event,
      birthTimezone: 14,
    });

    expect(westResult.eventDate.toISOString()).toBe(eastResult.eventDate.toISOString());
    expect(westResult.eventDate.toISOString().slice(0, 19)).toBe('2020-01-01T23:59:59');

    const westCall = calculateEphemerisMock.mock.calls[0];
    const eastCall = calculateEphemerisMock.mock.calls[1];
    expect(westCall?.[0]).toBe('2020-01-01');
    expect(westCall?.[1]).toBe('23:59:59');
    expect(eastCall?.[0]).toBe('2020-01-01');
    expect(eastCall?.[1]).toBe('23:59:59');
    expect(westCall?.[4]).toBe(-12);
    expect(eastCall?.[4]).toBe(14);
  });
});
