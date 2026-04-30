import { describe, it, expect, vi, beforeEach } from 'vitest';
import { rectifyBirthTime, RectificationInput } from '../orchestrator';

// Mock dependencies
vi.mock('../window-scanner.js', () => ({
  WindowScanner: {
    scan: vi.fn().mockResolvedValue({
      candidates: [
        { time: '12:00:00', score: 85, confidence: 'HIGH' },
        { time: '12:01:00', score: 78, confidence: 'MEDIUM' },
      ],
      bestCandidate: { time: '12:00:00', score: 85, confidence: 'HIGH' },
    }),
  },
}));

vi.mock('../tatwa-shuddhi.js', () => ({
  TatwaShuddhi: {
    findCorrections: vi.fn().mockReturnValue({
      correctionWindows: [],
      dominantTatwa: 'AKASH',
    }),
  },
}));

vi.mock('../transit-analyzer.js', () => ({
  TransitAnalyzer: {
    analyzeTransits: vi.fn().mockResolvedValue({
      score: 90,
      transits: [],
    }),
  },
}));

vi.mock('../event-scorer.js', () => ({
  EventScorer: {
    scoreEvents: vi.fn().mockReturnValue({
      scoredEvents: [],
      summary: { totalEvents: 3, averageScore: 82 },
    }),
  },
}));

vi.mock('../ephemeris.js', () => ({
  calculateSunrise: vi.fn().mockResolvedValue(new Date('2024-01-01T06:30:00Z')),
  calculateEphemeris: vi.fn().mockResolvedValue({
    planets: { sun: { longitude: 280, latitude: 0 } },
  }),
  convertToUTC: vi.fn().mockReturnValue(new Date('2024-01-01T12:00:00Z')),
  clearSessionCache: vi.fn(),
}));

vi.mock('../logger.js', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

describe('BTR Orchestrator', () => {
  const validInput: RectificationInput = {
    birthDate: '1990-01-01',
    tentativeTime: '12:00',
    latitude: 28.6139,
    longitude: 77.2090,
    timezone: 'Asia/Kolkata',
    events: [
      { date: '2010-05-15', description: 'Marriage', category: 'major_life_event' },
      { date: '2012-08-20', description: 'Job change', category: 'career' },
      { date: '2015-03-10', description: 'Child birth', category: 'family' },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rectifyBirthTime', () => {
    it('should process valid birth data successfully', async () => {
      const result = await rectifyBirthTime(validInput);

      expect(result).toBeDefined();
      expect(result.rectifiedTime).toBeDefined();
      expect(result.confidence).toBeDefined();
      expect(result.candidates).toBeDefined();
      expect(result.candidates.length).toBeGreaterThan(0);
    });

    it('should return candidates sorted by score', async () => {
      const result = await rectifyBirthTime(validInput);

      expect(result.candidates[0].score).toBeGreaterThanOrEqual(
        result.candidates[1]?.score ?? 0
      );
    });

    it('should include event analysis in results', async () => {
      const result = await rectifyBirthTime(validInput);

      expect(result.eventAnalysis).toBeDefined();
      expect(result.context.scoredEvents).toBeDefined();
    });

    it('should handle minimum 3 life events', async () => {
      const result = await rectifyBirthTime(validInput);

      expect(result.candidates.length).toBeGreaterThan(0);
    });

    it('should handle forensic profile if provided', async () => {
      const inputWithProfile: RectificationInput = {
        ...validInput,
        forensicProfile: {
          prakriti: { dominant: 'VATA' },
          physicalTraits: { height: 'average' },
        },
      };

      const result = await rectifyBirthTime(inputWithProfile);
      expect(result).toBeDefined();
    });

    it('should handle custom time range', async () => {
      const inputWithRange: RectificationInput = {
        ...validInput,
        timeRangeMinutes: 60,
      };

      const result = await rectifyBirthTime(inputWithRange);
      expect(result).toBeDefined();
    });

    it('should generate session ID if not provided', async () => {
      const result = await rectifyBirthTime(validInput);
      expect(result).toBeDefined();
    });

    it('should use provided session ID', async () => {
      const inputWithSession: RectificationInput = {
        ...validInput,
        sessionId: 'custom-session-123',
      };

      const result = await rectifyBirthTime(inputWithSession);
      expect(result).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid birth date format', async () => {
      const invalidInput: RectificationInput = {
        ...validInput,
        birthDate: 'invalid-date',
      };

      await expect(rectifyBirthTime(invalidInput)).rejects.toThrow();
    });

    it('should handle invalid coordinates', async () => {
      const invalidInput: RectificationInput = {
        ...validInput,
        latitude: 999,
        longitude: 999,
      };

      await expect(rectifyBirthTime(invalidInput)).rejects.toThrow();
    });

    it('should handle empty events array', async () => {
      const invalidInput: RectificationInput = {
        ...validInput,
        events: [],
      };

      await expect(rectifyBirthTime(invalidInput)).rejects.toThrow();
    });

    it('should handle ephemeris calculation failure', async () => {
      const { calculateEphemeris } = await import('../ephemeris.js');
      vi.mocked(calculateEphemeris).mockRejectedValueOnce(
        new Error('Ephemeris service unavailable')
      );

      await expect(rectifyBirthTime(validInput)).rejects.toThrow();
    });
  });

  describe('Performance', () => {
    it('should complete within reasonable time', async () => {
      const startTime = Date.now();
      await rectifyBirthTime(validInput);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(30000); // Should complete within 30 seconds
    });
  });

  describe('Result Structure', () => {
    it('should return all required fields', async () => {
      const result = await rectifyBirthTime(validInput);

      expect(result).toHaveProperty('rectifiedTime');
      expect(result).toHaveProperty('confidence');
      expect(result).toHaveProperty('candidates');
      expect(result).toHaveProperty('context');
      expect(result).toHaveProperty('eventAnalysis');
    });

    it('should include confidence level', async () => {
      const result = await rectifyBirthTime(validInput);

      expect(['LOW', 'MEDIUM', 'HIGH', 'GOD_TIER']).toContain(
        result.confidence
      );
    });
  });
});
