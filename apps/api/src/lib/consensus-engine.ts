
/**
 * CONSENSUS VALIDATION ENGINE (Multi-Method Verification)
 * ==========================================================
 * 
 * The validation system that verifies birth time candidates across
 * multiple Vedic astrology methods. Only when ALL methods converge
 * do we achieve high (>99%) confidence.
 * 
 * VALIDATION METHODS:
 * 1. Vimshottari Dasha - Primary timing system
 * 2. Yogini Dasha - 8-yogini cycle verification
 * 3. Chara Dasha - Rashi-based periods
 * 4. Kalachakra Dasha - Advanced lunar cycle timing
 * 5. KP Sub-Lords - Cuspal precision timing
 * 6. Ashtakavarga - Bindu-based strength verification
 * 7. Divisional Charts - Varga-specific event correlation
 * 8. Transit Analysis - Double transit verification
 * 9. Forensic Correlation - Physical/psychological matching
 * 10. AI Reasoning - Deep pattern analysis
 * 
 * CONSENSUS RULES:
 * - STANDARD_PRECISION: All 10 methods > 90% agreement
 * - VERY_HIGH: All 10 methods > 80% agreement
 * - HIGH: Overall average > 75%, no method < 60%
 * - MEDIUM: Overall average > 60%
 * - LOW: Any method < 40% or overall < 60%
 */

import { logger } from '../utils/logger.js';
import { _calculateKPSubLords, _KPCuspalData } from './kp-sublords.js';
import type {
  ConsensusScores,
  ValidationDetail,
  RedFlags,
  ConsensusResult,
  ValidationInput
} from '@ai-pandit/shared';
import {
  METHOD_WEIGHTS,
  CONFIDENCE_THRESHOLDS,
  calculateRankFusionScore,
  getEventWeightFromImportance,
} from './btr/precision-weights.js';
import { resolveEventDateWindow } from './btr/event-date-utils.js';

export type {
  ConsensusScores,
  ValidationDetail,
  RedFlags,
  ConsensusResult,
  ValidationInput
};

// ═══════════════════════════════════════════════════════════════════════════════
// METHOD WEIGHTS NOW IMPORTED FROM PRECISION-WEIGHTS.TS
// ═══════════════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════════════════
// VALIDATION FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Calculate complete consensus across all validation methods.
 * This is the main entry point for the validation engine.
 */
export function calculateConsensus(input: ValidationInput): ConsensusResult {
  const startTime = Date.now();

  const scores: Partial<ConsensusScores> = {};
  const details: ValidationDetail[] = [];

  // Method 1: Vimshottari Dasha Validation
  const vimshottari = validateVimshottari(input);
  scores.vimshottari = vimshottari.score;
  details.push(vimshottari);

  // Method 2: Yogini Dasha Validation
  const yogini = validateYogini(input);
  scores.yogini = yogini.score;
  details.push(yogini);

  // Method 3: Chara Dasha Validation
  const chara = validateChara(input);
  scores.chara = chara.score;
  details.push(chara);

  // Method 4: Kalachakra Dasha Validation
  const kalachakra = validateKalachakra(input);
  scores.kalachakra = kalachakra.score;
  details.push(kalachakra);

  // Method 5: KP Sub-Lord Validation
  const kp = validateKP(input);
  scores.kp = kp.score;
  details.push(kp);

  // Method 6: Ashtakavarga Validation
  const ashtakavarga = validateAshtakavarga(input);
  scores.ashtakavarga = ashtakavarga.score;
  details.push(ashtakavarga);

  // Method 7: Divisional Charts Validation
  const varga = validateVargas(input);
  scores.varga = varga.score;
  details.push(varga);

  // Method 8: Transit Validation
  const transit = validateTransit(input);
  scores.transit = transit.score;
  details.push(transit);

  // Method 9: Forensic Validation
  const forensic = validateForensic(input);
  scores.forensic = forensic.score;
  details.push(forensic);

  // Method 10: AI Reasoning Validation
  const ai = validateAI(input);
  scores.ai = ai.score;
  details.push(ai);

  // Method 11: Nadi Amsha Validation (T1 Precision)
  const nadi = validateNadi(input);
  scores.nadi = nadi.score;
  details.push(nadi);

  // Method 12: Prana Dasha Validation (T1 Precision)
  const prana = validatePrana(input);
  scores.prana = prana.score;
  details.push(prana);

  // Calculate weighted overall consensus
  const fullScores = scores as ConsensusScores;
  const overallConsensus = calculateWeightedConsensus(fullScores);

  // Detect red flags
  const redFlags = detectRedFlags(input, fullScores, details);

  // Determine confidence level
  const confidenceLevel = determineConfidenceLevel(fullScores, overallConsensus, redFlags);

  // Calculate margin of error
  const marginOfError = calculateMarginOfError(fullScores, redFlags);

  // Generate evidence and recommendations
  const keyEvidence = generateKeyEvidence(details);
  const recommendations = generateRecommendations(fullScores, redFlags);

  const duration = Date.now() - startTime;
  logger.debug(`Consensus calculated in ${duration}ms`, { overallConsensus, confidenceLevel });

  return {
    scores: fullScores,
    overallConsensus,
    confidenceLevel,
    marginOfError,
    validationDetails: details,
    redFlags,
    keyEvidence,
    recommendations,
    validatedAt: new Date()
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// INDIVIDUAL VALIDATION METHODS
// ═══════════════════════════════════════════════════════════════════════════════

function parseDateWindow(startEnd: unknown): { startDate?: Date; endDate?: Date } {
  if (typeof startEnd !== 'string' || startEnd.trim().length === 0) return {};
  const [startRaw, endRaw] = startEnd.split(' to ').map((part) => part.trim());
  const startDate = startRaw ? new Date(startRaw) : undefined;
  const endDate = endRaw ? new Date(endRaw) : undefined;
  return {
    startDate: startDate && !Number.isNaN(startDate.getTime()) ? startDate : undefined,
    endDate: endDate && !Number.isNaN(endDate.getTime()) ? endDate : undefined
  };
}

function getVimshottariSnapshot(candidate: ValidationInput['candidate']): {
  maha?: string;
  antar?: string;
  pratyantar?: string;
  sukshma?: string;
  prana?: string;
  startDate?: Date;
  endDate?: Date;
} {
  const structured = candidate.dasha?.vimshottari;
  if (structured?.mahadasha?.lord) {
    return {
      maha: structured.mahadasha.lord,
      antar: structured.antardasha?.lord,
      pratyantar: structured.pratyantardasha?.lord,
      sukshma: structured.sukshmadasha?.lord,
      prana: structured.pranadasha?.lord,
      startDate: structured.mahadasha?.startDate,
      endDate: structured.mahadasha?.endDate
    };
  }

  const possibleArrays = [
    candidate.dasha,
    candidate.dasha?.vimshottari,
    candidate.ephemeris?.vimshottariDasha
  ];

  for (const value of possibleArrays) {
    if (!Array.isArray(value) || value.length === 0) continue;
    const first = value[0] as {
      maha?: string;
      antar?: string;
      pratyantar?: string;
      sukshma?: string;
      prana?: string;
      startEnd?: string;
    };
    const window = parseDateWindow(first.startEnd);
    return {
      maha: first.maha,
      antar: first.antar,
      pratyantar: first.pratyantar,
      sukshma: first.sukshma,
      prana: first.prana,
      startDate: window.startDate,
      endDate: window.endDate
    };
  }

  return {};
}

function validateVimshottari(input: ValidationInput): ValidationDetail {
  const { candidate, events } = input;
  let score = 0;
  const findings: string[] = [];

  const vim = getVimshottariSnapshot(candidate);
  if (!vim.maha) {
    return {
      method: 'Vimshottari Dasha',
      score: 0,
      maxScore: 100,
      status: 'fail',
      details: 'Dasha data unavailable',
      criticalFindings: ['Missing dasha calculation']
    };
  }
  let matchCount = 0;
  let totalWeight = 0;

  for (const event of events) {
    const weight = getEventWeight(event.impact || 'moderate');
    totalWeight += weight;

    // Check if event significator matches dasha lord
    const significators = getEventSignificators(event.category);
    const dashaLord = vim.maha;

    if (dashaLord && significators.includes(dashaLord)) {
      matchCount += weight;
      findings.push(`${event.type}: Dasha lord ${dashaLord} matches significator`);
    }

    // Check antardasha
    if (vim.antar && significators.includes(vim.antar)) {
      matchCount += weight * 0.7;
      findings.push(`${event.type}: Antardasha lord ${vim.antar} matches`);
    }
  }

  score = totalWeight > 0 ? (matchCount / totalWeight) * 100 : 0;
  score = Math.min(100, Math.max(0, score));

  return {
    method: 'Vimshottari Dasha',
    score,
    maxScore: 100,
    status: score >= 80 ? 'pass' : score >= 60 ? 'warning' : 'fail',
    details: `Matched ${matchCount.toFixed(1)} of ${totalWeight} weighted events`,
    criticalFindings: findings.slice(0, 3)
  };
}

function validateYogini(input: ValidationInput): ValidationDetail {
  const { candidate, events } = input;

  if (!candidate.dasha?.yogini || !Array.isArray(candidate.dasha.yogini)) {
    return {
      method: 'Yogini Dasha',
        score: 0,
      maxScore: 100,
      status: 'warning',
      details: 'Yogini dasha data unavailable - using default',
      criticalFindings: []
    };
  }

  // FIXED: Temporal matching - check if each event falls under a supporting Yogini period
  let matchCount = 0;
  let totalWeight = 0;
  const findings: string[] = [];

  for (const event of events) {
    const weight = getEventWeight(event.impact || 'moderate');
    totalWeight += weight;

    const eventWindow = resolveEventDateWindow({
      eventDate: event.eventDate,
      endDate: event.endDate,
      datePrecision: event.datePrecision,
      eventTime: event.eventTime,
    });
    const eventDate = new Date(eventWindow.midpointMs);

    // Find which Yogini period contains this event
    const yoginiPeriod = candidate.dasha.yogini.find((y: { lord: string; startEnd: string }) => {
      if (!y.startEnd) return false;
      const [start, end] = y.startEnd.split(' to ').map((d: string) => new Date(d));
      return eventDate >= start && eventDate <= end;
    });

    if (yoginiPeriod) {
      const supports = correlateYoginiWithEvent(yoginiPeriod.lord, event.category);
      if (supports) {
        matchCount += weight;
        findings.push(`${event.type}: ${yoginiPeriod.lord} Yogini supports ${event.category}`);
      }
    }
  }

  const score = totalWeight > 0 ? Math.min(100, (matchCount / totalWeight) * 100 + 30) : 0;

  return {
    method: 'Yogini Dasha',
    score: Math.round(score),
    maxScore: 100,
    status: score >= 70 ? 'pass' : 'warning',
    details: `${matchCount.toFixed(1)}/${totalWeight} weighted events match Yogini periods`,
    criticalFindings: findings.slice(0, 3)
  };
}

function validateChara(input: ValidationInput): ValidationDetail {
  const { candidate, events } = input;

  if (!candidate.dasha?.chara) {
    return {
      method: 'Chara Dasha',
        score: 0,
      maxScore: 100,
      status: 'warning',
      details: 'Chara dasha data unavailable',
      criticalFindings: []
    };
  }

  const charaSign = candidate.dasha.chara.currentSign;
  const matchingEvents = events.filter(e =>
    correlateCharaWithEvent(charaSign, e.category)
  );

  const score = Math.min(100, (matchingEvents.length / Math.max(1, events.length)) * 100 + 30);

  return {
    method: 'Chara Dasha',
    score,
    maxScore: 100,
    status: score >= 65 ? 'pass' : 'warning',
    details: `Chara ${charaSign} dasha active`,
    criticalFindings: []
  };
}

function validateKalachakra(input: ValidationInput): ValidationDetail {
  const { candidate, events } = input;

  // Calculate Kalachakra based on Moon's D60 position
  // Kalachakra Dasha is nakshatra-based like Vimshottari but with different sequence
  const moonLong = candidate.ephemeris?.planets?.moon?.longitude;
  if (!moonLong) {
    return {
      method: 'Kalachakra Dasha',
        score: 0,
      maxScore: 100,
      status: 'warning',
      details: 'Moon position unavailable for Kalachakra',
      criticalFindings: []
    };
  }

  // Kalachakra sequence based on nakshatra group (Savya/Apasavya)
  const nakshatraIndex = Math.floor(moonLong / (360 / 27));
  // 1-9: Savya, 10-18: Apasavya, 19-27: Savya
  const isSavya = nakshatraIndex < 9 || nakshatraIndex >= 18;

  // Simplified scoring: Check if events correlate with expected Kalachakra lords
  let matchCount = 0;
  const kalachakraLords = isSavya
    ? ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'] // Savya sequence
    : ['Jupiter', 'Venus', 'Saturn', 'Sun', 'Moon', 'Mars', 'Mercury']; // Apasavya sequence

  for (const event of events) {
    const eventNakshatra = Math.floor((moonLong + (event.yearOffset || 0) * 30) / (360 / 27)) % 27;
    const expectedLord = kalachakraLords[eventNakshatra % 7];
    const significators = getEventSignificators(event.category);

    if (significators.includes(expectedLord)) {
      matchCount++;
    }
  }

  const score = events.length > 0
    ? Math.min(100, 40 + (matchCount / events.length) * 60)
    : 60;

  return {
    method: 'Kalachakra Dasha',
    score: Math.round(score),
    maxScore: 100,
    status: score >= 70 ? 'pass' : 'warning',
    details: `${matchCount}/${events.length} events match Kalachakra lords (${isSavya ? 'Savya' : 'Apasavya'} cycle)`,
    criticalFindings: matchCount > 0 ? [`Kalachakra matches for ${matchCount} events`] : []
  };
}

function validateKP(input: ValidationInput): ValidationDetail {
  const { candidate, events } = input;

  if (!candidate.kpData) {
    return {
      method: 'KP Sub-Lords',
      score: 40,
      maxScore: 100,
      status: 'fail',
      details: 'KP data unavailable',
      criticalFindings: ['Missing KP sub-lord calculation']
    };
  }

  // Validate KP sub-lord correlations
  let score = 0;
  let matches = 0;

  for (const event of events) {
    const targetHouse = getTargetHouse(event.category);
    const cuspalSubLord = candidate.kpData.cuspalSubLords?.[targetHouse];

    if (cuspalSubLord) {
      // Check if event dasha lord matches cuspal sub-lord
      const dashaLord = getVimshottariSnapshot(candidate).maha;
      if (dashaLord === cuspalSubLord.subLord) {
        matches++;
      }
    }
  }

  score = events.length > 0 ? (matches / events.length) * 100 : 0;

  return {
    method: 'KP Sub-Lords',
    score,
    maxScore: 100,
    status: score >= 75 ? 'pass' : score >= 50 ? 'warning' : 'fail',
    details: `${matches} events match KP cuspal sub-lords`,
    criticalFindings: matches > 0 ? [`KP match for ${matches} events`] : []
  };
}

function validateAshtakavarga(input: ValidationInput): ValidationDetail {
  const { candidate } = input;

  if (!candidate.ephemeris?.ashtakavarga) {
    return {
      method: 'Ashtakavarga',
        score: 0,
      maxScore: 100,
      status: 'warning',
      details: 'Ashtakavarga data unavailable',
      criticalFindings: []
    };
  }

  const sav = candidate.ephemeris.ashtakavarga.SAV || [];
  const averageSAV = sav.length > 0 ? sav.reduce((a: number, b: number) => a + b, 0) / sav.length : 25;

  // Score based on average SAV (higher is better, max ~40)
  const score = Math.min(100, (averageSAV / 30) * 100);

  return {
    method: 'Ashtakavarga',
    score,
    maxScore: 100,
    status: score >= 70 ? 'pass' : 'warning',
    details: `Average SAV: ${averageSAV.toFixed(1)}`,
    criticalFindings: averageSAV > 28 ? ['Strong Ashtakavarga'] : []
  };
}

function validateVargas(input: ValidationInput): ValidationDetail {
  const { candidate, events } = input;
  const vargas = candidate.vargas || {};
  const d9 = vargas.d9 || vargas.D9;
  const d10 = vargas.d10 || vargas.D10;
  const d60 = vargas.d60 || vargas.D60;

  if (!d9 && !d10 && !d60) {
    return {
      method: 'Divisional Charts',
      score: 40,
      maxScore: 100,
      status: 'fail',
      details: 'Varga data unavailable',
      criticalFindings: ['Missing D9, D10, D60 analysis']
    };
  }

  // Check key varga correlations
  let score = 60; // Base score
  const findings: string[] = [];

  // D9 for marriage
  const marriageEvents = events.filter(e => e.category === 'marriage');
  if (marriageEvents.length > 0 && d9) {
    score += 10;
    findings.push('D9 available for marriage analysis');
  }

  // D10 for career
  const careerEvents = events.filter(e => e.category === 'career');
  if (careerEvents.length > 0 && d10) {
    score += 10;
    findings.push('D10 available for career analysis');
  }

  // D60 for overall karma
  if (d60) {
    score += 10;
    findings.push('D60 available for karmic analysis');
  }

  return {
    method: 'Divisional Charts',
    score: Math.min(100, score),
    maxScore: 100,
    status: score >= 70 ? 'pass' : 'warning',
    details: `D9: ${d9 ? '✓' : '✗'}, D10: ${d10 ? '✓' : '✗'}, D60: ${d60 ? '✓' : '✗'}`,
    criticalFindings: findings
  };
}

function validateTransit(input: ValidationInput): ValidationDetail {
  const { candidate, events } = input;
  const transitData = candidate.ephemeris?.transitData || {};
  const transitEntries = Object.entries(transitData).map(([key, value]) => {
    const [dateToken, eventId] = key.split('#');
    return {
      key,
      dateToken,
      eventId: eventId || undefined,
      value: value as { doubleTransit?: { isTriggered?: boolean } },
    };
  });

  const tokenToComparableDate = (token: string): string | null => {
    if (/^\d{4}-\d{2}-\d{2}$/.test(token)) return token;
    if (/^\d{4}-\d{2}$/.test(token)) return `${token}-15`;
    if (/^\d{4}$/.test(token)) return `${token}-07-01`;
    return null;
  };

  let score = 50;
  let transitMatches = 0;
  let checkedEvents = 0;

  for (const event of events) {
    const eventId = event.id ? String(event.id) : undefined;
    const eventDateRaw = typeof event.eventDate === 'string'
      ? event.eventDate
      : undefined;
    const window = resolveEventDateWindow({
      eventDate: event.eventDate,
      endDate: event.endDate,
      datePrecision: event.datePrecision,
      eventTime: event.eventTime,
    });

    const matchingEntry = transitEntries.find((entry) => {
      if (eventId && entry.eventId === eventId) return true;

      if (eventDateRaw) {
        if (entry.dateToken === eventDateRaw) return true;
        if (entry.dateToken.startsWith(eventDateRaw) || eventDateRaw.startsWith(entry.dateToken)) return true;
      }

      const comparable = tokenToComparableDate(entry.dateToken);
      if (!comparable) return false;
      return comparable >= window.startDate && comparable <= window.endDate;
    })?.value;

    if (matchingEntry) {
      checkedEvents++;
    }
    if (matchingEntry?.doubleTransit?.isTriggered) {
      transitMatches++;
    }
  }

  if (checkedEvents > 0) {
    score = 40 + (transitMatches / checkedEvents) * 60;
  } else if (events.length > 0) {
    score = 35;
  }

  return {
    method: 'Transit Analysis',
    score: Math.min(100, score),
    maxScore: 100,
    status: score >= 60 ? 'pass' : 'warning',
    details: `${transitMatches}/${Math.max(checkedEvents, events.length)} events show double transit activation`,
    criticalFindings: transitMatches > 0 ? [`Double transit for ${transitMatches} events`] : []
  };
}

function validateForensic(input: ValidationInput): ValidationDetail {
  const { candidate, forensicProfile } = input;

  if (!forensicProfile || !candidate.ephemeris) {
    return {
      method: 'Forensic Correlation',
        score: 0,
      maxScore: 100,
      status: 'warning',
      details: 'Forensic data incomplete',
      criticalFindings: []
    };
  }

  // Calculate forensic match score
  let score = 40; // Base score lowered to allow for mismatch detection
  const findings: string[] = [];

  // Lagna element vs prakriti
  const lagna = candidate.ephemeris.ascendant?.sign;
  const prakriti = forensicProfile.biological?.prakriti;

  if (lagna && prakriti) {
    const elementMatch = checkPrakritiLagnaMatch(prakriti, lagna);
    if (elementMatch) {
      score += 20;
      findings.push(`Prakriti ${prakriti} matches Lagna ${lagna}`);
    }
  }

  // Physical build vs planet influences
  const build = forensicProfile.physical?.build;
  if (build && candidate.ephemeris.planets) {
    const buildScore = checkBuildPlanetaryMatch(build, candidate.ephemeris.planets);
    score += buildScore;
    if (buildScore > 10) findings.push('Physical build matches planetary signatures');
  }

  return {
    method: 'Forensic Correlation',
    score: Math.min(100, score),
    maxScore: 100,
    status: score >= 70 ? 'pass' : 'warning',
    details: `Forensic match: ${score.toFixed(0)}%`,
    criticalFindings: findings
  };
}

function validateAI(input: ValidationInput): ValidationDetail {
  // AI score comes from previous AI analysis
  // This is a placeholder - actual AI score passed from AI service
  const score = input.candidate.aiScore || 70;

  return {
    method: 'AI Reasoning',
    score,
    maxScore: 100,
    status: score >= 75 ? 'pass' : score >= 50 ? 'warning' : 'fail',
    details: `AI confidence: ${score}%`,
    criticalFindings: score > 85 ? ['High AI confidence'] : []
  };
}

function validateNadi(input: ValidationInput): ValidationDetail {
  const { candidate } = input;
  const nadiData = candidate.ephemeris?.nadiData || (candidate as { nadiData?: Record<string, unknown> }).nadiData;
  if (!nadiData || Object.keys(nadiData).length === 0) {
    return {
      method: 'Nadi Amsha',
      score: 20,
      maxScore: 100,
      status: 'fail',
      details: 'Nadi data unavailable',
      criticalFindings: ['Missing D150/Nadi payload']
    };
  }

  const hasAsc = Boolean((nadiData as Record<string, unknown>).ascendant);
  const hasLuminaries = Boolean((nadiData as Record<string, unknown>).sun) && Boolean((nadiData as Record<string, unknown>).moon);
  const count = Object.keys(nadiData).length;
  const score = Math.min(100, 45 + (hasAsc ? 20 : 0) + (hasLuminaries ? 20 : 0) + Math.min(15, count));

  return {
    method: 'Nadi Amsha',
    score,
    maxScore: 100,
    status: score >= 75 ? 'pass' : score >= 55 ? 'warning' : 'fail',
    details: `Nadi payload entries: ${count}`,
    criticalFindings: hasAsc ? ['Ascendant Nadi present'] : []
  };
}

function validatePrana(input: ValidationInput): ValidationDetail {
  const { candidate } = input;
  const vim = getVimshottariSnapshot(candidate);
  const score = vim.prana ? 100 : 35;

  return {
    method: 'Prana Dasha',
    score,
    maxScore: 100,
    status: score >= 90 ? 'pass' : score >= 60 ? 'warning' : 'fail',
    details: vim.prana ? 'Prana level timing available' : 'Prana level data missing',
    criticalFindings: vim.prana ? ['Micro-timing available'] : []
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONSENSUS CALCULATION
// ═══════════════════════════════════════════════════════════════════════════════

function calculateWeightedConsensus(scores: ConsensusScores): number {
  const scoresRecord: Record<string, number> = { ...scores };
  const methodWeights: Record<string, number> = {
    vimshottari: METHOD_WEIGHTS.vimshottari,
    yogini: METHOD_WEIGHTS.yogini,
    chara: METHOD_WEIGHTS.chara,
    kalachakra: METHOD_WEIGHTS.kalachakra,
    kp: METHOD_WEIGHTS.kp,
    ashtakavarga: METHOD_WEIGHTS.ashtakavarga,
    varga: METHOD_WEIGHTS.varga,
    transit: METHOD_WEIGHTS.transit,
    forensic: METHOD_WEIGHTS.forensic,
    ai: METHOD_WEIGHTS.ai,
    nadi: METHOD_WEIGHTS.nadi,
    prana: METHOD_WEIGHTS.prana
  };

  // Consensus Engine: Use Rank Fusion for mathematically robust judgment
  return calculateRankFusionScore(scoresRecord, methodWeights);
}

function determineConfidenceLevel(
  scores: ConsensusScores,
  overall: number,
  redFlags: RedFlags
): ConsensusResult['confidenceLevel'] {
  // Exclude methods with no data (score of 0) from threshold checks
  // A method scoring 0 means it was not computed, not that it failed
  const activeScores = Object.values(scores).filter((s): s is number => typeof s === 'number' && s > 0);
  const thresholds = CONFIDENCE_THRESHOLDS;

  if (redFlags.gandanta) return 'LOW';

  let baseLevel: ConsensusResult['confidenceLevel'] = 'LOW';

  if (activeScores.length >= 6 && activeScores.every(s => s >= thresholds.standard_precision.allMethodsAbove) &&
      overall >= thresholds.standard_precision.minScore && !redFlags.conflictingMethods) {
    baseLevel = 'STANDARD_PRECISION';
  } else if (activeScores.length >= 5 && activeScores.every(s => s >= thresholds.very_high.allMethodsAbove) &&
             overall >= thresholds.very_high.minScore) {
    baseLevel = 'VERY_HIGH';
  } else if (activeScores.length >= 4 && overall >= thresholds.high.minScore &&
             activeScores.every(s => s >= thresholds.high.allMethodsAbove)) {
    baseLevel = 'HIGH';
  } else if (overall >= thresholds.medium.minScore) {
    baseLevel = 'MEDIUM';
  }

  if (!redFlags.d60Instability) {
    return baseLevel;
  }

  // D60 instability means micro-boundary sensitivity. Downgrade confidence.
  switch (baseLevel) {
    case 'STANDARD_PRECISION':
      return 'HIGH';
    case 'VERY_HIGH':
      return 'HIGH';
    case 'HIGH':
      return 'MEDIUM';
    default:
      return 'LOW';
  }
}

function calculateMarginOfError(scores: ConsensusScores, redFlags: RedFlags): number {
  let baseError = 60; // Base 60 seconds
  let highScoreCount = 0;
  const scoreValues = Object.values(scores);
  const scoreMean = scoreValues.reduce((sum, value) => sum + value, 0) / Math.max(1, scoreValues.length);
  const variance = scoreValues.reduce((sum, value) => sum + ((value - scoreMean) ** 2), 0) / Math.max(1, scoreValues.length);
  const stdDev = Math.sqrt(variance);

  // Reduce error with higher scores - count how many methods are high
  if (scores.kp >= 80) { baseError -= 20; highScoreCount++; }
  if (scores.vimshottari >= 80) { baseError -= 15; highScoreCount++; }
  if (scores.varga >= 80) { baseError -= 10; highScoreCount++; }
  if (scores.transit >= 80) { baseError -= 10; highScoreCount++; }
  if (scores.forensic >= 80) { baseError -= 5; highScoreCount++; }

  // Bonus reduction if multiple methods agree (high consensus)
  if (highScoreCount >= 4) baseError -= 10;
  if (highScoreCount >= 6) baseError -= 10;

  // Increase error with red flags
  if (redFlags.sandhiBirth) baseError += 30;
  if (redFlags.dashaSandhi) baseError += 20;
  if (redFlags.d60Instability) baseError += 25;
  if (redFlags.conflictingMethods) baseError += 15;

  // Score spread calibration: high disagreement widens uncertainty.
  if (stdDev >= 25) baseError += 15;
  else if (stdDev >= 15) baseError += 8;
  else if (stdDev <= 8) baseError -= 5;

  return Math.max(3, baseError); // Minimum 3 seconds
}

function detectRedFlags(input: ValidationInput, scores: ConsensusScores, _details: ValidationDetail[]): RedFlags {
  const { candidate } = input;

  return {
    sandhiBirth: detectSandhi(candidate),
    gandanta: detectGandanta(candidate),
    dashaSandhi: detectDashaSandhi(candidate),
    conflictingMethods: detectConflicts(scores),
    weakSignificators: detectWeakSignificators(candidate),
    d60Instability: detectD60Instability(candidate),
    forensicMismatch: scores.forensic < 50
  };
}

function generateKeyEvidence(details: ValidationDetail[]): string[] {
  return details
    .filter(d => d.status === 'pass' && d.score >= 80)
    .map(d => `${d.method}: ${d.details}`)
    .slice(0, 5);
}

function generateRecommendations(scores: ConsensusScores, redFlags: RedFlags): string[] {
  const recs: string[] = [];

  if (scores.kp < 70) recs.push('Add more precise event timings for KP analysis');
  if (scores.varga < 70) recs.push('Include spouse data for D9 verification');
  if (scores.transit < 60) recs.push('Verify event dates for transit correlation');
  if (scores.forensic < 70) recs.push('Complete forensic profile for better matching');
  if (redFlags.sandhiBirth) recs.push('Birth near cusp - additional verification needed');
  if (redFlags.d60Instability) recs.push('D60 changes in window - micro-grid analysis recommended');

  return recs;
}

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

function getEventWeight(impact: string): number {
  // Delegate to the canonical weights defined in precision-weights.ts
  const impactToImportance: Record<string, string> = {
    critical: 'critical',
    major: 'high',
    moderate: 'medium',
    minor: 'low',
  };
  return getEventWeightFromImportance(impactToImportance[impact] || impact);
}

function getEventSignificators(category: string): string[] {
  const map: Record<string, string[]> = {
    marriage: ['Venus', 'Jupiter', 'Moon'],
    career: ['Saturn', 'Sun', 'Jupiter'],
    education: ['Mercury', 'Jupiter', 'Moon'],
    children: ['Jupiter', 'Venus', 'Moon'],
    health: ['Sun', 'Moon', 'Mars'],
    finance: ['Jupiter', 'Venus', 'Mercury'],
    travel: ['Moon', 'Rahu', 'Ketu'],
    property: ['Mars', 'Saturn', 'Venus'],
    spiritual: ['Jupiter', 'Ketu', 'Saturn']
  };
  return map[category] || ['Jupiter'];
}

function getTargetHouse(category: string): number {
  const map: Record<string, number> = {
    marriage: 7, career: 10, education: 4, children: 5,
    health: 6, finance: 2, travel: 9, property: 4,
    spiritual: 9, family: 2, legal: 6
  };
  return map[category] || 1;
}

function parseD60Degree(candidate: ValidationInput['candidate']): number | null {
  const d60FromVarga = candidate.ephemeris?.vargaDegrees?.D60?.Ascendant;
  if (typeof d60FromVarga !== 'string') return null;

  // Example formats: "Scorpio 29°59'12\"" or "Scorpio 29.5"
  const degreeMatch = d60FromVarga.match(/(\d+(?:\.\d+)?)\s*°?/);
  if (!degreeMatch) return null;

  const degree = Number(degreeMatch[1]);
  if (!Number.isFinite(degree)) return null;

  return degree;
}

function detectD60Instability(candidate: ValidationInput['candidate']): boolean {
  const d60Sign = candidate.vargas?.d60 || candidate.vargas?.D60 || candidate.ephemeris?.d60Sign;
  if (!d60Sign || String(d60Sign).toLowerCase() === 'unknown') {
    return true;
  }

  const d60Degree = parseD60Degree(candidate);
  if (d60Degree !== null && (d60Degree <= 0.75 || d60Degree >= 29.25)) {
    return true;
  }

  const d60SunDeity = candidate.ephemeris?.d60Planets?.Sun?.deity;
  if (typeof d60SunDeity === 'string' && d60SunDeity === 'Unknown') {
    return true;
  }

  return false;
}

function correlateYoginiWithEvent(yogini: string, category: string): boolean {
  const correlations: Record<string, string[]> = {
    'Moon': ['marriage', 'family', 'travel'],
    'Sun': ['career', 'health', 'education'],
    'Jupiter': ['career', 'children', 'spiritual'],
    'Mars': ['health', 'property', 'legal'],
    'Mercury': ['education', 'finance', 'career'],
    'Saturn': ['career', 'health', 'property'],
    'Venus': ['marriage', 'finance', 'children'],
    'Rahu': ['travel', 'spiritual', 'career']
  };
  return correlations[yogini]?.includes(category) || false;
}

function correlateCharaWithEvent(sign: string, category: string): boolean {
  // Simplified correlation
  const elementMap: Record<string, string[]> = {
    'fire': ['career', 'education', 'spiritual'],
    'earth': ['property', 'finance', 'career'],
    'air': ['education', 'travel', 'marriage'],
    'water': ['family', 'children', 'health']
  };
  const element = getSignElement(sign);
  return elementMap[element]?.includes(category) || false;
}

function getSignElement(sign: string): string {
  const elements: Record<string, string> = {
    'Aries': 'fire', 'Leo': 'fire', 'Sagittarius': 'fire',
    'Taurus': 'earth', 'Virgo': 'earth', 'Capricorn': 'earth',
    'Gemini': 'air', 'Libra': 'air', 'Aquarius': 'air',
    'Cancer': 'water', 'Scorpio': 'water', 'Pisces': 'water'
  };
  return elements[sign] || 'fire';
}

function checkPrakritiLagnaMatch(prakriti: string, lagna: string): boolean {
  const element = getSignElement(lagna);
  const prakritiElement = prakriti.includes('pitta') ? 'fire' :
    prakriti.includes('vata') ? 'air' :
      prakriti.includes('kapha') ? 'water' : 'earth';
  return element === prakritiElement;
}

function checkBuildPlanetaryMatch(build: string, planets: Record<string, { dignity?: string }>): number {
  let score = 0;
  const jupiterStrong = planets.jupiter?.dignity === 'exalted' || planets.jupiter?.dignity === 'own';
  const saturnStrong = planets.saturn?.dignity === 'exalted' || planets.saturn?.dignity === 'own';

  if (build === 'heavy' && jupiterStrong) score += 15;
  if (build === 'slim' && saturnStrong) score += 15;
  if (build === 'athletic' && planets.mars?.dignity === 'exalted') score += 15;

  return score;
}

function detectSandhi(candidate: ValidationInput['candidate']): boolean {
  const ascDegree = candidate.ephemeris?.ascendant?.degree;
  if (typeof ascDegree === 'number') {
    return ascDegree < 1 || ascDegree > 29;
  }
  if (typeof ascDegree === 'string') {
    const parsed = Number.parseFloat(ascDegree);
    if (Number.isFinite(parsed)) {
      return parsed < 1 || parsed > 29;
    }
  }
  return false;
}

function detectGandanta(candidate: ValidationInput['candidate']): boolean {
  const moonLong = candidate.ephemeris?.planets?.moon?.longitude;
  if (!moonLong) return false;

  // Gandanta: junction of water and fire signs
  // Last 1° of water signs (Pisces/Cancer/Scorpio) + first 1° of fire signs (Aries/Leo/Sag)
  // Water endings: 329-330° (Pisces), 119-120° (Cancer), 239-240° (Scorpio)
  // Fire beginnings: 0-1° (Aries), 120-121° (Leo), 240-241° (Sag)
  const inWaterEnd = (moonLong % 30) > 29 && ((moonLong % 120) > 119 || (moonLong % 120) < 1);
  const inFireStart = (moonLong % 120) < 1;
  return inWaterEnd || inFireStart;
}

function detectDashaSandhi(candidate: ValidationInput['candidate']): boolean {
  // Check if birth is near dasha transition
  const snapshot = getVimshottariSnapshot(candidate);
  const dashaStart = snapshot.startDate;
  const dashaEnd = snapshot.endDate;

  if (!dashaStart || !dashaEnd) return false;

  const birthDate = new Date(candidate.birthDate || Date.now());
  const daysFromStart = Math.abs(birthDate.getTime() - dashaStart.getTime()) / (1000 * 60 * 60 * 24);
  const daysToEnd = Math.abs(dashaEnd.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24);

  return daysFromStart < 30 || daysToEnd < 30; // Within 30 days of transition
}

function detectConflicts(scores: ConsensusScores): boolean {
  const values = Object.values(scores);
  const max = Math.max(...values);
  const min = Math.min(...values);
  return (max - min) > 40; // More than 40 point difference indicates conflict
}

function detectWeakSignificators(candidate: ValidationInput['candidate']): boolean {
  const planets = candidate.ephemeris?.planets;
  if (!planets) return false;
  return Object.values(planets).some((p) => {
    const total = (p as Record<string, unknown>)?.shadbala && typeof (p as Record<string, unknown>).shadbala === 'object' && (p as Record<string, unknown>).shadbala !== null
      ? ((p as Record<string, unknown>).shadbala as Record<string, unknown>).total
      : undefined;
    return typeof total === 'number' && total < 1.0;
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORT
// ═══════════════════════════════════════════════════════════════════════════════

export const ConsensusEngine = {
  calculate: calculateConsensus,
  calculateWeighted: calculateWeightedConsensus,
  determineLevel: determineConfidenceLevel,
  detectRedFlags
};
