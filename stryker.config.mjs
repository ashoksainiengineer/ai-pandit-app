/**
 * Stryker Mutation Testing Configuration
 * 
 * Mutation testing ensures test quality by mutating code
 * and checking if tests catch the mutations.
 * 
 * Run: npx stryker run
 */

/** @type {import('@stryker-mutator/api/core').PartialStrykerOptions} */
const config = {
    // Test runner configuration
    testRunner: 'vitest',
    vitest: {
        configFile: 'vitest.config.ts',
    },
    
    // Mutators to apply
    mutators: {
        'javascript': true,
        'typescript': true,
    },
    
    // Package manager
    packageManager: 'npm',
    
    // Reporters
    reporters: ['html', 'clear-text', 'progress', 'json'],
    
    // HTML report directory
    htmlReporter: {
        fileName: 'reports/mutation/mutation-report.html',
    },
    
    // JSON report
    jsonReporter: {
        fileName: 'reports/mutation/mutation-report.json',
    },
    
    // Coverage analysis
    coverageAnalysis: 'perTest',
    
    // TypeScript checker
    checkers: ['typescript'],
    
    // Build command
    buildCommand: 'npm run build',
    
    // Thresholds
    thresholds: {
        high: 80,
        low: 60,
        break: 50, // CI fails if mutation score < 50%
    },
    
    // Files to mutate
    mutate: [
        'apps/api/src/**/*.ts',
        'apps/web/lib/**/*.ts',
        'packages/*/src/**/*.ts',
        '!**/__tests__/**',
        '!**/*.test.ts',
        '!**/*.spec.ts',
        '!**/node_modules/**',
        '!**/dist/**',
        '!**/config/**',
        '!**/types/**',
    ],
    
    // Files to ignore
    ignorePatterns: [
        'node_modules',
        'dist',
        '.next',
        'coverage',
        'reports',
        'logs',
        '**/*.d.ts',
    ],
    
    // Maximum concurrent test runners
    maxConcurrentTestRunners: 4,
    
    // Timeout for tests
    timeoutMS: 60000,
    
    // TypeScript configuration
    tsconfigFile: 'tsconfig.json',
    
    // Additional settings
    allowConsoleColors: true,
    clearTextReporter: {
        allowColor: true,
        allowEmojis: true,
    },
};

export default config;
