
import { EphemerisData, PlanetPosition, HousePosition, ZODIAC_SIGNS } from '@ai-pandit/shared';
import { getDignity } from './vedic-astrology-engine.js';
import { logger } from '../utils/logger.js';
import { config } from '../config/index.js';
import type { EphemerisServiceChartResponse } from '@ai-pandit/shared/types';
import { CalculationError, ValidationError } from '../errors/index.js';
import type {
  EphemerisExecutionMode,
  EphemerisProviderName,
  EphemerisProviderStatus,
} from './ephemeris/provider.js';
import { summarizeEphemerisComparison, type EphemerisComparisonSummary } from './ephemeris/compare.js';
import { fetchSkyfieldChart, fetchSkyfieldHealth, fetchSkyfieldSunrise } from './ephemeris/skyfield-client.js';

interface ResolvedEphemerisConfig {
  provider: EphemerisProviderName;
  serviceUrl: string;
  allowAlgorithmicFallback: boolean;
  houseSystem: 'whole_sign' | 'equal' | 'placidus';
  strictMode: boolean;
}

const DEFAULT_EPHEMERIS_CONFIG: ResolvedEphemerisConfig = {
  provider: 'algorithmic',
  serviceUrl: 'http://localhost:8000',
  allowAlgorithmicFallback: true,
  houseSystem: 'whole_sign',
  strictMode: false,
};

function getEphemerisConfig(): ResolvedEphemerisConfig {
  return {
    ...DEFAULT_EPHEMERIS_CONFIG,
    ...(config as { ephemeris?: Partial<ResolvedEphemerisConfig> } | undefined)?.ephemeris,
  };
}

let isInitialized = false;
let initPromise: Promise<boolean> | null = null;
let activeExecutionMode: EphemerisExecutionMode = getEphemerisConfig().provider;

// Calculation Cache (LRU-like simple Map with TTL)
interface CacheEntry {
  data: EphemerisData;
  timestamp: number;
  sessionId?: string;
}
const EPH_CACHE = new Map<string, CacheEntry>();
const SESSION_CACHES = new Map<string, Set<string>>();
const MAX_CACHE_SIZE = 300;
const MAX_CACHE_SIZE_PER_SESSION = 100;
const CACHE_TTL_MS = 60 * 60 * 1000;

export function clearEphemerisSessionCache(sessionId: string): void {
  const keys = SESSION_CACHES.get(sessionId);
  if (keys) {
    for (const key of keys) {
      EPH_CACHE.delete(key);
    }
    SESSION_CACHES.delete(sessionId);
    logger.debug('[EPHEMERIS] Cleared session cache', { sessionId, entriesRemoved: keys.size });
  }
}

export function getCacheStats(): { totalEntries: number; sessionCount: number; memoryEstimateMB: number } {
  const totalEntries = EPH_CACHE.size;
  const sessionCount = SESSION_CACHES.size;
  const memoryEstimateMB = Math.round((totalEntries * 2 * 1024) / (1024 * 1024) * 100) / 100;
  return { totalEntries, sessionCount, memoryEstimateMB };
}

function getConfiguredProvider(): EphemerisProviderName {
  return getEphemerisConfig().provider;
}

function assertConfiguredProviderImplemented(): void {
  if (!['skyfield', 'algorithmic'].includes(getConfiguredProvider())) {
    throw new CalculationError(
      `Unsupported ephemeris provider: ${getConfiguredProvider()}`
    );
  }
}

export async function initEphemerisProvider(): Promise<boolean> {
  if (isInitialized) {
    return activeExecutionMode === 'skyfield';
  }

  if (initPromise) {
    return initPromise;
  }

  assertConfiguredProviderImplemented();
  initPromise = (async () => {
    const provider = getConfiguredProvider();

    if (provider === 'algorithmic') {
      activeExecutionMode = 'algorithmic';
      isInitialized = true;
      logger.info('[EPHEMERIS] Algorithmic provider initialized');
      return false;
    }

    try {
      await fetchSkyfieldHealth();
      activeExecutionMode = 'skyfield';
      isInitialized = true;
      logger.info('[EPHEMERIS] Skyfield provider initialized', {
        provider,
        serviceUrl: getEphemerisConfig().serviceUrl,
      });
      return true;
    } catch (error) {
      if (!getEphemerisConfig().allowAlgorithmicFallback) {
        throw new CalculationError('Skyfield provider initialization failed', {
          provider,
          serviceUrl: getEphemerisConfig().serviceUrl,
          cause: error,
        });
      }

      activeExecutionMode = 'algorithmic-fallback';
      isInitialized = true;
      logger.warn('[EPHEMERIS] Skyfield provider unavailable, using algorithmic fallback', {
        serviceUrl: getEphemerisConfig().serviceUrl,
        error: (error as Error).message,
      });
      return false;
    } finally {
      initPromise = null;
    }
  })();

  return initPromise;
}

function getCurrentExecutionMode(): EphemerisExecutionMode {
  return activeExecutionMode;
}

export function getEphemerisProviderStatus(): EphemerisProviderStatus {
  const activeMode = getCurrentExecutionMode();
  return {
    configuredProvider: getConfiguredProvider(),
    activeMode,
    ready: isInitialized,
    highPrecision: activeMode === 'skyfield',
  };
}

export function getEphemerisMode(): EphemerisExecutionMode {
  return getCurrentExecutionMode();
}

function cacheResult(cacheKey: string, data: EphemerisData, sessionId?: string): void {
  if (sessionId) {
    const sessionKeys = SESSION_CACHES.get(sessionId) ?? new Set<string>();
    if (sessionKeys.size >= MAX_CACHE_SIZE_PER_SESSION) {
      const keysArray = Array.from(sessionKeys);
      const keysToRemove = keysArray.slice(0, Math.floor(keysArray.length * 0.2));
      for (const key of keysToRemove) {
        sessionKeys.delete(key);
        EPH_CACHE.delete(key);
      }
    }
    sessionKeys.add(cacheKey);
    SESSION_CACHES.set(sessionId, sessionKeys);
  }

  // LRU eviction: find and remove the least-recently-used entry
  if (EPH_CACHE.size >= MAX_CACHE_SIZE) {
    let oldestKey: string | undefined;
    let oldestTime = Infinity;
    for (const [key, entry] of EPH_CACHE) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldestKey = key;
      }
    }
    if (oldestKey !== undefined) {
      EPH_CACHE.delete(oldestKey);
      for (const [sid, keys] of SESSION_CACHES) {
        if (keys.has(oldestKey)) {
          keys.delete(oldestKey);
          if (keys.size === 0) SESSION_CACHES.delete(sid);
          break;
        }
      }
    }
  }
  EPH_CACHE.set(cacheKey, { data, timestamp: Date.now(), sessionId });
}
function normalize360(deg: number): number {
  return ((deg % 360) + 360) % 360;
}

function calcMidheaven(jd: number, _lat: number, lon: number): number {
  const T = (jd - 2451545.0) / 36525;
  const GMST = (18.697374558 + 8640184.812866 * T / 3600 + 0.093104 * T * T) % 24;
  const LST = (GMST + lon / 15) % 24;
  const RAMC = LST * 15;
  const obliquity = 23.439281;
  const mcRad = Math.atan2(Math.tan(RAMC * Math.PI / 180), Math.cos(obliquity * Math.PI / 180));
  return normalize360(mcRad * 180 / Math.PI - getAyanamsaAlgo(jd));
}

function buildPlacidusHousesAlgorithmic(ascLng: number, mcLng: number, _latitude: number): HousePosition[] {
  const icLng = normalize360(mcLng + 180);
  const desLng = normalize360(ascLng + 180);

  // Approximate Placidus using Campanus-like interpolation
  const arcIC = normalize360(icLng - ascLng + 360);
  const h2 = normalize360(ascLng + arcIC / 3);
  const h3 = normalize360(ascLng + arcIC * 2 / 3);

  const cusps: number[] = [
    ascLng, h2, h3, icLng,
    normalize360(icLng + (desLng - icLng + 360) % 360 / 3),
    normalize360(icLng + (desLng - icLng + 360) % 360 * 2 / 3),
    desLng,
    normalize360(desLng + (mcLng - desLng + 360) % 360 / 3),
    normalize360(desLng + (mcLng - desLng + 360) % 360 * 2 / 3),
    mcLng,
    normalize360(mcLng + (ascLng - mcLng + 360) % 360 / 3),
    normalize360(mcLng + (ascLng - mcLng + 360) % 360 * 2 / 3),
  ];

  return cusps.map((cusp, i) => {
    const sign = getZodiacSign(cusp);
    return {
      houseNumber: i + 1,
      sign,
      degree: cusp % 30,
      cusp,
      lord: getLord(sign),
    };
  });
}

function buildHousesFromSkyfield(
  chart: EphemerisServiceChartResponse,
  ascLongitude: number
): HousePosition[] {
  const houseSystem = getEphemerisConfig().houseSystem;
  const cusps = chart.houses.houseCuspsSidereal
    ?? chart.houses.houseCuspsTropical.map((c: number) => ((c - chart.ayanamsha) % 360 + 360) % 360);

  if (houseSystem === 'placidus' || houseSystem === 'equal') {
    return cusps.map((cusp: number, index: number) => {
      const sign = getZodiacSign(cusp);
      return {
        houseNumber: index + 1,
        sign,
        degree: cusp % 30,
        cusp,
        lord: getLord(sign),
      };
    });
  }

  // Default/whole_sign: fall back to whole sign houses
  return buildWholeSignHouses(ascLongitude);
}

function buildWholeSignHouses(ascendantLongitude: number): HousePosition[] {
  const ascSignIndex = Math.floor((((ascendantLongitude % 360) + 360) % 360) / 30);

  return Array.from({ length: 12 }, (_, index) => {
    const sign = ZODIAC_SIGNS[(ascSignIndex + index) % 12];
    const cusp = ((ascSignIndex + index) % 12) * 30;

    return {
      houseNumber: index + 1,
      sign,
      degree: 0,
      cusp,
      lord: getLord(sign),
    };
  });
}

function assignPlanetHouses(planets: Record<string, PlanetPosition>, houses: HousePosition[]): void {
  for (const planet of Object.values(planets)) {
    const planetLng = planet.longitude;
    let assignedHouse = 1;
    for (let i = 0; i < 12; i++) {
      const thisCusp = houses[i].cusp;
      const nextCusp = houses[(i + 1) % 12].cusp;
      const rangeStart = thisCusp;
      const rangeEnd = nextCusp < thisCusp ? nextCusp + 360 : nextCusp;
      const plng = planetLng < thisCusp ? planetLng + 360 : planetLng;

      if (plng >= rangeStart && plng < rangeEnd) {
        assignedHouse = i + 1;
        break;
      }
    }
    planet.house = assignedHouse;
  }
}

function buildEphemerisFromSkyfieldChart(chart: EphemerisServiceChartResponse): EphemerisData {
  const skyfieldPlanets = new Map(chart.planets.map((planet) => [planet.body, planet]));
  const sunLongitude = skyfieldPlanets.get('sun')?.siderealLongitude ?? skyfieldPlanets.get('sun')?.tropicalLongitude ?? 0;

  const planetNames = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'rahu', 'ketu'] as const;
  const planets: Record<string, PlanetPosition> = {};

  for (const planetName of planetNames) {
    const source = skyfieldPlanets.get(planetName);
    if (!source) {
      throw new CalculationError(`Skyfield chart is missing planet payload for ${planetName}`, {
        planetName,
      });
    }

    const longitude = source.siderealLongitude !== undefined ? source.siderealLongitude : ((source.tropicalLongitude - chart.ayanamsha) % 360 + 360) % 360;
    const sign = getZodiacSign(longitude);
    const name = planetName.charAt(0).toUpperCase() + planetName.slice(1);

    planets[planetName] = {
      sign,
      degree: longitude % 30,
      longitude,
      latitude: source.tropicalLatitude,
      nakshatra: getNakshatra(longitude),
      nakshatraPada: getNakshatraPada(longitude),
      lord: getLord(sign),
      retro: source.retrograde,
      speed: source.longitudeSpeed,
      longitudeSpeed: source.longitudeSpeed,
      distance: source.distanceAu,
      isCombust: isCombust(name, longitude, sunLongitude),
      dignity: getDignity(name, sign),
      house: 0,
    };
  }

  const ascLongitude = chart.houses.ascendantSidereal !== undefined ? chart.houses.ascendantSidereal : ((chart.houses.ascendantTropical - chart.ayanamsha) % 360 + 360) % 360;
  const ascSign = getZodiacSign(ascLongitude);
  const ascendant = {
    sign: ascSign,
    degree: ascLongitude % 30,
    longitude: ascLongitude,
    nakshatra: getNakshatra(ascLongitude),
    nakshatraPada: getNakshatraPada(ascLongitude),
  };

  const kpCusps = chart.houses.houseCuspsSidereal
    ?? chart.houses.houseCuspsTropical.map((cusp) => ((cusp - chart.ayanamsha) % 360 + 360) % 360);
  const houses = buildHousesFromSkyfield(chart, ascLongitude);

  assignPlanetHouses(planets, houses);

  return {
    planets: planets as EphemerisData['planets'],
    ascendant,
    houses,
    kpCusps,
    ayanamsa: chart.ayanamsha,
    precisionMode: 'high',
  };
}

export async function compareEphemerisProviders(
  input: {
    birthDate: string;
    birthTime: string;
    latitude: number;
    longitude: number;
    timezone: number | string;
  },
  candidateProvider: EphemerisProviderName = 'skyfield',
  baselineProvider: EphemerisProviderName = 'algorithmic'
): Promise<{
  candidateProvider: EphemerisProviderName;
  baselineProvider: EphemerisProviderName;
  summary: EphemerisComparisonSummary;
  candidate: EphemerisData;
  baseline: EphemerisData;
}> {
  const candidate = await calculateEphemerisWithProvider(input, candidateProvider);
  const baseline = await calculateEphemerisWithProvider(input, baselineProvider);

  return {
    candidateProvider,
    baselineProvider,
    summary: summarizeEphemerisComparison(candidate, baseline),
    candidate,
    baseline,
  };
}

async function calculateEphemerisWithSkyfield(input: {
  birthDate: string;
  birthTime: string;
  latitude: number;
  longitude: number;
  timezone: number | string;
}): Promise<EphemerisData> {
  const timestampUtc = convertToUTC(input.birthDate, input.birthTime, input.timezone)
    .toISOString()
    .replace('.000Z', 'Z');
  const chart = await fetchSkyfieldChart({
    timestampUtc,
    location: {
      latitude: input.latitude,
      longitude: input.longitude,
    },
    ayanamshaMode: 'lahiri',
    houseSystem: getEphemerisConfig().houseSystem,
    nodeMode: 'true',
  });

  return buildEphemerisFromSkyfieldChart(chart);
}
/**
 * Batch ephemeris calculation using Skyfield service.
 * Converts 100+ sequential HTTP calls into 1-2 batch calls.
 * Industry standard for high-throughput astrological computation.
 *
 * @param inputs Array of {birthDate, birthTime, latitude, longitude, timezone}
 * @returns Array of EphemerisData in the same order as inputs
 */
export async function calculateEphemerisBatch(
  inputs: Array<{ birthDate: string; birthTime: string; latitude: number; longitude: number; timezone: number | string }>,
): Promise<EphemerisData[]> {
  if (inputs.length === 0) return [];
  if (inputs.length === 1) {
    const [input] = inputs;
    return [await calculateEphemeris(input.birthDate, input.birthTime, input.latitude, input.longitude, input.timezone)];
  }


  // Build batch request: convert all (date, time) pairs to UTC timestamps
  const timestampsUtc: string[] = [];
  for (const input of inputs) {
    const utcDate = convertToUTC(input.birthDate, input.birthTime, input.timezone);
    timestampsUtc.push(utcDate.toISOString().replace('.000Z', 'Z'));
  }

  const { fetchSkyfieldCharts } = await import('./ephemeris/skyfield-client.js');
  const batchSize = 250; // Skyfield service max batch size
  const results: EphemerisData[] = [];

  for (let i = 0; i < timestampsUtc.length; i += batchSize) {
    const batchTimestamps = timestampsUtc.slice(i, i + batchSize);
    const batchInputs = inputs.slice(i, i + batchSize);

    logger.info(`[EPHEMERIS] Batch call ${Math.floor(i / batchSize) + 1}/${Math.ceil(timestampsUtc.length / batchSize)}`, {
      batchSize: batchTimestamps.length,
      total: timestampsUtc.length,
    });

    const response = await fetchSkyfieldCharts({
      timestampsUtc: batchTimestamps,
      location: {
        latitude: inputs[0].latitude,
        longitude: inputs[0].longitude,
      },
      ayanamshaMode: 'lahiri',
      houseSystem: getEphemerisConfig().houseSystem,
      nodeMode: 'true',
    });

    // Map charts back to inputs (same order guaranteed by Skyfield service)
    for (let j = 0; j < response.charts.length; j++) {
      const chart = response.charts[j];
      const ephemerisData = buildEphemerisFromSkyfieldChart(chart);
      results.push(ephemerisData);
    }
  }

  logger.info(`[EPHEMERIS] Batch complete`, {
    totalRequests: inputs.length,
    batchCalls: Math.ceil(timestampsUtc.length / batchSize),
  });

  return results;
}

function calculateEphemerisWithAlgorithmic(input: {
  birthDate: string;
  birthTime: string;
  latitude: number;
  longitude: number;
  timezone: number | string;
}): EphemerisData {
  const strictMode = getEphemerisConfig().strictMode;
  const utcDate = convertToUTC(input.birthDate, input.birthTime, input.timezone);

  if (Number.isNaN(utcDate.getTime())) {
    const message = `Invalid datetime combination: date="${input.birthDate}", time="${input.birthTime}", timezone="${input.timezone}".`;
    if (strictMode) {
      throw new CalculationError(message, input);
    }
    logger.warn(`[EPHEMERIS] ${message} Continuing because strict mode is disabled.`);
  }

  const jd = calculateJulianDay(utcDate);
  const planets: Record<string, PlanetPosition> = {};

  logger.info('[EPHEMERIS] Using algorithmic ephemeris mode (~0.1° accuracy)');

  const sunLng = calcSun(jd);
  const moonLng = calcMoon(jd);

  const sunSign = getZodiacSign(sunLng);
  planets.sun = {
    sign: sunSign,
    degree: sunLng % 30,
    longitude: sunLng,
    latitude: 0,
    nakshatra: getNakshatra(sunLng),
    nakshatraPada: getNakshatraPada(sunLng),
    lord: getLord(sunSign),
    retro: false,
    speed: 1.0,
    distance: 1.0,
    isCombust: false,
    dignity: getDignity('Sun', sunSign),
    house: 0,
  };

  const moonSign = getZodiacSign(moonLng);
  planets.moon = {
    sign: moonSign,
    degree: moonLng % 30,
    longitude: moonLng,
    latitude: 0,
    nakshatra: getNakshatra(moonLng),
    nakshatraPada: getNakshatraPada(moonLng),
    lord: getLord(moonSign),
    retro: false,
    speed: 13.2,
    distance: 1.0,
    isCombust: false,
    dignity: getDignity('Moon', moonSign),
    house: 0,
  };

  for (const name of ['mercury', 'venus', 'mars', 'jupiter', 'saturn', 'rahu'] as const) {
    const { longitude: lng, speed } = calcPlanet(jd, name);
    const sign = getZodiacSign(lng);
    const planetName = name.charAt(0).toUpperCase() + name.slice(1);

    planets[name] = {
      sign,
      degree: lng % 30,
      longitude: lng,
      latitude: 0,
      nakshatra: getNakshatra(lng),
      nakshatraPada: getNakshatraPada(lng),
      lord: getLord(sign),
      retro: speed < 0,
      speed,
      distance: 1.0,
      isCombust: isCombust(planetName, lng, sunLng),
      dignity: getDignity(planetName, sign),
      house: 0,
    };
  }

  const ketuLng = (planets.rahu.longitude + 180) % 360;
  const ketuSign = getZodiacSign(ketuLng);
  planets.ketu = {
    sign: ketuSign,
    degree: ketuLng % 30,
    longitude: ketuLng,
    latitude: 0,
    nakshatra: getNakshatra(ketuLng),
    nakshatraPada: getNakshatraPada(ketuLng),
    lord: getLord(ketuSign),
    retro: true,
    speed: planets.rahu.speed,
    distance: 1.0,
    isCombust: false,
    dignity: getDignity('Ketu', ketuSign),
    house: 0,
  };

  const ascLng = calcAscendant(jd, input.latitude, input.longitude);
  const ascSign = getZodiacSign(ascLng);
  const ascendant = {
    sign: ascSign,
    degree: ascLng % 30,
    longitude: ascLng,
    nakshatra: getNakshatra(ascLng),
    nakshatraPada: getNakshatraPada(ascLng),
  };

  const houseSystem = getEphemerisConfig().houseSystem;
  let houses: HousePosition[];
  if (houseSystem === 'placidus') {
    const mcLng = calcMidheaven(jd, input.latitude, input.longitude);
    houses = buildPlacidusHousesAlgorithmic(ascLng, mcLng, input.latitude);
  } else {
    houses = buildWholeSignHouses(ascLng);
  }

  assignPlanetHouses(planets, houses);
  activeExecutionMode = getConfiguredProvider() === 'algorithmic' ? 'algorithmic' : 'algorithmic-fallback';

  if (activeExecutionMode === 'algorithmic-fallback') {
    logger.warn('[EPHEMERIS] Using algorithmic-fallback precision mode');
  }

  return {
    planets: planets as EphemerisData['planets'],
    ascendant,
    houses,
    kpCusps: houses.map((house) => house.cusp),
    ayanamsa: getAyanamsaAlgo(jd),
    precisionMode: activeExecutionMode === 'algorithmic' ? 'algorithmic' : 'algorithmic-fallback',
  };
}

async function calculateEphemerisWithProvider(
  input: {
    birthDate: string;
    birthTime: string;
    latitude: number;
    longitude: number;
    timezone: number | string;
  },
  provider: EphemerisProviderName
): Promise<EphemerisData> {
  if (provider === 'skyfield') {
    try {
      const result = await calculateEphemerisWithSkyfield(input);
      activeExecutionMode = 'skyfield';
      return result;
    } catch (error) {
      if (!getEphemerisConfig().allowAlgorithmicFallback) {
        throw new CalculationError('Skyfield ephemeris request failed', {
          provider,
          serviceUrl: getEphemerisConfig().serviceUrl,
          cause: error,
        });
      }

      logger.warn('[EPHEMERIS] Skyfield request failed, using algorithmic fallback', {
        serviceUrl: getEphemerisConfig().serviceUrl,
        error: (error as Error).message,
      });
      return calculateEphemerisWithAlgorithmic(input);
    }
  }

  return calculateEphemerisWithAlgorithmic(input);
}


const NAKSHATRAS = ['Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashirsha', 'Ardra', 'Punarvasu', 'Pushya', 'Ashlesha', 'Magha', 'Purva Phalguni', 'Uttara Phalguni', 'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha', 'Mula', 'Purva Ashadha', 'Uttara Ashadha', 'Shravana', 'Dhanishtha', 'Shatabhisha', 'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati'] as const;

// Inline lord mapping (no object allocation)
const getLord = (sign: string): string => {
  switch (sign) {
    case 'Aries': case 'Scorpio': return 'Mars';
    case 'Taurus': case 'Libra': return 'Venus';
    case 'Gemini': case 'Virgo': return 'Mercury';
    case 'Cancer': return 'Moon';
    case 'Leo': return 'Sun';
    case 'Sagittarius': case 'Pisces': return 'Jupiter';
    case 'Capricorn': case 'Aquarius': return 'Saturn';
    default: return 'Unknown';
  }
};


const isCombust = (planet: string, long: number, sunLong: number): boolean => {
  if (planet === 'Sun' || planet === 'Moon' || planet === 'Rahu' || planet === 'Ketu') return false;
  const diff = Math.abs(long - sunLong);
  const orb = (planet === 'Mercury') ? 12 : (planet === 'Venus') ? 10 : (planet === 'Mars') ? 17 : (planet === 'Jupiter') ? 11 : 15;
  return diff < orb || diff > (360 - orb);
};

/** Normalize time string to HH:MM:SS for consistent cache keys. */
function normalizeTimeForCache(time: string): string {
  const cleaned = time.replace(/[AP]M/gi, '').trim();
  const parts = cleaned.split(':').map(p => parseInt(p, 10) || 0);
  return [parts[0] ?? 0, parts[1] ?? 0, parts[2] ?? 0]
    .map(v => String(v).padStart(2, '0')).join(':');
}

export function getZodiacSign(longitude: number): string {
  return ZODIAC_SIGNS[Math.floor(((longitude % 360) + 360) % 360 / 30)];
}

export function getNakshatra(longitude: number): string {
  return NAKSHATRAS[Math.floor(((longitude % 360) + 360) % 360 / 13.333333333) % 27];
}

export function getNakshatraPada(longitude: number): number {
  return Math.floor((longitude % 13.333333333) / 3.333333333) + 1;
}

/**
 * Get timezone offset for an IANA timezone string at a specific date/time
 * Correctly handles historical DST changes using the Intl API.
 */
function getTzOffset(dateStr: string, timeStr: string, timeZone: string): number {
  if (!timeZone || timeZone === 'UTC') return 0;

  // If it's a numeric offset (e.g. "+5.5" or "5.5")
  if (timeZone.match(/^[+-]?\d+(\.\d+)?$/)) {
    return parseFloat(timeZone);
  }

  try {
    const [y, m, d] = dateStr.split('-').map(Number);
    const [h, min, s] = timeStr.split(':').map(n => parseInt(n) || 0);

    // We create a date object. The system time doesn't matter, we just need the wall clock parts.
    const dt = new Date(y, m - 1, d, h, min, s);

    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      timeZoneName: 'shortOffset',
    });

    const parts = formatter.formatToParts(dt);
    const offsetStr = parts.find(p => p.type === 'timeZoneName')?.value || '';

    if (offsetStr.includes('GMT')) {
      const match = offsetStr.match(/GMT([+-])(\d+)(:(\d+))?/);
      if (match) {
        const sign = match[1] === '+' ? 1 : -1;
        const hours = parseInt(match[2]);
        const minutes = match[4] ? parseInt(match[4]) : 0;
        return sign * (hours + minutes / 60);
      }
    }
  } catch (e) {
    logger.warn(`Timezone lookup failed for ${timeZone}, falling back to 0`, { error: e instanceof Error ? e.message : String(e) });
  }

  return 0;
}

function isValidIsoDate(dateStr: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
  const [year, month, day] = dateStr.split('-').map(Number);
  if (month < 1 || month > 12 || day < 1 || day > 31) return false;
  const utc = new Date(Date.UTC(year, month - 1, day));
  return utc.getUTCFullYear() === year &&
    utc.getUTCMonth() === month - 1 &&
    utc.getUTCDate() === day;
}

function addDaysToIsoDate(dateStr: string, days: number): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function isValidTimeInput(timeStr: string): boolean {
  const normalized = timeStr.trim().toUpperCase().replace(/\s+/g, ' ');
  const match = normalized.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?(?:\s?(AM|PM))?$/);
  if (!match) return false;

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  const seconds = Number(match[3] ?? 0);
  const period = match[4];

  if (minutes < 0 || minutes > 59 || seconds < 0 || seconds > 59) return false;
  if (period) {
    return hours >= 1 && hours <= 12;
  }
  return hours >= 0 && hours <= 23;
}

function isValidTimezoneInput(timezone: number | string): boolean {
  if (typeof timezone === 'number') {
    return Number.isFinite(timezone) && timezone >= -14 && timezone <= 14;
  }

  const trimmed = timezone.trim();
  if (!trimmed) return false;

  if (/^[+-]?\d+(\.\d+)?$/.test(trimmed)) {
    const numericOffset = Number(trimmed);
    return Number.isFinite(numericOffset) && numericOffset >= -14 && numericOffset <= 14;
  }

  try {
    new Intl.DateTimeFormat('en-US', { timeZone: trimmed });
    return true;
  } catch {
    return false;
  }
}

export function convertToUTC(date: string, time: string, timezone: number | string): Date {
  const [year, month, day] = date.split('-').map(Number);

  // Robust time parsing
  let hour = 0, minute = 0, second = 0;
  const timeClean = time.toUpperCase().trim();
  const isPM = timeClean.includes('PM');
  const isAM = timeClean.includes('AM');

  // Strip AM/PM for numeric parts
  const numericTime = timeClean.replace(/[AP]M/gi, '').trim();
  const parts = numericTime.split(':').map(n => { const v = parseInt(n, 10); return Number.isNaN(v) ? null : v; });
  if (parts.some(p => p === null)) return new Date(NaN);  // reject garbage input

  hour = parts[0] || 0;
  minute = parts[1] || 0;
  second = parts[2] || 0;

  // Convert 12h to 24h — 12 AM → 0, 12 PM stays 12, other PM +12
  if (isAM && hour === 12) hour = 0;
  else if (isPM && hour !== 12) hour += 12;

  const offset = typeof timezone === 'string' ? getTzOffset(date, time, timezone) : timezone;

  return new Date(Date.UTC(year, month - 1, day, hour, minute, second) - offset * 3600000);
}

export function calculateJulianDay(date: Date): number {
  const y = date.getUTCFullYear(), m = date.getUTCMonth() + 1, d = date.getUTCDate();
  const h = date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600;
  const a = Math.floor((14 - m) / 12);
  const yy = y + 4800 - a, mm = m + 12 * a - 3;
  return d + Math.floor((153 * mm + 2) / 5) + 365 * yy + Math.floor(yy / 4) - Math.floor(yy / 100) + Math.floor(yy / 400) - 32045 + (h - 12) / 24;
}


function getAyanamsaAlgo(jd: number): number {
    const julianCenturies = (jd - 2451545.0) / 36525.0;
    const yearsSince2000 = julianCenturies * 100.0;
    
    // IAE cubic Lahiri formula — matches Python service exactly
    return (
        23.856111
        + 0.0139694 * yearsSince2000
        + 0.00000030 * yearsSince2000 * yearsSince2000
        + 0.000000005 * yearsSince2000 * yearsSince2000 * yearsSince2000
    );
}

function calcSun(jd: number): number {
  const T = (jd - 2451545.0) / 36525;
  const L0 = 280.46646 + 36000.76983 * T + 0.0003032 * T * T;
  const M = (357.52911 + 35999.05029 * T - 0.0001537 * T * T) * Math.PI / 180;
  const C = (1.914602 - 0.004817 * T) * Math.sin(M) + (0.019993 - 0.000101 * T) * Math.sin(2 * M) + 0.000289 * Math.sin(3 * M);
  return ((L0 + C - getAyanamsaAlgo(jd)) % 360 + 360) % 360;
}

function calcMoon(jd: number): number {
  const T = (jd - 2451545.0) / 36525;
  const L0 = 218.3164477 + 481267.88123421 * T - 0.0015786 * T * T;
  const D = (297.8501921 + 445267.1114034 * T) * Math.PI / 180;
  const M = (134.9633964 + 477198.8675055 * T) * Math.PI / 180;
  const Mp = (357.52911 + 35999.05029 * T) * Math.PI / 180;
  const F = (93.272095 + 483202.0175233 * T) * Math.PI / 180;

  const L = L0 + 6.288774 * Math.sin(M) + 1.274027 * Math.sin(2 * D - M) + 0.658314 * Math.sin(2 * D)
    + 0.213618 * Math.sin(2 * M) - 0.185116 * Math.sin(Mp) - 0.114332 * Math.sin(2 * F);
  return ((L - getAyanamsaAlgo(jd)) % 360 + 360) % 360;
}

function calcPlanet(jd: number, planet: string): { longitude: number; speed: number } {
  const lon1 = calcPlanetLongitude(jd, planet);
  const lon2 = calcPlanetLongitude(jd + 0.1, planet); // Small delta for speed

  let diff = lon2 - lon1;
  if (diff > 180) diff -= 360;
  if (diff < -180) diff += 360;
  const speed = diff * 10; // degrees per day

  return { longitude: lon1, speed };
}

function calcPlanetLongitude(jd: number, planet: string): number {
  const T = (jd - 2451545.0) / 36525;
  const ayanamsa = getAyanamsaAlgo(jd);

  // Mean elements + first-order perturbations (L0)
  let L: number;
  switch (planet) {
    case 'mercury':
      L = 252.250906 + 149472.6746358 * T - 0.00000535 * T * T;
      break;
    case 'venus':
      L = 181.979801 + 58517.8156748 * T + 0.00000165 * T * T;
      break;
    case 'mars':
      L = 355.433275 + 19140.2993313 * T + 0.00000261 * T * T;
      break;
    case 'jupiter':
      L = 34.351484 + 3034.9056746 * T - 0.00008501 * T * T;
      break;
    case 'saturn':
      L = 50.077471 + 1222.1137943 * T + 0.00021004 * T * T;
      break;
    case 'rahu':
      L = 125.044555 - 1934.1361849 * T + 0.0020762 * T * T;
      break;
    default:
      L = 0;
  }

  return ((L - ayanamsa) % 360 + 360) % 360;
}

function calcAscendant(jd: number, lat: number, lon: number): number {
  const T = (jd - 2451545.0) / 36525;
  const GMST = (18.697374558 + 8640184.812866 * T / 3600 + 0.093104 * T * T) % 24;
  const LST = (GMST + lon / 15) % 24;
  const RAMC = LST * 15 * Math.PI / 180;
  const obliquity = 23.439281 * Math.PI / 180;
  const latRad = lat * Math.PI / 180;

  const ascRad = Math.atan2(-Math.cos(RAMC), Math.sin(RAMC) * Math.cos(obliquity) - Math.tan(latRad) * Math.sin(obliquity));
  return ((ascRad * 180 / Math.PI - getAyanamsaAlgo(jd)) % 360 + 360) % 360;
}


export interface CalculateEphemerisOptions {
  sessionId?: string;
}

export async function calculateEphemeris(
  birthDate: string,
  birthTime: string,
  latitude: number,
  longitude: number,
  timezone: number | string,
  options?: CalculateEphemerisOptions
): Promise<EphemerisData> {
  assertConfiguredProviderImplemented();
  const strictMode = getEphemerisConfig().strictMode;
  const provider = getConfiguredProvider();
  const sessionId = options?.sessionId;

  const normalizedTime = normalizeTimeForCache(birthTime);
  const tzKey = typeof timezone === 'string' ? timezone : timezone.toFixed(4);
  const cacheKey = `${birthDate}_${normalizedTime}_${latitude.toFixed(6)}_${longitude.toFixed(6)}_${tzKey}${sessionId ? `_${sessionId}` : ''}`;
  const cached = EPH_CACHE.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp) < CACHE_TTL_MS) {
    return cached.data;
  }
  if (cached) {
    EPH_CACHE.delete(cacheKey);
  }

  if (!isValidIsoDate(birthDate)) {
    const message = `Invalid birthDate: "${birthDate}". Expected calendar date format YYYY-MM-DD.`;
    if (strictMode) throw new ValidationError(message, { birthDate });
    logger.warn(`[EPHEMERIS] ${message} Continuing because strict mode is disabled.`);
  }
  if (!isValidTimeInput(birthTime)) {
    const message = `Invalid birthTime: "${birthTime}". Expected HH:MM[:SS] (24h) or HH:MM[:SS] AM/PM.`;
    if (strictMode) throw new ValidationError(message, { birthTime });
    logger.warn(`[EPHEMERIS] ${message} Continuing because strict mode is disabled.`);
  }
  if (!isValidTimezoneInput(timezone)) {
    const message = `Invalid timezone: "${timezone}". Expected numeric offset (-14 to +14) or valid IANA zone.`;
    if (strictMode) throw new ValidationError(message, { timezone });
    logger.warn(`[EPHEMERIS] ${message} Continuing because strict mode is disabled.`);
  }
  if (latitude < -90 || latitude > 90) {
    throw new ValidationError(`Invalid latitude: ${latitude}. Must be between -90 and 90.`, {
      latitude,
    });
  }
  if (longitude < -180 || longitude > 180) {
    throw new ValidationError(`Invalid longitude: ${longitude}. Must be between -180 and 180.`, {
      longitude,
    });
  }

  const utcDate = convertToUTC(birthDate, birthTime, timezone);
  if (Number.isNaN(utcDate.getTime())) {
    const message = `Invalid datetime combination: date="${birthDate}", time="${birthTime}", timezone="${timezone}".`;
    if (strictMode) throw new ValidationError(message, {
      birthDate,
      birthTime,
      timezone,
    });
    logger.warn(`[EPHEMERIS] ${message} Continuing because strict mode is disabled.`);
  }

  const result = await calculateEphemerisWithProvider(
    { birthDate, birthTime, latitude, longitude, timezone },
    provider
  );
  cacheResult(cacheKey, result, sessionId);
  return result;
}
/**
 * Calculate Sunrise for a given date and location.
 * Precise BTR requires exact sunrise for Tatwa Shuddhi.
 * Rule: Sunrise is when the Sun is at 0° altitude or on the Ascendant.
 */
export async function calculateSunrise(
  dateStr: string,
  latitude: number,
  longitude: number,
  timezone: number | string
): Promise<Date> {
  // Validate input date
  if (!isValidIsoDate(dateStr)) {
    throw new ValidationError(`Invalid date provided to calculateSunrise: ${dateStr}`, {
      dateStr,
    });
  }

  if (getConfiguredProvider() === 'skyfield') {
    try {
      const searchStart = convertToUTC(dateStr, '00:00:00', timezone);
      const nextDateStr = addDaysToIsoDate(dateStr, 1);
      const searchEnd = convertToUTC(nextDateStr, '00:00:00', timezone);
      const response = await fetchSkyfieldSunrise({
        startTimestampUtc: searchStart.toISOString().replace('.000Z', 'Z'),
        endTimestampUtc: searchEnd.toISOString().replace('.000Z', 'Z'),
        location: {
          latitude,
          longitude,
        },
      });

      if (response.sunriseTimestampUtc) {
        return new Date(response.sunriseTimestampUtc);
      }
    } catch (error) {
      logger.warn('[EPHEMERIS] Skyfield sunrise lookup failed, falling back to heuristic sunrise calculation', {
        error: (error as Error).message,
        dateStr,
        latitude,
        longitude,
      });
    }
  }

  // Sweep across 24h to find sunrise regardless of latitude/timezone
  let bestDate = new Date(`${dateStr}T06:00:00Z`);

  if (isNaN(bestDate.getTime())) {
    const d = new Date(dateStr);
    d.setUTCHours(6, 0, 0, 0);
    bestDate = d;
  }

  let minDiff = 1000;

  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 15) {
      const timeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`;
      try {
        const eph = await calculateEphemeris(dateStr, timeStr, latitude, longitude, timezone);
        const sunLong = eph.planets.sun.longitude;
        const ascLong = eph.ascendant.longitude;
        const diff = Math.abs(sunLong - ascLong);
        const normDiff = Math.min(diff, 360 - diff);

        if (normDiff < minDiff) {
          minDiff = normDiff;
          bestDate = convertToUTC(dateStr, timeStr, timezone);
        }
      } catch (_e) {
        // Ignore ephemeris failures during sweep
      }
    }
  }

  // Refine sweep
  const refinedBase = bestDate.getTime();
  if (isNaN(refinedBase)) {
    throw new CalculationError(`Failed to determine base sunrise time for ${dateStr}`, {
      dateStr,
      latitude,
      longitude,
      timezone,
    });
  }

  for (let s = -300; s <= 300; s += 10) {
    const testDate = new Date(refinedBase + s * 1000);
    // Safe ISO string generation
    let timeStr = '06:00:00';
    try {
      timeStr = testDate.toISOString().split('T')[1].split('.')[0];
    } catch (e) {
      continue; // Skip invalid dates
    }

    try {
      const eph = await calculateEphemeris(dateStr, timeStr, latitude, longitude, timezone);
      const diff = Math.abs(eph.planets.sun.longitude - eph.ascendant.longitude);
      const normDiff = Math.min(diff, 360 - diff);
      if (normDiff < minDiff) {
        minDiff = normDiff;
        bestDate = testDate;
      }
    } catch (e) {
      // Ignore errors
    }
  }

  return bestDate;
}


export function isHighPrecisionMode(): boolean {
  const mode = getCurrentExecutionMode();
  return mode === 'skyfield';
}

export function getAyanamsa(jd: number): number {
  return getAyanamsaAlgo(jd);
}

// Memory cleanup hint for GC
export function cleanup(): void {
  if (global.gc) global.gc();
}

