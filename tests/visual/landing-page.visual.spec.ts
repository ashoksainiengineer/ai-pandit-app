/**
 * Visual Regression Tests - Landing Page
 * 
 * Ensures UI consistency across changes.
 * 
 * Run: npx playwright test tests/visual/landing-page.visual.spec.ts
 */

import { test, expect } from '@playwright/test';

test.describe('🏠 Landing Page Visual Tests', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        // Wait for fonts and animations to settle
        await page.waitForTimeout(2000);
    });

    test('full page screenshot - desktop', async ({ page }) => {
        await expect(page).toHaveScreenshot('landing-desktop.png', {
            fullPage: true,
        });
    });

    test('hero section screenshot', async ({ page }) => {
        const hero = page.locator('[data-testid="hero-section"]').first();
        await expect(hero).toHaveScreenshot('landing-hero.png');
    });

    test('navigation bar screenshot', async ({ page }) => {
        const nav = page.locator('nav').first();
        await expect(nav).toHaveScreenshot('landing-navbar.png');
    });

    test('features section screenshot', async ({ page }) => {
        const features = page.locator('[data-testid="features-section"]').first();
        if (await features.isVisible().catch(() => false)) {
            await expect(features).toHaveScreenshot('landing-features.png');
        }
    });
});

test.describe('📱 Landing Page Mobile Visual Tests', () => {
    test.use({ viewport: { width: 375, height: 667 } });

    test('full page screenshot - mobile', async ({ page }) => {
        await page.goto('/');
        await page.waitForTimeout(2000);
        await expect(page).toHaveScreenshot('landing-mobile.png', {
            fullPage: true,
        });
    });

    test('mobile navigation menu', async ({ page }) => {
        await page.goto('/');
        const menuButton = page.locator('button[aria-label*="menu"], button[aria-label*="Menu"]').first();
        if (await menuButton.isVisible().catch(() => false)) {
            await menuButton.click();
            await page.waitForTimeout(500);
            await expect(page).toHaveScreenshot('landing-mobile-menu.png');
        }
    });
});

test.describe('🌗 Landing Page Dark Mode Visual Tests', () => {
    test('dark mode screenshot', async ({ page }) => {
        // Emulate dark mode
        await page.emulateMedia({ colorScheme: 'dark' });
        await page.goto('/');
        await page.waitForTimeout(2000);
        await expect(page).toHaveScreenshot('landing-dark-mode.png', {
            fullPage: true,
        });
    });
});
