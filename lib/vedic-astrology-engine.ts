// lib/vedic-astrology-engine.ts
// Expert-level Vedic Astrology calculations
// Vimshottari Dasha, Transits, House Analysis

// ═════════════════════════════════════════════════════════════════════════════
// ASTROLOGICAL CONSTANTS
// ═════════════════════════════════════════════════════════════════════════════

// Lahiri Ayanamsa calculation constants
// Current Lahiri Ayanamsa = 24.1398° (for 2024, increases ~50" per year)
const AYANAMSA_J2000 = 23.8529722; // Lahiri Ayanamsa at J2000.0
const AYANAMSA_RATE = 50.27 / 3600; // degrees per year

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
    antardashas: AntardashaPeriod[];
}

export interface AntardashaPeriod {
    lord: string;
    startDate: Date;
    endDate: Date;
    durationDays: number;
}

export interface DashaAtDate {
    mahadasha: string;
    antardasha: string;
    pratyantardasha: string;
    mahadashaStart: Date;
    mahadashaEnd: Date;
    antardashaStart: Date;
    antardashaEnd: Date;
}

// ═════════════════════════════════════════════════════════════════════════════
// AYANAMSA CALCULATION
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Calculate Lahiri Ayanamsa for a given Julian Day
 */
export function calculateLahiriAyanamsa(julianDay: number): number {
    const J2000 = 2451545.0;
    const yearsSinceJ2000 = (julianDay - J2000) / 365.25;
    return AYANAMSA_J2000 + (AYANAMSA_RATE * yearsSinceJ2000);
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
    birthDate: Date
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
        antardashas: calculateAntardashas(
            birthNakshatraLord,
            currentDate,
            firstEndDate,
            positionInNakshatra // Start from current position
        ),
    });
    currentDate = firstEndDate;
    dashaIndex = (dashaIndex + 1) % 9;

    // Remaining full periods (for ~100+ years from birth)
    for (let cycle = 0; cycle < 2; cycle++) { // 2 cycles = 240 years coverage
        for (let i = 0; i < 9; i++) {
            const lord = DASHA_SEQUENCE[dashaIndex];
            const years = DASHA_YEARS[lord];
            const endDate = addYears(currentDate, years);

            periods.push({
                lord,
                startDate: new Date(currentDate),
                endDate,
                durationYears: years,
                antardashas: calculateAntardashas(lord, currentDate, endDate, 0),
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
function calculateAntardashas(
    mahadashaLord: string,
    startDate: Date,
    endDate: Date,
    startOffset: number = 0 // 0-1, how much of first antardasha has elapsed
): AntardashaPeriod[] {
    const mahadashaYears = DASHA_YEARS[mahadashaLord];
    const totalDays = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);

    const antardashas: AntardashaPeriod[] = [];
    let currentDate = new Date(startDate);

    // Find starting index (antardasha sequence starts with mahadasha lord)
    let startIndex = DASHA_SEQUENCE.indexOf(mahadashaLord);

    for (let i = 0; i < 9; i++) {
        const index = (startIndex + i) % 9;
        const lord = DASHA_SEQUENCE[index];
        const lordYears = DASHA_YEARS[lord];

        // Antardasha duration = (Mahadasha years × Antardasha planet years) / Total cycle
        const proportionalDays = (mahadashaYears * lordYears / TOTAL_DASHA_YEARS) * 365.25;

        // Apply offset for first antardasha if needed
        let actualDays = proportionalDays;
        if (i === 0 && startOffset > 0) {
            const elapsedDays = startOffset * proportionalDays;
            actualDays = proportionalDays - elapsedDays;
            // Skip this antardasha if fully elapsed
            if (actualDays <= 0) continue;
        }

        const endDateAntardasha = new Date(currentDate.getTime() + actualDays * 24 * 60 * 60 * 1000);

        antardashas.push({
            lord,
            startDate: new Date(currentDate),
            endDate: endDateAntardasha,
            durationDays: Math.round(actualDays),
        });

        currentDate = endDateAntardasha;
    }

    return antardashas;
}

/**
 * Get Dasha active on a specific date
 * Used to verify life events
 */
export function getDashaForDate(
    periods: DashaPeriod[],
    eventDate: Date
): DashaAtDate | null {
    for (const mahadasha of periods) {
        if (eventDate >= mahadasha.startDate && eventDate <= mahadasha.endDate) {
            // Find antardasha
            for (const antardasha of mahadasha.antardashas) {
                if (eventDate >= antardasha.startDate && eventDate <= antardasha.endDate) {
                    return {
                        mahadasha: mahadasha.lord,
                        antardasha: antardasha.lord,
                        pratyantardasha: '', // Can add if needed
                        mahadashaStart: mahadasha.startDate,
                        mahadashaEnd: mahadasha.endDate,
                        antardashaStart: antardasha.startDate,
                        antardashaEnd: antardasha.endDate,
                    };
                }
            }

            // If no antardasha found, return just mahadasha
            return {
                mahadasha: mahadasha.lord,
                antardasha: 'Unknown',
                pratyantardasha: '',
                mahadashaStart: mahadasha.startDate,
                mahadashaEnd: mahadasha.endDate,
                antardashaStart: new Date(),
                antardashaEnd: new Date(),
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

        // Add antardashas
        for (const antar of period.antardashas) {
            const aStart = formatDate(antar.startDate);
            const aEnd = formatDate(antar.endDate);
            lines.push(`  └─ ${period.lord}/${antar.lord}: ${aStart} to ${aEnd}`);
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
    };
}

