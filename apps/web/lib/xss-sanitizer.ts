/**
 * A basic HTML sanitizer that prevents XSS.
 *
 * @param text The text to sanitize.
 * @returns The sanitized text.
 */
export function sanitizeAIContent(text: string): string {
  if (!text) return '';

  // 🔱 INDUSTRY PATTERN: Protect <think> tags from escaping (DeepSeek/R1 pattern)
  const placeholders: string[] = [];
  const protectedText = text.replace(/<\/?think>/gi, (match) => {
    placeholders.push(match);
    return `__THINK_TOKEN_${placeholders.length - 1}__`;
  });

  const escaped = protectedText
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  return escaped.replace(/__THINK_TOKEN_(\d+)__/g, (_, index) => placeholders[parseInt(index)]);
}
