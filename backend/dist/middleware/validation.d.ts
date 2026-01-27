import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
export declare const TimeOffsetConfigSchema: z.ZodObject<{
    preset: z.ZodOptional<z.ZodEnum<["30min", "1hour", "2hours", "4hours", "6hours", "12hours", "seconds-30", "seconds-6"]>>;
    customMinutes: z.ZodOptional<z.ZodNumber>;
    description: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    description?: string | undefined;
    preset?: "30min" | "1hour" | "2hours" | "4hours" | "6hours" | "12hours" | "seconds-30" | "seconds-6" | undefined;
    customMinutes?: number | undefined;
}, {
    description?: string | undefined;
    preset?: "30min" | "1hour" | "2hours" | "4hours" | "6hours" | "12hours" | "seconds-30" | "seconds-6" | undefined;
    customMinutes?: number | undefined;
}>;
export declare const BirthDataSchema: z.ZodObject<{
    fullName: z.ZodString;
    dateOfBirth: z.ZodString;
    tentativeTime: z.ZodString;
    birthPlace: z.ZodString;
    latitude: z.ZodNumber;
    longitude: z.ZodNumber;
    timezone: z.ZodNumber;
    gender: z.ZodEnum<["male", "female", "other"]>;
}, "strip", z.ZodTypeAny, {
    fullName: string;
    dateOfBirth: string;
    tentativeTime: string;
    birthPlace: string;
    latitude: number;
    longitude: number;
    timezone: number;
    gender: "male" | "female" | "other";
}, {
    fullName: string;
    dateOfBirth: string;
    tentativeTime: string;
    birthPlace: string;
    latitude: number;
    longitude: number;
    timezone: number;
    gender: "male" | "female" | "other";
}>;
export declare const LifeEventSchema: z.ZodObject<{
    id: z.ZodOptional<z.ZodString>;
    category: z.ZodEnum<["education", "career", "marriage", "children", "family", "health", "financial", "travel", "spiritual", "legal", "public_life", "karmic_events", "identity_shifts", "other"]>;
    eventType: z.ZodString;
    datePrecision: z.ZodEnum<["exact_date_time", "exact_date", "date_range", "month_year", "month_range", "year_range"]>;
    eventDate: z.ZodString;
    endDate: z.ZodOptional<z.ZodString>;
    eventTime: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    importance: z.ZodEnum<["low", "medium", "high", "critical"]>;
}, "strip", z.ZodTypeAny, {
    eventType: string;
    category: "other" | "education" | "career" | "marriage" | "children" | "family" | "health" | "financial" | "travel" | "spiritual" | "legal" | "public_life" | "karmic_events" | "identity_shifts";
    eventDate: string;
    datePrecision: "exact_date_time" | "exact_date" | "date_range" | "month_year" | "month_range" | "year_range";
    importance: "low" | "medium" | "high" | "critical";
    id?: string | undefined;
    description?: string | undefined;
    eventTime?: string | undefined;
    endDate?: string | undefined;
}, {
    eventType: string;
    category: "other" | "education" | "career" | "marriage" | "children" | "family" | "health" | "financial" | "travel" | "spiritual" | "legal" | "public_life" | "karmic_events" | "identity_shifts";
    eventDate: string;
    datePrecision: "exact_date_time" | "exact_date" | "date_range" | "month_year" | "month_range" | "year_range";
    importance: "low" | "medium" | "high" | "critical";
    id?: string | undefined;
    description?: string | undefined;
    eventTime?: string | undefined;
    endDate?: string | undefined;
}>;
export declare const ForensicTraitsSchema: z.ZodObject<{
    physical: z.ZodObject<{
        facialStructure: z.ZodObject<{
            forehead: z.ZodEnum<["broad", "narrow", "average", "sloping"]>;
            eyeShape: z.ZodEnum<["deep_set", "prominent", "almond", "round", "small"]>;
            noseType: z.ZodEnum<["sharp", "blunt", "aquiline", "long", "small"]>;
            teethAlignment: z.ZodEnum<["perfect", "crooked", "gap", "large", "small"]>;
            voicePitch: z.ZodEnum<["deep", "high", "medium", "soft", "raspy"]>;
        }, "strip", z.ZodTypeAny, {
            forehead: "broad" | "narrow" | "average" | "sloping";
            eyeShape: "small" | "round" | "deep_set" | "prominent" | "almond";
            noseType: "small" | "sharp" | "blunt" | "aquiline" | "long";
            teethAlignment: "small" | "perfect" | "crooked" | "gap" | "large";
            voicePitch: "deep" | "medium" | "high" | "soft" | "raspy";
        }, {
            forehead: "broad" | "narrow" | "average" | "sloping";
            eyeShape: "small" | "round" | "deep_set" | "prominent" | "almond";
            noseType: "small" | "sharp" | "blunt" | "aquiline" | "long";
            teethAlignment: "small" | "perfect" | "crooked" | "gap" | "large";
            voicePitch: "deep" | "medium" | "high" | "soft" | "raspy";
        }>;
        skinHair: z.ZodObject<{
            texture: z.ZodEnum<["dry", "oily", "combination", "sensitive"]>;
            hairType: z.ZodEnum<["straight", "curly", "wavy", "thin", "thick", "bald"]>;
            complexion: z.ZodEnum<["very_fair", "fair", "medium", "dark", "very_dark"]>;
            marks: z.ZodArray<z.ZodString, "many">;
        }, "strip", z.ZodTypeAny, {
            texture: "dry" | "oily" | "combination" | "sensitive";
            hairType: "straight" | "curly" | "wavy" | "thin" | "thick" | "bald";
            complexion: "medium" | "very_fair" | "fair" | "dark" | "very_dark";
            marks: string[];
        }, {
            texture: "dry" | "oily" | "combination" | "sensitive";
            hairType: "straight" | "curly" | "wavy" | "thin" | "thick" | "bald";
            complexion: "medium" | "very_fair" | "fair" | "dark" | "very_dark";
            marks: string[];
        }>;
        build: z.ZodEnum<["slim", "medium", "athletic", "heavy", "very_heavy"]>;
        height: z.ZodObject<{
            cm: z.ZodNumber;
            feet: z.ZodNumber;
            inches: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            cm: number;
            feet: number;
            inches: number;
        }, {
            cm: number;
            feet: number;
            inches: number;
        }>;
    }, "strip", z.ZodTypeAny, {
        facialStructure: {
            forehead: "broad" | "narrow" | "average" | "sloping";
            eyeShape: "small" | "round" | "deep_set" | "prominent" | "almond";
            noseType: "small" | "sharp" | "blunt" | "aquiline" | "long";
            teethAlignment: "small" | "perfect" | "crooked" | "gap" | "large";
            voicePitch: "deep" | "medium" | "high" | "soft" | "raspy";
        };
        skinHair: {
            texture: "dry" | "oily" | "combination" | "sensitive";
            hairType: "straight" | "curly" | "wavy" | "thin" | "thick" | "bald";
            complexion: "medium" | "very_fair" | "fair" | "dark" | "very_dark";
            marks: string[];
        };
        build: "medium" | "slim" | "athletic" | "heavy" | "very_heavy";
        height: {
            cm: number;
            feet: number;
            inches: number;
        };
    }, {
        facialStructure: {
            forehead: "broad" | "narrow" | "average" | "sloping";
            eyeShape: "small" | "round" | "deep_set" | "prominent" | "almond";
            noseType: "small" | "sharp" | "blunt" | "aquiline" | "long";
            teethAlignment: "small" | "perfect" | "crooked" | "gap" | "large";
            voicePitch: "deep" | "medium" | "high" | "soft" | "raspy";
        };
        skinHair: {
            texture: "dry" | "oily" | "combination" | "sensitive";
            hairType: "straight" | "curly" | "wavy" | "thin" | "thick" | "bald";
            complexion: "medium" | "very_fair" | "fair" | "dark" | "very_dark";
            marks: string[];
        };
        build: "medium" | "slim" | "athletic" | "heavy" | "very_heavy";
        height: {
            cm: number;
            feet: number;
            inches: number;
        };
    }>;
    psychographic: z.ZodObject<{
        speechStyle: z.ZodEnum<["fast_loud", "measured_soft", "argumentative", "concise", "talkative"]>;
        decisionMaking: z.ZodEnum<["impulsive", "deliberate", "indecisive", "intuitive"]>;
        stressResponse: z.ZodEnum<["aggressive", "withdrawn", "anxious", "calm"]>;
        sleepCycle: z.ZodEnum<["night_owl", "early_bird", "irregular", "deep_sleeper"]>;
        temperament: z.ZodEnum<["short_tempered", "patient", "jovial", "melancholic", "optimistic"]>;
    }, "strip", z.ZodTypeAny, {
        speechStyle: "fast_loud" | "measured_soft" | "argumentative" | "concise" | "talkative";
        decisionMaking: "impulsive" | "deliberate" | "indecisive" | "intuitive";
        stressResponse: "aggressive" | "withdrawn" | "anxious" | "calm";
        sleepCycle: "night_owl" | "early_bird" | "irregular" | "deep_sleeper";
        temperament: "short_tempered" | "patient" | "jovial" | "melancholic" | "optimistic";
    }, {
        speechStyle: "fast_loud" | "measured_soft" | "argumentative" | "concise" | "talkative";
        decisionMaking: "impulsive" | "deliberate" | "indecisive" | "intuitive";
        stressResponse: "aggressive" | "withdrawn" | "anxious" | "calm";
        sleepCycle: "night_owl" | "early_bird" | "irregular" | "deep_sleeper";
        temperament: "short_tempered" | "patient" | "jovial" | "melancholic" | "optimistic";
    }>;
    biological: z.ZodObject<{
        prakriti: z.ZodEnum<["vata", "pitta", "kapha", "vata-pitta", "pitta-kapha", "vata-kapha"]>;
        sensitivity: z.ZodObject<{
            heat: z.ZodEnum<["high", "medium", "low"]>;
            cold: z.ZodEnum<["high", "medium", "low"]>;
        }, "strip", z.ZodTypeAny, {
            heat: "low" | "medium" | "high";
            cold: "low" | "medium" | "high";
        }, {
            heat: "low" | "medium" | "high";
            cold: "low" | "medium" | "high";
        }>;
        recurringHealthIssues: z.ZodArray<z.ZodString, "many">;
    }, "strip", z.ZodTypeAny, {
        prakriti: "vata" | "pitta" | "kapha" | "vata-pitta" | "pitta-kapha" | "vata-kapha";
        sensitivity: {
            heat: "low" | "medium" | "high";
            cold: "low" | "medium" | "high";
        };
        recurringHealthIssues: string[];
    }, {
        prakriti: "vata" | "pitta" | "kapha" | "vata-pitta" | "pitta-kapha" | "vata-kapha";
        sensitivity: {
            heat: "low" | "medium" | "high";
            cold: "low" | "medium" | "high";
        };
        recurringHealthIssues: string[];
    }>;
    family: z.ZodObject<{
        siblingPosition: z.ZodEnum<["eldest", "middle", "youngest", "only_child"]>;
        brotherCount: z.ZodNumber;
        sisterCount: z.ZodNumber;
        fatherStatusAtBirth: z.ZodEnum<["struggling", "stable", "prosperous", "highly_distinguished"]>;
        motherHealthAtBirth: z.ZodEnum<["excellent", "normal", "weak", "complicated"]>;
        firstChildInfo: z.ZodOptional<z.ZodObject<{
            gender: z.ZodEnum<["male", "female"]>;
            yearOfBirth: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            gender: "male" | "female";
            yearOfBirth: number;
        }, {
            gender: "male" | "female";
            yearOfBirth: number;
        }>>;
    }, "strip", z.ZodTypeAny, {
        siblingPosition: "eldest" | "middle" | "youngest" | "only_child";
        brotherCount: number;
        sisterCount: number;
        fatherStatusAtBirth: "struggling" | "stable" | "prosperous" | "highly_distinguished";
        motherHealthAtBirth: "excellent" | "normal" | "weak" | "complicated";
        firstChildInfo?: {
            gender: "male" | "female";
            yearOfBirth: number;
        } | undefined;
    }, {
        siblingPosition: "eldest" | "middle" | "youngest" | "only_child";
        brotherCount: number;
        sisterCount: number;
        fatherStatusAtBirth: "struggling" | "stable" | "prosperous" | "highly_distinguished";
        motherHealthAtBirth: "excellent" | "normal" | "weak" | "complicated";
        firstChildInfo?: {
            gender: "male" | "female";
            yearOfBirth: number;
        } | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    family: {
        siblingPosition: "eldest" | "middle" | "youngest" | "only_child";
        brotherCount: number;
        sisterCount: number;
        fatherStatusAtBirth: "struggling" | "stable" | "prosperous" | "highly_distinguished";
        motherHealthAtBirth: "excellent" | "normal" | "weak" | "complicated";
        firstChildInfo?: {
            gender: "male" | "female";
            yearOfBirth: number;
        } | undefined;
    };
    physical: {
        facialStructure: {
            forehead: "broad" | "narrow" | "average" | "sloping";
            eyeShape: "small" | "round" | "deep_set" | "prominent" | "almond";
            noseType: "small" | "sharp" | "blunt" | "aquiline" | "long";
            teethAlignment: "small" | "perfect" | "crooked" | "gap" | "large";
            voicePitch: "deep" | "medium" | "high" | "soft" | "raspy";
        };
        skinHair: {
            texture: "dry" | "oily" | "combination" | "sensitive";
            hairType: "straight" | "curly" | "wavy" | "thin" | "thick" | "bald";
            complexion: "medium" | "very_fair" | "fair" | "dark" | "very_dark";
            marks: string[];
        };
        build: "medium" | "slim" | "athletic" | "heavy" | "very_heavy";
        height: {
            cm: number;
            feet: number;
            inches: number;
        };
    };
    psychographic: {
        speechStyle: "fast_loud" | "measured_soft" | "argumentative" | "concise" | "talkative";
        decisionMaking: "impulsive" | "deliberate" | "indecisive" | "intuitive";
        stressResponse: "aggressive" | "withdrawn" | "anxious" | "calm";
        sleepCycle: "night_owl" | "early_bird" | "irregular" | "deep_sleeper";
        temperament: "short_tempered" | "patient" | "jovial" | "melancholic" | "optimistic";
    };
    biological: {
        prakriti: "vata" | "pitta" | "kapha" | "vata-pitta" | "pitta-kapha" | "vata-kapha";
        sensitivity: {
            heat: "low" | "medium" | "high";
            cold: "low" | "medium" | "high";
        };
        recurringHealthIssues: string[];
    };
}, {
    family: {
        siblingPosition: "eldest" | "middle" | "youngest" | "only_child";
        brotherCount: number;
        sisterCount: number;
        fatherStatusAtBirth: "struggling" | "stable" | "prosperous" | "highly_distinguished";
        motherHealthAtBirth: "excellent" | "normal" | "weak" | "complicated";
        firstChildInfo?: {
            gender: "male" | "female";
            yearOfBirth: number;
        } | undefined;
    };
    physical: {
        facialStructure: {
            forehead: "broad" | "narrow" | "average" | "sloping";
            eyeShape: "small" | "round" | "deep_set" | "prominent" | "almond";
            noseType: "small" | "sharp" | "blunt" | "aquiline" | "long";
            teethAlignment: "small" | "perfect" | "crooked" | "gap" | "large";
            voicePitch: "deep" | "medium" | "high" | "soft" | "raspy";
        };
        skinHair: {
            texture: "dry" | "oily" | "combination" | "sensitive";
            hairType: "straight" | "curly" | "wavy" | "thin" | "thick" | "bald";
            complexion: "medium" | "very_fair" | "fair" | "dark" | "very_dark";
            marks: string[];
        };
        build: "medium" | "slim" | "athletic" | "heavy" | "very_heavy";
        height: {
            cm: number;
            feet: number;
            inches: number;
        };
    };
    psychographic: {
        speechStyle: "fast_loud" | "measured_soft" | "argumentative" | "concise" | "talkative";
        decisionMaking: "impulsive" | "deliberate" | "indecisive" | "intuitive";
        stressResponse: "aggressive" | "withdrawn" | "anxious" | "calm";
        sleepCycle: "night_owl" | "early_bird" | "irregular" | "deep_sleeper";
        temperament: "short_tempered" | "patient" | "jovial" | "melancholic" | "optimistic";
    };
    biological: {
        prakriti: "vata" | "pitta" | "kapha" | "vata-pitta" | "pitta-kapha" | "vata-kapha";
        sensitivity: {
            heat: "low" | "medium" | "high";
            cold: "low" | "medium" | "high";
        };
        recurringHealthIssues: string[];
    };
}>;
export declare const QueueSubmitSchema: z.ZodObject<{
    birthData: z.ZodObject<{
        fullName: z.ZodString;
        dateOfBirth: z.ZodString;
        tentativeTime: z.ZodString;
        birthPlace: z.ZodString;
        latitude: z.ZodNumber;
        longitude: z.ZodNumber;
        timezone: z.ZodNumber;
        gender: z.ZodEnum<["male", "female", "other"]>;
    }, "strip", z.ZodTypeAny, {
        fullName: string;
        dateOfBirth: string;
        tentativeTime: string;
        birthPlace: string;
        latitude: number;
        longitude: number;
        timezone: number;
        gender: "male" | "female" | "other";
    }, {
        fullName: string;
        dateOfBirth: string;
        tentativeTime: string;
        birthPlace: string;
        latitude: number;
        longitude: number;
        timezone: number;
        gender: "male" | "female" | "other";
    }>;
    lifeEvents: z.ZodArray<z.ZodObject<{
        id: z.ZodOptional<z.ZodString>;
        category: z.ZodEnum<["education", "career", "marriage", "children", "family", "health", "financial", "travel", "spiritual", "legal", "public_life", "karmic_events", "identity_shifts", "other"]>;
        eventType: z.ZodString;
        datePrecision: z.ZodEnum<["exact_date_time", "exact_date", "date_range", "month_year", "month_range", "year_range"]>;
        eventDate: z.ZodString;
        endDate: z.ZodOptional<z.ZodString>;
        eventTime: z.ZodOptional<z.ZodString>;
        description: z.ZodOptional<z.ZodString>;
        importance: z.ZodEnum<["low", "medium", "high", "critical"]>;
    }, "strip", z.ZodTypeAny, {
        eventType: string;
        category: "other" | "education" | "career" | "marriage" | "children" | "family" | "health" | "financial" | "travel" | "spiritual" | "legal" | "public_life" | "karmic_events" | "identity_shifts";
        eventDate: string;
        datePrecision: "exact_date_time" | "exact_date" | "date_range" | "month_year" | "month_range" | "year_range";
        importance: "low" | "medium" | "high" | "critical";
        id?: string | undefined;
        description?: string | undefined;
        eventTime?: string | undefined;
        endDate?: string | undefined;
    }, {
        eventType: string;
        category: "other" | "education" | "career" | "marriage" | "children" | "family" | "health" | "financial" | "travel" | "spiritual" | "legal" | "public_life" | "karmic_events" | "identity_shifts";
        eventDate: string;
        datePrecision: "exact_date_time" | "exact_date" | "date_range" | "month_year" | "month_range" | "year_range";
        importance: "low" | "medium" | "high" | "critical";
        id?: string | undefined;
        description?: string | undefined;
        eventTime?: string | undefined;
        endDate?: string | undefined;
    }>, "many">;
    offsetConfig: z.ZodObject<{
        preset: z.ZodOptional<z.ZodEnum<["30min", "1hour", "2hours", "4hours", "6hours", "12hours", "seconds-30", "seconds-6"]>>;
        customMinutes: z.ZodOptional<z.ZodNumber>;
        description: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        description?: string | undefined;
        preset?: "30min" | "1hour" | "2hours" | "4hours" | "6hours" | "12hours" | "seconds-30" | "seconds-6" | undefined;
        customMinutes?: number | undefined;
    }, {
        description?: string | undefined;
        preset?: "30min" | "1hour" | "2hours" | "4hours" | "6hours" | "12hours" | "seconds-30" | "seconds-6" | undefined;
        customMinutes?: number | undefined;
    }>;
    forensicTraits: z.ZodOptional<z.ZodObject<{
        physical: z.ZodObject<{
            facialStructure: z.ZodObject<{
                forehead: z.ZodEnum<["broad", "narrow", "average", "sloping"]>;
                eyeShape: z.ZodEnum<["deep_set", "prominent", "almond", "round", "small"]>;
                noseType: z.ZodEnum<["sharp", "blunt", "aquiline", "long", "small"]>;
                teethAlignment: z.ZodEnum<["perfect", "crooked", "gap", "large", "small"]>;
                voicePitch: z.ZodEnum<["deep", "high", "medium", "soft", "raspy"]>;
            }, "strip", z.ZodTypeAny, {
                forehead: "broad" | "narrow" | "average" | "sloping";
                eyeShape: "small" | "round" | "deep_set" | "prominent" | "almond";
                noseType: "small" | "sharp" | "blunt" | "aquiline" | "long";
                teethAlignment: "small" | "perfect" | "crooked" | "gap" | "large";
                voicePitch: "deep" | "medium" | "high" | "soft" | "raspy";
            }, {
                forehead: "broad" | "narrow" | "average" | "sloping";
                eyeShape: "small" | "round" | "deep_set" | "prominent" | "almond";
                noseType: "small" | "sharp" | "blunt" | "aquiline" | "long";
                teethAlignment: "small" | "perfect" | "crooked" | "gap" | "large";
                voicePitch: "deep" | "medium" | "high" | "soft" | "raspy";
            }>;
            skinHair: z.ZodObject<{
                texture: z.ZodEnum<["dry", "oily", "combination", "sensitive"]>;
                hairType: z.ZodEnum<["straight", "curly", "wavy", "thin", "thick", "bald"]>;
                complexion: z.ZodEnum<["very_fair", "fair", "medium", "dark", "very_dark"]>;
                marks: z.ZodArray<z.ZodString, "many">;
            }, "strip", z.ZodTypeAny, {
                texture: "dry" | "oily" | "combination" | "sensitive";
                hairType: "straight" | "curly" | "wavy" | "thin" | "thick" | "bald";
                complexion: "medium" | "very_fair" | "fair" | "dark" | "very_dark";
                marks: string[];
            }, {
                texture: "dry" | "oily" | "combination" | "sensitive";
                hairType: "straight" | "curly" | "wavy" | "thin" | "thick" | "bald";
                complexion: "medium" | "very_fair" | "fair" | "dark" | "very_dark";
                marks: string[];
            }>;
            build: z.ZodEnum<["slim", "medium", "athletic", "heavy", "very_heavy"]>;
            height: z.ZodObject<{
                cm: z.ZodNumber;
                feet: z.ZodNumber;
                inches: z.ZodNumber;
            }, "strip", z.ZodTypeAny, {
                cm: number;
                feet: number;
                inches: number;
            }, {
                cm: number;
                feet: number;
                inches: number;
            }>;
        }, "strip", z.ZodTypeAny, {
            facialStructure: {
                forehead: "broad" | "narrow" | "average" | "sloping";
                eyeShape: "small" | "round" | "deep_set" | "prominent" | "almond";
                noseType: "small" | "sharp" | "blunt" | "aquiline" | "long";
                teethAlignment: "small" | "perfect" | "crooked" | "gap" | "large";
                voicePitch: "deep" | "medium" | "high" | "soft" | "raspy";
            };
            skinHair: {
                texture: "dry" | "oily" | "combination" | "sensitive";
                hairType: "straight" | "curly" | "wavy" | "thin" | "thick" | "bald";
                complexion: "medium" | "very_fair" | "fair" | "dark" | "very_dark";
                marks: string[];
            };
            build: "medium" | "slim" | "athletic" | "heavy" | "very_heavy";
            height: {
                cm: number;
                feet: number;
                inches: number;
            };
        }, {
            facialStructure: {
                forehead: "broad" | "narrow" | "average" | "sloping";
                eyeShape: "small" | "round" | "deep_set" | "prominent" | "almond";
                noseType: "small" | "sharp" | "blunt" | "aquiline" | "long";
                teethAlignment: "small" | "perfect" | "crooked" | "gap" | "large";
                voicePitch: "deep" | "medium" | "high" | "soft" | "raspy";
            };
            skinHair: {
                texture: "dry" | "oily" | "combination" | "sensitive";
                hairType: "straight" | "curly" | "wavy" | "thin" | "thick" | "bald";
                complexion: "medium" | "very_fair" | "fair" | "dark" | "very_dark";
                marks: string[];
            };
            build: "medium" | "slim" | "athletic" | "heavy" | "very_heavy";
            height: {
                cm: number;
                feet: number;
                inches: number;
            };
        }>;
        psychographic: z.ZodObject<{
            speechStyle: z.ZodEnum<["fast_loud", "measured_soft", "argumentative", "concise", "talkative"]>;
            decisionMaking: z.ZodEnum<["impulsive", "deliberate", "indecisive", "intuitive"]>;
            stressResponse: z.ZodEnum<["aggressive", "withdrawn", "anxious", "calm"]>;
            sleepCycle: z.ZodEnum<["night_owl", "early_bird", "irregular", "deep_sleeper"]>;
            temperament: z.ZodEnum<["short_tempered", "patient", "jovial", "melancholic", "optimistic"]>;
        }, "strip", z.ZodTypeAny, {
            speechStyle: "fast_loud" | "measured_soft" | "argumentative" | "concise" | "talkative";
            decisionMaking: "impulsive" | "deliberate" | "indecisive" | "intuitive";
            stressResponse: "aggressive" | "withdrawn" | "anxious" | "calm";
            sleepCycle: "night_owl" | "early_bird" | "irregular" | "deep_sleeper";
            temperament: "short_tempered" | "patient" | "jovial" | "melancholic" | "optimistic";
        }, {
            speechStyle: "fast_loud" | "measured_soft" | "argumentative" | "concise" | "talkative";
            decisionMaking: "impulsive" | "deliberate" | "indecisive" | "intuitive";
            stressResponse: "aggressive" | "withdrawn" | "anxious" | "calm";
            sleepCycle: "night_owl" | "early_bird" | "irregular" | "deep_sleeper";
            temperament: "short_tempered" | "patient" | "jovial" | "melancholic" | "optimistic";
        }>;
        biological: z.ZodObject<{
            prakriti: z.ZodEnum<["vata", "pitta", "kapha", "vata-pitta", "pitta-kapha", "vata-kapha"]>;
            sensitivity: z.ZodObject<{
                heat: z.ZodEnum<["high", "medium", "low"]>;
                cold: z.ZodEnum<["high", "medium", "low"]>;
            }, "strip", z.ZodTypeAny, {
                heat: "low" | "medium" | "high";
                cold: "low" | "medium" | "high";
            }, {
                heat: "low" | "medium" | "high";
                cold: "low" | "medium" | "high";
            }>;
            recurringHealthIssues: z.ZodArray<z.ZodString, "many">;
        }, "strip", z.ZodTypeAny, {
            prakriti: "vata" | "pitta" | "kapha" | "vata-pitta" | "pitta-kapha" | "vata-kapha";
            sensitivity: {
                heat: "low" | "medium" | "high";
                cold: "low" | "medium" | "high";
            };
            recurringHealthIssues: string[];
        }, {
            prakriti: "vata" | "pitta" | "kapha" | "vata-pitta" | "pitta-kapha" | "vata-kapha";
            sensitivity: {
                heat: "low" | "medium" | "high";
                cold: "low" | "medium" | "high";
            };
            recurringHealthIssues: string[];
        }>;
        family: z.ZodObject<{
            siblingPosition: z.ZodEnum<["eldest", "middle", "youngest", "only_child"]>;
            brotherCount: z.ZodNumber;
            sisterCount: z.ZodNumber;
            fatherStatusAtBirth: z.ZodEnum<["struggling", "stable", "prosperous", "highly_distinguished"]>;
            motherHealthAtBirth: z.ZodEnum<["excellent", "normal", "weak", "complicated"]>;
            firstChildInfo: z.ZodOptional<z.ZodObject<{
                gender: z.ZodEnum<["male", "female"]>;
                yearOfBirth: z.ZodNumber;
            }, "strip", z.ZodTypeAny, {
                gender: "male" | "female";
                yearOfBirth: number;
            }, {
                gender: "male" | "female";
                yearOfBirth: number;
            }>>;
        }, "strip", z.ZodTypeAny, {
            siblingPosition: "eldest" | "middle" | "youngest" | "only_child";
            brotherCount: number;
            sisterCount: number;
            fatherStatusAtBirth: "struggling" | "stable" | "prosperous" | "highly_distinguished";
            motherHealthAtBirth: "excellent" | "normal" | "weak" | "complicated";
            firstChildInfo?: {
                gender: "male" | "female";
                yearOfBirth: number;
            } | undefined;
        }, {
            siblingPosition: "eldest" | "middle" | "youngest" | "only_child";
            brotherCount: number;
            sisterCount: number;
            fatherStatusAtBirth: "struggling" | "stable" | "prosperous" | "highly_distinguished";
            motherHealthAtBirth: "excellent" | "normal" | "weak" | "complicated";
            firstChildInfo?: {
                gender: "male" | "female";
                yearOfBirth: number;
            } | undefined;
        }>;
    }, "strip", z.ZodTypeAny, {
        family: {
            siblingPosition: "eldest" | "middle" | "youngest" | "only_child";
            brotherCount: number;
            sisterCount: number;
            fatherStatusAtBirth: "struggling" | "stable" | "prosperous" | "highly_distinguished";
            motherHealthAtBirth: "excellent" | "normal" | "weak" | "complicated";
            firstChildInfo?: {
                gender: "male" | "female";
                yearOfBirth: number;
            } | undefined;
        };
        physical: {
            facialStructure: {
                forehead: "broad" | "narrow" | "average" | "sloping";
                eyeShape: "small" | "round" | "deep_set" | "prominent" | "almond";
                noseType: "small" | "sharp" | "blunt" | "aquiline" | "long";
                teethAlignment: "small" | "perfect" | "crooked" | "gap" | "large";
                voicePitch: "deep" | "medium" | "high" | "soft" | "raspy";
            };
            skinHair: {
                texture: "dry" | "oily" | "combination" | "sensitive";
                hairType: "straight" | "curly" | "wavy" | "thin" | "thick" | "bald";
                complexion: "medium" | "very_fair" | "fair" | "dark" | "very_dark";
                marks: string[];
            };
            build: "medium" | "slim" | "athletic" | "heavy" | "very_heavy";
            height: {
                cm: number;
                feet: number;
                inches: number;
            };
        };
        psychographic: {
            speechStyle: "fast_loud" | "measured_soft" | "argumentative" | "concise" | "talkative";
            decisionMaking: "impulsive" | "deliberate" | "indecisive" | "intuitive";
            stressResponse: "aggressive" | "withdrawn" | "anxious" | "calm";
            sleepCycle: "night_owl" | "early_bird" | "irregular" | "deep_sleeper";
            temperament: "short_tempered" | "patient" | "jovial" | "melancholic" | "optimistic";
        };
        biological: {
            prakriti: "vata" | "pitta" | "kapha" | "vata-pitta" | "pitta-kapha" | "vata-kapha";
            sensitivity: {
                heat: "low" | "medium" | "high";
                cold: "low" | "medium" | "high";
            };
            recurringHealthIssues: string[];
        };
    }, {
        family: {
            siblingPosition: "eldest" | "middle" | "youngest" | "only_child";
            brotherCount: number;
            sisterCount: number;
            fatherStatusAtBirth: "struggling" | "stable" | "prosperous" | "highly_distinguished";
            motherHealthAtBirth: "excellent" | "normal" | "weak" | "complicated";
            firstChildInfo?: {
                gender: "male" | "female";
                yearOfBirth: number;
            } | undefined;
        };
        physical: {
            facialStructure: {
                forehead: "broad" | "narrow" | "average" | "sloping";
                eyeShape: "small" | "round" | "deep_set" | "prominent" | "almond";
                noseType: "small" | "sharp" | "blunt" | "aquiline" | "long";
                teethAlignment: "small" | "perfect" | "crooked" | "gap" | "large";
                voicePitch: "deep" | "medium" | "high" | "soft" | "raspy";
            };
            skinHair: {
                texture: "dry" | "oily" | "combination" | "sensitive";
                hairType: "straight" | "curly" | "wavy" | "thin" | "thick" | "bald";
                complexion: "medium" | "very_fair" | "fair" | "dark" | "very_dark";
                marks: string[];
            };
            build: "medium" | "slim" | "athletic" | "heavy" | "very_heavy";
            height: {
                cm: number;
                feet: number;
                inches: number;
            };
        };
        psychographic: {
            speechStyle: "fast_loud" | "measured_soft" | "argumentative" | "concise" | "talkative";
            decisionMaking: "impulsive" | "deliberate" | "indecisive" | "intuitive";
            stressResponse: "aggressive" | "withdrawn" | "anxious" | "calm";
            sleepCycle: "night_owl" | "early_bird" | "irregular" | "deep_sleeper";
            temperament: "short_tempered" | "patient" | "jovial" | "melancholic" | "optimistic";
        };
        biological: {
            prakriti: "vata" | "pitta" | "kapha" | "vata-pitta" | "pitta-kapha" | "vata-kapha";
            sensitivity: {
                heat: "low" | "medium" | "high";
                cold: "low" | "medium" | "high";
            };
            recurringHealthIssues: string[];
        };
    }>>;
    physicalTraits: z.ZodOptional<z.ZodAny>;
    spouseData: z.ZodOptional<z.ZodAny>;
}, "strip", z.ZodTypeAny, {
    lifeEvents: {
        eventType: string;
        category: "other" | "education" | "career" | "marriage" | "children" | "family" | "health" | "financial" | "travel" | "spiritual" | "legal" | "public_life" | "karmic_events" | "identity_shifts";
        eventDate: string;
        datePrecision: "exact_date_time" | "exact_date" | "date_range" | "month_year" | "month_range" | "year_range";
        importance: "low" | "medium" | "high" | "critical";
        id?: string | undefined;
        description?: string | undefined;
        eventTime?: string | undefined;
        endDate?: string | undefined;
    }[];
    offsetConfig: {
        description?: string | undefined;
        preset?: "30min" | "1hour" | "2hours" | "4hours" | "6hours" | "12hours" | "seconds-30" | "seconds-6" | undefined;
        customMinutes?: number | undefined;
    };
    birthData: {
        fullName: string;
        dateOfBirth: string;
        tentativeTime: string;
        birthPlace: string;
        latitude: number;
        longitude: number;
        timezone: number;
        gender: "male" | "female" | "other";
    };
    physicalTraits?: any;
    forensicTraits?: {
        family: {
            siblingPosition: "eldest" | "middle" | "youngest" | "only_child";
            brotherCount: number;
            sisterCount: number;
            fatherStatusAtBirth: "struggling" | "stable" | "prosperous" | "highly_distinguished";
            motherHealthAtBirth: "excellent" | "normal" | "weak" | "complicated";
            firstChildInfo?: {
                gender: "male" | "female";
                yearOfBirth: number;
            } | undefined;
        };
        physical: {
            facialStructure: {
                forehead: "broad" | "narrow" | "average" | "sloping";
                eyeShape: "small" | "round" | "deep_set" | "prominent" | "almond";
                noseType: "small" | "sharp" | "blunt" | "aquiline" | "long";
                teethAlignment: "small" | "perfect" | "crooked" | "gap" | "large";
                voicePitch: "deep" | "medium" | "high" | "soft" | "raspy";
            };
            skinHair: {
                texture: "dry" | "oily" | "combination" | "sensitive";
                hairType: "straight" | "curly" | "wavy" | "thin" | "thick" | "bald";
                complexion: "medium" | "very_fair" | "fair" | "dark" | "very_dark";
                marks: string[];
            };
            build: "medium" | "slim" | "athletic" | "heavy" | "very_heavy";
            height: {
                cm: number;
                feet: number;
                inches: number;
            };
        };
        psychographic: {
            speechStyle: "fast_loud" | "measured_soft" | "argumentative" | "concise" | "talkative";
            decisionMaking: "impulsive" | "deliberate" | "indecisive" | "intuitive";
            stressResponse: "aggressive" | "withdrawn" | "anxious" | "calm";
            sleepCycle: "night_owl" | "early_bird" | "irregular" | "deep_sleeper";
            temperament: "short_tempered" | "patient" | "jovial" | "melancholic" | "optimistic";
        };
        biological: {
            prakriti: "vata" | "pitta" | "kapha" | "vata-pitta" | "pitta-kapha" | "vata-kapha";
            sensitivity: {
                heat: "low" | "medium" | "high";
                cold: "low" | "medium" | "high";
            };
            recurringHealthIssues: string[];
        };
    } | undefined;
    spouseData?: any;
}, {
    lifeEvents: {
        eventType: string;
        category: "other" | "education" | "career" | "marriage" | "children" | "family" | "health" | "financial" | "travel" | "spiritual" | "legal" | "public_life" | "karmic_events" | "identity_shifts";
        eventDate: string;
        datePrecision: "exact_date_time" | "exact_date" | "date_range" | "month_year" | "month_range" | "year_range";
        importance: "low" | "medium" | "high" | "critical";
        id?: string | undefined;
        description?: string | undefined;
        eventTime?: string | undefined;
        endDate?: string | undefined;
    }[];
    offsetConfig: {
        description?: string | undefined;
        preset?: "30min" | "1hour" | "2hours" | "4hours" | "6hours" | "12hours" | "seconds-30" | "seconds-6" | undefined;
        customMinutes?: number | undefined;
    };
    birthData: {
        fullName: string;
        dateOfBirth: string;
        tentativeTime: string;
        birthPlace: string;
        latitude: number;
        longitude: number;
        timezone: number;
        gender: "male" | "female" | "other";
    };
    physicalTraits?: any;
    forensicTraits?: {
        family: {
            siblingPosition: "eldest" | "middle" | "youngest" | "only_child";
            brotherCount: number;
            sisterCount: number;
            fatherStatusAtBirth: "struggling" | "stable" | "prosperous" | "highly_distinguished";
            motherHealthAtBirth: "excellent" | "normal" | "weak" | "complicated";
            firstChildInfo?: {
                gender: "male" | "female";
                yearOfBirth: number;
            } | undefined;
        };
        physical: {
            facialStructure: {
                forehead: "broad" | "narrow" | "average" | "sloping";
                eyeShape: "small" | "round" | "deep_set" | "prominent" | "almond";
                noseType: "small" | "sharp" | "blunt" | "aquiline" | "long";
                teethAlignment: "small" | "perfect" | "crooked" | "gap" | "large";
                voicePitch: "deep" | "medium" | "high" | "soft" | "raspy";
            };
            skinHair: {
                texture: "dry" | "oily" | "combination" | "sensitive";
                hairType: "straight" | "curly" | "wavy" | "thin" | "thick" | "bald";
                complexion: "medium" | "very_fair" | "fair" | "dark" | "very_dark";
                marks: string[];
            };
            build: "medium" | "slim" | "athletic" | "heavy" | "very_heavy";
            height: {
                cm: number;
                feet: number;
                inches: number;
            };
        };
        psychographic: {
            speechStyle: "fast_loud" | "measured_soft" | "argumentative" | "concise" | "talkative";
            decisionMaking: "impulsive" | "deliberate" | "indecisive" | "intuitive";
            stressResponse: "aggressive" | "withdrawn" | "anxious" | "calm";
            sleepCycle: "night_owl" | "early_bird" | "irregular" | "deep_sleeper";
            temperament: "short_tempered" | "patient" | "jovial" | "melancholic" | "optimistic";
        };
        biological: {
            prakriti: "vata" | "pitta" | "kapha" | "vata-pitta" | "pitta-kapha" | "vata-kapha";
            sensitivity: {
                heat: "low" | "medium" | "high";
                cold: "low" | "medium" | "high";
            };
            recurringHealthIssues: string[];
        };
    } | undefined;
    spouseData?: any;
}>;
export declare function validateBody(schema: z.ZodSchema): (req: Request, res: Response, next: NextFunction) => void;
export declare function validateParams(schema: z.ZodSchema): (req: Request, res: Response, next: NextFunction) => void;
export declare const UuidParamSchema: z.ZodObject<{
    id: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
}, {
    id: string;
}>;
//# sourceMappingURL=validation.d.ts.map