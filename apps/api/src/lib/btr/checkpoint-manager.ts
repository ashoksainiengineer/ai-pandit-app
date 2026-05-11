/**
 * BTR Checkpoint Manager
 *
 * Industry-standard checkpoint/resume for long-running ML/AI pipelines.
 * Saves deterministic stage outputs (candidate lists) to the jobs table
 * so that a crashed worker can resume from the last completed stage
 * instead of restarting from Stage 1.
 *
 * Key design decisions:
 *  - Checkpoints are saved ONLY at stage boundaries (not during execution).
 *  - The DB is the source of truth for checkpoints (durable, survives Redis flush).
 *  - AI reasoning/thinking is NOT checkpointed (non-deterministic, re-generated on resume).
 *  - Candidate lists ARE checkpointed (deterministic, expensive to recompute).
 */

import { updateJobProgress } from '@ai-pandit/db/jobs';
import type { CandidateTime, StageResult } from '@ai-pandit/shared';
import { logger } from '../../utils/logger.js';

export const CURRENT_CHECKPOINT_VERSION = 1;

export interface BTRCheckpoint {
  version: typeof CURRENT_CHECKPOINT_VERSION;
  sessionId: string;
  completedStages: number[];
  stageOutputs: Record<
    number,
    {
      candidates: CandidateTime[];
      stageResult: Pick<StageResult, 'candidatesIn' | 'candidatesOut'>;
    }
  >;
  lastSavedAt: string; // ISO timestamp
}

interface SaveCheckpointInput {
  jobId: string;
  sessionId: string;
  stage: number;
  candidates: CandidateTime[];
  stageResult: StageResult;
}

/**
 * Save a checkpoint after a stage completes.
 * This is a DB write, so it is intentionally called only at stage boundaries.
 */
export async function saveBTRCheckpoint(input: SaveCheckpointInput): Promise<void> {
  try {
    const checkpoint: BTRCheckpoint = {
      version: CURRENT_CHECKPOINT_VERSION,
      sessionId: input.sessionId,
      completedStages: [input.stage],
      stageOutputs: {
        [input.stage]: {
          candidates: input.candidates,
          stageResult: {
            candidatesIn: input.stageResult.candidatesIn,
            candidatesOut: input.stageResult.candidatesOut,
          },
        },
      },
      lastSavedAt: new Date().toISOString(),
    };

    await updateJobProgress({
      jobId: input.jobId,
      progressPercent: 0,
      checkpointJson: checkpoint as unknown as Record<string, unknown>,
    });

    logger.info('[CHECKPOINT] Saved', {
      sessionId: input.sessionId,
      stage: input.stage,
      candidates: input.candidates.length,
    });
  } catch (error) {
    // Checkpoint failure is non-fatal: log and continue.
    logger.warn('[CHECKPOINT] Save failed (non-fatal)', {
      sessionId: input.sessionId,
      stage: input.stage,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Load the latest checkpoint for a job.
 * Returns null if no checkpoint exists or if the checkpoint is malformed.
 */
export function loadBTRCheckpoint(checkpointJson: unknown): BTRCheckpoint | null {
  if (!checkpointJson || typeof checkpointJson !== 'object') {
    return null;
  }

  const cp = checkpointJson as Partial<BTRCheckpoint>;

  if (cp.version !== CURRENT_CHECKPOINT_VERSION) {
    logger.warn('[CHECKPOINT] Version mismatch, ignoring', {
      expected: CURRENT_CHECKPOINT_VERSION,
      received: cp.version,
    });
    return null;
  }

  if (!cp.sessionId || !Array.isArray(cp.completedStages) || !cp.stageOutputs) {
    logger.warn('[CHECKPOINT] Malformed checkpoint, ignoring');
    return null;
  }

  return cp as BTRCheckpoint;
}

/**
 * Determine the next stage to execute based on a checkpoint.
 * Returns 1 if no checkpoint (start from beginning).
 */
export function getResumeStage(checkpoint: BTRCheckpoint | null): number {
  if (!checkpoint || checkpoint.completedStages.length === 0) {
    return 1;
  }
  return Math.max(...checkpoint.completedStages) + 1;
}

/**
 * Retrieve the saved candidates for a specific stage from a checkpoint.
 */
export function getStageCandidates(
  checkpoint: BTRCheckpoint | null,
  stage: number
): CandidateTime[] | null {
  if (!checkpoint) return null;
  return checkpoint.stageOutputs[stage]?.candidates ?? null;
}
