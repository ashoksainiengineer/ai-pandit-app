# Environment Variables Required by Platform

List of environment variable names (without values) required for each service.

---

## 1. Google Cloud Run - API Service

**Location:** Cloud Console > Cloud Run > api-service > Edit > Variables

```
NEON_DATABASE_URL
REDIS_URL
AI_API_KEY
AI_BASE_URL
AI_MODEL
AI_TIMEOUT_MS
ENCRYPTION_SECRET
CLERK_SECRET_KEY
EPHEMERIS_SERVICE_URL
EPHEMERIS_SERVICE_TIMEOUT_MS
EPHEMERIS_BATCH_SIZE
EPHEMERIS_HOUSE_SYSTEM
EPHEMERIS_ALLOW_ALGORITHMIC_FALLBACK
FRONTEND_URL
ALLOWED_ORIGINS
NODE_ENV
PORT
JOB_EXECUTION_MODE
QUEUE_ARCHITECTURE
WORKER_POLL_INTERVAL_MS
WORKER_DRAIN_TIMEOUT_MS
MAX_CONCURRENT_SESSIONS
MAX_ACTIVE_JOBS_PER_USER
ENABLE_WARMUP
```

---

## 2. Google Cloud Run - Worker Service

**Location:** Cloud Console > Cloud Run > worker-service > Edit > Variables

```
NEON_DATABASE_URL
REDIS_URL
AI_API_KEY
AI_BASE_URL
AI_MODEL
AI_TIMEOUT_MS
ENCRYPTION_SECRET
EPHEMERIS_SERVICE_URL
EPHEMERIS_SERVICE_TIMEOUT_MS
EPHEMERIS_BATCH_SIZE
EPHEMERIS_HOUSE_SYSTEM
QUEUE_ARCHITECTURE
WORKER_POLL_INTERVAL_MS
WORKER_DRAIN_TIMEOUT_MS
JOB_SYNC_POLL_INTERVAL_MS
NODE_ENV
PORT
```

---

## 3. Vercel - Frontend (Current production web target)

**Location:** Vercel Dashboard > Project > Settings > Environment Variables

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
CLERK_SECRET_KEY
CLERK_WEBHOOK_SECRET
NEXT_PUBLIC_BACKEND_URL
NEXT_PUBLIC_APP_URL
NEON_DATABASE_URL
REDIS_URL
ENCRYPTION_SECRET
AI_API_KEY
AI_BASE_URL
AI_MODEL
EPHEMERIS_SERVICE_URL
```

---

## 4. GitHub Secrets and Variables (CI/CD)

**Location:** GitHub Repo > Settings > Secrets and Variables > Actions

Secrets:

```
NEON_DATABASE_URL
DATABASE_URL
REDIS_URL
AI_API_KEY
ENCRYPTION_SECRET
CLERK_SECRET_KEY
CLERK_SECRET_KEY_TEST
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY_TEST
GCP_PROJECT_ID
GCP_SA_KEY
VERCEL_URL
```

Variables:

```
CLOUD_RUN_REGION
ARTIFACT_REGISTRY_REPO
```

---

## 5. Google Secret Manager (Recommended)

**Location:** Cloud Console > Secret Manager

Create secrets with these names:

```
neon-database-url
redis-url
ai-api-key
encryption-secret
clerk-secret-key
```

Then reference in Cloud Run as:
```
NEON_DATABASE_URL=projects/PROJECT_ID/secrets/neon-database-url/versions/latest
```

---

## 6. Production deployment targets

- `apps/web` -> Vercel production project (`aipandit.app`)
- `apps/api` -> Google Cloud Run `api-service`
- `apps/worker` -> Google Cloud Run `worker-service`
- `services/ephemeris` -> Google Cloud Run `ephemeris-service`

The repo still contains a Cloud Run web Dockerfile, but the current live web target is Vercel.

---

## 7. Local Development

**File:** `apps/web/.env.local` (create manually, never commit)

Copy from `.env.local.example` and fill in your values.

---

## Priority Order for Secrets

1. **Production:** Google Secret Manager
2. **CI/CD:** GitHub Secrets
3. **Local:** `.env.local` file (user's machine only)

---

**Note:** Never commit actual values to git. Use `.env.example` files as templates only.
