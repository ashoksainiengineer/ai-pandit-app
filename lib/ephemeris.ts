import { EphemerisData, PlanetPosition, HousePosition } from './types';

const ZODIAC_SIGNS = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
];

const NAKSHATRAS = [
  'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashirsha', 'Ardra', 'Punarvasu', 'Pushya', 'Ashlesha',
  'Magha', 'Purva Phalguni', 'Uttara Phalguni', 'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha',
  'Mula', 'Purva Ashadha', 'Uttara Ashadha', 'Shravana', 'Dhanishtha', 'Shatabhisha', 'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati'
];

const SIGN_LORDS: Record<string, string> = {
  Aries: 'Mars',
  Taurus: 'Venus',
  Gemini: 'Mercury',
  Cancer: 'Moon',
  Leo: 'Sun',
  Virgo: 'Mercury',
  Libra: 'Venus',
  Scorpio: 'Mars',
  Sagittarius: 'Jupiter',
  Capricorn: 'Saturn',
  Aquarius: 'Saturn',
  Pisces: 'Jupiter'
};

// Comprehensive timezone offsets (hours from UTC)
const TIMEZONE_OFFSETS: Record<string, number> = {
  // Indian Subcontinent
  'Asia/Kolkata': 5.5,
  'Asia/Colombo': 5.5,
  'Asia/Kathmandu': 5.75,
  'Asia/Dhaka': 6,
  'Asia/Karachi': 5,

  // Southeast Asia
  'Asia/Bangkok': 7,
  'Asia/Singapore': 8,
  'Asia/Jakarta': 7,
  'Asia/Manila': 8,
  'Asia/Kuala_Lumpur': 8,

  // East Asia
  'Asia/Tokyo': 9,
  'Asia/Seoul': 9,
  'Asia/Shanghai': 8,
  'Asia/Hong_Kong': 8,
  'Asia/Taipei': 8,

  // Middle East
  'Asia/Dubai': 4,
  'Asia/Riyadh': 3,
  'Asia/Tehran': 3.5,
  'Asia/Jerusalem': 2,

  // Europe
  'Europe/London': 0,
  'Europe/Paris': 1,
  'Europe/Berlin': 1,
  'Europe/Rome': 1,
  'Europe/Moscow': 3,
  'Europe/Amsterdam': 1,

  // Americas
  'America/New_York': -5,
  'America/Chicago': -6,
  'America/Denver': -7,
  'America/Los_Angeles': -8,
  'America/Toronto': -5,
  'America/Vancouver': -8,
  'America/Mexico_City': -6,
  'America/Sao_Paulo': -3,

  // Pacific
  'Australia/Sydney': 10,
  'Australia/Melbourne': 10,
  'Australia/Perth': 8,
  'Pacific/Auckland': 12,
  'Pacific/Fiji': 12,

  // Africa
  'Africa/Cairo': 2,
  'Africa/Johannesburg': 2,
  'Africa/Lagos': 1,

  // Standard zones
  'UTC': 0,
  'GMT': 0,
};

/**
 * Parse timezone string to offset in hours
 * Supports: named zones, numeric offsets, +HH:MM format
 */
function parseTimezoneOffset(timezone: string): number {
  // Check if it's a named timezone
  if (TIMEZONE_OFFSETS[timezone] !== undefined) {
    return TIMEZONE_OFFSETS[timezone];
  }

  // Check if it's a numeric offset (e.g., "5.5", "-8")
  if (/^[+-]?\d+(\.\d+)?$/.test(timezone)) {
    return parseFloat(timezone);
  }

  // Check if it's +HH:MM or -HH:MM format
  const hmMatch = timezone.match(/^([+-])?(\d{1,2}):(\d{2})$/);
  if (hmMatch) {
    const sign = hmMatch[1] === '-' ? -1 : 1;
    const hours = parseInt(hmMatch[2]);
    const minutes = parseInt(hmMatch[3]);
    return sign * (hours + minutes / 60);
  }

  // Default to UTC
  console.warn(`Unknown timezone: ${timezone}, defaulting to UTC`);
  return 0;
}

export function convertToUTC(date: string, time: string, timezone: string): Date {
  try {
    const [year, month, day] = date.split('-').map(Number);
    const timeParts = time.split(':').map(Number);
    const hour = timeParts[0] || 0;
    const minute = timeParts[1] || 0;
    const second = timeParts[2] || 0;
    const localDate = new Date(year, month - 1, day, hour, minute, second);

    const offset = parseTimezoneOffset(timezone);
    const utcDate = new Date(localDate.getTime() - offset * 3600000);
    return utcDate;
  } catch (error) {
    console.error('Error converting to UTC:', error);
    throw new Error('Invalid date or time format');
  }
}

export function calculateJulianDay(date: Date): number {
  const a = Math.floor((14 - (date.getMonth() + 1)) / 12);
  const y = date.getFullYear() + 4800 - a;
  const m = (date.getMonth() + 1) + 12 * a - 3;
  const jd = date.getDate() + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
  const time = (date.getHours() - 12) / 24 + date.getMinutes() / 1440 + date.getSeconds() / 86400;
  return jd + time;
}

export function getZodiacSign(longitude: number): string {
  const index = Math.floor(longitude / 30) % 12;
  return ZODIAC_SIGNS[index];
}

export function getNakshatra(longitude: number): string {
  const index = Math.floor(longitude / (360 / 27)) % 27;
  return NAKSHATRAS[index];
}

function calculateSunLongitude(jd: number): number {
  const T = (jd - 2451545.0) / 36525;
  const L0 = 280.46646 + 36000.76983 * T + 0.0003032 * T * T;
  const M = 357.52911 + 35999.05029 * T - 0.0001537 * T * T;
  const C = (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(M * Math.PI / 180) +
    (0.019993 - 0.000101 * T) * Math.sin(2 * M * Math.PI / 180) +
    0.000289 * Math.sin(3 * M * Math.PI / 180);
  return (L0 + C) % 360;
}

function calculateMoonLongitude(jd: number): number {
  const T = (jd - 2451545.0) / 36525;
  const L0 = 218.3164477 + 481267.88123421 * T - 0.0015786 * T * T + T * T * T / 538841 - T * T * T * T / 65194000;
  const D = 297.8501921 + 445267.1114034 * T - 0.0018819 * T * T + T * T * T / 545868 - T * T * T * T / 113065000;
  const M = 134.9633964 + 477198.8675055 * T + 0.0087972 * T * T + T * T * T / 69699 + T * T * T * T / 14712000;
  const F = 93.2720950 + 483202.0175233 * T - 0.0036539 * T * T - T * T * T / 3526000 + T * T * T * T / 863310000;

  const sigmaL = 6288774 * Math.sin((M) * Math.PI / 180) +
    1274027 * Math.sin((2 * D - M) * Math.PI / 180) +
    658314 * Math.sin((2 * D) * Math.PI / 180) +
    213618 * Math.sin((2 * M) * Math.PI / 180) +
    -185116 * Math.sin((M) * Math.PI / 180) * Math.cos((F) * Math.PI / 180) / 1000000; // Approximate

  return (L0 + sigmaL / 1000000) % 360;
}

// Simplified functions for other planets - using mean longitudes for approximation
function calculateMercuryLongitude(jd: number): number {
  const T = (jd - 2451545.0) / 36525;
  return (252.250906 + 149472.6746358 * T - 0.00000535 * T * T) % 360;
}

function calculateVenusLongitude(jd: number): number {
  const T = (jd - 2451545.0) / 36525;
  return (181.979801 + 58517.8156748 * T + 0.00000165 * T * T) % 360;
}

function calculateMarsLongitude(jd: number): number {
  const T = (jd - 2451545.0) / 36525;
  return (355.433275 + 19140.2993313 * T + 0.00000261 * T * T) % 360;
}

function calculateJupiterLongitude(jd: number): number {
  const T = (jd - 2451545.0) / 36525;
  return (34.351484 + 3034.9056746 * T - 0.00008501 * T * T) % 360;
}

function calculateSaturnLongitude(jd: number): number {
  const T = (jd - 2451545.0) / 36525;
  return (50.077471 + 1222.1137943 * T + 0.00021004 * T * T) % 360;
}

function calculateRahuLongitude(jd: number): number {
  // Rahu is North Node, moves retrograde
  const T = (jd - 2451545.0) / 36525;
  return (125.044555 - 1934.1361849 * T + 0.0020762 * T * T) % 360;
}

function calculateKetuLongitude(rahuLongitude: number): number {
  return (rahuLongitude + 180) % 360;
}

function isRetrograde(planet: string, jd: number): boolean {
  // Simplified: only outer planets are retrograde sometimes
  // For accuracy, would need speed calculations
  return ['saturn', 'jupiter', 'mars', 'rahu'].includes(planet.toLowerCase());
}

function calculateAscendant(jd: number, latitude: number, longitude: number): { sign: string; degree: number; nakshatra: string; longitude: number } {
  // Simplified ascendant calculation using RAMC
  const T = (jd - 2451545.0) / 36525;
  const GMST = 18.697374558 + 8640184.812866 * T / 3600 + 0.093104 * T * T - 0.0000062 * T * T * T;
  const LST = (GMST + longitude / 15) % 24;
  const RAMC = LST * 15;
  const obliquity = 23.439281 - 0.0000004 * T;
  const ascendant = Math.atan2(-Math.cos(RAMC * Math.PI / 180), Math.sin(RAMC * Math.PI / 180) * Math.cos(obliquity * Math.PI / 180) - Math.tan(latitude * Math.PI / 180) * Math.sin(obliquity * Math.PI / 180)) * 180 / Math.PI;
  const ascLongitude = (ascendant + 360) % 360;
  const sign = getZodiacSign(ascLongitude);
  const degree = ascLongitude % 30;
  const nakshatra = getNakshatra(ascLongitude);
  return { longitude: ascLongitude, sign, degree, nakshatra };
}

function calculateHouses(ascendantLongitude: number, latitude: number): HousePosition[] {
  // Simplified equal house system for demonstration
  // For Placidus, would need more complex calculations
  const houses: HousePosition[] = [];
  for (let i = 0; i < 12; i++) {
    const cusp = (ascendantLongitude + i * 30) % 360;
    houses.push({
      houseNumber: i + 1,
      sign: getZodiacSign(cusp),
      degree: cusp % 30,
      cusp
    });
  }
  return houses;
}

export async function calculateEphemeris(
  birthDate: string,
  birthTime: string,
  latitude: number,
  longitude: number,
  timezone: string
): Promise<EphemerisData> {
  try {
    // Validate inputs
    if (latitude < -90 || latitude > 90) throw new Error('Invalid latitude');
    if (longitude < -180 || longitude > 180) throw new Error('Invalid longitude');

    const utcDate = convertToUTC(birthDate, birthTime, timezone);
    const jd = calculateJulianDay(utcDate);

    // Calculate planetary positions
    const sunLong = calculateSunLongitude(jd);
    const moonLong = calculateMoonLongitude(jd);
    const mercuryLong = calculateMercuryLongitude(jd);
    const venusLong = calculateVenusLongitude(jd);
    const marsLong = calculateMarsLongitude(jd);
    const jupiterLong = calculateJupiterLongitude(jd);
    const saturnLong = calculateSaturnLongitude(jd);
    const rahuLong = calculateRahuLongitude(jd);
    const ketuLong = calculateKetuLongitude(rahuLong);

    const planetLongitudes = {
      sun: sunLong,
      moon: moonLong,
      mercury: mercuryLong,
      venus: venusLong,
      mars: marsLong,
      jupiter: jupiterLong,
      saturn: saturnLong,
      rahu: rahuLong,
      ketu: ketuLong
    };

    const planets: Record<string, PlanetPosition> = {};
    for (const [planet, long] of Object.entries(planetLongitudes)) {
      const sign = getZodiacSign(long);
      const degree = long % 30;
      const nakshatra = getNakshatra(long);
      const lord = SIGN_LORDS[sign];
      const retro = isRetrograde(planet, jd);
      planets[planet as keyof typeof planets] = { sign, degree, longitude: long, nakshatra, lord, retro };
    }

    const ascendant = calculateAscendant(jd, latitude, longitude);
    const houses = calculateHouses(ascendant.longitude, latitude);

    return {
      planets: planets as any,
      ascendant,
      houses
    };
  } catch (error) {
    console.error('Error calculating ephemeris:', error);
    throw new Error('Failed to calculate ephemeris data');
  }
}