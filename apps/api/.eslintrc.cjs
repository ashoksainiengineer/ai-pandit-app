module.exports = {
    root: true,
    parser: '@typescript-eslint/parser',
    plugins: ['@typescript-eslint'],
    extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
    ],
    rules: {
        '@typescript-eslint/no-explicit-any': 'warn',
        '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
        'prefer-const': 'warn',
        'no-case-declarations': 'warn',
        'no-useless-escape': 'warn',
        'no-control-regex': 'warn',
        'no-constant-condition': 'warn',
        '@typescript-eslint/no-namespace': 'warn',
    },
    env: {
        node: true,
        es2022: true,
    },
};
