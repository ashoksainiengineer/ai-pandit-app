/**
 * Test Helpers - Industry Standard Utilities
 * 
 * Shared utilities for all test types (unit, integration, e2e)
 */

import { expect } from 'vitest';
import type { Page } from '@playwright/test';

// ═══════════════════════════════════════════════════════════════════════════════
// TIME UTILITIES
// ═══════════════════════════════════════════════════════════════════════════════

export const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const retry = async <T>(
    fn: () => Promise<T>,
    options: { retries?: number; delay?: number } = {}
): Promise<T> => {
    const { retries = 3, delay = 1000 } = options;
    let lastError: Error;
    
    for (let i = 0; i < retries; i++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error as Error;
            if (i < retries - 1) {
                await wait(delay * (i + 1));
            }
        }
    }
    
    throw lastError!;
};

// ═══════════════════════════════════════════════════════════════════════════════
// DATA GENERATORS
// ═══════════════════════════════════════════════════════════════════════════════

export const generateTestBirthChart = () => ({
    dateOfBirth: '1990-05-15',
    time: '12:00:00',
    latitude: 28.6139,
    longitude: 77.2090,
    timezone: 5.5,
});

export const generateTestSession = () => ({
    fullName: 'Test User',
    dateOfBirth: '1990-05-15',
    tentativeTime: '12:00:00',
    birthPlace: 'Mumbai, India',
    latitude: 19.0760,
    longitude: 72.8777,
    timezone: 5.5,
    gender: 'male',
    lifeEvents: [],
});

export const generateRandomString = (length: number = 10) => {
    return Math.random().toString(36).substring(2, 2 + length);
};

export const generateRandomEmail = () => {
    return `test-${generateRandomString(8)}@example.com`;
};

// ═══════════════════════════════════════════════════════════════════════════════
// MATCHERS & ASSERTIONS
// ═══════════════════════════════════════════════════════════════════════════════

export const expectToBeWithinRange = (
    received: number,
    expected: number,
    tolerance: number
) => {
    const pass = Math.abs(received - expected) <= tolerance;
    return {
        pass,
        message: () =>
            pass
                ? `expected ${received} not to be within ${tolerance} of ${expected}`
                : `expected ${received} to be within ${tolerance} of ${expected}`,
    };
};

export const expectValidISODate = (dateString: string) => {
    const date = new Date(dateString);
    const pass = !isNaN(date.getTime());
    return {
        pass,
        message: () =>
            pass
                ? `expected "${dateString}" not to be a valid ISO date`
                : `expected "${dateString}" to be a valid ISO date`,
    };
};

export const expectValidUUID = (uuid: string) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const pass = uuidRegex.test(uuid);
    return {
        pass,
        message: () =>
            pass
                ? `expected "${uuid}" not to be a valid UUID`
                : `expected "${uuid}" to be a valid UUID`,
    };
};

// ═══════════════════════════════════════════════════════════════════════════════
// E2E HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

export async function loginUser(page: Page, email: string, password: string) {
    // Navigate to login
    await page.goto('/login');
    
    // Fill credentials
    await page.fill('input[type="email"], input[name="email"]', email);
    await page.fill('input[type="password"], input[name="password"]', password);
    
    // Submit
    await page.click('button[type="submit"]');
    
    // Wait for navigation
    await page.waitForURL('**/dashboard');
}

export async function fillBirthDetails(page: Page, data: {
    name: string;
    dateOfBirth: string;
    time: string;
    city: string;
}) {
    await page.fill('input[name="fullName"], input[placeholder*="name"]', data.name);
    
    // Date selection (custom based on your UI)
    // This is a generic implementation
    const dateInput = page.locator('input[name="dateOfBirth"]').first();
    if (await dateInput.isVisible().catch(() => false)) {
        await dateInput.fill(data.dateOfBirth);
    }
    
    // Time selection
    const timeInput = page.locator('input[name="tentativeTime"]').first();
    if (await timeInput.isVisible().catch(() => false)) {
        await timeInput.fill(data.time);
    }
    
    // City search
    const cityInput = page.locator('input[placeholder*="city"], input[name="birthPlace"]').first();
    if (await cityInput.isVisible().catch(() => false)) {
        await cityInput.fill(data.city);
        // Wait for and select autocomplete
        await page.waitForTimeout(500);
        const firstOption = page.locator('[role="option"]').first();
        if (await firstOption.isVisible().catch(() => false)) {
            await firstOption.click();
        }
    }
}

export async function waitForElementToBeStable(
    page: Page,
    selector: string,
    timeout: number = 5000
) {
    const element = page.locator(selector).first();
    await element.waitFor({ state: 'visible', timeout });
    
    // Wait for animations to complete
    await page.waitForFunction(
        (sel) => {
            const el = document.querySelector(sel);
            return el && getComputedStyle(el).opacity === '1';
        },
        selector,
        { timeout }
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MOCK UTILITIES
// ═══════════════════════════════════════════════════════════════════════════════

export const createMockResponse = <T>(data: T, status = 200) => ({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
});

export const createMockError = (message: string, status = 500) => ({
    ok: false,
    status,
    json: () => Promise.resolve({ error: message }),
    text: () => Promise.resolve(message),
});

// ═══════════════════════════════════════════════════════════════════════════════
// SNAPSHOT HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

export const createSnapshotSerializer = ({
    replaceDates = true,
    replaceUUIDs = true,
    replaceTimestamps = true,
}: {
    replaceDates?: boolean;
    replaceUUIDs?: boolean;
    replaceTimestamps?: boolean;
} = {}) => {
    return {
        test: (val: unknown) => typeof val === 'string',
        print: (val: string) => {
            let result = val;
            
            if (replaceDates) {
                result = result.replace(/\d{4}-\d{2}-\d{2}/g, '[DATE]');
            }
            
            if (replaceTimestamps) {
                result = result.replace(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/g, '[TIMESTAMP]');
            }
            
            if (replaceUUIDs) {
                result = result.replace(
                    /[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/gi,
                    '[UUID]'
                );
            }
            
            return `"${result}"`;
        },
    };
};

// ═══════════════════════════════════════════════════════════════════════════════
// PERFORMANCE UTILITIES
// ═══════════════════════════════════════════════════════════════════════════════

export const measurePerformance = async <T>(fn: () => Promise<T>): Promise<{ result: T; duration: number }> => {
    const start = performance.now();
    const result = await fn();
    const duration = performance.now() - start;
    return { result, duration };
};

export const assertPerformance = (duration: number, maxDuration: number, operation: string) => {
    expect(duration).toBeLessThan(maxDuration);
    console.log(`✓ ${operation} completed in ${duration.toFixed(2)}ms (max: ${maxDuration}ms)`);
};
