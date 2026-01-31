/**
 * BTR Prompts Module
 *
 * Centralized prompt generation for AI analysis in the Birth Time
 * Rectification system. Provides structured prompts for different
 * stages of the BTR process.
 */

export { formatLifeEventForAI } from './life-event-formatter.js';
export { buildForensicContext, buildForensicDNASummary } from './forensic-context.js';
export { getBatchPrompt } from './batch-prompt.js';
export { getDeepAnalysisPrompt } from './deep-analysis-prompt.js';
export { getFinalPrecisionPrompt } from './final-precision-prompt.js';
