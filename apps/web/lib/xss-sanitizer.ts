/**
 * A basic HTML sanitizer that prevents XSS.
 *
 * @param text The text to sanitize.
 * @returns The sanitized text.
 */
export function sanitizeAIContent(text: string): string {
  if (!text) return '';
  // Basic sanitization: escape HTML tags but preserve markdown characters
  // ReactMarkdown safely handles the rest
  return text
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
