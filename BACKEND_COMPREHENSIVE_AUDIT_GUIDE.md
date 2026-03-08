# 📋 Backend Comprehensive Audit Guide
## AI-Pandit — Vedic Astrology BTR Engine

> **Soul Purpose**: Birth Time Rectification (BTR) - Determines the exact birth time with **very precise accuracy up to seconds level** using advanced Vedic astrology calculations, AI-powered analysis, and multi-stage consensus scoring.

> **Purpose**: This guide provides a complete, token-efficient system overview for auditing the backend using GPT/Codex. Use this to minimize API calls and costs while ensuring thorough coverage.

> **Deployment Stack**: Vercel (Frontend) + Hugging Face Space (Backend) + Turso DB (Shared) + Clerk (Auth)

---

## 🎯 How to Use This Guide Efficiently with GPT 5.3 / CODEX

### 🚀 Quick Start - 3 Simple Steps

**Step 1: Copy the section you need**
- Go to the section you want to audit (e.g., "SYSTEM OVERVIEW", "COMMON ISSUES")
- Select and copy the entire section (Ctrl+A, Ctrl+C)
- Paste into GPT 5.3 / CODEX chat

**Step 2: Use the provided prompts**
- Each section has ready-made prompts at the end
- Copy the prompt (not the section, just the prompt)
- Paste into GPT 5.3 / CODEX

**Step 3: Iterate as needed**
- Start with Phase 0 (Deployment Checks)
- Move through phases systematically
- Use specific prompts for deep dives

### 💰 Token-Saving Strategy

1. **Copy-paste entire sections** to GPT instead of individual files
2. **Use the "Quick Reference"** sections first to understand context
3. **Follow the iterative audit process** - don't skip steps
4. **Use the provided prompts** - they're optimized for minimal tokens
5. **One prompt at a time** - Don't send multiple prompts together

### 📋 Recommended GPT 5.3 / CODEX Workflow

```
┌─────────────────────────────────────────────────────────────┐
│  START: Copy "SYSTEM OVERVIEW" section           │
│    ↓                                              │
│  PASTE into GPT 5.3 / CODEX                     │
│    ↓                                              │
│  READ response → Understand architecture            │
│    ↓                                              │
│  START: Copy "PHASE 0: Deployment Checks" prompt │
│    ↓                                              │
│  PASTE into GPT 5.3 / CODEX                     │
│    ↓                                              │
│  READ response → Fix deployment issues        │
│    ↓                                              │
│  START: Copy specific subsystem section       │
│    ↓                                              │
│  PASTE into GPT 5.3 / CODEX                     │
│    ↓                                              │
│  READ response → Deep dive into subsystem    │
│    ↓                                              │
│  START: Copy specific file content        │
│    ↓                                              │
│  PASTE into GPT 5.3 / CODEX                     │
│    ↓                                              │
│  READ response → Get fixes                    │
└─────────────────────────────────────────────────────────────┘
```

### ⚡ Pro Tips for Minimal Token Usage

1. **Start with Phase 0** - Deployment checks first (15 min)
2. **Use Prompt 0** - For your main issue (session clone → re-analyze)
3. **Read before asking** - Let GPT analyze before requesting code
4. **Be specific** - Ask about specific files, not "everything"
5. **One issue per session** - Don't try to fix everything at once

### 🎯 Example Session with GPT 5.3 / CODEX

```
You: Copy this section and paste into GPT:
[Copy "SYSTEM OVERVIEW" section from guide]

GPT 5.3: [Analyzes architecture...]

You: Now copy Phase 0 checklist and paste:
[Copy Phase 0 checklist]

GPT 5.3: [Checks deployment configuration...]

You: Use Prompt 0 from the guide:
[Copy Prompt 0]

GPT 5.3: [Audits deployment and identifies issues...]

You: Now tell me your specific issue:
I'm getting "Session not found, connection error" when I clone a session and click "Start Analysis"

GPT 5.3: [Provides detailed analysis and fixes...]
```

---

## 📚 TABLE OF CONTENTS

1. [System Overview](#system-overview)
2. [Architecture Diagram](#architecture-diagram)
3. [Subsystem Breakdown](#subsystem-breakdown)
4. [Critical Files Reference](#critical-files-reference)
5. [Common Issues & Patterns](#common-issues--patterns)
6. [Iterative Audit Process](#iterative-audit-process)
7. [Token-Efficient Prompts](#token-efficient-prompts)
8. [Checklists](#checklists)

---

## 🏗️ SYSTEM OVERVIEW

### Deployment Architecture (Your Stack)
```
┌─────────────────────────────────────────────────────────────────┐
│                    PRODUCTION STACK                             │
├─────────────────────────────────────────────────────────────────┤
│  Frontend: Vercel Free Tier                                     │
│    - Next.js 15, React 18, TailwindCSS                          │
│    - URL: https://your-app.vercel.app                           │
│    - Serverless, edge functions                                  │
│                                                                 │
│  Backend: Hugging Face Space Free Tier                           │
│    - Express.js + TypeScript (ESM)                               │
│    - URL: https://your-space.hf.space                           │
│    - Port: 7860 (HF default)                                    │
│    - CPU: ~2 vCPU, RAM: ~16GB (shared)                          │
│    - Sleeps after inactivity (cold starts)                      │
│                                                                 │
│  Database: Turso Free Tier                                       │
│    - libSQL (SQLite-compatible)                                   │
│    - Shared by both Vercel and HF Space                          │
│    - Connection URL: libsql://...                               │
│    - Auth Token: turso_...                                      │
│    - Limit: 500 rows, 8GB storage, 1B read rows                 │
│                                                                 │
│  Auth: Clerk Free Tier                                            │
│    - JWT tokens for authentication                                │
│    - User management, session management                          │
│    - Frontend: @clerk/nextjs                                     │
│    - Backend: @clerk/backend                                     │
└─────────────────────────────────────────────────────────────────┘

### Tech Stack
```
Backend: Express.js + TypeScript (ESM)
Database: Turso (libSQL) + Drizzle ORM
Auth: Clerk (@clerk/backend)
AI: GPT OSS 120B (via GROQ AI API)
Astrology: swisseph-wasm (Swiss Ephemeris)
Validation: Zod
Logging: Pino
Testing: Vitest + Supertest
```

### Core Responsibilities
1. **BTR Engine** - Birth Time Rectification with **very precise accuracy up to seconds level** (6-stage pipeline)
2. **Vedic Calculations** - Ephemeris, Dashas, Divisional Charts
3. **Queue Management** - Concurrent session handling (max 3)
4. **Progress Tracking** - Real-time SSE streams
5. **Data Encryption** - AES-256-GCM for birth data
6. **AI Integration** - GPT OSS 120B via GROQ for candidate evaluation

---

## 🔗 ARCHITECTURE DIAGRAM (Cross-Origin Deployment)

```
┌─────────────────────────────────────────────────────────────────┐
│                   CLIENT (Browser)                              │
│                  Vercel Frontend                               │
│              https://your-app.vercel.app                        │
└─────────────────────────────┬───────────────────────────────────┘
                              │ HTTPS + CORS
                              │ Origin: https://your-app.vercel.app
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              HUGGING FACE SPACE (Backend)                        │
│            https://your-space.hf.space                          │
│                    Port: 7860                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │              MIDDLEWARE LAYER                            │  │
│  │  ┌──────────┬──────────┬──────────┬──────────┬────────┐ │  │
│  │  │ Request  │  Rate    │  Timeout │   Auth   │  CORS  │ │  │
│  │  │    ID    │  Limit   │          │ (Clerk)  │  ⚠️   │ │  │
│  │  └──────────┴──────────┴──────────┴──────────┴────────┘ │  │
│  └────────────────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │                    ROUTE LAYER                           │  │
│  │  /api/calculate  /api/queue/*  /api/stream/*  /api/sessions│  │
│  └────────────────────────────────────────────────────────────┘  │
└─────────────────────────────┬───────────────────────────────────┘
                              │ HTTPS + libSQL
                              │ Shared Connection
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    TURSO DATABASE                               │
│              libsql://your-db.turso.io                          │
│              (Shared by Vercel + HF Space)                      │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📦 SUBSYSTEM BREAKDOWN

### SUBSYSTEM 1: BTR ENGINE (Core)
**Location**: `apps/api/src/lib/btr/` + `apps/api/src/lib/seconds-precision-btr.ts`

**Purpose**: Birth Time Rectification - determines exact birth time to seconds precision

**Key Files**:
| File | Purpose | Critical Issues to Check |
|------|---------|-------------------------|
| `seconds-precision-btr.ts` | Main orchestrator, 6-stage pipeline | Stage coordination, error handling |
| `btr/orchestrator.ts` | BTR orchestration logic | State management, cancellation |
| `btr/stages/stage1-exhaustive-data.ts` | Generate candidate times | Data quality, timezone handling |
| `btr/stages/stage2-batch-tournament.ts` | AI batch evaluation | Prompt quality, response parsing |
| `btr/stages/stage3-refinement-grid.ts` | ±5 min refinement | Grid boundaries, survivor selection |
| `btr/stages/stage4-deep-analysis.ts` | Divisional chart analysis | Dasha calculations, Varga accuracy |
| `btr/stages/stage5-micro-grid.ts` | ±30 sec micro grid | Precision retention, floating point |
| `btr/stages/stage6-final-precision.ts` | Seconds-level final | KP Sub-Lords, consensus scoring |
| `btr/data-package-builder.ts` | Build data packages for AI | Data completeness, formatting |
| `btr/transit-builder.ts` | Transit calculations | Date accuracy, aspect detection |
| `btr/transit-analyzer.ts` | Transit event scoring | Aspect weights, orb calculation |
| `btr/event-scorer.ts` | Event-to-candidate matching | Scoring logic, weight distribution |
| `btr/planet-enricher.ts` | Add planetary data | Data accuracy, missing values |
| `btr/security-guard.ts` | Input validation | Prompt injection, malicious input |
| `btr/precision-weights.ts` | Scoring weights | Weight distribution, normalization |
| `btr/tatwa-shuddhi.ts` | Tatwa Shuddhi calculations | Algorithm correctness |
| `btr/window-scanner.ts` | Time window scanning | Boundary conditions |
| `btr/prompts/batch-prompt.ts` | AI prompts for batch eval | Prompt engineering, token efficiency |
| `btr/prompts/deep-analysis-prompt.ts` | Deep analysis prompts | Prompt quality, context inclusion |
| `btr/prompts/final-precision-prompt.ts` | Final precision prompts | Precision requirements |
| `btr/extractors/ai-response-extractors.ts` | Parse AI responses | Regex patterns, error handling |

**Common Issues**:
- ❌ Floating point precision loss in time calculations
- ❌ Timezone conversion errors (IST vs UTC)
- ❌ AI response parsing failures (malformed JSON)
- ❌ Memory leaks in stage loops
- ❌ Missing error handling in async operations
- ❌ Incorrect survivor selection logic
- ❌ Prompt injection vulnerabilities

---

### SUBSYSTEM 2: VEDIC ASTROLOGY ENGINE
**Location**: `apps/api/src/lib/vedic-astrology-engine.ts` + specialized modules

**Purpose**: Vedic astrological calculations - Dashas, Divisional Charts, Planetary positions

**Key Files**:
| File | Purpose | Critical Issues to Check |
|------|---------|-------------------------|
| `vedic-astrology-engine.ts` | Main Vedic engine | Dasha calculations, Varga charts |
| `kp-sublords.ts` | KP Sub-Lord calculations | Sub-Lord hierarchy accuracy |
| `shadbala.ts` | Shadbala strength calculations | Weight distribution, formula accuracy |
| `jaimini-astrology.ts` | Jaimini system calculations | Chara Karaka, Rasi Dasha |
| `kalachakra-dasha.ts` | Kalachakra Dasha | Cycle calculation, Nakshatra mapping |
| `nadi-amsha.ts` | Nadi Amsha calculations | Amsha subdivision accuracy |
| `pancha-pakshi.ts` | Pancha Pakshi system | Bird assignment, time cycles |
| `gandanta-detection.ts` | Gandanta detection | Water-fire cusp detection |
| `spouse-d9-verification.ts` | D9 spouse verification | D9 calculations, aspect analysis |
| `ephemeris.ts` | Swiss Ephemeris wrapper | Planet positions, file loading |
| `consensus-engine.ts` | Multi-method consensus | Scoring aggregation, weights |

**Common Issues**:
- ❌ Ephemeris file loading failures (missing .se1 files)
- ❌ Incorrect Dasha period calculations
- ❌ Divisional chart (Varga) calculation errors
- ❌ Sub-Lord hierarchy mistakes
- ❌ Gandanta detection false positives/negatives
- ❌ Memory leaks in recursive calculations
- ❌ Incorrect planetary positions due to Ayanamsa

---

### SUBSYSTEM 3: QUEUE & CONCURRENCY
**Location**: `apps/api/src/lib/queue-manager.ts`, `apps/api/src/lib/progress-tracker.ts`

**Purpose**: Manage concurrent BTR sessions, track progress

**Key Files**:
| File | Purpose | Critical Issues to Check |
|------|---------|-------------------------|
| `queue-manager.ts` | FIFO queue, max 3 concurrent | Race conditions, deadlock |
| `progress-tracker.ts` | Stage/step tracking with ETA | State consistency, SSE updates |
| `memory-manager.ts` | Heap monitoring, GC trigger | Memory leak detection |
| `cancellation-manager.ts` | Session cancellation | Cleanup, resource release |
| `time-offset-manager.ts` | Time offset handling | Offset calculation accuracy |

**Common Issues**:
- ❌ Race conditions in queue operations
- ❌ Deadlock when max concurrent reached
- ❌ Memory leaks from uncleaned sessions
- ❌ Progress state inconsistency
- ❌ Cancellation not cleaning up resources
- ❌ SSE connection drops not handled

---

### SUBSYSTEM 4: AI INTEGRATION
**Location**: `apps/api/src/lib/ai-client.ts`

**Purpose**: DeepSeek R1 API integration with retry, batching, streaming

**Key Files**:
| File | Purpose | Critical Issues to Check |
|------|---------|-------------------------|
| `ai-client.ts` | DeepSeek API client | Retry logic, timeout handling |
| `btr/prompts/*.ts` | AI prompts | Token efficiency, prompt injection |
| `btr/extractors/*.ts` | Response parsing | Regex patterns, error handling |

**Common Issues**:
- ❌ Exponential backoff not working
- ❌ Timeout causing partial responses
- ❌ Retry loop infinite
- ❌ Streaming data corruption
- ❌ API key exposure in logs
- ❌ Cost not tracked (token usage)

---

### SUBSYSTEM 5: ENCRYPTION & SECURITY
**Location**: `apps/api/src/lib/encryption/`, `apps/api/src/lib/crypto-adapter.ts`

**Purpose**: Encrypt birth data with AES-256-GCM

**Key Files**:
| File | Purpose | Critical Issues to Check |
|------|---------|-------------------------|
| `encryption/encryption-v2.ts` | V2 encryption (4-part format) | Key derivation, IV generation |
| `encryption/v2.ts` | V2 implementation | GCM mode correctness |
| `crypto-adapter.ts` | Backward compat adapter | 3-part → 4-part conversion |
| `encryption/types.ts` | Encryption types | Type safety |

**Common Issues**:
- ❌ Backward compatibility broken (3-part format)
- ❌ IV reuse vulnerability
- ❌ Auth tag validation missing
- ❌ Key derivation weak
- ❌ Encryption errors not handled

---

### SUBSYSTEM 6: MIDDLEWARE CHAIN
**Location**: `apps/api/src/middleware/`

**Purpose**: Request processing pipeline

**Key Files**:
| File | Purpose | Critical Issues to Check |
|------|---------|-------------------------|
| `request-id.ts` | Generate unique request IDs | ID uniqueness, header propagation |
| `rate-limit.ts` | Rate limiting | Sliding window accuracy |
| `timeout.ts` | Request timeout | Timeout cancellation |
| `auth.ts` | Clerk authentication | Token validation, user context |
| `validation.ts` | Zod validation | Schema correctness |
| `error-handler.ts` | Centralized error handling | Error classification, logging |

**Common Issues**:
- ❌ Rate limit bypass
- ❌ Timeout not cancelling operations
- ❌ Auth token not validated properly
- ❌ Validation schema too permissive
- ❌ Error details leaked to client
- ❌ Sensitive data in logs

---

### SUBSYSTEM 7: ROUTES & API
**Location**: `apps/api/src/routes/`

**Purpose**: HTTP endpoints

**Key Files**:
| File | Purpose | Critical Issues to Check |
|------|---------|-------------------------|
| `routes/index.ts` | Route registration | Route ordering, middleware |
| `routes/calculate.ts` | POST /api/calculate | Input validation, queue submission |
| `routes/progress.ts` | GET /api/queue/progress/:id | Progress retrieval |
| `routes/stream.ts` | GET /api/stream/:id | SSE streaming |
| `routes/sessions.ts` | GET /api/sessions | Session listing, pagination |
| `routes/health.ts` | Health checks | Dependency health |
| `routes/admin.ts` | Admin operations | Authorization, dangerous ops |
| `routes/queue.ts` | Queue operations | Queue manipulation |

**Common Issues**:
- ❌ Missing input validation
- ❌ SQL injection in database queries
- ❌ XSS in API responses
- ❌ CORS misconfiguration
- ❌ Admin routes not protected
- ❌ SSE connection limits not enforced

---

### SUBSYSTEM 8: DATABASE
**Location**: `packages/db/src/`, `apps/api/src/lib/session-events.ts`

**Purpose**: Data persistence with Drizzle ORM

**Key Files**:
| File | Purpose | Critical Issues to Check |
|------|---------|-------------------------|
| `packages/db/src/schema.ts` | Database schema | Indexes, constraints |
| `packages/db/src/drizzle.ts` | Drizzle connection | Connection pooling |
| `apps/api/src/lib/session-events.ts` | Session CRUD operations | Query efficiency |
| `apps/api/src/lib/user-sync.ts` | User synchronization | Sync consistency |

**Common Issues**:
- ❌ Missing indexes on frequent queries
- ❌ N+1 query problem
- ❌ Connection leaks
- ❌ Transaction not rolled back on error
- ❌ Data corruption from concurrent writes

---

### SUBSYSTEM 9: UTILITIES & HELPERS
**Location**: `apps/api/src/lib/utils/`, `apps/api/src/utils/`

**Purpose**: Helper functions, formatters

**Key Files**:
| File | Purpose | Critical Issues to Check |
|------|---------|-------------------------|
| `utils/formatting.ts` | Data formatting | Number/date formatting |
| `utils/dms-formatter.ts` | DMS (Degrees Minutes Seconds) | Precision handling |
| `utils/ephemeris-helpers.ts` | Ephemeris helpers | Coordinate conversion |
| `utils/array-helpers.ts` | Array operations | Edge cases |
| `utils/response.ts` | API response formatting | Consistency |
| `utils/logger.ts` | Pino logger wrapper | Log levels, redaction |
| `utils/debug-logger.ts` | Debug logging | Conditional logging |

**Common Issues**:
- ❌ Floating point formatting errors
- ❌ Timezone not handled in date formatting
- ❌ Array operations mutating input
- ❌ Sensitive data not redacted in logs
- ❌ Debug logs in production

---

### SUBSYSTEM 10: ERROR HANDLING
**Location**: `apps/api/src/errors/index.ts`, `apps/api/src/middleware/error-handler.ts`

**Purpose**: Centralized error handling

**Key Files**:
| File | Purpose | Critical Issues to Check |
|------|---------|-------------------------|
| `errors/index.ts` | Error class hierarchy | Error types, context |
| `middleware/error-handler.ts` | Error middleware | Error classification |

**Error Classes**:
- `AppError` - Base error
- `ValidationError` - Input validation errors
- `NotFoundError` - Resource not found
- `AIServiceError` - AI API errors
- `CalculationError` - Calculation failures
- `QueueError` - Queue operations
- `EncryptionError` - Encryption/decryption
- `DatabaseError` - Database operations

**Common Issues**:
- ❌ Using raw `Error()` instead of custom classes
- ❌ Missing context in error objects
- ❌ Stack traces leaked to client
- ❌ Errors not logged properly
- ❌ Error codes inconsistent

---

## 📁 CRITICAL FILES REFERENCE

### Must-Review Files (Priority Order)

#### 🔴 CRITICAL - System Breaking
1. `apps/api/src/lib/seconds-precision-btr.ts` - Main BTR orchestrator
2. `apps/api/src/lib/queue-manager.ts` - Queue logic
3. `apps/api/src/lib/encryption/encryption-v2.ts` - Encryption
4. `apps/api/src/lib/ai-client.ts` - AI integration
5. `apps/api/src/middleware/error-handler.ts` - Error handling

#### 🟠 HIGH - Core Functionality
6. `apps/api/src/lib/vedic-astrology-engine.ts` - Vedic calculations
7. `apps/api/src/lib/consensus-engine.ts` - Consensus scoring
8. `apps/api/src/lib/ephemeris.ts` - Swiss Ephemeris
9. `apps/api/src/lib/btr/orchestrator.ts` - BTR orchestration
10. `apps/api/src/lib/progress-tracker.ts` - Progress tracking
11. `apps/api/src/routes/calculate.ts` - Main API endpoint
12. `apps/api/src/routes/stream.ts` - SSE streaming

#### 🟡 MEDIUM - Important Features
13. `apps/api/src/lib/btr/stages/*.ts` - All 6 stages
14. `apps/api/src/lib/btr/data-package-builder.ts` - Data packages
15. `apps/api/src/lib/btr/extractors/ai-response-extractors.ts` - AI parsing
16. `apps/api/src/lib/btr/prompts/*.ts` - AI prompts
17. `apps/api/src/lib/kp-sublords.ts` - KP calculations
18. `apps/api/src/lib/shadbala.ts` - Shadbala
19. `apps/api/src/lib/jaimini-astrology.ts` - Jaimini
20. `apps/api/src/lib/kalachakra-dasha.ts` - Kalachakra
21. `apps/api/src/middleware/auth.ts` - Authentication
22. `apps/api/src/middleware/validation.ts` - Validation

#### 🟢 LOW - Supporting Code
23. `apps/api/src/lib/utils/*.ts` - Utilities
24. `apps/api/src/lib/memory-manager.ts` - Memory management
25. `apps/api/src/lib/cancellation-manager.ts` - Cancellation
26. `apps/api/src/lib/time-offset-manager.ts` - Time offsets
27. `apps/api/src/middleware/rate-limit.ts` - Rate limiting
28. `apps/api/src/middleware/timeout.ts` - Timeout

---

## 🐛 COMMON ISSUES & PATTERNS

### ⚠️ CRITICAL ISSUE: Session Clone → Re-Analyze Failure

**Symptoms**:
1. User clones a completed session from dashboard
2. New draft session is created
3. User goes to edit page and clicks "Start Analysis"
4. Analysis page shows "Session not found, connection error"
5. Backend receives no request

**Root Cause Analysis**:

#### Possible Cause 1: CORS Configuration
```typescript
// apps/api/src/server.ts (Line 48-52)
app.use(cors({
    origin: config.app.allowedOrigins === '*' ? '*' : config.app.allowedOrigins?.split(','),
    credentials: true,
    maxAge: 86400,
}));
```

**Problem**: Hugging Face Space may not have correct CORS origins configured
**Check**: `NEXT_PUBLIC_BACKEND_URL` in Vercel environment
**Fix**: Ensure HF Space CORS allows `https://your-app.vercel.app`

#### Possible Cause 2: Backend URL Misconfiguration
```typescript
// apps/web/lib/config/env.ts (or similar)
export const env = {
  api: {
    backendUrl: process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:7860',
  },
};
```

**Problem**: Frontend may be calling wrong backend URL
**Check**: Browser DevTools → Network tab → Failed requests
**Fix**: Set `NEXT_PUBLIC_BACKEND_URL=https://your-space.hf.space` in Vercel

#### Possible Cause 3: Session Not Persisted to Database
```typescript
// apps/api/src/routes/sessions.ts (Line 236-321)
router.post('/:id/clone', authMiddleware, async (req, res) => {
    // ... clone logic ...
    await executeWithRetry(() =>
        db.insert(sessions).values(clonePayload as any)
    );
});
```

**Problem**: Clone succeeds but session not in Turso (replication delay or error)
**Check**: Turso database directly for new session ID
**Fix**: Add verification after insert

#### Possible Cause 4: Hugging Face Space Sleep Mode
**Problem**: HF Space sleeps after inactivity, cold start takes time
**Symptoms**: First request times out, subsequent requests work
**Fix**: Add keep-alive endpoint or use HF Space with persistent tier

#### Possible Cause 5: Auth Token Issues
```typescript
// apps/web/lib/api-client.ts (Line 17-51)
public static async post(url: string, body: any, getToken) {
    const token = await this.getAuthToken(getToken);
    if (!token) {
        console.error('Token retrieval FAILED');
    }
    // ...
}
```

**Problem**: Clerk token not passed correctly to HF Space
**Check**: Browser DevTools → Headers → Authorization
**Fix**: Verify Clerk JWT validation on backend

**Debugging Steps**:
1. Open Browser DevTools → Network tab
2. Clone a session and note the new session ID
3. Click "Start Analysis" on edit page
4. Look for failed requests to `/api/queue/requeue`
5. Check request URL, headers, and response
6. If request not sent → Frontend issue
7. If request sent but fails → Backend/CORS issue

**Files to Check**:
- `apps/web/lib/config/env.ts` - Backend URL configuration
- `apps/api/src/server.ts` - CORS configuration
- `apps/web/app/rectify/[id]/edit/EditSessionClient.tsx` - Requeue call (Line 196)
- `apps/api/src/routes/queue.ts` - Requeue endpoint (Line 459)
- `apps/web/lib/api-client.ts` - API client (Line 17)

---

### Issue 2: Floating Point Precision Loss
**Symptoms**: Time calculations off by milliseconds, incorrect planetary positions

**Files to Check**:
- `lib/seconds-precision-btr.ts`
- `lib/btr/stages/*.ts`
- `lib/ephemeris.ts`
- `lib/vedic-astrology-engine.ts`

**Pattern**:
```typescript
// ❌ BAD - Floating point accumulation
let time = 0;
for (let i = 0; i < 1000; i++) {
  time += 0.1; // Accumulates error
}

// ✅ GOOD - Use integers or fixed precision
let timeMs = 0;
for (let i = 0; i < 1000; i++) {
  timeMs += 100; // Milliseconds as integer
}
const time = timeMs / 1000;
```

### Issue 3: Timezone Conversion Errors
**Symptoms**: Wrong birth time, events don't match

**Files to Check**:
- `lib/btr/stages/stage1-exhaustive-data.ts`
- `lib/timezones.ts`
- `lib/cities.ts`

**Pattern**:
```typescript
// ❌ BAD - No timezone handling
const birthTime = new Date(birthDate + ' ' + birthTime);

// ✅ GOOD - Explicit timezone
const birthTime = new Date(`${birthDate}T${birthTime}${timezoneOffset}`);
```

### Issue 4: AI Response Parsing Failures
**Symptoms**: "Failed to parse AI response", empty candidates

**Files to Check**:
- `lib/btr/extractors/ai-response-extractors.ts`
- `lib/ai-client.ts`
- `lib/btr/prompts/*.ts`

**Pattern**:
```typescript
// ❌ BAD - No error handling
const parsed = JSON.parse(aiResponse);

// ✅ GOOD - Robust parsing
let parsed;
try {
  parsed = JSON.parse(aiResponse);
} catch (e) {
  throw new AIServiceError('Failed to parse AI response', {
    response: aiResponse.substring(0, 200),
  });
}
```

### Issue 5: Memory Leaks in Loops
**Symptoms**: Heap grows indefinitely, OOM kills process

**Files to Check**:
- `lib/btr/stages/*.ts`
- `lib/queue-manager.ts`
- `lib/memory-manager.ts`

**Pattern**:
```typescript
// ❌ BAD - Accumulating in loop
const candidates = [];
for (const time of timeRange) {
  const data = calculate(time); // Creates large objects
  candidates.push(data);
}

// ✅ GOOD - Process and discard
const candidates = [];
for (const time of timeRange) {
  const data = calculate(time);
  candidates.push({ id: data.id, score: data.score }); // Only keep needed
}
```

### Issue 6: Race Conditions in Queue
**Symptoms**: Duplicate sessions, queue state corruption

**Files to Check**:
- `lib/queue-manager.ts`
- `lib/progress-tracker.ts`

**Pattern**:
```typescript
// ❌ BAD - Non-atomic check-and-set
if (queue.length < MAX_CONCURRENT) {
  queue.push(session); // Race condition here
}

// ✅ GOOD - Atomic operation
const added = queue.tryAdd(session);
if (!added) {
  throw new QueueError('Queue full');
}
```

### Issue 7: Missing Error Handling
**Symptoms**: Unhandled promise rejections, silent failures

**Files to Check**:
- All async functions in `lib/`

**Pattern**:
```typescript
// ❌ BAD - No error handling
async function process() {
  const result = await aiCall();
  return result;
}

// ✅ GOOD - Proper error handling
async function process() {
  try {
    const result = await aiCall();
    return result;
  } catch (error) {
    logger.error({ error }, 'AI call failed');
    throw new AIServiceError('Processing failed', { cause: error });
  }
}
```

### Issue 8: Ephemeris File Loading
**Symptoms**: "Ephemeris file not found", wrong planetary positions

**Files to Check**:
- `lib/ephemeris.ts`
- `ephe/` directory

**Pattern**:
```typescript
// ❌ BAD - No validation
const ephemeris = loadSwissEph();

// ✅ GOOD - Validate files
const ephemeris = loadSwissEph();
if (!ephemeris.isLoaded()) {
  throw new CalculationError('Ephemeris files not found', {
    path: './ephe',
  });
}
```

### Issue 9: Prompt Injection Vulnerabilities
**Symptoms**: AI returns unexpected responses, security risk

**Files to Check**:
- `lib/btr/security-guard.ts`
- `lib/btr/prompts/*.ts`

**Pattern**:
```typescript
// ❌ BAD - Direct user input in prompt
const prompt = `Analyze this: ${userInput}`;

// ✅ GOOD - Sanitize input
const sanitized = securityGuard.sanitize(userInput);
const prompt = `Analyze this: ${sanitized}`;
```

### Issue 10: Encryption Backward Compatibility
**Symptoms**: Old sessions can't be decrypted

**Files to Check**:
- `lib/encryption/encryption-v2.ts`
- `lib/crypto-adapter.ts`

**Pattern**:
```typescript
// ❌ BAD - Only handles new format
const decrypted = decryptV2(encryptedData);

// ✅ GOOD - Handles both formats
const decrypted = cryptoAdapter.decrypt(encryptedData); // Auto-detects format
```

### Issue 11: Cross-Origin Resource Sharing (CORS) Issues

**Symptoms**: Browser blocks requests from Vercel to Hugging Face Space

**Files to Check**:
- `apps/api/src/server.ts` - CORS middleware
- `apps/web/lib/config/env.ts` - Backend URL
- `apps/web/next.config.js` - Rewrites (if any)

**Pattern**:
```typescript
// ❌ BAD - Too restrictive
app.use(cors({
    origin: 'http://localhost:3000', // Only allows localhost
}));

// ❌ BAD - Wildcard with credentials
app.use(cors({
    origin: '*', // Cannot use * with credentials: true
    credentials: true,
}));

// ✅ GOOD - Explicit origins
app.use(cors({
    origin: [
        'https://your-app.vercel.app',
        'http://localhost:3000',
    ],
    credentials: true,
}));

// ✅ GOOD - Dynamic origin validation
app.use(cors({
    origin: (origin, callback) => {
        const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'];
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
}));
```

**Environment Variables Required**:
```bash
# On Hugging Face Space
ALLOWED_ORIGINS=https://your-app.vercel.app,http://localhost:3000

# On Vercel
NEXT_PUBLIC_BACKEND_URL=https://your-space.hf.space
```

---

### Issue 12: Hugging Face Space Cold Starts

**Symptoms**: First request after inactivity times out or takes 30+ seconds

**Files to Check**:
- `apps/api/src/server.ts` - Server startup
- `apps/web/lib/api-client.ts` - Timeout handling

**Pattern**:
```typescript
// ❌ BAD - No timeout handling
const res = await fetch(backendUrl + '/api/queue/requeue', {
    method: 'POST',
    body: JSON.stringify({ sessionId }),
});

// ✅ GOOD - With timeout and retry
const res = await fetch(backendUrl + '/api/queue/requeue', {
    method: 'POST',
    body: JSON.stringify({ sessionId }),
    signal: AbortSignal.timeout(30000), // 30 second timeout
});

// Add retry logic for cold starts
async function fetchWithRetry(url, options, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            const res = await fetch(url, options);
            if (res.ok) return res;
            if (i < maxRetries - 1) {
                await new Promise(r => setTimeout(r, 1000 * (i + 1))); // Exponential backoff
            }
        } catch (error) {
            if (i < maxRetries - 1) {
                await new Promise(r => setTimeout(r, 1000 * (i + 1)));
            } else {
                throw error;
            }
        }
    }
}
```

---

### Issue 13: Turso Database Connection Issues

**Symptoms**: Database queries fail, "database is locked" errors

**Files to Check**:
- `packages/db/src/drizzle.ts` - Connection configuration
- `apps/api/src/lib/session-events.ts` - Query operations

**Pattern**:
```typescript
// ❌ BAD - No connection pooling
export const db = drizzle(libsql(process.env.TURSO_DATABASE_URL));

// ✅ GOOD - With connection pool
const client = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
    // Connection pool settings
});
export const db = drizzle(client);
```

**Common Issues**:
- Connection string wrong (libsql:// vs https://)
- Auth token missing or expired
- Too many concurrent connections (free tier limit)
- Database not shared between Vercel and HF Space

---

### Issue 14: Clerk Auth Token Propagation

**Symptoms**: 401 Unauthorized errors, "No session token found"

**Files to Check**:
- `apps/web/lib/api-client.ts` - Token handling
- `apps/api/src/middleware/auth.ts` - Token validation

**Pattern**:
```typescript
// ❌ BAD - Token not passed
const res = await fetch(backendUrl + '/api/queue/requeue', {
    method: 'POST',
    body: JSON.stringify({ sessionId }),
});

// ✅ GOOD - Token in header and query param
const token = await getToken();
const separator = url.includes('?') ? '&' : '?';
const finalUrl = `${url}${separator}sid=${encodeURIComponent(token)}`;

const res = await fetch(finalUrl, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
    },
    credentials: 'include',
});
```

---

### Issue 15: SSE Connection Drops
**Symptoms**: Progress stops updating, client hangs

**Files to Check**:
- `routes/stream.ts`
- `lib/progress-tracker.ts`

**Pattern**:
```typescript
// ❌ BAD - No reconnection handling
res.write(`data: ${JSON.stringify(data)}\n\n`);

// ✅ GOOD - Handle disconnects
if (!res.writable) {
  logger.info('Client disconnected');
  return;
}
res.write(`data: ${JSON.stringify(data)}\n\n`);
```

---

## 🔄 ITERATIVE AUDIT PROCESS

### Phase 0: Deployment-Specific Checks (15 min) ⚠️ CRITICAL
**Goal**: Verify cross-origin deployment is working

**Steps**:
1. [ ] Check Vercel environment variables
   - [ ] `NEXT_PUBLIC_BACKEND_URL` points to HF Space
   - [ ] `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is set
2. [ ] Check Hugging Face Space environment variables
   - [ ] `ALLOWED_ORIGINS` includes Vercel domain
   - [ ] `TURSO_DATABASE_URL` is set
   - [ ] `TURSO_AUTH_TOKEN` is set
   - [ ] `CLERK_SECRET_KEY` is set
   - [ ] `AI_API_KEY` is set
3. [ ] Test CORS configuration
   - [ ] Open HF Space in browser
   - [ ] Check response headers for `Access-Control-Allow-Origin`
4. [ ] Test backend health
   - [ ] Visit `https://your-space.hf.space/health`
   - [ ] Should return `{"status":"healthy"}`
5. [ ] Test database connection
   - [ ] Run query from both Vercel and HF Space
   - [ ] Verify same data is returned

**What to Look For**:
- ❌ Wrong backend URL in Vercel
- ❌ CORS blocking requests
- ❌ Database connection string wrong
- ❌ Auth token not propagating
- ❌ HF Space sleeping (cold start)

---

### Phase 1: Quick Assessment (30 min)
**Goal**: Identify obvious issues without deep analysis

**Steps**:
1. [ ] Run `npm run lint` - Check for linting errors
2. [ ] Run `npm test` - Check for failing tests
3. [ ] Run `npm run typecheck` - Check for TypeScript errors
4. [ ] Check `logs/` directory for recent errors
5. [ ] Review `apps/api/src/errors/` - Understand error types
6. [ ] Check environment variables - Ensure all required vars are set

**What to Look For**:
- ❌ Linting errors (unused vars, missing types)
- ❌ Failing tests
- ❌ TypeScript errors
- ❌ Error patterns in logs
- ❌ Missing environment variables

---

### Phase 2: Architecture Review (1 hour)
**Goal**: Understand system flow and identify design issues

**Steps**:
1. [ ] Review `apps/api/src/lib/seconds-precision-btr.ts` - Main orchestrator
2. [ ] Review `apps/api/src/lib/queue-manager.ts` - Queue logic
3. [ ] Review `apps/api/src/routes/calculate.ts` - Entry point
4. [ ] Draw data flow diagram - Understand request lifecycle
5. [ ] Identify bottlenecks - Where could things fail?

**What to Look For**:
- ❌ Circular dependencies
- ❌ Tight coupling
- ❌ Missing error boundaries
- ❌ Single points of failure
- ❌ Inefficient data flow

---

### Phase 3: Critical Path Audit (2 hours)
**Goal**: Deep dive into core BTR pipeline

**Steps**:
1. [ ] Audit Stage 1 - `lib/btr/stages/stage1-exhaustive-data.ts`
   - [ ] Timezone handling
   - [ ] Candidate generation logic
   - [ ] Memory usage

2. [ ] Audit Stage 2 - `lib/btr/stages/stage2-batch-tournament.ts`
   - [ ] AI prompt quality
   - [ ] Response parsing
   - [ ] Survivor selection

3. [ ] Audit Stage 3 - `lib/btr/stages/stage3-refinement-grid.ts`
   - [ ] Grid boundaries
   - [ ] Precision retention

4. [ ] Audit Stage 4 - `lib/btr/stages/stage4-deep-analysis.ts`
   - [ ] Dasha calculations
   - [ ] Divisional charts

5. [ ] Audit Stage 5 - `lib/btr/stages/stage5-micro-grid.ts`
   - [ ] Micro grid logic
   - [ ] Floating point handling

6. [ ] Audit Stage 6 - `lib/btr/stages/stage6-final-precision.ts`
   - [ ] Final scoring
   - [ ] KP Sub-Lords

**What to Look For**:
- ❌ Floating point precision loss
- ❌ Timezone errors
- ❌ Memory leaks
- ❌ Missing error handling
- ❌ Incorrect calculations

---

### Phase 4: Vedic Engine Audit (1.5 hours)
**Goal**: Verify astrological calculations

**Steps**:
1. [ ] Audit `lib/vedic-astrology-engine.ts`
   - [ ] Vimshottari Dasha
   - [ ] Divisional charts (D1-D60)

2. [ ] Audit `lib/kp-sublords.ts`
   - [ ] Sub-Lord hierarchy
   - [ ] Signification accuracy

3. [ ] Audit `lib/shadbala.ts`
   - [ ] Strength calculations
   - [ ] Weight distribution

4. [ ] Audit `lib/ephemeris.ts`
   - [ ] Planet positions
   - [ ] Ayanamsa handling

5. [ ] Audit specialized systems
   - [ ] `lib/jaimini-astrology.ts`
   - [ ] `lib/kalachakra-dasha.ts`
   - [ ] `lib/nadi-amsha.ts`
   - [ ] `lib/pancha-pakshi.ts`

**What to Look For**:
- ❌ Incorrect ephemeris data
- ❌ Wrong Dasha periods
- ❌ Sub-Lord errors
- ❌ Missing divisional charts

---

### Phase 5: AI Integration Audit (1 hour)
**Goal**: Verify AI client and prompts

**Steps**:
1. [ ] Audit `lib/ai-client.ts`
   - [ ] Retry logic
   - [ ] Timeout handling
   - [ ] Error handling
   - [ ] Token usage tracking

2. [ ] Audit AI prompts
   - [ ] `lib/btr/prompts/batch-prompt.ts`
   - [ ] `lib/btr/prompts/deep-analysis-prompt.ts`
   - [ ] `lib/btr/prompts/final-precision-prompt.ts`

3. [ ] Audit response extractors
   - [ ] `lib/btr/extractors/ai-response-extractors.ts`
   - [ ] Regex patterns
   - [ ] Error handling

**What to Look For**:
- ❌ Infinite retry loops
- ❌ Timeout not working
- ❌ Prompt injection vulnerabilities
- ❌ Malformed AI responses
- ❌ Token waste

---

### Phase 6: Security Audit (1 hour)
**Goal**: Identify security vulnerabilities

**Steps**:
1. [ ] Audit encryption
   - [ ] `lib/encryption/encryption-v2.ts`
   - [ ] `lib/crypto-adapter.ts`
   - [ ] IV generation
   - [ ] Key derivation

2. [ ] Audit authentication
   - [ ] `middleware/auth.ts`
   - [ ] Token validation
   - [ ] User context

3. [ ] Audit input validation
   - [ ] `middleware/validation.ts`
   - [ ] `lib/btr/security-guard.ts`
   - [ ] SQL injection
   - [ ] XSS

4. [ ] Audit logging
   - [ ] `utils/logger.ts`
   - [ ] Sensitive data redaction
   - [ ] Debug logs in production

**What to Look For**:
- ❌ Weak encryption
- ❌ Auth bypass
- ❌ SQL injection
- ❌ XSS vulnerabilities
- ❌ Prompt injection
- ❌ Sensitive data in logs

---

### Phase 7: Performance Audit (1 hour)
**Goal**: Identify performance bottlenecks

**Steps**:
1. [ ] Check memory usage
   - [ ] `lib/memory-manager.ts`
   - [ ] Heap monitoring
   - [ ] GC triggers

2. [ ] Check queue performance
   - [ ] `lib/queue-manager.ts`
   - [ ] Concurrency limits
   - [ ] Queue depth

3. [ ] Check database queries
   - [ ] `packages/db/src/schema.ts` - Indexes
   - [ ] `lib/session-events.ts` - N+1 queries
   - [ ] Connection pooling

4. [ ] Check caching
   - [ ] `lib/calculation-cache.ts`
   - [ ] Cache hit rate
   - [ ] Cache invalidation

**What to Look For**:
- ❌ Memory leaks
- ❌ Slow database queries
- ❌ Missing indexes
- ❌ No caching
- ❌ Inefficient algorithms

---

### Phase 8: Error Handling Audit (30 min)
**Goal**: Verify error handling consistency

**Steps**:
1. [ ] Review error classes
   - [ ] `apps/api/src/errors/index.ts`
   - [ ] Error hierarchy
   - [ ] Context inclusion

2. [ ] Review error middleware
   - [ ] `middleware/error-handler.ts`
   - [ ] Error classification
   - [ ] Response formatting

3. [ ] Check error handling in routes
   - [ ] All route files
   - [ ] Try-catch blocks
   - [ ] Error propagation

**What to Look For**:
- ❌ Raw `Error()` usage
- ❌ Missing context
- ❌ Stack trace leaks
- ❌ Inconsistent error codes

---

### Phase 9: Testing Audit (30 min)
**Goal**: Verify test coverage

**Steps**:
1. [ ] Check test coverage
   - [ ] Run `npm run test:coverage`
   - [ ] Identify uncovered files

2. [ ] Review critical tests
   - [ ] `lib/__tests__/queue-manager.test.ts`
   - [ ] `lib/__tests__/memory-manager.test.ts`
   - [ ] `lib/btr/__tests__/*.test.ts`

3. [ ] Check edge case tests
   - [ ] `lib/__tests__/edge-cases.test.ts`
   - [ ] `lib/__tests__/stress_benchmarks.test.ts`

**What to Look For**:
- ❌ Low coverage on critical files
- ❌ Missing edge case tests
- ❌ Flaky tests

---

### Phase 10: Documentation & Final Review (30 min)
**Goal**: Ensure everything is documented

**Steps**:
1. [ ] Check inline comments
   - [ ] Complex logic explained
   - [ ] TODOs addressed

2. [ ] Check README files
   - [ ] `apps/api/README.md`
   - [ ] `lib/encryption/README.md`

3. [ ] Final checklist
   - [ ] All critical issues resolved
   - [ ] Tests passing
   - [ ] Linting clean
   - [ ] Documentation updated

---

## 💬 TOKEN-EFFICIENT PROMPTS

### Prompt 0: Deployment & CORS Audit ⚠️ CRITICAL
```
Audit cross-origin deployment for AI-Pandit:

DEPLOYMENT STACK:
- Frontend: Vercel Free Tier (https://your-app.vercel.app)
- Backend: Hugging Face Space Free Tier (https://your-space.hf.space)
- Database: Turso Free Tier (libsql://...)
- Auth: Clerk Free Tier

ISSUE: Session clone → re-analyze fails
1. User clones completed session → New draft created
2. User clicks "Start Analysis" on edit page
3. Analysis page shows "Session not found, connection error"
4. Backend receives no request

CHECK:
1. CORS configuration in apps/api/src/server.ts
2. Backend URL in Vercel env (NEXT_PUBLIC_BACKEND_URL)
3. ALLOWED_ORIGINS in HF Space env
4. Auth token propagation (Clerk)
5. HF Space cold starts
6. Turso DB connection shared by both

FILES TO REVIEW:
- apps/api/src/server.ts (CORS)
- apps/web/lib/config/env.ts (Backend URL)
- apps/web/lib/api-client.ts (API calls)
- apps/api/src/routes/sessions.ts (clone endpoint)
- apps/api/src/routes/queue.ts (requeue endpoint)
- apps/web/app/rectify/[id]/edit/EditSessionClient.tsx (requeue call)

Identify:
1. Root cause of "Session not found" error
2. Why backend receives no request
3. CORS issues
4. Configuration problems
5. Suggested fixes
```

### Prompt 1: System Overview Analysis
```
Analyze this backend system for AI-Pandit BTR engine:

TECH STACK:
- Express.js + TypeScript (ESM)
- Turso (libSQL) + Drizzle ORM
- GPT OSS 120B (via GROQ AI API)
- Swiss Ephemeris for astrology
- AES-256-GCM encryption

CORE SUBSYSTEMS:
1. BTR Engine (6-stage pipeline)
2. Vedic Astrology Engine (Dashas, Varga, KP)
3. Queue Manager (max 3 concurrent)
4. AI Client (DeepSeek integration)
5. Encryption (birth data)
6. Middleware chain
7. API routes
8. Database layer

Identify:
1. Architectural issues
2. Potential bottlenecks
3. Security concerns
4. Performance risks
```

### Prompt 2: BTR Pipeline Audit
```
Audit the BTR (Birth Time Rectification) pipeline:

STAGES:
1. Exhaustive Data Generation - Generate candidate times
2. Batch Tournament - AI evaluates batches
3. Refinement Grid - ±5 min at 1-min intervals
4. Deep Analysis - Divisional charts + multi-dasha
5. Micro Grid - ±30 sec at 6-sec intervals
6. Final Precision - Seconds-level with KP Sub-Lords

CHECK:
1. Floating point precision handling
2. Timezone conversion accuracy
3. Memory usage in loops
4. Error handling in async ops
5. AI response parsing robustness
6. Survivor selection logic

Common issues:
- Precision loss in time calculations
- Timezone errors (IST vs UTC)
- AI parsing failures
- Memory leaks
- Missing error handling
```

### Prompt 3: Vedic Engine Audit
```
Audit Vedic Astrology calculations:

MODULES:
- Vimshottari Dasha
- Divisional Charts (D1-D60)
- KP Sub-Lords
- Shadbala
- Jaimini (Chara Karaka, Rasi Dasha)
- Kalachakra Dasha
- Nadi Amsha
- Pancha Pakshi
- Gandanta Detection

CHECK:
1. Ephemeris file loading (swisseph-wasm)
2. Ayanamsa handling
3. Dasha period calculations
4. Sub-Lord hierarchy accuracy
5. Divisional chart calculations
6. Gandanta detection accuracy

Common issues:
- Missing .se1 ephemeris files
- Wrong Dasha periods
- Sub-Lord errors
- Memory leaks in recursion
```

### Prompt 4: Security Audit
```
Audit security for AI-Pandit backend:

AREAS:
1. Encryption (AES-256-GCM for birth data)
2. Authentication (Clerk)
3. Input Validation (Zod)
4. Rate Limiting
5. SQL Injection
6. XSS
7. Prompt Injection
8. Logging (sensitive data redaction)

CHECK:
1. Encryption backward compatibility (3-part → 4-part)
2. IV generation (no reuse)
3. Auth token validation
4. Input sanitization
5. Prepared statements (Drizzle ORM)
6. Output encoding
7. AI prompt injection protection
8. Log redaction

Common issues:
- Weak encryption
- Auth bypass
- SQL injection
- XSS vulnerabilities
- Prompt injection
- Sensitive data in logs
```

### Prompt 5: Performance Audit
```
Audit performance for AI-Pandit backend:

AREAS:
1. Memory Management (GC at 6GB threshold)
2. Queue Concurrency (max 3)
3. Database Queries (indexes, N+1)
4. Caching (calculation cache)
5. AI API calls (retry, timeout)

CHECK:
1. Memory leaks in loops
2. Heap monitoring
3. Connection pooling
4. Missing indexes
5. Cache hit rate
6. AI token usage
7. Retry logic (exponential backoff)

Common issues:
- Memory leaks
- Slow queries
- Missing indexes
- No caching
- Inefficient algorithms
- Infinite retry loops
```

### Prompt 6: Session Clone & Re-Analyze Flow Audit
```
Audit session clone and re-analyze flow:

FLOW:
1. Dashboard → Clone completed session → POST /api/sessions/:id/clone
2. Backend creates new draft session in Turso
3. Frontend redirects to /rectify/[id]/edit
4. User edits data → Auto-saves to /api/sessions/[id] (PUT)
5. User clicks "Start Analysis" → POST /api/queue/requeue
6. Backend resets session state → Adds to queue → Starts processing
7. Frontend redirects to /rectify/[id] → SSE stream starts

ISSUE: Step 5 fails - "Session not found, connection error"

CHECK:
1. Clone endpoint - apps/api/src/routes/sessions.ts:236
   - Session creation in database
   - Return value (new session ID)

2. Edit page requeue call - apps/web/app/rectify/[id]/edit/EditSessionClient.tsx:196
   - Backend URL used
   - Session ID passed
   - Token handling

3. API client - apps/web/lib/api-client.ts:17
   - Request construction
   - Headers (Authorization)
   - Error handling

4. Requeue endpoint - apps/api/src/routes/queue.ts:459
   - Session lookup
   - State reset
   - Queue addition

5. CORS - apps/api/src/server.ts:48
   - Allowed origins
   - Credentials mode

Identify:
1. Where flow breaks
2. Why "Session not found"
3. Why backend receives no request
4. Configuration issues
5. Fixes needed
```

### Prompt 7: GROQ AI API Integration Audit
```
Audit GROQ AI API integration for AI-Pandit:

CURRENT SETUP:
- Model: GPT OSS 120B
- API: GROQ (https://api.groq.com)
- Base URL: AI_BASE_URL env variable

CHECK:
1. API client configuration - apps/api/src/lib/ai-client.ts
   - Base URL correct?
   - API key present?
   - Model name correct?
   - Rate limit handling?

2. Request/response handling
   - Retry logic with exponential backoff
   - Timeout configuration
   - Error handling
   - Response parsing

3. Token usage tracking
   - Are tokens being counted?
   - Cost tracking enabled?
   - Usage limits enforced?

4. Model compatibility
   - GPT OSS 120B prompt format
   - Response format expectations
   - Context window limits

5. Rate limiting
   - GROQ rate limits (RPM, TPM)
   - Queue management
   - Backoff strategy

Common issues:
- API base URL misconfigured
- Model name incorrect
- Rate limit exceeded
- Token waste (over-provisioning)
- Response format changes
- Timeout too short/long
- Retry not working
- Cost not tracked
```

### Prompt 8: Specific File Audit (Replace with actual file)
```
Audit this file for issues:

[FILE CONTENT HERE]

CHECK:
1. TypeScript errors
2. Unused variables
3. Missing error handling
4. Memory leaks
5. Race conditions
6. Security issues
7. Performance issues
8. Code quality

Provide:
1. List of issues found
2. Severity (Critical/High/Medium/Low)
3. Suggested fixes
```

---

## ✅ CHECKLISTS

### Pre-Audit Checklist
- [ ] Backup current code (git commit)
- [ ] Set up test environment
- [ ] Review recent error logs
- [ ] Identify known issues from users
- [ ] Prepare test data

### Post-Audit Checklist
- [ ] All critical issues resolved
- [ ] All high issues resolved
- [ ] Tests passing
- [ ] Linting clean
- [ ] Type checking passes
- [ ] Documentation updated
- [ ] Changes tested in staging
- [ ] Performance benchmarks run
- [ ] Security scan completed

### Deployment Checklist
- [ ] Environment variables verified
- [ ] Database migrations applied
- [ ] Dependencies up to date
- [ ] Health checks passing
- [ ] Monitoring configured
- [ ] Rollback plan ready
- [ ] Team notified
- [ ] Documentation updated

---

## 📊 QUICK REFERENCE

### Deployment URLs
```
Frontend (Vercel): https://your-app.vercel.app
Backend (HF Space): https://your-space.hf.space
Database (Turso): libsql://your-db.turso.io
Auth (Clerk): https://your-app.clerk.accounts.dev
```

### Environment Variables (Your Actual Setup)

#### Hugging Face Space - Public Variables
```
AI_MODEL                    # AI model to use (GPT OSS 120B)
RSS_THRESHOLD_GB            # RSS memory threshold
HEAP_THRESHOLD_GB           # Heap memory threshold
MAX_CONCURRENT_SESSIONS     # Max concurrent BTR sessions
RATE_LIMIT_WINDOW_MS        # Rate limit window (ms)
RATE_LIMIT_MAX_REQUESTS    # Max requests per window
REQUEST_TIMEOUT_MS          # Request timeout (ms)
AI_TIMEOUT_MS              # AI API timeout (ms)
FRONTEND_URL              # Vercel frontend URL ⚠️ CRITICAL
AI_BASE_URL                # AI API base URL (GROQ AI API)
ALLOWED_ORIGINS            # Allowed CORS origins ⚠️ CRITICAL
AI_REASONER_IDENTIFIERS    # AI reasoner identifiers
AI_REASONING_MODE          # AI reasoning mode
AI_MAX_TOKENS             # Max tokens for AI
AI_STAGE2_MAX_TOKENS       # Stage 2 max tokens
AI_STAGE4_MAX_TOKENS       # Stage 4 max tokens
AI_STAGE6_MAX_TOKENS       # Stage 6 max tokens
AI_BATCH_SIZE_MIN          # Min batch size
AI_BATCH_SIZE_MAX          # Max batch size
AI_SURVIVAL_RATE_BASE     # Survival rate base
AI_SURVIVAL_ELASTICITY_FACTOR # Survival elasticity
AI_PARALLEL_CONCURRENCY    # Parallel AI concurrency
AI_PARALLEL_STAGGER_MS    # Parallel stagger (ms)
BTR_STAGE2_MAX_ROUNDS      # Stage 2 max rounds
BTR_STAGE6_MAX_ROUNDS      # Stage 6 max rounds
BTR_CLUSTER_THRESHOLD_MINS  # Cluster threshold (mins)
BTR_STAGE4_MAX_ROUNDS      # Stage 4 max rounds
```

#### Hugging Face Space - Secrets (Private)
```
CLERK_SECRET_KEY                 # Clerk secret key ⚠️ CRITICAL
CLERK_WEBHOOK_SECRET            # Clerk webhook secret
ENCRYPTION_SECRET                # AES-256 encryption key ⚠️ CRITICAL
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL  # Clerk after sign-in URL
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY    # Clerk publishable key
NEXT_PUBLIC_CLERK_SIGN_IN_URL         # Clerk sign-in URL
NEXT_PUBLIC_CLERK_SIGN_UP_URL         # Clerk sign-up URL
TURSO_AUTH_TOKEN                # Turso database auth ⚠️ CRITICAL
TURSO_DATABASE_URL              # Turso database URL ⚠️ CRITICAL
NODE_ENV                       # Environment (production/development)
AI_API_KEY                     # GROQ AI API key ⚠️ CRITICAL
```

#### Vercel - Environment Variables
```
NEXT_PUBLIC_HF_TOKEN            # ⚠️ HF Space access token (for private HF Space)
CLERK_SECRET_KEY               # Clerk secret key
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY  # Clerk publishable key
NEXT_PUBLIC_BACKEND_URL         # HF Space URL ⚠️ CRITICAL
ENCRYPTION_SECRET              # AES-256 encryption key
CLERK_WEBHOOK_SECRET          # Clerk webhook secret
TURSO_AUTH_TOKEN              # Turso database auth
TURSO_DATABASE_URL            # Turso database URL
NEXT_PUBLIC_CLERK_SIGN_IN_URL   # Clerk sign-in URL
NEXT_PUBLIC_CLERK_SIGN_UP_URL   # Clerk sign-up URL
```

#### ⚠️ CRITICAL ISSUES FOUND:

1. **NEXT_PUBLIC_HF_TOKEN in Vercel** - This is for accessing your **private** HF Space
   - Required because HF Space is private
   - Used for authentication to HF Space
   - Should be a valid HF Space access token

2. **Duplicate Variables** - Some vars are duplicated between HF Space and Vercel:
   - `CLERK_SECRET_KEY` - In both
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - In both
   - `ENCRYPTION_SECRET` - In both
   - `TURSO_AUTH_TOKEN` - In both
   - `TURSO_DATABASE_URL` - In both
   - `NEXT_PUBLIC_CLERK_SIGN_IN_URL` - In both
   - `NEXT_PUBLIC_CLERK_SIGN_UP_URL` - In both

3. **FRONTEND_URL in HF Space** - Should be set to your Vercel URL
4. **ALLOWED_ORIGINS in HF Space** - Should include your Vercel URL
5. **NEXT_PUBLIC_BACKEND_URL in Vercel** - Should be your HF Space URL

#### 🔒 Private HF Space Authentication

Since your HF Space is **private**, requests from Vercel need authentication:

```typescript
// Frontend request with HF token
const hfToken = process.env.NEXT_PUBLIC_HF_TOKEN;
const response = await fetch(`${backendUrl}/api/queue/requeue`, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${clerkToken}`,
        'X-HF-Token': hfToken,  // HF Space authentication
    },
    body: JSON.stringify({ sessionId }),
});
```

**Backend needs to handle HF token**:
```typescript
// apps/api/src/middleware/auth.ts or similar
export const hfAuthMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const hfToken = req.headers['x-hf-token'];
    const expectedToken = process.env.HF_ACCESS_TOKEN || process.env.NEXT_PUBLIC_HF_TOKEN;
    
    // For private HF Spaces, verify token
    if (hfToken && expectedToken && hfToken !== expectedToken) {
        return res.status(401).json({ error: 'Invalid HF token' });
    }
    
    next();
};
```

### CORS Configuration
```
Origin: https://your-app.vercel.app (from Vercel)
Backend: https://your-space.hf.space (HF Space)
Credentials: true (for Clerk auth)
```

### Database Connection
```
Both Vercel and HF Space connect to same Turso DB
Connection string: libsql://your-db.turso.io
Auth token: turso_...
Shared schema: sessions, users, etc.
```

### File Locations Summary
```
BTR Engine:
  Main: apps/api/src/lib/seconds-precision-btr.ts
  Stages: apps/api/src/lib/btr/stages/*.ts
  Prompts: apps/api/src/lib/btr/prompts/*.ts
  Extractors: apps/api/src/lib/btr/extractors/*.ts

Vedic Engine:
  Main: apps/api/src/lib/vedic-astrology-engine.ts
  KP: apps/api/src/lib/kp-sublords.ts
  Shadbala: apps/api/src/lib/shadbala.ts
  Jaimini: apps/api/src/lib/jaimini-astrology.ts
  Kalachakra: apps/api/src/lib/kalachakra-dasha.ts

Queue & Progress:
  Queue: apps/api/src/lib/queue-manager.ts
  Progress: apps/api/src/lib/progress-tracker.ts
  Memory: apps/api/src/lib/memory-manager.ts

AI Integration:
  Client: apps/api/src/lib/ai-client.ts
  Prompts: apps/api/src/lib/btr/prompts/*.ts

Encryption:
  V2: apps/api/src/lib/encryption/encryption-v2.ts
  Adapter: apps/api/src/lib/crypto-adapter.ts

Middleware:
  apps/api/src/middleware/*.ts

Routes:
  apps/api/src/routes/*.ts

Database:
  Schema: packages/db/src/schema.ts
  Drizzle: packages/db/src/drizzle.ts
  Session Ops: apps/api/src/lib/session-events.ts

Errors:
  apps/api/src/errors/index.ts
```

### Common Commands
```bash
# Development
cd apps/api && npm run dev

# Testing
cd apps/api && npm test
cd apps/api && npm run test:coverage

# Type Checking
cd apps/api && npm run typecheck

# Linting
npm run lint

# Database
cd apps/api && npm run db:generate
cd apps/api && npm run db:migrate
cd apps/api && npm run db:studio

# Build
npm run build

# Hugging Face Space Deployment
cd apps/api && docker build -t ai-pandit-backend .
docker tag ai-pandit-backend registry.hf.space/your-space:latest
docker push registry.hf.space/your-space:latest
```

### Environment Variables Summary
```
# Vercel (Frontend) - REQUIRED
NEXT_PUBLIC_BACKEND_URL=https://your-space.hf.space
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...

# Hugging Face Space (Backend) - REQUIRED
ALLOWED_ORIGINS=https://your-app.vercel.app,http://localhost:3000
TURSO_DATABASE_URL=libsql://...
TURSO_AUTH_TOKEN=turso_...
CLERK_SECRET_KEY=sk_...
AI_API_KEY=sk-...
ENCRYPTION_SECRET=... (32-byte hex)
PORT=7860
NODE_ENV=production

# OPTIONAL (Backend)
MAX_CONCURRENT_SESSIONS=3
MEMORY_THRESHOLD_PERCENT=80
GC_THRESHOLD_GB=6
ENABLE_GOD_TIER_ENHANCEMENT=true
```

---

## 🎯 AUDIT PRIORITIES (Updated for Your Stack)

### Priority 0: Deployment Issues (Fix Immediately) ⚠️ CRITICAL
1. **Session clone → re-analyze failure** - Your main issue
2. CORS misconfiguration between Vercel and HF Space
3. Backend URL misconfiguration in Vercel
4. HF Space cold starts causing timeouts
5. Turso DB connection issues
6. Clerk auth token not propagating

### Priority 1: System Breaking (Fix Immediately)
1. Encryption failures (can't decrypt old sessions)
2. Queue deadlocks
3. Memory leaks causing OOM
4. AI API infinite retry loops
5. Database connection failures
6. Authentication bypass

### Priority 2: Core Functionality (Fix This Sprint)
1. BTR calculation errors
2. Vedic calculation inaccuracies
3. SSE connection drops
4. Progress state inconsistency
5. AI response parsing failures
6. Timezone conversion errors

### Priority 3: Important Features (Fix Next Sprint)
1. Missing divisional charts
2. Incomplete Dasha systems
3. Sub-Lord errors
4. Performance bottlenecks
5. Missing indexes
6. Cache misses

### Priority 4: Nice to Have (Technical Debt)
1. Code refactoring
2. Better error messages
3. Improved logging
4. Documentation updates
5. Test coverage improvements

---

## 📝 NOTES

### Deployment-Specific Notes
1. **Cross-Origin Requests** - Vercel → HF Space requires proper CORS
2. **HF Space Sleep Mode** - Space sleeps after inactivity, cold start ~30s
3. **Turso Shared DB** - Both Vercel and HF Space connect to same database
4. **Free Tier Limits** - Turso: 500 rows, HF Space: ~2 vCPU shared
5. **Clerk Auth** - Token must pass through CORS with credentials
6. **Backend URL** - Must be set correctly in Vercel env vars

### Things to Remember
1. **Encryption backward compatibility** - Must support both 3-part and 4-part formats
2. **Ephemeris files** - Must have .se1 files in `ephe/` directory
3. **Queue memory** - Each session uses significant memory
4. **AI timeouts** - DeepSeek calls can take 2-5 minutes
5. **SSE streams** - Need graceful reconnection
6. **Date handling** - Fuzzy dates are valid, don't reject them

### Testing Strategy
1. Unit tests for individual functions
2. Integration tests for subsystems
3. End-to-end tests for full BTR flow
4. Load tests for queue and memory
5. Security tests for vulnerabilities

### Monitoring
1. Heap memory usage
2. Queue depth and wait time
3. AI API latency and token usage
4. Database query performance
5. SSE connection health
6. Error rates by type

---

## 🆘 TROUBLESHOOTING

### Issue: Session clone → re-analyze fails ⚠️ YOUR MAIN ISSUE

**Root Cause for Private HF Space**:
Since your HF Space is **private**, requests from Vercel need proper authentication. The `NEXT_PUBLIC_HF_TOKEN` in Vercel is required for this.

**Check**:
1. Browser DevTools → Network tab for failed requests
2. Request URL (is it correct HF Space URL?)
3. Request headers (Authorization token present? **HF token present?**)
4. Response status and error message
5. CORS preflight OPTIONS request
6. Backend logs in HF Space
7. Turso DB for new session ID
8. **HF token validation** - Is `X-HF-Token` header being sent?

**Quick Fix**:
```bash
# 1. Check Vercel env vars
vercel env ls

# 2. Verify NEXT_PUBLIC_BACKEND_URL is set to your HF Space URL
# Example: https://your-space.huggingface.co or https://your-space.hf.space

# 3. Verify NEXT_PUBLIC_HF_TOKEN is set in Vercel
# This is REQUIRED for private HF Space
vercel env add NEXT_PUBLIC_HF_TOKEN production
# Enter your HF Space access token

# 4. Check HF Space env vars
# Go to HF Space → Settings → Variables
# Verify FRONTEND_URL is set to your Vercel URL
# Example: https://your-app.vercel.app

# 5. Verify ALLOWED_ORIGINS in HF Space
# Should include: https://your-app.vercel.app,http://localhost:3000

# 6. Restart HF Space
# Go to HF Space → Settings → Restart
```

**Code Fix - Add HF Token to API Client**:
```typescript
// apps/web/lib/api-client.ts
export class APIClient {
  public static async post(url: string, body: any, getToken: () => Promise<string | null>) {
    const token = await this.getAuthToken(getToken);
    const hfToken = process.env.NEXT_PUBLIC_HF_TOKEN; // ⚠️ ADD THIS

    const separator = url.includes('?') ? '&' : '?';
    const finalUrl = token ? `${url}${separator}sid=${encodeURIComponent(token)}` : url;

    try {
      const res = await fetch(finalUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : 'Bearer missing',
          'X-HF-Token': hfToken || '', // ⚠️ ADD THIS for private HF Space
        },
        body: JSON.stringify(body),
        credentials: 'include'
      });

      const data = await res.json();
      return data;
    } catch (error: any) {
      console.error(`Network error during POST: ${url}`, error.message);
      throw error;
    }
  }
}
```

**Backend Fix - Handle HF Token**:
```typescript
// apps/api/src/middleware/auth.ts or create new middleware
export const hfAuthMiddleware = (req: Request, res: Response, next: NextFunction) => {
    // Skip HF token check if space is public
    if (process.env.HF_SPACE_PUBLIC === 'true') {
        return next();
    }

    const hfToken = req.headers['x-hf-token'];
    const expectedToken = process.env.HF_ACCESS_TOKEN || process.env.NEXT_PUBLIC_HF_TOKEN;
    
    // For private HF Spaces, verify token
    if (!hfToken) {
        console.warn('[HF Auth] Missing X-HF-Token header');
        return res.status(401).json({ error: 'HF token required for private space' });
    }
    
    if (hfToken !== expectedToken) {
        console.warn('[HF Auth] Invalid HF token');
        return res.status(403).json({ error: 'Invalid HF token' });
    }
    
    next();
};

// Add to server.ts
app.use('/api', hfAuthMiddleware);
```

### Issue: CORS errors
**Check**:
1. `ALLOWED_ORIGINS` in HF Space env
2. `apps/api/src/server.ts` CORS config
3. Browser Console for CORS errors
4. Network tab → Preflight OPTIONS request

**Quick Fix**:
```typescript
// In HF Space env vars
ALLOWED_ORIGINS=https://your-app.vercel.app,http://localhost:3000
```

### Issue: HF Space "Building starting" / Cold start timeout
**Symptoms**:
1. HF Space shows "Building starting..." when you access it
2. First request times out or takes 30+ seconds
3. Subsequent requests work fine

**Root Causes**:
1. **HF Space Sleep Mode** - Free tier spaces sleep after inactivity
2. **Cold Start** - First request after sleep triggers rebuild
3. **Build Time** - Docker container needs to build and start
4. **Resource Allocation** - CPU/RAM allocation takes time

**Check**:
1. HF Space status (Building, Running, Sleeping)
2. Last request time (how long since last activity?)
3. HF Space logs for build errors
4. Timeout settings in API client
5. Network tab for request timing

**Quick Fixes**:

**Fix 1: Add Retry Logic with Exponential Backoff**
```typescript
// apps/web/lib/api-client.ts
async function fetchWithRetry(url: string, options: RequestInit, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            const res = await fetch(url, {
                ...options,
                signal: AbortSignal.timeout(30000 + (i * 10000)), // 30s, 40s, 50s
            });
            
            if (res.ok) return res;
            
            // If not ok and not last retry, wait and retry
            if (i < maxRetries - 1) {
                const waitTime = 1000 * Math.pow(2, i); // 1s, 2s, 4s
                console.log(`Retry ${i + 1}/${maxRetries} after ${waitTime}ms`);
                await new Promise(r => setTimeout(r, waitTime));
            }
        } catch (error: any) {
            // Network error or timeout
            if (i < maxRetries - 1) {
                const waitTime = 1000 * Math.pow(2, i);
                console.log(`Retry ${i + 1}/${maxRetries} after ${waitTime}ms - Error: ${error.message}`);
                await new Promise(r => setTimeout(r, waitTime));
            } else {
                throw error;
            }
        }
    }
    throw new Error('Max retries exceeded');
}

// Use in APIClient
export class APIClient {
    public static async post(url: string, body: any, getToken: () => Promise<string | null>) {
        const token = await this.getAuthToken(getToken);
        const hfToken = process.env.NEXT_PUBLIC_HF_TOKEN;

        const separator = url.includes('?') ? '&' : '?';
        const finalUrl = token ? `${url}${separator}sid=${encodeURIComponent(token)}` : url;

        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token ? `Bearer ${token}` : 'Bearer missing',
                'X-HF-Token': hfToken || '',
            },
            body: JSON.stringify(body),
            credentials: 'include'
        };

        return fetchWithRetry(finalUrl, options);
    }
}
```

**Fix 2: Add Keep-Alive Endpoint**
```typescript
// apps/api/src/routes/keep-alive.ts (new file)
import { Router, Response } from 'express';

const router = Router();

router.get('/keep-alive', (req: Request, res: Response) => {
    res.json({
        status: 'alive',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

export default router;
```

```typescript
// apps/api/src/routes/index.ts
import keepAliveRouter from './keep-alive.js';

app.use('/api', keepAliveRouter);
```

```bash
# Add cron job or external service to ping keep-alive endpoint
# Every 5 minutes:
curl https://your-space.hf.space/api/keep-alive
```

**Fix 3: Use HF Space Persistent Tier (Paid)**
- Upgrade to HF Space Pro tier ($9/month)
- No sleep mode
- Faster cold starts
- More CPU/RAM

**Fix 4: Optimize Docker Build**
```dockerfile
# Dockerfile optimizations
FROM node:20-alpine AS builder

# Install dependencies first (cached layer)
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Build
RUN npm run build

# Production stage
FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json

# Set environment
ENV NODE_ENV=production
ENV PORT=7860

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:7860/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start server
CMD ["node", "dist/server.js"]
```

**Fix 5: Pre-warm HF Space Before Use**
```bash
# Manually trigger warmup
curl https://your-space.hf.space/health

# Or use a cron job
# Add to crontab or external service
*/5 * * * * curl https://your-space.hf.space/health
```

**Fix 6: Add Loading State for Cold Starts**
```typescript
// apps/web/lib/api-client.ts
export class APIClient {
    private static isWarmingUp = false;
    private static warmupPromise: Promise<void> | null = null;

    private static async warmupBackend() {
        if (this.isWarmingUp) return this.warmupPromise;
        
        this.isWarmingUp = true;
        this.warmupPromise = (async () => {
            try {
                console.log('[API Client] Warming up backend...');
                await fetchWithRetry(
                    `${process.env.NEXT_PUBLIC_BACKEND_URL}/health`,
                    { method: 'GET' },
                    2
                );
                console.log('[API Client] Backend warmed up successfully');
            } catch (error) {
                console.error('[API Client] Backend warmup failed:', error);
            } finally {
                this.isWarmingUp = false;
                this.warmupPromise = null;
            }
        })();

        return this.warmupPromise;
    }

    public static async post(url: string, body: any, getToken: () => Promise<string | null>) {
        // Warm up backend on first request
        await this.warmupBackend();
        
        // ... rest of the code
    }
}
```

### Issue: BTR calculation fails
**Check**:
1. Ephemeris files present in `ephe/`
2. AI API key valid
3. Encryption secret set
4. Database connected
5. Memory available

### Issue: Queue stuck
**Check**:
1. Max concurrent reached
2. Sessions not completing
3. Memory threshold hit
4. Deadlock in queue operations

### Issue: SSE not updating
**Check**:
1. Client still connected
2. Progress tracker state
3. No errors in logs
4. Network connectivity

### Issue: High memory usage
**Check**:
1. Active sessions count
2. Memory leak in loops
3. Cache not clearing
4. Large data structures

---

## 📚 ADDITIONAL RESOURCES

### Documentation
- `ARCHITECTURE.md` - System architecture
- `AGENTS.md` - AI agent rules
- `DEBUG_GUIDE.md` - Debugging guide
- `API_DOCUMENTATION.md` - API docs
- `HF_SPACE_README.md` - Hugging Face deployment guide

### Audit Reports
- `BTR_AUDIT_REPORT.md` - BTR engine audit
- `BTR_DATA_FLOW_AUDIT.md` - Data flow audit
- `docs/BACKEND_CODE_AUDIT_REPORT.md` - Backend audit
- `docs/audits/SUBSYSTEM_*.md` - Subsystem audits
- `docs/HF_SPACES_FIX_SUMMARY.md` - HF Space fixes

### Test Guides
- `tests/INDUSTRY_TESTING_GUIDE.md` - Industry testing
- `e2e/` - End-to-end tests

### Deployment Guides
- `docs/DEPLOYMENT_ALTERNATIVES.md` - Deployment options
- `docs/DEPLOYMENT_CHECKLIST.md` - Deployment checklist
- `HF_SPACE_README.md` - HF Space specific

---

## 🎓 CONCLUSION

This guide provides a complete overview of the AI-Pandit backend system for efficient auditing with GPT/Codex. Follow the iterative process, use the token-efficient prompts, and refer to the checklists to ensure thorough coverage.

**Remember**:
- Start with **Phase 0: Deployment-Specific Checks** - This is critical for your Vercel + HF Space setup
- Focus on **Session Clone → Re-Analyze** issue first - This is your main problem
- Check CORS configuration between Vercel and HF Space
- Verify backend URL in Vercel environment variables
- Use the provided prompts to save tokens
- Document all findings
- Test fixes thoroughly before deploying

**Your Stack Specifics**:
- Frontend: Vercel Free Tier
- Backend: Hugging Face Space Free Tier (sleeps when inactive)
- Database: Turso Free Tier (shared by both)
- Auth: Clerk Free Tier
- All requests must handle CORS properly
- HF Space cold starts may cause first request timeout

---

*Last Updated: 2025-03-08*
*Version: 2.0 - Updated for Vercel + HF Space deployment*
