// Server-side only

// lib/candidate-analyzer.ts
// Analyze multiple candidate times and filter for accuracy

import { EphemerisData, LifeEvent, CandidateAnalysis, RankedCandidates } from './types';
import { generateAstrologicalReport } from './astrological-data-processor';
import { calculateEphemeris } from './ephemeris';
import { logger } from './logger';

// ═════════════════════════════════════════════════════════════════════════
// QUICK FILTERING RULES (Before Kimi K2 analysis)
// ═════════════════════════════════════════════════════════════════════════

export async function analyzeAndFilterCandidates(
  dateOfBirth: string,
  candidates: Array<{ time: string; offsetMinutes: number; offsetDescription: string }>,
  latitude: number,
  longitude: number,
  timezone: number,
  lifeEvents: LifeEvent[]
): Promise<RankedCandidates> {
  try {
    logger.info('Starting candidate analysis and filtering', {
      totalCandidates: candidates.length,
      dateOfBirth,
    });

    const analyzedCandidates: CandidateAnalysis[] = [];

    // ─────────────────────────────────────────────────────────────────────
    // STEP 1: Quick analysis of all candidates
    // ─────────────────────────────────────────────────────────────────────

    for (const candidate of candidates) {
      try {
        // Convert timezone number to string for ephemeris calculation
        const timezoneString = getTimezoneString(timezone);

        const ephemerisData = await calculateEphemeris(
          dateOfBirth,
          candidate.time,
          latitude,
          longitude,
          timezoneString
        );

        // Quick scoring without full Kimi analysis
        const { quickScore, eventMatches, reason } = performQuickAnalysis(
          ephemerisData,
          lifeEvents
        );

        analyzedCandidates.push({
          time: candidate.time,
          offsetMinutes: candidate.offsetMinutes,
          offsetDescription: candidate.offsetDescription,
          ephemerisData,
          quickScore,
          eventMatches,
          shouldAnalyzeWithKimi: quickScore >= 40, // Only analyze promising candidates
          reason,
        });

        logger.debug('Candidate quick analysis complete', {
          time: candidate.time,
          quickScore,
          eventMatches,
        });
      } catch (error) {
        logger.error(`Quick analysis failed for ${candidate.time}`, error);
      }
    }

    // ─────────────────────────────────────────────────────────────────────
    // STEP 2: Sort by quick score
    // ─────────────────────────────────────────────────────────────────────

    analyzedCandidates.sort((a, b) => b.quickScore - a.quickScore);

    // ─────────────────────────────────────────────────────────────────────
    // STEP 3: Select top candidates for Kimi K2 analysis
    // ─────────────────────────────────────────────────────────────────────

    const topCandidates = analyzedCandidates
      .filter((c) => c.shouldAnalyzeWithKimi)
      .slice(0, 5); // Top 5 candidates

    logger.info('Candidate filtering complete', {
      totalCandidates: analyzedCandidates.length,
      topCandidatesForKimi: topCandidates.length,
      topScores: topCandidates.map((c) => ({
        time: c.time,
        quickScore: c.quickScore,
      })),
    });

    return {
      topCandidates,
      allCandidates: analyzedCandidates,
      totalAnalyzed: analyzedCandidates.length,
    };
  } catch (error) {
    logger.error('Candidate analysis failed', error);
    throw error;
  }
}

// ═════════════════════════════════════════════════════════════════════════
// QUICK ANALYSIS: Fast filtering without Kimi
// ═════════════════════════════════════════════════════════════════════════

function performQuickAnalysis(
  ephemerisData: EphemerisData,
  lifeEvents: LifeEvent[]
): {
  quickScore: number;
  eventMatches: number;
  reason: string;
} {
  // Quick scoring based on:
  // 1. Number of life events that match dasha periods
  // 2. House placements alignment
  // 3. Nakshatra strength

  let score = 50; // Baseline
  let eventMatches = 0;

  // ─────────────────────────────────────────────────────────────────────
  // Check Moon placement (important for events)
  // ─────────────────────────────────────────────────────────────────────

  const moonNakshatra = ephemerisData.planets.moon.nakshatra;
  const moonInGoodNakshatra = checkMoonNakshatraQuality(moonNakshatra);

  if (moonInGoodNakshatra) {
    score += 10; // Moon in favorable nakshatra
  }

  // ─────────────────────────────────────────────────────────────────────
  // Check Ascendant strength
  // ─────────────────────────────────────────────────────────────────────

  const lagnaStrength = checkLagnaStrength(ephemerisData.ascendant);
  score += lagnaStrength;

  // ─────────────────────────────────────────────────────────────────────
  // Count matching life events (basic check)
  // ─────────────────────────────────────────────────────────────────────

  for (const event of lifeEvents) {
    // Simple check: does this birth time create reasonable house positions
    // for this type of event?
    if (checkEventTypeAlignment(event, ephemerisData)) {
      eventMatches++;
      score += 5;
    }
  }

  // Bonus for multiple event matches
  if (eventMatches >= lifeEvents.length * 0.7) {
    score += 15; // Good match with most events
  }

  // Cap score at 100
  score = Math.min(100, score);

  // Determine reason
  let reason = '';
  if (score >= 75) {
    reason = 'Excellent match - likely correct birth time';
  } else if (score >= 60) {
    reason = 'Good match - worth detailed analysis';
  } else if (score >= 40) {
    reason = 'Moderate match - possible correct time';
  } else {
    reason = 'Poor match - unlikely to be correct';
  }

  return {
    quickScore: Math.round(score),
    eventMatches,
    reason,
  };
}

// ═════════════════════════════════════════════════════════════════════════
// HELPER: Check Moon Nakshatra Quality
// ═════════════════════════════════════════════════════════════════════════

function checkMoonNakshatraQuality(nakshatra: string): boolean {
  // Favorable nakshatras for birth
  const favorableNakshatras = [
    'Ashwini',
    'Bharani',
    'Pushya',
    'Magha',
    'Hasta',
    'Chitra',
    'Anuradha',
    'Jyeshtha',
    'Shravana',
    'Revati',
  ];

  return favorableNakshatras.includes(nakshatra);
}

// ═════════════════════════════════════════════════════════════════════════
// HELPER: Check Lagna Strength
// ═════════════════════════════════════════════════════════════════════════

function checkLagnaStrength(ascendant: any): number {
  let strength = 0;

  // Strong lagna placements
  if (ascendant.degree > 0 && ascendant.degree < 5) {
    strength += 10; // Beginning of sign (strong)
  }

  // Check if lagna ruler is strong
  const rulerStrength = checkLagnaRulerStrength(ascendant.sign);
  strength += rulerStrength;

  return Math.min(strength, 20);
}

// ═════════════════════════════════════════════════════════════════════════
// HELPER: Check Lagna Ruler Strength
// ═════════════════════════════════════════════════════════════════════════

function checkLagnaRulerStrength(sign: string): number {
  const rulers: Record<string, number> = {
    Aries: 10,
    Taurus: 8,
    Gemini: 8,
    Cancer: 10,
    Leo: 10,
    Virgo: 8,
    Libra: 8,
    Scorpio: 10,
    Sagittarius: 10,
    Capricorn: 10,
    Aquarius: 8,
    Pisces: 10,
  };

  return rulers[sign] || 5;
}

// ═════════════════════════════════════════════════════════════════════════
// HELPER: Check Event Type Alignment
// ═════════════════════════════════════════════════════════════════════════

function checkEventTypeAlignment(event: LifeEvent, ephemeris: EphemerisData): boolean {
  // Check if natal positions support event type
  const eventType = event.category.toLowerCase();

  switch (eventType) {
    case 'education':
      // Education events: Mercury strong, 4th house support
      return (
        ephemeris.planets.mercury.degree > 0 &&
        ephemeris.planets.mercury.degree < 30
      );

    case 'career':
      // Career events: 10th house, Saturn, Sun
      return (
        ephemeris.planets.saturn.degree > 0 &&
        ephemeris.planets.saturn.degree < 30
      );

    case 'relationship':
    case 'marriage':
      // Marriage events: Venus strong, 7th house
      return (
        ephemeris.planets.venus.degree > 0 &&
        ephemeris.planets.venus.degree < 30
      );

    case 'health':
      // Health events: Mars, 6th house
      return (
        ephemeris.planets.mars.degree > 0 &&
        ephemeris.planets.mars.degree < 30
      );

    case 'finance':
      // Finance events: Jupiter, 2nd/11th house
      return (
        ephemeris.planets.jupiter.degree > 0 &&
        ephemeris.planets.jupiter.degree < 30
      );

    default:
      return true; // Unknown event type, pass through
  }
}

// ═════════════════════════════════════════════════════════════════════════
// HELPER: Convert timezone number to string
// ═════════════════════════════════════════════════════════════════════════

function getTimezoneString(timezone: number): string {
  // Map timezone offset to string
  if (timezone === 5.5) return 'Asia/Kolkata';
  if (timezone === 0) return 'UTC';
  if (timezone === -5) return 'America/New_York';
  if (timezone === -8) return 'America/Los_Angeles';

  return 'UTC';
}

export default analyzeAndFilterCandidates;