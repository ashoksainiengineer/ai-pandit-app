# 🧪 AI-Pandit Testing Strategy

> **Production-Ready Testing Documentation**  
> Version: 1.0 | Last Updated: 2026-03-13

---

## 📋 Table of Contents

1. [Testing Philosophy](#testing-philosophy)
2. [Test Pyramid](#test-pyramid)
3. [Test Categories](#test-categories)
4. [Running Tests](#running-tests)
5. [CI/CD Integration](#cicd-integration)
6. [Coverage Requirements](#coverage-requirements)
7. [Best Practices](#best-practices)

---

## 🎯 Testing Philosophy

Our testing strategy follows industry standards:

- **F.I.R.S.T Principles**: Fast, Isolated, Repeatable, Self-validating, Timely
- **AAA Pattern**: Arrange, Act, Assert
- **Test Pyramid**: Heavy on unit tests, moderate integration, light E2E
- **Shift-Left**: Find bugs early in development

---

## 📊 Test Pyramid

```
    ╱╲
   ╱  ╲     E2E Tests (5-10%)
  ╱────╲
 ╱      ╲   Integration Tests (20-30%)
╱────────╲
╲────────╱   Unit Tests (60-70%)
 ╲      ╱
  ╲────╱
   ╲  ╱
    ╲╱
```

### Target Distribution

| Level | Percentage | Count (Approx) | Purpose |
|-------|-----------|----------------|---------|
| Unit | 60-70% | 500+ | Test individual functions/components |
| Integration | 20-30% | 150+ | Test module interactions |
| E2E | 5-10% | 50+ | Test complete user flows |

---

## 🧪 Test Categories

### 1. Unit Tests (`**/*.test.ts`)

**Purpose**: Test individual functions, classes, and components in isolation.

**Location**:
```
apps/api/src/**/__tests__/*.test.ts
apps/web/**/__tests__/*.test.ts
packages/*/src/**/__tests__/*.test.ts
```

**Tools**: Vitest, @testing-library/react

**Run**:
```bash
# All unit tests
npm run test

# Specific app
npm -w @ai-pandit/api run test
npm -w @ai-pandit/web run test

# Watch mode
npm run test:watch
```

**Example**:
```typescript
// apps/api/src/lib/__tests__/calculator.test.ts
import { describe, it, expect } from 'vitest';
import { calculateChart } from '../calculator';

describe('Chart Calculator', () => {
    it('should calculate sun position correctly', () => {
        // Arrange
        const input = { date: '1990-05-15', time: '12:00:00', lat: 19.076, lng: 72.877 };
        
        // Act
        const result = calculateChart(input);
        
        // Assert
        expect(result.sun.longitude).toBeCloseTo(45.5, 1);
    });
});
```

---

### 2. Integration Tests (`tests/integration/*.test.ts`)

**Purpose**: Test interactions between modules, API endpoints, database.

**Location**:
```
tests/integration/api.integration.test.ts
tests/integration/db.integration.test.ts
```

**Run**:
```bash
npm run test:integration
npm run test:api:integration
npm run test:db:integration
```

---

### 3. E2E Tests (`e2e/*.spec.ts`)

**Purpose**: Test complete user journeys through the UI.

**Location**:
```
e2e/smoke.spec.ts
e2e/core-flow.spec.ts
e2e/dashboard.spec.ts
```

**Tools**: Playwright

**Run**:
```bash
# All E2E tests
npm run test:e2e

# Smoke tests only
npm run test:e2e:smoke

# With UI
npm run test:e2e:ui

# Multi-browser
npm run test:e2e:full
```

---

### 4. Performance Tests (`tests/performance/*.js`)

**Purpose**: Load testing, stress testing, capacity validation.

**Location**:
```
tests/performance/load-test.js
tests/performance/stress-test.js
```

**Tools**: k6

**Run**:
```bash
# Load test
npm run test:load

# Stress test
npm run test:stress

# Capacity validation
npm run test:capacity
```

**Thresholds**:
- 95th percentile response time < 2s
- Error rate < 1%
- Throughput > 100 RPS

---

### 5. Security Tests (`tests/security/*.test.ts`)

**Purpose**: Security vulnerability scanning.

**Location**:
```
tests/security/api-security.test.ts
tests/security/fuzzing.test.ts
```

**Run**:
```bash
npm run test:security
./tests/security/security-scan.sh
```

**Coverage**:
- OWASP Top 10
- SQL Injection
- XSS
- CSRF
- Authentication/Authorization

---

### 6. Visual Regression Tests (`tests/visual/*.spec.ts`)

**Purpose**: Detect unintended UI changes.

**Location**:
```
tests/visual/landing-page.visual.spec.ts
tests/visual/rectify-flow.visual.spec.ts
```

**Run**:
```bash
npx playwright test --config=playwright.visual.config.ts
```

---

### 7. Accessibility Tests (`e2e/a11y.spec.ts`)

**Purpose**: Ensure WCAG 2.1 AA compliance.

**Run**:
```bash
npm run test:e2e:a11y
```

**Tools**: @axe-core/playwright

---

### 8. Mutation Testing

**Purpose**: Verify test quality by introducing mutations.

**Run**:
```bash
npm run test:mutation
```

**Tools**: Stryker

**Threshold**: >50% mutation score

---

## 🚀 Running Tests

### Quick Reference

```bash
# Full test suite (CI)
npm run test:ci

# Full test suite with all checks
npm run test:ci:full

# Development - fast feedback
npm run test
npm run test:watch

# Specific test types
npm run test:unit
npm run test:integration
npm run test:e2e:smoke

# With coverage
npm run test:coverage
```

### Pre-commit Hooks

Tests run automatically on commit via husky:

```bash
# Install hooks
npx husky install

# Hooks configured in package.json lint-staged
```

---

## 🔁 CI/CD Integration

### GitHub Actions Pipeline

See [`.github/workflows/test-pipeline.yml`](../.github/workflows/test-pipeline.yml)

**Stages**:
1. Lint & TypeCheck
2. Unit Tests (parallel per app)
3. Security Scanning
4. E2E Tests
5. Performance Tests (scheduled)
6. Accessibility Tests
7. Deploy Readiness

**Triggers**:
- Push to main/develop
- Pull requests
- Daily scheduled runs

---

## 📈 Coverage Requirements

| Category | Minimum | Target |
|----------|---------|--------|
| Lines | 70% | 85% |
| Functions | 70% | 80% |
| Branches | 60% | 75% |
| Statements | 70% | 85% |

### View Coverage

```bash
# Generate reports
npm run test:coverage

# Open HTML report
open apps/api/coverage/index.html
```

---

## ✅ Best Practices

### Naming Conventions

```typescript
// Good
describe('UserService', () => {
    describe('createUser', () => {
        it('should create a new user with valid input', () => {
            // test
        });
        
        it('should throw error for duplicate email', () => {
            // test
        });
    });
});

// Bad
describe('test user', () => {
    it('works', () => {
        // test
    });
});
```

### Test Structure (AAA)

```typescript
it('should calculate chart correctly', () => {
    // Arrange
    const calculator = new ChartCalculator();
    const input = createValidInput();
    
    // Act
    const result = calculator.calculate(input);
    
    // Assert
    expect(result.sunSign).toBe('Taurus');
    expect(result.ascendant).toBeDefined();
});
```

### Mocking

```typescript
// Use vi.mock for modules
vi.mock('../lib/ephemeris', () => ({
    calculateEphemeris: vi.fn().mockResolvedValue({ sun: 45.5 }),
}));

// Use vi.fn for functions
const mockFn = vi.fn().mockReturnValue('mocked');
```

### Test Data Factories

```typescript
import { SessionFactory, UserFactory } from '../utils/test-factories';

// Use factories for consistent test data
const user = UserFactory.create({ role: 'admin' });
const session = SessionFactory.createSubmitted();
```

### Async Testing

```typescript
// Use async/await
it('should fetch data', async () => {
    const result = await fetchData();
    expect(result).toEqual(expected);
});

// Handle rejections
it('should throw on error', async () => {
    await expect(fetchData()).rejects.toThrow('Network error');
});
```

---

## 🛠️ Test Utilities

### Test Factories

Located in `tests/utils/test-factories.ts`:

- `UserFactory` - Create test users
- `SessionFactory` - Create test sessions
- `CalculationFactory` - Create test calculations
- `ChartDataFactory` - Create chart input data

### Test Helpers

Located in `tests/utils/test-helpers.ts`:

- `wait()` - Async delay
- `retry()` - Retry async operations
- `measurePerformance()` - Performance measurement
- `loginUser()` - E2E login helper

---

## 📚 Additional Resources

- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [k6 Documentation](https://k6.io/docs/)
- [Stryker Documentation](https://stryker-mutator.io/)
- [Testing Trophy](https://kentcdodds.com/blog/the-testing-trophy-and-testing-classifications)

---

## 🆘 Troubleshooting

### Common Issues

**Tests timeout in CI**
```bash
# Increase timeout
npm run test -- --testTimeout=60000
```

**Coverage not generating**
```bash
# Ensure coverage provider is configured
# Check vitest.config.ts for coverage settings
```

**E2E tests flaky**
- Add explicit waits
- Use data-testid attributes
- Increase retry count in config

---

## 🤝 Contributing

When adding new tests:

1. Follow the AAA pattern
2. Use descriptive test names
3. Clean up after tests (use `afterEach`)
4. Update this documentation if adding new test types

---

*This document is a living document. Please keep it updated as the testing strategy evolves.*
