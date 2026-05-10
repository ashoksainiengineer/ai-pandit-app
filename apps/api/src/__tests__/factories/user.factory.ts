/**
 * User Factory — Test data factories following Midday/OpenStatus patterns.
 *
 * Creates consistent test user objects with sensible defaults.
 * All fields can be overridden via the `overrides` parameter.
 */

export interface TestUser {
  id: string;
  externalId: string;
  email: string;
  fullName: string;
  role: string;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

const DEFAULT_USER: TestUser = {
  id: 'test-user-001',
  externalId: 'test-clerk-001',
  email: 'test@example.com',
  fullName: 'Test User',
  role: 'user',
  isActive: true,
  lastLoginAt: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

/**
 * Create a test user with optional overrides.
 *
 * @example
 * const admin = createTestUser({ role: 'admin' });
 * const custom = createTestUser({ id: 'my-user', email: 'custom@test.com' });
 */
export function createTestUser(overrides: Partial<TestUser> = {}): TestUser {
  return {
    ...DEFAULT_USER,
    ...overrides,
  };
}

/**
 * Create multiple test users at once.
 * Useful for testing list endpoints or multi-user scenarios.
 */
export function createTestUsers(count: number, overrides?: (index: number) => Partial<TestUser>): TestUser[] {
  return Array.from({ length: count }, (_, i) =>
    createTestUser({
      id: `test-user-${String(i + 1).padStart(3, '0')}`,
      externalId: `test-clerk-${String(i + 1).padStart(3, '0')}`,
      email: `test${i + 1}@example.com`,
      ...overrides?.(i),
    }),
  );
}
