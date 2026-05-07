/**
 * BTR Prompts Module
 *
 * Centralized prompt generation for AI analysis in the Birth Time
 * Rectification system. Provides structured prompts for different
 * stages of the BTR process.
 */

export { formatLifeEventForAI } from './life-event-formatter.js';

export { getBatchPrompt } from './batch-prompt.js';
export { getDeepAnalysisPrompt } from './deep-analysis-prompt.js';
export { getFinalPrecisionPrompt } from './final-precision-prompt.js';

// Legacy exports for backward compatibility
export { formatLifeEventForAI as _formatLifeEventForAI } from './life-event-formatter.js';
export { getBatchPrompt as _getBatchPrompt } from './batch-prompt.js';
export { getDeepAnalysisPrompt as _getDeepAnalysisPrompt } from './deep-analysis-prompt.js';
export { getFinalPrecisionPrompt as _getFinalPrecisionPrompt } from './final-precision-prompt.js';
