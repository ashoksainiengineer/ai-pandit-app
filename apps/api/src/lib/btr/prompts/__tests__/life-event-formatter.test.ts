import { describe, expect, it } from 'vitest';
import { formatLifeEventForAI } from '../life-event-formatter.js';

describe('formatLifeEventForAI', () => {
  it('prints month range and explicit event window', () => {
    const text = formatLifeEventForAI({
      id: 'evt-1',
      eventType: 'Career shift',
      category: 'career',
      datePrecision: 'month_range',
      eventDate: '2012-04',
      endDate: '2012-06',
      description: 'Transitioned roles',
      importance: 'high',
    } as any);

    expect(text).toContain('2012-04 to 2012-06');
    expect(text).toContain('Event Window: 2012-04-01 -> 2012-06-30');
  });

  it('prints year range using both endpoints', () => {
    const text = formatLifeEventForAI({
      id: 'evt-2',
      eventType: 'Education period',
      category: 'education',
      datePrecision: 'year_range',
      eventDate: '1998',
      endDate: '2001',
      importance: 'medium',
      description: 'Degree study',
    } as any);

    expect(text).toContain('1998 to 2001');
    expect(text).toContain('Event Window: 1998-01-01 -> 2001-12-31');
  });
});
