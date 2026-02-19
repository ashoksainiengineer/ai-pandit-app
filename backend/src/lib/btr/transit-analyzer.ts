/**
 * Transit Analyzer Module
 *
 * Advanced transit analysis for birth time rectification.
 * Implements the Double Transit rule and comprehensive transit-event correlation.
 *
 * Key Concepts:
 * - Double Transit: When Saturn AND Jupiter both aspect a house, events manifest
 * - Parashari Aspects: Special aspects for Mars (4,8), Jupiter (5,9), Saturn (3,10)
 * - Rahu/Ketu Transit: Significant for transformation events
 */

import { calculateEphemeris, convertToUTC, calculateJulianDay } from '../ephemeris.js';
import { 
  TransitMatchResult, 
  PARASHARI_ASPECTS, 
  EVENT_HOUSE_MAP,
  ZODIAC_SIGNS 
} from './types.js';
import { logger } from '../logger.js';

const ZODIAC: readonly string[] = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
];

export interface TransitPosition {
  planet: string;
  sign: string;
  degree: number;
  longitude: number;
  isRetrograde: boolean;
}

export interface TransitAspect {
  planet: string;
  targetHouse: number;
  aspectType: 'standard' | 'special';
  strength: number;
}

export interface DoubleTransitResult {
  isTriggered: boolean;
  saturnAspect: boolean;
  jupiterAspect: boolean;
  rahuInfluence: boolean;
  ketuInfluence: boolean;
  score: number;
  details: string;
}

export interface TransitAnalysisOptions {
  eventDate: string;
  eventTime?: string;
  eventCategory: string;
  birthLatitude: number;
  birthLongitude: number;
  birthTimezone: string | number;
  birthAscendantSign: string;
  natalHousePositions?: number[];
}

export interface ComprehensiveTransitResult {
  eventDate: Date;
  eventCategory: string;
  targetHouse: number;
  transits: TransitPosition[];
  aspects: TransitAspect[];
  doubleTransit: DoubleTransitResult;
  overallScore: number;
  significances: string[];
}

/**
 * Calculate planetary positions on a given date
 */
export async function calculateTransitPositions(
  date: string,
  time: string,
  latitude: number,
  longitude: number,
  timezone: string | number
): Promise<TransitPosition[]> {
  try {
    const ephemeris = await calculateEphemeris(date, time, latitude, longitude, timezone);
    const positions: TransitPosition[] = [];
    
    for (const [name, data] of Object.entries(ephemeris.planets)) {
      const planetData = data as any;
      positions.push({
        planet: capitalizeFirst(name),
        sign: planetData.sign,
        degree: planetData.degree,
        longitude: planetData.longitude,
        isRetrograde: planetData.retro || false
      });
    }
    
    return positions;
  } catch (error) {
    logger.error('[TRANSIT] Failed to calculate positions', { date, error });
    return [];
  }
}

/**
 * Calculate Parashari aspects for a planet
 */
export function calculateAspects(
  planet: string,
  planetSign: string,
  targetHouse: number,
  ascendantSign: string
): TransitAspect[] {
  const aspects: TransitAspect[] = [];
  const planetIndex = ZODIAC.indexOf(planetSign);
  const ascIndex = ZODIAC.indexOf(ascendantSign);
  
  if (planetIndex === -1 || ascIndex === -1) return aspects;
  
  const planetHouse = ((planetIndex - ascIndex + 12) % 12) + 1;
  const specialAspects = PARASHARI_ASPECTS[planet.toLowerCase()] || [7];
  
  for (const aspectHouse of specialAspects) {
    const aspectedHouse = ((planetHouse + aspectHouse - 1 - 1 + 12) % 12) + 1;
    
    if (aspectedHouse === targetHouse) {
      aspects.push({
        planet: capitalizeFirst(planet),
        targetHouse,
        aspectType: aspectHouse === 7 ? 'standard' : 'special',
        strength: aspectHouse === 7 ? 100 : 75
      });
    }
  }
  
  return aspects;
}

/**
 * Check for Double Transit activation
 */
export function checkDoubleTransit(
  transitPositions: TransitPosition[],
  targetHouse: number,
  ascendantSign: string
): DoubleTransitResult {
  let saturnAspect = false;
  let jupiterAspect = false;
  let rahuInfluence = false;
  let ketuInfluence = false;
  const details: string[] = [];
  
  for (const transit of transitPositions) {
    const aspects = calculateAspects(transit.planet, transit.sign, targetHouse, ascendantSign);
    
    for (const aspect of aspects) {
      if (aspect.planet.toLowerCase() === 'saturn') {
        saturnAspect = true;
        details.push(`Saturn aspects ${targetHouse}th house from ${transit.sign}`);
      }
      if (aspect.planet.toLowerCase() === 'jupiter') {
        jupiterAspect = true;
        details.push(`Jupiter aspects ${targetHouse}th house from ${transit.sign}`);
      }
    }
    
    if (transit.planet.toLowerCase() === 'rahu') {
      const rahuHouse = getHouseFromSign(transit.sign, ascendantSign);
      if (rahuHouse === targetHouse || Math.abs(rahuHouse - targetHouse) <= 2) {
        rahuInfluence = true;
        details.push(`Rahu in ${transit.sign} (${rahuHouse}th house) - transformation influence`);
      }
    }
    
    if (transit.planet.toLowerCase() === 'ketu') {
      const ketuHouse = getHouseFromSign(transit.sign, ascendantSign);
      if (ketuHouse === targetHouse || Math.abs(ketuHouse - targetHouse) <= 2) {
        ketuInfluence = true;
        details.push(`Ketu in ${transit.sign} (${ketuHouse}th house) - spiritual influence`);
      }
    }
  }
  
  const isTriggered = saturnAspect && jupiterAspect;
  
  let score = 0;
  if (saturnAspect) score += 40;
  if (jupiterAspect) score += 40;
  if (isTriggered) score += 20;
  if (rahuInfluence) score += 10;
  if (ketuInfluence) score += 5;
  
  return {
    isTriggered,
    saturnAspect,
    jupiterAspect,
    rahuInfluence,
    ketuInfluence,
    score: Math.min(100, score),
    details: details.join('; ')
  };
}

/**
 * Comprehensive transit analysis for an event
 */
export async function analyzeTransitForEvent(
  options: TransitAnalysisOptions
): Promise<ComprehensiveTransitResult> {
  const {
    eventDate,
    eventTime = '12:00',
    eventCategory,
    birthLatitude,
    birthLongitude,
    birthTimezone,
    birthAscendantSign
  } = options;
  
  const targetHouse = EVENT_HOUSE_MAP[eventCategory.toLowerCase()] || 1;
  const transits = await calculateTransitPositions(
    eventDate,
    eventTime,
    birthLatitude,
    birthLongitude,
    birthTimezone
  );
  
  const aspects: TransitAspect[] = [];
  for (const transit of transits) {
    const transitAspects = calculateAspects(transit.planet, transit.sign, targetHouse, birthAscendantSign);
    aspects.push(...transitAspects);
  }
  
  const doubleTransit = checkDoubleTransit(transits, targetHouse, birthAscendantSign);
  
  const significances = extractSignificances(transits, eventCategory, targetHouse);
  
  return {
    eventDate: new Date(eventDate),
    eventCategory,
    targetHouse,
    transits,
    aspects,
    doubleTransit,
    overallScore: doubleTransit.score,
    significances
  };
}

/**
 * Batch analyze transits for multiple events
 */
export async function batchAnalyzeTransits(
  events: Array<{
    date: string;
    time?: string;
    category: string;
  }>,
  birthData: {
    latitude: number;
    longitude: number;
    timezone: string | number;
    ascendantSign: string;
  }
): Promise<Map<string, ComprehensiveTransitResult>> {
  const results = new Map<string, ComprehensiveTransitResult>();
  
  for (const event of events) {
    try {
      const analysis = await analyzeTransitForEvent({
        eventDate: event.date,
        eventTime: event.time,
        eventCategory: event.category,
        birthLatitude: birthData.latitude,
        birthLongitude: birthData.longitude,
        birthTimezone: birthData.timezone,
        birthAscendantSign: birthData.ascendantSign
      });
      
      results.set(event.date, analysis);
    } catch (error) {
      logger.warn('[TRANSIT] Failed to analyze event', { event, error });
    }
  }
  
  return results;
}

/**
 * Extract astrological significances from transit positions
 */
function extractSignificances(
  transits: TransitPosition[],
  eventCategory: string,
  targetHouse: number
): string[] {
  const significances: string[] = [];
  
  for (const transit of transits) {
    const planet = transit.planet.toLowerCase();
    
    if (planet === 'saturn' && ['career', 'property', 'legal'].includes(eventCategory)) {
      significances.push(`Saturn transit relevant for ${eventCategory}`);
    }
    
    if (planet === 'jupiter' && ['marriage', 'children', 'education', 'spiritual'].includes(eventCategory)) {
      significances.push(`Jupiter transit beneficial for ${eventCategory}`);
    }
    
    if (planet === 'venus' && ['marriage', 'finance'].includes(eventCategory)) {
      significances.push(`Venus transit supports ${eventCategory}`);
    }
    
    if (planet === 'mars' && ['accident', 'surgery', 'property'].includes(eventCategory)) {
      significances.push(`Mars transit significant for ${eventCategory}`);
    }
    
    if (planet === 'rahu' && ['travel', 'foreign', 'technology'].includes(eventCategory)) {
      significances.push(`Rahu transit indicates ${eventCategory}`);
    }
    
    if (planet === 'ketu' && ['spiritual', 'hospital', 'separation'].includes(eventCategory)) {
      significances.push(`Ketu transit indicates ${eventCategory}`);
    }
  }
  
  return significances;
}

/**
 * Calculate transit match score for a candidate birth time
 */
export async function calculateTransitMatchScore(
  events: Array<{ date: string; time?: string; category: string; id: string }>,
  birthData: {
    latitude: number;
    longitude: number;
    timezone: string | number;
    ascendantSign: string;
  }
): Promise<TransitMatchResult[]> {
  const results: TransitMatchResult[] = [];
  
  for (const event of events) {
    try {
      const analysis = await analyzeTransitForEvent({
        eventDate: event.date,
        eventTime: event.time,
        eventCategory: event.category,
        birthLatitude: birthData.latitude,
        birthLongitude: birthData.longitude,
        birthTimezone: birthData.timezone,
        birthAscendantSign: birthData.ascendantSign
      });
      
      results.push({
        eventId: event.id,
        eventDate: new Date(event.date),
        eventHouse: analysis.targetHouse,
        saturnAspect: analysis.doubleTransit.saturnAspect,
        jupiterAspect: analysis.doubleTransit.jupiterAspect,
        rahuInfluence: analysis.doubleTransit.rahuInfluence,
        doubleTransit: analysis.doubleTransit.isTriggered,
        score: analysis.doubleTransit.score,
        details: analysis.doubleTransit.details
      });
    } catch (error) {
      logger.warn('[TRANSIT] Failed to calculate match for event', { event, error });
    }
  }
  
  return results;
}

/**
 * Get house number from sign and ascendant
 */
function getHouseFromSign(sign: string, ascendantSign: string): number {
  const signIndex = ZODIAC.indexOf(sign);
  const ascIndex = ZODIAC.indexOf(ascendantSign);
  
  if (signIndex === -1 || ascIndex === -1) return 1;
  
  return ((signIndex - ascIndex + 12) % 12) + 1;
}

/**
 * Capitalize first letter
 */
function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export const TransitAnalyzer = {
  calculatePositions: calculateTransitPositions,
  calculateAspects,
  checkDoubleTransit,
  analyzeEvent: analyzeTransitForEvent,
  batchAnalyze: batchAnalyzeTransits,
  calculateMatchScore: calculateTransitMatchScore
};
