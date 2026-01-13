// ==========================================
// BIRTH TIME RECTIFICATION ANALYSIS ENGINE
// ==========================================
// This module analyzes life events against calculated charts
// to determine the most accurate birth time

import type {
  BirthData,
  PhysicalDescription,
  LifeEvent,
  ChartCalculation,
  RectificationResult,
  EventAnalysis
} from '@/types';
import {
  calculateCompleteChart,
  getDashaForDate,
  ZODIAC_SIGNS,
  PLANETS
} from './ephemeris';

// ==========================================
// EVENT-HOUSE MAPPINGS (K.N. Rao Method)
// ==========================================

const EVENT_HOUSE_MAPPINGS: Record<string, { houses: number[]; karakas: string[]; charts: string[] }> = {
  // Education Events
  'School Completion (10th)': { houses: [4, 5], karakas: ['Mercury', 'Jupiter'], charts: ['D-1', 'D-24'] },
  'Higher Secondary (12th)': { houses: [4, 5], karakas: ['Mercury', 'Jupiter'], charts: ['D-1', 'D-24'] },
  "Bachelor's Degree Start": { houses: [5, 9], karakas: ['Jupiter', 'Mercury'], charts: ['D-1', 'D-24'] },
  "Bachelor's Degree Completion": { houses: [5, 9], karakas: ['Jupiter', 'Mercury'], charts: ['D-1', 'D-24'] },
  "Master's Degree Start": { houses: [9, 5], karakas: ['Jupiter'], charts: ['D-1', 'D-24'] },
  "Master's Degree Completion": { houses: [9, 5], karakas: ['Jupiter'], charts: ['D-1', 'D-24'] },
  'PhD Start': { houses: [9], karakas: ['Jupiter'], charts: ['D-1', 'D-24'] },
  'PhD Completion': { houses: [9], karakas: ['Jupiter'], charts: ['D-1', 'D-24'] },
  'Professional Certification': { houses: [10, 5], karakas: ['Saturn', 'Mercury'], charts: ['D-1', 'D-10'] },
  'Competitive Exam Success': { houses: [5, 9, 10], karakas: ['Jupiter', 'Mercury'], charts: ['D-1', 'D-24'] },
  
  // Career Events
  'First Job': { houses: [10, 6], karakas: ['Saturn', 'Mercury', 'Sun'], charts: ['D-1', 'D-10'] },
  'Job Change': { houses: [10, 6, 3], karakas: ['Saturn', 'Mercury'], charts: ['D-1', 'D-10'] },
  'Promotion': { houses: [10, 11], karakas: ['Sun', 'Jupiter'], charts: ['D-1', 'D-10'] },
  'Business Start': { houses: [7, 10], karakas: ['Mercury', 'Venus'], charts: ['D-1', 'D-10'] },
  'Business Closure': { houses: [8, 12], karakas: ['Saturn', 'Ketu'], charts: ['D-1', 'D-10'] },
  'Major Project Success': { houses: [10, 11], karakas: ['Sun', 'Jupiter'], charts: ['D-1', 'D-10'] },
  'Job Loss/Termination': { houses: [8, 12, 6], karakas: ['Saturn', 'Rahu'], charts: ['D-1', 'D-10'] },
  'Government Job Selection': { houses: [10, 9], karakas: ['Sun', 'Saturn'], charts: ['D-1', 'D-10'] },
  'Transfer/Relocation': { houses: [3, 12], karakas: ['Moon', 'Rahu'], charts: ['D-1', 'D-10'] },
  
  // Marriage Events
  'Marriage': { houses: [7, 2], karakas: ['Venus', 'Jupiter'], charts: ['D-1', 'D-9'] },
  'Engagement': { houses: [7], karakas: ['Venus'], charts: ['D-1', 'D-9'] },
  'Meeting Future Spouse': { houses: [7], karakas: ['Venus'], charts: ['D-1', 'D-9'] },
  'Divorce': { houses: [7, 6, 8], karakas: ['Saturn', 'Mars', 'Rahu'], charts: ['D-1', 'D-9'] },
  'Separation': { houses: [6, 8, 12], karakas: ['Saturn', 'Rahu'], charts: ['D-1', 'D-9'] },
  
  // Children Events
  'First Child Birth': { houses: [5], karakas: ['Jupiter'], charts: ['D-1', 'D-7'] },
  'Second Child Birth': { houses: [5, 9], karakas: ['Jupiter'], charts: ['D-1', 'D-7'] },
  'Third Child Birth': { houses: [5, 11], karakas: ['Jupiter'], charts: ['D-1', 'D-7'] },
  'Miscarriage': { houses: [5, 8], karakas: ['Mars', 'Saturn'], charts: ['D-1', 'D-7'] },
  
  // Family Events
  "Father's Death": { houses: [9, 10, 8], karakas: ['Sun'], charts: ['D-1', 'D-12'] },
  "Mother's Death": { houses: [4, 8], karakas: ['Moon'], charts: ['D-1', 'D-12'] },
  "Sibling's Death": { houses: [3, 8], karakas: ['Mars'], charts: ['D-1', 'D-3'] },
  "Spouse's Death": { houses: [7, 8], karakas: ['Venus'], charts: ['D-1', 'D-9'] },
  
  // Health Events
  'Major Illness': { houses: [6, 8], karakas: ['Saturn', 'Mars'], charts: ['D-1', 'D-30'] },
  'Surgery': { houses: [6, 8], karakas: ['Mars', 'Saturn'], charts: ['D-1', 'D-30'] },
  'Accident/Injury': { houses: [8, 6], karakas: ['Mars', 'Rahu'], charts: ['D-1', 'D-30'] },
  'Hospitalization': { houses: [12, 6, 8], karakas: ['Saturn', 'Ketu'], charts: ['D-1', 'D-30'] },
  
  // Financial Events
  'First Property Purchase': { houses: [4], karakas: ['Mars', 'Venus'], charts: ['D-1', 'D-4'] },
  'Vehicle Purchase': { houses: [4], karakas: ['Venus'], charts: ['D-1', 'D-16'] },
  'Major Investment': { houses: [2, 11], karakas: ['Jupiter', 'Mercury'], charts: ['D-1', 'D-2'] },
  'Financial Loss': { houses: [8, 12], karakas: ['Saturn', 'Ketu'], charts: ['D-1', 'D-2'] },
  'Inheritance': { houses: [8, 2], karakas: ['Jupiter', 'Saturn'], charts: ['D-1'] },
  
  // Travel Events
  'First Foreign Trip': { houses: [9, 12], karakas: ['Rahu', 'Jupiter'], charts: ['D-1'] },
  'Settlement Abroad': { houses: [12, 9], karakas: ['Rahu', 'Ketu'], charts: ['D-1'] },
  'Permanent Relocation': { houses: [4, 12], karakas: ['Moon', 'Rahu'], charts: ['D-1'] },
  
  // Spiritual Events
  'Spiritual Initiation/Diksha': { houses: [9, 12], karakas: ['Jupiter', 'Ketu'], charts: ['D-1', 'D-20'] },
  'Meeting Guru': { houses: [9], karakas: ['Jupiter'], charts: ['D-1', 'D-20'] },
};

// ==========================================
// PHYSICAL CHARACTERISTICS ANALYSIS
// ==========================================

const LAGNA_PHYSICAL_TRAITS: Record<string, {
  bodyStructure: string[];
  faceShape: string[];
  complexion: string[];
  height: string[];
}> = {
  'Aries': {
    bodyStructure: ['athletic', 'average'],
    faceShape: ['angular', 'oval'],
    complexion: ['wheatish', 'fair'],
    height: ['average', 'tall']
  },
  'Taurus': {
    bodyStructure: ['heavy', 'average'],
    faceShape: ['round', 'square'],
    complexion: ['fair', 'wheatish'],
    height: ['average', 'short']
  },
  'Gemini': {
    bodyStructure: ['slim', 'average'],
    faceShape: ['oval', 'angular'],
    complexion: ['fair', 'wheatish'],
    height: ['tall', 'average']
  },
  'Cancer': {
    bodyStructure: ['average', 'heavy'],
    faceShape: ['round', 'oval'],
    complexion: ['fair', 'wheatish'],
    height: ['short', 'average']
  },
  'Leo': {
    bodyStructure: ['athletic', 'heavy'],
    faceShape: ['square', 'oval'],
    complexion: ['fair', 'wheatish'],
    height: ['tall', 'average']
  },
  'Virgo': {
    bodyStructure: ['slim', 'average'],
    faceShape: ['oval', 'angular'],
    complexion: ['wheatish', 'fair'],
    height: ['average']
  },
  'Libra': {
    bodyStructure: ['average', 'slim'],
    faceShape: ['oval', 'round'],
    complexion: ['fair'],
    height: ['average', 'tall']
  },
  'Scorpio': {
    bodyStructure: ['average', 'athletic'],
    faceShape: ['angular', 'oval'],
    complexion: ['wheatish', 'dark'],
    height: ['average']
  },
  'Sagittarius': {
    bodyStructure: ['heavy', 'athletic'],
    faceShape: ['oval', 'angular'],
    complexion: ['fair', 'wheatish'],
    height: ['tall']
  },
  'Capricorn': {
    bodyStructure: ['slim', 'average'],
    faceShape: ['angular', 'square'],
    complexion: ['dark', 'wheatish'],
    height: ['short', 'average']
  },
  'Aquarius': {
    bodyStructure: ['average', 'tall'],
    faceShape: ['oval', 'angular'],
    complexion: ['fair', 'wheatish'],
    height: ['tall', 'average']
  },
  'Pisces': {
    bodyStructure: ['average', 'heavy'],
    faceShape: ['round', 'oval'],
    complexion: ['fair', 'wheatish'],
    height: ['short', 'average']
  }
};

// ==========================================
// ANALYSIS FUNCTIONS
// ==========================================

function analyzeEventAgainstChart(
  event: LifeEvent,
  chart: ChartCalculation
): EventAnalysis {
  const mapping = EVENT_HOUSE_MAPPINGS[event.eventType] || {
    houses: [1],
    karakas: ['Jupiter'],
    charts: ['D-1']
  };
  
  // Get dasha at time of event
  const eventDate = new Date(event.eventDate);
  const dashaInfo = getDashaForDate(chart.vimshottariDasha, eventDate);
  const dashaBhukti = `${dashaInfo.mahaDasha}-${dashaInfo.antardasha}`;
  
  const supportingFactors: string[] = [];
  const concerningFactors: string[] = [];
  
  // Check if dasha lord is connected to relevant houses
  const mahaDashaLord = dashaInfo.mahaDasha;
  const antardashaLord = dashaInfo.antardasha;
  
  // Find planet positions in rashi chart
  const mahaDashaPlanet = chart.rashi.planets.find(p => p.planet === mahaDashaLord);
  const antarDashaPlanet = chart.rashi.planets.find(p => p.planet === antardashaLord);
  
  // Check house connections
  let houseConnectionScore = 0;
  
  mapping.houses.forEach(house => {
    // Check if Mahadasha lord is in or rules relevant house
    if (mahaDashaPlanet) {
      if (mahaDashaPlanet.housePosition === house) {
        supportingFactors.push(`${mahaDashaLord} (MD) placed in ${house}th house`);
        houseConnectionScore += 3;
      }
      
      // Check lordship
      const rulingHouses = getHousesRuled(mahaDashaLord, chart.rashi.lagna.sign as any);
      if (rulingHouses.includes(house)) {
        supportingFactors.push(`${mahaDashaLord} (MD) rules ${house}th house`);
        houseConnectionScore += 2;
      }
    }
    
    // Same for Antardasha lord
    if (antarDashaPlanet && antarDashaPlanet.planet !== mahaDashaPlanet?.planet) {
      if (antarDashaPlanet.housePosition === house) {
        supportingFactors.push(`${antardashaLord} (AD) placed in ${house}th house`);
        houseConnectionScore += 2;
      }
      
      const rulingHouses = getHousesRuled(antardashaLord, chart.rashi.lagna.sign as any);
      if (rulingHouses.includes(house)) {
        supportingFactors.push(`${antardashaLord} (AD) rules ${house}th house`);
        houseConnectionScore += 1;
      }
    }
  });
  
  // Check karaka connections
  mapping.karakas.forEach(karaka => {
    if (karaka === mahaDashaLord || karaka === antardashaLord) {
      supportingFactors.push(`${karaka} (karaka for this event) is active in dasha`);
      houseConnectionScore += 2;
    }
  });
  
  // Check divisional charts
  mapping.charts.forEach(chartName => {
    const divChart = chart.divisionalCharts.find(d => d.chartType === chartName);
    if (divChart) {
      const mahaPlanetInDiv = divChart.planets.find(p => p.planet === mahaDashaLord);
      if (mahaPlanetInDiv) {
        mapping.houses.forEach(house => {
          if (mahaPlanetInDiv.house === house) {
            supportingFactors.push(`${mahaDashaLord} in ${house}th house of ${chartName}`);
            houseConnectionScore += 1;
          }
        });
      }
    }
  });
  
  // Determine match quality
  let matchQuality: 'strong' | 'moderate' | 'weak' | 'mismatch';
  if (houseConnectionScore >= 6) {
    matchQuality = 'strong';
  } else if (houseConnectionScore >= 3) {
    matchQuality = 'moderate';
  } else if (houseConnectionScore >= 1) {
    matchQuality = 'weak';
  } else {
    matchQuality = 'mismatch';
    concerningFactors.push('No significant connection found between dasha and event houses');
  }
  
  // Generate explanation
  const explanation = generateEventExplanation(
    event,
    dashaBhukti,
    matchQuality,
    supportingFactors,
    concerningFactors
  );
  
  return {
    event,
    dashaBhukti,
    relevantCharts: mapping.charts,
    matchQuality,
    explanation,
    supportingFactors,
    concerningFactors
  };
}

function getHousesRuled(planet: string, lagnaSign: any): number[] {
  const signIndex = ZODIAC_SIGNS.indexOf(lagnaSign);
  const houses: number[] = [];
  
  const planetRulers: Record<string, number[]> = {
    'Sun': [5], // Leo
    'Moon': [4], // Cancer
    'Mars': [1, 8], // Aries, Scorpio
    'Mercury': [3, 6], // Gemini, Virgo
    'Jupiter': [9, 12], // Sagittarius, Pisces
    'Venus': [2, 7], // Taurus, Libra
    'Saturn': [10, 11], // Capricorn, Aquarius
    'Rahu': [],
    'Ketu': []
  };
  
  const ruledSigns = planetRulers[planet] || [];
  
  ruledSigns.forEach(signNum => {
    const house = ((signNum - 1 - signIndex + 12) % 12) + 1;
    houses.push(house);
  });
  
  return houses;
}

function generateEventExplanation(
  event: LifeEvent,
  dashaBhukti: string,
  matchQuality: string,
  supportingFactors: string[],
  concerningFactors: string[]
): string {
  let explanation = `During the ${dashaBhukti} period, `;
  
  if (matchQuality === 'strong') {
    explanation += `there is strong astrological support for this ${event.eventType.toLowerCase()}. `;
    explanation += supportingFactors.slice(0, 2).join('. ') + '.';
  } else if (matchQuality === 'moderate') {
    explanation += `there is moderate support for this event. `;
    explanation += supportingFactors.slice(0, 2).join('. ') + '.';
  } else if (matchQuality === 'weak') {
    explanation += `the connection is weak but present. `;
    if (supportingFactors.length > 0) {
      explanation += supportingFactors[0] + '.';
    }
  } else {
    explanation += `the event timing does not strongly align with the chart. `;
    explanation += 'This may indicate birth time adjustment is needed.';
  }
  
  return explanation;
}

function analyzePhysicalDescription(
  physicalDesc: PhysicalDescription,
  lagnaSign: string
): { matches: string[]; mismatches: string[]; overallMatch: 'strong' | 'moderate' | 'weak' } {
  const expectedTraits = LAGNA_PHYSICAL_TRAITS[lagnaSign];
  const matches: string[] = [];
  const mismatches: string[] = [];
  
  if (expectedTraits) {
    // Check body structure
    if (expectedTraits.bodyStructure.includes(physicalDesc.bodyStructure)) {
      matches.push(`Body structure (${physicalDesc.bodyStructure}) matches ${lagnaSign} Lagna`);
    } else {
      mismatches.push(`Body structure (${physicalDesc.bodyStructure}) not typical for ${lagnaSign} Lagna`);
    }
    
    // Check face shape
    if (expectedTraits.faceShape.includes(physicalDesc.faceShape)) {
      matches.push(`Face shape (${physicalDesc.faceShape}) matches ${lagnaSign} Lagna`);
    } else {
      mismatches.push(`Face shape (${physicalDesc.faceShape}) not typical for ${lagnaSign} Lagna`);
    }
    
    // Check complexion
    if (expectedTraits.complexion.includes(physicalDesc.complexion)) {
      matches.push(`Complexion (${physicalDesc.complexion}) matches ${lagnaSign} Lagna`);
    } else {
      mismatches.push(`Complexion (${physicalDesc.complexion}) not typical for ${lagnaSign} Lagna`);
    }
    
    // Check height
    if (expectedTraits.height.includes(physicalDesc.height)) {
      matches.push(`Height (${physicalDesc.height}) matches ${lagnaSign} Lagna`);
    } else {
      mismatches.push(`Height (${physicalDesc.height}) not typical for ${lagnaSign} Lagna`);
    }
  }
  
  const matchRatio = matches.length / (matches.length + mismatches.length);
  const overallMatch = matchRatio >= 0.75 ? 'strong' : matchRatio >= 0.5 ? 'moderate' : 'weak';
  
  return { matches, mismatches, overallMatch };
}

// ==========================================
// MAIN RECTIFICATION FUNCTION
// ==========================================

export async function performRectification(
  birthData: BirthData,
  physicalDescription: PhysicalDescription,
  lifeEvents: LifeEvent[]
): Promise<RectificationResult> {
  // Time adjustment range based on uncertainty
  const adjustmentRanges: Record<string, number> = {
    'exact': 5,
    '5min': 5,
    '15min': 15,
    '30min': 30,
    '1hour': 60,
    '2hour': 120,
    '4hour': 240,
    'unknown': 360
  };
  
  const maxAdjustment = adjustmentRanges[birthData.timeUncertainty] || 60;
  const testIntervals = [-maxAdjustment, -maxAdjustment*0.75, -maxAdjustment*0.5, -maxAdjustment*0.25, -15, -10, -5, 0, 5, 10, 15, maxAdjustment*0.25, maxAdjustment*0.5, maxAdjustment*0.75, maxAdjustment];
  
  let bestScore = -Infinity;
  let bestAdjustment = 0;
  let bestChart: ChartCalculation | null = null;
  let bestEventAnalyses: EventAnalysis[] = [];
  
  // Test different time adjustments
  for (const adjustment of testIntervals) {
    // Create adjusted birth data
    const adjustedBirthData = { ...birthData };
    const [hours, minutes] = birthData.tentativeTime.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + adjustment;
    const newHours = Math.floor(((totalMinutes % 1440) + 1440) % 1440 / 60);
    const newMinutes = ((totalMinutes % 60) + 60) % 60;
    adjustedBirthData.tentativeTime = `${String(newHours).padStart(2, '0')}:${String(Math.floor(newMinutes)).padStart(2, '0')}`;
    
    // Calculate chart for this time
    const chart = calculateCompleteChart(adjustedBirthData);
    
    // Analyze all events
    const eventAnalyses = lifeEvents
      .filter(e => e.importance === 'critical' || e.importance === 'high')
      .map(event => analyzeEventAgainstChart(event, chart));
    
    // Calculate score
    let score = 0;
    eventAnalyses.forEach(analysis => {
      switch (analysis.matchQuality) {
        case 'strong': score += 3; break;
        case 'moderate': score += 1; break;
        case 'weak': score += 0; break;
        case 'mismatch': score -= 2; break;
      }
    });
    
    // Add physical description score
    const physicalAnalysis = analyzePhysicalDescription(physicalDescription, chart.rashi.lagna.sign);
    switch (physicalAnalysis.overallMatch) {
      case 'strong': score += 2; break;
      case 'moderate': score += 1; break;
      case 'weak': score -= 1; break;
    }
    
    if (score > bestScore) {
      bestScore = score;
      bestAdjustment = adjustment;
      bestChart = chart;
      bestEventAnalyses = eventAnalyses;
    }
  }
  
  if (!bestChart) {
    bestChart = calculateCompleteChart(birthData);
  }
  
  // Calculate confidence score
  const maxPossibleScore = lifeEvents.filter(e => e.importance === 'critical' || e.importance === 'high').length * 3 + 2;
  const confidenceScore = Math.max(0, Math.min(10, Math.round((bestScore / maxPossibleScore) * 10)));
  
  const confidenceLevel = 
    confidenceScore >= 8 ? 'very_high' :
    confidenceScore >= 6 ? 'high' :
    confidenceScore >= 4 ? 'moderate' : 'low';
  
  // Calculate rectified time
  const [hours, minutes] = birthData.tentativeTime.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes + bestAdjustment;
  const rectifiedHours = Math.floor(((totalMinutes % 1440) + 1440) % 1440 / 60);
  const rectifiedMinutes = ((totalMinutes % 60) + 60) % 60;
  const rectifiedTime = `${String(rectifiedHours).padStart(2, '0')}:${String(Math.floor(rectifiedMinutes)).padStart(2, '0')}`;
  
  const physicalVerification = analyzePhysicalDescription(physicalDescription, bestChart.rashi.lagna.sign);
  
  // Generate executive summary
  const executiveSummary = generateExecutiveSummary(
    birthData,
    rectifiedTime,
    bestAdjustment,
    confidenceScore,
    bestChart,
    bestEventAnalyses,
    physicalVerification
  );
  
  return {
    originalTime: birthData.tentativeTime,
    rectifiedTime,
    adjustmentMinutes: bestAdjustment,
    confidenceScore,
    confidenceLevel,
    primaryMethod: 'Event-Based Method (K.N. Rao)',
    methodsUsed: [
      'Event-Based Method (K.N. Rao)',
      'Divisional Chart Analysis (D-1, D-9, D-10)',
      'Vimshottari Dasha Correlation',
      'Physical Characteristics Verification'
    ],
    eventAnalyses: bestEventAnalyses,
    physicalVerification,
    rectifiedChart: bestChart,
    recommendations: generateRecommendations(confidenceLevel, bestEventAnalyses),
    executiveSummary
  };
}

function generateExecutiveSummary(
  birthData: BirthData,
  rectifiedTime: string,
  adjustment: number,
  confidence: number,
  chart: ChartCalculation,
  analyses: EventAnalysis[],
  physicalVerification: any
): string {
  const strongMatches = analyses.filter(a => a.matchQuality === 'strong').length;
  const totalEvents = analyses.length;
  
  let summary = `## Birth Time Rectification Analysis for ${birthData.fullName}\n\n`;
  
  summary += `### Key Findings\n`;
  summary += `Based on comprehensive analysis of ${totalEvents} significant life events, `;
  summary += `the rectified birth time is determined to be **${rectifiedTime}** `;
  summary += `(${adjustment >= 0 ? '+' : ''}${adjustment} minutes from tentative time).\n\n`;
  
  summary += `### Confidence Assessment\n`;
  summary += `- **Confidence Score:** ${confidence}/10\n`;
  summary += `- **Strong Event Matches:** ${strongMatches}/${totalEvents}\n`;
  summary += `- **Physical Description Match:** ${physicalVerification.overallMatch}\n`;
  summary += `- **Lagna:** ${chart.rashi.lagna.sign} at ${chart.rashi.lagna.degree}° ${chart.rashi.lagna.minute}'\n\n`;
  
  summary += `### Primary Factors\n`;
  const topFactors = analyses
    .filter(a => a.matchQuality === 'strong')
    .slice(0, 3)
    .map(a => `- ${a.event.eventType} (${a.event.eventDate}): ${a.dashaBhukti} period`);
  summary += topFactors.join('\n');
  
  return summary;
}

function generateRecommendations(
  confidenceLevel: string,
  analyses: EventAnalysis[]
): string[] {
  const recommendations: string[] = [];
  
  if (confidenceLevel === 'low' || confidenceLevel === 'moderate') {
    recommendations.push('Consider providing more life events with exact dates for better accuracy');
    recommendations.push('Marriage and first child birth dates are most reliable for rectification');
  }
  
  const weakAnalyses = analyses.filter(a => a.matchQuality === 'weak' || a.matchQuality === 'mismatch');
  if (weakAnalyses.length > 0) {
    recommendations.push(`Verify dates for: ${weakAnalyses.map(a => a.event.eventType).join(', ')}`);
  }
  
  recommendations.push('For further verification, consult with a professional Vedic astrologer');
  recommendations.push('Use the rectified time for all future chart calculations and predictions');
  
  return recommendations;
}
