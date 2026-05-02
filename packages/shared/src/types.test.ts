import { describe, it, expect } from 'vitest';
import type { 
  BirthData, 
  RectificationSession, 
  BtrEvent,
  SessionStatus 
} from './types.js';

describe('Shared Types', () => {
  describe('BirthData', () => {
    it('should accept valid birth data structure', () => {
      const birthData: BirthData = {
        date: '1990-01-01',
        time: '12:00',
        latitude: 28.6139,
        longitude: 77.2090,
        timezone: 'Asia/Kolkata',
        placeName: 'New Delhi, India',
      };

      expect(birthData).toHaveProperty('date');
      expect(birthData).toHaveProperty('time');
      expect(birthData).toHaveProperty('latitude');
      expect(birthData).toHaveProperty('longitude');
      expect(birthData.latitude).toBe(28.6139);
      expect(birthData.longitude).toBe(77.2090);
    });
  });

  describe('SessionStatus', () => {
    it('should have valid status values', () => {
      const statuses: SessionStatus[] = [
        'pending',
        'processing',
        'completed',
        'failed',
        'cancelled',
      ];

      expect(statuses).toContain('pending');
      expect(statuses).toContain('processing');
      expect(statuses).toContain('completed');
      expect(statuses).toContain('failed');
      expect(statuses).toContain('cancelled');
    });
  });

  describe('BtrEvent', () => {
    it('should accept valid event structure', () => {
      const event: BtrEvent = {
        id: 'evt-123',
        date: '2010-05-15',
        description: 'Marriage',
        category: 'major_life_event',
      };

      expect(event).toHaveProperty('id');
      expect(event).toHaveProperty('date');
      expect(event).toHaveProperty('description');
      expect(event.category).toBe('major_life_event');
    });
  });
});
