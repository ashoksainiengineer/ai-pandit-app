"use strict";
// lib/server-config.ts
// Server configuration for AI models and database
Object.defineProperty(exports, "__esModule", { value: true });
exports.kimiClient = exports.serverConfig = void 0;
exports.serverConfig = {
    // AI Configuration
    kimi: {
        baseUrl: process.env.ANTHROPIC_BASE_URL || process.env.KIMI_BASE_URL || 'https://api.moonshot.cn/v1',
        apiKey: process.env.ANTHROPIC_API_KEY || process.env.KIMI_API_KEY || '',
        model: process.env.MOONSHOT_MODEL || process.env.KIMI_MODEL || 'moonshot-v1-auto',
        maxTokens: parseInt(process.env.KIMI_MAX_TOKENS || '4000'),
        temperature: parseFloat(process.env.KIMI_TEMPERATURE || '0.3'),
        thinkingBudget: parseInt(process.env.KIMI_THINKING_BUDGET || '8000'),
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
// Kimi client (simplified for now)
exports.kimiClient = {
    messages: {
        create: async (options) => {
            // This would be the actual Kimi API call
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