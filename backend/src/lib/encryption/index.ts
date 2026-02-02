import { getEncryptionSecret, getAllEncryptionSecrets } from './config.js';
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

export { isEncrypted };
