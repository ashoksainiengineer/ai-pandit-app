/**
 * Stage 1: Exhaustive Data Generation
 *
 * Generates initial candidate metadata and initializes all candidates
 * for the BTR tournament process. Includes safety net injection.
 */

import { SecondsPrecisionInput } from '@ai-pandit/shared';
import {
  CandidateTime,
  generateCandidateTimes,
  injectSafetyNetCandidates,
} from '../../time-offset-manager.js';
import { ProgressTracker } from '../../progress-tracker.js';
import { emitCalculationLog } from '../../session-events.js';
import { buildCandidateDataPackage } from '../data-package-builder.js';
import { StageResult } from '@ai-pandit/shared';
import { logger } from '../../logger.js';
import { findAstrologicalBoundaries } from '../../advanced-btr-methods.js';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Stage 1: Initialize all candidate data with safety net
 *
 * @param input - BTR input parameters
 * @param progress - Progress tracker for updates
 * @returns Candidates with initialized metadata and stage result
 */
export async function stage1ExhaustiveDataGeneration(
  input: SecondsPrecisionInput,
  progress: ProgressTracker
): Promise<{ candidates: CandidateTime[]; stageResult: StageResult }> {
  await progress.startStep('grid', 'Stage 1: Generating ALL candidate data...');

  // 🔱 SAFETY NET: Generate raw candidates first
  const rawCandidates = generateCandidateTimes(input.tentativeTime, input.offsetConfig);

  // 🔱 SAFETY NET: Inject safety net candidates around tentative time
  const candidatesWithSafetyNet = injectSafetyNetCandidates(input.tentativeTime, rawCandidates);

  // 🔱 PROJECT MAHAKALA: Boundary-Locked Generation
  await progress.updateMessage('Mahakala: Scanning for divisional boundaries...');
  // 🔱 Determine correct offset minutes for boundary scan
  let boundaryScanMinutes = 360; // Default 6 hours
  if (input.offsetConfig.customMinutes) {
    boundaryScanMinutes = input.offsetConfig.customMinutes;
  } else if (input.offsetConfig.preset) {
    // Import OFFSET_PRESETS dynamically or use hardcoded map to avoid circular dependency if possible
    // actually we can just ask for the preset values, but for now let's map common ones
    const presetMap: Record<string, number> = {
      '30min': 30, '1hour': 60, '2hours': 120, '4hours': 240, '6hours': 360, '12hours': 720,
      'seconds-30': 5, 'seconds-6': 1
    };
    boundaryScanMinutes = presetMap[input.offsetConfig.preset] || 360;
  }

  const boundaries = await findAstrologicalBoundaries(
    input.dateOfBirth,
    input.tentativeTime,
    boundaryScanMinutes,
    input.latitude,
    input.longitude,
    input.timezone
  );

  const finalCandidates = [...candidatesWithSafetyNet];
  const existingTimes = new Set(finalCandidates.map(c => c.time));

  for (const b of boundaries) {
    if (!existingTimes.has(b.time)) {
      finalCandidates.push({
        time: b.time,
        offsetMinutes: b.offsetMinutes,
        offsetDescription: `Boundary Lock: ${b.type} (${b.from} → ${b.to})`
      });
      existingTimes.add(b.time);
    }
  }

  // Final sort to keep it chronological
  finalCandidates.sort((a, b) => a.offsetMinutes - b.offsetMinutes);

  const total = finalCandidates.length;
  let processed = 0;

  logger.info('🔱 Stage 1: Initializing metadata with Boundary Locks', {
    total,
    rawCandidates: rawCandidates.length,
    safetyNetAdded: candidatesWithSafetyNet.length - rawCandidates.length,
    boundariesAdded: finalCandidates.length - candidatesWithSafetyNet.length,
    tentativeTime: input.tentativeTime,
  });

  const BATCH_LOG_SIZE = 20;
  for (let i = 0; i < finalCandidates.length; i += BATCH_LOG_SIZE) {
    const batch = finalCandidates.slice(i, i + BATCH_LOG_SIZE);

    await Promise.all(batch.map(async (raw) => {
      const pkg = await buildCandidateDataPackage(raw.time, raw.offsetMinutes, input, {
        includeFullData: false,
        dashaDepth: 2
      });

      processed++;

      // Emit aggregated log entry (simplified)
      if (processed % 5 === 0) {
        emitCalculationLog(input.sessionId, {
          candidateTime: raw.time,
          sunPos: `${pkg.planets.sun.sign} ${pkg.planets.sun.degree}`,
          moonPos: `${pkg.planets.moon.sign} ${pkg.planets.moon.degree}`,
          ascendant: `${pkg.ascendant.sign} ${pkg.ascendant.degree}`,
          dashaObj: pkg.vimshottariDasha[0]?.maha || 'N/A',
        });
      }
    }));

    await progress.updateMessage(`Ephemeris: ${processed}/${total}`);

    // GC breathing room and prevent event loop starvation
    await sleep(20);
  }

  await progress.completeStep('grid', [
    `Initialized ${finalCandidates.length} paths`,
    `(${finalCandidates.length - rawCandidates.length} safety/boundary locks)`,
  ]);

  return {
    candidates: finalCandidates, // FIX: Return the ACTUAL candidates used!
    stageResult: {
      stageNumber: 1,
      stageName: 'Exhaustive Data Generation',
      candidatesIn: rawCandidates.length,
      candidatesOut: finalCandidates.length
    }
  };
}
