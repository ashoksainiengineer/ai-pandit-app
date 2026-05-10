import { describe, it, expect } from 'vitest';
import { createEncryption } from '../crypto-factory.js';
import { parseSensitiveField, parseSensitiveObject } from '../parse-sensitive-field.js';

const SECRET = 'test-secret-at-least-32-characters-long!';
const USER_ID = 'uuid-user-12345';

describe('parseSensitiveField (v2 — no fallback)', () => {
  describe('encrypted data', () => {
    it('decrypts and parses JSON object', () => {
      const crypto = createEncryption(SECRET);
      const original = { name: 'Alice', age: 25 };
      const encrypted = crypto.encrypt(JSON.stringify(original), USER_ID);
      const result = parseSensitiveField<typeof original>(encrypted, USER_ID, [SECRET]);
      expect(result).toEqual(original);
    });

    it('decrypts and returns string for non-JSON content', () => {
      const crypto = createEncryption(SECRET);
      const encrypted = crypto.encrypt('simple text', USER_ID);
      const result = parseSensitiveField(encrypted, USER_ID, [SECRET]);
      expect(result).toBe('simple text');
    });

    it('returns defaultValue when decryption fails (wrong userId)', () => {
      const crypto = createEncryption(SECRET);
      const encrypted = crypto.encrypt('data', USER_ID);
      const result = parseSensitiveField(encrypted, 'wrong-user', [SECRET], 'fallback');
      expect(result).toBe('fallback');
    });

    it('returns defaultValue when decryption fails (wrong secret)', () => {
      const crypto = createEncryption(SECRET);
      const encrypted = crypto.encrypt('data', USER_ID);
      const result = parseSensitiveField(encrypted, USER_ID, ['wrong-secret-min-32-chars!!'], 'safe');
      expect(result).toBe('safe');
    });

    it('returns defaultValue for encrypted data with wrong userId and no defaultValue', () => {
      const crypto = createEncryption(SECRET);
      const encrypted = crypto.encrypt('data', USER_ID);
      const result = parseSensitiveField(encrypted, 'wrong-user', [SECRET]);
      expect(result).toBeNull();
    });
  });

  describe('plain data', () => {
    it('parses plain JSON objects', () => {
      const result = parseSensitiveField('{"x": 1, "y": 2}', USER_ID, [SECRET]);
      expect(result).toEqual({ x: 1, y: 2 });
    });

    it('parses plain JSON arrays', () => {
      const result = parseSensitiveField('[1, 2, 3]', USER_ID, [SECRET]);
      expect(result).toEqual([1, 2, 3]);
    });

    it('returns raw string for non-JSON plaintext', () => {
      const result = parseSensitiveField('hello world', USER_ID, [SECRET]);
      expect(result).toBe('hello world');
    });

    it('returns defaultValue for null input', () => {
      const result = parseSensitiveField(null, USER_ID, [SECRET], 'default');
      expect(result).toBe('default');
    });

    it('returns null for null input without defaultValue', () => {
      const result = parseSensitiveField(null, USER_ID, [SECRET]);
      expect(result).toBeNull();
    });

    it('handles undefined gracefully', () => {
      const result = parseSensitiveField(undefined, USER_ID, [SECRET], 'undef');
      expect(result).toBe('undef');
    });
  });

  describe('multi-secret support (key rotation)', () => {
    it('tries multiple secrets for decryption', () => {
      const c1 = createEncryption('secret-one-minimum-32-chars-long!!');
      const c2 = createEncryption('secret-two-minimum-32-chars-long!!');
      const encrypted = c1.encrypt('data', USER_ID);
      // Decrypt with c2's secret first (will fail), then c1's secret (will succeed)
      const result = parseSensitiveField(encrypted, USER_ID, [
        'secret-two-minimum-32-chars-long!!',
        'secret-one-minimum-32-chars-long!!',
      ]);
      expect(result).toBe('data');
    });
  });
});

describe('parseSensitiveObject', () => {
  it('returns parsed object on success', () => {
    const crypto = createEncryption(SECRET);
    const original = { valid: true };
    const encrypted = crypto.encrypt(JSON.stringify(original), USER_ID);
    const result = parseSensitiveObject<typeof original>(encrypted, USER_ID, [SECRET]);
    expect(result).toEqual(original);
  });

  it('throws when result is not an object', () => {
    const crypto = createEncryption(SECRET);
    const encrypted = crypto.encrypt('just a string, not JSON', USER_ID);
    expect(() => parseSensitiveObject(encrypted, USER_ID, [SECRET])).toThrow('not a valid object');
  });

  it('throws on null result', () => {
    expect(() => parseSensitiveObject(null, USER_ID, [SECRET])).toThrow('not a valid object');
  });
});
