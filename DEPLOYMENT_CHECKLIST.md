# 🚀 AI-Pandit Deployment Checklist

## ✅ Phase 1: Local Development Setup

### 1. Install Backend Dependencies
```bash
cd backend
npm install
```

### 2. Run Database Migration
```bash
cd backend
npm run db:push
```

### 3. Build Backend
```bash
cd backend
npm run build
```

### 4. Start Backend (Local)
```bash
cd backend
npm run dev
# Server will start on http://localhost:8080
```

### 5. Install Frontend Dependencies
```bash
cd ..  # Go to root
npm install
```

### 6. Start Frontend (Local)
```bash
npm run dev
# Frontend will start on http://localhost:3000
```

---

## ✅ Phase 2: Backend Deployment (Hugging Face Spaces)

### 1. Create HF Space
- Go to: https://huggingface.co/spaces
- Click "Create New Space"
- Name: `ai-pandit-backend`
- Select: `Docker` SDK
- Hardware: `CPU free`

### 2. Push Backend Code
```bash
cd backend
git init
git add .
git commit -m "Initial backend deployment"
git push https://huggingface.co/spaces/YOUR_USERNAME/ai-pandit-backend main
```

### 3. Add Secrets in HF Space Settings
Go to Space → Settings → Secrets:

```env
TURSO_DATABASE_URL=libsql://ai-pandit-ashoksainiengineer.aws-ap-south-1.turso.io
TURSO_AUTH_TOKEN=eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3Njg0NTA3NDQsImlkIjoiMmNiMzEzZDctODBiZC00YmQ0LWFlYjctYmIxNDM1MGRmZWQ1IiwicmlkIjoiNmU0MzE1YTQtODIwMC00ZDlhLTg1YTItNGVkZTMyYzUyYzNlIn0.DflPLPc8OFnwuivqmFi6RXD-lzghUvyXS2EoZHlqXg00qCRp-1ayoNsW5q1nNLnkjrvizn1JXJfM4Bom95Y0Bw
CLERK_SECRET_KEY=sk_test_5y6ECBKB4faegrYiRkK3yZOoSnIyxwXCZaUeKbS1yA
CLERK_PUBLISHABLE_KEY=pk_test_c2VsZWN0LWNvZC05NS5jbGVyay5hY2NvdW50cy5kZXYk
AI_API_KEY=sk-or-v1-...
ENCRYPTION_SECRET=K9xM2nP5qR8sT1uV4wX7yZ0aB3cD6eF9gH2iJ5kL8mN=
NODE_ENV=production
PORT=7860
```

### 4. Verify Backend Health
```bash
curl https://YOUR_USERNAME-ai-pandit-backend.hf.space/
```

---

## ✅ Phase 3: Frontend Deployment (Vercel)

### 1. Update .env for Production
Edit `.env` file in root:
```env
NEXT_PUBLIC_BACKEND_URL=https://YOUR_USERNAME-ai-pandit-backend.hf.space
```

### 2. Deploy to Vercel
```bash
vercel --prod
```

Or connect GitHub repo to Vercel and deploy.

### 3. Add Environment Variables in Vercel
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_c2VsZWN0LWNvZC05NS5jbGVyay5hY2NvdW50cy5kZXYk
CLERK_SECRET_KEY=sk_test_5y6ECBKB4faegrYiRkK3yZOoSnIyxwXCZaUeKbS1yA
TURSO_DATABASE_URL=libsql://ai-pandit-ashoksainiengineer.aws-ap-south-1.turso.io
TURSO_AUTH_TOKEN=eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3Njg0NTA3NDQsImlkIjoiMmNiMzEzZDctODBiZC00YmQ0LWFlYjctYmIxNDM1MGRmZWQ1IiwicmlkIjoiNmU0MzE1YTQtODIwMC00ZDlhLTg1YTItNGVkZTMyYzUyYzNlIn0.DflPLPc8OFnwuivqmFi6RXD-lzghUvyXS2EoZHlqXg00qCRp-1ayoNsW5q1nNLnkjrvizn1JXJfM4Bom95Y0Bw
ENCRYPTION_SECRET=K9xM2nP5qR8sT1uV4wX7yZ0aB3cD6eF9gH2iJ5kL8mN=
```

---

## ✅ Phase 4: Clerk Configuration

### 1. Add Redirect URLs in Clerk Dashboard
Go to: https://dashboard.clerk.com → Your App → Settings → Redirect URLs

Add these URLs:
```
https://your-vercel-app.vercel.app/analysis-result
https://your-vercel-app.vercel.app/sign-in
https://your-vercel-app.vercel.app/sign-up
```

### 2. Add Allowed Origins in Clerk
Go to: Settings → CORS

Add:
```
https://your-vercel-app.vercel.app
https://your-username-ai-pandit-backend.hf.space
```

---

## ✅ Phase 5: OpenRouter Setup (For AI)

### 1. Get API Key
- Go to: https://openrouter.ai/keys
- Create new key
- Copy the key

### 2. Add to HF Space Secrets
```env
AI_API_KEY=sk-or-v1-...
AI_BASE_URL=https://openrouter.ai/api/v1
AI_MODEL=deepseek/deepseek-r1
```

---

## 🧪 Testing Checklist

### Backend Tests
- [ ] Health endpoint: `GET /`
- [ ] Queue submit: `POST /api/queue`
- [ ] Progress check: `GET /api/queue/progress/:id`
- [ ] SSE stream: `GET /api/stream/:id`

### Frontend Tests
- [ ] Sign up / Sign in
- [ ] Create BTR session
- [ ] Fill all 4 steps
- [ ] Submit analysis
- [ ] View progress
- [ ] View results

---

## 🚨 Troubleshooting

### CORS Errors
Add your Vercel domain to `backend/src/server.ts` allowedOrigins

### Database Errors
Check Turso connection: `npx turso db list`

### AI API Errors
Check OpenRouter key and balance

### Build Errors
Check TypeScript: `npm run typecheck`

---

## 💰 Cost Estimation (Monthly)

| Service | Free Tier | Your Usage |
|---------|-----------|------------|
| Vercel | 100GB | ~5GB |
| HF Spaces | 16GB RAM | Sufficient |
| Turso | 500MB | ~1MB |
| OpenRouter | Paid | ~$5-10/month |

**Total: ~$5-10/month for AI API only** ✅

---

**Status**: Ready for deployment 🕉️