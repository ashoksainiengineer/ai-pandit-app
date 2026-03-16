import { Page, Locator, expect } from '@playwright/test';

export class SignInPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly signInButton: Locator;
  readonly signUpLink: Locator;
  readonly errorMessage: Locator;
  readonly forgotPasswordLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.locator('input[name="emailAddress"], input[type="email"]').first();
    this.passwordInput = page.locator('input[name="password"], input[type="password"]').first();
    this.signInButton = page.locator('button[type="submit"]').first();
    this.signUpLink = page.locator('a[href*="sign-up"], text=Sign up').first();
    this.errorMessage = page.locator('.cl-formFieldError, [data-testid="error-message"], text=Invalid').first();
    this.forgotPasswordLink = page.locator('a[href*="forgot"], text=Forgot password').first();
  }

  async goto() {
    await this.page.goto('/sign-in');
    await this.page.waitForLoadState('networkidle');
  }

  async signIn(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.signInButton.click();
  }

  async expectError() {
    await expect(this.errorMessage).toBeVisible();
  }

  async clickSignUp() {
    await this.signUpLink.click();
  }
}