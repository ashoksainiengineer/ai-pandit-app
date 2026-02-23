/**
 * 🔱 EXHAUSTIVE FRONTEND CRYPTO MODULE TESTS
 * Tests v3 AES-256-GCM encryption with scrypt KDF.
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
} from '../crypto';

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
        const encrypted = encrypt(plaintext);
        const decrypted = decrypt(encrypted);
        expect(decrypted).toBe(plaintext);
    });

    it('should encrypt and decrypt Unicode/Hindi', () => {
        const plaintext = 'नमस्ते दुनिया 🌍';
        const encrypted = encrypt(plaintext);
        const decrypted = decrypt(encrypted);
        expect(decrypted).toBe(plaintext);
    });

    it('should encrypt and decrypt empty string', () => {
        const encrypted = encrypt('');
        const decrypted = decrypt(encrypted);
        expect(decrypted).toBe('');
    });

    it('should encrypt and decrypt long text (10KB)', () => {
        const plaintext = 'A'.repeat(10000);
        const encrypted = encrypt(plaintext);
        const decrypted = decrypt(encrypted);
        expect(decrypted).toBe(plaintext);
        expect(decrypted.length).toBe(10000);
    });

    it('should produce v3 versioned format', () => {
        const encrypted = encrypt('test');
        expect(encrypted.startsWith('v3:')).toBe(true);
        const parts = encrypted.split(':');
        expect(parts.length).toBe(5); // v3:salt:iv:authTag:ciphertext
    });

    it('should produce unique ciphertext for same plaintext (unique IVs/salts)', () => {
        const enc1 = encrypt('same');
        const enc2 = encrypt('same');
        expect(enc1).not.toBe(enc2);
    });

    it('should handle JSON strings', () => {
        const json = JSON.stringify({ name: "Test", events: [1, 2, 3] });
        const decrypted = decrypt(encrypt(json));
        expect(JSON.parse(decrypted)).toEqual(JSON.parse(json));
    });

    it('should handle special characters', () => {
        const special = "O'Brien & Co. <special> \"quotes\" $€¥₹";
        const decrypted = decrypt(encrypt(special));
        expect(decrypted).toBe(special);
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// DECRYPTION ERRORS
// ═══════════════════════════════════════════════════════════════════════════

describe('Frontend Crypto - Decryption Errors', () => {
    it('should throw on non-v3 format', () => {
        expect(() => decrypt('v1:some:old:format')).toThrow('Only v3 is supported');
    });

    it('should throw on invalid format (wrong part count)', () => {
        expect(() => decrypt('v3:only:three:parts')).toThrow('Only v3 is supported');
    });

    it('should throw on corrupted ciphertext', () => {
        const encrypted = encrypt('test');
        const parts = encrypted.split(':');
        parts[4] = 'CORRUPTED_DATA_HERE'; // corrupt ciphertext
        expect(() => decrypt(parts.join(':'))).toThrow();
    });

    it('should throw on tampered auth tag', () => {
        const encrypted = encrypt('test');
        const parts = encrypted.split(':');
        parts[3] = Buffer.from('bad_auth_tag_here').toString('base64'); // corrupt authTag
        expect(() => decrypt(parts.join(':'))).toThrow();
    });

    it('should throw on plain text input', () => {
        expect(() => decrypt('not encrypted at all')).toThrow();
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// OBJECT ENCRYPTION
// ═══════════════════════════════════════════════════════════════════════════

describe('Frontend Crypto - Object Encryption', () => {
    it('should encrypt and decrypt objects', () => {
        const obj = { name: 'Test', age: 30, nested: { key: 'value' } };
        const encrypted = encryptObject(obj);
        const decrypted = decryptObject<typeof obj>(encrypted);
        expect(decrypted).toEqual(obj);
    });

    it('should handle arrays in objects', () => {
        const obj = { events: ['marriage', 'career'], count: 2 };
        const decrypted = decryptObject<typeof obj>(encryptObject(obj));
        expect(decrypted.events).toEqual(['marriage', 'career']);
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// isEncrypted
// ═══════════════════════════════════════════════════════════════════════════

describe('Frontend Crypto - isEncrypted', () => {
    it('should detect v3 encrypted strings', () => {
        const encrypted = encrypt('test');
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

    it('should reject v1/v2 format', () => {
        expect(isEncrypted('v1:something')).toBe(false);
        expect(isEncrypted('v2:something')).toBe(false);
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// parseSensitiveField
// ═══════════════════════════════════════════════════════════════════════════

describe('Frontend Crypto - parseSensitiveField', () => {
    it('should return default for null/undefined', () => {
        expect(parseSensitiveField(null)).toBeNull();
        expect(parseSensitiveField(undefined)).toBeNull();
        expect(parseSensitiveField('', 'default')).toBe('default');
    });

    it('should decrypt and parse encrypted JSON', () => {
        const data = { events: ['marriage'] };
        const encrypted = encrypt(JSON.stringify(data));
        expect(parseSensitiveField(encrypted)).toEqual(data);
    });

    it('should decrypt plain encrypted string', () => {
        const name = 'Ashok Kumar';
        const encrypted = encrypt(name);
        expect(parseSensitiveField(encrypted)).toBe(name);
    });

    it('should parse unencrypted JSON (legacy)', () => {
        const json = '{"key":"value"}';
        expect(parseSensitiveField(json)).toEqual({ key: 'value' });
    });

    it('should return raw string for non-JSON non-encrypted', () => {
        expect(parseSensitiveField('plain text')).toBe('plain text');
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════════════════════

describe('Frontend Crypto - Initialization', () => {
    it('should throw when encrypting without secret', () => {
        // Temporarily unset
        initializeEncryption(undefined);
        expect(() => encrypt('test')).toThrow('ENCRYPTION_SECRET is not initialized');
        // Restore
        initializeEncryption('test-secret-key-for-vitest-testing-32chars!');
    });

    it('should throw when decrypting without secret', () => {
        const encrypted = encrypt('test');
        initializeEncryption(undefined);
        expect(() => decrypt(encrypted)).toThrow('ENCRYPTION_SECRET is not initialized');
        // Restore
        initializeEncryption('test-secret-key-for-vitest-testing-32chars!');
    });
});
