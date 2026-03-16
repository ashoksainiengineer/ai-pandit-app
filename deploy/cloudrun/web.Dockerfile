FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

FROM base AS builder
COPY package.json package-lock.json turbo.json ./
COPY apps ./apps
COPY packages ./packages
COPY .dockerignore ./.dockerignore

ARG NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_Y2xlcmsuZXhhbXBsZS5hcHAk
ARG NEXT_PUBLIC_BACKEND_URL=https://api.example.com
ARG NEXT_PUBLIC_APP_URL=https://app.example.com

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV NEON_DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/postgres
ENV DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/postgres
ENV CLERK_SECRET_KEY=build_clerk_secret_key_placeholder
ENV CLERK_WEBHOOK_SECRET=build_clerk_webhook_secret_placeholder
ENV ENCRYPTION_SECRET=build_encryption_secret_32_chars_minimum_placeholder
ENV NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=${NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
ENV NEXT_PUBLIC_BACKEND_URL=${NEXT_PUBLIC_BACKEND_URL}
ENV NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}

RUN npm ci --include=dev --loglevel=error
RUN npm --workspace @ai-pandit/shared run build \
 && npm --workspace @ai-pandit/db run build \
 && npm --workspace @ai-pandit/web run build

FROM node:20-alpine AS runner
WORKDIR /app
RUN apk add --no-cache wget libc6-compat
RUN mkdir -p /app && chown -R node:node /app

COPY --from=builder --chown=node:node /app/apps/web/.next/standalone ./
COPY --from=builder --chown=node:node /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=node:node /app/apps/web/public ./apps/web/public

USER node
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=15s --retries=3 --start-period=120s \
  CMD wget -q -O- http://localhost:3000/api/ping || exit 1

CMD ["node", "server.js"]
