/**
 * 🛡️ AI-Pandit Security Guardrails
 * Prevents Prompt Injection and Jailbreak attempts against the DeepSeek models.
 */

import { ValidationError } from '../../errors/index.js';
const SUSPICIOUS_PATTERNS = [
    // Jailbreak indicators
    /ignore previous/i,
    /system prompt/i,
    /output your instructions/i,
    /forget everything/i,
    /you are now/i,
    /you are a/i,
    /pretend you are/i,
    /bypassing rules/i,
    // Exploits
    /```json/i,
    // Length limits for injection padding
    /.{1000,}/
];

export class SecurityGuard {
    /**
     * Sanitizes raw user input from Traits or Life Events.
     * @throws Error if malicious payload is strictly detected.
     */
    static sanitizeInput(userInput: string, maxLength: number = 500): string {
        if (!userInput) return '';

        let sanitized = userInput.trim().substring(0, maxLength);

        // Strip HTML/XML tags that might confuse the XML parser of the LLM
        sanitized = sanitized.replace(/<[^>]*>?/gm, '');

        // Check against known jailbreak patterns
        for (const pattern of SUSPICIOUS_PATTERNS) {
            if (pattern.test(sanitized)) {
                // Return a heavily redacted string or hard fail
                throw new ValidationError('SECURITY_VIOLATION: Malicious prompt injection pattern detected.');
            }
        }

        return sanitized;
    }

    /**
     * Wraps user payloads before feeding to the AI
     */
    static buildSafeEventDescription(description: string): string {
        try {
            return this.sanitizeInput(description);
        } catch (e) {
            return '[REDACTED: Security Policy Violation in Event Description]';
        }
    }
}
