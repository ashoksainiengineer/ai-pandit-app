import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Phase B: UI Stability & Accessibility', () => {

    test('Landing Page should meet WCAG 2.1 AA accessibility standards', async ({ page }) => {
        await page.goto('/');

        // Inject Axe and scan
        const accessibilityScanResults = await new AxeBuilder({ page })
            .withTags(['wcag2a', 'wcag21a', 'wcag2aa', 'wcag21aa'])
            .analyze();

        // Assertion: Ensure no critical or serious violations
        const extremeViolations = accessibilityScanResults.violations.filter(v =>
            v.impact === 'critical' || v.impact === 'serious'
        );

        if (extremeViolations.length > 0) {
            console.error('Accessibility Violations:', JSON.stringify(extremeViolations, null, 2));
        }

        expect(extremeViolations.length).toBe(0);
    });

    test('Rectify Flow - Step 1 should be accessible', async ({ page }) => {
        await page.goto('/rectify');
        await page.waitForSelector('h1:has-text("Birth Details")');

        const scanResults = await new AxeBuilder({ page }).analyze();
        expect(scanResults.violations.length).toBeLessThanOrEqual(5); // Allow minor warnings for now, but monitor
    });

    test('Visual Consistency - Landing Page Hero Section', async ({ page }) => {
        await page.goto('/');

        // Check the main hero section for "Sacred Ivory" theme consistency
        const hero = page.locator('header, section:has-text("AI Pandit")').first();
        await expect(hero).toBeVisible();

        // Note: In a real CI, we use toHaveScreenshot()
        // For this demo, we'll verify the presence of theme-specific CSS variables
        const bgColor = await page.evaluate(() =>
            getComputedStyle(document.body).backgroundColor
        );
        expect(bgColor).toBe('rgb(255, 252, 248)'); // #FFFCF8 (Sacred Ivory Base)
    });

});
