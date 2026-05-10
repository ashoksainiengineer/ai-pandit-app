import { describe, it, expect } from 'vitest';
import { createEncryption, isEncrypted } from '../index.js';

const TEST_SECRET = 'test-secret-for-encryption-tests-min-32-chars';
const TEST_USER_ID = 'test_user_12345';

// Create a test encryption instance
const crypto = createEncryption(TEST_SECRET);

describe('Encryption System (v4) — Clean API', () => {
  describe('createEncryption', () => {
    it('should create an instance with valid secret (≥32 chars)', () => {
      const instance = createEncryption('a'.repeat(32));
      expect(instance).toBeDefined();
      expect(instance.encrypt).toBeInstanceOf(Function);
      expect(instance.decrypt).toBeInstanceOf(Function);
      expect(instance.parseField).toBeInstanceOf(Function);
      expect(instance.isEncrypted).toBeInstanceOf(Function);
    });

    it('should throw on secret shorter than 32 chars', () => {
      expect(() => createEncryption('short')).toThrow(/at least 32/);
    });

    it('should throw on empty secret', () => {
      expect(() => createEncryption('')).toThrow(/at least 32/);
    });
  });

  describe('crypto.encrypt / crypto.decrypt', () => {
    it('should encrypt and decrypt string data (round-trip)', () => {
      const data = JSON.stringify({
        name: 'Test User',
        date: '1990-01-01',
        time: '12:00',
        latitude: 28.6139,
        longitude: 77.2090,
      });

      const encrypted = crypto.encrypt(data, TEST_USER_ID);
      expect(encrypted).toBeDefined();
      expect(typeof encrypted).toBe('string');
      expect(encrypted).not.toContain('Test User');
      expect(encrypted.startsWith('v4:')).toBe(true);

      const decrypted = crypto.decrypt(encrypted, TEST_USER_ID);
      expect(decrypted).toBe(data);
    });

    it('should handle unicode characters (Hindi, emoji, Chinese)', () => {
      const data = 'नमस्ते दुनिया 🌍 你好世界 العربية';
      const encrypted = crypto.encrypt(data, TEST_USER_ID);
      const decrypted = crypto.decrypt(encrypted, TEST_USER_ID);
      expect(decrypted).toBe(data);
    });

    it('should handle nested objects', () => {
      const data = JSON.stringify({
        birthData: {
          date: '1990-01-01',
          coordinates: { lat: 28.6139, lng: 77.2090 },
        },
        events: [{ date: '2010-05-15', type: 'marriage' }],
      });

      const encrypted = crypto.encrypt(data, TEST_USER_ID);
      const decrypted = crypto.decrypt(encrypted, TEST_USER_ID);
      expect(JSON.parse(decrypted)).toEqual(JSON.parse(data));
    });

    it('should fail with wrong userId (AAD binding check)', () => {
      const encrypted = crypto.encrypt('secret data', TEST_USER_ID);
      expect(() => crypto.decrypt(encrypted, 'wrong_user')).toThrow();
    });

    it('should reject malformed input', () => {
      expect(() => crypto.decrypt('not-encrypted', TEST_USER_ID)).toThrow();
    });

    it('should reject invalid v4 format (wrong part count)', () => {
      expect(() => crypto.decrypt('v4:only-two-parts', TEST_USER_ID)).toThrow();
    });

    it('should produce unique ciphertexts for same plaintext (random salt/IV)', () => {
      const plaintext = 'Same message';
      const encrypted1 = crypto.encrypt(plaintext, TEST_USER_ID);
      const encrypted2 = crypto.encrypt(plaintext, TEST_USER_ID);
      expect(encrypted1).not.toBe(encrypted2);
      // But both should decrypt to the same plaintext
      expect(crypto.decrypt(encrypted1, TEST_USER_ID)).toBe(plaintext);
      expect(crypto.decrypt(encrypted2, TEST_USER_ID)).toBe(plaintext);
    });
  });

  describe('crypto.isEncrypted', () => {
    it('should detect v4 format', () => {
      const encrypted = crypto.encrypt('test', TEST_USER_ID);
      expect(crypto.isEncrypted(encrypted)).toBe(true);
    });

    it('should reject plaintext', () => {
      expect(crypto.isEncrypted('hello world')).toBe(false);
    });

    it('should reject null/undefined', () => {
      expect(crypto.isEncrypted(null)).toBe(false);
      expect(crypto.isEncrypted(undefined)).toBe(false);
    });

    it('should reject short strings', () => {
      expect(crypto.isEncrypted('abc')).toBe(false);
    });
  });

  describe('crypto.parseField', () => {
    it('should decrypt v4 encrypted JSON data', () => {
      const original = { key: 'value', num: 42 };
      const encrypted = crypto.encrypt(JSON.stringify(original), TEST_USER_ID);
      const result = crypto.parseField<typeof original>(encrypted, TEST_USER_ID);
      expect(result).toEqual(original);
    });

    it('should parse plain JSON without decryption', () => {
      const result = crypto.parseField(JSON.stringify({ a: 1 }), TEST_USER_ID);
      expect(result).toEqual({ a: 1 });
    });

    it('should return raw string for non-JSON plaintext', () => {
      const result = crypto.parseField('just a string', TEST_USER_ID);
      expect(result).toBe('just a string');
    });

    it('should return defaultValue for null input', () => {
      const result = crypto.parseField(null, TEST_USER_ID, 'fallback');
      expect(result).toBe('fallback');
    });

    it('should return null defaultValue when not specified', () => {
      const result = crypto.parseField(null, TEST_USER_ID);
      expect(result).toBeNull();
    });

    it('should return defaultValue when decryption fails', () => {
      const encrypted = crypto.encrypt('data', TEST_USER_ID);
      // Decrypt with wrong userId — should fail and return defaultValue
      const result = crypto.parseField(encrypted, 'wrong_user', 'fallback_value');
      expect(result).toBe('fallback_value');
    });

    it('should handle empty string plaintext', () => {
      const encrypted = crypto.encrypt('', TEST_USER_ID);
      const result = crypto.parseField(encrypted, TEST_USER_ID);
      expect(result).toBe('');
    });
  });

  describe('round-trip encryption', () => {
    it('should maintain data integrity across various inputs', () => {
      const testCases = [
        'Simple string',
        '{"complex": "json", "nested": {"key": "value"}}',
        'Special chars: !@#$%^&*()',
        'Unicode: 你好世界 मराठी العربية',
        '',
        'a'.repeat(10000), // Large payload
      ];

      testCases.forEach((original) => {
        const encrypted = crypto.encrypt(original, TEST_USER_ID);
        const decrypted = crypto.decrypt(encrypted, TEST_USER_ID);
        expect(decrypted).toBe(original);
      });
    });

    it('should produce different ciphertexts for different userIds', () => {
      const plaintext = 'Same message';
      const encrypted1 = crypto.encrypt(plaintext, 'user_A');
      const encrypted2 = crypto.encrypt(plaintext, 'user_B');
      expect(encrypted1).not.toBe(encrypted2);
    });
  });
});
