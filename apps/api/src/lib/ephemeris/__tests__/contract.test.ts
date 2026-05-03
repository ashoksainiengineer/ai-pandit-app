/**
 * Ephemeris Contract Tests
 * 
 * Verifies the Skyfield ephemeris service contract.
 * Industry-standard contract testing pattern.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import {
  fetchSkyfieldHealth,
  fetchSkyfieldChart,
  fetchSkyfieldCharts,
} from '../skyfield-client.js';
import { initEphemerisProvider, calculateEphemeris } from '../../ephemeris.js';
import type { EphemerisServicePlanetPosition } from '@ai-pandit/shared';
import {
  expectValidEphemerisData,
  expectWithinTolerance,
  TEST_TIMEOUTS,
  KNOWN_BIRTH_CHARTS
} from '../../__tests__/test-utils.js';

describe('Ephemeris Service Contract Tests', () => {
  
  beforeAll(async () => {
    // Initialize provider before running tests
    await initEphemerisProvider();
  });

  describe('Given the Skyfield service is running', () => {
    describe('When checking health endpoint', () => {
      it('Then should return healthy status', async () => {
        const health = await fetchSkyfieldHealth();
        
        expect(health).toBeDefined();
        expect(health.status).toBe('healthy');
        expect(health.service).toBe('ephemeris');
        expect(health.version).toBeDefined();
      }, TEST_TIMEOUTS.INTEGRATION);
    });

    describe('When calculating a single chart', () => {
      it('Then should return all 9 planets with correct structure', async () => {
        const chart = await fetchSkyfieldChart({
          timestampUtc: '1990-05-15T06:30:00Z',
          location: { latitude: 28.6139, longitude: 77.2090 },
          ayanamshaMode: 'lahiri',
          houseSystem: 'placidus',
          nodeMode: 'true',
        });

        expect(chart).toBeDefined();
        expect(chart.timestampUtc).toBe('1990-05-15T06:30:00Z');
        expect(chart.planets).toBeInstanceOf(Array);
        expect(chart.planets).toHaveLength(9);
        
        // Verify all required planets are present
        const planetBodies = chart.planets.map((p: EphemerisServicePlanetPosition) => p.body);
        expect(planetBodies).toContain('sun');
        expect(planetBodies).toContain('moon');
        expect(planetBodies).toContain('mars');
        expect(planetBodies).toContain('mercury');
        expect(planetBodies).toContain('jupiter');
        expect(planetBodies).toContain('venus');
        expect(planetBodies).toContain('saturn');
        expect(planetBodies).toContain('rahu');
        expect(planetBodies).toContain('ketu');
      }, TEST_TIMEOUTS.INTEGRATION);

      it('Then should return sidereal longitudes', async () => {
        const chart = await fetchSkyfieldChart({
          timestampUtc: '1990-05-15T06:30:00Z',
          location: { latitude: 28.6139, longitude: 77.2090 },
          ayanamshaMode: 'lahiri',
          houseSystem: 'placidus',
          nodeMode: 'true',
        });

        // All longitudes should be within 0-360 range
        chart.planets.forEach((planet: EphemerisServicePlanetPosition) => {
          expect(planet.siderealLongitude ?? planet.tropicalLongitude).toBeGreaterThanOrEqual(0);
          expect(planet.siderealLongitude ?? planet.tropicalLongitude).toBeLessThan(360);
        });

        // Ascendant should be present
        expect(chart.houses.ascendantSidereal ?? chart.houses.ascendantTropical).toBeGreaterThanOrEqual(0);
        expect(chart.houses.ascendantSidereal ?? chart.houses.ascendantTropical).toBeLessThan(360);
      }, TEST_TIMEOUTS.INTEGRATION);

      it('Then should maintain Rahu-Ketu opposition (180° apart)', async () => {
        const chart = await fetchSkyfieldChart({
          timestampUtc: '2024-01-01T00:00:00Z',
          location: { latitude: 0, longitude: 0 },
          ayanamshaMode: 'lahiri',
          houseSystem: 'placidus',
          nodeMode: 'true',
        });

        const rahu = chart.planets.find((p: EphemerisServicePlanetPosition) => p.body === 'rahu');
        const ketu = chart.planets.find((p: EphemerisServicePlanetPosition) => p.body === 'ketu');
        
        expect(rahu).toBeDefined();
        expect(ketu).toBeDefined();

        const rahuLong = rahu!.siderealLongitude ?? rahu!.tropicalLongitude;
        const ketuLong = ketu!.siderealLongitude ?? ketu!.tropicalLongitude;

        expectWithinTolerance(
          Math.abs(rahuLong - ketuLong),
          180,
          0.1,
          'Rahu and Ketu should be 180° apart'
        );
      }, TEST_TIMEOUTS.INTEGRATION);
    });

    describe('When calculating batch charts', () => {
      it('Then should handle multiple timestamps efficiently', async () => {
        const timestamps = [
          '1990-05-15T06:30:00Z',
          '1990-05-15T06:31:00Z',
          '1990-05-15T06:32:00Z',
        ];

        const response = await fetchSkyfieldCharts({
          timestampsUtc: timestamps,
          location: { latitude: 28.6139, longitude: 77.2090 },
          ayanamshaMode: 'lahiri',
          houseSystem: 'placidus',
          nodeMode: 'true',
        });

        expect(response.charts).toHaveLength(3);
        response.charts.forEach(chart => {
          expect(chart.planets).toHaveLength(9);
        });
      }, TEST_TIMEOUTS.INTEGRATION);

      it('Then should handle large batches (up to 100 charts)', async () => {
        const timestamps = Array.from({ length: 100 }, (_, i) => {
          const date = new Date('1990-05-15T06:30:00Z');
          date.setMinutes(date.getMinutes() + i);
          return date.toISOString().replace('.000Z', 'Z');
        });

        const startTime = Date.now();
        const response = await fetchSkyfieldCharts({
          timestampsUtc: timestamps,
          location: { latitude: 28.6139, longitude: 77.2090 },
          ayanamshaMode: 'lahiri',
          houseSystem: 'placidus',
          nodeMode: 'true',
        });
        const duration = Date.now() - startTime;

        expect(response.charts).toHaveLength(100);
        expect(duration).toBeLessThan(15000); // Should complete within 15 seconds (Skyfield processing time)
      }, TEST_TIMEOUTS.PERFORMANCE);
    });
  });

  describe('Given ephemeris provider abstraction', () => {
    describe('When calculating through provider interface', () => {
      it('Then should return consistent ephemeris data', async () => {
        const result = await calculateEphemeris(
          KNOWN_BIRTH_CHARTS.delhiNoon.dateOfBirth,
          KNOWN_BIRTH_CHARTS.delhiNoon.time,
          KNOWN_BIRTH_CHARTS.delhiNoon.latitude,
          KNOWN_BIRTH_CHARTS.delhiNoon.longitude,
          KNOWN_BIRTH_CHARTS.delhiNoon.timezone
        );

        expectValidEphemerisData(result);
        
        // Verify Sun sign matches expectation
        expect(result.planets.sun.sign).toBe(KNOWN_BIRTH_CHARTS.delhiNoon.expected.sunSign);
      }, TEST_TIMEOUTS.INTEGRATION);

      it('Then should handle edge cases correctly', async () => {
        // Leap year birth
        const leapYearResult = await calculateEphemeris(
          KNOWN_BIRTH_CHARTS.leapYearBirth.dateOfBirth,
          KNOWN_BIRTH_CHARTS.leapYearBirth.time,
          KNOWN_BIRTH_CHARTS.leapYearBirth.latitude,
          KNOWN_BIRTH_CHARTS.leapYearBirth.longitude,
          KNOWN_BIRTH_CHARTS.leapYearBirth.timezone
        );

        expectValidEphemerisData(leapYearResult);
        expect(leapYearResult.planets.sun.sign).toBe(KNOWN_BIRTH_CHARTS.leapYearBirth.expected.sunSign);
      }, TEST_TIMEOUTS.INTEGRATION);

      it('Then should handle extreme latitudes', async () => {
        // Arctic location
        const arcticResult = await calculateEphemeris(
          '2000-06-21',
          '12:00:00',
          78.2232, // Svalbard
          15.6267,
          1
        );

        expectValidEphemerisData(arcticResult);
      }, TEST_TIMEOUTS.INTEGRATION);

      it('Then should handle southern hemisphere', async () => {
        const sydneyResult = await calculateEphemeris(
          KNOWN_BIRTH_CHARTS.sydneyAfternoon.dateOfBirth,
          KNOWN_BIRTH_CHARTS.sydneyAfternoon.time,
          KNOWN_BIRTH_CHARTS.sydneyAfternoon.latitude,
          KNOWN_BIRTH_CHARTS.sydneyAfternoon.longitude,
          KNOWN_BIRTH_CHARTS.sydneyAfternoon.timezone
        );

        expectValidEphemerisData(sydneyResult);
        expect(sydneyResult.planets.sun.sign).toBe(KNOWN_BIRTH_CHARTS.sydneyAfternoon.expected.sunSign);
      }, TEST_TIMEOUTS.INTEGRATION);
    });
  });

  describe('Given invalid inputs', () => {
    describe('When providing invalid coordinates', () => {
      it('Then should handle out-of-range latitude gracefully', async () => {
        await expect(calculateEphemeris(
          '1990-05-15',
          '12:00:00',
          95, // Invalid
          77.2090,
          5.5
        )).rejects.toThrow();
      }, TEST_TIMEOUTS.INTEGRATION);

      it('Then should handle out-of-range longitude gracefully', async () => {
        await expect(calculateEphemeris(
          '1990-05-15',
          '12:00:00',
          28.6139,
          200, // Invalid
          5.5
        )).rejects.toThrow();
      }, TEST_TIMEOUTS.INTEGRATION);
    });

    describe('When providing invalid dates', () => {
      it('Then should handle invalid date format gracefully', async () => {
        await expect(calculateEphemeris(
          'invalid-date',
          '12:00:00',
          28.6139,
          77.2090,
          5.5
        )).rejects.toThrow();
      }, TEST_TIMEOUTS.INTEGRATION);
    });
  });
});
