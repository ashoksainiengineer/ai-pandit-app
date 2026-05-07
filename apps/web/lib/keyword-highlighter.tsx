import React, { ReactNode } from 'react';

// Common astrological keywords for highlighting
const PLANETS = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'];
const HOUSES = ['1st house', '2nd house', '3rd house', '4th house', '5th house', '6th house', '7th house', '8th house', '9th house', '10th house', '11th house', '12th house', 'ascendant', 'lagna'];
const YOGAS_AND_TERMS = [
    'Exalted', 'Debilitated', 'Retrograde', 'Combust', 'Own sign', 'Raja Yoga', 'Dhana Yoga',
    'Mahadasha', 'Antardasha', 'Navamsa', 'D9', 'D10', 'D60',
    'Vargottama Placement', 'Shashtiamsha Drift', 'Pancha-Dasha Subdivisions', 'Nadi-Amsha Window', 'Ephemeris Engine'
];

const planetRegex = new RegExp(`\\b(${PLANETS.join('|')})\\b`, 'gi');
const houseRegex = new RegExp(`\\b(${HOUSES.join('|')})\\b`, 'gi');
const termRegex = new RegExp(`\\b(${YOGAS_AND_TERMS.join('|')})\\b`, 'gi');

const escapeRegExp = (string: string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const allTerms = [...PLANETS, ...HOUSES, ...YOGAS_AND_TERMS].map(escapeRegExp);
const MASTER_REGEX = new RegExp(`\\b(${allTerms.join('|')})\\b`, 'gi');

/**
 * Parses raw text and highlights astrological keywords by wrapping them in styled <span> elements.
 * Returns an array of ReactNodes to avoid using dangerouslySetInnerHTML.
 */
export function highlightKeywords(text: string): ReactNode[] {
    if (!text) return [];

    const parts = text.split(MASTER_REGEX);

    return parts.map((part, index) => {
        if (!part) return null;

        const lowerPart = part.toLowerCase();

        // Check which category it belongs to
        if (PLANETS.some(p => p.toLowerCase() === lowerPart)) {
            return <span key={index} className="text-black font-medium">{part}</span>; // Gold
        }
        if (HOUSES.some(h => h.toLowerCase() === lowerPart)) {
            return <span key={index} className="text-blue-600 font-medium">{part}</span>; // Blue
        }
        if (YOGAS_AND_TERMS.some(y => y.toLowerCase() === lowerPart)) {
            return <span key={index} className="text-emerald-600 font-medium">{part}</span>; // Emerald
        }

        return <React.Fragment key={index}>{part}</React.Fragment>;
    });
}
