/**
 * BTR PRECISION INTEGRATOR
 * =======================
 * 
 * Bridges the existing BTR system with new precision components:
 * - KP Sub-Lord calculations
 * - Multi-method Consensus Validation
 * - Enhanced validation pipeline
 * 
 * This module integrates seamlessly with the existing seconds-precision-btr.ts
 * without breaking backward compatibility.
 */

import { calculateKPSubLords, calculateKPCuspalSubLords } from './kp-sublords.js';
import { calculateConsensus, ConsensusResult, ValidationInput } from './consensus-engine.js';
import { logger } from './logger.js';
import type { PrecisionEnhancement, CandidateWithPrecisionData } from '@ai-pandit/shared';

// Re-export types for backwards compatibility
export type { PrecisionEnhancement, CandidateWithPrecisionData };

// ═══════════════════════════════════════════════════════════════════════════════
// ENHANCEMENT FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Enhance a candidate with precision KP and Consensus data.
 * This is the main integration point for existing BTR pipeline.
 */
export function enhanceCandidateWithPrecisionData(
  candidate: CandidateWithPrecisionData,
  events: ValidationInput['events'],
  forensicProfile: ValidationInput['forensicProfile'],
  tentativeTime: string
): CandidateWithPrecisionData {
  const startTime = Date.now();

  try {
    // Step 1: Calculate KP Sub-Lords for all planets
    const kpSubLords = calculateKPSubLordsForCandidate(candidate);

    // Step 2: Calculate KP Cuspal Sub-Lords for houses
    const cuspalSubLords = calculateCuspalSubLordsForCandidate(candidate);

    // Step 3: Prepare validation input
    const validationInput: ValidationInput = {
      candidate: {
        time: candidate.time,
        ephemeris: candidate.ephemeris,
        dasha: candidate.dasha,
        vargas: candidate.vargas,
        kpData: {
          planetSubLords: kpSubLords,
          cuspalSubLords
        }
      },
      events,
      forensicProfile,
      tentativeTime
    };

    // Step 4: Calculate multi-method consensus
    const consensus = calculateConsensus(validationInput);

    // Step 5: Determine precision status
    const isPrecisionStandard = consensus.confidenceLevel === 'STANDARD_PRECISION' ||
      consensus.confidenceLevel === 'VERY_HIGH';

    // Step 6: Determine recommended precision
    const recommendedPrecision = determineRecommendedPrecision(consensus);

    const duration = Date.now() - startTime;
    logger.debug(`Precision enhancement completed for ${candidate.time} in ${duration}ms`, {
      consensus: consensus.overallConsensus,
      level: consensus.confidenceLevel
    });

    return {
      ...candidate,
      kpData: {
        planetSubLords: kpSubLords,
        cuspalSubLords
      },
      precision: {
        kpSubLords,
        cuspalSubLords,
        consensus,
        isPrecisionStandard,
        recommendedPrecision
      }
    };
  } catch (error) {
    logger.error(`Precision enhancement failed for ${candidate.time}`, error);
    // Return original candidate with error flag
    return {
      ...candidate,
      precision: {
        kpSubLords: {},
        cuspalSubLords: {},
        consensus: createErrorConsensus(),
        isPrecisionStandard: false,
        recommendedPrecision: 'minutes'
      }
    };
  }
}

/**
 * Batch enhance multiple candidates with precision data.
 * Optimized for performance with parallel processing.
 */
export function enhanceCandidatesBatch(
  candidates: CandidateWithPrecisionData[],
  events: ValidationInput['events'],
  forensicProfile: ValidationInput['forensicProfile'],
  tentativeTime: string,
  options: { parallel?: boolean; maxConcurrency?: number } = {}
): CandidateWithPrecisionData[] {
  const { parallel = true, maxConcurrency = 5 } = options;

  if (!parallel) {
    // Sequential processing
    return candidates.map(c =>
      enhanceCandidateWithPrecisionData(c, events, forensicProfile, tentativeTime)
    );
  }

  // For true parallel, use Promise.all with chunks
  const chunks = chunkArray(candidates, maxConcurrency);
  const results: CandidateWithPrecisionData[] = [];

  for (const chunk of chunks) {
    const chunkResults = chunk.map(c =>
      enhanceCandidateWithPrecisionData(c, events, forensicProfile, tentativeTime)
    );
    results.push(...chunkResults);
  }

  return results;
}

/**
 * Rank candidates using precision consensus scores.
 * Returns candidates sorted by consensus score (highest first).
 */
export function rankCandidatesByPrecisionConsensus(
  candidates: CandidateWithPrecisionData[]
): CandidateWithPrecisionData[] {
  return [...candidates].sort((a, b) => {
    const scoreA = a.precision?.consensus.overallConsensus || 0;
    const scoreB = b.precision?.consensus.overallConsensus || 0;
    return scoreB - scoreA;
  });
}

/**
 * Filter candidates by minimum consensus threshold.
 * Removes candidates that don't meet the quality bar.
 */
export function filterByConsensusThreshold(
  candidates: CandidateWithPrecisionData[],
  minConsensus: number = 70
): CandidateWithPrecisionData[] {
  return candidates.filter(c =>
    (c.precision?.consensus.overallConsensus || 0) >= minConsensus
  );
}

/**
 * Get the best candidate based on precision analysis.
 */
export function selectBestCandidate(
  candidates: CandidateWithPrecisionData[]
): CandidateWithPrecisionData | null {
  if (candidates.length === 0) return null;

  const ranked = rankCandidatesByPrecisionConsensus(candidates);
  return ranked[0];
}

/**
 * Generate precision validation report for a candidate.
 */
export function generatePrecisionReport(
  candidate: CandidateWithPrecisionData
): {
  summary: string;
  methodScores: Record<string, number>;
  redFlags: string[];
  recommendations: string[];
  confidenceLevel: string;
  marginOfError: string;
} {
  const consensus = candidate.precision?.consensus;

  if (!consensus) {
    return {
      summary: 'Precision analysis not available',
      methodScores: {},
      redFlags: ['Analysis incomplete'],
      recommendations: ['Re-run analysis'],
      confidenceLevel: 'UNKNOWN',
      marginOfError: 'N/A'
    };
  }

  const redFlagsList = Object.entries(consensus.redFlags)
    .filter(([, value]) => value)
    .map(([key]) => key);

  return {
    summary: `Overall Consensus: ${consensus.overallConsensus.toFixed(1)}% - ${consensus.confidenceLevel}`,
    methodScores: {
      'Vimshottari Dasha': consensus.scores.vimshottari,
      'KP Sub-Lords': consensus.scores.kp,
      'Divisional Charts': consensus.scores.varga,
      'Transit Analysis': consensus.scores.transit,
      'Forensic Match': consensus.scores.forensic,
      'AI Reasoning': consensus.scores.ai
    },
    redFlags: redFlagsList,
    recommendations: consensus.recommendations,
    confidenceLevel: consensus.confidenceLevel,
    marginOfError: `±${consensus.marginOfError} seconds`
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

function calculateKPSubLordsForCandidate(
  candidate: CandidateWithPrecisionData
): Record<string, { starLord: string; subLord: string; subSubLord: string; subSubSubLord: string }> {
  const planets = candidate.ephemeris?.planets || {};
  const result: Record<string, { starLord: string; subLord: string; subSubLord: string; subSubSubLord: string }> = {};

  for (const [name, data] of Object.entries(planets)) {
    const longitude =
      typeof data === 'object' && data !== null && 'longitude' in data &&
      typeof (data as { longitude?: unknown }).longitude === 'number'
        ? (data as { longitude: number }).longitude
        : undefined;
    if (longitude !== undefined) {
      const kp = calculateKPSubLords(longitude);
      result[name] = {
        starLord: kp.starLord,
        subLord: kp.subLord,
        subSubLord: kp.subSubLord,
        subSubSubLord: kp.subSubSubLord
      };
    }
  }

  return result;
}

function calculateCuspalSubLordsForCandidate(
  candidate: CandidateWithPrecisionData
): Record<number, { house: number; cusp: number; sign: string; starLord: string; subLord: string; subSubLord: string }> {
  const cuspLongitudes = Array.isArray(candidate.ephemeris?.kpCusps) && candidate.ephemeris.kpCusps.length >= 12
    ? candidate.ephemeris.kpCusps.slice(0, 12)
    : (candidate.ephemeris?.houses || []).map((h: unknown) => {
      if (typeof h === 'object' && h !== null && 'cusp' in h && typeof (h as { cusp?: unknown }).cusp === 'number') {
        return (h as { cusp: number }).cusp;
      }
      return 0;
    });

  const cuspalData = calculateKPCuspalSubLords(cuspLongitudes);

  return Object.fromEntries(
    cuspalData.map(c => [c.house, c])
  );
}

function determineRecommendedPrecision(consensus: ConsensusResult): 'seconds' | 'sub-seconds' | 'minutes' {
  if (consensus.marginOfError <= 5) return 'sub-seconds';
  if (consensus.marginOfError <= 60) return 'seconds';
  return 'minutes';
}

function createErrorConsensus(): ConsensusResult {
  return {
    scores: {
      vimshottari: 0, yogini: 0, chara: 0, kalachakra: 0, kp: 0,
      ashtakavarga: 0, varga: 0, transit: 0, forensic: 0, ai: 0
    },
    overallConsensus: 0,
    confidenceLevel: 'LOW',
    marginOfError: 3600,
    validationDetails: [],
    redFlags: {
      sandhiBirth: false, gandanta: false, dashaSandhi: false,
      conflictingMethods: false, weakSignificators: false,
      d60Instability: false, forensicMismatch: false
    },
    keyEvidence: [],
    recommendations: ['Error in precision analysis'],
    validatedAt: new Date()
  };
}

function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

// ═══════════════════════════════════════════════════════════════════════════════
// AI PROMPT ENHANCEMENT
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Generate enhanced AI prompt with precision KP and Consensus data.
 */
export function generatePrecisionAIPrompt(
  candidate: CandidateWithPrecisionData,
  basePrompt: string
): string {
  const precision = candidate.precision;

  if (!precision) {
    return basePrompt;
  }

  const kpSection = `
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ PRECISION KP SUB-LORD DATA                                   ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

PLANETARY SUB-LORDS (4-Level Hierarchy):
${Object.entries(precision.kpSubLords).map(([planet, kp]) => {
    const k = kp as { starLord: string; subLord: string; subSubLord: string; subSubSubLord: string };
    return `  ${planet.toUpperCase().padEnd(7)}: Star=${k.starLord.padEnd(8)} | Sub=${k.subLord.padEnd(8)} | Sub-Sub=${k.subSubLord.padEnd(8)} | Sub-Sub-Sub=${k.subSubSubLord}`;
  }).join('\n')}

CUSPAL SUB-LORDS (House Cusp Precision):
${Object.entries(precision.cuspalSubLords).map(([house, cusp]) => {
    const c = cusp as { sign: string; starLord: string; subLord: string; subSubLord: string };
    return `  House ${String(house).padStart(2)}: ${c.sign.padEnd(10)} | Star=${c.starLord.padEnd(8)} | Sub=${c.subLord.padEnd(8)} | Sub-Sub=${c.subSubLord}`;
  }).join('\n')}
`;

  const consensusSection = `
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ MULTI-METHOD CONSENSUS SCORES                                 ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

OVERALL CONSENSUS: ${precision.consensus.overallConsensus.toFixed(1)}%
CONFIDENCE LEVEL: ${precision.consensus.confidenceLevel}
MARGIN OF ERROR: ±${precision.consensus.marginOfError} seconds

METHOD SCORES:
  Vimshottari Dasha: ${String(precision.consensus.scores.vimshottari).padStart(3)}% ${getScoreBar(precision.consensus.scores.vimshottari)}
  KP Sub-Lords:      ${String(precision.consensus.scores.kp).padStart(3)}% ${getScoreBar(precision.consensus.scores.kp)}
  Divisional Charts: ${String(precision.consensus.scores.varga).padStart(3)}% ${getScoreBar(precision.consensus.scores.varga)}
  Transit Analysis:  ${String(precision.consensus.scores.transit).padStart(3)}% ${getScoreBar(precision.consensus.scores.transit)}
  Forensic Match:    ${String(precision.consensus.scores.forensic).padStart(3)}% ${getScoreBar(precision.consensus.scores.forensic)}
  AI Reasoning:      ${String(precision.consensus.scores.ai).padStart(3)}% ${getScoreBar(precision.consensus.scores.ai)}

${precision.consensus.redFlags.conflictingMethods ? '⚠️ WARNING: Methods show significant disagreement' : '✅ All methods in agreement'}
`;

  return `${basePrompt}\n\n${kpSection}\n${consensusSection}`;
}

function getScoreBar(score: number): string {
  const filled = Math.round(score / 10);
  const empty = 10 - filled;
  return '█'.repeat(filled) + '░'.repeat(empty);
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORT
// ═══════════════════════════════════════════════════════════════════════════════

export const PrecisionIntegrator = {
  enhanceCandidate: enhanceCandidateWithPrecisionData,
  enhanceBatch: enhanceCandidatesBatch,
  rankByConsensus: rankCandidatesByPrecisionConsensus,
  filterByThreshold: filterByConsensusThreshold,
  selectBest: selectBestCandidate,
  generateReport: generatePrecisionReport,
  generateAIPrompt: generatePrecisionAIPrompt
};

// Legacy exports for backward compatibility
export { enhanceCandidateWithPrecisionData as _enhanceCandidateWithPrecisionData };
export { generatePrecisionAIPrompt as _generatePrecisionAIPrompt };
export type { CandidateWithPrecisionData as _CandidateWithPrecisionData };
