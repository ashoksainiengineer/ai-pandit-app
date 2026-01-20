# ═══════════════════════════════════════════════════════════════════════════
# AI Pandit - BTR Engine (Hugging Face Backend Only)
# ═══════════════════════════════════════════════════════════════════════════

# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./
# Install root dependencies (including swisseph-wasm)
RUN npm ci --omit=dev --ignore-scripts

# Copy the rest of the source
COPY . .

# Build Backend (requires devDeps in backend folder)
RUN cd backend && npm install && npm run build

# Stage 2: Minimal Runtime
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=7860
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
