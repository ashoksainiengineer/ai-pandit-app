/**
 * Encrypt data using AES-256-GCM
 * Returns: base64(iv:authTag:encryptedData)
 */
export declare function encryptData(data: string, userId: string): string;
/**
 * Decrypt data using AES-256-GCM
 * Input: base64(iv:authTag:encryptedData)
 */
export declare function decryptData(encryptedString: string, userId: string): string;
/**
 * Encrypt an object (converts to JSON first)
 */
export declare function encryptObject<T>(obj: T, userId: string): string;
/**
 * Decrypt to an object (parses JSON after decryption)
 */
export declare function decryptObject<T>(encryptedString: string, userId: string): T;
/**
 * Check if a string looks like encrypted data
 */
export declare function isEncrypted(data: string): boolean;
/**
 * Safely encrypt - returns original if encryption fails
 */
export declare function safeEncrypt(data: string, userId: string): string;
/**
 * Safely decrypt - returns original if decryption fails
 */
export declare function safeDecrypt(data: string, userId: string): string;
//# sourceMappingURL=crypto.d.ts.map