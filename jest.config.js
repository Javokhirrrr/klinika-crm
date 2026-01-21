// jest.config.js
export default {
    // Use Node environment for backend testing
    testEnvironment: 'node',

    // Coverage configuration
    collectCoverageFrom: [
        'src/**/*.js',
        '!src/index.js',
        '!src/**/*.test.js',
        '!src/**/*.spec.js',
    ],

    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'lcov', 'html'],

    // Coverage thresholds (start low, increase gradually)
    coverageThreshold: {
        global: {
            branches: 50,
            functions: 50,
            lines: 50,
            statements: 50,
        },
    },

    // Test match patterns
    testMatch: [
        '**/__tests__/**/*.js',
        '**/?(*.)+(spec|test).js',
    ],

    // Setup files
    setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],

    // Transform ES modules
    transform: {},

    // Module name mapper for aliases (if needed)
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
    },

    // Ignore patterns
    testPathIgnorePatterns: [
        '/node_modules/',
        '/klinika-crm-frontend/',
    ],

    // Verbose output
    verbose: true,

    // Clear mocks between tests
    clearMocks: true,
    resetMocks: true,
    restoreMocks: true,

    // Timeout for tests (10 seconds)
    testTimeout: 10000,
};
