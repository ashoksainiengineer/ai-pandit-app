/**
 * Transit Data Builder Module
 *
 * Constructs transit analysis data for life events,
 * including Dasha correlation, event signatures, and planetary positions.
 */

import { calculateEphemeris } from '../ephemeris.js';
import { getDashaForDate, verifyDoubleTransit, calculateVimshottariDasha } from '../vedic-astrology-engine.js';
import { capitalizeFirstLetter } from '../utils/index.js';
import { LifeEvent } from '@ai-pandit/shared';
import { ZODIAC_SIGNS } from '@ai-pandit/shared';

/**
 * Calculate relative house position
 */
function calculateRelativeHouse(targetSign: string, ascendantSign: string): number {
  return ((ZODIAC_SIGNS.indexOf(targetSign) - ZODIAC_SIGNS.indexOf(ascendantSign) + 12) % 12) + 1;
}

/**
 * Calculate Kakshya (8 sub-divisions of a sign, 3°45' each)
 * Order: Saturn, Jupiter, Mars, Sun, Venus, Mercury, Moon, Ascendant
 */
function calculateKakshya(longitude: number): string {
  const degreeInSign = longitude % 30;
  const kakshyaSize = 30 / 8; // 3.75 degrees
  const kakshyaNum = Math.floor(degreeInSign / kakshyaSize);
  const KAKSHYA_ORDER = ['Saturn', 'Jupiter', 'Mars', 'Sun', 'Venus', 'Mercury', 'Moon', 'Ascendant'];
  return KAKSHYA_ORDER[kakshyaNum] || 'Unknown';
}

export interface TransitDataEntry {
  dasha: string;
  signatures: string[];
  planets: Record<string, string>;
  doubleTransit: any;
}

export interface TransitBuildOptions {
  lifeEvents: LifeEvent[];
  moonLongitude: number;
  birthDate: string | Date;
  ephemeris: any;
  input: {
    dateOfBirth: string;
    latitude: number;
    longitude: number;
    timezone: string;
  };
  vedicSignals?: {
    charaKarakas?: any[];
  };
}

/**
 * Builds transit data for all life events
 */
export async function buildTransitData(
  options: TransitBuildOptions
): Promise<Record<string, TransitDataEntry>> {
  const { lifeEvents, moonLongitude, birthDate, ephemeris, input, vedicSignals } = options;
  const transitData: Record<string, TransitDataEntry> = {};

  // Compute the native Dasha tree for accurate date intersection logic (UI arrays fail here)
  const vimshottariDashas = calculateVimshottariDasha(moonLongitude, new Date(birthDate), 4);

  for (const event of lifeEvents) {
    try {
      const entry = await buildSingleEventTransit(event, {
        vimshottariDashas,
        ephemeris,
        input,
        vedicSignals
      });

      if (entry) {
        transitData[event.eventDate] = entry;
      }
    } catch {
      // Skip events that fail to process
      continue;
    }
  }

  return transitData;
}

/**
 * Build transit data for a single life event
 */
async function buildSingleEventTransit(
  event: LifeEvent,
  context: {
    vimshottariDashas: any[];
    ephemeris: any;
    input: {
      latitude: number;
      longitude: number;
      timezone: string;
    };
    vedicSignals?: {
      charaKarakas?: any[];
    };
  }
): Promise<TransitDataEntry | null> {
  const { vimshottariDashas, ephemeris, input, vedicSignals } = context;

  // Calculate ephemeris for event date
  const eventEph = await calculateEphemeris(
    event.eventDate,
    event.eventTime || '12:00:00',
    input.latitude,
    input.longitude,
    input.timezone
  );

  // Get Dasha at event time
  const dashaAtEvent = getDashaForDate(vimshottariDashas, new Date(event.eventDate));
  const dashaSequence = formatDashaSequence(dashaAtEvent);

  // Build event signatures
  const signatures: string[] = [];

  // Add Dasha-Varga synergy signature
  const dashaSignature = buildDashaSignature(event, dashaAtEvent, ephemeris);
  if (dashaSignature) signatures.push(dashaSignature);

  // Add Double Transit signature
  const dtSignature = buildDoubleTransitSignature(event, eventEph, ephemeris);
  if (dtSignature) signatures.push(dtSignature);

  // Add Jaimini Karaka signature
  const karakaSignature = buildJaiminiSignature(event, dashaAtEvent, vedicSignals?.charaKarakas);
  if (karakaSignature) signatures.push(karakaSignature);

  // Add Kakshya precision
  const jupKakshya = calculateKakshya(eventEph.planets.jupiter.longitude);
  const satKakshya = calculateKakshya(eventEph.planets.saturn.longitude);
  signatures.push(`Quantum: Ju in ${jupKakshya} Kakshya | Sa in ${satKakshya} Kakshya`);

  // Calculate double transit result
  const houseMap: Record<string, number> = {
    marriage: 7, career: 10, education: 4, family: 2, children: 5, health: 6, travel: 9
  };
  const targetHouse = houseMap[event.category as keyof typeof houseMap] || 1;
  const dtResult = verifyDoubleTransit(eventEph, ephemeris.ascendant.sign, targetHouse);

  return {
    dasha: dashaSequence,
    signatures,
    planets: formatPlanetPositions(eventEph.planets, ephemeris.ascendant.sign),
    doubleTransit: dtResult
  };
}

/**
 * Format Dasha sequence from DashaAtDate object
 */
function formatDashaSequence(dashaAtEvent: any): string {
  if (!dashaAtEvent) return 'Unknown';

  return `${dashaAtEvent.mahadasha}-${dashaAtEvent.antardasha}-${dashaAtEvent.pratyantardasha}-${dashaAtEvent.sukshmadasha}-${dashaAtEvent.pranadasha}`;
}

/**
 * Build Dasha signature based on event category
 */
function buildDashaSignature(
  event: LifeEvent,
  dashaAtEvent: any,
  ephemeris: any
): string | null {
  if (!dashaAtEvent) return null;

  const lord = dashaAtEvent.mahadasha.toLowerCase();
  const divisionalChart = ephemeris.divisionalCharts;

  // Career/Education events check D10
  if ((event.category === 'career' || event.category === 'education') && divisionalChart?.D10?.planets[lord]) {
    const d10Pos = divisionalChart.D10.planets[lord];
    if ([1, 5, 9, 10].includes(d10Pos.house)) {
      return `Dasha Lord ${dashaAtEvent.mahadasha} is STRONG in D10 (H${d10Pos.house})`;
    }
  }

  // Marriage events check D9
  if (event.category === 'marriage' && divisionalChart?.D9?.planets[lord]) {
    const d9Pos = divisionalChart.D9.planets[lord];
    if ([1, 5, 7, 9].includes(d9Pos.house)) {
      return `Dasha Lord ${dashaAtEvent.mahadasha} is STRONG in D9 (H${d9Pos.house})`;
    }
  }

  return null;
}

/**
 * Build Double Transit signature
 */
function buildDoubleTransitSignature(
  event: LifeEvent,
  eventEph: any,
  baseEphemeris: any
): string | null {
  const houseMap: Record<string, number> = {
    marriage: 7, career: 10, education: 4, family: 2, children: 5, health: 6, travel: 9
  };
  const targetHouse = houseMap[event.category as keyof typeof houseMap] || 1;

  const dtResult = verifyDoubleTransit(eventEph, baseEphemeris.ascendant.sign, targetHouse);

  if (dtResult.isTriggered) {
    return `🔱 DOUBLE TRANSIT active in H${targetHouse}`;
  }

  return null;
}

/**
 * Build Jaimini Karaka signature
 */
function buildJaiminiSignature(
  event: LifeEvent,
  dashaAtEvent: any,
  charaKarakas?: any[]
): string | null {
  if (!charaKarakas || !dashaAtEvent) return null;

  const ak = charaKarakas.find((k: any) => k.karakaName === 'Atmakaraka')?.planet;
  const amk = charaKarakas.find((k: any) => k.karakaName === 'Amatyakaraka')?.planet;
  const dk = charaKarakas.find((k: any) => k.karakaName === 'Darakaraka')?.planet;

  // Marriage events check Darakaraka
  if (event.category === 'marriage') {
    if (dashaAtEvent.mahadasha === dk || dashaAtEvent.antardasha === dk) {
      return `Jaimini: Darakaraka ${dk} (Spouse) is active`;
    }
  }

  // Career events check Amatyakaraka
  if (event.category === 'career') {
    if (dashaAtEvent.mahadasha === amk || dashaAtEvent.antardasha === amk) {
      return `Jaimini: Amatyakaraka ${amk} (Career) is active`;
    }
  }

  return null;
}

/**
 * Format planet positions for transit data
 */
function formatPlanetPositions(planets: Record<string, any>, natalAscendantSign: string): Record<string, string> {
  const formatted: Record<string, string> = {};

  for (const [name, p] of Object.entries(planets)) {
    const retroMarker = p.retro ? '(R)' : '';
    const house = calculateRelativeHouse(p.sign, natalAscendantSign);
    formatted[capitalizeFirstLetter(name)] = `${p.sign} ${p.degree.toFixed(1)}°${retroMarker} | H${house}`;
  }

  return formatted;
}
