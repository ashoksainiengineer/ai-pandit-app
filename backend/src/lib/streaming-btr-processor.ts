// lib/streaming-btr-processor.ts
// 🔱 GOD-TIER STREAMING BTR v9.0 - PIPELINE MODE
// Max 10 candidates per batch, full Swiss Eph data, sequential processing
// No more "generate all 1440 then analyze" - now "generate batch → full AI → next batch"

import { logger } from './logger.js';
import { ProgressTracker } from './progress-tracker.js';
import { LifeEvent, SecondsPrecisionInput, EphemerisData } from './types.js';
import {
  calculateVimshottariDasha,
  getDashaForDate,
  calculateAllVargas,
  calculateAshtakavarga,
  calculateShadbala,
  detectYogas,
  getNakshatraForLongitude,
  calculateHouse,
  getDignity,
  calculateFunctionalNature,
  calculateAspects,
  calculateBaladiAvastha,
  getD60Deity,
  calculatePanchadhaSambandha,
  calculateIshtaKashtaPhala,
  calculateArudhas,
  calculatePanchanga
} from './vedic-astrology-engine.js';
import { calculateEphemeris, calculateJulianDay } from './ephemeris.js';
import {
  generateCandidateTimes,
  getAdaptiveInterval,
  CandidateTime,
  MAX_BATCH_SIZE,
  SURVIVORS_PER_BATCH,
  splitIntoBatches,
  getDynamicBatchSize,
  getDynamicSurvivors
} from './time-offset-manager.js';
import { injectSafetyNetCandidates } from './time-offset-manager.js';
import { EventEmitter } from 'events';
import { PipelineBTRProcessor, calculateBatchSize, calculateTotalBatches } from './pipeline-btr-processor.js';

// ═════════════════════════════════════════════════════════════════════════════
// STREAMING BATCH CONFIGURATION
// ═════════════════════════════════════════════════════════════════════════════

interface StreamBatch {
  batchId: number;
  candidates: CandidateTime[];
  status: 'pending' | 'processing' | 'complete' | 'failed';
  survivors?: CandidateTime[];
  startTime?: number;
  endTime?: number;
}

interface StreamingConfig {
  // Batch generation window (how many minutes to generate per batch)
  generationWindowMinutes: number;
  // Max concurrent batches being analyzed
  maxConcurrentAnalysis: number;
  // Memory threshold to pause generation
  memoryThresholdGB: number;
}

// 🔱 HF SPACES 16GB OPTIMIZATION
const DEFAULT_STREAMING_CONFIG: StreamingConfig = {
  generationWindowMinutes: 30,  // Generate 30-min worth of candidates at a time
  maxConcurrentAnalysis: 3,      // Max 3 batches being analyzed simultaneously
  memoryThresholdGB: 8,         // Pause generation if memory > 8GB
};

// ═════════════════════════════════════════════════════════════════════════════
// GOD-TIER STREAMING PROCESSOR
// ═════════════════════════════════════════════════════════════════════════════

export class StreamingBTRProcessor extends EventEmitter {
  private config: StreamingConfig;
  private input: SecondsPrecisionInput;
  private progress: ProgressTracker;
  private batches: Map<number, StreamBatch> = new Map();
  private allCandidates: CandidateTime[] = [];
  private globalSurvivors: CandidateTime[] = [];
  private batchCounter = 0;
  private isGenerating = false;
  private isAnalyzing = false;
  private totalGenerated = 0;
  private totalAnalyzed = 0;

  constructor(input: SecondsPrecisionInput, progress: ProgressTracker, config?: Partial<StreamingConfig>) {
    super();
    this.input = input;
    this.progress = progress;
    this.config = { ...DEFAULT_STREAMING_CONFIG, ...config };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STAGE 1: STREAMING CANDIDATE GENERATION
  // Generate candidates in TIME WINDOWS, not all at once
  // ═══════════════════════════════════════════════════════════════════════════

  async *generateCandidatesStream(): AsyncGenerator<StreamBatch, void, unknown> {
    const { dateOfBirth, tentativeTime, offsetConfig } = this.input;
    
    // Calculate total offset range
    let offsetMinutes: number;
    if (offsetConfig.customMinutes !== undefined) {
      offsetMinutes = offsetConfig.customMinutes;
    } else {
      const preset = offsetConfig.preset;
      const presetMap: Record<string, number> = {
        '30min': 30, '1hour': 60, '2hours': 120, '4hours': 240,
        '6hours': 360, '12hours': 720, 'seconds-30': 5, 'seconds-6': 1
      };
      offsetMinutes = preset ? (presetMap[preset] || 60) : 60;
    }

    const interval = getAdaptiveInterval(offsetMinutes);
    const windowSize = this.config.generationWindowMinutes;
    const totalWindows = Math.ceil((offsetMinutes * 2) / windowSize);

    logger.info('🔱 STREAMING: Starting batched candidate generation', {
      totalOffsetMinutes: offsetMinutes,
      intervalMinutes: interval,
      windowSizeMinutes: windowSize,
      totalWindows,
      maxConcurrent: this.config.maxConcurrentAnalysis,
    });

    // Generate candidates in time windows (chronological order)
    for (let windowIndex = 0; windowIndex < totalWindows; windowIndex++) {
      // Check memory pressure
      const memUsage = process.memoryUsage();
      const heapGB = memUsage.heapUsed / 1024 / 1024 / 1024;
      
      if (heapGB > this.config.memoryThresholdGB) {
        logger.warn(`[STREAMING] Memory pressure (${heapGB.toFixed(2)}GB), pausing generation`);
        // Wait for analysis to catch up and free memory
        await this.waitForMemory(6); // Wait until < 6GB
      }

      const windowStartOffset = -offsetMinutes + (windowIndex * windowSize);
      const windowEndOffset = Math.min(windowStartOffset + windowSize, offsetMinutes);

      // Generate candidates for this time window
      const windowCandidates: CandidateTime[] = [];
      const [h, m, s] = tentativeTime.split(':').map(Number);
      const baseMinutes = h * 60 + m + s / 60;

      for (let offset = windowStartOffset; offset <= windowEndOffset; offset += interval) {
        const candidateMinutes = baseMinutes + offset;
        const candidate = this.convertMinutesToTime(candidateMinutes, offset);
        windowCandidates.push(candidate);
      }

      // Create batch
      this.batchCounter++;
      const batch: StreamBatch = {
        batchId: this.batchCounter,
        candidates: windowCandidates,
        status: 'pending',
        startTime: Date.now(),
      };

      this.batches.set(batch.batchId, batch);
      this.totalGenerated += windowCandidates.length;

      logger.info(`[STREAMING] Generated batch ${batch.batchId}`, {
        candidates: windowCandidates.length,
        range: `${windowCandidates[0]?.time} to ${windowCandidates[windowCandidates.length - 1]?.time}`,
        totalGenerated: this.totalGenerated,
      });

      yield batch;

      // Small delay to allow event loop to process
      await new Promise(resolve => setImmediate(resolve));
    }

    logger.info('[STREAMING] All batches generated', {
      totalBatches: this.batchCounter,
      totalCandidates: this.totalGenerated,
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STAGE 2: STREAMING BATCH ANALYSIS
  // Analyze batches as they arrive, with concurrency limit
  // ═══════════════════════════════════════════════════════════════════════════

  async processBatchesStream(): Promise<CandidateTime[]> {
    const generator = this.generateCandidatesStream();
    const analysisQueue: Promise<void>[] = [];
    const allSurvivors: CandidateTime[] = [];

    logger.info('[STREAMING] Starting streaming analysis pipeline');

    // Process generator and analysis in parallel
    for await (const batch of generator) {
      // Wait if we have too many concurrent analyses
      while (analysisQueue.length >= this.config.maxConcurrentAnalysis) {
        await Promise.race(analysisQueue);
        // Remove completed promises
        for (let i = analysisQueue.length - 1; i >= 0; i--) {
          // Check if done (simplified - in real code track completion)
          if (analysisQueue.length > this.config.maxConcurrentAnalysis) {
            analysisQueue.splice(i, 1);
          }
        }
      }

      // Start analysis for this batch
      const analysisPromise = this.analyzeBatch(batch).then(survivors => {
        allSurvivors.push(...survivors);
        this.totalAnalyzed += batch.candidates.length;
        
        // Emit progress
        this.emit('progress', {
          batchId: batch.batchId,
          analyzed: this.totalAnalyzed,
          total: this.totalGenerated,
          survivors: allSurvivors.length,
        });
      });

      analysisQueue.push(analysisPromise);
    }

    // Wait for remaining analyses
    await Promise.all(analysisQueue);

    logger.info('[STREAMING] Streaming analysis complete', {
      totalAnalyzed: this.totalAnalyzed,
      totalSurvivors: allSurvivors.length,
    });

    return allSurvivors;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // BATCH ANALYSIS (Memory-bounded)
  // ═══════════════════════════════════════════════════════════════════════════

  private async analyzeBatch(batch: StreamBatch): Promise<CandidateTime[]> {
    batch.status = 'processing';
    
    try {
      // Split batch into mini-batches for AI analysis
      const miniBatches = splitIntoBatches(batch.candidates, 10);
      const survivors: CandidateTime[] = [];

      for (const miniBatch of miniBatches) {
        // Check cancellation
        // Build data packages for this mini-batch
        const dataPackages = await Promise.all(
          miniBatch.map(c => this.buildLightweightPackage(c))
        );

        // Quick scoring (without AI for initial filter)
        const scored = await this.quickScoreBatch(miniBatch, dataPackages);
        
        // Keep top 50% from each mini-batch
        const topCount = Math.ceil(miniBatch.length * 0.5);
        const topScored = scored
          .sort((a, b) => b.score - a.score)
          .slice(0, topCount);

        survivors.push(...topScored.map(s => s.candidate));

        // Immediate cleanup
        dataPackages.length = 0;
      }

      batch.status = 'complete';
      batch.survivors = survivors;
      batch.endTime = Date.now();

      logger.info(`[STREAMING] Batch ${batch.batchId} complete`, {
        in: batch.candidates.length,
        out: survivors.length,
        duration: batch.endTime - (batch.startTime || 0),
      });

      return survivors;
    } catch (error) {
      batch.status = 'failed';
      logger.error(`[STREAMING] Batch ${batch.batchId} failed`, error);
      // Return all candidates if analysis fails (safety)
      return batch.candidates;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // LIGHTWEIGHT PACKAGE BUILDER (Memory-optimized)
  // ═══════════════════════════════════════════════════════════════════════════

  private async buildLightweightPackage(candidate: CandidateTime): Promise<any> {
    // Only calculate essential data for Stage 1/2
    // Full data (D9/D10/D60) calculated only for survivors later
    const ephemeris = await calculateEphemeris(
      this.input.dateOfBirth,
      candidate.time,
      this.input.latitude,
      this.input.longitude,
      this.input.timezone
    );

    const moonLong = ephemeris.planets.moon.longitude;
    const birthDate = new Date(this.input.dateOfBirth);
    
    // Only Level 2 dasha (not full 5 levels)
    const vimDashas = calculateVimshottariDasha(moonLong, birthDate, 2);

    return {
      time: candidate.time,
      ascendant: {
        sign: ephemeris.ascendant.sign,
        degree: ephemeris.ascendant.degree,
        nakshatra: ephemeris.ascendant.nakshatra,
      },
      moonNakshatra: ephemeris.planets.moon.nakshatra,
      vimshottari: vimDashas.slice(0, 5), // Only first 5 dasha periods
      houseLords: this.getEssentialHouseLords(ephemeris),
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // QUICK SCORING (No AI - purely mathematical)
  // ═══════════════════════════════════════════════════════════════════════════

  private async quickScoreBatch(
    candidates: CandidateTime[],
    packages: any[]
  ): Promise<Array<{ candidate: CandidateTime; score: number }>> {
    return candidates.map((candidate, i) => {
      const pkg = packages[i];
      let score = 50; // Base score

      // Check dasha correlation with events (simplified)
      for (const event of this.input.lifeEvents.slice(0, 3)) { // Only first 3 events
        const eventDate = new Date(event.eventDate);
        const dasha = getDashaForDate(pkg.vimshottari, eventDate);
        
        if (dasha) {
          // Simple house-based scoring
          const eventHouse = this.getEventHouse(event.category);
          if (eventHouse) {
            // Check if dasha lord rules event house
            const houseLord = pkg.houseLords[eventHouse];
            if (houseLord && dasha.mahadasha.includes(houseLord)) {
              score += 15;
            }
          }
        }
      }

      // Lagna strength bonus
      const lagnaLord = pkg.houseLords[1];
      const lagnaSign = pkg.ascendant.sign;
      if (lagnaLord) {
        const dignity = getDignity(lagnaLord, lagnaSign);
        if (dignity === 'Exalted') score += 10;
        if (dignity === 'Own Sign') score += 5;
      }

      return { candidate, score: Math.min(100, score) };
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // UTILITY FUNCTIONS
  // ═══════════════════════════════════════════════════════════════════════════

  private convertMinutesToTime(totalMinutes: number, offsetMinutes: number): CandidateTime {
    let adjusted = totalMinutes;
    if (adjusted < 0) adjusted += 24 * 60;
    if (adjusted >= 24 * 60) adjusted -= 24 * 60;

    const h = Math.floor(adjusted / 60);
    const m = Math.floor(adjusted % 60);
    const s = Math.round((adjusted % 1) * 60);

    return {
      time: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`,
      offsetMinutes: Math.round(offsetMinutes),
      offsetDescription: offsetMinutes === 0 ? 'Tentative' : `${offsetMinutes > 0 ? '+' : ''}${offsetMinutes}m`,
    };
  }

  private getEssentialHouseLords(ephemeris: EphemerisData): Record<number, string> {
    // 🔱 OPTIMIZED: Calculate only essential houses (1, 5, 7, 9, 10)
    const signLords: Record<string, string> = {
      'Aries': 'Mars', 'Taurus': 'Venus', 'Gemini': 'Mercury', 'Cancer': 'Moon',
      'Leo': 'Sun', 'Virgo': 'Mercury', 'Libra': 'Venus', 'Scorpio': 'Mars',
      'Sagittarius': 'Jupiter', 'Capricorn': 'Saturn', 'Aquarius': 'Saturn', 'Pisces': 'Jupiter'
    };
    
    const essentialHouses = [1, 5, 7, 9, 10];
    const lords: Record<number, string> = {};
    
    for (const houseNum of essentialHouses) {
      const house = ephemeris.houses?.find((h: any) => h.houseNumber === houseNum);
      if (house) {
        lords[houseNum] = signLords[house.sign] || 'Unknown';
      }
    }
    
    return lords;
  }

  private getEventHouse(category: string): number | null {
    const houseMap: Record<string, number> = {
      marriage: 7, career: 10, education: 4, children: 5,
      health: 6, family: 2, travel: 9, finance: 2,
    };
    return houseMap[category] || null;
  }

  private async waitForMemory(targetGB: number): Promise<void> {
    let attempts = 0;
    while (attempts < 30) {
      const memUsage = process.memoryUsage();
      const heapGB = memUsage.heapUsed / 1024 / 1024 / 1024;
      
      if (heapGB < targetGB) {
        logger.info(`[STREAMING] Memory recovered to ${heapGB.toFixed(2)}GB`);
        return;
      }

      // Trigger GC if available
      if ((global as any).gc) {
        (global as any).gc();
      }

      await new Promise(resolve => setTimeout(resolve, 1000));
      attempts++;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STAGE 3-6: DEEP ANALYSIS (Traditional pipeline for survivors)
  // ═══════════════════════════════════════════════════════════════════════════

  async processDeepAnalysis(survivors: CandidateTime[]): Promise<any> {
    logger.info('[STREAMING] Starting deep analysis on survivors', {
      survivorCount: survivors.length,
    });

    // 🔱 OPTIMIZED: Limit survivors to prevent memory overload
    const maxSurvivors = 15; // Cap at 15 for deep analysis
    const prioritizedSurvivors = survivors.slice(0, maxSurvivors);
    
    if (survivors.length > maxSurvivors) {
      logger.warn(`[STREAMING] Truncated ${survivors.length} survivors to ${maxSurvivors} for deep analysis`);
    }

    // Stage 3: Refinement Grid (±5 min at 1-min intervals around top 3)
    const refined: CandidateTime[] = [];
    for (const survivor of prioritizedSurvivors.slice(0, 3)) {
      const [h, m, s] = survivor.time.split(':').map(Number);
      const baseSec = h * 3600 + m * 60 + s;
      
      // Generate ±5 min at 60-sec intervals (11 points per survivor)
      for (let offset = -300; offset <= 300; offset += 60) {
        let totalSec = baseSec + offset;
        if (totalSec < 0) totalSec += 86400;
        if (totalSec >= 86400) totalSec -= 86400;
        
        const hh = Math.floor(totalSec / 3600);
        const mm = Math.floor((totalSec % 3600) / 60);
        const ss = totalSec % 60;
        
        refined.push({
          time: `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`,
          offsetMinutes: survivor.offsetMinutes + offset / 60,
          offsetDescription: `Refined ${offset > 0 ? '+' : ''}${offset}s`,
        });
      }
    }
    
    // Deduplicate
    const uniqueRefined = Array.from(new Map(refined.map(r => [r.time, r])).values());
    
    logger.info('[STREAMING] Refinement grid generated', {
      refinedCount: uniqueRefined.length,
    });

    // Clear survivors array to free memory before next stage
    prioritizedSurvivors.length = 0;

    // Return for Stage 4 (Deep Multi-Dasha) - caller continues
    return {
      survivors: uniqueRefined,
      totalAnalyzed: this.totalAnalyzed,
      totalGenerated: this.totalGenerated,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 🔱 MEMORY CLEANUP UTILITIES
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Force garbage collection and clear internal caches
   * Call between stages to prevent memory buildup
   */
  async forceCleanup(): Promise<void> {
    // Clear batch map (keep only last 3)
    const batchIds = Array.from(this.batches.keys()).sort((a, b) => b - a);
    for (let i = 3; i < batchIds.length; i++) {
      this.batches.delete(batchIds[i]);
    }

    // Clear candidate arrays
    this.allCandidates.length = 0;
    this.globalSurvivors.length = 0;

    // Trigger GC
    if ((global as any).gc) {
      (global as any).gc();
    }

    // Log memory status
    const memUsage = process.memoryUsage();
    logger.info('[STREAMING] Cleanup complete', {
      heapUsed: (memUsage.heapUsed / 1024 / 1024).toFixed(2) + 'MB',
      heapTotal: (memUsage.heapTotal / 1024 / 1024).toFixed(2) + 'MB',
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 🔱 NEW PIPELINE MODE (v9.0)
  // Max 10 candidates per batch, full Swiss Eph data, sequential processing
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Process BTR using the new Pipeline architecture
   * This replaces the old streaming approach with:
   * - Max 10 candidates per batch (never exceeds)
   * - Full Swiss Eph data (no truncation)
   * - Sequential: Generate batch → AI analysis → Next batch
   * - OpenRouter rate limit aware (20 RPM)
   */
  async processWithPipeline(): Promise<{
    survivors: CandidateTime[];
    totalAnalyzed: number;
    totalGenerated: number;
    aiResults: Array<{
      time: string;
      score: number;
      confidence: string;
      verdict: string;
      reasoning: string;
    }>;
  }> {
    logger.info('🔱 PIPELINE MODE: Starting new BTR processor', {
      sessionId: this.input.sessionId,
    });

    // Create pipeline processor
    const pipeline = new PipelineBTRProcessor(this.input, this.progress, {
      maxCandidatesPerBatch: 10,  // STRICT: 10 se jyda nahi
      memoryThresholdGB: 6,
      openRouterMaxRPM: 20,
      enableFullVargas: true,     // Full data - no truncation
      enableDeepDasha: true,      // All 5 levels
    });

    // Forward pipeline events
    pipeline.on('pipeline_start', (data) => {
      this.emit('pipeline_start', data);
    });

    pipeline.on('batch_start', (data) => {
      this.emit('batch_start', data);
      this.progress.updateMessage(
        `Processing batch ${data.batchId}/${data.totalBatches}`);
    });

    pipeline.on('batch_complete', (data) => {
      this.emit('batch_complete', data);
      this.totalAnalyzed += data.resultsCount;
      
      // Emit progress
      this.emit('progress', {
        stage: 2,
        analyzed: this.totalAnalyzed,
        total: this.totalGenerated,
        batchId: data.batchId,
      });
    });

    pipeline.on('pipeline_complete', (data) => {
      this.emit('pipeline_complete', data);
    });

    try {
      // Run pipeline
      const results = await pipeline.processPipeline();

      logger.info('🔱 PIPELINE MODE: Complete', {
        totalResults: results.length,
      });

      // Convert to survivors format
      const survivors: CandidateTime[] = results
        .sort((a, b) => b.score - a.score)
        .map(r => ({
          time: r.time,
          offsetMinutes: 0,
          offsetDescription: r.verdict,
        }));

      return {
        survivors,
        totalAnalyzed: this.totalAnalyzed,
        totalGenerated: this.totalGenerated,
        aiResults: results.map(r => ({
          time: r.time,
          score: r.score,
          confidence: r.confidence,
          verdict: r.verdict,
          reasoning: r.reasoning,
        })),
      };
    } finally {
      // Cleanup
      await pipeline.forceCleanup();
    }
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// EXPORT
// ═════════════════════════════════════════════════════════════════════════════

export { StreamingConfig, StreamBatch };
export { PipelineBTRProcessor, calculateBatchSize, calculateTotalBatches };
export default StreamingBTRProcessor;
