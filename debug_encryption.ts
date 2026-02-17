
import crypto from 'crypto';
import dotenv from 'dotenv';
import path from 'path';

// Manual config loading from backend/.env
dotenv.config({ path: path.resolve(process.cwd(), 'backend/.env') });

const SECRET = process.env.ENCRYPTION_SECRET;
console.log("SECRET (len):", SECRET ? SECRET.length : 0);
console.log("SECRET (first 5):", SECRET ? SECRET.substring(0, 5) : "N/A");

const V3_CONFIG = {
    ALGORITHM: 'aes-256-gcm',
    KEY_LENGTH: 32,
    IV_LENGTH: 12, // From DANGER file
    SALT_LENGTH: 16,
    AUTH_TAG_LENGTH: 16,
    SCRYPT_PARAMS: { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 },
    PREFIX: 'v3'
};

function deriveKeyV3(secret: string, salt: Buffer): Buffer {
    return crypto.scryptSync(secret, salt, V3_CONFIG.KEY_LENGTH, V3_CONFIG.SCRYPT_PARAMS);
}

function decryptV3(payload: string, secret: string): string {
    const parts = payload.split(':');
    if (parts.length !== 5) throw new Error('Invalid v3 format');

    const [, saltB64, ivB64, authTagB64, ciphertextB64] = parts;
    const salt = Buffer.from(saltB64, 'base64');
    const iv = Buffer.from(ivB64, 'base64');
    const authTag = Buffer.from(authTagB64, 'base64');
    const ciphertext = Buffer.from(ciphertextB64, 'base64');

    const derivedKey = deriveKeyV3(secret, salt);
    const decipher = crypto.createDecipheriv(V3_CONFIG.ALGORITHM, derivedKey, iv, {
        authTagLength: V3_CONFIG.AUTH_TAG_LENGTH
    } as any) as any;

    decipher.setAuthTag(authTag);
    return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
}

const cipherDOB = "v3:1vhYX916xuIdf0uAH+YjjA==:BnjVQohNxxeb5w/V:IxHjrscDQOkIZwjW7sSEcw==:clMWUh9vzVI90Q==";
const cipherTime = "v3:k0U7p3SfjCA2M5bTcJYt7g==:fDNQxCESet6FKQT0:Jt30JGgBrk8sIpU4W/LSsg==:+rd9/pFOboM=";
const cipherOffset = "v3:QAyR91AtAMjhiB1F1zZpMA==:aGugHhz+p2Xrz0ST:+7f0r+441cMDTUWN7GksUA==:31a/oVqLisFd3XPjiAmfBpMWGJs1H9oHnnIl9o3p2PTKMumDCjVwKqd0z93S3g7eMlCO9/Ak6j2MvmESMBJC";

console.log("\nTrying decryption...");

try {
    const dob = decryptV3(cipherDOB, SECRET!);
    console.log("✅ DOB Decrypted:", dob);
} catch (e) {
    console.error("❌ DOB Decryption Failed:", (e as Error).message);
}

try {
    const time = decryptV3(cipherTime, SECRET!);
    console.log("✅ Time Decrypted:", time);
} catch (e) {
    console.error("❌ Time Decryption Failed:", (e as Error).message);
}

try {
    const offset = decryptV3(cipherOffset, SECRET!);
    console.log("✅ Offset Decrypted:", offset);
    console.log("   Parsed:", JSON.parse(offset));
} catch (e) {
    console.error("❌ Offset Decryption Failed:", (e as Error).message);
}
