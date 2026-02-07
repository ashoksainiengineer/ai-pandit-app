/**
 * Candidate Data Package Builder
 *
 * Builds comprehensive astrological data packages for candidate birth times.
 * This is the core data transformation layer that converts ephemeris data
 * into AI-ready structured format.
 */

import { calculateEphemeris, calculateJulianDay } from '../ephemeris.js';
import {
  calculateAllVargas,
  calculateAshtakavarga,
  calculateShadbala,
  detectYogas,
  calculateArudhas,
  calculatePanchanga,
  calculateVimsopakaBala,
  detectBhavaChalitDiscrepancy,
  getD60Deity,
} from '../vedic-astrology-engine.js';
import {
  detectVargottama,
  detectParivartana,
  detectPushkarNavamsa,
} from '../advanced-btr-methods.js';
import { calculateCharaKarakas, calculateBhriguBindu } from '../jaimini-astrology.js';
import { CandidateDataPackage, ZODIAC_SIGNS } from './types.js';
import { SecondsPrecisionInput } from '../../types/index.js';
import { logger } from '../logger.js';
import { capitalizeFirstLetter } from '../utils/index.js';
import { buildVimshottariDasha, buildYoginiDasha, buildCharaDasha } from './dasha-builder.js';
import { enrichPlanets, extractIshtaKashtaPhala } from './planet-enricher.js';
import { buildTransitData } from './transit-builder.js';

export interface PackageBuildOptions {
  includeFullData?: boolean;
  dashaDepth?: number;
  pranaWindowDays?: number;
  lifecycleShifts?: any[];
  includeDivisionalCharts?: string[];
}

/**
 * Builds a comprehensive data package for a candidate birth time
 */
export async function buildCandidateDataPackage(
  time: string,
  offsetMinutes: number,
  input: SecondsPrecisionInput,
  options: PackageBuildOptions = {}
): Promise<CandidateDataPackage> {
  const {
    includeFullData = false,
    dashaDepth = 3,
    pranaWindowDays = 3,
    lifecycleShifts = []
  } = options;

  const ephemeris = await loadEphemeris(time, input);
  const birthDate = new Date(input.dateOfBirth);
  const moonLong = ephemeris.planets.moon.longitude;

  // Build Dasha sequences
  const vimshottariDasha = buildVimshottariDasha({
    moonLongitude: moonLong,
    birthDate,
    dashaDepth,
    pranaWindowDays,
    // Safely parse event dates (handles partial dates like YYYY and YYYY-MM)
    eventDates: input.lifeEvents.map(e => {
      if (!e.eventDate) return Date.now();
      const parts = e.eventDate.split('-');
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1 || 0; // Default to January
      const day = parseInt(parts[2], 10) || 1; // Default to 1st
      return new Date(year, month, day).getTime();
    }),
    now: Date.now()
  });

  // Enrich planets with Vedic calculations
  const enrichedPlanets = enrichPlanets(ephemeris.planets, {
    ascendantSign: ephemeris.ascendant.sign,
    ascendantLongitude: ephemeris.ascendant.longitude,
    shadbala: ephemeris.shadbala || {},
    ashtakavarga: ephemeris.ashtakavarga || {},
    houses: ephemeris.houses
  });

  // Build special points (AL, UL, BB)
  const specialPoints = buildSpecialPoints(ephemeris);

  // Build Varga data
  const vargaData = buildVargaData(ephemeris);

  // Detect Sandhi zones
  const sandhiZones = detectSandhiZones(ephemeris);

  // Build house lords mapping from houses data
  const houseLords: Record<number, string> = {};
  for (let i = 1; i <= 12; i++) {
    const house = ephemeris.houses?.[i - 1];
    if (house?.lord) {
      houseLords[i] = house.lord;
    }
  }

  // Build base package
  const pkg: CandidateDataPackage = {
    time,
    offsetMinutes,
    rawVimshottari: [], // Omitted for brevity - populated when needed
    ...vargaData,
    sandhiZones,
    vedicSignals: buildVedicSignals(ephemeris),
    planets: enrichedPlanets,
    ascendant: {
      sign: ephemeris.ascendant.sign,
      degree: formatDegree(ephemeris.ascendant.longitude),
      nakshatra: ephemeris.ascendant.nakshatra || ''
    },
    houseLords, // FIXED: Now properly populated from ephemeris data
    moonNakshatra: ephemeris.planets.moon.nakshatra,
    vimshottariDasha,
    ashtakavarga: ephemeris.ashtakavarga,
    panchanga: calculatePanchanga(calculateJulianDay(birthDate), ephemeris.planets.sun.longitude, moonLong),
    lifecycleShifts,
    vimsopakaBala: calculateVimsopakaBala(ephemeris),
    chalitDiscrepancies: detectBhavaChalitDiscrepancy(ephemeris),
    ishtaKashtaPhala: extractIshtaKashtaPhala(enrichedPlanets),
    specialPoints,
    yogas: detectYogas(ephemeris),
    spouseMatch: await buildSpouseMatch(input, ephemeris)
  };

  // Add extended data for later stages
  if (includeFullData) {
    await addExtendedData(pkg, input, ephemeris, birthDate, moonLong);
  }

  // FIXED: Validate that all critical data is present before returning
  const validationErrors = validateDataPackage(pkg);
  if (validationErrors.length > 0) {
    logger.warn(`[DATA-PACKAGE] Validation warnings for ${time}:`, validationErrors);
  }

  return pkg;
}

/**
 * Validate that the data package contains all required fields
 */
function validateDataPackage(pkg: CandidateDataPackage): string[] {
  const errors: string[] = [];

  // Check required fields
  if (!pkg.time) errors.push('Missing time');
  if (!pkg.ascendant?.sign) errors.push('Missing ascendant sign');
  if (!pkg.moonNakshatra) errors.push('Missing moon nakshatra');
  if (!pkg.planets || Object.keys(pkg.planets).length === 0) {
    errors.push('Missing planets data');
  } else {
    // Check each planet has required fields
    for (const [name, planet] of Object.entries(pkg.planets)) {
      if (!planet.sign) errors.push(`Planet ${name} missing sign`);
      if (!planet.degree) errors.push(`Planet ${name} missing degree`);
      if (!planet.nakshatra) errors.push(`Planet ${name} missing nakshatra`);
      if (typeof planet.house !== 'number') errors.push(`Planet ${name} missing house`);
    }
  }

  // Check divisional charts
  if (!pkg.d9Lagna) errors.push('Missing D9 Lagna');
  if (!pkg.d10Lagna) errors.push('Missing D10 Lagna');
  if (!pkg.d60Sign) errors.push('Missing D60 Sign');

  // Check Dasha data
  if (!pkg.vimshottariDasha || pkg.vimshottariDasha.length === 0) {
    errors.push('Missing Vimshottari Dasha');
  }

  // Check house lords
  if (!pkg.houseLords || Object.keys(pkg.houseLords).length === 0) {
    errors.push('Missing house lords');
  }

  return errors;
}

/**
 * Load and enrich ephemeris data
 */
async function loadEphemeris(time: string, input: SecondsPrecisionInput) {
  const ephemeris = await calculateEphemeris(
    input.dateOfBirth,
    time,
    input.latitude,
    input.longitude,
    input.timezone
  );

  // Calculate all supplemental data
  ephemeris.divisionalCharts = calculateAllVargas(ephemeris);
  ephemeris.ashtakavarga = calculateAshtakavarga(ephemeris);
  ephemeris.shadbala = calculateShadbala(ephemeris);

  return ephemeris;
}

/**
 * Build special astrological points (Arudha Lagna, etc.)
 */
function buildSpecialPoints(ephemeris: any) {
  const arudhas = calculateArudhas(ephemeris);
  const bb = calculateBhriguBindu(ephemeris);
  const ascSign = ephemeris.ascendant.sign;

  return {
    AL: {
      sign: arudhas.AL,
      degree: '0.00°',
      house: calculateRelativeHouse(arudhas.AL, ascSign)
    },
    UL: {
      sign: arudhas.UL,
      degree: '0.00°',
      house: calculateRelativeHouse(arudhas.UL, ascSign)
    },
    BB: {
      sign: bb.sign,
      degree: `${bb.degree.toFixed(2)}°`,
      house: 0
    }
  };
}

/**
 * Calculate relative house position
 */
function calculateRelativeHouse(targetSign: string, ascendantSign: string): number {
  return ((ZODIAC_SIGNS.indexOf(targetSign) - ZODIAC_SIGNS.indexOf(ascendantSign) + 12) % 12) + 1;
}

/**
 * Build Varga (divisional chart) data
 */
function buildVargaData(ephemeris: any) {
  const vargaDegrees: Record<string, Record<string, string>> = {};
  const d60Planets: Record<string, any> = {};

  const vargaNames = ['D9', 'D10', 'D60'];

  for (const varga of vargaNames) {
    const chart = ephemeris.divisionalCharts?.[varga];
    if (!chart || !chart.ascendant || !chart.planets) {
      logger.warn(`[VARGA] Missing or incomplete chart data for ${varga}`);
      continue;
    }

    try {
      vargaDegrees[varga] = {
        Ascendant: `${chart.ascendant.sign || 'Unknown'} ${(chart.ascendant.degree || 0).toFixed(2)}°`
      };

      for (const [pName, pPos] of Object.entries(chart.planets) as [string, any][]) {
        if (!pPos || !pPos.sign) continue;
        vargaDegrees[varga][capitalizeFirstLetter(pName)] = `${pPos.sign || 'Unknown'} ${(pPos.degree || 0).toFixed(2)}°`;

        if (varga === 'D60') {
          // Calculate D60 deity based on planet's D60 longitude
          const signIndex = ZODIAC_SIGNS.indexOf(pPos.sign);
          const d60Longitude = (pPos.degree || 0) + (signIndex * 30);
          const deity = getD60Deity(d60Longitude);
          d60Planets[capitalizeFirstLetter(pName)] = {
            sign: pPos.sign || 'Unknown',
            degree: (pPos.degree || 0).toFixed(2) + '°',
            deity: deity || 'Unknown'
          };
        }
      }
    } catch (err) {
      logger.error(`[VARGA] Failed to build varga data for ${varga}:`, err);
    }
  }

  return {
    vargaDegrees,
    d60Planets,
    d9Lagna: ephemeris.divisionalCharts?.D9?.ascendant.sign,
    d10Lagna: ephemeris.divisionalCharts?.D10?.ascendant.sign,
    d60Sign: ephemeris.divisionalCharts?.D60?.ascendant.sign
  };
}

/**
 * Detect Sandhi zones (planets near sign boundaries)
 */
function detectSandhiZones(ephemeris: any): string[] {
  const zones: string[] = [];

  // Check ascendant
  if (ephemeris.ascendant.degree < 1 || ephemeris.ascendant.degree > 29) {
    zones.push(`Ascendant in Sandhi (${ephemeris.ascendant.degree.toFixed(2)}°)`);
  }

  // Check planets
  for (const [name, p] of Object.entries(ephemeris.planets) as [string, any][]) {
    const deg = p.longitude % 30;
    if (deg < 0.5 || deg > 29.5) {
      zones.push(`${capitalizeFirstLetter(name)} in Deep Sandhi (${deg.toFixed(2)}°)`);
    }
  }

  return zones;
}

/**
 * Build Vedic signal flags
 */
function buildVedicSignals(ephemeris: any) {
  return {
    vargottama: detectVargottama(ephemeris),
    parivartana: detectParivartana(ephemeris),
    pushkar: detectPushkarNavamsa(ephemeris),
    charaKarakas: calculateCharaKarakas(ephemeris)
  };
}

/**
 * Build spouse synastry match if spouse data available
 */
async function buildSpouseMatch(input: SecondsPrecisionInput, ephemeris: any) {
  if (!input.spouseData?.dateOfBirth) return undefined;

  try {
    const spouseEph = await calculateEphemeris(
      input.spouseData.dateOfBirth,
      input.spouseData.birthTime || '12:00:00',
      input.spouseData.latitude || 0,
      input.spouseData.longitude || 0,
      input.spouseData.timezone || 0
    );

    const spouseLagna = spouseEph.ascendant.sign;
    const targetHouseSign = ephemeris.houses[6]?.sign;
    const lagnaMatch = spouseLagna === targetHouseSign;
    const moonSignMatch = spouseEph.planets.moon.sign === ephemeris.planets.moon.sign;

    return {
      lagnaMatch,
      moonMatch: moonSignMatch,
      score: lagnaMatch ? 90 : (moonSignMatch ? 60 : 40),
      reason: lagnaMatch
        ? `Spouse Lagna (${spouseLagna}) matches Candidate 7th House!`
        : (moonSignMatch ? 'Moon signs match!' : 'No direct synastry link')
    };
  } catch (e) {
    logger.warn('Spouse data calculation failed', e);
    return undefined;
  }
}

/**
 * Add extended data for later BTR stages
 */
async function addExtendedData(
  pkg: CandidateDataPackage,
  input: SecondsPrecisionInput,
  ephemeris: any,
  birthDate: Date,
  moonLong: number
) {
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  const eventDates = input.lifeEvents.map(e => new Date(e.eventDate).getTime());
  const minDate = Math.min(...eventDates, now) - (365 * dayMs);
  const maxDate = Math.max(...eventDates, now) + (365 * dayMs);

  // Add filtered Dasha sequences
  pkg.yoginiDasha = buildYoginiDasha(moonLong, birthDate, minDate, maxDate);
  pkg.charaDasha = buildCharaDasha(ephemeris, birthDate, minDate, maxDate);

  // Build divisional chart data
  buildDivisionalCharts(pkg, ephemeris);

  // Build transit data
  pkg.transitData = await buildTransitData({
    lifeEvents: input.lifeEvents,
    vimshottariDashas: [],
    ephemeris,
    input: {
      dateOfBirth: input.dateOfBirth,
      latitude: input.latitude,
      longitude: input.longitude,
      timezone: String(input.timezone)
    },
    vedicSignals: pkg.vedicSignals
  });
}

/**
 * Build divisional chart planet mappings
 */
function buildDivisionalCharts(pkg: CandidateDataPackage, ephemeris: any) {
  const vargas = ephemeris.divisionalCharts || {};

  if (vargas.D9) {
    pkg.d9Chart = {
      ascendant: vargas.D9.ascendant.sign,
      planets: Object.fromEntries(
        Object.entries(vargas.D9.planets).map(([name, p]: [string, any]) => [name, p.sign])
      )
    };
  }

  if (vargas.D10) {
    pkg.d10Chart = {
      ascendant: vargas.D10.ascendant.sign,
      planets: Object.fromEntries(
        Object.entries(vargas.D10.planets).map(([name, p]: [string, any]) => [name, p.sign])
      )
    };
  }
}

/**
 * Format longitude as degree string
 */
function formatDegree(longitude: number): string {
  return (longitude % 30).toFixed(4) + '°';
}
