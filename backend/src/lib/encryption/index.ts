/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️
 *                                                                               
 *                         🛑  DANGER: DO NOT MODIFY  🛑                         
 *                                                                               
 *    THIS IS THE MAIN ENTRY POINT FOR THE ENCRYPTION MODULE. CHANGES HERE       
 *    MAY BREAK ALL ENCRYPTION/DECRYPTION OPERATIONS AND CORRUPT DATA.           
 *                                                                               
 * ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * ENCRYPTION MODULE - MAIN ENTRY POINT
 * Version: 1.0.0-FROZEN
 *
 * Purpose: Central export point for all encryption functionality.
 *
 * ⚠️  WARNING: This module uses ENCRYPTION_SECRET from environment.
 *    The secret must remain constant or ALL encrypted data will be lost.
 *
 * Usage:
 *   import { encryptData, decryptData } from '@/lib/encryption';
 *
 *   const encrypted = encryptData('sensitive data', userId);
 *   const decrypted = decryptData(encrypted, userId);
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { getEncryptionSecret } from './config.js';
import {
    encryptData as rawEncryptData,
    decryptData as rawDecryptData,
    safeEncrypt as rawSafeEncrypt,
    safeDecrypt as rawSafeDecrypt,
    encryptObject as rawEncryptObject,
    decryptObject as rawDecryptObject,
    isEncrypted,
} from './DANGER_DO_NOT_MODIFY.js';

// Re-export types
export * from './types.js';

/**
 * 🔴 CRITICAL FUNCTION - DO NOT MODIFY 🔴
 *
 * Encrypts plaintext data using AES-256-GCM.
 *
 * @param plaintext - Data to encrypt
 * @param userId - User identifier for key derivation
 * @returns Encrypted string in format "iv:authTag:ciphertext"
 * @throws Error if encryption fails
 */
export function encryptData(plaintext: string, userId: string): string {
    // 🔴 DO NOT MODIFY - Uses config secret internally
    return rawEncryptData(plaintext, userId, getEncryptionSecret());
}

/**
 * 🔴 CRITICAL FUNCTION - DO NOT MODIFY 🔴
 *
 * Decrypts data encrypted with encryptData().
 *
 * @param encryptedString - Format: "iv:authTag:ciphertext"
 * @param userId - User identifier for key derivation
 * @returns Decrypted plaintext
 * @throws Error if decryption fails
 */
export function decryptData(encryptedString: string, userId: string): string {
    // 🔴 DO NOT MODIFY - Uses config secret internally
    return rawDecryptData(encryptedString, userId, getEncryptionSecret());
}

/**
 * 🔴 CRITICAL FUNCTION - DO NOT MODIFY 🔴
 *
 * Safely encrypts data, returning null on failure instead of throwing.
 *
 * @param plaintext - Data to encrypt
 * @param userId - User identifier
 * @returns Encrypted string or null
 */
export function safeEncrypt(plaintext: string, userId: string): string | null {
    // 🔴 DO NOT MODIFY - Uses config secret internally
    return rawSafeEncrypt(plaintext, userId, getEncryptionSecret());
}

/**
 * 🔴 CRITICAL FUNCTION - DO NOT MODIFY 🔴
 *
 * Safely decrypts data, returning null on failure instead of throwing.
 *
 * @param encryptedString - Encrypted data
 * @param userId - User identifier
 * @returns Decrypted string or null
 */
export function safeDecrypt(encryptedString: string, userId: string): string | null {
    // 🔴 DO NOT MODIFY - Uses config secret internally
    return rawSafeDecrypt(encryptedString, userId, getEncryptionSecret());
}

/**
 * 🔴 CRITICAL FUNCTION - DO NOT MODIFY 🔴
 *
 * Encrypts a JavaScript object (JSON-serialized then encrypted).
 *
 * @param obj - Object to encrypt
 * @param userId - User identifier
 * @returns Encrypted string
 */
export function encryptObject<T extends Record<string, unknown>>(obj: T, userId: string): string {
    // 🔴 DO NOT MODIFY - Uses config secret internally
    return rawEncryptObject(obj, userId, getEncryptionSecret());
}

/**
 * 🔴 CRITICAL FUNCTION - DO NOT MODIFY 🔴
 *
 * Decrypts to a JavaScript object (decrypts then JSON-parsed).
 *
 * @param encryptedString - Encrypted data
 * @param userId - User identifier
 * @returns Decrypted object
 */
export function decryptObject<T extends Record<string, unknown>>(encryptedString: string, userId: string): T {
    // 🔴 DO NOT MODIFY - Uses config secret internally
    return rawDecryptObject(encryptedString, userId, getEncryptionSecret());
}

/**
 * 🔴 CRITICAL FUNCTION - DO NOT MODIFY 🔴
 *
 * Checks if a string appears to be encrypted data.
 *
 * @param data - String to check
 * @returns true if data appears to be encrypted
 */
export { isEncrypted };

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️
 *
 *                        END OF ENCRYPTION MODULE
 *
 * ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️
 * ═══════════════════════════════════════════════════════════════════════════════
 */
