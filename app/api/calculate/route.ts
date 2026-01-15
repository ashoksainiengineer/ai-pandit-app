import { NextResponse } from 'next/server';
import { createSwissEphemerisCalculator, SwissEphemerisConfig } from '@/lib/swiss-ephemeris-calculator';

// Create singleton instance
const config: SwissEphemerisConfig = {
  ephemerisPath: './ephe',
  ayanamshaMode: 'lahiri',
  houseSystem: 'whole_sign',
  useTrueNodes: true,
  highPrecision: true
};
const ephemerisCalculator = createSwissEphemerisCalculator(config);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { date, latitude, longitude, timezone = 'Asia/Kolkata' } = body;

    console.log('🧮 Calculate API - Received request:', { date, latitude, longitude });

    // Initialize calculator
    await ephemerisCalculator.initialize();
    
    // Calculate ephemeris using server-side module
    const result = await ephemerisCalculator.calculateChartData(
      new Date(date),
      latitude,
      longitude,
      timezone
    );

    console.log('✅ Calculation successful');

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('❌ Calculation error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Swiss Ephemeris Calculate API',
    usage: 'Send POST with { date, latitude, longitude, timezone? }'
  });
}
