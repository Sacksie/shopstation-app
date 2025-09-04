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
  
  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    },
    // Higher thresholds for critical components
    './backend/middleware/': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    },
    './backend/routes/': {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85
    }
  },
  
  // Setup files
  setupFilesAfterEnv: [
    '<rootDir>/frontend/src/setupTests.js'
  ],
  
  // Module name mapping for frontend tests
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/frontend/src/$1',
    '^@components/(.*)$': '<rootDir>/frontend/src/components/$1',
    '^@utils/(.*)$': '<rootDir>/frontend/src/utils/$1',
    '^@config/(.*)$': '<rootDir>/frontend/src/config/$1'
  },
  
  // Transform configuration
  transform: {
    '^.+\\.(js|jsx)$': 'babel-jest'
  },
  
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
      collectCoverageFrom: [
        'frontend/src/**/*.js',
        '!frontend/src/index.js',
        '!frontend/src/reportWebVitals.js',
        '!frontend/src/setupTests.js'
      ]
    }
  ]
};
