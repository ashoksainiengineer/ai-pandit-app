/**
 * Streaming Candidate Processor
 * 
 * Processes BTR candidates in chunks to prevent memory overflow.
 * Instead of loading all 500 candidates into memory at once,
 * this processor:
 * 1. Generates candidates in chunks of 30
 * 2. Scores each chunk immediately
 * 3. Keeps only top 100 candidates
 * 4. Frees memory between chunks
 * 
 * This allows processing 500+ candidates with constant ~300MB memory usage.
 */

import { calculateEphemeris } from '../ephemeris.js';
import { calculateVimshottariDasha, type DashaPeriod } from '../vedic-astrology-engine.js';
import { generateDivisionalCharts, calculateBoundarySafety, type DivisionalChart, type BoundarySafety } from '../advanced-btr-methods.js';
import { calculateKPSubLords, type KPSubLordData } from '../kp-sublords.js';
import { logger } from '../logger.js';
import type { EphemerisData } from '@ai-pandit/shared';

export interface CandidateAnalysis {
  time: Date;
  timeString: string;
  ephemeris: EphemerisData;
  dasha: DashaPeriod[];
  vargas: Record<string, DivisionalChart>;
  kpData: Record<string, KPSubLordData>;
  boundarySafety: BoundarySafety;
  score?: number;
}

export interface ChunkConfig {
  chunkSize: number;
  maxKeep: number;
  sessionId?: string;
}

const DEFAULT_CHUNK_CONFIG: ChunkConfig = {
  chunkSize: 30,    // Process 30 candidates at a time
  maxKeep: 100,     // Keep only top 100 candidates
};

/**
 * Process candidates in streaming chunks
 * 
 * @param timeRange - Start and end time for candidate generation
 * @param stepMs - Milliseconds between each candidate
 * @param processor - Function to process each chunk
 * @param context - Processing context (timezone, location, etc.)
 * @param config - Chunk configuration
 */
export async function processCandidatesInChunks(
  timeRange: { startMs: number; endMs: number },
  stepMs: number,
  processor: (chunk: CandidateAnalysis[]) => Promise<void>,
  context: {
    timezone: string | number;
    latitude: number;
    longitude: number;
  },
  config: Partial<ChunkConfig> = {}
): Promise<void> {
  const finalConfig = { ...DEFAULT_CHUNK_CONFIG, ...config };
  let currentChunk: CandidateAnalysis[] = [];
  let processedCount = 0;
  
  const { startMs, endMs } = timeRange;
  const totalCandidates = Math.ceil((endMs - startMs) / stepMs) + 1;
  
  logger.info('[StreamingProcessor] Starting chunked candidate processing', {
    totalCandidates,
    chunkSize: finalConfig.chunkSize,
    expectedChunks: Math.ceil(totalCandidates / finalConfig.chunkSize),
  });
  
  for (let timeMs = startMs; timeMs <= endMs; timeMs += stepMs) {
    try {
      const candidate = await generateSingleCandidate(
        new Date(timeMs),
        context,
        finalConfig.sessionId
      );
      
      if (candidate) {
        currentChunk.push(candidate);
        processedCount++;
      }
      
      // Process chunk when it reaches chunkSize
      if (currentChunk.length >= finalConfig.chunkSize) {
        await processor(currentChunk);
        
        // Clear chunk to free memory
        currentChunk = [];
        
        // Log progress every 100 candidates
        if (processedCount % 100 === 0) {
          const progress = ((processedCount / totalCandidates) * 100).toFixed(1);
          logger.info('[StreamingProcessor] Progress', {
            processed: processedCount,
            total: totalCandidates,
            progress: `${progress}%`,
          });
        }
      }
    } catch (error) {
      logger.warn('[StreamingProcessor] Failed to generate candidate', {
        timeMs,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
  
  // Process remaining candidates in final chunk
  if (currentChunk.length > 0) {
    await processor(currentChunk);
  }
  
  logger.info('[StreamingProcessor] Completed chunked processing', {
    totalProcessed: processedCount,
  });
}

/**
 * Generate a single candidate with all astrological data
 */
async function generateSingleCandidate(
  candidateTime: Date,
  context: {
    timezone: string | number;
    latitude: number;
    longitude: number;
  },
  sessionId?: string
): Promise<CandidateAnalysis | null> {
  try {
    // Format date/time for ephemeris
    const dateStr = candidateTime.toISOString().split('T')[0];
    const timeStr = candidateTime.toTimeString().slice(0, 8);
    
    // Get ephemeris data (uses session cache)
    const ephemeris = await calculateEphemeris(
      dateStr,
      timeStr,
      context.latitude,
      context.longitude,
      context.timezone,
      sessionId ? { sessionId } : undefined
    );
    
    // Calculate astrological data
    const moonLong = ephemeris.planets.moon.longitude;
    const dasha = calculateVimshottariDasha(moonLong, candidateTime, 5);
    const vargas = generateDivisionalCharts(ephemeris);
    
    const kpData: Record<string, KPSubLordData> = {};
    for (const [name, data] of Object.entries(ephemeris.planets)) {
      kpData[name] = calculateKPSubLords(data.longitude);
    }
    
    const boundarySafety = calculateBoundarySafety(ephemeris);
    
    return {
      time: candidateTime,
      timeString: timeStr,
      ephemeris,
      dasha,
      vargas,
      kpData,
      boundarySafety,
    };
  } catch (error) {
    logger.debug('[StreamingProcessor] Candidate generation failed', {
      time: candidateTime.toISOString(),
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

/**
 * Maintain only top N candidates by score
 * 
 * @param candidates - Current candidate pool
 * @param newCandidates - New candidates to add
 * @param maxSize - Maximum number of candidates to keep
 * @returns Trimmed candidate list
 */
export function maintainTopCandidates(
  candidates: CandidateAnalysis[],
  newCandidates: CandidateAnalysis[],
  maxSize: number = 100
): CandidateAnalysis[] {
  // Combine existing and new candidates
  const combined = [...candidates, ...newCandidates];
  
  // Sort by score (descending)
  combined.sort((a, b) => (b.score || 0) - (a.score || 0));
  
  // Keep only top N
  const trimmed = combined.slice(0, maxSize);
  
  // Log if we dropped candidates
  if (combined.length > trimmed.length) {
    logger.debug('[StreamingProcessor] Trimmed candidate pool', {
      before: combined.length,
      after: trimmed.length,
      dropped: combined.length - trimmed.length,
    });
  }
  
  return trimmed;
}

/**
 * Force garbage collection (if available)
 * 
 * Note: This is a best-effort operation. GC is not guaranteed
 * to run immediately or free all memory.
 */
export function triggerMemoryCleanup(): void {
  if (global.gc) {
    try {
      global.gc();
      logger.debug('[StreamingProcessor] Manual GC triggered');
    } catch {
      // Ignore errors
    }
  }
}
