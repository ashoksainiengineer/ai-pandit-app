# AI-Pandit Cloud Run Complete Architecture Blueprint

Last updated: 2026-03-11 (Asia/Kolkata)  
Status: Target Architecture (Implementation Guide)

## Implementation Progress Snapshot (Updated)

Status date: 2026-03-11

- Project: `ai-pandit-489913`
- Region: `asia-southeast1`
- API service live: `https://api-service-7tjuxigfoq-as.a.run.app`
- Worker service live: `https://worker-service-624056173858.asia-southeast1.run.app`
- Artifact Registry repo: `ai-pandit`
- Data/queue infra provisioned: Neon Postgres + Upstash Redis
- Secret storage provisioned: Google Secret Manager
- Current state: Infra bootstrap complete, code migration to async job pipeline pending

## 1. Objective

Build a production-grade BTR platform that can start low-cost and scale to high concurrency without full rewrites.

Core requirements covered:
- Hours-long BTR analysis (multiple hours possible)
- AI reasoning chunk streaming
- Swiss Ephemeris heavy compute
- Durable queueing and retry safety
- Strong frontend UX and compatibility

## 2. Final Stack Choices (Recommended)

## 2.1 Primary Stack

- Frontend: `Next.js` standalone on `Cloud Run`
- Auth: `Clerk`
- API service: `Node.js + TypeScript + Express/Fastify` on `Cloud Run`
- Worker service: `Node.js + TypeScript` on `Cloud Run` (or Cloud Run Jobs for very long runs)
- Queue + cache + progress bus: `Redis` (`Upstash` initially)
- Database: `Neon Postgres` (start), migration path to `Cloud SQL Postgres` (scale/compliance)
- Object storage/artifacts: `Google Cloud Storage`
- Observability: `OpenTelemetry + Cloud Logging + Cloud Monitoring`
- Secrets: `Google Secret Manager`
- CI/CD: `GitHub Actions` + `gcloud run deploy`

## 2.2 Why This Stack

- Best startup velocity with low fixed cost
- Clean separation between fast API and heavy worker compute
- Easy horizontal autoscaling at service level
- Minimal rewrite path when moving from startup traffic to enterprise traffic

## 3. Service Split (Must-Have)

## 3.1 `api-service` (Cloud Run)

Responsibilities:
- Auth verification
- Input validation
- Enqueue job and return `jobId` quickly
- Job status endpoints
- SSE/WebSocket relay for progress

Suggested runtime profile:
- CPU: small/medium
- Memory: small/medium
- Concurrency: high (40-80 starting point)
- Timeout: short/moderate (never tie full analysis lifecycle to one request)

## 3.2 `worker-service` (Cloud Run)

Responsibilities:
- Consume queued jobs
- Run BTR stages and Swiss calculations
- Call AI provider and emit reasoning chunks
- Persist stage checkpoints + final results

Suggested runtime profile:
- CPU: medium/high
- Memory: medium/high
- Concurrency: low (1-2)
- Timeout: high for service invocations, but any unit that can exceed service limits must run as chunked stages or Cloud Run Jobs

## 3.3 Optional `stream-service` (Cloud Run)

Add only when stream fanout volume grows.

Responsibilities:
- Subscribe to progress events
- Handle high concurrent stream clients
- Keep API service lightweight

## 3.4 Long-Running Analysis Pattern (Critical)

Hours-long analysis must be implemented as an async state machine, not one long HTTP request.
Reason: Cloud Run services have request-time limits, so multi-hour end-to-end runs must be split into resumable async work units.

Design rules:
1. Submit API returns immediately with `jobId` and `sessionId`.
2. Worker executes in resumable chunks (stage/batch units), each with checkpoint commit.
3. After each chunk, worker re-enqueues next chunk/state transition.
4. Client progress stream is based on persisted `job_events`, not direct in-process memory.
5. If a single compute unit can exceed Cloud Run service timeout ceilings, run that unit via Cloud Run Jobs and poll task status.

Execution modes:
- Mode A (default): Cloud Run Service worker + small chunk units (recommended).
- Mode B (fallback for very long single units): Cloud Run Jobs task execution with checkpointed resume.

Non-negotiable safeguards:
- Checkpoint at every major stage boundary
- Idempotent chunk handlers
- Attempt counters + backoff + dead-letter
- Heartbeat updates for stuck-job detection
- Hard cancel support at chunk boundaries

## 4. Data and Queue Architecture

## 4.1 Database Tables (Minimum)

- `sessions`
- `jobs`
- `job_attempts`
- `job_events`
- `artifacts`
- `idempotency_keys`
- `audit_logs`

## 4.2 Queue Flow

1. Client submits analysis request.
2. API validates and writes `session + job`.
3. API enqueues `jobId` in Redis queue.
4. Worker consumes one chunk/state transition and executes it.
5. Worker writes progress + checkpoint to `job_events` and job state.
6. Worker re-enqueues next chunk until terminal state.
7. API/stream service relays persisted events to client (with reconnect cursor support).
8. Final result persisted in DB/storage.

## 4.3 Reliability Rules

- Idempotency key on submit endpoint
- Retries with exponential backoff
- Dead-letter bucket for poison jobs
- Cancellation token support
- Stage checkpoints for resume-on-failure
- Heartbeat + lease timeout to recover abandoned chunks
- Event sequence numbers for exactly-ordered client replay

## 5. API Contract Strategy

- Use shared schema package as single source of truth.
- All public request/response payloads must be typed.
- Ban `any` on API boundaries.
- Contract tests in CI on every PR.

## 6. Cost and Concurrency Model

## 6.1 Practical Concurrency Interpretation

Two different capacities exist:
- Concurrent web users: mostly `api-service` + frontend scaling
- Concurrent active analyses: mostly `worker-service` instance count and chunk runtime

Approx formula:
- Parallel analyses ~= `worker max instances * worker concurrency`
- Throughput (jobs/hour) ~= `parallel analyses * (60 / avg effective hours-per-job)`

Example:
- `max instances=20`, `worker concurrency=1` => ~20 parallel analyses
- If avg job duration is 3 hours, throughput ~6.7 jobs/hour at this capacity.

## 6.2 Cost Drivers

Largest monthly cost contributors:
1. Worker CPU/RAM runtime
2. AI provider calls
3. Database always-on/compute/storage
4. Network egress and logs

Early cost optimization:
- Keep worker concurrency low, scale via instances
- Use queue-based backpressure
- Set per-user and per-job AI budget caps
- Apply cost alerts and hard spend thresholds
- Keep chunk duration bounded; faster checkpoints reduce expensive rework on failures

## 7. Alternatives Analysis (Long-Term)

## 7.1 Alternative to HF Spaces (for backend compute)

1. Cloud Run (recommended)
- Pros:
  - Strong autoscaling
  - Good serverless economics for variable load
  - Fits API + worker split cleanly
- Cons:
  - Needs careful service config tuning

2. Render
- Pros:
  - Simpler PaaS operations
  - Good for teams with low infra bandwidth
- Cons:
  - Scaling/cost tuning less granular than Cloud Run

3. Railway
- Pros:
  - Very fast to ship
  - Great early-stage productivity
- Cons:
  - Reliability/cost discipline needed as traffic grows

4. ECS/Fargate (enterprise end-state)
- Pros:
  - Highest control and predictable enterprise operations
- Cons:
  - Higher ops complexity and overhead

5. Modal (compute add-on)
- Pros:
  - Great burst compute economics
- Cons:
  - Better as worker lane, not whole backend platform

## 7.2 Database Alternatives

1. Neon Postgres (recommended start)
- Pros:
  - Serverless Postgres
  - Good startup velocity
  - Autoscaling and scale controls
- Cons:
  - Cross-cloud networking considerations with Cloud Run

2. Cloud SQL Postgres (recommended scale/compliance move)
- Pros:
  - Best GCP integration
  - Strong enterprise controls
- Cons:
  - Higher baseline cost

3. Supabase Postgres
- Pros:
  - Strong developer platform
- Cons:
  - Greater platform coupling risk if many managed features used

## 7.3 Auth Alternatives

1. Clerk (recommended now)
- Pros:
  - Fast integration and good DX
- Cons:
  - Pricing sensitivity at high MAU

2. Auth0 (enterprise IAM path)
- Pros:
  - Strong B2B/enterprise capability
- Cons:
  - Can become expensive quickly

3. Supabase Auth / self-hosted auth
- Pros:
  - More control
- Cons:
  - More operational burden

## 8. Deployment Topology

```text
User -> Web Cloud Run service (Next.js)
     -> API Cloud Run service
         -> Neon Postgres (sessions/jobs/events)
         -> Redis queue (Upstash)
         -> GCS (artifacts/reports)
     -> Worker Cloud Run service
         -> Swiss/BTR compute
         -> AI provider
         -> DB + Redis event updates
     -> (Optional) Stream Cloud Run service
         -> SSE/WebSocket fanout
```

## 9. Security and Compliance Baseline

- Use `Secret Manager` for runtime secrets
- Encrypt sensitive birth data at application and storage levels
- Never log decrypted personal data
- Enforce structured audit logs for access and job actions
- Apply rate limiting and abuse detection

## 10. SLOs (Initial)

- Submit API p95 < 500ms
- Enqueue success > 99.9%
- Completed analyses success > 99%
- Job loss = 0
- Stream reconnect success > 99%

## 11. 30-Day Execution Plan

Week 1:
- Create `api-service` and `worker-service` boundaries in repo
- Add durable `jobs` and `job_events` schema
- Add enqueue endpoint returning immediate `jobId`

Week 2:
- Move one BTR stage into worker pipeline
- Add progress events persistence and streaming
- Add retry + idempotency + cancellation primitives
- Add chunk checkpointing and heartbeat mechanism

Week 3:
- Move remaining heavy stages to worker
- Add load tests and queue-depth autoscaling policy
- Add dashboards and alerts
- Validate multi-hour analysis recovery after forced worker restarts

Week 4:
- Stabilize failure paths and run recovery drills
- Finalize production runbooks and rollout checklist

## 12. Go/No-Go Checklist

Go live only if all are true:
- No in-memory-only queue dependency for core processing
- Worker restart does not lose or corrupt jobs
- Contract tests pass across web/api/worker
- Cost alerts and rate limits are active
- Security logging and PII redaction verified
- Multi-hour job survives restart/failure and resumes from last checkpoint

## 13. Future Rust Strategy

Use Rust only for proven hotspots:
- Profile first
- Isolate compute module boundary
- Replace only CPU-critical path
- Keep API/orchestration in TypeScript for delivery speed

## 14. References (Official + Community)

Official:
- Cloud Run pricing: https://cloud.google.com/run/pricing
- Cloud Run quotas and limits: https://docs.cloud.google.com/run/quotas
- Cloud Run concurrency: https://docs.cloud.google.com/run/docs/about-concurrency
- Cloud Run max instances: https://cloud.google.com/run/docs/configuring/max-instances-limits
- Cloud Run task timeout: https://docs.cloud.google.com/run/docs/configuring/task-timeout
- Cloud Run WebSockets: https://docs.cloud.google.com/run/docs/triggering/websockets
- Cloud Run AI agents/streaming references: https://docs.cloud.google.com/run/docs/ai-agents
- Neon pricing: https://neon.com/pricing
- Neon autoscaling background: https://neon.com/blog/neon-autoscaling-is-generally-available
- Upstash pricing: https://upstash.com/pricing
- Upstash pricing docs: https://upstash.com/docs/redis/overall/pricing
- Clerk pricing: https://clerk.com/pricing
- Cloud SQL pricing: https://cloud.google.com/sql/pricing
- Cloud SQL from Cloud Run: https://cloud.google.com/sql/docs/postgres/connect-run

Community sentiment inputs:
- Railway incident report (official): https://blog.railway.com/p/incident-report-february-19-2026
- Railway PaaS opinions: https://www.reddit.com/r/devops/comments/1qq9d14/opinions_on_railway_the_paas/
- Fly.io reliability discussion: https://news.ycombinator.com/item?id=36808296
- Cloud Run SSE discussion: https://www.reddit.com/r/googlecloud/comments/1llt2io
