/**
 * lib/xss-sanitizer.ts
 * XSS Sanitization utility for rendering AI-generated content safely
 * Implements defense-in-depth against XSS attacks
 */

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface SanitizeOptions {
    allowedTags?: string[];
    allowedAttributes?: Record<string, string[]>;
    stripTags?: boolean;
    encodeEntities?: boolean;
}

interface SanitizeResult {
    sanitized: string;
    wasModified: boolean;
    removedTags: string[];
}

// ═══════════════════════════════════════════════════════════════════════════════
// DEFAULT CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

const DEFAULT_ALLOWED_TAGS = [
    'p', 'br', 'strong', 'em', 'u', 'code', 'pre',
    'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'blockquote',
    'div', 'span',
];

const DEFAULT_ALLOWED_ATTRIBUTES: Record<string, string[]> = {
    '*': ['class'],
    'a': ['href', 'title', 'rel'],
    'img': ['src', 'alt', 'title'],
};

// ═══════════════════════════════════════════════════════════════════════════════
// DANGEROUS PATTERNS
// ═══════════════════════════════════════════════════════════════════════════════

const DANGEROUS_PATTERNS = [
    // Script tags and variants
    /<script[^>]*>[\s\S]*?<\/script>/gi,
    /<script[^>]*\/>/gi,
    /<script[^>]*>/gi,

    // Event handlers
    /\s*on\w+\s*=\s*["'][^"']*["']/gi,
    /\s*on\w+\s*=\s*[^\s>]+/gi,

    // javascript: and data: URLs
    /javascript:/gi,
    /data:text\/html/gi,
    /data:image\/svg[^,]*/gi,

    // VBScript (IE)
    /vbscript:/gi,

    // Expression (IE CSS)
    /expression\s*\(/gi,

    // Style with behavior (IE)
    /behavior\s*:/gi,

    // SVG scripts
    /<svg[^>]*>[\s\S]*?<script[\s\S]*?<\/script>[\s\S]*?<\/svg>/gi,

    // XML external entities
    /<!ENTITY\s+[^>]*SYSTEM/gi,
    /<!ENTITY\s+[^>]*PUBLIC/gi,

    // HTML entities that could execute
    /&#[xX]?0{0,8}[0-9a-fA-F]{1,8};/gi,
];

// ═══════════════════════════════════════════════════════════════════════════════
// HTML ENTITY ENCODING
// ═══════════════════════════════════════════════════════════════════════════════

const HTML_ENTITIES: Record<string, string> = {
    '&': '&',
    '<': '<',
    '>': '>',
    '"': '"',
    "'": '&#x27;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;',
};

function encodeHtmlEntities(text: string): string {
    return text.replace(/[&<>"'`=/]/g, (char) => HTML_ENTITIES[char] || char);
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAG STRIPPING
// ═══════════════════════════════════════════════════════════════════════════════

function stripHtmlTags(text: string): string {
    return text.replace(/<[^>]+>/g, '');
}

// ═══════════════════════════════════════════════════════════════════════════════
// ATTRIBUTE VALIDATION
// ═══════════════════════════════════════════════════════════════════════════════

const DANGEROUS_URL_SCHEMES = new Set([
    'javascript:', 'vbscript:', 'data:', 'file:', 'about:', 'blob:',
]);

function isSafeUrl(url: string): boolean {
    const normalized = url.trim().toLowerCase();

    for (const scheme of DANGEROUS_URL_SCHEMES) {
        if (normalized.startsWith(scheme)) {
            return false;
        }
    }

    // Check for HTML entities that decode to dangerous URLs
    if (normalized.includes('&#') || normalized.includes('&#')) {
        return false;
    }

    return true;
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN SANITIZATION FUNCTION
// ═══════════════════════════════════════════════════════════════════════════════

export function sanitizeHtml(
    input: string,
    options: SanitizeOptions = {}
): SanitizeResult {
    const {
        allowedTags = [],
        allowedAttributes = {},
        stripTags = true,
        encodeEntities = true,
    } = options;

    let sanitized = input;
    const removedTags: string[] = [];
    let wasModified = false;

    // Phase 1: Remove dangerous patterns
    for (const pattern of DANGEROUS_PATTERNS) {
        const matches = sanitized.match(pattern);
        if (matches) {
            removedTags.push(...matches);
            sanitized = sanitized.replace(pattern, '');
            wasModified = true;
        }
    }

    // Phase 2: If stripTags is true, remove all HTML
    if (stripTags) {
        const beforeStrip = sanitized;
        sanitized = stripHtmlTags(sanitized);
        if (beforeStrip !== sanitized) {
            wasModified = true;
        }
    } else {
        // Phase 3: Selective tag cleaning
        const tagRegex = /<\/?([a-zA-Z][a-zA-Z0-9]*)[^>]*>/g;
        sanitized = sanitized.replace(tagRegex, (match, tagName) => {
            const lowerTagName = tagName.toLowerCase();

            if (!allowedTags.includes(lowerTagName)) {
                removedTags.push(match);
                wasModified = true;
                return '';
            }

            // Clean attributes
            const attrRegex = /\s+([a-zA-Z-:]+)\s*=\s*(["'][^"']*["']|[^\s>]+)/g;
            let cleanedTag = `<${match.startsWith('</') ? '/' : ''}${lowerTagName}`;
            let attrMatch;

            const tagAllowedAttrs = [
                ...(allowedAttributes['*'] || []),
                ...(allowedAttributes[lowerTagName] || []),
            ];

            while ((attrMatch = attrRegex.exec(match)) !== null) {
                const attrName = attrMatch[1].toLowerCase();
                let attrValue = attrMatch[2].replace(/^["']|["']$/g, '');

                if (!tagAllowedAttrs.includes(attrName)) {
                    wasModified = true;
                    continue;
                }

                // Validate URL attributes
                if (['href', 'src', 'action', 'cite'].includes(attrName)) {
                    if (!isSafeUrl(attrValue)) {
                        wasModified = true;
                        continue;
                    }
                    // Add rel="noopener noreferrer" for external links
                    if (lowerTagName === 'a' && attrName === 'href') {
                        cleanedTag += ` rel="noopener noreferrer"`;
                    }
                }

                cleanedTag += ` ${attrName}="${encodeHtmlEntities(attrValue)}"`;
            }

            cleanedTag += match.endsWith('/>') ? ' />' : '>';
            return cleanedTag;
        });
    }

    // Phase 4: Encode HTML entities
    if (encodeEntities) {
        sanitized = encodeHtmlEntities(sanitized);
    }

    // Phase 5: Remove null bytes and control characters
    sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

    return {
        sanitized,
        wasModified,
        removedTags: [...new Set(removedTags)], // Deduplicate
    };
}

// ═══════════════════════════════════════════════════════════════════════════════
// PLAIN TEXT SANITIZATION
// ═══════════════════════════════════════════════════════════════════════════════

export function sanitizePlainText(input: string): string {
    if (!input) return '';

    return input
        // Remove HTML tags
        .replace(/<[^>]+>/g, '')
        // Encode HTML entities
        .replace(/&/g, '&')
        .replace(/</g, '<')
        .replace(/>/g, '>')
        // Remove control characters except newlines and tabs
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
        // Normalize whitespace
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
        // Trim
        .trim();
}

// ═══════════════════════════════════════════════════════════════════════════════
// AI CONTENT SANITIZATION (Optimized for AI-generated text)
// ═══════════════════════════════════════════════════════════════════════════════

export function sanitizeAIContent(input: string): string {
    if (!input) return '';

    return input
        // Remove thinking tags
        .replace(/<\/?thought>/gi, '')
        .replace(/<\/?think>/gi, '')
        .replace(/<\/?reasoning>/gi, '')
        .replace(/<\/?analysis>/gi, '')
        // Remove stage markers
        .replace(/\[STAGE \w+\]/gi, '')
        .replace(/═+[\r\n]*🎯 SWITCHING TO:[\s\S]*?═+[\r\n]*/g, '')
        .replace(/--- LEVEL \d: [\s\S]*? ---\n/g, '')
        // Remove null bytes
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
        .replace(/\u200B/g, '')
        .replace(/\uFEFF/g, '')
        // Normalize line endings
        .replace(/(\r\n|\r)/g, '\n')
        .replace(/\n{4,}/g, '\n\n\n')
        // Remove trailing whitespace
        .replace(/[ \t]+$/gm, '')
        // Limit indentation
        .replace(/^[ \t]+/gm, (match) => match.length > 8 ? '  ' : match)
        // Sanitize any remaining HTML
        .replace(/</g, '<')
        .replace(/>/g, '>')
        .trim();
}

// ═══════════════════════════════════════════════════════════════════════════════
// SAFE HTML RENDERING
// ═══════════════════════════════════════════════════════════════════════════════

export function renderSafeHtml(input: string): { __html: string } {
    const { sanitized } = sanitizeHtml(input, {
        allowedTags: DEFAULT_ALLOWED_TAGS,
        allowedAttributes: DEFAULT_ALLOWED_ATTRIBUTES,
        stripTags: false,
        encodeEntities: false, // We want to render HTML
    });

    return { __html: sanitized };
}

// ═══════════════════════════════════════════════════════════════════════════════
// VALIDATION FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

export function containsXss(input: string): boolean {
    for (const pattern of DANGEROUS_PATTERNS) {
        if (pattern.test(input)) {
            return true;
        }
    }
    return false;
}

export function validateInput(input: string): {
    isValid: boolean;
    issues: string[];
} {
    const issues: string[] = [];

    if (containsXss(input)) {
        issues.push('Potential XSS content detected');
    }

    if (input.length > 100000) {
        issues.push('Input exceeds maximum length');
    }

    if (/[\x00-\x08\x0C\x0E-\x1F]/.test(input)) {
        issues.push('Control characters detected');
    }

    return {
        isValid: issues.length === 0,
        issues,
    };
}

// ═══════════════════════════════════════════════════════════════════════════════
// REACT HOOK
// ═══════════════════════════════════════════════════════════════════════════════

import { useMemo } from 'react';

export function useSanitizedContent(
    content: string,
    options?: SanitizeOptions
): { sanitized: string; isSafe: boolean } {
    return useMemo(() => {
        const result = sanitizeHtml(content, options);
        return {
            sanitized: result.sanitized,
            isSafe: !result.wasModified,
        };
    }, [content, options]);
}

// ═══════════════════════════════════════════════════════════════════════════════
// DEFAULT EXPORT
// ═══════════════════════════════════════════════════════════════════════════════

export default {
    sanitizeHtml,
    sanitizePlainText,
    sanitizeAIContent,
    renderSafeHtml,
    containsXss,
    validateInput,
};
