/**
 * Admin Panel Integration Tests
 * 
 * BUSINESS CRITICAL: Tests the fixed admin panel functionality with new database layer
 * 
 * Coverage:
 * - Admin authentication
 * - Product management (add, update, delete)
 * - Price management
 * - Database operations integration
 * - Error handling
 */

const request = require('supertest');
const express = require('express');
const path = require('path');

// Set test environment
process.env.NODE_ENV = 'test';
process.env.ADMIN_PASSWORD = 'test-admin-pass';

// Import required modules
const manualEntryRoutes = require('../routes/manual-entry');
const compareRoutes = require('../routes/compare');

// Mock database operations for isolated testing
jest.mock('../database/db-operations', () => ({
  initialize: jest.fn(() => Promise.resolve()),
  getStores: jest.fn(() => Promise.resolve([
    { name: 'Test Store 1', slug: 'test-store-1', location: 'Test Location' },
    { name: 'Test Store 2', slug: 'test-store-2', location: 'Test Location 2' }
  ])),
  getProducts: jest.fn(() => Promise.resolve([
    {
      name: 'Test Product 1',
      slug: 'test-product-1',
      prices: [
        { store_name: 'Test Store 1', price: 5.99, unit: 'item' },
        { store_name: 'Test Store 2', price: 6.49, unit: 'item' }
      ]
    }
  ])),
  searchProducts: jest.fn(() => Promise.resolve([])),
  addProduct: jest.fn(() => Promise.resolve({ success: true, slug: 'new-test-product' })),
  updateProductPrice: jest.fn(() => Promise.resolve({ success: true })),
  updateProductInfo: jest.fn(() => Promise.resolve({ success: true })),
  deleteProduct: jest.fn(() => Promise.resolve({ success: true })),
  addProductRequest: jest.fn(() => Promise.resolve({ 
    success: true, 
    requestId: 'test-123',
    createdAt: new Date().toISOString()
  })),
  getDatabaseType: jest.fn(() => 'JSON'),
  readJSONData: jest.fn(() => Promise.resolve({ stores: {}, products: {}, productRequests: [] })),
  writeJSONData: jest.fn(() => Promise.resolve())
}));

// Mock backup manager
jest.mock('../utils/backupManager', () => ({
  autoBackupBeforeBulk: jest.fn(() => ({ success: true, backupId: 'test-backup-123' }))
}));

// Mock analytics
jest.mock('../utils/analytics', () => ({
  logSearch: jest.fn(),
  logShopSelection: jest.fn(),
  getAnalyticsSummary: jest.fn(() => ({ totalSearches: 0, totalSelections: 0 }))
}));

describe('Admin Panel Database Integration', () => {
  let app;
  const dbOps = require('../database/db-operations');

  beforeAll(() => {
    app = express();
    app.use(express.json());
    
    // Mount routes
    app.use('/api/manual', manualEntryRoutes);
    app.use('/api', compareRoutes);
    
    // Add test health endpoint
    app.get('/api/health', (req, res) => {
      res.json({ status: 'healthy', test: true });
    });
  });

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  describe('🔐 Admin Authentication', () => {
    test('should reject requests without admin password', async () => {
      const response = await request(app)
        .get('/api/manual/inventory')
        .expect(401);
      
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('admin password');
    });

    test('should accept requests with valid admin password', async () => {
      const response = await request(app)
        .get('/api/manual/inventory')
        .set('x-admin-password', 'test-admin-pass')
        .expect(200);
      
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
    });
  });

  describe('📦 Product Management', () => {
    const authHeader = { 'x-admin-password': 'test-admin-pass' };

    test('should fetch products and stores for admin panel', async () => {
      const response = await request(app)
        .get('/api/manual/products')
        .set(authHeader)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('products');
      expect(response.body).toHaveProperty('stores');
      expect(dbOps.getProducts).toHaveBeenCalled();
      expect(dbOps.getStores).toHaveBeenCalled();
    });

    test('should fetch inventory data', async () => {
      const response = await request(app)
        .get('/api/manual/inventory')
        .set(authHeader)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('products');
      expect(response.body.data).toHaveProperty('stores');
    });

    test('should add new product price', async () => {
      const priceData = {
        store: 'Test Store 1',
        productName: 'New Test Product',
        price: 7.99,
        unit: 'kg'
      };

      const response = await request(app)
        .post('/api/manual/add-price')
        .set(authHeader)
        .send(priceData)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.message).toContain('Price added');
      
      // Should try to update product price, and if it fails, add product first
      expect(dbOps.updateProductPrice).toHaveBeenCalled();
    });

    test('should handle bulk product addition', async () => {
      const bulkData = {
        store: 'Test Store 1',
        products: [
          { name: 'Bulk Product 1', price: 5.99, unit: 'item' },
          { name: 'Bulk Product 2', price: 6.99, unit: 'kg' }
        ]
      };

      const response = await request(app)
        .post('/api/manual/quick')
        .set(authHeader)
        .send(bulkData)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('results');
      expect(response.body.results).toHaveLength(2);
    });

    test('should update product information', async () => {
      const updateData = {
        productKey: 'test-product-key',
        displayName: 'Updated Product Name',
        category: 'updated-category'
      };

      const response = await request(app)
        .put('/api/manual/update-product-info')
        .set(authHeader)
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(dbOps.updateProductInfo).toHaveBeenCalledWith(
        'test-product-key',
        { displayName: 'Updated Product Name', category: 'updated-category' }
      );
    });

    test('should update product prices', async () => {
      const updateData = {
        productKey: 'test-product-key',
        updates: {
          'Test Store 1': { price: 8.99, unit: 'item' },
          'Test Store 2': { price: 9.49, unit: 'item' }
        }
      };

      const response = await request(app)
        .put('/api/manual/update-product')
        .set(authHeader)
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(dbOps.updateProductPrice).toHaveBeenCalledTimes(2);
    });

    test('should delete product', async () => {
      const response = await request(app)
        .delete('/api/manual/delete-product/test-product-key')
        .set(authHeader)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(dbOps.deleteProduct).toHaveBeenCalledWith('test-product-key');
    });
  });

  describe('🛍️ Product Request System', () => {
    test('should handle product requests', async () => {
      const requestData = {
        productName: 'Requested Product',
        userName: 'Test User',
        userEmail: 'test@example.com',
        categorySuggestion: 'test-category',
        description: 'Test product request'
      };

      const response = await request(app)
        .post('/api/request-product')
        .send(requestData)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('requestId');
      expect(dbOps.addProductRequest).toHaveBeenCalledWith({
        productName: 'Requested Product',
        userName: 'Test User',
        userEmail: 'test@example.com',
        categorySuggestion: 'test-category',
        description: 'Test product request'
      });
    });

    test('should reject product requests without product name', async () => {
      const requestData = {
        userName: 'Test User',
        userEmail: 'test@example.com'
      };

      const response = await request(app)
        .post('/api/request-product')
        .send(requestData)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toContain('Product name is required');
    });
  });

  describe('⚠️ Error Handling', () => {
    const authHeader = { 'x-admin-password': 'test-admin-pass' };

    test('should handle database errors gracefully', async () => {
      // Mock database error
      dbOps.getProducts.mockRejectedValueOnce(new Error('Database connection failed'));

      const response = await request(app)
        .get('/api/manual/products')
        .set(authHeader)
        .expect(500);

      expect(response.body).toHaveProperty('error');
    });

    test('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/manual/add-price')
        .set(authHeader)
        .send({ store: 'Test Store' }) // Missing required fields
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toContain('Please provide');
    });

    test('should handle non-existent store', async () => {
      dbOps.getStores.mockResolvedValueOnce([
        { name: 'Existing Store', slug: 'existing-store' }
      ]);

      const response = await request(app)
        .post('/api/manual/quick')
        .set(authHeader)
        .send({
          store: 'Non-existent Store',
          products: [{ name: 'Test', price: 5.99, unit: 'item' }]
        })
        .expect(400);

      expect(response.body.error).toContain('Store "Non-existent Store" not found');
    });
  });

  describe('🔄 Database Integration', () => {
    test('should use database operations layer', async () => {
      const authHeader = { 'x-admin-password': 'test-admin-pass' };
      
      await request(app)
        .get('/api/manual/products')
        .set(authHeader);

      expect(dbOps.getProducts).toHaveBeenCalled();
      expect(dbOps.getStores).toHaveBeenCalled();
    });

    test('should handle product creation when updating non-existent product', async () => {
      const authHeader = { 'x-admin-password': 'test-admin-pass' };
      
      // First call to updateProductPrice fails (product doesn't exist)
      dbOps.updateProductPrice.mockRejectedValueOnce(new Error('Product not found'));
      // addProduct succeeds
      dbOps.addProduct.mockResolvedValueOnce({ success: true });
      // Second call to updateProductPrice succeeds
      dbOps.updateProductPrice.mockResolvedValueOnce({ success: true });

      const response = await request(app)
        .post('/api/manual/add-price')
        .set(authHeader)
        .send({
          store: 'Test Store 1',
          productName: 'New Product',
          price: 5.99,
          unit: 'item'
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(dbOps.addProduct).toHaveBeenCalled();
      expect(dbOps.updateProductPrice).toHaveBeenCalledTimes(2);
    });
  });
});

describe('🛒 Compare Groceries Integration', () => {
  let app;
  const dbOps = require('../database/db-operations');

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/api', compareRoutes);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should compare groceries with new database layer', async () => {
    // Mock search results
    dbOps.searchProducts.mockResolvedValueOnce([
      {
        name: 'Milk 2L',
        slug: 'milk-2l',
        prices: [
          { store_name: 'Test Store 1', price: 2.50, unit: '2L', in_stock: true },
          { store_name: 'Test Store 2', price: 2.75, unit: '2L', in_stock: true }
        ]
      }
    ]);

    const response = await request(app)
      .post('/api/compare-groceries')
      .send({ groceryList: ['milk'] })
      .expect(200);

    expect(response.body).toHaveProperty('success', true);
    expect(response.body).toHaveProperty('stores');
    expect(response.body).toHaveProperty('totalItems', 1);
    expect(dbOps.getStores).toHaveBeenCalled();
    expect(dbOps.getProducts).toHaveBeenCalled();
    expect(dbOps.searchProducts).toHaveBeenCalledWith('milk');
  });

  test('should handle empty database gracefully', async () => {
    dbOps.getProducts.mockResolvedValueOnce([]);

    const response = await request(app)
      .post('/api/compare-groceries')
      .send({ groceryList: ['milk'] })
      .expect(200);

    expect(response.body).toHaveProperty('success', true);
    expect(response.body).toHaveProperty('message', 'No prices in database yet. Please add prices via admin panel.');
    expect(response.body.matchedItems).toBe(0);
  });

  test('should get products for frontend', async () => {
    const response = await request(app)
      .get('/api/products')
      .expect(200);

    expect(response.body).toHaveProperty('success', true);
    expect(response.body).toHaveProperty('products');
    expect(response.body).toHaveProperty('stores');
    expect(response.body).toHaveProperty('databaseType');
  });

  test('should get last updated timestamp', async () => {
    const response = await request(app)
      .get('/api/last-updated')
      .expect(200);

    expect(response.body).toHaveProperty('success', true);
    expect(response.body).toHaveProperty('databaseType');
  });
});