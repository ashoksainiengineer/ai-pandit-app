/**
 * Shared Stage Utilities
 *
 * Common helper functions used across Stage 2, Stage 4, and Stage 6.
 * Extracted to avoid duplication and prevent Temporal Dead Zone (TDZ) errors
 * that can occur when bundlers reorder module-level function declarations.
 */

import { CandidateDataPackage } from '@ai-pandit/shared';

/**
 * Extract a minified ephemeris payload (Sun, Moon, Ascendant) from a candidate.
 * Used for lightweight score emissions to the frontend.
 */
export function getMinifiedEphemerisInline(c: CandidateDataPackage) {
    return {
        sun: `${c.planets.sun.sign} ${c.planets.sun.degree}`,
        moon: `${c.planets.moon.sign} ${c.planets.moon.degree}`,
        ascendant: `${c.ascendant.sign} ${c.ascendant.degree}`
    };
}

/**
 * Extract a full ephemeris payload (all planets + Lagna) from a candidate.
 * Used for detailed score emissions and report generation.
 */
export function getFullEphemerisPayload(c: CandidateDataPackage) {
    const payload: Record<string, string> = {};
    for (const [name, p] of Object.entries(c.planets)) {
        const pKey = name.charAt(0).toUpperCase() + name.slice(1);
        payload[pKey] = `${p.sign} ${p.degree}`;
    }
    payload.Lagna = `${c.ascendant.sign} ${c.ascendant.degree}`;
    return payload;
}
