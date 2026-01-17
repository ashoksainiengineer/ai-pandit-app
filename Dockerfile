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
RUN mkdir -p /app/ephe && \
    cd /app/ephe && \
    wget -q https://www.astro.com/ftp/swisseph/ephe/sepl_18.se1 && \
    wget -q https://www.astro.com/ftp/swisseph/ephe/semo_18.se1 && \
    wget -q https://www.astro.com/ftp/swisseph/ephe/seas_18.se1 || true

# Copy only production files
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy swisseph native module
COPY --from=deps /app/node_modules/swisseph ./node_modules/swisseph 2>/dev/null || true

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV SWISSEPH_PATH=/app/ephe

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD wget -qO- http://localhost:3000/api/health || exit 1

CMD ["node", "server.js"]
