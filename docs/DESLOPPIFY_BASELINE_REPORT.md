# Desloppify Baseline Quality Report

**Generated:** 2026-04-30  
**Project:** ai-pandit-app  
**Target Score:** 85.0/100 (Production-Grade)

---

## Executive Summary

Desloppify has been integrated into the ai-pandit-app monorepo to systematically improve codebase quality. This report establishes baseline scores for each application and identifies priority improvement areas.

### Overall Project Health

| App | Overall | Objective | Strict | Issues | Status |
|-----|---------|-----------|--------|--------|--------|
| **apps/web** | 20.4/100 | 81.6/100 | 20.4/100 | 717 | 🔴 Needs Work |
| **apps/api** | 21.0/100 | 83.9/100 | 21.0/100 | 578 | 🔴 Needs Work |
| **apps/worker** | 10.3/100 | 41.2/100 | 10.3/100 | 26 | 🔴 Critical |
| **packages/** | 16.7/100 | 66.7/100 | 16.7/100 | 52 | 🔴 Needs Work |

**Note:** Low overall scores are primarily due to unassessed subjective dimensions (75% of score weight). Objective (mechanical) scores are significantly higher, indicating the codebase has solid mechanical quality but needs subjective review.

---

## Detailed App Analysis

### 1. apps/web (Next.js Frontend)

**Score Breakdown:**

| Dimension | Health | Strict | Issues | Tier | Priority |
|-----------|--------|--------|--------|------|----------|
| File health | 95.2% | 95.2% | 18 | T3 | Low |
| Code quality | 84.8% | 84.8% | 404 | T3 | Medium |
| Duplication | 99.9% | 99.9% | 1 | T3 | Low |
| Security | 98.9% | 98.9% | 11 | T4 | High |
| Test health | 15.5% | 15.5% | 205 | T4 | Critical |

**Key Findings:**
- ⚠️ **11 security issues** — Review before other cleanup
- 🔴 **Test health at 15.5%** — Major test coverage gaps (2753 production files)
- 🔴 **404 code quality issues** — Unused imports, dead code, complexity
- 🟡 **161 unused (tsc) instances** — TypeScript compilation issues
- 🟡 **20 structural issues** — Complexity, overloaded directories
- 🟡 **24 single-use code instances** — Potential abstraction opportunities
- 🟡 **111 orphaned files** — Zero importers, may be dead code
- 🟡 **158 code smell issues** — 4 React state sync anti-patterns, 2 boolean state explosions
- 🟡 **3 duplicate clusters** — Code duplication

**Top Priority Actions:**
1. Review 11 security issues immediately
2. Add test coverage (205 missing tests)
3. Remove/fix 161 unused TypeScript instances
4. Refactor React state sync anti-patterns

---

### 2. apps/api (Express Backend)

**Score Breakdown:**

| Dimension | Health | Strict | Issues | Tier | Priority |
|-----------|--------|--------|--------|------|----------|
| File health | 90.4% | 90.4% | 24 | T3 | Low |
| Code quality | 78.7% | 78.7% | 295 | T3 | Medium |
| Duplication | 99.6% | 99.6% | 3 | T3 | Low |
| Security | 98.3% | 98.3% | 10 | T4 | High |
| Test health | 47.8% | 47.8% | 101 | T4 | High |

**Key Findings:**
- ⚠️ **10 security issues** — Review before other cleanup
- 🟡 **Test health at 47.8%** — Significant test coverage gaps (2310 production files)
- 🟡 **295 code quality issues** — Unused imports, dead code
- 🟡 **62 unused (tsc) instances** — TypeScript compilation issues
- 🟡 **27 structural issues** — Complexity, overloaded directories
- 🟡 **16 deprecated instances** — Deprecated API usage
- 🟡 **100 orphaned files** — Zero importers, may be dead code
- 🟡 **203 code smell issues** — Various code smells
- 🟡 **12 duplicate clusters** — Code duplication

**Top Priority Actions:**
1. Review 10 security issues immediately
2. Add test coverage (101 missing tests)
3. Remove/fix 62 unused TypeScript instances
4. Update 16 deprecated usages

---

### 3. apps/worker (Background Job Processor)

**Score Breakdown:**

| Dimension | Health | Strict | Issues | Tier | Priority |
|-----------|--------|--------|--------|------|----------|
| File health | 100.0% | 100.0% | 0 | T3 | Excellent |
| Code quality | 58.9% | 58.9% | 5 | T3 | Medium |
| Duplication | 100.0% | 100.0% | 0 | T3 | Excellent |
| Security | 100.0% | 100.0% | 0 | T4 | Excellent |
| Test health | 0.0% | 0.0% | 1 | T4 | Critical |

**Key Findings:**
- 🔴 **Test health at 0.0%** — No tests (11 production files)
- 🟡 **5 code quality issues** — Minor issues
- 🟡 **1 orphaned file** — Zero importers
- ✅ **Security: Clean** — No security issues
- ✅ **Duplication: Excellent** — No duplicates

**Top Priority Actions:**
1. Add tests for all 11 production files
2. Fix 5 code quality issues
3. Review orphaned file

---

### 4. packages/* (Shared Packages)

**Score Breakdown:**

| Dimension | Health | Strict | Issues | Tier | Priority |
|-----------|--------|--------|--------|------|----------|
| File health | 80.9% | 80.9% | 3 | T3 | Medium |
| Code quality | 83.1% | 83.1% | 17 | T3 | Medium |
| Duplication | 100.0% | 100.0% | 0 | T3 | Excellent |
| Security | 95.0% | 95.0% | 1 | T4 | High |
| Test health | 50.2% | 50.2% | 4 | T4 | Medium |

**Key Findings:**
- ⚠️ **1 security issue** — Review before other cleanup
- 🟡 **4 missing tests** — 162 production files
- 🟡 **17 code quality issues** — Minor issues
- 🟡 **3 deprecated instances** — Deprecated API usage
- 🟡 **2 re-export facade issues** — Package structure
- ✅ **Duplication: Excellent** — No duplicates

**Top Priority Actions:**
1. Review 1 security issue
2. Add test coverage
3. Fix deprecated usages

---

## Cross-Cutting Issues

### Security Issues (Total: 22 across all apps)
| App | Security Issues | Severity |
|-----|----------------|----------|
| apps/web | 11 | T4 |
| apps/api | 10 | T4 |
| apps/worker | 0 | Clean |
| packages/* | 1 | T4 |

**Action Required:** Security audit before production deployment.

### Test Coverage (Total: 311 missing tests)
| App | Missing Tests | Production Files | Coverage % |
|-----|--------------|------------------|------------|
| apps/web | 205 | 2753 | 15.5% |
| apps/api | 101 | 2310 | 47.8% |
| apps/worker | 1 | 11 | 0.0% |
| packages/* | 4 | 162 | 50.2% |

**Action Required:** Comprehensive test suite development.

### Unused Code (Total: 227 instances)
| App | Unused (tsc) | Orphaned Files | Dead Exports |
|-----|-------------|----------------|--------------|
| apps/web | 161 | 111 | 0 |
| apps/api | 62 | 100 | 0 |
| apps/worker | 1 | 1 | 0 |
| packages/* | 4 | 1 | 0 |

**Action Required:** Code cleanup and dead code removal.

---

## Improvement Roadmap

### Phase 1: Security & Critical (Week 1)
- [ ] Review and fix all 22 security issues
- [ ] Add tests for apps/worker (0% coverage)
- [ ] Fix React state sync anti-patterns in apps/web

### Phase 2: Test Coverage (Weeks 2-3)
- [ ] Add tests for apps/web (target: 60%)
- [ ] Add tests for apps/api (target: 70%)
- [ ] Add tests for packages/* (target: 80%)

### Phase 3: Code Quality (Weeks 4-5)
- [ ] Remove unused code (227 instances)
- [ ] Fix code smell issues (364 total)
- [ ] Refactor complex functions
- [ ] Update deprecated usages (19 instances)

### Phase 4: Subjective Review (Week 6+)
- [ ] Run `desloppify review --prepare` for each app
- [ ] Assess naming conventions
- [ ] Evaluate abstractions and module boundaries
- [ ] Review error handling patterns

---

## How to Use Desloppify

### Daily Workflow
```bash
# Navigate to project
cd /home/ashoksainiengineer/ai-pandit-app

# Activate virtual environment
source .venv-desloppify/bin/activate

# Check status
desloppify status

# Get next task
desloppify next

# After fixing, resolve
desloppify resolve

# Rescan to verify
desloppify scan --path ./apps/web
```

### Per-App Scanning
```bash
# Frontend
desloppify --lang typescript scan --path ./apps/web

# Backend
desloppify --lang typescript scan --path ./apps/api

# Worker
desloppify --lang typescript scan --path ./apps/worker

# Shared packages
desloppify --lang typescript scan --path ./packages
```

### Reviewing Issues
```bash
# Show all issues for a detector
desloppify show unused

# Show security issues
desloppify show security

# View plan
desloppify plan

# View backlog
desloppify backlog
```

---

## Score Targets

| App | Current | Target (3 months) | Target (6 months) |
|-----|---------|-------------------|-------------------|
| apps/web | 20.4 | 60.0 | 85.0 |
| apps/api | 21.0 | 65.0 | 85.0 |
| apps/worker | 10.3 | 70.0 | 85.0 |
| packages/* | 16.7 | 70.0 | 85.0 |

---

## Notes

- **Subjective Dimensions:** The low overall scores are primarily due to unassessed subjective dimensions (75% weight). Run `desloppify review --prepare` to assess these.
- **State Persistence:** Progress is saved in `.desloppify/` directory. Do not commit this directory.
- **Monorepo Support:** Each app is scanned separately to maintain independent state and accurate scoring.
- **CI/CD Integration:** Quality gate workflow is configured in `.github/workflows/desloppify-quality-gate.yml`.

---

**Next Steps:**
1. Review security issues (`desloppify show security`)
2. Run `desloppify next` to start fixing issues
3. Set up weekly scan schedule
4. Track progress in this document
