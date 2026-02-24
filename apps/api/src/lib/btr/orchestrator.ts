/**
 * Professional BTR Orchestrator
 *
 * Main entry point that integrates all BTR enhancement modules:
 * - Window Scanner: Iterative time grid analysis
 * - Tatwa Shuddhi: Element-based correction for morning births
 * - Transit Analyzer: Double transit verification
 * - Event Scorer: Confidence-weighted event scoring
 *
 * This orchestrator provides a unified API for birth time rectification
 * with production-grade accuracy and reliability.
 */

import { WindowScanner, ScannerInput } from './window-scanner.js';
import { TatwaShuddhi, TatwaCorrectionResult } from './tatwa-shuddhi.js';
import { TransitAnalyzer, ComprehensiveTransitResult } from './transit-analyzer.js';
import { EventScorer, ScoredEvent, EventScoreSummary } from './event-scorer.js';
import { calculateSunrise, calculateEphemeris } from '../ephemeris.js';
import {
  RectificationResult,
  CandidateScore,
  MethodScores,
  ConfidenceLevel,
  BtrEvent,
  ForensicProfile,
  TatwaType,
  DoshaType,
  ScanConfiguration,
  DEFAULT_SCAN_CONFIG
} from '@ai-pandit/shared';
import { logger } from '../logger.js';

export interface RectificationInput {
  birthDate: string;
  tentativeTime: string;
  latitude: number;
  longitude: number;
  timezone: string | number;
  events: BtrEvent[];
  forensicProfile?: ForensicProfile;
  knownTatwa?: TatwaType;
  timeRangeMinutes?: number;
  config?: Partial<ScanConfiguration>;
}

export interface RectificationContext {
  sunriseTime: Date | null;
  scoredEvents: ScoredEvent[];
  eventSummary: EventScoreSummary;
  prakritiTatwaMatch: TatwaType[] | null;
}

export interface DetailedResult extends RectificationResult {
  tatwaAnalysis?: TatwaCorrectionResult;
  transitAnalysis?: Map<string, ComprehensiveTransitResult>;
  eventAnalysis: EventScoreSummary;
  context: RectificationContext;
}

/**
 * Main rectification function - Professional BTR
 */
export async function rectifyBirthTime(input: RectificationInput): Promise<DetailedResult> {
  const startTime = Date.now();
  const errors: string[] = [];

  try {
    const context = await buildContext(input);

    const scannerInput: ScannerInput = {
      birthDate: input.birthDate,
      tentativeTime: input.tentativeTime,
      latitude: input.latitude,
      longitude: input.longitude,
      timezone: input.timezone,
      events: input.events,
      rangeMinutes: input.timeRangeMinutes || 30,
      config: input.config,
      knownTatwa: input.knownTatwa
    };

    if (context.prakritiTatwaMatch && !input.knownTatwa && context.sunriseTime) {
      const tatwaResult = TatwaShuddhi.findCorrections({
        sunriseTime: context.sunriseTime,
        birthTime: parseBirthTime(input.tentativeTime, input.birthDate, input.timezone),
        knownPrakriti: input.forensicProfile?.prakriti?.dominant
      });

      if (tatwaResult.correctionWindows.length > 0) {
        const bestWindow = tatwaResult.correctionWindows[0];
        const midTime = new Date(
          (bestWindow.startTime.getTime() + bestWindow.endTime.getTime()) / 2
        );
        scannerInput.knownTatwa = bestWindow.tatwa;
        scannerInput.rangeMinutes = Math.min(
          scannerInput.rangeMinutes || 30,
          15
        );
        logger.info('[BTR] Tatwa-based time narrowing applied', {
          tatwa: bestWindow.tatwa,
          confidence: bestWindow.confidence
        });
      }
    }

    const scanResult = await WindowScanner.scan(scannerInput);

    if (!scanResult.success || !scanResult.bestCandidate) {
      return buildFailedResult(input, context, scanResult.errors, startTime);
    }

    const transitAnalysis = await buildTransitAnalysis(
      input,
      scanResult.bestCandidate,
      context.scoredEvents
    );

    const result = buildDetailedResult(
      scanResult.bestCandidate,
      scanResult.candidates,
      input,
      context,
      transitAnalysis,
      startTime
    );

    return result;

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('[BTR] Rectification failed', error);
    errors.push(errorMessage);

    return buildFailedResult(input, await buildContext(input), errors, startTime);
  }
}

/**
 * Quick rectification for simple use cases
 */
export async function quickRectify(
  birthDate: string,
  tentativeTime: string,
  latitude: number,
  longitude: number,
  timezone: string | number,
  events: Array<{
    category: string;
    date: string;
    source?: 'document' | 'memory' | 'approximate';
  }>
): Promise<{
  rectifiedTime: string;
  confidence: ConfidenceLevel;
  marginSeconds: number;
}> {
  const btrEvents: BtrEvent[] = events.map((e, i) => ({
    id: `evt_${i}`,
    type: e.category,
    category: e.category,
    eventDate: new Date(e.date),
    datePrecision: 'exact_date' as const,
    description: `${e.category} event`,
    impact: 'moderate' as const,
    confidence: {
      level: e.source === 'document' ? 'high' : e.source === 'memory' ? 'medium' : 'low',
      source: e.source || 'memory',
      datePrecision: 'exact_date' as const,
      weight: e.source === 'document' ? 3 : e.source === 'memory' ? 1.5 : 0.5,
      reliabilityScore: e.source === 'document' ? 0.95 : 0.70
    },
    eventHouse: 1,
    significators: []
  }));

  const result = await rectifyBirthTime({
    birthDate,
    tentativeTime,
    latitude,
    longitude,
    timezone,
    events: btrEvents
  });

  return {
    rectifiedTime: result.rectifiedTime,
    confidence: result.confidenceLevel || 'LOW',
    marginSeconds: result.marginOfErrorSeconds || 0
  };
}

/**
 * Validate events before rectification
 */
export function validateEvents(events: BtrEvent[]): {
  valid: boolean;
  issues: string[];
  suggestions: string[];
} {
  const scored = EventScorer.scoreEvents(events);
  const validation = EventScorer.validateCollection(scored);

  return {
    valid: validation.isValid,
    issues: validation.issues,
    suggestions: validation.suggestions
  };
}

/**
 * Get Tatwa information for a birth time
 */
export async function getTatwaInfo(
  birthDate: string,
  birthTime: string,
  latitude: number,
  longitude: number,
  timezone: string | number
): Promise<{
  currentTatwa: string;
  element: string;
  windows: Array<{
    startTime: string;
    endTime: string;
    tatwa: string;
  }>;
}> {
  try {
    const sunrise = await calculateSunrise(birthDate, latitude, longitude, timezone);
    const birthDate_ = parseBirthTime(birthTime, birthDate, timezone);

    const result = TatwaShuddhi.calculate(sunrise, birthDate_);
    const dailyWindows = TatwaShuddhi.getDailyWindows(sunrise, 6);

    return {
      currentTatwa: result.tatwa,
      element: result.element,
      windows: dailyWindows.slice(0, 12).map(w => ({
        startTime: w.startTime.toISOString(),
        endTime: w.endTime.toISOString(),
        tatwa: w.tatwa
      }))
    };
  } catch (error) {
    logger.error('[BTR] Failed to get Tatwa info', error);
    return {
      currentTatwa: 'unknown',
      element: 'unknown',
      windows: []
    };
  }
}

/**
 * Analyze transits for a birth chart
 */
export async function analyzeTransits(
  birthDate: string,
  birthTime: string,
  latitude: number,
  longitude: number,
  timezone: string | number,
  events: Array<{ category: string; date: string }>
): Promise<Map<string, ComprehensiveTransitResult>> {
  try {
    const ephemeris = await calculateEphemeris(
      birthDate,
      birthTime,
      latitude,
      longitude,
      timezone
    );

    return await TransitAnalyzer.batchAnalyze(
      events.map(e => ({ ...e, time: '12:00' })),
      {
        latitude,
        longitude,
        timezone,
        ascendantSign: ephemeris.ascendant.sign
      }
    );
  } catch (error) {
    logger.error('[BTR] Transit analysis failed', error);
    return new Map();
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// INTERNAL FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

async function buildContext(input: RectificationInput): Promise<RectificationContext> {
  let sunriseTime: Date | null = null;

  try {
    sunriseTime = await calculateSunrise(
      input.birthDate,
      input.latitude,
      input.longitude,
      input.timezone
    );
  } catch (e) {
    logger.warn('[BTR] Could not calculate sunrise', e);
  }

  const scoredEvents = EventScorer.scoreEvents(input.events);
  const eventSummary = EventScorer.generateSummary(scoredEvents);

  let prakritiTatwaMatch: TatwaType[] | null = null;
  if (input.forensicProfile?.prakriti?.dominant) {
    prakritiTatwaMatch = TatwaShuddhi.inferFromPrakriti(
      input.forensicProfile.prakriti.dominant
    );
  }

  return {
    sunriseTime,
    scoredEvents,
    eventSummary,
    prakritiTatwaMatch
  };
}

async function buildTransitAnalysis(
  input: RectificationInput,
  bestCandidate: CandidateScore,
  scoredEvents: ScoredEvent[]
): Promise<Map<string, ComprehensiveTransitResult>> {
  try {
    return await TransitAnalyzer.batchAnalyze(
      scoredEvents.map(e => ({
        date: e.eventDate.toISOString().split('T')[0],
        category: e.category
      })),
      {
        latitude: input.latitude,
        longitude: input.longitude,
        timezone: input.timezone,
        ascendantSign: bestCandidate.timeString || 'Unknown'
      }
    );
  } catch (e) {
    logger.warn('[BTR] Transit analysis failed', e);
    return new Map();
  }
}

function buildDetailedResult(
  bestCandidate: CandidateScore,
  allCandidates: CandidateScore[],
  input: RectificationInput,
  context: RectificationContext,
  transitAnalysis: Map<string, ComprehensiveTransitResult>,
  startTime: number
): DetailedResult {
  const evidence = {
    primary: bestCandidate.keyEvidence?.slice(0, 3) || [],
    secondary: bestCandidate.keyEvidence?.slice(3) || [],
    warnings: bestCandidate.redFlags || []
  };

  const recommendations = generateRecommendations(bestCandidate, context);

  return {
    rectifiedTime: bestCandidate.timeString || '',
    rectifiedDate: (bestCandidate.time as Date),
    confidenceLevel: (bestCandidate.confidenceLevel || 'LOW') as ConfidenceLevel,
    confidencePercentage: Math.round(bestCandidate.overallScore || 0),
    marginOfErrorSeconds: bestCandidate.marginOfErrorSeconds || 0,
    methodConsensus: bestCandidate.methodScores || {},
    evidence,
    candidateAnalysis: allCandidates.slice(0, 10),
    recommendations,
    processingTimeMs: Date.now() - startTime,
    eventAnalysis: context.eventSummary,
    transitAnalysis,
    context
  };
}

function buildFailedResult(
  input: RectificationInput,
  context: RectificationContext,
  errors: string[],
  startTime: number
): DetailedResult {
  return {
    rectifiedTime: input.tentativeTime,
    rectifiedDate: parseBirthTime(input.tentativeTime, input.birthDate, input.timezone),
    confidenceLevel: 'LOW',
    confidencePercentage: 0,
    marginOfErrorSeconds: 3600,
    methodConsensus: {
      vimshottari: 0, yogini: 0, chara: 0, kalachakra: 0,
      kp: 0, varga: 0, transit: 0, forensic: 0, boundary: 0, tatwa: 0,
      shadbala: 0, nadi: 0, spouseD9: 0
    },
    evidence: {
      primary: [],
      secondary: [],
      warnings: errors
    },
    candidateAnalysis: [],
    recommendations: ['Rectification failed - please check input data'],
    processingTimeMs: Date.now() - startTime,
    eventAnalysis: context.eventSummary,
    context
  };
}

function parseBirthTime(timeStr: string, dateStr: string, timezone: string | number): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hour, minute, second = 0] = timeStr.split(':').map(Number);

  const offset = typeof timezone === 'number' ? timezone : parseFloat(timezone) || 0;

  return new Date(Date.UTC(year, month - 1, day, hour, minute, second) - offset * 3600000);
}

function generateRecommendations(
  result: CandidateScore,
  context: RectificationContext
): string[] {
  const recs: string[] = [];

  if (result.confidenceLevel === 'GOD_TIER') {
    recs.push('Excellent result - high confidence birth time');
  } else if (result.confidenceLevel === 'VERY_HIGH') {
    recs.push('Very good result - minor verification suggested');
  } else if (result.confidenceLevel === 'HIGH') {
    recs.push('Good result - consider family verification');
  } else if (result.confidenceLevel === 'MEDIUM') {
    recs.push('Moderate confidence - add more documented events');
  } else {
    recs.push('Low confidence - provide additional life events');
  }

  if ((result.methodScores?.vimshottari || 0) < 60) {
    recs.push('Dasha correlation weak - verify event dates');
  }
  if ((result.methodScores?.kp || 0) < 60) {
    recs.push('KP analysis inconclusive - consider exact event times');
  }
  if ((result.methodScores?.transit || 0) < 60) {
    recs.push('Transit verification needed - check event locations');
  }

  if (context.eventSummary.totalEvents < 7) {
    recs.push('Add more life events for improved accuracy');
  }

  if (result.redFlags && result.redFlags.length > 0) {
    recs.push(`Note: ${result.redFlags[0]}`);
  }

  return recs;
}

export const ProfessionalBTR = {
  rectify: rectifyBirthTime,
  quickRectify,
  validateEvents,
  getTatwaInfo,
  analyzeTransits
};
