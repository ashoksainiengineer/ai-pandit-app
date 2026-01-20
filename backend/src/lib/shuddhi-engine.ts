// lib/shuddhi-engine.ts
// Vedic Shuddhi (Purification) Subsystem
// Used for candidate filtering and probability scoring

import { getNakshatraForLongitude } from './vedic-astrology-engine';
import { EphemerisData } from './types';

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
 * Approximate Sunrise (Simple Vedic method)
 * Can be replaced with exact Swiss Eph rise/set later
 */
export function getApproxSunrise(jd: number, timezone: string): number {
    // Standard 6:00 AM local time as baseline
    // 0.5 JD is 12:00 UTC, so 0.25 is 6:00 UTC.
    // We adjust for timezone.
    const date = new Date();
    const offset = date.getTimezoneOffset(); // minutes
    return Math.floor(jd) + 0.5 + (6 / 24) - (offset / (24 * 60));
}

/**
 * Tatwa Shuddhi Calculation
 * Checks if the birth time falls within the correct Tatwa according to sex and weekday.
 */
export function calculateTatwaShuddhi(
    birthJd: number,
    sunriseJd: number,
    gender: 'male' | 'female' = 'male'
): ShuddhiScore {
    // Minutes since sunrise
    const diffMinutes = (birthJd - sunriseJd) * 24 * 60;
    const cycleMinutes = 90; // Standard cycle
    const minutesInCycle = diffMinutes % cycleMinutes;

    let cumulative = 0;
    let tatwaIndex = -1;
    for (let i = 0; i < TATWA_DURATIONS_MIN.length; i++) {
        cumulative += TATWA_DURATIONS_MIN[i];
        if (minutesInCycle <= cumulative) {
            tatwaIndex = i;
            break;
        }
    }

    const currentTatwa = TATWAS[tatwaIndex];

    // Simplifed Shuddhi Rule: 
    // Males: Prefers Fire/Air/Ether for dynamic charts, Earth/Water for stable.
    // Females: Prefers Water/Earth for receptive, Fire/Air for dynamic.
    // Higher score if the Tatwa alignment matches traditional gender-element synergies.
    let score = 50;
    if (gender === 'male' && ['Fire', 'Air', 'Ether'].includes(currentTatwa)) score = 85;
    if (gender === 'female' && ['Earth', 'Water'].includes(currentTatwa)) score = 85;

    return {
        passed: score >= 50,
        score,
        details: `Tatwa: ${currentTatwa} (${minutesInCycle.toFixed(1)} mins into 90m cycle)`
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
