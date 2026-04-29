/**
 * 🔱 AI-Pandit Centralized Type Definitions
 * ==========================================
 * Single source of truth for all types used across the backend.
 * Organized by domain for maintainability.
 */

// ═════════════════════════════════════════════════════════════════════════════
// CORE / BASE TYPES
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Gender type for birth data
 */
export type Gender = 'male' | 'female' | 'other';

/**
 * Event categories for life events
 */
export type EventCategory =
  | 'education'
  | 'career'
  | 'marriage'
  | 'children'
  | 'family'
  | 'health'
  | 'financial'
  | 'finance'
  | 'travel'
  | 'spiritual'
  | 'legal'
  | 'public_life'
  | 'karmic_events'
  | 'identity_shifts'
  | 'promotion'
  | 'business'
  | 'property'
  | 'relocation'
  | 'accident'
  | 'death_relative'
  | 'divorce'
  | 'surgery'
  | 'inheritance'
  | 'awards'
  | 'other';

/**
 * Date precision levels for flexible event dating
 */
export type DatePrecision =
  | 'exact_date_time'
  | 'exact_date'
  | 'date_range'
  | 'month_year'
  | 'month_range'
  | 'year_range';

/**
 * Importance level for life events
 */
export type EventImportance = 'low' | 'medium' | 'high' | 'critical';

/**
 * Session status for queue processing
 */
export type SessionStatus =
  | 'pending'
  | 'queued'
  | 'processing'
  | 'complete'
  | 'failed';

// ═════════════════════════════════════════════════════════════════════════════
// BIRTH DATA TYPES
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Core birth data for rectification
 */
export interface BirthData {
  fullName: string;
  dateOfBirth: string;
  tentativeTime: string;
  birthPlace: string;
  latitude: number;
  longitude: number;
  timezone: number;
  gender: Gender;
}

/**
 * Physical traits for forensic matching
 */
export interface PhysicalTraits {
  height?: {
    cm: number;
    feet: number;
    inches: number;
  };
  build: 'slim' | 'medium' | 'athletic' | 'heavy' | 'very_heavy';
  complexion: 'very_fair' | 'fair' | 'medium' | 'dark' | 'very_dark';
  faceShape: 'round' | 'oval' | 'square' | 'long' | 'heart' | 'pear';
  eyeColor: string;
  hairColor: string;
  hairType?: 'straight' | 'curly' | 'wavy' | 'thin' | 'thick';
  prakriti?: 'vata' | 'pitta' | 'kapha' | 'vata-pitta' | 'pitta-kapha' | 'vata-kapha';
  noseType?: 'sharp' | 'blunt' | 'aquiline' | 'long' | 'small';
  specialFeatures?: string;
  overallDescription?: string;
}

// ═════════════════════════════════════════════════════════════════════════════
// FORENSIC TRAITS TYPES
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Facial structure characteristics
 */
export interface FacialStructure {
  forehead: string | 'broad' | 'narrow' | 'average' | 'sloping';
  eyeShape: string | 'deep_set' | 'prominent' | 'almond' | 'round' | 'small';
  noseType: string | 'sharp' | 'blunt' | 'aquiline' | 'long' | 'small';
  noseShape?: string;
  jawLine?: string;
  teethAlignment: string | 'perfect' | 'crooked' | 'gap' | 'large' | 'small';
  voicePitch: string | 'deep' | 'high' | 'medium' | 'soft' | 'raspy';
}

/**
 * Skin and hair characteristics
 */
export interface SkinHair {
  texture: 'dry' | 'oily' | 'combination' | 'sensitive';
  hairType: 'straight' | 'curly' | 'wavy' | 'thin' | 'thick' | 'bald';
  complexion: 'very_fair' | 'fair' | 'medium' | 'dark' | 'very_dark';
  marks: string[];
}

/**
 * Psychographic/DNA characteristics
 */
export interface PsychographicDNA {
  speechStyle: 'fast_loud' | 'measured_soft' | 'argumentative' | 'concise' | 'talkative';
  decisionMaking: 'impulsive' | 'deliberate' | 'indecisive' | 'intuitive';
  stressResponse: 'aggressive' | 'withdrawn' | 'anxious' | 'calm';
  sleepCycle: 'night_owl' | 'early_bird' | 'irregular' | 'deep_sleeper';
  temperament: 'short_tempered' | 'patient' | 'jovial' | 'melancholic' | 'optimistic';
}

/**
 * Biological markers (Ayurvedic)
 */
export interface BiologicalMarkers {
  prakriti: 'vata' | 'pitta' | 'kapha' | 'vata-pitta' | 'pitta-kapha' | 'vata-kapha';
  sensitivity: {
    heat: 'high' | 'medium' | 'low';
    cold: 'high' | 'medium' | 'low';
  };
  recurringHealthIssues: string[];
}

/**
 * Family narrative matrix
 */
export interface FamilyNarrativeMatrix {
  siblingPosition: 'eldest' | 'middle' | 'youngest' | 'only_child';
  brotherCount: number;
  sisterCount: number;
  fatherStatusAtBirth: 'struggling' | 'stable' | 'prosperous' | 'highly_distinguished';
  motherHealthAtBirth: 'excellent' | 'normal' | 'weak' | 'complicated';
  firstChildInfo?: {
    gender: 'male' | 'female';
    yearOfBirth: number;
  };
}

/**
 * Complete forensic traits structure
 */
export interface ForensicTraits {
  physical: {
    facialStructure: FacialStructure;
    skinHair: SkinHair;
    build: 'slim' | 'medium' | 'athletic' | 'heavy' | 'very_heavy';
    height: { cm: number; feet: number; inches: number };
  };
  psychographic: PsychographicDNA;
  biological: BiologicalMarkers;
  family: FamilyNarrativeMatrix;
}

// ═════════════════════════════════════════════════════════════════════════════
// LIFE EVENT TYPES
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Life event for rectification
 */
export interface LifeEvent {
  id: string;
  category: EventCategory;
  eventType: string;
  datePrecision: DatePrecision;
  eventDate: string;
  endDate?: string;
  eventTime?: string;
  description: string;
  importance: EventImportance;
  icon?: string;
  color?: string;
  ageAtEvent?: number;
}

// ═════════════════════════════════════════════════════════════════════════════
// TIME OFFSET TYPES
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Offset preset options
 */
export type OffsetPreset =
  | '30min'
  | '1hour'
  | '2hours'
  | '4hours'
  | '6hours'
  | '12hours'
  | 'seconds-30'
  | 'seconds-6';

/**
 * Time offset configuration
 */
export interface TimeOffsetConfig {
  preset?: OffsetPreset;
  customMinutes?: number;
  description: string;
}

/**
 * Candidate time for analysis
 */
export interface CandidateTime {
  time: string;
  offsetMinutes: number;
  offsetDescription: string;
  candidateDate?: string;
  dayOffset?: number;
  candidateKey?: string;
  rank?: number;
  batchIndex?: number;
  priority?: number;
}

// ═════════════════════════════════════════════════════════════════════════════
// QUEUE TYPES
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Queue status values
 */
export type QueueStatus = 'queued' | 'processing' | 'complete' | 'failed';

/**
 * Queue position information
 */
export interface QueuePosition {
  sessionId: string;
  status: QueueStatus;
  position: number;
  estimatedWaitSeconds: number;
  totalInQueue: number;
  createdAt: string;
  session?: Record<string, unknown>;
}

/**
 * Queue submission result
 */
export interface QueueSubmitResult {
  success: boolean;
  sessionId?: string;
  position?: number;
  estimatedWaitSeconds?: number;
  error?: string;
  errorCode?: 'QUEUE_FULL' | 'RATE_LIMIT_EXCEEDED';
  retryAfterSeconds?: number;
}

export type JobStatus =
  | 'queued'
  | 'running'
  | 'retrying'
  | 'failed'
  | 'completed'
  | 'cancelled';

export type JobKind = 'btr_rectification';

export interface JobSummary {
  id: string;
  sessionId: string;
  userId: string;
  kind: JobKind;
  status: JobStatus;
  currentStage?: string | null;
  progressPercent: number;
  attempt: number;
  maxAttempts: number;
  retryCount: number;
  retryReasonCode?: string | null;
  nextRetryAt?: string | null;
  queuedAt: string;
  startedAt?: string | null;
  heartbeatAt?: string | null;
  finishedAt?: string | null;
  cancelRequestedAt?: string | null;
  errorCode?: string | null;
  errorMessage?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface JobDetail extends JobSummary {
  version: number;
  result?: Record<string, unknown> | null;
  checkpoint?: Record<string, unknown> | null;
  cursor?: Record<string, unknown> | null;
  sessionStatus?: string | null;
}

export interface JobEventRecord {
  id: string;
  jobId: string;
  sessionId: string;
  sequenceNo: number;
  eventType: string;
  stage?: string | null;
  payload: Record<string, unknown>;
  createdAt: string;
}

export interface JobEventsResponse {
  jobId: string;
  sessionId: string;
  since: number;
  events: JobEventRecord[];
}

export interface JobSyncResponse {
  job: JobDetail;
  since: number;
  latestSequenceNo: number;
  events: JobEventRecord[];
  recommendedPollIntervalMs: number;
  replayMode: 'incremental' | 'snapshot';
}

export interface DeadLetterArtifactSummary {
  id: string;
  jobId: string;
  sessionId?: string | null;
  uri: string;
  createdAt: string;
  metadata: Record<string, unknown> | null;
}

export interface CreateJobResponse {
  job: JobDetail;
  idempotentReplay: boolean;
}

export interface CancelJobResponse {
  job: JobDetail;
  cancelled: boolean;
}

// ═════════════════════════════════════════════════════════════════════════════
// PROGRESS TRACKING TYPES
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Individual step in analysis progress
 */
export interface ProgressStep {
  id: string;
  name: string;
  icon: string;
  status: 'pending' | 'running' | 'complete' | 'error';
  message?: string;
  details?: string[];
  startedAt?: string;
  completedAt?: string;
}

/**
 * AI thinking data for streaming
 */
export interface AIThinkingData {
  stage: number;
  candidateTime?: string;
  chunks: string[];
  fullText: string;
}

/**
 * AI context data
 */
export interface AIContextData {
  stage: number;
  candidateTime: string;
  planetaryInfo: {
    ascendant: string;
    sun: string;
    moon: string;
  };
  dasha: string;
  divCharts?: string;
  groundTruth?: any;
}

/**
 * Candidate score for ranking
 */
export interface CandidateScore {
  time: string | Date;
  score?: number;
  stage?: number;
  rank?: number;
  batch?: number;
  minifiedEph?: { sun: string; moon: string; ascendant: string };
  fullEph?: Record<string, string>; // 🔱 NEW: High-precision ephemeris payload

  // Advanced God-Tier Properties
  timeString?: string;
  overallScore?: number;
  confidenceLevel?: 'STANDARD_PRECISION' | 'VERY_HIGH' | 'HIGH' | 'MEDIUM' | 'LOW' | string;
  marginOfErrorSeconds?: number;
  methodScores?: any;
  eventMatches?: any[];
  transitMatches?: any[];
  redFlags?: string[];
  keyEvidence?: string[];
}

/**
 * Complete progress data structure
 */
export interface ProgressData {
  currentStep: number;
  totalSteps: number;
  percentage: number;
  steps: ProgressStep[];
  lastUpdate: string;
  liveMessage?: string;
  startedAt?: string;
  candidateScores: CandidateScore[];
  lastAIThinking?: AIThinkingData;
  aiContext?: AIContextData;
  stageHistory?: Record<number, string>;
  calculationLogs?: Array<{ candidateTime: string; log: string }>;
  estimatedTimeRemaining?: number;
}

// ═════════════════════════════════════════════════════════════════════════════
// SESSION EVENT TYPES
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Progress event for SSE
 */
export interface ProgressEvent {
  type: 'progress';
  step: string;
  stepIndex: number;
  totalSteps: number;
  percentage: number;
  message: string;
  details?: string[];
  startedAt?: string;
}

/**
 * AI thinking event for SSE
 */
export interface AIThinkingEvent {
  type: 'ai_thinking';
  chunk: string;
  stage: number;
  candidateTime?: string;
}

/**
 * Ephemeris event for SSE
 */
export interface EphemerisEvent {
  type: 'ephemeris';
  candidateTime: string;
  ascendant: { sign: string; degree: number };
  moonSign: string;
  moonNakshatra: string;
}

/**
 * Candidate score event for SSE
 */
export interface CandidateScoreEvent {
  type: 'candidate_score' | 'candidate_score_v2';
  time: string;
  score: number;
  stage: number;
  batch?: number;
  rank?: number;
  minifiedEph?: { sun: string; moon: string; ascendant: string };
  fullEph?: Record<string, string>; // 🔱 NEW: High-precision ephemeris payload
}

/**
 * Batched candidate scores event for SSE
 */
export interface CandidateScoresEvent {
  type: 'candidate_scores';
  data: CandidateScoreEvent[];
}

/**
 * Complete event for SSE
 */
export interface CompleteEvent {
  type: 'complete';
  rectifiedTime: string;
  accuracy: number;
  confidence: string;
}

/**
 * AI context event for SSE
 */
export interface AIContextEvent {
  type: 'ai_context';
  stage: number;
  candidateTime: string;
  planetaryInfo?: {
    sun: string;
    moon: string;
    ascendant: string;
  };
  dasha?: string;
  divCharts?: string;
  contextHits?: string[];
  round?: number;
  batch?: number;
  totalBatches?: number;
  candidatesInBatch?: number | Array<{
    time: string;
    ascendant?: string;
    moon?: string;
  }>;
  lifeEventsCount?: number;
  hasForensicTraits?: boolean;
}

export interface DecisionEvent {
  type: 'decision';
  stage: number;
  time: string;
  verdict: 'promoted' | 'rejected';
  score: number;
  reason: string;
  batch?: number;
}

/**
 * Calculation log event for SSE
 */
export interface CalculationLogEvent {
  type: 'calculation_log';
  logId: string;
  candidateTime: string;
  sunPos: string;
  moonPos: string;
  ascendant: string;
  dashaObj?: string;
}

/**
 * Error event for SSE
 */
export interface ErrorEvent {
  type: 'error';
  message: string;
  stage?: string;
}

/**
 * Stage stats event for SSE
 */
export interface StageStatsEvent {
  type: 'stage_stats';
  stage: number;
  candidateCount: number;
  description: string;
}

/**
 * Estimated time event for SSE
 */
export interface EstimatedTimeEvent {
  type: 'estimated_time';
  seconds: number;
}

/**
 * Union type of all session events
 */
export type SessionEvent =
  | ProgressEvent
  | AIThinkingEvent
  | EphemerisEvent
  | CandidateScoreEvent
  | CandidateScoresEvent
  | CompleteEvent
  | ErrorEvent
  | AIContextEvent
  | CalculationLogEvent
  | StageStatsEvent
  | EstimatedTimeEvent
  | DecisionEvent;

// ═════════════════════════════════════════════════════════════════════════════
// AI CLIENT TYPES
// ═════════════════════════════════════════════════════════════════════════════

/**
 * AI message structure
 */
export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * AI response structure
 */
export interface AIResponse {
  success: boolean;
  thinking?: string;
  content: string;
  tokensUsed?: number;
  error?: string;
}

// ═════════════════════════════════════════════════════════════════════════════
// EPHEMERIS / ASTROLOGY TYPES
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Shadbala breakdown
 */
export interface ShadbalaBreakdown {
  sthana: number;
  dig: number;
  kaala: number;
  cheshta: number;
  naisargika: number;
  total: number;
}

/**
 * Planet position
 */
export interface PlanetPosition {
  sign: string;
  degree: number;
  longitude: number;
  latitude: number;
  nakshatra: string;
  nakshatraPada?: number;
  lord: string;
  retro: boolean;
  speed: number;
  longitudeSpeed?: number;
  distance: number;
  isCombust: boolean;
  dignity: string;
  house: number;
}

/**
 * House position
 */
export interface HousePosition {
  houseNumber: number;
  sign: string;
  degree: number;
  cusp: number;
  lord: string;
  subLord?: string;
}

/**
 * Divisional chart
 */
export interface DivisionalChart {
  id: string;
  planets: Record<string, PlanetPosition>;
  ascendant: {
    sign: string;
    degree: number;
    longitude: number;
  };
}

/**
 * Complete ephemeris data
 */
export interface EphemerisData {
  planets: {
    sun: PlanetPosition;
    moon: PlanetPosition;
    mercury: PlanetPosition;
    venus: PlanetPosition;
    mars: PlanetPosition;
    jupiter: PlanetPosition;
    saturn: PlanetPosition;
    rahu: PlanetPosition;
    ketu: PlanetPosition;
  };
  ascendant: {
    sign: string;
    degree: number;
    nakshatra: string;
    longitude: number;
    subLord?: string;
  };
  houses: HousePosition[];
  divisionalCharts?: Record<string, DivisionalChart>;
  ashtakavarga?: any;
  shadbala?: Record<string, ShadbalaBreakdown>;
  kpCusps?: number[];
}

/**
 * Minified ephemeris for display
 */
export interface MinifiedEphemeris {
  sun: string;
  moon: string;
  ascendant: string;
}

export type EphemerisAyanamsaMode = 'lahiri';

export type EphemerisHouseSystem = 'whole_sign' | 'equal' | 'placidus';

export type EphemerisNodeMode = 'true' | 'mean';

export type EphemerisServiceBodyName =
  | 'sun'
  | 'moon'
  | 'mercury'
  | 'venus'
  | 'mars'
  | 'jupiter'
  | 'saturn'
  | 'rahu'
  | 'ketu';

export interface EphemerisServiceLocation {
  latitude: number;
  longitude: number;
  altitudeMeters?: number;
}

export interface EphemerisServiceBaseRequest {
  location: EphemerisServiceLocation;
  ayanamshaMode?: EphemerisAyanamsaMode;
  houseSystem?: EphemerisHouseSystem;
  nodeMode?: EphemerisNodeMode;
}

export interface EphemerisServiceSingleRequest extends EphemerisServiceBaseRequest {
  timestampUtc: string;
}

export interface EphemerisServiceBatchRequest extends EphemerisServiceBaseRequest {
  timestampsUtc: string[];
}

export interface EphemerisServiceSunriseRequest {
  startTimestampUtc: string;
  endTimestampUtc: string;
  location: EphemerisServiceLocation;
}

export interface EphemerisServicePlanetPosition {
  body: EphemerisServiceBodyName;
  tropicalLongitude: number;
  tropicalLatitude: number;
  siderealLongitude?: number;
  distanceAu: number;
  longitudeSpeed: number;
  latitudeSpeed?: number;
  retrograde: boolean;
}

export interface EphemerisServiceHouses {
  ascendantTropical: number;
  mcTropical: number;
  houseCuspsTropical: number[];
  ascendantSidereal?: number;
  houseCuspsSidereal?: number[];
}

export interface EphemerisServiceChartResponse {
  timestampUtc: string;
  julianDayUt: number;
  julianDayTt: number;
  ayanamsha: number;
  planets: EphemerisServicePlanetPosition[];
  houses: EphemerisServiceHouses;
}

export interface EphemerisServiceBatchResponse {
  charts: EphemerisServiceChartResponse[];
}

export interface EphemerisServiceSunriseResponse {
  sunriseTimestampUtc: string | null;
}

export interface EphemerisServiceHealthResponse {
  service: 'ephemeris';
  status: 'healthy' | 'degraded' | 'unhealthy';
  ready: boolean;
  kernelLoaded: boolean;
  kernelFile: string;
  timestamp: string;
  version: string;
  error?: string | null;
}

// ═════════════════════════════════════════════════════════════════════════════
// KP (KRISHNAMURTI PADDHATI) TYPES
// ═════════════════════════════════════════════════════════════════════════════

/**
 * KP Sub-lord data
 */
export interface KPSubLordData {
  readonly starLord: string;
  readonly subLord: string;
  readonly subSubLord: string;
  readonly subSubSubLord: string;
  readonly subSpan: number;
  readonly positionInSub: number;
}

/**
 * KP Cuspal data
 */
export interface KPCuspalData {
  readonly house: number;
  readonly cusp: number;
  readonly sign: string;
  readonly starLord: string;
  readonly subLord: string;
  readonly subSubLord: string;
}

/**
 * KP Event correlation
 */
export interface KPEventCorrelation {
  readonly eventId: string;
  readonly eventDate: Date;
  readonly dashaLord: string;
  readonly dashaLordAsCuspalSubLord: boolean;
  readonly dashaLordAsStarLord: boolean;
  readonly correlationScore: number;
  readonly timingPrecision: 'exact' | 'close' | 'approximate';
}

// ═════════════════════════════════════════════════════════════════════════════
// CONSENSUS ENGINE TYPES
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Consensus scores from all validation methods
 */
export interface ConsensusScores {
  vimshottari: number;
  yogini: number;
  chara: number;
  kalachakra: number;
  kp: number;
  ashtakavarga: number;
  varga: number;
  transit: number;
  forensic: number;
  ai: number;
  nadi?: number;
  prana?: number;
}

/**
 * Validation detail for a single method
 */
export interface ValidationDetail {
  method: string;
  score: number;
  maxScore: number;
  status: 'pass' | 'warning' | 'fail';
  details: string;
  criticalFindings: string[];
}

/**
 * Red flags for warning conditions
 */
export interface RedFlags {
  sandhiBirth: boolean;
  gandanta: boolean;
  dashaSandhi: boolean;
  conflictingMethods: boolean;
  weakSignificators: boolean;
  d60Instability: boolean;
  forensicMismatch: boolean;
}

/**
 * Complete consensus result
 */
export interface ConsensusResult {
  scores: ConsensusScores;
  overallConsensus: number;
  confidenceLevel: 'STANDARD_PRECISION' | 'VERY_HIGH' | 'HIGH' | 'MEDIUM' | 'LOW';
  marginOfError: number;
  validationDetails: ValidationDetail[];
  redFlags: RedFlags;
  keyEvidence: string[];
  recommendations: string[];
  validatedAt: Date;
}

/**
 * Input for validation
 */
export interface ValidationInput {
  candidate: {
    time: string;
    ephemeris: any;
    dasha: any;
    vargas: any;
    kpData: any;
    aiScore?: number;
    birthDate?: string;
  };
  events: any[];
  forensicProfile: any;
  tentativeTime: string;
}

// ═════════════════════════════════════════════════════════════════════════════
// PRECISION BTR TYPES
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Precision enhancement data
 */
export interface PrecisionEnhancement {
  kpSubLords: Record<string, {
    starLord: string;
    subLord: string;
    subSubLord: string;
    subSubSubLord: string;
  }>;
  cuspalSubLords: Record<number, {
    house: number;
    cusp: number;
    sign: string;
    starLord: string;
    subLord: string;
    subSubLord: string;
  }>;
  consensus: ConsensusResult;
  isPrecisionStandard: boolean;
  recommendedPrecision: 'seconds' | 'sub-seconds' | 'minutes';
}

/**
 * Candidate with Precision data
 */
export interface CandidateWithPrecisionData {
  time: string;
  offsetMinutes: number;
  ephemeris: any;
  dasha: any;
  vargas: any;
  kpData: any;
  precision?: PrecisionEnhancement;
}

// ═════════════════════════════════════════════════════════════════════════════
// BTR INPUT/OUTPUT TYPES
// ═════════════════════════════════════════════════════════════════════════════

/**
 * BTR Input
 */
export interface BTRInput {
  birthDate: string;
  timeEstimate: string;
  offsetConfig: TimeOffsetConfig;
  lifeEvents: LifeEvent[];
  latitude: number;
  longitude: number;
  timezone: number;
  physicalTraits?: PhysicalTraits;
}

/**
 * Candidate analysis result
 */
export interface CandidateAnalysis {
  time: string;
  offsetMinutes: number;
  offsetDescription: string;
  ephemerisData: EphemerisData;
  quickScore: number;
  eventMatches: number;
  shouldAnalyzeWithAI: boolean;
  reason: string;
  metadata?: {
    isTentativeOrNeighbor?: boolean;
    d60Stability?: any;
    protected?: boolean;
    [key: string]: any;
  };
}

/**
 * Ranked candidates
 */
export interface RankedCandidates {
  topCandidates: CandidateAnalysis[];
  allCandidates: CandidateAnalysis[];
  totalAnalyzed: number;
}

/**
 * AI analysis result
 */
export interface AIAnalysisResult {
  time: string;
  offsetMinutes: number;
  offsetDescription: string;
  score: number;
  confidence: 'High' | 'Medium' | 'Low';
  analysis: string;
  thinking: string;
  eventMatches: {
    eventType: string;
    matches: boolean;
    reason: string;
  }[];
  recommendation: string;
  dashaAnalysis: string;
  transitAnalysis: string;
}

/**
 * Top candidates analysis
 */
export interface TopCandidatesAnalysis {
  candidates: AIAnalysisResult[];
  topRecommendation: AIAnalysisResult;
  alternativeOptions: AIAnalysisResult[];
  processingTime: number;
}

/**
 * BTR Output
 */
export interface BTROutput {
  rectifiedTime: string;
  accuracy: number;
  confidence: 'High' | 'Medium' | 'Low';
  processingTime: number;
  analysis: {
    eventAnalysis: Array<{
      eventDate: string;
      expectedPlanets: string[];
      actualPlanets: string[];
      matchScore: number;
    }>;
    alternativeTimes: Array<{ time: string; score: number }>;
    weakPoints: string[];
    recommendations: string[];
  };
  thinking?: string;
  ephemeris?: EphemerisData;
}

// ═════════════════════════════════════════════════════════════════════════════
// SECONDS PRECISION BTR TYPES
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Input for seconds-precision BTR
 */
export interface SecondsPrecisionInput {
  sessionId: string;
  dateOfBirth: string;
  tentativeTime: string;
  latitude: number;
  longitude: number;
  timezone: string | number;
  lifeEvents: LifeEvent[];
  offsetConfig: TimeOffsetConfig;
  physicalTraits?: PhysicalTraits;
  forensicTraits: ForensicTraits;
  spouseData?: {
    dateOfBirth: string;
    birthTime: string;
    latitude: number;
    longitude: number;
    timezone: string | number;
  };
  abortSignal?: AbortSignal;
}

/**
 * Result from seconds-precision BTR
 */
export interface SecondsPrecisionResult {
  rectifiedTime: string;
  accuracy: number;
  confidence: string;
  precisionLevel: 'seconds';
  marginOfError: number;
  stagesCompleted: number;
  boundaryWarnings: string[];
  methodsUsed: string[];
  processingTimeMs: number;
  analysisResult: {
    summary: string;
    finalCandidate: {
      time: string;
      score: number;
      thinking: string;
    };
    alternatives: Array<{ time: string; score: number }>;
    stageHistory: Record<number, { candidatesIn: number; candidatesOut: number }>;
  };
  narrativeManifest?: {
    birthContext: string;
    technicalHighlight: string;
    spiritualSummary: string;
  };
}

/**
 * Boundary safety result
 */
export interface BoundarySafetyResult {
  isSafe: boolean;
  warnings: BoundaryWarning[];
  nakshatraDistance: number;
  lagnaDistance: number;
  houseDistance: number;
  overallRisk: 'low' | 'medium' | 'high';
  recommendations: string[];
}

/**
 * Boundary warning
 */
export interface BoundaryWarning {
  type: 'nakshatra' | 'lagna' | 'house' | 'dasha';
  message: string;
  distanceSeconds: number;
  severity: 'low' | 'medium' | 'high';
}

// ═════════════════════════════════════════════════════════════════════════════
// SESSION / DATABASE TYPES
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Rectification session
 */
export interface RectificationSession {
  id: string;
  userId: string;
  clerkId: string;
  fullName: string;
  dateOfBirth: string;
  tentativeTime: string;
  birthPlace: string;
  latitude: number;
  longitude: number;
  timezone: string | number;
  gender?: string;
  physicalTraits?: PhysicalTraits;
  lifeEvents: LifeEvent[];
  offsetConfig?: TimeOffsetConfig;
  rectifiedTime?: string;
  accuracy?: number;
  confidence?: string;
  analysisResult?: unknown;
  progressData?: string;
  status: SessionStatus;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

/**
 * Master analysis archive
 */
export interface MasterAnalysisArchive {
  version: string;
  sessionId: string;
  generatedAt: string;
  birthContext: {
    name: string;
    originalTime: string;
    location: string;
    offsetScan: string;
  };
  finalResult: {
    time: string;
    accuracy: number;
    confidence: string;
    marginOfError: number;
    methodsUsed: string[];
  };
  reasoning: {
    discovery: string;
    refinement: string;
    precision: string;
    summary: string;
  };
  technicalProof: {
    ephemeris: EphemerisData;
    boundarySafety: {
      nakshatra: { distance: number; warning?: string };
      lagna: { distance: number; warning?: string };
      dasha: { distance: number; warning?: string };
    };
    methodologyBreakdown: {
      [key: string]: { score: number; verdict: string; details?: string };
    };
    contextualCorrelation?: number;
  };
  alternatives: Array<{
    time: string;
    score: number;
    reason: string;
  }>;
}

// ═════════════════════════════════════════════════════════════════════════════
// API / REQUEST TYPES
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Calculate request
 */
export interface CalculateRequest {
  birthData: BirthData;
  lifeEvents: LifeEvent[];
  physicalTraits?: any;
  forensicTraits?: any;
  offsetConfig: TimeOffsetConfig;
}

/**
 * Calculate response
 */
export interface CalculateResponse {
  success: boolean;
  data?: {
    sessionId: string;
    position: number;
    estimatedWaitSeconds: number;
    status: string;
  };
  error?: string;
}

// ═════════════════════════════════════════════════════════════════════════════
// EVENT CONSTANTS
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Event types by category
 */
export const EVENT_TYPES: Record<EventCategory, string[]> = {
  education: ['School admission', 'College admission', 'Graduation', 'Higher studies'],
  career: ['Job start', 'Job change', 'Promotion', 'Business start'],
  marriage: ['Engagement', 'Wedding', 'Divorce'],
  children: ['Pregnancy', 'Birth', 'Adoption'],
  family: ['Parent death', 'Sibling birth', 'Family event'],
  health: ['Major illness', 'Surgery', 'Recovery', 'Accident'],
  financial: ['Money gain', 'Property purchase', 'Business deal'],
  finance: ['Money gain', 'Property purchase', 'Business deal'],
  travel: ['Long journey', 'Relocation', 'International travel'],
  spiritual: ['Spiritual awakening', 'Meditation retreat', 'Religious event'],
  legal: ['Court case started', 'Legal win', 'Court verdict'],
  public_life: ['Award', 'Fame spike', 'Public recognition'],
  karmic_events: ['Sudden windfall', 'Natural disaster', 'Pet loss'],
  identity_shifts: ['Weight transform', 'Nickname change', 'Appearance shift'],
  promotion: ['Promotion', 'Role expansion', 'Recognition'],
  business: ['Business launch', 'Partnership', 'Major deal'],
  property: ['Property purchase', 'House move', 'Land acquisition'],
  relocation: ['City move', 'Country move', 'Permanent relocation'],
  accident: ['Accident', 'Emergency injury', 'Near-miss'],
  death_relative: ['Parent death', 'Relative death', 'Family bereavement'],
  divorce: ['Separation', 'Divorce filing', 'Divorce finalization'],
  surgery: ['Surgery', 'Procedure', 'Hospital admission'],
  inheritance: ['Inheritance received', 'Estate settlement', 'Will dispute'],
  awards: ['Award', 'Prize', 'Public recognition'],
  other: ['Custom event'],
};

// ═════════════════════════════════════════════════════════════════════════════
// LEGACY EXPORTS (for backward compatibility during refactoring)
// ═════════════════════════════════════════════════════════════════════════════

/** @deprecated Use PlanetPosition directly */
export type _PlanetPosition = PlanetPosition;

/** @deprecated Use LifeEvent directly */
export type _LifeEvent = LifeEvent;
