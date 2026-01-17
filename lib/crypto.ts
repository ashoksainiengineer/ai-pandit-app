// lib/crypto.ts
// End-to-End encryption utilities for secure data storage
// Uses AES-256-GCM encryption with key derived from userId + secret

import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';

// Get the encryption secret from environment
const ENCRYPTION_SECRET = process.env.ENCRYPTION_SECRET || 'ai-pandit-default-secret-change-in-production';

/**
 * Derive a unique encryption key for each user
 * Key = scrypt(userId + ENCRYPTION_SECRET)
 */
function deriveKey(userId: string): Buffer {
    return scryptSync(userId + ENCRYPTION_SECRET, 'salt', 32);
}

/**
 * Encrypt data using AES-256-GCM
 * Returns: base64(iv:authTag:encryptedData)
 */
export function encryptData(data: string, userId: string): string {
    const key = deriveKey(userId);
    const iv = randomBytes(16); // Initialization vector

    const cipher = createCipheriv('aes-256-gcm', key, iv);

    let encrypted = cipher.update(data, 'utf8', 'base64');
    encrypted += cipher.final('base64');

    const authTag = cipher.getAuthTag();

    // Format: iv:authTag:encryptedData (all base64)
    return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted}`;
}

/**
 * Decrypt data using AES-256-GCM
 * Input: base64(iv:authTag:encryptedData)
 */
export function decryptData(encryptedString: string, userId: string): string {
    try {
        const key = deriveKey(userId);
        const [ivB64, authTagB64, encryptedData] = encryptedString.split(':');

        if (!ivB64 || !authTagB64 || !encryptedData) {
            throw new Error('Invalid encrypted data format');
        }

        const iv = Buffer.from(ivB64, 'base64');
        const authTag = Buffer.from(authTagB64, 'base64');

        const decipher = createDecipheriv('aes-256-gcm', key, iv);
        decipher.setAuthTag(authTag);

        let decrypted = decipher.update(encryptedData, 'base64', 'utf8');
        decrypted += decipher.final('utf8');

        return decrypted;
    } catch (error) {
        console.error('Decryption failed:', error);
        throw new Error('Failed to decrypt data. Invalid key or corrupted data.');
    }
}

/**
 * Encrypt an object (converts to JSON first)
 */
export function encryptObject<T>(obj: T, userId: string): string {
    return encryptData(JSON.stringify(obj), userId);
}

/**
 * Decrypt to an object (parses JSON after decryption)
 */
export function decryptObject<T>(encryptedString: string, userId: string): T {
    const decrypted = decryptData(encryptedString, userId);
    return JSON.parse(decrypted) as T;
}

/**
 * Check if a string looks like encrypted data
 */
export function isEncrypted(data: string): boolean {
    // Encrypted format: base64:base64:base64
    const parts = data.split(':');
    if (parts.length !== 3) return false;

    try {
        // Check if all parts are valid base64
        parts.forEach(part => Buffer.from(part, 'base64'));
        return true;
    } catch {
        return false;
    }
}

/**
 * Safely encrypt - returns original if encryption fails
 */
export function safeEncrypt(data: string, userId: string): string {
    try {
        return encryptData(data, userId);
    } catch (error) {
        console.error('Encryption failed, returning original:', error);
        return data;
    }
}

/**
 * Safely decrypt - returns original if decryption fails
 */
export function safeDecrypt(data: string, userId: string): string {
    try {
        if (!isEncrypted(data)) {
            return data; // Already plain text
        }
        return decryptData(data, userId);
    } catch (error) {
        console.error('Decryption failed, returning original:', error);
        return data;
    }
}
