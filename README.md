# AI-Pandit 🌟

> **⚠️ PROPRIETARY SOFTWARE — ALL RIGHTS RESERVED**  
> This repository is publicly visible for transparency and portfolio purposes only.  
> No license is granted to use, copy, modify, or distribute this code.  
> See [LICENSE](LICENSE) for full terms.

**AI-Powered Vedic Birth Time Rectification with Seconds-Level Precision**

[![TypeScript](https://img.shields.io/badge/TypeScript-96.5%25-blue)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-Proprietary-red.svg)](LICENSE)
[![CI](https://img.shields.io/github/actions/workflow/status/ashoksainiengineer/ai-pandit-app/ci.yml?branch=main&label=CI)](https://github.com/ashoksainiengineer/ai-pandit-app/actions)
[![Cloud Run](https://img.shields.io/badge/Google%20Cloud%20Run-Active-blue)](https://cloud.google.com/run)
[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
---

## Project Overview

AI-Pandit is a full-stack Birth Time Rectification (BTR) platform that applies **6-stage tournament-based AI analysis** combined with classical Vedic astrology algorithms and NASA-precision astronomical data to determine accurate birth times down to the **second**.

Traditional BTR is subjective and manual. AI-Pandit replaces guesswork with a data-driven pipeline: it generates thousands of candidate birth times, runs them through successive AI-supervised elimination rounds (Dasha verification, transit matching, KP Sublord analysis, Shadbala evaluation), and converges on the most astronomically and astrologically consistent time.

The system processes **physical traits questionnaires** (forensic quiz) and **life events** as input constraints, cross-references against **JPL DE440 ephemeris** via Skyfield, and encrypts all PII with **AES-256-GCM** end-to-end.

---

## Features

| Feature | Description |
|---------|-------------|
| **6-Stage BTR Pipeline** | Exhaustive Data Generation → Batch Tournament → Refinement Grid → Deep Analysis → Micro Grid → Final Precision verdict |
| **Real-Time SSE Streaming** | Live progress updates via Server-Sent Events with Zustand + IndexedDB persistence |
| **End-to-End Encryption** | AES-256-GCM with scrypt KDF, user-isolated encryption keys, multi-version format support |
| **Interactive Dashboard** | Session management, history, export (PDF via jsPDF), recharts visualizations |
| **NASA JPL Skyfield Ephemeris** | DE440 kernel via Python FastAPI microservice — arcsecond-precision planetary positions |
| **AI Reasoning** | DeepSeek (primary) / Groq via configurable provider — multi-prompt ensemble analysis |
| **Physical Traits Quiz** | Forensic questionnaire + scoring engine — constrains candidate times via physiological markers |
| **Life Events Integration** | User-provided major life event dates mapped to Dasha periods for cross-validation |
| **Birth Place Picker** | OpenStreetMap/Leaflet integration for latitude/longitude geocoding |
| **Clerk Authentication** | OAuth + email/password with Clerk dashboard |
| **Job Queue** | DB-polling based external worker — max 3 concurrent sessions, per-user limits |
| **Responsive UI** | Framer Motion animations, Tailwind CSS design system ("Dia" / "Prism"), Lucide icons |
| **Session Cancellation** | Graceful abort of in-progress BTR analysis via cancellation manager |
| **OpenTelemetry Tracing** | Optional OTEL tracing, SLO monitoring, warmup pings to prevent cold starts |

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 15, React 18, TypeScript, Tailwind CSS 3.4, Framer Motion 11, Zustand 5, Lucide React, Leaflet (OpenStreetMap), Recharts, jsPDF |
| **Backend** | Node.js ≥20, Express 4, TypeScript, Drizzle ORM 0.45, Zod 3, Helmet, CORS, Pino logger |
| **Database** | Neon Postgres (Serverless) — Drizzle schema with 6 BTR domain type modules |
| **Cache / Queue** | Upstash Redis — via ioredis, DB-polling queue architecture |
| **AI** | DeepSeek (primary via `DEEPSEEK_API_KEY`), Groq (via `AI_BASE_URL`) — OpenRouter-compatible |
| **Auth** | Clerk — `@clerk/nextjs` v6, `@clerk/backend` v2 |
| **Ephemeris** | Python 3, FastAPI, Skyfield (DE440 kernel) — standalone microservice |
| **Worker** | External Node.js process — DB-polling job execution, max 3 concurrent |
| **CI/CD** | GitHub Actions — test-pipeline, deploy-cloudrun, ci-quality, warmup |
| **Deployment** | Vercel (Frontend), Google Cloud Run (API, Worker, Ephemeris) |

### Frontend Libraries

`framer-motion`, `zustand` (with `idb-keyval` IndexedDB persistence), `lucide-react`, `leaflet`, `recharts`, `jspdf` + `jspdf-autotable`, `@tanstack/react-virtual`, `date-fns`, `sharp`, `svix`.

### Backend Libraries

`express`, `cors`, `helmet`, `morgan`, `drizzle-orm`, `zod`, `ioredis`, `@clerk/backend`.

---

## Architecture

```
                         ┌─────────────────────────────────────────────────────┐
                         │                    Vercel                            │
                         │  ┌───────────────────────────────────────────────┐  │
                         │  │           Next.js 15 Frontend                │  │
                         │  │  Clerk Auth │ Zustand Store │ SSE Stream     │  │
                         │  │  Leaflet Map│ Framer Motion│ Lucide Icons    │  │
                         │  └──────────┬────────────────────────────────────┘  │
                         └─────────────┼────────────────────────────────────────┘
                                       │ HTTPS / SSE
                                       ▼
              ┌──────────────────────────────────────────────────────────────┐
              │                  Google Cloud Run                             │
              │                                                              │
              │  ┌──────────────────┐   ┌──────────────────┐                │
              │  │   Express API    │   │  External Worker  │                │
              │  │  BTR Pipeline    │   │  Job Processor    │                │
              │  │  SSE Events      │◀──│  DB polling       │                │
              │  │  Encryption      │   │  Max 3 concurrent │                │
              │  │  Drizzle ORM     │   └──────────────────┘                │
              │  └──────┬───────┬───┘                                       │
              │         │       │                                            │
              │         ▼       ▼                                            │
              │  ┌──────────┐ ┌──────────┐  ┌──────────────────┐           │
              │  │  Neon    │ │ Upstash  │  │ Skyfield Python   │           │
              │  │ Postgres │ │ Redis    │  │ FastAPI Service   │           │
              │  │(Server)  │ │(Cache)   │  │ JPL DE440 Kernel  │           │
              │  └──────────┘ └──────────┘  └──────────────────┘           │
              └──────────────────────────────────────────────────────────────┘
```

### Data Flow

1. User authenticates via **Clerk** → lands on dashboard
2. Fills **forensic physical traits quiz** + **life events** + place of birth (Leaflet OSM picker)
3. Frontend streams **SSE connection** to `/api/sessions/:id/progress`
4. API **initializes BTR session** — generates ~hundreds of candidate times around the tentative birth time
5. **6-stage pipeline** executes: AI evaluates each candidate against Dasha, transit, KP Sublord, Shadbala data from Skyfield
6. Each stage eliminates weak candidates — survivors advance to finer-grained grids
7. Stage 6 produces **final verdict** (rectified time, confidence score, supporting evidence)
8. All **PII is AES-256-GCM encrypted** before DB persistence; decrypted only in-memory during processing
9. Progress, AI thinking chunks, and candidate scores stream in real-time to the frontend via **EventSource**
10. Results persist in **Neon Postgres** via Drizzle ORM; session state in **Upstash Redis**

### BTR Pipeline Stages

| Stage | Name | Description |
|-------|------|-------------|
| 1 | **Grid Generation** | Generate exhaustive candidate time grid around tentative birth time |
| 2 | **Batch Tournament** | AI-supervised batch elimination — prune clearly incompatible candidates |
| 3 | **Refinement Grid** | Sub-second finer grid around remaining survivors |
| 4 | **Deep Analysis** | Multi-dasha, multi-transit cross-validation with life events |
| 5 | **Micro Grid** | Seconds-level grid with precision ephemeris data |
| 6 | **Final Precision** | AI synthesis of all evidence → final rectified time + verdict |

---

## Project Structure

```
ai-pandit/
├── apps/
│   ├── web/                      # Next.js 15 frontend
│   │   ├── app/
│   │   │   ├── rectify/[id]/     # Main BTR analysis page (SSE stream)
│   │   │   ├── dashboard/        # Session history dashboard
│   │   │   ├── sign-in/          # Clerk auth pages
│   │   │   ├── sign-up/
│   │   │   ├── admin/            # Admin panel
│   │   │   ├── privacy/          # Legal pages
│   │   │   └── terms/
│   │   └── lib/
│   │       ├── store/            # Zustand stores (stream-store with IndexedDB)
│   │       ├── use-stream-progress.ts  # SSE stream React hook
│   │       └── forensic-quiz/    # Physical traits quiz engine
│   ├── api/                      # Express + TypeScript BTR backend
│   │   └── src/
│   │       ├── lib/
│   │       │   ├── seconds-precision-btr.ts  # 6-stage pipeline orchestrator
│   │       │   ├── btr/                      # Modular stages, prompts, extractors
│   │       │   ├── encryption/               # AES-256-GCM with multi-version support
│   │       │   ├── ephemeris/                # Skyfield client with gold dataset validation
│   │       │   ├── jobs/                     # Job lifecycle, artifact storage
│   │       │   ├── progress-tracker.ts       # Real-time DB + SSE progress
│   │       │   ├── queue-manager.ts          # Job queue (max 3 concurrent)
│   │       │   ├── session-events.ts         # SSE event emission engine
│   │       │   └── vedic-astrology-engine.ts # Dasha, transit, KP calculations
│   │       ├── routes/           # Express route handlers
│   │       ├── middleware/       # Clerk auth, rate limiting, error handling
│   │       └── scripts/         # Ephemeris gold dataset, capacity validation, chaos tests
│   └── worker/                   # External job worker (DB-polling)
├── packages/
│   ├── db/                       # Drizzle schema + client for Neon Postgres
│   ├── shared/                   # Shared TS types, Zod schemas (6 domain modules)
│   └── worker-runtime/           # Worker runtime library
├── services/
│   └── ephemeris/                # Python FastAPI Skyfield microservice (DE440)
│       ├── app/
│       │   ├── routes/           # Ephemeris calculation endpoints
│       │   ├── services/         # Skyfield planetary computations
│       │   └── models/           # Pydantic request/response models
│       ├── data/                 # DE440 kernel files
│       └── tests/                # Pytest test suite
├── e2e/                          # Playwright end-to-end tests
├── scripts/                      # Deployment, CI/CD, utility scripts
├── docs/                         # Architecture, deployment, testing docs
├── .github/workflows/           # CI/CD pipeline definitions
├── turbo.json                    # Turborepo pipeline config
└── AGENTS.md                     # Agent operating manual (for AI coding agents)
```

---

## Quick Start

### Prerequisites

- Node.js ≥20.19.0, npm ≥10.8.0
- Git
- Python 3.10+ (for Skyfield ephemeeris service)
- A Neon Postgres database (free tier works)
- An Upstash Redis instance (free tier works)
- Clerk account (for auth keys)

### Setup

```bash
# 1. Clone
git clone https://github.com/ashoksainiengineer/ai-pandit-app.git
cd ai-pandit-app

# 2. Install all dependencies (monorepo)
npm ci

# 3. Set up Python ephemeris service
npm run setup:ephemeris
npm run ephemeris:download-kernel

# 4. Copy environment templates
cp .env.example .env.local
# Edit .env.local with your API keys (see Environment Variables below)

# 5. Push database schema
npm -w @ai-pandit/api run db:push

# 6. Start all services
npm run dev
```

The frontend starts at `http://localhost:3000`, API at `http://localhost:8080`, and ephemeris service at `http://localhost:8000`.

---

## Environment Variables

Key variables from `.env.example`. All required unless marked optional.

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk publishable key (frontend) |
| `CLERK_SECRET_KEY` | Clerk secret key (backend) |
| `NEON_DATABASE_URL` | Neon Postgres connection string with `?sslmode=require` |
| `REDIS_URL` | Upstash Redis connection string (`redis://...`) |
| `DEEPSEEK_API_KEY` | DeepSeek API key (primary AI provider) |
| `DEEPSEEK_MODEL` | DeepSeek model name (default: `deepseek-chat`) |
| `AI_API_KEY` | Fallback/generic AI API key |
| `AI_BASE_URL` | AI provider base URL (e.g., `https://api.deepseek.com`) |
| `AI_MODEL` | AI model name override |
| `ENCRYPTION_SECRET` | AES-256-GCM encryption key (min 32 chars, 64+ recommended) |
| `ENCRYPTION_SECRET` | AES-256-GCM encryption secret (≥32 characters) |
| `EPHEMERIS_SERVICE_URL` | Skyfield service URL (`http://localhost:8000`) |
| `EPHEMERIS_PROVIDER` | `skyfield` (primary) or `algorithmic` (fallback) |
| `FRONTEND_URL` | Deployed frontend URL (for CORS) |
| `NEXT_PUBLIC_BACKEND_URL` | API URL (frontend → backend connection) |
| `ALLOWED_ORIGINS` | Comma-separated CORS origins |
| `MAX_CONCURRENT_SESSIONS` | Max parallel BTR sessions (default: 3) |
| `MAX_ACTIVE_JOBS_PER_USER` | Per-user concurrency limit (default: 2) |
| `JOB_EXECUTION_MODE` | `external_worker` (default) |
| `QUEUE_ARCHITECTURE` | `db_polling` (default) |
| `NODE_OPTIONS` | `--max-old-space-size=256` |

---

## Deployment

### Frontend → Vercel

```bash
# Connect apps/web to Vercel project
# Set all NEXT_PUBLIC_* env vars in Vercel dashboard
# Deploy:
vercel deploy --prod
```

Git integration: pushes to `main` auto-deploy the frontend via Vercel.

### Backend → Google Cloud Run

Three services deploy in order: **ephemeris → api → worker**, with health gates between each.

```bash
# Deploy all services
npm run deploy:cloudrun:ephemeris
npm run deploy:cloudrun:api
npm run deploy:cloudrun:worker

# Or use the script for individual services
./scripts/deploy-cloud-run.sh api
```

GitHub Actions (`.github/workflows/deploy-cloudrun.yml`) auto-deploys on push to `main`.

### Production Bootstrap

```bash
cp .env.production.example .env.production
# Fill in production values, then:
sh scripts/sync-production-config.sh --env-file .env.production --apply
```

---

## Testing

```bash
# Full test suite
npm run test:ci

# Unit tests (all workspaces)
npm run test

# Integration tests (API + DB + Ephemeris)
npm run test:integration

# E2E smoke tests
npm run test:e2e:smoke

# Full E2E
npm run test:e2e

# Coverage
npm run test:coverage

# Security scan
npm run test:security

# Mutation testing
npm run test:mutation

# Chaos resilience
npm run test:chaos

# API-specific
npm -w @ai-pandit/api run test

# Web-specific
npm -w @ai-pandit/web run test

# Python ephemeris service
cd services/ephemeris && .venv/bin/pytest tests/ -v

# BTR-specific integration
npm run test:btr
```

---

## Security

- **AES-256-GCM encryption** for all stored birth data (PII). Key derived via `scrypt` KDF with user-specific salt.
- **Multi-version encryption format** — supports 3-part and 4-part encrypted payloads. New writes use v4 format; decryption falls back through all known versions.
- **User-isolated** — encryption tied to `userId`; one user cannot decrypt another's data.
- **AI anonymization** — birth data and names are stripped from AI prompts; only astrological parameters (planetary positions, Dasha periods) are sent to the model.
- **Helmet middleware** on all Express routes.
- **Clerk authentication** required for all session creation and access.
- **Rate limiting** per user per session.
- **OpenTelemetry** optional — no PII in trace data.

---

## License

Proprietary. See [LICENSE](LICENSE) for full terms.

This repository is publicly visible for transparency and portfolio purposes. No license is granted to use, copy, modify, or distribute this code.

---

## Contact

**Author:** Ashok Saini  
**Email:** ashok@sainilab.com  
**Repository:** [github.com/ashoksainiengineer/ai-pandit-app](https://github.com/ashoksainiengineer/ai-pandit-app)

---

## Acknowledgments

- Vedic astrology algorithms based on classical Jyotish texts (Parashari, Jaimini, KP)
- NASA JPL for DE440 ephemeris data
- Skyfield library by Brandon Rhodes for astronomical calculations
- DeepSeek and Groq for AI inference API
- Clerk for authentication infrastructure
- Neon for serverless PostgreSQL
- Upstash for serverless Redis

---

## Trademarks

All trademarks, service marks, trade names, and logos referenced in this
project are the property of their respective owners. AI-Pandit is not
affiliated with, endorsed by, or sponsored by any third-party
organization mentioned. References are for factual and informational
purposes only.

See [NOTICE](NOTICE) for full third-party attributions and licenses.

---

**Built with ❤️ for the Vedic astrology community**
