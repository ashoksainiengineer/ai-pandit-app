export interface EncryptionSuccess {
    success: true;
    encrypted: string;
}

export interface EncryptionFailure {
    success: false;
    error: string;
}

export type EncryptionResult = EncryptionSuccess | EncryptionFailure;

export interface DecryptionSuccess {
    success: true;
    decrypted: string;
}

export interface DecryptionFailure {
    success: false;
    error: string;
}

export type DecryptionResult = DecryptionSuccess | DecryptionFailure;

export interface ObjectEncryptionSuccess<T> {
    success: true;
    encrypted: string;
    original: T;
}

export interface ObjectEncryptionFailure<T> {
    success: false;
    error: string;
    original: T;
}

export type ObjectEncryptionResult<T> = ObjectEncryptionSuccess<T> | ObjectEncryptionFailure<T>;

export interface ObjectDecryptionSuccess<T> {
    success: true;
    decrypted: T;
}

export interface ObjectDecryptionFailure {
    success: false;
    error: string;
}

export type ObjectDecryptionResult<T> = ObjectDecryptionSuccess<T> | ObjectDecryptionFailure;
