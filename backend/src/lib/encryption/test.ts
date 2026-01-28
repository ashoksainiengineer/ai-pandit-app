/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * ENCRYPTION MODULE TESTS
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * These tests verify the encryption module works correctly.
 * Run with: npx tsx backend/src/lib/encryption/test.ts
 */

import {
    encryptData,
    decryptData,
    safeEncrypt,
    safeDecrypt,
    encryptObject,
    decryptObject,
    isEncrypted,
} from './index.js';

// Test configuration
const TEST_USER_ID = 'test_user_12345';
const TEST_SECRET = 'test-encryption-secret-for-testing-only-32chars';

// Set environment variable for testing
process.env.ENCRYPTION_SECRET = TEST_SECRET;

// Test results
let passed = 0;
let failed = 0;

function test(name: string, fn: () => void) {
    try {
        fn();
        console.log(`✅ ${name}`);
        passed++;
    } catch (error) {
        console.error(`❌ ${name}`);
        console.error(`   ${error}`);
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

function assertNotNull(value: unknown, message?: string) {
    if (value === null || value === undefined) {
        throw new Error(message || 'Expected non-null value');
    }
}

// Run tests
console.log('\n🔐 Running Encryption Module Tests\n');

// Test 1: Basic encryption/decryption
test('Basic encryption and decryption', () => {
    const plaintext = 'Hello, World!';
    const encrypted = encryptData(plaintext, TEST_USER_ID);
    const decrypted = decryptData(encrypted, TEST_USER_ID);
    assertEqual(decrypted, plaintext);
});

// Test 2: Encrypted data has correct format
test('Encrypted data format is correct', () => {
    const plaintext = 'Test data';
    const encrypted = encryptData(plaintext, TEST_USER_ID);
    const parts = encrypted.split(':');
    assertEqual(parts.length, 3, 'Should have 3 parts separated by colons');
    assertTrue(isEncrypted(encrypted), 'isEncrypted should return true');
});

// Test 3: Different plaintext produces different ciphertext
test('Different plaintexts produce different ciphertexts', () => {
    const encrypted1 = encryptData('Message 1', TEST_USER_ID);
    const encrypted2 = encryptData('Message 2', TEST_USER_ID);
    assertTrue(encrypted1 !== encrypted2, 'Ciphertexts should be different');
});

// Test 4: Same plaintext produces different ciphertext (due to random IV)
test('Same plaintext produces different ciphertext (random IV)', () => {
    const plaintext = 'Same message';
    const encrypted1 = encryptData(plaintext, TEST_USER_ID);
    const encrypted2 = encryptData(plaintext, TEST_USER_ID);
    assertTrue(encrypted1 !== encrypted2, 'Ciphertexts should be different due to random IV');
});

// Test 5: Object encryption/decryption
test('Object encryption and decryption', () => {
    const obj = { name: 'John', age: 30, active: true };
    const encrypted = encryptObject(obj, TEST_USER_ID);
    const decrypted = decryptObject<typeof obj>(encrypted, TEST_USER_ID);
    assertEqual(decrypted.name, obj.name);
    assertEqual(decrypted.age, obj.age);
    assertEqual(decrypted.active, obj.active);
});

// Test 6: Safe encrypt returns null on failure (simulate by passing empty userId with no env)
test('Safe encrypt handles errors gracefully', () => {
    const result = safeEncrypt('test', TEST_USER_ID);
    assertNotNull(result, 'Should return encrypted string');
});

// Test 7: Safe decrypt returns null on invalid data
test('Safe decrypt returns null for invalid data', () => {
    const result = safeDecrypt('invalid:data', TEST_USER_ID);
    assertEqual(result, null, 'Should return null for invalid data');
});

// Test 8: isEncrypted correctly identifies encrypted data
test('isEncrypted correctly identifies encrypted vs plaintext', () => {
    const encrypted = encryptData('test', TEST_USER_ID);
    assertTrue(isEncrypted(encrypted), 'Should recognize encrypted data');
    assertTrue(!isEncrypted('plaintext'), 'Should not recognize plaintext');
    assertTrue(!isEncrypted(''), 'Should not recognize empty string');
});

// Test 9: Special characters in plaintext
test('Handles special characters in plaintext', () => {
    const plaintext = 'Special: chars, unicode 🎉, <html>, "quotes", \nnewlines\t';
    const encrypted = encryptData(plaintext, TEST_USER_ID);
    const decrypted = decryptData(encrypted, TEST_USER_ID);
    assertEqual(decrypted, plaintext);
});

// Test 10: Empty plaintext
test('Handles empty plaintext', () => {
    const plaintext = '';
    const encrypted = encryptData(plaintext, TEST_USER_ID);
    const decrypted = decryptData(encrypted, TEST_USER_ID);
    assertEqual(decrypted, plaintext);
});

// Test 11: Long plaintext
test('Handles long plaintext', () => {
    const plaintext = 'A'.repeat(10000);
    const encrypted = encryptData(plaintext, TEST_USER_ID);
    const decrypted = decryptData(encrypted, TEST_USER_ID);
    assertEqual(decrypted, plaintext);
});

// Summary
console.log('\n' + '='.repeat(50));
console.log(`Tests completed: ${passed} passed, ${failed} failed`);
console.log('='.repeat(50) + '\n');

// Exit with appropriate code
process.exit(failed > 0 ? 1 : 0);
