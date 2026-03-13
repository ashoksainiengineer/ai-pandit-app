# Complete File Inventory - AI-Pandit Project

**Generated:** 2026-03-13  
**Total Files:** ~600+ files  
**Project Type:** Monorepo (Turborepo)

---

## Table of Contents

1. [Root Configuration](#1-root-configuration)
2. [Apps - Web Frontend](#2-apps---web-frontend)
3. [Apps - API Backend](#3-apps---api-backend)
4. [Apps - Worker](#4-apps---worker)
5. [Packages - Database](#5-packages---database)
6. [Packages - Shared](#6-packages---shared)
7. [Services - Ephemeris](#7-services---ephemeris)
8. [E2E Tests](#8-e2e-tests)
9. [Scripts](#9-scripts)
10. [Documentation](#10-documentation)
11. [Deployment](#11-deployment)
12. [Data & Ephemeris](#12-data--ephemeris)

---

## 1. Root Configuration

| File | Purpose |
|------|---------|
| `package.json` | Root monorepo configuration, workspaces definition |
| `package-lock.json` | Dependency lock file |
| `turbo.json` | Turborepo pipeline configuration |
| `.gitignore` | Git ignore patterns |
| `.dockerignore` | Docker ignore patterns |
| `.vercelignore` | Vercel ignore patterns |
| `.env.example` | Environment variables template |
| `.env.local.example` | Local environment template |
| `playwright.config.ts` | E2E test configuration |
| `AGENTS.md` | AI Agent operating manual |
| `LICENSE` | Project license |
| `.cursorrules` | Cursor IDE rules |
| `a11y-report.json` | Accessibility audit report |

### GitHub CI/CD
| File | Purpose |
|------|---------|
| `.github/workflows/ci-quality.yml` | CI quality gates |

---

## 2. Apps - Web Frontend

**Location:** `apps/web/`  
**Framework:** Next.js 15  
**Language:** TypeScript  

### 2.1 Configuration Files

| File | Purpose |
|------|---------|
| `package.json` | Frontend dependencies |
| `tsconfig.json` | TypeScript configuration |
| `next.config.js` | Next.js configuration |
| `tailwind.config.js` | Tailwind CSS configuration |
| `postcss.config.js` | PostCSS configuration |
| `vitest.config.ts` | Unit test configuration |
| `vitest.setup.ts` | Test setup |
| `middleware.ts` | Next.js middleware |
| `.eslintrc.json` | ESLint configuration |
| `.gitignore` | Git ignore patterns |
| `next-env.d.ts` | Next.js type declarations |
| `vercel.json` | Vercel deployment config |

### 2.2 App Router (Next.js 13+ Pattern)

| File | Purpose |
|------|---------|
| `app/layout.tsx` | Root layout |
| `app/page.tsx` | Landing page |
| `app/globals.css` | Global styles |
| `app/ai-content.css` | AI-specific styles |
| `app/error.tsx` | Error boundary |
| `app/global-error.tsx` | Global error handler |
| `app/not-found.tsx` | 404 page |

#### 2.2.1 Admin Routes
| File | Purpose |
|------|---------|
| `app/admin/dashboard/page.tsx` | Admin dashboard |

#### 2.2.2 Dashboard Routes
| File | Purpose |
|------|---------|
| `app/dashboard/page.tsx` | User dashboard |
| `app/dashboard/DashboardClient.tsx` | Dashboard client component |
| `app/dashboard/DashboardClient.test.tsx` | Dashboard tests |

#### 2.2.3 Rectify (BTR) Routes
| File | Purpose |
|------|---------|
| `app/rectify/page.tsx` | Birth rectification form |
| `app/rectify/[id]/page.tsx` | Session detail page |
| `app/rectify/[id]/actions.ts` | Server actions |
| `app/rectify/[id]/edit/page.tsx` | Edit session |
| `app/rectify/[id]/edit/EditSessionClient.tsx` | Edit client component |
| `app/rectify/[id]/results/page.tsx` | Results page |
| `app/rectify/[id]/results/ResultsDashboardClient.tsx` | Results dashboard |

#### 2.2.4 Static Pages
| File | Purpose |
|------|---------|
| `app/privacy/page.tsx` | Privacy policy |
| `app/terms/page.tsx` | Terms of service |
| `app/test-auth/page.tsx` | Auth testing page |

#### 2.2.5 Auth Routes
| File | Purpose |
|------|---------|
| `app/sign-in/[[...rest]]/page.tsx` | Sign in page |
| `app/sign-up/[[...rest]]/page.tsx` | Sign up page |

#### 2.2.6 Debug Routes
| File | Purpose |
|------|---------|
| `app/debug-analysis/[id]/page.tsx` | Debug analysis view |

#### 2.2.7 API Routes (Frontend Proxy)
| File | Purpose |
|------|---------|
| `app/api/analysis/cancel/route.ts` | Cancel analysis |
| `app/api/analysis/progress/route.ts` | Get progress |
| `app/api/analysis/queue/route.ts` | Queue analysis |
| `app/api/analysis/requeue/route.ts` | Requeue analysis |
| `app/api/drafts/route.ts` | Draft sessions |
| `app/api/health/route.ts` | Health check |
| `app/api/log-client/route.ts` | Client logging |
| `app/api/ping/route.ts` | Ping endpoint |
| `app/api/sessions/route.ts` | Sessions CRUD |
| `app/api/sessions/[id]/route.ts` | Session detail |
| `app/api/sessions/[id]/clone/route.ts` | Clone session |
| `app/api/sessions/[id]/favorite/route.ts` | Favorite toggle |
| `app/api/sessions/batch/route.ts` | Batch operations |
| `app/api/sessions/export/route.ts` | Export sessions |
| `app/api/webhooks/clerk/route.ts` | Clerk webhook |

#### 2.2.8 App Components
| File | Purpose |
|------|---------|
| `app/components/dashboard/ChartCard.tsx` | Chart card component |
| `app/components/dashboard/DashboardLayout.tsx` | Dashboard layout |
| `app/components/dashboard/Modal.tsx` | Modal component |
| `app/components/dashboard/RecentReadingsTable.tsx` | Readings table |
| `app/components/dashboard/StatsCard.tsx` | Stats display |
| `app/components/dashboard/charts/ReadingsChart.tsx` | Chart visualization |

#### 2.2.9 Types
| File | Purpose |
|------|---------|
| `app/types/dashboard.ts` | Dashboard types |

### 2.3 Components

#### 2.3.1 Layout Components
| File | Purpose |
|------|---------|
| `components/FibonacciSpiral.tsx` | Fibonacci animation |
| `components/Footer.tsx` | Site footer |
| `components/Layout.tsx` | Page layout |
| `components/Navbar.tsx` | Navigation bar |

#### 2.3.2 Dashboard Components
| File | Purpose |
|------|---------|
| `components/dashboard/ActivityHeatmap.tsx` | Activity visualization |
| `components/dashboard/BatchActionsToolbar.tsx` | Batch actions |
| `components/dashboard/DeleteConfirmModal.tsx` | Delete confirmation |
| `components/dashboard/index.ts` | Dashboard exports |
| `components/dashboard/InsightsPanel.tsx` | Insights display |
| `components/dashboard/Pagination.tsx` | Pagination |
| `components/dashboard/SearchFilterBar.tsx` | Search/filter |
| `components/dashboard/SessionCard.test.tsx` | Session card tests |
| `components/dashboard/SessionCard.tsx` | Session card |
| `components/dashboard/StatCard.tsx` | Stat display |
| `components/dashboard/ViewToggle.tsx` | View toggle |

#### 2.3.3 Event Components
| File | Purpose |
|------|---------|
| `components/events/CustomEventModal.tsx` | Custom event modal |
| `components/events/DateInput.tsx` | Date input |
| `components/events/EventEditor.tsx` | Event editor |
| `components/events/EventSelector.tsx` | Event selector |
| `components/events/index.ts` | Event exports |

#### 2.3.4 Landing Page Components
| File | Purpose |
|------|---------|
| `components/landing/AccuracyShowcase.tsx` | Accuracy display |
| `components/landing/AIThinkingBox.tsx` | AI thinking animation |
| `components/landing/CandidateComparisonTable.tsx` | Candidate comparison |
| `components/landing/EphemerisTable.tsx` | Ephemeris display |
| `components/landing/FAQ.tsx` | FAQ section |
| `components/landing/FinalCTA.tsx` | Call to action |
| `components/landing/Footer.tsx` | Landing footer |
| `components/landing/Hero.tsx` | Hero section |
| `components/landing/Navbar.tsx` | Landing nav |
| `components/landing/Pricing.tsx` | Pricing section |
| `components/landing/Problem.tsx` | Problem statement |
| `components/landing/ProcessTransparency.tsx` | Process transparency |
| `components/landing/Solution.tsx` | Solution section |
| `components/landing/TechStack.tsx` | Tech stack display |
| `components/landing/TechnologyStack.tsx` | Technology stack |
| `components/landing/Testimonials.tsx` | Testimonials |
| `components/landing/TrustIndicators.tsx` | Trust badges |

#### 2.3.5 Rectify Components
| File | Purpose |
|------|---------|
| `components/rectify/AIContextPanel.tsx` | AI context display |
| `components/rectify/AIThinkingStream.tsx` | AI thinking stream |
| `components/rectify/AnalysisPipelineTracker.tsx` | Pipeline tracker |
| `components/rectify/BirthPlacePicker.tsx` | Place picker |
| `components/rectify/BTRProcessFlow.tsx` | Process flow |
| `components/rectify/CandidateScoreTable.tsx` | Score table |
| `components/rectify/EphemerisPanel.tsx` | Ephemeris panel |
| `components/rectify/EventMethodExplainer.tsx` | Event explainer |
| `components/rectify/FlexibleDatePicker.tsx` | Date picker |
| `components/rectify/InteractiveMap.tsx` | Map component |
| `components/rectify/LiveCalculationPanel.tsx` | Live calculations |
| `components/rectify/LiveScoreTable.tsx` | Live scores |
| `components/rectify/PlanetaryVitals.tsx` | Planetary display |
| `components/rectify/ResultsPage.tsx` | Results page |
| `components/rectify/Step1BirthDetails.tsx` | Step 1 form |
| `components/rectify/Step2ForensicTraits.tsx` | Step 2 forensic |
| `components/rectify/Step2PhysicalTraits.tsx` | Step 2 physical |
| `components/rectify/Step3LifeEvents.tsx` | Step 3 events |
| `components/rectify/Step4Review.tsx` | Step 4 review |
| `components/rectify/UnifiedAIPanel.tsx` | Unified AI panel |
| `components/rectify/VedicShuddhiRadar.tsx` | Shuddhi radar |
| `components/rectify/WhyEventsMatter.tsx` | Why events matter |

#### 2.3.6 Dashboard Subcomponents
| File | Purpose |
|------|---------|
| `components/rectify/dashboard/BirthDetailsBanner.tsx` | Birth details |
| `components/rectify/dashboard/EventMatchGrid.tsx` | Event matches |
| `components/rectify/dashboard/FormattedAIReasoning.tsx` | AI reasoning |
| `components/rectify/dashboard/StageJourneyFunnel.tsx` | Stage funnel |
| `components/rectify/dashboard/TechnicalMetrics.tsx` | Technical metrics |
| `components/rectify/dashboard/theme.ts` | Dashboard theme |
| `components/rectify/dashboard/types.ts` | Dashboard types |
| `components/rectify/dashboard/utils.ts` | Dashboard utils |
| `components/rectify/dashboard/VerdictCard.tsx` | Verdict card |

#### 2.3.7 Forensic Quiz Engine
| File | Purpose |
|------|---------|
| `components/rectify/ForensicQuizEngine/constants.ts` | Quiz constants |
| `components/rectify/ForensicQuizEngine/index.tsx` | Quiz engine |
| `components/rectify/ForensicQuizEngine/types.ts` | Quiz types |
| `components/rectify/ForensicQuizEngine/__tests__/useQuizEngine.test.tsx` | Quiz tests |
| `components/rectify/ForensicQuizEngine/hooks/useDebounce.ts` | Debounce hook |
| `components/rectify/ForensicQuizEngine/hooks/useQuizEngine.ts` | Quiz hook |

#### 2.3.8 Results Dashboard
| File | Purpose |
|------|---------|
| `components/rectify/ResultsDashboard/index.tsx` | Results dashboard |
| `components/rectify/ResultsDashboard/components/ActionNav.tsx` | Action navigation |
| `components/rectify/ResultsDashboard/components/LeftMetricsColumn.tsx` | Metrics column |
| `components/rectify/ResultsDashboard/components/ResultsErrorBoundary.tsx` | Error boundary |
| `components/rectify/ResultsDashboard/components/ScoreAuditTable.tsx` | Score audit |
| `components/rectify/ResultsDashboard/components/TabPanels.tsx` | Tab panels |

#### 2.3.9 Results Page
| File | Purpose |
|------|---------|
| `components/rectify/ResultsPage/types.ts` | Results types |
| `components/rectify/ResultsPage/utils.ts` | Results utils |

#### 2.3.10 Dev Tools
| File | Purpose |
|------|---------|
| `components/dev/SSEDebugPanel.tsx` | SSE debugger |

#### 2.3.11 Providers
| File | Purpose |
|------|---------|
| `components/providers/debug-provider.tsx` | Debug provider |

#### 2.3.12 UI Components
| File | Purpose |
|------|---------|
| `components/ui/Breadcrumbs.tsx` | Breadcrumbs |
| `components/ui/ClientOnly.tsx` | Client-only wrapper |
| `components/ui/LoadingOverlay.tsx` | Loading overlay |
| `components/ui/SecurityBadge.tsx` | Security badge |
| `components/ui/Typewriter.tsx` | Typewriter effect |

#### 2.3.13 Form Components
| File | Purpose |
|------|---------|
| `components/ui/form/FormCard.tsx` | Form card |
| `components/ui/form/FormError.tsx` | Form error |
| `components/ui/form/FormField.tsx` | Form field |
| `components/ui/form/FormLabel.tsx` | Form label |
| `components/ui/form/index.ts` | Form exports |
| `components/ui/form/types.ts` | Form types |

### 2.4 Hooks

| File | Purpose |
|------|---------|
| `hooks/use-warmup.ts` | Warmup hook |
| `hooks/useClipboard.ts` | Clipboard hook |
| `hooks/__tests__/useClipboard.test.ts` | Clipboard tests |

### 2.5 Libraries

| File | Purpose |
|------|---------|
| `lib/analysis-session-readiness.ts` | Session readiness |
| `lib/api-client.ts` | API client |
| `lib/audit.ts` | Audit utilities |
| `lib/auth-utils.ts` | Auth utilities |
| `lib/crypto.ts` | Crypto utilities |
| `lib/date-utils.ts` | Date utilities |
| `lib/debounce.ts` | Debounce |
| `lib/design-system.ts` | Design system |
| `lib/ephemeris.ts` | Ephemeris utilities |
| `lib/event-categories.ts` | Event categories |
| `lib/event-requirements.ts` | Event requirements |
| `lib/forensic-emojis.ts` | Forensic emojis |
| `lib/fuzzy-date-parser.ts` | Fuzzy date parsing |
| `lib/keyword-highlighter.tsx` | Keyword highlighting |
| `lib/logger.ts` | Logging |
| `lib/memory-manager.ts` | Memory management |
| `lib/pagination.ts` | Pagination |
| `lib/progress-tracker.ts` | Progress tracking |
| `lib/queue-manager.ts` | Queue management |
| `lib/secure-logger.ts` | Secure logging |
| `lib/testimonials.ts` | Testimonials data |
| `lib/time-offset-manager.ts` | Time offset |
| `lib/types.ts` | Type definitions |
| `lib/use-stream-progress.ts` | Stream progress hook |
| `lib/warmup.ts` | Warmup utilities |
| `lib/wdyr.ts` | Why-did-you-render |
| `lib/xss-sanitizer.ts` | XSS sanitization |

#### 2.5.1 Library Tests
| File | Purpose |
|------|---------|
| `lib/__tests__/api-client.test.ts` | API client tests |
| `lib/__tests__/AuthUtils.test.ts` | Auth utils tests |
| `lib/__tests__/crypto.test.ts` | Crypto tests |
| `lib/__tests__/date-utils.test.ts` | Date utils tests |
| `lib/__tests__/debounce.test.ts` | Debounce tests |
| `lib/__tests__/event-categories.test.ts` | Event category tests |
| `lib/__tests__/forensic-scoring.test.ts` | Forensic scoring tests |
| `lib/__tests__/fuzzy-date-parser.test.ts` | Fuzzy date tests |
| `lib/__tests__/pagination.test.ts` | Pagination tests |
| `lib/__tests__/secure-logger.test.ts` | Secure logger tests |
| `lib/__tests__/sessions-batch-export-routes.test.ts` | Batch export tests |
| `lib/__tests__/sessions-clone-route.test.ts` | Clone route tests |
| `lib/__tests__/sessions-favorite-route.test.ts` | Favorite route tests |
| `lib/__tests__/sessions-route-put.test.ts` | PUT route tests |
| `lib/__tests__/time-offset-manager.test.ts` | Time offset tests |
| `lib/__tests__/use-stream-progress.test.ts` | Stream progress tests |
| `lib/__tests__/xss-sanitizer.test.ts` | XSS sanitizer tests |

#### 2.5.2 Constants
| File | Purpose |
|------|---------|
| `lib/constants/stages.ts` | Stage constants |

#### 2.5.3 Dashboard
| File | Purpose |
|------|---------|
| `lib/dashboard/hooks.ts` | Dashboard hooks |
| `lib/dashboard/types.ts` | Dashboard types |

#### 2.5.4 Debug
| File | Purpose |
|------|---------|
| `lib/debug/analysis-debug.ts` | Debug utilities |
| `lib/debug/extensions.ts` | Debug extensions |

#### 2.5.5 Events
| File | Purpose |
|------|---------|
| `lib/events/categories.ts` | Event categories |
| `lib/events/index.ts` | Events exports |
| `lib/events/types.ts` | Event types |
| `lib/events/utils.ts` | Event utilities |

#### 2.5.6 Forensic Quiz
| File | Purpose |
|------|---------|
| `lib/forensic-quiz/questions.ts` | Quiz questions |
| `lib/forensic-quiz/scoring.ts` | Quiz scoring |
| `lib/forensic-quiz/types.ts` | Quiz types |

#### 2.5.7 Server (Server-Side)
| File | Purpose |
|------|---------|
| `lib/server/backend-proxy.ts` | Backend proxy |
| `lib/server/build-phase-route-guard.ts` | Route guard |
| `lib/server/favorite-store.ts` | Favorite store |
| `lib/server/session-ownership.ts` | Session ownership |
| `lib/server/session-write-guards.ts` | Write guards |
| `lib/server/user-sync.ts` | User sync |
| `lib/server/__tests__/session-write-guards.test.ts` | Write guard tests |

#### 2.5.8 Store
| File | Purpose |
|------|---------|
| `lib/store/stream-store.ts` | Stream store |
| `lib/store/stream-types.ts` | Stream types |
| `lib/store/__tests__/stream_integrity.test.ts` | Stream integrity tests |
| `lib/store/__tests__/stream-store.test.ts` | Stream store tests |

#### 2.5.9 Utilities
| File | Purpose |
|------|---------|
| `lib/utils/astrology.test.ts` | Astrology tests |
| `lib/utils/astrology.ts` | Astrology utilities |
| `lib/utils/direct-test.ts` | Direct tests |
| `lib/utils/memory-prof.ts` | Memory profiling |
| `lib/utils/memory-test-direct.ts` | Memory tests |
| `lib/utils/stress-test-direct.ts` | Stress tests |

### 2.6 Tests

| File | Purpose |
|------|---------|
| `__tests__/AnalysisContainers.test.tsx` | Container tests |
| `__tests__/AnalysisLifecycle.test.tsx` | Lifecycle tests |
| `__tests__/AnalysisPage.test.tsx` | Page tests |
| `__tests__/AnalysisPerformance.test.tsx` | Performance tests |
| `__tests__/AnalysisPipeline.test.tsx` | Pipeline tests |
| `__tests__/AnalysisStatusBanner.test.tsx` | Status banner tests |
| `__tests__/AnalysisStreaming.test.tsx` | Streaming tests |
| `__tests__/DashboardPage.test.tsx` | Dashboard tests |
| `__tests__/MainPageIntegration.test.tsx` | Integration tests |
| `__tests__/setup.ts` | Test setup |
| `__tests__/smoke.test.tsx` | Smoke tests |
| `__tests__/StreamAuthIntegration.test.tsx` | Stream auth tests |

#### 2.6.1 Component Tests
| File | Purpose |
|------|---------|
| `__tests__/components/AnalysisStress.test.tsx` | Stress tests |
| `__tests__/components/CancelConfirmation.test.tsx` | Cancel tests |
| `__tests__/components/CompletionInsights.test.tsx` | Completion tests |
| `__tests__/components/ErrorDisplay.test.tsx` | Error display tests |
| `__tests__/components/MemoryProtection.test.tsx` | Memory protection tests |

### 2.7 Public Assets

| File | Purpose |
|------|---------|
| `public/icon.svg` | Site icon |
| `public/manifest.json` | PWA manifest |

---

## 3. Apps - API Backend

**Location:** `apps/api/`  
**Framework:** Express.js  
**Language:** TypeScript  

### 3.1 Configuration Files

| File | Purpose |
|------|---------|
| `package.json` | API dependencies |
| `tsconfig.json` | TypeScript configuration |
| `vitest.config.ts` | Test configuration |
| `.eslintrc.cjs` | ESLint configuration |
| `docker-compose.yml` | Docker compose |
| `drizzle.config.ts` | Drizzle ORM config |
| `test-sse.js` | SSE test script |
| `.env.example` | Environment template |

### 3.2 Database Migrations

| File | Purpose |
|------|---------|
| `drizzle/0001_add_forensic_traits.sql` | Forensic traits migration |
| `drizzle/0002_add_session_favorites.sql` | Favorites migration |
| `drizzle/meta/_journal.json` | Migration journal |

### 3.3 Scripts

| File | Purpose |
|------|---------|
| `scripts/doctor.sh` | Diagnostic script |

### 3.4 Source Code

#### 3.4.1 Root Source
| File | Purpose |
|------|---------|
| `src/live-test-run.ts` | Live test runner |

#### 3.4.2 Configuration
| File | Purpose |
|------|---------|
| `src/config/index.ts` | Main configuration |

#### 3.4.3 Errors
| File | Purpose |
|------|---------|
| `src/errors/index.ts` | Error definitions |

### 3.5 Library (`src/lib/`)

#### 3.5.1 Core Libraries
| File | Purpose |
|------|---------|
| `src/lib/advanced-btr-methods.ts` | Advanced BTR |
| `src/lib/ai-client.ts` | AI client |
| `src/lib/btr-precision-integrator.ts` | BTR precision |
| `src/lib/calculation-cache.ts` | Calc cache |
| `src/lib/cancellation-manager.ts` | Cancellation |
| `src/lib/cities.ts` | City data |
| `src/lib/consensus-engine.ts` | Consensus engine |
| `src/lib/crypto-adapter.ts` | Crypto adapter |
| `src/lib/db-cleanup.ts` | DB cleanup |
| `src/lib/debounce.ts` | Debounce |
| `src/lib/ephemeris.ts` | Ephemeris core |
| `src/lib/event-categories.ts` | Event categories |
| `src/lib/event-requirements.ts` | Event requirements |
| `src/lib/gandanta-detection.ts` | Gandanta detection |
| `src/lib/jaimini-astrology.ts` | Jaimini astrology |
| `src/lib/kalachakra-dasha.ts` | Kalachakra dasha |
| `src/lib/kp-sublords.ts` | KP sublords |
| `src/lib/logger.ts` | Logger |
| `src/lib/memory-manager.ts` | Memory manager |
| `src/lib/nadi-amsha.ts` | Nadi amsha |
| `src/lib/pagination.ts` | Pagination |
| `src/lib/pancha-pakshi.ts` | Pancha pakshi |
| `src/lib/progress-tracker.ts` | Progress tracker |
| `src/lib/queue-manager.ts` | Queue manager |
| `src/lib/seconds-precision-btr.ts` | Seconds precision BTR |
| `src/lib/secure-logger.ts` | Secure logger |
| `src/lib/session-events.ts` | Session events |
| `src/lib/session-ownership.ts` | Session ownership |
| `src/lib/shadbala.ts` | Shadbala |
| `src/lib/spouse-d9-verification.ts` | Spouse D9 |
| `src/lib/stream-ticket-manager.ts` | Stream tickets |
| `src/lib/testimonials.ts` | Testimonials |
| `src/lib/time-offset-manager.ts` | Time offset |
| `src/lib/timezones.ts` | Timezone data |
| `src/lib/types.ts` | Type definitions |
| `src/lib/user-sync.ts` | User sync |
| `src/lib/vedic-astrology-engine.ts` | Vedic engine |

#### 3.5.2 Library Tests
| File | Purpose |
|------|---------|
| `src/lib/__tests__/ai_intelligence.test.ts` | AI tests |
| `src/lib/__tests__/ai-resilience.test.ts` | AI resilience tests |
| `src/lib/__tests__/btr_stress_robustness.test.ts` | BTR stress tests |
| `src/lib/__tests__/calculation-cache.test.ts` | Cache tests |
| `src/lib/__tests__/cancellation-manager.test.ts` | Cancellation tests |
| `src/lib/__tests__/consensus-engine.test.ts` | Consensus tests |
| `src/lib/__tests__/contract_validation.test.ts` | Contract tests |
| `src/lib/__tests__/crypto-adapter.test.ts` | Crypto tests |
| `src/lib/__tests__/data-package.test.ts` | Data package tests |
| `src/lib/__tests__/db-cleanup.test.ts` | Cleanup tests |
| `src/lib/__tests__/edge-cases.test.ts` | Edge case tests |
| `src/lib/__tests__/encryption.test.ts` | Encryption tests |
| `src/lib/__tests__/frontend_memory_limit.test.ts` | Memory limit tests |
| `src/lib/__tests__/frontend_network_stress.test.ts` | Network stress tests |
| `src/lib/__tests__/frontend_realtime_sync.test.ts` | Realtime sync tests |
| `src/lib/__tests__/global-logic.test.ts` | Global logic tests |
| `src/lib/__tests__/ground-truth.test.ts` | Ground truth tests |
| `src/lib/__tests__/industrial_precision_core.test.ts` | Precision tests |
| `src/lib/__tests__/memory-manager.test.ts` | Memory manager tests |
| `src/lib/__tests__/performance.benchmark.test.ts` | Performance tests |
| `src/lib/__tests__/progress-tracker.test.ts` | Progress tracker tests |
| `src/lib/__tests__/queue-claim-concurrency.test.ts` | Queue claim tests |
| `src/lib/__tests__/queue-manager.test.ts` | Queue manager tests |
| `src/lib/__tests__/session-events.test.ts` | Session events tests |
| `src/lib/__tests__/session-events.unit.test.ts` | Session unit tests |
| `src/lib/__tests__/setup.ts` | Test setup |
| `src/lib/__tests__/sse-throughput.test.ts` | SSE throughput tests |
| `src/lib/__tests__/stream-ticket-manager.test.ts` | Ticket manager tests |
| `src/lib/__tests__/stress_benchmarks.test.ts` | Stress benchmarks |
| `src/lib/__tests__/test-utils.ts` | Test utilities |
| `src/lib/__tests__/time-offset-manager.test.ts` | Time offset tests |
| `src/lib/__tests__/user-sync.test.ts` | User sync tests |
| `src/lib/__tests__/vedic-engine.test.ts` | Vedic engine tests |

#### 3.5.3 Test Snapshots
| File | Purpose |
|------|---------|
| `src/lib/__tests__/__snapshots__/data-package.test.ts.snap` | Data snapshots |

#### 3.5.4 BTR System (`src/lib/btr/`)
| File | Purpose |
|------|---------|
| `src/lib/btr/dasha-builder.ts` | Dasha builder |
| `src/lib/btr/orchestrator.ts` | BTR orchestrator |
| `src/lib/btr/security-guard.ts` | Security guard |
| `src/lib/btr/stress-test.ts` | Stress test |

##### Extractors
| File | Purpose |
|------|---------|
| `src/lib/btr/extractors/ai-response-extractors.ts` | AI extractors |
| `src/lib/btr/extractors/index.ts` | Extractor exports |

##### Prompts
| File | Purpose |
|------|---------|
| `src/lib/btr/prompts/batch-prompt.ts` | Batch prompt |
| `src/lib/btr/prompts/deep-analysis-prompt.ts` | Deep analysis |
| `src/lib/btr/prompts/final-precision-prompt.ts` | Final precision |
| `src/lib/btr/prompts/forensic-context.ts` | Forensic context |
| `src/lib/btr/prompts/vsl-formatter.ts` | VSL formatter |

##### Security Tests
| File | Purpose |
|------|---------|
| `src/lib/btr/security/__tests__/prompt-injection.test.ts` | Prompt injection tests |
| `src/lib/btr/security/__tests__/security-guard.unit.test.ts` | Security guard tests |

#### 3.5.5 Encryption (`src/lib/encryption/`)
| File | Purpose |
|------|---------|
| `src/lib/encryption/DANGER_DO_NOT_MODIFY.ts` | Encryption core |
| `src/lib/encryption/encryption-v2.ts` | Encryption v2 |
| `src/lib/encryption/index.ts` | Encryption exports |
| `src/lib/encryption/test.ts` | Encryption tests |
| `src/lib/encryption/types.ts` | Encryption types |
| `src/lib/encryption/v2.ts` | Encryption v2 alt |

#### 3.5.6 Ephemeris (`src/lib/ephemeris/`)
| File | Purpose |
|------|---------|
| `src/lib/ephemeris/compare.ts` | Ephemeris compare |
| `src/lib/ephemeris/gold-dataset.ts` | Gold dataset |
| `src/lib/ephemeris/provider.ts` | Ephemeris provider |
| `src/lib/ephemeris/skyfield-client.ts` | Skyfield client |

##### Ephemeris Tests
| File | Purpose |
|------|---------|
| `src/lib/ephemeris/__tests__/contract.test.ts` | Contract tests |
| `src/lib/ephemeris/__tests__/skyfield-swiss-parity.test.ts` | Parity tests |

#### 3.5.7 Jobs (`src/lib/jobs/`)
| File | Purpose |
|------|---------|
| `src/lib/jobs/artifact-storage.ts` | Artifact storage |
| `src/lib/jobs/job-event-stream.ts` | Job event stream |
| `src/lib/jobs/job-service.ts` | Job service |
| `src/lib/jobs/worker-runtime.ts` | Worker runtime |

##### Jobs Tests
| File | Purpose |
|------|---------|
| `src/lib/jobs/__tests__/artifact-storage.test.ts` | Artifact tests |
| `src/lib/jobs/__tests__/job-service.validation-idempotency.test.ts` | Idempotency tests |

#### 3.5.8 Observability (`src/lib/observability/`)
| File | Purpose |
|------|---------|
| `src/lib/observability/otlp-exporter.ts` | OTLP exporter |
| `src/lib/observability/slo-monitor.ts` | SLO monitor |

#### 3.5.9 Queue (`src/lib/queue/`)
| File | Purpose |
|------|---------|
| `src/lib/queue/driver.ts` | Queue driver |
| `src/lib/queue/index.ts` | Queue exports |

##### Queue Drivers
| File | Purpose |
|------|---------|
| `src/lib/queue/drivers/db-polling.ts` | DB polling driver |
| `src/lib/queue/drivers/redis-bullmq.ts` | Redis driver |

#### 3.5.10 Resilience (`src/lib/resilience/`)
| File | Purpose |
|------|---------|
| `src/lib/resilience/dependency-circuit-breaker.ts` | Circuit breaker |

#### 3.5.11 Utilities (`src/lib/utils/`)
| File | Purpose |
|------|---------|
| `src/lib/utils/array-helpers.ts` | Array helpers |
| `src/lib/utils/dms-formatter.ts` | DMS formatter |
| `src/lib/utils/ephemeris-helpers.ts` | Ephemeris helpers |
| `src/lib/utils/formatting.ts` | Formatting |
| `src/lib/utils/index.ts` | Utils exports |

### 3.6 Middleware (`src/middleware/`)

| File | Purpose |
|------|---------|
| `src/middleware/auth.ts` | Auth middleware |
| `src/middleware/error-handler-new.ts` | New error handler |
| `src/middleware/error-handler.ts` | Error handler |
| `src/middleware/rate-limit.ts` | Rate limiting |
| `src/middleware/request-id.ts` | Request ID |
| `src/middleware/timeout.ts` | Timeout middleware |
| `src/middleware/validation.ts` | Validation |

#### Middleware Tests
| File | Purpose |
|------|---------|
| `src/middleware/__tests__/auth-stream-policy.test.ts` | Stream policy tests |
| `src/middleware/__tests__/auth.test.ts` | Auth tests |
| `src/middleware/__tests__/BackendAuth.test.ts` | Backend auth tests |
| `src/middleware/__tests__/rate-limit.test.ts` | Rate limit tests |
| `src/middleware/__tests__/request-id.test.ts` | Request ID tests |
| `src/middleware/__tests__/validation.test.ts` | Validation tests |

### 3.7 Migrations (`src/migrations/`)

| File | Purpose |
|------|---------|
| `src/migrations/encrypt-to-v2.ts` | Encryption migration |

### 3.8 Routes (`src/routes/`)

| File | Purpose |
|------|---------|
| `src/routes/admin.ts` | Admin routes |
| `src/routes/calculate.ts` | Calculate routes |
| `src/routes/candidate-detail.ts` | Candidate detail |
| `src/routes/consent.ts` | Consent routes |
| `src/routes/debug-analysis.ts` | Debug analysis |
| `src/routes/health.ts` | Health routes |
| `src/routes/index.ts` | Route exports |
| `src/routes/jobs.ts` | Job routes |
| `src/routes/progress.ts` | Progress routes |
| `src/routes/queue.ts` | Queue routes |
| `src/routes/sessions.ts` | Session routes |
| `src/routes/stream.ts` | Stream routes |

#### Routes Tests
| File | Purpose |
|------|---------|
| `src/routes/__tests__/admin.test.ts` | Admin tests |
| `src/routes/__tests__/api.integration.test.ts` | API integration tests |
| `src/routes/__tests__/calculate.test.ts` | Calculate tests |
| `src/routes/__tests__/consent.test.ts` | Consent tests |
| `src/routes/__tests__/health.test.ts` | Health tests |
| `src/routes/__tests__/industrial_security_api.test.ts` | Security API tests |
| `src/routes/__tests__/industrial_security_fuzzing.test.ts` | Fuzzing tests |
| `src/routes/__tests__/jobs.test.ts` | Jobs tests |
| `src/routes/__tests__/progress.test.ts` | Progress tests |
| `src/routes/__tests__/queue.test.ts` | Queue tests |
| `src/routes/__tests__/session-clone.test.ts` | Clone tests |
| `src/routes/__tests__/SessionIntegrity.test.ts` | Integrity tests |
| `src/routes/__tests__/sessions.test.ts` | Session tests |
| `src/routes/__tests__/stream.test.ts` | Stream tests |
| `src/routes/__tests__/traits-integration.test.ts` | Traits tests |
| `src/routes/__tests__/warmup.test.ts` | Warmup tests |

### 3.9 Scripts (`src/scripts/`)

| File | Purpose |
|------|---------|
| `src/scripts/capacity-validation.ts` | Capacity validation |
| `src/scripts/chaos-resilience-check.ts` | Chaos tests |
| `src/scripts/check-db.ts` | DB check |
| `src/scripts/check-session-status.ts` | Session status |
| `src/scripts/check-session.ts` | Session check |
| `src/scripts/check-status.ts` | Status check |
| `src/scripts/cleanup-old-artifacts.ts` | Cleanup artifacts |
| `src/scripts/cleanup-old-encryption.ts` | Cleanup encryption |
| `src/scripts/compare-ephemeris-providers.ts` | Compare ephemeris |
| `src/scripts/debug-session.ts` | Debug session |
| `src/scripts/generate-ephemeris-trusted-candidates.ts` | Generate candidates |
| `src/scripts/print-ephemeris-gold-onboarding-checklist.ts` | Gold checklist |
| `src/scripts/profile-btr-resource.ts` | BTR profiling |
| `src/scripts/requeue-session.ts` | Requeue session |
| `src/scripts/scheduled-cleanup.ts` | Scheduled cleanup |
| `src/scripts/smoke-cloudrun-job-flow.ts` | Smoke test |
| `src/scripts/smoke-duplicate-route-flow-local.ts` | Duplicate flow local |
| `src/scripts/smoke-duplicate-route-flow.ts` | Duplicate flow |
| `src/scripts/smoke-duplicate-submit.ts` | Duplicate submit |
| `src/scripts/test-calc.ts` | Test calculator |
| `src/scripts/test-eph.ts` | Test ephemeris |
| `src/scripts/test-extract.ts` | Test extraction |
| `src/scripts/test-heavy-load.ts` | Heavy load test |
| `src/scripts/test-init.ts` | Test init |
| `src/scripts/test-process.ts` | Test process |
| `src/scripts/test-sse.ts` | Test SSE |
| `src/scripts/test-tdz-hoisting.ts` | Test TDZ |
| `src/scripts/trigger-blinded-test.ts` | Blinded test |
| `src/scripts/trigger-modi-custom.ts` | Custom trigger |
| `src/scripts/validate-ephemeris-gold-dataset.ts` | Validate gold |
| `src/scripts/verify-worker-health.ts` | Worker health |

### 3.10 Utils (`src/utils/`)

*Directory exists but no files listed in initial scan*

---

## 4. Apps - Worker

**Location:** `apps/worker/`  
**Runtime:** Node.js  
**Purpose:** External job worker

| File | Purpose |
|------|---------|
| `package.json` | Worker dependencies |
| `tsconfig.json` | TypeScript config |
| `src/worker.ts` | Worker entry point |

---

## 5. Packages - Database

**Location:** `packages/db/`  
**Purpose:** Drizzle ORM schema and client

### 5.1 Configuration

| File | Purpose |
|------|---------|
| `package.json` | Package config |
| `tsconfig.json` | TypeScript config |
| `vitest.config.ts` | Test config |
| `drizzle.config.ts` | Drizzle config |

### 5.2 Migrations

| File | Purpose |
|------|---------|
| `drizzle/0000_true_king_cobra.sql` | Initial schema |
| `drizzle/0001_acoustic_star_brand.sql` | Migration 1 |
| `drizzle/0003_lyrical_quicksilver.sql` | Migration 3 |

### 5.3 Migration Meta

| File | Purpose |
|------|---------|
| `drizzle/meta/_journal.json` | Migration journal |
| `drizzle/meta/0000_snapshot.json` | Snapshot 0 |
| `drizzle/meta/0001_snapshot.json` | Snapshot 1 |
| `drizzle/meta/0003_snapshot.json` | Snapshot 3 |

### 5.4 Source Code

| File | Purpose |
|------|---------|
| `src/drizzle.ts` | Drizzle client |
| `src/index.ts` | Package exports |
| `src/jobs.ts` | Job utilities |
| `src/schema.ts` | Database schema |

### 5.5 Tests

| File | Purpose |
|------|---------|
| `src/__tests__/DBBatch.test.ts` | Batch tests |
| `src/__tests__/DBConcurrency.test.ts` | Concurrency tests |
| `src/__tests__/DBConnectivity.test.ts` | Connectivity tests |
| `src/__tests__/drizzle.test.ts` | Drizzle tests |
| `src/__tests__/jobs.test.ts` | Jobs tests |
| `src/__tests__/schema.test.ts` | Schema tests |

---

## 6. Packages - Shared

**Location:** `packages/shared/`  
**Purpose:** Shared types and schemas

### 6.1 Configuration

| File | Purpose |
|------|---------|
| `package.json` | Package config |
| `tsconfig.json` | TypeScript config |
| `vitest.config.ts` | Test config |

### 6.2 Source Code

| File | Purpose |
|------|---------|
| `src/btr-types.ts` | BTR types |
| `src/index.ts` | Package exports |
| `src/schemas.ts` | Zod schemas |
| `src/types.ts` | TypeScript types |

### 6.3 Tests

| File | Purpose |
|------|---------|
| `src/__tests__/contract.test.ts` | Contract tests |
| `src/__tests__/life-event-schema.test.ts` | Life event tests |
| `src/__tests__/schemas.test.ts` | Schema tests |

---

## 7. Services - Ephemeris

**Location:** `services/ephemeris/`  
**Framework:** FastAPI  
**Language:** Python  
**Purpose:** Skyfield ephemeris microservice

### 7.1 Configuration

| File | Purpose |
|------|---------|
| `.env.example` | Environment template |
| `pyproject.toml` | Python project config |
| `Dockerfile` | Docker configuration |

### 7.2 Scripts

| File | Purpose |
|------|---------|
| `scripts/bootstrap.sh` | Bootstrap script |
| `scripts/dev.sh` | Development script |
| `scripts/download-kernel.sh` | Kernel download |

### 7.3 Application Code

| File | Purpose |
|------|---------|
| `app/__init__.py` | App init |
| `app/config.py` | App configuration |
| `app/errors.py` | Error definitions |
| `app/logging.py` | Logging setup |
| `app/main.py` | FastAPI entry point |

#### 7.3.1 Models
| File | Purpose |
|------|---------|
| `app/models/__init__.py` | Models init |
| `app/models/chart.py` | Chart models |
| `app/models/ephemeris.py` | Ephemeris models |
| `app/models/health.py` | Health models |
| `app/models/sunrise.py` | Sunrise models |

#### 7.3.2 Routes
| File | Purpose |
|------|---------|
| `app/routes/__init__.py` | Routes init |
| `app/routes/health.py` | Health routes |

##### V1 Routes
| File | Purpose |
|------|---------|
| `app/routes/v1/__init__.py` | V1 init |
| `app/routes/v1/ephemeris.py` | Ephemeris routes |

#### 7.3.3 Services
| File | Purpose |
|------|---------|
| `app/services/__init__.py` | Services init |
| `app/services/calculations.py` | Calculations |
| `app/services/runtime.py` | Runtime |

### 7.4 Data

*Directory for ephemeris kernel files*

### 7.5 Tests

| File | Purpose |
|------|---------|
| `tests/test_house_systems.py` | House system tests |

---

## 8. E2E Tests

**Location:** `e2e/`  
**Framework:** Playwright

| File | Purpose |
|------|---------|
| `a11y.spec.ts` | Accessibility tests |
| `analysis-data-flow.spec.ts` | Data flow tests |
| `analysis-lifecycle-persistence.spec.ts` | Lifecycle tests |
| `analysis-watchdog.spec.ts` | Watchdog tests |
| `core-flow.spec.ts` | Core flow tests |
| `dashboard.spec.ts` | Dashboard tests |
| `landing-page.spec.ts` | Landing page tests |
| `observability-telemetry.spec.ts` | Telemetry tests |
| `resilience-chaos.spec.ts` | Chaos tests |
| `smoke.spec.ts` | Smoke tests |
| `validation.spec.ts` | Validation tests |

---

## 9. Scripts

**Location:** `scripts/`  
**Purpose:** Build, deploy, and utility scripts

| File | Purpose |
|------|---------|
| `bump-precision.js` | Precision bumping |
| `cleanup-artifact-images.sh` | Cleanup artifacts |
| `cleanup.sh` | General cleanup |
| `deploy-cloud-run.sh` | Cloud Run deploy |
| `deploy-staging-sequence.sh` | Staging deploy |
| `download-ephemeris.sh` | Download ephemeris |
| `enable-production-worker-mode.sh` | Enable worker mode |
| `enforce-idle-cost-guards.sh` | Cost guards |
| `external-warmup.sh` | External warmup |
| `migrate-manual.ts` | Manual migration |
| `preflight-env-safety.sh` | Env safety check |
| `run-tests.sh` | Test runner |
| `runner.js` | Script runner |
| `staging-preflight.sh` | Staging preflight |
| `start-all.sh` | Start all services |
| `summarize-test-log.mjs` | Test log summary |
| `verify-schema.ts` | Schema verification |
| `warmup.ts` | Warmup script |

### 9.1 Load Tests

| File | Purpose |
|------|---------|
| `load-tests/btr-flow.js` | BTR load testing |

---

## 10. Documentation

**Location:** `docs/`  

### 10.1 Core Documentation

| File | Purpose |
|------|---------|
| `BACKEND_ARCHITECTURE_IMPACT_ANALYSIS.md` | Backend architecture analysis |
| `BACKEND_AUDIT_COMPLETE.md` | Backend audit report |
| `CODEX_WORKFLOW.md` | Codex workflow guide |
| `COMPLETE_PROJECT_AUDIT.md` | Project audit |
| `COMPLETE_FILE_INVENTORY.md` | This file |
| `CURRENT_ARCHITECTURE_SNAPSHOT.md` | Architecture snapshot |
| `EPHEMERIS_TRUSTED_DATASET_ONBOARDING.md` | Ephemeris onboarding |
| `FRONTEND_BACKEND_ARCHITECTURE_IMPACT_ANALYSIS.md` | Frontend impact |
| `KNOWN_ISSUES_REGISTER_2026-03-12.md` | Known issues |
| `PHASE_COMPLETION_REPORT_2026-03-12.md` | Phase completion |
| `PHASE_RERUN_REPORT_2026-03-12.md` | Phase rerun |
| `PRODUCTION_DEPLOYMENT_CHECKLIST.md` | Deployment checklist |
| `PRODUCTION_READY_ROADMAP.md` | Production roadmap |
| `PROMPT_TEMPLATES.md` | Prompt templates |
| `SECRET_SAFE_TESTING.md` | Testing guide |
| `SHIP_READY_WORKFLOW.md` | Ship workflow |

### 10.2 Audit Reports

| File | Purpose |
|------|---------|
| `audits/BTR_MIXED_PRECISION_STAGE_AUDIT_2026-03-09.json` | BTR audit JSON |
| `audits/BTR_MIXED_PRECISION_STAGE_AUDIT_2026-03-09.md` | BTR audit |
| `audits/EPHEMERIS_PARITY_RUN_2026-03-12.md` | Ephemeris parity |

### 10.3 Runbooks

| File | Purpose |
|------|---------|
| `runbooks/STAGING_CANARY_CHECKLIST.md` | Staging checklist |

---

## 11. Deployment

**Location:** `deploy/cloudrun/`

| File | Purpose |
|------|---------|
| `api.Dockerfile` | API service Dockerfile |
| `web.Dockerfile` | Web service Dockerfile |
| `worker.Dockerfile` | Worker Dockerfile |

---

## 12. Data & Ephemeris

### 12.1 Data Directory

**Location:** `data/`  
*Contains application data files*

### 12.2 Ephemeris Directory

**Location:** `ephe/`  
*Contains Swiss Ephemeris binary files*

| File | Purpose |
|------|---------|
| `.gitignore` | Git ignore |
| `.gitkeep` | Git keep |
| `seas_18.se1` | Asteroids file |
| `semo_00.se1` | Moon file 00 |
| `semo_06.se1` | Moon file 06 |
| `semo_12.se1` | Moon file 12 |
| `semo_18.se1` | Moon file 18 |
| `semo_24.se1` | Moon file 24 |
| `sepl_00.se1` | Planets file 00 |
| `sepl_06.se1` | Planets file 06 |
| `sepl_12.se1` | Planets file 12 |
| `sepl_18.se1` | Planets file 18 |
| `sepl_24.se1` | Planets file 24 |
| `sepl_30.se1` | Planets file 30 |
| `seplm18.se1` | Planets file m18 |

---

## 13. Logs

**Location:** `logs/`

| File | Purpose |
|------|---------|
| `test-summary-latest.json` | Latest test summary |
| `test-summary-latest.md` | Latest test summary MD |

---

## File Count Summary

| System | Files | Description |
|--------|-------|-------------|
| **Root Config** | ~15 | Root configuration files |
| **Web Frontend** | ~250+ | Next.js app, components, hooks, libs, tests |
| **API Backend** | ~280+ | Express routes, middleware, libs, scripts, tests |
| **Worker** | ~1 | Standalone worker |
| **Database Package** | ~15 | Drizzle schema and client |
| **Shared Package** | ~8 | Shared types and schemas |
| **Ephemeris Service** | ~20 | Python FastAPI service |
| **E2E Tests** | ~11 | Playwright tests |
| **Scripts** | ~20 | Build and deploy scripts |
| **Documentation** | ~20 | Architecture and audit docs |
| **Deployment** | ~3 | Dockerfiles |
| **Ephemeris Data** | ~15 | Swiss Ephemeris binaries |
| **Logs** | ~2 | Test summaries |
| **TOTAL** | **~660+** | **Complete project** |

---

## Key Subsystems

### Birth Time Rectification (BTR)
- **Entry:** `apps/api/src/lib/btr/orchestrator.ts`
- **Stages:** 6-stage pipeline
- **Extractors:** `apps/api/src/lib/btr/extractors/`
- **Prompts:** `apps/api/src/lib/btr/prompts/`
- **Security:** `apps/api/src/lib/btr/security/`

### Ephemeris System
- **API Client:** `apps/api/src/lib/ephemeris/skyfield-client.ts`
- **Provider:** `apps/api/src/lib/ephemeris/provider.ts`
- **Gold Dataset:** `apps/api/src/lib/ephemeris/gold-dataset.ts`
- **Python Service:** `services/ephemeris/`

### Queue System
- **Driver:** `apps/api/src/lib/queue/`
- **DB Polling:** `apps/api/src/lib/queue/drivers/db-polling.ts`
- **Redis:** `apps/api/src/lib/queue/drivers/redis-bullmq.ts`
- **Job Service:** `apps/api/src/lib/jobs/job-service.ts`
- **Worker Runtime:** `apps/api/src/lib/jobs/worker-runtime.ts`

### Streaming System
- **Stream Ticket Manager:** `apps/api/src/lib/stream-ticket-manager.ts`
- **Progress Tracker:** `apps/api/src/lib/progress-tracker.ts`
- **Session Events:** `apps/api/src/lib/session-events.ts`
- **Frontend Hook:** `apps/web/lib/use-stream-progress.ts`

### Authentication
- **Frontend Middleware:** `apps/web/middleware.ts`
- **Backend Middleware:** `apps/api/src/middleware/auth.ts`
- **Clerk Webhook:** `apps/web/app/api/webhooks/clerk/route.ts`
- **User Sync:** `apps/api/src/lib/user-sync.ts`

---

*End of Complete File Inventory*
