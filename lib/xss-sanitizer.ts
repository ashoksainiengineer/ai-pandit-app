/**
 * A basic HTML sanitizer that prevents XSS.
 *
 * @param text The text to sanitize.
 * @returns The sanitized text.
 */
export function sanitizeAIContent(text: string): string {
  if (!text) return '';
  // Basic sanitization: escape HTML special characters
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
