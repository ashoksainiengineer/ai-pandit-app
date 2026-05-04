/**
 * D150 Nadi Amsha Correlation Module
 *
 * The ultimate precision layer in Vedic astrology. D150 divides each sign
 * into 150 parts, with each part changing approximately every 48 seconds
 * of birth time. This is the "DNA" level of astrological analysis.
 *
 * Each Nadi Amsha has:
 * - A specific deity name
 * - A specific result (phala)
 * - Karmic significance
 *
 * Reference: Deva-Keralam (Nadiamsha counting rules), KP/BTR timing usage
 */

import { EphemerisData, ZODIAC_SIGNS } from '@ai-pandit/shared';


const NADI_COUNT = 150;
const SIGN_SPAN_DEGREES = 30;
const NADI_SPAN = SIGN_SPAN_DEGREES / NADI_COUNT; // 0.2 degrees (12 arc-min)
const NADI_QUARTER_SPAN = NADI_SPAN / 4; // 0.05 degrees (3 arc-min)
const NADI_TIME_RESOLUTION_SECONDS = 48;

type NadiMode = 'movable' | 'fixed' | 'dual';
type NadiKala = 'Vipra' | 'Kshatriya' | 'Vaisya' | 'Sudra';

export interface NadiAmshaData {
  index: number;
  indexWithinSign?: number;
  sign: string;
  degree: number;
  totalLongitude: number;
  nadiName: string;
  deity: string;
  phala: string;
  karmicSignificance: string;
  timeResolution: number;
  nadiMode?: NadiMode;
  kala?: NadiKala;
}

export interface NadiMatchResult {
  planet: string;
  nadiIndex: number;
  eventCategory: string;
  matchScore: number;
  deityRelevance: number;
  details: string;
}

const NADI_DEITIES: string[] = [
  // First cycle (1-30): Primary deities
  'Agni', 'Brahma', 'Vishnu', 'Shiva', 'Indra', 'Soma', 'Surya', 'Yama',
  'Varuna', 'Vayu', 'Kubera', 'Saraswati', 'Lakshmi', 'Parvati', 'Ganesha',
  'Kartikeya', 'Hanuman', 'Durga', 'Kali', 'Chandra', 'Mangala', 'Budha',
  'Guru', 'Shukra', 'Shani', 'Rahu', 'Ketu', 'Ashwini', 'Bharani', 'Krittika',
  // Second cycle (31-60): Rishi/Devata
  'Vashishtha', 'Vishwamitra', 'Bhrigu', 'Angiras', 'Atri', 'Pulastya',
  'Pulaha', 'Kratu', 'Marichi', 'Narada', 'Daksha', 'Kashyapa', 'Shukracharya',
  'Brihaspati', 'Shanideva', 'Yamaraja', 'Varunadeva', 'Vayudeva', 'Agnideva',
  'Indradeva', 'Kuberadeva', 'Chandradeva', 'Suryadeva', 'Ashwinikumarau',
  'Dhanvantari', 'Garuda', 'Shesha', 'Vasuki', 'Takshaka', 'Ananta',
  // Third cycle (61-90): Shakti forms
  'Gauri', 'Uma', 'Ambika', 'Chandi', 'Chamunda', 'Bhadrakali', 'Mahakali',
  'Mahalakshmi', 'Mahasaraswati', 'Annapurna', 'Lalita', 'Tripura', 'Bhuvaneshwari',
  'Matangi', 'Kamala', 'Tara', 'Shodashi', 'Bhairavi', 'Chinnamasta', 'Dhumavati',
  'Bagalamukhi', 'Kamakhya', 'Narmada', 'Godavari', 'Kaveri', 'Yamuna', 'Ganga',
  'Saraswati', 'Sindhu', 'Brahmaputra',
  // Fourth cycle (91-120): Celestial beings
  'Deva', 'Asura', 'Gandharva', 'Kinnara', 'Yaksha', 'Rakshasa', 'Pishacha',
  'Pretaraja', 'Nagadeva', 'Garudadeva', 'Vidyadhara', 'Siddha', 'Charanacharya',
  'Apsara', 'Urvashi', 'Rambha', 'Menaka', 'Tilottama', 'Ghritachi',
  'Vishwachi', 'Purvachitti', 'Swayamprabha', 'Hemavati', 'Chitralekha',
  'Ratnavali', 'Madhura', 'Vasanta', 'Grishma', 'Varsha', 'Sharada',
  // Fifth cycle (121-150): Guardians and cosmic forces
  'Lokapala', 'Dikpala', 'Kshetrapala', 'Gramadevata', 'Kuladevata', 'Ishtadevata',
  'Pitrideva', 'Matrideva', 'Gurudeva', 'Shikshaka', 'Rakshaka', 'Palaka',
  'Srishtikarta', 'Samharaka', 'Anugrahaka', 'Nigrahaka', 'Prakasha',
  'Vimarsha', 'Ananda', 'Jnana', 'Bala', 'Virya', 'Teja', 'Kshama',
  'Daya', 'Maitri', 'Karuna', 'Mudita', 'Upeksha', 'Shanti',
];

const NADI_PHALAS = [
  'Royal birth', 'Wealthy', 'Scholarly', 'Spiritual', 'Artistic',
  'Warrior', 'Merchant', 'Healer', 'Teacher', 'Leader',
  'Administrator', 'Scientist', 'Philosopher', 'Poet', 'Musician',
  'Artist', 'Craftsman', 'Farmer', 'Ruler', 'Minister',
  'Judge', 'Advisor', 'Diplomat', 'Explorer', 'Innovator',
  'Reformer', 'Revolutionary', 'Protector', 'Guide', 'Visionary'
];

const EVENT_NADI_CORRELATION: Record<string, { favorable: number[]; unfavorable: number[] }> = {
  marriage: {
    favorable: [1, 2, 12, 13, 22, 23, 65, 66, 105, 106],
    unfavorable: [7, 8, 45, 46, 85, 86, 125, 126]
  },
  career: {
    favorable: [0, 4, 16, 17, 48, 49, 88, 89, 128, 129],
    unfavorable: [24, 25, 64, 65, 104, 105, 144, 145]
  },
  children: {
    favorable: [2, 3, 13, 14, 53, 54, 93, 94, 133, 134],
    unfavorable: [8, 9, 49, 50, 89, 90, 129, 130]
  },
  health: {
    favorable: [1, 5, 41, 42, 81, 82, 121, 122],
    unfavorable: [7, 47, 48, 87, 88, 127, 128]
  },
  finance: {
    favorable: [0, 1, 10, 11, 50, 51, 90, 91, 130, 131],
    unfavorable: [20, 21, 60, 61, 100, 101, 140, 141]
  },
  spiritual: {
    favorable: [3, 4, 43, 44, 83, 84, 123, 124],
    unfavorable: [11, 12, 51, 52, 91, 92, 131, 132]
  }
};

export function calculateD150Nadi(longitude: number): NadiAmshaData {
  const normalizedLongitude = normalizeLongitude(longitude);
  const signIndex = Math.floor(normalizedLongitude / SIGN_SPAN_DEGREES);
  const degreeInSign = normalizedLongitude - (signIndex * SIGN_SPAN_DEGREES);

  const zeroBasedWithinSign = Math.min(NADI_COUNT - 1, Math.floor(degreeInSign / NADI_SPAN));
  const indexWithinSign = zeroBasedWithinSign + 1;
  const degreeInNadi = degreeInSign - (zeroBasedWithinSign * NADI_SPAN);

  const nadiMode = getNadiMode(signIndex);
  const canonicalIndex = mapToCanonicalNadiIndex(indexWithinSign, nadiMode);
  const deity = NADI_DEITIES[canonicalIndex - 1] || 'Unknown';
  const phala = NADI_PHALAS[(canonicalIndex - 1) % NADI_PHALAS.length] || 'General';
  const karmicSignificance = getKarmicSignificance(canonicalIndex);
  const kala = getKala(degreeInNadi);

  return {
    index: canonicalIndex,
    indexWithinSign,
    sign: ZODIAC_SIGNS[signIndex],
    degree: degreeInNadi * 150,
    totalLongitude: normalizedLongitude,
    nadiName: `Nadi ${canonicalIndex}`,
    deity,
    phala,
    karmicSignificance,
    timeResolution: NADI_TIME_RESOLUTION_SECONDS,
    nadiMode,
    kala
  };
}

function normalizeLongitude(longitude: number): number {
  return ((longitude % 360) + 360) % 360;
}

function getNadiMode(signIndex: number): NadiMode {
  if (signIndex % 3 === 0) return 'movable';
  if (signIndex % 3 === 1) return 'fixed';
  return 'dual';
}

function mapToCanonicalNadiIndex(indexWithinSign: number, mode: NadiMode): number {
  if (mode === 'movable') return indexWithinSign;
  if (mode === 'fixed') return (NADI_COUNT + 1) - indexWithinSign;
  // Dual signs: 76→150 then 1→75
  return ((indexWithinSign + 74) % NADI_COUNT) + 1;
}

function getKala(degreeInNadi: number): NadiKala {
  const quarter = Math.min(3, Math.floor(degreeInNadi / NADI_QUARTER_SPAN));
  const labels: NadiKala[] = ['Vipra', 'Kshatriya', 'Vaisya', 'Sudra'];
  return labels[quarter];
}

function getKarmicSignificance(indexOneBased: number): string {
  const nadiIndex = indexOneBased - 1;
  if (nadiIndex < 25) return 'Past life karma dominant';
  if (nadiIndex < 50) return 'Family lineage karma';
  if (nadiIndex < 75) return 'Present life creation';
  if (nadiIndex < 100) return 'Relationship karma';
  if (nadiIndex < 125) return 'Career/Dharma focus';
  return 'Spiritual evolution path';
}

export function correlateNadiWithEvent(
  nadiData: NadiAmshaData,
  eventCategory: string
): NadiMatchResult {
  const correlation = EVENT_NADI_CORRELATION[eventCategory];
  
  if (!correlation) {
    return {
      planet: 'Ascendant',
      nadiIndex: nadiData.index,
      eventCategory,
      matchScore: 50,
      deityRelevance: 50,
      details: 'No specific correlation pattern found'
    };
  }
  
  let matchScore = 50;
  let deityRelevance = 50;
  const details: string[] = [];
  const nadiIndexZero = normalizeNadiIndex(nadiData.index - 1);
  
  if (correlation.favorable.includes(nadiIndexZero)) {
    matchScore = 85;
    deityRelevance = 90;
    details.push(`Nadi ${nadiData.index} is highly favorable for ${eventCategory}`);
  } else if (correlation.unfavorable.includes(nadiIndexZero)) {
    matchScore = 25;
    deityRelevance = 30;
    details.push(`Nadi ${nadiData.index} is challenging for ${eventCategory}`);
  } else {
    const nearestFavorable = findNearestFavorable(nadiIndexZero, correlation.favorable);
    const distance = circularDistance(nadiIndexZero, nearestFavorable, NADI_COUNT);
    matchScore = Math.max(40, 80 - distance * 2);
    details.push(`Nadi ${nadiData.index} is moderately favorable for ${eventCategory}`);
  }
  
  details.push(`Deity: ${nadiData.deity}`);
  details.push(`Karmic: ${nadiData.karmicSignificance}`);
  
  return {
    planet: 'Ascendant',
    nadiIndex: nadiData.index,
    eventCategory,
    matchScore,
    deityRelevance,
    details: details.join(' | ')
  };
}

function findNearestFavorable(nadiIndex: number, favorable: number[]): number {
  let nearest = normalizeNadiIndex(favorable[0]);
  let minDistance = circularDistance(normalizeNadiIndex(nadiIndex), nearest, NADI_COUNT);
  
  for (const fav of favorable) {
    const normalizedFav = normalizeNadiIndex(fav);
    const distance = circularDistance(normalizeNadiIndex(nadiIndex), normalizedFav, NADI_COUNT);
    if (distance < minDistance) {
      minDistance = distance;
      nearest = normalizedFav;
    }
  }
  
  return nearest;
}

function normalizeNadiIndex(index: number): number {
  return ((index % NADI_COUNT) + NADI_COUNT) % NADI_COUNT;
}

function circularDistance(a: number, b: number, cycle: number): number {
  const direct = Math.abs(a - b);
  return Math.min(direct, cycle - direct);
}

export function calculateD150ForAllPlanets(
  ephemeris: EphemerisData
): Record<string, NadiAmshaData> {
  const results: Record<string, NadiAmshaData> = {};
  
  for (const [name, data] of Object.entries(ephemeris.planets)) {
    const pos = data as any;
    if (pos.longitude !== undefined) {
      results[name] = calculateD150Nadi(pos.longitude);
    }
  }
  
  results['ascendant'] = calculateD150Nadi(ephemeris.ascendant.longitude);
  
  return results;
}

export interface D150EventAnalysis {
  eventCategory: string;
  ascendantNadi: NadiMatchResult;
  moonNadi: NadiMatchResult;
  sunNadi: NadiMatchResult;
  overallScore: number;
  confidence: 'high' | 'medium' | 'low';
  recommendations: string[];
}

export function analyzeD150ForEvents(
  nadiData: Record<string, NadiAmshaData>,
  events: Array<{ category: string }>
): D150EventAnalysis[] {
  return events.map(event => {
    const ascendantResult = correlateNadiWithEvent(
      nadiData['ascendant'],
      event.category
    );
    
    const moonResult = nadiData['moon'] 
      ? correlateNadiWithEvent(nadiData['moon'], event.category)
      : { matchScore: 50, deityRelevance: 50, details: 'No Moon Nadi data' } as NadiMatchResult;
    
    const sunResult = nadiData['sun']
      ? correlateNadiWithEvent(nadiData['sun'], event.category)
      : { matchScore: 50, deityRelevance: 50, details: 'No Sun Nadi data' } as NadiMatchResult;
    
    const overallScore = Math.round(
      (ascendantResult.matchScore * 0.5 + 
       moonResult.matchScore * 0.3 + 
       sunResult.matchScore * 0.2)
    );
    
    let confidence: 'high' | 'medium' | 'low';
    if (overallScore >= 75) confidence = 'high';
    else if (overallScore >= 50) confidence = 'medium';
    else confidence = 'low';
    
    const recommendations: string[] = [];
    if (ascendantResult.matchScore < 50) {
      recommendations.push(`Ascendant Nadi ${ascendantResult.nadiIndex} suggests timing adjustment`);
    }
    if (moonResult.matchScore < 50) {
      recommendations.push('Moon Nadi indicates potential karmic challenge');
    }
    if (overallScore >= 75) {
      recommendations.push('Excellent Nadi alignment for this event');
    }
    
    return {
      eventCategory: event.category,
      ascendantNadi: ascendantResult,
      moonNadi: moonResult,
      sunNadi: sunResult,
      overallScore,
      confidence,
      recommendations
    };
  });
}

export function calculateD150Score(
  nadiData: Record<string, NadiAmshaData>,
  events: Array<{ category: string }>
): number {
  const analyses = analyzeD150ForEvents(nadiData, events);
  
  if (analyses.length === 0) return 50;
  
  const totalScore = analyses.reduce((sum, a) => sum + a.overallScore, 0);
  return Math.round(totalScore / analyses.length);
}

export function formatNadiData(data: NadiAmshaData): string {
  return [
    `D150 NADI AMSHA:`,
    `  Index: ${data.index}/150`,
    `  Sign: ${data.sign} ${data.degree.toFixed(4)}°`,
    `  Deity: ${data.deity}`,
    `  Phala: ${data.phala}`,
    `  Karmic: ${data.karmicSignificance}`,
    `  Time Resolution: ~${data.timeResolution} seconds`
  ].join('\n');
}

export function formatD150Analysis(analysis: D150EventAnalysis): string {
  return [
    `D150 ANALYSIS FOR ${analysis.eventCategory.toUpperCase()}:`,
    `  Overall Score: ${analysis.overallScore}/100 (${analysis.confidence} confidence)`,
    `  Ascendant Nadi: ${analysis.ascendantNadi.matchScore}/100`,
    `  Moon Nadi: ${analysis.moonNadi.matchScore}/100`,
    `  Sun Nadi: ${analysis.sunNadi.matchScore}/100`,
    `  Recommendations: ${analysis.recommendations.join('; ')}`
  ].join('\n');
}

export const NadiAmsha = {
  calculate: calculateD150Nadi,
  calculateAll: calculateD150ForAllPlanets,
  correlateEvent: correlateNadiWithEvent,
  analyzeEvents: analyzeD150ForEvents,
  score: calculateD150Score,
  formatData: formatNadiData,
  formatAnalysis: formatD150Analysis
};
