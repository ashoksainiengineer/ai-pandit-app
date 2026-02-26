import { describe, it, expect, vi, beforeEach } from 'vitest';

// ═══════════════════════════════════════════════════════════════════════════
// MOCKS — Must use correct relative paths from crypto-adapter.ts location
// ═══════════════════════════════════════════════════════════════════════════

vi.mock('../encryption/v2.js', () => ({
    encrypt: vi.fn((plaintext: string, _secret: string) => `salt:iv:tag:${Buffer.from(plaintext).toString('base64')}`),
    decrypt: vi.fn((encrypted: string, _secret: string) => {
        const parts = encrypted.split(':');
        return Buffer.from(parts[3], 'base64').toString('utf8');
    }),
    isEncrypted: vi.fn((data: string) => {
        const parts = data.split(':');
        return parts.length === 3 || parts.length === 4;
    }),
    isV2Format: vi.fn((data: string) => data.split(':').length === 4),
    isV1Format: vi.fn((data: string) => data.split(':').length === 3),
    decryptV1: vi.fn((_encrypted: string, _userId: string, _secret: string) => 'decrypted_v1'),
    migrateToV2: vi.fn((_data: string, _secret: string, _userId: string) => ({
        success: true,
        data: 'migrated_data',
    })),
}));

vi.mock('../encryption/index.js', () => ({
    safeDecrypt: vi.fn(() => null),
}));

vi.mock('../../config/index.js', () => ({
    encryptionConfig: {
        secret: 'test-secret-32-chars-long-padding123',
    },
}));

vi.mock('../logger.js', () => ({
    logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

import {
    encryptData,
    decryptData,
    safeDecrypt,
    safeEncrypt,
    isEncrypted,
    isV2Format,
    isV1Format,
    migrateIfNeeded,
    batchMigrate,
} from '../crypto-adapter.js';

describe('Crypto Adapter - Unit Tests', () => {

    beforeEach(() => {
        vi.clearAllMocks();
    });

    // ═════ Format Detection ═════

    describe('isEncrypted', () => {
        it('should detect v2 format (4 colon-separated parts)', () => {
            expect(isEncrypted('salt:iv:authTag:ciphertext')).toBe(true);
        });

        it('should detect v1 format (3 colon-separated parts)', () => {
            expect(isEncrypted('iv:authTag:ciphertext')).toBe(true);
        });

        it('should return false for plain text', () => {
            expect(isEncrypted('Hello World')).toBe(false);
        });
    });

    describe('isV2Format', () => {
        it('should return true for 4-part format', () => {
            expect(isV2Format('salt:iv:authTag:ciphertext')).toBe(true);
        });

        it('should return false for 3-part format', () => {
            expect(isV2Format('iv:authTag:ciphertext')).toBe(false);
        });
    });

    describe('isV1Format', () => {
        it('should return true for 3-part format', () => {
            expect(isV1Format('iv:authTag:ciphertext')).toBe(true);
        });

        it('should return false for 4-part format', () => {
            expect(isV1Format('salt:iv:authTag:ciphertext')).toBe(false);
        });
    });

    // ═════ Encryption ═════

    describe('encryptData', () => {
        it('should return a v2 format string', () => {
            const result = encryptData('Hello', 'user-123');
            expect(typeof result).toBe('string');
            expect(result.split(':').length).toBe(4);
        });

        it('should produce non-empty output', () => {
            const result = encryptData('data', 'user-1');
            expect(result.length).toBeGreaterThan(0);
        });
    });

    // ═════ Decryption ═════

    describe('decryptData', () => {
        it('should decrypt v2 format successfully', () => {
            const encrypted = encryptData('test-plaintext', 'user-1');
            const decrypted = decryptData(encrypted, 'user-1');
            expect(decrypted).toBe('test-plaintext');
        });

        it('should fall back to v1 decryption for 3-part format', () => {
            const result = decryptData('iv:tag:cipher', 'user-1');
            expect(result).toBe('decrypted_v1');
        });

        it('should throw on unknown format', () => {
            expect(() => decryptData('plain text no colons', 'user-1')).toThrow('Invalid encrypted data format');
        });
    });

    // ═════ Safe Operations ═════

    describe('safeEncrypt', () => {
        it('should return null for null input', () => {
            expect(safeEncrypt(null, 'user-1')).toBeNull();
        });

        it('should return null for undefined input', () => {
            expect(safeEncrypt(undefined, 'user-1')).toBeNull();
        });

        it('should return encrypted string for valid input', () => {
            const result = safeEncrypt('Hello', 'user-1');
            expect(result).not.toBeNull();
            expect(typeof result).toBe('string');
        });
    });

    describe('safeDecrypt', () => {
        it('should return null for null input', () => {
            expect(safeDecrypt(null, 'user-1')).toBeNull();
        });

        it('should return null for undefined input', () => {
            expect(safeDecrypt(undefined, 'user-1')).toBeNull();
        });

        it('should return null on decryption failure', () => {
            expect(safeDecrypt('not-encrypted', 'user-1')).toBeNull();
        });
    });

    // ═════ Migration ═════

    describe('migrateIfNeeded', () => {
        it('should skip migration for already-v2 data', () => {
            const result = migrateIfNeeded('salt:iv:tag:cipher', 'user-1');
            expect(result.success).toBe(true);
            expect(result.migrated).toBe(false);
            expect(result.oldFormat).toBe('v2');
        });

        it('should migrate v1 data to v2', () => {
            const result = migrateIfNeeded('iv:tag:cipher', 'user-1');
            expect(result.success).toBe(true);
            expect(result.migrated).toBe(true);
            expect(result.oldFormat).toBe('v1');
        });

        it('should encrypt plaintext as v2', () => {
            const result = migrateIfNeeded('plain text', 'user-1');
            expect(result.success).toBe(true);
            expect(result.migrated).toBe(true);
            expect(result.oldFormat).toBe('plaintext');
        });
    });

    // ═════ Batch Migration ═════

    describe('batchMigrate', () => {
        it('should process all items', async () => {
            const items = [
                { id: '1', data: 'iv:tag:cipher', userId: 'u1' },
                { id: '2', data: 'salt:iv:tag:cipher', userId: 'u2' },
                { id: '3', data: 'plain text', userId: 'u3' },
            ];
            const result = await batchMigrate(items);
            expect(result.total).toBe(3);
            expect(result.migrated + result.failed).toBeLessThanOrEqual(3);
        });

        it('should call onProgress callback', async () => {
            const progress = vi.fn();
            await batchMigrate([{ id: '1', data: 'test', userId: 'u1' }], progress);
            expect(progress).toHaveBeenCalledWith(1, 1);
        });
    });
});
