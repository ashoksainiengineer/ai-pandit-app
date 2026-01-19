# ═══════════════════════════════════════════════════════════════════════════
# AI Pandit - Leapcell Backend (512MB RAM Optimized)
# Swiss Ephemeris with minimal memory footprint
# ═══════════════════════════════════════════════════════════════════════════

# Use Alpine for minimal base image (~50MB compressed)
FROM node:20-alpine AS base

# Install build dependencies
RUN apk add --no-cache python3 make g++ git curl

# Dependencies Stage
# ═══════════════════════════════════════════════════════════════════════════
FROM base AS deps
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --omit=dev --include=optional

# 🛡️ GUARANTEE swisseph directory exists to avoid COPY failure
RUN mkdir -p node_modules/swisseph && touch node_modules/swisseph/.placeholder

# ═══════════════════════════════════════════════════════════════════════════
# Builder Stage
# ═══════════════════════════════════════════════════════════════════════════
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Build with memory limits
RUN cd backend && npm install && npm run build
RUN NODE_OPTIONS="--max-old-space-size=384" npm run build

# ═══════════════════════════════════════════════════════════════════════════
# Production Stage - Minimal Runtime
# ═══════════════════════════════════════════════════════════════════════════
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_OPTIONS="--max-old-space-size=384"
# 🚀 CACHE BREAKER: Force HF to rebuild if stuck
ENV BUILD_ID=20260119-2041

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Handle Ephemeris Data (Prefer local, fallback to download)
RUN mkdir -p /app/ephe
# Copy local files first
COPY ephe/* /app/ephe/
# Try downloading missing essentials (ignore failures if local exists)
RUN cd /app/ephe && \
    (curl -L -A "Mozilla/5.0" -O https://download.astro.com/swisseph/ephe/sepl_18.se1 || true) && \
    (curl -L -A "Mozilla/5.0" -O https://download.astro.com/swisseph/ephe/semo_18.se1 || true)

# Copy production assets
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy compiled backend
COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/backend/package*.json ./backend/
RUN cd backend && npm install --omit=dev

# Robustly copy swisseph native module (guaranteed to exist now)
COPY --from=deps /app/node_modules/swisseph ./node_modules/swisseph

# Copy startup script
COPY scripts/start-all.sh ./start-all.sh
RUN chmod +x ./start-all.sh

USER nextjs

EXPOSE 7860

ENV PORT=7860
ENV HOSTNAME="0.0.0.0"
ENV SWISSEPH_PATH=/app/ephe
ENV NEXT_PUBLIC_BACKEND_URL="" 

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD wget -qO- http://localhost:7860/api/health || exit 1

CMD ["./start-all.sh"]
