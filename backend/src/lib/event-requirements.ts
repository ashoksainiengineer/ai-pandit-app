// lib/event-requirements.ts
// Comprehensive event requirements for 99%+ BTR accuracy
// Maps each event to Vedic analysis methods and accuracy contribution

export interface EventRequirement {
    eventType: string;
    category: string;
    importance: 'critical' | 'high' | 'medium';
    accuracyBoost: number; // Percentage boost to overall accuracy
    methods: VedicMethod[]; // Which BTR methods this event helps verify
    explanation: string; // Why this event matters for BTR
    icon: string;
}

export interface VedicMethod {
    name: string;
    shortName: string;
    description: string;
}

// All Vedic methods used in BTR
export const VEDIC_METHODS = {
    VIMSHOTTARI: {
        name: 'Vimshottari Dasha',
        shortName: 'VD',
        description: 'Primary 120-year planetary period system based on Moon nakshatra'
    },
    YOGINI: {
        name: 'Yogini Dasha',
        shortName: 'YD',
        description: '36-year cycle dasha for event timing verification'
    },
    CHARA: {
        name: 'Chara Dasha',
        shortName: 'CD',
        description: 'Jaimini sign-based dasha for career and relationships'
    },
    NAVAMSA: {
        name: 'Navamsa (D9) Analysis',
        shortName: 'D9',
        description: 'Marriage and dharma divisional chart'
    },
    DASHAMSA: {
        name: 'Dashamsa (D10) Analysis',
        shortName: 'D10',
        description: 'Career and profession divisional chart'
    },
    SAPTAMSA: {
        name: 'Saptamsa (D7) Analysis',
        shortName: 'D7',
        description: 'Children and progeny divisional chart'
    },
    HORA: {
        name: 'Hora (D2) Analysis',
        shortName: 'D2',
        description: 'Wealth and financial gains chart'
    },
    TRIMSAMSA: {
        name: 'Trimsamsa (D30) Analysis',
        shortName: 'D30',
        description: 'Misfortunes, accidents, and health chart'
    },
    TRANSIT: {
        name: 'Transit Analysis',
        shortName: 'TR',
        description: 'Saturn, Jupiter, Rahu-Ketu transit verification'
    },
    ASHTAKAVARGA: {
        name: 'Ashtakavarga',
        shortName: 'AV',
        description: 'Point-based strength analysis for timing'
    },
    LAGNA: {
        name: 'Lagna Verification',
        shortName: 'LG',
        description: 'Ascendant sign confirmation through physical traits'
    },
    NAKSHATRA: {
        name: 'Nakshatra Analysis',
        shortName: 'NK',
        description: 'Birth star and pada verification'
    },
    PRATYANTARA: {
        name: 'Pratyantara Dasha',
        shortName: 'PD',
        description: 'Sub-sub period for precise event timing'
    },
    ARUDHA: {
        name: 'Arudha Lagna',
        shortName: 'AL',
        description: 'Public image and worldly success verification'
    },
    SECONDARY_PROG: {
        name: 'Secondary Progressions',
        shortName: 'SP',
        description: 'Day-for-year progression for life events'
    }
} as const;

// Categories with their required events for 99%+ accuracy
export interface CategoryRequirement {
    id: string;
    name: string;
    icon: string;
    description: string;
    minimumEvents: number;
    totalAccuracyContribution: number; // Max achievable from this category
    events: EventRequirement[];
    color: string;
}

export const EVENT_REQUIREMENTS: CategoryRequirement[] = [
    {
        id: 'marriage',
        name: 'Marriage & Relationships',
        icon: '💍',
        color: '#E879F9',
        description: 'These events verify 7th house, Venus, Jupiter and Navamsa chart',
        minimumEvents: 2,
        totalAccuracyContribution: 18,
        events: [
            {
                eventType: 'Wedding / Marriage Ceremony',
                category: 'marriage',
                importance: 'critical',
                accuracyBoost: 8,
                icon: '💒',
                methods: [
                    VEDIC_METHODS.VIMSHOTTARI,
                    VEDIC_METHODS.NAVAMSA,
                    VEDIC_METHODS.CHARA,
                    VEDIC_METHODS.TRANSIT,
                    VEDIC_METHODS.YOGINI
                ],
                explanation: 'Marriage timing is one of the strongest rectification markers. It verifies the 7th house lord dasha, Venus/Jupiter periods, and Navamsa activation. Saturn and Jupiter transits to 7th house confirm the exact timing window.'
            },
            {
                eventType: 'Engagement Ceremony',
                category: 'marriage',
                importance: 'high',
                accuracyBoost: 4,
                icon: '💍',
                methods: [
                    VEDIC_METHODS.VIMSHOTTARI,
                    VEDIC_METHODS.NAVAMSA,
                    VEDIC_METHODS.TRANSIT
                ],
                explanation: 'Engagement activates 7th house significations in a preliminary way. Often occurs in Venus or 7th lord sub-period.'
            },
            {
                eventType: 'First Meeting with Spouse',
                category: 'marriage',
                importance: 'high',
                accuracyBoost: 3,
                icon: '❤️',
                methods: [
                    VEDIC_METHODS.VIMSHOTTARI,
                    VEDIC_METHODS.PRATYANTARA,
                    VEDIC_METHODS.TRANSIT
                ],
                explanation: 'The first meeting often occurs in related dasha periods. Venus, 7th lord, or 5th lord periods typically active.'
            },
            {
                eventType: 'Divorce Finalized',
                category: 'marriage',
                importance: 'high',
                accuracyBoost: 3,
                icon: '💔',
                methods: [
                    VEDIC_METHODS.VIMSHOTTARI,
                    VEDIC_METHODS.CHARA,
                    VEDIC_METHODS.TRANSIT,
                    VEDIC_METHODS.TRIMSAMSA
                ],
                explanation: 'Divorce timing verifies 6th lord (separations), Saturn influence on 7th, and D30 chart activation for difficulties.'
            }
        ]
    },
    {
        id: 'career',
        name: 'Career & Profession',
        icon: '💼',
        color: '#D4AF37',
        description: 'These events verify 10th house, Saturn, Sun and Dashamsa chart',
        minimumEvents: 3,
        totalAccuracyContribution: 20,
        events: [
            {
                eventType: 'First Job Started',
                category: 'career',
                importance: 'critical',
                accuracyBoost: 7,
                icon: '🎯',
                methods: [
                    VEDIC_METHODS.VIMSHOTTARI,
                    VEDIC_METHODS.DASHAMSA,
                    VEDIC_METHODS.CHARA,
                    VEDIC_METHODS.TRANSIT,
                    VEDIC_METHODS.ARUDHA
                ],
                explanation: 'First job marks the activation of 10th house in the chart. The Dashamsa (D10) becomes active, and 10th lord dasha/antardasha typically runs. Saturn transit to key houses confirms timing.'
            },
            {
                eventType: 'Major Promotion',
                category: 'career',
                importance: 'high',
                accuracyBoost: 5,
                icon: '📈',
                methods: [
                    VEDIC_METHODS.VIMSHOTTARI,
                    VEDIC_METHODS.DASHAMSA,
                    VEDIC_METHODS.TRANSIT,
                    VEDIC_METHODS.ASHTAKAVARGA
                ],
                explanation: 'Promotions occur when positive dasha lords interact with 10th house. Jupiter/Sun periods often active. High Ashtakavarga in 10th confirms the exact time.'
            },
            {
                eventType: 'Job Change / New Company',
                category: 'career',
                importance: 'high',
                accuracyBoost: 4,
                icon: '🔄',
                methods: [
                    VEDIC_METHODS.VIMSHOTTARI,
                    VEDIC_METHODS.CHARA,
                    VEDIC_METHODS.TRANSIT
                ],
                explanation: 'Job changes often occur in 3rd or 9th lord periods (movement). Rahu periods can also trigger career shifts.'
            },
            {
                eventType: 'Started Own Business',
                category: 'career',
                importance: 'high',
                accuracyBoost: 4,
                icon: '🏢',
                methods: [
                    VEDIC_METHODS.VIMSHOTTARI,
                    VEDIC_METHODS.DASHAMSA,
                    VEDIC_METHODS.HORA,
                    VEDIC_METHODS.CHARA
                ],
                explanation: 'Business start activates 7th house (partnership/business) and 10th house. Mercury and Jupiter periods are typically strong.'
            }
        ]
    },
    {
        id: 'education',
        name: 'Education & Learning',
        icon: '🎓',
        color: '#6B9AC4',
        description: 'These events verify 4th, 5th, 9th houses and Mercury/Jupiter',
        minimumEvents: 2,
        totalAccuracyContribution: 12,
        events: [
            {
                eventType: 'Graduation / Degree Completed',
                category: 'education',
                importance: 'critical',
                accuracyBoost: 5,
                icon: '🎓',
                methods: [
                    VEDIC_METHODS.VIMSHOTTARI,
                    VEDIC_METHODS.TRANSIT,
                    VEDIC_METHODS.NAKSHATRA
                ],
                explanation: 'Graduation timing verifies 4th house (education), 5th house (learning), and 9th house (higher studies). Mercury and Jupiter periods typically active.'
            },
            {
                eventType: '10th/12th Board Exam Results',
                category: 'education',
                importance: 'high',
                accuracyBoost: 4,
                icon: '📝',
                methods: [
                    VEDIC_METHODS.VIMSHOTTARI,
                    VEDIC_METHODS.PRATYANTARA,
                    VEDIC_METHODS.TRANSIT
                ],
                explanation: 'Board exam results are precise events that help narrow down the birth time using pratyantara dasha level analysis.'
            },
            {
                eventType: 'Started Studying Abroad',
                category: 'education',
                importance: 'high',
                accuracyBoost: 3,
                icon: '✈️',
                methods: [
                    VEDIC_METHODS.VIMSHOTTARI,
                    VEDIC_METHODS.CHARA,
                    VEDIC_METHODS.TRANSIT
                ],
                explanation: 'Foreign education activates 9th house (foreign), 12th house (foreign lands), and 4th house (education). Rahu often involved.'
            }
        ]
    },
    {
        id: 'children',
        name: 'Children & Progeny',
        icon: '👶',
        color: '#5CB57B',
        description: 'These events verify 5th house, Jupiter and Saptamsa chart',
        minimumEvents: 1,
        totalAccuracyContribution: 15,
        events: [
            {
                eventType: 'First Child Born',
                category: 'children',
                importance: 'critical',
                accuracyBoost: 8,
                icon: '👶',
                methods: [
                    VEDIC_METHODS.VIMSHOTTARI,
                    VEDIC_METHODS.SAPTAMSA,
                    VEDIC_METHODS.YOGINI,
                    VEDIC_METHODS.TRANSIT,
                    VEDIC_METHODS.SECONDARY_PROG
                ],
                explanation: 'First child birth is an extremely powerful rectification marker. The Saptamsa (D7) chart must show the event. 5th lord dasha/antardasha and Jupiter periods are typically active. Jupiter transit to 5th confirms timing.'
            },
            {
                eventType: 'Second/Third Child Born',
                category: 'children',
                importance: 'high',
                accuracyBoost: 5,
                icon: '👧',
                methods: [
                    VEDIC_METHODS.VIMSHOTTARI,
                    VEDIC_METHODS.SAPTAMSA,
                    VEDIC_METHODS.TRANSIT
                ],
                explanation: 'Each subsequent child provides additional verification of 5th house and Saptamsa chart timing.'
            },
            {
                eventType: 'Pregnancy Confirmed',
                category: 'children',
                importance: 'medium',
                accuracyBoost: 2,
                icon: '🤰',
                methods: [
                    VEDIC_METHODS.VIMSHOTTARI,
                    VEDIC_METHODS.SAPTAMSA
                ],
                explanation: 'Pregnancy timing helps narrow down the 5th house activation period before actual birth.'
            }
        ]
    },
    {
        id: 'health',
        name: 'Health & Medical',
        icon: '🏥',
        color: '#EF4444',
        description: 'These events verify 6th, 8th houses and Trimsamsa chart',
        minimumEvents: 1,
        totalAccuracyContribution: 10,
        events: [
            {
                eventType: 'Major Surgery / Operation',
                category: 'health',
                importance: 'critical',
                accuracyBoost: 5,
                icon: '🏥',
                methods: [
                    VEDIC_METHODS.VIMSHOTTARI,
                    VEDIC_METHODS.TRIMSAMSA,
                    VEDIC_METHODS.TRANSIT,
                    VEDIC_METHODS.ASHTAKAVARGA
                ],
                explanation: 'Surgeries verify 8th house (surgery) and 6th house (disease). Trimsamsa (D30) chart must show the timing. Mars periods and 8th lord dashas typically active.'
            },
            {
                eventType: 'Serious Accident / Injury',
                category: 'health',
                importance: 'critical',
                accuracyBoost: 4,
                icon: '🚑',
                methods: [
                    VEDIC_METHODS.VIMSHOTTARI,
                    VEDIC_METHODS.TRIMSAMSA,
                    VEDIC_METHODS.TRANSIT,
                    VEDIC_METHODS.YOGINI
                ],
                explanation: 'Accidents are sudden events that verify Mars, 8th house, and malefic period activation. The D30 chart shows accident prone periods clearly.'
            },
            {
                eventType: 'Major Illness Diagnosed',
                category: 'health',
                importance: 'high',
                accuracyBoost: 3,
                icon: '🩺',
                methods: [
                    VEDIC_METHODS.VIMSHOTTARI,
                    VEDIC_METHODS.TRIMSAMSA,
                    VEDIC_METHODS.TRANSIT
                ],
                explanation: 'Illness diagnosis timing verifies 6th house activation and afflicted dasha periods.'
            }
        ]
    },
    {
        id: 'family_events',
        name: 'Family Events',
        icon: '👨‍👩‍👧',
        color: '#F97316',
        description: 'These events verify 4th, 9th, 10th houses (parents) and 3rd house (siblings)',
        minimumEvents: 1,
        totalAccuracyContribution: 12,
        events: [
            {
                eventType: "Father's Death",
                category: 'family_events',
                importance: 'critical',
                accuracyBoost: 6,
                icon: '🕯️',
                methods: [
                    VEDIC_METHODS.VIMSHOTTARI,
                    VEDIC_METHODS.CHARA,
                    VEDIC_METHODS.TRANSIT,
                    VEDIC_METHODS.TRIMSAMSA,
                    VEDIC_METHODS.YOGINI
                ],
                explanation: "Father's death is a powerful marker. It verifies 9th house (father in natural chart) and 10th house (father from Lagna). 9th/10th lord + Saturn periods typically active with Saturn transit to these houses."
            },
            {
                eventType: "Mother's Death",
                category: 'family_events',
                importance: 'critical',
                accuracyBoost: 6,
                icon: '🕯️',
                methods: [
                    VEDIC_METHODS.VIMSHOTTARI,
                    VEDIC_METHODS.CHARA,
                    VEDIC_METHODS.TRANSIT,
                    VEDIC_METHODS.TRIMSAMSA,
                    VEDIC_METHODS.YOGINI
                ],
                explanation: "Mother's death verifies 4th house and Moon. 4th lord + afflicting planet periods typically active with Saturn/Rahu transit."
            },
            {
                eventType: "Sibling's Major Event",
                category: 'family_events',
                importance: 'medium',
                accuracyBoost: 2,
                icon: '👫',
                methods: [
                    VEDIC_METHODS.VIMSHOTTARI,
                    VEDIC_METHODS.TRANSIT
                ],
                explanation: "Events of siblings verify 3rd house and 11th house (elder siblings) activation."
            }
        ]
    },
    {
        id: 'financial',
        name: 'Financial & Property',
        icon: '💰',
        color: '#10B981',
        description: 'These events verify 2nd, 4th, 11th houses and Hora chart',
        minimumEvents: 1,
        totalAccuracyContribution: 8,
        events: [
            {
                eventType: 'Bought House / Property',
                category: 'financial',
                importance: 'critical',
                accuracyBoost: 5,
                icon: '🏠',
                methods: [
                    VEDIC_METHODS.VIMSHOTTARI,
                    VEDIC_METHODS.HORA,
                    VEDIC_METHODS.TRANSIT,
                    VEDIC_METHODS.CHARA
                ],
                explanation: 'Property purchase is a major 4th house event. It verifies 4th lord dasha and Saturn transit. The D2 (Hora) chart shows wealth accumulation timing.'
            },
            {
                eventType: 'Major Financial Gain / Windfall',
                category: 'financial',
                importance: 'high',
                accuracyBoost: 3,
                icon: '💵',
                methods: [
                    VEDIC_METHODS.VIMSHOTTARI,
                    VEDIC_METHODS.HORA,
                    VEDIC_METHODS.TRANSIT,
                    VEDIC_METHODS.ASHTAKAVARGA
                ],
                explanation: 'Financial gains verify 2nd (wealth), 11th (gains), and 9th (luck) houses. Jupiter periods typically active.'
            }
        ]
    },
    {
        id: 'travel',
        name: 'Travel & Relocation',
        icon: '✈️',
        color: '#06B6D4',
        description: 'These events verify 3rd, 9th, 12th houses and Rahu',
        minimumEvents: 1,
        totalAccuracyContribution: 6,
        events: [
            {
                eventType: 'Moved to Foreign Country',
                category: 'travel',
                importance: 'critical',
                accuracyBoost: 4,
                icon: '🌍',
                methods: [
                    VEDIC_METHODS.VIMSHOTTARI,
                    VEDIC_METHODS.CHARA,
                    VEDIC_METHODS.TRANSIT,
                    VEDIC_METHODS.ARUDHA
                ],
                explanation: 'Foreign relocation is a major 12th house (foreign) and 9th house (long distance) event. Rahu periods are frequently active.'
            },
            {
                eventType: 'Major City Relocation',
                category: 'travel',
                importance: 'high',
                accuracyBoost: 2,
                icon: '🏙️',
                methods: [
                    VEDIC_METHODS.VIMSHOTTARI,
                    VEDIC_METHODS.CHARA,
                    VEDIC_METHODS.TRANSIT
                ],
                explanation: 'City changes verify 3rd house (short travels) and 4th house (home) activation.'
            }
        ]
    },
    {
        id: 'physical',
        name: 'Physical Traits',
        icon: '👤',
        color: '#8B5CF6',
        description: 'Physical appearance for Lagna (Ascendant) verification',
        minimumEvents: 0, // Not an event-based category
        totalAccuracyContribution: 8,
        events: [
            {
                eventType: 'Physical Appearance Details',
                category: 'physical',
                importance: 'critical',
                accuracyBoost: 8,
                icon: '👤',
                methods: [
                    VEDIC_METHODS.LAGNA,
                    VEDIC_METHODS.NAKSHATRA
                ],
                explanation: 'Height, build, complexion, face shape, and distinguishing features directly correlate with the rising sign. This is the primary method to CONFIRM the Lagna is correct after event-based rectification.'
            }
        ]
    }
];

// Calculate total accuracy from provided events
export function calculateAccuracy(categoryEventCounts: Record<string, number>): {
    totalAccuracy: number;
    breakdown: { category: string; contribution: number; eventsProvided: number; minimumRequired: number }[];
    missingCategories: string[];
    suggestions: string[];
} {
    let totalAccuracy = 60; // Base accuracy from birth details
    const breakdown: { category: string; contribution: number; eventsProvided: number; minimumRequired: number }[] = [];
    const missingCategories: string[] = [];
    const suggestions: string[] = [];

    for (const category of EVENT_REQUIREMENTS) {
        const eventsProvided = categoryEventCounts[category.id] || 0;
        const minimumRequired = category.minimumEvents;

        // Calculate contribution based on events provided
        let contribution = 0;
        if (eventsProvided > 0) {
            // Each event contributes proportionally
            const eventsToCount = Math.min(eventsProvided, category.events.length);
            const avgBoostPerEvent = category.totalAccuracyContribution / Math.max(category.events.length, 1);
            contribution = Math.min(eventsToCount * avgBoostPerEvent, category.totalAccuracyContribution);
        }

        totalAccuracy += contribution;

        breakdown.push({
            category: category.name,
            contribution: Math.round(contribution * 10) / 10,
            eventsProvided,
            minimumRequired
        });

        if (eventsProvided < minimumRequired && minimumRequired > 0) {
            missingCategories.push(category.name);
            suggestions.push(`Add ${minimumRequired - eventsProvided} more event(s) in "${category.name}" for +${Math.round((minimumRequired - eventsProvided) * (category.totalAccuracyContribution / category.events.length))}% accuracy`);
        }
    }

    return {
        totalAccuracy: Math.min(Math.round(totalAccuracy * 10) / 10, 99.5),
        breakdown,
        missingCategories,
        suggestions
    };
}

// Get minimum requirements summary
export function getMinimumRequirements(): {
    totalMinimumEvents: number;
    byCategory: { name: string; minimum: number; icon: string }[];
    targetAccuracy: string;
} {
    const byCategory = EVENT_REQUIREMENTS
        .filter(c => c.minimumEvents > 0)
        .map(c => ({ name: c.name, minimum: c.minimumEvents, icon: c.icon }));

    const totalMinimumEvents = byCategory.reduce((sum, c) => sum + c.minimum, 0);

    return {
        totalMinimumEvents,
        byCategory,
        targetAccuracy: '99%+'
    };
}

// Get all events with their method details for UI
export function getEventWithMethods(categoryId: string, eventType: string): EventRequirement | undefined {
    const category = EVENT_REQUIREMENTS.find(c => c.id === categoryId);
    if (!category) return undefined;
    return category.events.find(e => e.eventType === eventType);
}

export default EVENT_REQUIREMENTS;
