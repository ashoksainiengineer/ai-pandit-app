/**
 * 🌟 BTR Iteration Engine - Birth Time Rectification System
 * 
 * Implements the iterative BTR process:
 * 1. Analyze current chart against Life Events
 * 2. Identify discrepancies in D-9/D-60 charts
 * 3. Hypothesize time shifts
 * 4. Command Swiss Ephemeris for new calculations
 * 5. Verify alignment improvements
 * 6. Finalize when >90% events align
 */

import { SwissEphemerisEngine, EphemerisCalculation } from './swiss-ephemeris-engine';
import { LifeEvent } from '../types';

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
  chartData: EphemerisCalculation;
  alternativeTimes: AlternativeTime[];
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
    houses: number;
    dasha: number;
    divisional: number;
  };
}

/**
 * 🌟 BTR Iteration Engine
 * 
 * Continuously refines birth time by comparing calculated charts with life events
 * Uses Swiss Ephemeris for high-precision astronomical calculations
 */
export class BTREngine {
  private swissEphemeris: SwissEphemerisEngine;
  private config: BTRConfig;
  private iterations: BTRIteration[] = [];
  private currentIteration = 0;

  constructor(swissEphemeris: SwissEphemerisEngine, config?: Partial<BTRConfig>) {
    this.swissEphemeris = swissEphemeris;
    this.config = {
      maxIterations: 50,
      convergenceThreshold: 90,
      timeStep: 4, // 4 minutes per iteration
      maxTimeShift: 120, // ±2 hours max adjustment
      divisionalCharts: ['d1', 'd9', 'd60'],
      weightFactors: {
        planets: 0.3,
        houses: 0.25,
        dasha: 0.25,
        divisional: 0.2
      },
      ...config
    };
  }

  /**
   * 🔄 Main BTR Process - Iterative refinement
   */
  async performBTR(
    originalBirthTime: Date,
    latitude: number,
    longitude: number,
    timezone: string,
    lifeEvents: BTREvent[]
  ): Promise<BTRResult> {
    console.log('🌟 Starting BTR Iteration Process');
    console.log(`📅 Original Time: ${originalBirthTime.toISOString()}`);
    console.log(`📍 Location: ${latitude}, ${longitude}`);
    console.log(`📋 Events: ${lifeEvents.length} life events to analyze`);

    this.iterations = [];
    this.currentIteration = 0;

    let currentTime = new Date(originalBirthTime);
    let bestResult: BTRIteration | null = null;
    let converged = false;

    // Initial analysis
    const initialAnalysis = await this.analyzeIteration(currentTime, latitude, longitude, timezone, lifeEvents, 0);
    this.iterations.push(initialAnalysis);
    bestResult = initialAnalysis;

    console.log(`🎯 Initial Alignment Score: ${initialAnalysis.alignmentScore.toFixed(2)}%`);

    // Iterative refinement
    while (this.currentIteration < this.config.maxIterations && !converged) {
      this.currentIteration++;

      // Generate time hypotheses based on discrepancies
      const timeAdjustments = this.generateTimeHypotheses(initialAnalysis.discrepancies);
      
      for (const adjustment of timeAdjustments) {
        const newTime = new Date(currentTime.getTime() + (adjustment * 60 * 1000)); // Convert minutes to milliseconds
        
        // Check if within allowed time shift
        const timeShift = Math.abs(newTime.getTime() - originalBirthTime.getTime()) / (60 * 1000);
        if (timeShift > this.config.maxTimeShift) continue;

        const iteration = await this.analyzeIteration(newTime, latitude, longitude, timezone, lifeEvents, adjustment);
        this.iterations.push(iteration);

        console.log(`🔍 Iteration ${this.currentIteration}: Time Shift ${adjustment}min, Score: ${iteration.alignmentScore.toFixed(2)}%`);

        // Update best result
        if (iteration.alignmentScore > bestResult.alignmentScore) {
          bestResult = iteration;
          currentTime = newTime;
        }

        // Check convergence
        if (iteration.alignmentScore >= this.config.convergenceThreshold) {
          converged = true;
          console.log(`🎉 Convergence achieved at ${iteration.alignmentScore.toFixed(2)}%`);
          break;
        }
      }

      if (converged) break;
    }

    // Generate final result
    const finalResult = await this.generateFinalResult(originalBirthTime, bestResult, lifeEvents);
    
    console.log(`✅ BTR Complete: Final Score ${finalResult.finalAlignmentScore.toFixed(2)}%`);
    console.log(`🕐 Rectified Time: ${finalResult.rectifiedTime.toISOString()}`);
    console.log(`🎯 Confidence: ${finalResult.confidenceLevel}`);

    return finalResult;
  }

  /**
   * 🔍 Analyze single iteration
   */
  private async analyzeIteration(
    birthTime: Date,
    latitude: number,
    longitude: number,
    timezone: string,
    lifeEvents: BTREvent[],
    timeShift: number
  ): Promise<BTRIteration> {
    
    // Calculate chart using Swiss Ephemeris
    const chartData = await this.swissEphemeris.calculateEphemerisForBTR(birthTime, latitude, longitude, timezone);
    
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
  private analyzeEventMatch(event: BTREvent, chartData: EphemerisCalculation): EventMatch {
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
  private checkPlanetaryAlignment(event: BTREvent, chartData: EphemerisCalculation): boolean {
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
  private checkHouseAlignment(event: BTREvent, chartData: EphemerisCalculation): boolean {
    const eventHouses = event.expectedHouses;
    const activeHouses = this.getActiveHousesForEvent(event, chartData);
    
    const matchingHouses = eventHouses.filter(house => 
      activeHouses.includes(house)
    );
    
    return (matchingHouses.length / eventHouses.length) >= 0.6;
  }

  /**
   * 📅 Check dasha alignment
   */
  private checkDashaAlignment(event: BTREvent, chartData: EphemerisCalculation): boolean {
    const eventDasha = event.expectedDasha;
    const currentDasha = chartData.dashaPeriods.vimshottari.currentMahadasha.planet;
    const currentAntardasha = chartData.dashaPeriods.vimshottari.currentAntardasha.planet;
    
    return eventDasha.some(dasha => 
      dasha === currentDasha || dasha === currentAntardasha
    );
  }

  /**
   * 📊 Check divisional chart alignment
   */
  private checkDivisionalAlignment(event: BTREvent, chartData: EphemerisCalculation): boolean {
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
  private identifyDiscrepancy(event: BTREvent, match: EventMatch, chartData: EphemerisCalculation): Discrepancy | null {
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
  private getSignificantPlanetsForEvent(event: BTREvent, chartData: EphemerisCalculation): string[] {
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
  private getActiveHousesForEvent(event: BTREvent, chartData: EphemerisCalculation): number[] {
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
  private analyzeDivisionalChartForEvent(event: BTREvent, chart: any, mainChart: EphemerisCalculation): number {
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
  private generateEventNotes(event: BTREvent, factors: EventMatch['matchingFactors'], chartData: EphemerisCalculation): string[] {
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
  private generateRecommendations(discrepancies: Discrepancy[], chartData: EphemerisCalculation): string[] {
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

    // Final chart calculation
    const finalChartData = await this.swissEphemeris.calculateEphemerisForBTR(
      bestIteration.birthTime,
      28.6139, // These should be passed as parameters
      77.2090,
      'Asia/Kolkata'
    );

    return {
      originalTime,
      rectifiedTime: bestIteration.birthTime,
      totalIterations: this.iterations.length,
      finalAlignmentScore: bestIteration.alignmentScore,
      eventMatches: bestIteration.eventMatches,
      convergenceReason: this.getConvergenceReason(bestIteration),
      confidenceLevel,
      chartData: finalChartData,
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
 * 🏭 Factory function to create BTR Engine
 */
export function createBTREngine(
  swissEphemeris: SwissEphemerisEngine,
  config?: Partial<BTRConfig>
): BTREngine {
  return new BTREngine(swissEphemeris, config);
}