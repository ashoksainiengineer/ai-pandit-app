import { test, expect } from '@playwright/test';

test.describe('Smoke Tests - Page Loads', () => {
    const pages = [
        { path: '/', name: 'Landing Page', selector: 'h1' },
        { path: '/rectify?new=true', name: 'Rectification Page', selector: 'text=Birth Details' },
        { path: '/privacy', name: 'Privacy Policy', selector: 'h1' },
        { path: '/terms', name: 'Terms of Service', selector: 'h1' },
    ];

    for (const pageInfo of pages) {
        test(`should load ${pageInfo.name} successfully`, async ({ page }) => {
            await page.goto(pageInfo.path);
            await expect(page.locator(pageInfo.selector).first()).toBeVisible({ timeout: 15000 });
        });
    }
});
