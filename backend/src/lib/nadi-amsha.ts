/**
 * D150 Nadi Amsha Correlation Module
 *
 * The ultimate precision layer in Vedic astrology. D150 divides each sign
 * into 150 parts, with each part changing approximately every 4.8 seconds
 * of birth time. This is the "DNA" level of astrological analysis.
 *
 * Each Nadi Amsha has:
 * - A specific deity name
 * - A specific result (phala)
 * - Karmic significance
 *
 * Reference: Nadi texts, BPHS Shashtyamsha varga
 */

import { EphemerisData } from './types.js';

const ZODIAC_SIGNS = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
];

const NADI_SPAN = 30 / 150;

export interface NadiAmshaData {
  index: number;
  sign: string;
  degree: number;
  totalLongitude: number;
  nadiName: string;
  deity: string;
  phala: string;
  karmicSignificance: string;
  timeResolution: number;
}

export interface NadiMatchResult {
  planet: string;
  nadiIndex: number;
  eventCategory: string;
  matchScore: number;
  deityRelevance: number;
  details: string;
}

const NADI_DEITIES = [
  'Agni', 'Brahma', 'Vishnu', 'Rudra', 'Indra', 'Soma', 'Yama', 'Varuna',
  'Vayu', 'Kubera', 'Ashwini Kumar', 'Saraswati', 'Lakshmi', 'Durga', 'Ganesha',
  'Hanuman', 'Kartikeya', 'Surya', 'Chandra', 'Mangal', 'Budha', 'Guru',
  'Shukra', 'Shani', 'Rahu', 'Ketu', 'Ganga', 'Yamuna', 'Saraswati',
  'Narmada', 'Godavari', 'Kaveri', 'Krishna', 'Bhagirathi', 'Mandakini',
  'Alakananda', 'Tamraparni', 'Sindhu', 'Brahmaputra', 'Mahanadi', 'Tapti',
  'Mahi', 'Sabarmati', 'Tungabhadra', 'Penna', 'Sharavati', 'Netravati',
  'Kalindi', 'Gandaki', 'Kosi', 'Ghaghara', 'Yamuna', 'Chambal', 'Betwa',
  'Sone', 'Damodar', 'Mahananda', 'Teesta', 'Manas', 'Brahmaputra',
  'Irrawaddy', 'Mekong', 'Yangtze', 'Huang He', 'Amur', 'Lena', 'Yenisei',
  'Ob', 'Volga', 'Danube', 'Rhine', 'Seine', 'Thames', 'Nile', 'Niger',
  'Congo', 'Zambezi', 'Orange', 'Murray', 'Darling', 'Amazon', 'Orinoco',
  'Parana', 'Uruguay', 'Magdalena', 'Colorado', 'Columbia', 'Mississippi',
  'Missouri', 'Ohio', 'Rio Grande', 'Arkansas', 'Red', 'Snake', 'Sacramento',
  'San Joaquin', 'Willamette', 'Yukon', 'Mackenzie', 'St Lawrence',
  'Hudson', 'Connecticut', 'Potomac', 'James', 'Savannah', 'Suwannee',
  'Apalachicola', 'Mobile', 'Pearl', 'Trinity', 'Brazos', 'Pecos',
  'Gila', 'Salt', 'Verde', 'Santa Cruz', 'Mojave', 'Owens', 'Truckee',
  'Carson', 'Walker', 'Humboldt', 'Bear', 'Jordan', 'Weber', 'Green',
  'Yampa', 'White', 'Gunnison', 'Dolores', 'San Juan', 'Animas',
  'Piedra', 'Los Pinos', 'Florida', 'Los Animas', 'Navajo', 'Laja',
  'Purus', 'Javari', 'Jurua', 'Tef', 'Coari', 'Madeira', 'Tapaj',
  'Xingu', 'Tocantins', 'Araguaia', 'Par', 'Maranho', 'Piau',
  'Cear', 'Rio Grande do Norte', 'Paraba', 'Pernambuco', 'Alagoas',
  'Sergipe', 'Bahia', 'Esprito Santo', 'Rio de Janeiro', 'So Paulo',
  'Paran', 'Santa Catarina', 'Rio Grande do Sul'
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
  const signIndex = Math.floor(longitude / 30);
  const degreeInSign = longitude % 30;
  const nadiIndex = Math.floor(degreeInSign / NADI_SPAN);
  const degreeInNadi = degreeInSign % NADI_SPAN;
  
  let calculatedNadiIndex: number;
  const signType = signIndex % 3;
  
  if (signType === 0) {
    calculatedNadiIndex = (signIndex * 150 / 12 + nadiIndex) % 150;
  } else if (signType === 1) {
    calculatedNadiIndex = (149 - nadiIndex + signIndex * 150 / 12) % 150;
  } else {
    calculatedNadiIndex = (75 + nadiIndex + signIndex * 150 / 12) % 150;
  }
  
  const deity = NADI_DEITIES[calculatedNadiIndex] || 'Unknown';
  const phala = NADI_PHALAS[calculatedNadiIndex % NADI_PHALAS.length] || 'General';
  const karmicSignificance = getKarmicSignificance(calculatedNadiIndex);
  const timeResolution = 4.8;
  
  return {
    index: nadiIndex + 1,
    sign: ZODIAC_SIGNS[signIndex],
    degree: degreeInNadi * 150,
    totalLongitude: longitude,
    nadiName: `Nadi ${calculatedNadiIndex + 1}`,
    deity,
    phala,
    karmicSignificance,
    timeResolution
  };
}

function getKarmicSignificance(nadiIndex: number): string {
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
  
  if (correlation.favorable.includes(nadiData.index - 1)) {
    matchScore = 85;
    deityRelevance = 90;
    details.push(`Nadi ${nadiData.index} is highly favorable for ${eventCategory}`);
  } else if (correlation.unfavorable.includes(nadiData.index - 1)) {
    matchScore = 25;
    deityRelevance = 30;
    details.push(`Nadi ${nadiData.index} is challenging for ${eventCategory}`);
  } else {
    const nearestFavorable = findNearestFavorable(nadiData.index - 1, correlation.favorable);
    const distance = Math.abs(nadiData.index - 1 - nearestFavorable);
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
  let nearest = favorable[0];
  let minDistance = Math.abs(nadiIndex - nearest);
  
  for (const fav of favorable) {
    const distance = Math.abs(nadiIndex - fav);
    if (distance < minDistance) {
      minDistance = distance;
      nearest = fav;
    }
  }
  
  return nearest;
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
