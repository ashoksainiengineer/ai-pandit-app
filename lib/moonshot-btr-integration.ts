import { BirthData, PhysicalDescription, LifeEvent as AppLifeEvent, EventCategory as AppEventCategory } from '@/types';
import { generateMoonshootAIPrompt, MoonshootAIPromptData, LifeEvent as PromptLifeEvent } from './moonshoot-ai-prompt';

// Securely get Kimi/Anthropic variables from the environment
const KIMI_API_KEY = process.env.ANTHROPIC_API_KEY;
const KIMI_BASE_URL = process.env.ANTHROPIC_BASE_URL;
const KIMI_MODEL = process.env.MOONSHOT_MODEL || 'kimi-for-coding';

// --- DATA TRANSFORMATION LAYER ---

/**
 * Calculates the age of a person at a given event date.
 */
function calculateAgeAtEvent(birthDate: Date, eventDate: Date): number {
  if (!birthDate || !eventDate || isNaN(birthDate.getTime()) || isNaN(eventDate.getTime())) {
    return 0; // Return 0 for invalid dates
  }
  const diff = eventDate.getTime() - birthDate.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
}

/**
 * Maps the application's event category to the AI prompt's event category.
 */
function mapEventCategory(category: AppEventCategory): PromptLifeEvent['category'] {
    if (category === 'children') return 'family';
    // The type assertion is safe because other categories align
    return category as PromptLifeEvent['category'];
}

/**
 * Transforms the application's LifeEvent[] to the format required by the AI prompt.
 */
function transformLifeEvents(events: AppLifeEvent[], birthDate: Date): PromptLifeEvent[] {
  return events.map(event => ({
    id: event.id,
    category: mapEventCategory(event.category),
    eventType: event.eventType,
    eventDate: event.eventDate, // Property name is the same
    dateAccuracy: event.dateAccuracy as 'exact' | 'month' | 'year', // Ensure compatibility
    description: event.description,
    // Map importance from App's 'critical' to Prompt's 'high'
    importance: event.importance === 'critical' ? 'high' : event.importance,
    ageAtEvent: calculateAgeAtEvent(birthDate, new Date(event.eventDate)),
  }));
}

// --- API INTEGRATION ---

/**
 * Analyzes birth data using the Kimi AI API for a preliminary rectification analysis.
 */
export async function getMoonshotAnalysis(
  birthData: Partial<BirthData>,
  physicalDescription: Partial<PhysicalDescription>,
  lifeEvents: AppLifeEvent[]
): Promise<string> {
  if (!KIMI_API_KEY || !KIMI_BASE_URL) {
    console.error('CRITICAL: AI service is not configured.');
    throw new Error('AI analysis service is not configured. Please contact support.');
  }

  const birthDateForAgeCalc = new Date(birthData.dateOfBirth || '');

  const promptData: MoonshootAIPromptData = {
    userData: {
      // Cast to the prompt's expected type, assuming core data is present.
      birthData: birthData as MoonshootAIPromptData['userData']['birthData'],
      physicalDescription: {
        bodyStructure: physicalDescription.bodyStructure || 'average',
        height: physicalDescription.height || 'average',
        faceShape: physicalDescription.faceShape || 'oval',
        complexion: physicalDescription.complexion || 'wheatish',
        distinctiveFeatures: physicalDescription.distinctiveFeatures || 'None',
      },
      lifeEvents: transformLifeEvents(lifeEvents, birthDateForAgeCalc),
    },
    // For initial analysis, these are placeholders as they are calculated later.
    ephemerisData: { timeSlots: [] },
    dashaData: {
      vimshottariDasha: {
        currentMahadasha: 'N/A', currentAntardasha: 'N/A', currentPratyantardasha: 'N/A',
        mahadashaStartDate: 'N/A', mahadashaEndDate: 'N/A',
      },
      eventDashaCorrelations: [],
    },
    timeSlots: [],
  };

  const prompt = generateMoonshootAIPrompt(promptData);

  try {
    const response = await fetch(KIMI_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${KIMI_API_KEY}`,
      },
      body: JSON.stringify({
        model: KIMI_MODEL,
        messages: [
          { role: 'system', content: 'You are an expert Vedic Astrologer... [System Prompt]' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.3,
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('Kimi API Error:', errorBody);
      throw new Error(`Kimi API request failed: ${response.status}`);
    }

    const result = await response.json();
    return result.choices[0].message.content.trim();

  } catch (error) {
    console.error('Failed to get analysis from Kimi AI:', error);
    throw new Error('An error occurred during the AI analysis process.');
  }
}
