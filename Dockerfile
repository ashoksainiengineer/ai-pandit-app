# Stage 1: Build stage with all build tools
FROM node:18-slim AS builder

# Install build dependencies for swisseph C library compilation
RUN apt-get update && apt-get install -y \
    build-essential \
    python3 \
    cmake \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Set build memory limit (optimized for 256MB Northflank)
ENV NODE_OPTIONS="--max-old-space-size=256"

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies) for the build
RUN npm install

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Stage 2: Production stage - minimal image
FROM node:18-slim AS production

# Set working directory
WORKDIR /app

# Copy standalone output from builder stage
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Copy required astrological data files
COPY --from=builder /app/ephe ./ephe

# Set memory optimization for Northflank's 256MB RAM limit
ENV NODE_OPTIONS="--max-old-space-size=180"
ENV PORT=8080

# Expose port
EXPOSE 8080

# Start the application
CMD ["node", "server.js"]
