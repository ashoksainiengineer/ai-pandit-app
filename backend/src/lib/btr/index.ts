/**
 * BTR Module Exports
 *
 * Public API for Birth Time Rectification system.
 * Import from this module for external usage.
 */

// Core Orchestrator
export { GodTierBTR } from './orchestrator.js';
export type { 
  RectificationInput, 
  DetailedResult 
} from './orchestrator.js';

// Window Scanner
export { WindowScanner } from './window-scanner.js';
export type { 
  ScannerInput, 
  ScannerContext,
  CandidateAnalysis 
} from './window-scanner.js';

// Tatwa Shuddhi
export { TatwaShuddhi } from './tatwa-shuddhi.js';
export type { 
  TatwaCalculationOptions,
  TatwaCorrectionResult 
} from './tatwa-shuddhi.js';

// Transit Analyzer
export { TransitAnalyzer } from './transit-analyzer.js';
export type { 
  TransitAnalysisOptions,
  ComprehensiveTransitResult,
  DoubleTransitResult,
  TransitPosition 
} from './transit-analyzer.js';

// Event Scorer
export { EventScorer } from './event-scorer.js';
export type { 
  EventScoringOptions,
  ScoredEvent,
  EventScoreSummary 
} from './event-scorer.js';

// Types
export {
  ZODIAC_SIGNS,
  DEFAULT_SCAN_CONFIG,
  EVENT_WEIGHTS,
  DATE_PRECISION_MULTIPLIERS,
  SOURCE_MULTIPLIERS,
  TATWA_ELEMENTS,
  TATWA_DOSHA_MAP,
  EVENT_HOUSE_MAP,
  EVENT_SIGNIFICATORS,
  PARASHARI_ASPECTS
} from './types.js';

export type {
  TimeWindow,
  ScanConfiguration,
  EventConfidence,
  BtrEvent,
  CandidateScore,
  MethodScores,
  EventMatchResult,
  TransitMatchResult,
  TatwaResult,
  TatwaWindow,
  BoundaryAnalysis,
  ScanResult,
  ForensicProfile,
  RectificationResult,
  ConfidenceLevel,
  EventSource,
  DatePrecision,
  TatwaType,
  DoshaType
} from './types.js';

// Re-export existing BTR components
export { buildCandidateDataPackage } from './data-package-builder.js';
export type { PackageBuildOptions } from './data-package-builder.js';

export { buildVimshottariDasha, buildYoginiDasha, buildCharaDasha } from './dasha-builder.js';

export { buildTransitData } from './transit-builder.js';
export type { TransitDataEntry, TransitBuildOptions } from './transit-builder.js';

// New God-Tier modules
export { Kalachakra } from '../kalachakra-dasha.js';
export type { 
  KalachakraPeriod, 
  KalachakraSequence,
  KalachakraType,
  KalachakraEventMatch 
} from '../kalachakra-dasha.js';

export { Shadbala } from '../shadbala.js';
export type { 
  ShadbalaResult, 
  ShadbalaSummary 
} from '../shadbala.js';

export { NadiAmsha } from '../nadi-amsha.js';
export type { 
  NadiAmshaData, 
  NadiMatchResult,
  D150EventAnalysis 
} from '../nadi-amsha.js';

export { SpouseD9Verification } from '../spouse-d9-verification.js';
export type { 
  SpouseData, 
  SpouseChartPositions,
  D9VerificationResult,
  D9Match,
  D9Mismatch 
} from '../spouse-d9-verification.js';
