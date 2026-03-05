# AI-Pandit — Vedic Astrology Birth Time Rectification Engine

Production-grade BTR system that determines exact birth time (to seconds precision) using Swiss Ephemeris calculations, Vedic astrology engines, and AI-driven multi-stage analysis.

---

## ⚠️ GOLDEN RULES FOR AI ASSISTANTS

### 🚫 Rule #1: NEVER Commit/Push Without Permission
```
❌ NEVER run: git commit / git push without asking user first
✅ ALWAYS ask: "Should I commit and push these changes?"
```

**Why?**
- User may want to review changes first
- User may want to modify commit message
- User may want to split into multiple commits
- User may want to test before pushing

### 🤖 AI Assistant Workflow
1. Make changes
2. Show summary of changes
3. **ASK** before committing: "Should I commit these changes?"
4. **ASK** before pushing: "Should I push to remote?"
5. Wait for user confirmation

---

## Architecture

Turborepo monorepo with npm workspaces:

```
apps/web      → Next.js 15 frontend (React 18, TailwindCSS, Zustand, Clerk Auth)
apps/api      → Express.js backend (BTR engine, Swiss Ephemeris, DeepSeek AI, Drizzle ORM)
packages/db   → Shared Drizzle schema + Turso (libSQL) connection
packages/shared → Shared TypeScript types, Zod schemas, BTR types
```

## Commands

```bash
# Root (Turbo)
npm run dev              # Start all services (frontend + backend)
npm run build            # Build all packages
npm run lint             # Lint all packages

# Frontend (apps/web)
cd apps/web && npm run dev          # Next.js dev server
cd apps/web && npm test             # Vitest
cd apps/web && npm run test:coverage

# Backend (apps/api)
cd apps/api && npm run dev          # Express dev server (tsx watch)
cd apps/api && npm test             # Vitest
cd apps/api && npm run typecheck    # tsc --noEmit
cd apps/api && npm run db:generate  # Generate Drizzle migrations
cd apps/api && npm run db:migrate   # Apply migrations
cd apps/api && npm run db:studio    # Drizzle Studio GUI

# Shared packages
cd packages/shared && npx vitest run  # Contract tests (14 tests)
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, React 18, TypeScript, TailwindCSS, Zustand, Framer Motion |
| Backend | Express.js, TypeScript (ESM), tsx (dev), Pino (logging) |
| Database | Turso (libSQL/SQLite), Drizzle ORM |
| Auth | Clerk (frontend: @clerk/nextjs, backend: @clerk/backend) |
| Astrology | swisseph-wasm (Swiss Ephemeris), custom Vedic engine |
| AI | DeepSeek R1 (via OpenRouter API) |
| Validation | Zod (input schemas) |
| Testing | Vitest, Supertest |
| Deploy | Vercel (frontend), Docker (backend), Turso (DB) |
| CI | GitHub Actions (db-cleanup, warmup, HF sync, keep-alive) |

## Critical Files — Do NOT modify without full understanding

### BTR Engine (Heart of the system)
- `apps/api/src/lib/seconds-precision-btr.ts` — 6-stage BTR pipeline (exhaustive → tournament → refine → deep analysis → micro grid → final)
- `apps/api/src/lib/vedic-astrology-engine.ts` — Vimshottari Dasha, Divisional charts (D1-D60)
- `apps/api/src/lib/consensus-engine.ts` — Multi-method scoring (Vimshottari, KP, Varga, Transit, Forensic)
- `apps/api/src/lib/ephemeris.ts` — Swiss Ephemeris wrapper, planetary calculations
- `apps/api/src/lib/ai-client.ts` — DeepSeek R1 calls with retry, batching, streaming

### Queue & Processing
- `apps/api/src/lib/queue-manager.ts` — In-memory FIFO queue, max 3 concurrent, DB persistence
- `apps/api/src/lib/progress-tracker.ts` — Real-time stage/step tracking with ETA
- `apps/api/src/lib/memory-manager.ts` — Heap monitoring, GC trigger at 6GB threshold

### Encryption & Security
- `apps/api/src/lib/encryption/` — AES-256-GCM encryption for birth data (supports 3-part legacy AND 4-part new format)
- `apps/api/src/lib/crypto-adapter.ts` — Backward-compatible decryption adapter

### Frontend
- `apps/web/app/rectify/[id]/page.tsx` — Main analysis page (SSE stream, real-time progress)
- `apps/web/components/rectify/UnifiedAIPanel.tsx` — AI reasoning display with collapsible stage containers
- `apps/web/lib/store/stream-store.ts` — Zustand store for SSE stream state
- `apps/web/lib/xss-sanitizer.ts` — XSS protection for all user inputs

## Coding Rules

### TypeScript
- Strict mode always. Zero `any` types in production code.
- Use Zod schemas for all external input validation (`packages/shared/src/schemas.ts`).
- Prefer early returns to reduce nesting.
- Use explicit return types on exported functions.

### Error Handling
- ALWAYS use the `AppError` hierarchy from `apps/api/src/errors/index.ts`.
- Never throw raw `Error()` — use `ValidationError`, `NotFoundError`, `AIServiceError`, etc.
- Include context: `throw new ValidationError('msg', { field, value })`.
- All errors flow through `apps/api/src/middleware/error-handler.ts`.

### Logging
- Backend: Use Pino via `apps/api/src/lib/logger.ts`. NEVER use `console.log`.
- Use structured logging with metadata: `logger.info({ sessionId }, 'message')`.
- Redact sensitive data (birth details, encryption keys) in all logs.
- Frontend: Use `console.error` only in error boundaries, not in business logic.

### API Responses
- All API responses follow the standardized format from `apps/api/src/utils/response.ts`.
- Use `sendSuccess(res, data)`, `sendError(res, error)`, `sendPaginated(res, opts)`.

### State Management (Frontend)
- Use Zustand for global state (stream-store, etc.).
- Server state via React Server Components where possible.
- No prop drilling beyond 2 levels — use context or stores.

### Testing
- Unit tests alongside source: `__tests__/` directories.
- Contract tests in `packages/shared/src/__tests__/contract.test.ts`.
- Use `describe/it/expect` pattern. No snapshots for logic — only for data shape stability.

### Git
- Never commit `.env`, `.env.local`, `*.db`, `*.log` files.
- Conventional commits: `feat:`, `fix:`, `refactor:`, `test:`, `docs:`, `chore:`.
- Always run `npm run lint` and `npm test` before committing.

## Environment Variables

### Required (will crash on startup without these)
```
TURSO_DATABASE_URL          # libsql://...
TURSO_AUTH_TOKEN             # turso_...
AI_API_KEY                   # DeepSeek/OpenRouter key
CLERK_SECRET_KEY             # sk_...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY  # pk_...
ENCRYPTION_SECRET            # 32-byte hex key for AES-256
NEXT_PUBLIC_BACKEND_URL      # Backend URL (e.g., http://localhost:3001)
```

### Optional
```
NODE_ENV=development
PORT=3001                    # Backend port
MAX_CONCURRENT_SESSIONS=3   # Queue concurrency
MEMORY_THRESHOLD_PERCENT=80  # Memory pressure limit
GC_THRESHOLD_GB=6            # Trigger GC above this
ENABLE_GOD_TIER_ENHANCEMENT=true  # KP/Consensus features
```

## API Endpoints

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | /api/calculate | ✅ | Submit BTR analysis |
| GET | /api/queue/progress/:id | ✅ | Poll progress |
| GET | /api/stream/:id | ✅ | SSE real-time stream |
| GET | /api/sessions | ✅ | List user sessions |
| GET | /api/health | ❌ | Health check |
| GET | /api/health/ready | ❌ | Readiness probe |
| GET | /api/health/live | ❌ | Liveness probe |

## Middleware Chain (apps/api)

Request → `request-id` → `rate-limit` → `timeout` → `auth` (Clerk) → `validation` (Zod) → Route → `error-handler`

## Domain Knowledge

The BTR pipeline processes in 6 stages:
1. **Exhaustive Data Generation** — Generate candidate birth times, calculate ephemeris
2. **Batch Tournament** — AI evaluates batches, keeps top survivors
3. **Refinement Grid** — ±5 min grid at 1-min intervals around survivors
4. **Deep Multi-Dasha Analysis** — Divisional chart + multi-dasha verification
5. **Micro Precision Grid** — ±30 sec grid at 6-second intervals
6. **Final Precision** — Seconds-level with KP Sub-Lord + Consensus scoring

Key astrological systems: Vimshottari Dasha, KP Sub-Lords, Shadbala, Jaimini, Kalachakra Dasha, Nadi Amsha, Pancha Pakshi, Gandanta Detection, D1-D60 Divisional Charts.

## Things to Watch Out For

1. **Encryption backward compat** — System must handle both 3-part (`iv:authTag:cipher`) and 4-part formats. Never break old format support.
2. **Queue memory** — Each BTR session uses significant memory. Monitor heap via memory-manager. Max 3 concurrent.
3. **Ephemeris files** — `ephe/` directory must contain `.se1` files. Without them, all calculations fail silently.
4. **AI timeouts** — DeepSeek calls can take 2-5 min per batch. Retry with exponential backoff. 5-min hard timeout.
5. **SSE streams** — Progress streams to frontend via Server-Sent Events. Connection drops need graceful reconnection.
6. **Date handling** — Fuzzy/approximate dates for life events are valid. Never reject them — the engine handles uncertainty.

## Vercel React & Next.js Performance Rules

- Avoid waterfalls: Use `Promise.all()` for parallel fetches, `<Suspense>` for streaming.
- Bundle size: Import from specific paths, not barrel files. Use `dynamic()` for heavy components.
- Server Components: Use `React.cache()` for deduplication. Only pass necessary fields to Client Components.
- Re-renders: Use `React.memo` for list items. Use `useState(() => expensive())` for lazy init.
