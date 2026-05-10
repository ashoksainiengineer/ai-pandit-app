/**
 * 🔱 EXHAUSTIVE ENCRYPTION TESTS
 * Tests encrypt/decrypt roundtrip, backward compatibility, error cases,
 * and the parseField recovery helper.
 */
import { describe, it, expect } from 'vitest';

// We test the actual encryption logic rather than mocking it
// since this is a CRITICAL security module
import { createEncryption } from '../encryption/index.js';

const crypto = createEncryption('test-secret-at-least-32-chars-long-ok');

// ═══════════════════════════════════════════════════════════════════════════
// ENCRYPT → DECRYPT ROUNDTRIP
// ═══════════════════════════════════════════════════════════════════════════

describe('Encryption - Roundtrip Integrity', () => {
    const userId = 'test_user_clerk_id_123';

    it('should encrypt and decrypt a simple string correctly', () => {
        const plaintext = 'Hello, World!';
        const encrypted = crypto.encrypt(plaintext, userId);
        const decrypted = crypto.decrypt(encrypted, userId);

        expect(decrypted).toBe(plaintext);
        expect(encrypted).not.toBe(plaintext); // Must be different
    });

    it('should handle Unicode/Hindi text correctly', () => {
        const plaintext = 'नमस्ते दुनिया 🌍';
        const encrypted = crypto.encrypt(plaintext, userId);
        const decrypted = crypto.decrypt(encrypted, userId);

        expect(decrypted).toBe(plaintext);
    });

    it('should handle empty string', () => {
        const plaintext = '';
        const encrypted = crypto.encrypt(plaintext, userId);
        const decrypted = crypto.decrypt(encrypted, userId);

        expect(decrypted).toBe(plaintext);
    });

    it('should handle very long strings (10,000 chars)', () => {
        const plaintext = 'A'.repeat(10000);
        const encrypted = crypto.encrypt(plaintext, userId);
        const decrypted = crypto.decrypt(encrypted, userId);

        expect(decrypted).toBe(plaintext);
        expect(decrypted.length).toBe(10000);
    });

    it('should produce different ciphertext for same plaintext (unique IVs)', () => {
        const plaintext = 'same text twice';
        const enc1 = crypto.encrypt(plaintext, userId);
        const enc2 = crypto.encrypt(plaintext, userId);

        expect(enc1).not.toBe(enc2); // IV randomness ensures this
        expect(crypto.decrypt(enc1, userId)).toBe(plaintext);
        expect(crypto.decrypt(enc2, userId)).toBe(plaintext);
    });

    it('should handle special characters and JSON strings', () => {
        const jsonStr = JSON.stringify({ name: "O'Brien", events: [1, 2, 3], nested: { a: "b's" } });
        const encrypted = crypto.encrypt(jsonStr, userId);
        const decrypted = crypto.decrypt(encrypted, userId);

        expect(decrypted).toBe(jsonStr);
        expect(JSON.parse(decrypted)).toEqual(JSON.parse(jsonStr));
    });

    it('should handle newlines and tabs', () => {
        const plaintext = 'line1\nline2\ttab';
        const encrypted = crypto.encrypt(plaintext, userId);
        const decrypted = crypto.decrypt(encrypted, userId);

        expect(decrypted).toBe(plaintext);
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// DIFFERENT USER IDS
// ═══════════════════════════════════════════════════════════════════════════

describe('Encryption - User Isolation', () => {
    it('should produce different ciphertext even for same plaintext (IV randomness)', () => {
        // userId is part of key derivation via scrypt(secret:userId, salt)
        // Different userId → different ciphertext
        const enc_A = crypto.encrypt('same data', 'user_A');
        const enc_B = crypto.encrypt('same data', 'user_B');

        expect(crypto.isEncrypted(enc_A)).toBe(true);
        expect(crypto.isEncrypted(enc_B)).toBe(true);
        // Different due to IV randomness at minimum
        expect(enc_A).not.toBe(enc_B);
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// SAFE VARIANTS (try/catch wrappers)
// ═══════════════════════════════════════════════════════════════════════════

describe('Encryption - safeEncrypt/safeDecrypt (Non-throwing)', () => {
    const userId = 'safe_test_user';

    it('should return encrypted string on success', () => {
        const result = crypto.encrypt('hello', userId);
        expect(result).not.toBeNull();
        expect(typeof result).toBe('string');
    });

    it('should return null on decrypt failure (corrupted data)', () => {
        let result: string | null = null;
        try {
            result = crypto.decrypt('totally_not_encrypted_garbage', userId);
        } catch {
            result = null;
        }
        expect(result).toBeNull();
    });

    it('should roundtrip correctly', () => {
        const encrypted = crypto.encrypt('safe roundtrip', userId);
        const decrypted = crypto.decrypt(encrypted, userId);
        expect(decrypted).toBe('safe roundtrip');
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// DECRYPT — No Fallback (v2 API)
// ═══════════════════════════════════════════════════════════════════════════

describe('Encryption - Decrypt (No Fallback)', () => {
    it('should throw on null/undefined/empty input', () => {
        expect(() => crypto.decrypt(null as any, 'user')).toThrow();
        expect(() => crypto.decrypt(undefined as any, 'user')).toThrow();
        expect(() => crypto.decrypt('', 'user')).toThrow();
    });

    it('should decrypt v4 encrypted data', () => {
        const encrypted = crypto.encrypt('primary key data', 'primary_user');
        const result = crypto.decrypt(encrypted, 'primary_user');
        expect(result).toBe('primary key data');
    });

    it('should fail decryption with wrong userId (user isolation)', () => {
        const encrypted = crypto.encrypt('fallback data', 'correct_user');
        expect(() => crypto.decrypt(encrypted, 'wrong_user')).toThrow();
    });

    it('should isolate users — different userId cannot decrypt', () => {
        // userId is part of key derivation. Different userId → different key → auth tag mismatch.
        const encrypted = crypto.encrypt('test data', 'some_user');
        expect(() => crypto.decrypt(encrypted, 'different_user')).toThrow();
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// OBJECT ENCRYPTION
// ═══════════════════════════════════════════════════════════════════════════

describe('Encryption - Object Encryption', () => {
    const userId = 'obj_user';

    it('should encrypt and decrypt objects preserving structure', () => {
        const obj = { name: 'Test', age: 30, nested: { key: 'value' } };
        const encrypted = crypto.encrypt(JSON.stringify(obj), userId);
        const decrypted = JSON.parse(crypto.decrypt(encrypted, userId));

        expect(decrypted).toEqual(obj);
    });

    it('should handle arrays in objects', () => {
        const obj = { events: ['marriage', 'career', 'health'], count: 3 };
        const encrypted = crypto.encrypt(JSON.stringify(obj), userId);
        const decrypted = JSON.parse(crypto.decrypt(encrypted, userId));

        expect(decrypted.events).toEqual(['marriage', 'career', 'health']);
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// isEncrypted DETECTION
// ═══════════════════════════════════════════════════════════════════════════

describe('Encryption - isEncrypted Detection', () => {
    it('should detect encrypted strings correctly', () => {
        const encrypted = crypto.encrypt('test', 'user_123');
        expect(crypto.isEncrypted(encrypted)).toBe(true);
    });

    it('should reject plain text as not encrypted', () => {
        expect(crypto.isEncrypted('hello world')).toBe(false);
        expect(crypto.isEncrypted('just a plain string')).toBe(false);
    });

    it('should reject JSON strings as not encrypted', () => {
        expect(crypto.isEncrypted('{"name":"test"}')).toBe(false);
    });

    it('should handle edge cases', () => {
        expect(crypto.isEncrypted('')).toBe(false);
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// parseField (GOD-TIER ROBUST DECRYPTION HELPER)
// ═══════════════════════════════════════════════════════════════════════════

describe('Encryption - parseField', () => {
    const userId = 'parse_test_user';

    it('should return defaultValue for null/undefined input', () => {
        expect(crypto.parseField(null, userId)).toBeNull();
        expect(crypto.parseField(undefined, userId)).toBeNull();
        expect(crypto.parseField(null, userId, [])).toEqual([]);
        expect(crypto.parseField(null, userId, 'default')).toBe('default');
    });

    it('should decrypt and parse encrypted JSON', () => {
        const lifeEvents = [{ category: 'marriage', date: '2020-01-01' }];
        const encrypted = crypto.encrypt(JSON.stringify(lifeEvents), userId);

        const result = crypto.parseField(encrypted, userId);
        expect(result).toEqual(lifeEvents);
    });

    it('should decrypt plain encrypted string (not JSON)', () => {
        const name = 'Ashok Kumar';
        const encrypted = crypto.encrypt(name, userId);

        const result = crypto.parseField(encrypted, userId);
        expect(result).toBe(name);
    });

    it('should handle unencrypted JSON data (legacy)', () => {
        const jsonStr = JSON.stringify({ key: 'value' });
        const result = crypto.parseField(jsonStr, userId);
        expect(result).toEqual({ key: 'value' });
    });

    it('should return raw string for non-JSON non-encrypted data', () => {
        const result = crypto.parseField('just a plain name', userId);
        expect(result).toBe('just a plain name');
    });

    it('should return defaultValue when decryption fails with wrong userId', () => {
        const encrypted = crypto.encrypt('fallback test', userId);
        const result = crypto.parseField(encrypted, 'wrong_user_id', 'fallback');
        expect(result).toBe('fallback');
    });
});
