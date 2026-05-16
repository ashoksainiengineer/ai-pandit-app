import { logger } from '../utils/logger.js';
import { config } from '../config/index.js';
import { AIServiceError } from '../errors/index.js';
import {
    AI_CONFIG,
    USE_DETERMINISTIC_AI_MOCK_IN_TESTS,
    isFetchMockedByTestRunner,
    buildDeterministicMockAIResponse,
    getAiAuthHeaders,
    type AICompletionRequest,
    type AIResponse,
    type AIMessage,
} from './ai-config.js';
import { sleep } from './ai-helpers.js';

export type { AIResponse, AIMessage };

export {
  AI_CONFIG,
  USE_DETERMINISTIC_AI_MOCK_IN_TESTS,
  isFetchMockedByTestRunner,
  buildDeterministicMockAIResponse,
  AICompletionRequest,
};

export interface AICompletionResponse {
    choices: Array<{
        message: {
            role: string;
            content: string;
            reasoning?: string;
            reasoning_content?: string;
        };
        finish_reason: string;
    }>;
    usage?: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
    };
}

export async function callAI(
    systemPrompt: string,
    userPrompt: string,
    options?: {
        temperature?: number;
        maxTokens?: number;
        enableThinking?: boolean;
        model?: string;
    }
): Promise<AIResponse> {
    if (USE_DETERMINISTIC_AI_MOCK_IN_TESTS && !isFetchMockedByTestRunner()) {
        return buildDeterministicMockAIResponse(userPrompt);
    }

    const configLocal = {
        temperature: options?.temperature ?? AI_CONFIG.temperature,
        maxTokens: options?.maxTokens ?? AI_CONFIG.maxTokens,
        enableThinking: options?.enableThinking ?? true,
        model: options?.model ?? AI_CONFIG.model,
    };

    if (!AI_CONFIG.apiKey) {
        logger.error('AI API_KEY not configured');
        return {
            success: false,
            content: '',
            error: 'AI API key not configured',
        };
    }

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= AI_CONFIG.retryAttempts; attempt++) {
        try {
            logger.info('Calling AI Engine', {
                attempt,
                model: configLocal.model,
                enableThinking: configLocal.enableThinking,
                keyLen: AI_CONFIG.apiKey?.length,
                baseUrl: AI_CONFIG.baseUrl
            });

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), AI_CONFIG.timeoutMs);

            const isReasonerModel = config.ai.reasonerIdentifiers.some(id => configLocal.model.toLowerCase().includes(id.toLowerCase()));

            const requestBody: AICompletionRequest = {
                model: configLocal.model,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt },
                ],
                max_tokens: configLocal.maxTokens,
                stream: false,
            };

            if (!isReasonerModel) {
                requestBody.temperature = configLocal.temperature;
            }

            if (configLocal.enableThinking) {
                requestBody.use_search = false;
            }

            const reasoningMode = config.ai.reasoningMode;
            if (isReasonerModel) {
                if (reasoningMode === 'include_reasoning') {
                    requestBody.include_reasoning = true;
                } else if (reasoningMode === 'reasoning_format_raw') {
                    requestBody.reasoning_format = 'raw';
                    requestBody.max_completion_tokens = requestBody.max_tokens;
                } else if (reasoningMode === 'none') {
                    requestBody.include_reasoning = false;
                } else if (reasoningMode === 'auto') {
                    requestBody.include_reasoning = true;
                }

                if (config.ai.reasoningEffort && config.ai.reasoningEffort !== 'default') {
                    requestBody.reasoning_effort = config.ai.reasoningEffort;
                }
            }

            const headers = await getAiAuthHeaders();

            const response = await fetch(`${AI_CONFIG.baseUrl}/chat/completions`, {
                method: 'POST',
                headers,
                body: JSON.stringify(requestBody),
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                if (response.status === 429) {
                    logger.warn(`AI Rate Limit Hit (429). Waiting 30s before retry ${attempt}/${AI_CONFIG.retryAttempts}...`);
                    await sleep(30000);
                    continue;
                }

                let errorText = '';
                try {
                    errorText = await response.text();
                } catch (_) {
                    errorText = 'Response body not readable';
                }

                if (response.status === 400) {
                    logger.error(`🔱 Permanent API error 400 (not retryable). Skipping retries.`);
                    return {
                        success: false,
                        content: '',
                        error: `API error 400 (permanent): ${errorText}`,
                    };
                }

                throw new AIServiceError(`AI API error ${response.status}: ${errorText}`, { status: response.status });
            }

            const rawData = await response.json() as Record<string, unknown>;
            if (!rawData?.choices && !(rawData?.choices as Array<unknown>)?.[0]) {
                throw new AIServiceError('Invalid response format from AI: missing message content in response');
            }
            const data = rawData as unknown as AICompletionResponse;
            const message = data.choices[0].message;

            let thinking = '';
            let content = message.content || '';

            if (message.reasoning) {
                thinking = message.reasoning;
            } else if (message.reasoning_content) {
                thinking = message.reasoning_content;
            }

            const thinkingMatch = content.match(/<(?:thinking|think|thought)>([\s\S]*?)<\/(?:thinking|think|thought)>/i);
            if (thinkingMatch) {
                thinking = thinkingMatch[1].trim();
                content = content.replace(/<(?:thinking|think|thought)>[\s\S]*?<\/(?:thinking|think|thought)>/gi, '').trim();
            }

            logger.info('AI response received', {
                contentLength: content.length,
                thinkingLength: thinking.length,
                tokensUsed: data.usage?.total_tokens,
            });

            return {
                success: true,
                thinking,
                content,
                tokensUsed: data.usage?.total_tokens,
            };

        } catch (error) {
            lastError = error as Error;
            logger.error(`AI attempt ${attempt} failed`, error);

            if (attempt < AI_CONFIG.retryAttempts) {
                await sleep(AI_CONFIG.retryDelayMs * attempt);
            }
        }
    }

    return {
        success: false,
        content: '',
        error: lastError?.message || 'All retry attempts failed',
    };
}


// Re-export stream and parallel helpers for stage pipeline backward compatibility
export { callAIWithStream as _callAIWithStream } from './ai-stream-client.js';
export { executeAIInParallel as _executeAIInParallel } from './ai-helpers.js';
