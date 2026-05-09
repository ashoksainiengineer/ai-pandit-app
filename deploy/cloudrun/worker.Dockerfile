FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

FROM base AS builder
COPY package.json package-lock.json turbo.json ./
COPY apps ./apps
COPY packages ./packages
COPY .dockerignore ./.dockerignore

ENV NODE_ENV=development
ENV NEON_DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/postgres
ENV DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/postgres
ENV CLERK_SECRET_KEY=build_clerk_secret_key_placeholder
ENV ENCRYPTION_SECRET=build_encryption_secret_32_chars_minimum_placeholder
ENV NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_Y2xlcmsuZXhhbXBsZS5hcHAk
ENV NEXT_PUBLIC_BACKEND_URL=http://localhost:8080
ENV AI_API_KEY=build_ai_key_placeholder
ENV JOB_EXECUTION_MODE=external_worker
ENV WORKER_POLL_INTERVAL_MS=2000

RUN npm ci --include=dev --loglevel=error
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

USER node
ENV NODE_ENV=production
ENV JOB_EXECUTION_MODE=external_worker
ENV WORKER_POLL_INTERVAL_MS=2000
ENV NODE_OPTIONS=--max-old-space-size=1024
ENV DB_POOL_MAX=3

CMD ["node", "apps/worker/dist/apps/worker/src/worker.js"]
