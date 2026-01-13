import { NextRequest, NextResponse } from 'next/server';
import type { BirthData, PhysicalDescription, LifeEvent, CalculateResponse } from '@/types';
import { performRectification } from '@/lib/btr-engine';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { birthData, physicalDescription, lifeEvents } = body as {
      birthData: BirthData;
      physicalDescription: PhysicalDescription;
      lifeEvents: LifeEvent[];
    };
    
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
    
    return NextResponse.json({
      success: true,
      result
    } as CalculateResponse);
    
  } catch (error) {
    console.error('Calculation error:', error);
    return NextResponse.json({
      success: false,
      error: 'An error occurred during calculation. Please try again.'
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
