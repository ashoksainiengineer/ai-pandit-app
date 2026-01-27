# Turso Database Setup Guide

## 🔑 API Keys Kahan Se Milegi

### Method 1: Turso CLI (Recommended)

```bash
# Step 1: Turso CLI install karo
npm install -g @turso/cli

# Step 2: Login karo
npx turso login

# Step 3: Database URL get karo
npx turso db show ai-pandit-db --url
# Output: libsql://ai-pandit-db-username.turso.io

# Step 4: Auth Token generate karo
npx turso db tokens create ai-pandit-db
# Output: eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9...
```

### Method 2: Turso Web Dashboard

1. Jao: https://app.turso.tech
2. Select your database
3. Click **"Settings"** tab

#### Database URL (TURSO_DATABASE_URL):
```
libsql://your-db-name-your-username.turso.io
```

#### Auth Token (TURSO_AUTH_TOKEN):
1. Click **"API Tokens"**
2. Click **"Generate Token"**
3. Select permissions: **Read/Write**
4. Copy the token (sirf ek baar dikhayega!)

---

## 📝 Environment Variables

### Backend (Hugging Face Spaces)
```env
TURSO_DATABASE_URL=libsql://your-db.turso.io
TURSO_AUTH_TOKEN=your_token_here
```

### Frontend (Vercel)
```env
TURSO_DATABASE_URL=libsql://your-db.turso.io
TURSO_AUTH_TOKEN=your_token_here
```

---

## ⚠️ Important Notes

1. **Token ek baar hi dikhata hai** - turant copy karo
2. **Token leak ho gaya** → revoke karke naya banao
3. **URL format**: `libsql://` hona chahiye, `https://` nahi
4. **Free Tier Limits**:
   - Reads: 500M/month
   - Writes: 10M/month
   - Storage: 5GB

---

## 🔧 Useful Commands

```bash
# Token revoke
npx turso db tokens revoke ai-pandit-db <token-name>

# Naya token with expiration
npx turso db tokens create ai-pandit-db --expiration 1y

# Database list
npx turso db list

# Database info
npx turso db show ai-pandit-db