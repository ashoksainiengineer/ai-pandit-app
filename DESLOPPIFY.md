# AI-Pandit Code Quality Transformation Roadmap

**Status:** IN PROGRESS  
**Started:** 2026-04-30  
**Target Completion:** 2026-05-07 (1 week sprint)  
**Current Score:** 17.1/100 (Average)  
**Target Score:** 85.0/100 (Production-Grade)

---

## Philosophy

> "From Vibe Coding to Vibe Engineering" - Desloppify

This isn't about linting to 100. It's about making the codebase something a senior engineer respects. Every fix must be real, not cosmetic. The score resists gaming — the only way to improve it is to actually make the code better.

**Rules:**
1. Fix properly, not minimally
2. No task too big or too small
3. Large refactors AND small detailed fixes — both with equal energy
4. Follow the plan. Don't substitute your own analysis
5. Security first. Tests second. Quality third.

---

## Current State Snapshot

### Score Matrix

| App | Overall | Objective | Strict | Issues | Test Cov | Security |
|-----|---------|-----------|--------|--------|----------|----------|
| apps/web | 20.4 | 81.6 | 20.4 | 717 | 15.5% | 11 issues |
| apps/api | 21.0 | 83.9 | 21.0 | 578 | 47.8% | 10 issues |
| apps/worker | 10.3 | 41.2 | 10.3 | 26 | 0.0% | 0 issues |
| packages/* | 16.7 | 66.7 | 16.7 | 52 | 50.2% | 1 issue |

### Issue Breakdown

| Category | Count | Priority | Impact |
|----------|-------|----------|--------|
| Security Issues | 22 | CRITICAL | Production blocker |
| Missing Tests | 311 | CRITICAL | Quality gate blocker |
| Unused Code | 227 | HIGH | Maintainability |
| Code Smells | 364 | HIGH | Technical debt |
| Deprecated APIs | 19 | MEDIUM | Future-proofing |
| React Anti-patterns | 6 | HIGH | Performance/stability |
| Orphaned Files | 213 | MEDIUM | Dead code |
| Duplication | 16 | LOW | Refactoring |

---

## Phase 1: Security Lockdown (Day 1) ⚡ CRITICAL

**Goal:** Zero security issues. Production cannot deploy with these.

### apps/web - 11 Security Issues

```bash
desloppify show security --path ./apps/web
```

**Expected Actions:**
- [ ] Fix unsafe HTML injection vectors
- [ ] Sanitize user inputs in form components
- [ ] Remove hardcoded API keys/secrets (if any)
- [ ] Fix CSRF vulnerabilities in API calls
- [ ] Secure localStorage/sessionStorage usage
- [ ] Fix XSS vulnerabilities in dynamic content rendering
- [ ] Add Content Security Policy headers
- [ ] Remove eval() or Function() constructor usage
- [ ] Fix insecure regex patterns (ReDoS)
- [ ] Sanitize URL parameters
- [ ] Fix insecure randomness (Math.random for crypto)

### apps/api - 10 Security Issues

```bash
desloppify show security --path ./apps/api
```

**Expected Actions:**
- [ ] Fix SQL injection vectors in Drizzle queries
- [ ] Add rate limiting to sensitive endpoints
- [ ] Sanitize all user inputs before processing
- [ ] Fix insecure authentication bypasses
- [ ] Add proper CORS configuration
- [ ] Secure file upload endpoints
- [ ] Fix path traversal vulnerabilities
- [ ] Add request size limits
- [ ] Remove debug endpoints from production
- [ ] Fix insecure error messages (information disclosure)

### packages/* - 1 Security Issue

```bash
desloppify show security --path ./packages
```

**Expected Actions:**
- [ ] Fix shared utility security flaw

### Verification

```bash
desloppify --lang typescript scan --path ./apps/web --force-rescan
desloppify --lang typescript scan --path ./apps/api --force-rescan
desloppify --lang typescript scan --path ./packages --force-rescan
```

**Target:** Security dimension = 100.0% for all apps

---

## Phase 2: Dead Code Annihilation (Day 1-2) 🔥 HIGH IMPACT

**Goal:** Remove all unused code, orphaned files, dead exports. Quick score wins.

### Unused TypeScript Instances (228 total)

| App | Count | Action |
|-----|-------|--------|
| apps/web | 161 | Remove unused imports, variables, functions |
| apps/api | 62 | Remove unused imports, variables, functions |
| apps/worker | 1 | Remove unused code |
| packages/* | 4 | Remove unused code |

**Approach:**
```bash
desloppify show unused --path ./apps/web
desloppify show unused --path ./apps/api
```

**For each issue:**
1. Verify it's truly unused (not dynamically imported)
2. Remove the unused code
3. Run typecheck to ensure no breakage
4. Run tests to verify

### Orphaned Files (213 total)

| App | Count | Action |
|-----|-------|--------|
| apps/web | 111 | Delete or integrate |
| apps/api | 100 | Delete or integrate |
| apps/worker | 1 | Delete or integrate |
| packages/* | 1 | Delete or integrate |

**Approach:**
```bash
desloppify show orphaned --path ./apps/web
```

**For each file:**
1. Check if it's used dynamically (require/import)
2. Check if it's a config/template file
3. If truly unused → DELETE
4. If used but not imported → REFACTOR to proper import

### Dead Exports

```bash
desloppify show dead_exports --path ./apps/web
desloppify show dead_exports --path ./apps/api
```

**Action:** Remove all dead exports

### Verification

```bash
npm run lint
npm run typecheck
```

**Target:** Zero unused code, zero orphaned files

---

## Phase 3: Test Coverage Blitz (Day 2-4) 🧪 CRITICAL

**Goal:** Comprehensive test coverage for all critical paths.

### apps/web - 205 Missing Tests (Target: 60%)

**Priority Order:**
1. **Authentication flows** (Clerk integration)
   - Sign in/sign out
   - Protected routes
   - Auth state management
   
2. **BTR Analysis components**
   - `app/rectify/[id]/page.tsx`
   - `lib/use-stream-progress.ts`
   - Form validation
   - Data display components

3. **API integration**
   - API client utilities
   - Error handling
   - Loading states

4. **Utility functions**
   - Date/time helpers
   - Formatting utilities
   - Validation logic

5. **UI components**
   - Shared components
   - Form inputs
   - Modal/dialogs

### apps/api - 101 Missing Tests (Target: 70%)

**Priority Order:**
1. **BTR Engine** (CRITICAL)
   - `lib/seconds-precision-btr.ts` — Core 6-stage pipeline
   - `lib/vedic-astrology-engine.ts` — Vedic calculations
   - `lib/queue-manager.ts` — Job queue management
   - Streaming processor

2. **API Routes**
   - Auth middleware
   - Rectification endpoints
   - Health checks
   - Error handlers

3. **Utilities**
   - Encryption (`lib/encryption/**`)
   - Validation schemas
   - Logger configuration

4. **Database**
   - Drizzle schema validation
   - Query builders
   - Migration scripts

### apps/worker - 1 Missing Test (Target: 70%)

**Action:** 
- Create comprehensive test suite
- Job processing logic
- Queue integration
- Error handling
- Retry mechanisms

### packages/* - 4 Missing Tests (Target: 80%)

**Action:**
- Shared types validation
- Schema tests
- Utility function tests
- Re-export validation

### Testing Strategy

**Unit Tests:**
```typescript
// Example pattern for each module
describe('ModuleName', () => {
  describe('functionName', () => {
    it('should handle valid input', () => {});
    it('should handle edge case', () => {});
    it('should throw on invalid input', () => {});
    it('should handle error conditions', () => {});
  });
});
```

**Integration Tests:**
- API endpoint testing with supertest
- Database integration with test containers
- Queue integration mocking

**E2E Tests:**
- Critical user flows
- BTR analysis flow
- Auth flow

### Verification

```bash
npm run test
cd apps/web && npm run test -- --coverage
cd apps/api && npm run test -- --coverage
```

---

## Phase 4: Code Smell Eradication (Day 4-5) 🧹

**Goal:** Fix all code smells and structural issues.

### apps/web - 158 Code Smells

**React Anti-patterns:**
- [ ] Fix 4 state sync anti-patterns
- [ ] Fix 2 boolean state explosions
- [ ] Replace useEffect misuse with proper patterns
- [ ] Fix prop drilling (use context/state management)
- [ ] Memoize expensive computations

**Structural Issues:**
- [ ] Fix 20 structural issues
- [ ] Reduce complexity in overloaded functions
- [ ] Break down large components
- [ ] Extract reusable logic to hooks

**Coupling Issues:**
- [ ] Fix 24 single-use code instances
- [ ] Reduce tight coupling between components
- [ ] Improve module boundaries

### apps/api - 203 Code Smells

**Structural Issues:**
- [ ] Fix 27 structural issues
- [ ] Reduce function complexity
- [ ] Break down large files (>500 LOC)
- [ ] Extract utility functions

**Code Quality:**
- [ ] Fix magic numbers
- [ ] Add proper error handling
- [ ] Improve async/await patterns
- [ ] Fix callback hell

**Signature Issues:**
- [ ] Fix 8 signature variance issues
- [ ] Standardize function signatures
- [ ] Fix inconsistent return types

### packages/* - 13 Code Smells

**Action:** Fix all smell issues in shared packages

### Verification

```bash
npm run lint
npm run typecheck
```

---

## Phase 5: React & Frontend Excellence (Day 5) ⚛️

**Goal:** Frontend code that follows Next.js 15 best practices.

### Next.js Framework Compliance

- [ ] Fix all Next.js framework smell issues
- [ ] Ensure proper use of App Router patterns
- [ ] Optimize image loading
- [ ] Fix metadata configuration
- [ ] Ensure proper SSR/SSG usage
- [ ] Fix loading.tsx and error.tsx files

### Performance Optimization

- [ ] Add React.memo where beneficial
- [ ] Use useMemo for expensive calculations
- [ ] Optimize re-renders
- [ ] Lazy load heavy components
- [ ] Add Suspense boundaries

### Accessibility

- [ ] Fix a11y violations
- [ ] Add proper ARIA labels
- [ ] Ensure keyboard navigation
- [ ] Fix color contrast issues

### Verification

```bash
cd apps/web && npm run build
npm run test:e2e:smoke
```

---

## Phase 6: Deprecation Cleanup (Day 5-6) 🧽

**Goal:** Update all deprecated API usages.

### apps/api - 16 Deprecated Instances

**Action:**
- [ ] Update deprecated Node.js APIs
- [ ] Update deprecated Express patterns
- [ ] Update deprecated Drizzle methods
- [ ] Update deprecated TypeScript features

### packages/* - 3 Deprecated Instances

**Action:**
- [ ] Update deprecated utilities
- [ ] Update type definitions

### Verification

```bash
npm run typecheck
npm run lint
```

---

## Phase 7: Duplication & Refactoring (Day 6) 🔄

**Goal:** DRY - Don't Repeat Yourself.

### Duplication Clusters (16 total)

| App | Clusters | Action |
|-----|----------|--------|
| apps/web | 3 | Extract shared logic |
| apps/api | 12 | Extract shared utilities |
| apps/worker | 0 | Clean |
| packages/* | 0 | Clean |

**Action:**
- Extract common logic to shared packages
- Create utility functions
- Use composition over duplication

### Facade Issues

- [ ] Fix 3 re-export facade issues in packages
- [ ] Fix 1 facade issue in apps/api

### Verification

```bash
desloppify show duplicates --path ./apps/web
desloppify show duplicates --path ./apps/api
```

---

## Phase 8: Subjective Review (Day 6-7) 🎨

**Goal:** LLM-powered subjective quality assessment.

### Run Subjective Review

```bash
cd apps/web && desloppify review --prepare
cd apps/api && desloppify review --prepare
cd apps/worker && desloppify review --prepare
cd packages && desloppify review --prepare
```

### Dimensions to Assess

- **Naming:** Variables, functions, classes follow conventions
- **Abstractions:** Proper abstraction levels
- **Module Boundaries:** Clear separation of concerns
- **Error Handling:** Consistent error handling patterns
- **Type Safety:** Proper TypeScript usage
- **Elegance:** Code readability and maintainability

### Expected Score Impact

Subjective dimensions are 75% of overall score. This phase should dramatically improve scores.

---

## Phase 9: Final Verification (Day 7) ✅

### Complete Rescan

```bash
desloppify --lang typescript scan --path ./apps/web --force-rescan
desloppify --lang typescript scan --path ./apps/api --force-rescan
desloppify --lang typescript scan --path ./apps/worker --force-rescan
desloppify --lang typescript scan --path ./packages --force-rescan
```

### Full Test Suite

```bash
npm run test
npm run lint
npm run typecheck
npm run build
npm run test:e2e:smoke
```

### Score Targets

| App | Before | After Target |
|-----|--------|--------------|
| apps/web | 20.4 | 75.0+ |
| apps/api | 21.0 | 75.0+ |
| apps/worker | 10.3 | 70.0+ |
| packages/* | 16.7 | 75.0+ |

---

## Daily Workflow

### Morning (Start of Day)

```bash
cd /home/ashoksainiengineer/ai-pandit-app
source .venv-desloppify/bin/activate

# Check status
desloppify status

# Get next task
desloppify next
```

### During Work

```bash
# Fix the issue
# ... edit code ...

# Resolve
desloppify resolve

# Get next task
desloppify next
```

### End of Day

```bash
# Rescan current app
desloppify scan --path ./apps/web

# Run tests
npm run test

# Check scores
desloppify status

# Commit progress
git add -A
git commit -m "fix(quality): [description of fixes]"
```

---

## Commands Reference

### Scan Commands

```bash
# Scan specific app
desloppify --lang typescript scan --path ./apps/web

# Force rescan
desloppify --lang typescript scan --path ./apps/web --force-rescan --attest "I understand..."

# Scan without badge
desloppify --lang typescript scan --path ./apps/web --no-badge
```

### Issue Commands

```bash
# Show all issues
desloppify show --path ./apps/web

# Show specific detector
desloppify show security --path ./apps/web
desloppify show unused --path ./apps/web
desloppify show orphaned --path ./apps/web
desloppify show smells --path ./apps/web
```

### Plan Commands

```bash
# View plan
desloppify plan

# View backlog
desloppify backlog

# Get next task
desloppify next

# Resolve current task
desloppify resolve
```

### Review Commands

```bash
# Prepare subjective review
desloppify review --prepare --path ./apps/web

# Run review
desloppify review --path ./apps/web
```

---

## Commit Strategy

**Commit Messages:**
```
fix(security): resolve XSS vulnerability in user input
fix(quality): remove unused imports and dead code
test(coverage): add unit tests for BTR engine
refactor(smells): extract reusable validation logic
docs(quality): update desloppify baseline scores
```

**Commit Frequency:**
- Every 2-3 hours or after completing a logical group of fixes
- Never commit broken code
- Always run tests before commit

---

## File Structure

```
ai-pandit-app/
├── .desloppify/              # State persistence (gitignored)
│   ├── plan.json            # Living plan
│   ├── state-typescript.json # Scan state
│   └── scorecard.png        # Latest scorecard
├── .venv-desloppify/        # Python virtual env (gitignored)
├── DESLOPPIFY.md            # This file
├── docs/
│   └── DESLOPPIFY_BASELINE_REPORT.md
├── apps/
│   ├── web/                 # Next.js frontend
│   ├── api/                 # Express backend
│   └── worker/              # Background worker
└── packages/
    ├── db/                  # Database schema
    └── shared/              # Shared utilities
```

---

## Progress Tracking

### Day 1: Security + Dead Code
- [ ] Security issues: 22 → 0
- [ ] Unused code: 228 → 0
- [ ] Orphaned files: 213 → 0

### Day 2-3: Test Coverage
- [ ] apps/web tests: 15.5% → 40%
- [ ] apps/api tests: 47.8% → 60%
- [ ] apps/worker tests: 0% → 50%
- [ ] packages tests: 50.2% → 70%

### Day 4-5: Code Smells + React
- [ ] apps/web smells: 158 → 50
- [ ] apps/api smells: 203 → 50
- [ ] React anti-patterns: 6 → 0

### Day 6: Deprecation + Duplication
- [ ] Deprecated: 19 → 0
- [ ] Duplication: 16 → 5

### Day 7: Subjective + Verification
- [ ] Subjective review complete
- [ ] All scores > 70.0
- [ ] All tests passing
- [ ] CI/CD green

---

## Success Criteria

✅ **Security:** 100% clean across all apps  
✅ **Tests:** apps/web > 60%, apps/api > 70%, worker > 70%, packages > 80%  
✅ **Unused Code:** Zero unused imports, variables, or orphaned files  
✅ **Code Smells:** < 50 per app  
✅ **Deprecated:** Zero deprecated API usage  
✅ **Build:** All apps build successfully  
✅ **Tests:** Full test suite passes  
✅ **Score:** Overall > 70.0 for all apps  
✅ **CI/CD:** Quality gate passes on every push  

---

## Notes

- **State Persistence:** `.desloppify/` contains scan state. Never delete it.
- **Virtual Environment:** Always activate `.venv-desloppify` before running desloppify
- **Monorepo:** Each app scanned independently. Don't mix states.
- **Scoring:** Subjective review is 75% of score. Don't ignore it.
- **Cascade Effects:** Fixing one issue may surface others. Expect temporary score drops.
- **Patience:** Quality transformation takes time. Follow the plan.

---

**Last Updated:** 2026-04-30  
**Next Review:** After each phase completion  
**Owner:** Full-stack engineering team
