/**
 * 🌙 Moonshoot AI Client for Birth Time Rectification
 * 
 * Advanced AI-powered birth time analysis using:
 * - Swiss Ephemeris planetary data
 * - Vedic astrology principles
 * - Comprehensive life event analysis
 * - Multiple verification methods
 */

import { generateMoonshootAIPrompt, MoonshootAIPromptData } from './moonshoot-ai-prompt';

export interface MoonshootAIConfig {
  apiKey: string;
  baseURL?: string;
  maxRetries?: number;
  timeout?: number;
  temperature?: number;
  maxTokens?: number;
}

export interface AIAnalysisRequest {
  userData: any;
  ephemerisData: any;
  dashaData: any;
  timeSlots: any[];
}

export interface AIAnalysisResponse {
  recommendedBirthTime: string;
  confidenceLevel: number;
  analysis: {
    physicalTraitsMatch: string;
    lifeEventsCorrelation: string;
    planetaryValidation: string;
    dashasAccuracy: string;
  };
  alternativeTimes: Array<{
    time: string;
    confidence: number;
    reason: string;
  }>;
  keyFindings: string[];
  personalityInsights: string;
  futurePredictions: string;
  confidenceBreakdown: {
    physicalFeatures: number;
    eventCorrelation: number;
    dashaAlignment: number;
    advancedMethods: number;
    total: number;
  };
}

export interface MoonshootAIClient {
  analyzeBirthTime(request: AIAnalysisRequest): Promise<AIAnalysisResponse>;
  validateResponse(response: any): boolean;
  formatError(error: any): string;
}

/**
 * Cached result with timestamp
 */
interface CachedResult extends AIAnalysisResponse {
  timestamp: number;
}

/**
 * Moonshoot AI Client Implementation
 */
export class MoonshootAIClientImpl implements MoonshootAIClient {
  private config: MoonshootAIConfig;
  private cache: Map<string, CachedResult>;
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
  private readonly DEFAULT_MAX_RETRIES = 3;
  private readonly DEFAULT_TIMEOUT = 30000; // 30 seconds
  private readonly DEFAULT_TEMPERATURE = 0.3; // Low for consistency
  private readonly DEFAULT_MAX_TOKENS = 4000;

  constructor(config: MoonshootAIConfig) {
    this.config = {
      baseURL: 'https://api.moonshoot.ai/v1',
      maxRetries: this.DEFAULT_MAX_RETRIES,
      timeout: this.DEFAULT_TIMEOUT,
      temperature: this.DEFAULT_TEMPERATURE,
      maxTokens: this.DEFAULT_MAX_TOKENS,
      ...config
    };
    
    this.cache = new Map();
  }

  /**
   * Analyze birth time using Moonshoot AI
   */
  async analyzeBirthTime(request: AIAnalysisRequest): Promise<AIAnalysisResponse> {
    try {
      // Generate cache key
      const cacheKey = this.generateCacheKey(request);
      
      // Check cache first
      const cachedResult = this.getCachedResult(cacheKey);
      if (cachedResult) {
        console.log('🎯 Returning cached AI analysis result');
        return cachedResult;
      }

      console.log('🌙 Starting Moonshoot AI birth time analysis...');
      
      // Generate comprehensive prompt
      const prompt = generateMoonshootAIPrompt({
        userData: request.userData,
        ephemerisData: request.ephemerisData,
        dashaData: request.dashaData,
        timeSlots: request.timeSlots
      });

      console.log('📋 Generated comprehensive AI prompt');

      // Make API call with retries
      const response = await this.makeAPIRequestWithRetry(prompt);
      
      // Parse and validate response
      const parsedResponse = this.parseAIResponse(response);
      
      // Validate response structure
      if (!this.validateResponse(parsedResponse)) {
        throw new Error('Invalid AI response structure');
      }

      console.log('✅ AI analysis completed successfully');
      
      // Cache the result
      this.setCachedResult(cacheKey, parsedResponse);
      
      return parsedResponse;
      
    } catch (error) {
      console.error('❌ Moonshoot AI analysis failed:', error);
      throw this.formatError(error);
    }
  }

  /**
   * Make API request with retry logic
   */
  private async makeAPIRequestWithRetry(prompt: string): Promise<any> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= this.config.maxRetries!; attempt++) {
      try {
        console.log(`🚀 API attempt ${attempt}/${this.config.maxRetries}`);
        
        const response = await this.makeAPIRequest(prompt);
        
        if (response.ok) {
          const data = await response.json();
          console.log('📡 API response received successfully');
          return data;
        } else {
          const errorData = await response.json();
          throw new Error(`API error: ${response.status} - ${errorData.message || 'Unknown error'}`);
        }
        
      } catch (error) {
        lastError = error as Error;
        console.warn(`⚠️ API attempt ${attempt} failed:`, error);
        
        if (attempt < this.config.maxRetries!) {
          // Exponential backoff
          const delay = Math.pow(2, attempt) * 1000;
          console.log(`⏳ Waiting ${delay}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError || new Error('All API attempts failed');
  }

  /**
   * Make single API request
   */
  private async makeAPIRequest(prompt: string): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      return await fetch(`${this.config.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          model: 'moonshoot-ai-astrology-v2',
          messages: [
            {
              role: 'system',
              content: 'You are an expert Vedic astrologer specializing in birth time rectification. Follow the provided analysis framework exactly and provide structured, detailed responses.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: this.config.temperature,
          max_tokens: this.config.maxTokens,
          top_p: 0.9,
          frequency_penalty: 0.1,
          presence_penalty: 0.1
        }),
        signal: controller.signal
      });
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Parse AI response
   */
  private parseAIResponse(response: any): AIAnalysisResponse {
    try {
      const content = response.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error('No content in AI response');
      }

      // Extract JSON from the response content
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in AI response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      // Ensure all required fields are present
      return {
        recommendedBirthTime: parsed.recommendedBirthTime || 'Unknown',
        confidenceLevel: parsed.confidenceLevel || 0,
        analysis: {
          physicalTraitsMatch: parsed.analysis?.physicalTraitsMatch || 'No analysis provided',
          lifeEventsCorrelation: parsed.analysis?.lifeEventsCorrelation || 'No analysis provided',
          planetaryValidation: parsed.analysis?.planetaryValidation || 'No analysis provided',
          dashasAccuracy: parsed.analysis?.dashasAccuracy || 'No analysis provided'
        },
        alternativeTimes: parsed.alternativeTimes || [],
        keyFindings: parsed.keyFindings || [],
        personalityInsights: parsed.personalityInsights || 'No insights provided',
        futurePredictions: parsed.futurePredictions || 'No predictions provided',
        confidenceBreakdown: parsed.confidenceBreakdown || {
          physicalFeatures: 0,
          eventCorrelation: 0,
          dashaAlignment: 0,
          advancedMethods: 0,
          total: 0
        }
      };
    } catch (error) {
      console.error('Error parsing AI response:', error);
      throw new Error(`Failed to parse AI response: ${error}`);
    }
  }

  /**
   * Validate AI response structure
   */
  validateResponse(response: any): boolean {
    const requiredFields = [
      'recommendedBirthTime',
      'confidenceLevel',
      'analysis',
      'alternativeTimes',
      'keyFindings',
      'personalityInsights',
      'futurePredictions'
    ];

    const analysisFields = [
      'physicalTraitsMatch',
      'lifeEventsCorrelation',
      'planetaryValidation',
      'dashasAccuracy'
    ];

    // Check top-level fields
    for (const field of requiredFields) {
      if (!(field in response)) {
        console.error(`Missing required field: ${field}`);
        return false;
      }
    }

    // Check analysis sub-fields
    if (!response.analysis) {
      console.error('Missing analysis object');
      return false;
    }

    for (const field of analysisFields) {
      if (!(field in response.analysis)) {
        console.error(`Missing analysis field: ${field}`);
        return false;
      }
    }

    // Validate data types
    if (typeof response.confidenceLevel !== 'number' || response.confidenceLevel < 0 || response.confidenceLevel > 100) {
      console.error('Invalid confidence level');
      return false;
    }

    if (!Array.isArray(response.alternativeTimes) || !Array.isArray(response.keyFindings)) {
      console.error('Invalid array fields');
      return false;
    }

    return true;
  }

  /**
   * Format error for user consumption
   */
  formatError(error: any): string {
    if (error instanceof Error) {
      if (error.message.includes('API error')) {
        return 'AI analysis service is temporarily unavailable. Please try again in a few moments.';
      }
      if (error.message.includes('timeout')) {
        return 'Analysis is taking longer than expected. Please try again.';
      }
      if (error.message.includes('parse')) {
        return 'Unable to process the analysis results. Please try again.';
      }
      return error.message;
    }
    
    return 'An unexpected error occurred during AI analysis. Please try again.';
  }

  /**
   * Generate cache key from request data
   */
  private generateCacheKey(request: AIAnalysisRequest): string {
    const dataString = JSON.stringify({
      userData: request.userData,
      ephemerisData: request.ephemerisData,
      dashaData: request.dashaData
    });
    
    // Create hash of the data
    return this.simpleHash(dataString);
  }

  /**
   * Simple hash function for cache keys
   */
  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }

  /**
   * Get cached result
   */
  private getCachedResult(key: string): AIAnalysisResponse | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached;
    }
    return null;
  }

  /**
   * Set cached result
   */
  private setCachedResult(key: string, result: AIAnalysisResponse): void {
    this.cache.set(key, {
      ...result,
      timestamp: Date.now()
    });
    
    // Clean up old cache entries
    this.cleanupCache();
  }

  /**
   * Clean up old cache entries
   */
  private cleanupCache(): void {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.CACHE_DURATION) {
        this.cache.delete(key);
      }
    }
  }
}

/**
 * Factory function to create Moonshoot AI client
 */
export function createMoonshootAIClient(config: MoonshootAIConfig): MoonshootAIClient {
  return new MoonshootAIClientImpl(config);
}

/**
 * Mock client for testing (returns realistic mock data)
 */
export class MockMoonshootAIClient implements MoonshootAIClient {
  async analyzeBirthTime(request: AIAnalysisRequest): Promise<AIAnalysisResponse> {
    console.log('🧪 Using mock AI client for testing');
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Generate realistic mock response based on input data
    const mockResponse: AIAnalysisResponse = {
      recommendedBirthTime: '07:23:45',
      confidenceLevel: 85,
      analysis: {
        physicalTraitsMatch: `Physical characteristics align well with Leo ascendant. The ${request.userData.physicalDescription.bodyStructure} body structure and ${request.userData.physicalDescription.faceShape} face shape are consistent with fire sign influence.`,
        lifeEventsCorrelation: `Strong correlation found in 4 out of 5 major life events. Marriage event perfectly aligns with Venus Mahadasha activation of 7th house.`,
        planetaryValidation: `Planetary positions show excellent alignment with life events timeline. Retrograde Mercury during education period explains academic challenges.`,
        dashasAccuracy: `Vimshottari Dasha periods show 90% accuracy with provided events. Current Venus-Mercury period strongly supports recent developments.`
      },
      alternativeTimes: [
        {
          time: '07:18:30',
          confidence: 78,
          reason: 'Explains early education events better but weakens marriage timing correlation'
        },
        {
          time: '07:28:15',
          confidence: 72,
          reason: 'Stronger for career events but reduces physical features match'
        }
      ],
      keyFindings: [
        'D-9 Navamsa Lagna change at 7:23 AM is critical for marriage timing',
        'Venus Mahadasha perfectly aligns with major relationship events',
        'Physical features strongly support Leo ascendant with Mars aspect',
        'Current Dasha period indicates significant life transitions'
      ],
      personalityInsights: 'With Leo ascendant and strong Venus influence, you are likely charismatic, creative, and relationship-oriented. The Mars aspect adds determination and leadership qualities.',
      futurePredictions: 'Upcoming Jupiter transit over natal Moon (2024-2025) indicates major career advancement and potential relocation. Saturn\'s aspect on 7th house suggests important relationship decisions.',
      confidenceBreakdown: {
        physicalFeatures: 22,
        eventCorrelation: 40,
        dashaAlignment: 13,
        advancedMethods: 10,
        total: 85
      }
    };
    
    return mockResponse;
  }

  validateResponse(response: any): boolean {
    return true; // Mock validation
  }

  formatError(error: any): string {
    return 'Mock AI client error';
  }
}