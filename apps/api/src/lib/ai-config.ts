import { config } from '../config/index.js';
import { getGCPAccessToken } from './gcp-auth.js';
import type { AIResponse, AIMessage } from '@ai-pandit/shared';

export type { AIResponse, AIMessage };

export const AI_CONFIG = {
    baseUrl: config.ai.baseUrl,
    apiKey: config.ai.apiKey,
    model: config.ai.model,
    maxTokens: config.ai.maxTokens,
    temperature: config.ai.temperature,
    retryAttempts: config.ai.retryAttempts,
    retryDelayMs: config.ai.retryDelayMs,
    timeoutMs: config.ai.timeoutMs,
    authType: config.ai.authType,
};

export const USE_DETERMINISTIC_AI_MOCK_IN_TESTS =
    (config.app?.isTest ?? (process.env.NODE_ENV === 'test' || process.env.VITEST === 'true')) &&
    process.env.ALLOW_REAL_AI_IN_TESTS !== 'true';

export function isFetchMockedByTestRunner(): boolean {
    const maybeFetch: Record<string, unknown> | undefined = typeof globalThis.fetch === 'function'
        ? globalThis.fetch as unknown as Record<string, unknown>
        : undefined;
    return Boolean(maybeFetch && (typeof maybeFetch.getMockName === 'function' || maybeFetch.mock !== undefined));
}

export function buildDeterministicMockAIResponse(userPrompt: string): AIResponse {
    const preview = userPrompt.slice(0, 120).replace(/\s+/g, ' ').trim();
    return {
        success: true,
        thinking: `MOCK_THINKING: deterministic test response for prompt "${preview}"`,
        content: 'MOCK_RESULT: deterministic AI output for test mode',
        tokensUsed: Math.ceil(userPrompt.length / 4),
    };
}

export async function getAiAuthHeaders(): Promise<Record<string, string>> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };

    if (AI_CONFIG.authType === 'gcp') {
        const token = await getGCPAccessToken();
        headers['Authorization'] = `Bearer ${token}`;
    } else {
        headers['Authorization'] = `Bearer ${AI_CONFIG.apiKey}`;
    }

    const isOpenRouter = AI_CONFIG.baseUrl.includes('openrouter');
    if (isOpenRouter) {
        headers['HTTP-Referer'] = 'https://aipandit.com';
        headers['X-Title'] = 'AI Pandit BTR';
    }

    return headers;
}

export interface AICompletionRequest {
    model: string;
    messages: AIMessage[];
    max_tokens?: number;
    max_completion_tokens?: number;
    temperature?: number;
    stream?: boolean;
    use_search?: boolean;
    include_reasoning?: boolean;
    reasoning_format?: 'raw' | 'parsed' | 'hidden';
    reasoning_effort?: 'low' | 'medium' | 'high' | 'default';
    thinking?: { type: 'enabled' | 'disabled' };
}
