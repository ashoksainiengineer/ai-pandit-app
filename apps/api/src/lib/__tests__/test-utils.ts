/**
 * Test Utilities for AI-Pandit
 * 
 * Industry-standard test helpers following AAA pattern
 * and F.I.R.S.T principles.
 */

import { vi, expect } from 'vitest';
import type { SecondsPrecisionInput, LifeEvent } from '@ai-pandit/shared';

// ═════════════════════════════════════════════════════════════════════════════
// TEST FIXTURES - Known Accurate Data
// ═════════════════════════════════════════════════════════════════════════════

export const KNOWN_BIRTH_CHARTS = {
  // Delhi, India - Standard Test Case
  delhiNoon: {
    dateOfBirth: '1990-05-15',
    time: '12:00:00',
    latitude: 28.6139,
    longitude: 77.2090,
    timezone: 5.5,
    expected: {
      sunSign: 'Taurus',
      moonSign: 'Capricorn',
      ascendantSign: 'Leo',
    }
  },
  
  // Mumbai, India - Coastal Location
  mumbaiMorning: {
    dateOfBirth: '1985-08-20',
    time: '06:30:00',
    latitude: 19.0760,
    longitude: 72.8777,
    timezone: 5.5,
    expected: {
      sunSign: 'Leo',
      moonSign: 'Pisces',
      ascendantSign: 'Cancer',
    }
  },
  
  // New York, USA - Western Hemisphere
  newYorkEvening: {
    dateOfBirth: '1995-12-25',
    time: '18:45:00',
    latitude: 40.7128,
    longitude: -74.0060,
    timezone: -5,
    expected: {
      sunSign: 'Capricorn',
      moonSign: 'Scorpio',
      ascendantSign: 'Cancer',
    }
  },
  
  // Sydney, Australia - Southern Hemisphere (corrected signs based on Skyfield)
  sydneyAfternoon: {
    dateOfBirth: '1988-03-10',
    time: '14:20:00',
    latitude: -33.8688,
    longitude: 151.2093,
    timezone: 11,
    expected: {
      sunSign: 'Aquarius', // Sun still in Aquarius on March 10, 1988
      moonSign: 'Sagittarius',
      ascendantSign: 'Leo',
    }
  },
  
  // Leap Year - Edge Case (corrected signs based on Skyfield calculations)
  leapYearBirth: {
    dateOfBirth: '2000-02-29',
    time: '23:59:00',
    latitude: 51.5074,
    longitude: -0.1278,
    timezone: 0,
    expected: {
      sunSign: 'Aquarius', // Sun still in Aquarius on Feb 29
      moonSign: 'Gemini',
      ascendantSign: 'Scorpio',
    }
  },
  
  // Sandhi Zone - Critical Test
  sandhiBirth: {
    dateOfBirth: '1992-06-15',
    time: '00:30:00',
    latitude: 28.6139,
    longitude: 77.2090,
    timezone: 5.5,
    expected: {
      sunSign: 'Gemini',
      ascendantInCriticalDegree: true,
    }
  },
} as const;

// ═════════════════════════════════════════════════════════════════════════════
// FACTORY FUNCTIONS - Create Test Data
// ═════════════════════════════════════════════════════════════════════════════

export function createBirthInput(overrides: Partial<SecondsPrecisionInput> = {}): SecondsPrecisionInput {
  const base: SecondsPrecisionInput = {
    sessionId: `test-session-${Date.now()}`,
    dateOfBirth: '1990-05-15',
    tentativeTime: '12:00:00',
    latitude: 28.6139,
    longitude: 77.2090,
    timezone: 5.5,
    lifeEvents: [createLifeEvent()],
    offsetConfig: { preset: '30min', description: 'Test offset' },
    offsetConfig: { preset: '30min', description: 'Test offset' },
    ...overrides
  };
  return base;
}

export function createLifeEvent(overrides: Partial<LifeEvent> = {}): LifeEvent {
  return {
    id: `test-event-${Date.now()}`,
    category: 'career',
    eventType: 'marriage',
    eventDate: '2015-06-20',
    description: 'Marriage ceremony',
    importance: 'high',
    datePrecision: 'exact_date_time',
    ...overrides
  };
}


// ═════════════════════════════════════════════════════════════════════════════

// ═════════════════════════════════════════════════════════════════════════════
// MOCK HELPERS - Create Consistent Mocks
// ═════════════════════════════════════════════════════════════════════════════

export function createMockEphemerisResponse() {
  return {
    planets: {
      sun: { longitude: 45.5, sign: 'Taurus', degree: 15.5, nakshatra: 'Rohini', house: 10 },
      moon: { longitude: 270.3, sign: 'Capricorn', degree: 0.3, nakshatra: 'UttaraAshadha', house: 6 },
      mars: { longitude: 120.7, sign: 'Leo', degree: 0.7, nakshatra: 'Magha', house: 1 },
      mercury: { longitude: 42.1, sign: 'Taurus', degree: 12.1, nakshatra: 'Rohini', house: 10 },
      jupiter: { longitude: 180.5, sign: 'Libra', degree: 0.5, nakshatra: 'Chitra', house: 3 },
      venus: { longitude: 38.9, sign: 'Taurus', degree: 8.9, nakshatra: 'Krittika', house: 10 },
      saturn: { longitude: 300.2, sign: 'Aquarius', degree: 0.2, nakshatra: 'Dhanishta', house: 7 },
      rahu: { longitude: 15.3, sign: 'Aries', degree: 15.3, nakshatra: 'Bharani', house: 9 },
      ketu: { longitude: 195.3, sign: 'Libra', degree: 15.3, nakshatra: 'Swati', house: 3 },
    },
    ascendant: { longitude: 105.5, sign: 'Leo', degree: 15.5, nakshatra: 'PurvaPhalguni' },
    houses: Array.from({ length: 12 }, (_, i) => ({
      houseNumber: i + 1,
      sign: ['Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 
             'Aquarius', 'Pisces', 'Aries', 'Taurus', 'Gemini', 'Cancer'][i],
      degree: 0,
      cusp: (i * 30) % 360,
      lord: ['Sun', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn',
             'Saturn', 'Jupiter', 'Mars', 'Venus', 'Mercury', 'Moon'][i]
    }))
  };
}

// ═════════════════════════════════════════════════════════════════════════════
// ASSERTION HELPERS - Industry-Standard Assertions
// ═════════════════════════════════════════════════════════════════════════════

export function expectValidEphemerisData(ephemeris: any) {
  expect(ephemeris).toBeDefined();
  expect(ephemeris.planets).toBeDefined();
  
  // All 9 planets present
  const planetNames = ['sun', 'moon', 'mars', 'mercury', 'jupiter', 'venus', 'saturn', 'rahu', 'ketu'];
  for (const planet of planetNames) {
    expect(ephemeris.planets[planet], `Planet ${planet} should exist`).toBeDefined();
    expect(ephemeris.planets[planet].longitude).toBeGreaterThanOrEqual(0);
    expect(ephemeris.planets[planet].longitude).toBeLessThan(360);
    expect(ephemeris.planets[planet].sign).toBeDefined();
  }
  
  // Rahu-Ketu opposition
  const rahuLong = ephemeris.planets.rahu.longitude;
  const ketuLong = ephemeris.planets.ketu.longitude;
  const separation = Math.abs(rahuLong - ketuLong);
  const normalizedSep = separation > 180 ? 360 - separation : separation;
  expect(normalizedSep).toBeCloseTo(180, 0);
  
  // Ascendant present
  expect(ephemeris.ascendant).toBeDefined();
  expect(ephemeris.ascendant.longitude).toBeGreaterThanOrEqual(0);
  expect(ephemeris.ascendant.longitude).toBeLessThan(360);
  
  // Houses present
  expect(ephemeris.houses).toHaveLength(12);
}

export function expectWithinTolerance(
  actual: number, 
  expected: number, 
  tolerance: number,
  message?: string
) {
  const diff = Math.abs(actual - expected);
  const normalizedDiff = diff > 180 ? 360 - diff : diff;
  if (normalizedDiff > tolerance) {
    throw new Error(
      message || `Expected ${actual} to be within ${tolerance}° of ${expected}, but difference was ${normalizedDiff}°`
    );
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// TIMER HELPERS - Handle Async/Batching in Tests
// ═════════════════════════════════════════════════════════════════════════════

export async function flushPromises(): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, 0));
}

export async function waitFor(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function mockTimers() {
  vi.useFakeTimers({ shouldAdvanceTime: true });
}

export function restoreTimers() {
  vi.useRealTimers();
}

// ═════════════════════════════════════════════════════════════════════════════
// DATABASE HELPERS - Clean Test State
// ═════════════════════════════════════════════════════════════════════════════

export async function cleanupTestSession(sessionId: string): Promise<void> {
  // Implementation depends on your DB setup
  // This is a placeholder
}

export async function cleanupAllTestData(): Promise<void> {
  // Clean up any test data created during tests
  // Implementation depends on your DB setup
}

// ═════════════════════════════════════════════════════════════════════════════
// CONSTANTS - Test Configuration
// ═════════════════════════════════════════════════════════════════════════════

export const TEST_TIMEOUTS = {
  UNIT: 5000,        // 5 seconds for unit tests
  INTEGRATION: 30000, // 30 seconds for integration tests
  E2E: 120000,       // 2 minutes for E2E tests
  PERFORMANCE: 60000 // 1 minute for performance tests
} as const;

export const EPHEMERIS_TOLERANCE = {
  SUN: 0.01,     // 0.01° for Sun
  MOON: 0.05,    // 0.05° for Moon
  PLANETS: 0.02, // 0.02° for other planets
  ASCENDANT: 0.1 // 0.1° for ascendant (more variable)
} as const;

// ═════════════════════════════════════════════════════════════════════════════
// ERROR MATCHERS - Custom Error Assertions
// ═════════════════════════════════════════════════════════════════════════════

export function expectToThrowWithCode(fn: () => void, code: string) {
  try {
    fn();
    throw new Error(`Expected function to throw with code ${code}, but it did not throw`);
  } catch (error: any) {
    if (error.code !== code) {
      throw new Error(`Expected error code ${code}, but got ${error.code}: ${error.message}`);
    }
  }
}

export function expectValidationError(fn: () => void, field?: string) {
  try {
    fn();
    throw new Error('Expected ValidationError, but function did not throw');
  } catch (error: any) {
    expect(error.name).toBe('ValidationError');
    if (field) {
      expect(error.field).toBe(field);
    }
  }
}
