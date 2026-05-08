# Upstash Redis Setup Guide — AI-Pandit

> **Free Tier Friendly** — This guide uses Upstash Redis FREE tier. Upgrade only when you hit limits.

---

## Quick Start (5 Minutes)

### Step 1: Create Upstash Account

1. Go to https://console.upstash.com
2. Sign up with GitHub or email (no credit card required)
3. You get **FREE tier** with:
   - 10,000 commands/day
   - 256 MB storage
   - 1 database
   - TLS encryption included

### Step 2: Create Redis Database

```bash
# Login to Upstash CLI
npx @upstash/cli auth login
# Enter your email and API key from https://console.upstash.com

# Create Redis database in Singapore (same region as Cloud Run)
npx @upstash/cli redis create --name ai-pandit-redis --region ap-southeast-1

# Get connection details
npx @upstash/cli redis list
```

**Manual method** (if CLI doesn't work):
1. Go to https://console.upstash.com
2. Click "Create Database"
3. Name: `ai-pandit-redis`
4. Region: **Singapore (ap-southeast-1)** ← Important for low latency
5. Type: **Redis**
6. Click "Create"

### Step 3: Get Connection URL

After creation, you'll see:
```
Endpoint:  your-host.upstash.io
Port:      6379
Password:  your-password
```

**Format the URL:**
```bash
rediss://default:YOUR_PASSWORD@YOUR_HOST.upstash.io:6379
```

⚠️ **Note:** `rediss://` (with double s) = TLS enabled. Upstash requires TLS.

---

## Configuration

### Update .env.production

```bash
# Edit your .env.production file
REDIS_URL=rediss://default:YOUR_PASSWORD@YOUR_HOST.upstash.io:6379
REDIS_TLS=true
REDIS_QUEUE_NAME=ai-pandit:btr:jobs

# Switch to Redis for queues (when ready)
QUEUE_ARCHITECTURE=redis_bullmq

# Optional: Enable Redis event store
USE_REDIS_EVENTS=true
```

### Update Platform Secrets

```bash
# GitHub Actions
gh secret set REDIS_URL --body "rediss://default:YOUR_PASSWORD@YOUR_HOST.upstash.io:6379"

# GCP Secret Manager
echo -n "rediss://default:YOUR_PASSWORD@YOUR_HOST.upstash.io:6379" | \
  gcloud secrets versions add redis-url --data-file=-

# Vercel
vercel env add REDIS_URL production
```

---

## Free Tier Limits & Monitoring

### What You Get (Free)
| Limit | Value |
|-------|-------|
| Commands/day | 10,000 |
| Storage | 256 MB |
| Databases | 1 |
| Max connections | 100 |
| TLS | ✅ Included |
| Persistence | ✅ Included |

### When to Upgrade

**Upgrade to paid ($0.20/100K commands) when:**
- You hit 10,000 commands/day consistently
- You need more than 256 MB storage
- You need multiple databases
- You need VPC/peering

**Cost estimate for 1000 users:**
- Free tier: ~500 active users
- Paid tier: ~$5-20/month for 1000 users
- Much cheaper than self-hosted Redis on GCP

### Monitor Usage

```bash
# Check daily command usage
npx @upstash/cli redis stats --name ai-pandit-redis

# Or view in console: https://console.upstash.com
```

---

## Architecture Switch Guide

### Phase 1: Development (Current)
```bash
QUEUE_ARCHITECTURE=db_polling
USE_REDIS_EVENTS=false
```
- Uses PostgreSQL for queues
- In-memory event storage
- No Redis needed
- ✅ Tested, stable, works

### Phase 2: Redis Queue Only
```bash
QUEUE_ARCHITECTURE=redis_bullmq
USE_REDIS_EVENTS=false
```
- Redis for job queue transport
- In-memory event storage
- ✅ Better performance, multi-instance support

### Phase 3: Full Redis
```bash
QUEUE_ARCHITECTURE=redis_bullmq
USE_REDIS_EVENTS=true
```
- Redis for queues + persistent event storage
- ✅ Best for production scale

### Switching Steps

```bash
# 1. Deploy with Redis
QUEUE_ARCHITECTURE=redis_bullmq \
REDIS_URL=rediss://... \
REDIS_TLS=true \
npm run deploy:cloudrun:api

# 2. Verify health endpoint
curl https://api-service-xxx.a.run.app/health
# Should show: queueDriver: "redis_bullmq"

# 3. Deploy worker with same config
QUEUE_ARCHITECTURE=redis_bullmq \
REDIS_URL=rediss://... \
REDIS_TLS=true \
npm run deploy:cloudrun:worker

# 4. Monitor for errors
gcloud logging read "resource.type=cloud_run_revision" --limit=50
```

---

## Troubleshooting

### "Redis connection failed"

**Cause:** Wrong URL format or network issue

**Fix:**
```bash
# Test connection
redis-cli -u rediss://default:PASSWORD@HOST.upstash.io:6379 PING

# Should return: PONG
```

### "NOAUTH Authentication required"

**Cause:** Password missing or wrong format

**Fix:**
```bash
# Correct format (note the colon before password)
rediss://default:PASSWORD@HOST.upstash.io:6379

# Wrong format (missing colon)
rediss://defaultPASSWORD@HOST.upstash.io:6379
```

### "Connection timeout"

**Cause:** Cloud Run container can't reach Upstash

**Fix:**
1. Verify region is Singapore (`ap-southeast-1`)
2. Check `REDIS_TLS=true` is set
3. Add `keepAlive: 30000` to ioredis config (already done in code)

### "Rate limit exceeded"

**Cause:** Hit 10,000 commands/day free tier limit

**Fix:**
1. Wait until next day (resets at midnight UTC)
2. Or upgrade to paid tier in console

---

## Security Best Practices

1. **Never commit Redis URL** — it's already in `.gitignore`
2. **Use TLS always** — Upstash enforces this
3. **Rotate password quarterly** — Reset in Upstash console
4. **Monitor connections** — Check for unauthorized access
5. **Use least privilege** — Only grant necessary permissions

---

## CLI Reference

```bash
# Install Upstash CLI
npm install -g @upstash/cli

# Login
upstash auth login

# List databases
upstash redis list

# Get database details
upstash redis get --name ai-pandit-redis

# Delete database (careful!)
upstash redis delete --name ai-pandit-redis

# Get connection URL
upstash redis get --name ai-pandit-redis --format url
```

---

## Next Steps

After setting up Redis:
1. ✅ Deploy API with `QUEUE_ARCHITECTURE=redis_bullmq`
2. ✅ Deploy Worker with same config
3. ✅ Monitor queue metrics
4. ✅ Upgrade to paid tier when you hit free limits
5. ✅ Implement Redis-backed rate limiting (see `apps/api/src/middleware/rate-limit.ts`)

---

## Support

- **Upstash Docs:** https://docs.upstash.com
- **Upstash Console:** https://console.upstash.com
- **Community:** https://github.com/upstash/issues
