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
    } as any);

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
      } as any).midpointMs).toISOString().slice(0, 19)
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
    } as any).midpointMs);

    expect(matches).toHaveLength(1);
    expect(matches[0].eventId).toBe('evt_abc123');
    expect(matches[0].eventDate.toISOString().slice(0, 19)).toBe(expectedMidpoint.toISOString().slice(0, 19));
  });
});
