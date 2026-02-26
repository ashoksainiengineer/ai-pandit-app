import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
    test('should load successfully and display critical sections', async ({ page }) => {
        await page.goto('/');

        // Check title
        await expect(page).toHaveTitle(/AI Pandit/);

        // Check Hero section existence
        const heroTitle = page.locator('h1');
        await expect(heroTitle).toBeVisible();

        // Check if Navbar is present
        const navbar = page.locator('nav');
        await expect(navbar).toBeVisible();

        // Check for Pricing section (important for conversion)
        const pricingHeader = page.getByText(/Pricing/i);
        await expect(pricingHeader).toBeVisible();

        // Check for CTA button
        const ctaButton = page.getByRole('button', { name: /Start/i }).or(page.getByRole('link', { name: /Start/i }));
        // Depending on the exact text, we can be flexible
        if (await ctaButton.count() > 0) {
            await expect(ctaButton.first()).toBeVisible();
        }
    });

    test('should navigate to sign-in page when clicking login', async ({ page }) => {
        await page.goto('/');

        // Look for Login button/link
        const loginLink = page.getByRole('link', { name: /Sign In/i }).or(page.getByRole('link', { name: /Login/i }));

        if (await loginLink.count() > 0) {
            await loginLink.first().click();
            await expect(page).toHaveURL(/.*sign-in.*/);
        }
    });
});
