import { describe, expect, it } from 'vitest';
import { getFinalPrecisionPrompt } from '../final-precision-prompt.js';

describe('getFinalPrecisionPrompt life-event window propagation', () => {
  it('includes explicit event window for ranged dates in Stage-6 prompt', () => {
    const prompt = getFinalPrecisionPrompt(
      [
        {
          time: '10:00:00',
          offsetMinutes: 0,
          ascendant: { sign: 'Aries', degree: '10°' },
          planets: { sun: { sign: 'Aries', degree: 10 }, moon: { sign: 'Taurus', degree: 20 } },
          houseLords: { 1: 'Mars' },
          vimshottariDasha: [{ maha: 'Sun', antar: 'Moon', pratyantar: 'Mars', startEnd: '2012-01-01 to 2012-12-31' }],
        } as any,
      ],
      [
        {
          id: 'evt_range001',
          eventType: 'Job Transition',
          category: 'career',
          datePrecision: 'month_range',
          eventDate: '2012-04',
          endDate: '2012-06',
          importance: 'high',
          description: 'Transition period',
        } as any,
      ],
      {} as any,
      undefined,
    );

    expect(prompt).toContain('Event Window: 2012-04-01 -> 2012-06-30');
  });
});
