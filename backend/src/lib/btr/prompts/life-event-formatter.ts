/**
 * Life Event Formatter for AI Prompts
 *
 * Securely formats user life events for AI analysis, ensuring no PII is leaked.
 */

import { LifeEvent } from '../../../types/index.js';
import { logger } from '../../logger.js';

/**
 * A simple regex-based PII sanitizer. It redacts potential names, emails, 
 * phone numbers, and other numerical IDs from a text string.
 * @param text The string to sanitize.
 * @returns A sanitized string with PII replaced by markers like [REDACTED].
 */
const sanitizeNarration = (text: string): string => {
  if (!text) return '';

  let sanitizedText = text;

  // Redact potential proper nouns (capitalized words not at the start of a sentence)
  // This is a heuristic and might have false positives, but is safer than not redacting.
  sanitizedText = sanitizedText.replace(/\b([A-Z][a-z]+)\b/g, (match, p1, offset) => {
    if (offset === 0 || sanitizedText.charAt(offset - 2) === '.') {
      return match; // Keep words at the start of a sentence.
    }
    return '[REDACTED_NAME]';
  });

  // Redact email addresses
  sanitizedText = sanitizedText.replace(/\S+@\S+\.\S+/g, '[REDACTED_EMAIL]');

  // Redact phone numbers
  sanitizedText = sanitizedText.replace(/\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/g, '[REDACTED_PHONE]');
  
  // Redact long numbers (could be IDs, etc.)
  sanitizedText = sanitizedText.replace(/\b\d{5,}\b/g, '[REDACTED_ID]');

  return sanitizedText;
};


/**
 * Formats a life event for inclusion in AI prompts in a secure way.
 * It preserves the event's context while sanitizing the narrative to remove PII.
 *
 * @param event - The life event to format.
 * @returns Formatted, PII-sanitized string for the AI prompt.
 */
export function formatLifeEventForAI(event: LifeEvent): string {
  const { eventType, eventDate, datePrecision, description, importance } = event;
  let timeStr = eventDate;
  let nuance = '';

  switch (datePrecision) {
    case 'exact_date_time':
      if (event.eventTime) {
        timeStr = `${eventDate} at ${event.eventTime}`;
        nuance = '(Exact Time)';
      }
      break;
    case 'month_year':
      timeStr = eventDate.split('-').slice(0, 2).join('-');
      nuance = '(Month-Level)';
      break;
    case 'year_range':
      const yearStart = eventDate.split('-')[0];
      timeStr = yearStart;
      nuance = '(Year-Level)';
      break;
    case 'exact_date':
      nuance = '(Exact Date)';
      break;
  }

  const eventImportance = importance || 'medium';
  let result = `• [${eventImportance.toUpperCase()} IMPORTANCE] ${eventType}\n  Date: ${timeStr} ${nuance}`;
  
  // CRITICAL SECURITY STEP: Sanitize the free-text description before adding it to the AI prompt.
  if (description) {
    const sanitizedDescription = sanitizeNarration(description);
    result += `\n  SITUATIONAL NARRATIVE & EXPERIENCE: "${sanitizedDescription}"`;
  }
  
  return result;
}
