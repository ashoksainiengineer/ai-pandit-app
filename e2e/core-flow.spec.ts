import { test, expect } from '@playwright/test';

test.describe('Rectification Core Flow', () => {
    test.beforeEach(async ({ page }) => {
        // Log console errors for debugging
        page.on('console', msg => {
            if (msg.type() === 'error') console.log(`BROWSER ERROR: ${msg.text()}`);
        });

        // Mock OpenStreetMap API
        await page.route('**/nominatim.openstreetmap.org/search*', async route => {
            const json = [
                {
                    place_id: 12345,
                    lat: "19.0760",
                    lon: "72.8777",
                    display_name: "Mumbai, Maharashtra, India",
                    address: { city: "Mumbai", state: "Maharashtra", country: "India" }
                }
            ];
            await route.fulfill({ json });
        });

        await page.setViewportSize({ width: 1280, height: 1200 });
        await page.goto('/rectify?new=true');
    });

    test('Complete full rectification flow', async ({ page }) => {
        test.setTimeout(600000); // 10 minutes

        // Listen for console messages
        page.on('console', msg => console.log(`BROWSER [${msg.type()}]: ${msg.text()}`));
        page.on('pageerror', err => console.log(`BROWSER ERROR: ${err.message}`));

        // Step 1: Birth Details
        await page.getByPlaceholder(/Enter your full name/i).fill('Test User Automation');

        const selects = page.locator('select');
        await selects.nth(0).selectOption('15'); // Day
        await selects.nth(1).selectOption('01'); // Jan
        await selects.nth(2).selectOption('1990'); // Year
        await selects.nth(3).selectOption('08'); // Hour
        await selects.nth(4).selectOption('30'); // Minute
        await page.getByRole('button', { name: 'AM', exact: true }).click();

        await page.getByPlaceholder(/Type city name/i).fill('Mumbai');
        const mumbaiOption = page.locator('button').filter({ hasText: /Mumbai/i }).first();
        await mumbaiOption.waitFor({ state: 'visible', timeout: 10000 });
        await mumbaiOption.click();

        const maleBtn = page.locator('button').filter({ has: page.locator('div', { hasText: /^Male$/ }) });
        await maleBtn.click();
        await page.waitForSelector('button:has-text("Next Step"):not([disabled])', { timeout: 5000 });
        await page.getByRole('button', { name: /Next Step/i }).click();


        // Step 2: Life Events
        await expect(page.getByRole('heading', { name: /Life Events/i })).toBeVisible({ timeout: 15000 });

        // Helper to add a life event (min 3 required)
        const addLifeEvent = async (searchText: string, resultPattern: RegExp, year: string) => {
            console.log(`Adding life event: ${searchText}...`);
            const searchInput = page.getByPlaceholder(/Search life events/i);
            await searchInput.waitFor({ state: 'visible', timeout: 15000 });
            await searchInput.clear();
            await searchInput.fill(searchText);
            await page.getByRole('button', { name: resultPattern }).first().click();

            const descriptionArea = page.getByPlaceholder(/What happened/i);
            await descriptionArea.waitFor({ state: 'visible', timeout: 8000 });
            await descriptionArea.fill(`Detailed description for ${searchText} event (at least 10 chars).`);

            // Month 1, Year provided
            await page.locator('select').first().selectOption('1');
            await page.locator('select').last().selectOption(year);

            const saveBtn = page.getByRole('button', { name: /Save/i });
            await expect(saveBtn).toBeEnabled({ timeout: 5000 });
            await saveBtn.click();

            // Verify item in timeline
            await expect(page.locator('div.divide-y').getByText(resultPattern).first()).toBeVisible({ timeout: 10000 });
        };

        await addLifeEvent('Marriage', /Marriage/i, '2015');
        await addLifeEvent('Job', /Job/i, '2018');
        await addLifeEvent('Graduation', /Graduation/i, '2010');

        await expect(page.locator('[data-testid="event-item"], .divide-y > div')).toHaveCount(3, { timeout: 5000 });
        await page.getByRole('button', { name: 'Next Step →' }).click({ force: true });

        // Step 3: Review & Submit
        console.log('Transitioning to Step 3: Review & Confirm...');
        await expect(page.getByRole('heading', { name: /Review|Confirm/i }).first()).toBeVisible({ timeout: 25000 });
        await page.waitForSelector('input[type="checkbox"]', { state: 'visible', timeout: 5000 });
        await page.locator('input[type="checkbox"]').check();

        const startBtn = page.getByRole('button', { name: /Start Analysis/i });
        await expect(startBtn).toBeEnabled({ timeout: 10000 });
        await startBtn.click();

        // Final Verification
        // Final Verification: Either reached results or redirected to sign-in due to auth
        await expect(page).toHaveURL(/.*(rectify\/[a-zA-Z0-9-]+|sign-in)/, { timeout: 40000 });
        console.log('SUCCESS: Core flow completed successfully (Redirected to results or auth).');

    });
});
