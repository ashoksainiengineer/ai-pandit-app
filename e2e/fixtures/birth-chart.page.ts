import { Page, Locator } from '@playwright/test';

export class BirthChartPage {
    readonly birthDateInput: Locator;
    readonly calculateButton: Locator;
    readonly resultPanel: Locator;
    readonly nameInput: Locator;
    readonly cityInput: Locator;
    readonly nextStepButton: Locator;
    readonly genderButtons: Locator;

    constructor(public readonly page: Page) {
        this.birthDateInput = this.page.getByLabel(/birth date/i);
        this.calculateButton = this.page.getByRole('button', { name: /calculate/i });
        this.resultPanel = this.page.getByTestId('birth-chart-result');
        this.nameInput = this.page.getByPlaceholder(/Enter your full name/i);
        this.cityInput = this.page.getByPlaceholder(/Type city name/i);
        this.nextStepButton = this.page.getByRole('button', { name: /Next Step/i });
        this.genderButtons = this.page.locator('button').filter({ has: this.page.locator('div', { hasText: /^(Male|Female)$/ }) });
    }

    async goto(): Promise<void> {
        await this.page.goto('/rectify?new=true');
        await this.page.waitForLoadState('networkidle');
    }

    async fillBirthData(date: string, time: string): Promise<void> {
        await this.birthDateInput.fill(date);
        // Time inputs vary by UI; using placeholder fill
        const timeInput = this.page.getByPlaceholder(/time|hour/i).first();
        if (await timeInput.isVisible()) {
            await timeInput.fill(time);
        }
    }

    async fillName(name: string): Promise<void> {
        await this.nameInput.fill(name);
    }

    async searchAndSelectCity(city: string): Promise<void> {
        await this.cityInput.fill(city);
        const cityOption = this.page.locator('button').filter({ hasText: new RegExp(city, 'i') }).first();
        await cityOption.waitFor({ state: 'visible', timeout: 10000 });
        await cityOption.click();
    }

    async clickCalculate(): Promise<void> {
        await this.calculateButton.click();
    }

    async getResultPanel(): Promise<Locator> {
        return this.resultPanel;
    }
}
