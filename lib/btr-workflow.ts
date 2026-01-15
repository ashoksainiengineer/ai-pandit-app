import { performBTRAnalysis as apiPerformBTRAnalysis, calculateBasicEphemeris } from './api-client';
import { createMoonshootAIClient, MoonshootAIClient } from './moonshoot-ai-client';
import {
  BTRWorkflowRequest,
  BTRWorkflowResponse,
  BTRAnalysisResponse,
  EphemerisResponse,
  BTREvent,
  BTRResult,
  AIAnalysisRequest,
  AIAnalysisResponse,
  MoonshootAIConfig,
  LifeEvent
} from './types';

export interface BTRWorkflowConfig {
    moonshotApiKey: string;
    ephemerisPath?: string;
    useKPSystem?: boolean;
    maxIterations?: number;
    convergenceThreshold?: number;
}

export class BTRWorkflow {
  private moonshotAI: MoonshootAIClient;
  private config: BTRWorkflowConfig;

  constructor(config: BTRWorkflowConfig) {
    this.config = config;
    const moonshootConfig: MoonshootAIConfig = { apiKey: config.moonshotApiKey, maxRetries: 3, timeout: 45000, temperature: 0.3, maxTokens: 4000 };
    this.moonshotAI = createMoonshootAIClient(moonshootConfig);
  }

  async execute(request: BTRWorkflowRequest): Promise<BTRWorkflowResponse> {
    try {
      const btrEvents: BTREvent[] = this.convertToBTREvents(request.lifeEvents);
      const baseDateTime = new Date(`${request.birthDetails.date}T${request.birthDetails.time}`);
      
      const btrResult: BTRAnalysisResponse = await apiPerformBTRAnalysis({
        birthData: { date: baseDateTime.toISOString(), latitude: request.birthDetails.latitude, longitude: request.birthDetails.longitude, timezone: request.birthDetails.timezone },
        lifeEvents: btrEvents.map(e => ({ date: e.date.toISOString(), type: e.eventType, description: e.description })),
        uncertaintyMinutes: 120,
        slotInterval: 15,
      });

      if (!btrResult.success || !btrResult.data) throw new Error(`BTR API analysis failed: ${btrResult.error}`);

      const finalEphemeris: EphemerisResponse = await calculateBasicEphemeris(btrResult.data.rectifiedTime.toISOString(), request.birthDetails.latitude, request.birthDetails.longitude);
      if (!finalEphemeris.success || !finalEphemeris.data) throw new Error(`Final ephemeris calculation failed: ${finalEphemeris.error}`);

      const aiRequest: AIAnalysisRequest = this.prepareAIRequest(request, finalEphemeris.data, btrResult.data);
      const aiResponse: AIAnalysisResponse = await this.moonshotAI.analyzeBirthTime(aiRequest);

      return this.combineResults(request, btrResult.data, finalEphemeris.data, aiResponse);
    } catch (error) {
      console.error('❌ BTR Workflow failed:', error);
      throw new Error(`BTR Workflow execution failed: ${error}`);
    }
  }

  private convertToBTREvents(lifeEvents: LifeEvent[]): BTREvent[] {
    return lifeEvents.map((event): BTREvent => {
        const { planets, houses, dasha } = this.getExpectedAstrologicalData(event.eventType, event.category);
        return {
            eventType: event.category as BTREvent['eventType'],
            date: new Date(event.eventDate),
            description: event.description,
            expectedPlanets: planets,
            expectedHouses: houses,
            expectedDasha: dasha,
            weight: this.calculateEventWeight(event.category, event.description)
        };
    });
  }

  private getExpectedAstrologicalData(eventType: string, category: string): { planets: string[], houses: number[], dasha: string[] } {
    const patterns: { [key: string]: { p: string[], h: number[], d: string[] } } = { marriage: { p: ['venus', 'jupiter'], h: [7, 2], d: ['Venus'] }, childbirth: { p: ['jupiter', 'mars'], h: [5, 9], d: ['Jupiter'] }, career: { p: ['sun', 'mercury'], h: [10, 6], d: ['Sun'] } };
    const specific = patterns[eventType] || patterns[category];
    return { planets: specific?.p || ['jupiter'], houses: specific?.h || [9], dasha: specific?.d || ['Jupiter'] };
  }

  private calculateEventWeight = (category: string, description: string): number => (({ marriage: 10, childbirth: 9, career: 8 }[category]) || 5) + ((description.includes('first') || description.includes('major')) ? 1 : 0);

  private prepareAIRequest(request: BTRWorkflowRequest, ephemerisData: any, btrResult: BTRResult): AIAnalysisRequest {
    return {
      userData: { ...request },
      ephemerisData: { timeSlots: ephemerisData ? [ephemerisData] : [] },
      dashaData: ephemerisData?.dashaPeriods || {},
      timeSlots: [{ time: btrResult.rectifiedTime.toISOString(), score: btrResult.finalAlignmentScore, planetaryPositions: ephemerisData?.planets || {} }]
    };
  }

  private combineResults(request: BTRWorkflowRequest, btrResult: BTRResult, finalEphemeris: any, aiResponse: AIAnalysisResponse): BTRWorkflowResponse {
    const timeAdjustment = (new Date(btrResult.rectifiedTime).getTime() - new Date(`${request.birthDetails.date}T${request.birthDetails.time}`).getTime()) / 60000;
    const confidenceCategory = (l: number): 'low' | 'medium' | 'high' | 'very_high' => (l >= 90) ? 'very_high' : (l >= 80) ? 'high' : (l >= 70) ? 'medium' : 'low';

    return {
      originalBirthTime: `${request.birthDetails.date} ${request.birthDetails.time}`,
      rectifiedBirthTime: btrResult.rectifiedTime.toISOString(),
      confidenceLevel: aiResponse.confidenceLevel,
      confidenceCategory: confidenceCategory(aiResponse.confidenceLevel),
      alignmentScore: btrResult.finalAlignmentScore,
      totalIterations: btrResult.totalIterations,
      aiAnalysis: {
          executiveSummary: aiResponse.analysis?.physicalTraitsMatch || 'Complete',
          keyFindings: aiResponse.keyFindings || [],
          personalityInsights: aiResponse.personalityInsights || '',
          futurePredictions: aiResponse.futurePredictions || ''
      },
      eventMatches: btrResult.eventMatches.map(m => ({ event: m.event.description, date: m.event.date.toISOString().substring(0,10), matchScore: m.matchScore, matchQuality: m.matchScore > 80 ? 'Strong' : 'Weak'})),
      alternativeTimes: btrResult.alternativeTimes.map(a => ({ ...a, time: a.time.toISOString() })),
      chartData: { ...finalEphemeris },
      technicalDetails: {
        convergenceReason: btrResult.convergenceReason,
        iterationsPerformed: btrResult.totalIterations,
        timeAdjustmentMinutes: Math.round(timeAdjustment)
      }
    };
  }
}

export const createBTRWorkflow = (config: BTRWorkflowConfig): BTRWorkflow => new BTRWorkflow(config);