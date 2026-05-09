# SECRET ROTATION GUIDE — AI-Pandit

> **⚠️ CRITICAL:** Your `.env.production` file contains real production secrets.
> Even though it's not committed to git, it exists on your local filesystem.
> Follow this guide to rotate ALL secrets immediately.

---

## Step 1: Generate New Secrets

```bash
# Generate new ENCRYPTION_SECRET (64 hex chars = 32 bytes = 256 bits)
openssl rand -hex 32

# Example output: a1b2c3d4e5f6... (64 characters)
# Save this somewhere secure (password manager, not in repo)
```

---

## Step 2: Rotate DeepSeek API Key

1. Go to https://platform.deepseek.com/api_keys
2. Click "Create API Key"
3. Copy the new key
4. Delete the old key: `sk-3da058d9b6574d48968032485ee49603`

---

## Step 3: Rotate Clerk Secret Key

1. Go to https://dashboard.clerk.com
2. Select your production instance
3. Go to Settings → API Keys
4. Click "Rotate secret key"
5. Copy the new `sk_live_...` key

---

## Step 4: Rotate Neon DB Password

1. Go to https://console.neon.tech
2. Select your project
3. Go to Settings → Reset Password
4. Copy the new connection string

---

## Step 5: Rotate Upstash Redis Token

1. Go to https://console.upstash.com
2. Select your Redis database
3. Go to Security → Reset Password
4. Copy the new Redis URL

---

## Step 6: Update GitHub Repository Secrets

After rotating all secrets, update GitHub:

```bash
# DeepSeek API Key
gh secret set AI_API_KEY --body "sk-NEW_DEEPSEEK_KEY"

# Clerk Secret Key
gh secret set CLERK_SECRET_KEY --body "sk_live_NEW_CLERK_KEY"

# Neon DB URL (with new password)
gh secret set NEON_DATABASE_URL --body "postgresql://user:NEW_PASSWORD@host.region.aws.neon.tech/dbname?sslmode=require"

# Redis URL (with new token)
gh secret set REDIS_URL --body "rediss://default:NEW_TOKEN@host.upstash.io:6379"

# Encryption Secret (64 hex chars)
gh secret set ENCRYPTION_SECRET --body "NEW_64_CHAR_HEX_SECRET"
```

---

## Step 7: Update GCP Secret Manager

```bash
# Authenticate to GCP
gcloud auth login
gcloud config set project ai-pandit-489913

# Update Neon DB URL
echo -n "postgresql://user:NEW_PASSWORD@host.region.aws.neon.tech/dbname?sslmode=require" | gcloud secrets versions add neon-database-url --data-file=-

# Update Redis URL
echo -n "rediss://default:NEW_TOKEN@host.upstash.io:6379" | gcloud secrets versions add redis-url --data-file=-

# Update AI API Key
echo -n "sk-NEW_DEEPSEEK_KEY" | gcloud secrets versions add ai-api-key --data-file=-

# Update Encryption Secret
echo -n "NEW_64_CHAR_HEX_SECRET" | gcloud secrets versions add encryption-secret --data-file=-

# Update Clerk Secret Key
echo -n "sk_live_NEW_CLERK_KEY" | gcloud secrets versions add clerk-secret-key --data-file=-
```

---

## Step 8: Update Vercel Production Env Vars

```bash
# Update secrets on Vercel
vercel env add CLERK_SECRET_KEY production
vercel env add AI_API_KEY production
vercel env add NEON_DATABASE_URL production
vercel env add REDIS_URL production
vercel env add ENCRYPTION_SECRET production
```

Or via dashboard: https://vercel.com/dashboard → Select project → Settings → Environment Variables

---

## Step 9: Update Local `.env.production`

After rotating all secrets, update your local `.env.production` file with the new values.

**DO NOT commit this file.** It's already in `.gitignore`.

---

## Step 10: Redeploy All Services

```bash
# Deploy ephemeris first (no secrets needed)
npm run deploy:cloudrun:ephemeris

# Deploy API (now with secrets properly mapped)
npm run deploy:cloudrun:api

# Deploy worker
npm run deploy:cloudrun:worker

# Verify all services are healthy
gcloud run services list --project ai-pandit-489913 --region asia-southeast1
```

---

## Step 11: Verify Cloud Run Secrets Are Mapped

```bash
# Check API service secrets
gcloud run services describe api-service --region asia-southeast1 --format="table(spec.template.spec.containers[0].env[].name)"

# Check worker service secrets
gcloud run services describe worker-service --region asia-southeast1 --format="table(spec.template.spec.containers[0].env[].name)"
```

You should see `NEON_DATABASE_URL`, `REDIS_URL`, `AI_API_KEY`, `ENCRYPTION_SECRET`, and `CLERK_SECRET_KEY` in the output.

---

## DeepSeek Model Update

**Old model (deprecated July 24, 2026):** `deepseek-chat`
**New model:** `deepseek-v4-flash`

Updated in:
- `scripts/deploy-cloud-run.sh` (both API and worker cases)
- `.env.production`
- `.env.production.example`
- `.env.example`
- `apps/api/.env.example`

The `deepseek-v4-flash` model has:
- 284B total parameters / 13B active
- 1,000,000 token context window
- Cheaper and faster than `deepseek-v4-pro`
- Perfect for high-volume BTR workloads

---

## Verification Checklist

- [ ] DeepSeek API key rotated and updated in all platforms
- [ ] Clerk secret key rotated and updated in all platforms
- [ ] Neon DB password reset and connection string updated
- [ ] Upstash Redis token reset and URL updated
- [ ] ENCRYPTION_SECRET regenerated (64 hex chars)
- [ ] GitHub secrets updated
- [ ] GCP Secret Manager secrets updated
- [ ] Vercel env vars updated
- [ ] Cloud Run API service deployed with `--set-secrets`
- [ ] Cloud Run Worker service deployed with `--set-secrets`
- [ ] All services healthy after redeploy

---

## Security Best Practices Going Forward

1. **Never commit `.env.production`** — it's in `.gitignore` now
2. **Use `.env.production.example`** as a template with fake values
3. **Rotate secrets quarterly** — set calendar reminders
4. **Use `scripts/sync-production-config.sh`** to push secrets consistently
5. **Enable GCP Secret Manager audit logs** to track access
6. **Monitor DeepSeek usage** — set billing alerts at 60% and 90%

---

## Emergency Contact

If anything breaks during rotation:
- Clerk: https://clerk.com/support
- DeepSeek: https://platform.deepseek.com
- Neon: https://neon.tech/docs/introduction
- Upstash: https://upstash.com/docs
