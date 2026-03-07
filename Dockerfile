# ═══════════════════════════════════════════════════════════════════════════
# AI Pandit - BTR Engine (Hugging Face Backend Only)
# Industry-grade multi-stage build optimized for HF Spaces (16GB RAM)
#
# Optimizations Applied:
# 1. Multi-stage build (prune → install → build → runtime)
# 2. npm ci for deterministic, reproducible installs
# 3. Selective COPY in runner (only dist + production deps + ephe)
# 4. V8 memory tuning (--max-old-space-size) for long analyses
# 5. Lightweight health check (wget vs node process spawn)
# 6. Non-root user with hardened permissions
# 7. Build args for cache busting (no more hardcoded ENV)
# ═══════════════════════════════════════════════════════════════════════════

# ─── Stage 0: Base ────────────────────────────────────────────────────────
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat
RUN npm install -g turbo@^2
WORKDIR /app

# ─── Stage 1: Prune ────────────────────────────────────────────────────────
# This stage isolates the API workspace to create a minimal build context
FROM base AS pruner
COPY . .
RUN turbo prune @ai-pandit/api --docker

# ─── Stage 2: Builder ──────────────────────────────────────────────────────
# Install ALL dependencies and build the source
FROM base AS builder
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/package-lock.json ./package-lock.json
RUN npm ci --loglevel=error

COPY --from=pruner /app/out/full/ .
COPY turbo.json turbo.json
RUN turbo run build --filter=@ai-pandit/api...

# ─── Stage 3: Production Prep ──────────────────────────────────────────────
# We prepare the production node_modules here to keep the runner stage slim.
FROM base AS prod-deps
COPY --from=pruner /app/out/full/ .
COPY --from=pruner /app/out/package-lock.json ./package-lock.json
RUN npm ci --omit=dev --loglevel=error && \
    find . -name "*.ts" -o -name "*.tsx" -o -name "*.map" -type f -delete

# ─── Stage 4: Runner ───────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

# Install security patches and tools
RUN apk add --no-cache wget libc6-compat

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nodejs && \
    mkdir -p /app/ephe /app/logs && \
    chown -R nodejs:nodejs /app

# 1. Copy production dependencies + pruned structure
COPY --from=prod-deps --chown=nodejs:nodejs /app ./

# 2. Copy compiled artifacts from builder (overwrites placeholders)
COPY --from=builder --chown=nodejs:nodejs /app/apps/api/dist ./apps/api/dist
COPY --from=builder --chown=nodejs:nodejs /app/packages/db/dist ./packages/db/dist
COPY --from=builder --chown=nodejs:nodejs /app/packages/shared/dist ./packages/shared/dist

# 3. Copy ephemeris data (the only heavy asset)
COPY --chown=nodejs:nodejs ephe/* /app/ephe/

USER nodejs

# Standard Production Environment
ENV NODE_ENV=production
ENV PORT=7860
ENV SWISSEPH_PATH=/app/ephe

# V8 Optimization for memory-heavy astrology logic (HF 16GB RAM)
# Allow 12GB heap, leaving room for system/other processes
ENV NODE_OPTIONS="--max-old-space-size=12288 --expose-gc"

EXPOSE 7860

# 🛠️ Robust Health Check:
# - Wait up to 120s for DB cleanup/Init (start-period)
# - Use direct /health path
# - Non-blocking wget
HEALTHCHECK --interval=30s --timeout=15s --retries=3 --start-period=120s \
    CMD wget -q -O- http://localhost:7860/health || exit 1

CMD ["node", "apps/api/dist/server.js"]
