import { describe, expect, it } from 'vitest';
import { getBatchPrompt } from '../batch-prompt.js';

describe('getBatchPrompt life-event window propagation', () => {
  it('includes explicit event window for ranged dates in Stage-2 prompt', () => {
    const prompt = getBatchPrompt(
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
          id: 'evt_abc123',
          eventType: 'Education Period',
          category: 'education',
          datePrecision: 'month_range',
          eventDate: '2012-04',
          endDate: '2012-06',
          importance: 'high',
          description: 'Intensive training phase',
        } as any,
      ],
      1,
      3,
      1,
      null,
      30,
    );

    expect(prompt).toContain('Event Window: 2012-04-01 -> 2012-06-30');
  });
});
