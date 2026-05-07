/**
 * 🔱 EXHAUSTIVE FRONTEND CRYPTO MODULE TESTS
 * Tests v4 AES-256-GCM encryption with scrypt KDF and user isolation.
 */
import { describe, it, expect, beforeAll } from 'vitest';
import {
    encrypt,
    decrypt,
    encryptObject,
    decryptObject,
    isEncrypted,
    parseSensitiveField,
    initializeEncryption,
} from '../crypto.js';
const TEST_USER_ID = 'test-user-id-123';

// Ensure encryption secret is loaded
beforeAll(() => {
    initializeEncryption('test-secret-key-for-vitest-testing-32chars!');
});

// ═══════════════════════════════════════════════════════════════════════════
// ROUNDTRIP
// ═══════════════════════════════════════════════════════════════════════════

describe('Frontend Crypto - Roundtrip', () => {
    it('should encrypt and decrypt simple text', () => {
        const plaintext = 'Hello, World!';
        const encrypted = encrypt(plaintext, TEST_USER_ID);
        const decrypted = decrypt(encrypted, TEST_USER_ID);
        expect(decrypted).toBe(plaintext);
    });

    it('should encrypt and decrypt Unicode/Hindi', () => {
        const plaintext = 'नमस्ते दुनिया 🌍';
        const encrypted = encrypt(plaintext, TEST_USER_ID);
        const decrypted = decrypt(encrypted, TEST_USER_ID);
        expect(decrypted).toBe(plaintext);
    });

    it('should encrypt and decrypt empty string', () => {
        const encrypted = encrypt('', TEST_USER_ID);
        const decrypted = decrypt(encrypted, TEST_USER_ID);
        expect(decrypted).toBe('');
    });

    it('should encrypt and decrypt long text (10KB)', () => {
        const plaintext = 'A'.repeat(10000);
        const encrypted = encrypt(plaintext, TEST_USER_ID);
        const decrypted = decrypt(encrypted, TEST_USER_ID);
        expect(decrypted).toBe(plaintext);
        expect(decrypted.length).toBe(10000);
    });

    it('should produce v4 versioned format', () => {
        const encrypted = encrypt('test', TEST_USER_ID);
        expect(encrypted.startsWith('v4:')).toBe(true);
        const parts = encrypted.split(':');
        expect(parts.length).toBe(5); // v4:salt:iv:authTag:ciphertext
    });

    it('should produce unique ciphertext for same plaintext (unique IVs/salts)', () => {
        const enc1 = encrypt('same', TEST_USER_ID);
        const enc2 = encrypt('same', TEST_USER_ID);
        expect(enc1).not.toBe(enc2);
    });

    it('should handle JSON strings', () => {
        const json = JSON.stringify({ name: 'Test', events: [1, 2, 3] });
        const decrypted = decrypt(encrypt(json, TEST_USER_ID), TEST_USER_ID);
        expect(JSON.parse(decrypted)).toEqual(JSON.parse(json));
    });

    it('should handle special characters', () => {
        const special = "O'Brien & Co. <special> \"quotes\" $€¥₹";
        const decrypted = decrypt(encrypt(special, TEST_USER_ID), TEST_USER_ID);
        expect(decrypted).toBe(special);
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// DECRYPTION ERRORS
// ═══════════════════════════════════════════════════════════════════════════

describe('Frontend Crypto - Decryption Errors', () => {
    it('should throw on non-v4 format', () => {
        expect(() => decrypt('v1:some:old:format', TEST_USER_ID)).toThrow();
    });

    it('should throw on corrupted v4 ciphertext', () => {
        const encrypted = encrypt('test', TEST_USER_ID);
        const parts = encrypted.split(':');
        parts[4] = 'CORRUPTED_DATA_HERE'; // corrupt ciphertext
        expect(() => decrypt(parts.join(':'), TEST_USER_ID)).toThrow();
    });

    it('should throw on tampered v4 auth tag', () => {
        const encrypted = encrypt('test', TEST_USER_ID);
        const parts = encrypted.split(':');
        parts[3] = Buffer.from('bad_auth_tag_here').toString('base64'); // corrupt authTag
        expect(() => decrypt(parts.join(':'), TEST_USER_ID)).toThrow();
    });

    it('should throw on v4 decrypt with wrong userId', () => {
        const encrypted = encrypt('test', TEST_USER_ID);
        expect(() => decrypt(encrypted, 'different-user-id')).toThrow();
    });

    it('should throw on plain text input', () => {
        expect(() => decrypt('not encrypted at all', TEST_USER_ID)).toThrow();
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// OBJECT ENCRYPTION
// ═══════════════════════════════════════════════════════════════════════════

describe('Frontend Crypto - Object Encryption', () => {
    it('should encrypt and decrypt objects', () => {
        const obj = { name: 'Test', age: 30, nested: { key: 'value' } };
        const encrypted = encryptObject(obj, TEST_USER_ID);
        const decrypted = decryptObject<typeof obj>(encrypted, TEST_USER_ID);
        expect(decrypted).toEqual(obj);
    });

    it('should handle arrays in objects', () => {
        const obj = { events: ['marriage', 'career'], count: 2 };
        const decrypted = decryptObject<typeof obj>(encryptObject(obj, TEST_USER_ID), TEST_USER_ID);
        expect(decrypted.events).toEqual(['marriage', 'career']);
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// isEncrypted
// ═══════════════════════════════════════════════════════════════════════════

describe('Frontend Crypto - isEncrypted', () => {
    it('should detect v4 encrypted strings', () => {
        const encrypted = encrypt('test', TEST_USER_ID);
        expect(isEncrypted(encrypted)).toBe(true);
    });


    it('should reject plain text', () => {
        expect(isEncrypted('hello world')).toBe(false);
    });

    it('should reject JSON strings', () => {
        expect(isEncrypted('{"key":"value"}')).toBe(false);
    });

    it('should reject null/undefined', () => {
        expect(isEncrypted(null)).toBe(false);
        expect(isEncrypted(undefined)).toBe(false);
    });

    it('should reject empty string', () => {
        expect(isEncrypted('')).toBe(false);
    });

    it('should reject v1 format', () => {
        expect(isEncrypted('v1:something')).toBe(false);
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// parseSensitiveField
// ═══════════════════════════════════════════════════════════════════════════

describe('Frontend Crypto - parseSensitiveField', () => {
    it('should return default for null/undefined', () => {
        expect(parseSensitiveField(null, TEST_USER_ID)).toBeNull();
        expect(parseSensitiveField(undefined, TEST_USER_ID)).toBeNull();
        expect(parseSensitiveField('', TEST_USER_ID, 'default')).toBe('default');
    });

    it('should decrypt and parse encrypted JSON', () => {
        const data = { events: ['marriage'] };
        const encrypted = encrypt(JSON.stringify(data), TEST_USER_ID);
        expect(parseSensitiveField(encrypted, TEST_USER_ID)).toEqual(data);
    });

    it('should decrypt plain encrypted string', () => {
        const name = 'Ashok Kumar';
        const encrypted = encrypt(name, TEST_USER_ID);
        expect(parseSensitiveField(encrypted, TEST_USER_ID)).toBe(name);
    });

    it('should parse unencrypted JSON (legacy)', () => {
        const json = '{"key":"value"}';
        expect(parseSensitiveField(json, undefined, TEST_USER_ID)).toEqual({ key: 'value' });
    });

    it('should return raw string for non-JSON non-encrypted', () => {
        expect(parseSensitiveField('plain text', undefined, TEST_USER_ID)).toBe('plain text');
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════════════════════

describe('Frontend Crypto - Initialization', () => {
    it('should throw when encrypting without secret', () => {
        initializeEncryption(undefined);
        expect(() => encrypt('test', TEST_USER_ID)).toThrow('ENCRYPTION_SECRET is not initialized');
        initializeEncryption('test-secret-key-for-vitest-testing-32chars!');
    });

    it('should throw when decrypting without secret', () => {
        const encrypted = encrypt('test', TEST_USER_ID);
        initializeEncryption(undefined);
        expect(() => decrypt(encrypted, TEST_USER_ID)).toThrow('ENCRYPTION_SECRET is not initialized');
        initializeEncryption('test-secret-key-for-vitest-testing-32chars!');
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// v4 USER ISOLATION TESTS
// ═══════════════════════════════════════════════════════════════════════════

describe('Frontend Crypto - v4 User Isolation', () => {
    it('should produce different ciphertext for different users on same plaintext', () => {
        const plaintext = 'same data';
        const enc1 = encrypt(plaintext, 'user-a');
        const enc2 = encrypt(plaintext, 'user-b');
        expect(enc1).not.toBe(enc2);
    });

    it('should fail to decrypt v4 data with wrong userId', () => {
        const encrypted = encrypt('secret', 'user-a');
        expect(() => decrypt(encrypted, 'user-b')).toThrow();
    });

    it('should fail to decrypt v4 data without userId', () => {
        const encrypted = encrypt('secret', 'user-a');
        expect(() => decrypt(encrypted)).toThrow('userId is required');
    });

    it('should throw when encrypting without userId', () => {
        expect(() => encrypt('test', '')).toThrow('userId is required');
    });
});
