# AI-Pandit Backend Subsystems - Complete Detailed List

## 📋 Overview

This document provides an exhaustive list of all backend subsystems organized by category, with detailed information about each component's purpose, dependencies, and key files.

---

## 🗂️ Subsystem Categories

```
├── 📊 Core BTR Engine           (Birth Time Rectification Pipeline)
├── 🔮 Vedic Astrology           (Classical Calculations)
├── 🤖 AI Integration            (DeepSeek/OpenRouter Client)
├── 🔄 Queue & Processing        (Job Management)
├── 🔐 Security & Encryption     (Data Protection)
├── 🌐 API Layer                 (Routes & Middleware)
├── 💾 Database                  (Persistence Layer)
├── 📡 Real-time Communication   (SSE/Events)
└── 🛠️ Utilities                 (Helpers & Tools)
```

---

## 1. 📊 Core BTR Engine Subsystems

### 1.1 Main BTR Orchestrator
| File | Purpose | Lines | Dependencies |
|------|---------|-------|--------------|
| [`seconds-precision-btr.ts`](../apps/api/src/lib/seconds-precision-btr.ts) | Main 6-stage BTR pipeline orchestration | 345 | ephemeris, vedic-engine, ai-client, queue-manager |
| [`btr/orchestrator.ts`](../apps/api/src/lib/btr/orchestrator.ts) | Professional BTR class wrapper | ~200 | All BTR modules |
| [`btr/index.ts`](../apps/api/src/lib/btr/index.ts) | Public API exports | 122 | All BTR modules |

**Key Functions:**
- `processSecondsPrecisionBTR()` - Main entry point
- Stage history tracking
- Global lifecycle calculation
- Final verdict generation

---

### 1.2 BTR Pipeline Stages
| File | Stage | Purpose | Output |
|------|-------|---------|--------|
| [`btr/stages/stage1-exhaustive-data.ts`](../apps/api/src/lib/btr/stages/stage1-exhaustive-data.ts) | Stage 1 | Generate all candidate times with ephemeris | 100-500 candidates |
| [`btr/stages/stage2-batch-tournament.ts`](../apps/api/src/lib/btr/stages/stage2-batch-tournament.ts) | Stage 2 | AI-powered batch evaluation | 20-50 survivors |
| [`btr/stages/stage3-refinement-grid.ts`](../apps/api/src/lib/btr/stages/stage3-refinement-grid.ts) | Stage 3 | ±5 min grid at 1-min intervals | 10-20 candidates |
| [`btr/stages/stage4-deep-analysis.ts`](../apps/api/src/lib/btr/stages/stage4-deep-analysis.ts) | Stage 4 | Multi-dasha deep analysis | 5-10 survivors |
| [`btr/stages/stage5-micro-grid.ts`](../apps/api/src/lib/btr/stages/stage5-micro-grid.ts) | Stage 5 | ±30 sec grid at 6-sec intervals | 3-5 candidates |
| [`btr/stages/stage6-final-precision.ts`](../apps/api/src/lib/btr/stages/stage6-final-precision.ts) | Stage 6 | KP Sub-Lord + Consensus scoring | 1 final time |

**Stage Flow:**
```
Stage 1 (Generate) → Stage 2 (Tournament) → Stage 3 (Refine) → 
Stage 4 (Deep) → Stage 5 (Micro) → Stage 6 (Final)
     ↓                  ↓                ↓              ↓            ↓           ↓
  500 cands         50 survivors      20 cands       10 cands     5 cands    1 result
```

---

### 1.3 BTR Support Modules
| File | Purpose | Key Exports |
|------|---------|-------------|
| [`btr/data-package-builder.ts`](../apps/api/src/lib/btr/data-package-builder.ts) | Build candidate data packages for AI | `buildCandidateDataPackage()` |
| [`btr/dasha-builder.ts`](../apps/api/src/lib/btr/dasha-builder.ts) | Build Dasha data for candidates | `buildVimshottariDasha()`, `buildYoginiDasha()`, `buildCharaDasha()` |
| [`btr/transit-builder.ts`](../apps/api/src/lib/btr/transit-builder.ts) | Build transit data | `buildTransitData()` |
| [`btr/planet-enricher.ts`](../apps/api/src/lib/btr/planet-enricher.ts) | Enrich planetary positions | Planet dignity, retrograde, combustion |
| [`btr/event-scorer.ts`](../apps/api/src/lib/btr/event-scorer.ts) | Score life events match | `EventScorer` class |
| [`btr/window-scanner.ts`](../apps/api/src/lib/btr/window-scanner.ts) | Scan time windows | `WindowScanner` class |
| [`btr/tatwa-shuddhi.ts`](../apps/api/src/lib/btr/tatwa-shuddhi.ts) | Tatwa element correction | `TatwaShuddhi` class |
| [`btr/transit-analyzer.ts`](../apps/api/src/lib/btr/transit-analyzer.ts) | Transit analysis | `TransitAnalyzer` class |
| [`btr/precision-weights.ts`](../apps/api/src/lib/btr/precision-weights.ts) | Scoring weights | `METHOD_WEIGHTS`, `CONFIDENCE_THRESHOLDS` |
| [`btr/security-guard.ts`](../apps/api/src/lib/btr/security-guard.ts) | Input validation & sanitization | Security checks |

---

### 1.4 AI Prompt System
| File | Purpose | Tokens |
|------|---------|--------|
| [`btr/prompts/batch-prompt.ts`](../apps/api/src/lib/btr/prompts/batch-prompt.ts) | Batch tournament prompts | ~2000 |
| [`btr/prompts/deep-analysis-prompt.ts`](../apps/api/src/lib/btr/prompts/deep-analysis-prompt.ts) | Deep analysis prompts | ~3000 |
| [`btr/prompts/final-precision-prompt.ts`](../apps/api/src/lib/btr/prompts/final-precision-prompt.ts) | Final precision prompts | ~2500 |
| [`btr/prompts/forensic-context.ts`](../apps/api/src/lib/btr/prompts/forensic-context.ts) | Forensic trait context | ~1500 |
| [`btr/prompts/life-event-formatter.ts`](../apps/api/src/lib/btr/prompts/life-event-formatter.ts) | Format events for AI | ~500 |

---

### 1.5 AI Response Extractors
| File | Purpose |
|------|---------|
| [`btr/extractors/ai-response-extractors.ts`](../apps/api/src/lib/btr/extractors/ai-response-extractors.ts) | Parse AI responses, extract scores |
| [`btr/extractors/index.ts`](../apps/api/src/lib/btr/extractors/index.ts) | Export `extractBatchSurvivors()`, `extractFinalVerdict()` |

---

## 2. 🔮 Vedic Astrology Subsystems

### 2.1 Core Vedic Engine
| File | Purpose | Lines | Key Functions |
|------|---------|-------|---------------|
| [`vedic-astrology-engine.ts`](../apps/api/src/lib/vedic-astrology-engine.ts) | Vimshottari Dasha, Nakshatras | 579 | `calculateVimshottariDasha()`, `getDashaForDate()` |

**Features:**
- 5-level Dasha calculation (Maha → Antar → Pratyantar → Sukshma → Prana)
- 27 Nakshatra mappings
- Sandhi (transition) detection
- Birth period partial calculation

---

### 2.2 Advanced Dasha Systems
| File | Dasha Type | Purpose |
|------|------------|---------|
| [`kalachakra-dasha.ts`](../apps/api/src/lib/kalachakra-dasha.ts) | Kalachakra | Advanced lunar cycle timing |
| [`jaimini-astrology.ts`](../apps/api/src/lib/jaimini-astrology.ts) | Jaimini | Chara Dasha, Karakas, Rashi Drishti |

**Kalachakra Features:**
- 9 nakshatra-based periods
- 12 sign sequences
- Event correlation scoring

**Jaimini Features:**
- Atmakaraka, Amatyakaraka calculation
- Chara Dasha periods
- Rashi aspects (Drishti)

---

### 2.3 KP System (Krishnamurti Paddhati)
| File | Purpose | Levels |
|------|---------|--------|
| [`kp-sublords.ts`](../apps/api/src/lib/kp-sublords.ts) | Sub-lord calculations | 4 levels (Star → Sub → Sub-Sub → Sub-Sub-Sub) |

**KP Hierarchy:**
```
Star Lord (13°20') → Sub Lord (variable) → Sub-Sub Lord → Sub-Sub-Sub Lord
     ↓                    ↓                    ↓                 ↓
 Nakshatra          Dasha-based         Further div       Seconds precision
```

---

### 2.4 Strength & Quality Systems
| File | System | Purpose |
|------|--------|---------|
| [`shadbala.ts`](../apps/api/src/lib/shadbala.ts) | Shadbala | 6-source planetary strength |
| [`nadi-amsha.ts`](../apps/api/src/lib/nadi-amsha.ts) | Nadi Amsha | 150-part division for precision |
| [`gandanta-detection.ts`](../apps/api/src/lib/gandanta-detection.ts) | Gandanta | Dangerous nakshatra boundaries |
| [`pancha-pakshi.ts`](../apps/api/src/lib/pancha-pakshi.ts) | Pancha Pakshi | 5-bird timing system |

**Shadbala Components:**
1. Sthana Bala (Positional)
2. Dig Bala (Directional)
3. Kala Bala (Temporal)
4. Chestha Bala (Motional)
5. Naisargika Bala (Natural)
6. Drig Bala (Aspectual)

---

### 2.5 Specialized Analysis
| File | Purpose |
|------|---------|
| [`spouse-d9-verification.ts`](../apps/api/src/lib/spouse-d9-verification.ts) | Navamsha (D9) spouse verification |
| [`advanced-btr-methods.ts`](../apps/api/src/lib/advanced-btr-methods.ts) | Divisional charts, boundary safety |

---

## 3. 🤖 AI Integration Subsystems

### 3.1 AI Client
| File | Purpose | Lines |
|------|---------|-------|
| [`ai-client.ts`](../apps/api/src/lib/ai-client.ts) | DeepSeek/OpenRouter client | 979 |

**Key Functions:**
- `callAI()` - Single AI call with retry
- `callAIWithStream()` - Streaming response
- `executeAIInParallel()` - Batch parallel execution

**Features:**
- Multi-provider support (OpenRouter, Groq)
- Reasoner model detection
- Exponential backoff
- 5-minute timeout
- Rate limit handling (429)

---

### 3.2 BTR Precision Integration
| File | Purpose |
|------|---------|
| [`btr-precision-integrator.ts`](../apps/api/src/lib/btr-precision-integrator.ts) | Integrate precision data with candidates |

---

## 4. 🔄 Queue & Processing Subsystems

### 4.1 Queue Manager
| File | Purpose | Lines | Max Concurrent |
|------|---------|-------|----------------|
| [`queue-manager.ts`](../apps/api/src/lib/queue-manager.ts) | Job queue management | 1032 | 3 sessions |

**Key Functions:**
- `addToQueue()` - Add session to queue
- `getQueuePosition()` - Get current position
- `getQueueStatus()` - Full status with ETA
- `startQueueProcessor()` - Begin processing loop

**Features:**
- Circuit breaker (5 failures → pause 5 min)
- Zombie session cleanup
- Memory pressure throttling
- Dynamic ETA calculation

---

### 4.2 Memory Management
| File | Purpose | Thresholds |
|------|---------|------------|
| [`memory-manager.ts`](../apps/api/src/lib/memory-manager.ts) | Memory monitoring & GC | 80% warning, 95% critical |

**Functions:**
- `getMemoryStats()` - Current memory usage
- `checkMemory()` - Check if within limits
- `triggerGC()` - Manual garbage collection
- `withMemoryCheck()` - Execute with memory guard
- `withConcurrencyLimit()` - Limit concurrent operations

---

### 4.3 Cancellation & Progress
| File | Purpose |
|------|---------|
| [`cancellation-manager.ts`](../apps/api/src/lib/cancellation-manager.ts) | AbortController management |
| [`progress-tracker.ts`](../apps/api/src/lib/progress-tracker.ts) | Real-time progress tracking |
| [`time-offset-manager.ts`](../apps/api/src/lib/time-offset-manager.ts) | Candidate time generation |

**Progress Tracker Features:**
- In-memory instance registry
- Candidate score streaming
- AI thinking logs
- Stage history tracking
- Debounced DB saves

---

## 5. 🔐 Security & Encryption Subsystems

### 5.1 Encryption System
| File | Purpose | Algorithm |
|------|---------|-----------|
| [`encryption/index.ts`](../apps/api/src/lib/encryption/index.ts) | Public API | - |
| [`encryption/v2.ts`](../apps/api/src/lib/encryption/v2.ts) | Current version | AES-256-GCM |
| [`encryption/DANGER_DO_NOT_MODIFY.ts`](../apps/api/src/lib/encryption/DANGER_DO_NOT_MODIFY.ts) | Core implementation | AES-256-GCM |
| [`encryption/config.ts`](../apps/api/src/lib/encryption/config.ts) | Key management | - |
| [`encryption/types.ts`](../apps/api/src/lib/encryption/types.ts) | Type definitions | - |

**Encryption Format:**
```
v2: version:iv:authTag:cipher:data
v1 (legacy): iv:authTag:cipher
```

---

### 5.2 Crypto Adapter
| File | Purpose |
|------|---------|
| [`crypto-adapter.ts`](../apps/api/src/lib/crypto-adapter.ts) | Backward-compatible decryption |

---

## 6. 🌐 API Layer Subsystems

### 6.1 Routes
| File | Endpoint | Purpose | Auth |
|------|----------|---------|------|
| [`routes/calculate.ts`](../apps/api/src/routes/calculate.ts) | POST /api/calculate | Submit BTR analysis | ✅ |
| [`routes/stream.ts`](../apps/api/src/routes/stream.ts) | GET /api/stream/:id | SSE progress stream | ✅ |
| [`routes/progress.ts`](../apps/api/src/routes/progress.ts) | GET /api/queue/progress/:id | Poll progress | ✅ |
| [`routes/queue.ts`](../apps/api/src/routes/queue.ts) | GET /api/queue | Queue status | ✅ |
| [`routes/sessions.ts`](../apps/api/src/routes/sessions.ts) | GET /api/sessions | List sessions | ✅ |
| [`routes/health.ts`](../apps/api/src/routes/health.ts) | GET /api/health | Health check | ❌ |
| [`routes/admin.ts`](../apps/api/src/routes/admin.ts) | GET /api/admin/* | Admin operations | ✅ Admin |
| [`routes/consent.ts`](../apps/api/src/routes/consent.ts) | POST /api/consent | AI consent | ✅ |
| [`routes/warmup.ts`](../apps/api/src/routes/warmup.ts) | POST /api/warmup | Pre-warm engine | ✅ |
| [`routes/candidate-detail.ts`](../apps/api/src/routes/candidate-detail.ts) | GET /api/candidate/:id | Candidate details | ✅ |

---

### 6.2 Middleware
| File | Purpose | Order |
|------|---------|-------|
| [`middleware/request-id.ts`](../apps/api/src/middleware/request-id.ts) | Request ID & context | 1 |
| [`middleware/rate-limit.ts`](../apps/api/src/middleware/rate-limit.ts) | Rate limiting | 2 |
| [`middleware/timeout.ts`](../apps/api/src/middleware/timeout.ts) | Request timeout | 3 |
| [`middleware/auth.ts`](../apps/api/src/middleware/auth.ts) | Clerk authentication | 4 |
| [`middleware/validation.ts`](../apps/api/src/middleware/validation.ts) | Zod validation | 5 |
| [`middleware/error-handler.ts`](../apps/api/src/middleware/error-handler.ts) | Error handling | Last |
| [`middleware/error-handler-new.ts`](../apps/api/src/middleware/error-handler-new.ts) | Enhanced error handler | Last |

**Middleware Chain:**
```
Request → RequestID → RateLimit → Timeout → Auth → Validation → Route → ErrorHandler
```

---

## 7. 💾 Database Subsystems

### 7.1 Schema (packages/db)
| File | Purpose |
|------|---------|
| [`packages/db/src/schema.ts`](../packages/db/src/schema.ts) | Drizzle schema definitions |
| [`packages/db/src/drizzle.ts`](../packages/db/src/drizzle.ts) | Database connection |

**Tables:**
| Table | Purpose | Key Fields |
|-------|---------|------------|
| `users` | User profiles | clerkId, email, role |
| `sessions` | BTR sessions | status, rectifiedTime, lifeEvents |
| `calculations` | Ephemeris cache | ephemerisData, cacheHitCount |
| `payments` | Payment tracking | razorpayOrderId, status |

---

## 8. 📡 Real-time Communication

### 8.1 Session Events
| File | Purpose |
|------|---------|
| [`session-events.ts`](../apps/api/src/lib/session-events.ts) | SSE event emitters |

**Event Types:**
- `emitProgress()` - Progress update
- `emitComplete()` - Analysis complete
- `emitError()` - Error occurred
- `emitCandidateScore()` - Candidate scored
- `emitAIContext()` - AI reasoning context
- `emitEstimatedTime()` - ETA update
- `emitAIThinking()` - Streaming AI thoughts
- `emitStageStats()` - Stage statistics

---

## 9. 🛠️ Utility Subsystems

### 9.1 Logging
| File | Purpose |
|------|---------|
| [`logger.ts`](../apps/api/src/lib/logger.ts) | Pino logger instance |
| [`secure-logger.ts`](../apps/api/src/lib/secure-logger.ts) | Redacted logging |

---

### 9.2 Helpers
| File | Purpose |
|------|---------|
| [`utils/index.ts`](../apps/api/src/lib/utils/index.ts) | Utility exports |
| [`utils/formatting.ts`](../apps/api/src/lib/utils/formatting.ts) | Date/time formatting |
| [`utils/ephemeris-helpers.ts`](../apps/api/src/lib/utils/ephemeris-helpers.ts) | Ephemeris utilities |
| [`utils/dms-formatter.ts`](../apps/api/src/lib/utils/dms-formatter.ts) | Degree-Minute-Second format |
| [`utils/array-helpers.ts`](../apps/api/src/lib/utils/array-helpers.ts) | Array utilities |
| [`debounce.ts`](../apps/api/src/lib/debounce.ts) | Debounce utility |
| [`pagination.ts`](../apps/api/src/lib/pagination.ts) | Pagination helper |
| [`cities.ts`](../apps/api/src/lib/cities.ts) | City data |
| [`timezones.ts`](../apps/api/src/lib/timezones.ts) | Timezone utilities |

---

### 9.3 Configuration
| File | Purpose |
|------|---------|
| [`config/index.ts`](../apps/api/src/config/index.ts) | Centralized configuration |
| [`types.ts`](../apps/api/src/lib/types.ts) | Shared type definitions |

---

### 9.4 Domain Data
| File | Purpose |
|------|---------|
| [`event-categories.ts`](../apps/api/src/lib/event-categories.ts) | Life event categories |
| [`event-requirements.ts`](../apps/api/src/lib/event-requirements.ts) | Event validation rules |
| [`testimonials.ts`](../apps/api/src/lib/testimonials.ts) | Testimonial data |

---

### 9.5 Maintenance
| File | Purpose |
|------|---------|
| [`db-cleanup.ts`](../apps/api/src/lib/db-cleanup.ts) | Database cleanup jobs |
| [`user-sync.ts`](../apps/api/src/lib/user-sync.ts) | Clerk user synchronization |

---

## 📊 Subsystem Statistics

### By Category
| Category | Files | Approx Lines |
|----------|-------|--------------|
| Core BTR Engine | 20 | 4,000 |
| Vedic Astrology | 10 | 3,000 |
| AI Integration | 2 | 1,200 |
| Queue & Processing | 5 | 2,000 |
| Security & Encryption | 6 | 800 |
| API Routes | 10 | 1,500 |
| Middleware | 7 | 600 |
| Database | 2 | 300 |
| Real-time | 1 | 200 |
| Utilities | 15 | 800 |
| **Total** | **78** | **~14,400** |

### By Test Coverage
| Subsystem | Test Files | Coverage |
|-----------|------------|----------|
| BTR Engine | 15 | ~65% |
| Vedic Astrology | 8 | ~70% |
| AI Client | 2 | ~60% |
| Queue Manager | 2 | ~70% |
| Encryption | 2 | ~80% |
| Routes | 12 | ~75% |
| Middleware | 3 | ~70% |

---

## 🔗 Dependency Graph

```
                    ┌─────────────────┐
                    │   server.ts     │
                    └────────┬────────┘
                             │
         ┌───────────────────┼───────────────────┐
         │                   │                   │
         ▼                   ▼                   ▼
    ┌─────────┐        ┌─────────┐        ┌─────────┐
    │ Routes  │        │Middleware│        │ Config  │
    └────┬────┘        └────┬────┘        └────┬────┘
         │                  │                   │
         └──────────────────┼───────────────────┘
                            │
                            ▼
                    ┌───────────────┐
                    │ Queue Manager │
                    └───────┬───────┘
                            │
         ┌──────────────────┼──────────────────┐
         │                  │                  │
         ▼                  ▼                  ▼
    ┌─────────┐       ┌─────────┐       ┌─────────┐
    │BTR Engine│       │AI Client│       │Database │
    └────┬────┘       └─────────┘       └─────────┘
         │
         ├──────────────────┬──────────────────┐
         │                  │                  │
         ▼                  ▼                  ▼
    ┌─────────┐       ┌─────────┐       ┌─────────┐
    │Ephemeris│       │  Vedic  │       │Consensus│
    │ (WASM)  │       │ Engine  │       │ Engine  │
    └─────────┘       └─────────┘       └─────────┘
```

---

## 📝 Quick Reference

### Critical Files (Do NOT modify without full understanding)
1. `seconds-precision-btr.ts` - Main BTR pipeline
2. `vedic-astrology-engine.ts` - Dasha calculations
3. `consensus-engine.ts` - Multi-method validation
4. `encryption/DANGER_DO_NOT_MODIFY.ts` - Core encryption
5. `ai-client.ts` - AI integration
6. `queue-manager.ts` - Job processing

### Most Complex Subsystems
1. **BTR Engine** - 6-stage pipeline with AI integration
2. **Consensus Engine** - 12 validation methods
3. **Vedic Engine** - 5-level recursive Dasha
4. **AI Client** - Multi-provider with retry logic
5. **Queue Manager** - Concurrent processing with circuit breaker

### Highest Test Coverage
1. Encryption (~80%)
2. Routes (~75%)
3. Vedic Engine (~70%)
4. Queue Manager (~70%)

### Needs More Tests
1. BTR Stages (~50%)
2. AI Client (~60%)
3. Progress Tracker (~55%)

---

*Last Updated: March 2026*
*Total Subsystems: 78 files across 9 categories*
