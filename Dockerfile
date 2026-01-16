# Stage 1: Build Stage
# ---------------------
FROM node:20-slim AS builder

# Set working directory
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Build the Next.js standalone application
RUN npm run build

# Prune dev dependencies
RUN npm prune --production

# Stage 2: Production Stage
# -------------------------
FROM node:20-slim AS production

WORKDIR /app

# Set environment variables for production
ENV NODE_ENV=production

# Copy pruned dependencies and standalone build from builder stage
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Expose the port the app will run on
EXPOSE 8080

# Set the command to start the server with increased memory
CMD ["node", "--max-old-space-size=400", "server.js"]
