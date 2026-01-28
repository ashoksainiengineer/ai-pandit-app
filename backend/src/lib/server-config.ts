/**
 * Server Configuration
 * Centralized configuration for AI models and database
 * @deprecated Use backend/src/config/index.ts instead
 */

import { config } from '../config/index.js';

/**
 * @deprecated Use config.ai from backend/src/config/index.ts
 */
export const serverConfig = {
  ai: config.ai,
  database: config.database,
  maxRetries: 3,
  timeout: 30000,
};

/**
 * @deprecated This mock client is no longer used
 */
export const aiClient = {
  messages: {
    create: async (_options: unknown) => {
      return {
        content: [
          { type: 'thinking', thinking: 'Analyzing birth time...' },
          { type: 'text', text: 'Mock analysis response' }
        ]
      };
    }
  }
};
