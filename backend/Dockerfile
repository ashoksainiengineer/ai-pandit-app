# AI-Pandit Backend Dockerfile
# Optimized for Hugging Face Spaces Free Tier (16GB RAM)

FROM node:20-slim

# Install system dependencies for Swiss Ephemeris
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY drizzle.config.* ./

# Install dependencies
RUN npm ci --only=production

# Copy ephemeris data
COPY ephe/ ./ephe/

# Copy source code
COPY src/ ./src/
COPY tsconfig.json ./

# Build TypeScript
RUN npm run build

# Remove dev dependencies after build
RUN npm prune --production

# Set environment variables (HF Spaces Free Tier: 16GB RAM)
ENV NODE_ENV=production
ENV PORT=7860
ENV EPHE_PATH=/app/ephe

# Memory optimization for 16GB RAM
# Allow Node.js to use up to 8GB heap (leaving room for other processes)
ENV NODE_OPTIONS="--max-old-space-size=8192"

# Queue configuration
ENV MAX_CONCURRENT_SESSIONS=3
ENV MEMORY_THRESHOLD_PERCENT=80
ENV GC_THRESHOLD_GB=10

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:7860/ || exit 1

# Expose port
EXPOSE 7860

# Start command with memory optimizations
CMD ["node", "--expose-gc", "dist/server.js"]
