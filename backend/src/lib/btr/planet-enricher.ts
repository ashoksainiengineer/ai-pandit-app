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
import { ZODIAC_SIGNS, PlanetData } from './types.js';
import { capitalizeFirstLetter } from '../utils/index.js';

export interface EnrichmentContext {
  ascendantSign: string;
  ascendantLongitude: number;
  shadbala: Record<string, any>;
  ashtakavarga: Record<string, number[]>;
  houses: Array<{ sign: string; lord: string }>;
}

export interface EnrichedPlanet extends PlanetData {
  functionalNature: { role: string; reason: string };
  aspects: any[];
  avastha: string;
  d60Deity: string;
  compoundDignity: string;
  shadbalaBreakdown?: any;
  ishtaKashtaPhala?: { ishta: number; kashta: number };
}

/**
 * Enriches all planets in an ephemeris object
 */
export function enrichPlanets(
  planets: Record<string, any>,
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
function extractPlanetLongitudes(planets: Record<string, any>): Record<string, number> {
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
  rawPlanet: any,
  planetLongitudes: Record<string, number>,
  context: EnrichmentContext
): EnrichedPlanet {
  const signIdx = ZODIAC_SIGNS.indexOf(rawPlanet.sign);
  const houseLord = context.houses[signIdx]?.lord || '';

  return {
    sign: rawPlanet.sign,
    degree: formatDegree(rawPlanet.longitude),
    nakshatra: rawPlanet.nakshatra,
    house: rawPlanet.house || calculateHouse(context.ascendantSign, rawPlanet.sign),
    dignity: rawPlanet.dignity || getDignity(planetName, rawPlanet.sign),
    isRetro: rawPlanet.retro,
    speed: rawPlanet.speed,
    isCombust: rawPlanet.isCombust,
    shadbala: context.shadbala?.[planetName],
    bav: context.ashtakavarga?.[planetName]?.[signIdx],
    functionalNature: calculateFunctionalNature(context.ascendantSign, planetName),
    aspects: calculateAspects(planetName, rawPlanet.longitude, planetLongitudes, context.ascendantLongitude),
    avastha: calculateBaladiAvastha(rawPlanet.longitude),
    d60Deity: getD60Deity(rawPlanet.longitude),
    compoundDignity: calculatePanchadhaSambandha(planetName, capitalizeFirstLetter(houseLord), { 
      planets: {}, 
      houses: context.houses,
      ascendant: { sign: context.ascendantSign, longitude: context.ascendantLongitude }
    } as any),
    shadbalaBreakdown: context.shadbala?.[planetName],
    ishtaKashtaPhala: calculateIshtaKashtaPhala(planetName, { 
      planets: {}, 
      houses: context.houses 
    } as any)
  };
}

/**
 * Format longitude as degree string
 */
function formatDegree(longitude: number): string {
  return (longitude % 30).toFixed(4) + '°';
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
