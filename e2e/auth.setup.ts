import { test as setup } from '@playwright/test';

const authFile = 'playwright/.auth/user.json';

setup('authenticate', async ({ page }) => {
    await page.goto('/sign-in');

    // Fill Clerk sign-in form with test credentials
    await page.fill(
        'input[name="email"], input[name="emailAddress"], input[type="email"]',
        process.env.E2E_CLERK_EMAIL || 'test@example.com'
    );
    await page.fill(
        'input[name="password"], input[type="password"]',
        process.env.E2E_CLERK_PASSWORD || 'testpass123'
    );
    await page.click('button[type="submit"], button.cl-formButtonPrimary');

    // Wait for redirect to dashboard after successful auth
    await page.waitForURL('/dashboard', { timeout: 30000 });

    // Persist authentication state
    await page.context().storageState({ path: authFile });
});
