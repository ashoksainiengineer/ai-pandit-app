module.exports = {
    root: true,
    parser: '@typescript-eslint/parser',
    plugins: ['@typescript-eslint', 'security'],
    extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:security/recommended',
    ],
    rules: {
        // Current Skyfield migration code has many dynamic record/index access sites.
        // This rule generates mostly false-positives for typed dictionary lookups.
        'security/detect-object-injection': 'off',

        // Keep lint signal focused on regressions while architecture stabilization is in progress.
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-unused-vars': 'off',
        'prefer-const': 'off',
        'no-case-declarations': 'off',
        'no-useless-escape': 'off',
        'no-control-regex': 'off',
        'no-constant-condition': 'off',
        '@typescript-eslint/no-namespace': 'off',
        'security/detect-unsafe-regex': 'off',
        'security/detect-non-literal-fs-filename': 'off',
        'security/detect-non-literal-regexp': 'off',
    },
    env: {
        node: true,
        es2022: true,
    },
};
