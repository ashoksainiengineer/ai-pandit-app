# ═══════════════════════════════════════════════════════════════════════════
# AI Pandit - Unified BTR Engine (Hugging Face Optimized)
# ═══════════════════════════════════════════════════════════════════════════

# Stage 1: Build everything
FROM node:20-alpine AS builder
WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++ git curl

# Copy core files first for better caching
COPY package.json package-lock.json* ./
RUN npm ci --include=optional

# 🛡️ FOOLPROOF: Ensure swisseph exists even if it fails to build
RUN mkdir -p node_modules/swisseph && touch node_modules/swisseph/.placeholder

# Copy source
COPY . .

# Build Backend first
RUN cd backend && npm install && npm run build

# Build Next.js Frontend
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
RUN NODE_OPTIONS="--max-old-space-size=384" npm run build

# ═══════════════════════════════════════════════════════════════════════════
# Stage 2: Minimal Runtime
# ═══════════════════════════════════════════════════════════════════════════
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_OPTIONS="--max-old-space-size=384"
# 🚀 CACHE BREAKER - Guaranteed fresh build
ENV BUILD_VERSION="1.0.1-final"

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Ephemeris Data (Local fallbacks prioritized to avoid 404s)
RUN mkdir -p /app/ephe
COPY ephe/* /app/ephe/

# Copy Standalone Next.js files
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy compiled backend
COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/backend/package*.json ./backend/
RUN cd backend && npm install --omit=dev

# Robust swisseph handling
COPY --from=builder /app/node_modules/swisseph ./node_modules/swisseph

# Startup Script
COPY scripts/start-all.sh ./start-all.sh
RUN chmod +x ./start-all.sh

USER nextjs

EXPOSE 7860
ENV PORT=7860
ENV HOSTNAME="0.0.0.0"
ENV SWISSEPH_PATH=/app/ephe
ENV NEXT_PUBLIC_BACKEND_URL=""

# Simple Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD wget -qO- http://localhost:7860/api/health || exit 1

CMD ["./start-all.sh"]
