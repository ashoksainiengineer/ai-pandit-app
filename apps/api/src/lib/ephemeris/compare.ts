import type { EphemerisData } from '@ai-pandit/shared';

export interface EphemerisComparisonSummary {
  sunDelta: number;
  moonDelta: number;
  rahuDelta: number;
  ascendantDelta: number;
  maxPlanetLongitudeDelta: number;
  maxHouseCuspDelta: number;
}

function circularDiffDegrees(a: number, b: number): number {
  const diff = Math.abs(a - b) % 360;
  return Math.min(diff, 360 - diff);
}

function getCusps(ephemeris: EphemerisData): number[] {
  if (Array.isArray(ephemeris.kpCusps) && ephemeris.kpCusps.length >= 12) {
    return ephemeris.kpCusps.slice(0, 12);
  }

  return ephemeris.houses.map((house) => house.cusp).slice(0, 12);
}

export function summarizeEphemerisComparison(
  candidate: EphemerisData,
  baseline: EphemerisData
): EphemerisComparisonSummary {
  const planetKeys = Object.keys(candidate.planets) as Array<keyof EphemerisData['planets']>;

  let maxPlanetLongitudeDelta = 0;
  for (const key of planetKeys) {
    const delta = circularDiffDegrees(
      candidate.planets[key].longitude,
      baseline.planets[key].longitude
    );
    if (delta > maxPlanetLongitudeDelta) {
      maxPlanetLongitudeDelta = delta;
    }
  }

  let maxHouseCuspDelta = 0;
  const candidateCusps = getCusps(candidate);
  const baselineCusps = getCusps(baseline);
  const houseCount = Math.min(candidateCusps.length, baselineCusps.length);
  for (let i = 0; i < houseCount; i++) {
    const delta = circularDiffDegrees(candidateCusps[i], baselineCusps[i]);
    if (delta > maxHouseCuspDelta) {
      maxHouseCuspDelta = delta;
    }
  }

  return {
    sunDelta: circularDiffDegrees(candidate.planets.sun.longitude, baseline.planets.sun.longitude),
    moonDelta: circularDiffDegrees(candidate.planets.moon.longitude, baseline.planets.moon.longitude),
    rahuDelta: circularDiffDegrees(candidate.planets.rahu.longitude, baseline.planets.rahu.longitude),
    ascendantDelta: circularDiffDegrees(candidate.ascendant.longitude, baseline.ascendant.longitude),
    maxPlanetLongitudeDelta,
    maxHouseCuspDelta,
  };
}
