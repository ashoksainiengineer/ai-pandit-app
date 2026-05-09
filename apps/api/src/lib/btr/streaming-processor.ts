/**
 * Streaming Candidate Processor
 *
 * Handles large candidate counts without OOM by processing in chunks
 * and maintaining only the top-N candidates by overall score.
 */

import type { CandidateAnalysis } from './window-scanner.js';
import type { EphemerisData } from '@ai-pandit/shared';

interface TimeRange {
  startMs: number;
  endMs: number;
}

/**
 * Process candidates in memory-efficient chunks.
 * Each chunk is scored sequentially, then only top candidates are kept.
 */
export async function processCandidatesInChunks(
  range: TimeRange,
  stepMs: number,
  processChunk: (chunk: CandidateAnalysis[]) => Promise<void>,
): Promise<void> {
  const chunkSize = 10; // 10 candidates per chunk to control memory

  // Generate candidate times
  const times: number[] = [];
  for (let t = range.startMs; t <= range.endMs; t += stepMs) {
    times.push(t);
  }

  // Process in chunks
  for (let i = 0; i < times.length; i += chunkSize) {
    const chunkTimes = times.slice(i, i + chunkSize);
    const chunk: CandidateAnalysis[] = chunkTimes.map(ms => ({
      time: new Date(ms),
      timeString: formatTime(ms),
      ephemeris: null as unknown as EphemerisData,
      dasha: [],
      vargas: {},
      kpData: {},
      boundarySafety: { lagnaSignBoundary: 0, moonNakshatraBoundary: 0, isDangerous: false },
    }));
    await processChunk(chunk);
  }
}

/**
 * Keep only the top-N candidates by score, discarding the rest to control memory.
 * Streaming-friendly: compares new chunk against existing top candidates.
 */
export function maintainTopCandidates(
  existing: CandidateAnalysis[],
  chunk: CandidateAnalysis[],
  maxKeep: number,
): CandidateAnalysis[] {
  const combined = [...existing, ...chunk];
  combined.sort((a, b) => ((b as CandidateAnalysis)._scored?.overallScore || 0) - ((a as CandidateAnalysis)._scored?.overallScore || 0));
  // Keep top maxKeep, but ensure at least one candidate survives
  return combined.slice(0, Math.max(1, maxKeep));
}

function formatTime(ms: number): string {
  const date = new Date(ms);
  return [
    String(date.getUTCHours()).padStart(2, '0'),
    String(date.getUTCMinutes()).padStart(2, '0'),
    String(date.getUTCSeconds()).padStart(2, '0'),
  ].join(':');
}
