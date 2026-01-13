/**
 * 🌟 Swiss Ephemeris Engine for Birth Time Rectification
 * 
 * Comprehensive planetary calculation system providing:
 * - Precise planetary positions for multiple time slots
 * - House cusp calculations (Placidus, KP, Whole Sign)
 * - Divisional chart calculations (D-1, D-9, D-10, D-7, D-24, etc.)
 * - Dasha period calculations (Vimshottari)
 * - Nakshatra and lunar phase calculations
 * - Retrograde planet identification
 * 
 * Based on Swiss Ephemeris library for astronomical accuracy
 */

import { SwissEphemerisData, TimeSlotAnalysis } from './moonshoot-ai-prompt';
import * as swisseph from 'swisseph';

// Planetary constants (matching swisseph indices)
const PLANETS = {
  SUN: swisseph.SE_SUN,
  MOON: swisseph.SE_MOON,
  MERCURY: swisseph.SE_MERCURY,
  VENUS: swisseph.SE_VENUS,
  MARS: swisseph.SE_MARS,
  JUPITER: swisseph.SE_JUPITER,
  SATURN: swisseph.SE_SATURN,
  URANUS: swisseph.SE_URANUS,
  NEPTUNE: swisseph.SE_NEPTUNE,
  PLUTO: swisseph.SE_PLUTO,
  NODE: swisseph.SE_TRUE_NODE, // Rahu (True Node for KP)
  TRUE_NODE: swisseph.SE_TRUE_NODE, // True Rahu
  CHIRON: swisseph.SE_CHIRON,
  PHOLUS: 16, // Not directly available in swisseph
  CERES: swisseph.SE_CERES,
  PALLAS: swisseph.SE_PALLAS,
  JUNO: swisseph.SE_JUNO,
  VESTA: swisseph.SE_VESTA
} as const;

// House systems (swisseph format)
const HOUSE_SYSTEMS = {
  PLACIDUS: 'P',
  KOCH: 'K',
  CAMPANUS: 'C',
  REGIOMONTANUS: 'R',
  TOPOCENTRIC: 'T',
  ALCABITIUS: 'B',
  EQUAL_HOUSES: 'E',
  WHOLE_SIGN: 'W',
  MERIDIAN: 'M',
  HORIZONTAL: 'H',
  POLICH_PAGE: 'O',
  MORIN: 'N',
  KRUSINSKI_PADDHATI: 'U'
} as const;

// Ayanamsha modes for KP system
const AYANAMSHA_MODES = {
  LAHIRI: swisseph.SE_SIDM_LAHIRI,
  RAMAN: swisseph.SE_SIDM_RAMAN,
  KP: swisseph.SE_SIDM_KRISHNAMURTI, // KP Ayanamsha
  FAGAN_BRADLEY: swisseph.SE_SIDM_FAGAN_BRADLEY
} as const;

// Zodiac signs
const ZODIAC_SIGNS = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
];

// Nakshatras (27 lunar mansions)
const NAKSHATRAS = [
  'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra',
  'Punarvasu', 'Pushya', 'Ashlesha', 'Magha', 'Purva Phalguni', 'Uttara Phalguni',
  'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha',
  'Mula', 'Purva Ashadha', 'Uttara Ashadha', 'Shravana', 'Dhanishtha', 'Shatabhisha',
  'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati'
];

export interface EphemerisCalculation {
  timestamp: Date;
  julianDay: number;
  planets: {
    sun: PlanetaryPosition;
    moon: PlanetaryPosition;
    mercury: PlanetaryPosition;
    venus: PlanetaryPosition;
    mars: PlanetaryPosition;
    jupiter: PlanetaryPosition;
    saturn: PlanetaryPosition;
    rahu: PlanetaryPosition;
    ketu: PlanetaryPosition;
  };
  houseCusps: HouseCusps;
  lunarPhase: LunarPhase;
  retrogradePlanets: string[];
  nakshatras: {
    moon: NakshatraInfo;
    lagna: NakshatraInfo;
  };
  divisionalCharts: DivisionalCharts;
  dashaPeriods: DashaPeriods;
}

export interface PlanetaryPosition {
  longitude: number;        // 0-360 degrees
  latitude: number;         // -90 to +90 degrees
  speed: number;           // Daily motion in degrees
  retrograde: boolean;
  sign: string;
  signDegree: number;      // 0-30 degrees within sign
  nakshatra: string;
  nakshatraPada: number;   // 1-4
  dignity: PlanetaryDignity;
}

export interface PlanetaryDignity {
  sign: string;
  dignity: 'exalted' | 'debilitated' | 'own_sign' | 'friendly' | 'neutral' | 'enemy';
  strength: number; // 0-100
}

export interface HouseCusps {
  ascendant: number;        // 1st house cusp
  secondHouse: number;
  thirdHouse: number;
  fourthHouse: number;
  fifthHouse: number;
  sixthHouse: number;
  seventhHouse: number;
  eighthHouse: number;
  ninthHouse: number;
  tenthHouse: number;
  eleventhHouse: number;
  twelfthHouse: number;
}

export interface LunarPhase {
  phaseAngle: number;      // 0-360 degrees
  phaseName: string;       // New Moon, Waxing Crescent, etc.
  illumination: number;    // 0-100 percentage
  daysSinceNewMoon: number;
}

export interface NakshatraInfo {
  name: string;
  pada: number;           // 1-4
  lord: string;           // Nakshatra lord
  deity: string;          // Associated deity
  startingDegree: number; // Within zodiac sign
}

export interface DivisionalCharts {
  d1: DivisionalChart;    // Rashi (D-1)
  d9: DivisionalChart;    // Navamsa (D-9)
  d10: DivisionalChart;   // Dasamsa (D-10)
  d7: DivisionalChart;    // Saptamsa (D-7)
  d24: DivisionalChart;   // Chaturvimshamsa (D-24)
  d12: DivisionalChart;   // Dwadasamsa (D-12)
  d30: DivisionalChart;   // Trimsamsa (D-30)
  d4: DivisionalChart;    // Chaturthamsa (D-4)
  d60: DivisionalChart;   // Shastiamsa (D-60)
}

export interface DivisionalChart {
  lagna: number;          // Ascendant degree
  lagnaSign: string;
  planets: Record<string, number>; // Planet positions in divisional chart
}

export interface DashaPeriods {
  vimshottari: {
    currentMahadasha: DashaPeriod;
    currentAntardasha: DashaPeriod;
    currentPratyantardasha: DashaPeriod;
    birthBalance: string; // Balance of dasha at birth
  };
  planetaryPeriods: Record<string, DashaPeriod[]>;
}

export interface DashaPeriod {
  planet: string;
  startDate: Date;
  endDate: Date;
  duration: number; // in years
}

/**
 * Swiss Ephemeris Engine - Main calculation class
 */
export class SwissEphemerisEngine {
  private ephemerisPath: string;
  private isInitialized: boolean = false;
  private useKPSystem: boolean = true;
  
  constructor(ephemerisPath: string = './ephe', useKPSystem: boolean = true) {
    this.ephemerisPath = ephemerisPath;
    this.useKPSystem = useKPSystem;
  }

  /**
   * Initialize the ephemeris engine
   */
  async initialize(): Promise<void> {
    try {
      console.log('🔮 Initializing Swiss Ephemeris Engine...');
      console.log(`📁 Ephemeris path: ${this.ephemerisPath}`);
      
      // Set ephemeris file path for swisseph
      swisseph.swe_set_ephe_path(this.ephemerisPath);
      
      // Set ayanamsha to KP (Krishnamurti) if using KP system
      if (this.useKPSystem) {
        swisseph.swe_set_sid_mode(AYANAMSHA_MODES.KP, 0, 0);
        console.log('🎯 Using KP Ayanamsha (Krishnamurti Paddhati)');
      }
      
      this.isInitialized = true;
      console.log('✅ Swiss Ephemeris Engine initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Swiss Ephemeris:', error);
      throw new Error('Swiss Ephemeris initialization failed');
    }
  }

  /**
   * Calculate comprehensive ephemeris data for birth time rectification
   */
  async calculateEphemerisForBTR(
    date: Date,
    latitude: number,
    longitude: number,
    timezone: string,
    houseSystem: string = HOUSE_SYSTEMS.PLACIDUS
  ): Promise<EphemerisCalculation> {
    if (!this.isInitialized) {
      throw new Error('Swiss Ephemeris Engine not initialized');
    }

    try {
      console.log(`🧮 Calculating ephemeris for ${date.toISOString()} at ${latitude}, ${longitude}`);

      // Calculate Julian Day
      const julianDay = this.calculateJulianDay(date);

      // Calculate planetary positions
      const planets = await this.calculatePlanetaryPositions(date, latitude, longitude);

      // Calculate house cusps
      const houseCusps = await this.calculateHouseCusps(date, latitude, longitude, houseSystem);

      // Calculate lunar phase
      const lunarPhase = this.calculateLunarPhase(planets.sun.longitude, planets.moon.longitude);

      // Identify retrograde planets
      const retrogradePlanets = this.identifyRetrogradePlanets(planets);

      // Calculate nakshatras
      const nakshatras = this.calculateNakshatras(planets.moon.longitude, houseCusps.ascendant);

      // Calculate divisional charts
      const divisionalCharts = this.calculateDivisionalCharts(planets, houseCusps);

      // Calculate dasha periods
      const dashaPeriods = this.calculateDashaPeriods(planets.moon.longitude, date);

      return {
        timestamp: date,
        julianDay,
        planets,
        houseCusps,
        lunarPhase,
        retrogradePlanets,
        nakshatras,
        divisionalCharts,
        dashaPeriods
      };

    } catch (error) {
      console.error('❌ Ephemeris calculation failed:', error);
      throw new Error(`Ephemeris calculation failed: ${error}`);
    }
  }

  /**
   * Calculate ephemeris for multiple time slots (for BTR analysis)
   */
  async calculateEphemerisForTimeSlots(
    baseDate: Date,
    latitude: number,
    longitude: number,
    timezone: string,
    uncertaintyMinutes: number,
    slotInterval: number = 15 // minutes
  ): Promise<SwissEphemerisData> {
    const timeSlots: EphemerisCalculation[] = [];
    const startTime = new Date(baseDate.getTime() - uncertaintyMinutes * 60000);
    const endTime = new Date(baseDate.getTime() + uncertaintyMinutes * 60000);

    console.log(`⏰ Generating time slots from ${startTime.toISOString()} to ${endTime.toISOString()}`);

    let currentTime = new Date(startTime);
    while (currentTime <= endTime) {
      try {
        const ephemeris = await this.calculateEphemerisForBTR(
          currentTime,
          latitude,
          longitude,
          timezone
        );
        
        timeSlots.push(ephemeris);
        
        // Progress logging
        if (timeSlots.length % 10 === 0) {
          console.log(`📝 Generated ${timeSlots.length} time slots...`);
        }
        
      } catch (error) {
        console.warn(`⚠️ Failed to calculate for time ${currentTime.toISOString()}:`, error);
      }
      
      currentTime = new Date(currentTime.getTime() + slotInterval * 60000);
    }

    console.log(`✅ Generated ${timeSlots.length} time slots successfully`);

    return {
      timeSlots: timeSlots.map(slot => ({
        timestamp: slot.timestamp.toISOString(),
        julianDay: slot.julianDay,
        planets: {
          sun: slot.planets.sun.longitude,
          moon: slot.planets.moon.longitude,
          mercury: slot.planets.mercury.longitude,
          venus: slot.planets.venus.longitude,
          mars: slot.planets.mars.longitude,
          jupiter: slot.planets.jupiter.longitude,
          saturn: slot.planets.saturn.longitude,
          rahu: slot.planets.rahu.longitude,
          ketu: slot.planets.ketu.longitude
        },
        houseCusps: slot.houseCusps,
        lunarPhase: slot.lunarPhase.phaseAngle,
        retrogradePlanets: slot.retrogradePlanets,
        nakshatras: {
          moon: slot.nakshatras.moon.name,
          lagna: slot.nakshatras.lagna.name
        }
      }))
    };
  }

  /**
   * Calculate Julian Day from date
   */
  private calculateJulianDay(date: Date): number {
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth() + 1;
    const day = date.getUTCDate();
    const hour = date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600;

    // Julian Day calculation formula
    const a = Math.floor((14 - month) / 12);
    const y = year + 4800 - a;
    const m = month + 12 * a - 3;

    const julianDay = day + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
    
    return julianDay + (hour - 12) / 24;
  }

  /**
   * Calculate planetary positions using real swisseph library
   */
  private async calculatePlanetaryPositions(date: Date, latitude: number, longitude: number): Promise<any> {
    const julianDay = this.calculateJulianDay(date);
    const planetaryPositions: any = {};
    
    // Planets to calculate (including true node for Rahu/Ketu)
    const planetsToCalculate = [
      { name: 'sun', id: PLANETS.SUN },
      { name: 'moon', id: PLANETS.MOON },
      { name: 'mercury', id: PLANETS.MERCURY },
      { name: 'venus', id: PLANETS.VENUS },
      { name: 'mars', id: PLANETS.MARS },
      { name: 'jupiter', id: PLANETS.JUPITER },
      { name: 'saturn', id: PLANETS.SATURN },
      { name: 'rahu', id: PLANETS.TRUE_NODE }, // True Rahu
    ];
    
    // Calculate each planet's position
    for (const planet of planetsToCalculate) {
      try {
        // Get planetary position using swisseph
        const result: any = swisseph.swe_calc_ut(julianDay, planet.id, swisseph.SEFLG_SPEED | swisseph.SEFLG_SIDEREAL);
        
        // Check if result has error (different versions return different structures)
        if (result.error) {
          console.warn(`⚠️ Error calculating ${planet.name}: ${result.error}`);
          continue;
        }
        
        // Extract values based on result structure
        const longitude = result.longitude || 0;
        const latitude = result.latitude || 0;
        const speed = result.longitudeSpeed || 0; // Use longitudeSpeed for planetary speed
        const retrograde = speed < 0; // Negative speed indicates retrograde
        
        planetaryPositions[planet.name] = this.createPlanetaryPosition(
          longitude,
          latitude,
          speed,
          retrograde,
          planet.name
        );
        
      } catch (error) {
        console.warn(`⚠️ Exception calculating ${planet.name}:`, error);
      }
    }
    
    // Calculate Ketu (always 180 degrees opposite to Rahu)
    if (planetaryPositions.rahu) {
      const ketuLongitude = (planetaryPositions.rahu.longitude + 180) % 360;
      planetaryPositions.ketu = this.createPlanetaryPosition(
        ketuLongitude,
        0,
        -0.053, // Ketu speed (approximate)
        true, // Always retrograde
        'ketu'
      );
    }
    
    return planetaryPositions;
  }

  /**
   * Create planetary position object
   */
  private createPlanetaryPosition(longitude: number, latitude: number, speed: number, retrograde: boolean, planet: string): any {
    const normalizedLongitude = ((longitude % 360) + 360) % 360;
    const signIndex = Math.floor(normalizedLongitude / 30);
    const signDegree = normalizedLongitude % 30;
    
    return {
      longitude: normalizedLongitude,
      latitude,
      speed,
      retrograde,
      sign: ZODIAC_SIGNS[signIndex],
      signDegree,
      nakshatra: this.getNakshatra(normalizedLongitude),
      nakshatraPada: this.getNakshatraPada(normalizedLongitude),
      dignity: this.getPlanetaryDignity(planet, normalizedLongitude)
    };
  }

  /**
   * Calculate house cusps using real swisseph library
   */
  private async calculateHouseCusps(date: Date, latitude: number, longitude: number, houseSystem: string): Promise<HouseCusps> {
    const julianDay = this.calculateJulianDay(date);
    
    try {
      // Calculate houses using swisseph - correct API: swe_houses(jd, lat, lon, hsys)
      const housesResult: any = swisseph.swe_houses(julianDay, latitude, longitude, houseSystem as any);
      
      if (housesResult.error) {
        console.warn(`⚠️ Error calculating houses: ${housesResult.error}`);
        // Fallback to simplified calculation
        return this.calculateHouseCuspsFallback(date, latitude, longitude, houseSystem);
      }
      
      // Extract house cusps (housesResult.cusp is an array of 12 cusps)
      const cusps = housesResult.cusp || [];
      
      // If we don't have enough cusps, use fallback
      if (cusps.length < 12) {
        console.warn('⚠️ Insufficient house cusps returned, using fallback');
        return this.calculateHouseCuspsFallback(date, latitude, longitude, houseSystem);
      }
      
      return {
        ascendant: cusps[0] || 0,
        secondHouse: cusps[1] || 0,
        thirdHouse: cusps[2] || 0,
        fourthHouse: cusps[3] || 0,
        fifthHouse: cusps[4] || 0,
        sixthHouse: cusps[5] || 0,
        seventhHouse: cusps[6] || 0,
        eighthHouse: cusps[7] || 0,
        ninthHouse: cusps[8] || 0,
        tenthHouse: cusps[9] || 0,
        eleventhHouse: cusps[10] || 0,
        twelfthHouse: cusps[11] || 0
      };
      
    } catch (error) {
      console.warn('⚠️ Exception calculating houses, using fallback:', error);
      return this.calculateHouseCuspsFallback(date, latitude, longitude, houseSystem);
    }
  }
  
  /**
   * Fallback house calculation (simplified)
   */
  private calculateHouseCuspsFallback(date: Date, latitude: number, longitude: number, houseSystem: string): HouseCusps {
    const ascendant = this.calculateAscendant(date, latitude, longitude);
    const cusps: number[] = [];
    
    for (let i = 0; i < 12; i++) {
      let cusp;
      
      switch (houseSystem) {
        case HOUSE_SYSTEMS.PLACIDUS:
          cusp = (ascendant + (i * 30) + this.getPlacidusOffset(i, latitude)) % 360;
          break;
        case HOUSE_SYSTEMS.WHOLE_SIGN:
          cusp = (Math.floor(ascendant / 30) * 30 + (i * 30)) % 360;
          break;
        default:
          cusp = (ascendant + (i * 30)) % 360;
      }
      
      cusps.push(cusp);
    }
    
    return {
      ascendant: cusps[0],
      secondHouse: cusps[1],
      thirdHouse: cusps[2],
      fourthHouse: cusps[3],
      fifthHouse: cusps[4],
      sixthHouse: cusps[5],
      seventhHouse: cusps[6],
      eighthHouse: cusps[7],
      ninthHouse: cusps[8],
      tenthHouse: cusps[9],
      eleventhHouse: cusps[10],
      twelfthHouse: cusps[11]
    };
  }

  /**
   * Calculate ascendant (simplified)
   */
  private calculateAscendant(date: Date, latitude: number, longitude: number): number {
    // Simplified ascendant calculation
    // In reality, this would be much more complex
    const dayOfYear = this.getDayOfYear(date);
    const hour = date.getUTCHours() + date.getUTCMinutes() / 60;
    
    // Basic calculation considering date, time, and location
    const ascendant = ((dayOfYear / 365.25) * 360 + (hour / 24) * 360 + (longitude / 360) * 30) % 360;
    
    return ascendant;
  }

  /**
   * Get Placidus house offset (simplified)
   */
  private getPlacidusOffset(houseIndex: number, latitude: number): number {
    // Simplified Placidus offset calculation
    // Real implementation would be much more complex
    return Math.sin(latitude * Math.PI / 180) * (houseIndex - 6) * 2;
  }

  /**
   * Calculate lunar phase
   */
  private calculateLunarPhase(sunLongitude: number, moonLongitude: number): LunarPhase {
    const phaseAngle = ((moonLongitude - sunLongitude) + 360) % 360;
    const illumination = (1 - Math.cos(phaseAngle * Math.PI / 180)) / 2 * 100;
    
    let phaseName = '';
    if (phaseAngle < 45) phaseName = 'New Moon';
    else if (phaseAngle < 90) phaseName = 'Waxing Crescent';
    else if (phaseAngle < 135) phaseName = 'First Quarter';
    else if (phaseAngle < 180) phaseName = 'Waxing Gibbous';
    else if (phaseAngle < 225) phaseName = 'Full Moon';
    else if (phaseAngle < 270) phaseName = 'Waning Gibbous';
    else if (phaseAngle < 315) phaseName = 'Last Quarter';
    else phaseName = 'Waning Crescent';
    
    const daysSinceNewMoon = (phaseAngle / 360) * 29.53;
    
    return {
      phaseAngle,
      phaseName,
      illumination,
      daysSinceNewMoon
    };
  }

  /**
   * Identify retrograde planets
   */
  private identifyRetrogradePlanets(planets: any): string[] {
    const retrograde: string[] = [];
    
    for (const [planet, position] of Object.entries(planets)) {
      const pos = position as PlanetaryPosition;
      if (pos.retrograde) {
        retrograde.push(planet);
      }
    }
    
    return retrograde;
  }

  /**
   * Check if planet is retrograde (simplified)
   */
  private isPlanetRetrograde(planet: string, dayOfYear: number, cycle: number): boolean {
    // Simplified retrograde detection
    // Real implementation would use complex astronomical calculations
    
    const retrogradeCycles: Record<string, {start: number, duration: number}[]> = {
      mercury: [{start: 20, duration: 21}, {start: 110, duration: 21}, {start: 200, duration: 21}, {start: 290, duration: 21}],
      venus: [{start: 40, duration: 42}, {start: 220, duration: 42}],
      mars: [{start: 80, duration: 72}, {start: 280, duration: 72}],
      jupiter: [{start: 120, duration: 120}, {start: 300, duration: 120}],
      saturn: [{start: 180, duration: 140}, {start: 360, duration: 140}]
    };
    
    const cycles = retrogradeCycles[planet] || [];
    
    for (const cycle of cycles) {
      if (dayOfYear >= cycle.start && dayOfYear <= cycle.start + cycle.duration) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Calculate nakshatras
   */
  private calculateNakshatras(moonLongitude: number, lagnaLongitude: number): any {
    return {
      moon: this.getNakshatraInfo(moonLongitude),
      lagna: this.getNakshatraInfo(lagnaLongitude)
    };
  }

  /**
   * Get nakshatra information
   */
  private getNakshatraInfo(longitude: number): NakshatraInfo {
    const nakshatraSize = 360 / 27; // 13.333... degrees
    const nakshatraIndex = Math.floor(longitude / nakshatraSize);
    const pada = Math.floor((longitude % nakshatraSize) / (nakshatraSize / 4)) + 1;
    const startingDegree = (longitude % nakshatraSize);
    
    // Nakshatra lords (Vimshottari sequence)
    const nakshatraLords = [
      'Ketu', 'Venus', 'Sun', 'Moon', 'Mars', 'Rahu', 'Jupiter', 'Saturn', 'Mercury'
    ];
    
    // Nakshatra deities
    const nakshatraDeities = [
      'Ashwini Kumaras', 'Yama', 'Agni', 'Brahma', 'Chandra', 'Rudra', 'Aditi', 'Brihaspati', 'Serpents',
      'Pitris', 'Bhaga', 'Aryaman', 'Savitr', 'Vishnu', 'Indra', 'Mitra', 'Indra', 'Nirriti',
      'Varuna', 'Vishvedevas', 'Vishvedevas', 'Vishnu', 'Vasus', 'Varuna', 'Ajikapada', 'Ahirbudhnya', 'Pushan'
    ];
    
    return {
      name: NAKSHATRAS[nakshatraIndex] || 'Unknown',
      pada,
      lord: nakshatraLords[nakshatraIndex % 9],
      deity: nakshatraDeities[nakshatraIndex] || 'Unknown',
      startingDegree
    };
  }

  /**
   * Get nakshatra from longitude
   */
  private getNakshatra(longitude: number): string {
    const nakshatraSize = 360 / 27;
    const index = Math.floor(longitude / nakshatraSize);
    return NAKSHATRAS[index] || 'Unknown';
  }

  /**
   * Get nakshatra pada (quarter)
   */
  private getNakshatraPada(longitude: number): number {
    const nakshatraSize = 360 / 27;
    return Math.floor((longitude % nakshatraSize) / (nakshatraSize / 4)) + 1;
  }

  /**
   * Get planetary dignity
   */
  private getPlanetaryDignity(planet: string, longitude: number): PlanetaryDignity {
    const signIndex = Math.floor(longitude / 30);
    const sign = ZODIAC_SIGNS[signIndex];
    
    // Planetary dignities (simplified)
    const dignities: Record<string, Record<string, string>> = {
      sun: {
        'Aries': 'exalted',
        'Leo': 'own_sign',
        'Libra': 'debilitated'
      },
      moon: {
        'Taurus': 'exalted',
        'Cancer': 'own_sign',
        'Scorpio': 'debilitated'
      },
      mars: {
        'Capricorn': 'exalted',
        'Aries': 'own_sign',
        'Scorpio': 'own_sign',
        'Cancer': 'debilitated'
      },
      mercury: {
        'Virgo': 'exalted',
        'Gemini': 'own_sign',
        'Pisces': 'debilitated'
      },
      jupiter: {
        'Cancer': 'exalted',
        'Sagittarius': 'own_sign',
        'Pisces': 'own_sign',
        'Capricorn': 'debilitated'
      },
      venus: {
        'Pisces': 'exalted',
        'Taurus': 'own_sign',
        'Libra': 'own_sign',
        'Virgo': 'debilitated'
      },
      saturn: {
        'Libra': 'exalted',
        'Capricorn': 'own_sign',
        'Aquarius': 'own_sign',
        'Aries': 'debilitated'
      }
    };
    
    const planetDignity = dignities[planet.toLowerCase()]?.[sign] || 'neutral';
    
    // Calculate strength (simplified)
    let strength = 50; // Base strength
    if (planetDignity === 'exalted') strength = 100;
    else if (planetDignity === 'own_sign') strength = 80;
    else if (planetDignity === 'debilitated') strength = 20;
    else if (planetDignity === 'friendly') strength = 70;
    else if (planetDignity === 'enemy') strength = 30;
    
    return {
      sign,
      dignity: planetDignity as 'exalted' | 'debilitated' | 'own_sign' | 'friendly' | 'neutral' | 'enemy',
      strength
    };
  }

  /**
   * Calculate divisional charts
   */
  private calculateDivisionalCharts(planets: any, houseCusps: HouseCusps): DivisionalCharts {
    const divisionalCharts: DivisionalCharts = {} as DivisionalCharts;
    
    // D-1 (Rashi) - original positions
    divisionalCharts.d1 = {
      lagna: houseCusps.ascendant,
      lagnaSign: this.getZodiacSign(houseCusps.ascendant),
      planets: this.getDivisionalPlanetPositions(planets, 1)
    };
    
    // D-9 (Navamsa) - 9th division
    divisionalCharts.d9 = {
      lagna: this.calculateDivisionalPosition(houseCusps.ascendant, 9),
      lagnaSign: this.getZodiacSign(this.calculateDivisionalPosition(houseCusps.ascendant, 9)),
      planets: this.getDivisionalPlanetPositions(planets, 9)
    };
    
    // D-10 (Dasamsa) - 10th division
    divisionalCharts.d10 = {
      lagna: this.calculateDivisionalPosition(houseCusps.ascendant, 10),
      lagnaSign: this.getZodiacSign(this.calculateDivisionalPosition(houseCusps.ascendant, 10)),
      planets: this.getDivisionalPlanetPositions(planets, 10)
    };
    
    // D-7 (Saptamsa) - 7th division
    divisionalCharts.d7 = {
      lagna: this.calculateDivisionalPosition(houseCusps.ascendant, 7),
      lagnaSign: this.getZodiacSign(this.calculateDivisionalPosition(houseCusps.ascendant, 7)),
      planets: this.getDivisionalPlanetPositions(planets, 7)
    };
    
    // D-24 (Chaturvimshamsa) - 24th division
    divisionalCharts.d24 = {
      lagna: this.calculateDivisionalPosition(houseCusps.ascendant, 24),
      lagnaSign: this.getZodiacSign(this.calculateDivisionalPosition(houseCusps.ascendant, 24)),
      planets: this.getDivisionalPlanetPositions(planets, 24)
    };
    
    // D-12 (Dwadasamsa) - 12th division
    divisionalCharts.d12 = {
      lagna: this.calculateDivisionalPosition(houseCusps.ascendant, 12),
      lagnaSign: this.getZodiacSign(this.calculateDivisionalPosition(houseCusps.ascendant, 12)),
      planets: this.getDivisionalPlanetPositions(planets, 12)
    };
    
    // D-30 (Trimsamsa) - 30th division
    divisionalCharts.d30 = {
      lagna: this.calculateDivisionalPosition(houseCusps.ascendant, 30),
      lagnaSign: this.getZodiacSign(this.calculateDivisionalPosition(houseCusps.ascendant, 30)),
      planets: this.getDivisionalPlanetPositions(planets, 30)
    };
    
    // D-4 (Chaturthamsa) - 4th division
    divisionalCharts.d4 = {
      lagna: this.calculateDivisionalPosition(houseCusps.ascendant, 4),
      lagnaSign: this.getZodiacSign(this.calculateDivisionalPosition(houseCusps.ascendant, 4)),
      planets: this.getDivisionalPlanetPositions(planets, 4)
    };
    
    // D-60 (Shastiamsa) - 60th division
    divisionalCharts.d60 = {
      lagna: this.calculateDivisionalPosition(houseCusps.ascendant, 60),
      lagnaSign: this.getZodiacSign(this.calculateDivisionalPosition(houseCusps.ascendant, 60)),
      planets: this.getDivisionalPlanetPositions(planets, 60)
    };
    
    return divisionalCharts;
  }

  /**
   * Calculate divisional position
   */
  private calculateDivisionalPosition(longitude: number, division: number): number {
    const sign = Math.floor(longitude / 30);
    const degreeInSign = longitude % 30;
    const divisionSize = 30 / division;
    const divisionNumber = Math.floor(degreeInSign / divisionSize);
    
    // Simplified divisional calculation
    // Real implementation would be more complex based on Parashara rules
    return (sign * 30) + (divisionNumber * divisionSize) + (degreeInSign % divisionSize);
  }

  /**
   * Get divisional planet positions
   */
  private getDivisionalPlanetPositions(planets: any, division: number): Record<string, number> {
    const positions: Record<string, number> = {};
    
    for (const [planet, position] of Object.entries(planets)) {
      positions[planet] = this.calculateDivisionalPosition((position as any).longitude, division);
    }
    
    return positions;
  }

  /**
   * Calculate dasha periods
   */
  private calculateDashaPeriods(moonLongitude: number, birthDate: Date): DashaPeriods {
    // Calculate current Vimshottari Dasha
    const nakshatraIndex = Math.floor(moonLongitude / (360 / 27));
    const nakshatraPortion = (moonLongitude % (360 / 27)) / (360 / 27);
    
    // Vimshottari dasha sequence and years
    const dashaSequence = [
      { planet: 'Ketu', years: 7 },
      { planet: 'Venus', years: 20 },
      { planet: 'Sun', years: 6 },
      { planet: 'Moon', years: 10 },
      { planet: 'Mars', years: 7 },
      { planet: 'Rahu', years: 18 },
      { planet: 'Jupiter', years: 16 },
      { planet: 'Saturn', years: 19 },
      { planet: 'Mercury', years: 17 }
    ];
    
    // Find current dasha
    const currentDashaIndex = nakshatraIndex % 9;
    const currentDasha = dashaSequence[currentDashaIndex];
    const balanceYears = currentDasha.years * (1 - nakshatraPortion);
    
    // Calculate dasha periods
    const currentMahadasha = this.calculateCurrentDasha(birthDate, balanceYears, currentDasha, dashaSequence);
    const currentAntardasha = this.calculateCurrentAntardasha(birthDate, currentMahadasha, dashaSequence);
    const currentPratyantardasha = this.calculateCurrentPratyantardasha(birthDate, currentAntardasha, dashaSequence);
    
    return {
      vimshottari: {
        currentMahadasha,
        currentAntardasha,
        currentPratyantardasha,
        birthBalance: `${balanceYears.toFixed(2)} years`
      },
      planetaryPeriods: this.calculateAllDashaPeriods(birthDate, dashaSequence)
    };
  }

  /**
   * Calculate current Mahadasha
   */
  private calculateCurrentDasha(birthDate: Date, balanceYears: number, currentDasha: any, dashaSequence: any[]): DashaPeriod {
    const startDate = new Date(birthDate);
    const endDate = new Date(birthDate);
    endDate.setFullYear(endDate.getFullYear() + balanceYears);
    
    return {
      planet: currentDasha.planet,
      startDate,
      endDate,
      duration: balanceYears
    };
  }

  /**
   * Calculate current Antardasha
   */
  private calculateCurrentAntardasha(birthDate: Date, mahadasha: DashaPeriod, dashaSequence: any[]): DashaPeriod {
    // Simplified antardasha calculation
    const now = new Date();
    const mahadashaProgress = (now.getTime() - mahadasha.startDate.getTime()) / (mahadasha.endDate.getTime() - mahadasha.startDate.getTime());
    
    // Find which antardasha we're in
    const antardashaSequence = [...dashaSequence]; // Same sequence for antardasha
    const antardashaIndex = Math.floor(mahadashaProgress * 9);
    const currentAntardashaPlanet = antardashaSequence[antardashaIndex % 9];
    
    const antardashaDuration = mahadasha.duration * (currentAntardashaPlanet.years / 120);
    const antardashaStart = new Date(mahadasha.startDate);
    antardashaStart.setFullYear(antardashaStart.getFullYear() + (antardashaIndex * antardashaDuration));
    
    const antardashaEnd = new Date(antardashaStart);
    antardashaEnd.setFullYear(antardashaEnd.getFullYear() + antardashaDuration);
    
    return {
      planet: currentAntardashaPlanet.planet,
      startDate: antardashaStart,
      endDate: antardashaEnd,
      duration: antardashaDuration
    };
  }

  /**
   * Calculate current Pratyantardasha
   */
  private calculateCurrentPratyantardasha(birthDate: Date, antardasha: DashaPeriod, dashaSequence: any[]): DashaPeriod {
    // Simplified pratyantardasha calculation
    const now = new Date();
    const antardashaProgress = (now.getTime() - antardasha.startDate.getTime()) / (antardasha.endDate.getTime() - antardasha.startDate.getTime());
    
    const pratyantardashaSequence = [...dashaSequence]; // Same sequence
    const pratyantardashaIndex = Math.floor(antardashaProgress * 9);
    const currentPratyantardashaPlanet = pratyantardashaSequence[pratyantardashaIndex % 9];
    
    const pratyantardashaDuration = antardasha.duration * (currentPratyantardashaPlanet.years / 120);
    const pratyantardashaStart = new Date(antardasha.startDate);
    pratyantardashaStart.setFullYear(pratyantardashaStart.getFullYear() + (pratyantardashaIndex * pratyantardashaDuration));
    
    const pratyantardashaEnd = new Date(pratyantardashaStart);
    pratyantardashaEnd.setFullYear(pratyantardashaEnd.getFullYear() + pratyantardashaDuration);
    
    return {
      planet: currentPratyantardashaPlanet.planet,
      startDate: pratyantardashaStart,
      endDate: pratyantardashaEnd,
      duration: pratyantardashaDuration
    };
  }

  /**
   * Calculate all dasha periods
   */
  private calculateAllDashaPeriods(birthDate: Date, dashaSequence: any[]): Record<string, DashaPeriod[]> {
    const allPeriods: Record<string, DashaPeriod[]> = {};
    
    for (const planetData of dashaSequence) {
      allPeriods[planetData.planet] = this.calculatePlanetDashaPeriods(birthDate, planetData, dashaSequence);
    }
    
    return allPeriods;
  }

  /**
   * Calculate planet-specific dasha periods
   */
  private calculatePlanetDashaPeriods(birthDate: Date, planetData: any, dashaSequence: any[]): DashaPeriod[] {
    const periods: DashaPeriod[] = [];
    let currentDate = new Date(birthDate);
    
    // Calculate main Mahadasha periods
    const mahadashaDuration = planetData.years;
    const mahadashaEnd = new Date(currentDate);
    mahadashaEnd.setFullYear(mahadashaEnd.getFullYear() + mahadashaDuration);
    
    periods.push({
      planet: planetData.planet,
      startDate: new Date(currentDate),
      endDate: new Date(mahadashaEnd),
      duration: mahadashaDuration
    });
    
    return periods;
  }

  /**
   * Utility functions
   */
  private getDayOfYear(date: Date): number {
    const start = new Date(date.getFullYear(), 0, 0);
    const diff = date.getTime() - start.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }

  private getZodiacSign(degree: number): string {
    const signs = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 
                   'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
    return signs[Math.floor(degree / 30)] || 'Unknown';
  }
}

/**
 * Factory function to create Swiss Ephemeris Engine
 */
export function createSwissEphemerisEngine(ephemerisPath?: string): SwissEphemerisEngine {
  return new SwissEphemerisEngine(ephemerisPath);
}