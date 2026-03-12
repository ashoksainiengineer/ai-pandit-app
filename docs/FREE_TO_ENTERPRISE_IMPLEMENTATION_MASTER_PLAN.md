# AI-Pandit Free-to-Enterprise Implementation Master Plan

Last updated: 2026-03-11 (Asia/Kolkata)  
Owner: Product + Engineering  
Audience: Founder, tech leads, coding agents

## Execution Snapshot (Updated)

Status date: 2026-03-11

Completed infrastructure milestones:
- GCP project ready: `ai-pandit-489913`
- Required Cloud APIs enabled (Run, Build, Artifact Registry, Secret Manager, Storage, Logging, Monitoring)
- Service account created and configured for deploy/access
- Neon Postgres provisioned (Singapore, pooled connection verified)
- Upstash Redis provisioned (REST flow verified)
- GCS bucket provisioned
- Secret Manager core secrets created
- Artifact Registry Docker repository created: `ai-pandit`
- Cloud Run services deployed:
  - API: `https://api-service-7tjuxigfoq-as.a.run.app`
  - Worker: `https://worker-service-624056173858.asia-southeast1.run.app`
- Migration branch created/pushed: `migration/cloudrun-neon-worker-split`

Immediate coding next actions:
1. Add durable job tables and migration (`jobs`, `job_events`, `job_attempts`, `idempotency_keys`, `artifacts`)
2. Implement `POST /api/jobs` with immediate `jobId` response and queue enqueue
3. Scaffold `apps/worker` with queue consume loop and one pilot stage

## 1) Mission and Constraints

Build AI-Pandit into an enterprise-grade Birth Time Rectification platform that is:
- Highly reliable under heavy concurrent usage
- Cost-efficient in early stage (free/low-cost start)
- Horizontally scalable without full rewrites
- Secure and auditable for sensitive personal data

Hard constraints:
- Start with mostly free/low fixed-cost services
- Keep migration path to paid scale on same architecture pattern
- Avoid risky full rewrite before stabilizing architecture boundaries

## 2) Executive Decision (Important)

Do **not** do a full rewrite first.  
Do **architecture-first migration**:

1. Separate request handling from heavy compute
2. Replace in-memory queue semantics with durable queue + persisted job state
3. Enforce typed API contracts end-to-end
4. Add observability, SLOs, and cost controls
5. Only then optimize hotspots (Rust optional, targeted)

Rust strategy:
- Allowed for CPU-hot worker modules **after profiling proves bottleneck**
- Not recommended for full frontend/backend/auth/orchestration rewrite in phase 1

## 3) Current System Risks (From Repo Inspection)

Priority risks in current codebase:
- In-memory queue/process state limits multi-instance safety and reliability
- Large client-heavy analysis page increases latency and maintenance cost
- API contract drift risk from ad-hoc client/fetch patterns
- Mixed concerns in runtime (API + orchestration + heavy compute coupling)

## 4) Alternatives to Current Stack (Vercel, HF Spaces, Clerk, Turso)

This section directly answers: what to replace with what, and why.

## 4.1 Frontend Hosting (Alternative to Vercel)

Option A: Keep `Vercel` (baseline)
- Pros:
  - Best Next.js compatibility and DX
  - Fast preview workflow and edge features
  - Easy global delivery
- Cons:
  - Hobby plan is not meant for commercial production
  - Function/runtime economics can become expensive for heavy dynamic workloads

Option B: `Cloudflare Pages + Workers`
- Pros:
  - Strong free tier and low entry pricing
  - Global edge network, good latency
  - Useful if you want queue + compute primitives in same ecosystem
- Cons:
  - Next.js compatibility is improving but still more adaptation vs Vercel-first path
  - Complex server features may need extra engineering

Option C: `Netlify`
- Pros:
  - Strong frontend platform and previews
  - Good team workflows
- Cons:
  - For Next.js-heavy apps, integration is generally less seamless than Vercel
  - Runtime cost model must be monitored carefully

Recommendation for this project:
- Keep Vercel initially for UI speed.
- Move only heavy compute and orchestration out of Vercel serverless runtime.

## 4.2 Backend Compute (Alternative to HF Spaces)

Option A: `Railway` (general-purpose API + worker hosting)
- Pros:
  - Fastest path from Docker to deployment
  - Good for early-stage small team velocity
- Cons:
  - Community reports occasional reliability concerns; design for failure from day 1
  - Cost can climb if services are always-on and not tuned

Option B: `Render`
- Pros:
  - Stable PaaS model, easy managed services
  - Straightforward deployments for API/worker split
- Cons:
  - Cold start and scaling behavior depend on plan choices
  - Can become costlier than expected at sustained load

Option C: `Fly.io`
- Pros:
  - Good global deployment model
  - Flexible machine control
- Cons:
  - Operational complexity can be higher for new teams
  - Reliability sentiment is mixed; requires stronger ops discipline

Option D: `Modal` / `Runpod` (burst compute specialization)
- Pros:
  - Good for bursty heavy workloads
  - Pay-for-usage model can be efficient for non-constant demand
- Cons:
  - Adds platform complexity if used as core app backend
  - Better as specialized worker layer than full platform replacement

Recommendation for this project:
- Replace HF Spaces with API+worker deployment on Cloud Run (api-service + worker-service).
- Keep a Docker-compatible path so migration to ECS/Fargate is straightforward.

## 4.3 Authentication (Alternative to Clerk)

Option A: Keep `Clerk` (baseline)
- Pros:
  - Fastest integration for Next.js
  - Mature auth UX and developer tooling
- Cons:
  - Vendor lock-in risk at deep integration points
  - Pricing sensitivity at scale needs planning

Option B: `Supabase Auth`
- Pros:
  - Integrated with Postgres ecosystem
  - Good free-to-paid ramp and unified platform option
- Cons:
  - Multi-tenant enterprise auth patterns can require custom design
  - Requires careful JWT/RLS design discipline

Option C: `Auth0`
- Pros:
  - Enterprise-grade IAM features and compliance posture
  - Strong B2B/organization capabilities
- Cons:
  - Price can rise significantly as MAU and enterprise features grow
  - Higher integration complexity than Clerk for startup speed

Option D: `Better Auth` (self-host route)
- Pros:
  - Maximum control and reduced platform lock-in
  - Good fit if you want infrastructure ownership
- Cons:
  - You own operational burden (security, uptime, incident response)
  - Slower to ship vs managed auth if team is small

Recommendation for this project:
- Keep Clerk for now unless cost/compliance forces change.
- If migration is needed later: Clerk -> Auth0 (enterprise) or Clerk -> Better Auth (control-first).

## 4.4 Database (Alternative to Turso)

Option A: `Neon Postgres` (recommended default)
- Pros:
  - Serverless Postgres with autoscaling and scale-to-zero controls
  - Strong migration path from startup to production
  - Works well with queue/worker and transactional workloads
- Cons:
  - Need pooling and query discipline under high concurrency
  - Usage and autoscaling caps must be tuned to avoid surprises

Option B: `Supabase Postgres`
- Pros:
  - Full-stack backend features (Auth/Storage/Realtime) around Postgres
  - Strong developer ergonomics
- Cons:
  - Platform coupling can grow if too many managed features are used
  - Must watch compute/bandwidth/storage economics

Option C: `AWS RDS PostgreSQL`
- Pros:
  - Mature enterprise operations and ecosystem
  - Strong reliability controls and long-term scale path
- Cons:
  - More ops and cost overhead earlier
  - Slower developer velocity in initial phase vs serverless Postgres offerings

Recommendation for this project:
- Migrate from Turso to Neon Postgres in Phase 1-2.
- Move to RDS/Aurora only when sustained production scale justifies it.

## 4.5 Recommended Free-to-Paid Target Stack (Updated)

Stage A (MVP -> early production):
- Frontend: Next.js on Vercel
- Auth: Clerk
- DB: Neon Postgres
- Queue/cache: Upstash Redis
- API + worker: Cloud Run (separate api-service and worker-service, Dockerized)
- Object storage: Google Cloud Storage (GCS)

Stage B (growth):
- Keep same service boundaries
- Scale API/workers on paid plan
- Add Postgres read replica + stronger Redis tier
- Add full observability stack

Stage C (enterprise):
- API/workers on ECS/Fargate or equivalent
- Queue on SQS (or managed equivalent)
- HA Redis + Postgres with PITR/read replicas
- Formal incident management and DR objectives

## 5) Priorities (P0 / P1 / P2)

P0 (must do first):
1. Durable job model and async processing
2. Typed API contract and frontend-backend compatibility
3. Worker extraction from API process
4. Reliability controls: retries, idempotency, DLQ-style handling

P1 (next):
1. Frontend performance refactor (analysis page decomposition)
2. Progress streaming hardening (reconnect/replay/consistency)
3. Full observability stack (logs/metrics/traces)
4. Cost and abuse protection (rate limits, budgets, spend caps)

P2 (after stability):
1. Targeted Rust optimization for proven hotspots
2. Multi-region read scaling strategy
3. Compliance hardening (enterprise controls, advanced audit trails)

## 6) Implementation Roadmap (12 Weeks)

## Phase 1 (Week 1-2): Foundation Spec and Contracts
Deliverables:
- Architecture Decision Records (ADRs)
- Job lifecycle state machine (`queued`, `running`, `retrying`, `failed`, `completed`, `cancelled`)
- Canonical API contract package

Tasks:
1. Freeze bounded contexts:
   - `web` (UI)
   - `api` (auth + validation + orchestration endpoint)
   - `worker` (BTR compute)
   - `contracts` (shared schemas + generated client)
2. Define request/response schemas with strict Zod types
3. Create error taxonomy mapping and stable error codes
4. Define SLOs and SLIs

Acceptance criteria:
- Every public endpoint has contract tests
- Frontend uses generated/typed client (no `any` in API surface)
- Lifecycle transitions are explicit and validated

## Phase 2 (Week 3-4): Durable Queue and Persistent Job State
Deliverables:
- Jobs table schema and migration
- Queue adapter interface with Redis-backed implementation
- Job event persistence and replay support

Tasks:
1. Add core tables:
   - `jobs`
   - `job_attempts`
   - `job_events`
   - `artifacts`
   - `idempotency_keys`
2. Implement enqueue API returning fast `jobId`
3. Worker consumes queue and writes stage checkpoints
4. Add retry policy with backoff + max attempts
5. Add dead-letter handling path

Acceptance criteria:
- API returns in <2s under nominal load
- Restarting services does not lose jobs
- Duplicate submissions resolve safely via idempotency

## Phase 3 (Week 5-6): Worker Extraction and Reliability
Deliverables:
- Separate deployable worker service
- Stage-level checkpoint/restart logic
- Cancellation and timeout controls

Tasks:
1. Move heavy BTR execution from API request path to worker
2. Add stage checkpoints to resume from failure point
3. Add cancellation tokens and hard timeouts by stage
4. Add poison-job protection (retry ceiling + dead-letter)

Acceptance criteria:
- Worker crash does not corrupt session state
- Cancelled jobs stop cleanly and remain auditable
- Failed stages can be retried deterministically

## Phase 4 (Week 7-8): Frontend Compatibility and UX Stability
Deliverables:
- Refactored analysis page modules
- Robust progress stream client
- Unified API response handling

Tasks:
1. Split large analysis client page into focused modules
2. Implement resilient SSE/poll fallback:
   - reconnect with backoff
   - replay from last event cursor
3. Normalize frontend error surfaces and loading states
4. Add performance budgets and route-level monitoring

Acceptance criteria:
- No contract mismatch errors in core user journeys
- Stream reconnection works across network interruptions
- Time-to-interactive and interaction latency improve measurably

## Phase 5 (Week 9-10): Performance, Autoscaling, and Cost Guardrails
Deliverables:
- Load test suite
- Autoscaling policy
- Cost and rate-limit controls

Tasks:
1. Define synthetic load profiles (burst + sustained)
2. Tune worker concurrency by queue depth and memory pressure
3. Add cost alarms and spend controls
4. Add abusive traffic controls (IP + user + endpoint)

Acceptance criteria:
- 2x expected peak load passes without job loss
- Queue wait stays within SLO bounds
- Spend alerts trigger before bill shock events

## Phase 6 (Week 11-12): Production Hardening
Deliverables:
- Incident runbooks
- DR/backup restore proof
- Release strategy with rollback controls

Tasks:
1. Build on-call dashboards and alert routing
2. Run game-day drills:
   - queue outage simulation
   - DB failover/restore simulation
3. Introduce canary deployments
4. Finalize security review and data retention policies

Acceptance criteria:
- Restore drill completed successfully
- Canary rollback verified
- Critical alerts mapped to actionable runbooks

## 7) Detailed Agent Execution Guide

Use this sequence for implementation agents:

1. **Read first**
   - `AGENTS.md`
   - `ARCHITECTURE.md`
   - `docs/ARCHITECTURE_ANALYSIS_Frontend_Backend_Database.md`

2. **Create migration branch**
   - `feat/durable-queue-phase1`

3. **Implement in thin vertical slices**
   - Slice 1: enqueue endpoint + job table
   - Slice 2: worker consume + one BTR stage
   - Slice 3: progress event persistence + frontend read
   - Slice 4: retries/idempotency/cancellation

4. **After each slice**
   - run typecheck/lint/tests
   - run load smoke script
   - update docs + runbook notes

5. **Definition of Done for each PR**
   - Contract test added
   - Failure path tested
   - Metrics/logs added
   - No sensitive data in logs

## 8) Data Model Baseline (Minimum)

Required columns per entity:

- `jobs`
  - `id`, `session_id`, `user_id`, `status`, `priority`, `attempt`, `max_attempts`, `queued_at`, `started_at`, `finished_at`, `error_code`, `error_message`
- `job_events`
  - `id`, `job_id`, `event_type`, `stage`, `payload_json`, `created_at`, `sequence_no`
- `job_attempts`
  - `id`, `job_id`, `attempt_no`, `started_at`, `ended_at`, `outcome`, `failure_reason`
- `idempotency_keys`
  - `id`, `key`, `user_id`, `request_hash`, `job_id`, `created_at`, `expires_at`
- `artifacts`
  - `id`, `job_id`, `kind`, `uri`, `checksum`, `size_bytes`, `created_at`

## 9) SLOs, Alerts, and Operational KPIs

Initial SLO targets:
- API submit p95: < 500ms
- Job enqueue success: > 99.9%
- Analysis completion success: > 99%
- Job loss: 0 tolerated
- Progress stream session drop (unrecovered): < 1%

Key alerts:
- Queue depth growth without drain for > N minutes
- Retry storm on a stage
- Worker OOM or repeated restarts
- DB connection saturation
- Error budget burn rate breach

## 10) Security and Compliance Controls

Must-have controls:
- Encryption at rest + in transit
- Secret management (no plaintext secrets in repo)
- PII redaction in logs
- Audit trail for sensitive actions
- Backup + retention + restoration policy
- RBAC for admin and ops actions

## 11) Cost Control Rules (Free-First Safety)

Apply from day 1:
1. Enforce request and token budgets per user/session
2. Enable spend caps / budget alerts wherever supported
3. Set autoscaling ceilings (not only floors)
4. Enable idle scale-to-zero for non-critical environments
5. Track per-feature cost attribution

## 12) Rust Adoption Gate (Strict)

Rust implementation is allowed only if all are true:
1. Profiling confirms CPU hotspot in specific module
2. Current TypeScript optimization failed to meet SLO
3. Stable FFI or service boundary is defined
4. Benchmarks show material gain (>30% in target metric)

Recommended Rust target:
- Isolated compute-heavy scoring/ephemeris modules in worker path

Not recommended in phase 1:
- Full API rewrite
- Frontend rewrite
- Auth/orchestration rewrite

## 13) Risk Register

Top risks and mitigations:
- Risk: Queue inconsistency during migration
  - Mitigation: dual-write transition + replay validation
- Risk: Contract drift
  - Mitigation: schema-driven SDK + CI contract tests
- Risk: Cost spikes from retries/AI calls
  - Mitigation: per-job budget + retry caps + throttling
- Risk: Stream instability
  - Mitigation: event persistence + cursor replay

## 14) Internet + Social Research Summary (Used for Stack Decisions)

Method:
- Prioritized official docs for factual limits/pricing/policies
- Used community discussions (Reddit/HN) as sentiment signals only
- Treated social feedback as anecdotal unless matched by official incident/pricing docs

Key findings as of 2026-03-11:
1. Vercel remains strong for Next.js frontend delivery, but heavy long-running compute should be offloaded to dedicated workers.
2. HF Spaces is useful for demos/ML workflows, but API + durable workers are generally better hosted on general PaaS/containers for production control.
3. Clerk provides fastest auth velocity; alternatives split into enterprise-IAM-first (Auth0), platform-unified (Supabase Auth), and self-host-control-first (Better Auth).
4. Turso alternatives based on Postgres (Neon/Supabase/RDS) provide stronger fit for transactional job orchestration and enterprise growth patterns.
5. Community sentiment on alternative PaaS options is mixed; portability and resilience patterns are mandatory regardless of provider.

## 15) Sources

Official docs:
- Vercel pricing: https://vercel.com/pricing
- Vercel limits: https://vercel.com/docs/limits
- Vercel function limits: https://vercel.com/docs/functions/limitations/
- Vercel fair use: https://vercel.com/docs/limits/fair-use-guidelines
- Vercel hobby plan details: https://vercel.com/docs/accounts/plans/hobby
- Cloudflare Workers pricing: https://developers.cloudflare.com/workers/platform/pricing/
- Cloudflare Pages pricing: https://developers.cloudflare.com/pages/platform/pricing/
- Netlify pricing: https://www.netlify.com/pricing/
- Neon pricing: https://neon.com/pricing
- Turso pricing: https://turso.tech/pricing
- Upstash pricing docs: https://upstash.com/docs/redis/overall/pricing
- Railway pricing: https://railway.com/pricing
- Render free docs: https://render.com/docs/free
- Fly.io pricing: https://fly.io/docs/about/pricing/
- Hugging Face Spaces overview: https://huggingface.co/docs/hub/en/spaces-overview
- Hugging Face Spaces pricing: https://huggingface.co/pricing
- Modal pricing: https://modal.com/pricing
- Runpod pricing: https://www.runpod.io/pricing
- Supabase billing overview: https://supabase.com/docs/guides/platform/billing-on-supabase
- Supabase spend cap: https://supabase.com/docs/guides/platform/spend-cap
- Supabase storage pricing: https://supabase.com/docs/guides/storage/pricing
- Clerk pricing: https://clerk.com/pricing
- Supabase pricing: https://supabase.com/pricing
- Supabase Auth pricing context: https://supabase.com/docs/guides/auth
- Auth0 pricing: https://auth0.com/pricing
- Better Auth docs: https://www.better-auth.com/docs/introduction
- Firebase Authentication pricing: https://firebase.google.com/pricing
- RDS PostgreSQL pricing: https://aws.amazon.com/rds/postgresql/pricing/

Incident/community references (sentiment inputs):
- Railway incident (Feb 2026): https://blog.railway.com/p/incident-report-february-19-2026
- Reddit (Railway production opinions): https://www.reddit.com/r/devops/comments/1qq9d14/opinions_on_railway_the_paas/
- Reddit (Vercel hobby limit confusion): https://www.reddit.com/r/vercel/comments/1qvkyy5/confusing_hobby_plan_limits_dashboard_says_1m_but/
- Reddit (Vercel billing/duration concerns): https://www.reddit.com/r/vercel/comments/1pgjvkt/massive_slowdown_4_billing_increase_starting/
- Reddit (Supabase free-tier usage concerns): https://www.reddit.com/r/nextjs/comments/1i96fy3/high_egress_usage_on_supabase_free_plan_seeking/
- Hacker News (Fly.io reliability discussion): https://news.ycombinator.com/item?id=36808296
- Hacker News (Fly.io outage sentiment): https://news.ycombinator.com/item?id=34742946

## 16) Immediate Next Step

Start with **Phase 1 / Slice 1**:
- create `jobs` + `job_events` schema
- add `POST /api/jobs` enqueue endpoint
- return `jobId` immediately
- keep existing flow behind feature flag for rollback safety

This single slice is the highest-leverage change for stability + scale.
