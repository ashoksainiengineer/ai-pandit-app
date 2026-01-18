export interface EventRequirement {
    eventType: string;
    category: string;
    importance: 'critical' | 'high' | 'medium';
    accuracyBoost: number;
    methods: VedicMethod[];
    explanation: string;
    icon: string;
}
export interface VedicMethod {
    name: string;
    shortName: string;
    description: string;
}
export declare const VEDIC_METHODS: {
    readonly VIMSHOTTARI: {
        readonly name: "Vimshottari Dasha";
        readonly shortName: "VD";
        readonly description: "Primary 120-year planetary period system based on Moon nakshatra";
    };
    readonly YOGINI: {
        readonly name: "Yogini Dasha";
        readonly shortName: "YD";
        readonly description: "36-year cycle dasha for event timing verification";
    };
    readonly CHARA: {
        readonly name: "Chara Dasha";
        readonly shortName: "CD";
        readonly description: "Jaimini sign-based dasha for career and relationships";
    };
    readonly NAVAMSA: {
        readonly name: "Navamsa (D9) Analysis";
        readonly shortName: "D9";
        readonly description: "Marriage and dharma divisional chart";
    };
    readonly DASHAMSA: {
        readonly name: "Dashamsa (D10) Analysis";
        readonly shortName: "D10";
        readonly description: "Career and profession divisional chart";
    };
    readonly SAPTAMSA: {
        readonly name: "Saptamsa (D7) Analysis";
        readonly shortName: "D7";
        readonly description: "Children and progeny divisional chart";
    };
    readonly HORA: {
        readonly name: "Hora (D2) Analysis";
        readonly shortName: "D2";
        readonly description: "Wealth and financial gains chart";
    };
    readonly TRIMSAMSA: {
        readonly name: "Trimsamsa (D30) Analysis";
        readonly shortName: "D30";
        readonly description: "Misfortunes, accidents, and health chart";
    };
    readonly TRANSIT: {
        readonly name: "Transit Analysis";
        readonly shortName: "TR";
        readonly description: "Saturn, Jupiter, Rahu-Ketu transit verification";
    };
    readonly ASHTAKAVARGA: {
        readonly name: "Ashtakavarga";
        readonly shortName: "AV";
        readonly description: "Point-based strength analysis for timing";
    };
    readonly LAGNA: {
        readonly name: "Lagna Verification";
        readonly shortName: "LG";
        readonly description: "Ascendant sign confirmation through physical traits";
    };
    readonly NAKSHATRA: {
        readonly name: "Nakshatra Analysis";
        readonly shortName: "NK";
        readonly description: "Birth star and pada verification";
    };
    readonly PRATYANTARA: {
        readonly name: "Pratyantara Dasha";
        readonly shortName: "PD";
        readonly description: "Sub-sub period for precise event timing";
    };
    readonly ARUDHA: {
        readonly name: "Arudha Lagna";
        readonly shortName: "AL";
        readonly description: "Public image and worldly success verification";
    };
    readonly SECONDARY_PROG: {
        readonly name: "Secondary Progressions";
        readonly shortName: "SP";
        readonly description: "Day-for-year progression for life events";
    };
};
export interface CategoryRequirement {
    id: string;
    name: string;
    icon: string;
    description: string;
    minimumEvents: number;
    totalAccuracyContribution: number;
    events: EventRequirement[];
    color: string;
}
export declare const EVENT_REQUIREMENTS: CategoryRequirement[];
export declare function calculateAccuracy(categoryEventCounts: Record<string, number>): {
    totalAccuracy: number;
    breakdown: {
        category: string;
        contribution: number;
        eventsProvided: number;
        minimumRequired: number;
    }[];
    missingCategories: string[];
    suggestions: string[];
};
export declare function getMinimumRequirements(): {
    totalMinimumEvents: number;
    byCategory: {
        name: string;
        minimum: number;
        icon: string;
    }[];
    targetAccuracy: string;
};
export declare function getEventWithMethods(categoryId: string, eventType: string): EventRequirement | undefined;
export default EVENT_REQUIREMENTS;
//# sourceMappingURL=event-requirements.d.ts.map