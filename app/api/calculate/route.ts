import { NextRequest, NextResponse } from 'next/server';
import type { BirthData, PhysicalDescription, LifeEvent, CalculateResponse } from '@/types';
<<<<<<< HEAD
import { performRectification } from '@/lib/btr-engine';
=======
import { createMoonshotBTRIntegration } from '@/lib/moonshot-btr-integration-complete';
import { SwissEphemerisCalculator } from '@/lib/swiss-ephemeris-calculator';
import { validateBirthData, validateLifeEvents } from '@/lib/validators';
>>>>>>> 5eadd4e619d7a701a8ffa07edaf7842ed1140c17

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { birthData, physicalDescription, lifeEvents } = body as {
      birthData: BirthData;
      physicalDescription: PhysicalDescription;
      lifeEvents: LifeEvent[];
    };
    
<<<<<<< HEAD
    // Validate required fields
    if (!birthData.fullName || !birthData.dateOfBirth || !birthData.tentativeTime) {
      return NextResponse.json({
        success: false,
        error: 'Missing required birth data fields'
      } as CalculateResponse, { status: 400 });
    }
    
    if (!birthData.birthPlace) {
      return NextResponse.json({
        success: false,
        error: 'Birth place is required'
      } as CalculateResponse, { status: 400 });
    }
    
    if (lifeEvents.length < 3) {
      return NextResponse.json({
        success: false,
        error: 'At least 3 life events are required for accurate rectification'
      } as CalculateResponse, { status: 400 });
    }
    
    // Set default coordinates if not provided (can be improved with geocoding API)
    if (!birthData.latitude || !birthData.longitude) {
      // Default to Anand, Gujarat coordinates
      birthData.latitude = birthData.latitude || 22.5645;
      birthData.longitude = birthData.longitude || 72.9289;
    }
    
    // Set default timezone
    birthData.timezone = birthData.timezone || 'UTC+5:30';
    
    // Perform rectification
    const result = await performRectification(
      birthData as BirthData,
      physicalDescription as PhysicalDescription,
      lifeEvents
    );
=======
    // Comprehensive validation
    const birthValidation = validateBirthData(birthData);
    if (!birthValidation.isValid) {
      return NextResponse.json({
        success: false,
        error: 'Birth data validation failed',
        validationErrors: birthValidation.errors
      } as CalculateResponse, { status: 400 });
    }
    
    // Validate coordinates are provided (no more hardcoded defaults)
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
    
    // Initialize Swiss Ephemeris Calculator with proper configuration
    let swissEphemeris;
    try {
      console.log(`🔮 Initializing Swiss Ephemeris Calculator...`);
      swissEphemeris = new SwissEphemerisCalculator({
        ephemerisPath: './public/data/ephe',
        ayanamshaMode: 'kp',
        houseSystem: 'placidus',
        useTrueNodes: true,
        highPrecision: true
      });
      
      await swissEphemeris.initialize();
      console.log(`✅ Swiss Ephemeris initialized successfully`);
    } catch (ephemerisError) {
      console.error('❌ Swiss Ephemeris initialization failed:', ephemerisError);
      throw new Error(`Swiss Ephemeris initialization failed: ${ephemerisError instanceof Error ? ephemerisError.message : String(ephemerisError)}`);
    }
    
    // Initialize Moonshot AI BTR Integration
    let moonshotIntegration;
    try {
      console.log(`🤖 Initializing Moonshot AI BTR Integration...`);
      moonshotIntegration = createMoonshotBTRIntegration(
        'sk-kimi-jJJcpROckqHiBeDl0b08wcVapOsikhBjaILNt6kbdLG1nMl814vfvqAJJL7TV9qN',
        {
          model: 'kimi',
          temperature: 0.3,
          maxTokens: 4000,
          swissEphemerisConfig: {
            ephemerisPath: './public/data/ephe',
            ayanamshaMode: 'kp',
            houseSystem: 'placidus',
            useTrueNodes: true,
            highPrecision: true
          }
        }
      );
      
      await moonshotIntegration.initialize();
      console.log(`✅ Moonshot AI BTR Integration initialized successfully`);
    } catch (moonshotInitError) {
      console.error('❌ Moonshot AI BTR initialization failed:', moonshotInitError);
      throw new Error(`Moonshot AI initialization failed: ${moonshotInitError instanceof Error ? moonshotInitError.message : String(moonshotInitError)}`);
    }
    
    // Convert birth data to proper format for Moonshot AI
    let originalBirthTime: Date;
    try {
      // Parse the date and time properly
      const [year, month, day] = birthData.dateOfBirth.split('-').map(Number);
      const [hours, minutes] = birthData.tentativeTime.split(':').map(Number);
      
      // Create date with timezone consideration
      originalBirthTime = new Date(year, month - 1, day, hours, minutes, 0, 0);
      
      console.log(`📅 Parsed birth time: ${originalBirthTime?.toISOString() || 'Invalid date'}`);
      console.log(`📅 Date components: Year=${year}, Month=${month}, Day=${day}, Hour=${hours}, Minute=${minutes}`);
      
      if (isNaN(originalBirthTime.getTime())) {
        throw new Error('Invalid date/time combination');
      }
    } catch (dateError) {
      console.error('❌ Date parsing failed:', dateError);
      throw new Error(`Invalid birth date/time format: ${birthData.dateOfBirth} ${birthData.tentativeTime}`);
    }
    
    // Format life events for Moonshot AI
    const formattedLifeEvents = lifeEvents.map((event, index) => {
      try {
        console.log(`📅 Processing life event ${index + 1}: ${event.eventType} on ${event.eventDate}`);
        const eventDate = new Date(event.eventDate);
        
        if (isNaN(eventDate.getTime())) {
          throw new Error(`Invalid event date: ${event.eventDate}`);
        }
        
        return {
          eventType: event.eventType,
          date: eventDate,
          description: event.description || event.eventType,
          expectedPlanets: [], // Will be filled by AI analysis
          expectedHouses: [], // Will be filled by AI analysis
          expectedDasha: [], // Will be filled by AI analysis
          weight: event.importance === 'critical' ? 10 : event.importance === 'high' ? 8 : 6
        };
      } catch (eventError) {
        console.error(`❌ Failed to process life event ${index + 1}:`, eventError);
        throw new Error(`Life event ${index + 1} (${event.eventType}) has invalid date: ${event.eventDate}`);
      }
    });
    
    // Format physical characteristics
    const physicalCharacteristics = {
      bodyStructure: physicalDescription.bodyStructure,
      faceShape: physicalDescription.faceShape,
      complexion: physicalDescription.complexion,
      distinctiveFeatures: physicalDescription.distinctiveFeatures || ''
    };
    
    // Perform complete BTR with Moonshot AI and Swiss Ephemeris
    let moonshotResult;
    try {
      console.log(`🚀 Starting Moonshot AI BTR analysis...`);
      console.log(`📅 Original birth time: ${originalBirthTime?.toISOString() || 'Invalid date'}`);
      console.log(`📍 Location: ${birthData.latitude}, ${birthData.longitude}`);
      console.log(`🌍 Timezone: ${birthData.timezone}`);
      console.log(`📋 Life events: ${formattedLifeEvents.length} events`);
      console.log(`👤 Physical characteristics:`, physicalCharacteristics);
      
      moonshotResult = await moonshotIntegration.performBTRWithMoonshotAI(
        originalBirthTime,
        birthData.latitude,
        birthData.longitude,
        birthData.timezone,
        formattedLifeEvents,
        physicalCharacteristics
      );
      
      console.log(`✅ Moonshot AI analysis completed successfully`);
      console.log(`🎯 Final alignment score: ${moonshotResult.finalAlignmentScore || 0}%`);
      console.log(`🕐 Rectified time: ${moonshotResult.rectifiedTime?.toISOString() || 'Invalid date'}`);
      
    } catch (moonshotError) {
      console.error('❌ Moonshot AI BTR failed:', moonshotError);
      throw new Error(`BTR analysis failed: ${moonshotError instanceof Error ? moonshotError.message : String(moonshotError)}`);
    }
    
    // Convert Moonshot result to standard BTR format
    const result = {
      originalTime: birthData.tentativeTime,
      rectifiedTime: moonshotResult.rectifiedTime?.toTimeString().slice(0, 5) || 'Invalid time',
      adjustmentMinutes: moonshotResult.rectifiedTime ? Math.round((moonshotResult.rectifiedTime.getTime() - originalBirthTime.getTime()) / (1000 * 60)) : 0,
      confidenceScore: Math.round((moonshotResult.finalAlignmentScore || 0) / 10),
      confidenceLevel: moonshotResult.confidenceLevel,
      primaryMethod: 'Moonshot AI + Swiss Ephemeris + Event-Based Method (K.N. Rao)',
      methodsUsed: [
        'Moonshot AI Analysis',
        'Swiss Ephemeris Calculations',
        'Event-Based Method (K.N. Rao)',
        'Divisional Chart Analysis (D-1, D-9, D-10, D-60)',
        'Vimshottari Dasha Correlation',
        'Physical Characteristics Verification',
        'Tattwa Shodhana Method',
        'KP System Verification'
      ],
      eventAnalyses: moonshotResult.eventMatches.map((match, index) => ({
        event: {
          id: `event_${index}`,
          eventType: match.event.eventType,
          eventDate: match.event.date?.toISOString().split('T')[0] || 'Invalid date',
          category: 'personal',
          description: match.event.description || match.event.eventType,
          importance: match.event.weight >= 9 ? 'critical' : match.event.weight >= 7 ? 'high' : 'medium',
          dateAccuracy: 'exact'
        },
        dashaBhukti: 'Calculated by AI',
        relevantCharts: ['D-1', 'D-9'],
        matchQuality: match.matchScore >= 80 ? 'strong' : match.matchScore >= 60 ? 'moderate' : match.matchScore >= 40 ? 'weak' : 'mismatch',
        explanation: match.notes.join('. '),
        supportingFactors: [`AI Analysis Score: ${match.matchScore}%`],
        concerningFactors: match.matchScore < 60 ? ['Low AI confidence score'] : []
      })),
      physicalVerification: {
        matches: [`AI Analysis: ${moonshotResult.moonshotAnalysis.physicalCharacteristics.chartMatch}`],
        mismatches: [],
        overallMatch: moonshotResult.moonshotAnalysis.physicalCharacteristics.chartMatch.includes('Good') ? 'strong' : 'moderate'
      },
      rectifiedChart: moonshotResult.chartData,
      recommendations: [
        ...moonshotResult.moonshotAnalysis.finalAssessment.recommendations,
        'Use the rectified time for all future chart calculations and predictions',
        'Monitor upcoming events to validate the rectification',
        'Consider consulting with a professional Vedic astrologer for final verification'
      ],
      executiveSummary: moonshotResult.moonshotAnalysis.executiveSummary
    };
>>>>>>> 5eadd4e619d7a701a8ffa07edaf7842ed1140c17
    
    return NextResponse.json({
      success: true,
      result
    } as CalculateResponse);
    
  } catch (error) {
    console.error('Calculation error:', error);
<<<<<<< HEAD
    return NextResponse.json({
      success: false,
      error: 'An error occurred during calculation. Please try again.'
=======
    
    // Provide more specific error messages
    let errorMessage = 'An error occurred during calculation. Please try again.';
    
    if (error instanceof Error) {
      if (error.message.includes('date') || error.message.includes('time')) {
        errorMessage = 'Invalid date or time format. Please check your birth details.';
      } else if (error.message.includes('coordinate') || error.message.includes('latitude') || error.message.includes('longitude')) {
        errorMessage = 'Invalid location coordinates. Please check your birth place.';
      } else if (error.message.includes('ephemeris') || error.message.includes('calculation')) {
        errorMessage = 'Astronomical calculation error. Please verify your birth details are correct.';
      } else {
        errorMessage = error.message;
      }
    }
    
    return NextResponse.json({
      success: false,
      error: errorMessage
>>>>>>> 5eadd4e619d7a701a8ffa07edaf7842ed1140c17
    } as CalculateResponse, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Vedic BTR API - Use POST method to submit birth data for rectification',
    version: '1.0.0',
    endpoints: {
      POST: {
        description: 'Calculate birth time rectification',
        body: {
          birthData: 'BirthData object',
          physicalDescription: 'PhysicalDescription object',
          lifeEvents: 'Array of LifeEvent objects'
        }
      }
    }
  });
}
