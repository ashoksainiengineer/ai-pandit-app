# Industry-Standard Test Suite Guide for AI-Pandit

## Test Architecture Overview

```
tests/
├── unit/                    # Unit tests (no external deps)
│   ├── ephemeris/
│   ├── btr/
│   ├── session/
│   └── utils/
├── integration/             # Integration tests (with real deps)
│   ├── ephemeris/
│   ├── btr/
│   └── api/
├── contract/               # Contract tests (API boundaries)
│   ├── ephemeris/
│   └── shared/
├── performance/            # Performance benchmarks
│   ├── ephemeris/
│   └── btr/
├── e2e/                    # End-to-end tests
│   └── btr-flow/
└── fixtures/               # Test data
    ├── charts/
    ├── events/
    └── profiles/
```

## Industry Standards Applied

### 1. AAA Pattern (Arrange-Act-Assert)
```typescript
it('should calculate correct ascendant for Delhi at noon', async () => {
  // Arrange
  const input = createBirthInput({ lat: 28.6139, lng: 77.2090, time: '12:00:00' });
  
  // Act
  const result = await calculateEphemeris(input);
  
  // Assert
  expect(result.ascendant.sign).toBe('Cancer');
  expect(result.ascendant.longitude).toBeCloseTo(105.5, 1);
});
```

### 2. Given-When-Then Naming
```typescript
describe('Given a birth chart with Sun in Aries', () => {
  describe('When calculating dignities', () => {
    it('Then should return exalted status', () => {});
  });
});
```

### 3. Independent Tests (No Shared State)
- Each test creates its own fixtures
- No test depends on another test
- Database state cleaned after each test

### 4. Test Pyramid
- 70% Unit tests (fast, isolated)
- 20% Integration tests (with real deps)
- 10% E2E tests (full flow)

### 5. F.I.R.S.T Principles
- **F**ast: Unit tests < 50ms
- **I**ndependent: No test order dependency
- **R**epeatable: Same results every run
- **S**elf-validating: Boolean pass/fail
- **T**imely: Written with code

## Test Categories

### Category 1: Contract Tests (CRITICAL)
Verify API contracts between services

### Category 2: Numerical Accuracy Tests (CRITICAL)
Verify calculations against ground truth (JPL HORIZONS)

### Category 3: Business Logic Tests
Verify BTR pipeline, Vedic calculations, AI integration

### Category 4: Performance Tests
Verify response times under load

### Category 5: Resilience Tests
Verify error handling, fallbacks, timeouts

### Category 6: Security Tests
Verify input validation, injection protection

## Test Data Strategy

### Fixtures
- **Golden Charts**: Known accurate birth charts
- **Edge Cases**: Polar regions, DST transitions, leap years
- **Synthetic Data**: Generated for load testing
- **Historical Data**: Famous personalities charts

### Mock Strategy
- External APIs (AI service): Mocked
- Database: Real (isolated test DB)
- Ephemeris Service: Both real and mocked

## Coverage Requirements

- **Lines**: > 80%
- **Functions**: > 85%
- **Branches**: > 75%
- **Critical Paths**: 100%

## Naming Conventions

### Files
- `*.unit.test.ts` - Unit tests
- `*.integration.test.ts` - Integration tests
- `*.contract.test.ts` - Contract tests
- `*.performance.test.ts` - Performance tests
- `*.e2e.test.ts` - End-to-end tests

### Test Names
```typescript
// Good
describe('EphemerisService', () => {
  describe('calculateChart', () => {
    it('should return all 9 planets with correct longitudes', () => {});
    it('should throw ValidationError for invalid latitude', () => {});
    it('should handle leap year birthdays correctly', () => {});
  });
});

// Bad
describe('test', () => {
  it('works', () => {});
  it('test1', () => {});
});
```

## Running Tests

```bash
# Unit tests only
npm run test:unit

# Integration tests
npm run test:integration

# Contract tests
npm run test:contract

# Performance tests
npm run test:performance

# Full suite
npm run test:full

# With coverage
npm run test:coverage

# Watch mode
npm run test:watch
```
