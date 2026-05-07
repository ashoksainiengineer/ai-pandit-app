# 🎭 E2E Test Suite - Critical User Flows

Playwright-based end-to-end tests for pre-shipment validation.

## Setup

```bash
# Install Playwright
npm install -D @playwright/test
npx playwright install chromium

# Run tests
npm run test:e2e
```

## Test Coverage

### Flow 1: Authentication
- Sign up with Clerk
- Sign in
- Session persistence
- Sign out

### Flow 2: Birth Data Collection
- Step 1: Birth details
- Step 2: Life events
- Step 3: Review & submit

### Flow 3: Analysis
- Submit for analysis
- Stream progress
- Cancel analysis
- View results

### Flow 4: Dashboard
- View sessions
- Favorite/unfavorite
- Clone session
- Delete session

## Environment Variables

```bash
TEST_BASE_URL=http://localhost:3000
TEST_API_URL=http://localhost:3001
TEST_CLERK_KEY=pk_test_...
```