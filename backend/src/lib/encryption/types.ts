/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️
 *                                                                               
 *                         🛑  DANGER: DO NOT MODIFY  🛑                         
 *                                                                               
 *    CHANGING THESE TYPES MAY BREAK TYPE SAFETY AND LEAD TO DATA CORRUPTION.    
 *                                                                               
 * ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * ENCRYPTION TYPES
 * Version: 1.0.0-FROZEN
 *
 * Purpose: TypeScript type definitions for the encryption module.
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 */

/**
 * Result type for successful encryption operations.
 */
export interface EncryptionSuccess {
    success: true;
    encrypted: string;
}

/**
 * Result type for failed encryption operations.
 */
export interface EncryptionFailure {
    success: false;
    error: string;
}

/**
 * Union type for encryption operation results.
 */
export type EncryptionResult = EncryptionSuccess | EncryptionFailure;

/**
 * Result type for successful decryption operations.
 */
export interface DecryptionSuccess {
    success: true;
    decrypted: string;
}

/**
 * Result type for failed decryption operations.
 */
export interface DecryptionFailure {
    success: false;
    error: string;
}

/**
 * Union type for decryption operation results.
 */
export type DecryptionResult = DecryptionSuccess | DecryptionFailure;

/**
 * Generic type for object encryption success.
 */
export interface ObjectEncryptionSuccess<T> {
    success: true;
    encrypted: string;
    original: T;
}

/**
 * Generic type for object encryption failure.
 */
export interface ObjectEncryptionFailure<T> {
    success: false;
    error: string;
    original: T;
}

/**
 * Generic union type for object encryption results.
 */
export type ObjectEncryptionResult<T> = ObjectEncryptionSuccess<T> | ObjectEncryptionFailure<T>;

/**
 * Generic type for object decryption success.
 */
export interface ObjectDecryptionSuccess<T> {
    success: true;
    decrypted: T;
}

/**
 * Generic type for object decryption failure.
 */
export interface ObjectDecryptionFailure {
    success: false;
    error: string;
}

/**
 * Generic union type for object decryption results.
 */
export type ObjectDecryptionResult<T> = ObjectDecryptionSuccess<T> | ObjectDecryptionFailure;

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️
 *
 *                        END OF TYPE DEFINITIONS
 *
 * ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️
 * ═══════════════════════════════════════════════════════════════════════════════
 */
