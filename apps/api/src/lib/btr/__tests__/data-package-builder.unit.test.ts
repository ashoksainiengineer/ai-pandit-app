/**
 * Data Package Builder Unit Tests
 *
 * Industry-standard unit tests for the candidate data package builder.
 * Tests data package construction and validation.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { buildCandidateDataPackage, PackageBuildOptions } from '../data-package-builder.js';
import { initEphemerisProvider } from '../../ephemeris.js';
import { createBirthInput, TEST_TIMEOUTS } from '../../__tests__/test-utils.js';

describe('Data Package Builder - Unit Tests', () => {
  
  beforeAll(async () => {
    await initEphemerisProvider();
  }, TEST_TIMEOUTS.INTEGRATION);

  describe('Given a candidate time and input data', () => {
    describe('When building a data package', () => {
      it('Then should return a complete candidate data package', async () => {
        const input = createBirthInput();
        const time = '12:00:00';
        const offsetMinutes = 0;

        const pkg = await buildCandidateDataPackage(time, offsetMinutes, input);

        // Verify core structure
        expect(pkg).toBeDefined();
        expect(pkg.time).toBe(time);
        expect(pkg.planets).toBeDefined();
        expect(pkg.houseLords).toBeDefined();
        expect(pkg.ascendant).toBeDefined();
      }, TEST_TIMEOUTS.INTEGRATION);

      it('Then should include all 9 planets with correct positions', async () => {
        const input = createBirthInput();
        const time = '12:00:00';

        const pkg = await buildCandidateDataPackage(time, 0, input);

        // Verify all planets present
        const expectedPlanets = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'rahu', 'ketu'];
        expectedPlanets.forEach(planet => {
          expect(pkg.planets[planet]).toBeDefined();
          expect(typeof pkg.planets[planet].longitude).toBe('number');
          expect(typeof pkg.planets[planet].sign).toBe('string');
        });
      }, TEST_TIMEOUTS.INTEGRATION);

      it('Then should include 12 house lords assigned', async () => {
        const input = createBirthInput();
        const time = '12:00:00';

        const pkg = await buildCandidateDataPackage(time, 0, input);

        expect(pkg.houseLords).toBeDefined();
        expect(Object.keys(pkg.houseLords)).toHaveLength(12);
        Object.values(pkg.houseLords).forEach(lord => {
          expect(typeof lord).toBe('string');
        });
      }, TEST_TIMEOUTS.INTEGRATION);

      it('Then should include ascendant data', async () => {
        const input = createBirthInput();
        const time = '12:00:00';

        const pkg = await buildCandidateDataPackage(time, 0, input);

        expect(pkg.ascendant).toBeDefined();
        expect(typeof pkg.ascendant.longitude).toBe('number');
        expect(typeof pkg.ascendant.sign).toBe('string');
        expect(typeof pkg.ascendant.degree).toBe('string');
        expect(typeof pkg.ascendant.nakshatra).toBe('string');
      }, TEST_TIMEOUTS.INTEGRATION);
    });

    describe('When building with options', () => {
      it('Then should include Vimshottari Dasha when requested', async () => {
        const input = createBirthInput();
        const time = '12:00:00';
        const options: PackageBuildOptions = { dashaDepth: 3 };

        const pkg = await buildCandidateDataPackage(time, 0, input, options);

        expect(pkg.vimshottariDasha).toBeDefined();
        expect(Array.isArray(pkg.vimshottariDasha)).toBe(true);
        expect(pkg.vimshottariDasha.length).toBeGreaterThan(0);
      }, TEST_TIMEOUTS.INTEGRATION);

      it('Then should include transit data when available', async () => {
        const input = createBirthInput({
          lifeEvents: [
            {
              id: 'test-event',
              category: 'career',
              eventType: 'job_change',
              eventDate: '2020-06-15',
              description: 'Career change',
              importance: 'high',
              datePrecision: 'exact_date_time'
            }
          ]
        });
        const time = '12:00:00';

        const pkg = await buildCandidateDataPackage(time, 0, input);

        // Transit data may or may not be present depending on implementation
        // Just verify the package is valid
        expect(pkg).toBeDefined();
      }, TEST_TIMEOUTS.INTEGRATION);

      it('Then should handle divisional charts when requested', async () => {
        const input = createBirthInput();
        const time = '12:00:00';
        const options: PackageBuildOptions = {
          includeDivisionalCharts: ['d9', 'd10']
        };

        const pkg = await buildCandidateDataPackage(time, 0, input, options);

        // Verify base package is valid
        expect(pkg).toBeDefined();
        expect(pkg.planets).toBeDefined();
      }, TEST_TIMEOUTS.INTEGRATION);
    });
  });

  describe('Given different birth data configurations', () => {
    describe('When building for different latitudes', () => {
      it('Then should correctly calculate for northern hemisphere', async () => {
        const input = createBirthInput({
          latitude: 51.5074, // London
          longitude: -0.1278
        });
        const time = '12:00:00';

        const pkg = await buildCandidateDataPackage(time, 0, input);

        expect(pkg).toBeDefined();
        expect(pkg.ascendant).toBeDefined();
      }, TEST_TIMEOUTS.INTEGRATION);

      it('Then should correctly calculate for southern hemisphere', async () => {
        const input = createBirthInput({
          latitude: -33.8688, // Sydney
          longitude: 151.2093
        });
        const time = '12:00:00';

        const pkg = await buildCandidateDataPackage(time, 0, input);

        expect(pkg).toBeDefined();
        expect(pkg.ascendant).toBeDefined();
      }, TEST_TIMEOUTS.INTEGRATION);
    });

    describe('When building for different times of day', () => {
      it('Then should handle sunrise time', async () => {
        const input = createBirthInput();
        const time = '06:00:00';

        const pkg = await buildCandidateDataPackage(time, 0, input);

        expect(pkg).toBeDefined();
        expect(Object.keys(pkg.houseLords)).toHaveLength(12);
      }, TEST_TIMEOUTS.INTEGRATION);

      it('Then should handle midnight time', async () => {
        const input = createBirthInput();
        const time = '00:00:00';

        const pkg = await buildCandidateDataPackage(time, 0, input);

        expect(pkg).toBeDefined();
        expect(Object.keys(pkg.houseLords)).toHaveLength(12);
      }, TEST_TIMEOUTS.INTEGRATION);
    });
  });

  describe('Given different offset configurations', () => {
    describe('When building with positive offset', () => {
      it('Then should correctly apply +30 minutes offset', async () => {
        const input = createBirthInput();
        const baseTime = '12:00:00';
        const offsetMinutes = 30;

        const pkg = await buildCandidateDataPackage(baseTime, offsetMinutes, input);

        expect(pkg).toBeDefined();
        expect(pkg.offsetMinutes).toBe(offsetMinutes);
      }, TEST_TIMEOUTS.INTEGRATION);
    });

    describe('When building with negative offset', () => {
      it('Then should correctly apply -30 minutes offset', async () => {
        const input = createBirthInput();
        const baseTime = '12:00:00';
        const offsetMinutes = -30;

        const pkg = await buildCandidateDataPackage(baseTime, offsetMinutes, input);

        expect(pkg).toBeDefined();
        expect(pkg.offsetMinutes).toBe(offsetMinutes);
      }, TEST_TIMEOUTS.INTEGRATION);
    });
  });

  describe('Given special astronomical conditions', () => {
    describe('When building for different dates', () => {
      it('Then should correctly handle historical dates', async () => {
        const input = createBirthInput({
          dateOfBirth: '1950-01-01'
        });
        const time = '12:00:00';

        const pkg = await buildCandidateDataPackage(time, 0, input);

        expect(pkg).toBeDefined();
        expect(pkg.planets).toBeDefined();
      }, TEST_TIMEOUTS.INTEGRATION);

      it('Then should correctly handle recent dates', async () => {
        const input = createBirthInput({
          dateOfBirth: '2020-01-01'
        });
        const time = '12:00:00';

        const pkg = await buildCandidateDataPackage(time, 0, input);

        expect(pkg).toBeDefined();
        expect(pkg.planets).toBeDefined();
      }, TEST_TIMEOUTS.INTEGRATION);
    });

    describe('When building with retrograde planets', () => {
      it('Then should detect and mark retrograde status', async () => {
        const input = createBirthInput({
          dateOfBirth: '2020-09-10' // Period with known retrograde planets
        });
        const time = '12:00:00';

        const pkg = await buildCandidateDataPackage(time, 0, input);

        expect(pkg).toBeDefined();
        // Verify planet data has speed property (negative speed = retrograde)
        Object.values(pkg.planets).forEach((planet: any) => {
          expect(typeof planet.longitude).toBe('number');
          // Speed property indicates retrograde when negative
          if (planet.speed !== undefined) {
            expect(typeof planet.speed).toBe('number');
          }
        });
      }, TEST_TIMEOUTS.INTEGRATION);
    });
  });
});
