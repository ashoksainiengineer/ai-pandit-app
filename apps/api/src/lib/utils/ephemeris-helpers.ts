/**
 * Ephemeris data formatting and extraction utilities
 * Provides consistent formatting for planetary positions and candidate data
 */

/**
 * Minimal interface for planetary position data
 * Compatible with CandidateDataPackage from seconds-precision-btr.ts
 */
interface PlanetData {
  sign: string;
  degree: string;
}

/**
 * Minimal interface for candidate data package
 * Compatible with CandidateDataPackage from seconds-precision-btr.ts
 */
interface CandidateData {
  planets: {
    sun: PlanetData;
    moon: PlanetData;
    [key: string]: PlanetData;
  };
  ascendant: PlanetData;
  vimshottariDasha: Array<{ maha: string }>;
  sandhiZones?: string[];
}

/**
 * Minified ephemeris representation for display and logging
 * Contains only essential planetary positions
 */
export interface MinifiedEphemeris {
  /** Sun position in format "Sign Degree°" */
  sun: string;
  /** Moon position in format "Sign Degree°" */
  moon: string;
  /** Ascendant position in format "Sign Degree°" */
  ascendant: string;
}

/**
 * Extracts a minified ephemeris representation from candidate data
 * Used for SSE events, logging, and progress tracking
 * @param candidate The candidate data package containing planetary positions
 * @returns Minified ephemeris with sun, moon, and ascendant positions
 * @example
 * const minified = getMinifiedEphemeris(candidateData);
 * // { sun: 'Aries 15.50°', moon: 'Taurus 22.30°', ascendant: 'Leo 5.20°' }
 */
export function getMinifiedEphemeris(candidate: CandidateData): MinifiedEphemeris {
  return {
    sun: `${candidate.planets.sun.sign} ${candidate.planets.sun.degree}`,
    moon: `${candidate.planets.moon.sign} ${candidate.planets.moon.degree}`,
    ascendant: `${candidate.ascendant.sign} ${candidate.ascendant.degree}`,
  };
}

/**
 * Formats planet position for display
 * @param sign Zodiac sign name
 * @param degree Degree within sign (0-30)
 * @returns Formatted position string
 * @example
 * formatPlanetPosition('Aries', 15.5) // 'Aries 15.50°'
 */
export function formatPlanetPosition(sign: string, degree: number): string {
  return `${sign} ${degree.toFixed(4)}°`;
}

/**
 * Formats house lord information for AI prompts
 * @param houseLords Record of house numbers to planet names
 * @returns Formatted string for display
 * @example
 * formatHouseLords({1: 'Mars', 7: 'Venus'}) // '1=Mars, 7=Venus'
 */
export function formatHouseLords(houseLords: Record<number, string>): string {
  return Object.entries(houseLords)
    .map(([house, lord]) => `${house}=${lord}`)
    .join(', ');
}

/**
 * Extracts key planetary dignities for quick analysis
 * @param planets Record of planet names to their data
 * @returns Record of planet names to their dignities
 */
export function extractKeyDignities(
  planets: Record<string, { dignity?: string }>
): Record<string, string> {
  const dignities: Record<string, string> = {};
  for (const [planetName, planetData] of Object.entries(planets)) {
    if (planetData.dignity) {
      dignities[planetName] = planetData.dignity;
    }
  }
  return dignities;
}

/**
 * Checks if candidate has any sandhi zone warnings
 * Sandhi zones indicate planets near sign boundaries (0-1° or 29-30°)
 * @param sandhiZones Array of sandhi warning strings
 * @returns True if any sandhi warnings exist
 */
export function hasSandhiWarnings(sandhiZones: string[] | undefined): boolean {
  return sandhiZones !== undefined && sandhiZones.length > 0;
}

/**
 * Gets the primary Dasha lord at birth for quick reference
 * @param dasha Array of Dasha periods
 * @returns The Mahadasha lord name or 'Unknown'
 */
export function getPrimaryDashaLord(
  dasha: Array<{ maha: string }> | undefined
): string {
  return dasha?.[0]?.maha ?? 'Unknown';
}
