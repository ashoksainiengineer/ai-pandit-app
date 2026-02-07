/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * ENCRYPTION MODULE TESTS - v3
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import crypto from 'crypto';

// 1. Initialize environment BEFORE importing encryption modules
const TEST_SECRET = 'test-encryption-secret-for-testing-only-32chars';
process.env.ENCRYPTION_SECRET = TEST_SECRET;
process.env.NODE_ENV = 'test';

// 2. Dynamic import to ensure process.env is set
const {
    encryptData,
    decryptData,
    safeEncrypt,
    safeDecrypt,
    encryptObject,
    decryptObject,
    isEncrypted,
} = await import('./index.js');

const TEST_USER_ID = 'test_user_12345';

// Test results
let passed = 0;
let failed = 0;

function test(name: string, fn: () => void) {
    try {
        fn();
        console.log(`✅ ${name}`);
        passed++;
    } catch (error: any) {
        console.error(`❌ ${name}`);
        console.error(`   ${error?.message || error}`);
        failed++;
    }
}

function assertEqual(actual: unknown, expected: unknown, message?: string) {
    if (actual !== expected) {
        throw new Error(message || `Expected ${expected}, got ${actual}`);
    }
}

function assertTrue(value: boolean, message?: string) {
    if (!value) {
        throw new Error(message || 'Expected true, got false');
    }
}

// Run tests
console.log('\n🔐 Running Encryption Module Tests (v3 Implementation)\n');

// Test 1: Basic encryption/decryption
test('Basic v3 encryption and decryption', () => {
    const plaintext = 'Hello, World!';
    const encrypted = encryptData(plaintext, TEST_USER_ID);
    assertTrue(encrypted.startsWith('v3:'), 'Should use v3 prefix');
    const decrypted = decryptData(encrypted, TEST_USER_ID);
    assertEqual(decrypted, plaintext);
});

// Test 2: Encrypted data has correct format
test('v3 encrypted data format is correct (5 parts)', () => {
    const plaintext = 'Test data';
    const encrypted = encryptData(plaintext, TEST_USER_ID);
    const parts = encrypted.split(':');
    assertEqual(parts.length, 5, 'Should have 5 parts separated by colons (v3:salt:iv:authTag:ciphertext)');
    assertTrue(isEncrypted(encrypted), 'isEncrypted should return true');
});

// Test 3: Backward compatibility (v2 simulation)
test('Backward compatibility - can decrypt v2-like format (3 parts)', () => {
    const secret = TEST_SECRET;
    const plaintext = 'Legacy v2 data';
    const iv = crypto.randomBytes(12);
    const key = crypto.createHash('sha256').update(secret).digest();
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv) as any;
    const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();

    const v2Payload = [
        iv.toString('base64'),
        authTag.toString('base64'),
        ciphertext.toString('base64')
    ].join(':');

    const decrypted = decryptData(v2Payload, TEST_USER_ID);
    assertEqual(decrypted, plaintext, 'Should successfully decrypt v2 format');
});

// Test 4: Different plaintext produces different ciphertext
test('Different plaintexts produce different ciphertexts', () => {
    const encrypted1 = encryptData('Message 1', TEST_USER_ID);
    const encrypted2 = encryptData('Message 2', TEST_USER_ID);
    assertTrue(encrypted1 !== encrypted2, 'Ciphertexts should be different');
});

// Test 5: Same plaintext produces different ciphertext
test('Same plaintext produces different ciphertext (random salt/iv)', () => {
    const plaintext = 'Same message';
    const encrypted1 = encryptData(plaintext, TEST_USER_ID);
    const encrypted2 = encryptData(plaintext, TEST_USER_ID);
    assertTrue(encrypted1 !== encrypted2, 'Ciphertexts should be different due to random salt/iv');
});

// Test 6: Object encryption/decryption
test('Object encryption and decryption', () => {
    const obj = { name: 'John', age: 30, active: true };
    const encrypted = encryptObject(obj, TEST_USER_ID);
    const decrypted = decryptObject<typeof obj>(encrypted, TEST_USER_ID);
    assertEqual(decrypted.name, obj.name);
    assertEqual(decrypted.age, obj.age);
    assertEqual(decrypted.active, obj.active);
});

// Summary
console.log('\n' + '='.repeat(50));
console.log(`Tests completed: ${passed} passed, ${failed} failed`);
console.log('='.repeat(50) + '\n');

// Exit with appropriate code
process.exit(failed > 0 ? 1 : 0);
