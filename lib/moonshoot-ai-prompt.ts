import {
    MoonshootAIPromptData,
    LifeEvent,
    DashaData,
    EphemerisData,
    TimeSlotAnalysis
} from './types';

export function generateMoonshootAIPrompt(data: MoonshootAIPromptData): string {
  const { userData, ephemerisData, dashaData, timeSlots } = data;
  
  return `
## INPUT DATA ANALYSIS

### BASIC BIRTH DETAILS:
- Date of Birth: ${userData.birthData.date}
- Tentative Birth Time: ${userData.birthData.time}
- Place of Birth: ${userData.birthData.place}
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
  return events.map((event, index) => 
    `${index + 1}. **${event.ageAtEvent} years:** ${event.eventType} - ${event.eventDate}`
  ).join('\n');
}

function formatEphemerisDataForAI(timeSlots: EphemerisData['timeSlots']): string {
  if (!timeSlots || timeSlots.length === 0) return "No ephemeris data available.";
  return timeSlots.map((slot, index) => 
    `${index + 1}. **Time: ${slot.timestamp}** - Lagna: ${getZodiacSign(slot.houseCusps[0])}`
  ).join('\n');
}

function formatDashaDataForAI(dashaData: DashaData): string {
  if (!dashaData) return "No dasha data available.";
  return `**Current Dasha:** ${dashaData.vimshottariDasha.currentMahadasha}`;
}

function evaluateTimeSlots(timeSlots: TimeSlotAnalysis[], userData: any, ephemerisData: EphemerisData, dashaData: DashaData): string {
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
