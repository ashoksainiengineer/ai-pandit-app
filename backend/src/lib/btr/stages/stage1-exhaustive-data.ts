/**
 * Stage 1: Exhaustive Data Generation
 *
 * Generates initial candidate metadata and initializes all candidates
 * for the BTR tournament process. Includes safety net injection.
 */

import { SecondsPrecisionInput } from '../../../types/index.js';
import {
  CandidateTime,
  generateCandidateTimes,
  injectSafetyNetCandidates,
} from '../../time-offset-manager.js';
import { ProgressTracker } from '../../progress-tracker.js';
import { emitCalculationLog } from '../../session-events.js';
import { buildCandidateDataPackage } from '../data-package-builder.js';
import { StageResult } from '../types.js';
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
  const boundaries = await findAstrologicalBoundaries(
    input.dateOfBirth,
    input.tentativeTime,
    input.offsetConfig.customMinutes || 360, // Fallback if no specific offset
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

  for (const raw of finalCandidates) {
    // Build the package once to ensure calculation log is sent,
    // but DO NOT keep it in memory
    const pkg = await buildCandidateDataPackage(raw.time, raw.offsetMinutes, input, {
      includeFullData: false,
      dashaDepth: 2
    });

    processed++;

    // Log EVERY calculation with lightweight data
    emitCalculationLog(input.sessionId, {
      candidateTime: raw.time,
      sunPos: `${pkg.planets.sun.sign} ${pkg.planets.sun.degree}`,
      moonPos: `${pkg.planets.moon.sign} ${pkg.planets.moon.degree}`,
      ascendant: `${pkg.ascendant.sign} ${pkg.ascendant.degree}`,
      dashaObj: pkg.vimshottariDasha[0]?.maha || 'N/A',
    });

    if (processed % 10 === 0) {
      await progress.updateMessage(`Ephemeris: ${processed}/${total}`);
    }

    // GC breathing room
    if (processed % 5 === 0) await sleep(10);
  }

  await progress.completeStep('grid', [
    `Initialized ${candidatesWithSafetyNet.length} paths`,
    `(${candidatesWithSafetyNet.length - rawCandidates.length} safety net candidates)`,
  ]);

  return {
    candidates: candidatesWithSafetyNet,
    stageResult: {
      stageNumber: 1,
      stageName: 'Exhaustive Data Generation',
      candidatesIn: rawCandidates.length,
      candidatesOut: finalCandidates.length
    }
  };
}
