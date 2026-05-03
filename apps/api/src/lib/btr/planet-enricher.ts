/**
 * Planet Enrichment Module
 *
 * Enriches raw planetary data with Vedic astrological calculations
 * including dignity, aspects, avastha, and strength metrics.
 */

import {
  calculateHouse,
  getDignity,
  calculateFunctionalNature,
  calculateAspects,
  calculateBaladiAvastha,
  getD60Deity,
  calculatePanchadhaSambandha,
  calculateIshtaKashtaPhala,
} from '../vedic-astrology-engine.js';
import { ZODIAC_SIGNS, PlanetData, EphemerisData, PlanetPosition } from '@ai-pandit/shared';
import { capitalizeFirstLetter, decimalToDMS } from '../utils/index.js';

export interface EnrichmentContext {
  ascendantSign: string;
  ascendantLongitude: number;
  shadbala: NonNullable<EphemerisData['shadbala']>;
  ashtakavarga: Record<string, number[]>;
  houses: Array<{ sign: string; lord: string }>;
}

export interface EnrichedPlanet extends PlanetData {
  functionalNature: { role: string; reason: string };
  aspects: ReturnType<typeof calculateAspects>;
  avastha: string;
  d60Deity: string;
  compoundDignity: string;
  shadbalaBreakdown?: NonNullable<EphemerisData['shadbala']>[string];
  ishtaKashtaPhala?: { ishta: number; kashta: number };
}

/**
 * Enriches all planets in an ephemeris object
 */
export function enrichPlanets(
  planets: EphemerisData['planets'],
  context: EnrichmentContext
): Record<string, EnrichedPlanet> {
  const planetLongitudes = extractPlanetLongitudes(planets);
  const enriched: Record<string, EnrichedPlanet> = {};

  for (const [key, p] of Object.entries(planets)) {
    const planetName = capitalizeFirstLetter(key);
    enriched[key] = enrichSinglePlanet(planetName, p, planetLongitudes, context);
  }

  return enriched;
}

/**
 * Extract planet longitudes for aspect calculations
 */
function extractPlanetLongitudes(planets: EphemerisData['planets']): Record<string, number> {
  const longitudes: Record<string, number> = {};

  for (const [key, p] of Object.entries(planets)) {
    longitudes[capitalizeFirstLetter(key)] = p.longitude;
  }

  return longitudes;
}

/**
 * Enrich a single planet with all Vedic calculations
 */
function enrichSinglePlanet(
  planetName: string,
  rawPlanet: PlanetPosition,
  planetLongitudes: Record<string, number>,
  context: EnrichmentContext
): EnrichedPlanet {
  const signIdx = ZODIAC_SIGNS.indexOf(rawPlanet.sign);
  const houseLord = context.houses[signIdx]?.lord || '';

  // Fall back to whole-sign house computation when cusp-based house is missing
  let houseNumber = rawPlanet.house;
  if (typeof houseNumber !== 'number' || Number.isNaN(houseNumber) || houseNumber < 1 || houseNumber > 12) {
    houseNumber = ((Math.floor(((rawPlanet.longitude % 360) + 360) % 360 / 30) + 12) % 12) + 1;
  }
  return {
    longitude: rawPlanet.longitude,
    sign: rawPlanet.sign,
    degree: formatDegree(rawPlanet.longitude),
    nakshatra: rawPlanet.nakshatra,
    house: houseNumber,
    dignity: rawPlanet.dignity || getDignity(planetName, rawPlanet.sign),
    // FIXED: Proper null handling for retro status
    isRetro: rawPlanet.retro === true,
    speed: rawPlanet.speed ?? 0,
    isCombust: rawPlanet.isCombust === true,
    shadbala: (context.shadbala?.[planetName] as unknown as number | undefined) ?? undefined,
    bav: (context.ashtakavarga?.[planetName]?.[signIdx] as number | undefined) ?? undefined,
    functionalNature: calculateFunctionalNature(planetName, context.ascendantSign),
    aspects: calculateAspects(planetName, rawPlanet.longitude, planetLongitudes, context.ascendantLongitude),
    avastha: calculateBaladiAvastha(rawPlanet.longitude),
    d60Deity: getD60Deity(rawPlanet.longitude),
    compoundDignity: calculatePanchadhaSambandha(planetName, capitalizeFirstLetter(houseLord)),
    shadbalaBreakdown: context.shadbala?.[planetName],
    ishtaKashtaPhala: calculateIshtaKashtaPhala(planetName, rawPlanet)
  };
}

/**
 * Format longitude as degree string
 */
function formatDegree(longitude: number): string {
  return decimalToDMS(longitude);
}

/**
 * Extract Ishta Kashta Phala from enriched planets
 */
export function extractIshtaKashtaPhala(
  enrichedPlanets: Record<string, EnrichedPlanet>
): Record<string, { ishta: number; kashta: number }> {
  const result: Record<string, { ishta: number; kashta: number }> = {};

  for (const [name, data] of Object.entries(enrichedPlanets)) {
    if (data.ishtaKashtaPhala) {
      result[capitalizeFirstLetter(name)] = data.ishtaKashtaPhala;
    }
  }

  return result;
}
