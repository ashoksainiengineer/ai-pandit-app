import { NextResponse } from 'next/server';
import { SwissEphemerisEngine } from '@/lib/swiss-ephemeris-engine';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { date, latitude, longitude, timezone, houseSystem } = body;

    console.log('🧮 Swiss Ephemeris API Request:', { date, latitude, longitude });

    // Initialize engine
    const engine = new SwissEphemerisEngine('./ephe', false);
    await engine.initialize();

    // Calculate ephemeris
    const result = await engine.calculateEphemerisForBTR(
      new Date(date),
      latitude,
      longitude,
      timezone || 'Asia/Kolkata',
      houseSystem || 'W'
    );

    // Format response
    const response = {
      success: true,
      timestamp: result.timestamp.toISOString(),
      julianDay: result.julianDay,
      planets: result.planets,
      houseCusps: result.houseCusps,
      lunarPhase: result.lunarPhase,
      retrogradePlanets: result.retrogradePlanets,
      nakshatras: result.nakshatras,
      divisionalCharts: result.divisionalCharts,
      dashaPeriods: result.dashaPeriods
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ Swiss Ephemeris API Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: 'Failed to calculate ephemeris data'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Swiss Ephemeris API is running',
    usage: 'Send POST request with { date, latitude, longitude, timezone?, houseSystem? }'
  });
}