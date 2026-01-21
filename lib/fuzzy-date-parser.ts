// lib/fuzzy-date-parser.ts
// Utility to parse human-centric date strings into machine-readable format for BTR

import { format, addYears, subYears } from 'date-fns';

export interface ParsedFuzzyDate {
    startDate: string; // YYYY-MM-DD
    endDate?: string;   // YYYY-MM-DD
    precision: 'exact' | 'month' | 'year' | 'age' | 'relative';
    confidence: number; // 0 to 1
}

export function parseFuzzyDate(input: string, birthDate: string): ParsedFuzzyDate | null {
    const text = input.toLowerCase().trim();
    const birth = new Date(birthDate);
    const currentYear = new Date().getFullYear();

    // 1. Age-based: "Age 22", "When I was 10"
    const ageMatch = text.match(/(?:age|at|when i was)\s*(\d{1,2})/);
    if (ageMatch) {
        const age = parseInt(ageMatch[1]);
        const eventYear = birth.getFullYear() + age;
        return {
            startDate: `${eventYear}-01-01`,
            endDate: `${eventYear}-12-31`,
            precision: 'age',
            confidence: 0.9
        };
    }

    // 2. Year-only: "In 1995", "1995"
    const yearMatch = text.match(/\b(19\d{2}|20\d{2})\b/);
    if (yearMatch) {
        const year = yearMatch[1];
        return {
            startDate: `${year}-01-01`,
            endDate: `${year}-12-31`,
            precision: 'year',
            confidence: 1.0
        };
    }

    // 3. Season-based: "Winter 2005", "Monsoon 1998"
    const seasonMatch = text.match(/(winter|summer|monsoon|spring|autumn)\s*(\d{4})/);
    if (seasonMatch) {
        const season = seasonMatch[1];
        const year = seasonMatch[2];
        let months = ['01', '03']; // Default winter
        if (season === 'summer') months = ['04', '06'];
        if (season === 'monsoon') months = ['07', '09'];
        if (season === 'autumn') months = ['10', '12'];

        return {
            startDate: `${year}-${months[0]}-01`,
            endDate: `${year}-${months[1]}-30`,
            precision: 'relative',
            confidence: 0.8
        };
    }

    // 4. Academic/Phase based: "10th grade", "College start"
    // (Requires assumptions or birth year context)

    return null;
}

/**
 * Parses relative time based on another event's date
 */
export function parseRelativeDate(relativeTo: string, offsetYears: number): string {
    const baseDate = new Date(relativeTo);
    const newDate = addYears(baseDate, offsetYears);
    return format(newDate, 'yyyy-MM-dd');
}
