// lib/time-offset-manager.ts
// Manage time offset ranges and generate candidate times

import { logger } from '@/lib/logger';

// ═════════════════════════════════════════════════════════════════════════
// TYPE DEFINITIONS
// ═════════════════════════════════════════════════════════════════════════

export type OffsetPreset = '30min' | '1hour' | '2hours' | '4hours' | 'seconds-30' | 'seconds-6';

export interface TimeOffsetConfig {
  preset?: OffsetPreset;
  customMinutes?: number;
  description: string;
}

export interface CandidateTime {
  time: string; // HH:MM:SS format
  offsetMinutes: number; // Positive or negative from tentative time
  offsetDescription: string; // e.g., "+15 minutes", "-45 minutes"
  priority: number; // Higher = analyze first
}

// ═════════════════════════════════════════════════════════════════════════
// OFFSET CONFIGURATION PRESETS
// ═════════════════════════════════════════════════════════════════════════

const OFFSET_PRESETS: Record<OffsetPreset, { label: string; minutes: number; interval: number; intervalSeconds?: number }> = {
  '30min': {
    label: '±30 minutes',
    minutes: 30,
    interval: 5, // Check every 5 minutes
  },
  '1hour': {
    label: '±1 hour',
    minutes: 60,
    interval: 5, // Check every 5 minutes
  },
  '2hours': {
    label: '±2 hours',
    minutes: 120,
    interval: 10, // Check every 10 minutes (for performance)
  },
  '4hours': {
    label: '±4 hours',
    minutes: 240,
    interval: 15, // Check every 15 minutes (for performance)
  },
  'seconds-30': {
    label: '±5 minutes (30-sec intervals)',
    minutes: 5,
    interval: 0.5,       // 30 seconds
    intervalSeconds: 30, // Explicit seconds
  },
  'seconds-6': {
    label: '±1 minute (6-sec intervals)',
    minutes: 1,
    interval: 0.1,      // 6 seconds
    intervalSeconds: 6, // Explicit seconds
  },
};

// ═════════════════════════════════════════════════════════════════════════
// MAIN FUNCTION: Generate Candidate Times
// ═════════════════════════════════════════════════════════════════════════

export function generateCandidateTimes(
  tentativeTime: string, // HH:MM:SS
  offsetConfig: TimeOffsetConfig
): CandidateTime[] {
  try {
    logger.info('Generating candidate times', { tentativeTime, offsetConfig });

    // ─────────────────────────────────────────────────────────────────────
    // Parse tentative time
    // ─────────────────────────────────────────────────────────────────────

    const [hours, minutes, seconds] = tentativeTime.split(':').map(Number);
    const baseMinutes = hours * 60 + minutes + (seconds / 60);

    // ─────────────────────────────────────────────────────────────────────
    // Determine offset range and interval
    // ─────────────────────────────────────────────────────────────────────

    let offsetMinutes: number;
    let interval: number;
    let description: string;

    if (offsetConfig.customMinutes !== undefined) {
      // Custom offset specified
      offsetMinutes = offsetConfig.customMinutes;
      interval = Math.max(1, Math.floor(offsetMinutes / 20)); // Auto-calculate interval
      description = `±${offsetMinutes} minutes (custom)`;
    } else if (offsetConfig.preset) {
      // Preset offset selected
      const preset = OFFSET_PRESETS[offsetConfig.preset];
      offsetMinutes = preset.minutes;
      interval = preset.interval;
      description = preset.label;
    } else {
      throw new Error('No offset configuration provided');
    }

    logger.info('Offset configuration', {
      offsetMinutes,
      interval,
      description,
    });

    // ─────────────────────────────────────────────────────────────────────
    // Generate candidate times
    // ─────────────────────────────────────────────────────────────────────

    const candidates: CandidateTime[] = [];

    // Negative direction (earlier times)
    for (let i = interval; i <= offsetMinutes; i += interval) {
      const candidateMinutes = baseMinutes - i;
      const candidate = convertMinutesToTime(candidateMinutes, tentativeTime);
      candidates.push({
        ...candidate,
        priority: getPriority(-i, offsetMinutes), // Closer to tentative = higher priority
      });
    }

    // Tentative time itself (highest priority)
    candidates.push({
      time: tentativeTime,
      offsetMinutes: 0,
      offsetDescription: 'Tentative (Original)',
      priority: 100, // Highest priority
    });

    // Positive direction (later times)
    for (let i = interval; i <= offsetMinutes; i += interval) {
      const candidateMinutes = baseMinutes + i;
      const candidate = convertMinutesToTime(candidateMinutes, tentativeTime);
      candidates.push({
        ...candidate,
        priority: getPriority(i, offsetMinutes), // Closer to tentative = higher priority
      });
    }

    // Sort by priority (highest first)
    candidates.sort((a, b) => b.priority - a.priority);

    logger.info('Generated candidates', {
      count: candidates.length,
      offsetRange: `${offsetMinutes} minutes`,
      interval: `${interval} minutes`,
    });

    return candidates;
  } catch (error) {
    logger.error('Candidate time generation failed', error);
    throw error;
  }
}

// ═════════════════════════════════════════════════════════════════════════
// HELPER: Convert Minutes to Time String
// ═════════════════════════════════════════════════════════════════════════

function convertMinutesToTime(
  totalMinutes: number,
  originalTime: string
): Omit<CandidateTime, 'priority'> {
  // Handle day wraparound
  let adjustedMinutes = totalMinutes;
  let dayOffset = 0;

  if (adjustedMinutes < 0) {
    dayOffset = -1;
    adjustedMinutes += 24 * 60; // Add 24 hours
  } else if (adjustedMinutes >= 24 * 60) {
    dayOffset = 1;
    adjustedMinutes -= 24 * 60; // Subtract 24 hours
  }

  const h = Math.floor(adjustedMinutes / 60);
  const m = Math.floor(adjustedMinutes % 60);
  const s = Math.round((adjustedMinutes % 1) * 60);

  const timeString = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;

  // Calculate offset from original time
  const [origH, origM, origS] = originalTime.split(':').map(Number);
  const origTotalMinutes = origH * 60 + origM + origS / 60;
  const offsetFromOriginal = totalMinutes - origTotalMinutes;

  // Format offset description
  const offsetHours = Math.floor(Math.abs(offsetFromOriginal) / 60);
  const offsetMins = Math.floor(Math.abs(offsetFromOriginal) % 60);
  const sign = offsetFromOriginal >= 0 ? '+' : '-';

  let offsetDescription = sign;
  if (offsetHours > 0) offsetDescription += `${offsetHours}h `;
  if (offsetMins > 0) offsetDescription += `${offsetMins}m`;
  if (offsetFromOriginal === 0) offsetDescription = 'Original Time';

  if (dayOffset !== 0) {
    offsetDescription += ` (${dayOffset > 0 ? 'Next' : 'Previous'} day)`;
  }

  return {
    time: timeString,
    offsetMinutes: Math.round(offsetFromOriginal),
    offsetDescription,
  };
}

// ═════════════════════════════════════════════════════════════════════════
// HELPER: Calculate Priority Score
// ═════════════════════════════════════════════════════════════════════════

function getPriority(offsetMinutes: number, maxOffset: number): number {
  // Closer to center (0) = higher priority
  // Formula: 100 - (distance / maxOffset * 100)
  const distance = Math.abs(offsetMinutes);
  return Math.round(100 - (distance / maxOffset) * 90);
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
      // More than 24 hours
      return {
        valid: false,
        error: 'Offset cannot exceed 24 hours',
      };
    }
  }

  return { valid: true };
}

export default generateCandidateTimes;