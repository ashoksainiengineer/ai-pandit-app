import { logger } from '../utils/logger.js';
import { config } from '../config/index.js';
import { AIServiceError } from '../errors/index.js';
import type { AIResponse } from '@ai-pandit/shared';
// Inline debug logging to avoid ESM import issues
const logAnalysisContainerAction = (stage: number | string, context: string, payload: unknown) => {
    if (process.env.NODE_ENV !== 'development') return;
    try {
        console.log(`[DEBUG-AI] Stage ${stage} - ${context}`);
    } catch (e) {}
};
import { thinkingPersistence } from './btr/thinking-persistence.js';
import { emitAIThinking } from './session-events.js';
import {
    AI_CONFIG,
    USE_DETERMINISTIC_AI_MOCK_IN_TESTS,
    isFetchMockedByTestRunner,
    buildDeterministicMockAIResponse,
    type AICompletionRequest,
} from './ai-config.js';
import { sleep } from './ai-helpers.js';

export async function callAIWithStream(
    sessionId: string,
    stage: number,
    systemPrompt: string,
    userPrompt: string,
    options?: {
        temperature?: number;
        maxTokens?: number;
        model?: string;
        candidateTime?: string;
        abortSignal?: AbortSignal;
        onToken?: (content: string, isThinking: boolean) => void;
        timeoutMs?: number;
        progressTracker?: {
            updateAIThinking: (text: string, stage: number, candidateTime?: string) => Promise<void>;
        };
    }
): Promise<AIResponse> {
    if (USE_DETERMINISTIC_AI_MOCK_IN_TESTS && !isFetchMockedByTestRunner()) {
        const mock = buildDeterministicMockAIResponse(userPrompt);
        const chunk = 'MOCK_STREAM_CHUNK';
        emitAIThinking(sessionId, chunk, stage, options?.candidateTime);
        options?.onToken?.(chunk, true);
        if (options?.progressTracker && typeof options.progressTracker.updateAIThinking === 'function') {
            await options.progressTracker.updateAIThinking(chunk, stage, options?.candidateTime);
        }
        return mock;
    }

    const configLocal = {
        temperature: options?.temperature ?? AI_CONFIG.temperature,
        maxTokens: options?.maxTokens ?? AI_CONFIG.maxTokens,
        model: options?.model ?? AI_CONFIG.model,
    };

    if (!AI_CONFIG.apiKey) {
        return {
            success: false,
            content: '',
            error: 'AI API key not configured',
        };
    }

    let lastError: Error | null = null;
    const startTime = Date.now();

    for (let attempt = 1; attempt <= AI_CONFIG.retryAttempts; attempt++) {
        try {
            logger.info(`callAIWithStream attempt ${attempt}/${AI_CONFIG.retryAttempts}`, { sessionId: sessionId?.slice(0, 8), stage });
            logger.info('Calling AI with streaming', {
                sessionId,
                stage,
                attempt,
                model: configLocal.model,
                keyLen: AI_CONFIG.apiKey?.length,
                baseUrl: AI_CONFIG.baseUrl
            });

            const controller = new AbortController();
            const timeoutMs = options?.timeoutMs ?? AI_CONFIG.timeoutMs;
            const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

            if (options?.abortSignal) {
                options.abortSignal.addEventListener('abort', () => {
                    logger.info('AI call cancelled by user');
                    controller.abort();
                });
            }

            const isReasonerModel = config.ai.reasonerIdentifiers.some(id => configLocal.model.toLowerCase().includes(id.toLowerCase()));
            const isOpenRouter = AI_CONFIG.baseUrl.includes('openrouter');

            const requestBody: AICompletionRequest = {
                model: configLocal.model,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt },
                ],
                max_tokens: configLocal.maxTokens,
                stream: true,
            };

            if (!isReasonerModel) {
                requestBody.temperature = configLocal.temperature;
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

            const response = await fetch(`${AI_CONFIG.baseUrl}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${AI_CONFIG.apiKey}`,
                    'Content-Type': 'application/json',
                    ...(isOpenRouter && {
                        'HTTP-Referer': 'https://aipandit.com',
                        'X-Title': 'AI Pandit BTR',
                    }),
                },
                body: JSON.stringify(requestBody),
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorText = await response.text();

                if (response.status === 429) {
                    const waitMatch = errorText.match(/try again in ([\d.]+)s/i);
                    const waitMs = waitMatch ? Math.ceil(parseFloat(waitMatch[1]) * 1000) + 1000 : 5000;
                    logger.warn(`🔱 Rate limit hit (429). Waiting ${waitMs}ms before retry ${attempt}/${AI_CONFIG.retryAttempts}`, { sessionId, stage });
                    await sleep(waitMs);
                    throw new AIServiceError(`API error 429 (rate limited, waited ${waitMs}ms): ${errorText}`, { status: 429, waitMs });
                }

                if (response.status === 400) {
                    logger.error(`🔱 Permanent API error 400 (not retryable). Skipping retries.`, { sessionId, stage });
                    lastError = new Error(`API error 400 (permanent): ${errorText}`);
                    break;
                }

                throw new AIServiceError(`API error ${response.status}: ${errorText}`, { status: response.status });
            }

            const reader = response.body?.getReader();
            if (!reader) {
                throw new AIServiceError('No response body');
            }

            const decoder = new TextDecoder();
            let fullContent = '';
            let fullThinking = '';
            let buffer = '';
            let emitBuffer = '';
            let lastEmitTime = Date.now();

            let idleTimeoutId = setTimeout(() => {
                logger.error('🔱 AI Stream idle timeout reached (60s without chunks). Aborting socket.', { sessionId, stage });
                controller.abort();
            }, 60000);

            try {
                while (true) {
                    const { done, value } = await reader.read();

                    clearTimeout(idleTimeoutId);
                    if (!done) {
                        idleTimeoutId = setTimeout(() => {
                            logger.error('🔱 AI Stream idle timeout reached (60s without chunks). Aborting socket.', { sessionId, stage });
                            controller.abort();
                        }, 60000);
                    }

                    if (done) break;

                    buffer += decoder.decode(value, { stream: true });
                    const lines = buffer.split('\n');
                    buffer = lines.pop() || '';

                    for (const line of lines) {
                        if (!line.startsWith('data: ')) continue;
                        const data = line.slice(6);
                        if (data === '[DONE]') continue;

                        try {
                            const parsed = JSON.parse(data);
                            const delta = parsed.choices?.[0]?.delta;

                            const reasoningChunk = delta?.reasoning || delta?.reasoning_content;
                            let chunkToProcess = '';
                            let isReasoning = false;

                            if (reasoningChunk) {
                                fullThinking += reasoningChunk;
                                chunkToProcess = reasoningChunk;
                                isReasoning = true;
                            } else if (delta?.content) {
                                fullContent += delta.content;
                                chunkToProcess = delta.content;
                            }

                            if (chunkToProcess) {
                                emitBuffer += chunkToProcess;

                                const now = Date.now();
                                if (emitBuffer.length > 20 || (now - lastEmitTime > 20)) {
                                    emitAIThinking(sessionId, emitBuffer, stage, options?.candidateTime);

                                    if (options?.progressTracker && typeof options.progressTracker.updateAIThinking === 'function') {
                                        options.progressTracker.updateAIThinking(emitBuffer, stage, options?.candidateTime).catch((err: unknown) => { logger.error('updateAIThinking emission failed', { stage, error: String(err) }); });
                                    }

                                    emitBuffer = '';
                                    lastEmitTime = now;
                                }

                                if ((isReasoning ? fullThinking.length : fullContent.length) % 500 < chunkToProcess.length) {
                                    options?.onToken?.(isReasoning ? fullThinking : fullContent, isReasoning);
                                }
                            }
                        } catch {
                            // Parse errors are non-fatal in streaming
                        }
                    }
                }
            } finally {
                clearTimeout(idleTimeoutId);
            }

            if (emitBuffer) {
                emitAIThinking(sessionId, emitBuffer, stage, options?.candidateTime);
                if (options?.progressTracker && typeof options.progressTracker.updateAIThinking === 'function') {
                    options.progressTracker.updateAIThinking(emitBuffer, stage, options?.candidateTime).catch((err: unknown) => { logger.error('updateAIThinking emission failed', { stage, error: String(err) }); });
                }
            }

            logger.info('Streaming AI complete', {
                sessionId,
                stage,
                thinkingLength: fullThinking.length,
            });

            logAnalysisContainerAction(stage, `Streaming AI Complete - ${configLocal.model}`, {
                promptLength: userPrompt.length,
                thinkingLength: fullThinking.length,
                contentLength: fullContent.length,
                promptPreview: userPrompt.slice(0, 200),
                responsePreview: fullContent.slice(0, 200),
                reasoningPreview: fullThinking.slice(0, 200)
            });

            if (!fullThinking && !fullContent) {
                throw new AIServiceError('Empty response from AI provider');
            }

            const MIN_THINKING_LENGTH = 1500;
            if (fullThinking.length > 0 && fullThinking.length < MIN_THINKING_LENGTH && !fullContent.trim()) {
                logger.warn(`🔱 Suspiciously short AI response (thinking: ${fullThinking.length} chars). Retrying.`, { sessionId, stage });
                throw new AIServiceError(`AI response too short (${fullThinking.length} chars thinking, no content). Likely truncated.`, { thinkingLength: fullThinking.length });
            }

            const thinkMatch = fullContent.match(/<(?:thinking|think|thought)>([\s\S]*?)<\/(?:thinking|think|thought)>/i);
            if (thinkMatch) {
                fullThinking += "\n" + thinkMatch[1];
                fullContent = fullContent.replace(/<(?:thinking|think|thought)>[\s\S]*?<\/(?:thinking|think|thought)>/gi, '').trim();
            }

            if (sessionId && stage) {
                const scoreMatch = fullContent.match(/(?:FINAL SCORE|CONFIDENCE SCORE|SCORE)[:\s]*(\d+)/i);
                const score = scoreMatch ? Math.min(100, Math.max(0, parseInt(scoreMatch[1]))) : undefined;

                const verdictMatch = fullContent.match(/(?:VERDICT|RECOMMENDATION|FINAL)[:\s]*([^\n]+)/i);
                const verdict = verdictMatch ? verdictMatch[1].trim() : undefined;

                thinkingPersistence.saveThinking(
                    sessionId,
                    stage,
                    options?.candidateTime || 'general',
                    fullThinking,
                    {
                        promptTokens: userPrompt.length / 4,
                        responseTokens: (fullThinking.length + fullContent.length) / 4,
                        score,
                        verdict,
                        duration: Date.now() - startTime
                    }
                );
            }

            return {
                success: true,
                thinking: fullThinking,
                content: fullContent,
            };

        } catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));
            logger.warn(`Streaming attempt ${attempt} failed: ${lastError.message}`);

            if (lastError.name === 'AbortError' || lastError.message.includes('aborted')) {
                break;
            }

            if (attempt < AI_CONFIG.retryAttempts) {
                await sleep(AI_CONFIG.retryDelayMs * attempt);
            }
        }
    }

    logger.error('All Streaming AI attempts failed', lastError);
    return {
        success: false,
        content: '',
        error: lastError?.message || 'Streaming failed after retries',
    };
}
