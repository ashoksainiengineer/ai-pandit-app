
import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

const window = new JSDOM('').window;
const purify = DOMPurify(window as any);

/**
 * A powerful HTML sanitizer that uses DOMPurify to prevent XSS.
 * This is the gold standard for XSS protection.
 *
 * @param text The text to sanitize.
 * @returns The sanitized text.
 */
export function sanitizeAIContent(text: string): string {
  if (!text) return '';
  return purify.sanitize(text);
}
