/**
 * Spouse D9 Verification Module
 *
 * Validates birth time accuracy through Navamsha (D9) cross-referencing
 * with spouse's birth chart. The D9 chart should reflect the spouse's
 * key positions.
 *
 * Key Principles:
 * - Spouse's Moon sign often matches native's D9 7th house sign
 * - Spouse's Venus position correlates with native's D7 (children)
 * - D9 Lagna should resonate with spouse's rising or Moon
 *
 * Reference: Vedic astrology synastry principles
 */

import { calculateEphemeris } from './ephemeris.js';
import { calculateD9 } from './advanced-btr-methods.js';
import { logger } from '../utils/logger.js';

const ZODIAC_SIGNS = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
];

export interface SpouseData {
  dateOfBirth: string;
  birthTime: string;
  latitude: number;
  longitude: number;
  timezone: string | number;
}

export interface SpouseChartPositions {
  lagna: { sign: string; degree: number; longitude: number };
  moon: { sign: string; degree: number; longitude: number };
  venus: { sign: string; degree: number; longitude: number };
  sun: { sign: string; degree: number; longitude: number };
  jupiter: { sign: string; degree: number; longitude: number };
  d9Lagna?: { sign: string; degree: number };
}

export interface D9VerificationResult {
  verified: boolean;
  score: number;
  matches: D9Match[];
  mismatches: D9Mismatch[];
  confidence: 'high' | 'medium' | 'low';
  recommendations: string[];
  details: string;
}

export interface D9Match {
  type: 'lagna' | 'moon' | 'venus' | 'sun' | 'jupiter' | 'd9';
  nativePosition: string;
  spousePosition: string;
  matchType: 'exact' | 'same_sign' | 'compatible_element' | 'trine';
  weight: number;
  description: string;
}

export interface D9Mismatch {
  type: string;
  nativePosition: string;
  expectedSpousePosition: string;
  actualSpousePosition: string;
  severity: 'critical' | 'major' | 'minor';
  description: string;
}

export interface NativeD9Positions {
  lagna: { sign: string; degree: number };
  seventhHouse: { sign: string; degree: number };
  venus: { sign: string; degree: number };
  moon: { sign: string; degree: number };
  jupiter: { sign: string; degree: number };
}

export async function calculateSpousePositions(
  spouseData: SpouseData
): Promise<SpouseChartPositions | null> {
  try {
    const ephemeris = await calculateEphemeris(
      spouseData.dateOfBirth,
      spouseData.birthTime,
      spouseData.latitude,
      spouseData.longitude,
      spouseData.timezone
    );
    
    const d9Lagna = calculateD9(ephemeris.ascendant.longitude);
    
    return {
      lagna: {
        sign: ephemeris.ascendant.sign,
        degree: ephemeris.ascendant.degree,
        longitude: ephemeris.ascendant.longitude
      },
      moon: {
        sign: ephemeris.planets.moon.sign,
        degree: ephemeris.planets.moon.degree,
        longitude: ephemeris.planets.moon.longitude
      },
      venus: {
        sign: ephemeris.planets.venus.sign,
        degree: ephemeris.planets.venus.degree,
        longitude: ephemeris.planets.venus.longitude
      },
      sun: {
        sign: ephemeris.planets.sun.sign,
        degree: ephemeris.planets.sun.degree,
        longitude: ephemeris.planets.sun.longitude
      },
      jupiter: {
        sign: ephemeris.planets.jupiter.sign,
        degree: ephemeris.planets.jupiter.degree,
        longitude: ephemeris.planets.jupiter.longitude
      },
      d9Lagna: {
        sign: d9Lagna.sign,
        degree: d9Lagna.degree
      }
    };
  } catch (error) {
    logger.error('Failed to calculate spouse positions', error, { context: 'spouse-d9-verification' });
    return null;
  }
}

export function extractNativeD9Positions(
  nativeEphemeris: any
): NativeD9Positions {
  const d9Lagna = calculateD9(nativeEphemeris.ascendant.longitude);
  const d9Venus = calculateD9(nativeEphemeris.planets.venus.longitude);
  const d9Moon = calculateD9(nativeEphemeris.planets.moon.longitude);
  const d9Jupiter = calculateD9(nativeEphemeris.planets.jupiter.longitude);
  
  const lagnaSignIndex = ZODIAC_SIGNS.indexOf(d9Lagna.sign);
  const seventhSignIndex = (lagnaSignIndex + 6) % 12;
  
  return {
    lagna: d9Lagna,
    seventhHouse: {
      sign: ZODIAC_SIGNS[seventhSignIndex],
      degree: 0
    },
    venus: d9Venus,
    moon: d9Moon,
    jupiter: d9Jupiter
  };
}

export function verifyD9WithSpouse(
  nativeD9: NativeD9Positions,
  spousePositions: SpouseChartPositions
): D9VerificationResult {
  const matches: D9Match[] = [];
  const mismatches: D9Mismatch[] = [];
  let totalScore = 0;
  let totalWeight = 0;
  
  const primaryMatch = checkPrimaryMatch(nativeD9, spousePositions);
  if (primaryMatch) {
    matches.push(primaryMatch);
    totalScore += primaryMatch.weight * 100;
    totalWeight += primaryMatch.weight;
  }
  
  const moonMatch = checkMoonMatch(nativeD9, spousePositions);
  if (moonMatch) {
    matches.push(moonMatch);
    totalScore += moonMatch.weight * 80;
    totalWeight += moonMatch.weight;
  }
  
  const venusMatch = checkVenusMatch(nativeD9, spousePositions);
  if (venusMatch) {
    matches.push(venusMatch);
    totalScore += venusMatch.weight * 70;
    totalWeight += venusMatch.weight;
  }
  
  const jupiterMatch = checkJupiterMatch(nativeD9, spousePositions);
  if (jupiterMatch) {
    matches.push(jupiterMatch);
    totalScore += jupiterMatch.weight * 60;
    totalWeight += jupiterMatch.weight;
  }
  
  const d9D9Match = checkD9toD9Match(nativeD9, spousePositions);
  if (d9D9Match) {
    matches.push(d9D9Match);
    totalScore += d9D9Match.weight * 90;
    totalWeight += d9D9Match.weight;
  }
  
  checkMismatches(nativeD9, spousePositions, mismatches);
  
  const finalScore = totalWeight > 0 ? Math.round(totalScore / totalWeight) : 50;
  
  let confidence: 'high' | 'medium' | 'low';
  if (finalScore >= 75 && matches.length >= 3) confidence = 'high';
  else if (finalScore >= 60 && matches.length >= 2) confidence = 'medium';
  else confidence = 'low';
  
  const recommendations = generateRecommendations(matches, mismatches, finalScore);
  
  const details = generateDetailsString(matches, mismatches, finalScore);
  
  return {
    verified: finalScore >= 60 && mismatches.filter(m => m.severity === 'critical').length === 0,
    score: finalScore,
    matches,
    mismatches,
    confidence,
    recommendations,
    details
  };
}

function checkPrimaryMatch(nativeD9: NativeD9Positions, spouse: SpouseChartPositions): D9Match | null {
  const d9Seventh = nativeD9.seventhHouse.sign;
  const spouseLagna = spouse.lagna.sign;
  const spouseMoon = spouse.moon.sign;
  
  if (d9Seventh === spouseLagna) {
    return {
      type: 'lagna',
      nativePosition: `D9 7th House: ${d9Seventh}`,
      spousePosition: `Spouse Lagna: ${spouseLagna}`,
      matchType: 'exact',
      weight: 3.0,
      description: 'EXACT MATCH: Spouse Lagna matches D9 7th house sign!'
    };
  }
  
  if (d9Seventh === spouseMoon) {
    return {
      type: 'moon',
      nativePosition: `D9 7th House: ${d9Seventh}`,
      spousePosition: `Spouse Moon: ${spouseMoon}`,
      matchType: 'same_sign',
      weight: 2.5,
      description: 'STRONG MATCH: Spouse Moon matches D9 7th house sign'
    };
  }
  
  if (areTrine(d9Seventh, spouseLagna)) {
    return {
      type: 'lagna',
      nativePosition: `D9 7th House: ${d9Seventh}`,
      spousePosition: `Spouse Lagna: ${spouseLagna}`,
      matchType: 'trine',
      weight: 1.5,
      description: 'TRINE MATCH: Spouse Lagna trine to D9 7th house'
    };
  }
  
  if (sameElement(d9Seventh, spouseLagna)) {
    return {
      type: 'lagna',
      nativePosition: `D9 7th House: ${d9Seventh}`,
      spousePosition: `Spouse Lagna: ${spouseLagna}`,
      matchType: 'compatible_element',
      weight: 1.0,
      description: 'ELEMENT MATCH: Spouse Lagna shares element with D9 7th house'
    };
  }
  
  return null;
}

function checkMoonMatch(nativeD9: NativeD9Positions, spouse: SpouseChartPositions): D9Match | null {
  const d9Moon = nativeD9.moon.sign;
  const spouseMoon = spouse.moon.sign;
  
  if (d9Moon === spouseMoon) {
    return {
      type: 'moon',
      nativePosition: `D9 Moon: ${d9Moon}`,
      spousePosition: `Spouse Moon: ${spouseMoon}`,
      matchType: 'exact',
      weight: 2.0,
      description: 'Moon signs match in D9 - emotional compatibility confirmed'
    };
  }
  
  if (areTrine(d9Moon, spouseMoon)) {
    return {
      type: 'moon',
      nativePosition: `D9 Moon: ${d9Moon}`,
      spousePosition: `Spouse Moon: ${spouseMoon}`,
      matchType: 'trine',
      weight: 1.2,
      description: 'D9 Moon trine spouse Moon - good emotional bond'
    };
  }
  
  return null;
}

function checkVenusMatch(nativeD9: NativeD9Positions, spouse: SpouseChartPositions): D9Match | null {
  const d9Venus = nativeD9.venus.sign;
  const spouseVenus = spouse.venus.sign;
  
  if (d9Venus === spouseVenus) {
    return {
      type: 'venus',
      nativePosition: `D9 Venus: ${d9Venus}`,
      spousePosition: `Spouse Venus: ${spouseVenus}`,
      matchType: 'exact',
      weight: 1.5,
      description: 'Venus signs match - love and values alignment'
    };
  }
  
  if (sameElement(d9Venus, spouseVenus)) {
    return {
      type: 'venus',
      nativePosition: `D9 Venus: ${d9Venus}`,
      spousePosition: `Spouse Venus: ${spouseVenus}`,
      matchType: 'compatible_element',
      weight: 0.8,
      description: 'Venus elements compatible'
    };
  }
  
  return null;
}

function checkJupiterMatch(nativeD9: NativeD9Positions, spouse: SpouseChartPositions): D9Match | null {
  const d9Jupiter = nativeD9.jupiter.sign;
  const spouseJupiter = spouse.jupiter.sign;
  
  if (d9Jupiter === spouseJupiter) {
    return {
      type: 'jupiter',
      nativePosition: `D9 Jupiter: ${d9Jupiter}`,
      spousePosition: `Spouse Jupiter: ${spouseJupiter}`,
      matchType: 'exact',
      weight: 1.0,
      description: 'Jupiter signs match - dharma and growth alignment'
    };
  }
  
  return null;
}

function checkD9toD9Match(nativeD9: NativeD9Positions, spouse: SpouseChartPositions): D9Match | null {
  if (!spouse.d9Lagna) return null;
  
  const nativeD9Lagna = nativeD9.lagna.sign;
  const spouseD9Lagna = spouse.d9Lagna.sign;
  
  if (nativeD9Lagna === spouseD9Lagna) {
    return {
      type: 'd9',
      nativePosition: `D9 Lagna: ${nativeD9Lagna}`,
      spousePosition: `Spouse D9 Lagna: ${spouseD9Lagna}`,
      matchType: 'exact',
      weight: 2.5,
      description: 'EXCELLENT: Both have same D9 Lagna - destined union'
    };
  }
  
  if (areTrine(nativeD9Lagna, spouseD9Lagna)) {
    return {
      type: 'd9',
      nativePosition: `D9 Lagna: ${nativeD9Lagna}`,
      spousePosition: `Spouse D9 Lagna: ${spouseD9Lagna}`,
      matchType: 'trine',
      weight: 1.8,
      description: 'D9 Lagnas in trine - harmonious dharma path'
    };
  }
  
  return null;
}

function checkMismatches(
  nativeD9: NativeD9Positions,
  spouse: SpouseChartPositions,
  mismatches: D9Mismatch[]
): void {
  const d9Seventh = nativeD9.seventhHouse.sign;
  const spouseLagna = spouse.lagna.sign;
  
  if (areOpposite(d9Seventh, spouseLagna)) {
    mismatches.push({
      type: 'lagna_opposition',
      nativePosition: `D9 7th House: ${d9Seventh}`,
      expectedSpousePosition: 'Trine or same element',
      actualSpousePosition: `Spouse Lagna: ${spouseLagna}`,
      severity: 'major',
      description: 'Spouse Lagna opposite to D9 7th house - challenging match'
    });
  }
  
  const d9Moon = nativeD9.moon.sign;
  const spouseMoon = spouse.moon.sign;
  
  if (areOpposite(d9Moon, spouseMoon)) {
    mismatches.push({
      type: 'moon_opposition',
      nativePosition: `D9 Moon: ${d9Moon}`,
      expectedSpousePosition: 'Trine or same sign',
      actualSpousePosition: `Spouse Moon: ${spouseMoon}`,
      severity: 'major',
      description: 'Moon signs opposite - emotional differences possible'
    });
  }
}

function areTrine(sign1: string, sign2: string): boolean {
  const idx1 = ZODIAC_SIGNS.indexOf(sign1);
  const idx2 = ZODIAC_SIGNS.indexOf(sign2);
  const diff = Math.abs(idx1 - idx2);
  return diff === 4 || diff === 8;
}

function areOpposite(sign1: string, sign2: string): boolean {
  const idx1 = ZODIAC_SIGNS.indexOf(sign1);
  const idx2 = ZODIAC_SIGNS.indexOf(sign2);
  return Math.abs(idx1 - idx2) === 6;
}

function sameElement(sign1: string, sign2: string): boolean {
  const elements: Record<string, string[]> = {
    fire: ['Aries', 'Leo', 'Sagittarius'],
    earth: ['Taurus', 'Virgo', 'Capricorn'],
    air: ['Gemini', 'Libra', 'Aquarius'],
    water: ['Cancer', 'Scorpio', 'Pisces']
  };
  
  for (const signs of Object.values(elements)) {
    if (signs.includes(sign1) && signs.includes(sign2)) return true;
  }
  return false;
}

function generateRecommendations(
  matches: D9Match[],
  mismatches: D9Mismatch[],
  score: number
): string[] {
  const recs: string[] = [];
  
  if (score >= 75) {
    recs.push('Excellent D9 verification - birth time highly reliable');
  } else if (score >= 60) {
    recs.push('Good D9 verification - birth time likely accurate');
  } else {
    recs.push('D9 verification weak - consider additional events for confirmation');
  }
  
  if (mismatches.some(m => m.severity === 'critical')) {
    recs.push('Critical mismatch found - verify spouse birth data');
  }
  
  if (matches.length >= 3) {
    recs.push('Multiple strong matches confirm relationship alignment');
  }
  
  return recs;
}

function generateDetailsString(
  matches: D9Match[],
  mismatches: D9Mismatch[],
  score: number
): string {
  const parts: string[] = [];
  
  parts.push(`D9 Verification Score: ${score}/100`);
  parts.push(`Matches found: ${matches.length}`);
  
  for (const match of matches.slice(0, 3)) {
    parts.push(`  - ${match.description}`);
  }
  
  if (mismatches.length > 0) {
    parts.push(`Mismatches: ${mismatches.length}`);
    for (const mismatch of mismatches) {
      parts.push(`  - ${mismatch.description}`);
    }
  }
  
  return parts.join('\n');
}

export async function performSpouseVerification(
  nativeEphemeris: any,
  spouseData: SpouseData
): Promise<D9VerificationResult> {
  const spousePositions = await calculateSpousePositions(spouseData);
  
  if (!spousePositions) {
    return {
      verified: false,
      score: 0,
      matches: [],
      mismatches: [],
      confidence: 'low',
      recommendations: ['Could not calculate spouse chart positions'],
      details: 'Spouse data calculation failed'
    };
  }
  
  const nativeD9 = extractNativeD9Positions(nativeEphemeris);
  return verifyD9WithSpouse(nativeD9, spousePositions);
}

export function formatVerificationResult(result: D9VerificationResult): string {
  const lines = [
    'D9 SPOUSE VERIFICATION RESULT',
    '='.repeat(40),
    `Score: ${result.score}/100`,
    `Confidence: ${result.confidence.toUpperCase()}`,
    `Verified: ${result.verified ? 'YES' : 'NO'}`,
    '',
    'MATCHES:'
  ];
  
  for (const match of result.matches) {
    lines.push(`  ✓ ${match.description}`);
  }
  
  if (result.mismatches.length > 0) {
    lines.push('', 'MISMATCHES:');
    for (const mismatch of result.mismatches) {
      lines.push(`  ✗ ${mismatch.description}`);
    }
  }
  
  lines.push('', 'RECOMMENDATIONS:');
  for (const rec of result.recommendations) {
    lines.push(`  • ${rec}`);
  }
  
  return lines.join('\n');
}

export const SpouseD9Verification = {
  calculateSpousePositions,
  extractNativeD9Positions,
  verify: verifyD9WithSpouse,
  performVerification: performSpouseVerification,
  formatResult: formatVerificationResult
};

// Legacy exports for backward compatibility
export { extractNativeD9Positions as _extractNativeD9Positions };
export { verifyD9WithSpouse as _verifyD9WithSpouse };
export { calculateSpousePositions as _calculateSpousePositions };
