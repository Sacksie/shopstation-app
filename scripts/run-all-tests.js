#!/usr/bin/env node

/**
 * Comprehensive Test Runner for ShopStation
 * 
 * This script runs all tests in the correct order:
 * 1. Unit tests (backend)
 * 2. Integration tests (backend)
 * 3. Component tests (frontend)
 * 4. E2E tests (full application)
 */

const { execSync } = require('child_process');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function runCommand(command, description) {
  log(`\n${colors.cyan}🔄 ${description}${colors.reset}`);
  log(`${colors.yellow}Running: ${command}${colors.reset}`);
  
  try {
    const output = execSync(command, { 
      stdio: 'inherit',
      cwd: process.cwd()
    });
    log(`${colors.green}✅ ${description} completed successfully${colors.reset}`);
    return true;
  } catch (error) {
    log(`${colors.red}❌ ${description} failed${colors.reset}`);
    log(`${colors.red}Error: ${error.message}${colors.reset}`);
    return false;
  }
}

function checkPrerequisites() {
  log(`${colors.blue}🔍 Checking prerequisites...${colors.reset}`);
  
  // Check if Node.js is installed
  try {
    execSync('node --version', { stdio: 'pipe' });
    log(`${colors.green}✅ Node.js is installed${colors.reset}`);
  } catch (error) {
    log(`${colors.red}❌ Node.js is not installed${colors.reset}`);
    return false;
  }

  // Check if npm is installed
  try {
    execSync('npm --version', { stdio: 'pipe' });
    log(`${colors.green}✅ npm is installed${colors.reset}`);
  } catch (error) {
    log(`${colors.red}❌ npm is not installed${colors.reset}`);
    return false;
  }

  // Check if dependencies are installed
  try {
    execSync('npm list jest', { stdio: 'pipe' });
    log(`${colors.green}✅ Jest is installed${colors.reset}`);
  } catch (error) {
    log(`${colors.yellow}⚠️  Jest not found, installing dependencies...${colors.reset}`);
    runCommand('npm install', 'Installing dependencies');
  }

  return true;
}

function runUnitTests() {
  log(`${colors.magenta}\n📋 Phase 1: Unit Tests${colors.reset}`);
  
  const tests = [
    {
      command: 'npm test -- backend/tests/unit/db-operations.test.js',
      description: 'Database Operations Unit Tests'
    },
    {
      command: 'npm test -- backend/tests/unit/backupManager.test.js',
      description: 'Backup Manager Unit Tests'
    }
  ];

  let allPassed = true;
  for (const test of tests) {
    if (!runCommand(test.command, test.description)) {
      allPassed = false;
    }
  }

  return allPassed;
}

function runIntegrationTests() {
  log(`${colors.magenta}\n📋 Phase 2: Integration Tests${colors.reset}`);
  
  const tests = [
    {
      command: 'npm test -- backend/tests/integration/api-endpoints.test.js',
      description: 'API Endpoints Integration Tests'
    }
  ];

  let allPassed = true;
  for (const test of tests) {
    if (!runCommand(test.command, test.description)) {
      allPassed = false;
    }
  }

  return allPassed;
}

function runComponentTests() {
  log(`${colors.magenta}\n📋 Phase 3: Component Tests${colors.reset}`);
  
  const tests = [
    {
      command: 'npm test -- frontend/src/tests/ComprehensiveAdminPanel.test.js',
      description: 'Comprehensive Admin Panel Component Tests'
    },
    {
      command: 'npm test -- frontend/src/tests/StorePortal.test.js',
      description: 'Store Portal Component Tests'
    }
  ];

  let allPassed = true;
  for (const test of tests) {
    if (!runCommand(test.command, test.description)) {
      allPassed = false;
    }
  }

  return allPassed;
}

function runE2ETests() {
  log(`${colors.magenta}\n📋 Phase 4: End-to-End Tests${colors.reset}`);
  
  // Check if Cypress is installed
  try {
    execSync('npx cypress --version', { stdio: 'pipe' });
  } catch (error) {
    log(`${colors.yellow}⚠️  Cypress not found, installing...${colors.reset}`);
    runCommand('npm install --save-dev cypress', 'Installing Cypress');
  }

  const tests = [
    {
      command: 'npx cypress run --spec "cypress/e2e/admin-workflow.cy.js"',
      description: 'Admin Workflow E2E Tests'
    },
    {
      command: 'npx cypress run --spec "cypress/e2e/store-portal-workflow.cy.js"',
      description: 'Store Portal Workflow E2E Tests'
    },
    {
      command: 'npx cypress run --spec "cypress/e2e/public-user-workflow.cy.js"',
      description: 'Public User Workflow E2E Tests'
    }
  ];

  let allPassed = true;
  for (const test of tests) {
    if (!runCommand(test.command, test.description)) {
      allPassed = false;
    }
  }

  return allPassed;
}

function generateTestReport() {
  log(`${colors.blue}\n📊 Generating Test Report...${colors.reset}`);
  
  try {
    // Generate coverage report
    runCommand('npm run test:coverage', 'Generating Coverage Report');
    
    // Generate E2E test report
    runCommand('npx cypress run --reporter json --reporter-options output=cypress/results/results.json', 'Generating E2E Test Report');
    
    log(`${colors.green}✅ Test reports generated successfully${colors.reset}`);
    log(`${colors.cyan}📁 Coverage report: coverage/index.html${colors.reset}`);
    log(`${colors.cyan}📁 E2E report: cypress/results/results.json${colors.reset}`);
  } catch (error) {
    log(`${colors.yellow}⚠️  Could not generate test reports: ${error.message}${colors.reset}`);
  }
}

function main() {
  log(`${colors.bright}${colors.blue}🚀 ShopStation Comprehensive Test Suite${colors.reset}`);
  log(`${colors.blue}==========================================${colors.reset}`);

  const startTime = Date.now();

  // Check prerequisites
  if (!checkPrerequisites()) {
    log(`${colors.red}❌ Prerequisites check failed. Exiting.${colors.reset}`);
    process.exit(1);
  }

  // Run all test phases
  const results = {
    unit: runUnitTests(),
    integration: runIntegrationTests(),
    component: runComponentTests(),
    e2e: runE2ETests()
  };

  // Generate reports
  generateTestReport();

  // Summary
  const endTime = Date.now();
  const duration = Math.round((endTime - startTime) / 1000);

  log(`${colors.bright}\n📋 Test Summary${colors.reset}`);
  log(`${colors.blue}================${colors.reset}`);
  log(`Unit Tests: ${results.unit ? `${colors.green}✅ PASSED${colors.reset}` : `${colors.red}❌ FAILED${colors.reset}`}`);
  log(`Integration Tests: ${results.integration ? `${colors.green}✅ PASSED${colors.reset}` : `${colors.red}❌ FAILED${colors.reset}`}`);
  log(`Component Tests: ${results.component ? `${colors.green}✅ PASSED${colors.reset}` : `${colors.red}❌ FAILED${colors.reset}`}`);
  log(`E2E Tests: ${results.e2e ? `${colors.green}✅ PASSED${colors.reset}` : `${colors.red}❌ FAILED${colors.reset}`}`);
  log(`\nTotal Duration: ${duration}s`);

  const allPassed = Object.values(results).every(result => result);
  
  if (allPassed) {
    log(`${colors.bright}${colors.green}🎉 All tests passed successfully!${colors.reset}`);
    process.exit(0);
  } else {
    log(`${colors.bright}${colors.red}💥 Some tests failed. Please review the output above.${colors.reset}`);
    process.exit(1);
  }
}

// Handle command line arguments
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  log(`${colors.bright}ShopStation Test Runner${colors.reset}`);
  log(`Usage: node scripts/run-all-tests.js [options]`);
  log(`\nOptions:`);
  log(`  --help, -h     Show this help message`);
  log(`  --unit         Run only unit tests`);
  log(`  --integration  Run only integration tests`);
  log(`  --component    Run only component tests`);
  log(`  --e2e          Run only E2E tests`);
  log(`  --coverage     Generate coverage report`);
  process.exit(0);
}

if (args.includes('--unit')) {
  runUnitTests();
} else if (args.includes('--integration')) {
  runIntegrationTests();
} else if (args.includes('--component')) {
  runComponentTests();
} else if (args.includes('--e2e')) {
  runE2ETests();
} else {
  main();
}
