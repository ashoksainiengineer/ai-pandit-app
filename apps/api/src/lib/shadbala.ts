/**
 * Shadbala Module - Complete 6-Source Planetary Strength
 *
 * Shadbala (Sixfold Strength) is the comprehensive method for evaluating
 * planetary strength in Vedic astrology. Each source contributes to the
 * overall power of a planet.
 *
 * The Six Sources (Bala):
 * 1. Sthana Bala - Positional Strength
 * 2. Dig Bala - Directional Strength
 * 3. Kala Bala - Temporal Strength
 * 4. Chestha Bala - Motional Strength
 * 5. Naisargika Bala - Natural Strength
 * 6. Drig Bala - Aspectual Strength
 *
 * Total strength is measured in Virupas (1 Rupa = 60 Virupas)
 * Strong planet: > 1.5 Rupas (90+ points)
 * Average: 1.0-1.5 Rupas (60-90 points)
 * Weak: < 1.0 Rupa (60 points)
 */

import { EphemerisData, PlanetPosition } from '@ai-pandit/shared';

const ZODIAC_SIGNS = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
];

const PLANETS = ['sun', 'moon', 'mars', 'mercury', 'jupiter', 'venus', 'saturn'];

export interface ShadbalaResult {
  planet: string;
  total: number;
  totalRupas: number;
  strength: 'excellent' | 'good' | 'average' | 'weak';
  breakdown: {
    sthanaBala: number;
    digBala: number;
    kalaBala: number;
    chesthaBala: number;
    naisargikaBala: number;
    drigBala: number;
  };
  details: {
    exaltation: boolean;
    moolatrikona: boolean;
    ownSign: boolean;
    greatFriend: boolean;
    friend: boolean;
    neutral: boolean;
    enemy: boolean;
    greatEnemy: boolean;
    combustion: boolean;
    retrograde: boolean;
    directionalStrong: boolean;
  };
}

export interface ShadbalaSummary {
  planets: Record<string, ShadbalaResult>;
  strongestPlanet: string;
  weakestPlanet: string;
  averageStrength: number;
  benifics: { strong: string[]; weak: string[] };
  malefics: { strong: string[]; weak: string[] };
}

const EXALTATION_DEGREES: Record<string, number> = {
  sun: 10, moon: 3, mars: 298, mercury: 165,
  jupiter: 95, venus: 357, saturn: 200
};

const EXALTATION_SIGNS: Record<string, string> = {
  sun: 'Aries', moon: 'Taurus', mars: 'Capricorn', mercury: 'Virgo',
  jupiter: 'Cancer', venus: 'Pisces', saturn: 'Libra'
};

const DEBILITATION_SIGNS: Record<string, string> = {
  sun: 'Libra', moon: 'Scorpio', mars: 'Cancer', mercury: 'Pisces',
  jupiter: 'Capricorn', venus: 'Virgo', saturn: 'Aries'
};

const MOOLATRIKONA_SIGNS: Record<string, string> = {
  sun: 'Leo', moon: 'Taurus', mars: 'Aries', mercury: 'Virgo',
  jupiter: 'Sagittarius', venus: 'Libra', saturn: 'Aquarius'
};

const OWN_SIGNS: Record<string, string[]> = {
  sun: ['Leo'], moon: ['Cancer'], mars: ['Aries', 'Scorpio'],
  mercury: ['Gemini', 'Virgo'], jupiter: ['Sagittarius', 'Pisces'],
  venus: ['Taurus', 'Libra'], saturn: ['Capricorn', 'Aquarius']
};

const DIG_BALA_HOUSES: Record<string, number> = {
  sun: 10, moon: 4, mars: 10, mercury: 1,
  jupiter: 1, venus: 4, saturn: 7
};

const NAISARGIKA_BALA: Record<string, number> = {
  sun: 60, moon: 51.43, venus: 42.86, jupiter: 34.29,
  mercury: 25.71, mars: 17.14, saturn: 8.57
};

const NATURAL_FRIENDS: Record<string, string[]> = {
  sun: ['moon', 'mars', 'jupiter'],
  moon: ['sun', 'mercury'],
  mars: ['sun', 'moon', 'jupiter'],
  mercury: ['sun', 'venus'],
  jupiter: ['sun', 'moon', 'mars'],
  venus: ['mercury', 'saturn'],
  saturn: ['mercury', 'venus']
};

const NATURAL_NEUTRALS: Record<string, string[]> = {
  sun: ['mercury'],
  moon: ['mars', 'jupiter', 'venus', 'saturn'],
  mars: ['venus', 'saturn'],
  mercury: ['mars', 'jupiter', 'saturn'],
  jupiter: ['saturn'],
  venus: ['mars', 'jupiter'],
  saturn: ['sun', 'moon', 'mars', 'jupiter']
};

const COMBUSTION_ORBS: Record<string, number> = {
  mercury: 12, venus: 8, mars: 17, jupiter: 11, saturn: 15
};

export function calculateFullShadbala(ephemeris: EphemerisData): ShadbalaSummary {
  const results: Record<string, ShadbalaResult> = {};
  
  for (const planet of PLANETS) {
    const pos = ephemeris.planets[planet];
    if (!pos) continue;
    
    results[planet] = calculatePlanetShadbala(planet, pos, ephemeris);
  }
  
  return generateSummary(results);
}

function calculatePlanetShadbala(
  planet: string,
  pos: PlanetPosition,
  ephemeris: EphemerisData
): ShadbalaResult {
  const sthanaBala = calculateSthanaBala(planet, pos, ephemeris);
  const digBala = calculateDigBala(planet, pos, ephemeris);
  const kalaBala = calculateKalaBala(planet, ephemeris);
  const chesthaBala = calculateChesthaBala(planet, pos);
  const naisargikaBala = calculateNaisargikaBala(planet);
  const drigBala = calculateDrigBala(planet, ephemeris);
  
  const total = sthanaBala + digBala + kalaBala + 
                chesthaBala + naisargikaBala + drigBala;
  const totalRupas = total / 60;
  
  let strength: 'excellent' | 'good' | 'average' | 'weak';
  if (total >= 90) strength = 'excellent';
  else if (total >= 70) strength = 'good';
  else if (total >= 50) strength = 'average';
  else strength = 'weak';
  
  const details = analyzePlanetDetails(planet, pos, ephemeris);
  
  return {
    planet,
    total,
    totalRupas: Math.round(totalRupas * 100) / 100,
    strength,
    breakdown: {
      sthanaBala: Math.round(sthanaBala),
      digBala: Math.round(digBala),
      kalaBala: Math.round(kalaBala),
      chesthaBala: Math.round(chesthaBala),
      naisargikaBala: Math.round(naisargikaBala),
      drigBala: Math.round(drigBala)
    },
    details
  };
}

function calculateSthanaBala(
  planet: string,
  pos: PlanetPosition,
  ephemeris: EphemerisData
): number {
  let bala = 0;
  const sign = pos.sign;
  
  if (sign === EXALTATION_SIGNS[planet]) {
    const exaltDeg = EXALTATION_DEGREES[planet];
    const distance = Math.abs(pos.degree - exaltDeg);
    bala += 60 - (distance * 2);
  } else if (sign === DEBILITATION_SIGNS[planet]) {
    bala += 0;
  } else if (sign === MOOLATRIKONA_SIGNS[planet]) {
    bala += 45;
  } else if (OWN_SIGNS[planet]?.includes(sign)) {
    bala += 30;
  } else {
    const signLord = getSignLord(sign);
    const relationship = getRelationship(planet, signLord);
    
    switch (relationship) {
      case 'greatFriend': bala += 20; break;
      case 'friend': bala += 15; break;
      case 'neutral': bala += 10; break;
      case 'enemy': bala += 5; break;
      case 'greatEnemy': bala += 2; break;
      default: bala += 10;
    }
  }
  
  const avasthaBala = calculateAvasthaBala(pos.degree);
  bala += avasthaBala;
  
  return Math.max(0, Math.min(60, bala));
}

function calculateDigBala(
  planet: string,
  pos: PlanetPosition,
  ephemeris: EphemerisData
): number {
  const targetHouse = DIG_BALA_HOUSES[planet];
  const currentHouse = pos.house;
  
  const distance = Math.abs(currentHouse - targetHouse);
  const normalizedDistance = Math.min(distance, 12 - distance);
  
  return Math.max(0, 60 - (normalizedDistance * 10));
}

function calculateKalaBala(
  planet: string,
  ephemeris: EphemerisData
): number {
  let bala = 25;

  // Derive day/night from chart state (Sun above/below horizon), not wall-clock time.
  const sunHouse = ephemeris.planets.sun?.house;
  const isDayBirth = typeof sunHouse === 'number' ? sunHouse >= 7 && sunHouse <= 12 : true;
  
  const dayPlanets = ['sun', 'jupiter', 'venus'];
  const nightPlanets = ['moon', 'mars', 'saturn'];
  
  if (isDayBirth && dayPlanets.includes(planet)) {
    bala += 15;
  } else if (!isDayBirth && nightPlanets.includes(planet)) {
    bala += 15;
  }
  
  const season = inferSeasonFromSunSign(ephemeris.planets.sun?.sign);
  if (['sun', 'mars'].includes(planet) && season === 'spring') {
    bala += 10;
  } else if (['moon', 'venus'].includes(planet) && season === 'summer') {
    bala += 10;
  } else if (['mercury', 'jupiter'].includes(planet) && season === 'autumn') {
    bala += 10;
  } else if (planet === 'saturn' && season === 'winter') {
    bala += 10;
  }
  
  return Math.min(60, bala);
}

function inferSeasonFromSunSign(sign?: string): 'spring' | 'summer' | 'autumn' | 'winter' {
  switch (sign) {
    case 'Pisces':
    case 'Aries':
    case 'Taurus':
      return 'spring';
    case 'Gemini':
    case 'Cancer':
    case 'Leo':
      return 'summer';
    case 'Virgo':
    case 'Libra':
    case 'Scorpio':
      return 'autumn';
    case 'Sagittarius':
    case 'Capricorn':
    case 'Aquarius':
    default:
      return 'winter';
  }
}

function calculateChesthaBala(planet: string, pos: PlanetPosition): number {
  let bala = 30;
  
  if (pos.retro) {
    bala += 30;
  }
  
  if (pos.speed !== undefined) {
    const speed = Math.abs(pos.speed);
    const maxSpeed = planet === 'moon' ? 15 : 
                     planet === 'mercury' ? 2 : 
                     planet === 'venus' ? 1.5 : 1;
    
    if (speed > maxSpeed * 0.8) {
      bala += 10;
    } else if (speed < maxSpeed * 0.3) {
      bala -= 10;
    }
  }
  
  return Math.max(0, Math.min(60, bala));
}

function calculateNaisargikaBala(planet: string): number {
  return NAISARGIKA_BALA[planet] || 25;
}

function calculateDrigBala(planet: string, ephemeris: EphemerisData): number {
  let bala = 30;
  
  const benefics = ['jupiter', 'venus', 'mercury'];
  const malefics = ['saturn', 'mars', 'sun'];
  
  for (const otherPlanet of PLANETS) {
    if (otherPlanet === planet) continue;
    
    const otherPos = ephemeris.planets[otherPlanet];
    if (!otherPos) continue;
    
    const aspectStrength = getAspectStrength(planet, otherPlanet, ephemeris);
    
    if (benefics.includes(otherPlanet)) {
      bala += aspectStrength * 3;
    } else if (malefics.includes(otherPlanet)) {
      bala -= aspectStrength * 2;
    }
  }
  
  return Math.max(0, Math.min(60, bala));
}

function getAspectStrength(
  planet: string,
  aspectingPlanet: string,
  ephemeris: EphemerisData
): number {
  const planetPos = ephemeris.planets[planet];
  const aspectingPos = ephemeris.planets[aspectingPlanet];
  
  if (!planetPos || !aspectingPos) return 0;
  
  const planetHouse = planetPos.house;
  const aspectingHouse = aspectingPos.house;
  
  let houseDistance = Math.abs(planetHouse - aspectingHouse);
  if (houseDistance > 6) houseDistance = 12 - houseDistance;
  
  const specialAspects: Record<string, number[]> = {
    mars: [4, 8],
    jupiter: [5, 9],
    saturn: [3, 10]
  };
  
  if (houseDistance === 7) return 1.0;
  
  const aspects = specialAspects[aspectingPlanet];
  if (aspects && aspects.includes(houseDistance)) return 0.75;
  
  return 0;
}

function calculateAvasthaBala(degree: number): number {
  if (degree < 6) return -5;
  if (degree < 12) return 5;
  if (degree < 18) return 15;
  if (degree < 24) return 5;
  return -5;
}

function analyzePlanetDetails(
  planet: string,
  pos: PlanetPosition,
  ephemeris: EphemerisData
): ShadbalaResult['details'] {
  const sign = pos.sign;
  
  return {
    exaltation: sign === EXALTATION_SIGNS[planet],
    moolatrikona: sign === MOOLATRIKONA_SIGNS[planet],
    ownSign: OWN_SIGNS[planet]?.includes(sign) || false,
    greatFriend: isGreatFriend(planet, sign),
    friend: isFriend(planet, sign),
    neutral: isNeutral(planet, sign),
    enemy: isEnemy(planet, sign),
    greatEnemy: isGreatEnemy(planet, sign),
    combustion: checkCombustion(planet, pos, ephemeris),
    retrograde: pos.retro || false,
    directionalStrong: pos.house === DIG_BALA_HOUSES[planet]
  };
}

function generateSummary(results: Record<string, ShadbalaResult>): ShadbalaSummary {
  const planets = Object.keys(results);
  
  let strongest = planets[0];
  let weakest = planets[0];
  let totalStrength = 0;
  
  for (const planet of planets) {
    const strength = results[planet].total;
    totalStrength += strength;
    
    if (strength > results[strongest].total) strongest = planet;
    if (strength < results[weakest].total) weakest = planet;
  }
  
  const benifics = ['jupiter', 'venus', 'moon', 'mercury'];
  const malefics = ['saturn', 'mars', 'sun'];
  
  const strongBenifics = benifics.filter(p => results[p]?.strength === 'excellent' || results[p]?.strength === 'good');
  const weakBenifics = benifics.filter(p => results[p]?.strength === 'weak');
  const strongMalefics = malefics.filter(p => results[p]?.strength === 'excellent' || results[p]?.strength === 'good');
  const weakMalefics = malefics.filter(p => results[p]?.strength === 'weak');
  
  return {
    planets: results,
    strongestPlanet: strongest,
    weakestPlanet: weakest,
    averageStrength: Math.round(totalStrength / planets.length),
    benifics: { strong: strongBenifics, weak: weakBenifics },
    malefics: { strong: strongMalefics, weak: weakMalefics }
  };
}

function getSignLord(sign: string): string {
  const lords: Record<string, string> = {
    'Aries': 'mars', 'Taurus': 'venus', 'Gemini': 'mercury', 'Cancer': 'moon',
    'Leo': 'sun', 'Virgo': 'mercury', 'Libra': 'venus', 'Scorpio': 'mars',
    'Sagittarius': 'jupiter', 'Capricorn': 'saturn', 'Aquarius': 'saturn', 'Pisces': 'jupiter'
  };
  return lords[sign] || 'jupiter';
}

function getRelationship(planet: string, lord: string): string {
  if (planet === lord) return 'own';
  
  if (NATURAL_FRIENDS[planet]?.includes(lord)) {
    if (NATURAL_FRIENDS[lord]?.includes(planet)) return 'greatFriend';
    return 'friend';
  }
  
  if (NATURAL_NEUTRALS[planet]?.includes(lord)) {
    return 'neutral';
  }
  
  if (NATURAL_FRIENDS[planet]?.includes(lord)) {
    return 'enemy';
  }
  
  return 'greatEnemy';
}

function isGreatFriend(planet: string, sign: string): boolean {
  const lord = getSignLord(sign);
  return NATURAL_FRIENDS[planet]?.includes(lord) && NATURAL_FRIENDS[lord]?.includes(planet);
}

function isFriend(planet: string, sign: string): boolean {
  const lord = getSignLord(sign);
  return NATURAL_FRIENDS[planet]?.includes(lord) && !NATURAL_FRIENDS[lord]?.includes(planet);
}

function isNeutral(planet: string, sign: string): boolean {
  const lord = getSignLord(sign);
  return NATURAL_NEUTRALS[planet]?.includes(lord);
}

function isEnemy(planet: string, sign: string): boolean {
  const lord = getSignLord(sign);
  return !NATURAL_FRIENDS[planet]?.includes(lord) && 
         !NATURAL_NEUTRALS[planet]?.includes(lord) &&
         NATURAL_FRIENDS[lord]?.includes(planet);
}

function isGreatEnemy(planet: string, sign: string): boolean {
  const lord = getSignLord(sign);
  return !NATURAL_FRIENDS[planet]?.includes(lord) && 
         !NATURAL_NEUTRALS[planet]?.includes(lord) &&
         !NATURAL_FRIENDS[lord]?.includes(planet);
}

function checkCombustion(planet: string, pos: PlanetPosition, ephemeris: EphemerisData): boolean {
  if (planet === 'sun' || planet === 'moon') return false;
  
  const sunPos = ephemeris.planets.sun;
  if (!sunPos) return false;
  
  const orb = COMBUSTION_ORBS[planet] || 10;
  const diff = Math.abs(pos.longitude - sunPos.longitude);
  const normalizedDiff = Math.min(diff, 360 - diff);
  
  return normalizedDiff < orb;
}

export function formatShadbalaResult(result: ShadbalaResult): string {
  const lines = [
    `${result.planet.toUpperCase()} SHADBALA:`,
    `  Total: ${result.totalRupas.toFixed(2)} Rupas (${result.total} points) - ${result.strength.toUpperCase()}`,
    `  Sthana Bala (Position): ${result.breakdown.sthanaBala}`,
    `  Dig Bala (Direction): ${result.breakdown.digBala}`,
    `  Kala Bala (Temporal): ${result.breakdown.kalaBala}`,
    `  Chestha Bala (Motion): ${result.breakdown.chesthaBala}`,
    `  Naisargika Bala (Natural): ${result.breakdown.naisargikaBala}`,
    `  Drig Bala (Aspectual): ${result.breakdown.drigBala}`,
    ''
  ];
  
  const details = result.details;
  const statuses: string[] = [];
  if (details.exaltation) statuses.push('Exalted');
  if (details.moolatrikona) statuses.push('Moolatrikona');
  if (details.ownSign) statuses.push('Own Sign');
  if (details.retrograde) statuses.push('Retrograde');
  if (details.combustion) statuses.push('Combust');
  if (details.directionalStrong) statuses.push('Directionally Strong');
  
  if (statuses.length > 0) {
    lines.push(`  Status: ${statuses.join(', ')}`);
  }
  
  return lines.join('\n');
}

export function formatShadbalaSummary(summary: ShadbalaSummary): string {
  const lines = [
    'SHADBALA SUMMARY (6-Source Planetary Strength)',
    '='.repeat(50),
    ''
  ];
  
  for (const planet of PLANETS) {
    const result = summary.planets[planet];
    if (result) {
      lines.push(`${planet.toUpperCase()}: ${result.totalRupas.toFixed(2)} Rupas (${result.strength})`);
    }
  }
  
  lines.push('');
  lines.push(`Strongest Planet: ${summary.strongestPlanet.toUpperCase()}`);
  lines.push(`Weakest Planet: ${summary.weakestPlanet.toUpperCase()}`);
  lines.push(`Average Strength: ${summary.averageStrength} points`);
  lines.push('');
  lines.push(`Strong Benefics: ${summary.benifics.strong.join(', ') || 'None'}`);
  lines.push(`Weak Benefics: ${summary.benifics.weak.join(', ') || 'None'}`);
  lines.push(`Strong Malefics: ${summary.malefics.strong.join(', ') || 'None'}`);
  lines.push(`Weak Malefics: ${summary.malefics.weak.join(', ') || 'None'}`);
  
  return lines.join('\n');
}

export const Shadbala = {
  calculate: calculateFullShadbala,
  formatResult: formatShadbalaResult,
  formatSummary: formatShadbalaSummary
};
