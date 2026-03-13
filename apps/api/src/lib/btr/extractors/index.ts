/**
 * BTR Extractors Module
 *
 * Functions for extracting structured data from AI responses
 * in the Birth Time Rectification system.
 */

export {
  extractBatchSurvivors,
  extractFinalVerdict,
} from './ai-response-extractors.js';

// Legacy exports for backward compatibility
export { extractBatchSurvivors as _extractBatchSurvivors } from './ai-response-extractors.js';
export { extractFinalVerdict as _extractFinalVerdict } from './ai-response-extractors.js';
