import { NextResponse } from 'next/server';
import { createSwissEphemerisCalculator, SwissEphemerisConfig } from '@/lib/swiss-ephemeris-calculator';

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      baseDate,
      latitude,
      longitude,
      timezone = 'Asia/Kolkata',
      uncertaintyMinutes = 120,
      slotInterval = 15
    } = body;

    console.log('🧮 BTR Time Slots API - Received request:', {
      baseDate,
      latitude,
      longitude,
      uncertaintyMinutes,
      slotInterval
    });

    // Validate required parameters
    if (!baseDate) {
      return NextResponse.json({
        success: false,
        error: 'baseDate parameter is required'
      }, { status: 400 });
    }

    if (latitude === undefined || latitude === null || isNaN(Number(latitude))) {
      return NextResponse.json({
        success: false,
        error: 'Valid latitude is required'
      }, { status: 400 });
    }

    if (longitude === undefined || longitude === null || isNaN(Number(longitude))) {
      return NextResponse.json({
        success: false,
        error: 'Valid longitude is required'
      }, { status: 400 });
    }

    // Validate and create base date
    let validBaseDate: Date;
    try {
      validBaseDate = new Date(baseDate);
      if (isNaN(validBaseDate.getTime())) {
        throw new Error(`Invalid baseDate format: ${baseDate}`);
      }
    } catch (dateError) {
      console.error('❌ Base date validation failed:', dateError);
      return NextResponse.json({
        success: false,
        error: `Invalid baseDate format. Expected ISO string or valid Date input. Received: ${baseDate}`
      }, { status: 400 });
    }

    // Initialize calculator
    const config: SwissEphemerisConfig = {
      ephemerisPath: './ephe',
      ayanamshaMode: 'lahiri',
      houseSystem: 'whole_sign',
      useTrueNodes: true,
      highPrecision: true
    };
    const calculator = createSwissEphemerisCalculator(config);
    await calculator.initialize();

    // Calculate ephemeris for multiple time slots
    const timeSlots = [];
    const startTime = new Date(validBaseDate.getTime() - uncertaintyMinutes * 60000);
    const endTime = new Date(validBaseDate.getTime() + uncertaintyMinutes * 60000);
    
    console.log(`🕐 Calculating time slots from ${startTime.toISOString()} to ${endTime.toISOString()} at ${slotInterval} minute intervals`);
    
    let currentTime = new Date(startTime);
    let slotCount = 0;
    
    while (currentTime <= endTime) {
      try {
        const result = await calculator.calculateChartData(
          currentTime,
          Number(latitude),
          Number(longitude),
          timezone
        );
        timeSlots.push(result);
        slotCount++;
        
        if (slotCount % 10 === 0) {
          console.log(`📝 Processed ${slotCount} time slots...`);
        }
      } catch (calcError) {
        console.error(`❌ Error calculating chart for time ${currentTime.toISOString()}:`, calcError);
        // Continue with next time slot instead of failing completely
      }
      
      currentTime = new Date(currentTime.getTime() + slotInterval * 60000);
    }

    console.log(`✅ Time slots calculation successful: ${timeSlots.length} slots generated out of ${slotCount} attempted`);

    if (timeSlots.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No valid time slots could be calculated',
        details: 'All time slot calculations failed'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: { timeSlots }
    });

  } catch (error) {
    console.error('❌ Time slots calculation error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: 'Failed to calculate time slots'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'BTR Time Slots API',
    usage: 'Send POST with { baseDate, latitude, longitude, timezone?, uncertaintyMinutes?, slotInterval? }'
  });
}