/**
 * Jest Configuration for ShopStation Admin UI Testing
 * 
 * This configuration file sets up Jest for comprehensive testing
 * of both backend and frontend components.
 */

module.exports = {
  // Test environment
  testEnvironment: 'node',
  
  // Test file patterns
  testMatch: [
    '**/tests/**/*.test.js',
    '**/src/tests/**/*.test.js'
  ],
  
  // Coverage configuration
  collectCoverage: true,
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'backend/routes/**/*.js',
    'backend/database/**/*.js',
    'backend/utils/**/*.js',
    'backend/config/**/*.js',
    'backend/middleware/**/*.js',
    'frontend/src/components/**/*.js',
    'frontend/src/utils/**/*.js',
    '!**/node_modules/**',
    '!**/coverage/**',
    '!**/build/**',
    '!**/dist/**'
  ],
  
  // Coverage thresholds (adjusted for current implementation)
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50
    },
    // Higher thresholds for critical components
    './backend/middleware/': {
      branches: 60,
      functions: 60,
      lines: 60,
      statements: 60
    },
    './backend/routes/': {
      branches: 60,
      functions: 60,
      lines: 60,
      statements: 60
    }
  },
  
  // Setup files
  setupFilesAfterEnv: [
    '<rootDir>/frontend/src/setupTests.js'
  ],
  
  // Test timeout
  testTimeout: 10000,
  
  // Verbose output
  verbose: true,
  
  // Clear mocks between tests
  clearMocks: true,
  
  // Restore mocks after each test
  restoreMocks: true,
  
  // Global setup and teardown
  globalSetup: '<rootDir>/scripts/test-setup.js',
  globalTeardown: '<rootDir>/scripts/test-teardown.js',
  
  // Test results processor
  testResultsProcessor: 'jest-sonar-reporter',
  
  // Coverage reporters
  coverageReporters: [
    'text',
    'lcov',
    'html',
    'json',
    'json-summary'
  ],
  
  // Projects for monorepo structure
  projects: [
    {
      displayName: 'backend',
      testMatch: ['<rootDir>/backend/tests/**/*.test.js'],
      testEnvironment: 'node',
      transform: {
        '^.+\\.(js|jsx)$': 'babel-jest'
      },
      collectCoverageFrom: [
        'backend/**/*.js',
        '!backend/node_modules/**',
        '!backend/coverage/**'
      ]
    },
    {
      displayName: 'frontend',
      testMatch: ['<rootDir>/frontend/src/tests/**/*.test.js'],
      testEnvironment: 'jsdom',
      setupFilesAfterEnv: ['<rootDir>/frontend/src/setupTests.js'],
      transform: {
        '^.+\\.(js|jsx)$': 'babel-jest'
      },
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/frontend/src/$1',
        '^@components/(.*)$': '<rootDir>/frontend/src/components/$1',
        '^@utils/(.*)$': '<rootDir>/frontend/src/utils/$1',
        '^@config/(.*)$': '<rootDir>/frontend/src/config/$1'
      },
      collectCoverageFrom: [
        'frontend/src/**/*.js',
        '!frontend/src/index.js',
        '!frontend/src/reportWebVitals.js',
        '!frontend/src/setupTests.js'
      ]
    }
  ]
};
