# ═══════════════════════════════════════════════════════════════════════════
# AI Pandit - BTR Engine (Hugging Face Backend Only)
# ═══════════════════════════════════════════════════════════════════════════

# Stage 1: Build Backend Only
FROM node:20-alpine AS builder
WORKDIR /app

# Copy root package files (for swisseph-wasm and shared deps)
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev --ignore-scripts

# Copy backend source only (no frontend)
COPY backend/ ./backend/
COPY ephe/ ./ephe/
COPY database/ ./database/

# Build Backend
RUN cd backend && npm install && npm run build

# Stage 2: Minimal Runtime
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=7860
ENV CACHE_BUST=2026-01-20-T13-10
ENV SWISSEPH_PATH=/app/ephe

# Install minimal runtime dependencies for WASM/Node
RUN apk add --no-cache libstdc++ libgcc

# Ephemeris Data
RUN mkdir -p /app/ephe
COPY ephe/* /app/ephe/

# Copy built backend and its production dependencies
COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/backend/package*.json ./backend/
# Copy root node_modules for shared libs like swisseph-wasm
COPY --from=builder /app/node_modules ./node_modules

# Install backend-specific production dependencies
RUN cd backend && npm install --omit=dev --ignore-scripts

EXPOSE 7860

# Start the backend engine directly
CMD ["node", "backend/dist/server.js"]
