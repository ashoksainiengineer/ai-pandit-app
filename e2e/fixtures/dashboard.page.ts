import { Page, Locator, expect } from '@playwright/test';

export class DashboardPage {
    readonly heading: Locator;
    readonly sessionCards: Locator;
    readonly newSessionButton: Locator;
    readonly signOutButton: Locator;
    readonly filterDropdown: Locator;
    readonly searchInput: Locator;
    readonly statsSection: Locator;

    constructor(public readonly page: Page) {
        this.heading = this.page.locator('h1:has-text("Dashboard"), [data-testid="dashboard-heading"]');
        this.sessionCards = this.page.locator('[data-testid="session-card"], .session-card');
        this.newSessionButton = this.page.locator('a[href*="rectify/new"], button:has-text("New"), button:has-text("Create")').first();
        this.signOutButton = this.page.locator('button:has-text("Sign out"), button:has-text("Logout"), [data-testid="sign-out"]').first();
        this.filterDropdown = this.page.locator('select[name="filter"], [data-testid="filter-dropdown"]').first();
        this.searchInput = this.page.locator('input[placeholder*="Search"], input[name="search"]').first();
        this.statsSection = this.page.locator('[data-testid="dashboard-stats"], .stats-grid, .dashboard-stats').first();
    }

    async goto(): Promise<void> {
        await this.page.goto('/dashboard');
        await this.page.waitForLoadState('networkidle');
    }

    async expectLoaded(): Promise<void> {
        await expect(this.heading).toBeVisible();
    }

    async clickNewSession(): Promise<void> {
        await this.newSessionButton.click();
    }

    async getSessionCount(): Promise<number> {
        return await this.sessionCards.count();
    }

    async searchSessions(query: string): Promise<void> {
        await this.searchInput.fill(query);
    }

    async favoriteSession(index: number = 0): Promise<void> {
        const favoriteBtn = this.sessionCards.nth(index).locator('[data-testid="favorite-button"], button:has-text("★")');
        await favoriteBtn.click();
    }

    async deleteSession(index: number = 0): Promise<void> {
        const deleteBtn = this.sessionCards.nth(index).locator('[data-testid="delete-button"], button:has-text("Delete")');
        await deleteBtn.click();

        const confirmBtn = this.page.locator('button:has-text("Confirm"), button:has-text("Yes"), [data-testid="confirm-delete"]');
        if (await confirmBtn.isVisible({ timeout: 3000 })) {
            await confirmBtn.click();
        }
    }

    async signOut(): Promise<void> {
        await this.signOutButton.click();
    }
}
