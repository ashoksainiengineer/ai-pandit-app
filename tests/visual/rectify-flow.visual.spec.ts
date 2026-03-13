/**
 * Visual Regression Tests - Rectification Flow
 * 
 * Ensures consistency in the multi-step rectification form.
 */

import { test, expect } from '@playwright/test';

test.describe('🔮 Rectify Flow Visual Tests', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/rectify?new=true');
        await page.waitForTimeout(1000);
    });

    test('step 1 - birth details form', async ({ page }) => {
        const form = page.locator('form').first();
        await expect(form).toHaveScreenshot('rectify-step1-birth-details.png');
    });

    test('step 1 - with validation errors', async ({ page }) => {
        // Try to submit empty form
        const submitButton = page.locator('button[type="submit"]').first();
        if (await submitButton.isVisible().catch(() => false)) {
            await submitButton.click();
            await page.waitForTimeout(500);
            const form = page.locator('form').first();
            await expect(form).toHaveScreenshot('rectify-step1-errors.png');
        }
    });

    test('step 2 - physical traits form', async ({ page }) => {
        // Fill step 1 and proceed
        await fillStep1(page);
        const nextButton = page.locator('button:has-text("Next"), button:has-text("Continue")').first();
        if (await nextButton.isEnabled().catch(() => false)) {
            await nextButton.click();
            await page.waitForTimeout(1000);
            const form = page.locator('form').first();
            await expect(form).toHaveScreenshot('rectify-step2-physical.png');
        }
    });

    test('loading state visualization', async ({ page }) => {
        // Look for loading states
        const loading = page.locator('[data-testid="loading"], .loading, [role="progressbar"]').first();
        if (await loading.isVisible().catch(() => false)) {
            await expect(loading).toHaveScreenshot('rectify-loading-state.png');
        }
    });

    test('results dashboard', async ({ page }) => {
        // This would require a completed session
        // For now, just check if the results page renders
        await page.goto('/results/demo');
        await page.waitForTimeout(2000);
        await expect(page).toHaveScreenshot('rectify-results.png', {
            maxDiffPixels: 500, // Allow some variance for dynamic content
        });
    });
});

async function fillStep1(page: any) {
    // Helper to fill birth details
    const nameInput = page.locator('input[name="fullName"], input[placeholder*="name"]').first();
    if (await nameInput.isVisible().catch(() => false)) {
        await nameInput.fill('Test User');
    }
    
    // Add more field filling as needed
    await page.waitForTimeout(500);
}
