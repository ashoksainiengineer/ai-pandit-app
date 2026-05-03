import { describe, it, expect, vi, beforeEach } from 'vitest';
import { callAI, _callAIWithStream } from '../ai-client.js';
import { buildCandidateAnalysisPrompt } from '../prompts/context-builder.js';
import * as sessionEvents from '../session-events.js';

// ═══════════════════════════════════════════════════════════════════════════
// MOCKS
// ═══════════════════════════════════════════════════════════════════════════

vi.mock('../session-events.js', () => ({
    emitAIThinking: vi.fn(),
}));

vi.mock('../logger.js', () => ({
    logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('Chapter 3: AI Intelligence (Integration & Mocks)', () => {

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Prompt Engineering', () => {
        it('should correctly format candidate analysis prompt', () => {
            const prompt = buildCandidateAnalysisPrompt(
                '12:00:00',
                '1990-01-01',
                'Sun in Aries...',
                'H1: Aries...',
                [{ category: 'marriage', eventType: 'Marriage', eventDate: '2020-01-01', description: 'Happy day', importance: 'high' }],
                'Dasha: Sun-Moon'
            );

            expect(prompt).toContain('CANDIDATE BIRTH TIME: 12:00:00');
            expect(prompt).toContain('MARRIAGE');
            expect(prompt).toContain('Dasha: Sun-Moon');
        });
    });

    describe('Standard AI Call (callAI)', () => {
        it('should return success and parsed content on 200 OK', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    choices: [{
                        message: {
                            content: '<thinking>Thought process</thinking>Final answer',
                        },
                        finish_reason: 'stop'
                    }],
                    usage: { total_tokens: 100 }
                })
            });

            const result = await callAI('System', 'User');

            expect(result.success).toBe(true);
            expect(result.content).toBe('Final answer');
            expect(result.thinking).toBe('Thought process');
            expect(result.tokensUsed).toBe(100);
        });

        it('should handle native reasoning_content from DeepSeek', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    choices: [{
                        message: {
                            content: 'Final answer',
                            reasoning_content: 'Deep thought'
                        }
                    }]
                })
            });

            const result = await callAI('System', 'User');
            expect(result.thinking).toBe('Deep thought');
            expect(result.content).toBe('Final answer');
        });

        it('should retry on 429 Rate Limit Errors', async () => {
            // First two fail with 429, third succeeds
            mockFetch
                .mockResolvedValueOnce({ ok: false, status: 429, text: async () => 'Rate limit' })
                .mockResolvedValueOnce({ ok: false, status: 429, text: async () => 'Rate limit' })
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({ choices: [{ message: { content: 'Success after retry' } }] })
                });

            // Need to speed up time to not wait for sleep()
            vi.useFakeTimers();
            const promise = callAI('System', 'User');

            // Advance timers for 2 retries
            await vi.runAllTimersAsync();

            const result = await promise;
            expect(result.success).toBe(true);
            expect(result.content).toBe('Success after retry');
            expect(mockFetch).toHaveBeenCalledTimes(3);
            vi.useRealTimers();
        });
    });

    describe('Streaming AI Call (callAIWithStream)', () => {
        it('should emit thinking tokens via sessionEvents', async () => {
            // Mock readable stream for response body
            const encoder = new TextEncoder();
            const stream = new ReadableStream({
                start(controller) {
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ choices: [{ delta: { reasoning: 'Thinking...' } }] })}\n`));
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ choices: [{ delta: { content: 'Final answer' } }] })}\n`));
                    controller.enqueue(encoder.encode('data: [DONE]\n'));
                    controller.close();
                }
            });

            mockFetch.mockResolvedValueOnce({
                ok: true,
                body: { getReader: () => stream.getReader() }
            });

            const result = await _callAIWithStream('session-1', 2, 'System', 'User');

            expect(result.success).toBe(true);
            expect(result.thinking).toBe('Thinking...');
            expect(result.content).toBe('Final answer');

            // Should have called emitAIThinking
            expect(sessionEvents.emitAIThinking).toHaveBeenCalled();
        });

        it('should handle timeout and abort signals', async () => {
            mockFetch.mockImplementationOnce(() => new Promise((_, reject) => {
                const error = new Error('The operation was aborted');
                error.name = 'AbortError';
                setTimeout(() => reject(error), 10);
            }));

            vi.useFakeTimers();
            const controller = new AbortController();
            const promise = _callAIWithStream('session-timeout', 2, 'System', 'User', {
                abortSignal: controller.signal
            });

            // Trigger abort
            controller.abort();
            await vi.runAllTimersAsync();

            const result = await promise;
            expect(result.success).toBe(false);
            expect(result.error).toContain('aborted');
            vi.useRealTimers();
        });
    });
});
