# AI-Pandit Agent Operating Manual

This file defines how coding agents (Codex/Copilot/Claude/etc.) must operate in this repository.

## Non-Negotiable Rules

1. Never run `git commit`, `git push`, `git reset --hard`, or `git checkout --` without explicit user approval.
2. Keep diffs small and reversible. Do not do broad refactors unless requested.
3. Do not edit `.env*` files directly. Use `.env.example` and `.env.local.example` for changes.
4. Never log secrets, tokens, birth details, or raw PII.
5. Before finishing any code change, run the relevant verification commands.

## Repo Map

- `apps/web`: Next.js 15 frontend
- `apps/api`: Express + TypeScript backend
- `apps/worker`: external job worker
- `packages/db`: Drizzle schema/client
- `packages/shared`: shared types/schemas
- `services/ephemeris`: Python FastAPI Skyfield service
- `e2e`: Playwright tests

## Day-1 Setup

1. `npm ci`
2. `npm run setup:ephemeris`
3. `npm run ephemeris:download-kernel`
4. Copy env templates and fill required vars:
   - `.env.example`
   - `.env.local.example`
5. Start stack: `npm run dev`

## Standard Commands

- Full dev: `npm run dev`
- Full lint: `npm run lint`
- Full tests: `npm run test`
- Integration tests: `npm run test:integration`
- E2E smoke: `npm run test:e2e:smoke`
- Full CI: `npm run test:ci`
- Coverage: `npm run test:coverage`
- API only: `npm -w @ai-pandit/api run test`
- Web only: `npm -w @ai-pandit/web run test`
- Worker only: `npm -w @ai-pandit/worker run test`
- Worker typecheck: `npm -w @ai-pandit/worker run typecheck`
- Python tests: `cd services/ephemeris && .venv/bin/pytest tests/ -v`
- Security scan: `npm run test:security`

## Verification Matrix

- If `apps/api/**` changed:
  - `npm -w @ai-pandit/api run lint`
  - `npm -w @ai-pandit/api run test`
- If `apps/web/**` changed:
  - `npm -w @ai-pandit/web run lint`
  - `npm -w @ai-pandit/web run test`
- If `apps/worker/**` changed:
  - `npm -w @ai-pandit/worker run typecheck`
  - `npm -w @ai-pandit/worker run test`
- If shared packages changed (`packages/**`):
  - `npm run lint`
  - `npm run test`
- If `services/ephemeris/**` changed:
  - `npm run setup:ephemeris`
  - `cd services/ephemeris && .venv/bin/pytest tests/ -v`
- If stream/job flow changed:
  - `npm run test:integration`
  - `npm run test:e2e:smoke`
- If schema changed (`packages/db/**`):
  - `npm run test:integration`
- If `e2e/**` changed:
  - `npm run test:e2e:smoke`

## Prompt Contract (for coding agents)

Every implementation prompt should include:

1. Goal (one behavior change)
2. Allowed files/areas
3. Constraints (no refactor/no API break/no schema change)
4. Acceptance checks (exact commands)
5. Non-goals

## Definition of Done

- Code compiles.
- Relevant tests pass.
- No unrelated files changed.
- Clear change summary + risk notes provided to user.

## High-Risk Areas

- `apps/api/src/lib/seconds-precision-btr.ts`
- `apps/api/src/lib/queue-manager.ts`
- `apps/api/src/lib/encryption/**`
- `apps/web/lib/use-stream-progress.ts`
- `apps/web/app/rectify/**`

For these files: prefer test-first edits and avoid behavior drift.

## Deployment Safety

- Cloud Run deploy scripts live in `scripts/deploy-cloud-run.sh`.
- Idle cost guard scripts:
  - `scripts/enforce-idle-cost-guards.sh`
  - `scripts/enable-production-worker-mode.sh`
- Never change runtime scaling defaults without explicit request.
