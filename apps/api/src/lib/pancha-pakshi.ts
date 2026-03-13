/**
 * 🔱 PANCHA-PAKSHI SHASTRA (Five Birds System)
 * =============================================
 *
 * An ancient Tamil Siddha system for birth time verification.
 * Based on the five sacred birds representing different energies.
 *
 * THE FIVE BIRDS (Pakshis):
 * 1. Vulture (Giddha) - Earth element, stability, karma clearance
 * 2. Owl (Uluka) - Water element, intuition, hidden knowledge
 * 3. Crow (Kaka) - Fire element, transformation, messages
 * 4. Cock (Kukkuta) - Air element, vitality, new beginnings
 * 5. Peacock (Mayura) - Ether element, beauty, spiritual evolution
 *
 * APPLICATION IN BTR:
 * - Each bird rules specific times of day
 * - Birth during a bird's ruling period influences personality
 * - Activity strength varies based on bird-day-time combination
 * - Provides cross-verification with Lagna and Moon placement
 *
 * TIME CYCLE:
 * - Each bird rules specific hours in a sequence
 * - Sequence differs for daytime and nighttime births
 * - Weekday affects which bird is active
 */

export interface PakshiData {
    name: string;
    sanskritName: string;
    element: string;
    rulingHours: number[];
    qualities: string[];
    dominantActivities: string[];
    weakActivities: string[];
}

export interface PakshiAnalysis {
    rulingBird: PakshiData;
    secondaryBird: PakshiData | null;
    birdStrength: 'excellent' | 'good' | 'moderate' | 'weak';
    birthTimeQuality: string;
    activityStrengths: string[];
    activityWeaknesses: string[];
    personalityTraits: string[];
    verificationNotes: string;
}

const PAKSHIS: PakshiData[] = [
    {
        name: 'Vulture',
        sanskritName: 'Giddha',
        element: 'Earth',
        rulingHours: [0, 5, 10, 15, 20],
        qualities: ['patient', 'detached', 'karmic', 'transformative'],
        dominantActivities: ['spiritual practices', 'healing', 'clearing past karma', 'detached service'],
        weakActivities: ['material pursuits', 'new beginnings', 'social activities']
    },
    {
        name: 'Owl',
        sanskritName: 'Uluka',
        element: 'Water',
        rulingHours: [1, 6, 11, 16, 21],
        qualities: ['intuitive', 'wise', 'secretive', 'nocturnal'],
        dominantActivities: ['research', 'occult studies', 'night work', 'introspection'],
        weakActivities: ['public speaking', 'day activities', 'fast decisions']
    },
    {
        name: 'Crow',
        sanskritName: 'Kaka',
        element: 'Fire',
        rulingHours: [2, 7, 12, 17, 22],
        qualities: ['clever', 'adaptable', 'communicative', 'mystical'],
        dominantActivities: ['communication', 'travel', 'messaging', 'social work'],
        weakActivities: ['deep study', 'isolation', 'slow processes']
    },
    {
        name: 'Cock',
        sanskritName: 'Kukkuta',
        element: 'Air',
        rulingHours: [3, 8, 13, 18, 23],
        qualities: ['courageous', 'alert', 'punctual', 'protective'],
        dominantActivities: ['leadership', 'protection', 'early morning activities', 'announcements'],
        weakActivities: ['night work', 'subtle work', 'patience-required tasks']
    },
    {
        name: 'Peacock',
        sanskritName: 'Mayura',
        element: 'Ether',
        rulingHours: [4, 9, 14, 19],
        qualities: ['beautiful', 'proud', 'creative', 'auspicious'],
        dominantActivities: ['arts', 'beauty', 'display', 'celebration', 'spiritual arts'],
        weakActivities: ['menial work', 'behind-scenes work', 'humble service']
    }
];

const WEEKDAY_BIRD_PRIORITY: Record<number, number[]> = {
    0: [0, 1, 2, 3, 4],
    1: [1, 2, 3, 4, 0],
    2: [2, 3, 4, 0, 1],
    3: [3, 4, 0, 1, 2],
    4: [4, 0, 1, 2, 3],
    5: [0, 2, 4, 1, 3],
    6: [1, 3, 0, 2, 4]
};

const ZODIAC_ELEMENTS: Record<string, string> = {
    'Aries': 'Fire', 'Leo': 'Fire', 'Sagittarius': 'Fire',
    'Taurus': 'Earth', 'Virgo': 'Earth', 'Capricorn': 'Earth',
    'Gemini': 'Air', 'Libra': 'Air', 'Aquarius': 'Air',
    'Cancer': 'Water', 'Scorpio': 'Water', 'Pisces': 'Water'
};

export function analyzePakshi(
    birthHour: number,
    birthMinute: number,
    weekday: number,
    lagnaSign: string,
    moonSign: string
): PakshiAnalysis {
    const totalMinutes = birthHour * 60 + birthMinute;

    const birdIndex = findRulingBird(totalMinutes, weekday);
    const rulingBird = PAKSHIS[birdIndex];

    const secondaryBirdIndex = findSecondaryBird(birdIndex, totalMinutes);
    const secondaryBird = secondaryBirdIndex !== null ? PAKSHIS[secondaryBirdIndex] : null;

    const lagnaElement = ZODIAC_ELEMENTS[lagnaSign] || 'Unknown';
    const moonElement = ZODIAC_ELEMENTS[moonSign] || 'Unknown';

    const birdStrength = calculateBirdStrength(
        rulingBird.element,
        lagnaElement,
        moonElement,
        birthHour
    );

    const activityStrengths = rulingBird.dominantActivities;
    const activityWeaknesses = rulingBird.weakActivities;

    const personalityTraits = generatePersonalityTraits(rulingBird, lagnaElement);

    const birthTimeQuality = getBirthTimeQuality(birdStrength, rulingBird);

    const verificationNotes = generateVerificationNotes(
        rulingBird,
        lagnaElement,
        moonElement,
        birdStrength
    );

    return {
        rulingBird,
        secondaryBird,
        birdStrength,
        birthTimeQuality,
        activityStrengths,
        activityWeaknesses,
        personalityTraits,
        verificationNotes
    };
}

function findRulingBird(totalMinutes: number, weekday: number): number {
    const hour = Math.floor(totalMinutes / 60);
    const priority = WEEKDAY_BIRD_PRIORITY[weekday] || WEEKDAY_BIRD_PRIORITY[0];

    const hourInCycle = hour % 5;

    for (let i = 0; i < 5; i++) {
        const birdIndex = priority[i];
        const pakshi = PAKSHIS[birdIndex];
        if (pakshi.rulingHours.includes(hour)) {
            return birdIndex;
        }
    }

    return priority[hourInCycle];
}

function findSecondaryBird(primaryIndex: number, totalMinutes: number): number | null {
    const minute = totalMinutes % 60;

    const transitionMinutes = [15, 30, 45];

    for (const tm of transitionMinutes) {
        if (Math.abs(minute - tm) <= 10) {
            const nextBirdIndex = (primaryIndex + 1) % 5;
            return nextBirdIndex;
        }
    }

    return null;
}

function calculateBirdStrength(
    birdElement: string,
    lagnaElement: string,
    moonElement: string,
    birthHour: number
): 'excellent' | 'good' | 'moderate' | 'weak' {
    let score = 0;

    if (birdElement === lagnaElement) score += 3;
    else if (isHarmonious(birdElement, lagnaElement)) score += 1;

    if (birdElement === moonElement) score += 2;
    else if (isHarmonious(birdElement, moonElement)) score += 1;

    if ((birthHour >= 6 && birthHour < 18) && birdElement === 'Fire') score += 1;
    if ((birthHour < 6 || birthHour >= 18) && birdElement === 'Water') score += 1;

    if (score >= 5) return 'excellent';
    if (score >= 3) return 'good';
    if (score >= 1) return 'moderate';
    return 'weak';
}

function isHarmonious(element1: string, element2: string): boolean {
    const harmoniousPairs = [
        ['Earth', 'Water'],
        ['Water', 'Earth'],
        ['Fire', 'Air'],
        ['Air', 'Fire'],
        ['Ether', 'Fire'],
        ['Fire', 'Ether']
    ];

    return harmoniousPairs.some(
        pair => pair[0] === element1 && pair[1] === element2
    );
}

function generatePersonalityTraits(pakshi: PakshiData, lagnaElement: string): string[] {
    const traits: string[] = [...pakshi.qualities];

    if (pakshi.element === lagnaElement) {
        traits.push('strong elemental alignment');
        traits.push('natural expression of ' + pakshi.element + ' energy');
    }

    switch (pakshi.name) {
        case 'Vulture':
            traits.push('spiritual inclination', 'karmic awareness', 'detachment');
            break;
        case 'Owl':
            traits.push('wisdom', 'intuition', 'secret knowledge');
            break;
        case 'Crow':
            traits.push('communication skills', 'adaptability', 'mysticism');
            break;
        case 'Cock':
            traits.push('courage', 'leadership', 'alertness');
            break;
        case 'Peacock':
            traits.push('creativity', 'beauty', 'auspiciousness');
            break;
    }

    return [...new Set(traits)];
}

function getBirthTimeQuality(
    strength: 'excellent' | 'good' | 'moderate' | 'weak',
    pakshi: PakshiData
): string {
    const qualities: Record<string, string> = {
        'excellent': `Excellent birth time with strong ${pakshi.name} (${pakshi.element}) influence. Highly auspicious for ${pakshi.dominantActivities.slice(0, 2).join(' and ')}.`,
        'good': `Good birth time with ${pakshi.name} (${pakshi.element}) ruling. Favorable for ${pakshi.dominantActivities.slice(0, 2).join(' and ')}.`,
        'moderate': `Moderate birth time quality. ${pakshi.name} provides average influence. May need effort in ${pakshi.dominantActivities[0]}.`,
        'weak': `Weak birth time alignment. ${pakshi.name} influence is subdued. Challenges in ${pakshi.dominantActivities[0]} may require remedies.`
    };

    return qualities[strength];
}

function generateVerificationNotes(
    pakshi: PakshiData,
    lagnaElement: string,
    moonElement: string,
    strength: string
): string {
    const notes: string[] = [];

    notes.push(`Pakshi: ${pakshi.name} (${pakshi.sanskritName}) ruling at birth time.`);

    if (pakshi.element === lagnaElement) {
        notes.push(`✓ Bird element (${pakshi.element}) matches Lagna element - Strong confirmation.`);
    } else if (isHarmonious(pakshi.element, lagnaElement)) {
        notes.push(`✓ Bird element (${pakshi.element}) harmonious with Lagna (${lagnaElement}) - Good.`);
    } else {
        notes.push(`⚠ Bird element (${pakshi.element}) differs from Lagna (${lagnaElement}) - Verify.`);
    }

    if (pakshi.element === moonElement) {
        notes.push(`✓ Bird element matches Moon element - Emotional alignment confirmed.`);
    }

    if (strength === 'excellent' || strength === 'good') {
        notes.push(`Pakshi analysis supports the birth time being accurate.`);
    } else {
        notes.push(`Pakshi analysis suggests verifying birth time ±10-15 minutes.`);
    }

    return notes.join(' ');
}

export function getPakshiForHour(hour: number): PakshiData {
    for (const pakshi of PAKSHIS) {
        if (pakshi.rulingHours.includes(hour)) {
            return pakshi;
        }
    }
    return PAKSHIS[0];
}

export { PAKSHIS, WEEKDAY_BIRD_PRIORITY };
