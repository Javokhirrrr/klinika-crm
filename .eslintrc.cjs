// .eslintrc.cjs
module.exports = {
    env: {
        node: true,
        es2022: true,
        jest: true,
    },
    extends: [
        'eslint:recommended',
    ],
    parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
    },
    rules: {
        // Error Prevention
        'no-console': 'off', // Allow console in backend
        'no-unused-vars': ['warn', {
            argsIgnorePattern: '^_',
            varsIgnorePattern: '^_',
        }],
        'no-undef': 'error',
        'no-unreachable': 'error',
        'no-constant-condition': 'warn',

        // Best Practices
        'eqeqeq': ['error', 'always'],
        'curly': ['error', 'multi-line'],
        'no-var': 'error',
        'prefer-const': 'warn',
        'prefer-arrow-callback': 'warn',
        'no-throw-literal': 'error',
        'require-await': 'warn',

        // Code Style
        'indent': ['error', 2, { SwitchCase: 1 }],
        'quotes': ['error', 'single', { avoidEscape: true }],
        'semi': ['error', 'always'],
        'comma-dangle': ['error', 'always-multiline'],
        'arrow-spacing': 'error',
        'object-curly-spacing': ['error', 'always'],
        'array-bracket-spacing': ['error', 'never'],
        'key-spacing': 'error',
        'space-before-blocks': 'error',
        'keyword-spacing': 'error',

        // ES6+
        'no-duplicate-imports': 'error',
        'prefer-template': 'warn',
        'template-curly-spacing': 'error',
        'rest-spread-spacing': 'error',
    },
    overrides: [
        {
            files: ['tests/**/*.js', '**/*.test.js', '**/*.spec.js'],
            env: {
                jest: true,
            },
            rules: {
                'no-unused-expressions': 'off',
            },
        },
    ],
};
