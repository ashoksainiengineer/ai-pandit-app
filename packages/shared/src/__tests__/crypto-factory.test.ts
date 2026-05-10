import { describe, it, expect } from 'vitest';
import { createEncryption } from '../crypto-factory.js';

const SECRET = 'test-secret-at-least-32-characters-long!!';
const USER_A = 'uuid-user-a-12345';
const USER_B = 'uuid-user-b-67890';
const crypto = createEncryption(SECRET);

describe('EncryptionInstance (via createEncryption)', () => {
  describe('factory validation', () => {
    it('creates instance with valid secret (≥32 chars)', () => {
      expect(() => createEncryption('a'.repeat(32))).not.toThrow();
    });

    it('throws on shorter secret', () => {
      expect(() => createEncryption('short')).toThrow(/at least 32/);
    });

    it('throws on empty secret', () => {
      expect(() => createEncryption('')).toThrow(/at least 32/);
    });
  });

  describe('encrypt → decrypt round-trip', () => {
    const cases = [
      'simple string',
      JSON.stringify({ key: 'value', nested: { a: 1 } }),
      'special: !@#$%^&*()_+',
      'unicode: नमस्ते दुनिया 🌍 你好世界 العربية',
      '',
      'x'.repeat(10000),
    ];

    cases.forEach((plaintext) => {
      const label = plaintext.length > 50 ? `large payload (${plaintext.length} chars)` : `"${plaintext.slice(0, 30)}"`;
      it(`round-trips: ${label}`, () => {
        const encrypted = crypto.encrypt(plaintext, USER_A);
        expect(encrypted.startsWith('v4:')).toBe(true);
        expect(crypto.decrypt(encrypted, USER_A)).toBe(plaintext);
      });
    });
  });

  describe('encrypt', () => {
    it('produces v4 prefixed ciphertext', () => {
      const encrypted = crypto.encrypt('hello', USER_A);
      expect(encrypted.startsWith('v4:')).toBe(true);
    });

    it('produces unique ciphertexts for same input (random IV/salt)', () => {
      const e1 = crypto.encrypt('same', USER_A);
      const e2 = crypto.encrypt('same', USER_A);
      expect(e1).not.toBe(e2);
    });

    it('produces different ciphertexts for different userIds', () => {
      const e1 = crypto.encrypt('data', USER_A);
      const e2 = crypto.encrypt('data', USER_B);
      expect(e1).not.toBe(e2);
    });

    it('does not contain plaintext in output', () => {
      const encrypted = crypto.encrypt('PII: John Doe, 1990-01-01', USER_A);
      expect(encrypted).not.toContain('John');
      expect(encrypted).not.toContain('1990');
    });
  });

  describe('decrypt', () => {
    it('throws on wrong userId (AAD binding)', () => {
      const encrypted = crypto.encrypt('secret', USER_A);
      expect(() => crypto.decrypt(encrypted, USER_B)).toThrow();
    });

    it('throws on non-v4 input', () => {
      expect(() => crypto.decrypt('plain-text', USER_A)).toThrow(/v4 prefix/);
    });

    it('throws on malformed v4 input', () => {
      expect(() => crypto.decrypt('v4:bad:format', USER_A)).toThrow();
    });
  });

  describe('isEncrypted', () => {
    it('returns true for encrypted data', () => {
      const encrypted = crypto.encrypt('test', USER_A);
      expect(crypto.isEncrypted(encrypted)).toBe(true);
    });

    it('returns false for plaintext', () => {
      expect(crypto.isEncrypted('hello')).toBe(false);
    });

    it('returns false for null/undefined', () => {
      expect(crypto.isEncrypted(null)).toBe(false);
      expect(crypto.isEncrypted(undefined)).toBe(false);
    });
  });

  describe('parseField', () => {
    it('decrypts v4 encrypted JSON to object', () => {
      const original = { name: 'Test', age: 30 };
      const encrypted = crypto.encrypt(JSON.stringify(original), USER_A);
      const result = crypto.parseField<typeof original>(encrypted, USER_A);
      expect(result).toEqual(original);
    });

    it('decrypts v4 encrypted non-JSON to string', () => {
      const encrypted = crypto.encrypt('just text', USER_A);
      const result = crypto.parseField(encrypted, USER_A);
      expect(result).toBe('just text');
    });

    it('parses plain JSON without decryption', () => {
      const result = crypto.parseField('[1, 2, 3]', USER_A);
      expect(result).toEqual([1, 2, 3]);
    });

    it('returns raw string for non-JSON plaintext', () => {
      const result = crypto.parseField('plain text here', USER_A);
      expect(result).toBe('plain text here');
    });

    it('returns defaultValue for null input', () => {
      expect(crypto.parseField(null, USER_A, 'fallback')).toBe('fallback');
    });

    it('returns null for null input without defaultValue', () => {
      expect(crypto.parseField(null, USER_A)).toBeNull();
    });

    it('returns defaultValue when decryption fails (wrong userId)', () => {
      const encrypted = crypto.encrypt('data', USER_A);
      const result = crypto.parseField(encrypted, USER_B, 'safe-fallback');
      expect(result).toBe('safe-fallback');
    });

    it('handles empty string encrypted data', () => {
      const encrypted = crypto.encrypt('', USER_A);
      const result = crypto.parseField(encrypted, USER_A);
      expect(result).toBe('');
    });
  });

  describe('cross-instance compatibility', () => {
    it('two instances with same secret can decrypt each others data', () => {
      const c1 = createEncryption(SECRET);
      const c2 = createEncryption(SECRET);
      const encrypted = c1.encrypt('shared secret', USER_A);
      expect(c2.decrypt(encrypted, USER_A)).toBe('shared secret');
    });

    it('instances with different secrets cannot decrypt', () => {
      const c1 = createEncryption(SECRET);
      const c2 = createEncryption('different-secret-min-32-characters!!');
      const encrypted = c1.encrypt('data', USER_A);
      expect(() => c2.decrypt(encrypted, USER_A)).toThrow();
    });
  });
});
