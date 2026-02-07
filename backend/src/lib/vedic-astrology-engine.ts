'use client';

import { getAyanamsa } from './ephemeris.js';

// ═════════════════════════════════════════════════════════════════════════════

// Vimshottari Dasha periods (in years)
export const DASHA_YEARS: Record<string, number> = {
    Ketu: 7,
    Venus: 20,
    Sun: 6,
    Moon: 10,
    Mars: 7,
    Rahu: 18,
    Jupiter: 16,
    Saturn: 19,
    Mercury: 17,
};

// Total Vimshottari cycle = 120 years
const TOTAL_DASHA_YEARS = 120;

// Nakshatra lords in Vimshottari sequence
const NAKSHATRA_LORDS = [
    'Ketu',    // 1. Ashwini
    'Venus',   // 2. Bharani
    'Sun',     // 3. Krittika
    'Moon',    // 4. Rohini
    'Mars',    // 5. Mrigashirsha
    'Rahu',    // 6. Ardra
    'Jupiter', // 7. Punarvasu
    'Saturn',  // 8. Pushya
    'Mercury', // 9. Ashlesha
    'Ketu',    // 10. Magha
    'Venus',   // 11. Purva Phalguni
    'Sun',     // 12. Uttara Phalguni
    'Moon',    // 13. Hasta
    'Mars',    // 14. Chitra
    'Rahu',    // 15. Swati
    'Jupiter', // 16. Vishakha
    'Saturn',  // 17. Anuradha
    'Mercury', // 18. Jyeshtha
    'Ketu',    // 19. Mula
    'Venus',   // 20. Purva Ashadha
    'Sun',     // 21. Uttara Ashadha
    'Moon',    // 22. Shravana
    'Mars',    // 23. Dhanishtha
    'Rahu',    // 24. Shatabhisha
    'Jupiter', // 25. Purva Bhadrapada
    'Saturn',  // 26. Uttara Bhadrapada
    'Mercury', // 27. Revati
];

// Dasha sequence (order of planetary periods)
const DASHA_SEQUENCE = [
    'Ketu', 'Venus', 'Sun', 'Moon', 'Mars',
    'Rahu', 'Jupiter', 'Saturn', 'Mercury'
];

const NAKSHATRA_NAMES = [
    'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashirsha', 'Ardra', 'Punarvasu', 'Pushya', 'Ashlesha',
    'Magha', 'Purva Phalguni', 'Uttara Phalguni', 'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha',
    'Mula', 'Purva Ashadha', 'Uttara Ashadha', 'Shravana', 'Dhanishtha', 'Shatabhisha', 'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati'
];

// Nakshatra span in degrees
const NAKSHATRA_SPAN = 360 / 27; // 13.333...°

// ═════════════════════════════════════════════════════════════════════════════
// DASHA TYPES (PATCHED FOR NULL SAFETY)
// ═════════════════════════════════════════════════════════════════════════════

export interface DashaPeriod {
    lord: string;
    startDate: Date;
    endDate: Date;
    durationYears: number;
    subPeriods: DashaPeriod[]; // Recursive for infinite depth
}

export interface DashaAtDate {
    mahadasha: string;
    antardasha: string;
    pratyantardasha: string;
    sukshmadasha: string;
    pranadasha: string;
    mahadashaStart: Date;
    mahadashaEnd: Date;
    antardashaStart: Date | null;
    antardashaEnd: Date | null;
    pratyantarStart: Date | null;
    pratyantarEnd: Date | null;
    sukshmaStart: Date | null;
    sukshmaEnd: Date | null;
    pranaStart: Date | null;
    pranaEnd: Date | null;
    sandhiInfo?: {
        isNearTransition: boolean;
        level: number; // 1-5 which level transition
        distanceMinutes: number;
        transitionType: 'start' | 'end';
    };
}

// ═════════════════════════════════════════════════════════════════════════════
// VIMSHOTTARI DASHA CALCULATION (PATCHED AND HARDENED)
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Calculate complete Vimshottari Dasha sequence from birth
 */
export function calculateVimshottariDasha(
    moonLongitude: number, // Sidereal longitude of Moon
    birthDate: Date,
    maxLevel: number = 5 // Allow engine-level throttling for memory safety
): DashaPeriod[] {
    const nakshatraIndex = Math.floor(moonLongitude / NAKSHATRA_SPAN);
    const birthNakshatraLord = NAKSHATRA_LORDS[nakshatraIndex];
    const positionInNakshatra = (moonLongitude % NAKSHATRA_SPAN) / NAKSHATRA_SPAN;
    const birthDashaYears = DASHA_YEARS[birthNakshatraLord];
    const remainingYears = birthDashaYears - (positionInNakshatra * birthDashaYears);

    const periods: DashaPeriod[] = [];
    let currentDate = new Date(birthDate);
    let dashaIndex = DASHA_SEQUENCE.indexOf(birthNakshatraLord);

    const firstEndDate = addYears(currentDate, remainingYears);
    periods.push({
        lord: birthNakshatraLord,
        startDate: new Date(currentDate),
        endDate: firstEndDate,
        durationYears: remainingYears,
        subPeriods: calculateSubDashas(birthNakshatraLord, currentDate, firstEndDate, maxLevel, positionInNakshatra),
    });
    currentDate = firstEndDate;
    dashaIndex = (dashaIndex + 1) % 9;

    // Remaining full periods (1 full cycle)
    for (let i = 0; i < 9; i++) {
        const lord = DASHA_SEQUENCE[dashaIndex];
        if (lord === birthNakshatraLord) {
            dashaIndex = (dashaIndex + 1) % 9;
            continue;
        }
        const years = DASHA_YEARS[lord];
        const endDate = addYears(currentDate, years);

        periods.push({
            lord,
            startDate: new Date(currentDate),
            endDate,
            durationYears: years,
            subPeriods: calculateSubDashas(lord, currentDate, endDate, maxLevel, 0),
        });

        currentDate = endDate;
        dashaIndex = (dashaIndex + 1) % 9;
    }

    return periods;
}

/**
 * Generic Recursive Sub-Dasha Calculation for Antar, Pratyantar, etc.
 */
function calculateSubDashas(
    parentLord: string,
    startDate: Date,
    endDate: Date,
    maxLevel: number,
    startOffset: number = 0, // 0-1, amount of the first period already elapsed
    currentLevel: number = 2
): DashaPeriod[] {
    if (currentLevel > maxLevel) return [];

    const totalDurationMs = endDate.getTime() - startDate.getTime();
    const subPeriods: DashaPeriod[] = [];
    let currentDate = new Date(startDate);
    let startIndex = DASHA_SEQUENCE.indexOf(parentLord);

    for (let i = 0; i < 9; i++) {
        const lord = DASHA_SEQUENCE[(startIndex + i) % 9];
        const proportion = DASHA_YEARS[lord] / TOTAL_DASHA_YEARS;
        let subDurationMs = totalDurationMs * proportion;

        if (i === 0 && startOffset > 0) {
            subDurationMs *= (1 - startOffset);
        }

        if (subDurationMs < 1) continue;

        const subEndDate = new Date(currentDate.getTime() + subDurationMs);
        subPeriods.push({
            lord,
            startDate: new Date(currentDate),
            endDate: subEndDate,
            durationYears: subDurationMs / (365.25 * 24 * 60 * 60 * 1000),
            subPeriods: calculateSubDashas(lord, currentDate, subEndDate, maxLevel, 0, currentLevel + 1)
        });
        currentDate = subEndDate;
    }

    return subPeriods;
}

/**
 * Get Dasha active on a specific date (5 levels deep)
 * PATCHED: Replaced placeholder new Date() with null for data integrity.
 */
export function getDashaForDate(
    periods: DashaPeriod[],
    eventDate: Date
): DashaAtDate | null {
    for (const maha of periods) {
        if (eventDate >= maha.startDate && eventDate <= maha.endDate) {
            for (const antar of maha.subPeriods) {
                if (eventDate >= antar.startDate && eventDate <= antar.endDate) {
                    for (const prat of antar.subPeriods) {
                        if (eventDate >= prat.startDate && eventDate <= prat.endDate) {
                            for (const suksh of prat.subPeriods) {
                                if (eventDate >= suksh.startDate && eventDate <= suksh.endDate) {
                                    for (const prana of suksh.subPeriods) {
                                        if (eventDate >= prana.startDate && eventDate <= prana.endDate) {
                                            const dasha: DashaAtDate = {
                                                mahadasha: maha.lord, antardasha: antar.lord, pratyantardasha: prat.lord, sukshmadasha: suksh.lord, pranadasha: prana.lord,
                                                mahadashaStart: maha.startDate, mahadashaEnd: maha.endDate,
                                                antardashaStart: antar.startDate, antardashaEnd: antar.endDate,
                                                pratyantarStart: prat.startDate, pratyantarEnd: prat.endDate,
                                                sukshmaStart: suksh.startDate, sukshmaEnd: suksh.endDate,
                                                pranaStart: prana.startDate, pranaEnd: prana.endDate
                                            };
                                            dasha.sandhiInfo = calculateDashaSandhi(dasha, eventDate);
                                            return dasha;
                                        }
                                    }
                                    return { // Fallback to Level 4
                                        mahadasha: maha.lord, antardasha: antar.lord, pratyantardasha: prat.lord, sukshmadasha: suksh.lord, pranadasha: 'Unknown',
                                        mahadashaStart: maha.startDate, mahadashaEnd: maha.endDate, antardashaStart: antar.startDate, antardashaEnd: antar.endDate,
                                        pratyantarStart: prat.startDate, pratyantarEnd: prat.endDate, sukshmaStart: suksh.startDate, sukshmaEnd: suksh.endDate,
                                        pranaStart: null, pranaEnd: null
                                    };
                                }
                            }
                            return { // Fallback to Level 3
                                mahadasha: maha.lord, antardasha: antar.lord, pratyantardasha: prat.lord, sukshmadasha: 'Unknown', pranadasha: 'Unknown',
                                mahadashaStart: maha.startDate, mahadashaEnd: maha.endDate, antardashaStart: antar.startDate, antardashaEnd: antar.endDate,
                                pratyantarStart: prat.startDate, pratyantarEnd: prat.endDate, sukshmaStart: null, sukshmaEnd: null, pranaStart: null, pranaEnd: null
                            };
                        }
                    }
                    return { // Fallback to Level 2
                        mahadasha: maha.lord, antardasha: antar.lord, pratyantardasha: 'Unknown', sukshmadasha: 'Unknown', pranadasha: 'Unknown',
                        mahadashaStart: maha.startDate, mahadashaEnd: maha.endDate, antardashaStart: antar.startDate, antardashaEnd: antar.endDate,
                        pratyantarStart: null, pratyantarEnd: null, sukshmaStart: null, sukshmaEnd: null, pranaStart: null, pranaEnd: null
                    };
                }
            }
            return { // Fallback to Level 1
                mahadasha: maha.lord, antardasha: 'Unknown', pratyantardasha: 'Unknown', sukshmadasha: 'Unknown', pranadasha: 'Unknown',
                mahadashaStart: maha.startDate, mahadashaEnd: maha.endDate,
                antardashaStart: null, antardashaEnd: null, pratyantarStart: null, pratyantarEnd: null, sukshmaStart: null, sukshmaEnd: null, pranaStart: null, pranaEnd: null
            };
        }
    }
    return null;
}

/**
 * Detect Dasha Sandhi (Transition twilight)
 * HARDENED: Now null-safe. It only considers levels with valid date ranges.
 */
function calculateDashaSandhi(dasha: DashaAtDate, date: Date): DashaAtDate['sandhiInfo'] {
    const time = date.getTime();

    const potentialTransitions = [
        { start: dasha.mahadashaStart, end: dasha.mahadashaEnd, level: 1 },
        { start: dasha.antardashaStart, end: dasha.antardashaEnd, level: 2 },
        { start: dasha.pratyantarStart, end: dasha.pratyantarEnd, level: 3 },
        { start: dasha.sukshmaStart, end: dasha.sukshmaEnd, level: 4 },
        { start: dasha.pranaStart, end: dasha.pranaEnd, level: 5 }
    ];

    // Filter out levels with null dates to prevent runtime errors
    const transitions = potentialTransitions
        .filter(t => t.start && t.end)
        .map(t => ({ start: t.start!.getTime(), end: t.end!.getTime(), level: t.level }));

    for (const t of transitions) {
        const startDiff = Math.abs(time - t.start) / 60000; // in minutes
        const endDiff = Math.abs(time - t.end) / 60000; // in minutes

        const threshold = [43200, 10080, 2880, 720, 60][t.level - 1] || 60;

        if (startDiff < threshold) {
            return { isNearTransition: true, level: t.level, distanceMinutes: startDiff, transitionType: 'start' };
        }
        if (endDiff < threshold) {
            return { isNearTransition: true, level: t.level, distanceMinutes: endDiff, transitionType: 'end' };
        }
    }

    return undefined;
}


/**
 * Format dasha for a specific date for the AI prompt.
 * HARDENED: Uses a string builder and checks for null dates.
 */
export function formatDashaForDate(
    periods: DashaPeriod[],
    date: Date,
    eventDescription: string
): string {
    const dasha = getDashaForDate(periods, date);

    if (!dasha) {
        return `${formatDate(date)}: Dasha calculation out of range.`;
    }

    const lines = [
        `${formatDate(date)} - ${eventDescription}`,
        `  Mahadasha: ${dasha.mahadasha} (${formatDate(dasha.mahadashaStart)} to ${formatDate(dasha.mahadashaEnd)})`
    ];

    if (dasha.antardasha !== 'Unknown' && dasha.antardashaStart && dasha.antardashaEnd) {
        lines.push(`  Antardasha: ${dasha.antardasha} (${formatDate(dasha.antardashaStart)} to ${formatDate(dasha.antardashaEnd)})`);
    }
    if (dasha.pratyantardasha !== 'Unknown' && dasha.pratyantarStart && dasha.pratyantarEnd) {
        lines.push(`  Pratyantardasha: ${dasha.pratyantardasha} (${formatDate(dasha.pratyantarStart)} to ${formatDate(dasha.pratyantarEnd)})`);
    }

    return lines.join('\n');
}


// ═════════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═════════════════════════════════════════════════════════════════════════════

function addYears(date: Date, years: number): Date {
    const result = new Date(date);
    result.setTime(result.getTime() + years * 365.25 * 24 * 60 * 60 * 1000);
    return result;
}

function formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
}

// ═════════════════════════════════════════════════════════════════════════════
// FINAL CORRECTED PLACEHOLDER FUNCTIONS (STUBS FOR BUILD VERIFICATION)
// These functions are placeholders with corrected signatures to fix the backend build.
// They do not contain real implementation logic.
// ═════════════════════════════════════════════════════════════════════════════

export const calculateAllVargas = (chart: any): any => {
    console.log('calculateAllVargas called with:', chart);
    return { D1: {}, D9: {}, D10: {} };
};

export const calculateAshtakavarga = (planets: any): any => {
    console.log('calculateAshtakavarga called with:', planets);
    return { aries: 0, taurus: 0, gemini: 0, cancer: 0, leo: 0, virgo: 0, libra: 0, scorpio: 0, sagittarius: 0, capricorn: 0, aquarius: 0, pisces: 0 };
};

export const calculateShadbala = (planets: any): any => {
    console.log('calculateShadbala called with:', planets);
    return { Sun: 0, Moon: 0, Mars: 0, Mercury: 0, Jupiter: 0, Venus: 0, Saturn: 0 };
};

export const detectYogas = (arg1: any, arg2?: any, arg3?: any, arg4?: any): any[] => {
    console.log('detectYogas called with:', arg1, arg2, arg3, arg4);
    return [];
};

export const calculateArudhas = (chart: any): any => {
    console.log('calculateArudhas called with:', chart);
    return {};
};

export const calculatePanchanga = (timestamp: number, latitude: number, longitude: number): any => {
    console.log('calculatePanchanga called with:', timestamp, latitude, longitude);
    return {};
};

export const calculateVimsopakaBala = (chart: any): any => {
    console.log('calculateVimsopakaBala called with:', chart);
    return {};
};

export const detectBhavaChalitDiscrepancy = (d1Chart: any): any[] => {
    console.log('detectBhavaChalitDiscrepancy called with:', d1Chart);
    return [];
};

export const getD60Deity = (longitude: number): string => {
    console.log('getD60Deity called with:', longitude);
    return 'Unknown';
};

export const calculateHouse = (longitude: number, houseCusps: number[]): number => {
    console.log('calculateHouse called with:', longitude, houseCusps);
    return 1;
};

export const getDignity = (planet: any, chart: any): string => {
    console.log('getDignity called with:', planet, chart);
    return 'Neutral';
};

export const calculateFunctionalNature = (planet: any, ascendantSign: string): { role: string; reason: string; } => {
    console.log('calculateFunctionalNature called with:', planet, ascendantSign);
    return { role: 'Neutral', reason: 'Placeholder implementation' };
};

export const calculateAspects = (arg1: any, arg2: any, arg3: any, arg4: any): any => {
    console.log('calculateAspects called with:', arg1, arg2, arg3, arg4);
    return {};
};

export const calculateBaladiAvastha = (planetLongitude: number): string => {
    console.log('calculateBaladiAvastha called with:', planetLongitude);
    return 'Bala';
};

export const calculatePanchadhaSambandha = (planets: any, options?: any): any => {
    console.log('calculatePanchadhaSambandha called with:', planets, options);
    return {};
};

export const calculateIshtaKashtaPhala = (arg1: any, arg2: any): any => {
    console.log('calculateIshtaKashtaPhala called with:', arg1, arg2);
    return { ishta: 0, kashta: 0 };
};

export const verifyDoubleTransit = (chart: any, transitDate: any, options?: any): { isTriggered: boolean; details: any[] } => {
    console.log('verifyDoubleTransit called with:', chart, transitDate, options);
    return { isTriggered: false, details: [] };
};
