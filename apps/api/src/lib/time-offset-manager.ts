// lib/time-offset-manager.ts
// 🔱 GOD-TIER Time Offset Manager with Batch Support
// Research-backed: Max 10 candidates per AI batch for optimal attention

import { config } from '../config/index.js';
import { logger } from './logger.js';
import type { OffsetPreset, TimeOffsetConfig, CandidateTime } from '@ai-pandit/shared';

// Re-export types for backwards compatibility
export type { OffsetPreset, TimeOffsetConfig, CandidateTime };

// ═════════════════════════════════════════════════════════════════════════
// CONSTANTS - RESEARCH-BACKED (Dynamic)
// ═════════════════════════════════════════════════════════════════════════

// Absolute max candidates per AI call
export const MAX_BATCH_SIZE = config.ai.batchSizeMax;

// Survivors per batch for tournament progression
export const SURVIVORS_PER_BATCH = Math.ceil(config.ai.batchSizeMax * config.ai.survivalRateBase * config.ai.survivalElasticityFactor);

/**
 * 🔱 DYNAMIC BATCH SIZE - Based on offset range
 * Smaller offsets → Smaller batches (more focused AI attention)
 * Larger offsets → Max batch size (efficiency)
 * 
 * @param totalCandidates Total candidates in the pool
 * @param offsetMinutes The offset range in minutes
 * @returns Optimal batch size (5-10)
 */
export function getDynamicBatchSize(totalCandidates: number, offsetMinutes: number): number {
  const min = config.ai.batchSizeMin;
  const max = config.ai.batchSizeMax;

  // Linear scaling between 5 and 360 minutes
  if (offsetMinutes <= 15) return min;
  if (offsetMinutes <= 30) return Math.min(min + 1, max);
  if (offsetMinutes <= 60) return Math.min(min + 2, max);
  if (offsetMinutes <= 120) return Math.min(min + 3, max);
  if (offsetMinutes <= 360) return Math.min(min + 4, max);

  return max;
}

/**
 * 🔱 GOD-TIER ELASTICITY: Dynamic survival rate based on offset range
 * Wide offsets (±12h) need high survival rates (50-60%) to prevent true time from slipping between grid cracks.
 * Tight offsets (±30m) can use strict elimination (25-30%) because the grid is already hitting D9/D60 boundaries.
 *
 * @param batchSize Current batch size
 * @param offsetMinutes The offset range in minutes
 * @param isFirstRound If true, preserves more candidates (safety net for tentative time)
 */
export function getDynamicSurvivors(batchSize: number, offsetMinutes: number, isFirstRound: boolean = false): number {
  const baseRate = config.ai.survivalRateBase;
  const elasticity = config.ai.survivalElasticityFactor;
  let survivalRate = baseRate;

  // ⚙️ Determine base survival rate by Gear
  if (offsetMinutes > 360) survivalRate = baseRate * (elasticity ** 2); // Gear 5
  else if (offsetMinutes > 120) survivalRate = baseRate * elasticity; // Gear 4
  else if (offsetMinutes > 30) survivalRate = baseRate; // Gear 3
  else if (offsetMinutes > 15) survivalRate = baseRate * (1 / elasticity); // Gear 2
  else survivalRate = baseRate * (1 / (elasticity ** 2)); // Gear 1

  // 🔱 FIRST ROUND SAFETY NET: Add 10% elasticity
  if (isFirstRound) {
    survivalRate = Math.min(survivalRate + 0.10, 0.70);
  }

  let survivors = Math.ceil(batchSize * survivalRate);

  // Guarantee minimums for sufficient tournament flow
  if (batchSize >= 4 && survivors < 2) survivors = 2;
  if (batchSize >= 2 && survivors < 1) survivors = 1;

  return survivors;
}

// ═════════════════════════════════════════════════════════════════════════
// OFFSET CONFIGURATION PRESETS
// ═════════════════════════════════════════════════════════════════════════

const OFFSET_PRESETS: Record<OffsetPreset, { label: string; minutes: number; interval: number; intervalSeconds?: number }> = {
  '30min': {
    label: '±30 minutes',
    minutes: 30,
    interval: 1, // 1 min = 60 candidates
  },
  '1hour': {
    label: '±1 hour',
    minutes: 60,
    interval: 1.5, // 90 seconds = 80 candidates (Avoids 2m D60 blindspot)
  },
  '2hours': {
    label: '±2 hours',
    minutes: 120,
    interval: 1.5, // 90 seconds = 160 candidates
  },
  '4hours': {
    label: '±4 hours',
    minutes: 240,
    interval: 3, // 3 min = 160 candidates
  },
  '6hours': {
    label: '±6 hours',
    minutes: 360,
    interval: 4, // 4 min = 180 candidates
  },
  '12hours': {
    label: '±12 hours',
    minutes: 720,
    interval: 5, // 5 min = 288 candidates (Never use 10m to avoid D12 skips)
  },
  'seconds-30': {
    label: '±5 minutes (30-sec intervals)',
    minutes: 5,
    interval: 0.5,
  },
  'seconds-6': {
    label: '±1 minute (6-sec intervals)',
    minutes: 1,
    interval: 0.1,
    intervalSeconds: 6,
  },
};

// ═════════════════════════════════════════════════════════════════════════
// 🔱 VEDIC-BASED ADAPTIVE INTERVAL
// ═════════════════════════════════════════════════════════════════════════
// 
// Based on Vedic Astrology principles:
// - Lagna (Ascendant) changes sign every ~2 hours
// - Navamsha (D9) Lagna changes every ~13 minutes
// - Dwadasamsha (D12) changes every ~10 minutes
// - Shashtiamsha (D60) changes every ~2 minutes
//
// For smaller offsets: FINER grid (more candidates for precision)
// For larger offsets: COARSER grid aligned with Lagna boundaries

export function getAdaptiveInterval(offsetMinutes: number): number {
  // 🔱 GEAR 1: Extreme Precision (D150/D60 Capture)
  if (offsetMinutes <= 5) return 0.25; // 15 seconds
  if (offsetMinutes <= 15) return 0.5; // 30 seconds

  // 🔱 GEAR 2: Standard Window (D9 Capture)
  if (offsetMinutes <= 30) return 1; // 60 seconds

  // 🔱 GEAR 3: Wide Window (D1/D9 Baseline, avoiding 2m D60 blindspot)
  if (offsetMinutes <= 120) return 1.5; // 90 seconds

  // 🔱 GEAR 4: Massive Window (Strict D1 Mapping)
  if (offsetMinutes <= 240) return 3; // 3 minutes
  if (offsetMinutes <= 360) return 4; // 4 minutes

  // 🔱 GEAR 5: Absolute Unknown (Strict D1 Quadrant)
  // Maximum 5 minutes to ensure we never completely step over D10 (12m) or D12 (10m) signs
  return 5;
}

/**
 * 🔱 Get expected candidate count for a given offset
 * Useful for UI and progress estimation
 */
export function getExpectedCandidateCount(offsetMinutes: number): number {
  const interval = getAdaptiveInterval(offsetMinutes);
  return Math.ceil((offsetMinutes * 2) / interval) + 1;
}

// ═════════════════════════════════════════════════════════════════════════
// MAIN FUNCTION: Generate Candidate Times (CHRONOLOGICAL ORDER)
// ═════════════════════════════════════════════════════════════════════════

export function generateCandidateTimes(
  tentativeTime: string, // HH:MM:SS
  offsetConfig: TimeOffsetConfig
): CandidateTime[] {
  try {
    logger.info('🔱 Generating candidates (chronological order)', { tentativeTime, offsetConfig });

    // ─────────────────────────────────────────────────────────────────────
    // Parse tentative time
    // ─────────────────────────────────────────────────────────────────────

    const [hours, minutes, seconds] = tentativeTime.split(':').map(Number);
    const baseMinutes = hours * 60 + minutes + (seconds / 60);

    // ─────────────────────────────────────────────────────────────────────
    // Determine offset range and interval
    // ─────────────────────────────────────────────────────────────────────

    let offsetMinutes: number;
    if (offsetConfig.customMinutes !== undefined) {
      offsetMinutes = offsetConfig.customMinutes;
    } else if (offsetConfig.preset) {
      const preset = OFFSET_PRESETS[offsetConfig.preset];
      if (!preset) {
        logger.warn(`Invalid preset '${offsetConfig.preset}' provided, falling back to '2hours'`, { tentativeTime });
        offsetMinutes = 120; // 2 hours
      } else {
        offsetMinutes = preset.minutes;
      }
    } else {
      throw new Error('No offset configuration provided');
    }

    // 🔱 Adaptive interval for consistent candidate count
    const interval = getAdaptiveInterval(offsetMinutes);

    const presetLabel = offsetConfig.preset ? (OFFSET_PRESETS[offsetConfig.preset]?.label || 'Custom/Fallback') : 'Custom';
    const description = offsetConfig.customMinutes !== undefined
      ? `±${offsetMinutes} min (${interval >= 1 ? interval + 'min' : (interval * 60) + 's'} Grid)`
      : `${presetLabel} (${interval >= 1 ? interval + 'min' : (interval * 60) + 's'} Grid)`;

    const expectedCandidates = Math.ceil(offsetMinutes / interval) * 2 + 1;

    logger.info('Offset configuration', {
      offsetMinutes,
      interval,
      description,
      expectedCandidates,
      expectedBatches: Math.ceil(expectedCandidates / MAX_BATCH_SIZE),
    });

    // ─────────────────────────────────────────────────────────────────────
    // Generate candidates in CHRONOLOGICAL ORDER (earliest → latest)
    // NO PRIORITY SORTING - All candidates are equal
    // ─────────────────────────────────────────────────────────────────────

    const candidates: CandidateTime[] = [];

    // Start from earliest time (negative offset)
    const totalSteps = Math.round((offsetMinutes * 2) / interval);
    for (let step = 0; step <= totalSteps; step++) {
      const offset = -offsetMinutes + (step * interval);
      const candidateMinutes = baseMinutes + offset;
      const candidate = convertMinutesToTime(candidateMinutes, tentativeTime, offset);
      candidates.push(candidate);
    }

    // Ensure tentative time is included if not already
    const hasTentative = candidates.some(c => c.time === tentativeTime || Math.abs(c.offsetMinutes) < 1e-9);
    if (!hasTentative) {
      candidates.push({
        time: tentativeTime,
        offsetMinutes: 0,
        offsetDescription: 'Tentative (Original)',
      });
      // Re-sort chronologically
      candidates.sort((a, b) => a.offsetMinutes - b.offsetMinutes);
    }

    logger.info('🔱 Generated candidates (chronological, no priority)', {
      count: candidates.length,
      offsetRange: `±${offsetMinutes} minutes`,
      interval: `${interval} minutes`,
      firstCandidate: candidates[0]?.time,
      lastCandidate: candidates[candidates.length - 1]?.time,
    });

    return candidates;
  } catch (error) {
    logger.error('Candidate time generation failed', error);
    throw error;
  }
}

// ═════════════════════════════════════════════════════════════════════════
// 🔱 BATCH SPLITTER - Research-backed 10-candidate batches
// ═════════════════════════════════════════════════════════════════════════

function hashStringToUint32(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function createSeededRng(seed: number): () => number {
  let state = seed || 1;
  return () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return (state >>> 0) / 4294967296;
  };
}

function getCandidateSeedToken(candidate: unknown, index: number): string {
  if (typeof candidate === 'object' && candidate !== null) {
    const maybeCandidate = candidate as Record<string, unknown>;
    if (typeof maybeCandidate.time === 'string') {
      return maybeCandidate.time;
    }
  }
  return String(index);
}

function deterministicShuffle<T>(candidates: T[], seedInput: string): T[] {
  const shuffled = [...candidates];
  const random = createSeededRng(hashStringToUint32(seedInput));
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function splitIntoBatches<T>(
  candidates: T[],
  batchSize: number = MAX_BATCH_SIZE,
  seedKey?: string
): T[][] {
  const batches: T[][] = [];

  // Shuffle deterministically to avoid positional bias while keeping runs reproducible.
  const seedBase = candidates.map((candidate, index) => getCandidateSeedToken(candidate, index)).join('|');
  const shuffled = deterministicShuffle(candidates, `${seedKey || 'default'}|${batchSize}|${seedBase}`);

  for (let i = 0; i < shuffled.length; i += batchSize) {
    batches.push(shuffled.slice(i, i + batchSize));
  }

  logger.info('🔱 Split into batches', {
    totalCandidates: candidates.length,
    batchCount: batches.length,
    batchSize,
  });

  return batches;
}

// ═════════════════════════════════════════════════════════════════════════
// 🔱 GOD-TIER SAFETY NET - Ensure tentative time never gets eliminated
// ═════════════════════════════════════════════════════════════════════════

/**
 * Creates a "safety net" of candidates around the tentative time
 * This ensures the actual birth time (which is often close to tentative)
 * NEVER gets eliminated in early stages
 *
 * @param tentativeTime The original tentative birth time (HH:MM:SS)
 * @param allCandidates All generated candidates
 * @returns Candidates with safety net times guaranteed to be included
 */
export function injectSafetyNetCandidates(
  tentativeTime: string,
  allCandidates: CandidateTime[]
): CandidateTime[] {
  const safetyOffsets = [
    { min: 0, desc: 'Tentative (Original)' },
    { min: -1, desc: '-1m Safety Net' },
    { min: 1, desc: '+1m Safety Net' },
    { min: -2, desc: '-2m Safety Net' },
    { min: 2, desc: '+2m Safety Net' },
    { min: -5, desc: '-5m Safety Net' },
    { min: 5, desc: '+5m Safety Net' },
  ];

  const existingTimes = new Set(allCandidates.map(c => c.time));
  const safetyCandidates: CandidateTime[] = [];

  // Parse tentative time
  const [h, m, s] = tentativeTime.split(':').map(Number);
  const baseTotalMinutes = h * 60 + m + s / 60;

  for (const offset of safetyOffsets) {
    const candidateMinutes = baseTotalMinutes + offset.min;
    const candidate = convertMinutesToTimeSafetyNet(candidateMinutes, offset.min, offset.desc);

    // Only add if not already present
    if (!existingTimes.has(candidate.time)) {
      safetyCandidates.push(candidate);
      existingTimes.add(candidate.time);
    }
  }

  // Combine and re-sort chronologically
  const combined = [...safetyCandidates, ...allCandidates];
  combined.sort((a, b) => a.offsetMinutes - b.offsetMinutes);

  logger.info('🔱 Safety Net Injected', {
    tentativeTime,
    safetyCandidatesAdded: safetyCandidates.length,
    totalCandidates: combined.length,
    safetyTimes: safetyCandidates.map(c => c.time)
  });

  return combined;
}

/**
 * Helper for safety net time conversion
 */
function convertMinutesToTimeSafetyNet(
  totalMinutes: number,
  offsetMinutes: number,
  description: string
): CandidateTime {
  // Handle day wraparound
  let adjustedMinutes = totalMinutes;
  let dayOffset = 0;

  if (adjustedMinutes < 0) {
    dayOffset = -1;
    adjustedMinutes += 24 * 60;
  } else if (adjustedMinutes >= 24 * 60) {
    dayOffset = 1;
    adjustedMinutes -= 24 * 60;
  }

  const h = Math.floor(adjustedMinutes / 60);
  const m = Math.floor(adjustedMinutes % 60);
  const s = Math.round((adjustedMinutes % 1) * 60);

  const timeString = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;

  let offsetDescription = description;
  if (dayOffset !== 0) {
    offsetDescription += ` (${dayOffset > 0 ? 'Next' : 'Previous'} day)`;
  }

  return {
    time: timeString,
    offsetMinutes: Number(offsetMinutes.toFixed(4)),
    offsetDescription,
  };
}

// ═════════════════════════════════════════════════════════════════════════
// 🔱 REFINEMENT GRID - Generate finer grid around survivors
// ═════════════════════════════════════════════════════════════════════════

export function generateRefinementGrid(
  centerTime: string,
  rangeMinutes: number,
  intervalSeconds: number
): CandidateTime[] {
  const candidates: CandidateTime[] = [];

  const [hours, minutes, seconds] = centerTime.split(':').map(Number);
  const baseSeconds = hours * 3600 + minutes * 60 + seconds;
  const rangeSec = rangeMinutes * 60;

  for (let offset = -rangeSec; offset <= rangeSec; offset += intervalSeconds) {
    let totalSec = baseSeconds + offset;

    // Handle day wraparound
    if (totalSec < 0) totalSec += 86400;
    if (totalSec >= 86400) totalSec -= 86400;

    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;

    const timeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;

    candidates.push({
      time: timeStr,
      offsetMinutes: offset / 60,
      offsetDescription: offset === 0 ? 'Center' : `${offset > 0 ? '+' : ''}${offset}s`,
    });
  }

  return candidates;
}

// ═════════════════════════════════════════════════════════════════════════
// HELPER: Convert Minutes to Time String
// ═════════════════════════════════════════════════════════════════════════

function convertMinutesToTime(
  totalMinutes: number,
  originalTime: string,
  offsetFromBase: number
): CandidateTime {
  // Handle day wraparound
  let adjustedMinutes = totalMinutes;
  let dayOffset = 0;

  if (adjustedMinutes < 0) {
    dayOffset = -1;
    adjustedMinutes += 24 * 60;
  } else if (adjustedMinutes >= 24 * 60) {
    dayOffset = 1;
    adjustedMinutes -= 24 * 60;
  }

  const h = Math.floor(adjustedMinutes / 60);
  const m = Math.floor(adjustedMinutes % 60);
  const s = Math.round((adjustedMinutes % 1) * 60);

  const timeString = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;

  // Format offset description
  const absOffset = Math.abs(offsetFromBase);
  const offsetHours = Math.floor(absOffset / 60);
  const offsetMins = Math.floor(absOffset % 60);
  const sign = offsetFromBase >= 0 ? '+' : '-';

  let offsetDescription = '';
  if (offsetFromBase === 0) {
    offsetDescription = 'Tentative (Original)';
  } else {
    offsetDescription = sign;
    if (offsetHours > 0) offsetDescription += `${offsetHours}h `;
    if (offsetMins > 0 || offsetHours === 0) offsetDescription += `${offsetMins}m`;
  }

  if (dayOffset !== 0) {
    offsetDescription += ` (${dayOffset > 0 ? 'Next' : 'Previous'} day)`;
  }

  return {
    time: timeString,
    offsetMinutes: Number(offsetFromBase.toFixed(4)),
    offsetDescription,
  };
}

// ═════════════════════════════════════════════════════════════════════════
// HELPER: Get Configuration Description
// ═════════════════════════════════════════════════════════════════════════

export function getOffsetConfigDescription(config: TimeOffsetConfig): string {
  if (config.customMinutes !== undefined) {
    return `Custom: ±${config.customMinutes} minutes`;
  }
  if (config.preset) {
    return OFFSET_PRESETS[config.preset]?.label || 'Unknown';
  }
  return config.description || 'No offset specified';
}

// ═════════════════════════════════════════════════════════════════════════
// HELPER: Validate Offset Config
// ═════════════════════════════════════════════════════════════════════════

export function validateOffsetConfig(config: TimeOffsetConfig): {
  valid: boolean;
  error?: string;
  warning?: string;
} {
  if (!config.preset && config.customMinutes === undefined) {
    return {
      valid: false,
      error: 'Either preset or customMinutes must be specified',
    };
  }

  if (config.customMinutes !== undefined) {
    if (config.customMinutes < 1) {
      return {
        valid: false,
        error: 'Custom offset must be at least 1 minute',
      };
    }
    if (config.customMinutes > 720) {
      return {
        valid: false,
        error: 'Offset cannot exceed ±12 hours (720 minutes). Maximum allowed offset covers the full 24-hour day.',
      };
    }
    if (config.customMinutes > 360) {
      return {
        valid: true,
        warning: 'Large offset range selected. Consider narrowing down if possible for better precision.',
      };
    }
  }

  return { valid: true };
}

export const MAX_OFFSET_MINUTES = 720;

// ═════════════════════════════════════════════════════════════════════════
// Calculate Tournament Rounds
// ═════════════════════════════════════════════════════════════════════════

export function calculateTournamentStructure(totalCandidates: number): {
  rounds: number;
  batchesPerRound: number[];
  survivorsPerRound: number[];
} {
  const batchesPerRound: number[] = [];
  const survivorsPerRound: number[] = [];

  let remaining = totalCandidates;

  while (remaining > MAX_BATCH_SIZE) {
    const batches = Math.ceil(remaining / MAX_BATCH_SIZE);
    const survivors = batches * SURVIVORS_PER_BATCH;

    batchesPerRound.push(batches);
    survivorsPerRound.push(survivors);

    remaining = survivors;
  }

  // Final round
  batchesPerRound.push(1);
  survivorsPerRound.push(1);

  return {
    rounds: batchesPerRound.length,
    batchesPerRound,
    survivorsPerRound,
  };
}

export default generateCandidateTimes;

// Legacy exports for backward compatibility
export type { CandidateTime as _CandidateTime };
export { generateCandidateTimes as _generateCandidateTimes };
export { generateRefinementGrid as _generateRefinementGrid };
export { splitIntoBatches as _splitIntoBatches };
export { getDynamicBatchSize as _getDynamicBatchSize };
export { getDynamicSurvivors as _getDynamicSurvivors };
export { injectSafetyNetCandidates as _injectSafetyNetCandidates };
