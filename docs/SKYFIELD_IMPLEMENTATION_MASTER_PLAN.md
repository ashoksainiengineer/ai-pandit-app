# Skyfield Implementation Master Plan

Date: March 12, 2026
Status: Planning
Owner: AI-Pandit engineering
Purpose: replace Swiss Ephemeris usage with a proprietary-safe astronomy backend while preserving Vedic astrology and BTR capabilities

## 1. Executive Summary

AI-Pandit should migrate from `swisseph-wasm` to a dedicated `Skyfield` astronomy service.

This is the right architecture for the current repo because:

- the project is still in development and can absorb heavy structural change
- the current ephemeris module is a central contract surface, not a leaf utility
- the current product needs proprietary commercial viability
- the current stack already supports service separation via API, worker, queue, and shared contracts

This is not a simple library swap.

It is a controlled backend replacement with four goals:

1. remove Swiss licensing risk
2. preserve the public ephemeris contract used by the BTR engine
3. keep Vedic-specific logic inside the product codebase
4. build a scalable architecture for industrial workloads

## 2. Current Project Overview

## 2.1 Workspace Structure

Monorepo layout:

- `apps/web`: Next.js frontend, SSE-driven live analysis UI
- `apps/api`: Express backend, current ephemeris adapter, BTR pipeline, routes
- `apps/worker`: standalone worker runtime for async job processing
- `packages/shared`: cross-service types and schemas
- `packages/db`: database access and job/session persistence
- `ephe/`: Swiss ephemeris data directory
- `docs/`: architecture, audits, migration research

## 2.2 Runtime Topology Today

Current runtime shape:

- frontend calls API
- API creates jobs and exposes progress/stream routes
- worker or inline queue processing executes the heavy BTR pipeline
- BTR pipeline calls `apps/api/src/lib/ephemeris.ts`
- ephemeris module either uses Swiss WASM or the local algorithmic fallback

## 2.3 Critical Current Dependencies

Current system behavior depends heavily on:

- `apps/api/src/lib/ephemeris.ts`
- `apps/api/src/lib/seconds-precision-btr.ts`
- `apps/api/src/lib/btr/data-package-builder.ts`
- `apps/api/src/lib/vedic-astrology-engine.ts`
- `apps/api/src/lib/advanced-btr-methods.ts`
- `apps/api/src/lib/kp-sublords.ts`
- `apps/api/src/lib/jobs/worker-runtime.ts`
- `apps/api/src/server.ts`
- `packages/shared/src/types.ts`

## 2.4 Current Ephemeris Contract

The system does not merely ask for planet positions.

It currently expects an ephemeris provider that supplies or enables:

- `initSwissEph()`
- `calculateEphemeris()`
- `calculateSunrise()`
- `calculateJulianDay()`
- `convertToUTC()`
- `getAyanamsa()`
- `isHighPrecisionMode()`
- `cleanup()`

The resulting `EphemerisData` is consumed widely by Vedic, KP, and BTR modules.

Core output fields expected downstream:

- planet sidereal longitude
- latitude
- speed
- distance
- retro flag
- dignity
- house assignment
- nakshatra and pada
- ascendant
- house cusps

## 3. Functional Requirements to Preserve

The Skyfield migration must preserve these product-level requirements.

### 3.1 Required Astronomy Outputs

- Sun through Saturn
- Moon
- Rahu and Ketu
- Julian day
- ascendant
- house cusps
- angular speed / retrograde signal
- distance where currently expected

### 3.2 Required Vedic Outputs

- Lahiri ayanamsha
- sidereal zodiac conversion
- sign
- degree within sign
- nakshatra
- pada
- house occupancy
- divisional chart compatibility
- dasha compatibility
- KP cusp support

### 3.3 Required Product Behaviors

- seconds-level BTR pipeline remains functional
- queue and worker processing remain stable
- SSE progress and frontend analysis page remain unaffected at the contract level
- health/readiness reporting remains meaningful
- async job recovery still works
- performance remains acceptable for dense grid scans

## 4. Non-Functional Requirements

### 4.1 Licensing

- no GPL/AGPL dependency in production path
- no paid Swiss commercial license
- astronomy backend must be compatible with proprietary commercial deployment

### 4.2 Scalability

- support batch ephemeris requests
- support worker autoscaling
- avoid per-candidate network chatter
- allow caching and warm kernels
- avoid coupling astronomy throughput to API request lifecycle

### 4.3 Operability

- health checks
- readiness checks
- stable startup
- deterministic ephemeris data versioning
- clear observability and failure modes

### 4.4 Validation

- numerical diffing against current Swiss outputs during migration
- BTR candidate ranking regression checks
- final-result corpus validation

## 5. Architectural Decision

## 5.1 Recommended Target Architecture

Use a dedicated internal astronomy service built in Python with Skyfield.

Target topology:

- `apps/web`: unchanged consumer of API contracts
- `apps/api`: orchestration, queue submission, stream routes, provider facade
- `apps/worker`: heavy BTR execution
- `services/ephemeris`: new Skyfield microservice
- `packages/shared`: common request and response contracts for astronomy payloads

## 5.2 Why This Architecture Is Correct

Reasons:

- Skyfield is Python-first, so forcing it into Node directly is the wrong integration point
- astronomy calculation is a backend capability, not a frontend or API concern
- queue-driven heavy workloads fit a dedicated service model
- the current repo already separates concerns across API, worker, and DB
- batching is easier to implement over a service boundary than with direct ad hoc subprocess calls

## 5.3 Explicit Decision

Do not:

- embed Python subprocess execution inside request handlers
- do per-candidate HTTP calls during dense BTR loops
- move timezone logic to multiple runtimes
- expose the astronomy service publicly

Do:

- keep timezone normalization in Node
- keep Vedic derivations in the product codebase unless there is a clear performance reason to move them
- batch astronomy requests wherever possible
- keep `apps/api/src/lib/ephemeris.ts` as the stable facade during migration

## 6. Design Principles

1. Preserve existing call sites first, improve internals second.
2. Keep Vedic astrology logic owned by AI-Pandit, not by a third-party package.
3. Treat the new astronomy service as a raw and deterministic computation engine.
4. Make batch processing the default path for BTR workloads.
5. Validate parity before removing Swiss code.
6. Prefer one-way migration with feature flags, not a big-bang rewrite.
7. Write production-grade, clean, and maintainable code for every layer of the migration.
8. Optimize for readability, performance, and scalability without shortcuts or hacks.
9. Implement all systems and subsystems to industry standards, consistent with project core values and domain requirements.

## 6.1 Implementation Quality Standard

All migration work must follow these engineering requirements:

- production-grade code only
- clear and stable naming conventions
- modular structure with explicit responsibilities
- comprehensive error handling and observable failure modes
- concise comments only where logic is genuinely non-obvious
- readable code preferred over clever code
- performance-aware design for dense BTR workloads
- scalability-aware design for worker and service expansion
- no shortcuts, no temporary hacks in the main production path

This applies to:

- the new Skyfield service
- API integration layers
- ephemeris providers
- queue and worker integration
- testing and validation harnesses
- deployment and operational tooling

## 6.2 Swiss WASM Reference Policy

The current Swiss-based implementation may be used as a reference for:

- required capabilities
- expected outputs
- API shape
- lifecycle and initialization expectations
- performance expectations
- parity test targets

It must not be used as a source for copying implementation code.

Use the current Swiss path as:

- a behavioral reference
- a contract reference
- a migration comparison baseline

Do not use it as:

- code to copy
- wrapper logic to port verbatim
- a source of derivative implementation structure where unnecessary

In practice:

- reference `apps/api/src/lib/ephemeris.ts` to understand the existing product contract
- use current Swiss-backed outputs as the parity target during validation
- re-implement Skyfield integration cleanly and independently

## 7. Proposed Service Design

## 7.1 New Service

Create:

- `services/ephemeris/`

Suggested stack:

- Python 3.11+
- FastAPI
- Uvicorn
- Skyfield
- NumPy
- Pydantic

## 7.2 Ephemeris Data Strategy

Recommended kernels:

- default: `de440s.bsp` for compact operational footprint
- optional: `de440.bsp` for broader date range if required by corpus

Use immutable versioned kernel files.

Do not download kernels at request time.

## 7.3 Service Endpoints

Minimum endpoints:

- `GET /health`
- `GET /ready`
- `POST /v1/positions`
- `POST /v1/positions/batch`
- `POST /v1/ascendant-house-batch`
- `POST /v1/sunrise`

Optional later:

- `POST /v1/full-chart-batch`

## 7.4 Request Model

Node should send only normalized UTC timestamps.

Minimum request fields:

- `timestampUtc`
- `latitude`
- `longitude`
- `altitudeMeters` optional
- `ayanamsaMode` default `lahiri`
- `houseSystem` default project-selected mode
- `nodeMode` default `true`

Batch request must support arrays of timestamps for the same location as the fast path used by BTR grids.

## 7.5 Response Model

Raw astronomy response should include:

- tropical longitude
- tropical latitude
- distance
- longitude speed
- body name
- ascendant
- MC
- house cusps
- ayanamsha used
- computed node data
- Julian day / time metadata

The Node adapter will transform this into existing `EphemerisData`.

## 8. Node-Side Provider Refactor

## 8.1 Provider Abstraction

Replace Swiss-centric internals with a provider model.

New internal provider interface:

- `init()`
- `health()`
- `calculateEphemeris()`
- `calculateEphemerisBatch()`
- `calculateSunrise()`
- `getAyanamsa()`
- `cleanup()`

Provider implementations:

- `swissProvider` temporary migration support
- `skyfieldProvider` target provider
- `algorithmicProvider` fallback / test utility

## 8.2 File-Level Refactor Plan

Primary files to add or restructure:

- `apps/api/src/lib/ephemeris/`
- `apps/api/src/lib/ephemeris/index.ts`
- `apps/api/src/lib/ephemeris/provider.ts`
- `apps/api/src/lib/ephemeris/providers/swiss.ts`
- `apps/api/src/lib/ephemeris/providers/skyfield.ts`
- `apps/api/src/lib/ephemeris/providers/algorithmic.ts`
- `apps/api/src/lib/ephemeris/mappers.ts`
- `apps/api/src/lib/ephemeris/cache.ts`
- `apps/api/src/lib/ephemeris/time.ts`
- `apps/api/src/lib/ephemeris/vedic.ts`

Existing facade imports should continue to work:

- `calculateEphemeris`
- `calculateSunrise`
- `calculateJulianDay`
- `convertToUTC`
- `getAyanamsa`
- `isHighPrecisionMode`
- `cleanup`

## 8.3 Environment and Config Changes

Add config for:

- `EPHEMERIS_PROVIDER=swiss|skyfield|algorithmic`
- `EPHEMERIS_SERVICE_URL`
- `EPHEMERIS_SERVICE_TIMEOUT_MS`
- `EPHEMERIS_BATCH_SIZE`
- `EPHEMERIS_KERNEL=de440s|de440`
- `EPHEMERIS_CACHE_TTL_MS`
- `EPHEMERIS_HOUSE_SYSTEM`
- `EPHEMERIS_NODE_MODE=true|mean`

The config schema in `apps/api/src/config/index.ts` must be extended accordingly.

## 9. Vedic Domain Boundary

## 9.1 What Stays in Node/TypeScript

Keep these in the product codebase:

- Lahiri normalization policy
- sign / degree extraction
- nakshatra and pada
- dignity
- combustion
- house assignment logic
- divisional chart generation
- dasha calculations
- KP sub-lord derivations
- consensus and BTR scoring

Reason:

- this logic is product IP
- it is tightly coupled to existing domain code
- it should not be split across runtimes without a performance reason

## 9.2 What Moves to Skyfield Service

Move only astronomy primitives:

- planetary tropical positions
- latitude
- distance
- velocity
- ascendant and MC supporting math
- sunrise astronomical primitives
- batch calculation engine

## 9.3 Ayanamsa Strategy

Recommended approach:

- calculate tropical positions in the service
- apply Lahiri ayanamsha consistently in Node first

Alternative later:

- if performance requires it, move sidereal conversion into the service, but only after parity is proven

## 10. Migration Risks

## 10.1 Highest Risk Areas

1. ascendant parity
2. house cusp parity
3. Rahu / Ketu modeling
4. ayanamsha drift
5. Moon boundary sensitivity
6. sunrise behavior differences
7. seconds-level BTR ranking drift

## 10.2 Less Risky Areas

- sign extraction
- nakshatra and pada derivation
- combustion
- dignity
- Ketu as opposite node
- downstream text formatting

## 10.3 Current Legacy Complexity to Watch

The current code mixes:

- Swiss mode and algorithmic mode
- whole-sign and cusp comments
- readiness semantics tied to Swiss init naming

This means some current behavior may be inconsistent already.

Migration must explicitly decide whether to:

- preserve current behavior exactly
- or correct it and accept controlled result drift

## 11. Performance Plan

## 11.1 Why Batching Is Mandatory

The BTR pipeline repeatedly calculates ephemeris for:

- exhaustive candidates
- refinement grids
- micro-grids
- transit scans
- lifecycle scans

Per-candidate HTTP calls will become the main bottleneck.

Therefore:

- batch API is required from day one
- the worker should aggregate candidate times by location
- local cache must remain active in Node

## 11.2 Cache Strategy

Three cache layers:

1. service kernel cache
2. service request-level memoization for repeated timestamps
3. Node ephemeris result cache keyed by timestamp and location

## 11.3 Concurrency Strategy

- API remains stateless
- worker owns heavy execution
- ephemeris service is horizontally scalable
- queue concurrency is tuned independently of API concurrency

## 12. Testing and Validation Plan

## 12.1 Test Categories

Create and run these test suites:

1. contract tests
2. raw astronomy correctness tests
3. old-vs-new numerical diff tests
4. BTR ranking regression tests
5. pipeline integration tests
6. performance batch tests
7. startup/readiness tests

## 12.2 Contract Tests

Verify that the new ephemeris facade returns all expected fields in the same shape as today.

Files likely impacted:

- `apps/api/src/lib/__tests__/ground-truth.test.ts`
- `apps/api/src/lib/__tests__/industrial_precision_core.test.ts`
- `apps/api/src/lib/__tests__/edge-cases.test.ts`
- `apps/api/src/lib/btr/__tests__/whole-system-btr.test.ts`
- `apps/api/src/lib/btr/__tests__/mixed-precision-pipeline-audit.test.ts`
- `apps/api/src/lib/btr/__tests__/data-package-builder.test.ts`

## 12.3 Numerical Diff Harness

Build a dedicated comparison harness that, for a fixed corpus of timestamps and locations, compares:

- Sun longitude
- Moon longitude
- Rahu longitude
- ascendant
- house cusps
- sunrise time

Thresholds should be explicit and versioned.

## 12.4 BTR Corpus Validation

Use a representative corpus:

- modern births
- edge latitudes
- boundary times near sign / nakshatra changes
- sessions with dense life-event usage
- sessions with known sensitive rectification outputs

Validation criteria:

- no crashes
- no missing fields
- acceptable top-candidate drift
- acceptable accuracy/confidence movement

## 13. Rollout Strategy

## 13.1 Feature Flags

Feature flags required:

- `EPHEMERIS_PROVIDER`
- `EPHEMERIS_ENABLE_BATCHING`
- `EPHEMERIS_ENABLE_SWISS_DIFF_AUDIT`
- `EPHEMERIS_FAIL_ON_PROVIDER_MISMATCH`

## 13.2 Migration Phases

### Phase 0: Preparation

Deliverables:

- final architecture approval
- provider interface design
- environment/config plan
- dependency policy for Python service

Exit criteria:

- scope frozen
- service boundary frozen

### Phase 1: Facade Refactor

Deliverables:

- split `ephemeris.ts` into provider-based internals
- preserve current exports
- Swiss still operational through provider interface

Exit criteria:

- zero functional change
- all existing tests still pass

### Phase 2: Skyfield Service Skeleton

Deliverables:

- `services/ephemeris` app
- health and readiness routes
- kernel loading
- basic single-position endpoint
- Dockerfile and local dev run path

Exit criteria:

- service boots reliably
- health and readiness stable

### Phase 3: Raw Astronomy Integration

Deliverables:

- Node `skyfieldProvider`
- single ephemeris request path
- mapping into current `EphemerisData`
- temporary Swiss fallback remains

Exit criteria:

- same Node API contract works
- core tests pass with targeted fixtures

### Phase 4: Batch and Performance Layer

Deliverables:

- batch position endpoint
- worker-side aggregation
- Node cache adaptation
- timeouts and retry logic

Exit criteria:

- dense candidate scans are operational
- no obvious throughput collapse

### Phase 5: Vedic Parity Hardening

Deliverables:

- ayanamsha consistency checks
- ascendant and house validation
- node policy lock
- sunrise compatibility strategy

Exit criteria:

- domain review signs off on parity thresholds

### Phase 6: Regression and Cutover

Deliverables:

- Swiss-vs-Skyfield diff harness
- BTR corpus comparison report
- provider default changed to `skyfield`
- Swiss path disabled in standard environments

Exit criteria:

- migration report accepted
- no critical regressions

### Phase 7: Swiss Removal

Deliverables:

- remove `swisseph-wasm`
- remove `ephe/` Swiss dependency if no longer needed
- clean readiness/status naming
- update docs and health endpoints

Exit criteria:

- no Swiss dependency remains in production path

## 14. Detailed File Change Plan

## 14.1 Files That Must Change

- `apps/api/src/lib/ephemeris.ts` or replacement index facade
- `apps/api/src/config/index.ts`
- `apps/api/src/server.ts`
- `apps/api/src/lib/jobs/worker-runtime.ts`
- `apps/api/src/lib/seconds-precision-btr.ts`
- `apps/api/src/lib/btr/data-package-builder.ts`
- `apps/api/src/lib/btr/window-scanner.ts`
- `apps/api/src/lib/btr/orchestrator.ts`
- `apps/api/src/routes/health.ts`
- `apps/web/app/api/health/route.ts`
- `apps/api/package.json`
- root `package.json` if service commands are added
- deployment manifests under `deploy/`
- new service files under `services/ephemeris/`

## 14.2 Files That May Need Targeted Updates

- ephemeris-related tests
- job recovery and worker health scripts
- startup scripts
- architecture docs
- local development docs

## 14.3 Files That Should Not Need Major Functional Changes

- frontend analysis page contract consumers
- SSE store shape
- DB schema for sessions/jobs

Reason:

- the migration should preserve the API result shape consumed by those surfaces

## 15. Ops and Deployment Plan

## 15.1 Local Development

Add a local profile that runs:

- web
- api
- worker
- ephemeris service

## 15.2 Containers

Create a dedicated container for the ephemeris service with pinned dependencies and kernel files.

## 15.3 Health Model

Readiness rules:

- API ready only when DB is ready
- worker ready only when DB and ephemeris service connectivity are ready
- ephemeris service ready only when kernels are loaded

## 15.4 Observability

Log and track:

- provider selected
- kernel version
- service latency p50/p95/p99
- batch sizes
- timeout counts
- parity diff stats during migration

## 16. Acceptance Criteria

The migration is complete only when all of the following are true:

1. production path no longer depends on Swiss
2. all current ephemeris call sites still work through the stable facade
3. Vedic chart generation remains operational
4. BTR pipeline completes successfully end-to-end
5. worker throughput remains acceptable
6. health/readiness accurately reflect the new architecture
7. comparison corpus shows acceptable numerical and ranking drift
8. `swisseph-wasm` is removed from production dependencies

## 17. Final Recommendation

Proceed with a `Skyfield microservice + Node provider facade` migration.

Do not attempt:

- a direct in-process Node replacement using Skyfield
- a one-shot full rewrite
- immediate removal of the current ephemeris facade

The correct execution order is:

1. provider refactor
2. new service
3. raw integration
4. batch optimization
5. parity validation
6. cutover
7. Swiss removal

Implementation note:

- Swiss-backed behavior should be used as the migration reference baseline
- Skyfield code should be implemented clean-room style with production-grade quality standards
- all code paths must align with project core values, domain constraints, and maintainability expectations

## 18. Immediate Next Actions

The first execution sprint should produce:

1. provider interface design
2. new ephemeris service scaffolding
3. config/env additions
4. facade refactor with no behavior change
5. initial batch request schema in `packages/shared`

This establishes the migration foundation without prematurely risking BTR correctness.

## 19. Execution Backlog

This section converts the migration strategy into an execution-ready backlog.

Each phase should be completed fully before moving to the next unless an explicit dependency overlap is required.

## 19.1 Phase 1: Contract Stabilization and Provider Refactor

Objective:

- isolate the current Swiss-backed behavior behind a provider interface without changing business behavior

Primary work items:

1. Extract time and normalization utilities from the current ephemeris module.
2. Create provider interface and provider registry.
3. Move current Swiss-backed logic into `providers/swiss.ts`.
4. Move current algorithmic fallback into `providers/algorithmic.ts`.
5. Keep `apps/api/src/lib/ephemeris.ts` or replacement facade stable for existing imports.
6. Add provider-aware readiness and status helpers.
7. Add config support for provider selection.

Expected file changes:

- `apps/api/src/lib/ephemeris.ts`
- `apps/api/src/lib/ephemeris/index.ts`
- `apps/api/src/lib/ephemeris/provider.ts`
- `apps/api/src/lib/ephemeris/providers/swiss.ts`
- `apps/api/src/lib/ephemeris/providers/algorithmic.ts`
- `apps/api/src/lib/ephemeris/time.ts`
- `apps/api/src/lib/ephemeris/vedic.ts`
- `apps/api/src/config/index.ts`
- `apps/api/src/server.ts`
- `apps/api/src/lib/jobs/worker-runtime.ts`

Deliverables:

- no-change facade refactor complete
- provider selection via env/config
- existing Swiss path still works through provider abstraction

Success criteria:

- no functional regression in current behavior
- all ephemeris imports still resolve
- startup and worker boot still complete
- health endpoints expose provider state cleanly

## 19.2 Phase 2: Shared Contracts and Service Scaffolding

Objective:

- establish the new astronomy service boundary and shared payload models

Primary work items:

1. Define shared request and response contracts for ephemeris operations.
2. Create new `services/ephemeris` service skeleton.
3. Add FastAPI app structure, settings, health, and readiness endpoints.
4. Add kernel loading and startup lifecycle.
5. Add containerization and local run instructions.
6. Define internal-only authentication or network trust model for the service.

Expected file changes:

- `packages/shared/src/types.ts`
- `packages/shared/src/schemas.ts`
- `services/ephemeris/pyproject.toml` or equivalent
- `services/ephemeris/app/main.py`
- `services/ephemeris/app/config.py`
- `services/ephemeris/app/routes/health.py`
- `services/ephemeris/app/models/*.py`
- `services/ephemeris/Dockerfile`
- `services/ephemeris/README.md`

Deliverables:

- shared contracts for single and batch ephemeris requests
- bootable Skyfield service with health endpoints
- pinned dependency and kernel strategy

Success criteria:

- service boots locally
- health and readiness are deterministic
- shared contracts compile in TypeScript

## 19.3 Phase 3: Raw Skyfield Computation Layer

Objective:

- implement astronomy primitives in the Python service

Primary work items:

1. Implement UTC timestamp parsing and validation.
2. Implement planetary position calculations.
3. Implement velocity calculations.
4. Implement Julian day metadata.
5. Implement Rahu node strategy and Ketu derivation policy.
6. Implement ascendant and house cusp calculation primitives.
7. Implement batch request execution path.
8. Add service-side validation and structured error responses.

Expected file changes:

- `services/ephemeris/app/services/positions.py`
- `services/ephemeris/app/services/houses.py`
- `services/ephemeris/app/services/nodes.py`
- `services/ephemeris/app/services/sunrise.py`
- `services/ephemeris/app/routes/v1/*.py`
- `services/ephemeris/app/errors.py`

Deliverables:

- single request ephemeris endpoint
- batch request ephemeris endpoint
- house and node support in service

Success criteria:

- raw outputs are numerically stable
- batch responses preserve request order
- service errors are machine-readable

## 19.4 Phase 4: Node Skyfield Provider Integration

Objective:

- consume the new service from the existing backend through a new provider

Primary work items:

1. Implement `providers/skyfield.ts`.
2. Add HTTP client with timeout, retry, and structured failure handling.
3. Add request batching support.
4. Map raw service outputs into `EphemerisData`.
5. Preserve current cache semantics where useful.
6. Add provider-aware logging and metrics hooks.

Expected file changes:

- `apps/api/src/lib/ephemeris/providers/skyfield.ts`
- `apps/api/src/lib/ephemeris/mappers.ts`
- `apps/api/src/lib/ephemeris/cache.ts`
- `apps/api/src/lib/logger.ts` or related observability utilities
- `apps/api/src/config/index.ts`

Deliverables:

- fully working Skyfield provider behind existing facade
- no frontend contract change
- no BTR module import change

Success criteria:

- `calculateEphemeris()` works through Skyfield provider
- cached repeat calls behave correctly
- provider failures are observable and actionable

## 19.5 Phase 5: Vedic Parity Layer Hardening

Objective:

- lock domain-critical transformations and derived outputs to product expectations

Primary work items:

1. Finalize Lahiri ayanamsha strategy.
2. Normalize tropical-to-sidereal conversion path.
3. Validate sign, degree, nakshatra, and pada derivations.
4. Validate ascendant and house assignment behavior.
5. Reconcile sunrise behavior with current pipeline expectations.
6. Validate KP and divisional-chart dependencies that rely on cusp and longitude stability.

Expected file changes:

- `apps/api/src/lib/ephemeris/vedic.ts`
- `apps/api/src/lib/vedic-astrology-engine.ts`
- `apps/api/src/lib/advanced-btr-methods.ts`
- `apps/api/src/lib/kp-sublords.ts`
- `apps/api/src/lib/btr/data-package-builder.ts`

Deliverables:

- stable sidereal transformation path
- documented house and node policy
- validated domain derivation consistency

Success criteria:

- downstream Vedic modules run unchanged
- no missing derived fields
- boundary-case outputs are within approved thresholds

## 19.6 Phase 6: BTR Batch Optimization

Objective:

- ensure industrial-grade performance for dense candidate workloads

Primary work items:

1. Add worker-side batch aggregation for candidate scans.
2. Route stage workloads through batch ephemeris paths.
3. Reduce redundant calls in lifecycle and transit scans.
4. Tune cache keys and request grouping.
5. Add instrumentation for latency and batch size analysis.

Expected file changes:

- `apps/api/src/lib/seconds-precision-btr.ts`
- `apps/api/src/lib/btr/stages/*.ts`
- `apps/api/src/lib/btr/data-package-builder.ts`
- `apps/api/src/lib/btr/window-scanner.ts`
- `apps/api/src/lib/btr/transit-builder.ts`
- `apps/api/src/lib/btr/transit-analyzer.ts`

Deliverables:

- batch-first ephemeris consumption in heavy paths
- reduced network round-trips
- measurable latency improvements

Success criteria:

- dense scans complete within acceptable time budgets
- no correctness loss from batching
- worker throughput remains stable

## 19.7 Phase 7: Regression Harness and Validation Corpus

Objective:

- prove correctness before cutting over production defaults

Primary work items:

1. Build Swiss-vs-Skyfield numerical diff harness.
2. Build representative validation corpus.
3. Add tests for boundary timestamps and latitudes.
4. Add BTR ranking comparison reports.
5. Capture acceptable drift thresholds explicitly in docs.

Expected file changes:

- `apps/api/src/lib/__tests__/ground-truth.test.ts`
- `apps/api/src/lib/__tests__/edge-cases.test.ts`
- `apps/api/src/lib/btr/__tests__/whole-system-btr.test.ts`
- `apps/api/src/lib/btr/__tests__/mixed-precision-pipeline-audit.test.ts`
- `apps/api/src/scripts/*skyfield*`
- `docs/` validation report artifacts

Deliverables:

- regression suite
- comparison scripts
- validation report

Success criteria:

- no critical mismatches
- no catastrophic BTR ranking regressions
- migration risk quantified, not guessed

## 19.8 Phase 8: Cutover and Swiss Removal

Objective:

- make Skyfield the default provider and remove Swiss from the production path

Primary work items:

1. Switch default provider to `skyfield`.
2. Remove Swiss init naming from readiness paths.
3. Remove `swisseph-wasm` dependency.
4. Remove Swiss-specific data/config where no longer needed.
5. Update health responses, docs, and deployment configs.
6. Keep algorithmic fallback only if still strategically useful.

Expected file changes:

- `apps/api/package.json`
- `package-lock.json`
- `apps/api/src/server.ts`
- `apps/api/src/lib/jobs/worker-runtime.ts`
- `apps/web/app/api/health/route.ts`
- deployment manifests
- migration docs

Deliverables:

- Skyfield default in all non-legacy environments
- Swiss removed from production dependency tree

Success criteria:

- no Swiss dependency in normal runtime
- health and startup flows reflect new architecture
- docs match implementation

## 19.9 Cross-Cutting Quality Checklist

Every phase must satisfy the following:

- types are explicit and stable
- public contracts are versioned or intentionally preserved
- errors are structured and contextual
- logs are structured and redact sensitive fields
- test coverage is added with each critical change
- naming is consistent across Node and Python layers
- no dead compatibility code is left behind after cutover

## 19.10 Execution Order Summary

Recommended execution sequence:

1. Phase 1
2. Phase 2
3. Phase 3
4. Phase 4
5. Phase 5
6. Phase 6
7. Phase 7
8. Phase 8

Hard rule:

- do not remove Swiss before Phase 7 validation is accepted
