/**
 * BTR (Birth Time Rectification) Type Definitions
 *
 * Centralized types for the seconds-precision BTR system.
 * These types were extracted from seconds-precision-btr.ts for better modularity.
 */

import { LifeEvent, ForensicTraits } from '../../types/index.js';
import { CandidateTime } from '../time-offset-manager.js';

/** Zodiac signs in order */
export const ZODIAC_SIGNS: readonly string[] = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
];

/** Represents a planet's position and attributes */
export interface PlanetData {
  sign: string;
  degree: string;
  nakshatra: string;
  house: number;
  dignity: string;
  isRetro: boolean;
  speed: number;
  isCombust: boolean;
  shadbala?: number;
  bav?: number;
  functionalNature?: { role: string; reason: string };
  aspects?: unknown[];
  avastha?: string;
  d60Deity?: string;
  compoundDignity?: string;
  shadbalaBreakdown?: {
    total: number;
    sthana: number;
    dig: number;
    kaala: number;
    cheshta?: number;
  };
  ishtaKashtaPhala?: { ishta: number; kashta: number };
}

/** Special astrological points (AL, UL, BB) */
export interface SpecialPoint {
  sign: string;
  degree: string;
  house: number;
}

/** Vimshottari Dasha entry */
export interface VimshottariDashaEntry {
  maha: string;
  antar: string;
  pratyantar: string;
  sukshma: string;
  prana: string;
  startEnd: string;
}

/** Divisional chart data */
export interface DivisionalChartData {
  ascendant: string;
  planets: Record<string, string>;
}

/** Panchanga (5 limbs of time) data */
export interface PanchangaData {
  tithi: string;
  vara: string;
  nakshatra: string;
  yoga: string;
  karana: string;
}

/** Spouse synastry match result */
export interface SpouseMatch {
  lagnaMatch: boolean;
  moonMatch: boolean;
  score: number;
  reason: string;
}

/** D60 planetary position with deity */
export interface D60PlanetData {
  sign: string;
  degree: string;
  deity: string;
}

/** Vedic signals (vargottama, parivartana, etc.) */
export interface VedicSignals {
  vargottama?: string[];
  parivartana?: Array<{ houses: number[] }>;
  pushkar?: string[];
  charaKarakas?: unknown[];
}

/** Complete candidate data package for AI analysis */
export interface CandidateDataPackage {
  time: string;
  offsetMinutes: number;
  planets: Record<string, PlanetData>;
  specialPoints?: Record<string, SpecialPoint>;
  ascendant: { sign: string; degree: string; nakshatra: string };
  houseLords: Record<number, string>;
  moonNakshatra: string;
  vimshottariDasha: VimshottariDashaEntry[];
  yoginiDasha?: Array<{ lord: string; startEnd: string }>;
  charaDasha?: Array<{ sign: string; startEnd: string }>;
  d9Lagna?: string;
  d10Lagna?: string;
  d60Sign?: string;
  d9Chart?: DivisionalChartData;
  d10Chart?: DivisionalChartData;
  ashtakavarga?: Record<string, number[]>;
  panchanga?: PanchangaData;
  yogas?: unknown[];
  doubleTransitAnalysis?: Record<string, unknown>;
  lifecycleShifts?: Array<{ date: string; event: string; dasha: string }>;
  transitData?: Record<string, unknown>;
  aiScore?: number;
  aiVerdict?: string;
  rawVimshottari?: unknown[];
  vedicSignals?: VedicSignals;
  charaKarakas?: unknown[];
  vimsopakaBala?: Record<string, number>;
  chalitDiscrepancies?: unknown[];
  ishtaKashtaPhala?: Record<string, { ishta: number; kashta: number }>;
  vargaDegrees?: Record<string, Record<string, string>>;
  d60Planets?: Record<string, D60PlanetData>;
  sandhiZones?: string[];
  spouseMatch?: SpouseMatch;
}

/** Result of a single stage in the BTR process */
export interface StageResult {
  stageNumber: number;
  stageName: string;
  candidatesIn: number;
  candidatesOut: number;
  batchCount?: number;
  aiReasoning?: string;
}

/** Information about a tournament round */
export interface TournamentRound {
  roundNumber: number;
  batchesProcessed: number;
  candidatesIn: number;
  candidatesOut: number;
}

/** Anonymized candidate for blind evaluation */
export interface AnonymizedCandidate {
  id: string;
  time: string;
  originalOffsetDescription: string;
  data: CandidateDataPackage;
}

/** AI prompt context for batch evaluation */
export interface BatchPromptContext {
  candidates: CandidateDataPackage[];
  events: LifeEvent[];
  forensicTraits: ForensicTraits;
  batchNumber: number;
  totalBatches: number;
  survivorsNeeded: number;
  tentativeTime?: string;
}

/** AI prompt context for deep analysis */
export interface DeepAnalysisContext {
  candidates: CandidateDataPackage[];
  events: LifeEvent[];
  forensicTraits: ForensicTraits;
  spouseData: unknown;
}

/** AI prompt context for final precision */
export interface FinalPrecisionContext {
  candidates: CandidateDataPackage[];
  events: LifeEvent[];
  forensicTraits: ForensicTraits;
  spouseData: unknown;
  currentTransits?: unknown;
}

/** Extracted final verdict from AI response */
export interface FinalVerdict {
  time: string;
  accuracy: number;
  confidence: string;
  margin: number;
}
