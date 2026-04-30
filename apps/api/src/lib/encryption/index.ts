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
 * 🔴 CRITICAL FUNCTION - DO NOT MODIFY 🔴
 * Encrypts data with the latest version (v2).
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
 * 🟢 GOD-TIER ROBUST DECRYPTION HELPER
 * Handles both encrypted and non-encrypted fields, and safely parses JSON.
 */
export function parseSensitiveField<T = unknown>(data: string | null | undefined, clerkId: string, internalUserId: string, defaultValue: T | null = null): T | string | null {
    if (!data) return defaultValue;

    try {
        // 1. Try Decrypting (if it looks encrypted)
        if (isEncrypted(data)) {
            const decrypted = safeDecryptWithFallback(data, clerkId, internalUserId);
            if (decrypted) {
                try {
                    // If it can be parsed as JSON, do it
                    return JSON.parse(decrypted);
                } catch (e) {
                    // Otherwise it's probably a plain string (like name)
                    return decrypted;
                }
            }
        }
    } catch (e) {
        // Fallback to legacy path
    }

    // 2. Try Plain JSON Parse (Legacy or unencrypted)
    try {
        const parsed = JSON.parse(data);
        // If it's a number/boolean/null, JSON.parse might be too aggressive
        if (typeof parsed === 'object' && parsed !== null) return parsed;
        return data;
    } catch (e) {
        // 3. Return raw string if JSON parse fails
        return data || defaultValue;
    }
}

export { isEncrypted };
