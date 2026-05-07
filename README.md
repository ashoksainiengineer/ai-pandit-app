# AI-Pandit 🌟

> **⚠️ PROPRIETARY SOFTWARE — ALL RIGHTS RESERVED**  
> This repository is publicly visible for transparency and portfolio purposes only.  
> No license is granted to use, copy, modify, or distribute this code.  
> See [LICENSE](LICENSE) for full terms.


**AI-Powered Vedic Birth Time Rectification with Seconds-Level Precision**

[![TypeScript](https://img.shields.io/badge/TypeScript-96.5%25-blue)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-Proprietary-red.svg)](LICENSE)
[![Cloud Run](https://img.shields.io/badge/Google%20Cloud%20Run-Active-blue)](https://cloud.google.com/run)
[![Desloppify](https://img.shields.io/badge/Code%20Quality-Desloppify-purple)](https://github.com/peteromallet/desloppify)

AI-Pandit is a comprehensive platform for precise birth time rectification (BTR) using advanced Vedic astrology algorithms combined with modern AI capabilities.

## ✨ Features

- **🔮 Birth Time Rectification** - AI-powered analysis with seconds-level precision
- **⚡ Real-time Progress Streaming** - Live SSE updates during analysis
- **🔐 End-to-End Encryption** - AES-256 encryption for sensitive birth data
- **📊 Interactive Dashboard** - View and manage all your rectification sessions
- **🎯 Multiple Analysis Methods** - Dasha, Transit, KP Sublords, Shadbala & more
- **📱 Responsive Design** - Works on desktop, tablet, and mobile

## 🏗️ Architecture

### Tech Stack

| Layer | Technology |
|-------|------------|
│ **Frontend** | Next.js 15, React 18, TypeScript, Tailwind CSS |
| **Backend** | Node.js, Express, TypeScript |
| **Database** | Neon Postgres (Serverless PostgreSQL) |
| **Cache/Queue** | Upstash Redis |
| **Ephemeris** | Skyfield Python Service |
| **AI** | Groq API (OpenAI/GPT models) |
| **Auth** | Clerk |
| **Deployment** | Google Cloud Run |

### System Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Next.js   │────▶│  Cloud Run   │────▶│ Neon        │
│   Frontend  │     │  API         │     │ Postgres    │
└─────────────┘     └──────────────┘     └─────────────┘
                           │                    │
                           ▼                    ▼
                    ┌──────────────┐    ┌──────────────┐
                    │  Skyfield    │    │  Upstash     │
                    │  Python      │    │  Redis       │
                    │  Service     │    │              │
                    └──────────────┘    └──────────────┘
```

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- npm 10+
- Git

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/ashoksainiengineer/ai-pandit-app.git
   cd ai-pandit-app
   ```

2. **Install dependencies**
   ```bash
   npm ci
   ```

3. **Setup environment variables**
   ```bash
   cp .env.local.example apps/web/.env.local
   # Edit apps/web/.env.local with your values
   ```

4. **Start development server**
   ```bash
   cd apps/web
   npm run dev
   ```

5. **Open in browser**
   ```
   http://localhost:3000
   ```

## 📁 Project Structure

```
ai-pandit/
├── apps/
│   ├── web/              # Next.js frontend
│   ├── api/              # Express backend API
│   └── worker/           # Background job processor
├── packages/
│   ├── db/               # Database schema & client
│   ├── shared/           # Shared types & utilities
│   └── worker-runtime/   # Worker runtime library
├── services/
│   └── ephemeris/        # Python Skyfield service
├── docs/                 # Documentation
└── scripts/              # Deployment & utility scripts
```

## 🔧 Environment Variables

Key environment variables required (see `.env.example` for full list):

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk authentication key |
| `NEON_DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection string |
| `AI_API_KEY` | Groq/OpenAI API key |
| `ENCRYPTION_SECRET` | AES-256 encryption key |

## 📝 Documentation

- [Architecture Overview](docs/BACKEND_ARCHITECTURE_IMPACT_ANALYSIS.md)
- [Environment Variables](docs/ENVIRONMENT_VARIABLES_LIST.md)
- [Testing Strategy](docs/TESTING_STRATEGY.md)
- [Production Checklist](docs/PRODUCTION_DEPLOYMENT_CHECKLIST.md)

## 🧪 Testing

```bash
# Run all tests
npm run test

# Run specific test suite
npm run test:e2e
npm run test:e2e:smoke
```

## 🚀 Deployment

### Google Cloud Run

1. **Build and deploy**
   ```bash
   ./scripts/deploy-cloud-run.sh api
   ./scripts/deploy-cloud-run.sh worker
   ```

2. **Setup environment variables in Cloud Run Console**
   - Go to: Google Cloud Console > Cloud Run > Your Service > Edit > Variables
   - Add all required variables from `.env.example`

### Vercel (Frontend)

1. **Connect `apps/web` to the Vercel project**
2. **Set production environment variables in Vercel Dashboard**
3. **Deploy from Vercel or run `vercel deploy --prod` from `apps/web`**

### Production automation

- Pushes to `main` should auto-deploy `apps/web` through Vercel Git integration.
- Pushes to `main` also trigger `.github/workflows/deploy-cloudrun.yml` for Cloud Run services.
- The Cloud Run deployment lane now treats `ephemeris-service`, `api-service`, and `worker-service` as the production backend set.
- Backend deploy order is `ephemeris -> api -> worker`, with health gates before downstream services continue.

### Production bootstrap

- Copy `.env.production.example` to a private file such as `.env.production` and fill in your real production values.
- Use `sh scripts/sync-production-config.sh` for a dry-run of GitHub, GCP, and Vercel env sync.
- Add `--env-file .env.production --apply` once that file is your confirmed production source of truth.
- For Git-triggered Vercel hobby deployments, use a commit author email that GitHub can associate with the connected repository owner.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Vedic astrology algorithms based on traditional texts
- Skyfield library for astronomical calculations
- NASA JPL for ephemeris data

---

**Built with ❤️ for the Vedic astrology community**
# IAM permissions applied Monday 16 March 2026 11:37:29 PM IST
