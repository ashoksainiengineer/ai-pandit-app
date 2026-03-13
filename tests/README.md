# 🧪 AI-Pandit Test Suite

Complete testing infrastructure for the AI-Pandit monorepo.

## 📁 Directory Structure

```
tests/
├── performance/          # Load and stress tests (k6)
│   ├── load-test.js
│   └── stress-test.js
├── security/             # Security scanning and tests
│   ├── security-scan.sh
│   ├── api-security.test.ts
│   └── fuzzing.test.ts
├── visual/               # Visual regression tests (Playwright)
│   ├── landing-page.visual.spec.ts
│   └── rectify-flow.visual.spec.ts
├── utils/                # Test utilities and factories
│   ├── test-helpers.ts
│   └── test-factories.ts
└── README.md            # This file
```

## 🚀 Quick Start

```bash
# Install dependencies (run from root)
npm install

# Run all tests
npm run test

# Run specific test types
npm run test:unit
npm run test:integration
npm run test:e2e

# Run with coverage
npm run test:coverage
```

## 📊 Test Types

### 1. Unit Tests
Located in `apps/*/src/**/__tests__/*.test.ts`

### 2. Integration Tests
Located in `apps/*/src/**/__tests__/*.integration.test.ts`

### 3. E2E Tests
Located in `e2e/*.spec.ts`

### 4. Performance Tests
Located in `tests/performance/*.js`

Run with k6:
```bash
k6 run tests/performance/load-test.js
```

### 5. Security Tests
Located in `tests/security/*.test.ts`

Run security scan:
```bash
./tests/security/security-scan.sh --all
```

### 6. Visual Regression Tests
Located in `tests/visual/*.spec.ts`

Run visual tests:
```bash
npx playwright test --config=playwright.visual.config.ts
```

## 🛠️ Test Utilities

Use the provided utilities for consistent testing:

```typescript
import { UserFactory, SessionFactory } from '../utils/test-factories';
import { wait, retry, measurePerformance } from '../utils/test-helpers';

// Create test data
const user = UserFactory.create({ role: 'admin' });
const session = SessionFactory.createCompleted();

// Use helpers
await wait(1000);
const { result, duration } = await measurePerformance(async () => {
    return await someAsyncOperation();
});
```

## 📝 Writing Tests

Follow the AAA pattern:

```typescript
import { describe, it, expect } from 'vitest';

describe('Feature Name', () => {
    it('should do something specific', () => {
        // Arrange
        const input = { ... };
        
        // Act
        const result = functionUnderTest(input);
        
        // Assert
        expect(result).toEqual(expected);
    });
});
```

## 🔧 Configuration Files

- `playwright.config.ts` - E2E test configuration
- `playwright.visual.config.ts` - Visual regression config
- `stryker.config.mjs` - Mutation testing config
- `package.json` - Test scripts and dependencies

## 📈 CI/CD

Tests run automatically on:
- Push to main/develop branches
- Pull requests
- Scheduled daily runs

See `.github/workflows/test-pipeline.yml`

## 📚 Documentation

- [Testing Strategy](../docs/TESTING_STRATEGY.md)
- [Local Testing Guide](../docs/LOCAL_TESTING_GUIDE.md)
