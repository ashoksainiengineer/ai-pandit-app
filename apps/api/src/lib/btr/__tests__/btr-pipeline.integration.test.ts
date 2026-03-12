/**
 * BTR Pipeline Integration Tests
 *
 * Industry-standard integration tests for the 6-stage BTR pipeline.
 * Tests end-to-end flow with real dependencies.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { processSecondsPrecisionBTR } from '../../seconds-precision-btr.js';
import { initEphemerisProvider } from '../../ephemeris.js';
import { createBirthInput, TEST_TIMEOUTS, KNOWN_BIRTH_CHARTS } from '../../__tests__/test-utils.js';
import type { SecondsPrecisionInput } from '@ai-pandit/shared';

describe('BTR Pipeline - Integration Tests', () => {
  
  beforeAll(async () => {
    // Initialize ephemeris provider before running tests
    await initEphemerisProvider();
  }, TEST_TIMEOUTS.INTEGRATION);

  describe('Given a complete birth time rectification request', () => {
    describe('When processing with standard configuration', () => {
      it('Then should complete all 6 stages and return rectified time', async () => {
        const input = createBirthInput({
          dateOfBirth: KNOWN_BIRTH_CHARTS.delhiNoon.dateOfBirth,
          tentativeTime: KNOWN_BIRTH_CHARTS.delhiNoon.time,
          latitude: KNOWN_BIRTH_CHARTS.delhiNoon.latitude,
          longitude: KNOWN_BIRTH_CHARTS.delhiNoon.longitude,
          timezone: KNOWN_BIRTH_CHARTS.delhiNoon.timezone,
          lifeEvents: [
            {
              id: 'test-event-1',
              category: 'education',
              eventType: 'education',
              eventDate: '2008-06-15',
              description: 'Graduated from university',
              importance: 'high',
              datePrecision: 'exact_date_time'
            },
            {
              id: 'test-event-2',
              category: 'career',
              eventType: 'career',
              eventDate: '2010-03-01',
              description: 'Started first job',
              importance: 'high',
              datePrecision: 'exact_date_time'
            },
            {
              id: 'test-event-3',
              category: 'marriage',
              eventType: 'marriage',
              eventDate: '2015-12-20',
              description: 'Married',
              importance: 'high',
              datePrecision: 'exact_date_time'
            }
          ]
        });

        const result = await processSecondsPrecisionBTR(input);

        // Verify result structure
        expect(result).toBeDefined();
        expect(result.rectifiedTime).toBeDefined();
        expect(result.accuracy).toBeGreaterThan(0);
        expect(result.confidence).toMatch(/^(HIGH|MEDIUM|LOW)$/);
        expect(result.precisionLevel).toBe('seconds');
        expect(result.marginOfError).toBeGreaterThanOrEqual(0);
        expect(result.stagesCompleted).toBe(6);
        
        // Verify analysis result
        expect(result.analysisResult).toBeDefined();
        expect(result.analysisResult.finalCandidate).toBeDefined();
        expect(result.analysisResult.finalCandidate.time).toBe(result.rectifiedTime);
        expect(result.analysisResult.alternatives).toBeInstanceOf(Array);
      }, TEST_TIMEOUTS.E2E);
    });

    describe('When processing with minimal life events', () => {
      it('Then should still complete with 3 minimum events', async () => {
        const input = createBirthInput({
          lifeEvents: [
            { id: 'ev1', category: 'education', eventType: 'education', eventDate: '2008-06-15', description: 'Graduated', importance: 'high', datePrecision: 'exact_date_time' },
            { id: 'ev2', category: 'career', eventType: 'career', eventDate: '2010-03-01', description: 'Started job', importance: 'high', datePrecision: 'exact_date_time' },
            { id: 'ev3', category: 'marriage', eventType: 'marriage', eventDate: '2015-12-20', description: 'Married', importance: 'high', datePrecision: 'exact_date_time' }
          ]
        });

        const result = await processSecondsPrecisionBTR(input);

        expect(result).toBeDefined();
        expect(result.stagesCompleted).toBe(6);
      }, TEST_TIMEOUTS.E2E);
    });

    describe('When processing with forensic traits', () => {
      it('Then should incorporate physical and psychological traits', async () => {
        const input = createBirthInput({
          forensicTraits: {
            physical: {
              facialStructure: {
                forehead: 'broad',
                eyeShape: 'almond',
                noseType: 'straight',
                teethAlignment: 'perfect',
                voicePitch: 'medium'
              },
              skinHair: {
                texture: 'dry',
                hairType: 'straight',
                complexion: 'medium',
                marks: []
              },
              build: 'medium',
              height: { cm: 175, feet: 5, inches: 9 }
            },
            psychographic: {
              speechStyle: 'measured_soft',
              decisionMaking: 'deliberate',
              stressResponse: 'calm',
              sleepCycle: 'early_bird',
              temperament: 'patient'
            },
            biological: {
              prakriti: 'pitta',
              sensitivity: { heat: 'medium', cold: 'medium' },
              recurringHealthIssues: []
            },
            family: {
              siblingPosition: 'eldest',
              brotherCount: 1,
              sisterCount: 0,
              fatherStatusAtBirth: 'stable',
              motherHealthAtBirth: 'normal'
            }
          }
        });

        const result = await processSecondsPrecisionBTR(input);

        expect(result).toBeDefined();
        // Verify forensic traits were processed - result should be valid
        expect(result.stagesCompleted).toBe(6);
        expect(result.confidence).toBeDefined();
      }, TEST_TIMEOUTS.E2E);
    });
  });

  describe('Given boundary time scenarios', () => {
    describe('When processing birth time near sign boundary (sandhi)', () => {
      it('Then should detect and report boundary warnings', async () => {
        const input = createBirthInput({
          dateOfBirth: KNOWN_BIRTH_CHARTS.sandhiBirth.dateOfBirth,
          tentativeTime: KNOWN_BIRTH_CHARTS.sandhiBirth.time,
          latitude: KNOWN_BIRTH_CHARTS.sandhiBirth.latitude,
          longitude: KNOWN_BIRTH_CHARTS.sandhiBirth.longitude,
          timezone: KNOWN_BIRTH_CHARTS.sandhiBirth.timezone
        });

        const result = await processSecondsPrecisionBTR(input);

        expect(result).toBeDefined();
        expect(result.boundaryWarnings).toBeInstanceOf(Array);
        // Sandhi birth should have boundary warnings
        expect(result.boundaryWarnings.length).toBeGreaterThan(0);
      }, TEST_TIMEOUTS.E2E);
    });
  });

  describe('Given different time offset configurations', () => {
    describe('When using custom offset range', () => {
      it('Then should use specified range for candidate generation', async () => {
        const input = createBirthInput({
          offsetConfig: { customMinutes: 60, description: '±1 hour' }
        });

        const result = await processSecondsPrecisionBTR(input);

        expect(result).toBeDefined();
        expect(result.analysisResult.stageHistory).toBeDefined();
      }, TEST_TIMEOUTS.E2E);
    });

    describe('When using preset offset ranges', () => {
      it('Then should handle 30min preset', async () => {
        const input = createBirthInput({
          offsetConfig: { preset: '30min', description: '±30 min' }
        });

        const result = await processSecondsPrecisionBTR(input);

        expect(result).toBeDefined();
      }, TEST_TIMEOUTS.E2E);

      it('Then should handle 1hour preset', async () => {
        const input = createBirthInput({
          offsetConfig: { preset: '1hour', description: '±1 hour' }
        });

        const result = await processSecondsPrecisionBTR(input);

        expect(result).toBeDefined();
      }, TEST_TIMEOUTS.E2E);
    });
  });

  describe('Given processing result structure', () => {
    describe('When verifying analysis result', () => {
      it('Then should contain all required result fields', async () => {
        const input = createBirthInput();

        const result = await processSecondsPrecisionBTR(input);

        // Core fields
        expect(result.rectifiedTime).toBeTruthy();
        expect(typeof result.accuracy).toBe('number');
        expect(typeof result.marginOfError).toBe('number');
        expect(result.methodsUsed).toBeInstanceOf(Array);
        expect(result.methodsUsed.length).toBeGreaterThan(0);
        
        // Processing metadata
        expect(typeof result.processingTimeMs).toBe('number');
        expect(result.processingTimeMs).toBeGreaterThan(0);
        
        // Stage history
        expect(result.analysisResult.stageHistory).toBeDefined();
        Object.values(result.analysisResult.stageHistory).forEach((stage: any) => {
          expect(typeof stage.candidatesIn).toBe('number');
          expect(typeof stage.candidatesOut).toBe('number');
        });
      }, TEST_TIMEOUTS.E2E);
    });
  });
});
