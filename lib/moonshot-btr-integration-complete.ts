import {
    BirthData, 
    PhysicalDescription, 
    LifeEvent as AppLifeEvent, 
    RectificationResult, 
    EventCategory as AppEventCategory
} from '@/types';
import {
    generateMoonshootAIPrompt, 
    MoonshootAIPromptData, 
    LifeEvent as PromptLifeEvent 
} from './moonshoot-ai-prompt';

// Securely get Kimi/Anthropic variables from the environment
const KIMI_API_KEY = process.env.ANTHROPIC_API_KEY;
const KIMI_BASE_URL = process.env.ANTHROPIC_BASE_URL;
const KIMI_MODEL = process.env.MOONSHOT_MODEL || 'kimi-for-coding';

// --- DATA TRANSFORMATION LAYER ---

function calculateAgeAtEvent(birthDate: Date, eventDate: Date): number {
  if (!birthDate || !eventDate || isNaN(birthDate.getTime()) || isNaN(eventDate.getTime())) return 0;
  const diff = eventDate.getTime() - birthDate.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
}

function mapEventCategory(category: AppEventCategory): PromptLifeEvent['category'] {
    if (category === 'children') return 'family';
    return category as PromptLifeEvent['category'];
}

function transformLifeEvents(events: AppLifeEvent[], birthDate: Date): PromptLifeEvent[] {
  return events.map(event => ({
    id: event.id,
    category: mapEventCategory(event.category),
    eventType: event.eventType,
    eventDate: event.eventDate,
    dateAccuracy: event.dateAccuracy as 'exact' | 'month' | 'year',
    description: event.description,
    importance: event.importance === 'critical' ? 'high' : event.importance,
    ageAtEvent: calculateAgeAtEvent(birthDate, new Date(event.eventDate)),
  }));
}

// --- API INTEGRATION FOR FINAL REPORT ---

/**
 * Generates a comprehensive final birth time rectification report using the Kimi AI API.
 */
export async function generateFinalMoonshotReport(
  birthData: Partial<BirthData>,
  physicalDescription: Partial<PhysicalDescription>,
  lifeEvents: AppLifeEvent[],
  rectificationResult: RectificationResult
): Promise<string> {
  if (!KIMI_API_KEY || !KIMI_BASE_URL) {
    console.error('CRITICAL: AI service is not configured.');
    throw new Error('AI analysis service is not configured. Please contact support.');
  }

  const birthDateForAgeCalc = new Date(birthData.dateOfBirth || '');

  // Transform the final result into the format the AI prompt expects.
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
    },
    // The prompt expects different structures than the rectificationResult provides.
    // We must manually construct them.
    ephemerisData: {
        // This part of the prompt is not used in the final report generation
        // so we can pass an empty array.
        timeSlots: [],
    },
    dashaData: {
        // This part of the prompt is not used in the final report generation
        // so we can pass an empty object.
        vimshottariDasha: {} as any,
        eventDashaCorrelations: [],
    },
    timeSlots: [
        {
            timestamp: rectificationResult.rectifiedTime,
            offset: rectificationResult.adjustmentMinutes,
            confidence: rectificationResult.confidenceScore,
            reasons: rectificationResult.recommendations,
        }
    ],
  };

  const prompt = generateMoonshootAIPrompt(promptData);

  const systemContent = `You are a highly skilled Vedic Astrologer generating a final report. The final rectified time is ${rectificationResult.rectifiedTime}. Synthesize all provided data into a clear, encouraging report. Explain the significance of the determined Ascendant and how life events align with this finding.`;

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
          { role: 'system', content: systemContent },
          { role: 'user', content: prompt },
        ],
        temperature: 0.5,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('Kimi API Error (Final Report):', errorBody);
      throw new Error(`Kimi API request failed: ${response.status}`);
    }

    const result = await response.json();
    return result.choices[0].message.content.trim();

  } catch (error) {
    console.error('Failed to generate final report from Kimi AI:', error);
    throw new Error('An error occurred during the final AI report generation.');
  }
}
