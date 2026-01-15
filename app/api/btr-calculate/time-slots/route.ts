import { NextResponse } from 'next/server';
import { createSwissEphemerisCalculator, SwissEphemerisConfig } from '@/lib/swiss-ephemeris-calculator';

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
    // Note: The calculator doesn't have a direct time slots method, so we'll simulate it
    const timeSlots = [];
    const startTime = new Date(new Date(baseDate).getTime() - uncertaintyMinutes * 60000);
    const endTime = new Date(new Date(baseDate).getTime() + uncertaintyMinutes * 60000);
    
    let currentTime = new Date(startTime);
    while (currentTime <= endTime) {
      const result = await calculator.calculateChartData(
        currentTime,
        latitude,
        longitude,
        timezone
      );
      timeSlots.push(result);
      currentTime = new Date(currentTime.getTime() + slotInterval * 60000);
    }

    console.log('✅ Time slots calculation successful:', timeSlots.length, 'slots generated');

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