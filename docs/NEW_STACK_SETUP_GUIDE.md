# AI-Pandit New Stack Setup Guide (Pre-Code Migration)

**Purpose**: Complete setup checklist for migrating from HF Spaces → Cloud Run + Turso → Neon Postgres  
**Read this first**: Before touching any code, complete all infrastructure setup below.  
**Estimated Setup Time**: 2-4 hours (first time)  

## Implementation Status Snapshot (Updated)

Status date: 2026-03-12

- Project in use: `ai-pandit-489913`
- Region in use: `asia-southeast1`
- Cloud Run services deployed:
  - API: `https://api-service-7tjuxigfoq-as.a.run.app`
  - Worker: `https://worker-service-7tjuxigfoq-as.a.run.app`
- Artifact Registry repository created: `ai-pandit` (`asia-southeast1`)
- Migration branch created and pushed: `migration/cloudrun-neon-worker-split`
- Runtime secret injection verified for Cloud Run API and worker
- API feature flags added for async pipeline and persisted stream path
- GitHub Actions workflow added for Cloud Run deploy
- Artifact Registry cleanup workflow added for storage-cost control
- Idle-cost hardening applied:
  - API can scale to zero
  - worker no longer has `minScale=1`
  - worker CPU throttling is enabled for idle periods

Security note:
- Credentials were handled during setup. Rotate and re-issue any key/token that was exposed in chat logs before production rollout.

---

## 🎯 Current vs Target Architecture

| Component | Current | Target | Why Change |
|-----------|---------|--------|------------|
| Frontend | Vercel Free | **Cloud Run web-service** | Remove Vercel dependency |
| Backend | HF Spaces Free | **Cloud Run** | Better scaling, reliability |
| Database | Turso (SQLite) | **Neon Postgres** | Better BTR data model |
| Queue/Cache | None | **Redis (Upstash)** | Async job pipeline |
| Auth | Clerk Free | Clerk Free (keep) | ✅ Already good |
| Storage | None | **GCS** | Artifacts/reports |
| Secrets | .env only | **Secret Manager** | Production security |

---

## 📋 Phase 0: Prerequisites Checklist (Do First!)

### Step 1: Google Cloud Account Setup (30 mins)

#### 1.1 Create GCP Account
- [ ] Go to [Google Cloud Console](https://console.cloud.google.com)
- [ ] Sign up with your Google account
- [ ] **Important**: Add payment method (required even for free tier)
- [ ] Claim $300 free credits (new accounts only)

#### 1.2 Create New Project
- [ ] Click project selector (top bar)
- [ ] Click "New Project"
- [ ] Project Name: `ai-pandit`
- [ ] Note the **Project ID** (e.g., `ai-pandit-489913`)
- [ ] Click "Create"

#### 1.3 Enable Required APIs
Go to "APIs & Services" → "Library" and enable these:

```bash
# Essential APIs - Enable these:
☐ Cloud Run API
☐ Cloud Build API  
☐ Artifact Registry API
☐ Secret Manager API
☐ Cloud Storage API
☐ Cloud Logging API
☐ Cloud Monitoring API
```

**How to enable**: Search each API → Click "Enable"

#### 1.4 Create Service Account
- [ ] Go to "IAM & Admin" → "Service Accounts"
- [ ] Click "Create Service Account"
- [ ] Name: `ai-pandit-deployer`
- [ ] Description: `Deployment service account for CI/CD`
- [ ] Grant these roles:
  - `Cloud Run Admin`
  - `Cloud Build Service Account`
  - `Artifact Registry Writer`
  - `Secret Manager Secret Accessor`
  - `Storage Admin`
- [ ] Click "Done"

#### 1.5 Download Service Account Key
- [ ] Find `ai-pandit-deployer` in list
- [ ] Click ⋮ → "Manage keys"
- [ ] Click "Add Key" → "Create new key"
- [ ] Select "JSON" → Click "Create"
- [ ] **Save the JSON file securely** (e.g., `ai-pandit-489913-key.json`)
- [ ] **Never commit this file to git!**

#### 1.6 Install Google Cloud SDK (Local)
```bash
# Option A: Using apt (Ubuntu/Debian)
echo "deb [signed-by=/usr/share/keyrings/cloud.google.gpg] https://packages.cloud.google.com/apt cloud-sdk main" | sudo tee -a /etc/apt/sources.list.d/google-cloud-sdk.list
curl https://packages.cloud.google.com/apt/doc/apt-key.gpg | sudo apt-key --keyring /usr/share/keyrings/cloud.google.gpg add -
sudo apt update && sudo apt install google-cloud-cli

# Option B: Using snap
sudo snap install google-cloud-sdk --classic

# Option C: Direct download
curl -O https://dl.google.com/dl/cloudsdk/channels/rapid/downloads/google-cloud-cli-linux-x86_64.tar.gz
tar -xf google-cloud-cli-linux-x86_64.tar.gz
./google-cloud-sdk/install.sh
```

#### 1.7 Authenticate gcloud CLI
```bash
# Login to Google Cloud
gcloud auth login

# Set your project
gcloud config set project ai-pandit-489913  # Replace with your Project ID

# Verify
gcloud config get-value project
```

#### 1.8 Configure Docker for GCR
```bash
# Configure Docker to use Google credentials
gcloud auth configure-docker
```

---

### Step 2: Neon Postgres Setup (20 mins)

#### 2.1 Create Neon Account
- [ ] Go to [Neon](https://neon.tech)
- [ ] Sign up with GitHub or email
- [ ] Verify email

#### 2.2 Create Project
- [ ] Click "New Project"
- [ ] Project Name: `ai-pandit`
- [ ] Select region: `Asia Pacific (Singapore)` (closest to India)
- [ ] Database Name: `ai-pandit-db`
- [ ] Click "Create Project"

#### 2.3 Save Connection Details
**⚠️ Important**: Copy these values immediately (shown only once):

```
DATABASE_URL=postgresql://[user]:[password]@[host]/ai-pandit-db?sslmode=require
# Example:
# postgresql://ai-pandit_owner:xxxxxxxx@ep-cool-sun-123456.ap-southeast-1.aws.neon.tech/ai-pandit-db?sslmode=require
```

Save this in your password manager!

#### 2.4 Configure Connection Pooling (Important!)
- [ ] Go to "Branches" → Click your branch
- [ ] Scroll to "Connection String" section
- [ ] Click "Pooled connection"
- [ ] Copy the **Pooled Connection String**
- [ ] This is what your app will use (format: `postgresql://.../ai-pandit-db?sslmode=require`)

#### 2.5 Test Connection (Local)
```bash
# Install psql if not present
sudo apt install postgresql-client

# Test connection (replace with your actual URL)
psql "postgresql://ai-pandit_owner:xxxxxxxx@ep-cool-sun-123456-pooler.ap-southeast-1.aws.neon.tech/ai-pandit-db?sslmode=require"

# You should see: ai-pandit-db=>
# Type \q to exit
```

#### 2.6 Create Initial Tables (Optional - Test Only)
```sql
-- Run this in psql to test
CREATE TABLE test_connection (
    id SERIAL PRIMARY KEY,
    message VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO test_connection (message) VALUES ('Neon is working!');

SELECT * FROM test_connection;

DROP TABLE test_connection;
```

---

### Step 3: Upstash Redis Setup (15 mins)

#### 3.1 Create Upstash Account
- [ ] Go to [Upstash](https://upstash.com)
- [ ] Sign up with GitHub
- [ ] Verify email

#### 3.2 Create Redis Database
- [ ] Click "Create Database"
- [ ] Database Name: `ai-pandit-queue`
- [ ] Region: `Singapore` (ap-southeast-1)
- [ ] Type: **Redis** (not Kafka)
- [ ] Click "Create"

#### 3.3 Get Connection Details
- [ ] Click on your database
- [ ] Go to "Details" tab
- [ ] Copy these values:

```
# For Node.js Redis client (ioredis)
REDIS_HOST=correct-bull-12345.upstash.io
REDIS_PORT=6379
REDIS_PASSWORD=your-password-here

# For REST API (alternative)
UPSTASH_REDIS_REST_URL=https://correct-bull-12345.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token-here
```

#### 3.4 Test Connection (Local)
```bash
# Install redis-cli
sudo apt install redis-tools

# Test connection
redis-cli -h correct-bull-12345.upstash.io -p 6379 -a "your-password-here" ping

# Should return: PONG
```

#### 3.5 Note the Pricing Tiers
**Free Tier Limits**:
- 10,000 commands/day
- 256MB storage
- 1 database

**Pay-as-you-go** (~$0.20/100k commands):
- Unlimited commands
- Up to 10GB storage
- Multiple databases

For development/testing, free tier is fine. For production, you'll need pay-as-you-go.

---

### Step 4: Google Cloud Storage Setup (15 mins)

#### 4.1 Create Storage Bucket
- [ ] Go to [GCS Console](https://console.cloud.google.com/storage/browser)
- [ ] Click "Create Bucket"
- [ ] Name: `ai-pandit-artifacts-489913` (must be globally unique, add project ID)
- [ ] Location Type: **Region**
- [ ] Location: `asia-southeast1` (Singapore)
- [ ] Storage Class: **Standard**
- [ ] Access Control: **Uniform**
- [ ] Prevent public access: **Enforce** (checked)
- [ ] Click "Create"

#### 4.2 Create Folder Structure
```bash
# Using gsutil (install with gcloud)
gsutil mb gs://ai-pandit-artifacts-489913/analysis-results/
gsutil mb gs://ai-pandit-artifacts-489913/reports/
gsutil mb gs://ai-pandit-artifacts-489913/exports/
```

#### 4.3 Test Upload
```bash
# Create test file
echo "Test artifact" > test-artifact.txt

# Upload
gsutil cp test-artifact.txt gs://ai-pandit-artifacts-489913/analysis-results/

# List
gsutil ls gs://ai-pandit-artifacts-489913/analysis-results/

# Delete test file
gsutil rm gs://ai-pandit-artifacts-489913/analysis-results/test-artifact.txt
rm test-artifact.txt
```

---

### Step 5: Secret Manager Setup (10 mins)

#### 5.1 Enable Secret Manager
- [ ] Go to "Security" → "Secret Manager"
- [ ] If not enabled, click "Enable API"

#### 5.2 Create Secrets
For each secret below, click "Create Secret":

```
# Secret 1: neon-database-url
Name: neon-database-url
Secret value: postgresql://ai-pandit_owner:xxxxxxxx@... (your pooled URL)

# Secret 2: redis-url  
Name: redis-url
Secret value: rediss://default:your-password@correct-bull-12345.upstash.io:6379

# Secret 3: ai-api-key
Name: ai-api-key
Secret value: sk-or-v1-xxxxxxxx (your DeepSeek/OpenRouter key)

# Secret 4: encryption-secret
Name: encryption-secret
Secret value: your-32-byte-hex-key

# Secret 5: clerk-secret-key
Name: clerk-secret-key
Secret value: sk_test_xxxxxxxx or sk_live_xxxxxxxx
```

#### 5.3 Grant Access to Service Account
- [ ] For each secret, click on it
- [ ] Go to "Permissions" tab
- [ ] Click "Grant Access"
- [ ] Add member: `ai-pandit-deployer@ai-pandit-489913.iam.gserviceaccount.com`
- [ ] Role: `Secret Manager Secret Accessor`
- [ ] Click "Save"

---

### Step 6: GitHub Actions Setup (20 mins)

#### 6.1 Add Repository Secrets
Go to your GitHub repo → Settings → Secrets and variables → Actions

Add these secrets:

```
Name: GCP_PROJECT_ID
Value: ai-pandit-489913

Name: GCP_SA_KEY
Value: <paste entire content of ai-pandit-489913-key.json file>

Name: NEON_DATABASE_URL
Value: postgresql://ai-pandit_owner:... (pooled URL)

Name: REDIS_URL
Value: rediss://default:...@correct-bull-12345.upstash.io:6379

Name: AI_API_KEY
Value: sk-or-v1-...

Name: ENCRYPTION_SECRET
Value: your-32-byte-hex

Name: CLERK_SECRET_KEY
Value: sk_...

Name: NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
Value: pk_...
```

#### 6.2 Add Repository Variables (Optional)
```
Name: CLOUD_RUN_REGION
Value: asia-southeast1

Name: ARTIFACT_REGISTRY_REPO
Value: ai-pandit
```

---

### Step 7: Cloud Run Initial Setup (25 mins)

#### 7.1 Enable Required Services
```bash
# Run these in terminal
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com
gcloud services enable artifactregistry.googleapis.com
```

#### 7.2 Create Artifact Registry Repository
```bash
# Create Docker repository
gcloud artifacts repositories create ai-pandit \
  --repository-format=docker \
  --location=asia-southeast1 \
  --description="Docker images for AI-Pandit"

# Verify
gcloud artifacts repositories list --location=asia-southeast1
```

#### 7.3 Configure Docker Authentication
```bash
# Authenticate to Artifact Registry
gcloud auth configure-docker asia-southeast1-docker.pkg.dev
```

#### 7.4 Create Placeholder Services
We'll create empty services first to reserve the names:

```bash
# Create api-service placeholder
gcloud run deploy api-service \
  --image=gcr.io/cloudrun/hello \
  --region=asia-southeast1 \
  --platform=managed \
  --allow-unauthenticated \
  --max-instances=10 \
  --min-instances=0 \
  --memory=512Mi \
  --cpu=1 \
  --concurrency=80 \
  --timeout=300 \
  --service-account=ai-pandit-deployer@ai-pandit-489913.iam.gserviceaccount.com

# Create worker-service placeholder  
gcloud run deploy worker-service \
  --image=gcr.io/cloudrun/hello \
  --region=asia-southeast1 \
  --platform=managed \
  --no-allow-unauthenticated \
  --max-instances=20 \
  --min-instances=0 \
  --memory=2Gi \
  --cpu=2 \
  --concurrency=1 \
  --timeout=3600 \
  --service-account=ai-pandit-deployer@ai-pandit-489913.iam.gserviceaccount.com
```

#### 7.5 Note Service URLs
After creating, you'll see URLs like:
- API Service: `https://api-service-xxx-asia-southeast1.run.app`
- Worker Service: `https://worker-service-xxx-asia-southeast1.run.app`

Save these for later!

---

## 🔐 Environment Variables Summary

Create a `.env.production` file (DO NOT commit this!):

```bash
# =============================================================================
# AI-PANDIT PRODUCTION ENVIRONMENT VARIABLES
# =============================================================================
# Fill these after completing setup above

# -----------------------------------------------------------------------------
# Google Cloud
# -----------------------------------------------------------------------------
GCP_PROJECT_ID=ai-pandit-489913
GCP_REGION=asia-southeast1
GCS_BUCKET=ai-pandit-artifacts-489913

# -----------------------------------------------------------------------------
# Database (Neon)
# -----------------------------------------------------------------------------
# Use the POOLED connection string (important for serverless!)
NEON_DATABASE_URL=postgresql://ai-pandit_owner:password@host-pooler.region.aws.neon.tech/ai-pandit-db?sslmode=require

# -----------------------------------------------------------------------------
# Redis (Upstash)
# -----------------------------------------------------------------------------
REDIS_URL=rediss://default:password@correct-bull-12345.upstash.io:6379
UPSTASH_REDIS_REST_URL=https://correct-bull-12345.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token

# -----------------------------------------------------------------------------
# AI Service
# -----------------------------------------------------------------------------
AI_API_KEY=sk-or-v1-xxxxxxxx
AI_MODEL=deepseek/deepseek-r1:free
AI_API_URL=https://openrouter.ai/api/v1

# -----------------------------------------------------------------------------
# Auth (Clerk)
# -----------------------------------------------------------------------------
CLERK_SECRET_KEY=sk_test_xxxxxxxx
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxx

# -----------------------------------------------------------------------------
# Security
# -----------------------------------------------------------------------------
ENCRYPTION_SECRET=your-32-byte-hex-key-here-64chars

# -----------------------------------------------------------------------------
# API Configuration
# -----------------------------------------------------------------------------
NEXT_PUBLIC_BACKEND_URL=https://api-service-xxx-asia-southeast1.run.app
NEXT_PUBLIC_APP_URL=https://web-service-xxx-asia-southeast1.run.app
CORS_ORIGIN=https://web-service-xxx-asia-southeast1.run.app

# -----------------------------------------------------------------------------
# Worker Configuration
# -----------------------------------------------------------------------------
MAX_WORKER_CONCURRENCY=1
MAX_STAGE_RETRIES=3
JOB_TIMEOUT_HOURS=4

# -----------------------------------------------------------------------------
# Feature Flags (For migration)
# -----------------------------------------------------------------------------
USE_ASYNC_JOB_PIPELINE=false
USE_NEW_STREAM_PATH=false
```

---

## 🧪 Validation Checklist (Run Before Code Changes)

Before you start modifying code, verify everything works:

```bash
# 1. Google Cloud CLI works?
gcloud config get-value project
# Expected: ai-pandit-489913

# 2. Can authenticate to Docker?
docker pull gcr.io/cloudrun/hello
# Expected: Image pulled successfully

# 3. Neon database reachable?
psql "$NEON_DATABASE_URL" -c "SELECT version();"
# Expected: PostgreSQL version info

# 4. Redis reachable?
redis-cli -u "$REDIS_URL" ping
# Expected: PONG

# 5. Can access secrets?
gcloud secrets versions access latest --secret=neon-database-url
# Expected: Your database URL

# 6. Cloud Run services exist?
gcloud run services list --region=asia-southeast1
# Expected: api-service and worker-service listed

# 7. GCS bucket accessible?
gsutil ls gs://ai-pandit-artifacts-489913/
# Expected: Lists folders (analysis-results/, reports/, exports/)
```

---

## 📊 Cost Estimates (Monthly)

### Development Phase (Low Traffic)

| Service | Free Tier | Paid (if exceeded) |
|---------|-----------|-------------------|
| Cloud Run API | 2M requests/month | $0.40/million |
| Cloud Run Worker | 2M requests/month | $0.40/million |
| Neon | 500M compute units | $0.000016/CU |
| Upstash Redis | 10k cmds/day | $0.20/100k cmds |
| GCS | 5GB storage | $0.020/GB |
| Secret Manager | 10k access/month | $0.03/10k |
| **Total** | **~$0** | **$5-20** |

### Production Phase (100 analyses/day)

| Service | Estimated Cost |
|---------|----------------|
| Cloud Run API | $10-20 |
| Cloud Run Worker | $50-100 |
| Neon Postgres | $20-30 |
| Upstash Redis | $10-20 |
| GCS Storage | $5-10 |
| **Total** | **~$100-180/month** |

**Note**: Much cheaper than HF Spaces paid tier and infinitely more scalable!

---

## 🚨 Common Setup Issues & Solutions

### Issue 1: "Billing account not configured"
**Solution**: Go to Billing → Link a billing account (even for free tier)

### Issue 2: "Cloud Run API not enabled"
**Solution**: Run `gcloud services enable run.googleapis.com`

### Issue 3: "Permission denied on Secret Manager"
**Solution**: Add `Secret Manager Secret Accessor` role to service account

### Issue 4: "Neon connection timeout"
**Solution**: Use pooled connection string, not direct connection

### Issue 5: "Redis AUTH failed"
**Solution**: Copy password correctly from Upstash (case-sensitive!)

### Issue 6: "Artifact Registry permission denied"
**Solution**: Run `gcloud auth configure-docker asia-southeast1-docker.pkg.dev`

---

## ✅ Pre-Code Checklist (All Must Be Green!)

Before writing any migration code, verify:

- [x] GCP account created with billing
- [x] Project `ai-pandit-489913` created
- [x] All 7 APIs enabled
- [x] Service account created with 5 roles
- [x] Service account JSON key downloaded and saved securely
- [x] gcloud CLI installed and authenticated
- [x] Neon project created (Singapore region)
- [x] Neon pooled connection string copied
- [x] Connection tested with psql
- [x] Upstash Redis database created (Singapore)
- [x] Redis URL and token copied
- [x] Redis REST connection tested (set/get success)
- [x] GCS bucket created
- [x] 5 secrets created in Secret Manager
- [x] Service account granted access to secrets
- [x] GitHub Actions secrets added (including backend URL)
- [x] Artifact Registry repository created
- [x] Docker authenticated to Artifact Registry
- [x] api-service placeholder deployed
- [x] worker-service placeholder deployed
- [ ] Full validation suite re-run after code migration starts

Notes:
- GCS pseudo-folders are optional. Create prefixes by uploading objects like `analysis-results/.keep` if needed.

**Only when all boxes are checked → Start code migration!**

---

## 📝 Next Steps After Setup

Once setup is complete:

1. **Update AGENTS.md** with new stack info
2. **Create database migration** for new tables (jobs, job_events, etc.)
3. **Implement POST /api/jobs** endpoint
4. **Create worker service scaffold**
5. **Update GitHub Actions workflow** for deployment

---

## 🔗 Important Links (Bookmark These)

- [Google Cloud Console](https://console.cloud.google.com)
- [Neon Console](https://console.neon.tech)
- [Upstash Console](https://console.upstash.com)
- [Cloud Run Pricing](https://cloud.google.com/run/pricing)
- [Neon Pricing](https://neon.tech/pricing)
- [Upstash Pricing](https://upstash.com/pricing)

---

**Questions or Issues?**
- Google Cloud: Check [Cloud Run docs](https://cloud.google.com/run/docs)
- Neon: Check [Neon docs](https://neon.tech/docs)
- Upstash: Check [Upstash Redis docs](https://docs.upstash.com/redis)

---

*Last Updated: 2026-03-11*  
*Status: Setup Guide v1.0*
