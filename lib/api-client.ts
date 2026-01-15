/**
 * 🌟 API Client for Swiss Ephemeris Calculations
 * 
 * This client provides a clean interface for frontend components
 * to call server-side API routes for all Swiss Ephemeris calculations.
 * 
 * IMPORTANT: This file should ONLY be imported by frontend components.
 * It should NEVER import swisseph directly.
 */

export interface CalculateEphemerisRequest {
  date: string;
  latitude: number;
  longitude: number;
  timezone?: string;
  houseSystem?: string;
}

export interface CalculateEphemerisResponse {
  success: boolean;
  data?: any;
  error?: string;
}

export interface BTRCalculateRequest {
  birthData: {
    date: string;
    latitude: number;
    longitude: number;
    timezone?: string;
  };
  lifeEvents?: Array<{
    date: string;
    type: string;
    description: string;
  }>;
  uncertaintyMinutes?: number;
  slotInterval?: number;
}

/**
 * Calculate ephemeris data for a single birth time
 */
export async function calculateEphemeris(
  data: CalculateEphemerisRequest
): Promise<CalculateEphemerisResponse> {
  try {
    const response = await fetch('/api/swisseph-calculate', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        date: data.date,
        latitude: data.latitude,
        longitude: data.longitude,
        timezone: data.timezone || 'Asia/Kolkata',
        houseSystem: data.houseSystem || 'W',
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('❌ calculateEphemeris API call failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Calculate ephemeris for multiple time slots (for BTR analysis)
 */
export async function calculateEphemerisForTimeSlots(
  baseDate: string,
  latitude: number,
  longitude: number,
  timezone: string = 'Asia/Kolkata',
  uncertaintyMinutes: number = 120,
  slotInterval: number = 15
): Promise<CalculateEphemerisResponse> {
  try {
    const response = await fetch('/api/btr-calculate/time-slots', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        baseDate,
        latitude,
        longitude,
        timezone,
        uncertaintyMinutes,
        slotInterval,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('❌ calculateEphemerisForTimeSlots API call failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Perform complete BTR analysis
 */
export async function performBTRAnalysis(
  data: BTRCalculateRequest
): Promise<CalculateEphemerisResponse> {
  try {
    const response = await fetch('/api/btr-calculate/analyze', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('❌ performBTRAnalysis API call failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Simple calculation API for basic ephemeris data
 */
export async function calculateBasicEphemeris(
  date: string,
  latitude: number,
  longitude: number
): Promise<CalculateEphemerisResponse> {
  return calculateEphemeris({
    date,
    latitude,
    longitude,
    timezone: 'Asia/Kolkata',
    houseSystem: 'W',
  });
}