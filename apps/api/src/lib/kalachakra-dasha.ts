/**
 * Kalachakra Dasha Module
 *
 * Advanced lunar-based timing system with Savya/Apasavya cycles.
 * Each nakshatra belongs to one of 9 groups (Kalachakras) with specific
 * planetary sequences.
 *
 * Reference: Brihat Parashara Hora Shastra
 */

const ZODIAC_SIGNS = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
] as const;

const NAKSHATRA_NAMES = [
  'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashirsha', 'Ardra',
  'Punarvasu', 'Pushya', 'Ashlesha', 'Magha', 'Purva Phalguni', 'Uttara Phalguni',
  'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha',
  'Mula', 'Purva Ashadha', 'Uttara Ashadha', 'Shravana', 'Dhanishtha', 'Shatabhisha',
  'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati'
] as const;

type NakshatraName = typeof NAKSHATRA_NAMES[number];

export type KalachakraType = 'Savya' | 'Apisavya' | 'Mixed';

export interface KalachakraPeriod {
  sign: string;
  signIndex: number;
  startDate: Date;
  endDate: Date;
  durationYears: number;
  lord: string;
  kalachakraType: KalachakraType;
}

export interface KalachakraSequence {
  nakshatra: NakshatraName;
  nakshatraIndex: number;
  kalachakraType: KalachakraType;
  startingSign: string;
  sequence: string[];
  durations: number[];
}

interface KalachakraGroup {
  name: string;
  nakshatras: number[];
  type: KalachakraType;
  startingSignIndex: number;
}

const NAKSHATRA_SPAN = 360 / 27;

const KALACHAKRA_GROUPS: KalachakraGroup[] = [
  { name: 'Aśvinī', nakshatras: [0, 9, 18], type: 'Savya', startingSignIndex: 0 },
  { name: 'Bharaṇī', nakshatras: [1, 10, 19], type: 'Apisavya', startingSignIndex: 11 },
  { name: 'Kṛttikā', nakshatras: [2, 11, 20], type: 'Savya', startingSignIndex: 3 },
  { name: 'Rohiṇī', nakshatras: [3, 12, 21], type: 'Apisavya', startingSignIndex: 8 },
  { name: 'Mṛgaśīrṣa', nakshatras: [4, 13, 22], type: 'Savya', startingSignIndex: 1 },
  { name: 'Ārdrā', nakshatras: [5, 14, 23], type: 'Apisavya', startingSignIndex: 6 },
  { name: 'Punarvasu', nakshatras: [6, 15, 24], type: 'Savya', startingSignIndex: 5 },
  { name: 'Puṣya', nakshatras: [7, 16, 25], type: 'Apisavya', startingSignIndex: 10 },
  { name: 'Aśleṣā', nakshatras: [8, 17, 26], type: 'Mixed', startingSignIndex: 7 }
];

const KALACHAKRA_DURATIONS: Record<KalachakraType, number[]> = {
  'Savya': [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18],
  'Apisavya': [18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7],
  'Mixed': [12, 13, 14, 15, 16, 17, 18, 7, 8, 9, 10, 11]
};

const SIGN_LORDS: Record<string, string> = {
  'Aries': 'Mars', 'Taurus': 'Venus', 'Gemini': 'Mercury', 'Cancer': 'Moon',
  'Leo': 'Sun', 'Virgo': 'Mercury', 'Libra': 'Venus', 'Scorpio': 'Mars',
  'Sagittarius': 'Jupiter', 'Capricorn': 'Saturn', 'Aquarius': 'Saturn', 'Pisces': 'Jupiter'
};

export function getKalachakraGroup(nakshatraIndex: number): KalachakraGroup | null {
  for (const group of KALACHAKRA_GROUPS) {
    if (group.nakshatras.includes(nakshatraIndex)) {
      return group;
    }
  }
  return null;
}

export function determineKalachakraType(moonLongitude: number): {
  nakshatra: NakshatraName;
  nakshatraIndex: number;
  type: KalachakraType;
  group: KalachakraGroup | null;
  positionInNakshatra: number;
} {
  const nakshatraIndex = Math.floor(moonLongitude / NAKSHATRA_SPAN);
  const positionInNakshatra = (moonLongitude % NAKSHATRA_SPAN) / NAKSHATRA_SPAN;
  
  const group = getKalachakraGroup(nakshatraIndex);
  
  return {
    nakshatra: NAKSHATRA_NAMES[nakshatraIndex],
    nakshatraIndex,
    type: group?.type || 'Savya',
    group,
    positionInNakshatra
  };
}

export function calculateKalachakraDasha(
  moonLongitude: number,
  birthDate: Date
): KalachakraPeriod[] {
  const { type, group, positionInNakshatra } = 
    determineKalachakraType(moonLongitude);
  
  if (!group) {
    return generateFallbackDasha(birthDate);
  }
  
  const durations = KALACHAKRA_DURATIONS[type];
  const startSignIndex = group.startingSignIndex;
  
  const periods: KalachakraPeriod[] = [];
  let currentDate = new Date(birthDate);
  
  const firstDuration = durations[0];
  const remainingYears = firstDuration * (1 - positionInNakshatra);
  
  const firstEndDate = addYears(currentDate, remainingYears);
  periods.push({
    sign: ZODIAC_SIGNS[startSignIndex],
    signIndex: startSignIndex,
    startDate: new Date(currentDate),
    endDate: firstEndDate,
    durationYears: remainingYears,
    lord: SIGN_LORDS[ZODIAC_SIGNS[startSignIndex]],
    kalachakraType: type
  });
  
  currentDate = firstEndDate;
  
  let signIndex = type === 'Savya' 
    ? (startSignIndex + 1) % 12 
    : (startSignIndex + 11) % 12;
  
  for (let i = 1; i < 12; i++) {
    const duration = durations[i];
    const endDate = addYears(currentDate, duration);
    const sign = ZODIAC_SIGNS[signIndex];
    
    periods.push({
      sign,
      signIndex,
      startDate: new Date(currentDate),
      endDate,
      durationYears: duration,
      lord: SIGN_LORDS[sign],
      kalachakraType: type
    });
    
    currentDate = endDate;
    signIndex = type === 'Savya' 
      ? (signIndex + 1) % 12 
      : (signIndex + 11) % 12;
  }
  
  return periods;
}

export function getKalachakraForDate(
  periods: KalachakraPeriod[],
  eventDate: Date
): KalachakraPeriod | null {
  for (const period of periods) {
    if (eventDate >= period.startDate && eventDate <= period.endDate) {
      return period;
    }
  }
  return null;
}

export interface KalachakraEventMatch {
  eventId: string;
  eventDate: Date;
  eventCategory: string;
  kalachakraSign: string;
  kalachakraLord: string;
  expectedSignificators: string[];
  matchScore: number;
  details: string;
}

const EVENT_SIGNIFICATORS_KC: Record<string, string[]> = {
  marriage: ['Venus', 'Jupiter', 'Moon'],
  career: ['Saturn', 'Sun', 'Jupiter', 'Mercury'],
  education: ['Mercury', 'Jupiter', 'Moon'],
  children: ['Jupiter', 'Venus', 'Moon'],
  health: ['Sun', 'Moon', 'Mars'],
  finance: ['Jupiter', 'Venus', 'Mercury'],
  travel: ['Moon', 'Rahu', 'Jupiter'],
  property: ['Mars', 'Saturn', 'Venus'],
  spiritual: ['Jupiter', 'Ketu', 'Saturn'],
  legal: ['Mars', 'Jupiter', 'Saturn']
};

export function correlateKalachakraWithEvents(
  periods: KalachakraPeriod[],
  events: Array<{
    id: string;
    date: Date;
    category: string;
  }>
): KalachakraEventMatch[] {
  const matches: KalachakraEventMatch[] = [];
  
  for (const event of events) {
    const period = getKalachakraForDate(periods, event.date);
    
    if (!period) continue;
    
    const significators = EVENT_SIGNIFICATORS_KC[event.category] || [];
    const lord = period.lord;
    
    let matchScore = 0;
    let details = '';
    
    if (significators.includes(lord)) {
      matchScore = 80;
      details = `Kalachakra lord ${lord} matches ${event.category} significator`;
    } else {
      matchScore = 30;
      details = `Kalachakra lord ${lord} not a primary significator for ${event.category}`;
    }
    
    const signElement = getSignElement(period.sign);
    const eventElement = getEventElement(event.category);
    
    if (signElement === eventElement) {
      matchScore += 15;
      details += ` | Sign element (${signElement}) supports event`;
    }
    
    matches.push({
      eventId: event.id,
      eventDate: event.date,
      eventCategory: event.category,
      kalachakraSign: period.sign,
      kalachakraLord: lord,
      expectedSignificators: significators,
      matchScore: Math.min(100, matchScore),
      details
    });
  }
  
  return matches;
}

export function calculateKalachakraScore(
  periods: KalachakraPeriod[],
  events: Array<{ id: string; date: Date; category: string }>
): number {
  const matches = correlateKalachakraWithEvents(periods, events);
  
  if (matches.length === 0) return 50;
  
  const totalScore = matches.reduce((sum, m) => sum + m.matchScore, 0);
  return Math.round(totalScore / matches.length);
}

function generateFallbackDasha(birthDate: Date): KalachakraPeriod[] {
  const periods: KalachakraPeriod[] = [];
  let currentDate = new Date(birthDate);
  
  for (let i = 0; i < 12; i++) {
    const duration = 10;
    const endDate = addYears(currentDate, duration);
    
    periods.push({
      sign: ZODIAC_SIGNS[i],
      signIndex: i,
      startDate: new Date(currentDate),
      endDate,
      durationYears: duration,
      lord: SIGN_LORDS[ZODIAC_SIGNS[i]],
      kalachakraType: 'Savya'
    });
    
    currentDate = endDate;
  }
  
  return periods;
}

function addYears(date: Date, years: number): Date {
  const result = new Date(date);
  result.setTime(result.getTime() + years * 365.25 * 24 * 60 * 60 * 1000);
  return result;
}

function getSignElement(sign: string): string {
  const fireSigns = ['Aries', 'Leo', 'Sagittarius'];
  const earthSigns = ['Taurus', 'Virgo', 'Capricorn'];
  const airSigns = ['Gemini', 'Libra', 'Aquarius'];
  const waterSigns = ['Cancer', 'Scorpio', 'Pisces'];
  
  if (fireSigns.includes(sign)) return 'fire';
  if (earthSigns.includes(sign)) return 'earth';
  if (airSigns.includes(sign)) return 'air';
  if (waterSigns.includes(sign)) return 'water';
  return 'unknown';
}

function getEventElement(category: string): string {
  const elementMap: Record<string, string> = {
    marriage: 'water',
    career: 'fire',
    education: 'air',
    children: 'water',
    health: 'earth',
    finance: 'earth',
    travel: 'air',
    property: 'earth',
    spiritual: 'fire',
    legal: 'fire'
  };
  return elementMap[category] || 'unknown';
}

export function formatKalachakraDasha(periods: KalachakraPeriod[]): string {
  const lines = ['KALACHAKRA DASHA (Savya/Apasavya Cycle):'];
  
  for (const period of periods.slice(0, 12)) {
    const start = period.startDate.toISOString().split('T')[0];
    const end = period.endDate.toISOString().split('T')[0];
    lines.push(
      `${period.sign} (${period.lord}): ${start} to ${end} ` +
      `(${period.durationYears.toFixed(1)}y) [${period.kalachakraType}]`
    );
  }
  
  return lines.join('\n');
}

export const Kalachakra = {
  calculate: calculateKalachakraDasha,
  getForDate: getKalachakraForDate,
  correlate: correlateKalachakraWithEvents,
  score: calculateKalachakraScore,
  getType: determineKalachakraType,
  format: formatKalachakraDasha
};

// Legacy export for backward compatibility
export { correlateKalachakraWithEvents as _correlateKalachakraWithEvents };
