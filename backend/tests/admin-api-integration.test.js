/**
 * Admin API Integration Tests
 * 
 * Tests the complete admin API workflow with new authentication
 */

const request = require('supertest');
const express = require('express');

// Mock database
jest.mock('../database/db-operations', () => ({
  getProducts: jest.fn(() => Promise.resolve([
    {
      key: 'test-milk',
      displayName: 'Test Milk',
      category: 'dairy',
      prices: {
        'B Kosher': { price: 2.50, unit: '2L' },
        'Tapuach': { price: 2.75, unit: '2L' }
      }
    }
  ])),
  addProduct: jest.fn(() => Promise.resolve({ success: true })),
  updateProductPrice: jest.fn(() => Promise.resolve({ success: true }))
}));

describe('🔧 Admin API Integration', () => {
  let app;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    // Mount all admin routes
    app.use('/api/manual', require('../routes/manual-entry'));
  });

  describe('Inventory Management with PIN Auth', () => {
    test('should fetch inventory with valid PIN', async () => {
      const response = await request(app)
        .get('/api/manual/inventory')
        .set('x-admin-password', '050625')
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data.products).toBeDefined();
    });

    test('should reject inventory request with invalid PIN', async () => {
      await request(app)
        .get('/api/manual/inventory')
        .set('x-admin-password', '123456')
        .expect(401);
    });
  });

  describe('Price Management with New Auth', () => {
    test('should add price with valid PIN', async () => {
      const priceData = {
        store: 'B Kosher',
        productName: 'Test Product',
        price: 3.99,
        unit: 'kg'
      };

      const response = await request(app)
        .post('/api/manual/add-price')
        .set('x-admin-password', '331919')
        .send(priceData)
        .expect(200);
      
      expect(response.body.success).toBe(true);
    });

    test('should update product info with failsafe password', async () => {
      const updateData = {
        productKey: 'test-milk',
        displayName: 'Updated Milk Name',
        category: 'dairy'
      };

      const response = await request(app)
        .put('/api/manual/update-product-info')
        .set('x-admin-password', 'test123')
        .send(updateData)
        .expect(200);
      
      expect(response.body.success).toBe(true);
    });
  });
});
