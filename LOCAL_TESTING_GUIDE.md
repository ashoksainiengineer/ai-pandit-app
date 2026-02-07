# Local Testing Commands - AI Pandit

Complete commands to test frontend and backend together locally.

---

## Prerequisites Check

```bash
# Check Node.js version (should be 18+)
node --version

# Check if ports are free (3000 for frontend, 7860 for backend)
lsof -i :3000
lsof -i :7860
```

---

## Terminal 1: Start Backend (Hugging Face Simulation)

```bash
# Navigate to project root
cd /home/ashoksainiengineer/Desktop/ai-pandit/ai-pandit

# Install backend dependencies
cd backend && npm install

# Build the backend (TypeScript compilation)
npm run build

# OR for development with watch mode
npm run dev
```

### Backend Environment Variables (backend/.env)

Create `backend/.env` file:

```env
# Server
NODE_ENV=development
PORT=7860

# Database (Turso)
TURSO_DATABASE_URL=libsql://your-db.turso.io
TURSO_AUTH_TOKEN=your-token

# AI (OpenRouter)
OPENROUTER_API_KEY=sk-or-v1-xxx
AI_MODEL=deepseek/deepseek-r1-0528
AI_BASE_URL=https://openrouter.ai/api/v1
AI_MAX_TOKENS=8000
AI_TIMEOUT_MS=180000

# Clerk
CLERK_SECRET_KEY=sk_test_xxx
CLERK_WEBHOOK_SECRET=whsec_xxx

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000

# Internal API Key (for queue endpoint)
INTERNAL_API_KEY=your-internal-key
```

### Start Backend Server

```bash
cd /home/ashoksainiengineer/Desktop/ai-pandit/ai-pandit/backend

# Production mode (compiled)
npm start

# OR development mode (with auto-reload)
npm run dev
```

**Verify backend is running:**
```bash
curl http://localhost:7860/api/health
```

---

## Terminal 2: Start Frontend (Next.js)

```bash
# Navigate to project root
cd /home/ashoksainiengineer/Desktop/ai-pandit/ai-pandit

# Install frontend dependencies
npm install

# Start Next.js dev server
npm run dev
```

### Frontend Environment Variables (.env.local)

Create `.env.local` file in project root:

```env
# Next.js
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
CLERK_SECRET_KEY=sk_test_xxx

# Backend (Hugging Face) URL
NEXT_PUBLIC_BACKEND_URL=http://localhost:7860

# Database
TURSO_DATABASE_URL=libsql://your-db.turso.io
TURSO_AUTH_TOKEN=your-token

# Encryption
ENCRYPTION_SECRET=your-encryption-secret-min-32-chars-long

# AI (for frontend logs)
NEXT_PUBLIC_AI_MODEL=deepseek/deepseek-r1-0528
```

**Verify frontend is running:**
```bash
# Should show "Waiting on localhost:3000"
# Open in browser: http://localhost:3000
```

---

## Terminal 3: Database (Turso) - Optional

```bash
# Install Turso CLI if not installed
curl -sSfL https://get.tur.so/install.sh | bash

# Login to Turso
turso login

# List databases
turso db list

# Connect to database shell
turso db shell your-database-name

# View sessions table
SELECT id, status, clerkId, createdAt FROM sessions ORDER BY createdAt DESC LIMIT 10;
```

---

## Quick Test Commands

### Test Backend Health
```bash
curl http://localhost:7860/api/health
curl http://localhost:7860/api/ping
```

### Test Queue Endpoint (with auth)
```bash
curl -X POST http://localhost:7860/api/queue \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-internal-key" \
  -d '{"sessionId": "test-session-id"}'
```

### Test Frontend Build
```bash
cd /home/ashoksainiengineer/Desktop/ai-pandit/ai-pandit
npm run build
```

---

## Running Both Together (One-Liner)

```bash
# Terminal 1 - Backend
cd /home/ashoksainiengineer/Desktop/ai-pandit/ai-pandit/backend && npm run dev

# Terminal 2 - Frontend  
cd /home/ashoksainiengineer/Desktop/ai-pandit/ai-pandit && npm run dev
```

---

## Testing Flow

1. **Start Backend** (Terminal 1)
   ```bash
   cd backend && npm run dev
   ```

2. **Start Frontend** (Terminal 2)
   ```bash
   npm run dev
   ```

3. **Open Browser**
   - Navigate to: `http://localhost:3000`
   - Sign in with Clerk
   - Fill birth details form
   - Check auto-save indicator (top-right)
   - Submit and verify queue processing

4. **Monitor Logs**
   - Backend: Check for "Session processing started"
   - Frontend: Check browser console for SSE connections

---

## Debugging Commands

### Check if ports are in use
```bash
# Find processes using port 3000
lsof -i :3000
kill -9 <PID>

# Find processes using port 7860
lsof -i :7860
kill -9 <PID>
```

### Clear Next.js cache
```bash
cd /home/ashoksainiengineer/Desktop/ai-pandit/ai-pandit
rm -rf .next
npm run dev
```

### Rebuild backend completely
```bash
cd /home/ashoksainiengineer/Desktop/ai-pandit/ai-pandit/backend
rm -rf dist
npm run build
npm start
```

### Check environment variables
```bash
# Backend
cd backend && node -e "console.log(require('./dist/config/index.js').config)"

# Frontend
cat .env.local
```

---

## Production Build Test

```bash
# Build frontend
cd /home/ashoksainiengineer/Desktop/ai-pandit/ai-pandit
npm run build

# Build backend
cd backend
npm run build

# Start production servers
cd backend && npm start &
cd .. && npm start
```

---

## Common Issues & Fixes

### Issue: Port already in use
```bash
kill $(lsof -t -i:3000)
kill $(lsof -t -i:7860)
```

### Issue: Database connection failed
```bash
# Check Turso token
turso db tokens create your-database-name
```

### Issue: Clerk auth not working
- Ensure `.env.local` has correct Clerk keys
- Check Clerk dashboard for allowed domains (add localhost:3000)

### Issue: Backend not connecting to frontend
- Verify `NEXT_PUBLIC_BACKEND_URL=http://localhost:7860`
- Check backend CORS settings allow localhost:3000

---

## Full Reset (Clean Slate)

```bash
# Kill all node processes
killall node

# Clear caches
rm -rf node_modules backend/node_modules
rm -rf .next backend/dist

# Reinstall
npm install
cd backend && npm install && cd ..

# Rebuild
cd backend && npm run build && cd ..
npm run build

# Start fresh
# Terminal 1: cd backend && npm start
# Terminal 2: npm start
```

---

## Summary

| Component | Command | Port | URL |
|-----------|---------|------|-----|
| Backend | `cd backend && npm run dev` | 7860 | http://localhost:7860 |
| Frontend | `npm run dev` | 3000 | http://localhost:3000 |
| Database | `turso db shell <name>` | - | - |

**Happy Testing! 🚀**
