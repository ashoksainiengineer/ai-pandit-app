import { LifeEvent, PhysicalTraits, EphemerisData, BTRInput, BTROutput } from './types';
import { calculateEphemeris } from './ephemeris';
import { callAI } from './ai-client';

// Time uncertainty options as string type
type TimeUncertainty = '±15 minutes' | '±30 minutes' | '±1 hour' | '±2 hours' | '±3 hours' | '±4 hours';

const UNCERTAINTY_MINUTES: Record<TimeUncertainty, number> = {
  '±15 minutes': 15,
  '±30 minutes': 30,
  '±1 hour': 60,
  '±2 hours': 120,
  '±3 hours': 180,
  '±4 hours': 240,
};

export function generateCandidates(timeEstimate: string, timeUncertainty: TimeUncertainty): string[] {
  const uncertaintyMinutes = UNCERTAINTY_MINUTES[timeUncertainty];
  const [hour, minute] = timeEstimate.split(':').map(Number);
  const totalMinutes = hour * 60 + minute;

  const startMinutes = Math.max(0, totalMinutes - uncertaintyMinutes);
  const endMinutes = Math.min(1439, totalMinutes + uncertaintyMinutes); // 23:59 = 1439 minutes

  const candidates: string[] = [];
  for (let m = startMinutes; m <= endMinutes; m++) {
    const h = Math.floor(m / 60);
    const min = m % 60;
    candidates.push(`${h.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`);
  }

  return candidates;
}

function scorePhysicalTraits(ephemeris: EphemerisData, physicalTraits?: PhysicalTraits): number {
  if (!physicalTraits) return 50; // Neutral score

  let score = 50;

  const ascendantSign = ephemeris.ascendant.sign;
  const fireSigns = ['Aries', 'Leo', 'Sagittarius'];
  const airSigns = ['Gemini', 'Libra', 'Aquarius'];
  const earthSigns = ['Taurus', 'Virgo', 'Capricorn'];
  const waterSigns = ['Cancer', 'Scorpio', 'Pisces'];

  // Height scoring - now using height object with cm/feet
  const heightCm = physicalTraits.height?.cm || 0;
  if (heightCm > 175) { // tall
    if (fireSigns.includes(ascendantSign) || airSigns.includes(ascendantSign)) score += 30;
  } else if (heightCm < 160) { // short
    if (earthSigns.includes(ascendantSign) || waterSigns.includes(ascendantSign)) score += 20;
  } else {
    score += 15;
  }

  // Build scoring - uses correct enum values: slim, medium, athletic, heavy, very_heavy
  if (physicalTraits.build === 'slim' || physicalTraits.build === 'athletic') {
    if (['Gemini', 'Virgo'].includes(ascendantSign)) score += 25;
  } else if (physicalTraits.build === 'heavy' || physicalTraits.build === 'very_heavy') {
    if (['Taurus', 'Leo'].includes(ascendantSign)) score += 20;
  } else {
    score += 15;
  }

  // Complexion scoring - uses correct enum values: very_fair, fair, medium, dark, very_dark
  const sunSign = ephemeris.planets.sun.sign;
  const moonSign = ephemeris.planets.moon.sign;
  const lightSigns = ['Leo', 'Libra'];
  const darkSigns = ['Scorpio'];

  if (physicalTraits.complexion === 'very_fair' || physicalTraits.complexion === 'fair') {
    if (lightSigns.includes(sunSign) || lightSigns.includes(moonSign)) score += 25;
  } else if (physicalTraits.complexion === 'very_dark' || physicalTraits.complexion === 'dark') {
    if (darkSigns.includes(sunSign) || darkSigns.includes(moonSign)) score += 20;
  } else {
    score += 15;
  }

  return Math.min(100, score);
}

function scoreLifeEvents(ephemeris: EphemerisData, lifeEvents: LifeEvent[]): number {
  if (lifeEvents.length === 0) return 50;

  let totalScore = 0;

  for (const event of lifeEvents) {
    let eventScore = 0;

    // Simplified: check if key planets are favorably placed for the event type
    const keyPlanets = getKeyPlanetsForEvent(event);

    for (const planet of keyPlanets) {
      const planetData = ephemeris.planets[planet as keyof typeof ephemeris.planets];
      if (planetData) {
        // Simple scoring: if planet is in favorable houses
        const favorableHouses = [1, 5, 9, 10, 11];
        const house = getHouseForLongitude(planetData.longitude, ephemeris.ascendant.longitude);
        if (favorableHouses.includes(house)) eventScore += 40 / keyPlanets.length;
      }
    }

    totalScore += eventScore;
  }

  return Math.min(100, totalScore / lifeEvents.length);
}

function getKeyPlanetsForEvent(event: LifeEvent): string[] {
  const categoryMap: Record<string, string[]> = {
    education: ['Mercury', 'Jupiter'],
    career: ['Saturn', 'Mars', 'Sun'],
    marriage: ['Venus', 'Jupiter'],
    children: ['Jupiter', 'Venus'],
    health: ['Mars', 'Saturn'],
    financial: ['Jupiter', 'Venus'],
    legal: ['Mars', 'Saturn', 'Jupiter'],
    public_life: ['Sun', 'Jupiter', 'Rahu'],
    karmic_events: ['Rahu', 'Ketu', 'Saturn'],
    identity_shifts: ['Sun', 'Moon', 'Mars'],
  };

  return categoryMap[event.category] || ['Jupiter'];
}

function getHouseForLongitude(planetLong: number, ascLong: number): number {
  let diff = planetLong - ascLong;
  if (diff < 0) diff += 360;
  return Math.floor(diff / 30) + 1;
}

export async function quickFilterCandidates(
  candidates: string[],
  birthDate: string,
  latitude: number,
  longitude: number,
  timezone: string,
  lifeEvents: LifeEvent[],
  physicalTraits?: PhysicalTraits
): Promise<Array<{ time: string; score: number }>> {
  const scoredCandidates: Array<{ time: string; score: number }> = [];

  for (const time of candidates) {
    try {
      const ephemeris = await calculateEphemeris(birthDate, time, latitude, longitude, timezone);

      const traitScore = scorePhysicalTraits(ephemeris, physicalTraits);
      const eventScore = scoreLifeEvents(ephemeris, lifeEvents);

      const combinedScore = traitScore * 0.3 + eventScore * 0.7;

      if (combinedScore >= 60) {
        scoredCandidates.push({ time, score: Math.round(combinedScore) });
      }
    } catch (error) {
      console.error(`Error calculating for ${time}:`, error);
    }
  }

  return scoredCandidates.sort((a, b) => b.score - a.score).slice(0, 50);
}

async function analyzeCandidateWithAI(prompt: string): Promise<{ score: number; thinking: string }> {
  try {
    const response = await callAI('You are an expert Vedic astrologer analyzing birth time rectification. Return only a JSON object with score (0-100) and thinking (detailed reasoning).', prompt, {
      temperature: 0.3,
      maxTokens: 2000,
    });

    if (!response.success) {
      throw new Error(response.error || 'AI analysis failed');
    }

    // Parse JSON response or extract from text
    try {
      const parsed = JSON.parse(response.content);
      return { score: parsed.score || 50, thinking: parsed.thinking || response.content };
    } catch {
      const scoreMatch = response.content.match(/(\d+)(?:\s*\/\s*100|\s*%)/);
      return {
        score: scoreMatch ? Math.min(100, parseInt(scoreMatch[1])) : 50,
        thinking: response.content || response.thinking || ''
      };
    }
  } catch (error) {
    console.error('AI call failed:', error);
    return { score: 50, thinking: 'AI analysis failed' };
  }
}

function generateAIPrompt(
  time: string,
  ephemeris: EphemerisData,
  lifeEvents: LifeEvent[],
  physicalTraits?: PhysicalTraits
): string {
  const planetsStr = Object.entries(ephemeris.planets)
    .map(([planet, data]) => `${planet}: ${data.sign} ${data.degree.toFixed(1)}°`)
    .join(', ');

  const housesStr = ephemeris.houses
    .map(h => `${h.houseNumber}: ${h.sign} ${h.degree.toFixed(1)}°`)
    .join(', ');

  const eventsStr = lifeEvents
    .map(e => `${e.eventType} on ${e.eventDate}`)
    .join(', ');

  const traitsStr = physicalTraits
    ? `Height: ${physicalTraits.height?.feet || 0}'${physicalTraits.height?.inches || 0}", Build: ${physicalTraits.build}, Complexion: ${physicalTraits.complexion}`
    : 'No physical traits provided';

  return `
Analyze this birth time candidate for rectification:
Time: ${time}
Ascendant: ${ephemeris.ascendant.sign} ${ephemeris.ascendant.degree.toFixed(1)}°
Planets: ${planetsStr}
Houses: ${housesStr}
Life Events: ${eventsStr}
Physical Traits: ${traitsStr}

As an expert Vedic astrologer, rate how well this birth time matches the life events and physical traits on a scale of 0-100.
Consider dasha periods, planetary activations, and astrological principles.
Provide detailed reasoning.

Return JSON: {"score": number, "thinking": "detailed analysis"}
  `;
}

export async function analyzeWithAI(
  filteredCandidates: Array<{ time: string; score: number }>,
  birthDate: string,
  lifeEvents: LifeEvent[],
  latitude: number,
  longitude: number,
  timezone: string
): Promise<Array<{ time: string; aiScore: number; thinking: string }>> {
  const results: Array<{ time: string; aiScore: number; thinking: string }> = [];

  // Take top 40 for AI analysis
  const topCandidates = filteredCandidates.slice(0, 40);

  for (const candidate of topCandidates) {
    try {
      const ephemeris = await calculateEphemeris(birthDate, candidate.time, latitude, longitude, timezone);
      const prompt = generateAIPrompt(candidate.time, ephemeris, lifeEvents);
      const aiResult = await analyzeCandidateWithAI(prompt);
      results.push({
        time: candidate.time,
        aiScore: aiResult.score,
        thinking: aiResult.thinking
      });
    } catch (error) {
      console.error(`AI analysis failed for ${candidate.time}:`, error);
      results.push({
        time: candidate.time,
        aiScore: candidate.score, // Fallback to quick score
        thinking: 'Analysis failed'
      });
    }
  }

  return results.sort((a, b) => b.aiScore - a.aiScore).slice(0, 5);
}

export function selectBestCandidate(
  candidates: Array<{ time: string; aiScore: number; thinking: string }>
): BTROutput {
  const best = candidates[0];

  let confidence: 'High' | 'Medium' | 'Low';
  if (best.aiScore >= 95) confidence = 'High';
  else if (best.aiScore >= 85) confidence = 'Medium';
  else confidence = 'Low';

  // Mock event analysis - in real implementation, would analyze each event
  const eventAnalysis = [
    {
      eventDate: 'example',
      expectedPlanets: ['Jupiter'],
      actualPlanets: ['Jupiter'],
      matchScore: best.aiScore
    }
  ];

  const alternativeTimes = candidates.slice(1, 4).map(c => ({ time: c.time, score: c.aiScore }));

  const weakPoints = best.aiScore < 90 ? ['Low confidence in event matching'] : [];
  const recommendations = best.aiScore < 90
    ? ['Provide more detailed event dates', 'Consult additional life events']
    : ['Birth time appears accurate'];

  return {
    rectifiedTime: best.time,
    accuracy: best.aiScore,
    confidence,
    processingTime: 0, // Would be passed from main function
    analysis: {
      eventAnalysis,
      alternativeTimes,
      weakPoints,
      recommendations
    },
    thinking: best.thinking
  };
}

export async function processBirthTimeRectification(input: BTRInput): Promise<BTROutput> {
  const startTime = Date.now();

  try {
    // Validate inputs
    if (input.lifeEvents.length < 3) {
      throw new Error('At least 3 life events required');
    }

    const birthDateObj = new Date(input.birthDate);
    if (birthDateObj > new Date()) {
      throw new Error('Birth date must be in the past');
    }

    if (Math.abs(input.latitude) > 90 || Math.abs(input.longitude) > 180) {
      throw new Error('Invalid coordinates');
    }

    // Phase 1: Generate candidates (using legacy uncertainty format)
    const uncertainty = (input as any).timeUncertainty || '±1 hour';
    const candidates = generateCandidates(input.timeEstimate, uncertainty as TimeUncertainty);

    // Phase 2: Quick filter
    const filteredCandidates = await quickFilterCandidates(
      candidates,
      input.birthDate,
      input.latitude,
      input.longitude,
      String(input.timezone),
      input.lifeEvents,
      input.physicalTraits
    );

    // Phase 3: AI deep analysis
    const aiResults = await analyzeWithAI(
      filteredCandidates,
      input.birthDate,
      input.lifeEvents,
      input.latitude,
      input.longitude,
      String(input.timezone)
    );

    // Phase 4: Select and compile results
    const result = selectBestCandidate(aiResults);
    result.processingTime = Date.now() - startTime;

    return result;
  } catch (error) {
    console.error('BTR processing failed:', error);
    throw new Error(`Birth time rectification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}