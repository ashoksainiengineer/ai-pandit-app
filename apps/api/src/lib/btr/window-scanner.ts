/**
 * BTR Window Scanner Module
 *
 * Core engine for Birth Time Rectification that iteratively scans
 * time windows to find the most accurate birth time.
 *
 * Process:
 * 1. Generate candidate times within the specified range
 * 2. Calculate ephemeris and astrological data for each candidate
 * 3. Score each candidate against life events
 * 4. Rank candidates and return best matches
 *
 * Performance: Uses caching and parallel processing for efficiency.
 */

import { calculateEphemeris, calculateSunrise, convertToUTC } from '../ephemeris.js';
import { calculateVimshottariDasha, getDashaForDate } from '../vedic-astrology-engine.js';
import { calculateKPSubLords } from '../kp-sublords.js';
import { generateDivisionalCharts, calculateBoundarySafety } from '../advanced-btr-methods.js';
import { calculateCharaKarakas } from '../jaimini-astrology.js';
import { Kalachakra } from '../kalachakra-dasha.js';
import { Shadbala } from '../shadbala.js';
import { NadiAmsha } from '../nadi-amsha.js';
import {
  TimeWindow,
  ScanConfiguration,
  CandidateScore,
  ScanResult,
  MethodScores,
  BtrEvent,
  DEFAULT_SCAN_CONFIG,
  ZODIAC_SIGNS,
  EVENT_HOUSE_MAP,
  EVENT_SIGNIFICATORS
} from '@ai-pandit/shared';
import {
  TatwaShuddhi,
  calculateTatwaAtTime,
  FULL_CYCLE_MINUTES
} from './tatwa-shuddhi.js';
import { TransitAnalyzer } from './transit-analyzer.js';
import { EventScorer, ScoredEvent } from './event-scorer.js';
import {
  METHOD_WEIGHTS,
  KP_SCORES,
  DASHA_MATCH_SCORES,
  calculateRankFusionScore,
  calculateWeightedAverage
} from './precision-weights.js';
import { logger } from '../logger.js';

const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;
const MINUTE_MS = 60 * 1000;

export interface ScannerInput {
  birthDate: string;
  tentativeTime: string;
  latitude: number;
  longitude: number;
  timezone: string | number;
  events: BtrEvent[];
  rangeMinutes?: number;
  stepSeconds?: number;
  config?: Partial<ScanConfiguration>;
  knownTatwa?: string;
}

export interface ScannerContext {
  birthDate: string;
  latitude: number;
  longitude: number;
  timezone: string | number;
  scoredEvents: ScoredEvent[];
  totalEventWeight: number;
  sunriseTime: Date | null;
  config: ScanConfiguration;
  knownTatwa?: string;
}

export interface CandidateAnalysis {
  time: Date;
  timeString: string;
  ephemeris: any;
  dasha: any;
  vargas: any;
  kpData: any;
  boundarySafety: any;
}

/**
 * Main scanner function - finds optimal birth time
 */
export async function scanBirthTimeWindow(input: ScannerInput): Promise<ScanResult> {
  const startTime = Date.now();
  const errors: string[] = [];
  const recommendations: string[] = [];

  try {
    const config = { ...DEFAULT_SCAN_CONFIG, ...input.config };
    const scoredEvents = EventScorer.scoreEvents(input.events);
    const totalEventWeight = scoredEvents.reduce((sum, e) => sum + e.calculatedWeight, 0);

    const validation = EventScorer.validateCollection(scoredEvents);
    if (!validation.isValid) {
      recommendations.push(...validation.suggestions);
    }

    let sunriseTime: Date | null = null;
    try {
      sunriseTime = await calculateSunrise(
        input.birthDate,
        input.latitude,
        input.longitude,
        input.timezone
      );
    } catch (e) {
      logger.warn('[SCANNER] Could not calculate sunrise', { error: (e as any)?.message || e });
    }

    const context: ScannerContext = {
      birthDate: input.birthDate,
      latitude: input.latitude,
      longitude: input.longitude,
      timezone: input.timezone,
      scoredEvents,
      totalEventWeight,
      sunriseTime,
      config,
      knownTatwa: input.knownTatwa
    };

    const timeWindow: TimeWindow = {
      baseTime: parseTime(input.tentativeTime, input.birthDate, input.timezone),
      rangeMinutes: input.rangeMinutes || 30,
      stepSeconds: input.stepSeconds || 60
    };

    // Adaptive Resolution Scanning
    // First pass with base resolution
    const candidates = await generateCandidates(timeWindow, context);
    let scoredCandidates = await Promise.all(
      candidates.map(c => scoreCandidate(c, context))
    );

    // Adaptive Precision: Peak Zooming
    // If we find very high scores, zoom in around them with 5-second precision
    const highPotentialCandidates = scoredCandidates.filter(c => c.overallScore! >= 80);
    if (highPotentialCandidates.length > 0 && timeWindow.stepSeconds > 10) {
      logger.info(`[SCANNER] Peak Zooming detected ${highPotentialCandidates.length} high-potential zones`);

      const zoomPromises = highPotentialCandidates.map(async (peak) => {
        const zoomWindow: TimeWindow = {
          baseTime: peak.time as Date,
          rangeMinutes: 1, // 1 minute window
          stepSeconds: 5   // 5 second resolution (Seconds precision)
        };
        const zoomCandidates = await generateCandidates(zoomWindow, context);
        return Promise.all(zoomCandidates.map(c => scoreCandidate(c, context)));
      });

      const zoomedResults = (await Promise.all(zoomPromises)).flat();
      scoredCandidates = [...scoredCandidates, ...zoomedResults];
    }

    // Diverse Selection Policy
    // Instead of just taking Top-K overall, we ensure Method Winners survive.
    const selectionSet = new Set<string>();
    const diverseSurvivors: CandidateScore[] = [];
    const maxSurvivors = config.maxCandidates || DEFAULT_SCAN_CONFIG.maxCandidates;

    // 1. Add overall Top-K
    const sortedOverall = [...scoredCandidates].sort((a, b) => (b.overallScore || 0) - (a.overallScore || 0));
    sortedOverall.slice(0, Math.floor(maxSurvivors * 0.6)).forEach(c => {
      if (c.timeString && !selectionSet.has(c.timeString)) {
        diverseSurvivors.push(c);
        selectionSet.add(c.timeString);
      }
    });

    // 2. Add Top-3 from EACH major method (Safety Net)
    const majorMethods: Array<keyof MethodScores> = ['kp', 'vimshottari', 'varga', 'nadi', 'transit'];
    majorMethods.forEach(method => {
      const methodWinners = [...scoredCandidates]
        .sort((a, b) => (b.methodScores?.[method] || 0) - (a.methodScores?.[method] || 0))
        .slice(0, 3);

      methodWinners.forEach(c => {
        if (c.timeString && !selectionSet.has(c.timeString) && diverseSurvivors.length < maxSurvivors) {
          diverseSurvivors.push(c);
          selectionSet.add(c.timeString);
          logger.debug(`[SCANNER] Diverse Selection: Kept ${c.timeString} as ${method} winner`);
        }
      });
    });

    // Boundary Protection: Always keep candidates near dangerous boundaries
    scoredCandidates.forEach(c => {
      if (c.timeString &&
        c.redFlags?.some(f => f.includes('boundary') || f.includes('Gandanta')) &&
        !selectionSet.has(c.timeString) &&
        diverseSurvivors.length < maxSurvivors) {
        diverseSurvivors.push(c);
        selectionSet.add(c.timeString);
        logger.debug(`[SCANNER] Sandhi Survival: Kept ${c.timeString} near critical boundary`);
      }
    });

    const bestCandidate = diverseSurvivors.sort((a, b) => b.overallScore! - a.overallScore!)[0] || null;

    if (bestCandidate) {
      generateFinalRecommendations(bestCandidate, context, recommendations);
    }

    const duration = Date.now() - startTime;

    return {
      success: diverseSurvivors.length > 0,
      candidates: diverseSurvivors,
      bestCandidate,
      totalScanned: scoredCandidates.length,
      scanDurationMs: duration,
      recommendations,
      errors
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    errors.push(`Scanner error: ${errorMessage}`);
    logger.error('[SCANNER] Fatal error', { error: (error as any)?.message || error });

    return {
      success: false,
      candidates: [],
      bestCandidate: null,
      totalScanned: 0,
      scanDurationMs: Date.now() - startTime,
      recommendations,
      errors
    };
  }
}

/**
 * Generate candidate times within the window
 */
async function generateCandidates(
  window: TimeWindow,
  context: ScannerContext
): Promise<CandidateAnalysis[]> {
  const candidates: CandidateAnalysis[] = [];
  const stepMs = window.stepSeconds * 1000;
  const rangeMs = window.rangeMinutes * MINUTE_MS;

  const startMs = window.baseTime.getTime() - rangeMs;
  const endMs = window.baseTime.getTime() + rangeMs;

  const ephemerisCache = new Map<string, any>();

  for (let timeMs = startMs; timeMs <= endMs; timeMs += stepMs) {
    const candidateTime = new Date(timeMs);
    const timeString = formatTimeString(candidateTime, context.timezone);
    const cacheKey = `${context.birthDate}_${timeString}`;

    try {
      let ephemeris: any;

      if (context.config.cacheEphemeris && ephemerisCache.has(cacheKey)) {
        ephemeris = ephemerisCache.get(cacheKey);
      } else {
        ephemeris = await calculateEphemeris(
          context.birthDate,
          timeString,
          context.latitude,
          context.longitude,
          context.timezone as string | number
        );
        if (context.config.cacheEphemeris) {
          ephemerisCache.set(cacheKey, ephemeris);
        }
      }

      const moonLong = ephemeris.planets.moon.longitude;
      const dasha = calculateVimshottariDasha(moonLong, candidateTime, 5);
      const vargas = generateDivisionalCharts(ephemeris);

      const kpData: Record<string, any> = {};
      for (const [name, data] of Object.entries(ephemeris.planets)) {
        kpData[name] = calculateKPSubLords((data as any).longitude);
      }

      const boundarySafety = calculateBoundarySafety(ephemeris);

      candidates.push({
        time: candidateTime,
        timeString,
        ephemeris,
        dasha,
        vargas,
        kpData,
        boundarySafety
      });

    } catch (error) {
      logger.debug(`[SCANNER] Failed to analyze candidate ${timeString}`, { error: (error as any)?.message || error });
    }

    if (candidates.length >= context.config.maxCandidates * 2) {
      break;
    }
  }

  return candidates;
}

/**
 * Score a single candidate time
 */
async function scoreCandidate(
  candidate: CandidateAnalysis,
  context: ScannerContext
): Promise<CandidateScore> {
  const methodScores: MethodScores = {
    vimshottari: 0,
    yogini: 0,
    chara: 0,
    kalachakra: 0,
    kp: 0,
    varga: 0,
    transit: 0,
    forensic: 0,
    boundary: 0,
    tatwa: 0,
    shadbala: 0,
    nadi: 0,
    spouseD9: 0
  };

  const eventMatches: any[] = [];
  const transitMatches: any[] = [];
  const redFlags: string[] = [];
  const keyEvidence: string[] = [];

  methodScores.vimshottari = scoreVimshottariMatch(candidate, context, eventMatches);
  methodScores.kp = scoreKPMatch(candidate, context, eventMatches);
  methodScores.varga = scoreVargaMatch(candidate, context);
  methodScores.boundary = scoreBoundarySafety(candidate, redFlags);
  methodScores.tatwa = scoreTatwaMatch(candidate, context, redFlags);

  methodScores.kalachakra = scoreKalachakraMatch(candidate, context);
  methodScores.shadbala = scoreShadbalaMatch(candidate);
  methodScores.nadi = scoreNadiMatch(candidate, context);

  try {
    const transitResults = await TransitAnalyzer.calculateMatchScore(
      context.scoredEvents.map(e => ({
        date: normalizeTransitDateLiteral((e as any).rawEventDate, e.eventDate),
        endDate: (e as any).endDate,
        datePrecision: e.datePrecision as any,
        time: (e as any).eventTime,
        category: e.category,
        id: e.id
      })),
      {
        latitude: context.latitude,
        longitude: context.longitude,
        timezone: context.timezone,
        ascendantSign: candidate.ephemeris.ascendant.sign
      }
    );

    transitMatches.push(...transitResults);
    methodScores.transit = calculateAverageScore(transitResults.map(t => t.score));
  } catch (e) {
    logger.debug('[SCANNER] Transit calculation failed', { error: (e as any)?.message || e });
  }

  const weights = METHOD_WEIGHTS;

  const scoresRecord: Record<string, number> = { ...methodScores };
  // Rank Fusion: Use Reciprocal Rank Fusion for mathematically robust consensus
  const overallScore = calculateRankFusionScore(scoresRecord, weights);

  extractKeyEvidence(candidate, methodScores, eventMatches, keyEvidence);

  const confidenceLevel = determineConfidenceLevel(overallScore, methodScores, redFlags);
  const marginOfError = calculateMarginOfError(methodScores, redFlags, candidate.boundarySafety);

  return {
    time: candidate.time,
    timeString: candidate.timeString,
    overallScore: Math.round(overallScore * 100) / 100,
    confidenceLevel,
    marginOfErrorSeconds: marginOfError,
    methodScores,
    eventMatches,
    transitMatches,
    redFlags,
    keyEvidence
  };
}

/**
 * Score Vimshottari Dasha correlation with events
 * Uses God-Tier weights for Dasha depth precision
 */
function scoreVimshottariMatch(
  candidate: CandidateAnalysis,
  context: ScannerContext,
  eventMatches: any[]
): number {
  let totalScore = 0;
  let totalWeight = 0;

  for (const event of context.scoredEvents) {
    const dashaAtEvent = getDashaForDate(
      candidate.dasha,
      event.eventDate
    );

    if (!dashaAtEvent) continue;

    const significators = EVENT_SIGNIFICATORS[event.category] || [];
    const dashaLord = dashaAtEvent.mahadasha;
    const antarLord = dashaAtEvent.antardasha;

    let eventScore = 0;

    // MAHADASHA MATCH (Weight: 0.15 of total dasha influence)
    if (significators.includes(dashaLord)) {
      eventScore += DASHA_MATCH_SCORES.mahadashaSignificator;
    }

    // MAHADASHA HOUSE PLACEMENT
    const targetHouse = EVENT_HOUSE_MAP[event.category] || 1;
    const dashaLordHouse = getPlanetHouse(dashaLord, candidate.ephemeris);
    const antarLordHouse = getPlanetHouse(antarLord, candidate.ephemeris);

    if (dashaLordHouse === targetHouse) {
      eventScore += DASHA_MATCH_SCORES.mahadashaHouseMatch;
    }

    // ANTARDASHA MATCH (Weight: 0.25 of total dasha influence)
    if (significators.includes(antarLord)) {
      eventScore += DASHA_MATCH_SCORES.antardashaSignificator;
    }

    if (antarLordHouse === targetHouse) {
      eventScore += DASHA_MATCH_SCORES.antardashaHouseMatch;
    }

    // PRATYANTARDASHA (if available) - Week-level precision
    const pratyantardasha = (dashaAtEvent as any).pratyantardasha;
    if (pratyantardasha && significators.includes(pratyantardasha)) {
      eventScore += DASHA_MATCH_SCORES.pratyantardashaMatch;
    }

    // SUKSHMA DASHA (if available) - Day-level precision
    const sukshma = (dashaAtEvent as any).sukshma;
    if (sukshma && significators.includes(sukshma)) {
      eventScore += DASHA_MATCH_SCORES.sukshmaMatch;
    }

    // PRANA DASHA (if available) - Hour-level precision (SECONDS POSSIBLE!)
    const prana = (dashaAtEvent as any).prana;
    if (prana && significators.includes(prana)) {
      eventScore += DASHA_MATCH_SCORES.pranaMatch;
    }

    totalScore += eventScore * event.calculatedWeight;
    totalWeight += event.calculatedWeight;

    eventMatches.push({
      eventId: event.id,
      eventType: event.category,
      expectedHouse: targetHouse,
      dashaLord,
      antarLord,
      significatorMatch: significators.includes(dashaLord),
      score: eventScore,
      details: `${dashaLord}-${antarLord} dasha at ${event.category}`
    });
  }

  return totalWeight > 0 ? Math.min(100, totalScore / totalWeight) : 50;
}

/**
 * Score KP Sub-Lord correlation
 * Uses God-Tier KP scores for precision timing
 */
function scoreKPMatch(
  candidate: CandidateAnalysis,
  context: ScannerContext,
  eventMatches: any[]
): number {
  let totalScore = 0;
  let totalWeight = 0;

  for (const event of context.scoredEvents) {
    const targetHouse = EVENT_HOUSE_MAP[event.category] || 1;
    const houseCusp = candidate.ephemeris.kpCusps?.[targetHouse - 1]
      ?? candidate.ephemeris.houses?.[targetHouse - 1]?.cusp;

    if (!houseCusp) continue;

    const cuspKP = calculateKPSubLords(houseCusp);
    const dashaAtEvent = getDashaForDate(candidate.dasha, event.eventDate);

    if (!dashaAtEvent) continue;

    let eventScore = 0;
    const dashaLord = dashaAtEvent.mahadasha.toLowerCase();
    const significators = EVENT_SIGNIFICATORS[event.category] || [];

    // KP SUB-LORD MATCH - Primary significator (95 points)
    if (cuspKP.subLord.toLowerCase() === dashaLord) {
      eventScore = KP_SCORES.subLordMatch;
    }
    // KP STAR-LORD MATCH - Source of event (80 points)
    else if (cuspKP.starLord.toLowerCase() === dashaLord) {
      eventScore = KP_SCORES.starLordMatch;
    }
    // KP SUB-SUB-LORD MATCH - Mode of delivery (70 points)
    else if (cuspKP.subSubLord?.toLowerCase() === dashaLord) {
      eventScore = KP_SCORES.subSubLordMatch;
    }
    // KP SUB-SUB-SUB-LORD - Fine detail (60 points) - SECONDS precision
    else if ((cuspKP as any).subSubSubLord?.toLowerCase() === dashaLord) {
      eventScore = KP_SCORES.subSubSubLordMatch;
    }
    // SIGNIFICATOR MATCH - A/B/C planet (40 points)
    else if (significators.some(s => s.toLowerCase() === cuspKP.subLord.toLowerCase())) {
      eventScore = KP_SCORES.significatorMatch;
    }
    // NO MATCH - But still possible (10 points)
    else {
      eventScore = KP_SCORES.noMatch;
    }

    totalScore += eventScore * event.calculatedWeight;
    totalWeight += event.calculatedWeight;
  }

  return totalWeight > 0 ? Math.min(100, totalScore / totalWeight) : 50;
}

/**
 * Score Divisional Chart correlation
 */
function scoreVargaMatch(
  candidate: CandidateAnalysis,
  context: ScannerContext
): number {
  let score = 60;
  const vargas = candidate.vargas;

  if (!vargas) return 50;

  const marriageEvents = context.scoredEvents.filter(e => e.category === 'marriage');
  if (marriageEvents.length > 0 && vargas.D9) {
    const d9Asc = vargas.D9.ascendant?.sign;
    if (d9Asc) {
      score += 10;
    }
  }

  const careerEvents = context.scoredEvents.filter(e =>
    ['career', 'promotion', 'business'].includes(e.category)
  );
  if (careerEvents.length > 0 && vargas.D10) {
    const d10Asc = vargas.D10.ascendant?.sign;
    if (d10Asc) {
      score += 10;
    }
  }

  if (vargas.D60) {
    score += 10;
  }

  if (vargas.D150) {
    score += 10;
  }

  return Math.min(100, score);
}

/**
 * Score boundary safety (avoid sandhi zones)
 */
function scoreBoundarySafety(
  candidate: CandidateAnalysis,
  redFlags: string[]
): number {
  const safety = candidate.boundarySafety;

  if (!safety) return 70;

  let score = 100;

  if (safety.lagnaSignBoundary < 60) {
    score -= 20;
    redFlags.push(`Lagna near sign boundary (${safety.lagnaSignBoundary}s)`);
  }

  if (safety.moonNakshatraBoundary < 120) {
    score -= 15;
    redFlags.push(`Moon near nakshatra boundary (${safety.moonNakshatraBoundary}s)`);
  }

  if (safety.isDangerous) {
    score -= 30;
    redFlags.push('Birth in critical boundary zone');
  }

  return Math.max(0, score);
}

/**
 * Score Tatwa match for morning births
 */
function scoreTatwaMatch(
  candidate: CandidateAnalysis,
  context: ScannerContext,
  redFlags: string[]
): number {
  if (!context.sunriseTime) return 70;

  try {
    const tatwaResult = calculateTatwaAtTime(context.sunriseTime, candidate.time);
    const minutesSinceSunrise = (candidate.time.getTime() - context.sunriseTime.getTime()) / 60000;

    if (minutesSinceSunrise > 0 && minutesSinceSunrise < FULL_CYCLE_MINUTES) {
      return 90;
    }

    if (minutesSinceSunrise < -30) {
      redFlags.push('Birth significantly before sunrise - verify time');
      return 50;
    }

    return 70;
  } catch {
    return 70;
  }
}

function scoreKalachakraMatch(
  candidate: CandidateAnalysis,
  context: ScannerContext
): number {
  try {
    const moonLong = candidate.ephemeris?.planets?.moon?.longitude;
    if (!moonLong) return 50;

    const kalachakraPeriods = Kalachakra.calculate(moonLong, candidate.time);

    const events = context.scoredEvents.map(e => ({
      id: e.id,
      date: e.eventDate,
      category: e.category
    }));

    return Kalachakra.score(kalachakraPeriods, events);
  } catch {
    return 50;
  }
}

function scoreShadbalaMatch(candidate: CandidateAnalysis): number {
  try {
    if (!candidate.ephemeris) return 50;

    const shadbalaResult = Shadbala.calculate(candidate.ephemeris);
    const avgStrength = shadbalaResult.averageStrength;

    return Math.min(100, Math.max(0, avgStrength));
  } catch {
    return 50;
  }
}

function scoreNadiMatch(
  candidate: CandidateAnalysis,
  context: ScannerContext
): number {
  try {
    if (!candidate.ephemeris) return 50;

    const nadiData = NadiAmsha.calculateAll(candidate.ephemeris);

    const events = context.scoredEvents.map(e => ({
      category: e.category
    }));

    return NadiAmsha.score(nadiData, events);
  } catch {
    return 50;
  }
}

function calculateAverageScore(scores: number[]): number {
  if (scores.length === 0) return 50;
  return scores.reduce((a, b) => a + b, 0) / scores.length;
}

function getPlanetHouse(planetName: string, ephemeris: any): number {
  const planet = ephemeris.planets?.[planetName.toLowerCase()];
  return planet?.house || 0;
}

function normalizeTransitDateLiteral(rawEventDate: unknown, fallbackDate: Date): string {
  if (typeof rawEventDate === 'string' && rawEventDate.trim()) {
    return rawEventDate;
  }
  if (rawEventDate instanceof Date && !Number.isNaN(rawEventDate.getTime())) {
    return rawEventDate.toISOString().slice(0, 10);
  }
  return fallbackDate.toISOString().slice(0, 10);
}

function parseTime(timeStr: string, dateStr: string, timezone: string | number): Date {
  if (!timeStr || !dateStr) {
    throw new Error('Missing time or date string for parsing');
  }
  return convertToUTC(dateStr, timeStr, timezone);
}

function formatTimeString(date: Date, timezone: string | number): string {
  const hours = date.getUTCHours().toString().padStart(2, '0');
  const minutes = date.getUTCMinutes().toString().padStart(2, '0');
  const seconds = date.getUTCSeconds().toString().padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}

function determineConfidenceLevel(
  overallScore: number,
  methodScores: MethodScores,
  redFlags: string[]
): 'GOD_TIER' | 'VERY_HIGH' | 'HIGH' | 'MEDIUM' | 'LOW' {
  const scores = Object.values(methodScores);
  const maxScore = Math.max(...scores);
  const minScore = Math.min(...scores);

  if (redFlags.length >= 3) return 'LOW';
  if (maxScore - minScore > 40) return 'MEDIUM';

  if (overallScore >= 90 && scores.every(s => s >= 80)) return 'GOD_TIER';
  if (overallScore >= 85 && scores.every(s => s >= 70)) return 'VERY_HIGH';
  if (overallScore >= 75 && scores.every(s => s >= 60)) return 'HIGH';
  if (overallScore >= 60) return 'MEDIUM';

  return 'LOW';
}

function calculateMarginOfError(
  methodScores: MethodScores,
  redFlags: string[],
  boundarySafety: any
): number {
  let baseError = 60;

  if (methodScores.kp >= 80) baseError -= 20;
  if (methodScores.vimshottari >= 80) baseError -= 15;
  if (methodScores.varga >= 80) baseError -= 10;
  if (methodScores.boundary >= 80) baseError -= 10;

  baseError += redFlags.length * 10;

  if (boundarySafety?.isDangerous) baseError += 30;

  return Math.max(3, Math.min(300, baseError));
}

function extractKeyEvidence(
  candidate: CandidateAnalysis,
  methodScores: MethodScores,
  eventMatches: any[],
  evidence: string[]
): void {
  if (methodScores.vimshottari >= 80) {
    evidence.push('Strong Vimshottari Dasha correlation');
  }
  if (methodScores.kp >= 80) {
    evidence.push('KP Sub-lords match event timing');
  }
  if (methodScores.varga >= 80) {
    evidence.push('Divisional charts support events');
  }
  if (methodScores.transit >= 80) {
    evidence.push('Double transit activation at events');
  }

  const topMatches = eventMatches
    .filter(m => m.score >= 70)
    .slice(0, 3);

  for (const match of topMatches) {
    evidence.push(`${match.eventType}: ${match.dashaLord} dasha matches`);
  }

  const ascendant = candidate.ephemeris?.ascendant?.sign;
  if (ascendant) {
    evidence.push(`Lagna: ${ascendant}`);
  }
}

function generateFinalRecommendations(
  best: CandidateScore,
  context: ScannerContext,
  recommendations: string[]
): void {
  if (best.confidenceLevel === 'GOD_TIER' || best.confidenceLevel === 'VERY_HIGH') {
    recommendations.push('High confidence result - proceed with confidence');
  } else if (best.confidenceLevel === 'HIGH') {
    recommendations.push('Good result - minor verification recommended');
  } else if (best.confidenceLevel === 'MEDIUM') {
    recommendations.push('Moderate confidence - consider additional events');
  } else {
    recommendations.push('Low confidence - provide more documented events');
  }

  if (best.redFlags!.length > 0) {
    recommendations.push(`Note: ${best.redFlags![0]}`);
  }

  if (best.marginOfErrorSeconds! > 60) {
    recommendations.push(`Margin of error: ±${Math.round(best.marginOfErrorSeconds! / 60)} minutes`);
  } else {
    recommendations.push(`Margin of error: ±${best.marginOfErrorSeconds} seconds`);
  }
}


export const WindowScanner = {
  scan: scanBirthTimeWindow,
  generateCandidates,
  scoreCandidate
};
