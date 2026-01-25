"use strict";
// lib/server-config.ts
// Server configuration for AI models and database
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiClient = exports.serverConfig = void 0;
exports.serverConfig = {
    // AI Configuration
    ai: {
        baseUrl: process.env.AI_BASE_URL || 'https://openrouter.ai/api/v1',
        apiKey: process.env.AI_API_KEY || '',
        model: process.env.AI_MODEL || 'deepseek/deepseek-v3.2',
        maxTokens: parseInt(process.env.AI_MAX_TOKENS || '32000'),
        temperature: parseFloat(process.env.AI_TEMPERATURE || '0.1'),
        thinkingBudget: parseInt(process.env.AI_THINKING_BUDGET || '32000'),
    },
    // Database
    database: {
        url: process.env.DATABASE_URL || 'file:./dev.db',
        authToken: process.env.DATABASE_AUTH_TOKEN,
    },
    // Other settings
    maxRetries: 3,
    timeout: 30000,
};
// Database client - will be imported from drizzle
// AI client (simplified for now)
exports.aiClient = {
    messages: {
        create: async (options) => {
            // This would be the actual AI API call
            // For now, return a mock response
            return {
                content: [
                    { type: 'thinking', thinking: 'Analyzing birth time...' },
                    { type: 'text', text: 'Mock analysis response' }
                ]
            };
        }
    }
};
//# sourceMappingURL=server-config.js.map