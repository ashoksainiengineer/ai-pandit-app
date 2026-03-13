# Cross-System Integration Audit - AI-Pandit Project

**Audit Date:** 2026-03-13  
**Scope:** All 660+ files across 12 major subsystems  
**Objective:** Verify production-ready coordination between all systems

---

## Executive Summary

### System Topology Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           AI-PANDIT ARCHITECTURE                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐                │
│  │   WEB APP    │────▶│  API SERVER  │────▶│   WORKER     │                │
│  │  (Next.js)   │◄────│  (Express)   │◄────│  (Node.js)   │                │
│  └──────────────┘     └──────┬───────┘     └──────────────┘                │
│          │                   │                     │                        │
│          │                   │                     │                        │
│          ▼                   ▼                     ▼                        │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐                │
│  │    Clerk     │     │    NEON      │     │  SKYFIELD    │                │
│  │     Auth     │     │  PostgreSQL  │     │  (Python)    │                │
│  └──────────────┘     └──────────────┘     └──────────────┘                │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Cross-System Integration Audit (Data Flow)

### 1.1 End-to-End Data Flow Analysis

#### Primary Flow: Birth Time Rectification Request

```
Step 1: Frontend Submission
┌─────────────────────────────────────────────────────────────────────────────┐
│ apps/web/app/rectify/page.tsx                                               │
│   ↓                                                                         │
│ apps/web/app/api/analysis/queue/route.ts                                    │
│   ↓                                                                         │
│ apps/web/lib/server/backend-proxy.ts (Clerk auth + Bearer token)            │
│   ↓ POST to API                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
Step 2: API Reception & Validation
┌─────────────────────────────────────────────────────────────────────────────┐
│ apps/api/src/routes/queue.ts                                                │
│   ↓                                                                         │
│ apps/api/src/lib/jobs/job-service.ts                                        │
│   ├─→ validateOffsetConfig()                                                │
│   ├─→ syncUser()                                                            │
│   ├─→ enforceQueueCapacity()                                                │
│   └─→ createQueuedBirthRectificationJob()                                   │
│       ├─→ Encrypt sensitive data                                            │
│       ├─→ Create session record                                             │
│       ├─→ Create job record                                                 │
│       ├─→ Create idempotency key                                            │
│       └─→ addToQueue()                                                      │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
Step 3: Queue Processing
┌─────────────────────────────────────────────────────────────────────────────┐
│ apps/api/src/lib/queue-manager.ts                                           │
│   ↓                                                                         │
│ apps/api/src/lib/queue/index.ts (getQueueDriver)                            │
│   ├─→ db_polling: apps/api/src/lib/queue/drivers/db-polling.ts              │
│   └─→ redis_bullmq: apps/api/src/lib/queue/drivers/redis-bullmq.ts          │
│       ↓                                                                     │
│ apps/api/src/lib/jobs/worker-runtime.ts                                     │
│   ├─→ ensureDatabaseInitialized()                                           │
│   ├─→ initEphemerisProvider()                                               │
│   ├─→ recoverInterruptedJobsOnStartup()                                     │
│   └─→ runQueueIteration()                                                   │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
Step 4: BTR Processing
┌─────────────────────────────────────────────────────────────────────────────┐
│ apps/api/src/lib/queue-manager.ts::processJob()                             │
│   ↓                                                                         │
│ apps/api/src/lib/btr/orchestrator.ts::rectifyBirthTime()                    │
│   ├─→ WindowScanner.scan()                                                  │
│   ├─→ TatwaShuddhi.findCorrections()                                        │
│   ├─→ TransitAnalyzer.analyze()                                             │
│   └─→ EventScorer.score()                                                   │
│       ↓                                                                     │
│   Ephemeris Calls:                                                          │
│   ├─→ apps/api/src/lib/ephemeris.ts::calculateEphemeris()                   │
│   └─→ apps/api/src/lib/ephemeris/skyfield-client.ts                         │
│       ↓ HTTP POST                                                           │
│   services/ephemeris/app/routes/v1/ephemeris.py                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
Step 5: Progress Streaming
┌─────────────────────────────────────────────────────────────────────────────┐
│ Server-Sent Events:                                                         │
│ apps/api/src/routes/stream.ts                                               │
│   ↓                                                                         │
│ Frontend Reception:                                                         │
│ apps/web/lib/use-stream-progress.ts                                         │
│   ├─→ SSE attempt                                                           │
│   ├─→ Fallback to polling: /api/analysis/progress                           │
│   └─→ apps/web/app/api/analysis/progress/route.ts                           │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
Step 6: Result Persistence & Retrieval
┌─────────────────────────────────────────────────────────────────────────────┐
│ apps/api/src/lib/jobs/artifact-storage.ts                                   │
│ apps/api/src/lib/progress-tracker.ts                                        │
│   ↓                                                                         │
│ packages/db/src/schema.ts (sessions, jobs, artifacts)                       │
│   ↓                                                                         │
│ Frontend Dashboard:                                                         │
│ apps/web/app/dashboard/page.tsx                                             │
│ apps/web/components/dashboard/SessionCard.tsx                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Critical Integration Points

| # | From System | To System | Integration Point | Risk Level |
|---|-------------|-----------|-------------------|------------|
| 1 | Web | API | `backend-proxy.ts` → `/api/queue` | 🟡 MEDIUM |
| 2 | API | Database | `job-service.ts` → `@ai-pandit/db` | 🟢 LOW |
| 3 | API | Queue | `queue-manager.ts` → `getQueueDriver()` | 🟡 MEDIUM |
| 4 | Queue | Worker | `worker-runtime.ts` → `runStandaloneWorkerLoop()` | 🔴 HIGH |
| 5 | Worker | BTR | `queue-manager.ts` → `orchestrator.ts` | 🟡 MEDIUM |
| 6 | BTR | Ephemeris | `orchestrator.ts` → `skyfield-client.ts` | 🔴 HIGH |
| 7 | Ephemeris | Python | `skyfield-client.ts` → `services/ephemeris/` | 🔴 HIGH |
| 8 | API | Frontend | `stream.ts` → `use-stream-progress.ts` | 🟡 MEDIUM |
| 9 | Frontend | Clerk | `backend-proxy.ts` → `@clerk/nextjs/server` | 🟢 LOW |
| 10 | Worker | Database | `worker-runtime.ts` → `@ai-pandit/db` | 🟢 LOW |

---

## Phase 2: Database Layer Audit

### 2.1 Schema Coordination Matrix

| Table | Used By | Purpose | Foreign Keys |
|-------|---------|---------|--------------|
| `users` | API, Web | User accounts | - |
| `sessions` | API, Web | BTR sessions | users.id |
| `jobs` | API, Worker | Job queue | sessions.id, users.id |
| `job_attempts` | API, Worker | Retry tracking | jobs.id |
| `job_events` | API, Worker | Event sourcing | jobs.id |
| `artifacts` | API, Worker | Result storage | jobs.id |
| `idempotencyKeys` | API | Duplicate prevention | - |
| `sessionFavorites` | Web | User favorites | sessions.id |
| `calculations` | API | Ephemeris cache | sessions.id |
| `payments` | API | Billing | users.id |
| `auditLogs` | API | Compliance | users.id |
| `dataRetention` | API | GDPR cleanup | sessions.id |

### 2.2 Database Connection Flow

```
packages/db/src/drizzle.ts
  ├─→ resolveConnectionString() (NEON_DATABASE_URL)
  ├─→ checkDatabaseHealth()
  ├─→ executeWithTimeout()
  └─→ executeWithRetry()
      ↓
Used by:
  ├─→ apps/api/src/lib/jobs/job-service.ts
  ├─→ apps/api/src/lib/queue-manager.ts
  ├─→ apps/api/src/lib/jobs/worker-runtime.ts
  ├─→ apps/web/lib/server/session-ownership.ts
  └─→ apps/worker/src/worker.ts
```

### 2.3 Potential Coordination Issues

| Issue | Description | Impact | Mitigation |
|-------|-------------|--------|------------|
| Connection Pool Exhaustion | Multiple services share DB connection | 🔴 HIGH | Connection pooling configured |
| Transaction Isolation | Concurrent job claims | 🔴 HIGH | Row-level locking with FOR UPDATE |
| Schema Mismatch | Old workers with new schema | 🟡 MEDIUM | Migration journal tracking |
| Encryption Key Rotation | V1 vs V2 encryption | 🟡 MEDIUM | Fallback decryption in place |

---

## Phase 3: Ephemeris System Audit

### 3.1 Service Dependency Chain

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         EPHEMERIS SYSTEM FLOW                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────────┐                                                       │
│  │  API Ephemeris   │                                                       │
│  │  Runtime         │                                                       │
│  └────────┬─────────┘                                                       │
│           │                                                                 │
│    ┌──────┴──────┐                                                          │
│    ▼             ▼                                                          │
│ ┌────────┐  ┌────────┐                                                      │
│ │Skyfield│  │Algorithmic│ (Fallback)                                        │
│ │ Client │  │ Calculator│                                                   │
│ └────┬───┘  └────────┘                                                      │
│      │                                                                      │
│      │ HTTP POST                                                            │
│      ▼                                                                      │
│ ┌──────────────────────────────────┐                                        │
│ │   services/ephemeris/            │                                        │
│ │   ├─ app/main.py                 │                                        │
│ │   ├─ app/routes/v1/ephemeris.py  │                                        │
│ │   ├─ app/services/calculations.py│                                        │
│ │   └─ app/services/runtime.py     │                                        │
│ └──────────────────────────────────┘                                        │
│                                                                             │
│   Kernel: de440s.bsp (Skyfield)                                            │
│   Ayanamsha: Lahiri                                                        │
│   House Systems: whole_sign, equal, placidus                               │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Ephemeris Configuration Chain

| Level | File | Config Keys |
|-------|------|-------------|
| Environment | `.env` | `EPHEMERIS_PROVIDER`, `EPHEMERIS_SERVICE_URL` |
| Config Schema | `apps/api/src/config/index.ts` | Lines 46-58 |
| Runtime State | `apps/api/src/lib/ephemeris.ts` | `initEphemerisProvider()` |
| Client | `apps/api/src/lib/ephemeris/skyfield-client.ts` | `fetchSkyfieldChart()` |
| Python Service | `services/ephemeris/app/config.py` | `EPHEMERIS_DATA_DIR` |

### 3.3 Critical Ephemeris Risks

| Risk | Description | Severity |
|------|-------------|----------|
| Service Unavailable | Skyfield service not running | 🔴 CRITICAL |
| Kernel Not Found | `de440s.bsp` missing | 🔴 CRITICAL |
| Timeout Cascade | Ephemeris timeouts blocking queue | 🔴 CRITICAL |
| Fallback Disabled | `EPHEMERIS_ALLOW_ALGORITHMIC_FALLBACK=false` | 🟡 MEDIUM |
| Precision Mismatch | Algorithmic vs Skyfield differences | 🟡 MEDIUM |

---

## Phase 4: BTR Pipeline Audit

### 4.1 BTR Stage Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     BTR 6-STAGE PIPELINE                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Input: Birth Details + Life Events                                        │
│     ↓                                                                       │
│  Stage 1: Window Scanning (±30 min grid)                                   │
│     ├─ File: lib/btr/window-scanner.ts                                     │
│     └─ Output: Candidate times array                                       │
│     ↓                                                                       │
│  Stage 2: Deep Analysis (AI-powered scoring)                               │
│     ├─ File: lib/btr/prompts/deep-analysis-prompt.ts                       │
│     └─ Output: Scored candidates                                           │
│     ↓                                                                       │
│  Stage 3: Tatwa Shuddhi (morning births)                                   │
│     ├─ File: lib/btr/tatwa-shuddhi.ts                                      │
│     └─ Output: Tatwa-corrected windows                                     │
│     ↓                                                                       │
│  Stage 4: Transit Verification                                             │
│     ├─ File: lib/btr/transit-analyzer.ts                                   │
│     └─ Output: Transit-validated candidates                                │
│     ↓                                                                       │
│  Stage 5: Event Scoring                                                    │
│     ├─ File: lib/btr/event-scorer.ts                                       │
│     └─ Output: Confidence-weighted scores                                  │
│     ↓                                                                       │
│  Stage 6: Final Precision (seconds-level)                                  │
│     ├─ File: lib/seconds-precision-btr.ts                                  │
│     └─ Output: Final rectified time                                        │
│     ↓                                                                       │
│  Output: RectificationResult                                               │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4.2 BTR Integration Points

| Component | Calls | Called By | Coordination |
|-----------|-------|-----------|--------------|
| `orchestrator.ts` | All stages | `queue-manager.ts` | Central coordinator |
| `window-scanner.ts` | `ephemeris.ts` | `orchestrator.ts` | Grid calculation |
| `tatwa-shuddhi.ts` | `ephemeris.ts` | `orchestrator.ts` | Sunrise calc |
| `transit-analyzer.ts` | `ephemeris.ts` | `orchestrator.ts` | Transit positions |
| `event-scorer.ts` | - | `orchestrator.ts` | Scoring logic |
| `seconds-precision-btr.ts` | `ai-client.ts` | `queue-manager.ts` | Final refinement |

### 4.3 BTR Data Contract

```typescript
// From @ai-pandit/shared
interface RectificationInput {
  birthDate: string;
  tentativeTime: string;
  latitude: number;
  longitude: number;
  timezone: string | number;
  events: BtrEvent[];
  forensicProfile?: ForensicProfile;
  knownTatwa?: TatwaType;
  timeRangeMinutes?: number;
  config?: Partial<ScanConfiguration>;
}

interface RectificationResult {
  rectifiedTime: string;
  confidence: ConfidenceLevel;
  methodScores: MethodScores;
  candidates: CandidateScore[];
  reasoning: string[];
  warnings: string[];
}
```

---

## Phase 5: Queue & Job System Audit

### 5.1 Queue Architecture Comparison

| Feature | DB Polling | Redis BullMQ |
|---------|------------|--------------|
| **Files** | `drivers/db-polling.ts` | `drivers/redis-bullmq.ts` |
| **Reliability** | 🟢 High (DB is source of truth) | 🟡 Medium (extra dependency) |
| **Latency** | Higher (poll interval) | Lower (pub/sub) |
| **Retries** | Manual implementation | Built-in with backoff |
| **Monitoring** | Custom queries | Built-in UI |
| **Use Case** | Production baseline | High-throughput option |

### 5.2 Job State Machine

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         JOB STATE MACHINE                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│                    ┌─────────┐                                              │
│                    │  QUEUED │◄──────────────────────────────┐              │
│                    └────┬────┘                               │              │
│                         │ claim()                            │ retry()      │
│                         ▼                                    │              │
│                    ┌─────────┐      fail()     ┌─────────┐   │              │
│              ┌────▶│ RUNNING │────────────────▶│  FAILED │───┘              │
│              │     └────┬────┘                 └─────────┘                  │
│              │          │ complete()                                         │
│              │          ▼                                                    │
│              │     ┌───────────┐                                             │
│              └─────│COMPLETED  │                                             │
│                    └───────────┘                                             │
│                         │                                                    │
│                    cancel()                                                  │
│                         ▼                                                    │
│                    ┌───────────┐                                             │
│                    │ CANCELLED │                                             │
│                    └───────────┘                                             │
│                         │                                                    │
│                    retry()                                                   │
│                         └────────────────────────────────────────────────▶   │
│                                                                             │
│  Special: RETRYING state between fail() and QUEUED                          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 5.3 Queue Coordination Risks

| Risk | Description | Mitigation |
|------|-------------|------------|
| Job Loss | Worker crash during processing | `recoverInterruptedJobsOnStartup()` |
| Duplicate Processing | Multiple workers claim same job | Row locking with `FOR UPDATE SKIP LOCKED` |
| Stuck Jobs | No heartbeat updates | Stale job detection (2hr timeout) |
| Priority Inversion | Free tier blocking pro users | Per-tier queue limits |
| Memory Pressure | BTR using too much RAM | `memory-manager.ts` throttling |

---

## Phase 6: Streaming & Progress Audit

### 6.1 Streaming Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       STREAMING ARCHITECTURE                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Frontend: useStreamProgress.ts                                             │
│     ├─→ Attempt 1: SSE (Server-Sent Events)                                │
│     │       GET /api/stream?sessionId=xxx&ticket=xxx                       │
│     │       Headers: Authorization: Bearer <token>                         │
│     │       Headers: Last-Event-ID: <event-id> (for reconnect)             │
│     │                                                                      │
│     └─→ Fallback: Polling                                                  │
│             GET /api/analysis/progress                                     │
│             Every 5 seconds (backoff to 60s)                               │
│                                                                             │
│  Backend: stream.ts                                                         │
│     ├─→ validateStreamTicket()                                             │
│     ├─→ authenticateRequest()                                              │
│     ├─→ session-events.ts (in-memory buffer)                               │
│     ├─→ job_events table (persistent events)                               │
│     └─→ progress-tracker.ts (state management)                             │
│                                                                             │
│  Event Types:                                                               │
│     - progress: Stage/percentage updates                                   │
│     - ai_thinking: AI reasoning chunks                                     │
│     - calculation_log: Ephemeris calculations                              │
│     - candidate_score: Best candidate updates                              │
│     - complete: Final result                                               │
│     - error: Failure information                                           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 6.2 Progress State Coordination

| Source | Updates | Consumers | Persistence |
|--------|---------|-----------|-------------|
| `progress-tracker.ts` | Stage, %, ETA | SSE, Polling | In-memory + DB |
| `session-events.ts` | Events | SSE stream | In-memory buffer |
| `job_events` table | All events | Replay, recovery | Persistent |
| `useStreamStore` | UI state | React components | Zustand store |

### 6.3 Streaming Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| SSE Connection Drop | UX interruption | Auto-reconnect with Last-Event-ID |
| Event Loss | Missing progress updates | Dual persistence (memory + DB) |
| 404 on Session | Race condition | Retry with exponential backoff |
| Memory Leak | Unclosed SSE connections | Connection timeout (10s) |
| Auth Token Expiry | Stream termination | Token refresh before SSE |

---

## Phase 7: API Routes Audit

### 7.1 Route Coordination Matrix

| Route | File | Auth | Calls | Description |
|-------|------|------|-------|-------------|
| `POST /api/queue` | `routes/queue.ts` | ✅ | job-service.ts | Submit analysis |
| `GET /api/queue/progress` | `routes/queue.ts` | ✅ | progress-tracker.ts | Get progress |
| `POST /api/queue/cancel` | `routes/queue.ts` | ✅ | cancellation-manager.ts | Cancel job |
| `GET /api/stream` | `routes/stream.ts` | ✅ | session-events.ts | SSE stream |
| `GET /api/sessions` | `routes/sessions.ts` | ✅ | DB queries | List sessions |
| `GET /api/jobs/:id` | `routes/jobs.ts` | ✅ | job-service.ts | Job detail |
| `GET /api/health` | `routes/health.ts` | ❌ | Health checks | Service health |
| `GET /admin/*` | `routes/admin.ts` | ✅+admin | Various | Admin operations |

### 7.2 Route Security Layers

```
Request
  ↓
┌─────────────────────────────────────────┐
│ 1. middleware/request-id.ts            │
│    - Assign trace ID                    │
└─────────────────────────────────────────┘
  ↓
┌─────────────────────────────────────────┐
│ 2. middleware/auth.ts                  │
│    - Verify Clerk JWT                  │
│    - Extract userId                    │
└─────────────────────────────────────────┘
  ↓
┌─────────────────────────────────────────┐
│ 3. middleware/rate-limit.ts            │
│    - Check rate limits                 │
└─────────────────────────────────────────┘
  ↓
┌─────────────────────────────────────────┐
│ 4. middleware/validation.ts            │
│    - Zod schema validation             │
└─────────────────────────────────────────┘
  ↓
┌─────────────────────────────────────────┐
│ 5. Route Handler                        │
│    - Business logic                    │
└─────────────────────────────────────────┘
  ↓
┌─────────────────────────────────────────┐
│ 6. middleware/error-handler-new.ts     │
│    - Error formatting                  │
└─────────────────────────────────────────┘
```

---

## Phase 8: Frontend Integration Audit

### 8.1 Frontend Architecture Layers

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      FRONTEND ARCHITECTURE                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  LAYER 1: UI Components                                                     │
│  ├─ Landing: Hero, Pricing, Testimonials, etc.                             │
│  ├─ Rectify: Step1-4 forms, Results dashboard                              │
│  ├─ Dashboard: Session cards, stats, charts                                │
│  └─ Shared: Form components, UI primitives                                 │
│                                                                             │
│  LAYER 2: State Management                                                  │
│  ├─ useStreamProgress.ts (real-time updates)                               │
│  ├─ useStreamStore.ts (Zustand global state)                               │
│  └─ React Query (server state caching)                                     │
│                                                                             │
│  LAYER 3: API Integration                                                   │
│  ├─ backend-proxy.ts (server-side API calls)                               │
│  ├─ api-client.ts (client-side API calls)                                  │
│  └─ Server Routes: /api/analysis/*, /api/sessions/*                        │
│                                                                             │
│  LAYER 4: Authentication                                                    │
│  ├─ Clerk Provider (Auth context)                                          │
│  ├─ middleware.ts (Route protection)                                       │
│  └─ auth-utils.ts (Token management)                                       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 8.2 Frontend-Backend Coordination

| Frontend | Backend | Contract |
|----------|---------|----------|
| `POST /api/analysis/queue` | `POST /api/queue` | `CalculateRequestSchema` |
| `GET /api/analysis/progress` | `GET /api/queue/progress` | `ProgressData` |
| `POST /api/analysis/cancel` | `POST /api/queue/cancel` | `{ sessionId }` |
| `GET /api/sessions` | `GET /api/sessions` | `SessionSummary[]` |
| `GET /api/sessions/[id]` | `GET /api/sessions/:id` | `SessionDetail` |

### 8.3 Frontend Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Build-time DB Access | Security | Removed @libsql/client |
| Token Expiry | Auth failures | getTokenWithRetry() |
| SSR/CSR Mismatch | Hydration errors | ClientOnly wrapper |
| State Desync | Stale UI | Zustand + React Query |

---
## Phase 9: Worker Coordination Audit

### 9.1 Worker Startup Sequence

```
apps/worker/src/worker.ts
  ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│ 1. Create HTTP health server                                               │
│    - /health, /ready, /live endpoints                                      │
│    - Returns 503 until fully initialized                                   │
│                                                                             │
│ 2. initializeWorkerRuntime()                                               │
│    ├─→ ensureDatabaseInitialized()                                         │
│    ├─→ initEphemerisProvider()                                             │
│    └─→ recoverInterruptedJobsOnStartup()                                   │
│        - Finds 'running' jobs from previous run                            │
│        - Marks them for retry                                              │
│                                                                             │
│ 3. runStandaloneWorkerLoop()                                               │
│    └─→ Infinite loop calling runQueueIteration()                           │
│                                                                             │
│ 4. On SIGTERM/SIGINT                                                       │
│    └─→ gracefulShutdown()                                                  │
│        - Set draining flag                                                 │
│        - Stop accepting new jobs                                           │
│        - Wait for active jobs (30s timeout)                                │
│        - Exit process                                                      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 9.2 Worker-API Coordination

| Aspect | Implementation | Risk |
|--------|----------------|------|
| Shared Code | Worker imports from `apps/api/src/lib/` | Code drift |
| Database | Same Neon PostgreSQL instance | Connection limits |
| Ephemeris | Same Skyfield service | Timeout cascade |
| Queue | Same queue driver (DB polling) | Race conditions |
| Deployment | Separate Cloud Run service | Version mismatch |

### 9.3 Worker Risks

| Risk | Description | Severity |
|------|-------------|----------|
| Hot Loop | Worker spins without pause | 🔴 CRITICAL |
| Memory Leak | BTR not releasing memory | 🔴 CRITICAL |
| Job Starvation | Poll interval too long | 🟡 MEDIUM |
| Startup Failure | Ephemeris init fails | 🔴 CRITICAL |
| Uncaught Errors | Crash without recovery | 🔴 CRITICAL |

---

## Phase 10: Deployment & Infrastructure Audit

### 10.1 Service Deployment Order

```
Production Deployment Sequence:

1. Database (Neon)
   └─→ Run migrations

2. Ephemeris Service (Cloud Run)
   ├─→ Deploy services/ephemeris/
   ├─→ Verify /health, /ready
   └─→ Download kernel if needed

3. API Service (Cloud Run)
   ├─→ Deploy apps/api/
   ├─→ Verify /health, /ready
   └─→ Test ephemeris connectivity

4. Worker (Cloud Run)
   ├─→ Deploy apps/worker/
   ├─→ Verify /health, /ready
   └─→ Check job recovery

5. Web Frontend (Vercel)
   ├─→ Deploy apps/web/
   ├─→ Verify build success
   └─→ Smoke test critical flows
```

### 10.2 Environment Variable Coordination

| Variable | Services | Required | Description |
|----------|----------|----------|-------------|
| `NEON_DATABASE_URL` | API, Worker | ✅ | Database connection |
| `CLERK_SECRET_KEY` | API, Web | ✅ | Auth verification |
| `AI_API_KEY` | API | ✅ | AI model access |
| `EPHEMERIS_SERVICE_URL` | API, Worker | ✅ | Skyfield endpoint |
| `ENCRYPTION_SECRET` | API | ✅ | Data encryption |
| `JOB_EXECUTION_MODE` | API | ✅ | `inline` or `external_worker` |
| `QUEUE_ARCHITECTURE` | API, Worker | ✅ | `db_polling` or `redis_bullmq` |
| `REDIS_URL` | API, Worker | Conditional | Required for Redis mode |

### 10.3 Health Check Endpoints

| Service | Endpoint | Checks |
|---------|----------|--------|
| API | `/health` | Process health |
| API | `/ready` | DB + Ephemeris connectivity |
| Worker | `/health` | Process + runtime health |
| Worker | `/ready` | Initialized + not draining |
| Ephemeris | `/health` | Process health |
| Ephemeris | `/ready` | Kernel loaded |

---

## Phase 11: Security & Auth Audit

### 11.1 Authentication Flow

```
User
  ↓ Login
┌─────────────────────────────────────────┐
│ Clerk (Auth Provider)                   │
│ - Issues JWT token                      │
└─────────────────────────────────────────┘
  ↓ Token
┌─────────────────────────────────────────┐
│ Frontend (Next.js)                      │
│ - Stores token in memory                │
│ - Sends with API requests               │
└─────────────────────────────────────────┘
  ↓ Bearer Token
┌─────────────────────────────────────────┐
│ Backend API                             │
│ - Verify token with Clerk               │
│ - Extract userId                        │
│ - Check session ownership               │
└─────────────────────────────────────────┘
```

### 11.2 Authorization Layers

| Layer | Implementation | File |
|-------|----------------|------|
| Authentication | Clerk JWT verify | `middleware/auth.ts` |
| Session Ownership | User ID match | `lib/session-ownership.ts` |
| Tier Limits | Per-plan quotas | `lib/jobs/job-service.ts` |
| Admin Access | Role check | `routes/admin.ts` |
| Rate Limiting | Token bucket | `middleware/rate-limit.ts` |

### 11.3 Data Protection

| Data Type | Protection | Implementation |
|-----------|------------|----------------|
| Birth Details | AES-256-GCM | `lib/encryption/index.ts` |
| Life Events | AES-256-GCM | `lib/encryption/index.ts` |
| Session Results | Encrypted at rest | DB field encryption |
| API Keys | Environment only | `process.env` |
| PII | Encrypted + retention limits | `dataRetention` table |

---

## Phase 12: Production Readiness Assessment

### 12.1 System Coordination Scorecard

| System Pair | Integration Health | Issues | Status |
|-------------|-------------------|--------|--------|
| Web ↔ API | 🟢 Good | Minor type mismatches | ✅ Ready |
| API ↔ Database | 🟢 Good | Connection pooling set | ✅ Ready |
| API ↔ Queue | 🟢 Good | Driver abstraction works | ✅ Ready |
| Queue ↔ Worker | 🟡 Fair | Shared code imports | ⚠️ Monitor |
| Worker ↔ BTR | 🟢 Good | Proper error handling | ✅ Ready |
| BTR ↔ Ephemeris | 🟡 Fair | Timeout handling needs review | ⚠️ Monitor |
| API ↔ Streaming | 🟢 Good | SSE + polling both work | ✅ Ready |
| Frontend ↔ Clerk | 🟢 Good | Auth flow verified | ✅ Ready |

### 12.2 Critical Production Gaps

| # | Gap | Impact | Action Required |
|---|-----|--------|-----------------|
| 1 | Worker uses API source imports | Code version drift risk | Consider shared package |
| 2 | No circuit breaker for ephemeris | Cascade failure risk | Review timeout config |
| 3 | Redis mode untested in production | Fallback uncertainty | Test before enabling |
| 4 | Session event buffer in-memory | Event loss on crash | Consider Redis for buffer |
| 5 | No distributed tracing | Debugging difficulty | Enable OTEL if needed |

### 12.3 Pre-Production Checklist

```bash
# 1. Database Connectivity
npm -w @ai-pandit/db run test

# 2. Ephemeris Service Health
curl http://localhost:8000/ready

# 3. API Health
npm -w @ai-pandit/api run test

# 4. Worker Startup
npm -w @ai-pandit/worker run typecheck

# 5. Full Integration
npm run test:e2e:smoke

# 6. Release Gate
npm -w @ai-pandit/api run phase6:release-gate
```

---

## Appendix A: File Count by Subsystem

| Subsystem | File Count | Key Directories |
|-----------|------------|-----------------|
| Frontend (Web) | ~250 | `apps/web/` |
| API Backend | ~280 | `apps/api/src/` |
| Worker | ~1 | `apps/worker/src/` |
| Database | ~15 | `packages/db/` |
| Shared | ~8 | `packages/shared/` |
| Ephemeris | ~20 | `services/ephemeris/` |
| E2E Tests | ~11 | `e2e/` |
| Scripts | ~20 | `scripts/` |
| Documentation | ~20 | `docs/` |
| Deployment | ~3 | `deploy/` |
| **TOTAL** | **~660+** | |

---

## Appendix B: Known Coordination Issues

### Issue 1: Worker-API Code Sharing
**Description:** Worker imports directly from `apps/api/src/lib/`  
**Risk:** Version mismatch when API updates but worker doesn't  
**Mitigation:** Consider extracting shared code to `packages/worker-shared/`

### Issue 2: Ephemeris Timeout Cascade
**Description:** Slow ephemeris calls can block queue processing  
**Risk:** Queue backup and job timeouts  
**Mitigation:** Circuit breaker + aggressive timeouts in place

### Issue 3: Session Event Memory Buffer
**Description:** In-memory event buffer lost on crash  
**Risk:** Missing events on reconnect  
**Mitigation:** Persistent `job_events` table as backup

### Issue 4: Redis Mode Untested
**Description:** Redis BullMQ driver exists but not production-tested  
**Risk:** Unknown behavior under load  
**Mitigation:** Keep `db_polling` as default

---

*End of Cross-System Integration Audit*
