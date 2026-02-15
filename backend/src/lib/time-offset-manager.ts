// lib/time-offset-manager.ts
// 🔱 GOD-TIER Time Offset Manager with Batch Support
// Research-backed: Max 10 candidates per AI batch for optimal attention

import { logger } from './logger.js';
import type { OffsetPreset, TimeOffsetConfig, CandidateTime } from '../types/index.js';

// Re-export types for backwards compatibility
export type { OffsetPreset, TimeOffsetConfig, CandidateTime };

// ═════════════════════════════════════════════════════════════════════════
// CONSTANTS - RESEARCH-BACKED (Dynamic)
// ═════════════════════════════════════════════════════════════════════════

// Absolute max candidates per AI call (OpenRouter supports higher concurrency)
export const MAX_BATCH_SIZE = 10;

// Survivors per batch for tournament progression
// 🔱 GOD-TIER SAFETY: Increased from 2 to 5 to prevent actual birth time elimination
// Research shows: With DeepSeek R1's 64K context, we can analyze more candidates
export const SURVIVORS_PER_BATCH = 5;

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
  // For very small offsets (±5-15 min) → 5 candidates per batch
  // AI can deeply analyze each one
  if (offsetMinutes <= 15) return 5;

  // For small offsets (±30 min) → 6 candidates
  if (offsetMinutes <= 30) return 6;

  // For medium offsets (±1 hour) → 7 candidates
  if (offsetMinutes <= 60) return 7;

  // For larger offsets (±2 hours) → 8 candidates
  if (offsetMinutes <= 120) return 8;

  // For big offsets (±4-6 hours) → 9 candidates
  if (offsetMinutes <= 360) return 9;

  // For very large offsets (±12 hours+) → 10 candidates (max)
  return MAX_BATCH_SIZE;
}

/**
 * Get dynamic survivors count based on batch size
 * 🔱 GOD-TIER SAFETY: More survivors to prevent actual birth time elimination
 * Research shows: With DeepSeek R1's reasoning, we can safely analyze more candidates
 *
 * @param batchSize Current batch size
 * @param isFirstRound If true, preserves more candidates (safety net for tentative time)
 * @returns Number of survivors to select
 */
export function getDynamicSurvivors(batchSize: number, isFirstRound: boolean = false): number {
  // 🔱 SAFETY NET: In first round, always keep at least 30% of candidates
  // This ensures actual birth time doesn't get eliminated early
  if (isFirstRound) {
    return Math.max(5, Math.ceil(batchSize * 0.3));
  }

  // For batch of 5-6 → 3 survivors (50% survive)
  if (batchSize <= 6) return 3;

  // For batch of 7-8 → 4 survivors (50% survive)
  if (batchSize <= 8) return 4;

  // For batch of 9-10 → 5 survivors (50-55% survive)
  return Math.min(5, Math.ceil(batchSize * 0.35));
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
    interval: 1, // 1 min = 120 candidates
  },
  '2hours': {
    label: '±2 hours',
    minutes: 120,
    interval: 2, // 2 min = 120 candidates
  },
  '4hours': {
    label: '±4 hours',
    minutes: 240,
    interval: 4, // 4 min = 120 candidates
  },
  '6hours': {
    label: '±6 hours',
    minutes: 360,
    interval: 5, // 5 min = 144 candidates
  },
  '12hours': {
    label: '±12 hours',
    minutes: 720,
    interval: 10, // 10 min = 144 candidates
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
  // ═══════════════════════════════════════════════════════════════════════
  // VEDIC PRINCIPLE: Smaller offsets need FINER precision
  // ═══════════════════════════════════════════════════════════════════════

  // ±5 minutes → 15 seconds (D60 level precision, ~40 candidates)
  if (offsetMinutes <= 5) return 0.25;

  // ±10 minutes → 30 seconds (~40 candidates)
  if (offsetMinutes <= 10) return 0.5;

  // ±15 minutes → 30 seconds (~60 candidates)
  if (offsetMinutes <= 15) return 0.5;

  // ±30 minutes → 1 minute (D9 level, ~60 candidates)
  if (offsetMinutes <= 30) return 1;

  // ±1 hour → 1 minute (~120 candidates for thorough D9 coverage)
  if (offsetMinutes <= 60) return 1;

  // ═══════════════════════════════════════════════════════════════════════
  // VEDIC PRINCIPLE: Larger offsets use LAGNA-aware intervals
  // Lagna changes every ~2 hours = ~120 min
  // Ensure 3-4 samples per Lagna sign
  // ═══════════════════════════════════════════════════════════════════════

  // ±2 hours → 2 minutes (~120 candidates, 30+ per Lagna)
  if (offsetMinutes <= 120) return 2;

  // ±4 hours → 4 minutes (~120 candidates, 15 per Lagna)
  if (offsetMinutes <= 240) return 4;

  // ±6 hours → 5 minutes (~144 candidates, 12 per Lagna)
  if (offsetMinutes <= 360) return 5;

  // ±12 hours → 10 minutes (~144 candidates, 6 per Lagna)
  // This ensures at least 6 samples during each 2-hour Lagna window
  if (offsetMinutes <= 720) return 10;

  // Beyond 12 hours → 15 minutes (rare case)
  return 15;
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
      offsetMinutes = preset.minutes;
    } else {
      throw new Error('No offset configuration provided');
    }

    // 🔱 Adaptive interval for consistent candidate count
    const interval = getAdaptiveInterval(offsetMinutes);

    const description = offsetConfig.customMinutes !== undefined
      ? `±${offsetMinutes} min (${interval >= 1 ? interval + 'min' : (interval * 60) + 's'} Grid)`
      : `${OFFSET_PRESETS[offsetConfig.preset!].label} (${interval >= 1 ? interval + 'min' : (interval * 60) + 's'} Grid)`;

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
    for (let offset = -offsetMinutes; offset <= offsetMinutes; offset += interval) {
      const candidateMinutes = baseMinutes + offset;
      const candidate = convertMinutesToTime(candidateMinutes, tentativeTime, offset);
      candidates.push(candidate);
    }

    // Ensure tentative time is included if not already
    const hasTentative = candidates.some(c => c.offsetMinutes === 0);
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

export function splitIntoBatches<T>(candidates: T[], batchSize: number = MAX_BATCH_SIZE): T[][] {
  const batches: T[][] = [];

  // Shuffle before splitting to randomize positions (anti-middle-bias)
  const shuffled = [...candidates].sort(() => Math.random() - 0.5);

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
    offsetMinutes: Math.round(offsetMinutes),
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
    offsetMinutes: Math.round(offsetFromBase),
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
    if (config.customMinutes > 1440) {
      return {
        valid: false,
        error: 'Offset cannot exceed 24 hours',
      };
    }
  }

  return { valid: true };
}

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
  let round = 0;

  while (remaining > MAX_BATCH_SIZE) {
    const batches = Math.ceil(remaining / MAX_BATCH_SIZE);
    const survivors = batches * SURVIVORS_PER_BATCH;

    batchesPerRound.push(batches);
    survivorsPerRound.push(survivors);

    remaining = survivors;
    round++;
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