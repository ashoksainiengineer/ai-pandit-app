/**
 * 🌟 Swiss Ephemeris Server-Side Calculator
 * 
 * This module is designed to run ONLY on the server side (Node.js)
 * It uses the native swisseph module which cannot be bundled for the browser
 * 
 * Usage: Import this only in API routes, not in client-side code
 */

import * as swisseph from 'swisseph';

// Planetary constants
const PLANETS = {
  SUN: swisseph.SE_SUN,
  MOON: swisseph.SE_MOON,
  MERCURY: swisseph.SE_MERCURY,
  VENUS: swisseph.SE_VENUS,
  MARS: swisseph.SE_MARS,
  JUPITER: swisseph.SE_JUPITER,
  SATURN: swisseph.SE_SATURN,
  TRUE_NODE: swisseph.SE_TRUE_NODE,
};

// Ayanamsha modes
const AYANAMSHA_MODES = {
  LAHIRI: swisseph.SE_SIDM_LAHIRI,
};

// Zodiac signs
const ZODIAC_SIGNS = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
];

// Nakshatras
const NAKSHATRAS = [
  'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra',
  'Punarvasu', 'Pushya', 'Ashlesha', 'Magha', 'Purva Phalguni', 'Uttara Phalguni',
  'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha',
  'Mula', 'Purva Ashadha', 'Uttara Ashadha', 'Shravana', 'Dhanishtha', 'Shatabhisha',
  'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati'
];

export interface ServerSideEphemerisResult {
  success: boolean;
  timestamp: string;
  julianDay: number;
  planets: Record<string, {
    sign: string;
    degree: string;
    longitude: string;
    nakshatra: string;
    nakshatraPada: number;
  }>;
  houseCusps: {
    ascendant: number;
    [key: string]: number;
  };
  nakshatras: {
    moon: {
      name: string;
      pada: number;
      lord: string;
    };
    lagna: {
      name: string;
      pada: number;
      lord: string;
    };
  };
  dashaPeriods: any;
}

export class SwissEphemerisServer {
  private ephemerisPath: string;
  private isInitialized: boolean = false;

  constructor(ephemerisPath: string = './ephe') {
    this.ephemerisPath = ephemerisPath;
  }

  async initialize(): Promise<void> {
    try {
      console.log('🔮 Initializing Swiss Ephemeris Server...');
      console.log(`📁 Ephemeris path: ${this.ephemerisPath}`);
      
      // Set ephemeris file path
      swisseph.swe_set_ephe_path(this.ephemerisPath);
      
      // Set Lahiri ayanamsha
      swisseph.swe_set_sid_mode(AYANAMSHA_MODES.LAHIRI, 0, 0);
      console.log('🎯 Using LAHIRI Ayanamsha (Chitrapaksha)');
      
      this.isInitialized = true;
      console.log('✅ Swiss Ephemeris Server initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Swiss Ephemeris Server:', error);
      throw error;
    }
  }

  async calculateEphemeris(date: Date, latitude: number, longitude: number): Promise<ServerSideEphemerisResult> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const julianDay = this.calculateJulianDay(date);
    
    // Calculate planets
    const planets = await this.calculatePlanets(julianDay);
    
    // Calculate houses
    const houses = await this.calculateHouses(julianDay, latitude, longitude);
    
    // Calculate nakshatras
    const nakshatras = this.calculateNakshatras(planets.moon.longitude, houses.ascendant);
    
    // Calculate dasha
    const dashaPeriods = this.calculateDashaPeriods(planets.moon.longitude, date);

    return {
      success: true,
      timestamp: date.toISOString(),
      julianDay,
      planets,
      houseCusps: houses,
      nakshatras,
      dashaPeriods
    };
  }

  private calculateJulianDay(date: Date): number {
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth() + 1;
    const day = date.getUTCDate();
    const hour = date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600;

    const a = Math.floor((14 - month) / 12);
    const y = year + 4800 - a;
    const m = month + 12 * a - 3;

    const julianDay = day + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
    
    return julianDay + (hour - 12) / 24;
  }

  private async calculatePlanets(julianDay: number): Promise<Record<string, any>> {
    const planets: Record<string, any> = {};
    
    const planetConfigs = [
      { name: 'sun', id: PLANETS.SUN },
      { name: 'moon', id: PLANETS.MOON },
      { name: 'mercury', id: PLANETS.MERCURY },
      { name: 'venus', id: PLANETS.VENUS },
      { name: 'mars', id: PLANETS.MARS },
      { name: 'jupiter', id: PLANETS.JUPITER },
      { name: 'saturn', id: PLANETS.SATURN },
    ];

    for (const config of planetConfigs) {
      try {
        const result: any = swisseph.swe_calc_ut(julianDay, config.id, swisseph.SEFLG_SPEED | swisseph.SEFLG_SIDEREAL);
        
        if (result.error) {
          console.warn(`⚠️ Error calculating ${config.name}: ${result.error}`);
          continue;
        }
        
        const longitude = result.longitude;
        const signIndex = Math.floor(longitude / 30);
        const signDegree = longitude % 30;
        const nakshatra = this.getNakshatra(longitude);
        const nakshatraPada = this.getNakshatraPada(longitude);
        
        planets[config.name] = {
          sign: ZODIAC_SIGNS[signIndex],
          degree: signDegree.toFixed(2),
          longitude: longitude.toFixed(2),
          nakshatra: nakshatra,
          nakshatraPada: nakshatraPada
        };
        
      } catch (error) {
        console.warn(`⚠️ Exception calculating ${config.name}:`, error);
      }
    }

    // Calculate Rahu
    try {
      const rahuResult: any = swisseph.swe_calc_ut(julianDay, PLANETS.TRUE_NODE, swisseph.SEFLG_SPEED | swisseph.SEFLG_SIDEREAL);
      if (!rahuResult.error) {
        const rahuLongitude = rahuResult.longitude;
        const rahuSignIndex = Math.floor(rahuLongitude / 30);
        const rahuSignDegree = rahuLongitude % 30;
        
        planets.rahu = {
          sign: ZODIAC_SIGNS[rahuSignIndex],
          degree: rahuSignDegree.toFixed(2),
          longitude: rahuLongitude.toFixed(2),
          nakshatra: this.getNakshatra(rahuLongitude),
          nakshatraPada: this.getNakshatraPada(rahuLongitude)
        };

        // Calculate Ketu (180° opposite Rahu)
        const ketuLongitude = (rahuLongitude + 180) % 360;
        const ketuSignIndex = Math.floor(ketuLongitude / 30);
        const ketuSignDegree = ketuLongitude % 30;
        
        planets.ketu = {
          sign: ZODIAC_SIGNS[ketuSignIndex],
          degree: ketuSignDegree.toFixed(2),
          longitude: ketuLongitude.toFixed(2),
          nakshatra: this.getNakshatra(ketuLongitude),
          nakshatraPada: this.getNakshatraPada(ketuLongitude)
        };
      }
    } catch (error) {
      console.warn('⚠️ Exception calculating Rahu/Ketu:', error);
    }

    return planets;
  }

  private async calculateHouses(julianDay: number, latitude: number, longitude: number): Promise<any> {
    try {
      const housesResult: any = swisseph.swe_houses(julianDay, latitude, longitude, 'W');
      
      if (housesResult.error) {
        console.warn(`⚠️ Error calculating houses: ${housesResult.error}`);
        return this.getFallbackHouses();
      }
      
      const cusps = housesResult.cusp || [];
      
      if (cusps.length < 12) {
        console.warn('⚠️ Insufficient house cusps returned');
        return this.getFallbackHouses();
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
      console.warn('⚠️ Exception calculating houses:', error);
      return this.getFallbackHouses();
    }
  }

  private getFallbackHouses(): any {
    // Return empty houses - in real usage, this shouldn't happen
    return {
      ascendant: 0, secondHouse: 30, thirdHouse: 60, fourthHouse: 90,
      fifthHouse: 120, sixthHouse: 150, seventhHouse: 180, eighthHouse: 210,
      ninthHouse: 240, tenthHouse: 270, eleventhHouse: 300, twelfthHouse: 330
    };
  }

  private getNakshatra(longitude: number): string {
    const nakshatraSize = 360 / 27;
    const index = Math.floor(longitude / nakshatraSize);
    return NAKSHATRAS[index] || 'Unknown';
  }

  private getNakshatraPada(longitude: number): number {
    const nakshatraSize = 360 / 27;
    return Math.floor((longitude % nakshatraSize) / (nakshatraSize / 4)) + 1;
  }

  private calculateNakshatras(moonLongitude: number, ascendant: number): any {
    return {
      moon: this.getNakshatraInfo(moonLongitude),
      lagna: this.getNakshatraInfo(ascendant)
    };
  }

  private getNakshatraInfo(longitude: number): any {
    const nakshatraSize = 13.333333333333334;
    const nakshatraIndex = Math.floor(longitude / nakshatraSize);
    const pada = Math.floor((longitude % nakshatraSize) / (nakshatraSize / 4)) + 1;
    
    const nakshatraLords = [
      'Ketu', 'Venus', 'Sun', 'Moon', 'Mars', 'Rahu', 'Jupiter', 'Saturn', 'Mercury'
    ];
    
    return {
      name: NAKSHATRAS[nakshatraIndex] || 'Unknown',
      pada,
      lord: nakshatraLords[nakshatraIndex % 9]
    };
  }

  private calculateDashaPeriods(moonLongitude: number, birthDate: Date): any {
    const nakshatraSize = 13.333333333333334;
    const nakshatraIndex = Math.floor(moonLongitude / nakshatraSize);
    
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
    
    const birthDashaIndex = nakshatraIndex % 9;
    const birthDasha = dashaSequence[birthDashaIndex];
    
    return {
      vimshottari: {
        birthDasha: birthDasha.planet,
        currentMahadasha: {
          planet: birthDasha.planet,
          startDate: birthDate,
          endDate: new Date(birthDate.getTime() + birthDasha.years * 365.25 * 24 * 60 * 60 * 1000)
        }
      }
    };
  }
}

// Export singleton instance
export const swissEphemerisServer = new SwissEphemerisServer('./ephe');