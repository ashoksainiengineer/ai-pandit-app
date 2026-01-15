/**
 * 🌟 Moonshoot AI BTR Integration System
 * 
 * Complete integration with Moonshoot AI for advanced Birth Time Rectification
 * using the provided API key and comprehensive BTR analysis framework
 * 
 * IMPORTANT: This file uses the API client to call server-side Swiss Ephemeris calculations.
 * It should NEVER import swisseph directly.
 */

import { calculateBasicEphemeris, performBTRAnalysis as apiPerformBTRAnalysis } from './api-client';
import { BTREvent, BTRResult } from './btr-iteration-engine';

// Moonshoot AI Configuration
const MOONSHOT_API_KEY = 'sk-kimi-GKXoxo4WSayAaeRY1ha5GaeTCWaBNcy46KRgf5z2qbeZaJf3f4AgxB5z07kGIC9c';
const MOONSHOT_API_URL = 'https://api.moonshot.ai/v1/chat/completions';

export interface MoonshotBTRRequest {
  birthDetails: {
    date: string;
    tentativeTime: string;
    timeRange?: string;
    place: string;
    latitude: number;
    longitude: number;
    timezone: string;
    currentAge: number;
    gender: 'Male' | 'Female';
  };
  physicalCharacteristics: {
    bodyStructure: string;
    faceShape: string;
    complexion: string;
    distinctiveFeatures: string;
    height?: string;
    build?: string;
  };
  lifeEvents: {
    education: EducationEvent[];
    career: CareerEvent[];
    marriage: MarriageEvent[];
    children: ChildrenEvent[];
    family: FamilyEvent[];
    health: HealthEvent[];
    financial: FinancialEvent[];
    travel: TravelEvent[];
    other: OtherEvent[];
  };
  swissEphemerisData: any; // Changed from SwissEphemerisResult to any since we get data from API
  btrIterationData: BTRResult;
}

export interface EducationEvent {
  type: 'school_completion' | 'higher_secondary' | 'bachelor' | 'master' | 'phd' | 'professional_course' | 'gap';
  date: string;
  description: string;
  stream?: string;
  institution?: string;
  subject?: string;
  duration?: string;
}

export interface CareerEvent {
  type: 'first_job' | 'job_change' | 'promotion' | 'business_start' | 'business_end' | 'current_occupation' | 'unemployment';
  date: string;
  position?: string;
  company?: string;
  description: string;
  duration?: string;
}

export interface MarriageEvent {
  type: 'marriage' | 'engagement' | 'meeting_spouse' | 'divorce' | 'remarriage';
  date: string;
  description: string;
}

export interface ChildrenEvent {
  type: 'first_child' | 'second_child' | 'further_children' | 'miscarriage' | 'stillbirth';
  date: string;
  gender?: 'Male' | 'Female';
  description: string;
}

export interface FamilyEvent {
  type: 'father_death' | 'mother_death' | 'sibling_death' | 'other_family_death';
  date: string;
  description: string;
  relationship?: string;
}

export interface HealthEvent {
  type: 'major_illness' | 'surgery' | 'accident' | 'chronic_condition';
  date: string;
  description: string;
  type_detail?: string;
}

export interface FinancialEvent {
  type: 'property_purchase' | 'major_investment' | 'business_success' | 'business_failure' | 'inheritance' | 'financial_loss';
  date: string;
  description: string;
  amount?: string;
}

export interface TravelEvent {
  type: 'foreign_travel' | 'permanent_relocation' | 'settlement_abroad';
  date: string;
  country?: string;
  description: string;
  from_to?: string;
}

export interface OtherEvent {
  type: 'spiritual_initiation' | 'legal_issues' | 'major_achievements' | 'life_changing';
  date: string;
  description: string;
}

export interface MoonshotBTRResponse {
  analysis: {
    executiveSummary: string;
    rectificationDetails: {
      originalTime: string;
      rectifiedTime: string;
      confidence: number;
      adjustment: string;
      methodUsed: string;
    };
    chartAnalysis: {
      d1Chart: string;
      d9Chart: string;
      keyDivisionalCharts: string;
      dashaPeriods: string;
    };
    eventByEventVerification: EventVerification[];
    physicalPersonalityMatch: string;
    advancedVerifications: {
      tattwaVerification: string;
      kpVerification: string;
      pranapadaCheck: string;
      d60Analysis: string;
    };
    finalAssessment: {
      confidenceBreakdown: string;
      strengths: string[];
      weaknesses: string[];
      recommendations: string;
    };
    futureValidation: {
      upcomingDashaPeriods: string[];
      transitsToWatch: string[];
      validationEvents: string[];
    };
    technicalNotes: string;
  };
  confidence: number;
  alternativeTimes?: AlternativeTime[];
  status: 'success' | 'partial' | 'needs_more_data';
}

export interface EventVerification {
  event: string;
  date: string;
  dashaPeriod: string;
  relevantCharts: string[];
  dashaLordConnection: string;
  divisionalChartAnalysis: string;
  matchQuality: 'Strong' | 'Moderate' | 'Weak';
  explanation: string;
}

export interface AlternativeTime {
  time: string;
  score: number;
  reason: string;
  pros: string[];
  cons: string[];
}

/**
 * 🌟 Moonshot AI BTR Integration Class
 * 
 * IMPORTANT: This class uses API calls for all Swiss Ephemeris calculations.
 * It does NOT import or use swisseph directly.
 */
export class MoonshotBTRIntegration {
  constructor() {
    console.log('🚀 Initializing Moonshot AI BTR Integration...');
    console.log('✅ Moonshot AI BTR Integration ready (using API calls)');
  }

  /**
   * 🎯 Perform complete BTR analysis with Moonshot AI
   */
  async performBTRAnalysis(request: MoonshotBTRRequest): Promise<MoonshotBTRResponse> {
    try {
      console.log('🎯 Starting comprehensive BTR analysis with Moonshot AI...');

      // Step 1: Convert life events to BTR format
      const btrEvents = this.convertToBTREvents(request.lifeEvents);
      
      // Step 2: Perform iterative BTR using API calls
      const btrResult = await apiPerformBTRAnalysis({
        birthData: {
          date: request.birthDetails.date + 'T' + request.birthDetails.tentativeTime,
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

      // Step 3: Prepare comprehensive analysis for Moonshot AI
      const moonshotRequest = this.prepareMoonshotRequest(request, btrResult.data);
      
      // Step 4: Get AI analysis from Moonshot
      const aiAnalysis = await this.getMoonshotAIAnalysis(moonshotRequest);
      
      // Step 5: Combine BTR results with AI insights
      const finalResponse = this.combineResults(btrResult.data, aiAnalysis, request);
      
      console.log('✅ BTR analysis complete with Moonshot AI integration');
      return finalResponse;
      
    } catch (error) {
      console.error('❌ BTR analysis failed:', error);
      throw new Error(`BTR analysis failed: ${error}`);
    }
  }

  /**
   * 🔄 Convert life events to BTR format
   */
  private convertToBTREvents(lifeEvents: MoonshotBTRRequest['lifeEvents']): BTREvent[] {
    const btrEvents: BTREvent[] = [];

    // Education events
    lifeEvents.education.forEach(event => {
      btrEvents.push({
        eventType: 'education',
        date: new Date(event.date),
        description: this.getEducationDescription(event),
        expectedPlanets: this.getEducationPlanets(event.type),
        expectedHouses: this.getEducationHouses(event.type),
        expectedDasha: this.getEducationDasha(event.type),
        weight: this.getEducationWeight(event.type)
      });
    });

    // Career events
    lifeEvents.career.forEach(event => {
      btrEvents.push({
        eventType: 'career',
        date: new Date(event.date),
        description: this.getCareerDescription(event),
        expectedPlanets: this.getCareerPlanets(event.type),
        expectedHouses: this.getCareerHouses(event.type),
        expectedDasha: this.getCareerDasha(event.type),
        weight: this.getCareerWeight(event.type)
      });
    });

    // Marriage events
    lifeEvents.marriage.forEach(event => {
      btrEvents.push({
        eventType: 'marriage',
        date: new Date(event.date),
        description: this.getMarriageDescription(event),
        expectedPlanets: this.getMarriagePlanets(event.type),
        expectedHouses: this.getMarriageHouses(event.type),
        expectedDasha: this.getMarriageDasha(event.type),
        weight: this.getMarriageWeight(event.type)
      });
    });

    // Children events
    lifeEvents.children.forEach(event => {
      btrEvents.push({
        eventType: 'childbirth',
        date: new Date(event.date),
        description: this.getChildrenDescription(event),
        expectedPlanets: this.getChildrenPlanets(event.type),
        expectedHouses: this.getChildrenHouses(event.type),
        expectedDasha: this.getChildrenDasha(event.type),
        weight: this.getChildrenWeight(event.type)
      });
    });

    // Family events
    lifeEvents.family.forEach(event => {
      btrEvents.push({
        eventType: 'loss',
        date: new Date(event.date),
        description: this.getFamilyDescription(event),
        expectedPlanets: this.getFamilyPlanets(event.type),
        expectedHouses: this.getFamilyHouses(event.type),
        expectedDasha: this.getFamilyDasha(event.type),
        weight: this.getFamilyWeight(event.type)
      });
    });

    // Health events
    lifeEvents.health.forEach(event => {
      btrEvents.push({
        eventType: 'health',
        date: new Date(event.date),
        description: this.getHealthDescription(event),
        expectedPlanets: this.getHealthPlanets(event.type),
        expectedHouses: this.getHealthHouses(event.type),
        expectedDasha: this.getHealthDasha(event.type),
        weight: this.getHealthWeight(event.type)
      });
    });

    // Financial events
    lifeEvents.financial.forEach(event => {
      btrEvents.push({
        eventType: 'property',
        date: new Date(event.date),
        description: this.getFinancialDescription(event),
        expectedPlanets: this.getFinancialPlanets(event.type),
        expectedHouses: this.getFinancialHouses(event.type),
        expectedDasha: this.getFinancialDasha(event.type),
        weight: this.getFinancialWeight(event.type)
      });
    });

    // Travel events
    lifeEvents.travel.forEach(event => {
      btrEvents.push({
        eventType: 'travel',
        date: new Date(event.date),
        description: this.getTravelDescription(event),
        expectedPlanets: this.getTravelPlanets(event.type),
        expectedHouses: this.getTravelHouses(event.type),
        expectedDasha: this.getTravelDasha(event.type),
        weight: this.getTravelWeight(event.type)
      });
    });

    // Other events
    lifeEvents.other.forEach(event => {
      btrEvents.push({
        eventType: this.getOtherEventType(event.type) as any,
        date: new Date(event.date),
        description: event.description,
        expectedPlanets: this.getOtherPlanets(event.type),
        expectedHouses: this.getOtherHouses(event.type),
        expectedDasha: this.getOtherDasha(event.type),
        weight: this.getOtherWeight(event.type)
      });
    });

    return btrEvents;
  }

  /**
   * 🧠 Get event-specific planets based on Vedic astrology principles
   */
  private getEducationPlanets(type: string): string[] {
    const planets = {
      'school_completion': ['mercury', 'moon'],
      'higher_secondary': ['mercury', 'moon', 'jupiter'],
      'bachelor': ['jupiter', 'mercury', 'venus'],
      'master': ['jupiter', 'mercury'],
      'phd': ['jupiter', 'mercury', 'saturn'],
      'professional_course': ['jupiter', 'mercury', 'mars'],
      'gap': ['saturn', 'rahu', 'ketu']
    };
    return planets[type as keyof typeof planets] || ['mercury', 'jupiter'];
  }

  private getEducationHouses(type: string): number[] {
    const houses = {
      'school_completion': [4, 2],
      'higher_secondary': [4, 5, 9],
      'bachelor': [4, 5, 9, 2],
      'master': [5, 9, 11],
      'phd': [5, 9, 12],
      'professional_course': [5, 6, 10],
      'gap': [6, 8, 12]
    };
    return houses[type as keyof typeof houses] || [4, 5, 9];
  }

  private getEducationDasha(type: string): string[] {
    const dasha = {
      'school_completion': ['Mercury', 'Moon'],
      'higher_secondary': ['Mercury', 'Jupiter', 'Moon'],
      'bachelor': ['Jupiter', 'Mercury', 'Venus'],
      'master': ['Jupiter', 'Mercury'],
      'phd': ['Jupiter', 'Saturn', 'Mercury'],
      'professional_course': ['Jupiter', 'Mercury', 'Mars'],
      'gap': ['Saturn', 'Rahu', 'Ketu']
    };
    return dasha[type as keyof typeof dasha] || ['Mercury', 'Jupiter'];
  }

  private getEducationWeight(type: string): number {
    const weights = {
      'school_completion': 6,
      'higher_secondary': 7,
      'bachelor': 8,
      'master': 9,
      'phd': 10,
      'professional_course': 8,
      'gap': 5
    };
    return weights[type as keyof typeof weights] || 7;
  }

  private getCareerPlanets(type: string): string[] {
    const planets = {
      'first_job': ['sun', 'jupiter', 'mercury'],
      'job_change': ['mercury', 'jupiter', 'mars'],
      'promotion': ['sun', 'jupiter', 'mars'],
      'business_start': ['mars', 'jupiter', 'mercury'],
      'business_end': ['saturn', 'rahu'],
      'current_occupation': ['sun', 'jupiter', 'mercury'],
      'unemployment': ['saturn', 'rahu', 'ketu']
    };
    return planets[type as keyof typeof planets] || ['sun', 'jupiter', 'mercury'];
  }

  private getCareerHouses(type: string): number[] {
    const houses = {
      'first_job': [10, 6, 2],
      'job_change': [10, 3, 6],
      'promotion': [10, 11, 2],
      'business_start': [10, 7, 3],
      'business_end': [8, 12, 6],
      'current_occupation': [10, 6, 2],
      'unemployment': [6, 8, 12]
    };
    return houses[type as keyof typeof houses] || [10, 6, 2];
  }

  private getCareerDasha(type: string): string[] {
    const dasha = {
      'first_job': ['Sun', 'Jupiter', 'Mercury'],
      'job_change': ['Mercury', 'Jupiter', 'Mars'],
      'promotion': ['Sun', 'Jupiter', 'Mars'],
      'business_start': ['Mars', 'Jupiter', 'Mercury'],
      'business_end': ['Saturn', 'Rahu'],
      'current_occupation': ['Sun', 'Jupiter', 'Mercury'],
      'unemployment': ['Saturn', 'Rahu', 'Ketu']
    };
    return dasha[type as keyof typeof dasha] || ['Sun', 'Jupiter', 'Mercury'];
  }

  private getCareerWeight(type: string): number {
    const weights = {
      'first_job': 9,
      'job_change': 7,
      'promotion': 8,
      'business_start': 9,
      'business_end': 8,
      'current_occupation': 7,
      'unemployment': 6
    };
    return weights[type as keyof typeof weights] || 8;
  }

  private getMarriagePlanets(type: string): string[] {
    const planets = {
      'marriage': ['venus', 'jupiter', 'mars'],
      'engagement': ['venus', 'mercury', 'moon'],
      'meeting_spouse': ['venus', 'jupiter', 'moon'],
      'divorce': ['saturn', 'mars', 'rahu'],
      'remarriage': ['venus', 'jupiter', 'mercury']
    };
    return planets[type as keyof typeof planets] || ['venus', 'jupiter', 'mars'];
  }

  private getMarriageHouses(type: string): number[] {
    const houses = {
      'marriage': [7, 2, 11, 5],
      'engagement': [7, 5, 11],
      'meeting_spouse': [7, 5, 11],
      'divorce': [6, 8, 12, 1],
      'remarriage': [7, 2, 11, 9]
    };
    return houses[type as keyof typeof houses] || [7, 2, 11];
  }

  private getMarriageDasha(type: string): string[] {
    const dasha = {
      'marriage': ['Venus', 'Jupiter'],
      'engagement': ['Venus', 'Mercury', 'Moon'],
      'meeting_spouse': ['Venus', 'Jupiter', 'Moon'],
      'divorce': ['Saturn', 'Mars', 'Rahu'],
      'remarriage': ['Venus', 'Jupiter', 'Mercury']
    };
    return dasha[type as keyof typeof dasha] || ['Venus', 'Jupiter'];
  }

  private getMarriageWeight(type: string): number {
    const weights = {
      'marriage': 10,
      'engagement': 7,
      'meeting_spouse': 6,
      'divorce': 8,
      'remarriage': 9
    };
    return weights[type as keyof typeof weights] || 9;
  }

  // Helper methods for descriptions and other event types
  private getEducationDescription(event: EducationEvent): string {
    const descriptions = {
      'school_completion': 'School education completion',
      'higher_secondary': 'Higher secondary education',
      'bachelor': `Bachelor's degree in ${event.subject || 'unknown subject'}`,
      'master': `Master's degree in ${event.subject || 'unknown subject'}`,
      'phd': `PhD in ${event.subject || 'unknown subject'}`,
      'professional_course': `Professional course: ${event.subject || 'unknown course'}`,
      'gap': 'Education gap period'
    };
    return descriptions[event.type as keyof typeof descriptions] || 'Education event';
  }

  private getCareerDescription(event: CareerEvent): string {
    const descriptions = {
      'first_job': 'First employment',
      'job_change': 'Job change/transition',
      'promotion': 'Career promotion',
      'business_start': 'Business venture start',
      'business_end': 'Business venture end',
      'current_occupation': 'Current professional role',
      'unemployment': 'Unemployment period'
    };
    return descriptions[event.type as keyof typeof descriptions] || 'Career event';
  }

  private getMarriageDescription(event: MarriageEvent): string {
    const descriptions = {
      'marriage': 'Marriage ceremony',
      'engagement': 'Engagement ceremony',
      'meeting_spouse': 'First meeting with spouse',
      'divorce': 'Divorce proceedings',
      'remarriage': 'Remarriage ceremony'
    };
    return descriptions[event.type as keyof typeof descriptions] || 'Marriage/relationship event';
  }

  private getOtherEventType(type: string): 'education' | 'career' | 'marriage' | 'health' | 'travel' | 'childbirth' | 'property' | 'loss' {
    const typeMap: Record<string, 'education' | 'career' | 'marriage' | 'health' | 'travel' | 'childbirth' | 'property' | 'loss'> = {
      'spiritual_initiation': 'education',
      'legal_issues': 'loss',
      'major_achievements': 'career',
      'life_changing': 'loss'
    };
    return typeMap[type] || 'education';
  }

  // Helper methods for children events
  private getChildrenDescription(event: any): string {
    const descriptions = {
      'first_child': 'Birth of first child',
      'second_child': 'Birth of second child',
      'further_children': 'Birth of subsequent children',
      'miscarriage': 'Miscarriage event',
      'stillbirth': 'Stillbirth event'
    };
    return descriptions[event.type as keyof typeof descriptions] || 'Children event';
  }

  private getChildrenPlanets(type: string): string[] {
    const planets = {
      'first_child': ['jupiter', 'moon', 'venus'],
      'second_child': ['jupiter', 'moon', 'mars'],
      'further_children': ['jupiter', 'moon', 'saturn'],
      'miscarriage': ['mars', 'saturn', 'rahu'],
      'stillbirth': ['saturn', 'mars', 'ketu']
    };
    return planets[type as keyof typeof planets] || ['jupiter', 'moon'];
  }

  private getChildrenHouses(type: string): number[] {
    const houses = {
      'first_child': [5, 9, 11],
      'second_child': [5, 7, 9],
      'further_children': [5, 9, 11],
      'miscarriage': [5, 8, 12],
      'stillbirth': [5, 8, 12]
    };
    return houses[type as keyof typeof houses] || [5, 9];
  }

  private getChildrenDasha(type: string): string[] {
    const dasha = {
      'first_child': ['Jupiter', 'Moon', 'Venus'],
      'second_child': ['Jupiter', 'Mars', 'Moon'],
      'further_children': ['Jupiter', 'Saturn', 'Moon'],
      'miscarriage': ['Mars', 'Saturn', 'Rahu'],
      'stillbirth': ['Saturn', 'Mars', 'Ketu']
    };
    return dasha[type as keyof typeof dasha] || ['Jupiter', 'Moon'];
  }

  private getChildrenWeight(type: string): number {
    const weights = {
      'first_child': 10,
      'second_child': 9,
      'further_children': 8,
      'miscarriage': 7,
      'stillbirth': 8
    };
    return weights[type as keyof typeof weights] || 8;
  }

  // Helper methods for family events
  private getFamilyDescription(event: any): string {
    const descriptions = {
      'father_death': "Father's death",
      'mother_death': "Mother's death",
      'sibling_death': "Sibling's death",
      'other_family_death': 'Other family member death'
    };
    return descriptions[event.type as keyof typeof descriptions] || 'Family event';
  }

  private getFamilyPlanets(type: string): string[] {
    const planets = {
      'father_death': ['sun', 'saturn', 'rahu'],
      'mother_death': ['moon', 'saturn', 'rahu'],
      'sibling_death': ['mars', 'saturn', 'rahu'],
      'other_family_death': ['saturn', 'rahu', 'ketu']
    };
    return planets[type as keyof typeof planets] || ['saturn', 'rahu'];
  }

  private getFamilyHouses(type: string): number[] {
    const houses = {
      'father_death': [9, 10, 8],
      'mother_death': [4, 8, 10],
      'sibling_death': [3, 8, 11],
      'other_family_death': [8, 12, 6]
    };
    return houses[type as keyof typeof houses] || [8, 12];
  }

  private getFamilyDasha(type: string): string[] {
    const dasha = {
      'father_death': ['Saturn', 'Rahu', 'Sun'],
      'mother_death': ['Saturn', 'Rahu', 'Moon'],
      'sibling_death': ['Saturn', 'Rahu', 'Mars'],
      'other_family_death': ['Saturn', 'Rahu', 'Ketu']
    };
    return dasha[type as keyof typeof dasha] || ['Saturn', 'Rahu'];
  }

  private getFamilyWeight(type: string): number {
    const weights = {
      'father_death': 9,
      'mother_death': 9,
      'sibling_death': 8,
      'other_family_death': 7
    };
    return weights[type as keyof typeof weights] || 8;
  }

  // Helper methods for health events
  private getHealthDescription(event: any): string {
    const descriptions = {
      'major_illness': 'Major illness',
      'surgery': 'Surgery procedure',
      'accident': 'Accident/injury',
      'chronic_condition': 'Chronic health condition'
    };
    return descriptions[event.type as keyof typeof descriptions] || 'Health event';
  }

  private getHealthPlanets(type: string): string[] {
    const planets = {
      'major_illness': ['saturn', 'mars', 'rahu'],
      'surgery': ['mars', 'saturn', 'ketu'],
      'accident': ['mars', 'saturn', 'rahu'],
      'chronic_condition': ['saturn', 'rahu', 'ketu']
    };
    return planets[type as keyof typeof planets] || ['saturn', 'mars'];
  }

  private getHealthHouses(type: string): number[] {
    const houses = {
      'major_illness': [6, 8, 12],
      'surgery': [6, 8, 12],
      'accident': [8, 6, 12],
      'chronic_condition': [6, 8, 12]
    };
    return houses[type as keyof typeof houses] || [6, 8];
  }

  private getHealthDasha(type: string): string[] {
    const dasha = {
      'major_illness': ['Saturn', 'Mars', 'Rahu'],
      'surgery': ['Mars', 'Saturn', 'Ketu'],
      'accident': ['Mars', 'Saturn', 'Rahu'],
      'chronic_condition': ['Saturn', 'Rahu', 'Ketu']
    };
    return dasha[type as keyof typeof dasha] || ['Saturn', 'Mars'];
  }

  private getHealthWeight(type: string): number {
    const weights = {
      'major_illness': 8,
      'surgery': 9,
      'accident': 9,
      'chronic_condition': 7
    };
    return weights[type as keyof typeof weights] || 8;
  }

  // Helper methods for financial events
  private getFinancialDescription(event: any): string {
    const descriptions = {
      'property_purchase': 'Property purchase',
      'major_investment': 'Major investment',
      'business_success': 'Business success',
      'business_failure': 'Business failure',
      'inheritance': 'Inheritance received',
      'financial_loss': 'Financial loss'
    };
    return descriptions[event.type as keyof typeof descriptions] || 'Financial event';
  }

  private getFinancialPlanets(type: string): string[] {
    const planets = {
      'property_purchase': ['mars', 'saturn', 'venus'],
      'major_investment': ['jupiter', 'mercury', 'venus'],
      'business_success': ['sun', 'jupiter', 'mercury'],
      'business_failure': ['saturn', 'rahu', 'ketu'],
      'inheritance': ['jupiter', 'saturn', 'sun'],
      'financial_loss': ['saturn', 'rahu', 'ketu']
    };
    return planets[type as keyof typeof planets] || ['jupiter', 'saturn'];
  }

  private getFinancialHouses(type: string): number[] {
    const houses = {
      'property_purchase': [4, 11, 2],
      'major_investment': [2, 11, 5],
      'business_success': [10, 11, 2],
      'business_failure': [8, 12, 6],
      'inheritance': [8, 2, 9],
      'financial_loss': [8, 12, 6]
    };
    return houses[type as keyof typeof houses] || [2, 11];
  }

  private getFinancialDasha(type: string): string[] {
    const dasha = {
      'property_purchase': ['Mars', 'Saturn', 'Venus'],
      'major_investment': ['Jupiter', 'Mercury', 'Venus'],
      'business_success': ['Sun', 'Jupiter', 'Mercury'],
      'business_failure': ['Saturn', 'Rahu', 'Ketu'],
      'inheritance': ['Jupiter', 'Saturn', 'Sun'],
      'financial_loss': ['Saturn', 'Rahu', 'Ketu']
    };
    return dasha[type as keyof typeof dasha] || ['Jupiter', 'Saturn'];
  }

  private getFinancialWeight(type: string): number {
    const weights = {
      'property_purchase': 9,
      'major_investment': 8,
      'business_success': 9,
      'business_failure': 8,
      'inheritance': 7,
      'financial_loss': 7
    };
    return weights[type as keyof typeof weights] || 8;
  }

  // Helper methods for travel events
  private getTravelDescription(event: any): string {
    const descriptions = {
      'foreign_travel': 'Foreign travel',
      'permanent_relocation': 'Permanent relocation',
      'settlement_abroad': 'Settlement abroad'
    };
    return descriptions[event.type as keyof typeof descriptions] || 'Travel event';
  }

  private getTravelPlanets(type: string): string[] {
    const planets = {
      'foreign_travel': ['rahu', 'jupiter', 'moon'],
      'permanent_relocation': ['rahu', 'saturn', 'moon'],
      'settlement_abroad': ['rahu', 'ketu', 'jupiter']
    };
    return planets[type as keyof typeof planets] || ['rahu', 'jupiter'];
  }

  private getTravelHouses(type: string): number[] {
    const houses = {
      'foreign_travel': [9, 12, 7],
      'permanent_relocation': [4, 12, 9],
      'settlement_abroad': [12, 9, 7]
    };
    return houses[type as keyof typeof houses] || [9, 12];
  }

  private getTravelDasha(type: string): string[] {
    const dasha = {
      'foreign_travel': ['Rahu', 'Jupiter', 'Moon'],
      'permanent_relocation': ['Rahu', 'Saturn', 'Moon'],
      'settlement_abroad': ['Rahu', 'Ketu', 'Jupiter']
    };
    return dasha[type as keyof typeof dasha] || ['Rahu', 'Jupiter'];
  }

  private getTravelWeight(type: string): number {
    const weights = {
      'foreign_travel': 7,
      'permanent_relocation': 8,
      'settlement_abroad': 9
    };
    return weights[type as keyof typeof weights] || 7;
  }

  // Helper methods for other events
  private getOtherPlanets(type: string): string[] {
    const planets = {
      'spiritual_initiation': ['jupiter', 'ketu', 'moon'],
      'legal_issues': ['saturn', 'mars', 'rahu'],
      'major_achievements': ['sun', 'jupiter', 'mercury'],
      'life_changing': ['rahu', 'ketu', 'saturn']
    };
    return planets[type as keyof typeof planets] || ['jupiter', 'saturn'];
  }

  private getOtherHouses(type: string): number[] {
    const houses = {
      'spiritual_initiation': [9, 12, 5],
      'legal_issues': [6, 8, 12],
      'major_achievements': [10, 11, 1],
      'life_changing': [8, 12, 1]
    };
    return houses[type as keyof typeof houses] || [9, 12];
  }

  private getOtherDasha(type: string): string[] {
    const dasha = {
      'spiritual_initiation': ['Jupiter', 'Ketu', 'Moon'],
      'legal_issues': ['Saturn', 'Mars', 'Rahu'],
      'major_achievements': ['Sun', 'Jupiter', 'Mercury'],
      'life_changing': ['Rahu', 'Ketu', 'Saturn']
    };
    return dasha[type as keyof typeof dasha] || ['Jupiter', 'Saturn'];
  }

  private getOtherWeight(type: string): number {
    const weights = {
      'spiritual_initiation': 8,
      'legal_issues': 8,
      'major_achievements': 9,
      'life_changing': 9
    };
    return weights[type as keyof typeof weights] || 7;
  }

  /**
   * 🧠 Prepare comprehensive request for Moonshot AI
   */
  private prepareMoonshotRequest(request: MoonshotBTRRequest, btrResult: any): any {
    return {
      model: 'kimi',
      messages: [
        {
          role: 'system',
          content: this.getSystemPrompt()
        },
        {
          role: 'user',
          content: this.formatAnalysisRequest(request, btrResult)
        }
      ],
      temperature: 0.3,
      max_tokens: 4000
    };
  }

  /**
   * 📝 Get system prompt for Moonshot AI
   */
  private getSystemPrompt(): string {
    return `You are an expert Vedic astrologer specializing in Birth Time Rectification (BTR). Your primary methods are based on K.N. Rao's event-based rectification using divisional charts, combined with Vimshottari Dasha analysis, Tattwa Shodhana theory, and KP (Krishnamurti Paddhati) principles.

You have deep knowledge of:
1. All 16 divisional charts (Shodasavarga) and their significance
2. Vimshottari Dasha system (120-year planetary cycle)
3. Classical texts: Brihat Parashara Hora Shastra, Jataka Phala Chintamani
4. Modern methods: K.N. Rao, Paul Manley, Prof. Andrew Dutta
5. Tattwa Shodhana theory and Pranapada analysis
6. D-60 (Shastiamsa) chart for past karma
7. Physical features and planetary influence
8. Bhavat Bhavam principle
9. Karaka planets for different life areas

Your goal is to analyze the provided birth data and life events, then determine the most accurate birth time using systematic rectification methods.

Use Lahiri Ayanamsa and provide detailed, professional analysis with clear confidence levels and explanations.`;
  }

  /**
   * 📝 Format analysis request for Moonshot AI
   */
  private formatAnalysisRequest(request: MoonshotBTRRequest, btrResult: any): string {
    return `
# COMPREHENSIVE BIRTH TIME RECTIFICATION ANALYSIS

## BASIC BIRTH DETAILS:
- **Date of Birth:** ${request.birthDetails.date}
- **Tentative Birth Time:** ${request.birthDetails.tentativeTime}
- **Place of Birth:** ${request.birthDetails.place}
- **Latitude:** ${request.birthDetails.latitude}
- **Longitude:** ${request.birthDetails.longitude}
- **Timezone:** ${request.birthDetails.timezone}
- **Current Age:** ${request.birthDetails.currentAge}
- **Gender:** ${request.birthDetails.gender}

## PHYSICAL CHARACTERISTICS:
- **Body Structure:** ${request.physicalCharacteristics.bodyStructure}
- **Face Shape:** ${request.physicalCharacteristics.faceShape}
- **Complexion:** ${request.physicalCharacteristics.complexion}
- **Distinctive Features:** ${request.physicalCharacteristics.distinctiveFeatures}

## SWISS EPHEMERIS CALCULATION RESULTS:
${this.formatSwissEphemerisData(request.swissEphemerisData)}

## BTR ITERATION ENGINE RESULTS:
${this.formatBTRResults(btrResult)}

## DETAILED LIFE EVENTS:
${this.formatLifeEvents(request.lifeEvents)}

## ANALYSIS REQUIREMENTS:
Please provide a comprehensive BTR analysis following the 5-phase methodology:

1. **Phase 1: Initial Chart Analysis** - Physical verification, personality check
2. **Phase 2: Event-Based Divisional Chart Analysis** - Dasha verification for each event
3. **Phase 3: Time Adjustment Strategy** - Determine adjustment direction and magnitude
4. **Phase 4: Advanced Verification Methods** - Tattwa, KP, Pranapada, D-60 analysis
5. **Phase 5: Comprehensive Report** - Final assessment with confidence level

Provide detailed analysis for each life event, explain the rectification logic, and give clear confidence assessment with alternative times if needed.

Minimum confidence for high accuracy: 8/10
Target alignment: >85% of events should match

Format your response according to the specified structure with Executive Summary, Rectification Details, Chart Analysis, Event-by-Event Verification, etc.`;
  }

  /**
   * 📊 Format Swiss Ephemeris data for AI analysis
   */
  private formatSwissEphemerisData(data: any): string {
    if (!data || !data.planets) {
      return '### Swiss Ephemeris data not available\n';
    }
    
    return `
### Planetary Positions (Sidereal - KP Ayanamsa):
- Sun: ${data.planets.sun?.sign || 'N/A'} ${data.planets.sun?.longitudeDeg || 0}°${data.planets.sun?.longitudeMin || 0}'${data.planets.sun?.longitudeSec || 0}" (${data.planets.sun?.nakshatra || 'N/A'})
- Moon: ${data.planets.moon?.sign || 'N/A'} ${data.planets.moon?.longitudeDeg || 0}°${data.planets.moon?.longitudeMin || 0}'${data.planets.moon?.longitudeSec || 0}" (${data.planets.moon?.nakshatra || 'N/A'})
- Mars: ${data.planets.mars?.sign || 'N/A'} ${data.planets.mars?.longitudeDeg || 0}°${data.planets.mars?.longitudeMin || 0}'${data.planets.mars?.longitudeSec || 0}" (${data.planets.mars?.nakshatra || 'N/A'})
- Mercury: ${data.planets.mercury?.sign || 'N/A'} ${data.planets.mercury?.longitudeDeg || 0}°${data.planets.mercury?.longitudeMin || 0}'${data.planets.mercury?.longitudeSec || 0}" (${data.planets.mercury?.nakshatra || 'N/A'})
- Jupiter: ${data.planets.jupiter?.sign || 'N/A'} ${data.planets.jupiter?.longitudeDeg || 0}°${data.planets.jupiter?.longitudeMin || 0}'${data.planets.jupiter?.longitudeSec || 0}" (${data.planets.jupiter?.nakshatra || 'N/A'})
- Venus: ${data.planets.venus?.sign || 'N/A'} ${data.planets.venus?.longitudeDeg || 0}°${data.planets.venus?.longitudeMin || 0}'${data.planets.venus?.longitudeSec || 0}" (${data.planets.venus?.nakshatra || 'N/A'})
- Saturn: ${data.planets.saturn?.sign || 'N/A'} ${data.planets.saturn?.longitudeDeg || 0}°${data.planets.saturn?.longitudeMin || 0}'${data.planets.saturn?.longitudeSec || 0}" (${data.planets.saturn?.nakshatra || 'N/A'})
- Rahu: ${data.planets.rahu?.sign || 'N/A'} ${data.planets.rahu?.longitudeDeg || 0}°${data.planets.rahu?.longitudeMin || 0}'${data.planets.rahu?.longitudeSec || 0}" (${data.planets.rahu?.nakshatra || 'N/A'})
- Ketu: ${data.planets.ketu?.sign || 'N/A'} ${data.planets.ketu?.longitudeDeg || 0}°${data.planets.ketu?.longitudeMin || 0}'${data.planets.ketu?.longitudeSec || 0}" (${data.planets.ketu?.nakshatra || 'N/A'})

### House Cusps (Placidus):
- Ascendant: ${data.houseCusps?.ascendant?.toFixed(2) || 0}° (${data.houseCusps?.cuspSigns?.[0] || 'N/A'})
- 2nd House: ${data.houseCusps?.secondHouse?.toFixed(2) || 0}° (${data.houseCusps?.cuspSigns?.[1] || 'N/A'})
- 7th House: ${data.houseCusps?.seventhHouse?.toFixed(2) || 0}° (${data.houseCusps?.cuspSigns?.[6] || 'N/A'})
- 10th House: ${data.houseCusps?.tenthHouse?.toFixed(2) || 0}° (${data.houseCusps?.cuspSigns?.[9] || 'N/A'})

### Current Dasha Periods:
- Mahadasha: ${data.dashaPeriods?.vimshottari?.currentMahadasha?.planet || 'N/A'}
- Antardasha: ${data.dashaPeriods?.vimshottari?.currentAntardasha?.planet || 'N/A'}
- Pratyantardasha: ${data.dashaPeriods?.vimshottari?.currentPratyantardasha?.planet || 'N/A'}
- Birth Balance: ${data.dashaPeriods?.vimshottari?.birthBalance || 'N/A'}

### Key Divisional Charts:
- D-1 (Rashi) Lagna: ${data.divisionalCharts?.d1?.lagnaSign || 'N/A'} ${data.divisionalCharts?.d1?.lagnaDegree?.toFixed(1) || 0}°
- D-9 (Navamsa) Lagna: ${data.divisionalCharts?.d9?.lagnaSign || 'N/A'} ${data.divisionalCharts?.d9?.lagnaDegree?.toFixed(1) || 0}°
- D-60 (Shastiamsa) Lagna: ${data.divisionalCharts?.d60?.lagnaSign || 'N/A'} ${data.divisionalCharts?.d60?.lagnaDegree?.toFixed(1) || 0}°

### Retrograde Planets: ${data.retrogradePlanets?.join(', ') || 'None'}
`;
  }

  /**
   * 📊 Format BTR results for AI analysis
   */
  private formatBTRResults(result: any): string {
    if (!result) {
      return '### BTR results not available\n';
    }
    
    return `
### BTR Iteration Results:
- Original Time: ${result.originalTime?.toISOString() || 'N/A'}
- Rectified Time: ${result.rectifiedTime?.toISOString() || 'N/A'}
- Time Adjustment: ${result.originalTime && result.rectifiedTime ? ((result.rectifiedTime.getTime() - result.originalTime.getTime()) / (1000 * 60)).toFixed(1) : '0'} minutes
- Final Alignment Score: ${result.finalAlignmentScore?.toFixed(2) || '0'}%
- Confidence Level: ${result.confidenceLevel || 'N/A'}
- Total Iterations: ${result.totalIterations || 0}
- Convergence Reason: ${result.convergenceReason || 'N/A'}

### Event Matching Summary:
${result.eventMatches?.map((match: any) => 
  `- ${match.event?.description || 'Unknown'}: ${match.matchScore?.toFixed(1) || '0'}% (${match.matchingFactors?.planets ? '✓' : '✗'} Planets, ${match.matchingFactors?.houses ? '✓' : '✗'} Houses, ${match.matchingFactors?.dasha ? '✓' : '✗'} Dasha, ${match.matchingFactors?.divisional ? '✓' : '✗'} Divisional)`
).join('\n') || 'No event matches available'}

### Alternative Times Considered:
${result.alternativeTimes?.map((alt: any) => 
  `- ${alt.time?.toISOString() || 'N/A'}: ${alt.score?.toFixed(1) || '0'}% - ${alt.reason || 'No reason'}`
).join('\n') || 'None'}
`;
  }

  /**
   * 📊 Format life events for AI analysis
   */
  private formatLifeEvents(events: MoonshotBTRRequest['lifeEvents']): string {
    let formatted = '';

    if (events.education.length > 0) {
      formatted += '\n### Education Events:\n';
      events.education.forEach(event => {
        formatted += `- ${event.type}: ${event.date} - ${event.description}\n`;
      });
    }

    if (events.career.length > 0) {
      formatted += '\n### Career Events:\n';
      events.career.forEach(event => {
        formatted += `- ${event.type}: ${event.date} - ${event.description}\n`;
      });
    }

    if (events.marriage.length > 0) {
      formatted += '\n### Marriage/Relationship Events:\n';
      events.marriage.forEach(event => {
        formatted += `- ${event.type}: ${event.date} - ${event.description}\n`;
      });
    }

    if (events.children.length > 0) {
      formatted += '\n### Children Events:\n';
      events.children.forEach(event => {
        formatted += `- ${event.type}: ${event.date} - ${event.description}\n`;
      });
    }

    if (events.family.length > 0) {
      formatted += '\n### Family Events:\n';
      events.family.forEach(event => {
        formatted += `- ${event.type}: ${event.date} - ${event.description}\n`;
      });
    }

    if (events.health.length > 0) {
      formatted += '\n### Health Events:\n';
      events.health.forEach(event => {
        formatted += `- ${event.type}: ${event.date} - ${event.description}\n`;
      });
    }

    if (events.financial.length > 0) {
      formatted += '\n### Financial/Property Events:\n';
      events.financial.forEach(event => {
        formatted += `- ${event.type}: ${event.date} - ${event.description}\n`;
      });
    }

    if (events.travel.length > 0) {
      formatted += '\n### Travel Events:\n';
      events.travel.forEach(event => {
        formatted += `- ${event.type}: ${event.date} - ${event.description}\n`;
      });
    }

    if (events.other.length > 0) {
      formatted += '\n### Other Significant Events:\n';
      events.other.forEach(event => {
        formatted += `- ${event.type}: ${event.date} - ${event.description}\n`;
      });
    }

    return formatted;
  }

  /**
   * 🌙 Get AI analysis from Moonshot
   */
  private async getMoonshotAIAnalysis(request: any): Promise<string> {
    try {
      console.log('🌙 Sending request to Moonshot AI...');
      
      const response = await fetch(MOONSHOT_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${MOONSHOT_API_KEY}`
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        throw new Error(`Moonshot AI API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const aiAnalysis = data.choices[0].message.content;
      
      console.log('✅ Received AI analysis from Moonshot');
      return aiAnalysis;
      
    } catch (error) {
      console.error('❌ Moonshot AI API error:', error);
      throw new Error(`Failed to get AI analysis: ${error}`);
    }
  }

  /**
   * 🎯 Combine BTR results with AI insights
   */
  private combineResults(btrResult: any, aiAnalysis: string, request: MoonshotBTRRequest): MoonshotBTRResponse {
    // Parse AI analysis to extract structured data
    const parsedAnalysis = this.parseAIAnalysis(aiAnalysis);
    
    return {
      analysis: parsedAnalysis,
      confidence: parsedAnalysis.finalAssessment.confidence,
      alternativeTimes: parsedAnalysis.alternativeTimes,
      status: this.determineStatus(parsedAnalysis.finalAssessment.confidence)
    };
  }

  /**
   * 📝 Parse AI analysis response
   */
  private parseAIAnalysis(analysis: string): any {
    // This would implement sophisticated parsing of the AI response
    // For now, return a structured format based on the expected output
    return {
      executiveSummary: this.extractSection(analysis, 'EXECUTIVE SUMMARY'),
      rectificationDetails: this.extractRectificationDetails(analysis),
      chartAnalysis: this.extractSection(analysis, 'CHART ANALYSIS'),
      eventByEventVerification: this.extractEventVerifications(analysis),
      physicalPersonalityMatch: this.extractSection(analysis, 'PHYSICAL & PERSONALITY MATCH'),
      advancedVerifications: this.extractAdvancedVerifications(analysis),
      finalAssessment: this.extractFinalAssessment(analysis),
      futureValidation: this.extractFutureValidation(analysis),
      technicalNotes: this.extractSection(analysis, 'TECHNICAL NOTES')
    };
  }

  /**
   * 🔍 Extract sections from AI analysis
   */
  private extractSection(analysis: string, sectionName: string): string {
    const regex = new RegExp(`### ${sectionName}\n([\s\S]*?)(?=###|\n###|$)`, 'i');
    const match = analysis.match(regex);
    return match ? match[1].trim() : '';
  }

  private extractRectificationDetails(analysis: string): any {
    // Extract rectification details from the analysis
    const details = {
      originalTime: '',
      rectifiedTime: '',
      confidence: 0,
      adjustment: '',
      methodUsed: ''
    };
    
    // Parse the rectification details section
    const rectSection = this.extractSection(analysis, 'RECTIFICATION DETAILS');
    
    // Extract specific values using regex patterns
    const originalTimeMatch = rectSection.match(/Original Time:\s*(.+)/i);
    const rectifiedTimeMatch = rectSection.match(/Rectified Time:\s*(.+)/i);
    const confidenceMatch = rectSection.match(/Confidence:\s*(\d+)\/10/i);
    const adjustmentMatch = rectSection.match(/Adjustment:\s*(.+)/i);
    const methodMatch = rectSection.match(/Method Used:\s*(.+)/i);
    
    return {
      originalTime: originalTimeMatch ? originalTimeMatch[1].trim() : '',
      rectifiedTime: rectifiedTimeMatch ? rectifiedTimeMatch[1].trim() : '',
      confidence: confidenceMatch ? parseInt(confidenceMatch[1]) : 0,
      adjustment: adjustmentMatch ? adjustmentMatch[1].trim() : '',
      methodUsed: methodMatch ? methodMatch[1].trim() : ''
    };
  }

  private extractEventVerifications(analysis: string): EventVerification[] {
    // Extract event verifications from the analysis
    const eventSection = this.extractSection(analysis, 'EVENT-BY-EVENT VERIFICATION');
    const events: EventVerification[] = [];
    
    // Parse individual event verifications
    const eventMatches = eventSection.match(/EVENT \d+:[\s\S]*?(?=EVENT \d+:|$)/gi);
    
    if (eventMatches) {
      eventMatches.forEach(eventMatch => {
        const event: EventVerification = {
          event: this.extractValue(eventMatch, 'Event:'),
          date: this.extractValue(eventMatch, 'Date:'),
          dashaPeriod: this.extractValue(eventMatch, 'Dasha:'),
          relevantCharts: this.extractValue(eventMatch, 'Relevant Charts:').split(',').map(s => s.trim()),
          dashaLordConnection: this.extractValue(eventMatch, 'Analysis:'),
          divisionalChartAnalysis: '', // Would need more sophisticated parsing
          matchQuality: this.extractMatchQuality(eventMatch),
          explanation: this.extractValue(eventMatch, 'Analysis:')
        };
        events.push(event);
      });
    }
    
    return events;
  }

  private extractAdvancedVerifications(analysis: string): any {
    const advSection = this.extractSection(analysis, 'ADVANCED VERIFICATIONS');
    return {
      tattwaVerification: this.extractValue(advSection, 'Tattwa Verification:'),
      kpVerification: this.extractValue(advSection, 'KP Verification:'),
      pranapadaCheck: this.extractValue(advSection, 'Pranapada Check:'),
      d60Analysis: this.extractValue(advSection, 'D-60 Analysis:')
    };
  }

  private extractFinalAssessment(analysis: string): any {
    const assessSection = this.extractSection(analysis, 'FINAL ASSESSMENT');
    return {
      confidenceBreakdown: this.extractValue(assessSection, 'Overall Rectification Confidence:'),
      strengths: this.extractListItems(assessSection, 'Strengths:'),
      weaknesses: this.extractListItems(assessSection, 'Weaknesses:'),
      recommendations: this.extractValue(assessSection, 'Recommendations:')
    };
  }

  private extractFutureValidation(analysis: string): any {
    const futureSection = this.extractSection(analysis, 'FUTURE VALIDATION');
    return {
      upcomingDashaPeriods: this.extractListItems(futureSection, 'Upcoming Dasha Periods:'),
      transitsToWatch: this.extractListItems(futureSection, 'Transits to Watch:'),
      validationEvents: this.extractListItems(futureSection, 'Validation Events:')
    };
  }

  /**
   * 🔍 Helper methods for parsing
   */
  private extractValue(text: string, label: string): string {
    const regex = new RegExp(`${label}\s*(.+?)(?=\n[A-Z]|$)`, 'i');
    const match = text.match(regex);
    return match ? match[1].trim() : '';
  }

  private extractMatchQuality(text: string): 'Strong' | 'Moderate' | 'Weak' {
    if (text.includes('✓ STRONG MATCH')) return 'Strong';
    if (text.includes('⚡ Moderate Match')) return 'Moderate';
    if (text.includes('⚠ Weak Match')) return 'Weak';
    return 'Moderate'; // Default
  }

  private extractListItems(text: string, sectionName: string): string[] {
    const sectionRegex = new RegExp(`${sectionName}([\s\S]*?)(?=\n[A-Z]|$)`, 'i');
    const sectionMatch = text.match(sectionRegex);
    
    if (!sectionMatch) return [];
    
    const items = sectionMatch[1].match(/^[-•]\s*(.+)$/gm);
    return items ? items.map(item => item.replace(/^[-•]\s*/, '').trim()) : [];
  }

  /**
   * 🎯 Determine status based on confidence
   */
  private determineStatus(confidence: number): 'success' | 'partial' | 'needs_more_data' {
    if (confidence >= 8) return 'success';
    if (confidence >= 6) return 'partial';
    return 'needs_more_data';
  }
}

/**
 * 🏭 Factory function to create Moonshot BTR Integration
 */
export function createMoonshotBTRIntegration(): MoonshotBTRIntegration {
  return new MoonshotBTRIntegration();
}
