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
// DASHA TYPES
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
    antardashaStart: Date;
    antardashaEnd: Date;
    pratyantarStart: Date;
    pratyantarEnd: Date;
    sukshmaStart: Date;
    sukshmaEnd: Date;
    pranaStart: Date;
    pranaEnd: Date;
    sandhiInfo?: {
        isNearTransition: boolean;
        level: number; // 1-5 which level transition
        distanceMinutes: number;
        transitionType: 'start' | 'end';
    };
}

// ═════════════════════════════════════════════════════════════════════════════
// AYANAMSA CALCULATION
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Calculate Lahiri Ayanamsa for a given Julian Day
 * Synchronized with Swiss Ephemeris for God-Tier Precision.
 */
export function calculateLahiriAyanamsa(julianDay: number): number {
    return getAyanamsa(julianDay);
}

/**
 * Convert tropical longitude to sidereal (Vedic)
 */
export function tropicalToSidereal(
    tropicalLongitude: number,
    julianDay: number
): number {
    const ayanamsa = calculateLahiriAyanamsa(julianDay);
    let sidereal = tropicalLongitude - ayanamsa;
    if (sidereal < 0) sidereal += 360;
    return sidereal;
}

// ═════════════════════════════════════════════════════════════════════════════
// VIMSHOTTARI DASHA CALCULATION
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Calculate complete Vimshottari Dasha sequence from birth
 * This is THE most important calculation for birth time rectification
 */
export function calculateVimshottariDasha(
    moonLongitude: number, // Sidereal longitude of Moon
    birthDate: Date,
    maxLevel: number = 5 // Allow engine-level throttling for memory safety
): DashaPeriod[] {
    // Step 1: Determine birth nakshatra
    const nakshatraIndex = Math.floor(moonLongitude / NAKSHATRA_SPAN);
    const birthNakshatra = nakshatraIndex;
    const birthNakshatraLord = NAKSHATRA_LORDS[nakshatraIndex];

    // Step 2: Calculate position within nakshatra (0 to 1)
    const positionInNakshatra = (moonLongitude % NAKSHATRA_SPAN) / NAKSHATRA_SPAN;

    // Step 3: Calculate elapsed portion of birth dasha
    const birthDashaYears = DASHA_YEARS[birthNakshatraLord];
    const elapsedYears = positionInNakshatra * birthDashaYears;
    const remainingYears = birthDashaYears - elapsedYears;

    // Step 4: Build all dasha periods
    const periods: DashaPeriod[] = [];
    let currentDate = new Date(birthDate);

    // Find starting index in dasha sequence
    let dashaIndex = DASHA_SEQUENCE.indexOf(birthNakshatraLord);

    // First period (partial - remaining from birth)
    const firstEndDate = addYears(currentDate, remainingYears);
    periods.push({
        lord: birthNakshatraLord,
        startDate: new Date(currentDate),
        endDate: firstEndDate,
        durationYears: remainingYears,
        subPeriods: calculateSubDashas(
            birthNakshatraLord,
            currentDate,
            firstEndDate,
            maxLevel,
            positionInNakshatra
        ),
    });
    currentDate = firstEndDate;
    dashaIndex = (dashaIndex + 1) % 9;

    // Remaining full periods (for ~120 years from birth)
    for (let cycle = 0; cycle < 1; cycle++) { // 1 cycle (120 years) is sufficient for life
        for (let i = 0; i < 9; i++) {
            const lord = DASHA_SEQUENCE[dashaIndex];
            if (lord === birthNakshatraLord && cycle === 0) {
                dashaIndex = (dashaIndex + 1) % 9;
                continue; // Already added birth dasha
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
    }

    return periods;
}

/**
 * Calculate Antardasha periods within a Mahadasha
 */
/**
 * Generic Recursive Sub-Dasha Calculation
 * Supports Level 2 (Antar) to Level 5 (Prana)
 */
function calculateSubDashas(
    mahadashaLord: string,
    startDate: Date,
    endDate: Date,
    maxLevel: number = 2,
    startOffset: number = 0, // 0-1, amount of the first period already elapsed
    currentLevel: number = 2
): DashaPeriod[] {
    if (currentLevel > maxLevel) return [];

    const totalDurationMs = endDate.getTime() - startDate.getTime();
    const subPeriods: DashaPeriod[] = [];
    let currentDate = new Date(startDate);

    // Sub-dasha sequence starts with the current parent lord
    let startIndex = DASHA_SEQUENCE.indexOf(mahadashaLord);

    for (let i = 0; i < 9; i++) {
        const index = (startIndex + i) % 9;
        const lord = DASHA_SEQUENCE[index];
        const lordYears = DASHA_YEARS[lord];

        // Traditional Rule: Sub-period is proportional to planet's years in 120-year cycle
        const proportion = lordYears / TOTAL_DASHA_YEARS;
        let pDurationMs = totalDurationMs * proportion;

        // Apply offset for the very first period of birth
        if (i === 0 && startOffset > 0) {
            const elapsed = startOffset * pDurationMs;
            pDurationMs -= elapsed;
            if (pDurationMs <= 0) continue;
        }

        const pEndDate = new Date(currentDate.getTime() + pDurationMs);

        // Sanity check for very small periods (Prana level can be minutes)
        if (pDurationMs < 1000) continue;

        subPeriods.push({
            lord,
            startDate: new Date(currentDate),
            endDate: pEndDate,
            durationYears: pDurationMs / (365.25 * 24 * 60 * 60 * 1000),
            subPeriods: calculateSubDashas(lord, currentDate, pEndDate, maxLevel, 0, currentLevel + 1)
        });

        currentDate = pEndDate;
    }

    return subPeriods;
}

/**
 * Get Dasha active on a specific date
 * Used to verify life events
 */
/**
 * Get Dasha active on a specific date (5 levels deep)
 * Used to verify life events with GOD-TIER precision
 */
export function getDashaForDate(
    periods: DashaPeriod[],
    eventDate: Date
): DashaAtDate | null {
    for (const maha of periods) {
        if (eventDate >= maha.startDate && eventDate <= maha.endDate) {
            // Level 2 (Antar)
            for (const antar of maha.subPeriods) {
                if (eventDate >= antar.startDate && eventDate <= antar.endDate) {
                    // Level 3 (Pratyantar)
                    for (const prat of antar.subPeriods) {
                        if (eventDate >= prat.startDate && eventDate <= prat.endDate) {
                            // Level 4 (Sukshma)
                            for (const suksh of prat.subPeriods) {
                                if (eventDate >= suksh.startDate && eventDate <= suksh.endDate) {
                                    // Level 5 (Prana)
                                    for (const prana of suksh.subPeriods) {
                                        if (eventDate >= prana.startDate && eventDate <= prana.endDate) {
                                            const dasha: DashaAtDate = {
                                                mahadasha: maha.lord,
                                                antardasha: antar.lord,
                                                pratyantardasha: prat.lord,
                                                sukshmadasha: suksh.lord,
                                                pranadasha: prana.lord,
                                                mahadashaStart: maha.startDate,
                                                mahadashaEnd: maha.endDate,
                                                antardashaStart: antar.startDate,
                                                antardashaEnd: antar.endDate,
                                                pratyantarStart: prat.startDate,
                                                pratyantarEnd: prat.endDate,
                                                sukshmaStart: suksh.startDate,
                                                sukshmaEnd: suksh.endDate,
                                                pranaStart: prana.startDate,
                                                pranaEnd: prana.endDate
                                            };

                                            // Attach Sandhi Info (Transition analysis)
                                            dasha.sandhiInfo = calculateDashaSandhi(dasha, eventDate);
                                            return dasha;
                                        }
                                    }
                                    // Fallback to Level 4
                                    return {
                                        mahadasha: maha.lord,
                                        antardasha: antar.lord,
                                        pratyantardasha: prat.lord,
                                        sukshmadasha: suksh.lord,
                                        pranadasha: 'Unknown',
                                        mahadashaStart: maha.startDate,
                                        mahadashaEnd: maha.endDate,
                                        antardashaStart: antar.startDate,
                                        antardashaEnd: antar.endDate,
                                        pratyantarStart: prat.startDate,
                                        pratyantarEnd: prat.endDate,
                                        sukshmaStart: suksh.startDate,
                                        sukshmaEnd: suksh.endDate,
                                        pranaStart: new Date(), pranaEnd: new Date()
                                    };
                                }
                            }
                            // Fallback to Level 3
                            return {
                                mahadasha: maha.lord,
                                antardasha: antar.lord,
                                pratyantardasha: prat.lord,
                                sukshmadasha: 'Unknown',
                                pranadasha: 'Unknown',
                                mahadashaStart: maha.startDate,
                                mahadashaEnd: maha.endDate,
                                antardashaStart: antar.startDate,
                                antardashaEnd: antar.endDate,
                                pratyantarStart: prat.startDate,
                                pratyantarEnd: prat.endDate,
                                sukshmaStart: new Date(), sukshmaEnd: new Date(),
                                pranaStart: new Date(), pranaEnd: new Date()
                            };
                        }
                    }
                    // Fallback to Level 2
                    return {
                        mahadasha: maha.lord,
                        antardasha: antar.lord,
                        pratyantardasha: 'Unknown',
                        sukshmadasha: 'Unknown',
                        pranadasha: 'Unknown',
                        mahadashaStart: maha.startDate,
                        mahadashaEnd: maha.endDate,
                        antardashaStart: antar.startDate,
                        antardashaEnd: antar.endDate,
                        pratyantarStart: new Date(), pratyantarEnd: new Date(),
                        sukshmaStart: new Date(), sukshmaEnd: new Date(),
                        pranaStart: new Date(), pranaEnd: new Date()
                    };
                }
            }
            // Fallback to Level 1
            return {
                mahadasha: maha.lord,
                antardasha: 'Unknown',
                pratyantardasha: 'Unknown',
                sukshmadasha: 'Unknown',
                pranadasha: 'Unknown',
                mahadashaStart: maha.startDate,
                mahadashaEnd: maha.endDate,
                antardashaStart: new Date(), antardashaEnd: new Date(),
                pratyantarStart: new Date(), pratyantarEnd: new Date(),
                sukshmaStart: new Date(), sukshmaEnd: new Date(),
                pranaStart: new Date(), pranaEnd: new Date()
            };
        }
    }
    return null;
}

// ═════════════════════════════════════════════════════════════════════════════
// DASHA-EVENT CORRELATION
// ═════════════════════════════════════════════════════════════════════════════

// Which dashas favor which event types (expert knowledge)
const DASHA_EVENT_MAP: Record<string, string[]> = {
    // Career and authority
    Sun: ['career', 'promotion', 'recognition', 'government', 'father'],

    // Wealth, relationships, arts
    Venus: ['marriage', 'love', 'arts', 'luxury', 'vehicles', 'beauty'],

    // Mind, mother, emotions
    Moon: ['mother', 'travel', 'emotions', 'mental', 'home', 'nurturing'],

    // Energy, courage, property
    Mars: ['property', 'siblings', 'courage', 'surgery', 'accidents', 'conflict'],

    // Communication, education, business
    Mercury: ['education', 'business', 'writing', 'communication', 'skills', 'friends'],

    // Expansion, spirituality, children
    Jupiter: ['children', 'marriage', 'spirituality', 'higher_education', 'luck', 'wealth'],

    // Discipline, delays, career
    Saturn: ['career', 'discipline', 'delays', 'chronic_health', 'old_age', 'service'],

    // Sudden events, foreign, unconventional
    Rahu: ['foreign', 'sudden_events', 'unconventional', 'technology', 'research', 'obsession'],

    // Spiritual, detachment, losses
    Ketu: ['spiritual', 'losses', 'isolation', 'mystical', 'past_karma', 'endings'],
};

/**
 * Detect Dasha Sandhi (Transition twilight)
 * Events near transitions are high-confidence indicators.
 */
function calculateDashaSandhi(dasha: DashaAtDate, date: Date): DashaAtDate['sandhiInfo'] {
    const time = date.getTime();

    // Level 1-2 transitions (Mahadasha, Antardasha) are the most powerful
    const transitions = [
        { start: dasha.mahadashaStart.getTime(), end: dasha.mahadashaEnd.getTime(), level: 1 },
        { start: dasha.antardashaStart.getTime(), end: dasha.antardashaEnd.getTime(), level: 2 },
        { start: dasha.pratyantarStart.getTime(), end: dasha.pratyantarEnd.getTime(), level: 3 },
        { start: dasha.sukshmaStart.getTime(), end: dasha.sukshmaEnd.getTime(), level: 4 },
        { start: dasha.pranaStart.getTime(), end: dasha.pranaEnd.getTime(), level: 5 }
    ];

    for (const t of transitions) {
        const startDiff = Math.abs(time - t.start) / (60 * 1000);
        const endDiff = Math.abs(time - t.end) / (60 * 1000);

        // Thresholds: L1=30d, L2=7d, L3=2d, L4=12h, L5=2h
        const threshold = t.level === 1 ? 43200 : // 30 days in mins
            t.level === 2 ? 10080 : // 7 days in mins
                t.level === 3 ? 2880 :  // 2 days in mins
                    t.level === 4 ? 720 :   // 12 hours in mins
                        60;                     // 1 hour in mins

        if (startDiff < threshold) {
            return { isNearTransition: true, level: t.level, distanceMinutes: startDiff, transitionType: 'start' };
        }
        if (endDiff < threshold) {
            return { isNearTransition: true, level: t.level, distanceMinutes: endDiff, transitionType: 'end' };
        }
    }

    return { isNearTransition: false, level: 0, distanceMinutes: 0, transitionType: 'start' };
}

/**
 * Check if a dasha supports a particular event type
 */
export function dashaSupportsEvent(
    dasha: DashaAtDate,
    eventCategory: string,
    eventType: string
): { supports: boolean; strength: number; reason: string } {
    const category = eventCategory.toLowerCase();
    const type = eventType.toLowerCase();

    let supports = false;
    let strength = 0;
    const reasons: string[] = [];

    // Check Mahadasha
    const mahaSupportedEvents = DASHA_EVENT_MAP[dasha.mahadasha] || [];
    for (const supportedEvent of mahaSupportedEvents) {
        if (category.includes(supportedEvent) || type.includes(supportedEvent)) {
            supports = true;
            strength += 60;
            reasons.push(`${dasha.mahadasha} Mahadasha supports ${supportedEvent} events`);
            break;
        }
    }

    // Check Antardasha
    const antarSupportedEvents = DASHA_EVENT_MAP[dasha.antardasha] || [];
    for (const supportedEvent of antarSupportedEvents) {
        if (category.includes(supportedEvent) || type.includes(supportedEvent)) {
            supports = true;
            strength += 40;
            reasons.push(`${dasha.antardasha} Antardasha reinforces this`);
            break;
        }
    }

    // Specific combinations
    const combo = `${dasha.mahadasha}-${dasha.antardasha}`;

    // Marriage combinations
    if ((category === 'marriage' || type.includes('marriage') || type.includes('wedding'))) {
        if (['Venus-Jupiter', 'Jupiter-Venus', 'Venus-Venus', 'Moon-Venus'].includes(combo)) {
            strength += 30;
            reasons.push(`${combo} is excellent for marriage`);
        }
    }

    // Career combinations
    if (category === 'career' || type.includes('job') || type.includes('promotion')) {
        if (['Saturn-Sun', 'Sun-Saturn', 'Sun-Jupiter', 'Saturn-Jupiter'].includes(combo)) {
            strength += 30;
            reasons.push(`${combo} favors career advancement`);
        }
    }

    return {
        supports,
        strength: Math.min(100, strength),
        reason: reasons.join('. ') || 'No direct correlation found',
    };
}

// ═════════════════════════════════════════════════════════════════════════════
// FORMAT DASHA FOR AI PROMPT
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Format dasha sequence for AI K2 analysis
 */
export function formatDashaSequence(periods: DashaPeriod[]): string {
    const lines: string[] = ['VIMSHOTTARI DASHA SEQUENCE:'];

    for (const period of periods.slice(0, 12)) { // First 12 mahadashas (~100 years)
        const start = formatDate(period.startDate);
        const end = formatDate(period.endDate);

        lines.push(`\n${period.lord} MAHADASHA: ${start} to ${end} (${period.durationYears.toFixed(1)} years)`);

        // Add level 2 (Antar)
        for (const antar of period.subPeriods) {
            const aStart = formatDate(antar.startDate);
            const aEnd = formatDate(antar.endDate);
            lines.push(`  └─ ${period.lord}/${antar.lord}: ${aStart} to ${aEnd}`);

            // For AI prompt, we limit to 3 levels deep per candidate section to avoid token bloat
            // while keeping the full technical resolution available in the JSON Technical Data.
            for (const prat of antar.subPeriods) {
                const pStart = formatDate(prat.startDate);
                lines.push(`     · ${prat.lord}: starts ${pStart}`);
            }
        }
    }

    return lines.join('\n');
}

/**
 * Format dasha for a specific date
 */
export function formatDashaForDate(
    periods: DashaPeriod[],
    date: Date,
    eventDescription: string
): string {
    const dasha = getDashaForDate(periods, date);

    if (!dasha) {
        return `${formatDate(date)}: Unable to determine dasha (date out of range)`;
    }

    return `${formatDate(date)} - ${eventDescription}
  Mahadasha: ${dasha.mahadasha} (${formatDate(dasha.mahadashaStart)} to ${formatDate(dasha.mahadashaEnd)})
  Antardasha: ${dasha.antardasha} (${formatDate(dasha.antardashaStart)} to ${formatDate(dasha.antardashaEnd)})`;
}

// ═════════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═════════════════════════════════════════════════════════════════════════════

function addYears(date: Date, years: number): Date {
    const result = new Date(date);
    const wholeDays = years * 365.25;
    result.setTime(result.getTime() + wholeDays * 24 * 60 * 60 * 1000);
    return result;
}

function formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
}

// ═════════════════════════════════════════════════════════════════════════════
// NAKSHATRA UTILITIES
// ═════════════════════════════════════════════════════════════════════════════

export const NAKSHATRAS = [
    { name: 'Ashwini', lord: 'Ketu', deity: 'Ashwini Kumaras', startDegree: 0 },
    { name: 'Bharani', lord: 'Venus', deity: 'Yama', startDegree: 13.333 },
    { name: 'Krittika', lord: 'Sun', deity: 'Agni', startDegree: 26.667 },
    { name: 'Rohini', lord: 'Moon', deity: 'Brahma', startDegree: 40 },
    { name: 'Mrigashirsha', lord: 'Mars', deity: 'Soma', startDegree: 53.333 },
    { name: 'Ardra', lord: 'Rahu', deity: 'Rudra', startDegree: 66.667 },
    { name: 'Punarvasu', lord: 'Jupiter', deity: 'Aditi', startDegree: 80 },
    { name: 'Pushya', lord: 'Saturn', deity: 'Brihaspati', startDegree: 93.333 },
    { name: 'Ashlesha', lord: 'Mercury', deity: 'Nagas', startDegree: 106.667 },
    { name: 'Magha', lord: 'Ketu', deity: 'Pitris', startDegree: 120 },
    { name: 'Purva Phalguni', lord: 'Venus', deity: 'Bhaga', startDegree: 133.333 },
    { name: 'Uttara Phalguni', lord: 'Sun', deity: 'Aryaman', startDegree: 146.667 },
    { name: 'Hasta', lord: 'Moon', deity: 'Savitar', startDegree: 160 },
    { name: 'Chitra', lord: 'Mars', deity: 'Tvashtar', startDegree: 173.333 },
    { name: 'Swati', lord: 'Rahu', deity: 'Vayu', startDegree: 186.667 },
    { name: 'Vishakha', lord: 'Jupiter', deity: 'Indra-Agni', startDegree: 200 },
    { name: 'Anuradha', lord: 'Saturn', deity: 'Mitra', startDegree: 213.333 },
    { name: 'Jyeshtha', lord: 'Mercury', deity: 'Indra', startDegree: 226.667 },
    { name: 'Mula', lord: 'Ketu', deity: 'Nirriti', startDegree: 240 },
    { name: 'Purva Ashadha', lord: 'Venus', deity: 'Apas', startDegree: 253.333 },
    { name: 'Uttara Ashadha', lord: 'Sun', deity: 'Vishvadevas', startDegree: 266.667 },
    { name: 'Shravana', lord: 'Moon', deity: 'Vishnu', startDegree: 280 },
    { name: 'Dhanishtha', lord: 'Mars', deity: 'Vasus', startDegree: 293.333 },
    { name: 'Shatabhisha', lord: 'Rahu', deity: 'Varuna', startDegree: 306.667 },
    { name: 'Purva Bhadrapada', lord: 'Jupiter', deity: 'Aja Ekapada', startDegree: 320 },
    { name: 'Uttara Bhadrapada', lord: 'Saturn', deity: 'Ahir Budhnya', startDegree: 333.333 },
    { name: 'Revati', lord: 'Mercury', deity: 'Pushan', startDegree: 346.667 },
];

/**
 * Get nakshatra for a longitude
 */
export function getNakshatraForLongitude(siderealLongitude: number): {
    name: string;
    lord: string;
    pada: number;
    number: number;
} {
    const index = Math.floor(siderealLongitude / NAKSHATRA_SPAN);
    const nakshatra = NAKSHATRAS[index % 27];

    // Calculate pada (quarter) - each nakshatra has 4 padas
    const positionInNakshatra = siderealLongitude % NAKSHATRA_SPAN;
    const pada = Math.floor(positionInNakshatra / (NAKSHATRA_SPAN / 4)) + 1;

    return {
        name: nakshatra.name,
        lord: nakshatra.lord,
        pada,
        number: (index % 27) + 1,
    };
}

// ═════════════════════════════════════════════════════════════════════════════
// VEDIC HELPERS (GOD-TIER DATA PREP)
// ═════════════════════════════════════════════════════════════════════════════

const ZODIAC_SIGNS = [
    'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
    'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
];

const PLANET_RULERSHIPS: Record<string, string> = {
    'Aries': 'Mars',
    'Taurus': 'Venus',
    'Gemini': 'Mercury',
    'Cancer': 'Moon',
    'Leo': 'Sun',
    'Virgo': 'Mercury',
    'Libra': 'Venus',
    'Scorpio': 'Mars',
    'Sagittarius': 'Jupiter',
    'Capricorn': 'Saturn',
    'Aquarius': 'Saturn',
    'Pisces': 'Jupiter'
};

const EXALTATION_SIGNS: Record<string, string> = {
    'Sun': 'Aries',
    'Moon': 'Taurus',
    'Mars': 'Capricorn',
    'Mercury': 'Virgo',
    'Jupiter': 'Cancer',
    'Venus': 'Pisces',
    'Saturn': 'Libra',
    'Rahu': 'Taurus',
    'Ketu': 'Scorpio'
};

const DEBILITATION_SIGNS: Record<string, string> = {
    'Sun': 'Libra',
    'Moon': 'Scorpio',
    'Mars': 'Cancer',
    'Mercury': 'Pisces',
    'Jupiter': 'Capricorn',
    'Venus': 'Virgo',
    'Saturn': 'Aries',
    'Rahu': 'Scorpio',
    'Ketu': 'Taurus'
};

/**
 * Calculate Vedic House System (Whole Sign)
 * @param ascSign Ascendant Sign Name
 * @param planetSign Planet Sign Name
 * @returns House Number (1-12)
 */
export function calculateHouse(ascSign: string, planetSign: string): number {
    const ascIdx = ZODIAC_SIGNS.indexOf(ascSign);
    const pltIdx = ZODIAC_SIGNS.indexOf(planetSign);
    if (ascIdx === -1 || pltIdx === -1) return 0;

    let house = (pltIdx - ascIdx) + 1;
    if (house <= 0) house += 12;
    return house;
}

/**
 * Get the Lord of a specific house number for a given Ascendant
 */
export function getHouseLord(ascSign: string, houseNum: number): string {
    const ascIdx = ZODIAC_SIGNS.indexOf(ascSign);
    // Target sign index = (ascIndex + houseNum - 1) % 12
    const targetIdx = (ascIdx + houseNum - 1) % 12;
    const sign = ZODIAC_SIGNS[targetIdx];
    return PLANET_RULERSHIPS[sign];
}

/**
 * Calculate Planetary Dignity
 */
export function getDignity(planet: string, sign: string): 'Exalted' | 'Debilitated' | 'Own Sign' | 'Friendly' | 'Enemy' | 'Neutral' {
    if (EXALTATION_SIGNS[planet] === sign) return 'Exalted';
    if (DEBILITATION_SIGNS[planet] === sign) return 'Debilitated';
    if (PLANET_RULERSHIPS[sign] === planet) return 'Own Sign';

    // Simplified Friend/Enemy logic (could be more complex natural + temporal)
    // For now, return Neutral/Friendly based on simple groups
    // Deva Group: Sun, Moon, Mars, Jupiter
    // Asura Group: Venus, Saturn, Mercury(mixed), Rahu, Ketu
    const devas = ['Sun', 'Moon', 'Mars', 'Jupiter'];
    const asuras = ['Venus', 'Saturn', 'Rahu', 'Ketu'];
    const neutral = ['Mercury'];

    const ruler = PLANET_RULERSHIPS[sign];

    if (devas.includes(planet) && devas.includes(ruler)) return 'Friendly';
    if (asuras.includes(planet) && asuras.includes(ruler)) return 'Friendly';
    if (devas.includes(planet) && asuras.includes(ruler)) return 'Enemy';
    if (asuras.includes(planet) && devas.includes(ruler)) return 'Enemy';

    return 'Neutral';
}

/**
 * Get map of all house lords for a chart
 */
export function getAllHouseLords(ascSign: string): Record<number, string> {
    const lords: Record<number, string> = {};
    for (let i = 1; i <= 12; i++) {
        lords[i] = getHouseLord(ascSign, i);
    }
    return lords;
}
// ═════════════════════════════════════════════════════════════════════════════
// DIVISIONAL CHARTS (VARGAS) - Phase 2
// ═════════════════════════════════════════════════════════════════════════════

import { DivisionalChart, EphemerisData, PlanetPosition } from './types.js';

export function calculateAllVargas(ephemeris: EphemerisData): Record<string, DivisionalChart> {
    const vargas: Record<string, DivisionalChart> = {};
    const divisions = [2, 3, 4, 7, 9, 10, 12, 16, 20, 24, 27, 30, 40, 45, 60];

    for (const v of divisions) {
        vargas[`D${v}`] = calculateVarga(v, ephemeris);
    }

    return vargas;
}

function calculateVarga(v: number, ephemeris: EphemerisData): DivisionalChart {
    const planets: Record<string, PlanetPosition> = {};
    const planetNames = Object.keys(ephemeris.planets);

    for (const name of planetNames) {
        const p = ephemeris.planets[name as keyof typeof ephemeris.planets];
        planets[name] = calculateVargaPosition(v, p.longitude, name);
    }

    const asc = calculateVargaPosition(v, ephemeris.ascendant.longitude, 'Ascendant');

    return {
        id: `D${v}`,
        planets,
        ascendant: {
            sign: asc.sign,
            degree: asc.degree,
            longitude: asc.longitude
        }
    };
}

function calculateVargaPosition(v: number, longitude: number, name: string): PlanetPosition {
    const siderealLong = longitude % 360;
    const signIndex = Math.floor(siderealLong / 30);
    const signDegree = siderealLong % 30;
    const isOdd = signIndex % 2 === 0;

    let targetSignIndex = 0;
    const divisionSize = 30 / v;
    const division = Math.floor(signDegree / divisionSize);

    switch (v) {
        case 2: // Hora
            if (isOdd) targetSignIndex = (signDegree < 15) ? 4 : 3; // Sun (Leo) / Moon (Cancer)
            else targetSignIndex = (signDegree < 15) ? 3 : 4;
            break;
        case 3: // Drekkana
            targetSignIndex = (signIndex + (division * 4)) % 12;
            break;
        case 4: // Chaturthamsa
            targetSignIndex = (signIndex + (division * 3)) % 12;
            break;
        case 7: // Saptamsa
            if (isOdd) targetSignIndex = (signIndex + division) % 12;
            else targetSignIndex = (signIndex + 6 + division) % 12;
            break;
        case 9: // Navamsa (Most Critical)
            const navBase = [0, 8, 4][signIndex % 3]; // Aries, Sagittarius, Leo start points
            targetSignIndex = (navBase + division) % 12;
            break;
        case 10: // Dasamsa
            if (isOdd) targetSignIndex = (signIndex + division) % 12;
            else targetSignIndex = (signIndex + 8 + division) % 12;
            break;
        case 12: // Dwadasamsa
            targetSignIndex = (signIndex + division) % 12;
            break;
        case 16: // Shodashamsa
            const shBase = [0, 3, 7][signIndex % 3];
            targetSignIndex = (shBase + division) % 12;
            break;
        case 20: // Vimsamsa
            const viBase = isOdd ? 0 : (signIndex % 3 === 1 ? 8 : 4);
            targetSignIndex = (viBase + division) % 12;
            break;
        case 24: // Chaturvimshamsa
            targetSignIndex = (isOdd ? 4 + division : 3 + division) % 12;
            break;
        case 30: // Trimsamsa
            if (isOdd) {
                if (signDegree < 5) targetSignIndex = 0; // Mars
                else if (signDegree < 10) targetSignIndex = 9; // Saturn
                else if (signDegree < 18) targetSignIndex = 8; // Jupiter
                else if (signDegree < 25) targetSignIndex = 5; // Mercury
                else targetSignIndex = 1; // Venus
            } else {
                if (signDegree < 5) targetSignIndex = 1; // Venus
                else if (signDegree < 12) targetSignIndex = 5; // Mercury
                else if (signDegree < 20) targetSignIndex = 8; // Jupiter
                else if (signDegree < 25) targetSignIndex = 9; // Saturn
                else targetSignIndex = 0; // Mars
            }
            break;
        case 60: // Shashtyamsa (Most Critical for Seconds)
            targetSignIndex = (signIndex + division) % 12;
            break;
        default:
            targetSignIndex = (signIndex + division) % 12;
    }

    const targetSign = ZODIAC_SIGNS[targetSignIndex % 12];
    const targetLong = (targetSignIndex * 30) + (signDegree * v % 30);

    return {
        sign: targetSign,
        degree: targetLong % 30,
        longitude: targetLong,
        latitude: 0, // Varga latitude is not standardized
        nakshatra: '', // Not needed for divisional charts usually
        lord: PLANET_RULERSHIPS[targetSign],
        retro: false, // Inherited from D1
        speed: 0,
        distance: 0,
        isCombust: false,
        dignity: '',
        house: 0
    };
}
// 2. GEOMETRIC ASPECT ENGINE
export interface AspectHit {
    targetPlanet?: string;
    targetHouse?: number;
    type: string;
    orb: number;
    isHit: boolean;
}

// 1. FUNCTIONAL NATURE ALGORITHM
export function calculateFunctionalNature(ascSign: string, planet: string): {
    role: 'Benefic' | 'Malefic' | 'Neutral';
    reason: string;
} {
    if (planet === 'Rahu' || planet === 'Ketu') return { role: 'Malefic', reason: 'Natural Malefic' };

    // Calculate lordship houses
    const housesRuled: number[] = [];
    for (let h = 1; h <= 12; h++) {
        const lord = getHouseLord(ascSign, h);
        if (lord === planet) housesRuled.push(h);
    }

    // Rule 1: Trine Lords (1, 5, 9) are ALWAYS Benefic
    if (housesRuled.some(h => [1, 5, 9].includes(h))) {
        return { role: 'Benefic', reason: `Rules Trine House (${housesRuled.filter(h => [1, 5, 9].includes(h)).join(',')})` };
    }

    // Rule 2: Lords of 6, 8, 12 are Malefic (unless they are also L1, which is covered above)
    if (housesRuled.some(h => [6, 8, 12].includes(h))) {
        return { role: 'Malefic', reason: `Rules Dusthana House (${housesRuled.filter(h => [6, 8, 12].includes(h)).join(',')})` };
    }

    // Rule 3: Lords of 3, 11 are Malefic (Upachaya)
    if (housesRuled.some(h => [3, 11].includes(h))) {
        return { role: 'Malefic', reason: 'Rules Upachaya House (3/11) - Functional Malefic' };
    }

    // Rule 4: Kendra Lords (4, 7, 10)
    // Neutral logic for simplified output, or context dependent. 
    // We default to Neutral if no other rule hit.
    return { role: 'Neutral', reason: 'Rules Kendra House (4/7/10) without Trine/Dusthana lordship' };
}

export function calculateAspects(
    sourcePlanet: string,
    sourceLong: number,
    targetMap: Record<string, number>, // planet -> longitude
    ascendantLong: number
): AspectHit[] {
    const hits: AspectHit[] = [];

    // Standard Vedic Aspects + Special Rules
    let aspectsToCheck = [180]; // All look at 7th (180 deg)

    if (sourcePlanet === 'Mars') aspectsToCheck.push(90, 210); // 4th (90), 8th (210)
    if (sourcePlanet === 'Jupiter') aspectsToCheck.push(120, 240); // 5th (120), 9th (240)
    if (sourcePlanet === 'Saturn') aspectsToCheck.push(60, 270); // 3rd (60), 10th (270)

    const ORB_LIMIT = 6; // 6 degrees strict orb

    // Check aspects to other planets
    for (const [tName, tLong] of Object.entries(targetMap)) {
        if (tName === sourcePlanet) continue;

        // Calculate forward distance
        let diff = (tLong - sourceLong + 360) % 360;

        for (const aspectAngle of aspectsToCheck) {
            const orb = Math.abs(diff - aspectAngle);
            if (orb <= ORB_LIMIT) {
                hits.push({
                    targetPlanet: tName,
                    type: `${getAspectName(aspectAngle)} (${aspectAngle}°)`,
                    orb: parseFloat(orb.toFixed(2)),
                    isHit: true
                });
            }
        }
    }

    // Check aspect to Houses (e.g. 7th House)
    // Simplified: Check aspect to Ascendant (Lagna) + Angle
    // If planet is at 180 from Lagna, it aspects 1st House.
    // If planet casts 180 aspect, and planet is in 1st house, it looks at 7th.
    // Better: We calculate House Cusps relative to Ascendant.
    // House 1 Cusp = AscLong. House 7 Cusp = AscLong + 180.

    // Let's implement Aspect to 7th House (Marriage) specifically as it's critical
    const SeventhCusp = (ascendantLong + 180) % 360;
    let dist7 = (SeventhCusp - sourceLong + 360) % 360;

    for (const aspectAngle of aspectsToCheck) {
        if (Math.abs(dist7 - aspectAngle) <= ORB_LIMIT) {
            hits.push({
                targetHouse: 7,
                type: `${getAspectName(aspectAngle)} to 7th House`,
                orb: parseFloat(Math.abs(dist7 - aspectAngle).toFixed(2)),
                isHit: true
            });
        }
    }

    return hits;
}

function getAspectName(angle: number): string {
    if (angle === 180) return '7th Aspect (Opposition)';
    if (angle === 90) return '4th Aspect (Square)';
    if (angle === 210) return '8th Aspect (Quincunx)';
    if (angle === 120) return '5th Aspect (Trine)';
    if (angle === 240) return '9th Aspect (Trine)';
    if (angle === 60) return '3rd Aspect (Sextile)';
    if (angle === 270) return '10th Aspect (Square)';
    return 'Aspect';
}

// ═════════════════════════════════════════════════════════════════════════════
// ASHTAKAVARGA (Point-Based Scoring)
// ═════════════════════════════════════════════════════════════════════════════

export function calculateAshtakavarga(ephemeris: EphemerisData): Record<string, number[]> {
    const planets = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];
    const results: Record<string, number[]> = {};

    for (const p of planets) {
        results[p] = calculateBinnashtakavarga(p, ephemeris);
    }

    // Sarvashtakavarga (Sum of all)
    const SAV = new Array(12).fill(0);
    for (const p of planets) {
        for (let i = 0; i < 12; i++) SAV[i] += results[p][i];
    }
    results['SAV'] = SAV;

    // Sign Mapping for SAV (Aries=0, etc)
    const SAVMap: Record<string, number> = {};
    ZODIAC_SIGNS.forEach((sign, i) => {
        SAVMap[sign] = SAV[i];
    });
    results['SAVSigns'] = SAVMap as any;

    return results;
}

function calculateBinnashtakavarga(planet: string, ephemeris: EphemerisData): number[] {
    const points = new Array(12).fill(0);

    const planetLongs: Record<string, number> = {};
    for (const [name, p] of Object.entries(ephemeris.planets)) {
        planetLongs[name.charAt(0).toUpperCase() + name.slice(1)] = p.longitude;
    }
    planetLongs['Lagna'] = ephemeris.ascendant.longitude;

    const sign = (long: number) => Math.floor(long / 30);

    const checkRule = (source: string, houses: number[]) => {
        const sSign = sign(planetLongs[source]);
        for (const h of houses) {
            points[(sSign + h - 1) % 12]++;
        }
    };

    if (planet === 'Sun') {
        checkRule('Sun', [1, 2, 4, 7, 8, 9, 10, 11]);
        checkRule('Moon', [3, 6, 10, 11]);
        checkRule('Mars', [1, 2, 4, 7, 8, 9, 10, 11]);
    } else if (planet === 'Moon') {
        checkRule('Sun', [3, 6, 7, 8, 10, 11]);
        checkRule('Moon', [1, 3, 6, 7, 10, 11]);
        checkRule('Jupiter', [1, 4, 7, 8, 10, 11, 12]);
    } else {
        checkRule(planet, [1, 3, 6, 10, 11]);
    }

    return points;
}

// ═════════════════════════════════════════════════════════════════════════════
// SHADBALA (Six-Fold Strength)
// ═════════════════════════════════════════════════════════════════════════════

export interface ShadbalaBreakdown {
    sthana: number;
    dig: number;
    kaala: number;
    cheshta: number;
    naisargika: number;
    total: number;
}

export function calculateShadbala(ephemeris: EphemerisData): Record<string, ShadbalaBreakdown> {
    const planetNames = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn'];
    const results: Record<string, ShadbalaBreakdown> = {};

    for (const name of planetNames) {
        const p = ephemeris.planets[name as keyof typeof ephemeris.planets];
        const pName = name.charAt(0).toUpperCase() + name.slice(1);

        // 1. Sthana Bala (Simplified)
        let sthana = 60;
        if (p.dignity === 'Exalted') sthana += 60;
        if (p.dignity === 'Debilitated') sthana -= 40;
        if (p.dignity === 'Own Sign') sthana += 30;

        // 2. Dig Bala (Directional)
        let dig = 0;
        const h = p.house;
        if ((pName === 'Jupiter' || pName === 'Mercury') && h === 1) dig = 60;
        else if ((pName === 'Moon' || pName === 'Venus') && h === 4) dig = 60;
        else if (pName === 'Saturn' && h === 7) dig = 60;
        else if ((pName === 'Sun' || pName === 'Mars') && h === 10) dig = 60;
        else dig = 20; // Base directional strength

        // 3. Kaala Bala (Temporal - Simplified)
        // Night births favor Moon, Mars, Saturn. Day births favor Sun, Jupiter, Venus.
        // We estimate if it's day/night based on Sun's house (Houses 7-12 are day)
        const isDay = ephemeris.planets.sun.house >= 7;
        let kaala = 30;
        const dayPlanets = ['Sun', 'Jupiter', 'Venus'];
        const nightPlanets = ['Moon', 'Mars', 'Saturn'];
        if (isDay && dayPlanets.includes(pName)) kaala += 20;
        if (!isDay && nightPlanets.includes(pName)) kaala += 20;

        // 4. Cheshta Bala (Motility)
        const cheshta = p.retro ? 60 : 30;

        // 5. Naisargika Bala (Natural)
        const natural: Record<string, number> = {
            'Sun': 60, 'Moon': 51, 'Venus': 43, 'Jupiter': 34, 'Mercury': 26, 'Mars': 17, 'Saturn': 9
        };

        const total = sthana + dig + kaala + cheshta + (natural[pName] || 0);

        results[pName] = {
            sthana,
            dig,
            kaala,
            cheshta,
            naisargika: natural[pName] || 0,
            total
        };
    }

    return results;
}

// ═════════════════════════════════════════════════════════════════════════════
// YOGA DETECTION (Pattern Recognition)
// ═════════════════════════════════════════════════════════════════════════════

export interface YogaMatch {
    name: string;
    description: string;
    level: 'Mahayoga' | 'Dhanayoga' | 'Rajayoga' | 'Aristhayoga';
}

export function detectYogas(ephemeris: EphemerisData): YogaMatch[] {
    const yogas: YogaMatch[] = [];
    const p = ephemeris.planets;

    // 1. Gaja Kesari Yoga (Jupiter in 1, 4, 7, 10 from Moon)
    const jupFromMoon = ((p.jupiter.house - p.moon.house + 12) % 12) + 1;
    if ([1, 4, 7, 10].includes(jupFromMoon)) {
        yogas.push({
            name: 'Gaja Kesari Yoga',
            description: 'Jupiter in Kendra from Moon. Wealth, intelligence, and lasting fame.',
            level: 'Mahayoga'
        });
    }

    // 2. Adhi Yoga (Benefics in 6, 7, 8 from Moon)
    const beneficsList = ['mercury', 'jupiter', 'venus'] as const;
    let adhiCount = 0;
    for (const b of beneficsList) {
        const bHouse = p[b].house;
        const bFromMoon = ((bHouse - p.moon.house + 12) % 12) + 1;
        if ([6, 7, 8].includes(bFromMoon)) adhiCount++;
    }
    if (adhiCount >= 2) {
        yogas.push({
            name: 'Chandradhi Yoga',
            description: 'Benefics in 6/7/8 from Moon. Superior status and leadership.',
            level: 'Rajayoga'
        });
    }

    // 3. Pancha Mahapurusha Yogas (Mars, Mercury, Jupiter, Venus, Saturn in Kendra and Own/Exaltation)
    const mahapurusha = [
        { key: 'mars', name: 'Ruchaka Yoga', desc: 'Courage, leadership, property.' },
        { key: 'mercury', name: 'Bhadra Yoga', desc: 'Intelligence, business acumen.' },
        { key: 'jupiter', name: 'Hamsa Yoga', desc: 'Wisdom, purity, high status.' },
        { key: 'venus', name: 'Malavya Yoga', desc: 'Luxury, arts, charming personality.' },
        { key: 'saturn', name: 'Sasha Yoga', desc: 'Authority, discipline, long-term success.' }
    ] as const;

    for (const m of mahapurusha) {
        const plt = p[m.key];
        if ([1, 4, 7, 10].includes(plt.house)) {
            if (plt.dignity === 'Exalted' || plt.dignity === 'Own Sign') {
                yogas.push({
                    name: m.name,
                    description: m.desc,
                    level: 'Mahayoga'
                });
            }
        }
    }

    // 4. Budha-Aditya Yoga (Sun + Mercury in same sign)
    if (p.sun.sign === p.mercury.sign) {
        yogas.push({
            name: 'Budha-Aditya Yoga',
            description: 'Sun and Mercury in same sign. High intelligence, professional success.',
            level: 'Mahayoga'
        });
    }

    // 5. Lakshmi Yoga (L9 lord in Kendra/Trine and L1 is strong)
    const l1Lord = getHouseLord(ephemeris.ascendant.sign, 1);
    const l9Lord = getHouseLord(ephemeris.ascendant.sign, 9);

    const l9Plt = p[l9Lord.toLowerCase() as keyof typeof p];
    const l1Plt = p[l1Lord.toLowerCase() as keyof typeof p];

    if (l9Plt && [1, 4, 7, 10, 5, 9].includes(l9Plt.house) && l1Plt && l1Plt.dignity !== 'Debilitated') {
        yogas.push({
            name: 'Lakshmi Yoga',
            description: 'Strong 9th lord in Kendra/Trine and healthy Ascendant lord. Wealth and prosperity.',
            level: 'Dhanayoga'
        });
    }

    // 6. Chandra-Mangala Yoga (Moon + Mars together or in opposition)
    const moonMarsDist = ((p.mars.house - p.moon.house + 12) % 12) + 1;
    if ([1, 7].includes(moonMarsDist)) {
        yogas.push({
            name: 'Chandra-Mangala Yoga',
            description: 'Moon and Mars relationship. Persistence, financial acumen.',
            level: 'Dhanayoga'
        });
    }

    // 7. Vipareeta Raja Yoga (L6/8/12 in 6/8/12)
    const dusthanaLords = [6, 8, 12].map(h => getHouseLord(ephemeris.ascendant.sign, h));
    dusthanaLords.forEach(lord => {
        const lName = lord.toLowerCase() as keyof typeof p;
        if (p[lName] && [6, 8, 12].includes(p[lName].house)) {
            yogas.push({
                name: 'Vipareeta Raja Yoga',
                description: `Dusthana lord ${lord} in Dusthana. Sudden success through obstacles.`,
                level: 'Rajayoga'
            });
        }
    });

    return yogas;
}

// ═════════════════════════════════════════════════════════════════════════════
// TRANSIT VERIFICATION (Double Transit Logic)
// ═════════════════════════════════════════════════════════════════════════════

export interface DoubleTransitResult {
    isTriggered: boolean;
    saturnConnection: string;
    jupiterConnection: string;
    targetHouse: number;
}

/**
 * Double Transit Verification: Jupiter AND Saturn both influencing a house.
 * Powerful Vedic rule for event manifestation.
 */
export function verifyDoubleTransit(
    transitEphemeris: EphemerisData,
    birthAscSign: string,
    targetHouse: number
): DoubleTransitResult {
    const p = transitEphemeris.planets;
    const saLong = p.saturn.longitude;
    const juLong = p.jupiter.longitude;
    const targetHouseSign = ZODIAC_SIGNS[(ZODIAC_SIGNS.indexOf(birthAscSign) + targetHouse - 1) % 12];
    const targetHouseLong = (ZODIAC_SIGNS.indexOf(targetHouseSign) * 30) + 15; // Midpoint for aspect checking

    // Saturn Aspects: 1st (conjunction), 3rd, 7th, 10th
    const saAspects = calculateAspects('Saturn', saLong, { "Target": targetHouseLong }, 0); // Birth asc relative doesn't matter for pure sign aspect
    const saIsConnected = p.saturn.sign === targetHouseSign || saAspects.length > 0;
    const saReason = p.saturn.sign === targetHouseSign ? 'Occupation' : saAspects.map(a => a.type).join(', ');

    // Jupiter Aspects: 1st, 5th, 7th, 9th
    const juAspects = calculateAspects('Jupiter', juLong, { "Target": targetHouseLong }, 0);
    const juIsConnected = p.jupiter.sign === targetHouseSign || juAspects.length > 0;
    const juReason = p.jupiter.sign === targetHouseSign ? 'Occupation' : juAspects.map(a => a.type).join(', ');

    return {
        isTriggered: saIsConnected && juIsConnected,
        saturnConnection: saIsConnected ? saReason : 'None',
        jupiterConnection: juIsConnected ? juReason : 'None',
        targetHouse
    };
}

const ZODIAC_SIGNS_LIST = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];

export function calculateArudhas(ephemeris: EphemerisData): Record<string, string> {
    const ascSign = ephemeris.ascendant.sign;
    const ascSignIdx = ZODIAC_SIGNS_LIST.indexOf(ascSign);

    // 1. Arudha Lagna (AL)
    const l1 = ephemeris.houses[0].lord;
    const l1Pos = ephemeris.planets[l1.toLowerCase() as keyof typeof ephemeris.planets].sign;
    const l1Idx = ZODIAC_SIGNS_LIST.indexOf(l1Pos);
    const alIdx = (l1Idx + (l1Idx - ascSignIdx + 12) % 12) % 12;

    // 2. Upapada Lagna (UL - Arudha of 12th House)
    const h12Lord = ephemeris.houses[11].lord;
    const l12Pos = ephemeris.planets[h12Lord.toLowerCase() as keyof typeof ephemeris.planets].sign;
    const l12Idx = ZODIAC_SIGNS_LIST.indexOf(l12Pos);
    // Distance from 12th house (ascSignIdx + 11) to its lord
    const dist12 = (l12Idx - (ascSignIdx + 11) % 12 + 12) % 12;
    const ulIdx = (l12Idx + dist12) % 12;

    return {
        AL: ZODIAC_SIGNS_LIST[alIdx],
        UL: ZODIAC_SIGNS_LIST[ulIdx]
    };
}

// ═════════════════════════════════════════════════════════════════════════════
// PANCHANGA ENGINE (The 5 Limbs of Time)
// ═════════════════════════════════════════════════════════════════════════════

export interface PanchangaData {
    tithi: string;
    vara: string;
    nakshatra: string;
    yoga: string;
    karana: string;
}

const TITHIS = [
    'Prathama', 'Dwitiya', 'Tritiya', 'Chaturthi', 'Panchami', 'Shashti', 'Saptami', 'Ashtami',
    'Navami', 'Dashami', 'Ekadashi', 'Dwadashi', 'Trayodashi', 'Chaturdashi', 'Purnima',
    'Prathama', 'Dwitiya', 'Tritiya', 'Chaturthi', 'Panchami', 'Shashti', 'Saptami', 'Ashtami',
    'Navami', 'Dashami', 'Ekadashi', 'Dwadashi', 'Trayodashi', 'Chaturdashi', 'Amavasya'
];

const YOGAS = [
    'Vishkumbha', 'Preeti', 'Ayushman', 'Saubhagya', 'Shobhana', 'Atiganda', 'Sukarma', 'Dhriti',
    'Shoola', 'Ganda', 'Vriddhi', 'Dhruva', 'Vyaghata', 'Harshana', 'Vajra', 'Siddhi',
    'Vyatipata', 'Variyan', 'Parigha', 'Shiva', 'Siddha', 'Sadhya', 'Shubha', 'Shukla',
    'Brahma', 'Indra', 'Vaidhriti'
];

const VARAS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function calculatePanchanga(jd: number, sunLong: number, moonLong: number): PanchangaData {
    // 1. Vara (Day of week)
    const vara = VARAS[Math.floor(jd + 1.5) % 7];

    // 2. Tithi (Moon - Sun)
    let tithiDiff = (moonLong - sunLong + 360) % 360;
    const tithiNum = Math.floor(tithiDiff / 12) + 1;
    const paksha = tithiNum <= 15 ? 'Shukla' : 'Krishna';
    const tithiName = `${paksha} ${TITHIS[(tithiNum - 1) % 30]}`;

    // 3. Nakshatra
    const nakIndex = Math.floor(moonLong / (360 / 27));
    const nakshatra = NAKSHATRA_NAMES[nakIndex % 27];

    // 4. Yoga (Moon + Sun)
    let yogaSum = (moonLong + sunLong) % 360;
    const yogaNum = Math.floor(yogaSum / (360 / 27)) + 1;
    const yoga = YOGAS[(yogaNum - 1) % 27];

    // 5. Karana (Half of Tithi)
    const karanaNum = Math.floor(tithiDiff / 6) + 1;
    // (Simplified karana name logic)
    const karana = `Karana #${karanaNum}`;

    return { tithi: tithiName, vara, nakshatra, yoga, karana };
}

// ═════════════════════════════════════════════════════════════════════════════
// AVASHTA ENGINE (Planetary States)
// ═════════════════════════════════════════════════════════════════════════════

export type BaladiAvastha = 'Bala' | 'Kumara' | 'Yuva' | 'Vriddha' | 'Mritya';

/**
 * Calculate Baladi Avastha (Infant to Dead) based on degrees and sign oddity.
 */
export function calculateBaladiAvastha(longitude: number): BaladiAvastha {
    const degree = longitude % 30;
    const signIdx = Math.floor(longitude / 30);
    const isOdd = signIdx % 2 === 0; // Aries (0), Gemini (2), etc.

    let stateIdx: number;
    if (isOdd) {
        stateIdx = Math.floor(degree / 6);
    } else {
        stateIdx = 4 - Math.floor(degree / 6);
    }

    const states: BaladiAvastha[] = ['Bala', 'Kumara', 'Yuva', 'Vriddha', 'Mritya'];
    return states[stateIdx];
}

// ═════════════════════════════════════════════════════════════════════════════
// D60 DEITY MAPPING (THE 60 SHASHTIAMSHA DEITIES)
// ═════════════════════════════════════════════════════════════════════════════

const D60_DEITIES = [
    'Ghora', 'Rakshasa', 'Deva', 'Kubera', 'Yaksha', 'Kinnara', 'Bhrashta', 'Kulaghna',
    'Garala', 'Vahni', 'Maya', 'Purishaka', 'Apampati', 'Marutwan', 'Kaala', 'Sarpa',
    'Amrita', 'Indu', 'Mridu', 'Komala', 'Heramba', 'Brahma', 'Vishnu', 'Maheshwara',
    'Deva', 'Ardra', 'Kalinasaka', 'Kshitishwara', 'Kamalakara', 'Gulika', 'Mrityu', 'Kaala',
    'Davagni', 'Ghora', 'Adhama', 'Kantaka', 'Sudha', 'Amrita', 'Purnachandra', 'Vishadagdha',
    'Kulanasaka', 'Vamshakshaya', 'Utpata', 'Kaalarupa', 'Saumya', 'Komala', 'Sheetala', 'Damshtrakarala',
    'Indumukha', 'Pravina', 'Kalagni', 'Dandayudha', 'Nirmala', 'Saumya', 'Krura', 'Atisheetala',
    'Amrita', 'Payodhi', 'Bhramana', 'Chandrarekha'
];

/**
 * Get D60 Deity based on 0.5 degree division.
 */
export function getD60Deity(longitude: number): string {
    const degreeInSign = longitude % 30;
    const index = Math.floor(degreeInSign / 0.5);
    const signIdx = Math.floor(longitude / 30);
    const isOdd = signIdx % 2 === 0;

    if (isOdd) {
        return D60_DEITIES[index % 60];
    } else {
        // Reverse order for even signs as per classical rules
        return D60_DEITIES[59 - (index % 60)];
    }
}

// ═════════════════════════════════════════════════════════════════════════════
// VIM SOPAKA BALA (The 20-Point Shodashvarga Strength)
// ═════════════════════════════════════════════════════════════════════════════

const VIM_WEIGHTS: Record<string, number> = {
    D1: 3.5, D2: 1.0, D3: 1.0, D4: 0.5, D7: 0.5, D9: 3.0, D10: 0.5, D12: 0.5,
    D16: 2.0, D20: 0.5, D24: 0.5, D27: 0.5, D30: 1.0, D40: 0.5, D45: 0.5, D60: 4.0
};

/**
 * Calculate Vimsopaka Bala - The ultimate strength across all 16 divisional charts
 */
export function calculateVimsopakaBala(ephemeris: EphemerisData): Record<string, number> {
    const planets = ['sun', 'moon', 'mars', 'mercury', 'jupiter', 'venus', 'saturn'];
    const scores: Record<string, number> = {};
    const vargas = ephemeris.divisionalCharts || {};

    for (const p of planets) {
        let total = 0;
        for (const [vName, weight] of Object.entries(VIM_WEIGHTS)) {
            const chartPlanets = vName === 'D1' ? ephemeris.planets : vargas[vName]?.planets;
            if (chartPlanets) {
                const planetPos = chartPlanets[p as keyof typeof chartPlanets];
                if (planetPos) {
                    // Simplified Sthana score: Own/Exalt = 20, Friend = 15, Neutral = 10, Enemy = 5, Debil = 0
                    const dignity = getDignity(p.charAt(0).toUpperCase() + p.slice(1), planetPos.sign);
                    let base = 10; // Default Neutral
                    if (dignity === 'Exalted') base = 20;
                    else if (dignity === 'Own Sign') base = 18;
                    else if (dignity === 'Friendly') base = 15;
                    else if (dignity === 'Enemy') base = 5;
                    else if (dignity === 'Debilitated') base = 2;

                    total += (base / 20) * weight;
                }
            }
        }
        scores[p.charAt(0).toUpperCase() + p.slice(1)] = parseFloat(total.toFixed(2));
    }
    return scores;
}

// ═════════════════════════════════════════════════════════════════════════════
// BHAVA CHALIT (Cusp-Based House System)
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Detect Bhava Chalit Discrepancy (When planet sign-house differs from cusp-house)
 */
export function detectBhavaChalitDiscrepancy(ephemeris: EphemerisData): { planet: string; rasiHouse: number; chalitHouse: number }[] {
    const discrepancies: { planet: string; rasiHouse: number; chalitHouse: number }[] = [];
    const ascLong = ephemeris.ascendant.longitude;

    // Simplistic Mid-Point House System (Cusp-to-Cusp)
    for (const [name, p] of Object.entries(ephemeris.planets)) {
        const rasiHouse = p.house;
        // Calculate Chalit House: (CurrentLong - AscLong + 360) % 360 / 30
        let chalitHouse = Math.floor(((p.longitude - ascLong + 360) % 360) / 30) + 1;

        if (rasiHouse !== chalitHouse) {
            discrepancies.push({ planet: name.toUpperCase(), rasiHouse, chalitHouse });
        }
    }
    return discrepancies;
}

// ═════════════════════════════════════════════════════════════════════════════
// PANCHADHA SAMBANDHA (5-Fold Relationship)
// ═════════════════════════════════════════════════════════════════════════════

export type Sambandha = 'Atimitra' | 'Mitra' | 'Sama' | 'Shatru' | 'Atishatru';

const NATURAL_FRIENDS: Record<string, string[]> = {
    Sun: ['Moon', 'Mars', 'Jupiter'],
    Moon: ['Sun', 'Mercury'],
    Mars: ['Sun', 'Moon', 'Jupiter'],
    Mercury: ['Sun', 'Venus'],
    Jupiter: ['Sun', 'Moon', 'Mars'],
    Venus: ['Mercury', 'Saturn'],
    Saturn: ['Mercury', 'Venus']
};

const NATURAL_ENEMIES: Record<string, string[]> = {
    Sun: ['Venus', 'Saturn'],
    Moon: [],
    Mars: ['Mercury'],
    Mercury: ['Moon'],
    Jupiter: ['Mercury', 'Venus'],
    Venus: ['Sun', 'Moon'],
    Saturn: ['Sun', 'Moon', 'Mars']
};

/**
 * Calculate Panchadha Sambandha (Natural + Temporal)
 */
export function calculatePanchadhaSambandha(planet: string, other: string, ephemeris: EphemerisData): Sambandha {
    if (planet === other) return 'Mitra'; // Self is neutral/friend

    // 1. Natural Relationship (Naisargika)
    let natural = 0; // 0=Sama, 1=Mitra, -1=Shatru
    if (NATURAL_FRIENDS[planet]?.includes(other)) natural = 1;
    else if (NATURAL_ENEMIES[planet]?.includes(other)) natural = -1;

    // 2. Temporal Relationship (Tatkalika)
    // Friends: 2, 3, 4, 10, 11, 12 from planet
    const p1 = ephemeris.planets[planet.toLowerCase() as keyof typeof ephemeris.planets];
    const p2 = ephemeris.planets[other.toLowerCase() as keyof typeof ephemeris.planets];
    if (!p1 || !p2) return 'Sama';

    const dist = ((p2.house - p1.house + 12) % 12) + 1;
    let temporal = ([2, 3, 4, 10, 11, 12].includes(dist)) ? 1 : -1;

    // 3. Composite (Panchadha)
    const combined = natural + temporal;
    if (combined === 2) return 'Atimitra';
    if (combined === 1) return 'Mitra';
    if (combined === 0) return 'Sama';
    if (combined === -1) return 'Shatru';
    return 'Atishatru';
}

// ═════════════════════════════════════════════════════════════════════════════
// ISHTA / KASHTA PHALA (Benefic/Malefic Results)
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Calculate Ishta Phala - Benefic fruit of a planet (0-60 points)
 */
export function calculateIshtaKashtaPhala(planet: string, ephemeris: EphemerisData): { ishta: number; kashta: number } {
    const p = ephemeris.planets[planet.toLowerCase() as keyof typeof ephemeris.planets];
    if (!p) return { ishta: 0, kashta: 0 };

    // 1. Uchcha Bala (Exaltation strength)
    const exalt = EXALTATION_DEGREES[planet as keyof typeof EXALTATION_DEGREES] || 0;
    const diff = Math.min(Math.abs(p.longitude - exalt), 180);
    const ucchBala = ((180 - diff) / 180) * 60;

    // 2. Cheshta Bala (Speed/Retrograde)
    // Simplified: Retrograde = high cheshta for malefic, etc.
    const cheshtaBala = p.retro ? 60 : 30;

    const ishta = Math.sqrt(ucchBala * cheshtaBala);
    const kashta = 60 - ishta;

    return { ishta: parseFloat(ishta.toFixed(2)), kashta: parseFloat(kashta.toFixed(2)) };
}

const EXALTATION_DEGREES: Record<string, number> = {
    Sun: 10, Moon: 33, Mars: 298, Mercury: 165, Jupiter: 95, Venus: 357, Saturn: 200
};
