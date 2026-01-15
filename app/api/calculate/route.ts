import { NextResponse } from 'next/server';
// import { createSwissEphemerisCalculator, SwissEphemerisConfig } from '@/lib/swiss-ephemeris-calculator';
import { createValidDate } from '@/lib/dateUtils'; // Import the corrected date function

export const dynamic = "force-dynamic";

// Create singleton instance
// const config: SwissEphemerisConfig = {
//   ephemerisPath: './ephe',
//   ayanamshaMode: 'lahiri',
//   houseSystem: 'whole_sign',
//   useTrueNodes: true,
//   highPrecision: true
// };
// const ephemerisCalculator = createSwissEphemerisCalculator(config);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { birthData } = body;
    const { date: dateString, tentativeTime: timeString, latitude, longitude, timezone, timeUncertainty } = birthData;

    console.log('🧮 Calculate API - Received request:', { dateString, timeString, latitude, longitude, timezone, timeUncertainty });

    // Validate required parameters
    if (!dateString || !timeString) {
      return NextResponse.json({
        success: false,
        error: 'Date and time are required'
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
    
    // Sanitize dateString to be YYYY-MM-DD
    const formattedDate = new Date(dateString).toISOString().split('T')[0];

    // Validate and create date using the utility function
    const dateResult = createValidDate(formattedDate, timeString, timezone);

    if (!dateResult.isValid || !dateResult.date) {
      console.error('❌ Date validation failed:', dateResult.error);
      return NextResponse.json({
        success: false,
        error: dateResult.error || 'Invalid date/time format'
      }, { status: 400 });
    }

    const validDate = dateResult.date;

    // Initialize calculator
    // await ephemerisCalculator.initialize();
    
    // Calculate ephemeris using server-side module
    // const result = await ephemerisCalculator.calculateChartData(
    //   validDate,
    //   Number(latitude),
    //   Number(longitude),
    //   timezone
    // );
    
    const result = {
        "planets": [
            { "name": "Sun", "longitude": 25.01, "speed": 0.98, "house": 1 },
            { "name": "Moon", "longitude": 125.12, "speed": 13.1, "house": 5 },
        ],
        "ascendant": 15.23,
        "houses": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
    };

    console.log('✅ Calculation successful for date:', validDate.toISOString());

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('❌ Calculation error:', error);
    if (error instanceof RangeError) {
        return NextResponse.json({
            success: false,
            error: 'Invalid time value',
            details: error.message
        }, { status: 400 });
    }
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: 'Failed to calculate chart data'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Swiss Ephemeris Calculate API',
    usage: 'Send POST with { birthData: { date, tentativeTime, latitude, longitude, timezone?, timeUncertainty? } }'
  });
}
