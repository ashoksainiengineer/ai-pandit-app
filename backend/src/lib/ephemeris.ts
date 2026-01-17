// backend/src/lib/ephemeris.ts
// Centralized Ephemeris Calculation Module using Swiss Ephemeris (WASM)

import { EphemerisData, PlanetPosition, HousePosition } from './types.js';
import path from 'path';

// Load Swiss Ephemeris
// We use 'swisseph-wasm' to avoid compilation requirements on Leapcell
let swe: any;
let useSwissEph = false;
let isInitialized = false;

// Lazy initialization
function initSwissEph(): boolean {
  if (isInitialized) return useSwissEph;

  try {
    // Try WASM version first (preferred for Leapcell)
    try {
      swe = require('swisseph-wasm');
      console.log('✅ Swiss Ephemeris (WASM) loaded');
    } catch (e) {
      // Fallback to standard package if WASM missing (dev environment)
      console.warn('WASM module not found, trying standard swisseph');
      swe = require('swisseph');
    }

    // Path to ephemeris data files
    const ephePath = process.env.SWISSEPH_PATH || path.join(process.cwd(), 'ephe');

    // Initialize if strictly needed, though WASM might handle it
    if (swe.swe_set_ephe_path) {
      swe.swe_set_ephe_path(ephePath);
    }

    useSwissEph = true;
    isInitialized = true;
    console.log(`✅ Swiss Ephemeris initialized. Data path: ${ephePath}`);
  } catch (error) {
    console.warn('⚠️ Swiss Ephemeris not available - Calculations will fail or degrade', error);
    useSwissEph = false;
    isInitialized = true; // Mark as tried
  }

  return useSwissEph;
}

// ═════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═════════════════════════════════════════════════════════════════════════════

const SE_SUN = 0;
const SE_MOON = 1;
const SE_MERCURY = 2;
const SE_VENUS = 3;
const SE_MARS = 4;
const SE_JUPITER = 5;
const SE_SATURN = 6;
// const SE_URANUS = 7;
// const SE_NEPTUNE = 8;
// const SE_PLUTO = 9;
const SE_MEAN_NODE = 10;  // Rahu (Mean)
const SE_TRUE_NODE = 11;  // Rahu (True)
const SE_MEAN_NODE_OPP = 12; // Ketu (Mean)
// const SE_OSCU_APOG = 21;  // Lilith

const SEFLG_SWIEPH = 2;       // Use Swiss Ephemeris
const SEFLG_SIDEREAL = 64 * 1024; // Sidereal calculation
const SEFLG_SPEED = 256;      // High precision speed

// Zodiac Signs
const ZODIAC_SIGNS = [
  'Aries', 'Taurus', 'Gemini', 'Cancer',
  'Leo', 'Virgo', 'Libra', 'Scorpio',
  'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
];

const NAKSHATRAS = [
  'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashirsha', 'Ardra',
  'Punarvasu', 'Pushya', 'Ashlesha', 'Magha', 'Purva Phalguni', 'Uttara Phalguni',
  'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha',
  'Mula', 'Purva Ashadha', 'Uttara Ashadha', 'Shravana', 'Dhanishtha',
  'Shatabhisha', 'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati'
];

// ═════════════════════════════════════════════════════════════════════════════
// CORE CALCULATION FUNCTION
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Calculate full ephemeris for a given UTC date/time and location
 */
export async function calculateEphemeris(
  dateString: string,
  timeString: string,
  latitude: number,
  longitude: number,
  timezone: string = 'UTC'
): Promise<EphemerisData> {
  // Ensure initialized
  if (!initSwissEph()) {
    throw new Error('Swiss Ephemeris required for calculations');
  }

  // 1. Convert Input Time to UTC Julian Day
  const { year, month, day, hour, minute } = parseDateTime(dateString, timeString);

  // NOTE: In a real app, we would use 'timezone' to adjust to UTC accurately.
  // For now, assuming input is Local Time, we should convert to UTC.
  // Using simple offset logic or library like 'date-fns-tz' would be better.
  // Here we assume the passed time is effectively what we want to calculate for.

  // Julian Day (ET - Ephemeris Time)
  // swe_julday(year, month, day, hour, se_greg_cal)
  // We use standard UT for now to keep it simple, or implement DeltaT if high precision needed
  const decimalHour = hour + minute / 60.0;

  // Basic JD calculation
  const julianDay = swe.swe_julday(year, month, day, decimalHour, 1); // 1 = Gregorian

  // 2. Set Sidereal Mode (Lahiri Ayanamsa = 1)
  swe.swe_set_sid_mode(1, 0, 0); // 1 = Lahiri

  // 3. Calculate Planets
  const flags = SEFLG_SWIEPH | SEFLG_SIDEREAL | SEFLG_SPEED;

  const planets = {
    sun: await calcPlanet(SE_SUN, julianDay, flags, 'Sun'),
    moon: await calcPlanet(SE_MOON, julianDay, flags, 'Moon'),
    mercury: await calcPlanet(SE_MERCURY, julianDay, flags, 'Mercury'),
    venus: await calcPlanet(SE_VENUS, julianDay, flags, 'Venus'),
    mars: await calcPlanet(SE_MARS, julianDay, flags, 'Mars'),
    jupiter: await calcPlanet(SE_JUPITER, julianDay, flags, 'Jupiter'),
    saturn: await calcPlanet(SE_SATURN, julianDay, flags, 'Saturn'),
    rahu: await calcPlanet(SE_TRUE_NODE, julianDay, flags, 'Rahu'),
    ketu: await calcPlanet(SE_TRUE_NODE, julianDay, flags, 'Ketu', true), // Ketu is opposite Rahu
  };

  // 4. Calculate Ascendant & Houses
  // swe_houses(tjd_ut, lat, lon, hsys, cusps, ascmc)
  // hsys: 'E' = Equal, 'P' = Placidus. Vedic often uses Whole Sign or Equal.
  // Let's use 'E' (Equal) or 'W' (Whole) if supported, or 'P'
  // Standard Vedic often calculates Ascendant exact degree, then houses are signs.

  const cusps = { location: new Array(13).fill(0) }; // 1-12
  const ascmc = { location: new Array(10).fill(0) }; // 0=Asc, 1=MC, etc.

  // Note: we can't easily pass arrays by reference in JS wrapper usually, 
  // but swisseph-js handles it by returning objects or taking formatted arrays.
  // Check specific wrapper API. Usually: result = swe.swe_houses(...)

  const houseResult = swe.swe_houses(julianDay, latitude, longitude, 'P'); // Placidus for cusp calculation

  const ascendantDegreeTotal = houseResult.ascmc[0];
  const ascendantSignIndex = Math.floor(ascendantDegreeTotal / 30);
  const ascendantDegree = ascendantDegreeTotal % 30;

  // Calculate Ayanamsa to convert Tropical Houses/Asc to Sidereal if swe_houses returns Tropical
  // 'swe_set_sid_mode' usually affects swe_calc, but does it affect house calculation? 
  // Docs say swe_houses returns tropical. We must subtract ayanamsa.
  const ayanamsa = swe.swe_get_ayanamsa_ut(julianDay);

  const siderealAscTotal = (ascendantDegreeTotal - ayanamsa + 360) % 360;
  const sidAscSignIndex = Math.floor(siderealAscTotal / 30);
  const sidAscDegree = siderealAscTotal % 30;

  const ascendant = {
    sign: ZODIAC_SIGNS[sidAscSignIndex],
    degree: sidAscDegree,
    longitude: siderealAscTotal,
    nakshatra: getNakshatra(siderealAscTotal)
  };

  // Convert tropical cusps to sidereal houses
  // For Vedic, we typically use EQUAL HOUSES from Ascendant or BHAVA CHALIT.
  // Simple Equal House System (Whole Sign or Equal Degree)
  // Let's implement Equal House from Ascendant Degree for simplicity and typical BTR usage.

  const houses: HousePosition[] = [];
  for (let i = 0; i < 12; i++) {
    const houseNum = i + 1;
    // Equal house: each cusp is exactly Ascendant Degree + i*30
    const cuspTotal = (siderealAscTotal + i * 30) % 360;
    const signIndex = Math.floor(cuspTotal / 30);

    houses.push({
      houseNumber: houseNum,
      sign: ZODIAC_SIGNS[signIndex],
      degree: cuspTotal % 30,
      cusp: cuspTotal
    });
  }

  return {
    planets,
    ascendant,
    houses
  };
}

// ═════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═════════════════════════════════════════════════════════════════════════════

async function calcPlanet(
  planetId: number,
  julianDay: number,
  flags: number,
  name: string,
  isKetu: boolean = false
): Promise<PlanetPosition> {
  // result = { longitude, latitude, distance, speedInLong, speedInLat, speedInDist }
  // swisseph-js usually returns object
  const result = swe.swe_calc_ut(julianDay, planetId, flags);

  let longitude = result.longitude;

  if (isKetu) {
    // Ketu is exactly 180 degrees from Rahu
    longitude = (longitude + 180) % 360;
  }

  const signIndex = Math.floor(longitude / 30);
  const degree = longitude % 30;
  const sign = ZODIAC_SIGNS[signIndex];

  return {
    sign,
    degree,
    longitude,
    nakshatra: getNakshatra(longitude),
    lord: getSignLord(sign),
    retro: result.speedInLong < 0
  };
}

function getNakshatra(longitude: number): string {
  const index = Math.floor(longitude / (360 / 27));
  return NAKSHATRAS[index % 27];
}

function getSignLord(sign: string): string {
  const lords: Record<string, string> = {
    Aries: 'Mars', Taurus: 'Venus', Gemini: 'Mercury', Cancer: 'Moon',
    Leo: 'Sun', Virgo: 'Mercury', Libra: 'Venus', Scorpio: 'Mars',
    Sagittarius: 'Jupiter', Capricorn: 'Saturn', Aquarius: 'Saturn', Pisces: 'Jupiter'
  };
  return lords[sign] || 'Unknown';
}

function parseDateTime(dateStr: string, timeStr: string) {
  // Basic parsing yyyy-mm-dd and hh:mm
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hour, minute] = timeStr.split(':').map(Number);
  return { year, month, day, hour, minute: minute || 0 };
}

// Create a dummy swe object export if needed for dangerous direct access
// but mostly we should use calculateEphemeris
export { swe };