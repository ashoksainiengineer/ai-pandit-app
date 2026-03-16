import { test, expect } from '@playwright/test';

test.describe('Critical User Flows', () => {
  const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';
  const TEST_EMAIL = `test_${Date.now()}@example.com`;
  
  test.describe('Flow 1: Authentication', () => {
    test('should complete full auth flow', async ({ page }) => {
      await page.goto(`${BASE_URL}/sign-up`);
      
      await expect(page).toHaveURL(/sign-up/);
      
      await page.fill('input[name="emailAddress"]', TEST_EMAIL);
      await page.fill('input[name="password"]', 'TestPassword123!');
      await page.click('button[type="submit"]');
      
      await page.waitForURL(/dashboard/, { timeout: 10000 });
      await expect(page).toHaveURL(/dashboard/);
      
      const dashboardText = await page.textContent('h1');
      expect(dashboardText).toContain('Dashboard');
      
      await page.click('text=Sign out');
      await page.waitForURL(/sign-in/);
      await expect(page).toHaveURL(/sign-in/);
      
      await page.fill('input[name="emailAddress"]', TEST_EMAIL);
      await page.fill('input[name="password"]', 'TestPassword123!');
      await page.click('button[type="submit"]');
      
      await page.waitForURL(/dashboard/);
      await expect(page).toHaveURL(/dashboard/);
      
      const cookies = await page.context().cookies();
      const sessionCookie = cookies.find(c => c.name.includes('session'));
      expect(sessionCookie).toBeDefined();
      
      await page.reload();
      await expect(page).toHaveURL(/dashboard/);
    });

    test('should handle auth errors gracefully', async ({ page }) => {
      await page.goto(`${BASE_URL}/sign-in`);
      
      await page.fill('input[name="emailAddress"]', 'wrong@email.com');
      await page.fill('input[name="password"]', 'wrongpassword');
      await page.click('button[type="submit"]');
      
      await expect(page.locator('text=Invalid credentials')).toBeVisible();
      await expect(page).toHaveURL(/sign-in/);
    });

    test('should protect authenticated routes', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard`);
      await expect(page).toHaveURL(/sign-in/);
      
      await page.goto(`${BASE_URL}/rectify/new`);
      await expect(page).toHaveURL(/sign-in/);
    });
  });

  test.describe('Flow 2: Birth Data Collection', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${BASE_URL}/sign-in`);
      await page.fill('input[name="emailAddress"]', TEST_EMAIL);
      await page.fill('input[name="password"]', 'TestPassword123!');
      await page.click('button[type="submit"]');
      await page.waitForURL(/dashboard/);
    });

    test('should complete 5-step birth data collection', async ({ page }) => {
      await page.goto(`${BASE_URL}/rectify/new`);
      
      await page.waitForSelector('text=Birth Details');
      
      await page.fill('input[name="fullName"]', 'Lata Mangeshkar');
      await page.fill('input[name="dateOfBirth"]', '1929-09-28');
      await page.fill('input[name="tentativeTime"]', '22:30');
      await page.fill('input[name="birthPlace"]', 'Indore');
      await page.selectOption('select[name="gender"]', 'female');
      
      const autocomplete = page.locator('. birthplace-autocomplete-item').first();
      if (await autocomplete.isVisible().catch(() => false)) {
        await autocomplete.click();
      }
      
      await page.click('button:has-text("Next")');
      
      await page.waitForSelector('text=Forensic Traits');
      await page.click('button:has-text("Medium")');
      await page.click('button:has-text("Round")');
      await page.click('button:has-text("Wheatish")');
      
      await page.click('button:has-text("Next")');
      
      await page.waitForSelector('text=Physical Traits');
      await page.click('button:has-text("Average")');
      await page.click('button:has-text(" Slim")');
      
      await page.click('button:has-text("Next")');
      
      await page.waitForSelector('text=Life Events');
      await page.click('button:has-text("Add Event")');
      await page.fill('input[name="eventYear"]', '1942');
      await page.fill('textarea[name="eventDescription"]', 'First major song recording');
      await page.click('button:has-text("Save Event")');
      
      await page.click('button:has-text("Next")');
      
      await page.waitForSelector('text=Review');
      await expect(page.locator('text=Lata Mangeshkar')).toBeVisible();
      await expect(page.locator('text=1929-09-28')).toBeVisible();
      await expect(page.locator('text=Indore')).toBeVisible();
      
      await page.click('button:has-text("Submit for Analysis")');
      
      await page.waitForURL(/rectify\/[\w-]+/);
      await expect(page.locator('text=Analysis')).toBeVisible();
    });

    test('should auto-save draft and resume', async ({ page }) => {
      await page.goto(`${BASE_URL}/rectify/new`);
      
      await page.fill('input[name="fullName"]', 'Draft Test User');
      await page.fill('input[name="dateOfBirth"]', '1990-01-01');
      
      await page.waitForTimeout(4000);
      
      await page.goto(`${BASE_URL}/dashboard`);
      await page.goto(`${BASE_URL}/rectify/new`);
      
      await expect(page.locator('input[name="fullName"]')).toHaveValue('Draft Test User');
      await expect(page.locator('input[name="dateOfBirth"]')).toHaveValue('1990-01-01');
    });

    test('should validate required fields', async ({ page }) => {
      await page.goto(`${BASE_URL}/rectify/new`);
      
      await page.click('button:has-text("Next")');
      
      await expect(page.locator('text=required')).toBeVisible();
      await expect(page.locator('text=Birth Details')).toBeVisible();
    });

    test('should allow navigation between steps', async ({ page }) => {
      await page.goto(`${BASE_URL}/rectify/new`);
      
      await page.fill('input[name="fullName"]', 'Test User');
      await page.fill('input[name="dateOfBirth"]', '1990-01-01');
      await page.fill('input[name="tentativeTime"]', '12:00');
      await page.fill('input[name="birthPlace"]', 'Mumbai');
      
      await page.click('button:has-text("Next")');
      await page.waitForSelector('text=Forensic Traits');
      
      await page.click('button:has-text("Back")');
      await page.waitForSelector('text=Birth Details');
      
      await expect(page.locator('input[name="fullName"]')).toHaveValue('Test User');
    });
  });

  test.describe('Flow 3: Analysis', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${BASE_URL}/sign-in`);
      await page.fill('input[name="emailAddress"]', TEST_EMAIL);
      await page.fill('input[name="password"]', 'TestPassword123!');
      await page.click('button[type="submit"]');
      await page.waitForURL(/dashboard/);
    });

    test('should submit and track analysis progress', async ({ page }) => {
      await page.goto(`${BASE_URL}/rectify/new`);
      
      await page.fill('input[name="fullName"]', 'Analysis Test');
      await page.fill('input[name="dateOfBirth"]', '1990-01-01');
      await page.fill('input[name="tentativeTime"]', '12:00');
      await page.fill('input[name="birthPlace"]', 'Mumbai, India');
      await page.selectOption('select[name="gender"]', 'male');
      
      await page.click('button:has-text("Next")');
      await page.waitForSelector('text=Forensic Traits');
      await page.click('button:has-text("Next")');
      await page.waitForSelector('text=Physical Traits');
      await page.click('button:has-text("Next")');
      await page.waitForSelector('text=Life Events');
      await page.click('button:has-text("Next")');
      await page.waitForSelector('text=Review');
      await page.click('button:has-text("Submit for Analysis")');
      
      await page.waitForURL(/rectify\/[\w-]+/);
      
      await expect(page.locator('text=Starting Analysis')).toBeVisible({ timeout: 5000 });
      
      await expect(page.locator('[data-testid="progress-indicator"]')).toBeVisible();
      
      await page.waitForSelector('text=Complete', { timeout: 300000 });
      
      await expect(page.locator('text=View Results')).toBeVisible();
    });

    test('should allow canceling analysis', async ({ page }) => {
      await page.goto(`${BASE_URL}/rectify/new`);
      
      await page.fill('input[name="fullName"]', 'Cancel Test');
      await page.fill('input[name="dateOfBirth"]', '1990-01-01');
      await page.fill('input[name="tentativeTime"]', '12:00');
      await page.fill('input[name="birthPlace"]', 'Mumbai, India');
      await page.selectOption('select[name="gender"]', 'male');
      
      await page.click('button:has-text("Next")');
      await page.waitForSelector('text=Forensic Traits');
      await page.click('button:has-text("Next")');
      await page.waitForSelector('text=Physical Traits');
      await page.click('button:has-text("Next")');
      await page.waitForSelector('text=Life Events');
      await page.click('button:has-text("Next")');
      await page.waitForSelector('text=Review');
      await page.click('button:has-text("Submit for Analysis")');
      
      await page.waitForURL(/rectify\/[\w-]+/);
      await page.waitForSelector('text=Stop', { timeout: 10000 });
      
      await page.click('button:has-text("Stop")');
      await page.click('button:has-text("Confirm")');
      
      await expect(page.locator('text=Analysis Stopped')).toBeVisible({ timeout: 10000 });
      await expect(page.locator('button:has-text("Restart")')).toBeVisible();
    });

    test('should handle network disconnection gracefully', async ({ page }) => {
      await page.goto(`${BASE_URL}/rectify/new`);
      
      await page.fill('input[name="fullName"]', 'Network Test');
      await page.fill('input[name="dateOfBirth"]', '1990-01-01');
      await page.fill('input[name="tentativeTime"]', '12:00');
      await page.fill('input[name="birthPlace"]', 'Mumbai, India');
      await page.selectOption('select[name="gender"]', 'male');
      
      await page.click('button:has-text("Next")');
      await page.waitForSelector('text=Forensic Traits');
      await page.click('button:has-text("Next")');
      await page.waitForSelector('text=Physical Traits');
      await page.click('button:has-text("Next")');
      await page.waitForSelector('text=Life Events');
      await page.click('button:has-text("Next")');
      await page.waitForSelector('text=Review');
      await page.click('button:has-text("Submit for Analysis")');
      
      await page.waitForURL(/rectify\/[\w-]+/);
      
      await page.context().setOffline(true);
      await page.waitForTimeout(5000);
      await page.context().setOffline(false);
      
      await expect(page.locator('text=Reconnecting')).toBeVisible({ timeout: 10000 });
      await expect(page.locator('text=Connected')).toBeVisible({ timeout: 30000 });
    });
  });

  test.describe('Flow 4: Dashboard Management', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${BASE_URL}/sign-in`);
      await page.fill('input[name="emailAddress"]', TEST_EMAIL);
      await page.fill('input[name="password"]', 'TestPassword123!');
      await page.click('button[type="submit"]');
      await page.waitForURL(/dashboard/);
    });

    test('should display sessions list', async ({ page }) => {
      await expect(page.locator('text=Dashboard')).toBeVisible();
      await expect(page.locator('[data-testid="session-list"]')).toBeVisible();
    });

    test('should favorite and unfavorite session', async ({ page }) => {
      const favoriteButton = page.locator('[data-testid="favorite-button"]').first();
      
      await favoriteButton.click();
      
      await expect(favoriteButton.locator('svg[class*="filled"]')).toBeVisible();
      
      await favoriteButton.click();
      
      await expect(favoriteButton.locator('svg[class*="outline"]')).toBeVisible();
    });

    test('should clone session', async ({ page }) => {
      const cloneButton = page.locator('[data-testid="clone-button"]').first();
      
      await cloneButton.click();
      
      await page.waitForSelector('text=Session cloned successfully', { timeout: 5000 });
      
      await expect(page.locator('text=(Copy)')).toBeVisible();
    });

    test('should delete session with confirmation', async ({ page }) => {
      const sessionCard = page.locator('[data-testid="session-card"]').first();
      const deleteButton = sessionCard.locator('[data-testid="delete-button"]');
      
      await deleteButton.click();
      
      await expect(page.locator('text=Confirm Delete')).toBeVisible();
      
      await page.click('button:has-text("Cancel")');
      
      await expect(sessionCard).toBeVisible();
      
      await deleteButton.click();
      await page.click('button:has-text("Delete")');
      
      await page.waitForSelector('text=Session deleted', { timeout: 5000 });
    });

    test('should navigate to session details', async ({ page }) => {
      const viewButton = page.locator('[data-testid="view-button"]').first();
      
      await viewButton.click();
      
      await page.waitForURL(/rectify\/[\w-]+/);
      await expect(page.locator('text=Analysis')).toBeVisible();
    });

    test('should filter and sort sessions', async ({ page }) => {
      await page.click('[data-testid="filter-button"]');
      await page.selectOption('select[name="status"]', 'completed');
      await page.click('button:has-text("Apply")');
      
      const sessions = page.locator('[data-testid="session-card"]');
      const count = await sessions.count();
      
      for (let i = 0; i < count; i++) {
        await expect(sessions.nth(i).locator('text=Complete')).toBeVisible();
      }
    });

    test('should handle empty state', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard?filter=new`);
      
      if (await page.locator('text=No sessions found').isVisible()) {
        await expect(page.locator('button:has-text("Create New")')).toBeVisible();
      }
    });
  });

  test.describe('Error Scenarios', () => {
    test('should handle 404 errors gracefully', async ({ page }) => {
      await page.goto(`${BASE_URL}/non-existent-page`);
      
      await expect(page.locator('text=404')).toBeVisible();
      await expect(page.locator('text=Page Not Found')).toBeVisible();
    });

    test('should handle 500 errors gracefully', async ({ page }) => {
      await page.route('**/api/sessions', route => {
        route.fulfill({ status: 500, body: 'Internal Server Error' });
      });
      
      await page.goto(`${BASE_URL}/dashboard`);
      
      await expect(page.locator('text=Something went wrong')).toBeVisible();
    });

    test('should handle network timeout', async ({ page }) => {
      await page.route('**/api/sessions', route => {
        route.abort('timedout');
      });
      
      await page.goto(`${BASE_URL}/dashboard`);
      
      await expect(page.locator('text=Network error')).toBeVisible();
    });
  });
});