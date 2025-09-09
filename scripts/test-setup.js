/**
 * Global Test Setup
 * 
 * This script runs before all tests to set up the testing environment
 */

const fs = require('fs');
const path = require('path');

module.exports = async () => {
  console.log('🔧 Setting up test environment...');
  
  // Create test results directory
  const testResultsDir = path.join(__dirname, '..', 'test-results');
  if (!fs.existsSync(testResultsDir)) {
    fs.mkdirSync(testResultsDir, { recursive: true });
  }
  
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.TEST_MODE = 'true';
  
  // Mock console methods for cleaner test output
  global.originalConsole = {
    log: console.log,
    error: console.error,
    warn: console.warn,
    info: console.info
  };
  
  // Suppress console output during tests unless verbose
  if (!process.env.VERBOSE_TESTS) {
    console.log = () => {};
    console.error = () => {};
    console.warn = () => {};
    console.info = () => {};
  }
  
  console.log('✅ Test environment setup complete');
};
