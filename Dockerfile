# Stage 1: Build Stage
FROM node:20-slim AS builder

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the source code
COPY . .

# Build the Next.js application
# The standalone output will be in .next/standalone
RUN npm run build

# Stage 2: Production Stage
FROM node:20-slim AS runner

WORKDIR /app

# Set production environment
ENV NODE_ENV=production
# Set heap memory limit for 512MB RAM
ENV NODE_OPTIONS=--max-old-space-size=400
# Expose the port the app will run on
EXPOSE 3000
ENV PORT=3000

# Create a non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy the standalone output from the builder stage
COPY --from=builder /app/.next/standalone ./
# Copy public and static assets
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/static ./.next/static

# The swisseph data files need to be copied manually
COPY --from=builder /app/ephe ./ephe

# Change ownership of the app directory
RUN chown -R nextjs:nodejs /app

# Switch to the non-root user
USER nextjs

# Start the server
CMD ["node", "server.js"]
