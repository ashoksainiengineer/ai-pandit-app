# ═══════════════════════════════════════════════════════════════════════════
# AI Pandit - Leapcell Backend (512MB RAM Optimized)
# Swiss Ephemeris with minimal memory footprint
# ═══════════════════════════════════════════════════════════════════════════

# Use Alpine for minimal base image (~50MB compressed)
FROM node:20-alpine AS base

# Install build dependencies
RUN apk add --no-cache python3 make g++ git curl

# ═══════════════════════════════════════════════════════════════════════════
# Dependencies Stage
# ═══════════════════════════════════════════════════════════════════════════
FROM base AS deps
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --omit=dev --include=optional

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
# Production Stage - Minimal Runtime (~150MB total)
# ═══════════════════════════════════════════════════════════════════════════
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_OPTIONS="--max-old-space-size=384"

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Download Swiss Ephemeris data (minimal set ~15MB)
# Using curl with User-Agent to avoid 404/403 from astro.com
RUN mkdir -p /app/ephe && \
    cd /app/ephe && \
    curl -L -A "Mozilla/5.0" -O https://download.astro.com/swisseph/ephe/sepl_18.se1 && \
    curl -L -A "Mozilla/5.0" -O https://download.astro.com/swisseph/ephe/semo_18.se1 && \
    curl -L -A "Mozilla/5.0" -O https://download.astro.com/swisseph/ephe/seas_18.se1 || \
    echo "Warning: Ephemeris download failed, using local fallback"

# Copy local ephe folder as fallback for missing files
COPY ephe/* /app/ephe/

# Copy only production files
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy compiled backend
COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/backend/package*.json ./backend/
RUN cd backend && npm install --omit=dev

# Robustly copy swisseph native module (only if it exists)
# Use a wildcard to prevent COPY from failing if the directory is missing
COPY --from=deps /app/node_modules/swisseph* ./node_modules/swisseph/

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
