import { generateMoonshootAIPrompt } from './moonshoot-ai-prompt';
import {
    LifeEvent as AppLifeEvent,
    MoonshootAIPromptData,
    LifeEvent as PromptLifeEvent,
    DashaData,
    EphemerisData,
    BirthData,
    PhysicalDescription
} from './types';

const KIMI_API_KEY = process.env.ANTHROPIC_API_KEY;
const KIMI_BASE_URL = process.env.ANTHROPIC_BASE_URL;
const KIMI_MODEL = process.env.MOONSHOT_MODEL || 'kimi-for-coding';

function calculateAgeAtEvent(birthDate: Date, eventDate: Date): number {
  if (!birthDate || !eventDate || isNaN(birthDate.getTime()) || isNaN(eventDate.getTime())) return 0;
  return Math.floor((eventDate.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25));
}

function mapEventCategory(category: AppLifeEvent['category']): PromptLifeEvent['category'] {
    return category === 'children' ? 'family' : category;
}

function transformLifeEvents(events: AppLifeEvent[], birthDate: Date): PromptLifeEvent[] {
  return events.map(event => ({
    ...event,
    category: mapEventCategory(event.category),
    importance: event.importance === 'critical' ? 'high' : event.importance,
    ageAtEvent: calculateAgeAtEvent(birthDate, new Date(event.eventDate)),
  }));
}

export async function getMoonshotAnalysis(
  birthData: Partial<BirthData>,
  physicalDescription: Partial<PhysicalDescription>,
  lifeEvents: AppLifeEvent[]
): Promise<string> {
  if (!KIMI_API_KEY || !KIMI_BASE_URL) {
    console.error('CRITICAL: AI service is not configured.');
    throw new Error('AI analysis service is not configured.');
  }

  const birthDateForAgeCalc = new Date(birthData.date || '');

  const promptData: MoonshootAIPromptData = {
    userData: {
      birthData: birthData as MoonshootAIPromptData['userData']['birthData'],
      physicalDescription: {
        bodyStructure: physicalDescription.bodyStructure || 'average',
        height: physicalDescription.height || 'average',
        faceShape: physicalDescription.faceShape || 'oval',
        complexion: physicalDescription.complexion || 'wheatish',
        distinctiveFeatures: physicalDescription.distinctiveFeatures || 'None',
      },
      lifeEvents: transformLifeEvents(lifeEvents, birthDateForAgeCalc),
      relationship: 'single', 
      occupation: ''
    },
    ephemerisData: {} as EphemerisData,
    dashaData: {} as DashaData,
    timeSlots: [],
    dominantSign: ''
  };

  const prompt = generateMoonshootAIPrompt(promptData);

  try {
    const response = await fetch(KIMI_BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${KIMI_API_KEY}` },
      body: JSON.stringify({
        model: KIMI_MODEL,
        messages: [{ role: 'system', content: 'Expert Vedic Astrologer...' }, { role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      throw new Error(`Kimi API request failed: ${response.status} ${await response.text()}`);
    }

    const result = await response.json();
    return result.choices[0].message.content.trim();

  } catch (error) {
    console.error('Failed to get analysis from Kimi AI:', error);
    throw new Error('An error occurred during the AI analysis process.');
  }
}
