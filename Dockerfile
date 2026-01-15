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

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies) using npm install to resolve conflicts
RUN npm install --omit=dev

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Stage 2: Production stage - minimal image
FROM node:18-slim AS production

# Set working directory
WORKDIR /app

# Create non-root user for security
RUN groupadd -r pandit && useradd -r -g pandit pandit

# Copy compiled application from builder stage
COPY --from=builder --chown=pandit:pandit /app/dist ./dist
COPY --from=builder --chown=pandit:pandit /app/node_modules ./node_modules
COPY --from=builder --chown=pandit:pandit /app/package*.json ./

# Copy required astrological data files
COPY --from=builder --chown=pandit:pandit /app/ephe ./ephe

# Switch to non-root user
USER pandit

# Expose port
EXPOSE 8080

# Start the application with memory optimization for Northflank's 256MB RAM limit
CMD ["node", "--max-old-space-size=180", "dist/index.js"]
