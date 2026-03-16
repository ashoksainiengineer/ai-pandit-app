import { Page, Locator, expect } from '@playwright/test';

export class DashboardPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly sessionCards: Locator;
  readonly newSessionButton: Locator;
  readonly signOutButton: Locator;
  readonly filterDropdown: Locator;
  readonly searchInput: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.locator('h1:has-text("Dashboard"), [data-testid="dashboard-heading"]');
    this.sessionCards = page.locator('[data-testid="session-card"], .session-card');
    this.newSessionButton = page.locator('a[href*="rectify/new"], button:has-text("New"), button:has-text("Create")').first();
    this.signOutButton = page.locator('button:has-text("Sign out"), button:has-text("Logout"), [data-testid="sign-out"]').first();
    this.filterDropdown = page.locator('select[name="filter"], [data-testid="filter-dropdown"]').first();
    this.searchInput = page.locator('input[placeholder*="Search"], input[name="search"]').first();
  }

  async goto() {
    await this.page.goto('/dashboard');
    await this.page.waitForLoadState('networkidle');
  }

  async expectLoaded() {
    await expect(this.heading).toBeVisible();
  }

  async clickNewSession() {
    await this.newSessionButton.click();
  }

  async getSessionCount() {
    return await this.sessionCards.count();
  }

  async favoriteSession(index: number = 0) {
    const favoriteBtn = this.sessionCards.nth(index).locator('[data-testid="favorite-button"], button:has-text("★")');
    await favoriteBtn.click();
  }

  async deleteSession(index: number = 0) {
    const deleteBtn = this.sessionCards.nth(index).locator('[data-testid="delete-button"], button:has-text("Delete")');
    await deleteBtn.click();
    
    const confirmBtn = this.page.locator('button:has-text("Confirm"), button:has-text("Yes"), [data-testid="confirm-delete"]');
    await confirmBtn.click();
  }

  async signOut() {
    await this.signOutButton.click();
  }
}