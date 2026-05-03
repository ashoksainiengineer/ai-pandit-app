# AI-Pandit — Copilot Instructions

This is a Turborepo monorepo for a Vedic Astrology Birth Time Rectification (BTR) engine.

## Structure
- `apps/web` — Next.js 15 frontend (React 18, TailwindCSS, Zustand, Clerk Auth)
- `apps/api` — Express.js backend (BTR engine, Skyfield, DeepSeek AI, Drizzle ORM)
- `packages/db` — Shared Drizzle schema for Neon Postgres
- `packages/shared` — Shared TypeScript types and Zod schemas
- `packages/worker-runtime` — Worker runtime library
- `apps/worker` — Background job processor
- `services/ephemeris` — Python Skyfield service

## Rules
- TypeScript strict mode. No `any` types.
- Use `AppError` hierarchy for all errors — never raw `Error()`.
- Use Pino logger, never `console.log` in backend.
- Use Zod schemas for input validation.
- Use Zustand for frontend state management.
- Encrypt sensitive birth data with AES-256-GCM.
- Support both 3-part and 4-part encryption formats.
- Never commit `.env`, `.env.local`, `*.db`, `*.log` files.
- Conventional commits: `feat:`, `fix:`, `refactor:`, `test:`, `docs:`.

## Key Commands
- `npm run dev` — Start all services
- `npm run build` — Build all
- `npm test` — Run tests
- `npm run lint` — Lint all

## Critical Files
- `apps/api/src/lib/seconds-precision-btr.ts` — Core 6-stage BTR pipeline
- `apps/api/src/lib/queue-manager.ts` — Job queue (max 3 concurrent)
- `apps/api/src/lib/vedic-astrology-engine.ts` — Vedic calculations
- `apps/web/app/rectify/[id]/page.tsx` — Main analysis page
- `packages/shared/src/types.ts` — Shared type definitions

For full details, see CLAUDE.md in the project root.
