/**
 * 🌟 BTR Iteration Engine - Enhanced Version with Comprehensive Logging
 * 
 * Implements the iterative BTR process with detailed progress tracking:
 * 1. Analyze current chart against Life Events
 * 2. Identify discrepancies in D-9/D-60 charts
 * 3. Hypothesize time shifts
 * 4. Command Swiss Ephemeris for new calculations (via API)
 * 5. Verify alignment improvements
 * 6. Finalize when >90% events align
 * 
 * Enhanced with:
 * - Real-time progress logging
 * - Score tracking and optimization
 * - Performance metrics
 * - Detailed candidate analysis
 * 
 * IMPORTANT: This file uses the API client to call server-side Swiss Ephemeris calculations.
 * It should NEVER import swisseph directly.
 */

import { calculateBasicEphemeris } from './api-client';
import { LifeEvent } from '../types';

// Zodiac signs for yoga identification
const ZODIAC_SIGNS = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
];

export interface BTREvent {
  eventType: 'marriage' | 'childbirth' | 'career' | 'education' | 'health' | 'travel' | 'property' | 'loss';
  date: Date;
  description: string;
  expectedPlanets: string[];
  expectedHouses: number[];
  expectedDasha: string[];
  weight: number; // 1-10 importance for matching
}

export interface BTRIteration {
  iteration: number;
  birthTime: Date;
  timeShift: number; // minutes from original
  alignmentScore: number;
  eventMatches: EventMatch[];
  discrepancies: Discrepancy[];
  recommendations: string[];
  converged: boolean;
  processingTime?: number; // ms
}

export interface EventMatch {
  event: BTREvent;
  matchScore: number;
  matchingFactors: {
    planets: boolean;
    houses: boolean;
    dasha: boolean;
    divisional: boolean;
  };
  notes: string[];
}

export interface Discrepancy {
  event: BTREvent;
  expected: string;
  actual: string;
  severity: 'low' | 'medium' | 'high';
  suggestedAdjustment: number; // minutes
}

export interface BTRResult {
  originalTime: Date;
  rectifiedTime: Date;
  totalIterations: number;
  finalAlignmentScore: number;
  eventMatches: EventMatch[];
  convergenceReason: string;
  confidenceLevel: 'low' | 'medium' | 'high' | 'very_high';
  chartData: any; // Changed from EphemerisCalculation to any since we get data from API
  alternativeTimes: AlternativeTime[];
  performanceMetrics?: {
    totalProcessingTime: number;
    averageIterationTime: number;
    phase1Time: number;
    phase2Time: number;
    phase3Time: number;
  };
}

export interface AlternativeTime {
  time: Date;
  score: number;
  reason: string;
}

export interface BTRConfig {
  maxIterations: number;
  convergenceThreshold: number; // 90% default
  timeStep: number; // minutes per iteration
  maxTimeShift: number; // maximum minutes from original
  divisionalCharts: string[]; // ['d1', 'd9', 'd60'] priority charts
  weightFactors: {
    planets: number;
    houses: number; // INCREASED: House lordship is critical for event timing
    dasha: number;
    divisional: number;
  };
}

export interface ProgressCallback {
  (phase: string, progress: number, total: number, message: string, details?: any): void;
}

/**
 * 🌟 BTR Iteration Engine - Enhanced Version
 * 
 * Continuously refines birth time by comparing calculated charts with life events
 * Uses API calls to server-side Swiss Ephemeris for high-precision astronomical calculations
 * Enhanced with comprehensive logging and progress tracking
 */
export class BTREngineEnhanced {
  private config: BTRConfig;
  private iterations: BTRIteration[] = [];
  private currentIteration = 0;
  private progressCallback?: ProgressCallback;
  private phaseStartTime: number = 0;
  private totalStartTime: number = 0;

  constructor(config?: Partial<BTRConfig>, progressCallback?: ProgressCallback) {
    this.progressCallback = progressCallback;
    this.config = {
      maxIterations: 50,
      convergenceThreshold: 90,
      timeStep: 4, // 4 minutes per iteration
      maxTimeShift: 120, // ±2 hours max adjustment
      divisionalCharts: ['d1', 'd9', 'd60'],
      weightFactors: {
        planets: 0.25,
        houses: 0.30, // INCREASED: House lordship is critical for event timing
        dasha: 0.25,
        divisional: 0.20
      },
      ...config
    };
  }

  /**
   * 📊 Log progress update
   */
  private logProgress(phase: string, progress: number, total: number, message: string, details?: any) {
    const percentage = ((progress / total) * 100).toFixed(1);
    const logMessage = `📝 ${phase}: ${progress}/${total} (${percentage}%) - ${message}`;
    
    console.log(logMessage);
    
    if (this.progressCallback) {
      this.progressCallback(phase, progress, total, message, details);
    }
  }

  /**
   * 🎯 Log significant event
   */
  private logEvent(level: 'info' | 'success' | 'warning' | 'error', message: string, details?: any) {
    const icons = {
      info: 'ℹ️',
      success: '✅',
      warning: '⚠️',
      error: '❌'
    };
    
    console.log(`${icons[level]} ${message}`, details ? details : '');
  }

  /**
   * 🔄 Main BTR Process - Iterative refinement with enhanced logging
   */
  async performBTR(
    originalBirthTime: Date,
    latitude: number,
    longitude: number,
    timezone: string,
    lifeEvents: BTREvent[]
  ): Promise<BTRResult> {
    // MINIMUM EVENTS CHECK: Require at least 5 major life events for reliable rectification
    if (lifeEvents.length < 5) {
      throw new Error(`Minimum 5 major life events required for accurate birth time rectification. Provided: ${lifeEvents.length}`);
    }
    
    this.totalStartTime = Date.now();
    
    console.log('\n🌟╔══════════════════════════════════════════════════════════════╗');
    console.log('🌟║     BTR 3-PHASE ITERATION PROCESS - ENHANCED VERSION        ║');
    console.log('🌟╚══════════════════════════════════════════════════════════════╝');
    console.log(`📅 Original Time: ${originalBirthTime.toISOString()}`);
    console.log(`📍 Location: ${latitude.toFixed(4)}°N, ${longitude.toFixed(4)}°E`);
    console.log(`📋 Events: ${lifeEvents.length} life events to analyze`);
    console.log(`🎯 Convergence Target: ${this.config.convergenceThreshold}%`);
    console.log('');

    this.iterations = [];
    this.currentIteration = 0;

    let bestResult: BTRIteration;
    let converged = false;
    const phaseTimes = { phase1: 0, phase2: 0, phase3: 0 };

    // ==================== PHASE 1: COARSE SEARCH (±2 hours at 2-minute intervals) ====================
    console.log('🔍╔══════════════════════════════════════════════════════════════╗');
    console.log('🔍║              PHASE 1: COARSE SEARCH (±2 hours)              ║');
    console.log('🔍╚══════════════════════════════════════════════════════════════╝');
    console.log('🎯 Strategy: Testing 120+ time candidates at 2-minute intervals');
    console.log('🎯 Purpose: Identify promising time windows for refinement');
    console.log('');
    
    this.phaseStartTime = Date.now();
    
    const phase1Candidates: number[] = []; // in minutes
    for (let minutes = -120; minutes <= 120; minutes += 2) {
      phase1Candidates.push(minutes);
    }
    
    console.log(`🎯 Testing ${phase1Candidates.length} time candidates...`);
    console.log('');
    
    const phase1Results: BTRIteration[] = [];
    let bestScore = 0;
    let bestCandidate = 0;
    let highScoreCount = 0;
    
    for (const adjustment of phase1Candidates) {
      const iterationStartTime = Date.now();
      const testTime = new Date(originalBirthTime.getTime() + (adjustment * 60 * 1000));
      const iteration = await this.analyzeIteration(testTime, latitude, longitude, timezone, lifeEvents, adjustment);
      const iterationTime = Date.now() - iterationStartTime;
      
      phase1Results.push({ ...iteration, processingTime: iterationTime });
      
      // Track best score
      if (iteration.alignmentScore > bestScore) {
        bestScore = iteration.alignmentScore;
        bestCandidate = adjustment;
      }
      
      // Count high scores
      if (iteration.alignmentScore >= 85) {
        highScoreCount++;
      }
      
      this.currentIteration++;
      
      // Enhanced progress logging with score tracking
      if (phase1Results.length % 10 === 0) {
        this.logProgress('Phase 1', phase1Results.length, phase1Candidates.length, 
          `Current Best: ${bestScore.toFixed(1)}% at ${bestCandidate} min | High Scores: ${highScoreCount}`);
      }
      
      // Log exceptional scores immediately
      if (iteration.alignmentScore >= 90) {
        this.logEvent('success', `Exceptional score found: ${iteration.alignmentScore.toFixed(1)}% at ${adjustment} minutes`);
      } else if (iteration.alignmentScore >= 85) {
        this.logEvent('info', `High score found: ${iteration.alignmentScore.toFixed(1)}% at ${adjustment} minutes`);
      }
    }
    
    phaseTimes.phase1 = Date.now() - this.phaseStartTime;
    
    // Initialize bestResult with the best from Phase 1
    bestResult = phase1Results.reduce((best, iteration) =>
      iteration.alignmentScore > best.alignmentScore ? iteration : best
    );
    
    console.log('');
    console.log('✅╔══════════════════════════════════════════════════════════════╗');
    console.log('✅║                    PHASE 1 COMPLETE                          ║');
    console.log('✅╚══════════════════════════════════════════════════════════════╝');
    console.log(`🎯 Best Score: ${bestResult.alignmentScore.toFixed(2)}% at ${bestResult.timeShift} minutes`);
    console.log(`📊 Summary: Tested ${phase1Results.length} candidates | High Scores (≥85%): ${highScoreCount}`);
    console.log(`⏱️  Phase 1 Time: ${(phaseTimes.phase1 / 1000).toFixed(2)} seconds`);
    console.log('');
    
    // ==================== PHASE 2: MEDIUM REFINEMENT (Top 5 at 30-second intervals) ====================
    console.log('🔍╔══════════════════════════════════════════════════════════════╗');
    console.log('🔍║            PHASE 2: MEDIUM REFINEMENT (Top 5)               ║');
    console.log('🔍╚══════════════════════════════════════════════════════════════╝');
    console.log('🎯 Strategy: Refining top 5 candidates at 30-second precision');
    console.log('🎯 Purpose: Narrow down to most promising time windows');
    console.log('');
    
    this.phaseStartTime = Date.now();
    
    const top5Results = phase1Results
      .sort((a, b) => b.alignmentScore - a.alignmentScore)
      .slice(0, 5);
    
    console.log(`🎯 Selected top 5 candidates (scores: ${top5Results.map(r => r.alignmentScore.toFixed(1)).join('%, ')})%`);
    console.log('');
    
    let phase2Improvements = 0;
    let lastBestScore = bestResult.alignmentScore;
    
    for (let i = 0; i < top5Results.length; i++) {
      const topResult = top5Results[i];
      const baseAdjustment = topResult.timeShift;
      
      console.log(`🎯 Testing candidate ${i + 1}/5 (base: ${baseAdjustment} min, score: ${topResult.alignmentScore.toFixed(1)}%)`);
      
      // Test ±30 seconds around each top candidate
      for (let seconds = -30; seconds <= 30; seconds += 30) {
        const adjustment = baseAdjustment + (seconds / 60); // Convert to minutes
        const testTime = new Date(originalBirthTime.getTime() + (adjustment * 60 * 1000));
        
        const iteration = await this.analyzeIteration(testTime, latitude, longitude, timezone, lifeEvents, adjustment);
        this.iterations.push(iteration);
        
        if (iteration.alignmentScore > bestResult.alignmentScore) {
          const improvement = iteration.alignmentScore - bestResult.alignmentScore;
          bestResult = iteration;
          phase2Improvements++;
          
          console.log(`🎯 New best found: ${iteration.alignmentScore.toFixed(2)}% at ${adjustment.toFixed(1)} minutes (improved by ${improvement.toFixed(2)}%)`);
        }
        
        this.currentIteration++;
        
        // Check convergence
        if (iteration.alignmentScore >= this.config.convergenceThreshold) {
          converged = true;
          console.log(`🎉 Convergence achieved in Phase 2: ${iteration.alignmentScore.toFixed(2)}%`);
          break;
        }
      }
      
      if (converged) break;
    }
    
    phaseTimes.phase2 = Date.now() - this.phaseStartTime;
    
    console.log('');
    console.log('✅╔══════════════════════════════════════════════════════════════╗');
    console.log('✅║                    PHASE 2 COMPLETE                          ║');
    console.log('✅╚══════════════════════════════════════════════════════════════╝');
    console.log(`🎯 Final Score: ${bestResult.alignmentScore.toFixed(2)}% at ${bestResult.timeShift} minutes`);
    console.log(`📊 Summary: ${phase2Improvements} improvements found | Iterations: ${this.currentIteration}`);
    console.log(`⏱️  Phase 2 Time: ${(phaseTimes.phase2 / 1000).toFixed(2)} seconds`);
    console.log('');
    
    // ==================== PHASE 3: FINE PRECISION (Best candidate at 5-second intervals) ====================
    if (!converged) {
      console.log('🔍╔══════════════════════════════════════════════════════════════╗');
      console.log('🔍║           PHASE 3: FINE PRECISION (±15 seconds)             ║');
      console.log('🔍╚══════════════════════════════════════════════════════════════╝');
      console.log('🎯 Strategy: Fine-tuning best candidate at 5-second intervals');
      console.log('🎯 Purpose: Achieve maximum precision and alignment');
      console.log('');
      
      this.phaseStartTime = Date.now();
      
      const bestAdjustment = bestResult.timeShift;
      let phase3Improvements = 0;
      
      console.log(`🎯 Testing around best candidate: ${bestAdjustment} minutes`);
      
      // Test ±15 seconds around best candidate at 5-second intervals
      for (let seconds = -15; seconds <= 15; seconds += 5) {
        const adjustment = bestAdjustment + (seconds / 60); // Convert to minutes
        const testTime = new Date(originalBirthTime.getTime() + (adjustment * 60 * 1000));
        
        const iteration = await this.analyzeIteration(testTime, latitude, longitude, timezone, lifeEvents, adjustment);
        this.iterations.push(iteration);
        
        if (iteration.alignmentScore > bestResult.alignmentScore) {
          const improvement = iteration.alignmentScore - bestResult.alignmentScore;
          bestResult = iteration;
          phase3Improvements++;
          
          console.log(`🎯 Final precision improved: ${iteration.alignmentScore.toFixed(2)}% at ${adjustment.toFixed(2)} minutes (improved by ${improvement.toFixed(3)}%)`);
        }
        
        this.currentIteration++;
        
        // Check convergence
        if (iteration.alignmentScore >= this.config.convergenceThreshold) {
          converged = true;
          console.log(`🎉 Convergence achieved in Phase 3: ${iteration.alignmentScore.toFixed(2)}%`);
          break;
        }
      }
      
      phaseTimes.phase3 = Date.now() - this.phaseStartTime;
      
      console.log('');
      console.log('✅╔══════════════════════════════════════════════════════════════╗');
      console.log('✅║                    PHASE 3 COMPLETE                          ║');
      console.log('✅╚══════════════════════════════════════════════════════════════╝');
      console.log(`🎯 Final Score: ${bestResult.alignmentScore.toFixed(3)}% at ${bestResult.timeShift.toFixed(2)} minutes`);
      console.log(`📊 Summary: ${phase3Improvements} precision improvements`);
      console.log(`⏱️  Phase 3 Time: ${(phaseTimes.phase3 / 1000).toFixed(2)} seconds`);
      console.log('');
    }

    // Generate final result
    const finalResult = await this.generateFinalResult(originalBirthTime, bestResult, lifeEvents);
    
    const totalTime = Date.now() - this.totalStartTime;
    
    console.log('🌟╔══════════════════════════════════════════════════════════════╗');
    console.log('🌟║                  BTR PROCESS COMPLETE                        ║');
    console.log('🌟╚══════════════════════════════════════════════════════════════╝');
    console.log(`✅ Total Iterations: ${finalResult.totalIterations}`);
    console.log(`🎯 Final Alignment Score: ${finalResult.finalAlignmentScore.toFixed(3)}%`);
    console.log(`🕐 Rectified Time: ${finalResult.rectifiedTime.toISOString()}`);
    console.log(`⏱️  Time Adjustment: ${((finalResult.rectifiedTime.getTime() - originalBirthTime.getTime()) / (1000 * 60)).toFixed(2)} minutes`);
    console.log(`🎯 Confidence Level: ${finalResult.confidenceLevel.toUpperCase()}`);
    console.log(`📊 Convergence: ${converged ? '✅ Achieved' : '⚠️ Not achieved - max iterations reached'}`);
    console.log(`⏱️  Total Processing Time: ${(totalTime / 1000).toFixed(2)} seconds`);
    console.log('');
    console.log('📊 Phase Breakdown:');
    console.log(`   Phase 1 (Coarse): ${(phaseTimes.phase1 / 1000).toFixed(2)}s`);
    console.log(`   Phase 2 (Medium): ${(phaseTimes.phase2 / 1000).toFixed(2)}s`);
    console.log(`   Phase 3 (Fine):   ${(phaseTimes.phase3 / 1000).toFixed(2)}s`);
    console.log('');

    // Add performance metrics
    const enhancedResult: BTRResult = {
      ...finalResult,
      performanceMetrics: {
        totalProcessingTime: totalTime,
        averageIterationTime: totalTime / Math.max(1, finalResult.totalIterations),
        phase1Time: phaseTimes.phase1,
        phase2Time: phaseTimes.phase2,
        phase3Time: phaseTimes.phase3
      }
    };

    return enhancedResult;
  }

  /**
   * 🔍 Analyze single iteration with timing
   */
  private async analyzeIteration(
    birthTime: Date,
    latitude: number,
    longitude: number,
    timezone: string,
    lifeEvents: BTREvent[],
    timeShift: number
  ): Promise<BTRIteration> {
    
    // Calculate chart using API call to Swiss Ephemeris
    const chartDataResponse = await calculateBasicEphemeris(
      birthTime.toISOString(),
      latitude,
      longitude
    );

    if (!chartDataResponse.success || !chartDataResponse.data) {
      throw new Error(`Failed to calculate ephemeris: ${chartDataResponse.error}`);
    }

    const chartData = chartDataResponse.data;
    
    // Analyze each life event against the chart
    const eventMatches: EventMatch[] = [];
    const discrepancies: Discrepancy[] = [];

    for (const event of lifeEvents) {
      const match = this.analyzeEventMatch(event, chartData);
      eventMatches.push(match);

      if (match.matchScore < 75) { // Threshold for discrepancy
        const discrepancy = this.identifyDiscrepancy(event, match, chartData);
        if (discrepancy) discrepancies.push(discrepancy);
      }
    }

    // Calculate overall alignment score
    const alignmentScore = this.calculateAlignmentScore(eventMatches);
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(discrepancies, chartData);

    return {
      iteration: this.currentIteration,
      birthTime: new Date(birthTime),
      timeShift,
      alignmentScore,
      eventMatches,
      discrepancies,
      recommendations,
      converged: alignmentScore >= this.config.convergenceThreshold
    };
  }

  /**
   * 🎯 Analyze individual event against chart
   */
  private analyzeEventMatch(event: BTREvent, chartData: any): EventMatch {
    const factors = {
      planets: this.checkPlanetaryAlignment(event, chartData),
      houses: this.checkHouseAlignment(event, chartData),
      dasha: this.checkDashaAlignment(event, chartData),
      divisional: this.checkDivisionalAlignment(event, chartData)
    };

    const matchScore = this.calculateEventScore(factors);
    const notes = this.generateEventNotes(event, factors, chartData);

    return {
      event,
      matchScore,
      matchingFactors: factors,
      notes
    };
  }

  /**
   * 🪐 Check planetary alignments
   */
  private checkPlanetaryAlignment(event: BTREvent, chartData: any): boolean {
    const eventPlanets = event.expectedPlanets;
    const significantPlanets = this.getSignificantPlanetsForEvent(event, chartData);
    
    const matchingPlanets = eventPlanets.filter(planet => 
      significantPlanets.includes(planet)
    );
    
    return (matchingPlanets.length / eventPlanets.length) >= 0.7;
  }

  /**
   * 🏠 Check house alignments
   */
  private checkHouseAlignment(event: BTREvent, chartData: any): boolean {
    const eventHouses = event.expectedHouses;
    const activeHouses = this.getActiveHousesForEvent(event, chartData);
    
    const matchingHouses = eventHouses.filter(house => 
      activeHouses.includes(house)
    );
    
    return (matchingHouses.length / eventHouses.length) >= 0.6;
  }

  /**
   * 📅 Check dasha alignment with house lordship, aspects, and divisional charts
   */
  private checkDashaAlignment(event: BTREvent, chartData: any): boolean {
    const eventDasha = event.expectedDasha;
    const mahadashaLord = chartData.dashaPeriods.vimshottari.currentMahadasha.planet;
    const antardashaLord = chartData.dashaPeriods.vimshottari.currentAntardasha.planet;
    
    // STRICT CHECK: Impossible scenario detection
    // If marriage happened during Saturn/Mars dasha with weak 7th house = IMPOSSIBLE
    if (event.eventType === 'marriage' &&
        (mahadashaLord === 'Saturn' || mahadashaLord === 'Mars') &&
        !this.isPlanetStrongInDivisional(mahadashaLord, event.eventType, chartData)) {
      return false; // Zero score for impossible combinations
    }
    
    // If childbirth happened during Rahu/Ketu dasha with weak 5th house = IMPOSSIBLE
    if (event.eventType === 'childbirth' &&
        (mahadashaLord === 'Rahu' || mahadashaLord === 'Ketu') &&
        !this.hasHouseLordshipConnection(mahadashaLord, [5], chartData)) {
      return false; // Zero score for impossible combinations
    }
    
    // Check if dasha lord has connection to event houses
    for (const dashaPlanet of eventDasha) {
      if (dashaPlanet === mahadashaLord || dashaPlanet === antardashaLord) {
        // Check house lordship connection
        if (this.hasHouseLordshipConnection(dashaPlanet, event.expectedHouses, chartData)) {
          return true;
        }
        
        // Check planetary aspects to event houses
        if (this.hasAspectToHouses(dashaPlanet, event.expectedHouses, chartData)) {
          return true;
        }
        
        // Check divisional chart activation
        if (this.isPlanetStrongInDivisional(dashaPlanet, event.eventType, chartData)) {
          return true;
        }
      }
    }
    
    return false;
  }
  
  /**
   * 🏠 Check if planet rules or occupies event houses
   */
  private hasHouseLordshipConnection(planet: string, eventHouses: number[], chartData: any): boolean {
    // Get houses ruled by the planet
    const ruledHouses = this.getHousesRuledByPlanet(planet, chartData);
    
    // Check if planet rules any of the event houses
    for (const house of eventHouses) {
      if (ruledHouses.includes(house)) {
        return true;
      }
    }
    
    // Check if planet occupies any of the event houses
    const planetLongitude = chartData.planets[planet.toLowerCase() as keyof typeof chartData.planets]?.longitude;
    if (planetLongitude !== undefined) {
      const houseOfPlanet = this.getHouseFromLongitude(planetLongitude, chartData.houseCusps.ascendant);
      if (eventHouses.includes(houseOfPlanet)) {
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * 👁️ Check if planet aspects event houses
   */
  private hasAspectToHouses(planet: string, eventHouses: number[], chartData: any): boolean {
    const planetLongitude = chartData.planets[planet.toLowerCase() as keyof typeof chartData.planets]?.longitude;
    if (planetLongitude === undefined) return false;
    
    // Vedic aspects: all planets aspect 7th house
    // Mars aspects 4th and 8th
    // Jupiter aspects 5th and 9th
    // Saturn aspects 3rd and 10th
    
    const planetHouse = this.getHouseFromLongitude(planetLongitude, chartData.houseCusps.ascendant);
    const aspects: number[] = [7]; // All planets aspect 7th from themselves
    
    // Special aspects
    if (planet === 'Mars') {
      aspects.push(4, 8);
    } else if (planet === 'Jupiter') {
      aspects.push(5, 9);
    } else if (planet === 'Saturn') {
      aspects.push(3, 10);
    }
    
    // Check if any aspected house matches event houses
    for (const aspect of aspects) {
      const aspectedHouse = ((planetHouse + aspect - 1) % 12) + 1;
      if (eventHouses.includes(aspectedHouse)) {
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * 📊 Check if planet is strong in relevant divisional chart
   */
  private isPlanetStrongInDivisional(planet: string, eventType: string, chartData: any): boolean {
    const divisionalChartMap: Record<string, string> = {
      'marriage': 'd9',
      'childbirth': 'd7',
      'career': 'd10',
      'education': 'd24',
      'property': 'd4'
    };
    
    const chartName = divisionalChartMap[eventType];
    if (!chartName) return false;
    
    const divisionalChart = chartData.divisionalCharts[chartName as keyof typeof chartData.divisionalCharts];
    if (!divisionalChart) return false;
    
    const planetPosition = divisionalChart.planets[planet.toLowerCase()];
    if (planetPosition === undefined) return false;
    
    // Check if planet is in good dignity in divisional chart
    const signIndex = Math.floor(planetPosition / 30);
    const sign = ZODIAC_SIGNS[signIndex];
    
    // Simplified dignity check
    const planetDignities: Record<string, string[]> = {
      'Sun': ['Leo', 'Aries'],
      'Moon': ['Cancer', 'Taurus'],
      'Mars': ['Aries', 'Scorpio', 'Capricorn'],
      'Mercury': ['Gemini', 'Virgo'],
      'Jupiter': ['Sagittarius', 'Pisces', 'Cancer'],
      'Venus': ['Taurus', 'Libra', 'Pisces'],
      'Saturn': ['Capricorn', 'Aquarius', 'Libra'],
      'Rahu': ['Aquarius'],
      'Ketu': ['Scorpio']
    };
    
    const goodSigns = planetDignities[planet] || [];
    return goodSigns.includes(sign);
  }
  
  /**
   * 🏠 Get houses ruled by a planet
   */
  private getHousesRuledByPlanet(planet: string, chartData: any): number[] {
    const lagnaSignIndex = Math.floor(chartData.houseCusps.ascendant / 30);
    
    // Planet rulerships
    const rulerships: Record<string, number[]> = {
      'Sun': [5], // Leo
      'Moon': [4], // Cancer
      'Mars': [1, 8], // Aries, Scorpio
      'Mercury': [3, 6], // Gemini, Virgo
      'Jupiter': [9, 12], // Sagittarius, Pisces
      'Venus': [2, 7], // Taurus, Libra
      'Saturn': [10, 11], // Capricorn, Aquarius
      'Rahu': [],
      'Ketu': []
    };
    
    const ruledSigns = rulerships[planet] || [];
    const ruledHouses: number[] = [];
    
    for (const sign of ruledSigns) {
      const house = ((sign - 1 - lagnaSignIndex + 12) % 12) + 1;
      ruledHouses.push(house);
    }
    
    return ruledHouses;
  }
  
  /**
   * 🏠 Get house number from longitude
   */
  private getHouseFromLongitude(longitude: number, ascendant: number): number {
    const signIndex = Math.floor(longitude / 30);
    const ascendantSignIndex = Math.floor(ascendant / 30);
    return ((signIndex - ascendantSignIndex + 12) % 12) + 1;
  }

  /**
   * 📊 Check divisional chart alignment
   */
  private checkDivisionalAlignment(event: BTREvent, chartData: any): boolean {
    const priorityCharts = this.config.divisionalCharts;
    let totalScore = 0;
    let chartCount = 0;

    for (const chartName of priorityCharts) {
      const chart = (chartData.divisionalCharts as any)[chartName];
      if (!chart) continue;

      const score = this.analyzeDivisionalChartForEvent(event, chart, chartData);
      totalScore += score;
      chartCount++;
    }

    return chartCount > 0 ? (totalScore / chartCount) >= 0.6 : false;
  }

  /**
   * 🔍 Identify specific discrepancies
   */
  private identifyDiscrepancy(event: BTREvent, match: EventMatch, chartData: any): Discrepancy | null {
    const issues: string[] = [];
    
    if (!match.matchingFactors.planets) {
      issues.push(`Expected planets ${event.expectedPlanets.join(', ')} not prominent`);
    }
    
    if (!match.matchingFactors.houses) {
      issues.push(`Expected houses ${event.expectedHouses.join(', ')} not active`);
    }
    
    if (!match.matchingFactors.dasha) {
      const currentDasha = chartData.dashaPeriods.vimshottari.currentMahadasha.planet;
      issues.push(`Expected dasha ${event.expectedDasha.join(', ')} but found ${currentDasha}`);
    }

    if (issues.length === 0) return null;

    // Calculate suggested adjustment based on discrepancy type
    const suggestedAdjustment = this.calculateTimeAdjustment(event, issues);

    return {
      event,
      expected: `Planets: ${event.expectedPlanets.join(', ')}, Houses: ${event.expectedHouses.join(', ')}, Dasha: ${event.expectedDasha.join(', ')}`,
      actual: match.notes.join('; '),
      severity: this.calculateSeverity(event.weight, issues.length),
      suggestedAdjustment
    };
  }

  /**
   * ⏰ Generate time hypotheses based on discrepancies
   */
  private generateTimeHypotheses(discrepancies: Discrepancy[]): number[] {
    if (discrepancies.length === 0) {
      return [this.config.timeStep, -this.config.timeStep];
    }

    const adjustments: number[] = [];
    
    // Sort by severity
    const sortedDiscrepancies = discrepancies.sort((a, b) => {
      const severityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    });

    // Take top 3 discrepancies
    const topDiscrepancies = sortedDiscrepancies.slice(0, 3);

    for (const discrepancy of topDiscrepancies) {
      adjustments.push(discrepancy.suggestedAdjustment);
      
      // Add smaller adjustments around the suggested one
      adjustments.push(discrepancy.suggestedAdjustment * 0.5);
      adjustments.push(discrepancy.suggestedAdjustment * 1.5);
      adjustments.push(discrepancy.suggestedAdjustment * 2);
    }

    // Add some random small adjustments for exploration
    adjustments.push(this.config.timeStep * 0.5);
    adjustments.push(-this.config.timeStep * 0.5);
    adjustments.push(this.config.timeStep * 2);
    adjustments.push(-this.config.timeStep * 2);

    return [...new Set(adjustments)]; // Remove duplicates
  }

  /**
   * 📊 Calculate alignment score
   */
  private calculateAlignmentScore(eventMatches: EventMatch[]): number {
    if (eventMatches.length === 0) return 0;

    const totalScore = eventMatches.reduce((sum, match) => sum + match.matchScore, 0);
    const weightedScore = eventMatches.reduce((sum, match) => 
      sum + (match.matchScore * match.event.weight), 0
    );
    
    const totalWeight = eventMatches.reduce((sum, match) => sum + match.event.weight, 0);
    
    return totalWeight > 0 ? (weightedScore / totalWeight) : (totalScore / eventMatches.length);
  }

  /**
   * 🧮 Calculate event score
   */
  private calculateEventScore(factors: EventMatch['matchingFactors']): number {
    const weights = this.config.weightFactors;
    
    let score = 0;
    if (factors.planets) score += weights.planets * 100;
    if (factors.houses) score += weights.houses * 100;
    if (factors.dasha) score += weights.dasha * 100;
    if (factors.divisional) score += weights.divisional * 100;
    
    return score;
  }

  /**
   * 🪐 Get significant planets for event type
   */
  private getSignificantPlanetsForEvent(event: BTREvent, chartData: any): string[] {
    const eventTypePlanets: Record<string, string[]> = {
      'marriage': ['venus', 'jupiter', 'mars', 'moon'],
      'childbirth': ['jupiter', 'mars', 'moon', 'venus'],
      'career': ['sun', 'jupiter', 'mercury', 'saturn'],
      'education': ['mercury', 'jupiter', 'moon'],
      'health': ['sun', 'moon', 'mars', 'saturn'],
      'travel': ['mercury', 'moon', 'rahu', 'ketu'],
      'property': ['mars', 'saturn', 'venus'],
      'loss': ['saturn', 'rahu', 'ketu']
    };

    const basePlanets = eventTypePlanets[event.eventType] || [];
    
    // Add planets based on current transits and positions
    const currentPlanets = Object.keys(chartData.planets);
    const prominentPlanets = currentPlanets.filter(planet => {
      const planetData = (chartData.planets as any)[planet];
      return planetData.longitude >= 0 && planetData.longitude <= 30; // First house prominence
    });

    return [...new Set([...basePlanets, ...prominentPlanets])];
  }

  /**
   * 🏠 Get active houses for event
   */
  private getActiveHousesForEvent(event: BTREvent, chartData: any): number[] {
    const eventTypeHouses: Record<string, number[]> = {
      'marriage': [7, 2, 11, 5],
      'childbirth': [5, 9, 11, 2],
      'career': [10, 6, 2, 11],
      'education': [4, 5, 9, 2],
      'health': [1, 6, 8, 12],
      'travel': [3, 9, 12, 7],
      'property': [4, 11, 2, 12],
      'loss': [8, 12, 6, 2]
    };

    return eventTypeHouses[event.eventType] || [];
  }

  /**
   * 📊 Analyze divisional chart for event
   */
  private analyzeDivisionalChartForEvent(event: BTREvent, chart: any, mainChart: any): number {
    let score = 0;
    const factors = 4;

    // Check lagna placement
    if (chart.lagnaSign && this.isBeneficialSign(chart.lagnaSign, event.eventType)) {
      score += 25;
    }

    // Check key planets in divisional chart
    const significantPlanets = this.getSignificantPlanetsForEvent(event, mainChart);
    const beneficialPlanets = significantPlanets.filter(planet => 
      chart.planetSigns[planet] && this.isBeneficialSign(chart.planetSigns[planet], event.eventType)
    );
    
    score += (beneficialPlanets.length / significantPlanets.length) * 25;

    // Check for malefic influences
    const maleficPlanets = ['saturn', 'mars', 'rahu', 'ketu'];
    const maleficInKeyPositions = maleficPlanets.filter(planet => 
      chart.planetDegrees[planet] && chart.planetDegrees[planet] <= 5 // Within first 5 degrees
    );
    
    score -= (maleficInKeyPositions.length * 10);

    return Math.max(0, Math.min(100, score));
  }

  /**
   * ✅ Check if sign is beneficial for event type
   */
  private isBeneficialSign(sign: string, eventType: string): boolean {
    const beneficialSigns: Record<string, string[]> = {
      'marriage': ['taurus', 'libra', 'cancer', 'pisces'],
      'childbirth': ['cancer', 'scorpio', 'pisces', 'sagittarius'],
      'career': ['leo', 'capricorn', 'virgo', 'gemini'],
      'education': ['gemini', 'virgo', 'sagittarius', 'pisces'],
      'health': ['leo', 'cancer', 'virgo', 'scorpio'],
      'travel': ['gemini', 'sagittarius', 'pisces', 'aquarius'],
      'property': ['taurus', 'cancer', 'capricorn', 'scorpio'],
      'loss': ['scorpio', 'capricorn', 'aquarius'] // Signs that can handle loss
    };

    const goodSigns = beneficialSigns[eventType] || [];
    return goodSigns.includes(sign.toLowerCase());
  }

  /**
   * ⏱️ Calculate time adjustment based on discrepancy
   */
  private calculateTimeAdjustment(event: BTREvent, issues: string[]): number {
    // Base adjustment on event type and severity
    const baseAdjustment = event.weight * 2; // 2-20 minutes based on weight
    
    // Modify based on issues
    const issueMultiplier = issues.length;
    
    // Direction based on event type and expected vs actual
    let direction = 1; // Positive = later birth time
    
    if (issues.some(issue => issue.includes('dasha'))) {
      direction = -1; // Earlier birth time for dasha issues
    }
    
    if (issues.some(issue => issue.includes('planets'))) {
      direction = issues.some(issue => issue.includes('not prominent')) ? 1 : -1;
    }

    return direction * baseAdjustment * issueMultiplier;
  }

  /**
   * 📊 Calculate severity
   */
  private calculateSeverity(weight: number, issueCount: number): 'low' | 'medium' | 'high' {
    const severityScore = weight * issueCount;
    
    if (severityScore >= 20) return 'high';
    if (severityScore >= 10) return 'medium';
    return 'low';
  }

  /**
   * 📝 Generate event notes
   */
  private generateEventNotes(event: BTREvent, factors: EventMatch['matchingFactors'], chartData: any): string[] {
    const notes: string[] = [];

    if (factors.planets) {
      notes.push(`Matching planets: ${event.expectedPlanets.join(', ')}`);
    } else {
      const actualPlanets = this.getSignificantPlanetsForEvent(event, chartData);
      notes.push(`Expected: ${event.expectedPlanets.join(', ')}, Found: ${actualPlanets.join(', ')}`);
    }

    if (factors.houses) {
      notes.push(`Matching houses: ${event.expectedHouses.join(', ')}`);
    } else {
      const actualHouses = this.getActiveHousesForEvent(event, chartData);
      notes.push(`Expected: ${event.expectedHouses.join(', ')}, Found: ${actualHouses.join(', ')}`);
    }

    if (factors.dasha) {
      notes.push(`Matching dasha: ${event.expectedDasha.join(', ')}`);
    } else {
      const currentDasha = chartData.dashaPeriods.vimshottari.currentMahadasha.planet;
      notes.push(`Expected: ${event.expectedDasha.join(', ')}, Current: ${currentDasha}`);
    }

    return notes;
  }

  /**
   * 💡 Generate recommendations
   */
  private generateRecommendations(discrepancies: Discrepancy[], chartData: any): string[] {
    const recommendations: string[] = [];

    if (discrepancies.length === 0) {
      recommendations.push('Chart shows good alignment with life events');
      return recommendations;
    }

    // Sort by severity
    const highSeverity = discrepancies.filter(d => d.severity === 'high');
    const mediumSeverity = discrepancies.filter(d => d.severity === 'medium');

    if (highSeverity.length > 0) {
      recommendations.push(`Address high-severity discrepancies: ${highSeverity.map(d => d.event.eventType).join(', ')}`);
      recommendations.push(`Consider time adjustment of ${highSeverity[0].suggestedAdjustment} minutes`);
    }

    if (mediumSeverity.length > 0) {
      recommendations.push(`Review medium-severity issues: ${mediumSeverity.map(d => d.event.eventType).join(', ')}`);
    }

    // Chart-specific recommendations
    const retrogradePlanets = chartData.retrogradePlanets;
    if (retrogradePlanets.length > 2) {
      recommendations.push('Multiple retrograde planets suggest karmic adjustments needed');
    }

    const currentDasha = chartData.dashaPeriods.vimshottari.currentMahadasha.planet;
    if (['saturn', 'rahu', 'ketu'].includes(currentDasha.toLowerCase())) {
      recommendations.push('Current karmic dasha period may affect timing accuracy');
    }

    return recommendations;
  }

  /**
   * 🎯 Generate final result
   */
  private async generateFinalResult(
    originalTime: Date,
    bestIteration: BTRIteration,
    lifeEvents: BTREvent[]
  ): Promise<BTRResult> {
    
    // Calculate confidence level
    const confidenceLevel = this.calculateConfidenceLevel(bestIteration.alignmentScore, this.iterations.length);
    
    // Generate alternative times
    const alternativeTimes = this.generateAlternativeTimes();

    // Final chart calculation using API
    const finalChartDataResponse = await calculateBasicEphemeris(
      bestIteration.birthTime.toISOString(),
      28.6139, // These should be passed as parameters
      77.2090
    );

    if (!finalChartDataResponse.success || !finalChartDataResponse.data) {
      throw new Error(`Failed to calculate final ephemeris: ${finalChartDataResponse.error}`);
    }

    return {
      originalTime,
      rectifiedTime: bestIteration.birthTime,
      totalIterations: this.iterations.length,
      finalAlignmentScore: bestIteration.alignmentScore,
      eventMatches: bestIteration.eventMatches,
      convergenceReason: this.getConvergenceReason(bestIteration),
      confidenceLevel,
      chartData: finalChartDataResponse.data,
      alternativeTimes
    };
  }

  /**
   * 🎯 Calculate confidence level
   */
  private calculateConfidenceLevel(alignmentScore: number, iterations: number): 'low' | 'medium' | 'high' | 'very_high' {
    if (alignmentScore >= 95 && iterations <= 20) return 'very_high';
    if (alignmentScore >= 90 && iterations <= 30) return 'high';
    if (alignmentScore >= 85 && iterations <= 40) return 'medium';
    return 'low';
  }

  /**
   * 🔄 Generate alternative times for consideration
   */
  private generateAlternativeTimes(): AlternativeTime[] {
    const alternatives: AlternativeTime[] = [];
    
    // Get top 3 iterations as alternatives
    const topIterations = this.iterations
      .sort((a, b) => b.alignmentScore - a.alignmentScore)
      .slice(0, 3);

    for (const iteration of topIterations) {
      alternatives.push({
        time: iteration.birthTime,
        score: iteration.alignmentScore,
        reason: `Iteration ${iteration.iteration}: ${iteration.alignmentScore.toFixed(1)}% alignment`
      });
    }

    return alternatives;
  }

  /**
   * 📋 Get convergence reason
   */
  private getConvergenceReason(iteration: BTRIteration): string {
    if (iteration.alignmentScore >= this.config.convergenceThreshold) {
      return `Achieved ${iteration.alignmentScore.toFixed(1)}% alignment with life events`;
    }
    
    if (this.currentIteration >= this.config.maxIterations) {
      return `Reached maximum iterations (${this.config.maxIterations})`;
    }
    
    return 'Optimization process completed';
  }

  /**
   * 📊 Get iteration history
   */
  getIterationHistory(): BTRIteration[] {
    return [...this.iterations];
  }

  /**
   * 📈 Get convergence progress
   */
  getConvergenceProgress(): { iteration: number; score: number; timeShift: number }[] {
    return this.iterations.map(iteration => ({
      iteration: iteration.iteration,
      score: iteration.alignmentScore,
      timeShift: iteration.timeShift
    }));
  }
}

/**
 * 🏭 Factory function to create Enhanced BTR Engine
 */
export function createBTREngineEnhanced(
  config?: Partial<BTRConfig>,
  progressCallback?: ProgressCallback
): BTREngineEnhanced {
  return new BTREngineEnhanced(config, progressCallback);
}
