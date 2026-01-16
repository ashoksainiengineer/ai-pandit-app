
import type { ChartCalculation } from '@/types';

const MOONSHOT_API_KEY = process.env.MOONSHOT_API_KEY;
const MOONSHOT_API_URL = 'https://api.moonshot.cn/v1/chat/completions';

interface MoonshotResponse {
  // TODO: Define the structure of the Moonshot AI response
}

// This function will send the collected astrological data to Moonshot AI for analysis.
export async function getRectificationAnalysis(charts: ChartCalculation[]): Promise<MoonshotResponse> {
    if (!MOONSHOT_API_KEY) {
        throw new Error("Moonshot API key not configured");
    }

    const response = await fetch(MOONSHOT_API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${MOONSHOT_API_KEY}`,
        },
        body: JSON.stringify({
            model: 'moonshot-v1-8k', // or the specific model you want to use
            messages: [
                {
                    role: "system",
                    content: "You are an expert Vedic Astrologer specializing in Birth Time Rectification. Analyze the provided chart data and determine the most likely birth time."
                },
                {
                    role: "user",
                    content: `Here is the astrological data for a range of possible birth times: ${JSON.stringify(charts)}`
                }
            ],
            temperature: 0.3,
        }),
    });

    if (!response.ok) {
        throw new Error(`Moonshot API request failed with status ${response.status}`);
    }

    return response.json();
}
