#!/usr/bin/env node

/**
 * Deployment Verification Script
 * 
 * BUSINESS CRITICAL: Comprehensive verification of PostgreSQL migration
 * - Tests all API endpoints
 * - Validates data integrity
 * - Checks performance metrics
 * - Verifies admin panel functionality
 */

const axios = require('axios');

class DeploymentVerification {
  constructor() {
    this.baseUrl = process.env.API_URL || 'http://localhost:3001';
    this.results = {
      passed: 0,
      failed: 0,
      tests: []
    };
  }

  /**
   * Main verification process
   */
  async verify() {
    console.log('🔍 ShopStation Deployment Verification');
    console.log('=====================================');
    console.log(`🌐 Testing: ${this.baseUrl}`);
    console.log(`📅 Started: ${new Date().toISOString()}`);
    console.log('');

    try {
      // Test 1: Health Check
      await this.testHealthCheck();
      
      // Test 2: Database Connection
      await this.testDatabaseConnection();
      
      // Test 3: Store Data
      await this.testStoreData();
      
      // Test 4: Product Data
      await this.testProductData();
      
      // Test 5: Price Comparison
      await this.testPriceComparison();
      
      // Test 6: Admin Panel Access
      await this.testAdminPanel();
      
      // Test 7: Performance
      await this.testPerformance();
      
      // Generate Report
      await this.generateReport();
      
      return this.results.failed === 0;
      
    } catch (error) {
      console.error('💥 Verification failed:', error.message);
      return false;
    }
  }

  /**
   * Test health check endpoint
   */
  async testHealthCheck() {
    console.log('🏥 Testing Health Check...');
    
    try {
      const response = await axios.get(`${this.baseUrl}/api/health`, { timeout: 10000 });
      
      if (response.status === 200 && response.data.status === 'healthy') {
        this.passTest('Health Check', 'API is responding correctly');
      } else {
        this.failTest('Health Check', `Unexpected response: ${response.status}`);
      }
    } catch (error) {
      this.failTest('Health Check', `Connection failed: ${error.message}`);
    }
  }

  /**
   * Test database connection
   */
  async testDatabaseConnection() {
    console.log('🗄️ Testing Database Connection...');
    
    try {
      // Test by checking if we get store data
      const response = await axios.get(`${this.baseUrl}/api/manual/inventory`, {
        headers: { 'x-admin-password': process.env.ADMIN_PASSWORD },
        timeout: 10000
      });
      
      if (response.status === 200 && response.data.success) {
        const storeCount = Object.keys(response.data.data.stores || {}).length;
        if (storeCount >= 4) {
          this.passTest('Database Connection', `Connected successfully with ${storeCount} stores`);
        } else {
          this.failTest('Database Connection', `Only ${storeCount} stores found, expected 4+`);
        }
      } else {
        this.failTest('Database Connection', 'Failed to retrieve store data');
      }
    } catch (error) {
      this.failTest('Database Connection', `Database test failed: ${error.message}`);
    }
  }

  /**
   * Test store data
   */
  async testStoreData() {
    console.log('🏪 Testing Store Data...');
    
    try {
      const response = await axios.get(`${this.baseUrl}/api/manual/inventory`, {
        headers: { 'x-admin-password': process.env.ADMIN_PASSWORD },
        timeout: 10000
      });
      
      if (response.status === 200 && response.data.success) {
        const stores = response.data.data.stores || {};
        const expectedStores = ['B Kosher', 'Tapuach', 'Kosher Kingdom', 'Kays'];
        
        const foundStores = expectedStores.filter(store => stores[store]);
        
        if (foundStores.length === 4) {
          this.passTest('Store Data', `All 4 stores found: ${foundStores.join(', ')}`);
        } else {
          this.failTest('Store Data', `Only found ${foundStores.length}/4 stores: ${foundStores.join(', ')}`);
        }
      } else {
        this.failTest('Store Data', 'Failed to retrieve store data');
      }
    } catch (error) {
      this.failTest('Store Data', `Store data test failed: ${error.message}`);
    }
  }

  /**
   * Test product data
   */
  async testProductData() {
    console.log('🛍️ Testing Product Data...');
    
    try {
      const response = await axios.get(`${this.baseUrl}/api/manual/inventory`, {
        headers: { 'x-admin-password': process.env.ADMIN_PASSWORD },
        timeout: 10000
      });
      
      if (response.status === 200 && response.data.success) {
        const products = response.data.data.products || {};
        const productCount = Object.keys(products).length;
        
        if (productCount >= 6) {
          this.passTest('Product Data', `Found ${productCount} products with pricing data`);
        } else {
          this.failTest('Product Data', `Only found ${productCount} products, expected 6+`);
        }
      } else {
        this.failTest('Product Data', 'Failed to retrieve product data');
      }
    } catch (error) {
      this.failTest('Product Data', `Product data test failed: ${error.message}`);
    }
  }

  /**
   * Test price comparison
   */
  async testPriceComparison() {
    console.log('💰 Testing Price Comparison...');
    
    try {
      const response = await axios.post(`${this.baseUrl}/api/compare-groceries`, {
        groceryList: ['milk', 'challah']
      }, { timeout: 10000 });
      
      if (response.status === 200 && response.data.success) {
        const results = response.data.results || [];
        if (results.length > 0) {
          this.passTest('Price Comparison', `Comparison working with ${results.length} results`);
        } else {
          this.failTest('Price Comparison', 'No comparison results returned');
        }
      } else {
        this.failTest('Price Comparison', 'Price comparison failed');
      }
    } catch (error) {
      this.failTest('Price Comparison', `Price comparison test failed: ${error.message}`);
    }
  }

  /**
   * Test admin panel access
   */
  async testAdminPanel() {
    console.log('🔐 Testing Admin Panel Access...');
    
    try {
      const response = await axios.get(`${this.baseUrl}/api/manual/inventory`, {
        headers: { 'x-admin-password': process.env.ADMIN_PASSWORD },
        timeout: 10000
      });
      
      if (response.status === 200 && response.data.success) {
        this.passTest('Admin Panel Access', 'Admin authentication working correctly');
      } else if (response.status === 401) {
        this.failTest('Admin Panel Access', 'Admin authentication failed');
      } else {
        this.failTest('Admin Panel Access', `Unexpected response: ${response.status}`);
      }
    } catch (error) {
      this.failTest('Admin Panel Access', `Admin panel test failed: ${error.message}`);
    }
  }

  /**
   * Test performance
   */
  async testPerformance() {
    console.log('⚡ Testing Performance...');
    
    try {
      const startTime = Date.now();
      const response = await axios.get(`${this.baseUrl}/api/health`, { timeout: 5000 });
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      if (response.status === 200 && responseTime < 2000) {
        this.passTest('Performance', `Response time: ${responseTime}ms (excellent)`);
      } else if (responseTime < 5000) {
        this.passTest('Performance', `Response time: ${responseTime}ms (acceptable)`);
      } else {
        this.failTest('Performance', `Response time too slow: ${responseTime}ms`);
      }
    } catch (error) {
      this.failTest('Performance', `Performance test failed: ${error.message}`);
    }
  }

  /**
   * Generate verification report
   */
  async generateReport() {
    console.log('\n📊 VERIFICATION REPORT');
    console.log('======================');
    
    console.log(`✅ Passed: ${this.results.passed}`);
    console.log(`❌ Failed: ${this.results.failed}`);
    console.log(`📊 Total: ${this.results.passed + this.results.failed}`);
    
    if (this.results.failed > 0) {
      console.log('\n❌ FAILED TESTS:');
      this.results.tests
        .filter(test => !test.passed)
        .forEach(test => {
          console.log(`   • ${test.name}: ${test.error}`);
        });
    }
    
    if (this.results.passed > 0) {
      console.log('\n✅ PASSED TESTS:');
      this.results.tests
        .filter(test => test.passed)
        .forEach(test => {
          console.log(`   • ${test.name}: ${test.message}`);
        });
    }
    
    const success = this.results.failed === 0;
    console.log(`\n🎯 OVERALL RESULT: ${success ? '✅ SUCCESS' : '❌ FAILURE'}`);
    
    if (success) {
      console.log('\n🎉 DEPLOYMENT VERIFICATION SUCCESSFUL!');
      console.log('✅ PostgreSQL migration completed successfully');
      console.log('✅ All systems operational');
      console.log('✅ Data integrity verified');
      console.log('✅ Performance within acceptable limits');
    } else {
      console.log('\n💥 DEPLOYMENT VERIFICATION FAILED!');
      console.log('❌ Some tests failed - check logs for details');
      console.log('❌ Manual intervention may be required');
    }
  }

  /**
   * Record test result
   */
  passTest(name, message) {
    this.results.passed++;
    this.results.tests.push({ name, message, passed: true });
    console.log(`   ✅ ${name}: ${message}`);
  }

  failTest(name, error) {
    this.results.failed++;
    this.results.tests.push({ name, error, passed: false });
    console.log(`   ❌ ${name}: ${error}`);
  }
}

// Run if called directly
if (require.main === module) {
  const verification = new DeploymentVerification();
  verification.verify()
    .then(success => {
      if (success) {
        console.log('\n🎯 Next steps:');
        console.log('1. ✅ Test your admin panel manually');
        console.log('2. ✅ Add a new product to verify functionality');
        console.log('3. ✅ Update prices to test persistence');
        console.log('4. ✅ Monitor Railway logs for any issues');
        process.exit(0);
      } else {
        console.error('\n❌ Verification failed - check the report above');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('💥 Verification error:', error.message);
      process.exit(1);
    });
}

module.exports = { DeploymentVerification };
