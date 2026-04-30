import { describe, it, expect } from 'vitest';
import { encrypt, decrypt } from '../index';

describe('Encryption Module', () => {
  describe('encrypt', () => {
    it('should encrypt birth data successfully', () => {
      const data = JSON.stringify({
        name: 'Test User',
        date: '1990-01-01',
        time: '12:00',
        latitude: 28.6139,
        longitude: 77.2090,
      });

      const encrypted = encrypt(data);
      expect(encrypted).toBeDefined();
      expect(typeof encrypted).toBe('string');
      expect(encrypted.length).toBeGreaterThan(0);
      expect(encrypted).not.toContain('Test User');
    });

    it('should encrypt empty string', () => {
      const encrypted = encrypt('');
      expect(encrypted).toBeDefined();
      expect(typeof encrypted).toBe('string');
    });

    it('should handle unicode characters', () => {
      const data = 'नमस्ते दुनिया 🌍';
      const encrypted = encrypt(data);
      expect(encrypted).toBeDefined();
      
      const decrypted = decrypt(encrypted);
      expect(decrypted).toBe(data);
    });
  });

  describe('decrypt', () => {
    it('should decrypt encrypted data correctly', () => {
      const original = JSON.stringify({ test: 'data', number: 123 });
      const encrypted = encrypt(original);
      const decrypted = decrypt(encrypted);
      
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

      const encrypted = encrypt(data);
      const decrypted = decrypt(encrypted);
      
      expect(JSON.parse(decrypted)).toEqual(JSON.parse(data));
    });
  });

  describe('round-trip encryption', () => {
    it('should maintain data integrity after encrypt/decrypt cycle', () => {
      const testCases = [
        'Simple string',
        '{"complex": "json", "nested": {"key": "value"}}',
        'Special chars: !@#$%^&*()',
        'Unicode: 你好世界 मराठी العربية',
      ];

      testCases.forEach((original) => {
        const encrypted = encrypt(original);
        const decrypted = decrypt(encrypted);
        expect(decrypted).toBe(original);
      });
    });
  });
});
