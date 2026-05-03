/**
 * Birth Input Factory — Create consistent SecondsPrecisionInput data for tests.
 *
 * Follows Midday/OpenStatus factory patterns with `overrides` for full flexibility.
 */

import type { SecondsPrecisionInput, LifeEvent, ForensicTraits } from '@ai-pandit/shared';
import { createLifeEvent, createForensicTraits } from '../../lib/__tests__/test-utils.js';

/**
 * Create a seconds-precision birth time rectification input.
 *
 * All fields have sensible defaults that represent a realistic test case
 * (birth in New Delhi, noon time, standard configuration).
 *
 * @example
 * // Default input
 * const input = createBirthInput();
 *
 * // With overrides
 * const mumbaiInput = createBirthInput({
 *   latitude: 19.076,
 *   longitude: 72.877,
 *   dateOfBirth: '1985-08-20',
 * });
 */
export function createBirthInput(overrides: Partial<SecondsPrecisionInput> = {}): SecondsPrecisionInput {
  const base: SecondsPrecisionInput = {
    sessionId: `test-session-${Date.now()}`,
    dateOfBirth: '1990-01-15',
    tentativeTime: '12:00:00',
    latitude: 28.6139,
    longitude: 77.2090,
    timezone: 5.5,
    lifeEvents: [createLifeEvent()],
    forensicTraits: createForensicTraits(),
    offsetConfig: { description: 'Test offset' },
    ...overrides,
  };
  return base;
}

/**
 * Create birth input with birthPlace and gender for API-level tests
 * that submit via the sessions/calculate endpoint (which uses BirthData).
 *
 * These fields are NOT on SecondsPrecisionInput but are commonly
 * needed for request body factories in route-level tests.
 */
export interface ApiBirthInput {
  sessionId: string;
  dateOfBirth: string;
  tentativeTime: string;
  birthPlace: string;
  latitude: number;
  longitude: number;
  timezone: number;
  gender: 'male' | 'female' | 'other';
  lifeEvents: LifeEvent[];
  forensicTraits: ForensicTraits;
  offsetConfig: { description: string };
}

/**
 * Create an API-level birth input with birthPlace and gender fields.
 *
 * Use this for supertest request bodies to /api/sessions or /api/calculate
 * where the API accepts BirthData-like payloads.
 */
export function createApiBirthInput(overrides: Partial<ApiBirthInput> = {}): ApiBirthInput {
  return {
    sessionId: `test-session-${Date.now()}`,
    dateOfBirth: '1990-01-15',
    tentativeTime: '12:00:00',
    birthPlace: 'New Delhi, India',
    latitude: 28.6139,
    longitude: 77.2090,
    timezone: 5.5,
    gender: 'male',
    lifeEvents: [createLifeEvent()],
    forensicTraits: createForensicTraits(),
    offsetConfig: { description: 'Test offset' },
    ...overrides,
  };
}
