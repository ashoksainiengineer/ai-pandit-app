/**
 * 🔱 BIRTH TIME RECTIFICATION - LORD VISHNU ARCHITECTURE
 * ======================================================
 * 
 * "Yada yada hi dharmasya glanir bhavati bharata
 *  Abhyuthanam adharmasya tadatmanam srjamyaham"
 * 
 * Whenever there is confusion about birth time, I manifest this system
 * to restore cosmic order and reveal the true moment of incarnation.
 * 
 * ARCHITECTURAL PRINCIPLES (Sanatan Dharma of Code):
 * ---------------------------------------------------
 * 1. Dharma (Duty)       : Every module has a single, sacred purpose
 * 2. Artha (Wealth)      : Optimal resource utilization
 * 3. Kama (Desire)       : Satisfy the user's quest for truth
 * 4. Moksha (Liberation) : Free the soul from birth time uncertainty
 * 
 * COSMIC STRUCTURE:
 * -----------------
 * - Brahma (Creator)    : CandidateGenerationService
 * - Vishnu (Preserver)  : ValidationConsensusEngine  
 * - Shiva (Destroyer)   : CandidateEliminationService
 * - Shakti (Power)      : AIReasoningEngine
 * - Ganesha (Wisdom)    : EdgeCaseHandler
 * 
 * THE FOUR YUGAS OF ANALYSIS:
 * ---------------------------
 * 1. Satya Yuga (Coarse)    : Wide sweep, many candidates
 * 2. Treta Yuga (Refined)   : Medium grid, reduced set
 * 3. Dvapara Yuga (Fine)    : Small grid, precise analysis
 * 4. Kali Yuga (Precise)    : Micro grid, seconds precision
 */

import { EventEmitter } from 'events';
import { logger } from '../../lib/logger.js';

// ═══════════════════════════════════════════════════════════════════════════════
// DOMAIN INTERFACES (The Eternal Truths)
// ═══════════════════════════════════════════════════════════════════════════════

export interface BirthData {
  readonly dateOfBirth: string;        // YYYY-MM-DD
  readonly tentativeTime: string;      // HH:MM:SS
  readonly latitude: number;           // -90 to 90
  readonly longitude: number;          // -180 to 180
  readonly timezone: number | string;  // Offset or IANA
  readonly location: string;           // Human-readable
}

export interface LifeEvent {
  readonly id: string;
  readonly category: EventCategory;
  readonly type: string;
  readonly date: string;               // YYYY-MM-DD
  readonly time?: string;              // HH:MM (optional)
  readonly precision: DatePrecision;
  readonly description: string;
  readonly impact: EventImpact;
}

export type EventCategory = 
  | 'education' | 'career' | 'marriage' | 'children' 
  | 'health' | 'finance' | 'travel' | 'spiritual' 
  | 'legal' | 'property' | 'family' | 'other';

export type DatePrecision = 
  | 'exact_datetime' | 'exact_date' | 'date_range' 
  | 'month_year' | 'year';

export type EventImpact = 'critical' | 'major' | 'moderate' | 'minor';

export interface ForensicProfile {
  physical: PhysicalTraits;
  psychological: PsychologicalTraits;
  biological: BiologicalTraits;
  familial: FamilialTraits;
}

export interface PhysicalTraits {
  height: { cm: number; feet: number; inches: number };
  build: 'slim' | 'medium' | 'athletic' | 'heavy';
  complexion: 'fair' | 'medium' | 'dark';
  facialFeatures: {
    forehead: 'broad' | 'narrow' | 'average';
    eyes: 'large' | 'medium' | 'small' | 'deep_set';
    nose: 'straight' | 'aquiline' | 'flat';
  };
  specialMarks: string[];
}

export interface PsychologicalTraits {
  temperament: 'choleric' | 'sanguine' | 'phlegmatic' | 'melancholic';
  speechPattern: 'fast' | 'measured' | 'slow';
  decisionStyle: 'impulsive' | 'deliberate' | 'analytical';
  stressResponse: 'aggressive' | 'withdrawn' | 'adaptive';
}

export interface BiologicalTraits {
  prakriti: 'vata' | 'pitta' | 'kapha' | 'vata_pitta' | 'pitta_kapha' | 'vata_kapha';
  sleepPattern: 'early_bird' | 'night_owl' | 'irregular';
  digestion: 'strong' | 'moderate' | 'weak';
  chronicConditions: string[];
}

export interface FamilialTraits {
  birthOrder: 'first' | 'middle' | 'last' | 'only';
  siblings: { brothers: number; sisters: number };
  parents: {
    fatherStatus: 'prosperous' | 'stable' | 'struggling';
    motherHealth: 'excellent' | 'good' | 'complicated';
  };
}

export interface BTRInput {
  readonly sessionId: string;
  readonly birthData: BirthData;
  readonly lifeEvents: LifeEvent[];
  readonly forensicProfile: ForensicProfile;
  readonly offsetConfig: OffsetConfig;
  readonly spouseData?: SpouseData;
  readonly options?: BTROptions;
}

export interface OffsetConfig {
  mode: 'auto' | 'manual';
  preset?: OffsetPreset;
  customMinutes?: number;
  customSeconds?: number;
}

export type OffsetPreset = 
  | 'micro_30sec' | 'small_5min' | 'medium_30min' 
  | 'large_2hr' | 'xlarge_6hr' | 'massive_24hr';

export interface SpouseData {
  dateOfBirth: string;
  birthTime?: string;
  latitude?: number;
  longitude?: number;
}

export interface BTROptions {
  targetAccuracy: 'standard' | 'high' | 'god_tier';
  maxProcessingTimeMs: number;
  enableAIReasoning: boolean;
  enableDeepValidation: boolean;
  confidenceThreshold: number;
}

export interface BTRResult {
  readonly rectifiedTime: string;           // HH:MM:SS
  readonly confidence: number;              // 0-100
  readonly accuracy: 'seconds' | 'minutes' | 'degrees';
  readonly marginOfError: string;           // ±X seconds
  readonly validationScore: number;         // 0-100
  readonly methodConsensus: MethodConsensus;
  readonly cosmicSignature: CosmicSignature;
  readonly analysisReport: AnalysisReport;
  readonly processingMetadata: ProcessingMetadata;
}

export interface MethodConsensus {
  vimshottari: number;      // 0-100
  yogini: number;
  chara: number;
  kalachakra: number;
  ashtakavarga: number;
  varga: number;
  transit: number;
  forensic: number;
  ai: number;
  overall: number;
}

export interface CosmicSignature {
  lagna: string;
  moonSign: string;
  moonNakshatra: string;
  sunSign: string;
  dominantElement: 'fire' | 'earth' | 'air' | 'water';
  dominantGuna: 'sattva' | 'rajas' | 'tamas';
  keyYogas: string[];
  d60Deity: string;
}

export interface AnalysisReport {
  stages: StageReport[];
  eliminatedCandidates: number;
  finalCandidates: number;
  keyFindings: string[];
  warnings: string[];
  aiReasoning: string;
}

export interface StageReport {
  stage: number;
  name: string;
  candidatesIn: number;
  candidatesOut: number;
  processingTimeMs: number;
  keyMetrics: Record<string, number>;
}

export interface ProcessingMetadata {
  startTime: Date;
  endTime: Date;
  totalDurationMs: number;
  ephemerisCalls: number;
  aiCalls: number;
  memoryPeakMB: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// ABSTRACT BASE CLASSES (The Divine Blueprints)
// ═══════════════════════════════════════════════════════════════════════════════

export abstract class BTRSubsystem extends EventEmitter {
  protected readonly name: string;
  protected isInitialized = false;

  constructor(name: string) {
    super();
    this.name = name;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    logger.info(`🔱 Initializing ${this.name}`);
    await this.onInitialize();
    this.isInitialized = true;
    this.emit('initialized');
  }

  async shutdown(): Promise<void> {
    if (!this.isInitialized) return;
    logger.info(`🔱 Shutting down ${this.name}`);
    await this.onShutdown();
    this.isInitialized = false;
    this.emit('shutdown');
  }

  protected abstract onInitialize(): Promise<void>;
  protected abstract onShutdown(): Promise<void>;
}

export abstract class CalculationService extends BTRSubsystem {
  abstract calculate(input: unknown): Promise<unknown>;
  
  protected validateInput<T>(input: unknown, validator: (data: unknown) => data is T): T {
    if (!validator(input)) {
      throw new BTRValidationError(`Invalid input for ${this.name}`);
    }
    return input;
  }
}

export abstract class ValidationService extends BTRSubsystem {
  abstract validate(candidate: CandidateTime): Promise<ValidationResult>;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CORE DOMAIN OBJECTS
// ═══════════════════════════════════════════════════════════════════════════════

export class CandidateTime {
  constructor(
    public readonly time: string,              // HH:MM:SS
    public readonly offsetSeconds: number,     // From tentative time
    public readonly priority: number,          // Analysis priority (higher = analyze first)
    public metadata: CandidateMetadata = {}
  ) {}

  get isHighPriority(): boolean {
    return this.priority >= 80;
  }

  get timeValue(): number {
    const [h, m, s] = this.time.split(':').map(Number);
    return h * 3600 + m * 60 + s;
  }
}

export interface CandidateMetadata {
  ephemeris?: EphemerisSnapshot;
  dasha?: DashaSnapshot;
  vargas?: VargaSnapshot;
  scores?: Partial<MethodConsensus>;
  forensicMatch?: number;
  transitCorrelation?: number;
}

export interface EphemerisSnapshot {
  planets: Record<string, PlanetPosition>;
  ascendant: AscendantPosition;
  houses: HousePosition[];
  ayanamsa: number;
  julianDay: number;
}

export interface PlanetPosition {
  name: string;
  longitude: number;
  latitude: number;
  distance: number;
  sign: string;
  degree: number;
  nakshatra: string;
  pada: number;
  isRetrograde: boolean;
  speed: number;
  dignity: Dignity;
  house: number;
}

export type Dignity = 'exalted' | 'moolatrikona' | 'own' | 'friendly' | 'neutral' | 'enemy' | 'debilitated';

export interface AscendantPosition {
  sign: string;
  degree: number;
  longitude: number;
  nakshatra: string;
}

export interface HousePosition {
  number: number;
  sign: string;
  cusp: number;
  lord: string;
}

export interface DashaSnapshot {
  vimshottari: VimshottariDasha;
  yogini?: YoginiDasha;
  chara?: CharaDasha;
  pranaLord?: string;
}

export interface VimshottariDasha {
  mahadasha: DashaPeriod;
  antardasha: DashaPeriod;
  pratyantardasha: DashaPeriod;
  sukshmadasha?: DashaPeriod;
  pranadasha?: DashaPeriod;
}

export interface DashaPeriod {
  lord: string;
  startDate: Date;
  endDate: Date;
  durationYears: number;
}

export interface YoginiDasha {
  current: string;
  startDate: Date;
  endDate: Date;
}

export interface CharaDasha {
  currentSign: string;
  years: number;
}

export interface VargaSnapshot {
  d1: VargaChart;
  d9: VargaChart;
  d10: VargaChart;
  d60: VargaChart;
  [key: string]: VargaChart;
}

export interface VargaChart {
  name: string;
  lagna: string;
  planets: Record<string, { sign: string; degree: number }>;
}

export interface ValidationResult {
  isValid: boolean;
  score: number;
  confidence: number;
  details: ValidationDetail[];
  timestamp: Date;
}

export interface ValidationDetail {
  method: string;
  score: number;
  status: 'pass' | 'fail' | 'warning';
  message: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CUSTOM ERRORS (The Obstacles Ganesha Removes)
// ═══════════════════════════════════════════════════════════════════════════════

export class BTRError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = 'BTRError';
  }
}

export class BTRValidationError extends BTRError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR');
    this.name = 'BTRValidationError';
  }
}

export class BTRCalculationError extends BTRError {
  constructor(message: string, public readonly subsystem: string) {
    super(message, 'CALCULATION_ERROR');
    this.name = 'BTRCalculationError';
  }
}

export class BTRAIError extends BTRError {
  constructor(message: string, public readonly model?: string) {
    super(message, 'AI_ERROR');
    this.name = 'BTRAIError';
  }
}

export class BTREphemerisError extends BTRError {
  constructor(message: string) {
    super(message, 'EPHEMERIS_ERROR');
    this.name = 'BTREphemerisError';
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN ORCHESTRATOR (The Vishnu Principle - The Sustainer)
// ═══════════════════════════════════════════════════════════════════════════════

export interface IBTRSystem {
  rectifyBirthTime(input: BTRInput): Promise<BTRResult>;
  validateInput(input: unknown): input is BTRInput;
  getSystemStatus(): SystemStatus;
}

export interface SystemStatus {
  isReady: boolean;
  subsystems: Record<string, boolean>;
  queueDepth: number;
  activeSessions: number;
}

/**
 * The main entry point - Vishnu himself
 * Preserves cosmic order by finding the true birth time
 */
export abstract class AbstractBTRSystem implements IBTRSystem {
  protected subsystems: BTRSubsystem[] = [];
  protected isRunning = false;

  async rectifyBirthTime(input: BTRInput): Promise<BTRResult> {
    if (!this.isRunning) {
      throw new BTRError('System not initialized', 'SYSTEM_NOT_READY');
    }

    logger.info(`🔱 Beginning birth time rectification for session ${input.sessionId}`);
    
    try {
      return await this.executeRectification(input);
    } catch (error) {
      logger.error(`🔱 Rectification failed for ${input.sessionId}`, error);
      throw error;
    }
  }

  abstract validateInput(input: unknown): input is BTRInput;
  abstract getSystemStatus(): SystemStatus;
  protected abstract executeRectification(input: BTRInput): Promise<BTRResult>;

  async initialize(): Promise<void> {
    logger.info('🔱 Initializing BTR System (Lord Vishnu Mode)');
    
    for (const subsystem of this.subsystems) {
      await subsystem.initialize();
    }
    
    this.isRunning = true;
    logger.info('🔱 BTR System ready');
  }

  async shutdown(): Promise<void> {
    logger.info('🔱 Shutting down BTR System');
    
    for (const subsystem of this.subsystems.reverse()) {
      await subsystem.shutdown();
    }
    
    this.isRunning = false;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS (The Tools of the Divine)
// ═══════════════════════════════════════════════════════════════════════════════

export function addSeconds(time: string, seconds: number): string {
  const [h, m, s] = time.split(':').map(Number);
  const totalSeconds = h * 3600 + m * 60 + s + seconds;
  
  const newH = Math.floor(totalSeconds / 3600) % 24;
  const newM = Math.floor((totalSeconds % 3600) / 60);
  const newS = totalSeconds % 60;
  
  return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}:${String(newS).padStart(2, '0')}`;
}

export function calculateTimeDifference(time1: string, time2: string): number {
  const [h1, m1, s1] = time1.split(':').map(Number);
  const [h2, m2, s2] = time2.split(':').map(Number);
  
  const t1 = h1 * 3600 + m1 * 60 + s1;
  const t2 = h2 * 3600 + m2 * 60 + s2;
  
  return Math.abs(t2 - t1);
}

export function determineOffsetPreset(totalSeconds: number): OffsetPreset {
  const minutes = totalSeconds / 60;
  const hours = minutes / 60;
  
  if (minutes <= 0.5) return 'micro_30sec';
  if (minutes <= 5) return 'small_5min';
  if (hours <= 0.5) return 'medium_30min';
  if (hours <= 2) return 'large_2hr';
  if (hours <= 6) return 'xlarge_6hr';
  return 'massive_24hr';
}

export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  if (ms < 3600000) return `${(ms / 60000).toFixed(1)}m`;
  return `${(ms / 3600000).toFixed(1)}h`;
}
