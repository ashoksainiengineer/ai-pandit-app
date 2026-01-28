// lib/pipeline-btr-processor.ts
// 🔱 PIPELINE BTR PROCESSOR v1.0
// Max 10 candidates per batch, full Swiss Eph data, sequential processing
// Memory-bounded: Generate batch → Send to AI → Next batch

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
import { EventEmitter } from 'events';
import { callAIWithStream, MASTER_ASTROLOGY_SYSTEM_PROMPT, buildCandidateAnalysisPrompt } from './ai-client.js';

// ═════════════════════════════════════════════════════════════════════════════
// PIPELINE CONFIGURATION
// ═════════════════════════════════════════════════════════════════════════════

interface PipelineConfig {
  maxCandidatesPerBatch: number;  // Max 10 as per requirement
  memoryThresholdGB: number;      // Pause if memory exceeds this
  openRouterMaxRPM: number;       // Rate limit for OpenRouter
  enableFullVargas: boolean;      // Include D9, D10, D60 etc.
  enableDeepDasha: boolean;       // Include all 5 levels of dasha
}

// 🔱 MAX 10 CANDIDATES PER BATCH - NEVER EXCEED
const DEFAULT_PIPELINE_CONFIG: PipelineConfig = {
  maxCandidatesPerBatch: 10,   // STRICT LIMIT: 10 se jyda nahi
  memoryThresholdGB: 6,        // 6GB threshold for 16GB HF Spaces
  openRouterMaxRPM: 20,        // Standard OpenRouter limit
  enableFullVargas: true,      // Full data - no truncation
  enableDeepDasha: true,       // All 5 levels of dasha
};

// ═════════════════════════════════════════════════════════════════════════════
// TYPES
// ═════════════════════════════════════════════════════════════════════════════

interface CandidateTime {
  time: string;              // HH:MM:SS
  offsetMinutes: number;     // From tentative time
  offsetDescription: string;
}

/**
 * Event importance levels with weights for scoring
 * Higher weight = more impact on final birth time determination
 */
enum EventImportance {
  CRITICAL = 'critical',    // Marriage, Career change, Major surgery
  HIGH = 'high',            // Education completion, Property purchase
  MEDIUM = 'medium',        // Job changes, Travel abroad
  LOW = 'low',              // Minor events, Relocations
}

/**
 * Event weights for scoring algorithm
 * Weights are multipliers in scoring calculations
 */
const EVENT_WEIGHTS: Record<EventImportance, number> = {
  [EventImportance.CRITICAL]: 3.0,  // 3x weight - Life-defining events
  [EventImportance.HIGH]: 2.0,      // 2x weight - Significant milestones
  [EventImportance.MEDIUM]: 1.0,    // 1x weight - Normal events
  [EventImportance.LOW]: 0.5,       // 0.5x weight - Minor events
};

/**
 * Event category to importance mapping
 * Defines how critical each event type is for BTR
 */
const EVENT_CATEGORY_IMPORTANCE: Record<string, EventImportance> = {
  // CRITICAL - Life-defining moments
  marriage: EventImportance.CRITICAL,
  'major-surgery': EventImportance.CRITICAL,
  'career-breakthrough': EventImportance.CRITICAL,
  childbirth: EventImportance.CRITICAL,
  divorce: EventImportance.CRITICAL,
  'near-death': EventImportance.CRITICAL,
  
  // HIGH - Significant milestones
  education: EventImportance.HIGH,
  'higher-education': EventImportance.HIGH,
  'property-purchase': EventImportance.HIGH,
  'business-start': EventImportance.HIGH,
  promotion: EventImportance.HIGH,
  award: EventImportance.HIGH,
  
  // MEDIUM - Normal life events
  'job-change': EventImportance.MEDIUM,
  'travel-abroad': EventImportance.MEDIUM,
  relocation: EventImportance.MEDIUM,
  'vehicle-purchase': EventImportance.MEDIUM,
  'spiritual-initiation': EventImportance.MEDIUM,
  
  // LOW - Minor events
  'minor-illness': EventImportance.LOW,
  'short-travel': EventImportance.LOW,
  'friendship-change': EventImportance.LOW,
  'hobby-start': EventImportance.LOW,
};

/**
 * Get event weight based on category and user-provided importance
 * BACKWARD COMPATIBLE: Handles old data without importance field
 */
function getEventWeight(category: string, userImportance?: string): number {
  // If user provided importance, use it (highest priority)
  if (userImportance) {
    const normalized = userImportance.toLowerCase();
    if (normalized === 'critical' || normalized.includes('very high')) {
      return EVENT_WEIGHTS[EventImportance.CRITICAL];
    }
    if (normalized === 'high') {
      return EVENT_WEIGHTS[EventImportance.HIGH];
    }
    if (normalized === 'low') {
      return EVENT_WEIGHTS[EventImportance.LOW];
    }
    if (normalized === 'medium') {
      return EVENT_WEIGHTS[EventImportance.MEDIUM];
    }
  }
  
  // Fall back to category-based detection (for old data without importance)
  const categoryImportance = EVENT_CATEGORY_IMPORTANCE[category.toLowerCase()];
  if (categoryImportance) {
    return EVENT_WEIGHTS[categoryImportance];
  }
  
  // Ultimate fallback: medium weight
  logger.warn(`Unknown category "${category}", using medium weight`);
  return EVENT_WEIGHTS[EventImportance.MEDIUM];
}

/**
 * Calculate weighted event score
 * Score = baseScore × eventWeight
 */
function calculateWeightedEventScore(
  baseScore: number,
  category: string,
  userImportance?: string
): number {
  const weight = getEventWeight(category, userImportance);
  return Math.min(100, baseScore * weight);
}

/**
 * Get events sorted by weight (highest first)
 * Ensures critical events are processed first
 */
function sortEventsByWeight<T extends { category: string; importance?: string }>(
  events: T[]
): T[] {
  return [...events].sort((a, b) => {
    const weightA = getEventWeight(a.category, a.importance);
    const weightB = getEventWeight(b.category, b.importance);
    return weightB - weightA;
  });
}

interface SwissEphBatch {
  batchId: number;
  candidates: CandidateWithFullData[];
  status: 'generating' | 'ready' | 'analyzing' | 'complete' | 'failed';
  generatedAt: number;
  analyzedAt?: number;
}

interface CandidateWithFullData {
  time: string;
  offsetMinutes: number;
  offsetDescription: string;
  // 🔱 FULL SWISS EPH DATA - NO TRUNCATION
  ephemeris: EphemerisData;
  vimshottariDasha: VimshottariDashaFull;
  vargas?: Record<string, any>;
  shadbala?: any;
  ashtakavarga?: any;
  yogas?: Array<{ name: string; description: string; level: string }>;
}

interface VimshottariDashaFull {
  mahadasha: DashaPeriod[];
  antardasha: DashaPeriod[];
  pratyantardasha: DashaPeriod[];
  sukshmadasha: DashaPeriod[];
  pranadasha: DashaPeriod[];
}

interface DashaPeriod {
  lord: string;
  startDate: Date;
  endDate: Date;
  durationYears: number;
}

interface AIAnalysisResult {
  batchId: number;
  candidateResults: CandidateAIResult[];
  analysisTimestamp: number;
}

interface CandidateAIResult {
  time: string;
  score: number;
  confidence: 'High' | 'Medium' | 'Low';
  verdict: string;
  reasoning: string;
  eventMatches: Array<{
    event: string;
    matches: boolean;
    reason: string;
  }>;
}

// ═════════════════════════════════════════════════════════════════════════════
// D60 (SHASHTYAMSA) TYPES - SECONDS-LEVEL PRECISION
// ═════════════════════════════════════════════════════════════════════════════

/**
 * D60 planetary position data
 */
interface D60Position {
  d60Sign: string;
  d60Part: number;
  degreeInSign: number;
  nakshatra: string;
  pada: number;
  retrograde: boolean;
}

/**
 * Planetary strength in D60
 */
interface D60Strength {
  strength: number;
  isOwnSign: boolean;
  isExalted: boolean;
  isDebilitated: boolean;
  lord: string;
}

/**
 * Complete D60 chart data
 */
interface D60ChartData {
  time: string;
  lagna: string;
  deity: string;
  positions: Record<string, D60Position>;
  planetaryStrengths: Record<string, D60Strength>;
}

/**
 * D60 analysis result with precision metrics
 */
interface D60AnalysisResult {
  time: string;
  d60Lagna: string;
  deity: string;
  lagnaStability: number;
  planetaryHarmony: number;
  precisionSeconds: number;
  confirmsAI: boolean;
  strongestPlanet: { planet: string; strength: number };
  aiScore: number;
  finalScore: number;
  recommendations: string[];
}

// ═════════════════════════════════════════════════════════════════════════════
// OPENROUTER RATE LIMITER
// ═════════════════════════════════════════════════════════════════════════════

class OpenRouterRateLimiter {
  private lastCallTime: number = 0;
  private minIntervalMs: number;
  private queue: Array<() => void> = [];
  private isProcessing: boolean = false;

  constructor(maxRPM: number = 20) {
    // 20 RPM = 1 call per 3 seconds minimum
    this.minIntervalMs = (60 * 1000) / maxRPM;
  }

  async waitForSlot(): Promise<void> {
    return new Promise((resolve) => {
      this.queue.push(resolve);
      this.processQueue();
    });
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) return;

    this.isProcessing = true;

    const now = Date.now();
    const timeSinceLastCall = now - this.lastCallTime;
    
    if (timeSinceLastCall < this.minIntervalMs) {
      await this.sleep(this.minIntervalMs - timeSinceLastCall);
    }

    this.lastCallTime = Date.now();
    const nextResolve = this.queue.shift();
    if (nextResolve) nextResolve();

    this.isProcessing = false;
    
    // Process next if any
    if (this.queue.length > 0) {
      setTimeout(() => this.processQueue(), 0);
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// DYNAMIC BATCH SIZE CALCULATOR - OPTIMIZED BY OFFSET LEVEL
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Batch size configuration by offset level
 * Optimized for AI attention span and memory constraints
 */
interface BatchSizeConfig {
  maxBatchSize: number;
  targetBatchSize: number;
  minBatchSize: number;
  aiAttentionScore: number; // 1-10, higher = AI can handle more
  recommendedTotal: number;  // Optimal total candidates for this offset
}

/**
 * Get optimized batch configuration for offset level
 * Balances: AI attention, memory usage, processing speed, accuracy
 */
function getBatchConfig(offsetMinutes: number): BatchSizeConfig {
  // SECONDS PRECISION LEVELS (High precision, fewer candidates)
  if (offsetMinutes <= 1) {
    return {
      maxBatchSize: 5,
      targetBatchSize: 3,
      minBatchSize: 2,
      aiAttentionScore: 10, // Full attention on few candidates
      recommendedTotal: 5,   // ±1 min = 5 candidates max
    };
  }
  
  if (offsetMinutes <= 5) {
    return {
      maxBatchSize: 7,
      targetBatchSize: 5,
      minBatchSize: 3,
      aiAttentionScore: 9,
      recommendedTotal: 21,  // ±5 min @ 30s interval = 21 candidates
    };
  }

  // STANDARD PRECISION LEVELS (Balanced approach)
  if (offsetMinutes <= 30) {
    return {
      maxBatchSize: 10,
      targetBatchSize: 7,
      minBatchSize: 5,
      aiAttentionScore: 8,
      recommendedTotal: 61,  // ±30 min @ 1 min interval = 61 candidates
    };
  }

  if (offsetMinutes <= 60) {
    return {
      maxBatchSize: 10,
      targetBatchSize: 8,
      minBatchSize: 5,
      aiAttentionScore: 7,
      recommendedTotal: 121, // ±60 min @ 1 min interval = 121 candidates
    };
  }

  if (offsetMinutes <= 120) {
    return {
      maxBatchSize: 10,
      targetBatchSize: 8,
      minBatchSize: 5,
      aiAttentionScore: 7,
      recommendedTotal: 49,  // ±120 min @ 5 min interval = 49 candidates
    };
  }

  // BROAD SEARCH LEVELS (More candidates, AI attention spreads)
  if (offsetMinutes <= 240) {
    return {
      maxBatchSize: 10,
      targetBatchSize: 8,
      minBatchSize: 5,
      aiAttentionScore: 6,
      recommendedTotal: 49,  // ±240 min @ 10 min interval = 49 candidates
    };
  }

  if (offsetMinutes <= 360) {
    return {
      maxBatchSize: 10,
      targetBatchSize: 8,
      minBatchSize: 5,
      aiAttentionScore: 5,
      recommendedTotal: 73,  // ±360 min @ 10 min interval = 73 candidates
    };
  }

  // MAXIMUM SEARCH (12+ hours - very broad)
  return {
    maxBatchSize: 10,
    targetBatchSize: 8,
    minBatchSize: 5,
    aiAttentionScore: 4,
    recommendedTotal: 97,   // ±720 min @ 15 min interval = 97 candidates
  };
}

/**
 * Calculate batch size for given offset
 * NEVER exceeds maxBatchSize from config
 */
function calculateBatchSize(offsetMinutes: number): number {
  const config = getBatchConfig(offsetMinutes);
  return config.maxBatchSize;
}

/**
 * Calculate total batches needed
 */
function calculateTotalBatches(totalCandidates: number, batchSize: number): number {
  return Math.ceil(totalCandidates / batchSize);
}

/**
 * Get recommended candidate count for offset level
 * Use this to optimize total candidates before generation
 */
function getRecommendedCandidateCount(offsetMinutes: number): number {
  return getBatchConfig(offsetMinutes).recommendedTotal;
}

/**
 * Get AI attention score for logging/monitoring
 */
function getAIAttentionScore(offsetMinutes: number): number {
  return getBatchConfig(offsetMinutes).aiAttentionScore;
}

/**
 * Calculate optimal interval based on offset and desired candidate count
 */
function calculateOptimalInterval(offsetMinutes: number, desiredCandidates: number): number {
  const totalRange = offsetMinutes * 2; // ±offset
  return Math.max(0.5, totalRange / desiredCandidates);
}

// ═════════════════════════════════════════════════════════════════════════════
// PIPELINE BTR PROCESSOR
// ═════════════════════════════════════════════════════════════════════════════

export class PipelineBTRProcessor extends EventEmitter {
  private config: PipelineConfig;
  private input: SecondsPrecisionInput;
  private progress: ProgressTracker;
  private rateLimiter: OpenRouterRateLimiter;
  
  private batches: Map<number, SwissEphBatch> = new Map();
  private aiResults: Map<number, AIAnalysisResult> = new Map();
  
  private totalCandidates: number = 0;
  private processedBatches: number = 0;
  private totalBatches: number = 0;

  constructor(
    input: SecondsPrecisionInput, 
    progress: ProgressTracker, 
    config?: Partial<PipelineConfig>
  ) {
    super();
    this.input = input;
    this.progress = progress;
    this.config = { ...DEFAULT_PIPELINE_CONFIG, ...config };
    this.rateLimiter = new OpenRouterRateLimiter(this.config.openRouterMaxRPM);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MAIN PIPELINE CONTROLLER
  // Sequential: Generate Batch → AI Analysis → Next Batch
  // ═══════════════════════════════════════════════════════════════════════════

  async processPipeline(): Promise<CandidateAIResult[]> {
    const startTime = Date.now();
    
    // Step 1: Calculate all candidate times
    const allCandidates = this.generateAllCandidateTimes();
    this.totalCandidates = allCandidates.length;
    
    // Step 2: Calculate batch size and total batches
    const offsetMinutes = this.getOffsetMinutes();
    const batchSize = calculateBatchSize(offsetMinutes);
    this.totalBatches = calculateTotalBatches(allCandidates.length, batchSize);
    
    logger.info('🔱 PIPELINE: Starting sequential processing', {
      totalCandidates: this.totalCandidates,
      batchSize,
      totalBatches: this.totalBatches,
      offsetMinutes,
    });

    this.emit('pipeline_start', {
      totalCandidates: this.totalCandidates,
      totalBatches: this.totalBatches,
      batchSize,
    });

    // Step 3: Process batches sequentially
    const allResults: CandidateAIResult[] = [];
    
    for (let batchIndex = 0; batchIndex < this.totalBatches; batchIndex++) {
      // Check memory before generating
      await this.checkMemoryPressure();
      
      // Get candidates for this batch
      const startIdx = batchIndex * batchSize;
      const endIdx = Math.min(startIdx + batchSize, allCandidates.length);
      const batchCandidates = allCandidates.slice(startIdx, endIdx);
      
      logger.info(`🔱 PIPELINE: Processing batch ${batchIndex + 1}/${this.totalBatches}`, {
        candidatesInBatch: batchCandidates.length,
      });

      this.emit('batch_start', {
        batchId: batchIndex + 1,
        totalBatches: this.totalBatches,
        candidatesCount: batchCandidates.length,
      });

      // Step 3a: Generate full Swiss Eph data for batch
      const batch = await this.generateBatch(batchIndex + 1, batchCandidates);
      this.batches.set(batch.batchId, batch);

      // Step 3b: Send to AI for analysis
      const aiResult = await this.analyzeBatchWithAI(batch);
      this.aiResults.set(batch.batchId, aiResult);
      
      // Collect results
      allResults.push(...aiResult.candidateResults);
      this.processedBatches++;

      // Emit progress
      this.emit('batch_complete', {
        batchId: batch.batchId,
        processedBatches: this.processedBatches,
        totalBatches: this.totalBatches,
        resultsCount: aiResult.candidateResults.length,
      });

      // Memory cleanup after batch
      await this.cleanupBatch(batch.batchId);
      
      logger.info(`🔱 PIPELINE: Batch ${batchIndex + 1} complete`, {
        resultsInBatch: aiResult.candidateResults.length,
        totalResultsSoFar: allResults.length,
      });
    }

    const duration = Date.now() - startTime;
    logger.info('🔱 PIPELINE: All batches complete', {
      totalResults: allResults.length,
      durationMs: duration,
      avgTimePerBatch: Math.round(duration / this.totalBatches),
    });

    this.emit('pipeline_complete', {
      totalResults: allResults.length,
      durationMs: duration,
    });

    return allResults;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 1: GENERATE ALL CANDIDATE TIMES
  // ═══════════════════════════════════════════════════════════════════════════

  private generateAllCandidateTimes(): CandidateTime[] {
    const { dateOfBirth, tentativeTime, offsetConfig } = this.input;
    
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

    // Calculate interval based on offset
    const interval = this.getIntervalForOffset(offsetMinutes);
    const candidates: CandidateTime[] = [];
    
    const [h, m, s] = tentativeTime.split(':').map(Number);
    const baseMinutes = h * 60 + m + s / 60;

    // Generate candidates from -offset to +offset
    for (let offset = -offsetMinutes; offset <= offsetMinutes; offset += interval) {
      const candidateMinutes = baseMinutes + offset;
      const candidate = this.convertMinutesToTime(candidateMinutes, offset);
      candidates.push(candidate);
    }

    logger.info('🔱 PIPELINE: Generated candidate times', {
      totalCandidates: candidates.length,
      offsetMinutes,
      intervalMinutes: interval,
      firstCandidate: candidates[0]?.time,
      lastCandidate: candidates[candidates.length - 1]?.time,
    });

    return candidates;
  }

  private getIntervalForOffset(offsetMinutes: number): number {
    // Smaller intervals for smaller offsets (more precision)
    if (offsetMinutes <= 1) return 0.5;     // 30 sec interval for ±30 sec
    if (offsetMinutes <= 5) return 1;       // 1 min interval for ±5 min
    if (offsetMinutes <= 30) return 2;      // 2 min interval for ±30 min
    if (offsetMinutes <= 120) return 5;     // 5 min interval for ±2 hours
    if (offsetMinutes <= 360) return 10;    // 10 min interval for ±6 hours
    return 15;                               // 15 min interval for ±12+ hours
  }

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

  private getOffsetMinutes(): number {
    const { offsetConfig } = this.input;
    if (offsetConfig.customMinutes !== undefined) {
      return offsetConfig.customMinutes;
    }
    const preset = offsetConfig.preset;
    const presetMap: Record<string, number> = {
      '30min': 30, '1hour': 60, '2hours': 120, '4hours': 240,
      '6hours': 360, '12hours': 720, 'seconds-30': 5, 'seconds-6': 1
    };
    return preset ? (presetMap[preset] || 60) : 60;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 2: GENERATE BATCH WITH FULL SWISS EPH DATA
  // ═══════════════════════════════════════════════════════════════════════════

  private async generateBatch(
    batchId: number, 
    candidates: CandidateTime[]
  ): Promise<SwissEphBatch> {
    logger.info(`🔱 PIPELINE: Generating Swiss Eph data for batch ${batchId}`, {
      candidateCount: candidates.length,
    });

    const batch: SwissEphBatch = {
      batchId,
      candidates: [],
      status: 'generating',
      generatedAt: Date.now(),
    };

    // Generate full data for each candidate
    for (const candidate of candidates) {
      try {
        const fullData = await this.generateFullCandidateData(candidate);
        batch.candidates.push(fullData);
      } catch (error) {
        logger.error(`🔱 PIPELINE: Failed to generate data for ${candidate.time}`, error);
        // Continue with other candidates
      }
    }

    batch.status = 'ready';
    
    logger.info(`🔱 PIPELINE: Batch ${batchId} ready`, {
      candidatesWithData: batch.candidates.length,
    });

    return batch;
  }

  private async generateFullCandidateData(candidate: CandidateTime): Promise<CandidateWithFullData> {
    // 🔱 FULL SWISS EPH DATA - NO TRUNCATION
    const ephemeris = await calculateEphemeris(
      this.input.dateOfBirth,
      candidate.time,
      this.input.latitude,
      this.input.longitude,
      this.input.timezone
    );

    const birthDate = new Date(this.input.dateOfBirth);
    const moonLong = ephemeris.planets.moon.longitude;

    // Full Vimshottari Dasha (all 5 levels if enabled)
    const levels = this.config.enableDeepDasha ? 5 : 2;
    const dashaPeriods = calculateVimshottariDasha(moonLong, birthDate, levels);

    // Extract each level from the recursive structure
    const vimshottariDasha: VimshottariDashaFull = {
      mahadasha: dashaPeriods,
      antardasha: [],
      pratyantardasha: [],
      sukshmadasha: [],
      pranadasha: [],
    };

    // Extract sub-periods from first level
    for (const maha of dashaPeriods) {
      vimshottariDasha.antardasha.push(...(maha.subPeriods || []));
      for (const antar of maha.subPeriods || []) {
        vimshottariDasha.pratyantardasha.push(...(antar.subPeriods || []));
        for (const prat of antar.subPeriods || []) {
          vimshottariDasha.sukshmadasha.push(...(prat.subPeriods || []));
          for (const suksh of prat.subPeriods || []) {
            vimshottariDasha.pranadasha.push(...(suksh.subPeriods || []));
          }
        }
      }
    }

    // Build full data object
    const fullData: CandidateWithFullData = {
      time: candidate.time,
      offsetMinutes: candidate.offsetMinutes,
      offsetDescription: candidate.offsetDescription,
      ephemeris,
      vimshottariDasha,
    };

    // Add full vargas if enabled
    if (this.config.enableFullVargas) {
      fullData.vargas = calculateAllVargas(ephemeris);
    }

    // Add other calculations
    fullData.shadbala = calculateShadbala(ephemeris);
    fullData.ashtakavarga = calculateAshtakavarga(ephemeris);
    fullData.yogas = detectYogas(ephemeris) as Array<{ name: string; description: string; level: string }>;

    return fullData;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 3: AI ANALYSIS WITH RATE LIMITING
  // ═══════════════════════════════════════════════════════════════════════════

  private async analyzeBatchWithAI(batch: SwissEphBatch): Promise<AIAnalysisResult> {
    batch.status = 'analyzing';
    
    logger.info(`🔱 PIPELINE: Waiting for AI rate limit slot for batch ${batch.batchId}`);
    
    // Wait for rate limiter
    await this.rateLimiter.waitForSlot();
    
    logger.info(`🔱 PIPELINE: Analyzing batch ${batch.batchId} with AI`, {
      candidateCount: batch.candidates.length,
    });

    const candidateResults: CandidateAIResult[] = [];

    // Build comprehensive prompt with FULL data
    const prompt = this.buildComprehensivePrompt(batch.candidates);
    
    try {
      // Call AI with streaming
      const aiResponse = await callAIWithStream(
        this.input.sessionId || 'unknown',
        2, // Stage 2
        MASTER_ASTROLOGY_SYSTEM_PROMPT,
        prompt,
        {
          maxTokens: 65536,
          temperature: 0,
          model: process.env.AI_MODEL || 'deepseek/deepseek-r1',
        }
      );

      if (aiResponse.success && aiResponse.content) {
        // Parse AI response for each candidate
        const parsedResults = this.parseAIResponseForBatch(
          aiResponse.content, 
          batch.candidates
        );
        candidateResults.push(...parsedResults);
      } else {
        // AI failed - use fallback scoring
        logger.warn(`🔱 PIPELINE: AI analysis failed for batch ${batch.batchId}`, {
          error: aiResponse.error,
        });
        
        for (const candidate of batch.candidates) {
          candidateResults.push({
            time: candidate.time,
            score: 50, // Neutral score
            confidence: 'Low',
            verdict: 'Analysis failed - requires manual review',
            reasoning: aiResponse.error || 'AI service unavailable',
            eventMatches: [],
          });
        }
      }
    } catch (error) {
      logger.error(`🔱 PIPELINE: AI call failed for batch ${batch.batchId}`, error);
      
      // Fallback for all candidates
      for (const candidate of batch.candidates) {
        candidateResults.push({
          time: candidate.time,
          score: 50,
          confidence: 'Low',
          verdict: 'Analysis error',
          reasoning: error instanceof Error ? error.message : 'Unknown error',
          eventMatches: [],
        });
      }
    }

    batch.status = 'complete';
    batch.analyzedAt = Date.now();

    return {
      batchId: batch.batchId,
      candidateResults,
      analysisTimestamp: Date.now(),
    };
  }

  private buildComprehensivePrompt(candidates: CandidateWithFullData[]): string {
    const { dateOfBirth, lifeEvents, forensicTraits } = this.input;

    // Build candidate data sections with GOD-TIER detail
    const candidatesData = candidates.map((c, idx) => {
      // Planetary positions with full details
      const planetaryPositions = Object.entries(c.ephemeris.planets)
        .map(([name, p]) => {
          const retro = p.retro ? ' [R]' : '';
          const dignity = p.dignity || '';
          const pada = (p as any).pada || 1;
          return `${name.toUpperCase()}: ${p.sign} ${p.degree.toFixed(2)}° (${p.nakshatra} ${pada})${retro} - ${dignity}`;
        })
        .join('\n');

      // House cusps with lords
      const housePositions = c.ephemeris.houses
        .map(h => `House ${h.houseNumber}: ${h.sign} ${h.cusp.toFixed(2)}° (Lord: ${h.lord})`)
        .join('\n');

      // Complete Vimshottari Dasha (all levels)
      const dashaInfo = `
MAHADASHA PERIODS:
${c.vimshottariDasha.mahadasha.slice(0, 3).map(d =>
  `  ${d.lord}: ${d.startDate.toISOString().split('T')[0]} to ${d.endDate.toISOString().split('T')[0]} (${d.durationYears.toFixed(1)}y)`
).join('\n')}

ANTARDASHA (Current):
${c.vimshottariDasha.antardasha.slice(0, 3).map(d =>
  `  ${d.lord}: ${d.startDate.toISOString().split('T')[0]} to ${d.endDate.toISOString().split('T')[0]}`
).join('\n')}

PRATYANTARDASHA:
${c.vimshottariDasha.pratyantardasha.slice(0, 3).map(d =>
  `  ${d.lord}: ${d.startDate.toISOString().split('T')[0]} to ${d.endDate.toISOString().split('T')[0]}`
).join('\n')}`;

      // Divisional Charts with planet positions
      const vargaInfo = c.vargas ? `
DIVISIONAL CHARTS:
D1 (Rashi): ${c.vargas.d1?.ascendant?.sign || 'N/A'}
D9 (Navamsa): ${c.vargas.d9?.ascendant?.sign || 'N/A'} Lagna
D10 (Dasamsa): ${c.vargas.d10?.ascendant?.sign || 'N/A'} Lagna
D60 (Shashtyamsa): ${c.vargas.d60?.ascendant?.sign || 'N/A'} Lagna
` : '';

      // Shadbala (planetary strengths)
      const shadbalaInfo = c.shadbala ? `
PLANETARY STRENGTHS (Shadbala):
${Object.entries(c.shadbala).slice(0, 7).map(([planet, data]: [string, any]) =>
  `  ${planet}: ${data.total?.toFixed(1) || 'N/A'} Rupa`
).join('\n')}
` : '';

      // Ashtakavarga
      const ashtakavargaInfo = c.ashtakavarga ? `
ASHTAKAVARGA (Bindus):
${Object.entries(c.ashtakavarga).slice(0, 7).map(([planet, points]: [string, any]) =>
  `  ${planet}: ${Array.isArray(points) ? points.reduce((a: number, b: number) => a + b, 0) : 'N/A'} bindus`
).join('\n')}
` : '';

      return `
══════════════════════════════════════════════════════════════════
CANDIDATE #${idx + 1}: ${c.time} (Offset: ${c.offsetDescription})
══════════════════════════════════════════════════════════════════

🔱 ASCENDANT: ${c.ephemeris.ascendant.sign} ${c.ephemeris.ascendant.degree.toFixed(2)}° (${c.ephemeris.ascendant.nakshatra})

🪐 PLANETARY POSITIONS:
${planetaryPositions}

🏠 HOUSE CUSPS:
${housePositions}

⏳ VIMSHOTTARI DASHA:
${dashaInfo}
${vargaInfo}${shadbalaInfo}${ashtakavargaInfo}
🧘 YOGAS DETECTED:
${c.yogas?.map(y => `  • ${y.name} (${y.level}): ${y.description}`).join('\n') || '  None detected'}

⚡ LUNAR NAKSHATRA: ${c.ephemeris.planets.moon.nakshatra} ${(c.ephemeris.planets.moon as any).pada || 1}
`;
    }).join('\n');

    // Build detailed events section with transit requirements
    const eventsText = lifeEvents.map((event, i) => `
${i + 1}. ${event.eventType?.toUpperCase()} (${event.category})
   Date: ${event.eventDate}
   Importance: ${event.importance || 'medium'}
   Description: ${event.description}
   REQUIRED: Verify Dasha lord + Transit (Jupiter/Saturn) on this date
`).join('\n');

    // Forensic traits section
    const forensicText = forensicTraits ? `
🔮 FORENSIC PROFILE:
Physical: ${forensicTraits.physical?.facialStructure?.forehead || 'N/A'} forehead, ${forensicTraits.physical?.facialStructure?.eyeShape || 'N/A'} eyes
Prakriti: ${forensicTraits.biological?.prakriti || 'N/A'}
Speech: ${forensicTraits.psychographic?.speechStyle || 'N/A'}
Decision: ${forensicTraits.psychographic?.decisionMaking || 'N/A'}
Sibling: ${forensicTraits.family?.siblingPosition || 'N/A'}
Father: ${forensicTraits.family?.fatherStatusAtBirth || 'N/A'}
` : '';

    return `🔱 GOD-TIER BIRTH TIME RECTIFICATION - COMPREHENSIVE ANALYSIS
══════════════════════════════════════════════════════════════════

DATE OF BIRTH: ${dateOfBirth}
NUMBER OF CANDIDATES: ${candidates.length}
${forensicText}
${candidatesData}

══════════════════════════════════════════════════════════════════
LIFE EVENTS TO VERIFY (${lifeEvents.length} events):
══════════════════════════════════════════════════════════════════
${eventsText}

══════════════════════════════════════════════════════════════════
🎯 GOD-TIER ANALYSIS PROTOCOL:
══════════════════════════════════════════════════════════════════

You are the SUPREME VEDIC ASTROLOGER with 50+ years experience.
Perform SUB-SECOND PRECISION analysis using:

1. VIMSHOTTARI DASHA (All 5 levels):
   - Check Mahadasha-Antardasha-Pratyantardasha on event dates
   - Dasha lord must SUPPORT the event type
   - Score: 0-100 for each event-candidate match

2. DIVISIONAL CHARTS:
   - D1: Lagna and planetary positions
   - D9: Navamsa for marriage/spouse verification
   - D10: Dasamsa for career events
   - D60: Shashtyamsa for FINAL SECONDS-LEVEL precision

3. TRANSIT VERIFICATION:
   - Jupiter transit over event-sensitive houses
   - Saturn transit (Sade Sati, Ashtama Shani)
   - Double transit theory (Jupiter + Saturn)

4. SHADBALA & ASHTAKAVARGA:
   - Planet strength indicates event magnitude
   - High bindus = favorable results

5. YOGA VERIFICATION:
   - Raja Yogas for career/wealth events
   - Dhana Yogas for financial events
   - Gaja Kesari for intelligence/success

6. FORENSIC CORRELATION:
   - Match physical traits to Lagna/Ascendant
   - Prakriti (Vata/Pitta/Kapha) to elemental balance
   - Speech style to Mercury/Mars placement

══════════════════════════════════════════════════════════════════
📊 OUTPUT FORMAT (for each candidate):
══════════════════════════════════════════════════════════════════

CANDIDATE #N: [TIME]

DASHA ANALYSIS:
• Event 1: [Lord] Mahadasha - [Score]/100 - [Reasoning]
• Event 2: [Lord] Mahadasha - [Score]/100 - [Reasoning]
• [Continue for all events]

DIVISIONAL CHART VERIFICATION:
• D9 Match: [✓/✗] - [Explanation]
• D10 Match: [✓/✗] - [Explanation]
• D60 Precision: [✓/✗] - [Explanation]

TRANSIT VERIFICATION:
• Jupiter: [Position] aspecting [House] - [✓/✗]
• Saturn: [Position] - [✓/✗]

FORENSIC CORRELATION:
• Physical Traits: [Match %] - [Explanation]
• Behavioral Match: [Match %] - [Explanation]

SCORE: [0-100]
CONFIDENCE: [High (90-100)/Medium (70-89)/Low (<70)]
VERDICT: [This IS / IS NOT / MAY BE the correct birth time]
REASONING: [Detailed 3-5 sentence explanation]

FINAL RECOMMENDATION: [Best candidate time with justification]

Be ABSOLUTELY THOROUGH - 99.9% precision required.`;
  }

  private parseAIResponseForBatch(
    content: string, 
    candidates: CandidateWithFullData[]
  ): CandidateAIResult[] {
    const results: CandidateAIResult[] = [];
    
    for (const candidate of candidates) {
      // Try to find section for this candidate
      const candidatePattern = new RegExp(
        `CANDIDATE #\\d+.*?${candidate.time}.*?` +
        `SCORE:\\s*(\\d+).*?` +
        `CONFIDENCE:\\s*(High|Medium|Low).*?` +
        `VERDICT:\\s*([^\\n]+).*?` +
        `REASONING:\\s*([\\s\\S]*?)(?=CANDIDATE #|$)`,
        'i'
      );
      
      const match = content.match(candidatePattern);
      
      if (match) {
        results.push({
          time: candidate.time,
          score: parseInt(match[1]) || 50,
          confidence: (match[2] as 'High' | 'Medium' | 'Low') || 'Medium',
          verdict: match[3].trim(),
          reasoning: match[4].trim(),
          eventMatches: this.extractEventMatches(match[4]),
        });
      } else {
        // Fallback if parsing fails
        results.push({
          time: candidate.time,
          score: 50,
          confidence: 'Low',
          verdict: 'Parsing failed',
          reasoning: 'Could not extract structured data from AI response',
          eventMatches: [],
        });
      }
    }
    
    return results;
  }

  private extractEventMatches(reasoning: string): Array<{event: string; matches: boolean; reason: string}> {
    const matches: Array<{event: string; matches: boolean; reason: string}> = [];
    const eventRegex = /Event\s*(\d+):\s*([✓✗])\s*-\s*([^\n]+)/gi;
    let match;
    
    while ((match = eventRegex.exec(reasoning)) !== null) {
      matches.push({
        event: `Event ${match[1]}`,
        matches: match[2] === '✓',
        reason: match[3].trim(),
      });
    }
    
    return matches;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // D60 DEEP ANALYSIS - SECONDS-LEVEL PRECISION
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Perform deep D60 (Shashtyamsa) analysis on top candidates
   * Provides seconds-level precision verification
   */
  async performD60DeepAnalysis(
    topCandidates: CandidateAIResult[],
    count: number = 3
  ): Promise<D60AnalysisResult[]> {
    logger.info('🔱 D60: Starting deep Shashtyamsa analysis', {
      candidates: Math.min(count, topCandidates.length),
    });

    const candidatesToAnalyze = topCandidates.slice(0, count);
    const d60Results: D60AnalysisResult[] = [];

    for (const candidate of candidatesToAnalyze) {
      try {
        const d60Data = await this.generateD60Data(candidate.time);
        const analysis = this.analyzeD60Chart(d60Data, candidate);
        d60Results.push(analysis);

        logger.info(`🔱 D60: Analysis complete for ${candidate.time}`, {
          lagna: d60Data.lagna,
          deity: d60Data.deity,
          precision: analysis.precisionSeconds,
        });
      } catch (error) {
        logger.error(`🔱 D60: Failed for ${candidate.time}`, error);
      }
    }

    return d60Results;
  }

  /**
   * Generate D60 (Shashtyamsa) chart data for a candidate
   */
  private async generateD60Data(time: string): Promise<D60ChartData> {
    const ephemeris = await calculateEphemeris(
      this.input.dateOfBirth,
      time,
      this.input.latitude,
      this.input.longitude,
      this.input.timezone
    );

    // Calculate D60 positions
    const d60Positions = this.calculateD60Positions(ephemeris);
    const lagnaSign = this.getD60Lagna(ephemeris);
    const deity = getD60Deity(ephemeris.ascendant.longitude);

    return {
      time,
      lagna: lagnaSign,
      deity,
      positions: d60Positions,
      planetaryStrengths: this.calculateD60Strengths(d60Positions),
    };
  }

  /**
   * Calculate D60 positions for all planets
   */
  private calculateD60Positions(ephemeris: EphemerisData): Record<string, D60Position> {
    const positions: Record<string, D60Position> = {};

    for (const [planetName, planet] of Object.entries(ephemeris.planets)) {
      const longitude = planet.longitude;
      
      // D60 calculation: Each sign divided into 60 parts
      // Each part = 0.5 degrees (30 minutes)
      const signDegrees = longitude % 30;
      const d60Part = Math.floor(signDegrees / 0.5) + 1;
      
      // Calculate D60 sign based on complex rules
      const d60Sign = this.getD60Sign(longitude);
      
      // Get nakshatra pada for this position
      const nakshatraInfo = getNakshatraForLongitude(longitude);
      
      positions[planetName] = {
        d60Sign,
        d60Part,
        degreeInSign: signDegrees,
        nakshatra: nakshatraInfo.name,
        pada: nakshatraInfo.pada,
        retrograde: planet.retro,
      };
    }

    return positions;
  }

  /**
   * Get D60 sign for a longitude
   * Based on Parashari rules for Shashtyamsa
   */
  private getD60Sign(longitude: number): string {
    const signs = [
      'Aries', 'Taurus', 'Gemini', 'Cancer',
      'Leo', 'Virgo', 'Libra', 'Scorpio',
      'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
    ];
    
    // For odd signs, count forward; for even signs, count backward
    const signIndex = Math.floor(longitude / 30);
    const isOddSign = signIndex % 2 === 0;
    const signDegrees = longitude % 30;
    const d60Part = Math.floor(signDegrees / 0.5);
    
    let d60SignIndex: number;
    if (isOddSign) {
      d60SignIndex = (signIndex + d60Part) % 12;
    } else {
      d60SignIndex = (signIndex - d60Part + 12) % 12;
    }
    
    return signs[d60SignIndex];
  }

  /**
   * Get D60 Lagna sign
   */
  private getD60Lagna(ephemeris: EphemerisData): string {
    return this.getD60Sign(ephemeris.ascendant.longitude);
  }

  /**
   * Calculate planetary strengths in D60
   */
  private calculateD60Strengths(
    positions: Record<string, D60Position>
  ): Record<string, D60Strength> {
    const strengths: Record<string, D60Strength> = {};
    
    const signLords: Record<string, string> = {
      'Aries': 'Mars', 'Taurus': 'Venus', 'Gemini': 'Mercury', 'Cancer': 'Moon',
      'Leo': 'Sun', 'Virgo': 'Mercury', 'Libra': 'Venus', 'Scorpio': 'Mars',
      'Sagittarius': 'Jupiter', 'Capricorn': 'Saturn', 'Aquarius': 'Saturn', 'Pisces': 'Jupiter'
    };

    for (const [planet, position] of Object.entries(positions)) {
      const lord = signLords[position.d60Sign];
      const isOwnSign = lord === planet;
      const isExalted = this.isExaltedInSign(planet, position.d60Sign);
      const isDebilitated = this.isDebilitatedInSign(planet, position.d60Sign);
      
      let strength = 5; // Base strength
      if (isExalted) strength = 10;
      else if (isOwnSign) strength = 8;
      else if (isDebilitated) strength = 2;
      
      strengths[planet] = {
        strength,
        isOwnSign,
        isExalted,
        isDebilitated,
        lord,
      };
    }

    return strengths;
  }

  /**
   * Check if planet is exalted in given sign
   */
  private isExaltedInSign(planet: string, sign: string): boolean {
    const exaltations: Record<string, string> = {
      'Sun': 'Aries', 'Moon': 'Taurus', 'Mars': 'Capricorn',
      'Mercury': 'Virgo', 'Jupiter': 'Cancer', 'Venus': 'Pisces',
      'Saturn': 'Libra', 'Rahu': 'Gemini', 'Ketu': 'Sagittarius'
    };
    return exaltations[planet] === sign;
  }

  /**
   * Check if planet is debilitated in given sign
   */
  private isDebilitatedInSign(planet: string, sign: string): boolean {
    const debilitations: Record<string, string> = {
      'Sun': 'Libra', 'Moon': 'Scorpio', 'Mars': 'Cancer',
      'Mercury': 'Pisces', 'Jupiter': 'Capricorn', 'Venus': 'Virgo',
      'Saturn': 'Aries', 'Rahu': 'Sagittarius', 'Ketu': 'Gemini'
    };
    return debilitations[planet] === sign;
  }

  /**
   * Analyze D60 chart for precision indicators
   */
  private analyzeD60Chart(
    d60Data: D60ChartData,
    aiResult: CandidateAIResult
  ): D60AnalysisResult {
    // Calculate precision estimate based on D60 stability
    const lagnaStability = this.calculateLagnaStability(d60Data);
    const planetaryHarmony = this.calculatePlanetaryHarmony(d60Data);
    
    // Estimate precision in seconds
    // Higher stability = higher precision possible
    const precisionSeconds = Math.round((lagnaStability * planetaryHarmony) / 10);
    
    // Determine if D60 confirms AI result
    const confirmsAI = aiResult.score >= 80 && lagnaStability >= 7;
    
    // Find strongest planet in D60
    const strongestPlanet = this.findStrongestPlanet(d60Data.planetaryStrengths);
    
    return {
      time: d60Data.time,
      d60Lagna: d60Data.lagna,
      deity: d60Data.deity,
      lagnaStability,
      planetaryHarmony,
      precisionSeconds,
      confirmsAI,
      strongestPlanet,
      aiScore: aiResult.score,
      finalScore: Math.round((aiResult.score + lagnaStability * 10) / 2),
      recommendations: this.generateD60Recommendations(d60Data, confirmsAI),
    };
  }

  /**
   * Calculate lagna stability indicator
   */
  private calculateLagnaStability(d60Data: D60ChartData): number {
    // Check if lagna lord is strong
    const lagnaLord = this.getLagnaLord(d60Data.lagna);
    const lordStrength = d60Data.planetaryStrengths[lagnaLord]?.strength || 5;
    
    // Check if benefics aspect lagna
    const beneficInfluence = this.checkBeneficInfluence(d60Data);
    
    return Math.min(10, (lordStrength + beneficInfluence) / 2);
  }

  /**
   * Calculate planetary harmony in D60
   */
  private calculatePlanetaryHarmony(d60Data: D60ChartData): number {
    let harmony = 0;
    let count = 0;
    
    for (const strength of Object.values(d60Data.planetaryStrengths)) {
      harmony += strength.strength;
      count++;
    }
    
    return count > 0 ? harmony / count : 5;
  }

  /**
   * Find strongest planet in D60
   */
  private findStrongestPlanet(
    strengths: Record<string, D60Strength>
  ): { planet: string; strength: number } {
    let strongest = { planet: '', strength: 0 };
    
    for (const [planet, data] of Object.entries(strengths)) {
      if (data.strength > strongest.strength) {
        strongest = { planet, strength: data.strength };
      }
    }
    
    return strongest;
  }

  /**
   * Get lagna lord for a sign
   */
  private getLagnaLord(sign: string): string {
    const signLords: Record<string, string> = {
      'Aries': 'Mars', 'Taurus': 'Venus', 'Gemini': 'Mercury', 'Cancer': 'Moon',
      'Leo': 'Sun', 'Virgo': 'Mercury', 'Libra': 'Venus', 'Scorpio': 'Mars',
      'Sagittarius': 'Jupiter', 'Capricorn': 'Saturn', 'Aquarius': 'Saturn', 'Pisces': 'Jupiter'
    };
    return signLords[sign] || 'Unknown';
  }

  /**
   * Check benefic influence on lagna
   */
  private checkBeneficInfluence(d60Data: D60ChartData): number {
    const benefics = ['Jupiter', 'Venus', 'Mercury', 'Moon'];
    let influence = 0;
    
    for (const benefic of benefics) {
      const strength = d60Data.planetaryStrengths[benefic]?.strength;
      if (strength && strength >= 7) {
        influence += 2;
      }
    }
    
    return Math.min(10, influence);
  }

  /**
   * Generate D60-based recommendations
   */
  private generateD60Recommendations(
    d60Data: D60ChartData,
    confirmsAI: boolean
  ): string[] {
    const recommendations: string[] = [];
    
    if (confirmsAI) {
      recommendations.push(`D60 Lagna in ${d60Data.lagna} confirms AI analysis`);
      recommendations.push(`Deity ${d60Data.deity} indicates karmic alignment`);
    } else {
      recommendations.push(`D60 shows variance from AI prediction - review needed`);
    }
    
    // Add strength-based recommendations
    const strongPlanets = Object.entries(d60Data.planetaryStrengths)
      .filter(([, s]) => s.strength >= 8)
      .map(([p]) => p);
    
    if (strongPlanets.length > 0) {
      recommendations.push(`Strong planets in D60: ${strongPlanets.join(', ')}`);
    }
    
    return recommendations;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MEMORY MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════════

  private async checkMemoryPressure(): Promise<void> {
    const memUsage = process.memoryUsage();
    const heapGB = memUsage.heapUsed / 1024 / 1024 / 1024;
    
    if (heapGB > this.config.memoryThresholdGB) {
      logger.warn(`🔱 PIPELINE: Memory pressure (${heapGB.toFixed(2)}GB), pausing...`);
      
      // Force garbage collection if available
      if ((global as any).gc) {
        (global as any).gc();
      }
      
      // Wait for memory to drop
      await this.waitForMemory(this.config.memoryThresholdGB - 2);
    }
  }

  private async waitForMemory(targetGB: number): Promise<void> {
    let attempts = 0;
    const maxAttempts = 30;
    
    while (attempts < maxAttempts) {
      const memUsage = process.memoryUsage();
      const heapGB = memUsage.heapUsed / 1024 / 1024 / 1024;
      
      if (heapGB < targetGB) {
        logger.info(`🔱 PIPELINE: Memory recovered to ${heapGB.toFixed(2)}GB`);
        return;
      }
      
      // Trigger GC
      if ((global as any).gc) {
        (global as any).gc();
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      attempts++;
    }
    
    logger.warn(`🔱 PIPELINE: Memory did not recover after ${maxAttempts} attempts`);
  }

  private async cleanupBatch(batchId: number): Promise<void> {
    const batch = this.batches.get(batchId);
    if (!batch) return;
    
    // Clear candidate data to free memory
    batch.candidates = [];
    
    // Force GC
    if ((global as any).gc) {
      (global as any).gc();
    }
    
    logger.info(`🔱 PIPELINE: Cleaned up batch ${batchId}`);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PUBLIC UTILITIES
  // ═══════════════════════════════════════════════════════════════════════════

  getPipelineStats(): {
    totalBatches: number;
    processedBatches: number;
    totalCandidates: number;
    batchesInMemory: number;
  } {
    return {
      totalBatches: this.totalBatches,
      processedBatches: this.processedBatches,
      totalCandidates: this.totalCandidates,
      batchesInMemory: this.batches.size,
    };
  }

  async forceCleanup(): Promise<void> {
    this.batches.clear();
    this.aiResults.clear();
    
    if ((global as any).gc) {
      (global as any).gc();
    }
    
    logger.info('🔱 PIPELINE: Force cleanup complete');
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═════════════════════════════════════════════════════════════════════════════

export {
  PipelineConfig,
  CandidateTime,
  SwissEphBatch,
  CandidateWithFullData,
  AIAnalysisResult,
  CandidateAIResult,
  D60Position,
  D60Strength,
  D60ChartData,
  D60AnalysisResult,
  EventImportance,
  EVENT_WEIGHTS,
  EVENT_CATEGORY_IMPORTANCE,
  calculateBatchSize,
  calculateTotalBatches,
  getBatchConfig,
  getRecommendedCandidateCount,
  getAIAttentionScore,
  calculateOptimalInterval,
  getEventWeight,
  calculateWeightedEventScore,
  sortEventsByWeight,
};

export default PipelineBTRProcessor;