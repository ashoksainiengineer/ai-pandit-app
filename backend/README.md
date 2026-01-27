---
title: AI Pandit BTR Engine
emoji: 🕉️
colorFrom: indigo
colorTo: purple
sdk: docker
app_port: 7860
pinned: false
---

# AI Pandit - Birth Time Rectification Engine

**Vedic Astrology-powered Birth Time Rectification with AI**

## Overview

This is the backend engine for AI Pandit - a sophisticated birth time rectification system that uses:
- **Swiss Ephemeris** for precise planetary calculations
- **DeepSeek AI** for intelligent analysis
- **15+ Vedic Methods** including Vimshottari, Yogini, Chara Dasha
- **Divisional Charts** (D9, D10, D60) for granular accuracy

## Deployment

### Hugging Face Spaces (Free Tier)

1. Fork this repository
2. Create a new Space on Hugging Face
3. Select "Docker" as the SDK
4. Add these secrets in Space Settings:
   - `TURSO_DATABASE_URL`
   - `TURSO_AUTH_TOKEN`
   - `CLERK_SECRET_KEY`
   - `CLERK_PUBLISHABLE_KEY`
   - `AI_API_KEY` (OpenRouter API key)

### Environment Variables

```bash
# Required
TURSO_DATABASE_URL=libsql://your-db.turso.io
TURSO_AUTH_TOKEN=your_token
CLERK_SECRET_KEY=sk_test_...
CLERK_PUBLISHABLE_KEY=pk_test_...
AI_API_KEY=sk-or-v1-...

# Optional
NODE_ENV=production
PORT=7860
MAX_CONCURRENT_SESSIONS=2
AI_MODEL=deepseek/deepseek-r1
```

## API Endpoints

- `GET /` - Health check
- `GET /health` - Detailed health status
- `POST /api/queue` - Submit BTR analysis
- `GET /api/queue/progress/:id` - Get progress
- `POST /api/queue/cancel` - Cancel analysis
- `GET /api/stream/:id` - SSE stream for real-time updates

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Next.js App   │────▶│  Express Backend │────▶│  Turso Database │
│  (Vercel)       │     │  (HF Spaces)     │     │  (SQLite)       │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                               │
                               ▼
                        ┌──────────────────┐
                        │  DeepSeek AI     │
                        │  (OpenRouter)    │
                        └──────────────────┘
```

## Free Tier Optimizations

- Memory-conscious processing (256MB heap limit)
- Concurrent session limiting (max 2)
- Automatic cleanup of completed sessions
- Throttled database writes
- Ephemeris calculation caching

## License

MIT - Open Source Vedic Astrology Tools
