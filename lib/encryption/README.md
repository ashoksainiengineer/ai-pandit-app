# 🔐 Encryption Module

## ⚠️ CRITICAL WARNING

**THIS MODULE CONTAINS CRYPTOGRAPHIC CODE THAT MUST NEVER BE MODIFIED.**

Any change to the encryption algorithm, key derivation, constants, or output format will **PERMANENTLY CORRUPT ALL EXISTING USER DATA**.

### 🛑 DO NOT:
- Modify any file in this directory
- Change the salt value
- Change the cipher algorithm
- Change the IV or key lengths
- Change the output format (iv:authTag:ciphertext)

### ✅ SAFE TO DO:
- Import and use the exported functions
- Add new functions in separate files
- Create wrapper modules

---

## Architecture

```
lib/encryption/
├── DANGER_DO_NOT_MODIFY.ts  # ⚠️ Core crypto - NEVER TOUCH
├── config.ts                # ⚠️ Secret loading - NEVER TOUCH
├── types.ts                 # TypeScript definitions
├── index.ts                 # Main exports
└── README.md                # This file
```

### File Purposes

| File | Purpose | Safe to Modify? |
|------|---------|-----------------|
| `DANGER_DO_NOT_MODIFY.ts` | Core cryptographic functions (encrypt, decrypt, deriveKey) | **NO** |
| `config.ts` | Loads and validates ENCRYPTION_SECRET | **NO** |
| `types.ts` | TypeScript interfaces and type definitions | With caution |
| `index.ts` | Main entry point and exports | **NO** |

---

## Usage

### Basic Encryption/Decryption

```typescript
import { encryptData, decryptData } from '@/lib/encryption';

const userId = 'user_123';
const secretData = 'My sensitive information';

// Encrypt
const encrypted = encryptData(secretData, userId);
// Result: "aBc123...:xYz789...:encryptedData..."

// Decrypt
const decrypted = decryptData(encrypted, userId);
// Result: "My sensitive information"
```

### Object Encryption

```typescript
import { encryptObject, decryptObject } from '@/lib/encryption';

const userData = {
    name: 'John Doe',
    email: 'john@example.com',
    ssn: '123-45-6789'
};

// Encrypt object
const encrypted = encryptObject(userData, userId);

// Decrypt object
const decrypted = decryptObject<typeof userData>(encrypted, userId);
```

### Safe Operations (Non-throwing)

```typescript
import { safeEncrypt, safeDecrypt, isEncrypted } from '@/lib/encryption';

// Returns null on failure instead of throwing
const encrypted = safeEncrypt(data, userId);
if (!encrypted) {
    console.log('Encryption failed');
}

// Returns null on failure
const decrypted = safeDecrypt(encryptedData, userId);
if (decrypted === null) {
    console.log('Decryption failed - wrong key or corrupted data');
}

// Check if data is encrypted
if (isEncrypted(data)) {
    const decrypted = decryptData(data, userId);
} else {
    // Data is plaintext
}
```

---

## Technical Details

### Algorithm: AES-256-GCM

- **Cipher**: AES-256 in Galois/Counter Mode (GCM)
- **Key Size**: 256 bits (32 bytes)
- **IV Size**: 128 bits (16 bytes)
- **Auth Tag**: 128 bits (16 bytes) - provides integrity
- **Key Derivation**: scrypt

### Key Derivation

```
Key = scrypt(userId + ENCRYPTION_SECRET, salt='salt', 32)
```

- Combines user-specific ID with master secret
- Uses scrypt for computationally expensive key derivation
- Same userId + secret always produces same key

### Output Format

```
base64(iv):base64(authTag):base64(ciphertext)
```

Example:
```
h7jN9v2LmPqRsTuV:AbC123XyZ789==:dGhpcyBpcyBhIHRlc3Q=
```

---

## Environment Configuration

### Required Environment Variable

```bash
ENCRYPTION_SECRET=your-cryptographically-secure-random-string-min-32-chars
```

### Requirements

- **Must be set**: Application will not start without it
- **Length**: Minimum 32 characters (64+ recommended)
- **Security**: Use cryptographically secure random string
- **Stability**: **NEVER CHANGE** once set (will corrupt all data)

### Generating a Secure Secret

```bash
# Generate 64-character random string
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Or use openssl
openssl rand -hex 32
```

---

## Security Considerations

### Data Integrity

AES-256-GCM provides:
- **Confidentiality**: Data cannot be read without the key
- **Integrity**: Any tampering is detected (auth tag validation)
- **Authenticity**: Verifies data came from legitimate source

### Key Security

- Each user has a unique key derived from their userId
- Master secret is never stored in code
- Keys are derived at runtime using scrypt

### Common Pitfalls

1. **Changing ENCRYPTION_SECRET**: Will make all data unrecoverable
2. **Modifying key derivation**: Will make all data unrecoverable
3. **Losing the secret**: No recovery possible

---

## Troubleshooting

### "Failed to decrypt data: invalid key or corrupted data"

**Causes:**
1. Wrong userId provided
2. ENCRYPTION_SECRET changed
3. Data was tampered with
4. Data corrupted during storage/transmission

**Solution:**
- Verify userId matches the one used for encryption
- Check ENCRYPTION_SECRET hasn't changed
- Check data integrity (not truncated or modified)

### "ENCRYPTION_SECRET is required"

**Cause:** Environment variable not set

**Solution:**
```bash
export ENCRYPTION_SECRET="your-secret-here"
```

---

## Migration & Versioning

### Current Version

**Version: 1.0.0-FROZEN**

This version is frozen. No modifications allowed.

### Future Changes

If cryptographic updates are needed:

1. Create new version in separate directory
2. Implement migration path for existing data
3. Support both versions during transition
4. Never modify existing frozen version

---

## For Developers

### ⚠️ Before You Edit

If you're considering modifying any file in this directory:

1. **STOP** - Don't do it
2. Read this warning again
3. Consult with security team
4. Understand you will corrupt user data
5. Create a new version instead

### Adding New Features

If you need additional encryption features:

```typescript
// In a NEW file, not in DANGER_DO_NOT_MODIFY.ts
import { encryptData, decryptData } from './index.js';

export function encryptWithMetadata(data: string, userId: string, metadata: object): string {
    const payload = JSON.stringify({ data, metadata, timestamp: Date.now() });
    return encryptData(payload, userId);
}
```

---

## Contact

For questions about this module:
- Security concerns: Contact security team
- Usage questions: Check examples above
- Bugs: Create issue with "CRITICAL" prefix

---

**Last Updated**: 2026-01-28  
**Version**: 1.0.0-FROZEN  
**Status**: PRODUCTION - DO NOT MODIFY
