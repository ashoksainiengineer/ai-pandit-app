import { NextRequest, NextResponse } from 'next/server';
import type { BirthData, PhysicalDescription, LifeEvent, CalculateResponse } from '@/types';
import { createBTRWorkflow, BTRWorkflowRequest } from '@/lib/btr-workflow';
import { validateBirthData, validateLifeEvents } from '@/lib/validators';

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
    
    // Initialize BTR Workflow with Moonshot AI
    const moonshotApiKey = process.env.MOONSHOT_API_KEY || 'sk-kimi-jJJcpROckqHiBeDl0b08wcVapOsikhBjaILNt6kbdLG1nMl814vfvqAJJL7TV9qN';
    
    const btrWorkflow = createBTRWorkflow({
      moonshotApiKey: moonshotApiKey,
      ephemerisPath: './public/data/ephe',
      useKPSystem: true,
      maxIterations: 30,
      convergenceThreshold: 85
    });
    
    // Initialize the workflow
    await btrWorkflow.initialize();
    
    // Prepare request for BTR workflow
    const workflowRequest: BTRWorkflowRequest = {
      birthDetails: {
        date: birthData.dateOfBirth,
        tentativeTime: birthData.tentativeTime,
        timeRange: (birthData as any).timeRange || '±2 hours',
        place: birthData.birthPlace || 'Unknown',
        latitude: birthData.latitude,
        longitude: birthData.longitude,
        timezone: birthData.timezone,
        gender: (birthData.gender || 'Male') as 'Male' | 'Female'
      },
      physicalCharacteristics: {
        bodyStructure: physicalDescription.bodyStructure,
        faceShape: physicalDescription.faceShape,
        complexion: physicalDescription.complexion,
        distinctiveFeatures: physicalDescription.distinctiveFeatures || ''
      },
      lifeEvents: lifeEvents.map(event => ({
        type: event.eventType,
        date: event.eventDate,
        description: event.description || event.eventType,
        category: mapEventCategory(event.eventType) as any
      }))
    };
    
    // Execute complete BTR workflow
    console.log('🚀 Starting complete BTR workflow...');
    const result = await btrWorkflow.execute(workflowRequest);
    
    // Convert to standard response format
    const response: CalculateResponse = {
      success: true,
      result: {
        originalTime: result.originalBirthTime,
        rectifiedTime: result.rectifiedBirthTime,
        adjustmentMinutes: result.technicalDetails.timeAdjustmentMinutes,
        confidenceScore: Math.round(result.confidenceLevel / 10),
        confidenceLevel: result.confidenceCategory as any,
        primaryMethod: 'AI-Powered BTR with Swiss Ephemeris',
        methodsUsed: [
          'Swiss Ephemeris (KP Ayanamsha)',
          'Moonshot AI Analysis',
          'Iterative Refinement',
          'Event-Based Validation',
          'Divisional Chart Analysis'
        ],
        eventAnalyses: result.eventMatches.map((match, index) => ({
          event: {
            id: `event_${index}`,
            eventType: match.event,
            eventDate: match.date,
            category: 'personal' as any,
            description: match.event,
            importance: match.matchQuality === 'Strong' ? 'critical' : match.matchQuality === 'Moderate' ? 'high' : 'medium',
            dateAccuracy: 'exact'
          },
          dashaBhukti: 'AI Analyzed',
          relevantCharts: ['D-1', 'D-9', 'D-10'],
          matchQuality: match.matchQuality.toLowerCase() as any,
          explanation: `Match score: ${match.matchScore}%`,
          supportingFactors: [`AI Confidence: ${match.matchScore}%`],
          concerningFactors: match.matchQuality === 'Weak' ? ['Low match confidence'] : []
        })),
        physicalVerification: {
          matches: [`AI Analysis: ${result.confidenceCategory} confidence`],
          mismatches: [],
          overallMatch: result.confidenceCategory === 'very_high' || result.confidenceCategory === 'high' ? 'strong' : 'moderate'
        },
        rectifiedChart: result.chartData as any,
        recommendations: [
          `Confidence: ${result.confidenceLevel}% - ${result.confidenceCategory}`,
          `Alignment Score: ${result.alignmentScore.toFixed(1)}%`,
          'Use rectified time for all future calculations',
          'Monitor upcoming events for validation'
        ],
        executiveSummary: result.aiAnalysis.executiveSummary || `BTR completed with ${result.confidenceLevel}% confidence`
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
