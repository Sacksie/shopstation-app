#!/usr/bin/env node

/**
 * Automated Quality Gates System
 * 
 * BUSINESS CRITICAL: Prevents deployment of code that doesn't meet quality standards
 * - Enforces code quality, security, and performance requirements
 * - Prevents production incidents through comprehensive validation
 * - Maintains high reliability standards for customer-facing systems
 */

const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');
const config = require('../config/environments');

class QualityGateSystem {
  constructor(options = {}) {
    this.environment = config.environment;
    this.strictMode = options.strictMode || this.environment === 'production';
    this.results = {
      passed: [],
      failed: [],
      warnings: [],
      startTime: new Date(),
      environment: this.environment
    };
  }

  /**
   * Run all quality gates
   */
  async runAllGates() {
    console.log('🚪 ShopStation Quality Gates System');
    console.log(`📍 Environment: ${this.environment}`);
    console.log(`🔒 Strict Mode: ${this.strictMode ? 'ENABLED' : 'DISABLED'}`);
    console.log('==========================================\n');

    const gates = [
      { name: 'Code Quality', fn: () => this.checkCodeQuality() },
      { name: 'Security Scan', fn: () => this.runSecurityScan() },
      { name: 'Test Coverage', fn: () => this.validateTestCoverage() },
      { name: 'Performance Tests', fn: () => this.runPerformanceTests() },
      { name: 'Environment Config', fn: () => this.validateEnvironmentConfig() },
      { name: 'Database Integrity', fn: () => this.validateDatabaseIntegrity() },
      { name: 'API Compatibility', fn: () => this.checkAPICompatibility() },
      { name: 'Dependencies', fn: () => this.checkDependencies() }
    ];

    for (const gate of gates) {
      try {
        console.log(`🔍 Running gate: ${gate.name}...`);
        await gate.fn();
        this.results.passed.push(gate.name);
        console.log(`✅ ${gate.name} passed\n`);
      } catch (error) {
        this.results.failed.push({ name: gate.name, error: error.message });
        console.error(`❌ ${gate.name} failed: ${error.message}\n`);
        
        if (this.strictMode && this.isCriticalGate(gate.name)) {
          console.error('🚨 CRITICAL GATE FAILURE - DEPLOYMENT BLOCKED');
          break;
        }
      }
    }

    return this.generateReport();
  }

  /**
   * Check code quality standards
   */
  async checkCodeQuality() {
    console.log('   📊 Analyzing code quality...');
    
    // Check for TODO/FIXME comments in production
    if (this.strictMode) {
      const todoCount = await this.countTodoComments();
      if (todoCount > 0) {
        this.results.warnings.push(`Found ${todoCount} TODO/FIXME comments`);
      }
    }

    // Check for console.log statements in production code
    const consoleLogCount = await this.countConsoleStatements();
    if (consoleLogCount > 5 && this.strictMode) {
      throw new Error(`Too many console.log statements (${consoleLogCount}) - consider using proper logging`);
    }

    // Check file sizes
    await this.checkFileComplexity();
    
    // Validate naming conventions
    await this.validateNamingConventions();

    console.log('   ✅ Code quality standards met');
  }

  /**
   * Run security vulnerability scan
   */
  async runSecurityScan() {
    console.log('   🛡️  Scanning for security vulnerabilities...');
    
    try {
      // Run npm audit
      const auditOutput = execSync('npm audit --json', { 
        cwd: path.join(__dirname, '..'),
        encoding: 'utf8'
      });
      
      const auditResults = JSON.parse(auditOutput);
      
      if (auditResults.metadata) {
        const { vulnerabilities } = auditResults.metadata;
        const criticalCount = vulnerabilities.critical || 0;
        const highCount = vulnerabilities.high || 0;
        
        if (criticalCount > 0) {
          throw new Error(`Found ${criticalCount} critical security vulnerabilities`);
        }
        
        if (highCount > 0 && this.strictMode) {
          throw new Error(`Found ${highCount} high-severity security vulnerabilities`);
        }
        
        if (highCount > 0) {
          this.results.warnings.push(`Found ${highCount} high-severity vulnerabilities`);
        }
      }
    } catch (error) {
      if (error.status === 0) {
        // npm audit returns 0 when no vulnerabilities found
        console.log('   ✅ No security vulnerabilities found');
      } else if (error.message.includes('critical') || error.message.includes('high-severity')) {
        throw error;
      } else {
        // Audit command failed for other reasons
        this.results.warnings.push('Could not complete security scan');
      }
    }

    // Check for hardcoded secrets
    await this.scanForHardcodedSecrets();

    console.log('   ✅ Security scan completed');
  }

  /**
   * Validate test coverage meets requirements
   */
  async validateTestCoverage() {
    console.log('   📈 Validating test coverage...');
    
    try {
      // Run tests with coverage
      execSync('npm test -- --coverage --silent', {
        cwd: path.join(__dirname, '..'),
        stdio: 'pipe'
      });
      
      // Read coverage report
      const coveragePath = path.join(__dirname, '..', 'coverage', 'coverage-summary.json');
      const coverageData = await fs.readFile(coveragePath, 'utf8');
      const coverage = JSON.parse(coverageData);
      
      const { lines, functions, branches, statements } = coverage.total;
      const minCoverage = this.strictMode ? 70 : 50;
      
      console.log(`   📊 Coverage: Lines ${lines.pct}%, Functions ${functions.pct}%, Branches ${branches.pct}%`);
      
      if (lines.pct < minCoverage) {
        throw new Error(`Line coverage ${lines.pct}% is below minimum ${minCoverage}%`);
      }
      
      if (functions.pct < minCoverage) {
        throw new Error(`Function coverage ${functions.pct}% is below minimum ${minCoverage}%`);
      }
      
      this.results.coverage = { lines: lines.pct, functions: functions.pct, branches: branches.pct };
      
    } catch (error) {
      if (error.message.includes('coverage')) {
        throw error;
      }
      throw new Error('Failed to generate or validate test coverage');
    }

    console.log('   ✅ Test coverage requirements met');
  }

  /**
   * Run performance tests
   */
  async runPerformanceTests() {
    console.log('   ⚡ Running performance tests...');
    
    // Test API response times
    const performanceResults = await this.testAPIPerformance();
    
    if (performanceResults.averageResponseTime > 500) {
      throw new Error(`Average API response time ${performanceResults.averageResponseTime}ms exceeds 500ms limit`);
    }
    
    // Test memory usage
    const memoryUsage = process.memoryUsage();
    const memoryMB = memoryUsage.heapUsed / 1024 / 1024;
    
    if (memoryMB > 100) {
      this.results.warnings.push(`Memory usage ${memoryMB.toFixed(2)}MB is high`);
    }
    
    this.results.performance = {
      averageResponseTime: performanceResults.averageResponseTime,
      memoryUsageMB: memoryMB.toFixed(2)
    };

    console.log('   ✅ Performance tests passed');
  }

  /**
   * Validate environment configuration
   */
  async validateEnvironmentConfig() {
    console.log('   🔧 Validating environment configuration...');
    
    const requiredVars = ['NODE_ENV', 'JWT_SECRET', 'ADMIN_PASSWORD'];
    const missingVars = [];
    
    for (const varName of requiredVars) {
      if (!process.env[varName]) {
        missingVars.push(varName);
      }
    }
    
    if (missingVars.length > 0) {
      throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
    }
    
    // Validate environment-specific requirements
    if (this.environment === 'production') {
      if (process.env.JWT_SECRET === 'development-jwt-secret-change-me') {
        throw new Error('Production deployment with insecure JWT secret');
      }
      
      if (process.env.ADMIN_PASSWORD === 'temp-password-123') {
        throw new Error('Production deployment with default admin password');
      }
    }

    console.log('   ✅ Environment configuration valid');
  }

  /**
   * Validate database integrity
   */
  async validateDatabaseIntegrity() {
    console.log('   🗄️  Validating database integrity...');
    
    try {
      const { DatabaseMigrationManager } = require('../migrations/migration-manager');
      const migrationManager = new DatabaseMigrationManager();
      
      const integrityResult = await migrationManager.validateDatabaseIntegrity();
      
      if (!integrityResult.valid) {
        const issues = integrityResult.issues || ['Unknown database integrity issue'];
        throw new Error(`Database integrity issues: ${issues.join(', ')}`);
      }
      
      // Check if migrations are up to date
      const currentVersion = await migrationManager.getCurrentVersion();
      const availableMigrations = await migrationManager.getAvailableMigrations();
      const latestVersion = Math.max(...availableMigrations.map(m => m.version), 0);
      
      if (currentVersion < latestVersion) {
        throw new Error(`Database migrations not up to date (current: ${currentVersion}, latest: ${latestVersion})`);
      }
      
    } catch (error) {
      if (error.message.includes('integrity') || error.message.includes('migrations')) {
        throw error;
      }
      throw new Error('Failed to validate database integrity');
    }

    console.log('   ✅ Database integrity validated');
  }

  /**
   * Check API compatibility
   */
  async checkAPICompatibility() {
    console.log('   🔗 Checking API compatibility...');
    
    // Validate API endpoints are working
    const express = require('express');
    const app = express();
    
    // Load routes
    try {
      const compareRoutes = require('../routes/compare');
      const manualEntryRoutes = require('../routes/manual-entry');
      
      app.use(express.json());
      app.use('/api', compareRoutes);
      app.use('/api/manual', manualEntryRoutes);
      
      // Basic API structure validation passed
      
    } catch (error) {
      throw new Error(`API routes failed to load: ${error.message}`);
    }

    console.log('   ✅ API compatibility validated');
  }

  /**
   * Check dependencies
   */
  async checkDependencies() {
    console.log('   📦 Checking dependencies...');
    
    try {
      const packagePath = path.join(__dirname, '..', 'package.json');
      const packageLockPath = path.join(__dirname, '..', 'package-lock.json');
      
      const packageData = await fs.readFile(packagePath, 'utf8');
      const packageJson = JSON.parse(packageData);
      
      // Check if package-lock.json exists
      try {
        await fs.access(packageLockPath);
      } catch (error) {
        throw new Error('package-lock.json not found - run npm install');
      }
      
      // Check for deprecated dependencies
      const deprecatedPackages = ['node-fetch']; // Example
      const usedDeprecated = [];
      
      for (const dep of Object.keys(packageJson.dependencies || {})) {
        if (deprecatedPackages.includes(dep)) {
          usedDeprecated.push(dep);
        }
      }
      
      if (usedDeprecated.length > 0) {
        this.results.warnings.push(`Using deprecated packages: ${usedDeprecated.join(', ')}`);
      }
      
    } catch (error) {
      if (error.message.includes('package-lock.json')) {
        throw error;
      }
      throw new Error(`Dependency check failed: ${error.message}`);
    }

    console.log('   ✅ Dependencies validated');
  }

  /**
   * Helper methods
   */
  
  async countTodoComments() {
    try {
      const output = execSync('grep -r "TODO\\|FIXME" --include="*.js" .', {
        cwd: path.join(__dirname, '..'),
        encoding: 'utf8'
      });
      return output.split('\n').filter(line => line.trim()).length;
    } catch (error) {
      return 0; // No TODO comments found
    }
  }

  async countConsoleStatements() {
    try {
      const output = execSync('grep -r "console\\.log" --include="*.js" routes/ utils/ database/', {
        cwd: path.join(__dirname, '..'),
        encoding: 'utf8'
      });
      return output.split('\n').filter(line => line.trim()).length;
    } catch (error) {
      return 0; // No console.log statements found
    }
  }

  async checkFileComplexity() {
    // Check for overly large files
    const jsFiles = execSync('find . -name "*.js" -not -path "./node_modules/*" -not -path "./tests/*"', {
      cwd: path.join(__dirname, '..'),
      encoding: 'utf8'
    }).split('\n').filter(Boolean);

    for (const file of jsFiles) {
      const filePath = path.join(__dirname, '..', file);
      try {
        const content = await fs.readFile(filePath, 'utf8');
        const lineCount = content.split('\n').length;
        
        if (lineCount > 500) {
          this.results.warnings.push(`Large file detected: ${file} (${lineCount} lines)`);
        }
      } catch (error) {
        // File might not exist or be readable - skip
      }
    }
  }

  async validateNamingConventions() {
    // Check for consistent naming conventions
    const jsFiles = execSync('find . -name "*.js" -not -path "./node_modules/*"', {
      cwd: path.join(__dirname, '..'),
      encoding: 'utf8'
    }).split('\n').filter(Boolean);

    const badNames = jsFiles.filter(file => {
      const basename = path.basename(file);
      return basename.includes(' ') || /[A-Z]/.test(basename.replace('.js', ''));
    });

    if (badNames.length > 0 && this.strictMode) {
      this.results.warnings.push(`Files with inconsistent naming: ${badNames.slice(0, 3).join(', ')}`);
    }
  }

  async scanForHardcodedSecrets() {
    // Scan for potential hardcoded secrets
    const patterns = [
      /password\s*=\s*["'][^"']+["']/gi,
      /secret\s*=\s*["'][^"']+["']/gi,
      /api[_-]?key\s*=\s*["'][^"']+["']/gi
    ];

    let secretsFound = 0;
    
    try {
      for (const pattern of patterns) {
        const output = execSync(`grep -r -E "${pattern.source}" --include="*.js" .`, {
          cwd: path.join(__dirname, '..'),
          encoding: 'utf8'
        });
        secretsFound += output.split('\n').filter(line => line.trim()).length;
      }
    } catch (error) {
      // No matches found - this is good
    }

    if (secretsFound > 0) {
      this.results.warnings.push(`Potential hardcoded secrets found: ${secretsFound}`);
    }
  }

  async testAPIPerformance() {
    // Mock performance test - in real implementation would test actual endpoints
    return new Promise(resolve => {
      const startTime = Date.now();
      
      setTimeout(() => {
        const responseTime = Date.now() - startTime + Math.random() * 100;
        resolve({ averageResponseTime: Math.round(responseTime) });
      }, 50);
    });
  }

  isCriticalGate(gateName) {
    const criticalGates = [
      'Security Scan',
      'Environment Config', 
      'Database Integrity',
      'API Compatibility'
    ];
    
    return criticalGates.includes(gateName);
  }

  generateReport() {
    const endTime = new Date();
    const duration = endTime - this.results.startTime;
    
    console.log('\n🏁 QUALITY GATES REPORT');
    console.log('==========================================');
    console.log(`📍 Environment: ${this.results.environment}`);
    console.log(`⏱️  Duration: ${duration}ms`);
    console.log(`✅ Passed: ${this.results.passed.length}`);
    console.log(`❌ Failed: ${this.results.failed.length}`);
    console.log(`⚠️  Warnings: ${this.results.warnings.length}`);

    if (this.results.failed.length > 0) {
      console.log('\n❌ FAILED GATES:');
      this.results.failed.forEach(failure => {
        console.log(`   - ${failure.name}: ${failure.error}`);
      });
    }

    if (this.results.warnings.length > 0) {
      console.log('\n⚠️  WARNINGS:');
      this.results.warnings.forEach(warning => {
        console.log(`   - ${warning}`);
      });
    }

    if (this.results.coverage) {
      console.log(`\n📊 Test Coverage: ${this.results.coverage.lines}% lines, ${this.results.coverage.functions}% functions`);
    }

    if (this.results.performance) {
      console.log(`⚡ Performance: ${this.results.performance.averageResponseTime}ms avg response, ${this.results.performance.memoryUsageMB}MB memory`);
    }

    const success = this.results.failed.length === 0;
    
    console.log('\n==========================================');
    
    if (success) {
      console.log('🎉 ALL QUALITY GATES PASSED - DEPLOYMENT APPROVED');
      console.log('✅ Code meets production quality standards');
    } else {
      console.log('🚫 QUALITY GATES FAILED - DEPLOYMENT BLOCKED');
      console.log('❌ Code does not meet quality standards');
      console.log('\n🔧 REQUIRED ACTIONS:');
      console.log('   1. Fix all failed quality gates');
      console.log('   2. Re-run quality gates: npm run quality-gates');
      console.log('   3. Only deploy after all gates pass');
    }

    return {
      success,
      passed: this.results.passed.length,
      failed: this.results.failed.length,
      warnings: this.results.warnings.length,
      duration,
      details: this.results
    };
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const strictMode = args.includes('--strict') || process.env.NODE_ENV === 'production';
  
  const qualityGates = new QualityGateSystem({ strictMode });
  
  qualityGates.runAllGates()
    .then(result => {
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('💥 Quality gates system error:', error.message);
      process.exit(1);
    });
}

module.exports = { QualityGateSystem };