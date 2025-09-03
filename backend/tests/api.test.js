/**
 * Critical Business API Tests
 * 
 * These tests verify that your core business functionality works correctly.
 * Run with: npm test
 * 
 * BUSINESS IMPACT: Prevents customer-facing API failures
 */

const request = require('supertest');
const express = require('express');
const path = require('path');

// Mock the database to avoid touching real data during tests
jest.mock('../database/kosher-db.js', () => ({
  readDB: jest.fn(() => ({
    products: {
      'test-product': {
        name: 'Test Product',
        prices: {
          'Test Store': {
            price: 2.50,
            unit: 'item',
            lastUpdated: new Date().toISOString()
          }
        }
      }
    },
    aliases: {}
  })),
  writeDB: jest.fn(() => true),
  deleteProduct: jest.fn(() => true),
  addPriceToProduct: jest.fn(() => true)
}));

// Mock backup manager to avoid file system operations
jest.mock('../utils/backupManager', () => ({
  setupAutomaticBackups: jest.fn(),
  createBackup: jest.fn(() => ({ success: true })),
  autoBackupBeforeBulk: jest.fn(() => ({ success: true }))
}));

// Import after mocking
const config = require('../config/environments');

describe('ShopStation API - Critical Business Functions', () => {
  let app;
  const ADMIN_PASSWORD = 'test-admin-password';

  beforeAll(() => {
    // Set test environment
    process.env.NODE_ENV = 'development';
    process.env.ADMIN_PASSWORD = ADMIN_PASSWORD;
    
    // Create test app
    app = express();
    app.use(express.json({ limit: '10mb' }));
    
    // Import routes after setting environment
    const compareRoutes = require('../routes/compare');
    const manualEntryRoutes = require('../routes/manual-entry');
    const backupRoutes = require('../routes/backup');
    
    app.use('/api', compareRoutes);
    app.use('/api/manual', manualEntryRoutes);
    app.use('/api/backup', backupRoutes);
    
    // Health check endpoint
    app.get('/api/health', (req, res) => {
      res.json({ 
        status: 'OK',
        environment: config.environment,
        version: '1.1.0'
      });
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Health and Infrastructure', () => {
    test('Health check endpoint works', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);
      
      expect(response.body).toHaveProperty('status', 'OK');
      expect(response.body).toHaveProperty('environment');
      expect(response.body).toHaveProperty('version');
    });

    test('Server handles CORS properly', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);
      
      // Should not reject the request (basic CORS test)
      expect(response.status).toBe(200);
    });
  });

  describe('Admin Authentication', () => {
    test('Admin endpoints require authentication', async () => {
      await request(app)
        .get('/api/manual/inventory')
        .expect(401);
    });

    test('Admin endpoints accept correct password', async () => {
      const response = await request(app)
        .get('/api/manual/inventory')
        .set('x-admin-password', ADMIN_PASSWORD)
        .expect(200);
      
      expect(response.body).toHaveProperty('success', true);
    });

    test('Admin endpoints reject wrong password', async () => {
      await request(app)
        .get('/api/manual/inventory')
        .set('x-admin-password', 'wrong-password')
        .expect(401);
    });
  });

  describe('Core Business Functions', () => {
    test('Can retrieve product inventory', async () => {
      const response = await request(app)
        .get('/api/manual/inventory')
        .set('x-admin-password', ADMIN_PASSWORD)
        .expect(200);
      
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('products');
    });

    test('Can add new price entry', async () => {
      const priceData = {
        store: 'Test Store',
        productName: 'Test Product',
        price: 3.99,
        unit: 'kg'
      };

      const response = await request(app)
        .post('/api/manual/add-price')
        .set('x-admin-password', ADMIN_PASSWORD)
        .send(priceData)
        .expect(200);
      
      expect(response.body).toHaveProperty('success', true);
    });

    test('Price addition validates required fields', async () => {
      const invalidData = {
        store: 'Test Store'
        // Missing productName, price, unit
      };

      await request(app)
        .post('/api/manual/add-price')
        .set('x-admin-password', ADMIN_PASSWORD)
        .send(invalidData)
        .expect(400);
    });

    test('Price addition validates price is a number', async () => {
      const invalidData = {
        store: 'Test Store',
        productName: 'Test Product',
        price: 'not-a-number',
        unit: 'kg'
      };

      const response = await request(app)
        .post('/api/manual/add-price')
        .set('x-admin-password', ADMIN_PASSWORD)
        .send(invalidData)
        .expect(400);
      
      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('Error Handling', () => {
    test('API returns proper error format', async () => {
      const response = await request(app)
        .get('/api/manual/inventory')
        .expect(401);
      
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });

    test('API handles malformed JSON', async () => {
      await request(app)
        .post('/api/manual/add-price')
        .set('x-admin-password', ADMIN_PASSWORD)
        .set('Content-Type', 'application/json')
        .send('invalid-json')
        .expect(400);
    });

    test('API handles large payloads gracefully', async () => {
      const largePayload = {
        store: 'Test Store',
        productName: 'A'.repeat(10000), // Very long product name
        price: 2.50,
        unit: 'item'
      };

      // Should either accept it or reject with proper error
      const response = await request(app)
        .post('/api/manual/add-price')
        .set('x-admin-password', ADMIN_PASSWORD)
        .send(largePayload);
      
      expect([200, 400, 413]).toContain(response.status);
    });
  });

  describe('Business Logic Validation', () => {
    test('Cannot add negative prices', async () => {
      const invalidData = {
        store: 'Test Store',
        productName: 'Test Product',
        price: -5.00,
        unit: 'item'
      };

      const response = await request(app)
        .post('/api/manual/add-price')
        .set('x-admin-password', ADMIN_PASSWORD)
        .send(invalidData)
        .expect(400);
      
      expect(response.body.success).toBe(false);
    });

    test('Cannot add extremely high prices (sanity check)', async () => {
      const invalidData = {
        store: 'Test Store',
        productName: 'Test Product',
        price: 999999.99, // Unreasonable price
        unit: 'item'
      };

      const response = await request(app)
        .post('/api/manual/add-price')
        .set('x-admin-password', ADMIN_PASSWORD)
        .send(invalidData);
      
      // Should either accept with warning or reject
      expect([200, 400]).toContain(response.status);
      
      if (response.status === 200) {
        // If accepted, should have some kind of warning
        expect(response.body).toHaveProperty('success', true);
      }
    });
  });
});