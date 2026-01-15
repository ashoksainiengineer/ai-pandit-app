import { NextResponse } from 'next/server';
import { SwissEphemerisServer } from '@/lib/swiss-ephemeris-server';

// Create singleton instance
const ephemerisServer = new SwissEphemerisServer('./ephe');

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { date, latitude, longitude, timezone = 'Asia/Kolkata' } = body;

    console.log('🧮 Calculate API - Received request:', { date, latitude, longitude });

    // Calculate ephemeris using server-side module
    const result = await ephemerisServer.calculateEphemeris(
      new Date(date),
      latitude,
      longitude
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
