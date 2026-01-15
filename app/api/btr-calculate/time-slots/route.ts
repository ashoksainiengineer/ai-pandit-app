import { NextResponse } from 'next/server';
import { SwissEphemerisEngine } from '@/lib/swiss-ephemeris-engine';

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

    // Initialize engine
    const engine = new SwissEphemerisEngine('./ephe', false);
    await engine.initialize();

    // Calculate ephemeris for multiple time slots
    const result = await engine.calculateEphemerisForTimeSlots(
      new Date(baseDate),
      latitude,
      longitude,
      timezone,
      uncertaintyMinutes,
      slotInterval
    );

    console.log('✅ Time slots calculation successful:', result.timeSlots.length, 'slots generated');

    return NextResponse.json({
      success: true,
      data: result
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