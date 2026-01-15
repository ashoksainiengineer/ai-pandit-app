/**
 * 🌟 Complete BTR Workflow Integration
 * 
 * Orchestrates the entire Birth Time Rectification process:
 * User Input → API calls to Swiss Ephemeris → AI Analysis → Iterative Refinement → Final BTR
 * 
 * IMPORTANT: This file uses the API client to call server-side Swiss Ephemeris calculations.
 * It should NEVER import swisseph directly.
 */

import { performBTRAnalysis as apiPerformBTRAnalysis, calculateBasicEphemeris } from './api-client';
import { BTREvent, BTRResult } from './btr-iteration-engine';
import { createMoonshootAIClient, MoonshootAIConfig } from './moonshoot-ai-client';
import { generateMoonshootAIPrompt } from './moonshoot-ai-prompt';

export interface BTRWorkflowRequest {
  birthDetails: {
    date: string; // YYYY-MM-DD
    tentativeTime: string; // HH:MM
    timeRange?: string; // "±2 hours"
    place: string;
    latitude: number;
    longitude: number;
    timezone: string;
    gender: 'Male' | 'Female';
  };
  physicalCharacteristics: {
    bodyStructure: string;
    faceShape: string;
    complexion: string;
    distinctiveFeatures: string;
  };
  lifeEvents: Array<{
    type: string;
    date: string; // YYYY-MM-DD
    description: string;
    category: 'education' | 'career' | 'marriage' | 'children' | 'family' | 'health' | 'financial' | 'travel' | 'other';
  }>;
}

export interface BTRWorkflowResponse {
  originalBirthTime: string;
  rectifiedBirthTime: string;
  confidenceLevel: number;
  confidenceCategory: 'low' | 'medium' | 'high' | 'very_high';
  alignmentScore: number;
  totalIterations: number;
  aiAnalysis: {
    executiveSummary: string;
    keyFindings: string[];
    personalityInsights: string;
    futurePredictions: string;
  };
  eventMatches: Array<{
    event: string;
    date: string;
    matchScore: number;
    matchQuality: 'Strong' | 'Moderate' | 'Weak';
  }>;
  alternativeTimes: Array<{
    time: string;
    score: number;
    reason: string;
  }>;
  chartData: {
    planetaryPositions: Record<string, any>;
    houseCusps: any;
    dashaPeriods: any;
    divisionalCharts: any;
  };
  technicalDetails: {
    convergenceReason: string;
    iterationsPerformed: number;
    timeAdjustmentMinutes: number;
  };
}

export interface BTRWorkflowConfig {
  moonshotApiKey: string;
  ephemerisPath?: string;
  useKPSystem?: boolean;
  maxIterations?: number;
  convergenceThreshold?: number;
}

/**
 * 🌟 BTR Workflow Orchestrator
 * 
 * IMPORTANT: This class uses API calls for all Swiss Ephemeris calculations.
 * It does NOT import or use swisseph directly.
 */
export class BTRWorkflow {
  private btrEngine: any;
  private moonshotAI: any;
  private config: BTRWorkflowConfig;

  constructor(config: BTRWorkflowConfig) {
    this.config = config;
    
    // Initialize Moonshoot AI
    const moonshootConfig: MoonshootAIConfig = {
      apiKey: config.moonshotApiKey,
      maxRetries: 3,
      timeout: 45000, // 45 seconds for complex analysis
      temperature: 0.3,
      maxTokens: 4000
    };
    this.moonshotAI = createMoonshootAIClient(moonshootConfig);
    
    console.log('🚀 BTR Workflow initialized (using API calls)');
  }

  /**
   * 🚀 Initialize the workflow
   */
  async initialize(): Promise<void> {
    console.log('🚀 Initializing BTR Workflow...');
    // No need to initialize Swiss Ephemeris directly since we use API calls
    console.log('✅ BTR Workflow ready (API-based)');
  }

  /**
   * 🎯 Execute complete BTR workflow
   */
  async execute(request: BTRWorkflowRequest): Promise<BTRWorkflowResponse> {
    try {
      console.log('🎯 Starting complete BTR workflow...');
      console.log(`📅 Birth Date: ${request.birthDetails.date}`);
      console.log(`🕐 Tentative Time: ${request.birthDetails.tentativeTime}`);
      console.log(`📍 Location: ${request.birthDetails.place}`);
      console.log(`📋 Events: ${request.lifeEvents.length} life events`);

      // Step 1: Convert life events to BTR format
      const btrEvents = this.convertToBTREvents(request.lifeEvents);
      
      // Step 2: Perform BTR analysis using API calls
      const baseDateTime = new Date(`${request.birthDetails.date}T${request.birthDetails.tentativeTime}`);
      const btrResult = await apiPerformBTRAnalysis({
        birthData: {
          date: baseDateTime.toISOString(),
          latitude: request.birthDetails.latitude,
          longitude: request.birthDetails.longitude,
          timezone: request.birthDetails.timezone,
        },
        lifeEvents: btrEvents.map(event => ({
          date: event.date.toISOString(),
          type: event.eventType,
          description: event.description,
        })),
        uncertaintyMinutes: 120,
        slotInterval: 15,
      });

      if (!btrResult.success || !btrResult.data) {
        throw new Error(`BTR API analysis failed: ${btrResult.error}`);
      }

      console.log(`✅ BTR iterations complete: ${btrResult.data.totalIterations} iterations`);
      console.log(`🎯 Final alignment score: ${btrResult.data.finalAlignmentScore.toFixed(2)}%`);

      // Step 3: Calculate final ephemeris for rectified time using API
      const finalEphemeris = await calculateBasicEphemeris(
        btrResult.data.rectifiedTime.toISOString(),
        request.birthDetails.latitude,
        request.birthDetails.longitude
      );

      if (!finalEphemeris.success || !finalEphemeris.data) {
        throw new Error(`Final ephemeris calculation failed: ${finalEphemeris.error}`);
      }

      // Step 4: Prepare AI analysis request
      const aiRequest = this.prepareAIRequest(request, finalEphemeris.data, btrResult.data);
      
      // Step 5: Get AI analysis from Moonshot
      const aiResponse = await this.moonshotAI.analyzeBirthTime(aiRequest);

      console.log('✅ AI analysis complete');
      console.log(`🤖 AI Confidence: ${aiResponse.confidenceLevel}%`);

      // Step 6: Combine all results into final response
      const finalResponse = this.combineResults(request, btrResult.data, finalEphemeris.data, aiResponse);

      console.log('🎉 BTR Workflow complete!');
      console.log(`⏰ Rectified Time: ${finalResponse.rectifiedBirthTime}`);
      console.log(`📊 Confidence: ${finalResponse.confidenceLevel}% (${finalResponse.confidenceCategory})`);

      return finalResponse;

    } catch (error) {
      console.error('❌ BTR Workflow failed:', error);
      throw new Error(`BTR Workflow execution failed: ${error}`);
    }
  }

  /**
   * 🔄 Convert life events to BTR engine format
   */
  private convertToBTREvents(lifeEvents: BTRWorkflowRequest['lifeEvents']): BTREvent[] {
    const eventTypeMap: Record<string, BTREvent['eventType']> = {
      'marriage': 'marriage',
      'children': 'childbirth',
      'career': 'career',
      'education': 'education',
      'health': 'health',
      'travel': 'travel',
      'financial': 'property',
      'family': 'loss',
      'other': 'career' // Default
    };

    return lifeEvents.map(event => {
      const eventType = eventTypeMap[event.category] || 'career';
      const expectedData = this.getExpectedAstrologicalData(event.type, eventType);

      return {
        eventType,
        date: new Date(event.date),
        description: event.description,
        expectedPlanets: expectedData.planets,
        expectedHouses: expectedData.houses,
        expectedDasha: expectedData.dasha,
        weight: this.calculateEventWeight(eventType, event.description)
      };
    });
  }

  /**
   * 🧠 Get expected astrological data for event type
   */
  private getExpectedAstrologicalData(eventType: string, category: string): {
    planets: string[];
    houses: number[];
    dasha: string[];
  } {
    // Comprehensive mapping based on Vedic astrology principles
    const eventPatterns: Record<string, { planets: string[], houses: number[], dasha: string[] }> = {
      // Marriage events
      'marriage': { planets: ['venus', 'jupiter', 'mars'], houses: [7, 2, 11], dasha: ['Venus', 'Jupiter'] },
      'engagement': { planets: ['venus', 'mercury'], houses: [7, 5], dasha: ['Venus', 'Mercury'] },
      
      // Childbirth events
      'first_child': { planets: ['jupiter', 'mars', 'moon'], houses: [5, 9, 11], dasha: ['Jupiter', 'Mars'] },
      'second_child': { planets: ['jupiter', 'mars'], houses: [5, 7, 11], dasha: ['Jupiter', 'Venus'] },
      
      // Career events
      'first_job': { planets: ['sun', 'jupiter', 'mercury'], houses: [10, 6, 2], dasha: ['Sun', 'Jupiter'] },
      'promotion': { planets: ['sun', 'jupiter'], houses: [10, 11], dasha: ['Sun', 'Mars'] },
      'job_change': { planets: ['mercury', 'jupiter'], houses: [10, 3], dasha: ['Mercury', 'Jupiter'] },
      
      // Education events
      'school_completion': { planets: ['mercury', 'moon'], houses: [4, 2], dasha: ['Mercury', 'Moon'] },
      'bachelor': { planets: ['jupiter', 'mercury'], houses: [4, 9], dasha: ['Jupiter', 'Mercury'] },
      'master': { planets: ['jupiter', 'mercury'], houses: [5, 9], dasha: ['Jupiter', 'Mercury'] },
      'phd': { planets: ['jupiter', 'saturn'], houses: [5, 9, 12], dasha: ['Jupiter', 'Saturn'] },
      
      // Family events
      'father_death': { planets: ['saturn', 'rahu'], houses: [9, 2, 12], dasha: ['Saturn', 'Rahu'] },
      'mother_death': { planets: ['saturn', 'moon'], houses: [4, 2, 12], dasha: ['Saturn', 'Moon'] },
      
      // Health events
      'major_illness': { planets: ['saturn', 'mars', 'sun'], houses: [6, 8, 12], dasha: ['Saturn', 'Mars'] },
      'surgery': { planets: ['mars', 'saturn'], houses: [6, 8, 12], dasha: ['Mars', 'Saturn'] },
      
      // Financial events
      'property_purchase': { planets: ['mars', 'saturn', 'venus'], houses: [4, 11, 12], dasha: ['Mars', 'Saturn'] },
      'major_investment': { planets: ['jupiter', 'mercury'], houses: [2, 11, 5], dasha: ['Jupiter', 'Mercury'] },
      
      // Travel events
      'foreign_travel': { planets: ['rahu', 'mercury', 'moon'], houses: [9, 12, 7], dasha: ['Rahu', 'Mercury'] },
      'permanent_relocation': { planets: ['rahu', 'saturn'], houses: [4, 9, 12], dasha: ['Rahu', 'Saturn'] }
    };

    return eventPatterns[eventType] || { planets: ['jupiter'], houses: [9], dasha: ['Jupiter'] };
  }

  /**
   * 📊 Calculate event weight based on importance
   */
  private calculateEventWeight(category: string, description: string): number {
    const baseWeights: Record<string, number> = {
      'marriage': 10,
      'childbirth': 9,
      'career': 8,
      'education': 7,
      'health': 8,
      'family': 9,
      'financial': 7,
      'travel': 6,
      'other': 5
    };

    let weight = baseWeights[category] || 5;

    // Adjust based on description keywords
    if (description.includes('first') || description.includes('major')) weight += 1;
    if (description.includes('graduation') || description.includes('degree')) weight += 1;
    if (description.includes('serious') || description.includes('critical')) weight += 2;

    return Math.min(weight, 10); // Max weight is 10
  }

  /**
   * 📝 Prepare AI analysis request
   */
  private prepareAIRequest(
    request: BTRWorkflowRequest,
    ephemerisData: any,
    btrResult: BTRResult
  ): any {
    // Convert to format expected by Moonshoot AI client
    const promptData = {
      userData: {
        birthData: {
          date: request.birthDetails.date,
          time: request.birthDetails.tentativeTime,
          place: request.birthDetails.place,
          latitude: request.birthDetails.latitude,
          longitude: request.birthDetails.longitude,
          timezone: request.birthDetails.timezone,
          gender: request.birthDetails.gender
        },
        physicalDescription: request.physicalCharacteristics,
        lifeEvents: request.lifeEvents
      },
      ephemerisData: {
        timeSlots: [{
          timestamp: ephemerisData.timestamp.toISOString(),
          julianDay: ephemerisData.julianDay,
          planets: ephemerisData.planets,
          houseCusps: ephemerisData.houseCusps,
          lunarPhase: ephemerisData.lunarPhase,
          retrogradePlanets: ephemerisData.retrogradePlanets,
          nakshatras: ephemerisData.nakshatras,
          divisionalCharts: ephemerisData.divisionalCharts
        }]
      },
      dashaData: ephemerisData.dashaPeriods,
      timeSlots: [{
        time: btrResult.rectifiedTime.toISOString(),
        score: btrResult.finalAlignmentScore,
        planetaryPositions: ephemerisData.planets
      }]
    };

    return promptData;
  }

  /**
   * 🎯 Combine all results into final response
   */
  private combineResults(
    request: BTRWorkflowRequest,
    btrResult: BTRResult,
    finalEphemeris: any,
    aiResponse: any
  ): BTRWorkflowResponse {
    const timeAdjustment = (btrResult.rectifiedTime.getTime() - new Date(`${request.birthDetails.date}T${request.birthDetails.tentativeTime}`).getTime()) / (1000 * 60);

    // Determine confidence category
    let confidenceCategory: 'low' | 'medium' | 'high' | 'very_high' = 'low';
    if (aiResponse.confidenceLevel >= 90) confidenceCategory = 'very_high';
    else if (aiResponse.confidenceLevel >= 80) confidenceCategory = 'high';
    else if (aiResponse.confidenceLevel >= 70) confidenceCategory = 'medium';

    return {
      originalBirthTime: `${request.birthDetails.date} ${request.birthDetails.tentativeTime}`,
      rectifiedBirthTime: btrResult.rectifiedTime.toISOString(),
      confidenceLevel: aiResponse.confidenceLevel,
      confidenceCategory,
      alignmentScore: btrResult.finalAlignmentScore,
      totalIterations: btrResult.totalIterations,
      aiAnalysis: {
        executiveSummary: aiResponse.analysis?.physicalTraitsMatch || 'Analysis complete',
        keyFindings: aiResponse.keyFindings || [],
        personalityInsights: aiResponse.personalityInsights || '',
        futurePredictions: aiResponse.futurePredictions || ''
      },
      eventMatches: btrResult.eventMatches.map(match => ({
        event: match.event.description,
        date: match.event.date.toISOString().split('T')[0],
        matchScore: match.matchScore,
        matchQuality: match.matchScore >= 80 ? 'Strong' : match.matchScore >= 60 ? 'Moderate' : 'Weak'
      })),
      alternativeTimes: btrResult.alternativeTimes.map(alt => ({
        time: alt.time.toISOString(),
        score: alt.score,
        reason: alt.reason
      })),
      chartData: {
        planetaryPositions: finalEphemeris.planets,
        houseCusps: finalEphemeris.houseCusps,
        dashaPeriods: finalEphemeris.dashaPeriods,
        divisionalCharts: finalEphemeris.divisionalCharts
      },
      technicalDetails: {
        convergenceReason: btrResult.convergenceReason,
        iterationsPerformed: btrResult.totalIterations,
        timeAdjustmentMinutes: Math.round(timeAdjustment * 10) / 10
      }
    };
  }
}

/**
 * 🏭 Factory function to create BTR Workflow
 */
export function createBTRWorkflow(config: BTRWorkflowConfig): BTRWorkflow {
  return new BTRWorkflow(config);
}
