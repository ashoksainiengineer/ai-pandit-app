import { logger } from '../../utils/logger.js';

import { config } from '../../config/index.js';
import {
    encryptData as rawEncryptData,
    decryptData as rawDecryptData,
    safeEncrypt as rawSafeEncrypt,
    safeDecrypt as rawSafeDecrypt,
    encryptObject as rawEncryptObject,
    decryptObject as rawDecryptObject,
    isEncrypted,
} from './DANGER_DO_NOT_MODIFY.js';

/**
 * 🔒 Internal Helpers
 * Retrieves the authoritative encryption secrets from the centralized config.
 */
function getEncryptionSecret(): string {
    return config.security.encryptionSecret;
}

function getAllEncryptionSecrets(): string[] {
    // Current security policy: ENCRYPTION_SECRET is the sole source of truth.
    // In future, rotation can be implemented by adding previous secrets to an array.
    return [config.security.encryptionSecret];
}

/**
 * Encrypts with the latest standard (v4 - AES-256-GCM + scrypt + user isolation)
 */
export function encryptData(plaintext: string, userId: string): string {
    return rawEncryptData(plaintext, userId, getEncryptionSecret());
}

/**
 * 🔴 CRITICAL FUNCTION - DO NOT MODIFY 🔴
 * Decrypts data using multi-secret and multi-version fallback.
 */
export function decryptData(encryptedString: string, userId: string): string {
    return rawDecryptData(encryptedString, userId, getAllEncryptionSecrets());
}

/**
 * 🔴 CRITICAL FUNCTION - DO NOT MODIFY 🔴
 */
export function safeEncrypt(plaintext: string, userId: string): string | null {
    return rawSafeEncrypt(plaintext, userId, getEncryptionSecret());
}

/**
 * 🔴 CRITICAL FUNCTION - DO NOT MODIFY 🔴
 */
export function safeDecrypt(encryptedString: string, userId: string): string | null {
    return rawSafeDecrypt(encryptedString, userId, getAllEncryptionSecrets());
}

/**
 * 🟢 RECOVERY HELPER
 * Tries primary key first, then falls back to secondary key.
 */
export function safeDecryptWithFallback(data: string | null | undefined, primaryId: string, secondaryId?: string): string | null {
    if (!data) return null;
    const primary = safeDecrypt(data, primaryId);
    if (primary) return primary;
    if (secondaryId) return safeDecrypt(data, secondaryId);
    return null;
}

/**
 * 🔴 CRITICAL FUNCTION - DO NOT MODIFY 🔴
 */
export function encryptObject<T extends Record<string, unknown>>(obj: T, userId: string): string {
    return rawEncryptObject(obj, userId, getEncryptionSecret());
}

/**
 * 🔴 CRITICAL FUNCTION - DO NOT MODIFY 🔴
 */
export function decryptObject<T extends Record<string, unknown>>(encryptedString: string, userId: string): T {
    return rawDecryptObject(encryptedString, userId, getAllEncryptionSecrets());
}

/**
 * Handles both encrypted and non-encrypted sensitive fields.
 * Tries decryption first, then plain JSON parse, then returns raw string.
 */
export function parseSensitiveField<T = unknown>(
    data: string | null | undefined,
    clerkId: string,
    internalUserId: string,
    defaultValue: T | null = null
): T | string | null {
    if (data == null) return defaultValue;

    try {
        if (isEncrypted(data)) {
            const decrypted = safeDecryptWithFallback(data, clerkId, internalUserId);
            if (decrypted) {
                try {
                    return JSON.parse(decrypted) as T;
                } catch {
                    return decrypted;
                }
            }
            logger.warn('[parseSensitiveField] Decryption failed for encrypted field — returning default', {
                hasClerkId: !!clerkId,
                hasInternalUserId: !!internalUserId,
            });
            return defaultValue;
        }
    } catch {
        // isEncrypted threw — fall through to legacy path
    }

    try {
        const parsed = JSON.parse(data);
        if (typeof parsed === 'object' && parsed !== null) return parsed as T;
        return data;
    } catch {
        return data;
    }
}

export { isEncrypted };
