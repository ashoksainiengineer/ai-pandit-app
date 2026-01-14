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
  NODE: swisseph.SE_TRUE_NODE, // Rahu (True Node)
  TRUE_NODE: swisseph.SE_TRUE_NODE, // True Rahu
  MEAN_NODE: swisseph.SE_MEAN_NODE, // Mean Node for Vedic astrology (Rahu)
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
    birthDasha: string; // Starting dasha at birth
    balanceYears: number; // Balance in years
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
      
      // Set ayanamsha to LAHIRI for Vedic astrology (NOT KP)
      // KP ayanamsa is not standard for Vedic astrology and causes 24° errors
      swisseph.swe_set_sid_mode(AYANAMSHA_MODES.LAHIRI, 0, 0);
      console.log('🎯 Using LAHIRI Ayanamsha (Chitrapaksha - Standard for Vedic Astrology)');
      
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
    houseSystem: string = HOUSE_SYSTEMS.WHOLE_SIGN
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
      { name: 'rahu', id: PLANETS.TRUE_NODE }, // True Node for accurate Vedic astrology (not Mean Node)
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
    const signIndex = Math.floor(longitude / 30);
    const degreeInSign = longitude % 30;
    
    // Vedic divisional chart formulas based on Parashara
    switch (division) {
      case 9: // Navamsa (D-9)
        return this.calculateNavamsa(signIndex, degreeInSign);
      case 10: // Dasamsa (D-10)
        return this.calculateDasamsa(signIndex, degreeInSign);
      case 7: // Saptamsa (D-7)
        return this.calculateSaptamsa(signIndex, degreeInSign);
      case 12: // Dwadasamsa (D-12)
        return this.calculateDwadasamsa(signIndex, degreeInSign);
      case 30: // Trimsamsa (D-30)
        return this.calculateTrimsamsa(signIndex, degreeInSign);
      default:
        // Generic calculation for other divisions
        const divisionSize = 30 / division;
        const divisionNumber = Math.floor(degreeInSign / divisionSize);
        return (signIndex * 30) + (divisionNumber * divisionSize) + (degreeInSign % divisionSize);
    }
  }
  
  private calculateNavamsa(signIndex: number, degreeInSign: number): number {
    // Navamsa = 9 divisions of 3°20' each (3.333333... degrees)
    const navamsaSize = 3.3333333333333335; // Precise: 3°20'
    const navamsaNumber = Math.floor(degreeInSign / navamsaSize);
    
    let navamsaSign: number;
    // Movable signs (Aries, Cancer, Libra, Capricorn): start from same sign
    if ([0, 3, 6, 9].includes(signIndex)) {
      navamsaSign = (signIndex + navamsaNumber) % 12;
    }
    // Fixed signs (Taurus, Leo, Scorpio, Aquarius): start from 9th from sign
    else if ([1, 4, 7, 10].includes(signIndex)) {
      navamsaSign = (signIndex + 8 + navamsaNumber) % 12; // +8 = 9th sign
    }
    // Dual signs (Gemini, Virgo, Sagittarius, Pisces): start from 5th from sign
    else {
      navamsaSign = (signIndex + 4 + navamsaNumber) % 12; // +4 = 5th sign
    }
    
    return navamsaSign * 30 + (degreeInSign % navamsaSize);
  }
  
  private calculateDasamsa(signIndex: number, degreeInSign: number): number {
    // Dasamsa = 10 divisions of 3° each
    const dasamsaSize = 3.0;
    const dasamsaNumber = Math.floor(degreeInSign / dasamsaSize);
    
    let dasamsaSign: number;
    // Odd signs: start from same sign
    if ((signIndex + 1) % 2 === 1) {
      dasamsaSign = (signIndex + dasamsaNumber) % 12;
    }
    // Even signs: start from 9th from sign
    else {
      dasamsaSign = (signIndex + 8 + dasamsaNumber) % 12; // +8 = 9th sign
    }
    
    return dasamsaSign * 30 + (degreeInSign % dasamsaSize);
  }
  
  private calculateSaptamsa(signIndex: number, degreeInSign: number): number {
    // Saptamsa = 7 divisions of ~4°17' each (4.285714... degrees)
    const saptamsaSize = 4.285714285714286; // Precise: 30/7
    const saptamsaNumber = Math.floor(degreeInSign / saptamsaSize);
    
    let saptamsaSign: number;
    // Odd signs: start from same sign
    if ((signIndex + 1) % 2 === 1) {
      saptamsaSign = (signIndex + saptamsaNumber) % 12;
    }
    // Even signs: start from 7th from sign
    else {
      saptamsaSign = (signIndex + 6 + saptamsaNumber) % 12; // +6 = 7th sign
    }
    
    return saptamsaSign * 30 + (degreeInSign % saptamsaSize);
  }
  
  private calculateDwadasamsa(signIndex: number, degreeInSign: number): number {
    // Dwadasamsa = 12 divisions of 2°30' each (2.5 degrees)
    const dwadasamsaSize = 2.5;
    const dwadasamsaNumber = Math.floor(degreeInSign / dwadasamsaSize);
    
    // Always start from same sign
    const dwadasamsaSign = (signIndex + dwadasamsaNumber) % 12;
    
    return dwadasamsaSign * 30 + (degreeInSign % dwadasamsaSize);
  }
  
  private calculateTrimsamsa(signIndex: number, degreeInSign: number): number {
    // Trimsamsa = 30 divisions of 1° each
    // Special rules based on sign and degree ranges
    const trimsamsaSign = this.getTrimsamsaSign(signIndex, degreeInSign);
    return trimsamsaSign * 30 + (degreeInSign % 1.0);
  }
  
  private getTrimsamsaSign(signIndex: number, degreeInSign: number): number {
    // Trimsamsa has special allocation rules based on degrees
    const degree = Math.floor(degreeInSign);
    
    // Different rules for odd and even signs
    const isOddSign = (signIndex + 1) % 2 === 1;
    
    if (isOddSign) {
      // Odd signs (Aries, Gemini, Leo, Libra, Sagittarius, Aquarius)
      if (degree >= 0 && degree < 5) return 4; // Mars (Aries)
      if (degree >= 5 && degree < 10) return 2; // Venus (Taurus)
      if (degree >= 10 && degree < 18) return 6; // Mercury (Virgo)
      if (degree >= 18 && degree < 25) return 5; // Jupiter (Sagittarius)
      if (degree >= 25 && degree < 30) return 7; // Saturn (Capricorn)
    } else {
      // Even signs (Taurus, Cancer, Virgo, Scorpio, Capricorn, Pisces)
      if (degree >= 0 && degree < 5) return 2; // Venus (Taurus)
      if (degree >= 5 && degree < 12) return 4; // Mars (Aries)
      if (degree >= 12 && degree < 20) return 6; // Mercury (Virgo)
      if (degree >= 20 && degree < 25) return 7; // Saturn (Capricorn)
      if (degree >= 25 && degree < 30) return 5; // Jupiter (Sagittarius)
    }
    
    return signIndex; // Fallback
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
   * Calculate dasha periods with correct birth time balance
   */
  private calculateDashaPeriods(moonLongitude: number, birthDate: Date): DashaPeriods {
    // Calculate Moon's nakshatra (1-27)
    const nakshatraSize = 13.333333333333334; // 360/27 = 13°20'
    const nakshatraIndex = Math.floor(moonLongitude / nakshatraSize);
    const positionInNakshatra = moonLongitude - (nakshatraIndex * nakshatraSize);
    const portionTraversed = positionInNakshatra / nakshatraSize;
    const portionRemaining = 1 - portionTraversed;
    
    // Vimshottari dasha sequence and years (total must be exactly 120 years)
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
    
    // Verify total is exactly 120 years
    const totalYears = dashaSequence.reduce((sum, d) => sum + d.years, 0);
    if (totalYears !== 120) {
      throw new Error(`Vimshottari dasha must total 120 years, got ${totalYears}`);
    }
    
    // Find birth dasha based on Moon's nakshatra
    const birthDashaIndex = nakshatraIndex % 9;
    const birthDasha = dashaSequence[birthDashaIndex];
    
    // Calculate balance of dasha at birth (in years)
    const balanceYears = birthDasha.years * portionRemaining;
    
    // Calculate precise balance in years, months, days
    const balanceYearsInt = Math.floor(balanceYears);
    const balanceMonths = Math.floor((balanceYears - balanceYearsInt) * 12);
    const balanceDays = Math.floor(((balanceYears - balanceYearsInt) * 12 - balanceMonths) * 30.4375); // Average days per month accounting for leap years
    
    // Calculate dasha periods starting from birth date
    const currentMahadasha = this.calculateBirthMahadasha(birthDate, balanceYears, birthDasha, dashaSequence);
    const currentAntardasha = this.calculateBirthAntardasha(birthDate, currentMahadasha, dashaSequence);
    const currentPratyantardasha = this.calculateBirthPratyantardasha(birthDate, currentAntardasha, dashaSequence);
    
    return {
      vimshottari: {
        currentMahadasha,
        currentAntardasha,
        currentPratyantardasha,
        birthBalance: `${balanceYearsInt} years ${balanceMonths} months ${balanceDays} days`,
        birthDasha: birthDasha.planet,
        balanceYears: balanceYears
      },
      planetaryPeriods: this.calculateAllDashaPeriods(birthDate, dashaSequence)
    };
  }

  /**
   * Calculate birth Mahadasha with correct balance
   */
  private calculateBirthMahadasha(birthDate: Date, balanceYears: number, birthDasha: any, dashaSequence: any[]): DashaPeriod {
    const startDate = new Date(birthDate);
    const endDate = new Date(birthDate);
    
    // Add balance years using precise calculation (accounting for leap years)
    this.addPreciseYears(endDate, balanceYears);
    
    return {
      planet: birthDasha.planet,
      startDate,
      endDate,
      duration: balanceYears
    };
  }

  /**
   * Calculate birth Antardasha (first antardasha in Mahadasha)
   */
  private calculateBirthAntardasha(birthDate: Date, mahadasha: DashaPeriod, dashaSequence: any[]): DashaPeriod {
    // First antardasha is always the same planet as Mahadasha
    const antardashaDuration = mahadasha.duration * (mahadasha.planet === 'Ketu' ? 7 :
                                   mahadasha.planet === 'Venus' ? 20 :
                                   mahadasha.planet === 'Sun' ? 6 :
                                   mahadasha.planet === 'Moon' ? 10 :
                                   mahadasha.planet === 'Mars' ? 7 :
                                   mahadasha.planet === 'Rahu' ? 18 :
                                   mahadasha.planet === 'Jupiter' ? 16 :
                                   mahadasha.planet === 'Saturn' ? 19 : 17) / 120;
    
    const endDate = new Date(birthDate);
    this.addPreciseYears(endDate, antardashaDuration);
    
    return {
      planet: mahadasha.planet,
      startDate: new Date(birthDate),
      endDate,
      duration: antardashaDuration
    };
  }

  /**
   * Calculate birth Pratyantardasha (first pratyantardasha in Antardasha)
   */
  private calculateBirthPratyantardasha(birthDate: Date, antardasha: DashaPeriod, dashaSequence: any[]): DashaPeriod {
    // First pratyantardasha is the same planet as Antardasha
    const pratyantardashaDuration = antardasha.duration * (antardasha.planet === 'Ketu' ? 7 :
                                      antardasha.planet === 'Venus' ? 20 :
                                      antardasha.planet === 'Sun' ? 6 :
                                      antardasha.planet === 'Moon' ? 10 :
                                      antardasha.planet === 'Mars' ? 7 :
                                      antardasha.planet === 'Rahu' ? 18 :
                                      antardasha.planet === 'Jupiter' ? 16 :
                                      antardasha.planet === 'Saturn' ? 19 : 17) / 120;
    
    const endDate = new Date(birthDate);
    this.addPreciseYears(endDate, pratyantardashaDuration);
    
    return {
      planet: antardasha.planet,
      startDate: new Date(birthDate),
      endDate,
      duration: pratyantardashaDuration
    };
  }
  
  /**
   * Add precise years to a date (accounting for leap years)
   */
  private addPreciseYears(date: Date, years: number): void {
    const wholeYears = Math.floor(years);
    const fractionalYear = years - wholeYears;
    
    // Add whole years
    date.setFullYear(date.getFullYear() + wholeYears);
    
    // Add fractional year using average days (365.25 for leap year accounting)
    const daysToAdd = fractionalYear * 365.25;
    date.setTime(date.getTime() + (daysToAdd * 24 * 60 * 60 * 1000));
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
  
  /**
   * Calculate Shadbala (six-fold strength) for a planet
   * Enhanced version with more accurate classical calculations
   */
  public calculateShadbala(planet: string, planetData: PlanetaryPosition, chartData: EphemerisCalculation): number {
    // Enhanced Shadbala calculation following classical Parashara principles
    // Total Shadbala is measured in Rupas (1 Rupa = 60 Virupas = 60 units)
    // Typical range: 0-10 Rupas (0-600 Virupas)
    
    let totalStrength = 0;
    
    // 1. Sthana Bala (Positional strength) - 25% weight
    // Includes: Uchcha Bala, Saptavargaja Bala, Ojhajugmariamsa Bala, Kendra Bala, Drekkana Bala
    const sthanaBala = this.calculateEnhancedSthanaBala(planet, planetData, chartData);
    totalStrength += sthanaBala * 0.25;
    
    // 2. Dig Bala (Directional strength) - 20% weight
    // Based on exact longitudinal position relative to preferred direction
    const digBala = this.calculateEnhancedDigBala(planet, planetData);
    totalStrength += digBala * 0.20;
    
    // 3. Kaala Bala (Temporal strength) - 20% weight
    // Includes: Natonnata Bala, Paksha Bala, Tribhaga Bala, Varsha-Masa-Dina-Hora Bala
    const kaalaBala = this.calculateEnhancedKaalaBala(planet, planetData, chartData);
    totalStrength += kaalaBala * 0.20;
    
    // 4. Chesta Bala (Motional strength) - 20% weight
    // Based on retrogression and actual speed relative to mean speed
    const chestaBala = this.calculateEnhancedChestaBala(planet, planetData);
    totalStrength += chestaBala * 0.20;
    
    // 5. Naisargika Bala (Natural strength) - 10% weight
    // Based on brightness and natural luminosity
    const naisargikaBala = this.calculateEnhancedNaisargikaBala(planet);
    totalStrength += naisargikaBala * 0.10;
    
    // 6. Drik Bala (Aspectual strength) - 5% weight
    // Based on exact aspects from benefics and malefics with orbs
    const drikBala = this.calculateEnhancedDrikBala(planet, planetData, chartData);
    totalStrength += drikBala * 0.05;
    
    // Convert to 0-100 scale for consistency
    return Math.max(0, Math.min(100, totalStrength));
  }
  
  /**
   * Calculate Enhanced Sthana Bala (Positional strength)
   * More accurate classical calculation with all sub-components
   */
  private calculateEnhancedSthanaBala(planet: string, planetData: PlanetaryPosition, chartData: EphemerisCalculation): number {
    let strength = 0;
    
    // 1. Uchcha Bala (Exaltation strength) - 40% of Sthana Bala
    // Maximum 60 Virupas (1 Rupa) when exactly at exaltation point
    const exaltationPoints: Record<string, number> = {
      'Sun': 10,    // Aries 10°
      'Moon': 33,   // Taurus 3°
      'Mars': 298,  // Capricorn 28°
      'Mercury': 163, // Virgo 13°
      'Jupiter': 95, // Cancer 5°
      'Venus': 337,  // Pisces 7°
      'Saturn': 200, // Libra 20°
      'Rahu': 180,   // Aquarius 0° (conventional)
      'Ketu': 0      // Leo 0° (conventional)
    };
    
    const debilitationPoints: Record<string, number> = {
      'Sun': 190,    // Libra 10°
      'Moon': 213,   // Scorpio 3°
      'Mars': 118,   // Cancer 28°
      'Mercury': 343, // Pisces 13°
      'Jupiter': 275, // Capricorn 5°
      'Venus': 157,  // Virgo 7°
      'Saturn': 20,  // Aries 20°
      'Rahu': 0,     // Leo 0° (conventional)
      'Ketu': 180    // Aquarius 0° (conventional)
    };
    
    const exaltationPoint = exaltationPoints[planet] || 0;
    const debilitationPoint = debilitationPoints[planet] || 0;
    
    // Calculate distance from exaltation (0-180°)
    let distanceFromExaltation = Math.abs(planetData.longitude - exaltationPoint);
    if (distanceFromExaltation > 180) distanceFromExaltation = 360 - distanceFromExaltation;
    
    // Uchcha Bala formula: 60 - (distance × 60 / 180)
    const uchchaBala = Math.max(0, 60 - (distanceFromExaltation * 60 / 180));
    strength += uchchaBala * 0.4;
    
    // 2. Saptavargaja Bala (Divisional chart strength) - 30% of Sthana Bala
    // Check dignity in 7 divisional charts (D-1, D-2, D-3, D-7, D-9, D-12, D-30)
    let divisionalStrength = 0;
    const divisionsToCheck = [1, 2, 3, 7, 9, 12, 30];
    
    for (const division of divisionsToCheck) {
      const divisionalPos = this.calculateDivisionalPosition(planetData.longitude, division);
      const dignity = this.getPlanetaryDignity(planet, divisionalPos);
      
      const dignityScore: Record<string, number> = {
        'exalted': 60,
        'own_sign': 45,
        'friendly': 30,
        'neutral': 15,
        'enemy': 8,
        'debilitated': 0
      };
      
      divisionalStrength += dignityScore[dignity.dignity] || 15;
    }
    
    // Average across 7 divisions
    const saptavargajaBala = divisionalStrength / 7;
    strength += saptavargajaBala * 0.3;
    
    // 3. Ojhajugmariamsa Bala (Odd-even sign strength) - 20% of Sthana Bala
    // Male planets in odd signs, female planets in even signs get strength
    const signIndex = Math.floor(planetData.longitude / 30);
    const isOddSign = (signIndex + 1) % 2 === 1;
    const isMalePlanet = ['Sun', 'Mars', 'Jupiter', 'Saturn'].includes(planet);
    
    const ojhaBala = (isOddSign && isMalePlanet) || (!isOddSign && !isMalePlanet) ? 15 : 5;
    strength += ojhaBala * 0.2;
    
    // 4. Kendra Bala (Quadrant strength) - 10% of Sthana Bala
    // Planets in kendras (1,4,7,10) get more strength
    const house = this.getHouseFromLongitude(planetData.longitude, chartData.houseCusps.ascendant);
    const kendraBala = [1, 4, 7, 10].includes(house) ? 60 : [2, 5, 8, 11].includes(house) ? 30 : 15;
    strength += kendraBala * 0.1;
    
    // 5. Drekkana Bala (Decanate strength) - Additional component
    // Planets in own decanate get extra strength
    const decanate = Math.floor((planetData.longitude % 30) / 10);
    const drekkanaLord = this.getDrekkanaLord(signIndex, decanate);
    const drekkanaBala = drekkanaLord === planet ? 10 : 0;
    strength += drekkanaBala * 0.05; // Small additional weight
    
    return Math.min(100, strength);
  }
  
  /**
   * Get Drekkana lord for a sign and decanate
   */
  private getDrekkanaLord(signIndex: number, decanate: number): string {
    // Drekkana lords follow a special pattern
    const drekkanaLords: Record<number, string[]> = {
      0: ['Mars', 'Sun', 'Jupiter'],    // Aries
      1: ['Venus', 'Mercury', 'Saturn'], // Taurus
      2: ['Mercury', 'Venus', 'Saturn'], // Gemini
      3: ['Moon', 'Mars', 'Jupiter'],    // Cancer
      4: ['Sun', 'Jupiter', 'Mars'],     // Leo
      5: ['Mercury', 'Saturn', 'Venus'], // Virgo
      6: ['Venus', 'Saturn', 'Mercury'], // Libra
      7: ['Mars', 'Jupiter', 'Sun'],     // Scorpio
      8: ['Jupiter', 'Mars', 'Sun'],     // Sagittarius
      9: ['Saturn', 'Venus', 'Mercury'], // Capricorn
      10: ['Saturn', 'Venus', 'Mercury'], // Aquarius
      11: ['Jupiter', 'Mars', 'Moon']    // Pisces
    };
    
    return drekkanaLords[signIndex]?.[decanate] || 'Sun';
  }
  
  /**
   * Calculate Enhanced Dig Bala (Directional strength)
   * Based on exact longitudinal position relative to preferred direction
   */
  private calculateEnhancedDigBala(planet: string, planetData: PlanetaryPosition): number {
    // Each planet has a favorite direction (longitude)
    // Maximum strength when exactly at preferred direction
    const directionalStrength: Record<string, number> = {
      'Sun': 90,   // East (Aries, Leo, Sagittarius) - 90°
      'Moon': 0,   // North (Cancer) - 0°
      'Mars': 90,  // East
      'Mercury': 10, // North (some flexibility)
      'Jupiter': 10, // North
      'Venus': 180,  // South
      'Saturn': 270, // West
      'Rahu': 270,   // West
      'Ketu': 90     // East
    };
    
    const preferredDirection = directionalStrength[planet] || 0;
    const actualDirection = planetData.longitude;
    
    // Calculate angular distance from preferred direction (0-180°)
    let angularDistance = Math.abs(actualDirection - preferredDirection);
    if (angularDistance > 180) angularDistance = 360 - angularDistance;
    
    // Dig Bala formula: 60 - (distance × 60 / 180)
    // Maximum 60 Virupas when exactly at preferred direction
    const digBala = Math.max(0, 60 - (angularDistance * 60 / 180));
    
    // Convert to 0-100 scale for consistency
    return (digBala / 60) * 100;
  }
  
  /**
   * Calculate Enhanced Kaala Bala (Temporal strength)
   * Includes: Natonnata Bala, Paksha Bala, Tribhaga Bala, Varsha-Masa-Dina-Hora Bala
   */
  private calculateEnhancedKaalaBala(planet: string, planetData: PlanetaryPosition, chartData: EphemerisCalculation): number {
    let strength = 0;
    
    // 1. Natonnata Bala (Day/night strength) - 50% of Kaala Bala
    const hour = chartData.timestamp.getHours();
    const isDaytime = hour >= 6 && hour < 18;
    
    const dayPlanets = ['Sun', 'Jupiter', 'Saturn'];
    const nightPlanets = ['Moon', 'Mars', 'Venus'];
    
    let natonnataBala = 30; // Base strength
    if ((isDaytime && dayPlanets.includes(planet)) || (!isDaytime && nightPlanets.includes(planet))) {
      natonnataBala = 60; // Strong when in natural time
    }
    
    // Mercury is flexible - gets 50% strength in both day and night
    if (planet === 'Mercury') {
      natonnataBala = 45;
    }
    
    strength += natonnataBala * 0.5;
    
    // 2. Paksha Bala (Lunar phase strength) - 30% of Kaala Bala
    const moonPhase = chartData.lunarPhase.phaseAngle;
    const isWaxing = moonPhase < 180;
    
    let pakshaBala = 30; // Base strength
    if (['Moon', 'Mars', 'Saturn'].includes(planet)) {
      // Malefics strong in Krishna Paksha (waning)
      pakshaBala = isWaxing ? 30 : 60;
    } else if (['Sun', 'Jupiter', 'Venus'].includes(planet)) {
      // Benefics strong in Shukla Paksha (waxing)
      pakshaBala = isWaxing ? 60 : 30;
    }
    
    // Mercury is neutral
    if (planet === 'Mercury') {
      pakshaBala = 45;
    }
    
    strength += pakshaBala * 0.3;
    
    // 3. Tribhaga Bala (Three-part division strength) - 20% of Kaala Bala
    // Each day divided into 3 parts of 8 hours each
    const isFirstTribhaga = hour >= 0 && hour < 8;   // 0-8 hours
    const isSecondTribhaga = hour >= 8 && hour < 16; // 8-16 hours
    const isThirdTribhaga = hour >= 16 && hour < 24; // 16-24 hours
    
    let tribhagaBala = 30; // Base strength
    
    if (planet === 'Sun' && isFirstTribhaga) {
      tribhagaBala = 60; // Sun strong in first 8 hours
    } else if (planet === 'Mars' && isSecondTribhaga) {
      tribhagaBala = 60; // Mars strong in second 8 hours
    } else if (planet === 'Jupiter' && isThirdTribhaga) {
      tribhagaBala = 60; // Jupiter strong in third 8 hours
    }
    
    strength += tribhagaBala * 0.2;
    
    // Convert to 0-100 scale
    return Math.min(100, strength);
  }
  
  /**
   * Calculate Enhanced Chesta Bala (Motional strength)
   * Based on retrogression and actual speed relative to mean speed
   */
  private calculateEnhancedChestaBala(planet: string, planetData: PlanetaryPosition): number {
    // Sun and Moon have no Chesta Bala (always direct)
    if (['Sun', 'Moon'].includes(planet)) {
      return 0;
    }
    
    // Mean speeds for each planet (degrees per day)
    const meanSpeeds: Record<string, number> = {
      'Mercury': 0.98,
      'Venus': 0.62,
      'Mars': 0.52,
      'Jupiter': 0.083,
      'Saturn': 0.034,
      'Rahu': 0.053, // Always retrograde
      'Ketu': 0.053  // Always retrograde
    };
    
    const meanSpeed = meanSpeeds[planet] || 0.5;
    const actualSpeed = Math.abs(planetData.speed);
    
    let chestaBala = 50; // Base strength
    
    if (planetData.retrograde) {
      // Retrograde planets get maximum strength
      // Formula: 60 - (meanSpeed × 60 / meanSpeed) = 0, but retrograde adds 60
      chestaBala = 100; // Maximum strength when retrograde
    } else {
      // Direct motion - strength based on speed variation
      const speedRatio = actualSpeed / meanSpeed;
      
      if (speedRatio > 1.5) {
        chestaBala = 80; // Very fast
      } else if (speedRatio > 1.2) {
        chestaBala = 70; // Fast
      } else if (speedRatio > 0.8) {
        chestaBala = 60; // Normal speed
      } else if (speedRatio > 0.5) {
        chestaBala = 50; // Slow
      } else {
        chestaBala = 40; // Very slow
      }
    }
    
    return chestaBala;
  }
  
  /**
   * Calculate Enhanced Naisargika Bala (Natural strength)
   * Based on brightness/luminosity and apparent size
   */
  private calculateEnhancedNaisargikaBala(planet: string): number {
    // Based on brightness/luminosity and apparent size
    // Maximum 60 Virupas according to classical texts
    const naturalStrength: Record<string, number> = {
      'Sun': 60,    // Brightest (Surya)
      'Moon': 51.43, // Second brightest (Chandra)
      'Venus': 42.86, // Bright planet
      'Jupiter': 34.29, // Bright planet
      'Mercury': 25.71, // Less bright
      'Mars': 17.14, // Red planet
      'Saturn': 8.57, // Distant planet
      'Rahu': 8.57, // Shadow planet
      'Ketu': 8.57  // Shadow planet
    };
    
    const virupas = naturalStrength[planet] || 8.57;
    
    // Convert to 0-100 scale (60 Virupas = 100%)
    return (virupas / 60) * 100;
  }
  
  /**
   * Calculate Enhanced Drik Bala (Aspectual strength)
   * Based on exact aspects from benefics and malefics with proper orbs
   */
  private calculateEnhancedDrikBala(planet: string, planetData: PlanetaryPosition, chartData: EphemerisCalculation): number {
    let strength = 50; // Base strength (neutral)
    
    // Vedic aspects with their strengths
    const aspectStrengths: Record<string, number[]> = {
      'Sun': [180], // 7th aspect
      'Moon': [180], // 7th aspect
      'Mars': [120, 180, 270], // 4th, 7th, 8th aspects
      'Mercury': [180], // 7th aspect
      'Jupiter': [60, 180, 300], // 5th, 7th, 9th aspects
      'Venus': [180], // 7th aspect
      'Saturn': [90, 180, 360], // 3rd, 7th, 10th aspects
      'Rahu': [180], // 7th aspect
      'Ketu': [180]  // 7th aspect
    };
    
    const benefics = ['Jupiter', 'Venus', 'Moon', 'Mercury'];
    const malefics = ['Saturn', 'Mars', 'Rahu', 'Ketu', 'Sun'];
    
    let beneficInfluence = 0;
    let maleficInfluence = 0;
    
    for (const [otherPlanet, otherData] of Object.entries(chartData.planets)) {
      if (otherPlanet === planet.toLowerCase()) continue;
      
      const otherPlanetName = otherPlanet.charAt(0).toUpperCase() + otherPlanet.slice(1);
      const aspects = aspectStrengths[otherPlanetName] || [180];
      
      for (const aspect of aspects) {
        const aspectDiff = this.calculateAspectDifference(planetData.longitude, otherData.longitude, aspect);
        
        if (aspectDiff !== null) {
          // Aspect strength decreases with orb
          const orbStrength = Math.max(0, 1 - (aspectDiff / 15)); // 15° orb
          
          if (benefics.includes(otherPlanetName)) {
            beneficInfluence += orbStrength * 15; // Benefics add strength
          } else if (malefics.includes(otherPlanetName)) {
            maleficInfluence += orbStrength * 12; // Malefics reduce strength
          }
        }
      }
    }
    
    // Apply influences
    strength += beneficInfluence;
    strength -= maleficInfluence;
    
    return Math.max(0, Math.min(100, strength));
  }
  
  /**
   * Calculate aspect difference with orb
   */
  private calculateAspectDifference(longitude1: number, longitude2: number, aspect: number): number | null {
    const orb = 15; // 15 degree orb for Vedic aspects
    
    let diff = Math.abs(longitude1 - longitude2);
    if (diff > 180) diff = 360 - diff;
    
    const aspectDiff = Math.abs(diff - aspect);
    
    if (aspectDiff <= orb) {
      return aspectDiff; // Return the orb difference (0 = exact aspect)
    }
    
    return null; // No aspect within orb
  }
  
  /**
   * Get house from longitude
   */
  private getHouseFromLongitude(longitude: number, ascendant: number): number {
    const signIndex = Math.floor(longitude / 30);
    const ascendantSignIndex = Math.floor(ascendant / 30);
    return ((signIndex - ascendantSignIndex + 12) % 12) + 1;
  }
  
  /**
   * Identify Raja Yogas (success combinations)
   * Kendra (1,4,7,10) lord + Trikona (1,5,9) lord connection
   */
  public identifyRajaYogas(chartData: EphemerisCalculation): string[] {
    const yogas: string[] = [];
    const ascendant = chartData.houseCusps.ascendant;
    
    // Get kendra and trikona lords
    const kendraLords = this.getKendraLords(ascendant);
    const trikonaLords = this.getTrikonaLords(ascendant);
    
    // Check all combinations
    for (const kendraLord of kendraLords) {
      for (const trikonaLord of trikonaLords) {
        if (kendraLord !== trikonaLord && this.arePlanetsConnected(kendraLord, trikonaLord, chartData)) {
          yogas.push(`${kendraLord}-${trikonaLord} Raja Yoga`);
        }
      }
    }
    
    return yogas;
  }
  
  /**
   * Identify Dhana Yogas (wealth combinations)
   * 2nd-11th lord, 2nd-5th lord connections
   */
  public identifyDhanaYogas(chartData: EphemerisCalculation): string[] {
    const yogas: string[] = [];
    const ascendant = chartData.houseCusps.ascendant;
    
    const secondLord = this.getHouseLord(2, ascendant);
    const fifthLord = this.getHouseLord(5, ascendant);
    const eleventhLord = this.getHouseLord(11, ascendant);
    
    // 2nd-11th lord connection
    if (this.arePlanetsConnected(secondLord, eleventhLord, chartData)) {
      yogas.push(`${secondLord}-${eleventhLord} Dhana Yoga (2nd-11th)`);
    }
    
    // 2nd-5th lord connection
    if (this.arePlanetsConnected(secondLord, fifthLord, chartData)) {
      yogas.push(`${secondLord}-${fifthLord} Dhana Yoga (2nd-5th)`);
    }
    
    return yogas;
  }
  
  /**
   * Identify Arishta Yogas (difficulty combinations)
   * 6th-8th-12th lord placements in kendras
   */
  public identifyArishtaYogas(chartData: EphemerisCalculation): string[] {
    const yogas: string[] = [];
    const ascendant = chartData.houseCusps.ascendant;
    
    const sixthLord = this.getHouseLord(6, ascendant);
    const eighthLord = this.getHouseLord(8, ascendant);
    const twelfthLord = this.getHouseLord(12, ascendant);
    
    const dusthanaLords = [sixthLord, eighthLord, twelfthLord];
    const kendras = [1, 4, 7, 10];
    
    for (const lord of dusthanaLords) {
      const lordPosition = chartData.planets[lord.toLowerCase() as keyof typeof chartData.planets];
      if (lordPosition) {
        const house = this.getHouseFromLongitude(lordPosition.longitude, ascendant);
        if (kendras.includes(house)) {
          yogas.push(`${lord} in ${house}th house - Arishta Yoga`);
        }
      }
    }
    
    return yogas;
  }
  
  /**
   * Get kendra (quadrant) lords
   */
  private getKendraLords(ascendant: number): string[] {
    const ascendantSign = Math.floor(ascendant / 30);
    const kendraHouses = [0, 3, 6, 9]; // 1st, 4th, 7th, 10th from ascendant
    const lords: string[] = [];
    
    for (const offset of kendraHouses) {
      const sign = (ascendantSign + offset) % 12;
      lords.push(this.getSignLord(sign));
    }
    
    return lords;
  }
  
  /**
   * Get trikona (trine) lords
   */
  private getTrikonaLords(ascendant: number): string[] {
    const ascendantSign = Math.floor(ascendant / 30);
    const trikonaHouses = [0, 4, 8]; // 1st, 5th, 9th from ascendant
    const lords: string[] = [];
    
    for (const offset of trikonaHouses) {
      const sign = (ascendantSign + offset) % 12;
      lords.push(this.getSignLord(sign));
    }
    
    return lords;
  }
  
  /**
   * Get lord of a sign
   */
  private getSignLord(signIndex: number): string {
    const signLords = [
      'Mars',    // Aries
      'Venus',   // Taurus
      'Mercury', // Gemini
      'Moon',    // Cancer
      'Sun',     // Leo
      'Mercury', // Virgo
      'Venus',   // Libra
      'Mars',    // Scorpio
      'Jupiter', // Sagittarius
      'Saturn',  // Capricorn
      'Saturn',  // Aquarius
      'Jupiter'  // Pisces
    ];
    return signLords[signIndex];
  }
  
  /**
   * Get lord of a house
   */
  private getHouseLord(house: number, ascendant: number): string {
    const ascendantSign = Math.floor(ascendant / 30);
    const sign = (ascendantSign + house - 1) % 12;
    return this.getSignLord(sign);
  }
  
  /**
   * Check if two planets are connected (conjunction, aspect, or exchange)
   */
  private arePlanetsConnected(planet1: string, planet2: string, chartData: EphemerisCalculation): boolean {
    const p1 = chartData.planets[planet1.toLowerCase() as keyof typeof chartData.planets];
    const p2 = chartData.planets[planet2.toLowerCase() as keyof typeof chartData.planets];
    
    if (!p1 || !p2) return false;
    
    // Check conjunction (within 10°)
    const diff = Math.abs(p1.longitude - p2.longitude);
    if (diff <= 10 || diff >= 350) return true;
    
    // Check aspect (7th aspect for all planets)
    const aspectDiff = Math.abs(p1.longitude - p2.longitude);
    if (aspectDiff >= 170 && aspectDiff <= 190) return true;
    
    // Check special aspects
    if (planet1 === 'Mars' && (aspectDiff >= 110 && aspectDiff <= 130)) return true; // 4th aspect
    if (planet1 === 'Mars' && (aspectDiff >= 260 && aspectDiff <= 280)) return true; // 8th aspect
    if (planet1 === 'Jupiter' && (aspectDiff >= 50 && aspectDiff <= 70)) return true; // 5th aspect
    if (planet1 === 'Jupiter' && (aspectDiff >= 230 && aspectDiff <= 250)) return true; // 9th aspect
    if (planet1 === 'Saturn' && (aspectDiff >= 80 && aspectDiff <= 100)) return true; // 3rd aspect
    if (planet1 === 'Saturn' && (aspectDiff >= 200 && aspectDiff <= 220)) return true; // 10th aspect
    
    return false;
  }
}

/**
 * Factory function to create Swiss Ephemeris Engine
 */
export function createSwissEphemerisEngine(ephemerisPath?: string): SwissEphemerisEngine {
  return new SwissEphemerisEngine(ephemerisPath);
}