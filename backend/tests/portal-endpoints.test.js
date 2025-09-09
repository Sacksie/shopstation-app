/**
 * Store Portal API Endpoints Tests
 * 
 * BUSINESS CRITICAL: Tests all portal API endpoints with authentication,
 * data validation, and error handling.
 */

const request = require('supertest');
const express = require('express');
const { requireStoreAuth, createToken } = require('../middleware/storeAuth');
const dbOps = require('../database/db-operations');

// Mock the database operations for testing
jest.mock('../database/db-operations');

describe('🏪 Store Portal API Endpoints', () => {
  let app;
  let validToken;
  let mockStoreId = 1;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/portal', require('../routes/portal'));
    
    // Create a valid token for testing
    validToken = createToken(mockStoreId);
    
    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('Dashboard Summary Endpoint', () => {
    test('should return dashboard summary for authenticated user', async () => {
      const mockSummary = {
        storeName: 'Kosher Corner',
        winsTracker: {
          newCustomers: 12,
          reason: 'best price on Challah bread',
          period: 'this week'
        },
        priceIntelligence: {
          cheapestItems: 8,
          mostExpensiveItems: 2
        },
        demandAnalytics: {
          topSearches: ['chicken soup', 'rugelach', 'kugel'],
          missedOpportunities: ['herring', 'gefilte fish (jar)']
        }
      };

      dbOps.getDashboardSummary.mockResolvedValue(mockSummary);

      const response = await request(app)
        .get('/api/portal/dashboard-summary')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockSummary);
      expect(dbOps.getDashboardSummary).toHaveBeenCalledWith(mockStoreId);
    });

    test('should reject unauthenticated requests', async () => {
      const response = await request(app)
        .get('/api/portal/dashboard-summary')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Authorization token required.');
    });

    test('should handle database errors gracefully', async () => {
      dbOps.getDashboardSummary.mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app)
        .get('/api/portal/dashboard-summary')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Failed to fetch dashboard summary.');
    });
  });

  describe('Price Intelligence Endpoint', () => {
    test('should return competitive price report', async () => {
      const mockReport = {
        keyItems: [
          {
            id: 1,
            name: 'Challah Bread',
            category: 'Bakery',
            myPrice: 3.99,
            competitors: {
              'Grodzinski': 4.10,
              'B Kosher': 3.95,
              'Tapuach': 4.25
            }
          }
        ]
      };

      dbOps.getCompetitivePriceReport.mockResolvedValue(mockReport);

      const response = await request(app)
        .get('/api/portal/price-intelligence')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockReport);
      expect(dbOps.getCompetitivePriceReport).toHaveBeenCalledWith(mockStoreId);
    });

    test('should reject unauthenticated requests', async () => {
      const response = await request(app)
        .get('/api/portal/price-intelligence')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Authorization token required.');
    });

    test('should handle database errors gracefully', async () => {
      dbOps.getCompetitivePriceReport.mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app)
        .get('/api/portal/price-intelligence')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Failed to fetch price intelligence data.');
    });
  });

  describe('Customer Demand Endpoint', () => {
    test('should return customer demand report', async () => {
      const mockReport = {
        topSearches: [
          { term: 'chicken soup', searches: 120, conversionRate: 0.75 },
          { term: 'rugelach', searches: 95, conversionRate: 0.60 }
        ],
        missedOpportunities: [
          { term: 'herring', searches: 58 },
          { term: 'gefilte fish (jar)', searches: 45 }
        ],
        peakTimes: [
          { day: 'Thursday', hour: '6 PM', activity: 95 },
          { day: 'Friday', hour: '11 AM', activity: 88 }
        ]
      };

      dbOps.getCustomerDemandReport.mockResolvedValue(mockReport);

      const response = await request(app)
        .get('/api/portal/customer-demand')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockReport);
      expect(dbOps.getCustomerDemandReport).toHaveBeenCalledWith(mockStoreId);
    });

    test('should reject unauthenticated requests', async () => {
      const response = await request(app)
        .get('/api/portal/customer-demand')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Authorization token required.');
    });

    test('should handle database errors gracefully', async () => {
      dbOps.getCustomerDemandReport.mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app)
        .get('/api/portal/customer-demand')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Failed to fetch customer demand data.');
    });
  });

  describe('My Products Endpoint', () => {
    test('should return store products for authenticated user', async () => {
      const mockProducts = [
        {
          id: 1,
          name: 'Challah Bread',
          category_name: 'Bakery',
          price: 3.99,
          unit: 'loaf',
          in_stock: true
        },
        {
          id: 2,
          name: 'Organic Almond Milk',
          category_name: 'Dairy',
          price: 2.49,
          unit: 'carton',
          in_stock: true
        }
      ];

      dbOps.getProductsByStore.mockResolvedValue(mockProducts);

      const response = await request(app)
        .get('/api/portal/my-products')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockProducts);
      expect(dbOps.getProductsByStore).toHaveBeenCalledWith(mockStoreId);
    });

    test('should reject unauthenticated requests', async () => {
      const response = await request(app)
        .get('/api/portal/my-products')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Authorization token required.');
    });

    test('should handle database errors gracefully', async () => {
      dbOps.getProductsByStore.mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app)
        .get('/api/portal/my-products')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Failed to fetch products.');
    });
  });

  describe('Update Product Price Endpoint', () => {
    test('should update product price successfully', async () => {
      const productId = 1;
      const newPrice = 4.99;
      const mockResult = {
        success: true,
        updatedProduct: {
          store_id: mockStoreId,
          product_id: productId,
          price: newPrice,
          last_updated: "2025-09-09T09:34:58.831Z"
        }
      };

      dbOps.updateStoreProductPrice.mockResolvedValue(mockResult);

      const response = await request(app)
        .put(`/api/portal/my-products/${productId}`)
        .set('Authorization', `Bearer ${validToken}`)
        .send({ price: newPrice })
        .expect(200);

      expect(response.body).toEqual(mockResult);
      expect(dbOps.updateStoreProductPrice).toHaveBeenCalledWith(mockStoreId, productId.toString(), newPrice);
    });

    test('should reject invalid price values', async () => {
      const productId = 1;

      const response = await request(app)
        .put(`/api/portal/my-products/${productId}`)
        .set('Authorization', `Bearer ${validToken}`)
        .send({ price: 'invalid' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Valid price is required.');
    });

    test('should reject missing price', async () => {
      const productId = 1;

      const response = await request(app)
        .put(`/api/portal/my-products/${productId}`)
        .set('Authorization', `Bearer ${validToken}`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Valid price is required.');
    });

    test('should reject negative prices', async () => {
      const productId = 1;

      const response = await request(app)
        .put(`/api/portal/my-products/${productId}`)
        .set('Authorization', `Bearer ${validToken}`)
        .send({ price: -5.99 })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Valid price is required.');
    });

    test('should reject unauthenticated requests', async () => {
      const productId = 1;

      const response = await request(app)
        .put(`/api/portal/my-products/${productId}`)
        .send({ price: 4.99 })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Authorization token required.');
    });

    test('should handle database errors gracefully', async () => {
      const productId = 1;
      const newPrice = 4.99;

      dbOps.updateStoreProductPrice.mockRejectedValue(new Error('Product not found'));

      const response = await request(app)
        .put(`/api/portal/my-products/${productId}`)
        .set('Authorization', `Bearer ${validToken}`)
        .send({ price: newPrice })
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Failed to update product price.');
    });

    test('should handle non-existent product', async () => {
      const productId = 999;
      const newPrice = 4.99;

      dbOps.updateStoreProductPrice.mockRejectedValue(new Error('Product not found for this store'));

      const response = await request(app)
        .put(`/api/portal/my-products/${productId}`)
        .set('Authorization', `Bearer ${validToken}`)
        .send({ price: newPrice })
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Failed to update product price.');
    });
  });

  describe('Store Data Isolation', () => {
    test('should only return data for authenticated store', async () => {
      const otherStoreId = 2;
      const otherStoreToken = createToken(otherStoreId);

      const mockProducts = [
        { id: 1, name: 'Product 1', price: 3.99 }
      ];

      dbOps.getProductsByStore.mockResolvedValue(mockProducts);

      // Test with first store
      await request(app)
        .get('/api/portal/my-products')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(dbOps.getProductsByStore).toHaveBeenCalledWith(mockStoreId);

      // Reset mock
      jest.clearAllMocks();
      dbOps.getProductsByStore.mockResolvedValue(mockProducts);

      // Test with second store
      await request(app)
        .get('/api/portal/my-products')
        .set('Authorization', `Bearer ${otherStoreToken}`)
        .expect(200);

      expect(dbOps.getProductsByStore).toHaveBeenCalledWith(otherStoreId);
    });

    test('should only update products for authenticated store', async () => {
      const otherStoreId = 2;
      const otherStoreToken = createToken(otherStoreId);
      const productId = 1;
      const newPrice = 4.99;

      const mockResult = {
        success: true,
        updatedProduct: {
          store_id: otherStoreId,
          product_id: productId,
          price: newPrice
        }
      };

      dbOps.updateStoreProductPrice.mockResolvedValue(mockResult);

      await request(app)
        .put(`/api/portal/my-products/${productId}`)
        .set('Authorization', `Bearer ${otherStoreToken}`)
        .send({ price: newPrice })
        .expect(200);

      expect(dbOps.updateStoreProductPrice).toHaveBeenCalledWith(otherStoreId, productId.toString(), newPrice);
    });
  });

  describe('Input Validation', () => {
    test('should handle malformed JSON in request body', async () => {
      const productId = 1;

      const response = await request(app)
        .put(`/api/portal/my-products/${productId}`)
        .set('Authorization', `Bearer ${validToken}`)
        .set('Content-Type', 'application/json')
        .send('{"price": 4.99,}') // Malformed JSON
        .expect(400);

      // Express handles malformed JSON automatically, so we just check for 400 status
      expect(response.status).toBe(400);
    });

    test('should handle non-numeric product IDs', async () => {
      const response = await request(app)
        .put('/api/portal/my-products/abc')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ price: 4.99 })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Valid product ID is required.');
    });

    test('should handle extremely large price values', async () => {
      const productId = 1;
      const largePrice = 999999999.99;

      const mockResult = {
        success: true,
        updatedProduct: {
          store_id: mockStoreId,
          product_id: productId,
          price: largePrice
        }
      };

      dbOps.updateStoreProductPrice.mockResolvedValue(mockResult);

      const response = await request(app)
        .put(`/api/portal/my-products/${productId}`)
        .set('Authorization', `Bearer ${validToken}`)
        .send({ price: largePrice })
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('Rate Limiting and Performance', () => {
    test('should handle multiple concurrent requests', async () => {
      const mockSummary = {
        storeName: 'Kosher Corner',
        winsTracker: { newCustomers: 12, reason: 'test', period: 'this week' },
        priceIntelligence: { cheapestItems: 8, mostExpensiveItems: 2 },
        demandAnalytics: { topSearches: [], missedOpportunities: [] }
      };

      dbOps.getDashboardSummary.mockResolvedValue(mockSummary);

      // Make multiple concurrent requests
      const promises = Array(5).fill().map(() =>
        request(app)
          .get('/api/portal/dashboard-summary')
          .set('Authorization', `Bearer ${validToken}`)
      );

      const responses = await Promise.all(promises);

      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      expect(dbOps.getDashboardSummary).toHaveBeenCalledTimes(5);
    });
  });
});
