import {
    BirthData,
    PhysicalDescription,
    LifeEvent,
    VimshottariDasha,
} from '../types';

// These types were previously in `lib/types.ts` and are specific to this prompt generation file.
// To avoid polluting the global types, they are defined here.
export interface EphemerisData {
    timeSlots: Array<{
      timestamp: string;
      julianDay: number;
      planets: Record<string, { longitude: number; speed: number; house: number }>;
      houseCusps: number[];
      lunarPhase: string;
      retrogradePlanets: string[];
      nakshatras: Record<string, { name: string; pada: number; lord: string }>;
      divisionalCharts: Record<string, { lagna: number; planets: Record<string, number> }>;
    }>;
}

export interface TimeSlotAnalysis {
  time: string;
  score: number;
  reason: string;
}

export interface MoonshootAIPromptData {
    userData: {
      birthData: BirthData;
      physicalDescription: PhysicalDescription;
      lifeEvents: LifeEvent[];
      relationship: 'single' | 'married' | 'in_relationship' | 'divorced' | 'widowed';
      occupation: string;
    };
    ephemerisData: EphemerisData;
    dashaData: VimshottariDasha;
    timeSlots: Array<{
      time: string;
      score: number;
      planetaryPositions: Record<string, { longitude: number; house: number }>;
    }>;
    dominantSign: string;
}

export function generateMoonshootAIPrompt(data: MoonshootAIPromptData): string {
  const { userData, ephemerisData, dashaData, timeSlots } = data;
  
  return `
## INPUT DATA ANALYSIS

### BASIC BIRTH DETAILS:
- Date of Birth: ${userData.birthData.dateOfBirth}
- Tentative Birth Time: ${userData.birthData.tentativeTime}
- Place of Birth: ${userData.birthData.birthPlace}
- Gender: ${userData.birthData.gender}

### PHYSICAL CHARACTERISTICS:
- Body Structure: ${userData.physicalDescription.bodyStructure}
- Face Shape: ${userData.physicalDescription.faceShape}

### LIFE EVENTS CHRONOLOGY:
${formatLifeEventsForAI(userData.lifeEvents)}

## EPHEMERIS CALCULATIONS

### TIME SLOT ANALYSIS:
${formatEphemerisDataForAI(ephemerisData.timeSlots)}

### DASHA PERIOD CORRELATIONS:
${formatDashaDataForAI(dashaData)}

## TIME SLOT EVALUATION

${evaluateTimeSlots(timeSlots as any, userData, ephemerisData, dashaData)}

## STRUCTURED OUTPUT FORMAT

### EVENT VERIFICATION RESULTS
${generateEventVerificationFormat(userData.lifeEvents)}

`;
}

function formatLifeEventsForAI(events: LifeEvent[]): string {
  if (!events || events.length === 0) return "No life events provided.";
  // Using eventType and eventDate from the centralized LifeEvent type.
  return events.map((event, index) => 
    `${index + 1}. **${event.eventType}** - ${event.eventDate}`
  ).join('\n');
}

function formatEphemerisDataForAI(timeSlots: EphemerisData['timeSlots']): string {
  if (!timeSlots || timeSlots.length === 0) return "No ephemeris data available.";
  return timeSlots.map((slot, index) => 
    `${index + 1}. **Time: ${slot.timestamp}** - Lagna: ${getZodiacSign(slot.houseCusps[0])}`
  ).join('\n');
}

function formatDashaDataForAI(dashaData: VimshottariDasha): string {
  if (!dashaData) return "No dasha data available.";
  // Using currentDasha from the centralized VimshottariDasha type.
  return `**Current Dasha:** ${dashaData.currentDasha}`;
}

function evaluateTimeSlots(timeSlots: TimeSlotAnalysis[], userData: any, ephemerisData: EphemerisData, dashaData: VimshottariDasha): string {
    if (!timeSlots || timeSlots.length === 0) return "No time slots to evaluate.";
    const topSlots = timeSlots.sort((a, b) => b.score - a.score).slice(0, 3);
    return `**TOP 3 TIME SLOT RECOMMENDATIONS:**\n\n${topSlots.map((slot, index) => `${index + 1}. **Time: ${slot.time}**\n   - Confidence: ${slot.score}%`).join('\n\n')}`;
}

function generateEventVerificationFormat(events: LifeEvent[]): string {
    if (!events || events.length === 0) return "No events to verify.";
    return events.map((event, index) => `EVENT ${index + 1}: ${event.eventType}\n- Match Quality: [Strong/Moderate/Weak]`).join('\n\n');
}

function getZodiacSign(degree: number): string {
  const signs = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
  return signs[Math.floor(degree / 30)];
}
