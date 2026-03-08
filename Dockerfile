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
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nodejs && \
    mkdir -p /app/ephe /app/logs && \
    chown -R nodejs:nodejs /app

COPY --from=prod-deps --chown=nodejs:nodejs /app ./
COPY --from=builder --chown=nodejs:nodejs /app/apps/api/dist ./apps/api/dist
COPY --from=builder --chown=nodejs:nodejs /app/packages/db/dist ./packages/db/dist
COPY --from=builder --chown=nodejs:nodejs /app/packages/shared/dist ./packages/shared/dist
COPY --chown=nodejs:nodejs ephe/* /app/ephe/

USER nodejs
ENV NODE_ENV=production
ENV PORT=7860
ENV SWISSEPH_PATH=/app/ephe
ENV NODE_OPTIONS="--max-old-space-size=12288 --expose-gc"

EXPOSE 7860

HEALTHCHECK --interval=30s --timeout=15s --retries=3 --start-period=120s \
    CMD wget -q -O- http://localhost:7860/health || exit 1

CMD ["node", "apps/api/dist/server.js"]
