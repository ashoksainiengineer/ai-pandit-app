/**
 * 🔱 AI CONFIG TESTS
 * Tests AI configuration exports and deterministic mock helpers.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../config/index.js', () => ({
    config: {
        ai: {
            baseUrl: 'https://api.test.com',
            apiKey: 'test-api-key',
            model: 'test-model-v1',
            maxTokens: 4096,
            temperature: 0.7,
            retryAttempts: 3,
            retryDelayMs: 1000,
            timeoutMs: 30000,
        },
        app: {
            isTest: true,
        },
    },
}));

import {
    AI_CONFIG,
    USE_DETERMINISTIC_AI_MOCK_IN_TESTS,
    isFetchMockedByTestRunner,
    buildDeterministicMockAIResponse,
} from '../ai-config.js';

describe('ai-config', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        delete (globalThis as any).fetch;
    });

    describe('AI_CONFIG', () => {
        it('should expose all AI config fields from config', () => {
            expect(AI_CONFIG.baseUrl).toBe('https://api.test.com');
            expect(AI_CONFIG.apiKey).toBe('test-api-key');
            expect(AI_CONFIG.model).toBe('test-model-v1');
            expect(AI_CONFIG.maxTokens).toBe(4096);
            expect(AI_CONFIG.temperature).toBe(0.7);
            expect(AI_CONFIG.retryAttempts).toBe(3);
            expect(AI_CONFIG.retryDelayMs).toBe(1000);
            expect(AI_CONFIG.timeoutMs).toBe(30000);
        });
    });

    describe('USE_DETERMINISTIC_AI_MOCK_IN_TESTS', () => {
        it('should be true when in test mode and ALLOW_REAL_AI_IN_TESTS is not set', () => {
            expect(USE_DETERMINISTIC_AI_MOCK_IN_TESTS).toBe(true);
        });
    });

    describe('isFetchMockedByTestRunner', () => {
        it('should return false when fetch is not defined', () => {
            delete (globalThis as any).fetch;
            expect(isFetchMockedByTestRunner()).toBe(false);
        });

        it('should return false when fetch is a plain function', () => {
            globalThis.fetch = function plainFetch() {} as any;
            expect(isFetchMockedByTestRunner()).toBe(false);
        });

        it('should return true when fetch has getMockName', () => {
            const mockFetch = vi.fn() as any;
            mockFetch.getMockName = vi.fn(() => 'fetch');
            globalThis.fetch = mockFetch;
            expect(isFetchMockedByTestRunner()).toBe(true);
        });

        it('should return true when fetch has mock property', () => {
            const mockFetch = function mockFetchFn() {} as any;
            mockFetch.mock = { calls: [] };
            globalThis.fetch = mockFetch;
            expect(isFetchMockedByTestRunner()).toBe(true);
        });
    });

    describe('buildDeterministicMockAIResponse', () => {
        it('should return success response with thinking preview', () => {
            const prompt = 'Analyze the dasha periods for this birth chart';
            const result = buildDeterministicMockAIResponse(prompt);

            expect(result.success).toBe(true);
            expect(result.content).toBe('MOCK_RESULT: deterministic AI output for test mode');
            expect(result.thinking).toContain('MOCK_THINKING');
            expect(result.thinking).toContain(prompt.slice(0, 120));
        });

        it('should calculate tokensUsed based on prompt length', () => {
            const shortPrompt = 'hi';
            const result = buildDeterministicMockAIResponse(shortPrompt);

            expect(result.tokensUsed).toBe(Math.ceil(shortPrompt.length / 4));
        });

        it('should normalize whitespace in thinking preview', () => {
            const prompt = 'Line 1\n\n  Line   2\t\tLine 3';
            const result = buildDeterministicMockAIResponse(prompt);

            expect(result.thinking).not.toContain('\n\n');
            expect(result.thinking).not.toContain('\t');
        });

        it('should truncate long prompts in thinking to 120 chars', () => {
            const longPrompt = 'a'.repeat(500);
            const result = buildDeterministicMockAIResponse(longPrompt);

            const previewMatch = result.thinking.match(/for prompt "(.+)"/);
            expect(previewMatch).toBeTruthy();
            expect(previewMatch![1].length).toBeLessThanOrEqual(120);
        });
    });
});
