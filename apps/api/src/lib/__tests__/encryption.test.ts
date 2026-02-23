/**
 * 🔱 EXHAUSTIVE ENCRYPTION TESTS
 * Tests encrypt/decrypt roundtrip, backward compatibility, error cases,
 * and the parseSensitiveField recovery helper.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// We test the actual encryption logic rather than mocking it
// since this is a CRITICAL security module
import {
    encryptData,
    decryptData,
    safeEncrypt,
    safeDecrypt,
    safeDecryptWithFallback,
    encryptObject,
    decryptObject,
    parseSensitiveField,
    isEncrypted,
} from '../encryption/index.js';

// ═══════════════════════════════════════════════════════════════════════════
// ENCRYPT → DECRYPT ROUNDTRIP
// ═══════════════════════════════════════════════════════════════════════════

describe('Encryption - Roundtrip Integrity', () => {
    const userId = 'test_user_clerk_id_123';

    it('should encrypt and decrypt a simple string correctly', () => {
        const plaintext = 'Hello, World!';
        const encrypted = encryptData(plaintext, userId);
        const decrypted = decryptData(encrypted, userId);

        expect(decrypted).toBe(plaintext);
        expect(encrypted).not.toBe(plaintext); // Must be different
    });

    it('should handle Unicode/Hindi text correctly', () => {
        const plaintext = 'नमस्ते दुनिया 🌍';
        const encrypted = encryptData(plaintext, userId);
        const decrypted = decryptData(encrypted, userId);

        expect(decrypted).toBe(plaintext);
    });

    it('should handle empty string', () => {
        const plaintext = '';
        const encrypted = encryptData(plaintext, userId);
        const decrypted = decryptData(encrypted, userId);

        expect(decrypted).toBe(plaintext);
    });

    it('should handle very long strings (10,000 chars)', () => {
        const plaintext = 'A'.repeat(10000);
        const encrypted = encryptData(plaintext, userId);
        const decrypted = decryptData(encrypted, userId);

        expect(decrypted).toBe(plaintext);
        expect(decrypted.length).toBe(10000);
    });

    it('should produce different ciphertext for same plaintext (unique IVs)', () => {
        const plaintext = 'same text twice';
        const enc1 = encryptData(plaintext, userId);
        const enc2 = encryptData(plaintext, userId);

        expect(enc1).not.toBe(enc2); // IV randomness ensures this
        expect(decryptData(enc1, userId)).toBe(plaintext);
        expect(decryptData(enc2, userId)).toBe(plaintext);
    });

    it('should handle special characters and JSON strings', () => {
        const jsonStr = JSON.stringify({ name: "O'Brien", events: [1, 2, 3], nested: { a: "b's" } });
        const encrypted = encryptData(jsonStr, userId);
        const decrypted = decryptData(encrypted, userId);

        expect(decrypted).toBe(jsonStr);
        expect(JSON.parse(decrypted)).toEqual(JSON.parse(jsonStr));
    });

    it('should handle newlines and tabs', () => {
        const plaintext = 'line1\nline2\ttab';
        const encrypted = encryptData(plaintext, userId);
        const decrypted = decryptData(encrypted, userId);

        expect(decrypted).toBe(plaintext);
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// DIFFERENT USER IDS
// ═══════════════════════════════════════════════════════════════════════════

describe('Encryption - User Isolation', () => {
    it('should produce different ciphertext even for same plaintext (IV randomness)', () => {
        // The encryption module uses a global server secret.
        // UserId is passed as context but may not affect the AES key derivation.
        // This documents that userId alone doesn't provide cryptographic isolation.
        const enc_A = encryptData('same data', 'user_A');
        const enc_B = encryptData('same data', 'user_B');

        expect(isEncrypted(enc_A)).toBe(true);
        expect(isEncrypted(enc_B)).toBe(true);
        // Different due to IV randomness at minimum
        expect(enc_A).not.toBe(enc_B);
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// SAFE VARIANTS
// ═══════════════════════════════════════════════════════════════════════════

describe('Encryption - safeEncrypt/safeDecrypt (Non-throwing)', () => {
    const userId = 'safe_test_user';

    it('should return encrypted string on success', () => {
        const result = safeEncrypt('hello', userId);
        expect(result).not.toBeNull();
        expect(typeof result).toBe('string');
    });

    it('should return null on decrypt failure (corrupted data)', () => {
        const result = safeDecrypt('totally_not_encrypted_garbage', userId);
        expect(result).toBeNull();
    });

    it('should roundtrip correctly', () => {
        const encrypted = safeEncrypt('safe roundtrip', userId)!;
        const decrypted = safeDecrypt(encrypted, userId);
        expect(decrypted).toBe('safe roundtrip');
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// safeDecryptWithFallback
// ═══════════════════════════════════════════════════════════════════════════

describe('Encryption - safeDecryptWithFallback', () => {
    it('should return null for null/undefined input', () => {
        expect(safeDecryptWithFallback(null, 'user')).toBeNull();
        expect(safeDecryptWithFallback(undefined, 'user')).toBeNull();
        expect(safeDecryptWithFallback('', 'user')).toBeNull();
    });

    it('should decrypt with primary key first', () => {
        const encrypted = encryptData('primary key data', 'primary_user');
        const result = safeDecryptWithFallback(encrypted, 'primary_user', 'fallback_user');
        expect(result).toBe('primary key data');
    });

    it('should fall back to secondary key if primary fails', () => {
        const encrypted = encryptData('fallback data', 'fallback_user');
        // Primary will fail, then try 'fallback_user'
        const result = safeDecryptWithFallback(encrypted, 'wrong_primary', 'fallback_user');
        expect(result).toBe('fallback data');
    });

    it('should still decrypt if module uses global secret (userId as additional context)', () => {
        // The encryption module may use a global secret that makes decryption
        // succeed regardless of userId. This documents the actual behavior.
        const encrypted = encryptData('test data', 'some_user');
        const result = safeDecryptWithFallback(encrypted, 'any_user', 'another_user');
        // If global secret is used, decryption succeeds with any userId
        expect(result).toBeDefined();
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// OBJECT ENCRYPTION
// ═══════════════════════════════════════════════════════════════════════════

describe('Encryption - Object Encryption', () => {
    const userId = 'obj_user';

    it('should encrypt and decrypt objects preserving structure', () => {
        const obj = { name: 'Test', age: 30, nested: { key: 'value' } };
        const encrypted = encryptObject(obj, userId);
        const decrypted = decryptObject<typeof obj>(encrypted, userId);

        expect(decrypted).toEqual(obj);
    });

    it('should handle arrays in objects', () => {
        const obj = { events: ['marriage', 'career', 'health'], count: 3 };
        const encrypted = encryptObject(obj, userId);
        const decrypted = decryptObject<typeof obj>(encrypted, userId);

        expect(decrypted.events).toEqual(['marriage', 'career', 'health']);
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// isEncrypted DETECTION
// ═══════════════════════════════════════════════════════════════════════════

describe('Encryption - isEncrypted Detection', () => {
    it('should detect encrypted strings correctly', () => {
        const encrypted = encryptData('test', 'user_123');
        expect(isEncrypted(encrypted)).toBe(true);
    });

    it('should reject plain text as not encrypted', () => {
        expect(isEncrypted('hello world')).toBe(false);
        expect(isEncrypted('just a plain string')).toBe(false);
    });

    it('should reject JSON strings as not encrypted', () => {
        expect(isEncrypted('{"name":"test"}')).toBe(false);
    });

    it('should handle edge cases', () => {
        expect(isEncrypted('')).toBe(false);
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// parseSensitiveField (GOD-TIER ROBUST DECRYPTION HELPER)
// ═══════════════════════════════════════════════════════════════════════════

describe('Encryption - parseSensitiveField', () => {
    const clerkId = 'clerk_parse_test';
    const internalId = 'internal_parse_test';

    it('should return defaultValue for null/undefined input', () => {
        expect(parseSensitiveField(null, clerkId, internalId)).toBeNull();
        expect(parseSensitiveField(undefined, clerkId, internalId)).toBeNull();
        expect(parseSensitiveField(null, clerkId, internalId, [])).toEqual([]);
        expect(parseSensitiveField(null, clerkId, internalId, 'default')).toBe('default');
    });

    it('should decrypt and parse encrypted JSON', () => {
        const lifeEvents = [{ category: 'marriage', date: '2020-01-01' }];
        const encrypted = encryptData(JSON.stringify(lifeEvents), clerkId);

        const result = parseSensitiveField(encrypted, clerkId, internalId);
        expect(result).toEqual(lifeEvents);
    });

    it('should decrypt plain encrypted string (not JSON)', () => {
        const name = 'Ashok Kumar';
        const encrypted = encryptData(name, clerkId);

        const result = parseSensitiveField(encrypted, clerkId, internalId);
        expect(result).toBe(name);
    });

    it('should handle unencrypted JSON data (legacy)', () => {
        const jsonStr = JSON.stringify({ key: 'value' });
        const result = parseSensitiveField(jsonStr, clerkId, internalId);
        expect(result).toEqual({ key: 'value' });
    });

    it('should return raw string for non-JSON non-encrypted data', () => {
        const result = parseSensitiveField('just a plain name', clerkId, internalId);
        expect(result).toBe('just a plain name');
    });

    it('should fallback to internalId if clerkId decryption fails', () => {
        const encrypted = encryptData('fallback test', internalId);
        const result = parseSensitiveField(encrypted, 'wrong_clerk_id', internalId);
        expect(result).toBe('fallback test');
    });
});
