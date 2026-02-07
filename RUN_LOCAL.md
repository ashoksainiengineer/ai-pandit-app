# Local Development Commands

Copy-paste these commands directly into your terminals.

---

## TERMINAL 1: Backend (Port 7860)

```bash
cd /home/ashoksainiengineer/Desktop/ai-pandit/ai-pandit/backend && npm install && npm run dev
```

**Wait for:** `Server listening on port 7860`

---

## TERMINAL 2: Frontend (Port 3000)

```bash
cd /home/ashoksainiengineer/Desktop/ai-pandit/ai-pandit && npm install && npm run dev
```

**Wait for:** `Ready on http://localhost:3000`

---

## First Time Setup (Only Once)

Create these files before running:

### File: `/backend/.env`
```env
NODE_ENV=development
PORT=7860
TURSO_DATABASE_URL=libsql://your-db.turso.io
TURSO_AUTH_TOKEN=your-token
OPENROUTER_API_KEY=sk-or-v1-xxx
AI_MODEL=deepseek/deepseek-r1-0528
AI_BASE_URL=https://openrouter.ai/api/v1
CLERK_SECRET_KEY=sk_test_xxx
FRONTEND_URL=http://localhost:3000
INTERNAL_API_KEY=local-dev-key
ENCRYPTION_SECRET=your-secret-32-chars-min
RSS_THRESHOLD_GB=8
HEAP_THRESHOLD_GB=8
MAX_CONCURRENT_SESSIONS=3
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
REQUEST_TIMEOUT_MS=300000
AI_TIMEOUT_MS=180000
```

### File: `/.env.local` (project root)
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
CLERK_SECRET_KEY=sk_test_xxx
NEXT_PUBLIC_BACKEND_URL=http://localhost:7860
TURSO_DATABASE_URL=libsql://your-db.turso.io
TURSO_AUTH_TOKEN=your-token
ENCRYPTION_SECRET=your-secret-32-chars-min
```

---

## Quick Check

```bash
curl http://localhost:7860/api/health
```

Should return: `{"status":"ok"}`

---

## Open Browser

http://localhost:3000

---

## Kill Ports (If Busy)

```bash
kill $(lsof -t -i:3000) 2>/dev/null; kill $(lsof -t -i:7860) 2>/dev/null
```
