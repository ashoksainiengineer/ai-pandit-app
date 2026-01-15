import { generateMoonshootAIPrompt } from './moonshoot-ai-prompt';
import {
  MoonshootAIConfig,
  AIAnalysisRequest,
  AIAnalysisResponse,
  MoonshootAIPromptData
} from './types';

export interface MoonshootAIClient {
  analyzeBirthTime(request: AIAnalysisRequest): Promise<AIAnalysisResponse>;
  validateResponse(response: any): boolean;
  formatError(error: any): string;
}

interface CachedResult extends AIAnalysisResponse {
  timestamp: number;
}

export class MoonshootAIClientImpl implements MoonshootAIClient {
  private config: MoonshootAIConfig;
  private cache: Map<string, CachedResult>;
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000;

  constructor(config: MoonshootAIConfig) {
    this.config = { 
        baseURL: 'https://api.kimi.com/coding/v1', 
        maxRetries: 3, 
        timeout: 30000, 
        temperature: 0.3, 
        maxTokens: 4000, 
        ...config 
    };
    this.cache = new Map();
  }

  async analyzeBirthTime(request: AIAnalysisRequest): Promise<AIAnalysisResponse> {
    try {
      const cacheKey = this.generateCacheKey(request);
      const cachedResult = this.getCachedResult(cacheKey);
      if (cachedResult) return cachedResult;

      console.log('🌙 Starting Moonshoot AI birth time analysis...');
      const prompt = generateMoonshootAIPrompt(request as MoonshootAIPromptData);
      const response = await this.makeAPIRequestWithRetry(prompt);
      const parsedResponse = this.parseAIResponse(response);
      
      if (!this.validateResponse(parsedResponse)) {
        throw new Error('Invalid AI response structure');
      }

      this.setCachedResult(cacheKey, parsedResponse);
      return parsedResponse;
    } catch (error) {
      console.error('❌ Moonshoot AI analysis failed:', error);
      throw this.formatError(error);
    }
  }

  private async makeAPIRequestWithRetry(prompt: string): Promise<any> {
    for (let attempt = 1; attempt <= (this.config.maxRetries ?? 3); attempt++) {
      try {
        const response = await this.makeAPIRequest(prompt);
        if (response.ok) return await response.json();
        throw new Error(`API error: ${response.status} - ${await response.text()}`);
      } catch (error) {
        console.warn(`⚠️ API attempt ${attempt} failed:`, error);
        if (attempt < (this.config.maxRetries ?? 3)) {
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }
    }
    throw new Error('All API attempts failed');
  }

  private async makeAPIRequest(prompt: string): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);
    try {
        return await fetch(`${this.config.baseURL}/chat/completions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.config.apiKey}` },
            body: JSON.stringify({
                model: 'moonshoot-ai-astrology-v2',
                messages: [{ role: 'system', content: 'Expert Vedic astrologer...' }, { role: 'user', content: prompt }],
                temperature: this.config.temperature,
                max_tokens: this.config.maxTokens
            }),
            signal: controller.signal
        });
    } finally {
        clearTimeout(timeoutId);
    }
  }

  private parseAIResponse(response: any): AIAnalysisResponse {
    try {
      const content = response.choices?.[0]?.message?.content;
      if (!content) throw new Error('No content in AI response');
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON found in AI response');
      return JSON.parse(jsonMatch[0]) as AIAnalysisResponse;
    } catch (error) {
      console.error('Error parsing AI response:', error);
      throw new Error(`Failed to parse AI response: ${error}`);
    }
  }

  validateResponse(response: any): boolean {
    return response && response.recommendedBirthTime && response.confidenceLevel;
  }

  formatError(error: any): string {
    if (error instanceof Error && error.message.includes('API error')) return 'AI service unavailable.';
    return 'An unexpected error occurred during AI analysis.';
  }

  private generateCacheKey = (request: AIAnalysisRequest): string => this.simpleHash(JSON.stringify(request));
  private simpleHash = (str: string): string => str.split('').reduce((hash, char) => (hash << 5) - hash + char.charCodeAt(0), 0).toString(36);

  private getCachedResult(key: string): AIAnalysisResponse | null {
    const cached = this.cache.get(key);
    if (cached && (Date.now() - cached.timestamp) < this.CACHE_DURATION) return cached;
    this.cache.delete(key);
    return null;
  }

  private setCachedResult(key: string, result: AIAnalysisResponse): void {
    this.cache.set(key, { ...result, timestamp: Date.now() });
    this.cleanupCache();
  }

  private cleanupCache(): void {
    this.cache.forEach((value, key) => {
      if ((Date.now() - value.timestamp) > this.CACHE_DURATION) this.cache.delete(key);
    });
  }
}

export const createMoonshootAIClient = (config: MoonshootAIConfig): MoonshootAIClient => new MoonshootAIClientImpl(config);
