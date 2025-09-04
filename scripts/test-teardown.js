/**
 * Global Test Teardown
 * 
 * This script runs after all tests to clean up the testing environment
 */

const fs = require('fs');
const path = require('path');

module.exports = async () => {
  console.log('🧹 Cleaning up test environment...');
  
  // Restore console methods
  if (global.originalConsole) {
    console.log = global.originalConsole.log;
    console.error = global.originalConsole.error;
    console.warn = global.originalConsole.warn;
    console.info = global.originalConsole.info;
  }
  
  // Clean up test files
  const testFiles = [
    'test-db.json',
    'test-backup.json',
    'test-uploads'
  ];
  
  testFiles.forEach(file => {
    const filePath = path.join(__dirname, '..', file);
    if (fs.existsSync(filePath)) {
      if (fs.statSync(filePath).isDirectory()) {
        fs.rmSync(filePath, { recursive: true, force: true });
      } else {
        fs.unlinkSync(filePath);
      }
    }
  });
  
  // Generate test summary
  const timestamp = new Date().toISOString();
  const summaryPath = path.join(__dirname, '..', 'test-results', `test-summary-${timestamp}.json`);
  
  const summary = {
    timestamp,
    environment: process.env.NODE_ENV,
    testMode: process.env.TEST_MODE,
    cleanup: 'completed'
  };
  
  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
  
  console.log('✅ Test environment cleanup complete');
};
