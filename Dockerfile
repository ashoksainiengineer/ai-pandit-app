FROM node:18-slim

# Install build dependencies for swisseph C library compilation
RUN apt-get update && apt-get install -y \
    build-essential \
    python3 \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Expose port
EXPOSE 8080

# Start the application with memory optimization for Northflank's 512MB limit
CMD ["node", "--max-old-space-size=450", "dist/index.js"]
