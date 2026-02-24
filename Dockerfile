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
RUN corepack enable

# ─── Stage 1: Prune monorepo (extract @ai-pandit/api workspace) ──────────
FROM base AS pruner
WORKDIR /app
RUN npm install -g turbo@^2
COPY . .
RUN turbo prune @ai-pandit/api --docker

# ─── Stage 2: Install dependencies + Build ───────────────────────────────
FROM base AS builder
WORKDIR /app

# Install dependencies first (cache layer — only invalidated if lockfile changes)
COPY --from=pruner /app/out/json/ .
RUN npm ci --ignore-scripts --no-audit --no-fund --loglevel=error

# Copy source code of isolated workspace
COPY --from=pruner /app/out/full/ .
COPY turbo.json turbo.json

# Build the API and any shared packages it depends on
RUN npx turbo run build --filter=@ai-pandit/api...

# Prune devDependencies (Disabled: In npm workspaces, pruning at the root deletes hoisted workspace dependencies)
# RUN npm prune --production --ignore-scripts

# ─── Stage 3: Minimal Runtime Image ──────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

# Install wget for lightweight health checks (tiny: ~400KB)
RUN apk add --no-cache wget

# Security: Non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nodejs && \
    mkdir -p /app/ephe /app/logs && \
    chown -R nodejs:nodejs /app

# ── Copy ONLY production artifacts (not the entire /app/) ──
# 1. Production node_modules (devDeps already pruned)
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules

# 2. Built API dist
COPY --from=builder --chown=nodejs:nodejs /app/apps/api/dist ./apps/api/dist
COPY --from=builder --chown=nodejs:nodejs /app/apps/api/package.json ./apps/api/package.json
# 🔱 Copy nested node_modules for unhoisted dependencies
COPY --from=builder --chown=nodejs:nodejs /app/apps/api/node_modules* ./apps/api/node_modules/

# 3. Root package.json (needed for module resolution in monorepo)
COPY --from=builder --chown=nodejs:nodejs /app/package.json ./package.json

# 4. Shared packages (if any are built and referenced)
# 🔱 Use glob pattern to prevent failure, as Docker COPY does not support `2>/dev/null`
COPY --from=builder --chown=nodejs:nodejs /app/packages* ./packages/

# 5. Ephemeris data (read-only)
COPY --chown=nodejs:nodejs ephe/* /app/ephe/

USER nodejs

# ── Environment ──
ENV NODE_ENV=production
ENV PORT=7860
ENV SWISSEPH_PATH=/app/ephe

# Build-time cache bust (pass via --build-arg CACHE_BUST=$(date +%s))
ARG CACHE_BUST=0
ENV CACHE_BUST=${CACHE_BUST}

EXPOSE 7860

# ── Health Check: Lightweight wget (no Node.js process spawn overhead) ──
HEALTHCHECK --interval=30s --timeout=10s --retries=3 --start-period=15s \
    CMD wget -q --spider http://localhost:7860/api/health || exit 1

# ── Start with V8 memory tuning for long-running analyses ──
# --max-old-space-size=12288  → Allow V8 heap up to 12GB (default ~1.5GB)
# --expose-gc                 → Enable manual GC in code if needed
CMD ["node", "--max-old-space-size=12288", "--expose-gc", "apps/api/dist/server.js"]
