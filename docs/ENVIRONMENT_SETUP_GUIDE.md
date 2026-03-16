# Environment Variables Setup Guide

Step-by-step guide to set up environment variables on all platforms.

---

## 📋 Prerequisites

Make sure you have access to:
- Google Cloud Console (https://console.cloud.google.com)
- Clerk Dashboard (https://dashboard.clerk.com)
- Neon Console (https://console.neon.tech)
- Upstash Console (https://console.upstash.com)
- GitHub Repository Settings

---

## 1️⃣ Google Cloud Run - API Service

**URL:** https://console.cloud.google.com/run

### Steps:
1. Go to **Cloud Run**
2. Click on **api-service**
3. Click **Edit & Deploy New Revision**
4. Click **Variables & Secrets** tab
5. Click **Add Variable** for each variable below

### Variables to Add:

| Variable Name | Value Source | Notes |
|--------------|--------------|-------|
| `NEON_DATABASE_URL` | Neon Console | Connection string with `sslmode=verify-full` |
| `REDIS_URL` | Upstash Console | Redis connection string |
| `AI_API_KEY` | Groq Dashboard | API key for Groq |
| `AI_BASE_URL` | Groq Docs | `https://api.groq.com/openai/v1` |
| `AI_MODEL` | Your choice | `openai/gpt-oss-120b` or other |
| `AI_TIMEOUT_MS` | Set manually | `180000` |
| `ENCRYPTION_SECRET` | Generate | 64-char hex string |
| `CLERK_SECRET_KEY` | Clerk Dashboard | Production key |
| `EPHEMERIS_SERVICE_URL` | Cloud Run | Your ephemeris service URL |
| `EPHEMERIS_SERVICE_TIMEOUT_MS` | Set manually | `15000` |
| `EPHEMERIS_BATCH_SIZE` | Set manually | `250` |
| `EPHEMERIS_HOUSE_SYSTEM` | Set manually | `placidus` |
| `EPHEMERIS_ALLOW_ALGORITHMIC_FALLBACK` | Set manually | `true` |
| `FRONTEND_URL` | Your domain | `https://aipandit.app` |
| `ALLOWED_ORIGINS` | Your domains | Comma-separated list |
| `NODE_ENV` | Set manually | `production` |
| `PORT` | Set manually | `8080` |
| `JOB_EXECUTION_MODE` | Set manually | `external_worker` |
| `QUEUE_ARCHITECTURE` | Set manually | `db_polling` |
| `WORKER_POLL_INTERVAL_MS` | Set manually | `2000` |
| `WORKER_DRAIN_TIMEOUT_MS` | Set manually | `30000` |
| `MAX_CONCURRENT_SESSIONS` | Set manually | `3` |
| `MAX_ACTIVE_JOBS_PER_USER` | Set manually | `2` |
| `ENABLE_WARMUP` | Set manually | `true` |

### Click **Deploy** when done.

---

## 2️⃣ Google Cloud Run - Worker Service

**URL:** https://console.cloud.google.com/run

### Steps:
1. Go to **Cloud Run**
2. Click on **worker-service**
3. Click **Edit & Deploy New Revision**
4. Click **Variables & Secrets** tab
5. Click **Add Variable** for each variable

### Variables to Add:

| Variable Name | Value |
|--------------|-------|
| `NEON_DATABASE_URL` | Same as API service |
| `REDIS_URL` | Same as API service |
| `AI_API_KEY` | Same as API service |
| `AI_BASE_URL` | Same as API service |
| `AI_MODEL` | Same as API service |
| `AI_TIMEOUT_MS` | `180000` |
| `ENCRYPTION_SECRET` | Same as API service |
| `EPHEMERIS_SERVICE_URL` | Same as API service |
| `EPHEMERIS_SERVICE_TIMEOUT_MS` | `15000` |
| `EPHEMERIS_BATCH_SIZE` | `250` |
| `EPHEMERIS_HOUSE_SYSTEM` | `placidus` |
| `QUEUE_ARCHITECTURE` | `db_polling` |
| `WORKER_POLL_INTERVAL_MS` | `2000` |
| `WORKER_DRAIN_TIMEOUT_MS` | `30000` |
| `JOB_SYNC_POLL_INTERVAL_MS` | `2000` |
| `NODE_ENV` | `production` |
| `PORT` | `8080` |

### Click **Deploy** when done.

---

## 3️⃣ Vercel - Frontend

**URL:** https://vercel.com/dashboard

### Steps:
1. Go to your project dashboard
2. Click **Settings**
3. Click **Environment Variables**
4. Add each variable one by one

### Variables to Add:

| Variable Name | Value |
|--------------|-------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | From Clerk Dashboard |
| `CLERK_SECRET_KEY` | From Clerk Dashboard |
| `CLERK_WEBHOOK_SECRET` | From Clerk Dashboard |
| `NEXT_PUBLIC_BACKEND_URL` | `https://api-service-xxx.a.run.app` |
| `NEXT_PUBLIC_APP_URL` | `https://aipandit.app` |
| `NEON_DATABASE_URL` | From Neon Console |
| `REDIS_URL` | From Upstash Console |
| `ENCRYPTION_SECRET` | Same 64-char string |
| `AI_API_KEY` | From Groq |
| `AI_BASE_URL` | `https://api.groq.com/openai/v1` |
| `AI_MODEL` | `openai/gpt-oss-120b` |
| `EPHEMERIS_SERVICE_URL` | Your ephemeris service URL |

### Click **Save** after adding all variables.

---

## 4️⃣ GitHub Secrets and Variables (CI/CD)

**URL:** https://github.com/ashoksainiengineer/ai-pandit-app/settings/secrets/actions

### Steps:
1. Go to repository **Settings**
2. Click **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add each secret one by one

### Secrets to Add:

| Secret Name | Value |
|------------|-------|
| `NEON_DATABASE_URL` | Full connection string |
| `DATABASE_URL` | Same resolved Neon connection string |
| `REDIS_URL` | Full Redis URL |
| `AI_API_KEY` | Groq API key |
| `ENCRYPTION_SECRET` | 64-char hex string |
| `CLERK_SECRET_KEY` | Clerk production key |
| `CLERK_SECRET_KEY_TEST` | Optional test workflow key (can mirror production initially) |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk publishable key |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY_TEST` | Optional test workflow key |
| `GCP_PROJECT_ID` | `ai-pandit-489913` |
| `GCP_SA_KEY` | Full service account JSON |
| `VERCEL_URL` | `https://aipandit.app` |

### Repository Variables to Add:

| Variable Name | Value |
|--------------|-------|
| `CLOUD_RUN_REGION` | `asia-southeast1` |
| `ARTIFACT_REGISTRY_REPO` | `ai-pandit` |

---

## 5️⃣ Vercel - Current Production Web Target

The current live web target is Vercel (`aipandit.app`). Use the linked `apps/web` project and add production variables there. The Cloud Run `web-service` path still exists in the repo as an optional containerized path, but it is not the current live production target.

---

## 6️⃣ Production Source Template

1. Copy `.env.production.example` to a private file such as `.env.production`
2. Fill in the real production values
3. Run `sh scripts/sync-production-config.sh --env-file .env.production` for a dry-run
4. Run `sh scripts/sync-production-config.sh --env-file .env.production --apply` only after reviewing the targets

---

## 7️⃣ Local Development

### Steps:
1. Copy example file:
   ```bash
   cp .env.local.example apps/web/.env.local
   ```

2. Edit `apps/web/.env.local` and fill in your values

3. Never commit this file! (It's already in `.gitignore`)

---

## 🔐 Security Best Practices

1. **Never commit `.env` files** - Already in `.gitignore`
2. **Use different keys for production vs local**
3. **Rotate secrets periodically**
4. **Use Google Secret Manager for production**
5. **Enable 2FA on all accounts**

---

## ✅ Verification Checklist

After setup, verify:

- [ ] Cloud Run API service has all variables
- [ ] Cloud Run Worker service has all variables
- [ ] Vercel has all environment variables
- [ ] GitHub Secrets has all secrets
- [ ] GitHub repository variables are set
- [ ] Local `.env.local` file exists (not committed)
- [ ] Test deployment works

---

## 🆘 Troubleshooting

### Variable not showing up?
- Make sure to click **Deploy** (Cloud Run) or **Save** (Vercel)
- Redeploy the service after adding variables

### Connection errors?
- Check `NEON_DATABASE_URL` has `sslmode=verify-full`
- Verify `REDIS_URL` is correct format

### Authentication errors?
- Verify `CLERK_SECRET_KEY` is production key
- Check `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` matches

---

**Need help?** Check the [README.md](../README.md) or [documentation](./).
