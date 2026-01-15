/**
 * 🌟 Swiss Ephemeris Engine - Fallback Implementation
 * 
 * This fallback implementation provides mock data when the real
 * Swiss Ephemeris library is not available (e.g., native module
 * compilation issues).
 * 
 * Use this until swisseph.node is properly compiled.
 */

export interface EphemerisCalculation {
  timestamp: Date;
  julianDay: number;
  planets: {
    sun: any;
    moon: any;
    mercury: any;
    venus: any;
    mars: any;
    jupiter: any;
    saturn: any;
    rahu: any;
    ketu: any;
  };
  houseCusps: any;
  lunarPhase: any;
  retrogradePlanets: string[];
  nakshatras: any;
  divisionalCharts: any;
  dashaPeriods: any;
}

export class SwissEphemerisEngineFallback {
  private isInitialized: boolean = false;
  private ephemerisPath: string;
  private useKPSystem: boolean;
  
  constructor(ephemerisPath: string = './ephe', useKPSystem: boolean = true) {
    this.ephemerisPath = ephemerisPath;
    this.useKPSystem = useKPSystem;
    console.warn('⚠️ Using FALLBACK Swiss Ephemeris Engine - Real calculations disabled');
    console.warn('⚠️ To enable real calculations: npm rebuild swisseph');
  }

  async initialize(): Promise<void> {
    console.log('🔮 Initializing FALLBACK Swiss Ephemeris Engine...');
    console.log(`📁 Ephemeris path: ${this.ephemerisPath} (not used in fallback)`);
    console.log('🎯 Using LAHIRI Ayanamsha (fallback mode)');
    
    this.isInitialized = true;
    console.log('✅ FALLBACK Swiss Ephemeris Engine initialized');
    console.log('⚠️  WARNING: All calculations are MOCK DATA for testing');
  }

  async calculateEphemerisForBTR(
    date: Date,
    latitude: number,
    longitude: number,
    timezone: string,
    houseSystem: string = 'W'
  ): Promise<EphemerisCalculation> {
    if (!this.isInitialized) {
      throw new Error('Swiss Ephemeris Engine not initialized');
    }

    console.warn(`⚠️ FALLBACK MODE: Mock calculation for ${date.toISOString()}`);
    
    // Generate mock data based on date
    const mockData = this.generateMockData(date, latitude, longitude);
    
    return mockData;
  }

  private generateMockData(date: Date, latitude: number, longitude: number): EphemerisCalculation {
    // Use date to generate deterministic mock data
    const dayOfYear = this.getDayOfYear(date);
    const year = date.getFullYear();
    
    // Generate planetary positions (deterministic based on date)
    const planets = this.generateMockPlanets(dayOfYear, year);
    const houseCusps = this.generateMockHouses(dayOfYear, latitude);
    const nakshatras = this.generateMockNakshatras(dayOfYear);
    const dashaPeriods = this.generateMockDasha(dayOfYear, date);
    const divisionalCharts = this.generateMockDivisionalCharts(planets, houseCusps);
    
    return {
      timestamp: date,
      julianDay: this.calculateJulianDay(date),
      planets,
      houseCusps,
      lunarPhase: this.calculateMockLunarPhase(dayOfYear),
      retrogradePlanets: this.generateMockRetrograde(dayOfYear),
      nakshatras,
      divisionalCharts,
      dashaPeriods
    };
  }

  private generateMockPlanets(dayOfYear: number, year: number): any {
    // Deterministic mock planetary positions
    const baseLongitude = (dayOfYear / 365.25) * 360;
    
    return {
      sun: this.createMockPlanet('Sun', (baseLongitude + 0) % 360, false),
      moon: this.createMockPlanet('Moon', (baseLongitude * 13 + 0) % 360, false),
      mercury: this.createMockPlanet('Mercury', (baseLongitude * 4 + 30) % 360, this.isRetrograde(dayOfYear, 1)),
      venus: this.createMockPlanet('Venus', (baseLongitude * 1.6 + 60) % 360, this.isRetrograde(dayOfYear, 2)),
      mars: this.createMockPlanet('Mars', (baseLongitude * 0.5 + 90) % 360, this.isRetrograde(dayOfYear, 3)),
      jupiter: this.createMockPlanet('Jupiter', (baseLongitude * 0.1 + 120) % 360, false),
      saturn: this.createMockPlanet('Saturn', (baseLongitude * 0.05 + 150) % 360, this.isRetrograde(dayOfYear, 4)),
      rahu: this.createMockPlanet('Rahu', (baseLongitude * 0.05 + 180) % 360, true),
      ketu: this.createMockPlanet('Ketu', (baseLongitude * 0.05 + 0) % 360, true)
    };
  }

  private createMockPlanet(name: string, longitude: number, retrograde: boolean): any {
    const signIndex = Math.floor(longitude / 30);
    const signDegree = longitude % 30;
    
    return {
      longitude,
      latitude: 0,
      speed: retrograde ? -1 : 1,
      retrograde,
      sign: ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
             'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'][signIndex],
      signDegree,
      nakshatra: this.getNakshatra(longitude),
      nakshatraPada: Math.floor((longitude % 13.333333) / 3.333333) + 1,
      dignity: this.getMockDignity(name, signIndex)
    };
  }

  private generateMockHouses(dayOfYear: number, latitude: number): any {
    const baseAscendant = (dayOfYear / 365.25) * 360 + (latitude / 90) * 30;
    
    return {
      ascendant: baseAscendant % 360,
      secondHouse: (baseAscendant + 30) % 360,
      thirdHouse: (baseAscendant + 60) % 360,
      fourthHouse: (baseAscendant + 90) % 360,
      fifthHouse: (baseAscendant + 120) % 360,
      sixthHouse: (baseAscendant + 150) % 360,
      seventhHouse: (baseAscendant + 180) % 360,
      eighthHouse: (baseAscendant + 210) % 360,
      ninthHouse: (baseAscendant + 240) % 360,
      tenthHouse: (baseAscendant + 270) % 360,
      eleventhHouse: (baseAscendant + 300) % 360,
      twelfthHouse: (baseAscendant + 330) % 360
    };
  }

  private generateMockNakshatras(dayOfYear: number): any {
    const moonLongitude = (dayOfYear * 13) % 360;
    const lagnaLongitude = (dayOfYear * 1) % 360;
    
    return {
      moon: this.getNakshatraInfo(moonLongitude),
      lagna: this.getNakshatraInfo(lagnaLongitude)
    };
  }

  private generateMockDasha(dayOfYear: number, birthDate: Date): any {
    const nakshatraIndex = Math.floor(((dayOfYear * 13) % 360) / 13.333333);
    
    return {
      vimshottari: {
        currentMahadasha: { planet: ['Ketu', 'Venus', 'Sun', 'Moon', 'Mars', 'Rahu', 'Jupiter', 'Saturn', 'Mercury'][nakshatraIndex % 9], startDate: birthDate, endDate: new Date(birthDate.getTime() + 7 * 365 * 24 * 60 * 60 * 1000), duration: 7 },
        currentAntardasha: { planet: ['Ketu', 'Venus', 'Sun', 'Moon', 'Mars', 'Rahu', 'Jupiter', 'Saturn', 'Mercury'][(nakshatraIndex + 1) % 9], startDate: birthDate, endDate: new Date(birthDate.getTime() + 20 * 365 * 24 * 60 * 60 * 1000), duration: 20 },
        currentPratyantardasha: { planet: ['Ketu', 'Venus', 'Sun', 'Moon', 'Mars', 'Rahu', 'Jupiter', 'Saturn', 'Mercury'][(nakshatraIndex + 2) % 9], startDate: birthDate, endDate: new Date(birthDate.getTime() + 6 * 365 * 24 * 60 * 60 * 1000), duration: 6 },
        birthBalance: 'Mock balance',
        birthDasha: ['Ketu', 'Venus', 'Sun', 'Moon', 'Mars', 'Rahu', 'Jupiter', 'Saturn', 'Mercury'][nakshatraIndex % 9],
        balanceYears: 7
      },
      planetaryPeriods: {}
    };
  }

  private generateMockDivisionalCharts(planets: any, houseCusps: any): any {
    return {
      d1: { lagna: houseCusps.ascendant, lagnaSign: this.getZodiacSign(houseCusps.ascendant), planets: this.getDivisionalPositions(planets, 1) },
      d9: { lagna: this.calculateDivisionalPosition(houseCusps.ascendant, 9), lagnaSign: this.getZodiacSign(this.calculateDivisionalPosition(houseCusps.ascendant, 9)), planets: this.getDivisionalPositions(planets, 9) },
      d10: { lagna: this.calculateDivisionalPosition(houseCusps.ascendant, 10), lagnaSign: this.getZodiacSign(this.calculateDivisionalPosition(houseCusps.ascendant, 10)), planets: this.getDivisionalPositions(planets, 10) },
      d7: { lagna: this.calculateDivisionalPosition(houseCusps.ascendant, 7), lagnaSign: this.getZodiacSign(this.calculateDivisionalPosition(houseCusps.ascendant, 7)), planets: this.getDivisionalPositions(planets, 7) },
      d24: { lagna: this.calculateDivisionalPosition(houseCusps.ascendant, 24), lagnaSign: this.getZodiacSign(this.calculateDivisionalPosition(houseCusps.ascendant, 24)), planets: this.getDivisionalPositions(planets, 24) },
      d60: { lagna: this.calculateDivisionalPosition(houseCusps.ascendant, 60), lagnaSign: this.getZodiacSign(this.calculateDivisionalPosition(houseCusps.ascendant, 60)), planets: this.getDivisionalPositions(planets, 60) }
    };
  }

  private getDivisionalPositions(planets: any, division: number): any {
    const positions: any = {};
    for (const [name, planet] of Object.entries(planets as any)) {
      positions[name] = this.calculateDivisionalPosition(planet.longitude, division);
    }
    return positions;
  }

  private calculateDivisionalPosition(longitude: number, division: number): number {
    const signIndex = Math.floor(longitude / 30);
    const degreeInSign = longitude % 30;
    const divisionSize = 30 / division;
    const divisionNumber = Math.floor(degreeInSign / divisionSize);
    
    return (signIndex * 30) + (divisionNumber * divisionSize) + (degreeInSign % divisionSize);
  }

  private calculateMockLunarPhase(dayOfYear: number): any {
    const phaseAngle = (dayOfYear / 29.53) * 360 % 360;
    return {
      phaseAngle,
      phaseName: phaseAngle < 45 ? 'New Moon' : phaseAngle < 90 ? 'Waxing Crescent' : 
                phaseAngle < 135 ? 'First Quarter' : phaseAngle < 180 ? 'Waxing Gibbous' :
                phaseAngle < 225 ? 'Full Moon' : phaseAngle < 270 ? 'Waning Gibbous' :
                phaseAngle < 315 ? 'Last Quarter' : 'Waning Crescent',
      illumination: (1 - Math.cos(phaseAngle * Math.PI / 180)) / 2 * 100,
      daysSinceNewMoon: (phaseAngle / 360) * 29.53
    };
  }

  private generateMockRetrograde(dayOfYear: number): string[] {
    const retrograde: string[] = [];
    if (this.isRetrograde(dayOfYear, 1)) retrograde.push('mercury');
    if (this.isRetrograde(dayOfYear, 2)) retrograde.push('venus');
    if (this.isRetrograde(dayOfYear, 3)) retrograde.push('mars');
    if (this.isRetrograde(dayOfYear, 4)) retrograde.push('jupiter');
    if (this.isRetrograde(dayOfYear, 5)) retrograde.push('saturn');
    return retrograde;
  }

  private isRetrograde(dayOfYear: number, planetIndex: number): boolean {
    // Simplified retrograde pattern
    return (dayOfYear + planetIndex * 100) % 300 < 60;
  }

  private isRetrogradePlanet(planet: string, dayOfYear: number, cycle: number): boolean {
    return this.isRetrograde(dayOfYear, ['mercury', 'venus', 'mars', 'jupiter', 'saturn'].indexOf(planet) + 1);
  }

  private getNakshatra(longitude: number): string {
    const nakshatras = [
      'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra',
      'Punarvasu', 'Pushya', 'Ashlesha', 'Magha', 'Purva Phalguni', 'Uttara Phalguni',
      'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha',
      'Mula', 'Purva Ashadha', 'Uttara Ashadha', 'Shravana', 'Dhanishtha', 'Shatabhisha',
      'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati'
    ];
    const index = Math.floor(longitude / 13.333333);
    return nakshatras[index] || 'Ashwini';
  }

  private getNakshatraInfo(longitude: number): any {
    const nakshatraSize = 13.333333333333334;
    const nakshatraIndex = Math.floor(longitude / nakshatraSize);
    const pada = Math.floor((longitude % nakshatraSize) / (nakshatraSize / 4)) + 1;
    
    const nakshatraLords = ['Ketu', 'Venus', 'Sun', 'Moon', 'Mars', 'Rahu', 'Jupiter', 'Saturn', 'Mercury'];
    const nakshatraDeities = [
      'Ashwini Kumaras', 'Yama', 'Agni', 'Brahma', 'Chandra', 'Rudra', 'Aditi', 'Brihaspati', 'Serpents',
      'Pitris', 'Bhaga', 'Aryaman', 'Savitr', 'Vishnu', 'Indra', 'Mitra', 'Indra', 'Nirriti',
      'Varuna', 'Vishvedevas', 'Vishvedevas', 'Vishnu', 'Vasus', 'Varuna', 'Ajikapada', 'Ahirbudhnya', 'Pushan'
    ];
    
    return {
      name: this.getNakshatra(longitude),
      pada,
      lord: nakshatraLords[nakshatraIndex % 9],
      deity: nakshatraDeities[nakshatraIndex] || 'Unknown',
      startingDegree: longitude % nakshatraSize
    };
  }

  private getZodiacSign(degree: number): string {
    const signs = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
                   'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
    return signs[Math.floor(degree / 30)] || 'Aries';
  }

  private getMockDignity(planet: string, signIndex: number): any {
    const dignities: any = {
      'Sun': { 0: 'exalted', 4: 'own_sign', 6: 'debilitated' },
      'Moon': { 1: 'exalted', 3: 'own_sign', 7: 'debilitated' },
      'Mars': { 9: 'exalted', 0: 'own_sign', 7: 'own_sign', 3: 'debilitated' },
      'Mercury': { 5: 'exalted', 2: 'own_sign', 6: 'own_sign', 11: 'debilitated' },
      'Jupiter': { 3: 'exalted', 8: 'own_sign', 11: 'own_sign', 9: 'debilitated' },
      'Venus': { 11: 'exalted', 1: 'own_sign', 6: 'own_sign', 5: 'debilitated' },
      'Saturn': { 6: 'exalted', 9: 'own_sign', 10: 'own_sign', 0: 'debilitated' }
    };
    
    const planetDignity = dignities[planet] || {};
    const dignity = planetDignity[signIndex] || 'neutral';
    
    let strength = 50;
    if (dignity === 'exalted') strength = 100;
    else if (dignity === 'own_sign') strength = 80;
    else if (dignity === 'debilitated') strength = 20;
    else if (dignity === 'friendly') strength = 70;
    else if (dignity === 'enemy') strength = 30;
    
    return { sign: this.getZodiacSign(signIndex * 30), dignity, strength };
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

  private getDayOfYear(date: Date): number {
    const start = new Date(date.getFullYear(), 0, 0);
    const diff = date.getTime() - start.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }
}

/**
 * Factory function to create Swiss Ephemeris Engine (with fallback)
 */
export function createSwissEphemerisEngine(ephemerisPath?: string): any {
  try {
    // Try to load the real Swiss Ephemeris
    const swisseph = require('swisseph');
    console.log('✅ Real Swiss Ephemeris library loaded successfully');
    
    // If we get here, the native module is available
    const { SwissEphemerisEngine } = require('./swiss-ephemeris-engine');
    return new SwissEphemerisEngine(ephemerisPath);
  } catch (error) {
    console.warn('⚠️ Failed to load real Swiss Ephemeris:', error instanceof Error ? error.message : 'Unknown error');
    console.warn('⚠️ Using FALLBACK mode - Mock data will be generated');
    console.warn('⚠️ To fix: npm rebuild swisseph or npm install swisseph');
    
    // Return fallback implementation
    return new SwissEphemerisEngineFallback(ephemerisPath);
  }
}
