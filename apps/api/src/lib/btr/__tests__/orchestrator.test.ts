import { describe, it, expect, vi, beforeEach } from 'vitest';
import { rectifyBirthTime, RectificationInput } from '../orchestrator.js';

// Mock dependencies
vi.mock('../window-scanner.js', () => ({
  WindowScanner: {
    scan: vi.fn().mockResolvedValue({
      success: true,
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
    batchAnalyze: vi.fn().mockResolvedValue(new Map()),
  },
}));
vi.mock('../event-scorer.js', () => ({
  EventScorer: {
    scoreEvents: vi.fn().mockReturnValue([]),
    generateSummary: vi.fn().mockReturnValue({
      totalEvents: 3,
      averageScore: 82,
      confidence: 'HIGH',
    }),
  },
}));

vi.mock('../../ephemeris.js', () => ({
  calculateSunrise: vi.fn().mockResolvedValue(new Date('2024-01-01T06:30:00Z')),
  calculateEphemeris: vi.fn().mockResolvedValue({
    planets: { sun: { longitude: 280, latitude: 0 } },
  }),
  convertToUTC: vi.fn().mockReturnValue(new Date('2024-01-01T12:00:00Z')),
  clearEphemerisSessionCache: vi.fn(),
}));

vi.mock('../../logger.js', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
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
      { date: '2010-05-15', description: 'Marriage', category: 'major_life_event' } as any,
      { date: '2012-08-20', description: 'Job change', category: 'career' } as any,
      { date: '2015-03-10', description: 'Child birth', category: 'family' } as any,
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
      expect(result.confidenceLevel).toBeDefined();
      expect(result.candidateAnalysis).toBeDefined();
    });

    it('should return result with context', async () => {
      const result = await rectifyBirthTime(validInput);
      expect(result.context).toBeDefined();
      expect(result.eventAnalysis).toBeDefined();
    });


    it('should handle custom time range', async () => {
      const inputWithRange: RectificationInput = {
        ...validInput,
        timeRangeMinutes: 60,
      };

      const result = await rectifyBirthTime(inputWithRange);
      expect(result).toBeDefined();
      expect(result.rectifiedTime).toBeDefined();
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
    it('should handle empty events array gracefully', async () => {
      const invalidInput: RectificationInput = {
        ...validInput,
        events: [],
      };

      const result = await rectifyBirthTime(invalidInput);
      expect(result).toBeDefined();
      expect(result.confidenceLevel).toBe('LOW');
    });

    it('should handle invalid coordinates gracefully', async () => {
      const invalidInput: RectificationInput = {
        ...validInput,
        latitude: 999,
        longitude: 999,
      };

      const result = await rectifyBirthTime(invalidInput);
      expect(result).toBeDefined();
    });
  });

  describe('Result Structure', () => {
    it('should return all required fields', async () => {
      const result = await rectifyBirthTime(validInput);

      expect(result).toHaveProperty('rectifiedTime');
      expect(result).toHaveProperty('confidenceLevel');
      expect(result).toHaveProperty('candidateAnalysis');
      expect(result).toHaveProperty('context');
      expect(result).toHaveProperty('eventAnalysis');
    });

    it('should include confidence level', async () => {
      const result = await rectifyBirthTime(validInput);

      expect(['LOW', 'MEDIUM', 'HIGH', 'GOD_TIER']).toContain(
        result.confidenceLevel
      );
    });
  });
});
