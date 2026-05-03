import { test, expect } from '@playwright/test';

test.describe('Form Validation & Integrity', () => {
    test.beforeEach(async ({ page }) => {
        // Mock OpenStreetMap API
        await page.route('**/nominatim.openstreetmap.org/search*', async route => {
            const json = [{ lat: "19.0760", lon: "72.8777", display_name: "Mumbai, India", address: { city: "Mumbai", country: "India" } }];
            await route.fulfill({ json });
        });
        await page.setViewportSize({ width: 1280, height: 1200 });
        await page.goto('/rectify?new=true');
        await page.waitForLoadState('networkidle');
    });

    test('Step 1: should show specific errors for missing birth details', async ({ page }) => {
        const nameInput = page.getByPlaceholder(/Enter your full name/i);
        await nameInput.fill('Test');
        await nameInput.fill('');
        await nameInput.blur();
        await expect(page.getByText(/Full name is required/i)).toBeVisible();

        await page.getByRole('button', { name: /Next Step/i }).click();
        await expect(page.getByText(/Full name is required/i)).toBeVisible();
    });

    test('Step 4: should require description for life events', async ({ page }) => {
        test.setTimeout(120000); // 2 mins

        // Fill Step 1
        await page.getByPlaceholder(/Enter your full name/i).fill('Validation User');
        const selects = page.locator('select');
        await selects.nth(0).selectOption('15');
        await selects.nth(1).selectOption('01');
        await selects.nth(2).selectOption('1990');
        await selects.nth(3).selectOption('08');
        await selects.nth(4).selectOption('30');
        await page.getByRole('button', { name: 'AM', exact: true }).click();

        await page.getByPlaceholder(/Type city name/i).fill('Mumbai');
        const dropdownOption = page.locator('button').filter({ hasText: /Mumbai/i }).first();
        await dropdownOption.waitFor({ state: 'visible' });
        await dropdownOption.click();

        const maleBtn = page.locator('button').filter({ has: page.locator('div', { hasText: /^Male$/ }) });
        await maleBtn.click();
        await page.getByRole('button', { name: /Next Step/i }).click();

        // Step 2: Physical
        await expect(page.getByText(/Physical Appearance/i)).toBeVisible({ timeout: 10000 });
        await page.getByRole('button', { name: /Almond/i }).click();
        await page.getByRole('button', { name: /Next Step/i }).click();

        // Step 3: Forensic (Skip/Complete quiz quickly)
        await expect(page.getByText(/Forensic Traits/i)).toBeVisible({ timeout: 15000 });

        const startBtn = page.getByRole('button', { name: /Start Assessment/i }).or(page.getByRole('button', { name: /Resume Assessment/i }));
        if (await startBtn.count() > 0 && await startBtn.first().isVisible()) {
            await startBtn.first().click();
        }

        // Just answer enough to get to results or just skip if results button appears
        let qCount = 0;
        while (qCount < 20) {
            const confirmBtn = page.getByRole('button', { name: /Confirm & Continue/i });
            if (await confirmBtn.isVisible()) {
                await confirmBtn.click();
                break;
            }
            const option = page.locator('button.w-full.text-left').first();
            if (await option.isVisible()) {
                await option.click();
                const next = page.getByRole('button', { name: 'Next', exact: true }).or(page.getByRole('button', { name: 'See Results', exact: true }));
                await next.click();
                await page.waitForSelector('button.w-full.text-left, button:has-text("Confirm & Continue")', { state: 'visible', timeout: 5000 });
            } else {
                break;
            }
            qCount++;
        }

        await expect(page.getByRole('button', { name: 'Next Step →' })).toBeVisible({ timeout: 15000 });
        await page.getByRole('button', { name: 'Next Step →' }).click();

        // Step 4: Life Events
        await expect(page.getByRole('heading', { name: /Life Events/i })).toBeVisible({ timeout: 10000 });
        const searchInput = page.getByPlaceholder(/Search life events/i);
        await searchInput.fill('Marriage');
        await page.getByRole('button', { name: /Marriage/i }).first().click();

        const saveButton = page.getByRole('button', { name: /Save/i });
        await expect(saveButton).toBeDisabled();

        const textarea = page.getByPlaceholder(/What happened/i);
        await textarea.fill('Short'); // Less than 10 chars
        await expect(saveButton).toBeDisabled();
    });
});

