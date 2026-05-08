/**
 * 🔱 AI-Pandit Validation / Consensus Types
 * ==========================================
 * Consensus engine scores, validation details, red flags,
 * precision enhancement, boundary safety checks.
 */

import { LifeEvent } from './core.js';
import { EphemerisData } from './ephemeris.js';

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
  ai: number;
  nadi?: number;
  prana?: number;
}

export interface ValidationDetail {
  method: string;
  score: number;
  maxScore: number;
  status: 'pass' | 'warning' | 'fail';
  details: string;
  criticalFindings: string[];
}

export interface RedFlags {
  sandhiBirth: boolean;
  gandanta: boolean;
  dashaSandhi: boolean;
  conflictingMethods: boolean;
  weakSignificators: boolean;
  d60Instability: boolean;
}

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

export interface ValidationInput {
  candidate: {
    time: string;
    ephemeris: EphemerisData;
    dasha: Record<string, unknown> | unknown[];
    vargas: Record<string, unknown>;
    kpData: Record<string, unknown>;
    aiScore?: number;
    birthDate?: string;
    candidateDate?: string;
  };
  events: LifeEvent[];
  tentativeTime: string;
}

// ═════════════════════════════════════════════════════════════════════════════
// PRECISION BTR TYPES
// ═════════════════════════════════════════════════════════════════════════════

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

export interface CandidateWithPrecisionData {
  time: string;
  offsetMinutes: number;
  ephemeris: EphemerisData;
  dasha: Record<string, unknown> | unknown[];
  vargas: Record<string, unknown>;
  kpData: Record<string, unknown>;
  precision?: PrecisionEnhancement;
}

// ═════════════════════════════════════════════════════════════════════════════
// BOUNDARY SAFETY TYPES
// ═════════════════════════════════════════════════════════════════════════════

export interface BoundarySafetyResult {
  isSafe: boolean;
  warnings: BoundaryWarning[];
  nakshatraDistance: number;
  lagnaDistance: number;
  houseDistance: number;
  overallRisk: 'low' | 'medium' | 'high';
  recommendations: string[];
}

export interface BoundaryWarning {
  type: 'nakshatra' | 'lagna' | 'house' | 'dasha';
  message: string;
  distanceSeconds: number;
  severity: 'low' | 'medium' | 'high';
}
