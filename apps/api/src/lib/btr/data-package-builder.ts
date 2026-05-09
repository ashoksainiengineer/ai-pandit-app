
/**
 * Candidate Data Package Builder
 *
 * Builds comprehensive astrological data packages for candidate birth times.
 * This is the core data transformation layer that converts ephemeris data
 * into AI-ready structured format.
 */

import { calculateEphemeris, calculateJulianDay, calculateSunrise, convertToUTC } from '../ephemeris.js';
import {
  calculateAllVargas,
  calculateAshtakavarga,
  calculateShadbala,
  detectYogas,
  calculateArudhas,
  calculatePanchanga,
  calculateVimsopakaBala,
  calculateVimshottariDasha,
  detectBhavaChalitDiscrepancy,
  getD60Deity,
} from '../vedic-astrology-engine.js';
import {
  detectVargottama,
  detectParivartana,
  detectPushkarNavamsa,
  calculateKundaLagna,
} from '../advanced-btr-methods.js';
import { calculateTatwaAtTime } from './tatwa-shuddhi.js';
import { calculateCharaKarakas, calculateBhriguBindu } from '../jaimini-astrology.js';
import { SecondsPrecisionInput, EphemerisData, CandidateTime } from '@ai-pandit/shared';
import { logger } from '../../utils/logger.js';
import { capitalizeFirstLetter } from '../utils/index.js';
import { decimalToDMS } from '../utils/dms-formatter.js';
import { CandidateDataPackage, ZODIAC_SIGNS } from '@ai-pandit/shared';
import { buildVimshottariDasha, buildYoginiDasha, buildCharaDasha } from './dasha-builder.js';
import { enrichPlanets, extractIshtaKashtaPhala } from './planet-enricher.js';
import { buildTransitData } from './transit-builder.js';
import { calculateKalachakraDasha, _correlateKalachakraWithEvents } from '../kalachakra-dasha.js';
import { calculateD150ForAllPlanets, analyzeD150ForEvents } from '../nadi-amsha.js';
import { performSpouseVerification, _extractNativeD9Positions, _verifyD9WithSpouse, _calculateSpousePositions } from '../spouse-d9-verification.js';
import { detectGandanta } from '../gandanta-detection.js';
import { analyzePakshi } from '../pancha-pakshi.js';
import { _calculateD12 } from '../advanced-btr-methods.js';
import { calculateKPSubLords, calculateKPCuspalSubLords } from '../kp-sublords.js';
import { resolveEventDateWindow } from './event-date-utils.js';
import type { DivisionalChart } from '../advanced-btr-methods.js';

class DataPackageValidationError extends Error {
  constructor(public readonly errors: string[], time: string) {
    super(`Data package validation failed for candidate ${time}: ${errors.join(', ')}`);
    this.name = 'DataPackageValidationError';
  }
}

async function safeEnrich<T, K extends string>(
  pkg: CandidateDataPackage,
  key: K,
  compute: () => T | Promise<T>
): Promise<void> {
  try {
    Reflect.set(pkg, key, await compute());
  } catch (err) {
    logger.error(`Enrichment ${key} failed`, err);
  }
}

export interface PackageBuildOptions {
  includeFullData?: boolean;
  dashaDepth?: number;
  pranaWindowDays?: number;
  lifecycleShifts?: NonNullable<CandidateDataPackage['lifecycleShifts']>;
  includeDivisionalCharts?: string[];
  candidate?: CandidateTime;
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
    lifecycleShifts = [],
    candidate,
  } = options;

  const candidateDate = candidate?.candidateDate || input.dateOfBirth;
  const birthDate = convertToUTC(candidateDate, time, input.timezone);
  const ephemeris = await loadEphemeris(candidateDate, time, input);
  const moonLong = ephemeris.planets.moon.longitude;

  // Build Dasha sequences
  const vimshottariDasha = buildVimshottariDasha({
    moonLongitude: moonLong,
    birthDate,
    dashaDepth,
    pranaWindowDays,
    // Safely parse event dates (handles partial dates like YYYY and YYYY-MM)
    eventRanges: input.lifeEvents.map(e => {
      const window = resolveEventDateWindow(e);
      return { start: window.startMs, end: window.endMs };
    }),
    now: Date.now()
  });

  // Enrich planets with Vedic calculations
  const context: Parameters<typeof enrichPlanets>[1] = {
    ascendantSign: ephemeris.ascendant.sign,
    ascendantLongitude: ephemeris.ascendant.longitude,
    shadbala: ephemeris.shadbala!,
    ashtakavarga: ephemeris.ashtakavarga! as Record<string, number[]>,
    houses: ephemeris.houses
  };
  const enrichedPlanets = enrichPlanets(ephemeris.planets, context);

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
    candidateDate,
    dayOffset: candidate?.dayOffset,
    candidateKey: candidate?.candidateKey,
    rawVimshottari: calculateVimshottariDasha(moonLong, birthDate, Math.max(dashaDepth, 5)),
    ...vargaData,
    sandhiZones,
    vedicSignals: buildVedicSignals(ephemeris),
    planets: enrichedPlanets,
    ascendant: {
      sign: ephemeris.ascendant.sign,
      degree: formatDegree(ephemeris.ascendant.longitude),
      nakshatra: ephemeris.ascendant.nakshatra || '',
      longitude: ephemeris.ascendant.longitude
    },
    houseLords, // FIXED: Now properly populated from ephemeris data
    ayanamsa: ephemeris.ayanamsa,
    moonNakshatra: ephemeris.planets.moon.nakshatra,
    vimshottariDasha,
    ashtakavarga: ephemeris.ashtakavarga as Record<string, number> | undefined,
    // @ts-expect-error - PanchangaData types differ between API and shared package (tithi: object vs string)
    panchanga: calculatePanchanga(calculateJulianDay(birthDate), ephemeris.planets.sun.longitude, moonLong, birthDate, ephemeris),
    lifecycleShifts,
    vimsopakaBala: calculateVimsopakaBala(ephemeris),
    chalitDiscrepancies: detectBhavaChalitDiscrepancy(ephemeris),
    ishtaKashtaPhala: extractIshtaKashtaPhala(enrichedPlanets),
    specialPoints,
    yogas: detectYogas(ephemeris),
    spouseMatch: await buildSpouseMatch(input, ephemeris)
  };

  // KP data is needed in all AI stages so VSL can emit non-placeholder precision signals.
  pkg.kpData = buildKPData(ephemeris);

  // 🔱 PROJECT MAHAKALA PRECISION ANCHORS
  try {
    const sunriseDate = await calculateSunrise(candidateDate, input.latitude, input.longitude, input.timezone);
    const candidateUTC = birthDate;

    // Ensure vedicSignals is initialized
    if (!pkg.vedicSignals) pkg.vedicSignals = {};

    const tatwaResult = calculateTatwaAtTime(sunriseDate, candidateUTC);
    pkg.vedicSignals.tatwa = {
      name: capitalizeFirstLetter(tatwaResult.tatwa),
      element: tatwaResult.element,
      isAuspicious: true
    };
    pkg.vedicSignals.kundaLagna = calculateKundaLagna(ephemeris.ascendant.longitude, ephemeris.planets.moon.longitude);
  } catch (err) {
    logger.error('Mahakala indicator calculation failed', err);
  }

  // Optional enrichment calculations with graceful error handling
  await safeEnrich(pkg, 'kalachakraDasha', () => calculateKalachakraDasha(moonLong, birthDate));

  await safeEnrich(pkg, 'nadiData', () => {
    const nadiData = calculateD150ForAllPlanets(ephemeris);
    if (input.lifeEvents && input.lifeEvents.length > 0) {
      pkg.nadiAnalysis = analyzeD150ForEvents(nadiData, input.lifeEvents.map(e => ({
        category: e.eventType || 'general'
      })));
    }
    return nadiData;
  });

  if (input.spouseData?.dateOfBirth) {
    await safeEnrich(pkg, 'spouseD9Verification', () => performSpouseVerification(ephemeris, {
      dateOfBirth: input.spouseData!.dateOfBirth,
      birthTime: input.spouseData!.birthTime || '12:00:00',
      latitude: input.spouseData!.latitude || 0,
      longitude: input.spouseData!.longitude || 0,
      timezone: input.spouseData!.timezone || 0
    }));
  }

  await safeEnrich(pkg, 'gandantaAnalysis', () => detectGandanta(
    ephemeris.ascendant.longitude,
    ephemeris.planets.moon.longitude
  ));

  await safeEnrich(pkg, 'pakshiAnalysis', () => {
    const [hours, minutes] = time.split(':').map(Number);
    return analyzePakshi(hours, minutes, getLocalWeekday(candidateDate),
      ephemeris.ascendant.sign, ephemeris.planets.moon.sign);
  });

  // Add extended data for later stages
  if (includeFullData) {
    await addExtendedData(pkg, input, ephemeris, birthDate, moonLong);
  }

  // Validate that all critical data is present before returning
  const validationErrors = validateDataPackage(pkg);
  if (validationErrors.length > 0) {
    throw new DataPackageValidationError(validationErrors, time);
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
      if (planet.degree == null || Number.isNaN(planet.degree)) errors.push(`Planet ${name} missing degree`);
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

  // 🛡️ ZERO-TRUST VALIDATION GATE: Check Transit Data
  if (pkg.transitData) {
    for (const [date, transit] of Object.entries(pkg.transitData)) {
      if (!transit.dasha || transit.dasha === 'Unknown') {
        errors.push(`CRITICAL: Transit on ${date} has Unknown Dasha. Pipeline failed to pass vimshottariDashas.`);
      }
      if (transit.planets) {
        for (const [planet, pos] of Object.entries(transit.planets)) {
          if (!pos.includes('| H')) {
            errors.push(`CRITICAL: Transit ${planet} on ${date} missing house position (Found: ${pos}). Pipeline failed to compute relative house.`);
          }
        }
      }
    }
  }

  return errors;
}

/**
 * Load and enrich ephemeris data
 */
async function loadEphemeris(candidateDate: string, time: string, input: SecondsPrecisionInput): Promise<EphemerisData> {
  const ephemeris = await calculateEphemeris(
    candidateDate,
    time,
    input.latitude,
    input.longitude,
    input.timezone
  );

  // Calculate all supplemental data
  // @ts-expect-error - Local DivisionalChart type differs from shared package type
  ephemeris.divisionalCharts = calculateAllVargas(ephemeris);
  ephemeris.ashtakavarga = calculateAshtakavarga(ephemeris);
  // @ts-expect-error - calculateShadbala returns Record<string,number>; shadbala field expects Record<string,ShadbalaBreakdown>
  ephemeris.shadbala = calculateShadbala(ephemeris);

  return ephemeris;
}

/**
 * Build special astrological points (Arudha Lagna, etc.)
 */
function buildSpecialPoints(ephemeris: EphemerisData) {
  const arudhas = calculateArudhas(ephemeris);
  const bb = calculateBhriguBindu(ephemeris);
  const ascSign = ephemeris.ascendant.sign;

  // Arudha Lagna degree: same as Lagna Lord's degree in the AL sign
  const SIGN_LORD: Record<string, string> = {
    Aries: 'mars', Taurus: 'venus', Gemini: 'mercury', Cancer: 'moon',
    Leo: 'sun', Virgo: 'mercury', Libra: 'venus', Scorpio: 'mars',
    Sagittarius: 'jupiter', Capricorn: 'saturn', Aquarius: 'saturn', Pisces: 'jupiter',
  };
  const lagnaLord = SIGN_LORD[ascSign] || 'sun';
  const lordDegree = ephemeris.planets[lagnaLord]?.degree ?? 0;
  const alDegreeDMS = decimalToDMS(lordDegree);

  return {
    AL: {
      sign: arudhas.AL,
      degree: alDegreeDMS,
      house: calculateRelativeHouse(arudhas.AL, ascSign)
    },
    UL: {
      sign: arudhas.UL,
      degree: alDegreeDMS,  // UL degree = 12th lord degree (expansion point; uses AL degree as approximation)
      house: calculateRelativeHouse(arudhas.UL, ascSign)
    },
    BB: {
      sign: bb.sign,
      degree: decimalToDMS(bb.degree),
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
function buildVargaData(ephemeris: EphemerisData) {
  const vargaDegrees: Record<string, Record<string, string>> = {};
  const d60Planets: NonNullable<CandidateDataPackage['d60Planets']> = {};
  const optionalVargas = new Set(['D12']);

  const vargaNames = ['D9', 'D10', 'D12', 'D60', 'D150'];

  for (const varga of vargaNames) {
    const chart = ephemeris.divisionalCharts?.[varga];
    if (!chart || !chart.ascendant || !chart.planets) {
      if (!optionalVargas.has(varga)) {
        logger.warn(`[VARGA] Missing or incomplete chart data for ${varga}`);
      }
      continue;
    }

    try {
      vargaDegrees[varga] = {
        Ascendant: `${chart.ascendant.sign || 'Unknown'} ${decimalToDMS(chart.ascendant.degree || 0)}`
      };

      for (const [pName, pPos] of Object.entries(chart.planets)) {
        if (!pPos || !pPos.sign) continue;
        vargaDegrees[varga][capitalizeFirstLetter(pName)] = `${pPos.sign || 'Unknown'} ${decimalToDMS(pPos.degree || 0)}`;

        if (varga === 'D60') {
          // Calculate D60 deity based on planet's D60 longitude
          const signIndex = ZODIAC_SIGNS.indexOf(pPos.sign);
          const d60Longitude = (pPos.degree || 0) + (signIndex * 30);
          const deity = getD60Deity(d60Longitude);
          d60Planets[capitalizeFirstLetter(pName)] = {
            sign: pPos.sign || 'Unknown',
            degree: decimalToDMS(pPos.degree || 0),
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
    d60Sign: ephemeris.divisionalCharts?.D60?.ascendant.sign,
    d150Sign: ephemeris.divisionalCharts?.D150?.ascendant.sign
  };
}

/**
 * Detect Sandhi zones (planets near sign boundaries)
 */
function detectSandhiZones(ephemeris: EphemerisData): string[] {
  const zones: string[] = [];

  // Check ascendant
  if (ephemeris.ascendant.degree < 1 || ephemeris.ascendant.degree > 29) {
    zones.push(`Ascendant in Sandhi (${decimalToDMS(ephemeris.ascendant.degree)})`);
  }

  // Check planets
  for (const [name, p] of Object.entries(ephemeris.planets)) {
    const deg = p.longitude % 30;
    if (deg < 0.5 || deg > 29.5) {
      zones.push(`${capitalizeFirstLetter(name)} in Deep Sandhi (${decimalToDMS(deg)})`);
    }
  }

  return zones;
}

/**
 * Build Vedic signal flags
 */
function buildVedicSignals(ephemeris: EphemerisData) {
  return {
    vargottama: detectVargottama(ephemeris),
    parivartana: detectParivartana(ephemeris),
    pushkar: detectPushkarNavamsa(ephemeris),
    charaKarakas: calculateCharaKarakas(ephemeris)
  };
}

/**
 * Build KP planet and cuspal hierarchy for VSL precision segments.
 */
function buildKPData(ephemeris: EphemerisData): NonNullable<CandidateDataPackage['kpData']> {
  const planetSubLords: NonNullable<CandidateDataPackage['kpData']>['planetSubLords'] = {};
  const cuspalSubLords: NonNullable<CandidateDataPackage['kpData']>['cuspalSubLords'] = {};

  for (const [planetName, planet] of Object.entries(ephemeris.planets || {})) {
    if (typeof planet?.longitude !== 'number' || Number.isNaN(planet.longitude)) {
      continue;
    }
    const kp = calculateKPSubLords(planet.longitude);
    planetSubLords[planetName] = {
      starLord: kp.starLord,
      subLord: kp.subLord,
      subSubLord: kp.subSubLord,
      subSubSubLord: kp.subSubSubLord
    };
  }

  type HouseLike = { cusp?: number; longitude?: number; sign?: string };
  const cuspLongitudes = Array.isArray(ephemeris.kpCusps) && ephemeris.kpCusps.length >= 12
    ? ephemeris.kpCusps.slice(0, 12)
    : (Array.isArray(ephemeris.houses) ? ephemeris.houses : []).map((house: HouseLike) => {
        if (typeof house?.cusp === 'number') return house.cusp;
        if (typeof house?.longitude === 'number') return house.longitude;
        if (typeof house?.sign === 'string') {
          const signIndex = ZODIAC_SIGNS.indexOf(house.sign);
          if (signIndex >= 0) {
            return signIndex * 30;
          }
        }
        return 0;
      });

  if (cuspLongitudes.length >= 12) {
    for (const cusp of calculateKPCuspalSubLords(cuspLongitudes.slice(0, 12))) {
      cuspalSubLords[cusp.house] = {
        house: cusp.house,
        cusp: cusp.cusp,
        sign: cusp.sign,
        starLord: cusp.starLord,
        subLord: cusp.subLord,
        subSubLord: cusp.subSubLord
      };
    }
  }

  return { planetSubLords, cuspalSubLords };
}

/**
 * Build spouse synastry match if spouse data available
 */
async function buildSpouseMatch(input: SecondsPrecisionInput, ephemeris: EphemerisData) {
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
    logger.warn('Spouse data calculation failed', {
      error: e instanceof Error ? e.message : String(e),
    });
    return undefined;
  }
}

/**
 * Add extended data for later BTR stages
 */
async function addExtendedData(
  pkg: CandidateDataPackage,
  input: SecondsPrecisionInput,
  ephemeris: EphemerisData,
  birthDate: Date,
  moonLong: number
) {
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  const birthTimeMs = birthDate.getTime();
  const minDate = birthTimeMs - (30 * dayMs); // Buffed to birth
  const maxDate = now + (5 * 365 * dayMs); // Fixed 5-year future window

  // Add filtered Dasha sequences
  pkg.yoginiDasha = buildYoginiDasha(moonLong, birthDate, minDate, maxDate);
  pkg.charaDasha = buildCharaDasha(ephemeris, birthDate, minDate, maxDate);

  // Build divisional chart data
  buildDivisionalCharts(pkg, ephemeris);

  // Build transit data
  // @ts-expect-error - TransitDataEntry shape differs from CandidateDataPackage transit type
  pkg.transitData = await buildTransitData({
    lifeEvents: input.lifeEvents,
    moonLongitude: moonLong,
    birthDate,
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
function buildDivisionalCharts(pkg: CandidateDataPackage, ephemeris: EphemerisData) {
  // @ts-expect-error - DivisionalChart types differ between API (chartType) and shared package (id)
  const vargas = (ephemeris.divisionalCharts ?? {}) as Record<string, DivisionalChart | undefined>;

  // Type-safe access to divisional charts
  const d9Chart = vargas.D9;
  const d10Chart = vargas.D10;
  const d150Chart = vargas.D150;

  if (d9Chart) {
    pkg.d9Chart = {
      ascendant: d9Chart.ascendant.sign,
      planets: Object.fromEntries(
        Object.entries(d9Chart.planets).map(([name, p]) => [name, p.sign])
      )
    };
  }

  if (d10Chart) {
    pkg.d10Chart = {
      ascendant: d10Chart.ascendant.sign,
      planets: Object.fromEntries(
        Object.entries(d10Chart.planets).map(([name, p]) => [name, p.sign])
      )
    };
  }

  if (d150Chart) {
    pkg.d150Chart = {
      ascendant: d150Chart.ascendant.sign,
      planets: Object.fromEntries(
        Object.entries(d150Chart.planets).map(([name, p]) => [name, p.sign])
      )
    };
  }
}

/**
 * Format longitude as degree string
 */
function formatDegree(longitude: number): string {
  return decimalToDMS(longitude);
}

function getLocalWeekday(localDate: string): number {
  const [year, month, day] = localDate.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0)).getUTCDay();
}
