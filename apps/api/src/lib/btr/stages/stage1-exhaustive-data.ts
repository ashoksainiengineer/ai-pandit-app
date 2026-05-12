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
import { cleanup, calculateEphemerisBatch } from '../../ephemeris.js';
import { throwIfCancelled } from '../../cancellation-manager.js';
import { buildCandidateDataPackage } from '../data-package-builder.js';
import { StageResult } from '@ai-pandit/shared';
import { logger } from '../../../utils/logger.js';
import { findAstrologicalBoundaries } from '../../advanced-btr-methods.js';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Stage 1: Initialize all candidate data with safety net
 */
export async function stage1ExhaustiveDataGeneration(
  input: SecondsPrecisionInput,
  progress: ProgressTracker
): Promise<{ candidates: CandidateTime[]; stageResult: StageResult }> {
  await progress.startStep('grid', 'Stage 1: Generating ALL candidate data...');

  const rawCandidates = generateCandidateTimes(input.tentativeTime, input.offsetConfig, input.dateOfBirth);
  const candidatesWithSafetyNet = injectSafetyNetCandidates(input.tentativeTime, rawCandidates, input.dateOfBirth);

  // Boundary scan: use actual offset window, not arbitrary 6 hours
  // BUG-FIX: ?? instead of || to allow customMinutes=0
  const offsetMinutes = input.offsetConfig.customMinutes ??
    (input.offsetConfig.preset === '30min' ? 30 :
     input.offsetConfig.preset === '1hour' ? 60 :
     input.offsetConfig.preset === '2hours' ? 120 :
     input.offsetConfig.preset === '4hours' ? 240 :
     input.offsetConfig.preset === '6hours' ? 360 :
     input.offsetConfig.preset === '12hours' ? 720 :
     input.offsetConfig.preset === 'seconds-30' ? 5 :
     input.offsetConfig.preset === 'seconds-6' ? 1 : 30);

  logger.info('[STAGE1] Searching for astrological boundaries (sign/nakshatra transitions)...', { offsetMinutes });
  const boundaries = await findAstrologicalBoundaries(
    input.dateOfBirth, input.tentativeTime, offsetMinutes,
    input.latitude, input.longitude, input.timezone
  );

  const finalCandidates = [...candidatesWithSafetyNet];
  const existingTimes = new Set(finalCandidates.map(c => c.time));

  // Add boundary candidates without O(n²) grid generation
  for (const b of boundaries) {
    if (!existingTimes.has(b.time)) {
      finalCandidates.push({
        time: b.time,
        offsetMinutes: b.offsetMinutes,
        offsetDescription: `Boundary Lock: ${b.type} (${b.from} → ${b.to})`,
        candidateDate: input.dateOfBirth,
        dayOffset: 0,
        candidateKey: `boundary_${b.type}_${b.offsetMinutes}`,
      });
      existingTimes.add(b.time);
    }
  }

  finalCandidates.sort((a, b) => a.offsetMinutes - b.offsetMinutes);
  const total = finalCandidates.length;
  let processed = 0;

  logger.info('Stage 1: Initializing metadata with Boundary Locks', {
    total,
    rawCandidates: rawCandidates.length,
    safetyNetAdded: candidatesWithSafetyNet.length - rawCandidates.length,
    boundariesAdded: finalCandidates.length - candidatesWithSafetyNet.length,
    tentativeTime: input.tentativeTime,
  });

  // Batch all ephemeris calls upfront: 100+ sequential HTTP calls → 1-2 batch calls
  logger.info(`[STAGE1] Starting batch ephemeris for ${finalCandidates.length} candidates`);
  const batchStart = Date.now();
  const batchInputs = finalCandidates.map(raw => ({
    birthDate: raw.candidateDate || input.dateOfBirth,
    birthTime: raw.time,
    latitude: input.latitude,
    longitude: input.longitude,
    timezone: input.timezone,
  }));
  const batchEphemeris = await calculateEphemerisBatch(batchInputs, 'whole_sign');
  logger.info(`[STAGE1] Batch ephemeris complete`, {
    candidates: finalCandidates.length,
    durationMs: Date.now() - batchStart,
  });

  // Process sequentially to control memory and support cancellation
  const BATCH_SIZE = 10;
  for (let i = 0; i < finalCandidates.length; i += BATCH_SIZE) {
    await throwIfCancelled(input.sessionId, input.abortSignal);
    const batch = finalCandidates.slice(i, i + BATCH_SIZE);

    for (let bi = 0; bi < batch.length; bi++) {
      const raw = batch[bi];
      const ephIndex = i + bi;
      const pkg = await buildCandidateDataPackage(raw.time, raw.offsetMinutes, input, {
        includeFullData: false, dashaDepth: 2, candidate: raw,
        precomputedEphemeris: batchEphemeris[ephIndex],
      });
      processed++;

      // Keep frontend alive during slow ephemeris calls
      if (processed % 5 === 0) {
        await progress.updateMessage(`Ephemeris: ${processed}/${total} (${raw.time})`);
      }

      await progress.addCandidateScore({
        time: raw.time, score: 0, stage: 1,
        minifiedEph: {
          sun: `${pkg.planets.sun.sign} ${pkg.planets.sun.degree}`,
          moon: `${pkg.planets.moon.sign} ${pkg.planets.moon.degree}`,
          ascendant: `${pkg.ascendant.sign} ${pkg.ascendant.degree}`,
        },
        fullEph: undefined,
      });

      if (processed % 5 === 0) {
        emitCalculationLog(input.sessionId, {
          candidateTime: raw.time,
          sunPos: `${pkg.planets.sun.sign} ${pkg.planets.sun.degree}`,
          moonPos: `${pkg.planets.moon.sign} ${pkg.planets.moon.degree}`,
          ascendant: `${pkg.ascendant.sign} ${pkg.ascendant.degree}`,
          dashaObj: pkg.vimshottariDasha?.[0]?.maha || 'N/A', // BUG-FIX: optional chaining on array access
        });
      }
    }

    await progress.updateMessage(`Ephemeris: ${processed}/${total}`);
    await sleep(10);
    if (processed % 50 === 0) cleanup();
  }

  await progress.completeStep('grid', [
    `Initialized ${finalCandidates.length} paths`,
    `(${finalCandidates.length - rawCandidates.length} safety/boundary locks)`,
  ]);

  return {
    candidates: finalCandidates,
    stageResult: {
      stageNumber: 1,
      stageName: 'Exhaustive Data Generation',
      candidatesIn: rawCandidates.length,
      candidatesOut: finalCandidates.length,
    }
  };
}
