# 🔱 AI-Pandit System Architecture

## Overview

AI-Pandit is a production-grade Vedic astrology birth time rectification (BTR) engine. This document describes the system architecture, key components, and development guidelines.

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                         │
│  │   React     │  │  Next.js    │  │   Clerk     │                         │
│  │   Frontend  │  │   API Routes│  │   Auth      │                         │
│  └──────┬──────┘  └──────┬──────┘  └─────────────┘                         │
└─────────┼────────────────┼──────────────────────────────────────────────────┘
          │                │
          │ HTTP/WebSocket │
          ▼                ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              API GATEWAY                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  Express.js Server                                                  │    │
│  │  ├── Rate Limiting                                                  │    │
│  │  ├── Authentication (Clerk)                                         │    │
│  │  ├── Request Validation                                             │    │
│  │  └── Error Handling                                                 │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            QUEUE MANAGER                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  In-Memory Queue with Database Persistence                          │    │
│  │  ├── FIFO Processing                                                │    │
│  │  ├── Concurrent Session Management (max 3)                          │    │
│  │  ├── Progress Tracking                                              │    │
│  │  └── Cancellation Support                                           │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         BTR PROCESSING ENGINE                                │
│                                                                              │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐         │
│  │  Swiss Ephemeris│◄──►│  Vedic Engine   │◄──►│   AI Client     │         │
│  │  (Calculations) │    │  (Dasha/Varga)  │    │  (DeepSeek R1)  │         │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘         │
│           ▲                      ▲                      ▲                   │
│           │                      │                      │                   │
│           └──────────────────────┼──────────────────────┘                   │
│                                  ▼                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    SECONDS-PRECISION-BTR.TS                          │   │
│  │  Stage 1: Exhaustive Data Generation                                 │   │
│  │  Stage 2: Batch Tournament                                           │   │
│  │  Stage 3: Refinement Grid                                            │   │
│  │  Stage 4: Deep Multi-Dasha Analysis                                  │   │
│  │  Stage 5: Micro Precision Grid                                       │   │
│  │  Stage 6: Final Precision (with God-Tier Integration)                │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            DATA LAYER                                        │
│  ┌─────────────────────────────┐  ┌─────────────────────────────────────┐   │
│  │      Turso (SQLite)         │  │         Ephemeris Files             │   │
│  │  ┌─────────────────────┐    │  │  (swisse_18.se1, sepl_18.se1...)    │   │
│  │  │    Sessions         │    │  └─────────────────────────────────────┘   │
│  │  │    Users            │    │                                            │
│  │  │    Progress         │    │                                            │
│  │  │    Results          │    │                                            │
│  │  └─────────────────────┘    │                                            │
│  └─────────────────────────────┘                                            │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Directory Structure

```
backend/
├── src/
│   ├── config/           # Unified configuration
│   │   └── index.ts      # Environment validation & config objects
│   │
│   ├── errors/           # Custom error classes
│   │   └── index.ts      # AppError hierarchy & error codes
│   │
│   ├── utils/            # Shared utilities
│   │   ├── logger.ts     # Structured logging
│   │   └── response.ts   # API response helpers
│   │
│   ├── database/         # Database layer
│   │   ├── drizzle.ts    # Connection setup
│   │   └── schema.ts     # Table definitions
│   │
│   ├── lib/              # Business logic
│   │   ├── ai-client.ts              # AI service client
│   │   ├── seconds-precision-btr.ts  # Main BTR processor
│   │   ├── btr-god-tier-integrator.ts # KP/Consensus layer
│   │   ├── queue-manager.ts          # Queue management
│   │   ├── ephemeris.ts              # Swiss Ephemeris wrapper
│   │   ├── vedic-astrology-engine.ts # Vedic calculations
│   │   └── [other libraries...]
│   │
│   ├── middleware/       # Express middleware
│   │   ├── auth.ts       # Authentication
│   │   ├── error-handler.ts
│   │   └── validation.ts
│   │
│   ├── routes/           # API routes
│   │   ├── calculate.ts  # BTR submission
│   │   ├── queue.ts      # Queue operations
│   │   ├── progress.ts   # Progress tracking
│   │   ├── health.ts     # Health checks
│   │   └── index.ts      # Route aggregation
│   │
│   └── server.ts         # Application entry point
│
├── ephe/                 # Ephemeris data files
├── drizzle/              # Migration files
└── package.json
```

---

## Key Components

### 1. Configuration System (`config/index.ts`)

Centralized, type-safe configuration using Zod validation.

```typescript
import { config } from './config/index.js';

// Usage
const aiConfig = config.ai;
const maxConcurrent = config.queue.maxConcurrent;
```

**Features:**
- Environment variable validation on startup
- Type-safe configuration objects
- Sensible defaults for all options
- Fail-fast on misconfiguration

### 2. Error Handling (`errors/index.ts`)

Comprehensive error hierarchy with HTTP status codes.

```typescript
import { ValidationError, NotFoundError, AppError } from './errors/index.js';

// Usage
throw new ValidationError('Invalid birth date', { field: 'dateOfBirth' });
throw new NotFoundError('Session', sessionId);
```

**Error Categories:**
- Validation (400)
- Authentication (401)
- Authorization (403)
- Not Found (404)
- Conflict (409)
- Rate Limit (429)
- AI Service (502)
- Queue/Processing (503)
- Internal (500)

### 3. Logger (`utils/logger.ts`)

Structured logging with redaction and performance tracking.

```typescript
import { logger, logPerformance, createRequestLogger } from './utils/logger.js';

// Usage
logger.info('Processing started', { sessionId });

// Request-scoped logging
const reqLogger = createRequestLogger({ requestId, userId });
reqLogger.info('Request received');

// Performance tracking
await logPerformance('AI Analysis', async () => {
  return await callAI(prompt);
});
```

### 4. Response Utilities (`utils/response.ts`)

Standardized API responses.

```typescript
import { sendSuccess, sendPaginated, sendError } from './utils/response.js';

// Usage
sendSuccess(res, data, 200, { requestId });
sendPaginated(res, { items, total, page, limit });
sendError(res, error, requestId);
```

### 5. Health Routes (`routes/health.ts`)

Comprehensive health monitoring.

**Endpoints:**
- `GET /api/health` - Full health check
- `GET /api/health/ready` - Readiness probe
- `GET /api/health/live` - Liveness probe
- `GET /api/health/metrics` - System metrics
- `GET /api/health/status` - System status

---

## BTR Processing Flow

```
1. SUBMISSION
   Client → POST /api/calculate
   ├── Validate input
   ├── Create session in DB
   └── Add to queue

2. QUEUE PROCESSING
   Queue Manager → processSessionAsync()
   ├── Decrypt sensitive data
   ├── Call processSecondsPrecisionBTR()
   └── Update DB with results

3. BTR PIPELINE (6 Stages)
   Stage 1: Exhaustive Data Generation
   ├── Generate candidate times
   ├── Calculate ephemeris for each
   └── Build data packages

   Stage 2: Batch Tournament
   ├── Split candidates into batches
   ├── AI evaluates each batch
   └── Keep top survivors

   Stage 3: Refinement Grid
   ├── Generate ±5 min grid around survivors
   └── 1-minute intervals

   Stage 4: Deep Analysis
   ├── Multi-dasha verification
   ├── Divisional chart analysis
   └── AI deep evaluation

   Stage 5: Micro Grid
   ├── Generate ±30 sec grid
   └── 6-second intervals

   Stage 6: Final Precision
   ├── Seconds-level candidates
   ├── God-Tier KP/Consensus integration
   ├── Final AI judgment
   └── Return rectified time

4. RESULTS
   Client polls GET /api/queue/progress/:id
   └── Receives completed analysis
```

---

## God-Tier Integration

The BTR processor integrates with `btr-god-tier-integrator.ts` for enhanced precision:

### Features
- **KP Sub-Lord Calculations**: 4-level sub-lord hierarchy
- **Cuspal Sub-Lords**: House cusp precision
- **Multi-Method Consensus**: Combines Vimshottari, KP, Varga, Transit, Forensic
- **Confidence Scoring**: Overall consensus percentage
- **Red Flag Detection**: Sandhi, Gandanta, D60 instability

### Usage in Stage 6
```typescript
// Enhance finalists with God-Tier data
const enhanced = enhanceCandidateWithGodTierData(
  candidate,
  lifeEvents,
  forensicTraits,
  tentativeTime
);

// Use in AI prompts
prompt = generateGodTierAIPrompt(enhanced, basePrompt);
```

---

## Queue Management

### Configuration
- **Max Concurrent**: 3 sessions (configurable)
- **Poll Interval**: 2 seconds
- **Stale Timeout**: 2 hours
- **Max Queue Size**: 1000

### Memory Management
- Dynamic pressure throttling
- Manual GC trigger on high memory
- Cleanup of completed sessions

### Progress Tracking
```typescript
ProgressTracker.updateStep('stage', 'message');
ProgressTracker.updateETA(seconds);
ProgressTracker.completeStep('stage', ['result1', 'result2']);
```

---

## Database Schema

### Sessions Table
```sql
- id: UUID PRIMARY KEY
- userId: TEXT
- status: TEXT (pending/queued/processing/complete/failed)
- birthData: JSON
- lifeEvents: JSON (encrypted)
- results: JSON
- progressData: JSON
- createdAt: TEXT (ISO 8601)
- updatedAt: TEXT (ISO 8601)
```

---

## Environment Variables

### Required
```bash
# Database
TURSO_DATABASE_URL=libsql://...
TURSO_AUTH_TOKEN=turso_...

# AI Service
AI_API_KEY=sk-or-v1-...

# Authentication
CLERK_SECRET_KEY=sk_...
CLERK_PUBLISHABLE_KEY=pk_...
```

### Optional (with defaults)
```bash
# Server
NODE_ENV=development
PORT=3001

# Queue
MAX_CONCURRENT_SESSIONS=3
QUEUE_POLL_INTERVAL_MS=2000

# Memory
MEMORY_THRESHOLD_PERCENT=80
GC_THRESHOLD_GB=6

# Features
ENABLE_GOD_TIER_ENHANCEMENT=true
```

---

## Development Guidelines

### Code Style
- Use TypeScript strict mode
- Prefer explicit types over `any`
- Document public APIs with JSDoc
- Use early returns to reduce nesting

### Error Handling
- Always throw AppError subclasses
- Include context in error details
- Log errors with appropriate level

### Logging
- Use structured logging with metadata
- Redact sensitive fields
- Use request-scoped loggers in routes

### Testing
```bash
# Run all tests
npm test

# Type checking
npm run typecheck

# Linting
npm run lint
```

---

## Deployment Checklist

- [ ] All environment variables set
- [ ] Database migrations applied
- [ ] Ephemeris files present in `ephe/`
- [ ] Health checks passing
- [ ] Rate limiting configured
- [ ] Monitoring alerts set up

---

## Performance Considerations

### Memory
- Monitor heap usage (target < 10GB on 16GB systems)
- Trigger GC when threshold exceeded
- Clean up completed sessions

### AI Calls
- Parallel execution with concurrency limits
- Retry with exponential backoff
- Timeout handling (5 min default)

### Database
- Use connection pooling
- Index frequently queried columns
- Archive old sessions periodically

---

## Monitoring

### Key Metrics
- Queue depth
- Processing time per session
- AI response times
- Memory usage
- Error rates

### Alerts
- Queue backup > 50 sessions
- Memory usage > 12GB
- AI service down
- Database connection failures

---

## Future Roadmap

1. **Horizontal Scaling**: Redis-backed queue for multi-instance deployment
2. **WebSocket Updates**: Real-time progress instead of polling
3. **Caching**: Redis cache for ephemeris calculations
4. **ML Pipeline**: Train custom models for candidate ranking
5. **Mobile App**: Native iOS/Android applications

---

## Support

For issues or questions:
- Check logs in `/var/log/ai-pandit/`
- Review health endpoint: `GET /api/health`
- Contact: dev@aipandit.com

---

**Version:** 2.0.0  
**Last Updated:** 2026-01-27  
**Maintainer:** AI-Pandit Engineering Team
