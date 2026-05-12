FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

FROM base AS builder
# Copy root config files
COPY package.json package-lock.json turbo.json ./

# Copy all workspace package.json files to cache npm ci
COPY apps/api/package.json ./apps/api/
COPY apps/worker/package.json ./apps/worker/
COPY packages/db/package.json ./packages/db/
COPY packages/shared/package.json ./packages/shared/
COPY packages/worker-runtime/package.json ./packages/worker-runtime/

# Install dependencies (cached unless package.json changes)
RUN npm ci --include=dev --loglevel=error

# Now copy the rest of the source code
COPY apps/api ./apps/api
COPY apps/worker ./apps/worker
COPY packages ./packages
COPY .dockerignore ./.dockerignore

RUN npm --workspace @ai-pandit/shared run build \
 && npm --workspace @ai-pandit/db run build \
 && npm --workspace @ai-pandit/worker-runtime run build \
 && npm --workspace @ai-pandit/api run build \
 && npm --workspace @ai-pandit/worker run build

RUN npm prune --omit=dev

FROM node:20-alpine AS runner
WORKDIR /app
RUN apk add --no-cache libc6-compat
RUN chown -R node:node /app

COPY --from=builder --chown=node:node /app/package.json /app/package-lock.json /app/turbo.json ./
COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/apps/worker ./apps/worker
COPY --from=builder --chown=node:node /app/apps/api ./apps/api
COPY --from=builder --chown=node:node /app/packages/shared ./packages/shared
COPY --from=builder --chown=node:node /app/packages/db ./packages/db
COPY --from=builder --chown=node:node /app/packages/worker-runtime ./packages/worker-runtime

# Fix worker dynamic imports — API compiled dist at /app/apps/api/dist/
# but worker's relative imports resolve to /app/apps/worker/dist/apps/api/src/
# Copy full API dist tree so all transitive imports (config, utils, etc.) resolve
RUN mkdir -p /app/apps/worker/dist/apps/api/src && \
    cp -r /app/apps/api/dist/* /app/apps/worker/dist/apps/api/src/
USER node
ENV NODE_ENV=production
ENV JOB_EXECUTION_MODE=external_worker
ENV WORKER_POLL_INTERVAL_MS=2000
ENV NODE_OPTIONS=--max-old-space-size=1024
ENV DB_POOL_MAX=3

# Health check for Cloud Run
HEALTHCHECK --interval=30s --timeout=10s --retries=3 --start-period=60s \
  CMD wget -q -O- http://localhost:8080/live || exit 1

CMD ["node", "apps/worker/dist/apps/worker/src/worker.js"]
