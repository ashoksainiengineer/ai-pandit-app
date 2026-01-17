"use strict";
// lib/crypto.ts
// End-to-End encryption utilities for secure data storage
// Uses AES-256-GCM encryption with key derived from userId + secret
Object.defineProperty(exports, "__esModule", { value: true });
exports.encryptData = encryptData;
exports.decryptData = decryptData;
exports.encryptObject = encryptObject;
exports.decryptObject = decryptObject;
exports.isEncrypted = isEncrypted;
exports.safeEncrypt = safeEncrypt;
exports.safeDecrypt = safeDecrypt;
const crypto_1 = require("crypto");
// Get the encryption secret from environment
const ENCRYPTION_SECRET = process.env.ENCRYPTION_SECRET || 'ai-pandit-default-secret-change-in-production';
/**
 * Derive a unique encryption key for each user
 * Key = scrypt(userId + ENCRYPTION_SECRET)
 */
function deriveKey(userId) {
    return (0, crypto_1.scryptSync)(userId + ENCRYPTION_SECRET, 'salt', 32);
}
/**
 * Encrypt data using AES-256-GCM
 * Returns: base64(iv:authTag:encryptedData)
 */
function encryptData(data, userId) {
    const key = deriveKey(userId);
    const iv = (0, crypto_1.randomBytes)(16); // Initialization vector
    const cipher = (0, crypto_1.createCipheriv)('aes-256-gcm', key, iv);
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
function decryptData(encryptedString, userId) {
    try {
        const key = deriveKey(userId);
        const [ivB64, authTagB64, encryptedData] = encryptedString.split(':');
        if (!ivB64 || !authTagB64 || !encryptedData) {
            throw new Error('Invalid encrypted data format');
        }
        const iv = Buffer.from(ivB64, 'base64');
        const authTag = Buffer.from(authTagB64, 'base64');
        const decipher = (0, crypto_1.createDecipheriv)('aes-256-gcm', key, iv);
        decipher.setAuthTag(authTag);
        let decrypted = decipher.update(encryptedData, 'base64', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }
    catch (error) {
        console.error('Decryption failed:', error);
        throw new Error('Failed to decrypt data. Invalid key or corrupted data.');
    }
}
/**
 * Encrypt an object (converts to JSON first)
 */
function encryptObject(obj, userId) {
    return encryptData(JSON.stringify(obj), userId);
}
/**
 * Decrypt to an object (parses JSON after decryption)
 */
function decryptObject(encryptedString, userId) {
    const decrypted = decryptData(encryptedString, userId);
    return JSON.parse(decrypted);
}
/**
 * Check if a string looks like encrypted data
 */
function isEncrypted(data) {
    // Encrypted format: base64:base64:base64
    const parts = data.split(':');
    if (parts.length !== 3)
        return false;
    try {
        // Check if all parts are valid base64
        parts.forEach(part => Buffer.from(part, 'base64'));
        return true;
    }
    catch {
        return false;
    }
}
/**
 * Safely encrypt - returns original if encryption fails
 */
function safeEncrypt(data, userId) {
    try {
        return encryptData(data, userId);
    }
    catch (error) {
        console.error('Encryption failed, returning original:', error);
        return data;
    }
}
/**
 * Safely decrypt - returns original if decryption fails
 */
function safeDecrypt(data, userId) {
    try {
        if (!isEncrypted(data)) {
            return data; // Already plain text
        }
        return decryptData(data, userId);
    }
    catch (error) {
        console.error('Decryption failed, returning original:', error);
        return data;
    }
}
//# sourceMappingURL=crypto.js.map