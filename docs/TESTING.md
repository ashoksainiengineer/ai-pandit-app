# Testing Guide

## Quick Start

| Command | Description |
|---------|-------------|
| `npm test` | Run all unit tests (turbo) |
| `npm run test:integration` | Run integration tests (API + DB + Ephemeris) |
| `npm run test:e2e:smoke` | Run Playwright E2E smoke tests |
| `npm run test:ci` | Full CI pipeline: lint + unit + integration + e2e + coverage |
| `npm run test:coverage` | Run tests with coverage reports |

## Test DB Setup

1. Start test services:
   ```bash
   docker compose -f docker-compose.test.yml up -d
   ```

2. Run migrations:
   ```bash
   npm -w @ai-pandit/db run db:push
   ```

3. Run tests against test DB:
   ```bash
   NEON_DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5433/ai_pandit_test \
   npm run test:integration
   ```

## Writing Tests

### API Route Test

```typescript
import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../index';

describe('POST /api/sessions', () => {
  it('should create a new session with valid birth data', async () => {
    const response = await request(app)
      .post('/api/sessions')
      .send({
        fullName: 'Test User',
        dateOfBirth: '1990-01-15',
        tentativeTime: '10:30',
        birthPlace: 'New Delhi, India',
        latitude: 28.6139,
        longitude: 77.2090,
        timezone: 'Asia/Kolkata',
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('id');
    expect(response.body.status).toBe('draft');
  });
});
```

### Component Test

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DashboardPage } from '@/app/dashboard/page';

describe('DashboardPage', () => {
  it('renders session list when sessions exist', () => {
    render(<DashboardPage sessions={mockSessions} />);
    expect(screen.getByText('Your Sessions')).toBeInTheDocument();
  });

  it('shows empty state when no sessions', () => {
    render(<DashboardPage sessions={[]} />);
    expect(screen.getByText(/no sessions yet/i)).toBeInTheDocument();
  });
});
```

### Integration Test

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { db } from '@ai-pandit/db';
import { users } from '@ai-pandit/db/schema';

describe('Database Integration', () => {
  beforeAll(async () => {
    // Ensure test DB is ready
  });

  afterAll(async () => {
    // Clean up test data
    await db.delete(users);
  });

  it('should insert and retrieve a user', async () => {
    const user = {
      id: 'test-1',
      clerkId: 'clerk-test-1',
      email: 'test@example.com',
    };

    await db.insert(users).values(user);
    const result = await db
      .select()
      .from(users)
      .where(eq(users.id, 'test-1'));

    expect(result).toHaveLength(1);
    expect(result[0].email).toBe('test@example.com');
  });
});
```

## Coverage

- **Target**: 70%+ for API, 80%+ for DB
- **Run**: `npm run test:coverage`
- **Merge reports**: `npm run test:coverage:merge`
- **Threshold check**: `npm run test:coverage:threshold`

## Advanced Testing

| Command | Description |
|---------|-------------|
| `npm run test:security` | Security scan (API + Dependencies) |
| `npm run test:performance` | Load + Stress + Capacity tests |
| `npm run test:mutation` | Stryker mutation testing |
| `npm run test:e2e:a11y` | Accessibility tests |
| `npm run test:e2e:visual` | Visual regression tests |
| `npm run test:btr` | BTR algorithm test runner |

## CI/CD

GitHub Actions runs the full test pipeline on every PR and push to main/develop:

1. **Lint & TypeCheck** — ESLint + TypeScript
2. **Python Ephemeris Tests** — pytest for Skyfield service
3. **Unit Tests** — Vitest matrix (api, web, db, shared, worker)
4. **Integration Tests** — Docker Postgres + Redis
5. **Security Scan** — npm audit, CodeQL, Snyk
6. **E2E Tests** — Playwright smoke tests
7. **Performance Tests** — k6 load/stress (scheduled + main only)
8. **Accessibility Tests** — axe-core via Playwright
9. **Mutation Testing** — Stryker (scheduled only)
10. **Deploy Readiness** — Build verification (main only)
