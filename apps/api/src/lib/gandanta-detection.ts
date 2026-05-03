/**
 * 🔱 GANDANTA DETECTION SYSTEM (Karmic Knot Detection)
 * =====================================================
 *
 * Gandanta (गंडांत) - The Karmic Knot Points
 * These are the junction points where Water signs meet Fire signs.
 * Births near these points carry special karmic significance.
 *
 * THREE GANDANTA POINTS:
 * 1. Pisces (Revati) ↔ Aries (Ashwini) - 0° Aries - Moksha Gandanta
 * 2. Cancer (Ashlesha) ↔ Leo (Magha) - 0° Leo - Rajas Gandanta
 * 3. Scorpio (Jyeshtha) ↔ Sagittarius (Mula) - 0° Sagittarius - Tamas Gandanta
 *
 * SIGNIFICANCE:
 * - Lagna Gandanta: Life struggles, spiritual transformation
 * - Moon Gandanta: Emotional intensity, past life karma
 * - Both in Gandanta: Highly evolved soul with major life purpose
 *
 * TIME SENSITIVITY:
 * - Gandanta zone: ±1° from the junction point
 * - Lagna: ~4 minutes per degree = ±4 minutes sensitive window
 * - Moon: ~2 hours per degree = ±2 hours sensitive window
 */

import { ZODIAC_SIGNS } from '@ai-pandit/shared';
export interface GandantaPoint {
    name: string;
    type: 'moksha' | 'rajas' | 'tamas';
    junctionDegree: number;
    fromSign: string;
    toSign: string;
    fromNakshatra: string;
    toNakshatra: string;
    significance: string;
}

export interface GandantaAnalysis {
    isLagnaGandanta: boolean;
    isMoonGandanta: boolean;
    lagnaGandantaType: string | null;
    moonGandantaType: string | null;
    distanceToGandanta: number;
    severity: 'critical' | 'high' | 'moderate' | 'low' | 'none';
    interpretation: string;
    recommendations: string[];
}

const GANDANTA_POINTS: GandantaPoint[] = [
    {
        name: 'Pisces-Aries Gandanta',
        type: 'moksha',
        junctionDegree: 0,
        fromSign: 'Pisces',
        toSign: 'Aries',
        fromNakshatra: 'Revati',
        toNakshatra: 'Ashwini',
        significance: 'Moksha Gandanta - Spiritual liberation, past life completion, divine connection'
    },
    {
        name: 'Cancer-Leo Gandanta',
        type: 'rajas',
        junctionDegree: 120,
        fromSign: 'Cancer',
        toSign: 'Leo',
        fromNakshatra: 'Ashlesha',
        toNakshatra: 'Magha',
        significance: 'Rajas Gandanta - Worldly achievements, power, ancestral karma'
    },
    {
        name: 'Scorpio-Sagittarius Gandanta',
        type: 'tamas',
        junctionDegree: 240,
        fromSign: 'Scorpio',
        toSign: 'Sagittarius',
        fromNakshatra: 'Jyeshtha',
        toNakshatra: 'Mula',
        significance: 'Tamas Gandanta - Transformation, hidden knowledge, intense experiences'
    }
];


const NAKSHATRAS = [
    'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra',
    'Punarvasu', 'Pushya', 'Ashlesha', 'Magha', 'PurvaPhalguni', 'UttaraPhalguni',
    'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha',
    'Mula', 'PurvaAshadha', 'UttaraAshadha', 'Shravana', 'Dhanishta', 'Shatabhisha',
    'PurvaBhadrapada', 'UttaraBhadrapada', 'Revati'
];

const GANDANTA_DEGREE_THRESHOLD = 1.0;
const GANDANTA_CRITICAL_THRESHOLD = 0.5;

export function detectGandanta(
    lagnaLongitude: number,
    moonLongitude: number
): GandantaAnalysis {
    const lagnaGandanta = checkGandantaForLongitude(lagnaLongitude);
    const moonGandanta = checkGandantaForLongitude(moonLongitude);

    const isLagnaGandanta = lagnaGandanta !== null;
    const isMoonGandanta = moonGandanta !== null;

    let severity: 'critical' | 'high' | 'moderate' | 'low' | 'none' = 'none';
    let distanceToGandanta = Infinity;

    if (isLagnaGandanta && isMoonGandanta) {
        severity = 'critical';
        distanceToGandanta = Math.min(
            lagnaGandanta.distance,
            moonGandanta.distance
        );
    } else if (isLagnaGandanta) {
        severity = lagnaGandanta.distance < GANDANTA_CRITICAL_THRESHOLD ? 'critical' : 'high';
        distanceToGandanta = lagnaGandanta.distance;
    } else if (isMoonGandanta) {
        severity = moonGandanta.distance < GANDANTA_CRITICAL_THRESHOLD ? 'critical' : 'high';
        distanceToGandanta = moonGandanta.distance;
    }

    const interpretation = generateInterpretation(isLagnaGandanta, isMoonGandanta, lagnaGandanta, moonGandanta);
    const recommendations = generateRecommendations(severity, isLagnaGandanta, isMoonGandanta);

    return {
        isLagnaGandanta,
        isMoonGandanta,
        lagnaGandantaType: lagnaGandanta?.type || null,
        moonGandantaType: moonGandanta?.type || null,
        distanceToGandanta,
        severity,
        interpretation,
        recommendations
    };
}

function checkGandantaForLongitude(longitude: number): {
    type: string;
    distance: number;
    point: GandantaPoint;
} | null {
    const normalizedLong = ((longitude % 360) + 360) % 360;

    for (const point of GANDANTA_POINTS) {
        const gandantaDeg = point.junctionDegree;

        let distance: number;
        if (gandantaDeg === 0) {
            if (normalizedLong >= 359 || normalizedLong <= 1) {
                distance = normalizedLong >= 359 ? (360 - normalizedLong) : normalizedLong;
            } else {
                continue;
            }
        } else {
            distance = Math.min(
                Math.abs(normalizedLong - gandantaDeg),
                Math.abs(normalizedLong - gandantaDeg + 360),
                Math.abs(normalizedLong - gandantaDeg - 360)
            );
        }

        if (distance <= GANDANTA_DEGREE_THRESHOLD) {
            return {
                type: point.type,
                distance,
                point
            };
        }
    }

    return null;
}

function generateInterpretation(
    isLagnaGandanta: boolean,
    isMoonGandanta: boolean,
    lagnaGandanta: { type: string; distance: number; point: GandantaPoint } | null,
    moonGandanta: { type: string; distance: number; point: GandantaPoint } | null
): string {
    if (!isLagnaGandanta && !isMoonGandanta) {
        return 'Birth time is clear of Gandanta zones. No special karmic sensitivity detected.';
    }

    if (isLagnaGandanta && isMoonGandanta) {
        return `⚠️ DOUBLE GANDANTA DETECTED! Both Lagna and Moon are in Gandanta zones. 
Lagna: ${lagnaGandanta?.point.name} (${lagnaGandanta?.type} type)
Moon: ${moonGandanta?.point.name} (${moonGandanta?.type} type)
This indicates a highly evolved soul with significant past life karma to resolve. 
Life will involve major transformation and spiritual awakening.`;
    }

    if (isLagnaGandanta) {
        return `Lagna is in ${lagnaGandanta?.point.name} (${lagnaGandanta?.type} Gandanta).
${lagnaGandanta?.point.significance}
The person's life path involves navigating karmic challenges related to this junction.`;
    }

    if (isMoonGandanta) {
        return `Moon is in ${moonGandanta?.point.name} (${moonGandanta?.type} Gandanta).
${moonGandanta?.point.significance}
Emotional life and inner psyche carry the weight of past life experiences.`;
    }

    return '';
}

function generateRecommendations(
    severity: string,
    isLagnaGandanta: boolean,
    isMoonGandanta: boolean
): string[] {
    const recommendations: string[] = [];

    if (severity === 'none') {
        recommendations.push('No Gandanta-specific recommendations needed.');
        return recommendations;
    }

    recommendations.push('⚠️ Birth time requires extra verification due to Gandanta proximity.');

    if (severity === 'critical') {
        recommendations.push('CRITICAL: Birth time may need ±2-4 minute adjustment.');
        recommendations.push('Consider birth time within ±4 minutes of reported time.');
    }

    if (isLagnaGandanta) {
        recommendations.push('Lagna Gandanta: Life events may show delayed or accelerated timing.');
        recommendations.push('Verify major life events against both adjacent sign periods.');
    }

    if (isMoonGandanta) {
        recommendations.push('Moon Gandanta: Emotional patterns may be intense or transformative.');
        recommendations.push('Dasha periods may show unusual intensity at transitions.');
    }

    if (severity === 'critical' || severity === 'high') {
        recommendations.push('Recommend spiritual remedies: Meditation, mantra, or service activities.');
        recommendations.push('Past life regression or karmic healing may be beneficial.');
    }

    return recommendations;
}

export function getNakshatraFromLongitude(longitude: number): string {
    const nakshatraSpan = 360 / 27;
    const nakshatraIndex = Math.floor(longitude / nakshatraSpan);
    return NAKSHATRAS[nakshatraIndex];
}

export function getSignFromLongitude(longitude: number): string {
    const signIndex = Math.floor(longitude / 30);
    return ZODIAC_SIGNS[signIndex];
}

export { GANDANTA_POINTS, GANDANTA_DEGREE_THRESHOLD, GANDANTA_CRITICAL_THRESHOLD };
