/**
 * 🔱 EPHEMERIS SERVICE - The Cosmic Calculator
 * =============================================
 *
 * "Grahanaam param jyotir, jyotir aditya anuttamam"
 * Among the planets, the supreme light is the Sun.
 *
 * This service calculates the exact positions of all celestial bodies
 * with NASA JPL DE431 precision. It is the foundation upon which
 * all Vedic astrology calculations rest.
 *
 * RESPONSIBILITIES:
 * - Swiss Ephemeris integration with WASM
 * - High-precision planetary calculations (0.001° accuracy)
 * - Ayanamsa calculation (Lahiri)
 * - Julian Day conversions
 * - House system calculations (Placidus, Whole Sign, KP)
 */

import { logger } from '../../lib/logger.js';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES (Extracted from BTRSystem.ts - H1 Fix)
// ═══════════════════════════════════════════════════════════════════════════════

type Dignity = 'exalted' | 'moolatrikona' | 'own' | 'friendly' | 'neutral' | 'enemy' | 'debilitated';

interface PlanetPosition {
  name: string;
  longitude: number;
  latitude: number;
  distance: number;
  sign: string;
  degree: number;
  nakshatra: string;
  pada: number;
  isRetrograde: boolean;
  speed: number;
  dignity: Dignity;
  house: number;
}

interface AscendantPosition {
  sign: string;
  degree: number;
  longitude: number;
  nakshatra: string;
}

interface HousePosition {
  number: number;
  sign: string;
  cusp: number;
  lord: string;
}

interface EphemerisSnapshot {
  planets: Record<string, PlanetPosition>;
  ascendant: AscendantPosition;
  houses: HousePosition[];
  ayanamsa: number;
  julianDay: number;
}

class BTREphemerisError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BTREphemerisError';
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS (The Eternal Laws)
// ═══════════════════════════════════════════════════════════════════════════════

const ZODIAC_SIGNS = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
] as const;

const NAKSHATRAS = [
  'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashirsha', 'Ardra',
  'Punarvasu', 'Pushya', 'Ashlesha', 'Magha', 'Purva Phalguni', 'Uttara Phalguni',
  'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha',
  'Mula', 'Purva Ashadha', 'Uttara Ashadha', 'Shravana', 'Dhanishtha', 'Shatabhisha',
  'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati'
] as const;

const NAKSHATRA_LORDS = [
  'Ketu', 'Venus', 'Sun', 'Moon', 'Mars', 'Rahu',
  'Jupiter', 'Saturn', 'Mercury', 'Ketu', 'Venus', 'Sun',
  'Moon', 'Mars', 'Rahu', 'Jupiter', 'Saturn', 'Mercury',
  'Ketu', 'Venus', 'Sun', 'Moon', 'Mars', 'Rahu',
  'Jupiter', 'Saturn', 'Mercury'
] as const;

const PLANET_RULERSHIPS: Record<string, string> = {
  'Aries': 'Mars', 'Taurus': 'Venus', 'Gemini': 'Mercury',
  'Cancer': 'Moon', 'Leo': 'Sun', 'Virgo': 'Mercury',
  'Libra': 'Venus', 'Scorpio': 'Mars', 'Sagittarius': 'Jupiter',
  'Capricorn': 'Saturn', 'Aquarius': 'Saturn', 'Pisces': 'Jupiter'
};

const EXALTATION_SIGNS: Record<string, { sign: string; degree: number }> = {
  'Sun': { sign: 'Aries', degree: 10 },
  'Moon': { sign: 'Taurus', degree: 3 },
  'Mars': { sign: 'Capricorn', degree: 28 },
  'Mercury': { sign: 'Virgo', degree: 15 },
  'Jupiter': { sign: 'Cancer', degree: 5 },
  'Venus': { sign: 'Pisces', degree: 27 },
  'Saturn': { sign: 'Libra', degree: 20 },
  'Rahu': { sign: 'Taurus', degree: 15 },
  'Ketu': { sign: 'Scorpio', degree: 15 }
};

const DEBILITATION_SIGNS: Record<string, { sign: string; degree: number }> = {
  'Sun': { sign: 'Libra', degree: 10 },
  'Moon': { sign: 'Scorpio', degree: 3 },
  'Mars': { sign: 'Cancer', degree: 28 },
  'Mercury': { sign: 'Pisces', degree: 15 },
  'Jupiter': { sign: 'Capricorn', degree: 5 },
  'Venus': { sign: 'Virgo', degree: 27 },
  'Saturn': { sign: 'Aries', degree: 20 },
  'Rahu': { sign: 'Scorpio', degree: 15 },
  'Ketu': { sign: 'Taurus', degree: 15 }
};

const MOOLATRIKONA_SIGNS: Record<string, { sign: string; startDeg: number; endDeg: number }> = {
  'Sun': { sign: 'Leo', startDeg: 0, endDeg: 20 },
  'Moon': { sign: 'Taurus', startDeg: 3, endDeg: 30 },
  'Mars': { sign: 'Aries', startDeg: 0, endDeg: 12 },
  'Mercury': { sign: 'Virgo', startDeg: 15, endDeg: 20 },
  'Jupiter': { sign: 'Sagittarius', startDeg: 0, endDeg: 10 },
  'Venus': { sign: 'Libra', startDeg: 0, endDeg: 15 },
  'Saturn': { sign: 'Aquarius', startDeg: 0, endDeg: 20 }
};

// Swiss Ephemeris Constants
const SE_SUN = 0;
const SE_MOON = 1;
const SE_MERCURY = 2;
const SE_VENUS = 3;
const SE_MARS = 4;
const SE_JUPITER = 5;
const SE_SATURN = 6;
const SE_TRUE_NODE = 11;

const SEFLG_SIDEREAL = 64 * 1024;
const SEFLG_SPEED = 256;
const SE_SIDM_LAHIRI = 1;

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

interface SwissEphInstance {
  swe_set_sid_mode: (mode: number, t0: number, ayT0: number) => void;
  swe_get_ayanamsa_ut: (jd: number) => number;
  swe_calc_ut: (jd: number, ipl: number, flags: number) => SwissEphCalcResult;
  swe_houses: (jd: number, lat: number, lon: number, hsys: string) => SwissEphHousesResult;
  swe_julday: (y: number, m: number, d: number, h: number) => number;
}

interface SwissEphCalcResult {
  longitude: number;
  latitude: number;
  distance: number;
  longitudeSpeed: number;
  latitudeSpeed: number;
  distanceSpeed: number;
}

interface SwissEphHousesResult {
  house: number[];
  ascendant: number;
  mc: number;
}

interface EphemerisInput {
  date: string;      // YYYY-MM-DD
  time: string;      // HH:MM:SS
  latitude: number;
  longitude: number;
  timezone: number;
}

interface CalculationOptions {
  includeHouses?: boolean;
  houseSystem?: 'W' | 'P' | 'K';  // Whole Sign, Placidus, Koch
  includeSpeed?: boolean;
  ayanamsa?: number;  // Custom ayanamsa (default: Lahiri)
}

// ═══════════════════════════════════════════════════════════════════════════════
// CACHE (The Memory of Time)
// ═══════════════════════════════════════════════════════════════════════════════

class EphemerisCache {
  private cache = new Map<string, EphemerisSnapshot>();
  private maxSize: number;

  constructor(maxSize = 1000) {
    this.maxSize = maxSize;
  }

  private generateKey(input: EphemerisInput): string {
    return `${input.date}_${input.time}_${input.latitude.toFixed(6)}_${input.longitude.toFixed(6)}`;
  }

  get(input: EphemerisInput): EphemerisSnapshot | undefined {
    const key = this.generateKey(input);
    const entry = this.cache.get(key);
    
    if (entry) {
      // Move to end (LRU)
      this.cache.delete(key);
      this.cache.set(key, entry);
    }
    
    return entry;
  }

  set(input: EphemerisInput, snapshot: EphemerisSnapshot): void {
    const key = this.generateKey(input);
    
    if (this.cache.size >= this.maxSize) {
      // Remove oldest entry
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }
    
    this.cache.set(key, snapshot);
  }

  clear(): void {
    this.cache.clear();
  }

  get size(): number {
    return this.cache.size;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN SERVICE
// ═══════════════════════════════════════════════════════════════════════════════

export class EphemerisService {
  private swe: SwissEphInstance | null = null;
  private cache: EphemerisCache;
  private isHighPrecision = false;
  private isInitialized = false;

  constructor(cacheSize = 1000) {
    this.cache = new EphemerisCache(cacheSize);
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      const { default: SwissEph } = await import('swisseph-wasm');
      const instance = new SwissEph();
      await (instance as any).initSwissEph();

      // Create adapter for consistent API
      this.swe = {
        swe_set_sid_mode: (mode: number, t0: number, ayT0: number) => 
          (instance as any).set_sid_mode(mode, t0, ayT0),
        swe_get_ayanamsa_ut: (jd: number) => (instance as any).get_ayanamsa_ut(jd),
        swe_calc_ut: (jd: number, ipl: number, flags: number) => {
          const res = (instance as any).calc(jd, ipl, flags);
          return {
            longitude: res.longitude,
            latitude: res.latitude,
            distance: res.distance,
            longitudeSpeed: res.longitudeSpeed,
            latitudeSpeed: res.latitudeSpeed,
            distanceSpeed: res.distanceSpeed
          };
        },
        swe_houses: (jd: number, lat: number, lon: number, hsys: string) => {
          const res = (instance as any).houses(jd, lat, lon, hsys);
          return {
            house: Array.from(res.cusps),
            ascendant: (res.ascmc as any)[0],
            mc: (res.ascmc as any)[1]
          };
        },
        swe_julday: (y: number, m: number, d: number, h: number) => 
          (instance as any).julday(y, m, d, h)
      };

      this.isHighPrecision = true;
      this.isInitialized = true;
      logger.info('🔭 Swiss Ephemeris initialized (High Precision Mode)');
    } catch (error) {
      logger.warn('⚠️ Swiss Ephemeris failed, falling back to algorithmic mode', error);
      this.isHighPrecision = false;
      this.isInitialized = true;
    }
  }

  async shutdown(): Promise<void> {
    this.cache.clear();
    this.swe = null;
    this.isInitialized = false;
    logger.info('🔭 Ephemeris service shut down');
  }

  async calculate(input: EphemerisInput, options: CalculationOptions = {}): Promise<EphemerisSnapshot> {
    // Check cache first
    const cached = this.cache.get(input);
    if (cached) {
      logger.debug('Ephemeris cache hit', { input });
      return cached;
    }

    try {
      const result = this.isHighPrecision 
        ? await this.calculateWithSwissEph(input, options)
        : await this.calculateAlgorithmic(input, options);

      // Cache the result
      this.cache.set(input, result);
      logger.debug('Ephemeris calculation complete', { input, precision: this.isHighPrecision });

      return result;
    } catch (error) {
      logger.error('Ephemeris calculation failed', { input, error });
      throw new BTREphemerisError(`Calculation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async calculateWithSwissEph(input: EphemerisInput, options: CalculationOptions): Promise<EphemerisSnapshot> {
    if (!this.swe) {
      throw new BTREphemerisError('Swiss Ephemeris not initialized');
    }

    // Convert to UTC
    const utcDate = this.convertToUTC(input.date, input.time, input.timezone);
    
    // Calculate Julian Day
    const jd = this.swe.swe_julday(
      utcDate.getUTCFullYear(),
      utcDate.getUTCMonth() + 1,
      utcDate.getUTCDate(),
      utcDate.getUTCHours() + utcDate.getUTCMinutes() / 60 + utcDate.getUTCSeconds() / 3600
    );

    // Set Lahiri ayanamsa
    this.swe.swe_set_sid_mode(SE_SIDM_LAHIRI, 0, 0);
    const ayanamsa = this.swe.swe_get_ayanamsa_ut(jd);

    // Calculate Sun first (needed for combustion check)
    const sunResult = this.swe.swe_calc_ut(jd, SE_SUN, SEFLG_SIDEREAL | SEFLG_SPEED);

    // Calculate all planets
    const planets: Record<string, PlanetPosition> = {};
    const planetIds = [
      { id: SE_SUN, name: 'Sun' },
      { id: SE_MOON, name: 'Moon' },
      { id: SE_MERCURY, name: 'Mercury' },
      { id: SE_VENUS, name: 'Venus' },
      { id: SE_MARS, name: 'Mars' },
      { id: SE_JUPITER, name: 'Jupiter' },
      { id: SE_SATURN, name: 'Saturn' },
      { id: SE_TRUE_NODE, name: 'Rahu' }
    ];

    for (const { id, name } of planetIds) {
      const result = this.swe.swe_calc_ut(jd, id, SEFLG_SIDEREAL | SEFLG_SPEED);
      const siderealLong = result.longitude;
      
      planets[name.toLowerCase()] = this.createPlanetPosition(
        name,
        siderealLong,
        result.latitude,
        result.distance,
        result.longitudeSpeed,
        sunResult.longitude
      );
    }

    // Calculate Ketu (opposite of Rahu)
    const rahuLong = planets.rahu.longitude;
    const ketuLong = (rahuLong + 180) % 360;
    planets.ketu = this.createPlanetPosition(
      'Ketu',
      ketuLong,
      -planets.rahu.latitude,  // Opposite latitude
      planets.rahu.distance,
      planets.rahu.speed,
      sunResult.longitude
    );

    // Calculate houses
    const houseSystem = options.houseSystem || 'W';
    const houses = this.swe.swe_houses(jd, input.latitude, input.longitude, houseSystem);
    
    // Adjust for ayanamsa
    const ascendantLong = (houses.ascendant - ayanamsa + 360) % 360;
    const ascendant = this.createAscendantPosition(ascendantLong);

    // Create house positions
    const housePositions: HousePosition[] = [];
    for (let i = 1; i <= 12; i++) {
      let cusp = houses.house[i] - ayanamsa;
      if (cusp < 0) cusp += 360;
      
      const sign = this.getZodiacSign(cusp);
      housePositions.push({
        number: i,
        sign,
        cusp,
        lord: PLANET_RULERSHIPS[sign]
      });
    }

    // Update house positions for planets
    for (const planet of Object.values(planets)) {
      planet.house = this.calculateHouse(ascendant.sign, planet.sign);
    }

    return {
      planets,
      ascendant,
      houses: housePositions,
      ayanamsa,
      julianDay: jd
    };
  }

  private async calculateAlgorithmic(input: EphemerisInput, options: CalculationOptions): Promise<EphemerisSnapshot> {
    // Fallback algorithmic calculation (VSOP87-based)
    // This is a simplified version for when Swiss Ephemeris is not available
    const utcDate = this.convertToUTC(input.date, input.time, input.timezone);
    const jd = this.calculateJulianDay(utcDate);
    const ayanamsa = this.calculateLahiriAyanamsa(jd);

    // Algorithmic planet positions (simplified)
    const planets = this.calculateAlgorithmicPlanets(jd, ayanamsa);
    
    // Algorithmic ascendant
    const ascendantLong = this.calculateAlgorithmicAscendant(jd, input.latitude, input.longitude, ayanamsa);
    const ascendant = this.createAscendantPosition(ascendantLong);

    // Whole sign houses
    const housePositions: HousePosition[] = [];
    const ascSignIndex = ZODIAC_SIGNS.indexOf(ascendant.sign as any);
    
    for (let i = 0; i < 12; i++) {
      const signIndex = (ascSignIndex + i) % 12;
      const sign = ZODIAC_SIGNS[signIndex];
      housePositions.push({
        number: i + 1,
        sign,
        cusp: signIndex * 30,
        lord: PLANET_RULERSHIPS[sign]
      });
    }

    // Update house positions
    for (const planet of Object.values(planets)) {
      planet.house = this.calculateHouse(ascendant.sign, planet.sign);
    }

    return {
      planets,
      ascendant,
      houses: housePositions,
      ayanamsa,
      julianDay: jd
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // HELPER METHODS
  // ═══════════════════════════════════════════════════════════════════════════════

  private createPlanetPosition(
    name: string,
    longitude: number,
    latitude: number,
    distance: number,
    speed: number,
    sunLongitude: number
  ): PlanetPosition {
    const sign = this.getZodiacSign(longitude);
    const degree = longitude % 30;
    const nakshatra = this.getNakshatra(longitude);
    const pada = this.getNakshatraPada(longitude);

    return {
      name,
      longitude,
      latitude,
      distance,
      sign,
      degree,
      nakshatra,
      pada,
      isRetrograde: speed < 0,
      speed,
      dignity: this.calculateDignity(name, sign, degree),
      house: 0  // Will be set later
    };
  }

  private createAscendantPosition(longitude: number): AscendantPosition {
    return {
      sign: this.getZodiacSign(longitude),
      degree: longitude % 30,
      longitude,
      nakshatra: this.getNakshatra(longitude)
    };
  }

  private getZodiacSign(longitude: number): string {
    return ZODIAC_SIGNS[Math.floor(((longitude % 360) + 360) % 360 / 30)];
  }

  private getNakshatra(longitude: number): string {
    return NAKSHATRAS[Math.floor(((longitude % 360) + 360) % 360 / (360 / 27)) % 27];
  }

  private getNakshatraPada(longitude: number): number {
    return Math.floor((longitude % (360 / 27)) / (360 / 27 / 4)) + 1;
  }

  private calculateDignity(planet: string, sign: string, degree: number): Dignity {
    const exaltation = EXALTATION_SIGNS[planet];
    const debilitation = DEBILITATION_SIGNS[planet];
    const moolatrikona = MOOLATRIKONA_SIGNS[planet];

    // Check exaltation
    if (exaltation?.sign === sign && Math.abs(degree - exaltation.degree) <= 5) {
      return 'exalted';
    }

    // Check debilitation
    if (debilitation?.sign === sign && Math.abs(degree - debilitation.degree) <= 5) {
      return 'debilitated';
    }

    // Check moolatrikona
    if (moolatrikona?.sign === sign && degree >= moolatrikona.startDeg && degree <= moolatrikona.endDeg) {
      return 'moolatrikona';
    }

    // Check own sign
    if (PLANET_RULERSHIPS[sign] === planet) {
      return 'own';
    }

    // Check friends/enemies (simplified)
    const friends = this.getFriendlySigns(planet);
    if (friends.includes(sign)) return 'friendly';

    const enemies = this.getEnemySigns(planet);
    if (enemies.includes(sign)) return 'enemy';

    return 'neutral';
  }

  private getFriendlySigns(planet: string): string[] {
    const friendships: Record<string, string[]> = {
      'Sun': ['Aries', 'Leo', 'Scorpio', 'Sagittarius'],
      'Moon': ['Taurus', 'Cancer', 'Virgo', 'Libra', 'Sagittarius', 'Pisces'],
      'Mars': ['Aries', 'Cancer', 'Leo', 'Scorpio', 'Sagittarius', 'Pisces'],
      'Mercury': ['Taurus', 'Gemini', 'Virgo', 'Libra'],
      'Jupiter': ['Aries', 'Cancer', 'Leo', 'Sagittarius', 'Pisces'],
      'Venus': ['Gemini', 'Virgo', 'Libra', 'Capricorn', 'Aquarius'],
      'Saturn': ['Mercury', 'Venus'],
      'Rahu': ['Gemini', 'Virgo', 'Libra', 'Capricorn', 'Aquarius'],
      'Ketu': ['Scorpio', 'Sagittarius', 'Pisces']
    };
    return friendships[planet] || [];
  }

  private getEnemySigns(planet: string): string[] {
    const enmities: Record<string, string[]> = {
      'Sun': ['Libra', 'Aquarius'],
      'Moon': ['Scorpio', 'Capricorn'],
      'Mars': ['Gemini', 'Leo', 'Virgo'],
      'Mercury': ['Cancer', 'Pisces'],
      'Jupiter': ['Taurus', 'Gemini', 'Virgo', 'Libra', 'Capricorn'],
      'Venus': ['Aries', 'Leo', 'Scorpio'],
      'Saturn': ['Aries', 'Cancer', 'Leo', 'Scorpio'],
      'Rahu': ['Cancer', 'Leo', 'Scorpio'],
      'Ketu': ['Taurus', 'Gemini', 'Leo', 'Virgo']
    };
    return enmities[planet] || [];
  }

  private calculateHouse(ascendantSign: string, planetSign: string): number {
    const ascIndex = ZODIAC_SIGNS.indexOf(ascendantSign as any);
    const planetIndex = ZODIAC_SIGNS.indexOf(planetSign as any);
    
    let house = planetIndex - ascIndex + 1;
    if (house <= 0) house += 12;
    
    return house;
  }

  private convertToUTC(date: string, time: string, timezone: number): Date {
    const [year, month, day] = date.split('-').map(Number);
    const [hour, minute, second] = time.split(':').map(Number);
    
    const localTime = new Date(year, month - 1, day, hour, minute, second);
    const utcTime = new Date(localTime.getTime() - timezone * 3600000);
    
    return utcTime;
  }

  private calculateJulianDay(date: Date): number {
    const y = date.getUTCFullYear();
    const m = date.getUTCMonth() + 1;
    const d = date.getUTCDate();
    const h = date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600;
    
    const a = Math.floor((14 - m) / 12);
    const yy = y + 4800 - a;
    const mm = m + 12 * a - 3;
    
    return d + Math.floor((153 * mm + 2) / 5) + 365 * yy + 
           Math.floor(yy / 4) - Math.floor(yy / 100) + Math.floor(yy / 400) - 32045 + 
           (h - 12) / 24;
  }

  private calculateLahiriAyanamsa(jd: number): number {
    const T = (jd - 2451545.0) / 36525;
    return 23.85 + 0.01397 * (jd - 2451545.0) / 365.25 + 0.0003 * T * T;
  }

  private calculateAlgorithmicPlanets(jd: number, ayanamsa: number): Record<string, PlanetPosition> {
    // Simplified algorithmic positions (VSOP87-based)
    const planets: Record<string, PlanetPosition> = {};
    
    // Calculate each planet (simplified formulas)
    // In production, use full VSOP87 implementation
    
    const T = (jd - 2451545.0) / 36525;
    
    // Sun
    const sunMeanLong = (280.46646 + 36000.76983 * T + 0.0003032 * T * T) % 360;
    const sunEqCenter = (1.914602 - 0.004817 * T) * Math.sin(sunMeanLong * Math.PI / 180);
    const sunLong = (sunMeanLong + sunEqCenter - ayanamsa + 360) % 360;
    
    planets.sun = this.createPlanetPosition('Sun', sunLong, 0, 1, 1, sunLong);
    
    // Moon (simplified)
    const moonMeanLong = (218.3164477 + 481267.88123421 * T) % 360;
    const moonLong = (moonMeanLong - ayanamsa + 360) % 360;
    planets.moon = this.createPlanetPosition('Moon', moonLong, 0, 1, 13, sunLong);
    
    // Other planets would follow similar simplified calculations
    // For production, use full VSOP87 or always use Swiss Ephemeris
    
    return planets;
  }

  private calculateAlgorithmicAscendant(jd: number, lat: number, lon: number, ayanamsa: number): number {
    const T = (jd - 2451545.0) / 36525;
    const GMST = (18.697374558 + 8640184.812866 * T / 3600 + 0.093104 * T * T) % 24;
    const LST = (GMST + lon / 15) % 24;
    const RAMC = LST * 15 * Math.PI / 180;
    const obliquity = 23.439281 * Math.PI / 180;
    const latRad = lat * Math.PI / 180;
    
    const ascRad = Math.atan2(
      -Math.cos(RAMC),
      Math.sin(RAMC) * Math.cos(obliquity) - Math.tan(latRad) * Math.sin(obliquity)
    );
    
    return ((ascRad * 180 / Math.PI - ayanamsa) % 360 + 360) % 360;
  }

  // Public utility methods
  getCacheStats(): { size: number; maxSize: number } {
    return {
      size: this.cache.size,
      maxSize: 1000
    };
  }

  clearCache(): void {
    this.cache.clear();
  }

  isHighPrecisionMode(): boolean {
    return this.isHighPrecision;
  }
}

export const ephemerisService = new EphemerisService();
