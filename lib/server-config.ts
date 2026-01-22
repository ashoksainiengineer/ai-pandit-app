// lib/server-config.ts
// Server configuration for AI models and database

import { Client } from '@libsql/client';

export const serverConfig = {
  // AI Configuration
  ai: {
    baseUrl: process.env.AI_BASE_URL || process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com',
    apiKey: process.env.AI_API_KEY || process.env.DEEPSEEK_API_KEY || '',
    model: process.env.AI_MODEL || process.env.DEEPSEEK_MODEL || 'deepseek-reasoner',
    maxTokens: parseInt(process.env.AI_MAX_TOKENS || '32000'),
    temperature: parseFloat(process.env.AI_TEMPERATURE || '0.1'),
    thinkingBudget: parseInt(process.env.AI_THINKING_BUDGET || '32000'),
  },
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
export const aiClient = {
  messages: {
    create: async (options: any) => {
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