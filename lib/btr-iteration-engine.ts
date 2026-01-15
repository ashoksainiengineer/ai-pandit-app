import { calculateBasicEphemeris } from './api-client';
import {
  BTREvent,
  BTRResult,
  EventMatch,
  Discrepancy,
  AlternativeTime,
  EphemerisResponse
} from './types';

const ZODIAC_SIGNS = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
];

interface BTRIteration {
    iteration: number;
    birthTime: Date;
    timeShift: number;
    alignmentScore: number;
    eventMatches: EventMatch[];
    discrepancies: Discrepancy[];
    recommendations: string[];
    converged: boolean;
}

export interface BTRConfig {
    maxIterations: number;
    convergenceThreshold: number;
    timeStep: number;
    maxTimeShift: number;
    divisionalCharts: string[];
    weightFactors: { [key: string]: number };
}

export class BTREngine {
  private config: BTRConfig;
  private iterations: BTRIteration[] = [];
  private currentIteration = 0;

  constructor(config?: Partial<BTRConfig>) {
    this.config = {
      maxIterations: 50,
      convergenceThreshold: 90,
      timeStep: 4,
      maxTimeShift: 120,
      divisionalCharts: ['d1', 'd9', 'd60'],
      weightFactors: { planets: 0.25, houses: 0.3, dasha: 0.25, divisional: 0.2 },
      ...config
    };
  }

  async performBTR(
    originalBirthTime: Date,
    latitude: number,
    longitude: number,
    timezone: string,
    lifeEvents: BTREvent[]
  ): Promise<BTRResult> {
    if (lifeEvents.length < 5) {
      throw new Error(`Minimum 5 major life events required. Provided: ${lifeEvents.length}`);
    }
    
    this.iterations = [];
    this.currentIteration = 0;

    const phase1Candidates = this.generateCandidates(-120, 120, 2);
    const phase1Results = await this.runPhase(phase1Candidates, originalBirthTime, latitude, longitude, timezone, lifeEvents, "Phase 1");
    let bestResult = this.getBestIteration(phase1Results);

    const top5Results = phase1Results.sort((a, b) => b.alignmentScore - a.alignmentScore).slice(0, 5);
    const phase2Candidates = top5Results.flatMap(top => this.generateCandidates(top.timeShift - 1, top.timeShift + 1, 0.5));
    const phase2Results = await this.runPhase(phase2Candidates, originalBirthTime, latitude, longitude, timezone, lifeEvents, "Phase 2");
    bestResult = this.getBestIteration([...phase1Results, ...phase2Results]);

    if (bestResult && bestResult.alignmentScore < this.config.convergenceThreshold) {
        const phase3Candidates = this.generateCandidates(bestResult.timeShift - 0.5, bestResult.timeShift + 0.5, 1/12);
        const phase3Results = await this.runPhase(phase3Candidates, originalBirthTime, latitude, longitude, timezone, lifeEvents, "Phase 3");
        bestResult = this.getBestIteration([...phase2Results, ...phase3Results]);
    }
    
    if (!bestResult) throw new Error("BTR process failed.");

    const finalResult = await this.generateFinalResult(originalBirthTime, bestResult, latitude, longitude);
    return finalResult;
  }

  private generateCandidates = (start: number, end: number, step: number): number[] => Array.from({length: ((end - start) / step) + 1}, (_, i) => start + i * step);

  private async runPhase(candidates: number[], originalBirthTime: Date, latitude: number, longitude: number, timezone: string, lifeEvents: BTREvent[], phaseName: string): Promise<BTRIteration[]> {
    const results: BTRIteration[] = [];
    for (const adjustment of candidates) {
        const testTime = new Date(originalBirthTime.getTime() + adjustment * 60000);
        const iteration = await this.analyzeIteration(testTime, latitude, longitude, timezone, lifeEvents, adjustment);
        results.push(iteration);
        this.iterations.push(iteration);
    }
    return results;
  }

  private getBestIteration = (iterations: BTRIteration[]): BTRIteration | undefined => iterations.reduce((best, current) => (!best || current.alignmentScore > best.alignmentScore) ? current : best, undefined as BTRIteration | undefined);

  private async analyzeIteration(birthTime: Date, latitude: number, longitude: number, timezone: string, lifeEvents: BTREvent[], timeShift: number): Promise<BTRIteration> {
    const chartDataResponse: EphemerisResponse = await calculateBasicEphemeris(birthTime.toISOString(), latitude, longitude);
    if (!chartDataResponse.success || !chartDataResponse.data) throw new Error(`Failed to calculate ephemeris: ${chartDataResponse.error}`);

    const chartData = chartDataResponse.data;
    const eventMatches = lifeEvents.map(event => this.analyzeEventMatch(event, chartData));
    const discrepancies = eventMatches.filter(match => match.matchScore < 75).map(match => this.identifyDiscrepancy(match.event, match, chartData)).filter(d => d) as Discrepancy[];
    const alignmentScore = this.calculateAlignmentScore(eventMatches);

    return {
      iteration: ++this.currentIteration,
      birthTime,
      timeShift,
      alignmentScore,
      eventMatches,
      discrepancies,
      recommendations: this.generateRecommendations(discrepancies),
      converged: alignmentScore >= this.config.convergenceThreshold
    };
  }

  private analyzeEventMatch(event: BTREvent, chartData: any): EventMatch {
    const factors = { planets: false, houses: false, dasha: false, divisional: false };
    const matchScore = this.calculateEventScore(factors);
    return { event, matchScore, matchingFactors: factors, notes: [] };
  }

  private identifyDiscrepancy(event: BTREvent, match: EventMatch, chartData: any): Discrepancy | null {
    return { event, expected: `Details for ${event.eventType}`, actual: match.notes.join('; '), severity: 'low', suggestedAdjustment: 0 };
  }

  private calculateAlignmentScore = (matches: EventMatch[]): number => matches.length ? matches.reduce((sum, match) => sum + (match.matchScore * match.event.weight), 0) / matches.reduce((sum, match) => sum + match.event.weight, 0) : 0;

  private calculateEventScore = (factors: { [key: string]: boolean }): number => Object.entries(factors).reduce((score, [key, value]) => score + (value ? (this.config.weightFactors[key] || 0) * 100 : 0), 0);
  
  private generateRecommendations = (discrepancies: Discrepancy[]): string[] => discrepancies.slice(0, 2).map(d => `Consider adjustment for ${d.event.eventType}`);

  private async generateFinalResult(originalTime: Date, bestIteration: BTRIteration, latitude: number, longitude: number): Promise<BTRResult> {
    const finalChartDataResponse = await calculateBasicEphemeris(bestIteration.birthTime.toISOString(), latitude, longitude);
    if (!finalChartDataResponse.success || !finalChartDataResponse.data) throw new Error(`Failed to calculate final ephemeris: ${finalChartDataResponse.error}`);

    return {
      originalTime,
      rectifiedTime: bestIteration.birthTime,
      totalIterations: this.iterations.length,
      finalAlignmentScore: bestIteration.alignmentScore,
      eventMatches: bestIteration.eventMatches,
      convergenceReason: bestIteration.converged ? `Converged at ${bestIteration.alignmentScore.toFixed(1)}%` : `Max iterations reached`,
      confidenceLevel: this.calculateConfidenceLevel(bestIteration.alignmentScore),
      chartData: finalChartDataResponse.data,
      alternativeTimes: this.generateAlternativeTimes()
    };
  }

  private calculateConfidenceLevel = (score: number): 'low' | 'medium' | 'high' | 'very_high' => (score >= 95) ? 'very_high' : (score >= 90) ? 'high' : (score >= 85) ? 'medium' : 'low';

  private generateAlternativeTimes = (): AlternativeTime[] => this.iterations.sort((a,b) => b.alignmentScore - a.alignmentScore).slice(0, 3).map(iter => ({ time: iter.birthTime, score: iter.alignmentScore, reason: `Alignment: ${iter.alignmentScore.toFixed(1)}%` }));
  
  getIterationHistory = (): BTRIteration[] => this.iterations;
}

export const createBTREngine = (config?: Partial<BTRConfig>): BTREngine => new BTREngine(config);