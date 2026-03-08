import { describe, it, expect, vi, beforeEach } from 'vitest';
import { callAI } from '../ai-client.js';

// ═══════════════════════════════════════════════════════════════════════════
// PHASE L: AI RESILIENCE — ai-resilience.test.ts
// ═══════════════════════════════════════════════════════════════════════════

// Mock fetch for global AI calls
global.fetch = vi.fn();

describe('🧠 Phase L: AI Transformation & Resilience — AI Client Recovery', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers();
        process.env.AI_API_KEY = 'test-key';
    });

    it('should handle AI provider 429 (Rate Limit) with retry logic', async () => {
        // Mock fetch to fail once with 429, then succeed
        vi.mocked(fetch)
            .mockResolvedValueOnce({
                ok: false,
                status: 429,
                statusText: 'Too Many Requests',
                json: async () => ({ error: { message: 'Rate limit exceeded' } })
            } as any)
            .mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => ({
                    choices: [{ message: { content: 'Recovered response' }, finish_reason: 'stop' }],
                    usage: { total_tokens: 100 }
                })
            } as any);

        const callPromise = callAI('System Prompt', 'User Prompt');

        // Fast-forward through the 30s sleep
        await vi.advanceTimersByTimeAsync(35000);

        const response = await callPromise;

        expect(response.success).toBe(true);
        expect(response.content).toBe('Recovered response');
        expect(fetch).toHaveBeenCalledTimes(2);
    });

    it('should handle malformed JSON from AI provider gracefully', async () => {
        vi.mocked(fetch).mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => {
                throw new Error('Unexpected token { in JSON at position 5');
            }
        } as any);

        const callPromise = callAI('System Prompt', 'User Prompt');

        // Advance for any retry delays
        await vi.runAllTimersAsync();

        const response = await callPromise;

        expect(response.success).toBe(false);
        expect(response.error).toContain('JSON');
    });

    it('should handle AI provider 500 (Server Error) by exhausting retries', async () => {
        vi.mocked(fetch).mockResolvedValue({
            ok: false,
            status: 500,
            statusText: 'Internal Server Error',
            json: async () => ({ error: 'Critical failure' })
        } as any);

        const callPromise = callAI('System Prompt', 'User Prompt');

        // Advance for retry delays
        await vi.runAllTimersAsync();

        const response = await callPromise;

        expect(response.success).toBe(false);
        expect(fetch).toHaveBeenCalledTimes(3);
    });
});
