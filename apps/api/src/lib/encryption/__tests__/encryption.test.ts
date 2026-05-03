import { describe, it, expect } from 'vitest';
import { encryptData, decryptData, isEncrypted } from '../DANGER_DO_NOT_MODIFY.js';

const TEST_SECRET = 'test-secret-for-encryption-tests-min-32-chars';
const TEST_USER_ID = 'test_user_12345';

describe('Encryption Module (v4)', () => {
  describe('encryptData', () => {
    it('should encrypt string data successfully', () => {
      const data = JSON.stringify({
        name: 'Test User',
        date: '1990-01-01',
        time: '12:00',
        latitude: 28.6139,
        longitude: 77.2090,
      });

      const encrypted = encryptData(data, TEST_USER_ID, TEST_SECRET);
      expect(encrypted).toBeDefined();
      expect(typeof encrypted).toBe('string');
      expect(encrypted.length).toBeGreaterThan(0);
      expect(encrypted).not.toContain('Test User');
      expect(encrypted.startsWith('v4:')).toBe(true);
    });

    it('should throw on empty secret', () => {
      expect(() => encryptData('data', TEST_USER_ID, '')).toThrow();
    });

    it('should throw on empty userId', () => {
      expect(() => encryptData('data', '', TEST_SECRET)).toThrow();
    });

    it('should handle unicode characters', () => {
      const data = 'नमस्ते दुनिया 🌍';
      const encrypted = encryptData(data, TEST_USER_ID, TEST_SECRET);
      const decrypted = decryptData(encrypted, TEST_USER_ID, TEST_SECRET);
      expect(decrypted).toBe(data);
    });
  });

  describe('decryptData', () => {
    it('should decrypt encrypted data correctly', () => {
      const original = JSON.stringify({ test: 'data', number: 123 });
      const encrypted = encryptData(original, TEST_USER_ID, TEST_SECRET);
      const decrypted = decryptData(encrypted, TEST_USER_ID, TEST_SECRET);
      expect(decrypted).toBe(original);
    });

    it('should handle nested objects', () => {
      const data = JSON.stringify({
        birthData: {
          date: '1990-01-01',
          coordinates: { lat: 28.6139, lng: 77.2090 },
        },
        events: [{ date: '2010-05-15', type: 'marriage' }],
      });

      const encrypted = encryptData(data, TEST_USER_ID, TEST_SECRET);
      const decrypted = decryptData(encrypted, TEST_USER_ID, TEST_SECRET);
      expect(JSON.parse(decrypted)).toEqual(JSON.parse(data));
    });

    it('should fail with wrong userId', () => {
      const encrypted = encryptData('secret data', TEST_USER_ID, TEST_SECRET);
      expect(() => decryptData(encrypted, 'wrong_user', TEST_SECRET)).toThrow();
    });

    it('should fail with wrong secret', () => {
      const encrypted = encryptData('secret data', TEST_USER_ID, TEST_SECRET);
      expect(() => decryptData(encrypted, TEST_USER_ID, 'wrong-secret')).toThrow();
    });

    it('should reject malformed input', () => {
      expect(() => decryptData('not-encrypted', TEST_USER_ID, TEST_SECRET)).toThrow();
    });
  });

  describe('isEncrypted', () => {
    it('should detect v4 format', () => {
      const encrypted = encryptData('test', TEST_USER_ID, TEST_SECRET);
      expect(isEncrypted(encrypted)).toBe(true);
    });

    it('should reject plaintext', () => {
      expect(isEncrypted('hello world')).toBe(false);
    });

    it('should reject null/undefined', () => {
      expect(isEncrypted(null)).toBe(false);
      expect(isEncrypted(undefined)).toBe(false);
    });

    it('should reject short strings', () => {
      expect(isEncrypted('abc')).toBe(false);
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
        const encrypted = encryptData(original, TEST_USER_ID, TEST_SECRET);
        const decrypted = decryptData(encrypted, TEST_USER_ID, TEST_SECRET);
        expect(decrypted).toBe(original);
      });
    });

    it('should produce unique ciphertexts for same plaintext (random salt/iv)', () => {
      const plaintext = 'Same message';
      const encrypted1 = encryptData(plaintext, TEST_USER_ID, TEST_SECRET);
      const encrypted2 = encryptData(plaintext, TEST_USER_ID, TEST_SECRET);
      expect(encrypted1).not.toBe(encrypted2);
    });
  });
});
