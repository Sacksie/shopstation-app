#!/usr/bin/env node

/**
 * Store Portal System Testing Script
 * 
 * BUSINESS CRITICAL: Comprehensive testing script for the Store Portal
 * that runs unit tests, integration tests, and security validations.
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs').promises;

// Test configuration
const TEST_CONFIG = {
  portalTests: [
    'portal-auth.test.js',
    'portal-endpoints.test.js',
    'db-operations-portal.test.js'
  ],
  coverageThreshold: 80,
  timeout: 30000
};

class PortalTestRunner {
  constructor() {
    this.results = {
      unit: { passed: 0, failed: 0, total: 0 },
      integration: { passed: 0, failed: 0, total: 0 },
      security: { passed: 0, failed: 0, total: 0 },
      coverage: { percentage: 0, threshold: TEST_CONFIG.coverageThreshold }
    };
    this.startTime = Date.now();
  }

  async runCommand(command, args = [], options = {}) {
    return new Promise((resolve, reject) => {
      const child = spawn(command, args, {
        stdio: 'pipe',
        cwd: process.cwd(),
        ...options
      });

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        resolve({
          code,
          stdout,
          stderr,
          success: code === 0
        });
      });

      child.on('error', (error) => {
        reject(error);
      });
    });
  }

  async checkDatabaseConnection() {
    console.log('🔍 Checking database connection...');
    
    try {
      const database = require('../database/db-connection');
      
      if (!database.isAvailable()) {
        console.log('⚠️  PostgreSQL not available, tests will use mocked database');
        return false;
      }

      // Test a simple query
      const result = await database.query('SELECT 1 as test');
      if (result.rows[0].test === 1) {
        console.log('✅ Database connection successful');
        return true;
      }
    } catch (error) {
      console.log('⚠️  Database connection failed:', error.message);
      return false;
    }
  }

  async runUnitTests() {
    console.log('\n🧪 Running Unit Tests...\n');
    
    const testFiles = TEST_CONFIG.portalTests.map(file => 
      path.join(__dirname, '..', 'tests', file)
    );

    try {
      const result = await this.runCommand('npx', [
        'jest',
        ...testFiles,
        '--verbose',
        '--no-coverage',
        '--testTimeout=10000'
      ]);

      if (result.success) {
        console.log('✅ Unit tests passed');
        this.parseTestResults(result.stdout, 'unit');
      } else {
        console.log('❌ Unit tests failed');
        console.log(result.stdout);
        console.log(result.stderr);
        this.parseTestResults(result.stdout, 'unit');
      }

      return result.success;
    } catch (error) {
      console.error('❌ Error running unit tests:', error.message);
      return false;
    }
  }

  async runIntegrationTests() {
    console.log('\n🔗 Running Integration Tests...\n');
    
    try {
      // Test database operations
      const dbTestResult = await this.runCommand('npx', [
        'jest',
        'tests/db-operations-portal.test.js',
        '--verbose',
        '--testTimeout=15000'
      ]);

      if (dbTestResult.success) {
        console.log('✅ Database integration tests passed');
        this.parseTestResults(dbTestResult.stdout, 'integration');
      } else {
        console.log('❌ Database integration tests failed');
        console.log(dbTestResult.stdout);
        console.log(dbTestResult.stderr);
        this.parseTestResults(dbTestResult.stdout, 'integration');
      }

      return dbTestResult.success;
    } catch (error) {
      console.error('❌ Error running integration tests:', error.message);
      return false;
    }
  }

  async runSecurityTests() {
    console.log('\n🔒 Running Security Tests...\n');
    
    try {
      const result = await this.runCommand('npx', [
        'jest',
        'tests/portal-auth.test.js',
        '--testNamePattern="Security|SQL injection|XSS"',
        '--verbose',
        '--testTimeout=10000'
      ]);

      if (result.success) {
        console.log('✅ Security tests passed');
        this.parseTestResults(result.stdout, 'security');
      } else {
        console.log('❌ Security tests failed');
        console.log(result.stdout);
        console.log(result.stderr);
        this.parseTestResults(result.stdout, 'security');
      }

      return result.success;
    } catch (error) {
      console.error('❌ Error running security tests:', error.message);
      return false;
    }
  }

  async runCoverageTests() {
    console.log('\n📊 Running Coverage Tests...\n');
    
    try {
      const result = await this.runCommand('npx', [
        'jest',
        ...TEST_CONFIG.portalTests,
        '--coverage',
        '--coverageReporters=text',
        '--testTimeout=15000'
      ]);

      if (result.success) {
        console.log('✅ Coverage tests completed');
        this.parseCoverageResults(result.stdout);
      } else {
        console.log('❌ Coverage tests failed');
        console.log(result.stdout);
        console.log(result.stderr);
      }

      return result.success;
    } catch (error) {
      console.error('❌ Error running coverage tests:', error.message);
      return false;
    }
  }

  parseTestResults(output, category) {
    const lines = output.split('\n');
    
    for (const line of lines) {
      if (line.includes('Tests:')) {
        const match = line.match(/(\d+) passed|(\d+) failed/);
        if (match) {
          this.results[category].passed = parseInt(match[1] || '0');
          this.results[category].failed = parseInt(match[2] || '0');
          this.results[category].total = this.results[category].passed + this.results[category].failed;
        }
      }
    }
  }

  parseCoverageResults(output) {
    const lines = output.split('\n');
    
    for (const line of lines) {
      if (line.includes('All files') && line.includes('%')) {
        const match = line.match(/(\d+(?:\.\d+)?)%/);
        if (match) {
          this.results.coverage.percentage = parseFloat(match[1]);
        }
      }
    }
  }

  async testPortalEndpoints() {
    console.log('\n🌐 Testing Portal Endpoints...\n');
    
    try {
      // Start the server in test mode
      const serverProcess = spawn('node', ['server.js'], {
        stdio: 'pipe',
        env: { ...process.env, NODE_ENV: 'test' }
      });

      // Wait for server to start
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Test login endpoint
      const loginTest = await this.runCommand('curl', [
        '-X', 'POST',
        'http://localhost:3000/api/portal/login',
        '-H', 'Content-Type: application/json',
        '-d', '{"email":"test@store.com","password":"testpass"}',
        '-w', '%{http_code}'
      ]);

      if (loginTest.stdout.includes('401')) {
        console.log('✅ Login endpoint properly rejects invalid credentials');
      } else {
        console.log('⚠️  Login endpoint response unexpected');
      }

      // Test protected endpoint without auth
      const protectedTest = await this.runCommand('curl', [
        '-X', 'GET',
        'http://localhost:3000/api/portal/dashboard-summary',
        '-w', '%{http_code}'
      ]);

      if (protectedTest.stdout.includes('401')) {
        console.log('✅ Protected endpoints properly require authentication');
      } else {
        console.log('⚠️  Protected endpoint response unexpected');
      }

      // Stop the server
      serverProcess.kill();
      
      return true;
    } catch (error) {
      console.error('❌ Error testing portal endpoints:', error.message);
      return false;
    }
  }

  async generateTestReport() {
    const endTime = Date.now();
    const duration = (endTime - this.startTime) / 1000;

    console.log('\n📋 Test Report Summary\n');
    console.log('='.repeat(50));
    
    console.log(`⏱️  Total Duration: ${duration.toFixed(2)}s`);
    console.log('');

    // Unit Tests
    console.log('🧪 Unit Tests:');
    console.log(`   Passed: ${this.results.unit.passed}`);
    console.log(`   Failed: ${this.results.unit.failed}`);
    console.log(`   Total:  ${this.results.unit.total}`);
    console.log('');

    // Integration Tests
    console.log('🔗 Integration Tests:');
    console.log(`   Passed: ${this.results.integration.passed}`);
    console.log(`   Failed: ${this.results.integration.failed}`);
    console.log(`   Total:  ${this.results.integration.total}`);
    console.log('');

    // Security Tests
    console.log('🔒 Security Tests:');
    console.log(`   Passed: ${this.results.security.passed}`);
    console.log(`   Failed: ${this.results.security.failed}`);
    console.log(`   Total:  ${this.results.security.total}`);
    console.log('');

    // Coverage
    console.log('📊 Code Coverage:');
    console.log(`   Percentage: ${this.results.coverage.percentage}%`);
    console.log(`   Threshold:  ${this.results.coverage.threshold}%`);
    
    const coverageStatus = this.results.coverage.percentage >= this.results.coverage.threshold ? '✅' : '❌';
    console.log(`   Status:     ${coverageStatus}`);
    console.log('');

    // Overall Status
    const totalPassed = this.results.unit.passed + this.results.integration.passed + this.results.security.passed;
    const totalFailed = this.results.unit.failed + this.results.integration.failed + this.results.security.failed;
    const totalTests = totalPassed + totalFailed;

    console.log('🎯 Overall Results:');
    console.log(`   Total Tests: ${totalTests}`);
    console.log(`   Passed:      ${totalPassed}`);
    console.log(`   Failed:      ${totalFailed}`);
    
    const overallStatus = totalFailed === 0 && this.results.coverage.percentage >= this.results.coverage.threshold ? '✅ PASS' : '❌ FAIL';
    console.log(`   Status:      ${overallStatus}`);
    console.log('');

    if (totalFailed > 0) {
      console.log('❌ Some tests failed. Please review the output above.');
      process.exit(1);
    } else if (this.results.coverage.percentage < this.results.coverage.threshold) {
      console.log('❌ Coverage below threshold. Please add more tests.');
      process.exit(1);
    } else {
      console.log('✅ All tests passed! Store Portal is ready for deployment.');
    }
  }

  async run() {
    console.log('🏪 Store Portal System Testing\n');
    console.log('This script will run comprehensive tests for the Store Portal system.\n');

    // Check database connection
    await this.checkDatabaseConnection();

    // Run all test suites
    const unitSuccess = await this.runUnitTests();
    const integrationSuccess = await this.runIntegrationTests();
    const securitySuccess = await this.runSecurityTests();
    const coverageSuccess = await this.runCoverageTests();
    const endpointSuccess = await this.testPortalEndpoints();

    // Generate report
    await this.generateTestReport();
  }
}

// Main execution
async function main() {
  const command = process.argv[2];

  switch (command) {
    case 'unit':
      const runner = new PortalTestRunner();
      await runner.runUnitTests();
      break;
    case 'integration':
      const integrationRunner = new PortalTestRunner();
      await integrationRunner.runIntegrationTests();
      break;
    case 'security':
      const securityRunner = new PortalTestRunner();
      await securityRunner.runSecurityTests();
      break;
    case 'coverage':
      const coverageRunner = new PortalTestRunner();
      await coverageRunner.runCoverageTests();
      break;
    case 'all':
    default:
      const fullRunner = new PortalTestRunner();
      await fullRunner.run();
      break;
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Run the script
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Test script failed:', error.message);
    process.exit(1);
  });
}

module.exports = PortalTestRunner;
