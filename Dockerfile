# ═══════════════════════════════════════════════════════════════════════════
# AI Pandit - BTR Engine (Hugging Face Backend Only)
# Multi-stage Turborepo build optimized for HF Spaces Free Tier (16GB RAM)
# ═══════════════════════════════════════════════════════════════════════════

FROM node:20-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# 1. Prune the workspace to extract only @ai-pandit/api and its dependencies
FROM base AS pruner
WORKDIR /app
RUN npm install -g turbo
COPY . .
RUN turbo prune @ai-pandit/api --docker

# 2. Install dependencies & Build
FROM base AS builder
WORKDIR /app

# First install dependencies (cache layer)
COPY --from=pruner /app/out/json/ .
RUN npm install --ignore-scripts --no-audit --no-fund --loglevel=error

# Copy source code of isolated workspace
COPY --from=pruner /app/out/full/ .
COPY turbo.json turbo.json

# Build the API and any shared packages it depends on
RUN npx turbo run build --filter=@ai-pandit/api...

# 3. Final Minimal Runtime Image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=7860
ENV CACHE_BUST=2026-02-22-T16-52
ENV SWISSEPH_PATH=/app/ephe

# Install minimal runtime dependencies for Swiss Eph WASM/Node
RUN apk add --no-cache libstdc++ libgcc

# Ephemeris Data
RUN mkdir -p /app/ephe
COPY ephe/* /app/ephe/

# Copy the built application
COPY --from=builder /app/ .

EXPOSE 7860

# Start the backend engine
CMD ["node", "apps/api/dist/server.js"]
