# ═══════════════════════════════════════════════════════════════════════════
# AI Pandit - BTR Engine (Hugging Face Backend Only)
# Industry-grade multi-stage build optimized for HF Spaces (16GB RAM)
# ═══════════════════════════════════════════════════════════════════════════

# ─── Stage 0: Base ────────────────────────────────────────────────────────
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat
RUN npm install -g turbo@^2
WORKDIR /app

# ─── Stage 1: Prune ────────────────────────────────────────────────────────
FROM base AS pruner
COPY . .
RUN turbo prune @ai-pandit/api --docker

# ─── Stage 2: Builder ──────────────────────────────────────────────────────
FROM base AS builder
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/package-lock.json ./package-lock.json
RUN npm ci --loglevel=error

COPY --from=pruner /app/out/full/ .
COPY turbo.json turbo.json

# Set dummy environment variables for build (HF Spaces only provides secrets at runtime)
# These values are only used during TypeScript compilation, not at runtime
ENV NODE_ENV=production
ENV TURSO_DATABASE_URL=libsql://dummy.turso.io
ENV TURSO_AUTH_TOKEN=dummy_token
ENV CLERK_SECRET_KEY=dummy_clerk_secret
ENV ENCRYPTION_SECRET=dummy_encryption_secret_32_chars_minimum
ENV CLERK_WEBHOOK_SECRET=dummy_webhook_secret
ENV NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=dummy_publishable_key
ENV NEXT_PUBLIC_BACKEND_URL=http://localhost:7860

RUN turbo run build --filter=@ai-pandit/api...

# ─── Stage 3: Production Prep ──────────────────────────────────────────────
FROM base AS prod-deps
COPY --from=pruner /app/out/full/ .
COPY --from=pruner /app/out/package-lock.json ./package-lock.json
RUN npm ci --omit=dev --loglevel=error && \
    find . -name "*.ts" -o -name "*.tsx" -o -name "*.map" -type f -delete

# ─── Stage 4: Runner ───────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app
RUN apk add --no-cache wget libc6-compat
RUN mkdir -p /app/ephe /app/logs && \
    chown -R node:node /app

COPY --from=prod-deps --chown=node:node /app ./
COPY --from=builder --chown=node:node /app/apps/api/dist ./apps/api/dist
COPY --from=builder --chown=node:node /app/packages/db/dist ./packages/db/dist
COPY --from=builder --chown=node:node /app/packages/shared/dist ./packages/shared/dist
COPY --chown=node:node ephe/* /app/ephe/

USER node
ENV NODE_ENV=production
ENV PORT=7860
ENV SWISSEPH_PATH=/app/ephe
ENV NODE_OPTIONS="--max-old-space-size=12288 --expose-gc"

EXPOSE 7860

HEALTHCHECK --interval=30s --timeout=15s --retries=3 --start-period=120s \
    CMD wget -q -O- http://localhost:7860/live || exit 1

CMD ["node", "apps/api/dist/server.js"]
