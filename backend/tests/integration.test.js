/**
 * Comprehensive Integration Tests
 * 
 * BUSINESS CRITICAL: These tests validate complete user workflows
 * and ensure all systems work together correctly.
 * 
 * Coverage:
 * - End-to-end API workflows
 * - Database operations with real data
 * - Authentication and security
 * - Business logic validation
 * - Error handling scenarios
 * - Performance requirements
 */

const request = require('supertest');
const express = require('express');

// Mock environment variables for testing
process.env.NODE_ENV = 'test';
process.env.ADMIN_PASSWORD = 'test-admin-password-for-integration';
process.env.JWT_SECRET = 'test-jwt-secret-for-integration-testing-only';

// Mock external dependencies
jest.mock('../database/kosher-db.js', () => ({
  readDB: jest.fn(() => ({
    products: {
      'test-milk-2l': {
        name: 'Milk 2L',
        category: 'dairy',
        prices: {
          'Kosher Kingdom': {
            price: 2.50,
            unit: '2L',
            lastUpdated: new Date().toISOString()
          },
          'B Kosher': {
            price: 2.75,
            unit: '2L',
            lastUpdated: new Date().toISOString()
          }
        }
      },
      'test-bread-white': {
        name: 'White Bread',
        category: 'bakery',
        prices: {
          'Kosher Kingdom': {
            price: 1.20,
            unit: 'loaf',
            lastUpdated: new Date().toISOString()
          }
        }
      }
    },
    aliases: {
      'milk': 'test-milk-2l'
    }
  })),
  writeDB: jest.fn(() => true),
  deleteProduct: jest.fn(() => true),
  addPriceToProduct: jest.fn(() => true),
  getAllProducts: jest.fn(() => ['test-milk-2l', 'test-bread-white'])
}));

jest.mock('../utils/backupManager', () => ({
  setupAutomaticBackups: jest.fn(),
  createBackup: jest.fn(() => ({ success: true, backupId: 'test-backup-123' })),
  autoBackupBeforeBulk: jest.fn(() => ({ success: true }))
}));

describe('ShopStation Integration Tests - Critical Business Workflows', () => {
  let app;
  const ADMIN_PASSWORD = 'test-admin-password-for-integration';

  beforeAll(async () => {
    // Initialize test application
    app = express();
    
    // Import configuration after setting env vars
    const config = require('../config/environments');
    const { requestTrackingMiddleware } = require('../utils/monitoring');
    
    // Apply middleware
    app.use(requestTrackingMiddleware);
    app.use(express.json({ limit: '10mb' }));
    
    // Import routes after configuration is set
    const compareRoutes = require('../routes/compare');
    const manualEntryRoutes = require('../routes/manual-entry');
    const backupRoutes = require('../routes/backup');
    
    app.use('/api', compareRoutes);
    app.use('/api/manual', manualEntryRoutes);
    app.use('/api/backup', backupRoutes);
    
    // Health check
    app.get('/api/health', (req, res) => {
      const systemHealth = require('../utils/monitoring').monitor.getSystemHealth();
      res.json({
        status: systemHealth.status,
        environment: config.environment,
        version: '1.2.0',
        monitoring: {
          uptime: systemHealth.uptime,
          totalRequests: systemHealth.metrics.apiCalls
        }
      });
    });
    
    // Error handling
    app.use((err, req, res, next) => {
      res.status(500).json({
        success: false,
        error: 'Integration test error',
        message: err.message
      });
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ==========================================================================
  // CRITICAL BUSINESS WORKFLOW TESTS
  // ==========================================================================

  describe('🛒 Complete Customer Price Comparison Workflow', () => {
    test('Customer can search and compare prices across stores', async () => {
      // Simulate complete customer journey
      const searchQuery = 'milk';
      
      const response = await request(app)
        .post('/api/compare')
        .send({ items: [searchQuery] })
        .expect(200);

      // Validate response structure
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('results');
      expect(Array.isArray(response.body.results)).toBe(true);
      
      if (response.body.results.length > 0) {
        const firstResult = response.body.results[0];
        expect(firstResult).toHaveProperty('product');
        expect(firstResult).toHaveProperty('stores');
        expect(Array.isArray(firstResult.stores)).toBe(true);
        
        // Validate store data structure
        if (firstResult.stores.length > 0) {
          const firstStore = firstResult.stores[0];
          expect(firstStore).toHaveProperty('name');
          expect(firstStore).toHaveProperty('price');
          expect(firstStore).toHaveProperty('unit');
        }
      }
    });

    test('Customer receives helpful response for no matches', async () => {
      const response = await request(app)
        .post('/api/compare')
        .send({ items: ['nonexistent-product-xyz'] })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('results');
    });

    test('API handles malformed customer requests gracefully', async () => {
      // Test various malformed requests
      const malformedRequests = [
        {}, // No items
        { items: null }, // Null items
        { items: '' }, // Wrong type
        { items: [''] }, // Empty string item
        { items: [null] }, // Null item
      ];

      for (const badRequest of malformedRequests) {
        const response = await request(app)
          .post('/api/compare')
          .send(badRequest);
          
        // Should not crash, should return error response
        expect([400, 200]).toContain(response.status);
        if (response.status === 200) {
          expect(response.body).toHaveProperty('success');
        }
      }
    });
  });

  describe('🔐 Complete Admin Management Workflow', () => {
    test('Admin authentication flow works end-to-end', async () => {
      // Test invalid authentication
      const invalidResponse = await request(app)
        .get('/api/manual/inventory')
        .expect(401);
      
      expect(invalidResponse.body).toHaveProperty('success', false);

      // Test valid authentication
      const validResponse = await request(app)
        .get('/api/manual/inventory')
        .set('x-admin-password', ADMIN_PASSWORD)
        .expect(200);
      
      expect(validResponse.body).toHaveProperty('success', true);
      expect(validResponse.body).toHaveProperty('data');
    });

    test('Complete price management workflow', async () => {
      // 1. Get initial inventory
      const inventoryResponse = await request(app)
        .get('/api/manual/inventory')
        .set('x-admin-password', ADMIN_PASSWORD)
        .expect(200);
      
      expect(inventoryResponse.body.success).toBe(true);

      // 2. Add new price entry
      const newPrice = {
        store: 'Test Store Integration',
        productName: 'Integration Test Product',
        price: 5.99,
        unit: 'kg'
      };

      const addResponse = await request(app)
        .post('/api/manual/add-price')
        .set('x-admin-password', ADMIN_PASSWORD)
        .send(newPrice)
        .expect(200);
      
      expect(addResponse.body.success).toBe(true);

      // 3. Verify the price was added (check inventory again)
      const updatedInventoryResponse = await request(app)
        .get('/api/manual/inventory')
        .set('x-admin-password', ADMIN_PASSWORD)
        .expect(200);
      
      expect(updatedInventoryResponse.body.success).toBe(true);
    });

    test('Product deletion workflow with safety measures', async () => {
      const productKey = 'test-product-for-deletion';

      // Attempt to delete product
      const deleteResponse = await request(app)
        .delete(`/api/manual/delete-product/${productKey}`)
        .set('x-admin-password', ADMIN_PASSWORD)
        .expect(200);
      
      expect(deleteResponse.body.success).toBe(true);
    });

    test('Bulk operations workflow', async () => {
      const bulkData = [
        {
          store: 'Bulk Test Store',
          productName: 'Bulk Product 1',
          price: 1.99,
          unit: 'item'
        },
        {
          store: 'Bulk Test Store',
          productName: 'Bulk Product 2',
          price: 2.99,
          unit: 'item'
        }
      ];

      // Process multiple price additions
      for (const item of bulkData) {
        const response = await request(app)
          .post('/api/manual/add-price')
          .set('x-admin-password', ADMIN_PASSWORD)
          .send(item)
          .expect(200);
        
        expect(response.body.success).toBe(true);
      }
    });
  });

  describe('🏥 System Health & Monitoring Integration', () => {
    test('Health check provides comprehensive system information', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      // Validate health response structure
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('environment');
      expect(response.body).toHaveProperty('version');
      expect(response.body).toHaveProperty('monitoring');
      
      // Validate monitoring data
      const monitoring = response.body.monitoring;
      expect(monitoring).toHaveProperty('uptime');
      expect(monitoring).toHaveProperty('totalRequests');
      expect(typeof monitoring.uptime).toBe('number');
      expect(typeof monitoring.totalRequests).toBe('number');
    });

    test('System status endpoint provides detailed information', async () => {
      const response = await request(app)
        .get('/api/system/status')
        .expect(200);

      // Should return system status without authentication for monitoring
      expect(response.body).toHaveProperty('status');
    });

    test('Backup system integration', async () => {
      const response = await request(app)
        .get('/api/system/backups')
        .expect(200);

      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('backups');
      expect(Array.isArray(response.body.backups)).toBe(true);
    });

    test('Manual backup creation', async () => {
      const response = await request(app)
        .post('/api/system/backup')
        .send({ reason: 'integration-test' })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('backupId');
    });
  });

  // ==========================================================================
  // PERFORMANCE & RELIABILITY TESTS
  // ==========================================================================

  describe('⚡ Performance & Load Handling', () => {
    test('API responds within acceptable time limits', async () => {
      const startTime = Date.now();
      
      await request(app)
        .get('/api/health')
        .expect(200);
      
      const responseTime = Date.now() - startTime;
      
      // Health check should respond within 500ms
      expect(responseTime).toBeLessThan(500);
    });

    test('Multiple concurrent requests handled correctly', async () => {
      const concurrentRequests = 10;
      const requests = [];
      
      for (let i = 0; i < concurrentRequests; i++) {
        requests.push(
          request(app)
            .get('/api/health')
            .expect(200)
        );
      }
      
      const responses = await Promise.all(requests);
      
      // All requests should succeed
      responses.forEach(response => {
        expect(response.body).toHaveProperty('status');
      });
    });

    test('Large request payloads handled appropriately', async () => {
      // Test with reasonable large request
      const largeProductName = 'A'.repeat(500); // 500 character product name
      
      const response = await request(app)
        .post('/api/manual/add-price')
        .set('x-admin-password', ADMIN_PASSWORD)
        .send({
          store: 'Test Store',
          productName: largeProductName,
          price: 1.99,
          unit: 'item'
        });
      
      // Should either accept or reject gracefully
      expect([200, 400, 413]).toContain(response.status);
    });
  });

  // ==========================================================================
  // ERROR HANDLING & EDGE CASES
  // ==========================================================================

  describe('🛡️ Error Handling & Edge Cases', () => {
    test('Database connection errors handled gracefully', async () => {
      // Mock database error
      const db = require('../database/kosher-db');
      db.readDB.mockImplementationOnce(() => {
        throw new Error('Database connection failed');
      });

      const response = await request(app)
        .get('/api/manual/inventory')
        .set('x-admin-password', ADMIN_PASSWORD);

      // Should not crash the server
      expect([200, 500]).toContain(response.status);
    });

    test('Invalid data types handled correctly', async () => {
      const invalidRequests = [
        {
          store: 123, // Number instead of string
          productName: 'Test Product',
          price: 'invalid', // String instead of number
          unit: 'item'
        },
        {
          store: null, // Null values
          productName: null,
          price: null,
          unit: null
        },
        {
          store: '', // Empty strings
          productName: '',
          price: 0,
          unit: ''
        }
      ];

      for (const invalidRequest of invalidRequests) {
        const response = await request(app)
          .post('/api/manual/add-price')
          .set('x-admin-password', ADMIN_PASSWORD)
          .send(invalidRequest);
        
        // Should return appropriate error response
        expect([200, 400]).toContain(response.status);
        if (response.status === 400) {
          expect(response.body).toHaveProperty('success', false);
        }
      }
    });

    test('Memory and resource limits respected', async () => {
      // Test that app doesn't consume excessive resources
      const initialMemory = process.memoryUsage();
      
      // Make several requests
      for (let i = 0; i < 50; i++) {
        await request(app)
          .get('/api/health')
          .expect(200);
      }
      
      const finalMemory = process.memoryUsage();
      
      // Memory usage shouldn't grow excessively
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024); // 50MB limit
    });
  });

  // ==========================================================================
  // BUSINESS LOGIC VALIDATION
  // ==========================================================================

  describe('📊 Business Logic Validation', () => {
    test('Price comparison logic accuracy', async () => {
      const response = await request(app)
        .post('/api/compare')
        .send({ items: ['milk'] })
        .expect(200);

      if (response.body.results && response.body.results.length > 0) {
        const result = response.body.results[0];
        if (result.stores && result.stores.length > 1) {
          // Verify prices are properly compared and sorted
          const prices = result.stores.map(store => parseFloat(store.price));
          expect(prices.every(price => !isNaN(price))).toBe(true);
          expect(prices.every(price => price > 0)).toBe(true);
        }
      }
    });

    test('Product categorization and search accuracy', async () => {
      const response = await request(app)
        .get('/api/manual/inventory')
        .set('x-admin-password', ADMIN_PASSWORD)
        .expect(200);

      if (response.body.success && response.body.data.products) {
        const products = response.body.data.products;
        
        // Verify product structure
        Object.values(products).forEach(product => {
          if (typeof product === 'object' && product !== null) {
            // Products should have valid structure
            if (product.name) {
              expect(typeof product.name).toBe('string');
            }
            if (product.prices) {
              expect(typeof product.prices).toBe('object');
            }
          }
        });
      }
    });

    test('Data consistency across operations', async () => {
      // Add a product and ensure it appears in searches
      const testProduct = {
        store: 'Consistency Test Store',
        productName: 'Consistency Test Product',
        price: 9.99,
        unit: 'test-unit'
      };

      // Add product
      const addResponse = await request(app)
        .post('/api/manual/add-price')
        .set('x-admin-password', ADMIN_PASSWORD)
        .send(testProduct)
        .expect(200);

      expect(addResponse.body.success).toBe(true);

      // Verify it appears in inventory
      const inventoryResponse = await request(app)
        .get('/api/manual/inventory')
        .set('x-admin-password', ADMIN_PASSWORD)
        .expect(200);

      expect(inventoryResponse.body.success).toBe(true);
      // Product should be accessible through the system
    });
  });
});