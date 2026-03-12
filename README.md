---
title: AI Pandit BTR Engine
emoji: 🔮
colorFrom: indigo
colorTo: purple
sdk: docker
pinned: false
license: mit
app_port: 7860
---

# AI Pandit BTR Engine - Vedic Astrology Birth Time Rectification

A production-grade backend engine for determining exact birth time (to seconds precision) using Swiss Ephemeris calculations, Vedic astrology engines, and AI-driven multi-stage analysis.

## 🚀 Quick Start

This Hugging Face Space runs the backend API only. Before deploying, you **must** configure the following environment variables.

## 🔑 Required Environment Variables

Add these as **Secrets** in your Hugging Face Space settings (Settings → Secrets):

### Database (Turso)
```
TURSO_DATABASE_URL=libsql://your-db.turso.io
TURSO_AUTH_TOKEN=your_turso_auth_token
```
Get these from https://turso.tech

### AI Configuration (DeepSeek/OpenRouter)
```
AI_API_KEY=your_api_key
AI_BASE_URL=https://openrouter.ai/api/v1
AI_MODEL=deepseek/deepseek-r1
AI_TIMEOUT_MS=300000
REQUEST_TIMEOUT_MS=300000
```

### Authentication (Clerk)
```
CLERK_SECRET_KEY=sk_your_clerk_secret_key
```
Get this from https://dashboard.clerk.com

### Encryption
```
ENCRYPTION_SECRET=your_64_char_random_string_for_aes256_encryption
```
Generate a random 64+ character string.

### Queue & Resource Management
```
MAX_CONCURRENT_SESSIONS=3
HEAP_THRESHOLD_GB=6
RSS_THRESHOLD_GB=8
```

### Rate Limiting
```
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
```

### Other Required Variables
```
AI_MODEL_REASONER=deepseek/deepseek-r1
AI_MAX_TOKENS=32768
AI_THINKING_BUDGET=24576
AI_TEMPERATURE=0
AI_RETRY_ATTEMPTS=3
AI_RETRY_DELAY_MS=2000
```

## 📋 Complete Environment Variable List

See [`README_HF.md`](README_HF.md) for the complete list of all environment variables including optional ones.

## 🔧 Troubleshooting

### Container keeps restarting

1. **Check logs** in the Hugging Face Space console
2. **Verify all required environment variables** are set
3. Common issues:
   - Missing `TURSO_DATABASE_URL` or `TURSO_AUTH_TOKEN`
   - Missing `AI_API_KEY`
   - Missing `CLERK_SECRET_KEY`
   - `ENCRYPTION_SECRET` too short (must be 32+ characters)

### Health check failing

The container liveness endpoint is `/live` (recommended for platform health checks).  
Readiness endpoint is `/ready` (dependency status: DB + ephemeris).

If liveness fails:
1. Check if the server is listening on port 7860
2. Check startup logs for configuration validation errors

If readiness fails:
1. Verify database connection
2. Check if Swiss Ephemeris initialized (logs will show warning if failed)

### Swiss Ephemeris initialization failed

The server will fall back to algorithmic calculations if Swiss Ephemeris WASM fails to initialize. This is not critical but may reduce precision.

## 📊 API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/live` | ❌ | Liveness check |
| GET | `/ready` | ❌ | Readiness check |
| GET | `/health` | ❌ | Legacy liveness alias |
| GET | `/` | ❌ | Root endpoint |
| POST | `/api/calculate` | ✅ | Submit BTR analysis |
| GET | `/api/stream/:id` | ✅ | SSE real-time stream |
| GET | `/api/queue/progress/:id` | ✅ | Poll progress |
| GET | `/api/sessions` | ✅ | List user sessions |

## 🏗️ Architecture

- **Runtime**: Node.js 20 Alpine
- **Framework**: Express.js
- **Database**: Turso (libSQL)
- **Auth**: Clerk
- **AI**: DeepSeek R1 via OpenRouter
- **Astrology**: Swiss Ephemeris (WASM)
- **Port**: 7860 (Hugging Face default)

## 📝 License

This project is proprietary and closed-source.
All rights reserved. No reuse, redistribution, or modification is permitted
without explicit written permission.

See [LICENSE](LICENSE) for details.

## 📄 Third-Party Notices

This project uses third-party software, including Skyfield (MIT License).
See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

## 📚 Documentation

- [`README_HF.md`](README_HF.md) - Complete environment variable reference
- [`ARCHITECTURE.md`](ARCHITECTURE.md) - System architecture documentation
- [`AGENTS.md`](AGENTS.md) - Development guidelines
- [`docs/HF_SPACES_FIX_SUMMARY.md`](docs/HF_SPACES_FIX_SUMMARY.md) - Deployment fix summary
