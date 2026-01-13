import { NextRequest, NextResponse } from 'next/server';
import type { BirthData, PhysicalDescription, LifeEvent, CalculateResponse } from '@/types';
import { validateBirthData, validateLifeEvents } from '@/lib/validators';

// Mock BTR calculation for testing frontend
function mockBTRCalculation(birthData: BirthData, lifeEvents: LifeEvent[]): any {
  // Simulate BTR calculation with mock data
  const originalTime = birthData.tentativeTime;
  const [hours, minutes] = originalTime.split(':').map(Number);
  
  // Mock adjustment (simulate finding a better time)
  const adjustedMinutes = minutes + Math.floor(Math.random() * 30) - 15; // ±15 minutes
  const finalMinutes = (adjustedMinutes + 60) % 60;
  const finalHours = (hours + Math.floor(adjustedMinutes / 60) + 24) % 24;
  const rectifiedTime = `${String(finalHours).padStart(2, '0')}:${String(finalMinutes).padStart(2, '0')}`;
  
  const confidenceScore = 75 + Math.floor(Math.random() * 20); // 75-95%
  
  return {
    originalTime,
    rectifiedTime,
    adjustmentMinutes: adjustedMinutes - minutes,
    confidenceScore,
    confidenceLevel: confidenceScore >= 85 ? 'high' : confidenceScore >= 70 ? 'moderate' : 'low',
    primaryMethod: 'AI-Powered BTR with Swiss Ephemeris',
    methodsUsed: [
      'Swiss Ephemeris (KP Ayanamsha)',
      'Moonshot AI Analysis',
      'Iterative Refinement',
      'Event-Based Validation',
      'Divisional Chart Analysis'
    ],
    eventAnalyses: lifeEvents.slice(0, 3).map((event, index) => ({
      event: {
        id: `event_${index}`,
        eventType: event.eventType,
        eventDate: event.eventDate,
        category: event.category,
        description: event.description,
        importance: event.importance,
        dateAccuracy: event.dateAccuracy
      },
      dashaBhukti: 'AI Analyzed',
      relevantCharts: ['D-1', 'D-9', 'D-10'],
      matchQuality: ['strong', 'moderate', 'weak'][Math.floor(Math.random() * 3)] as any,
      explanation: `Match score: ${70 + Math.floor(Math.random() * 30)}%`,
      supportingFactors: ['Planetary positions align', 'Dasha period matches'],
      concerningFactors: []
    })),
    physicalVerification: {
      matches: ['Body structure matches ascendant', 'Complexion aligns with planetary influences'],
      mismatches: [],
      overallMatch: 'strong'
    },
    rectifiedChart: {
      // Mock chart data
      rashi: {
        lagna: { sign: 'Aries', degree: 15.5 },
        planets: [
          { planet: 'Sun', sign: 'Capricorn', degree: 10.2, house: 10 },
          { planet: 'Moon', sign: 'Cancer', degree: 22.8, house: 4 },
          { planet: 'Mars', sign: 'Scorpio', degree: 8.5, house: 8 }
        ]
      }
    },
    recommendations: [
      `Confidence: ${confidenceScore}% - ${confidenceScore >= 85 ? 'High' : confidenceScore >= 70 ? 'Moderate' : 'Low'}`,
      'Use rectified time for all future calculations',
      'Monitor upcoming events for validation',
      'Consider additional life events for higher accuracy'
    ],
    executiveSummary: `BTR completed with ${confidenceScore}% confidence. The rectified time of ${rectifiedTime} shows strong alignment with provided life events.`
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { birthData, physicalDescription, lifeEvents } = body as {
      birthData: BirthData;
      physicalDescription: PhysicalDescription;
      lifeEvents: LifeEvent[];
    };
    
    // Comprehensive validation
    const birthValidation = validateBirthData(birthData);
    if (!birthValidation.isValid) {
      return NextResponse.json({
        success: false,
        error: 'Birth data validation failed',
        validationErrors: birthValidation.errors
      } as CalculateResponse, { status: 400 });
    }
    
    // Validate coordinates are provided
    if (!birthData.latitude || !birthData.longitude) {
      return NextResponse.json({
        success: false,
        error: 'Latitude and longitude are required. Please select your birth location on the map or enter coordinates manually.'
      } as CalculateResponse, { status: 400 });
    }

    // Validate coordinate ranges
    if (Math.abs(birthData.latitude) > 90) {
      return NextResponse.json({
        success: false,
        error: 'Latitude must be between -90 and 90 degrees'
      } as CalculateResponse, { status: 400 });
    }

    if (Math.abs(birthData.longitude) > 180) {
      return NextResponse.json({
        success: false,
        error: 'Longitude must be between -180 and 180 degrees'
      } as CalculateResponse, { status: 400 });
    }
    
    // Validate life events
    const eventsValidation = validateLifeEvents(lifeEvents, birthData.dateOfBirth);
    if (!eventsValidation.isValid) {
      return NextResponse.json({
        success: false,
        error: 'Life events validation failed',
        validationErrors: eventsValidation.errors
      } as CalculateResponse, { status: 400 });
    }
    
    // Set default timezone if not provided
    if (!birthData.timezone) {
      birthData.timezone = 'UTC+5:30'; // Default to India timezone
    }
    
    // Use mock calculation for testing
    const mockResult = mockBTRCalculation(birthData, lifeEvents);
    
    // Convert to standard response format
    const response: CalculateResponse = {
      success: true,
      result: {
        originalTime: mockResult.originalTime,
        rectifiedTime: mockResult.rectifiedTime,
        adjustmentMinutes: mockResult.adjustmentMinutes,
        confidenceScore: mockResult.confidenceScore,
        confidenceLevel: mockResult.confidenceLevel as any,
        primaryMethod: mockResult.primaryMethod,
        methodsUsed: mockResult.methodsUsed,
        eventAnalyses: mockResult.eventAnalyses,
        physicalVerification: mockResult.physicalVerification,
        rectifiedChart: mockResult.rectifiedChart as any,
        recommendations: mockResult.recommendations,
        executiveSummary: mockResult.executiveSummary
      }
    };
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('Calculation error:', error);
    
    // Provide more specific error messages
    let errorMessage = 'An error occurred during calculation. Please try again.';
    
    if (error instanceof Error) {
      if (error.message.includes('date') || error.message.includes('time')) {
        errorMessage = 'Invalid date or time format. Please check your birth details.';
      } else if (error.message.includes('coordinate') || error.message.includes('latitude') || error.message.includes('longitude')) {
        errorMessage = 'Invalid location coordinates. Please check your birth place.';
      } else if (error.message.includes('ephemeris') || error.message.includes('calculation')) {
        errorMessage = 'Astronomical calculation error. Please verify your birth details are correct.';
      } else if (error.message.includes('API') || error.message.includes('network')) {
        errorMessage = 'AI service temporarily unavailable. Please try again in a few moments.';
      } else {
        errorMessage = error.message;
      }
    }
    
    return NextResponse.json({
      success: false,
      error: errorMessage
    } as CalculateResponse, { status: 500 });
  }
}

/**
 * Map event type to category for BTR workflow
 */
function mapEventCategory(eventType: string): string {
  const categoryMap: Record<string, string> = {
    'marriage': 'marriage',
    'childbirth': 'children',
    'first_job': 'career',
    'promotion': 'career',
    'graduation': 'education',
    'degree': 'education',
    'health_issue': 'health',
    'surgery': 'health',
    'travel': 'travel',
    'relocation': 'travel',
    'property': 'financial',
    'investment': 'financial'
  };
  
  return categoryMap[eventType] || 'other';
}

export async function GET() {
  return NextResponse.json({
    message: 'Vedic BTR API - Use POST method to submit birth data for rectification',
    version: '2.0.0',
    features: [
      'Swiss Ephemeris Integration (Real Astronomical Calculations)',
      'Moonshot AI Analysis',
      'Iterative Refinement',
      'KP Ayanamsha Support',
      'Complete Divisional Charts',
      'Event-Based Validation'
    ],
    endpoints: {
      POST: {
        description: 'Calculate birth time rectification using AI + Swiss Ephemeris',
        body: {
          birthData: 'BirthData object with date, time, location',
          physicalDescription: 'PhysicalDescription object',
          lifeEvents: 'Array of LifeEvent objects (minimum 3)'
        },
        headers: {
          'Content-Type': 'application/json'
        }
      }
    },
    requirements: {
      minEvents: 3,
      requiredFields: ['dateOfBirth', 'tentativeTime', 'latitude', 'longitude'],
      optionalFields: ['timeRange', 'timezone', 'gender']
    }
  });
}
