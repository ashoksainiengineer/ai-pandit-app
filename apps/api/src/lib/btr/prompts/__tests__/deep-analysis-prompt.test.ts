import { describe, expect, it } from 'vitest';
import { getDeepAnalysisPrompt } from '../deep-analysis-prompt.js';

describe('getDeepAnalysisPrompt timeline range', () => {
  it('uses full event window years for range precisions', () => {
    const prompt = getDeepAnalysisPrompt(
      [
        {
          time: '10:00:00',
          offsetMinutes: 0,
          ascendant: { sign: 'Aries', degree: '10°' },
          planets: { sun: { sign: 'Aries', degree: 10 }, moon: { sign: 'Taurus', degree: 20 } },
          houseLords: { 1: 'Mars' },
          vimshottariDasha: [{ maha: 'Sun', antar: 'Moon', pratyantar: 'Mars', startEnd: '1998-01-01 to 2001-12-31' }],
        } as any,
      ],
      [
        {
          id: 'evt-1',
          eventType: 'Education',
          category: 'education',
          datePrecision: 'year_range',
          eventDate: '1998',
          endDate: '2001',
          description: 'Degree period',
          importance: 'high',
        } as any,
      ],
      {} as any,
      null,
      30,
    );

    const currentYear = new Date().getUTCFullYear();
    expect(prompt).toContain('Multi-Dasha Chronology (1998-');
    expect(prompt).toContain(`-${currentYear})`);
  });
});
