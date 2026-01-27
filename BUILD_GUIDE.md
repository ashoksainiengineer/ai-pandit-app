# 🏗️ Build Guide - AI Pandit Backend

## 📋 Prerequisites

Make sure you have:
- Node.js 20+ installed
- npm installed
- All environment variables set

## 🔨 Build Commands

### Step 1: Install Dependencies
```bash
cd backend
npm install
```

### Step 2: Run TypeScript Compiler
```bash
npm run build
```

This will:
- Compile all `.ts` files in `src/` to `.js` in `dist/`
- Generate source maps (if configured)
- Check for TypeScript errors

### Step 3: Check for Errors
```bash
npm run typecheck
```

### Step 4: Start Production Server
```bash
npm start
```

Or with GC exposed:
```bash
node --expose-gc dist/server.js
```

---

## 🐛 Common Build Errors & Fixes

### Error 1: "Cannot find module 'express'"
```bash
npm install
```

### Error 2: "TypeScript errors"
```bash
npm run typecheck
# Fix any type errors, then rebuild
npm run build
```

### Error 3: "Cannot find module '../lib/types'"
This happens if duplicate lib files exist. Already fixed - we deleted `/lib/` folder.

### Error 4: "outDir not specified"
Check `tsconfig.json` - should have `"outDir": "./dist"`

---

## 📁 What Gets Built

**Source**: `backend/src/`
```
src/
├── server.ts           → dist/server.js
├── routes/
│   └── calculate.ts    → dist/routes/calculate.js
├── lib/
│   └── queue-manager.ts → dist/lib/queue-manager.js
└── ...
```

**Output**: `backend/dist/`
```
dist/
├── server.js
├── routes/
│   └── calculate.js
├── lib/
│   └── queue-manager.js
└── ...
```

---

## 🚀 Full Deployment Workflow

```bash
# 1. Go to backend folder
cd backend

# 2. Install deps
npm install

# 3. Build
npm run build

# 4. Test locally
npm start

# 5. If successful, push to HF Spaces
git add .
git commit -m "Build successful"
git push https://huggingface.co/spaces/YOUR_USERNAME/ai-pandit-backend
```

---

## 🔧 Alternative Build (Development)

```bash
# Run TypeScript directly (no build needed)
npm run dev
```

This uses `tsx` to run TypeScript directly - good for development, NOT for production.

---

## ✅ Verification Checklist

After `npm run build`, verify:
- [ ] `dist/` folder exists
- [ ] `dist/server.js` exists
- [ ] No TypeScript errors in output
- [ ] `npm start` works without errors
- [ ] Health endpoint responds: `curl http://localhost:7860/`

---

## 🎯 Production Build (HF Spaces)

The Dockerfile automatically runs these commands:
```dockerfile
COPY src/ ./src/
COPY tsconfig.json ./
RUN npm run build
CMD ["node", "--expose-gc", "dist/server.js"]
```

So you just need to push to HF Spaces - it builds automatically!