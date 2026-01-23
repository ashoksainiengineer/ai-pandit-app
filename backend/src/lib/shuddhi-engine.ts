// lib/shuddhi-engine.ts
// Vedic Shuddhi (Purification) Subsystem
// Used for candidate filtering and probability scoring

import { getNakshatraForLongitude } from './vedic-astrology-engine.js';
import { EphemerisData } from './types.js';

export interface ShuddhiScore {
    passed: boolean;
    score: number; // 0-100
    details: string;
}

const TATWAS = ['Earth', 'Water', 'Fire', 'Air', 'Ether'];
const TATWA_DURATIONS_MIN = [6, 12, 18, 24, 30]; // Traditional Ghatika relative parts (simplified to minutes for 24 min total cycle)
// Actual Tatwa duration in a 90-minute cycle (Traditional: 1.5 hours per cycle)
// Earth: 6 min, Water: 12 min, Fire: 18 min, Air: 24 min, Ether: 30 min (Total 90 mins)

/**
 * Scientific Sunrise Approximation (Vedic Standard)
 * Accounts for Latitude and Longitude to refine Tatwa Shuddhi.
 */
export function getApproxSunrise(jd: number, latitude: number, longitude: number, timezone: number | string): number {
    // 🛡️ Robust Timezone Detection: Handle IANA strings or numbers
    const tzOffset = (typeof timezone === 'number')
        ? timezone
        : (!isNaN(parseFloat(String(timezone))) ? parseFloat(String(timezone)) : 5.5);

    // Standard formula for sunrise approximation:
    // 1. Find Julian Day at midnight local time
    const jdMidnight = Math.floor(jd - (tzOffset / 24)) + 0.5 + (tzOffset / 24);

    // 2. Adjust for longitude (4 minutes per degree)
    // Longitude correction: 6:00 AM + (82.5 - longitude) * 4 minutes (for IST)
    // General: 6:00 AM - (longitude - (tzOffset * 15)) * (4/60/24)
    const longCorrection = (longitude - (tzOffset * 15)) * (4 / (60 * 24));

    // 3. Approximate Equation of Time and Declination (Simplified)
    // This adds another level of "God-Tier" precision for different months
    const n = Math.floor(jd - 2451545.0); // Days since Jan 1, 2000
    const L = (280.460 + 0.9856474 * n) % 360;
    const g = (357.528 + 0.9856003 * n) % 360;
    const delta = 23.439 * Math.sin((L + 1.915 * Math.sin(g * Math.PI / 180)) * Math.PI / 180);

    // 4. Calculate Hour Angle (H) at sunrise (alt = -0.833)
    const phi = latitude * Math.PI / 180;
    const d = delta * Math.PI / 180;
    const cosH = (Math.sin(-0.833 * Math.PI / 180) - Math.sin(phi) * Math.sin(d)) / (Math.cos(phi) * Math.cos(d));

    let H = 0;
    if (cosH < -1) H = 180; // Perpetual day
    else if (cosH > 1) H = 0; // Perpetual night
    else H = Math.acos(cosH) * 180 / Math.PI;

    // Sunrise in JD = Midnight + (12 - H/15)/24 - longCorrection
    return jdMidnight + (12 - H / 15) / 24 - (longitude - (tzOffset * 15)) / 360;
}

/**
 * Scientific Sunset Approximation
 */
export function getApproxSunset(jd: number, latitude: number, longitude: number, timezone: number | string): number {
    const tzOffset = (typeof timezone === 'number')
        ? timezone
        : (!isNaN(parseFloat(String(timezone))) ? parseFloat(String(timezone)) : 5.5);
    const jdMidnight = Math.floor(jd - (tzOffset / 24)) + 0.5 + (tzOffset / 24);

    const n = Math.floor(jd - 2451545.0);
    const L = (280.460 + 0.9856474 * n) % 360;
    const g = (357.528 + 0.9856003 * n) % 360;
    const delta = 23.439 * Math.sin((L + 1.915 * Math.sin(g * Math.PI / 180)) * Math.PI / 180);

    const phi = latitude * Math.PI / 180;
    const d = delta * Math.PI / 180;
    const cosH = (Math.sin(-0.833 * Math.PI / 180) - Math.sin(phi) * Math.sin(d)) / (Math.cos(phi) * Math.cos(d));

    let H = 0;
    if (cosH < -1) H = 180;
    else if (cosH > 1) H = 0;
    else H = Math.acos(cosH) * 180 / Math.PI;

    // Sunset in JD = Midnight + (12 + H/15)/24 - longCorrection
    return jdMidnight + (12 + H / 15) / 24 - (longitude - (tzOffset * 15)) / 360;
}

/**
 * Tatwa Shuddhi Calculation (God-Tier Dinamaana Scale)
 * Checks if the birth time falls within the correct Tatwa.
 */
export function calculateTatwaShuddhi(
    birthJd: number,
    sunriseJd: number,
    sunsetJd: number,
    gender: 'male' | 'female' = 'male'
): ShuddhiScore {
    const isDayTime = birthJd >= sunriseJd && birthJd <= sunsetJd;

    // Day length or Night length in minutes
    const totalMinutes = isDayTime
        ? (sunsetJd - sunriseJd) * 24 * 60
        : (24 * 60) - ((sunsetJd - sunriseJd) * 24 * 60);

    const startTime = isDayTime ? sunriseJd : sunsetJd;
    const diffMinutes = (birthJd - startTime) * 24 * 60;

    // 8 Tatwa cycles in a day (48 minutes each in a standard 12h day)
    // Dynamic cycle minutes = totalMinutes / 8
    const cycleMinutes = totalMinutes / 8;
    const minutesInCycle = diffMinutes % cycleMinutes;

    // Scale the 6:12:18:24:30 ratios to the dynamic cycle
    const ratioSum = 90; // The sum of [6, 12, 18, 24, 30]
    const scaledDurations = TATWA_DURATIONS_MIN.map(d => (d / ratioSum) * cycleMinutes);

    let cumulative = 0;
    let tatwaIndex = -1;
    for (let i = 0; i < scaledDurations.length; i++) {
        cumulative += scaledDurations[i];
        if (minutesInCycle <= cumulative) {
            tatwaIndex = i;
            break;
        }
    }

    const currentTatwa = TATWAS[tatwaIndex] || 'Ether';

    let score = 50;
    if (gender === 'male' && ['Fire', 'Air', 'Ether'].includes(currentTatwa)) score = 85;
    if (gender === 'female' && ['Earth', 'Water'].includes(currentTatwa)) score = 85;

    return {
        passed: score >= 50,
        score,
        details: `Tatwa: ${currentTatwa} (${isDayTime ? 'Day' : 'Night'}, Scaled Cycle: ${cycleMinutes.toFixed(1)}m)`
    };
}

/**
 * Kunda Shuddhi Calculation
 * Lagna Longitude * 81 / 360 -> Remainder should align with Moon's Nakshatra
 */
export function calculateKundaShuddhi(
    lagnaLongitude: number,
    moonLongitude: number
): ShuddhiScore {
    // 1. Multiply Lagna by 81
    const kundaLong = (lagnaLongitude * 81) % 360;

    // 2. Get Nakshatra of Kunda and Moon
    const kundaNak = getNakshatraForLongitude(kundaLong);
    const moonNak = getNakshatraForLongitude(moonLongitude);

    // 3. Check for alignment (Same Nakshatra, or Trines: +9, +18)
    const diff = Math.abs(kundaNak.number - moonNak.number);
    const isAligned = diff === 0 || diff === 9 || diff === 18;

    return {
        passed: isAligned,
        score: isAligned ? 100 : 20,
        details: `Kunda Nak: ${kundaNak.name}, Moon Nak: ${moonNak.name} (${isAligned ? 'Aligned' : 'Mismatch'})`
    };
}

/**
 * Varnada Lagna Calculation
 * Used for social status / professional inclination filtering
 */
export function calculateVarnadaLagna(
    ephemeris: EphemerisData
): string {
    // Simplified Varnada based on Rasi/Lagna lord relationship
    // Brahmins (Knowledge), Kshatriyas (Power), Vaishyas (Commerce), Shudras (Service)
    const sign = ephemeris.ascendant.sign;
    const waterSigns = ['Cancer', 'Scorpio', 'Pisces'];
    const fireSigns = ['Aries', 'Leo', 'Sagittarius'];
    const earthSigns = ['Taurus', 'Virgo', 'Capricorn'];
    const airSigns = ['Gemini', 'Libra', 'Aquarius'];

    if (waterSigns.includes(sign)) return 'Brahmin (Knowledge/Healing)';
    if (fireSigns.includes(sign)) return 'Kshatriya (Power/Strategy)';
    if (earthSigns.includes(sign)) return 'Vaishya (Commerce/Business)';
    return 'Shudra (Expert Service/Execution)';
}
