# AI-Pandit Backend

Production-grade Birth Time Rectification (BTR) system with Vedic astrology algorithms.

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your credentials

# Run migrations
npm run db:push

# Start development server
npm run dev
```

## Project Structure

```
src/
├── config/           # Environment & configuration
│   └── index.ts      # Unified config with Zod validation
├── database/         # Database schema & connection
│   ├── schema.ts     # Drizzle ORM schema
│   └── drizzle.ts    # Database connection
├── errors/           # Error handling
│   └── index.ts      # AppError classes & codes
├── lib/              # Core business logic
│   ├── btr/          # BTR modular system
│   │   ├── types.ts              # Type definitions
│   │   ├── data-package-builder.ts
│   │   ├── prompts/              # AI prompt generators
│   │   ├── extractors/           # AI response parsers
│   │   └── stages/               # 6-stage BTR pipeline
│   ├── ai-client.ts            # Unified AI client
│   ├── ephemeris.ts            # Swiss Ephemeris wrapper
│   ├── vedic-astrology-engine.ts
│   ├── advanced-btr-methods.ts
│   ├── jaimini-astrology.ts
│   ├── kp-sublords.ts
│   ├── consensus-engine.ts
│   ├── btr-god-tier-integrator.ts
│   ├── time-offset-manager.ts
│   ├── queue-manager.ts
│   ├── progress-tracker.ts
│   ├── session-events.ts
│   ├── cancellation-manager.ts
│   ├── memory-manager.ts
│   ├── logger.ts
│   └── utils/                  # Shared utilities
├── middleware/       # Express middleware
│   ├── auth.ts
│   ├── error-handler.ts
│   ├── rate-limit.ts
│   ├── validation.ts
│   └── timeout.ts
├── routes/           # API routes
│   ├── calculate.ts
│   ├── health.ts
│   ├── queue.ts
│   ├── stream.ts
│   └── consent.ts
├── types/            # Shared TypeScript types
│   └── index.ts
└── utils/            # Response helpers
    ├── logger.ts
    └── response.ts
```

## BTR Architecture

The Birth Time Rectification system uses a 6-stage tournament pipeline:

### Stage 1: Exhaustive Data Generation
- Generates candidate times based on offset config
- Injects safety net candidates around tentative time
- Builds metadata for all candidates

### Stage 2: Batch Tournament
- Dynamic batch sizing based on offset range
- AI-powered elimination with survivor selection
- Parallel execution with 10 concurrent batches

### Stage 3: Refinement Grid
- ±5 minute grid at 1-minute intervals
- Expands around Stage 2 survivors

### Stage 4: Deep Analysis
- Multi-dasha verification (Vimshottari, Yogini, Chara)
- Forensic DNA correlation
- Deep AI analysis on finalists

### Stage 5: Micro Grid
- ±30 second grid at 6-second intervals
- Seconds-level precision candidates

### Stage 6: Final Precision
- God-Tier enhancement with KP sub-lords
- Consensus scoring
- Final AI judgment

## API Documentation

See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for complete API reference.

### Key Endpoints

- `POST /api/sessions` - Create BTR session
- `POST /api/calculate` - Submit for processing
- `GET /api/queue/status/:id` - Check queue status
- `GET /api/stream/:id` - Real-time progress (SSE)

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `TURSO_DATABASE_URL` | ✅ | SQLite/Turso database URL |
| `TURSO_AUTH_TOKEN` | ⚠️ | Required for Turso cloud |
| `AI_API_KEY` | ✅ | OpenRouter API key |
| `CLERK_SECRET_KEY` | ✅ | Clerk authentication |
| `ENCRYPTION_SECRET` | ✅ | 32+ character secret |
| `AI_MODEL` | ❌ | Default: `deepseek/deepseek-r1` |
| `MAX_CONCURRENT_SESSIONS` | ❌ | Default: 3 |

See `.env.example` for all options.

## Scripts

```bash
# Development
npm run dev              # Start with hot reload
npm run build            # Compile TypeScript
npm run start            # Start production server

# Database
npm run db:generate      # Generate migrations
npm run db:push          # Push schema changes
npm run db:studio        # Drizzle Studio GUI

# Code Quality
npm run lint             # ESLint check
npm run lint:fix         # Auto-fix issues
npm run typecheck        # TypeScript check

# Utilities
npm run cleanup          # Clean old encryption
```

## Error Codes

| Code | HTTP | Description |
|------|------|-------------|
| `VALIDATION_ERROR` | 400 | Invalid input |
| `UNAUTHORIZED` | 401 | Auth required |
| `SESSION_NOT_FOUND` | 404 | Session not found |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `AI_SERVICE_ERROR` | 502 | AI unavailable |
| `QUEUE_FULL` | 503 | Queue at capacity |

## Architecture Decisions

### Modular BTR System
The BTR processor has been split into 17+ focused modules:
- **Separation of concerns**: Each module has single responsibility
- **Testability**: Individual modules can be unit tested
- **Maintainability**: Changes are localized

### Queue-Based Processing
- Prevents memory overflow
- Fair scheduling of concurrent requests
- Automatic retry on failure

### Event-Driven Progress
- SSE for real-time updates
- No polling required
- Detailed progress tracking

### Type Safety
- Strict TypeScript throughout
- Zod schema validation
- Runtime type checking

## Performance

- **Memory**: GC threshold at 6GB, pressure at 80%
- **Concurrency**: 3 simultaneous BTR analyses
- **Batch Size**: Dynamic based on offset (10-30 candidates)
- **Cache**: Ephemeris calculations cached per session

## Security

- JWT authentication via Clerk
- Request rate limiting
- Data encryption at rest
- SQL injection prevention (parameterized queries)
- CORS configuration

## License

Proprietary - AI-Pandit Team
