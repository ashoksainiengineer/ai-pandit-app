# ═══════════════════════════════════════════════════════════════════════════════
# AI-PANDIT BACKEND - PRODUCTION DOCKERFILE
# Multi-stage build optimized for Hugging Face Spaces Free Tier (16GB RAM)
# ═══════════════════════════════════════════════════════════════════════════════

# ───────────────────────────────────────────────────────────────────────────────
# STAGE 1: Builder
# Compiles TypeScript and installs dependencies
# ───────────────────────────────────────────────────────────────────────────────
FROM node:20-slim AS builder

# Install build-time dependencies for native modules
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

WORKDIR /app

# Copy package files first for layer caching
COPY package*.json ./
COPY drizzle.config.* ./

# Install all dependencies (including devDependencies for build)
RUN npm install

# Copy source code and build
COPY src/ ./src/
COPY tsconfig.json ./

# Compile TypeScript to JavaScript
RUN npm run build

# ───────────────────────────────────────────────────────────────────────────────
# STAGE 2: Production
# Minimal runtime image with only production artifacts
# ───────────────────────────────────────────────────────────────────────────────
FROM node:20-slim AS production

# Install runtime-only dependencies (curl for healthchecks)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

WORKDIR /app

# Copy built artifacts from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./

# Copy ephemeris data files (Swiss Ephemeris)
COPY ephe/ ./ephe/

# ───────────────────────────────────────────────────────────────────────────────
# ENVIRONMENT CONFIGURATION
# ───────────────────────────────────────────────────────────────────────────────

# Node.js runtime configuration
ENV NODE_ENV=production
ENV PORT=7860
ENV EPHE_PATH=/app/ephe

# Memory configuration for HF Spaces 16GB RAM
# 10GB heap leaves 6GB for system, ephemeris data, and concurrent processing
ENV NODE_OPTIONS="--max-old-space-size=10240"

# Queue processing limits
ENV MAX_CONCURRENT_SESSIONS=3
ENV RSS_THRESHOLD_GB=10
ENV HEAP_THRESHOLD_GB=8

# ───────────────────────────────────────────────────────────────────────────────
# HEALTH CHECK
# Verifies application is responsive
# ───────────────────────────────────────────────────────────────────────────────
HEALTHCHECK \
    --interval=30s \
    --timeout=10s \
    --start-period=40s \
    --retries=3 \
    CMD curl -fsS http://localhost:7860/ || exit 1

# ───────────────────────────────────────────────────────────────────────────────
# NETWORK CONFIGURATION
# ───────────────────────────────────────────────────────────────────────────────
EXPOSE 7860

# ───────────────────────────────────────────────────────────────────────────────
# STARTUP COMMAND
# --expose-gc enables manual garbage collection for memory optimization
# ───────────────────────────────────────────────────────────────────────────────
CMD ["node", "--expose-gc", "dist/server.js"]
