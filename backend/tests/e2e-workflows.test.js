/**
 * End-to-End Workflow Tests
 * 
 * Tests complete user workflows with new features
 */

const request = require('supertest');
const express = require('express');

describe('🔄 End-to-End Workflows', () => {
  let app;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/api/manual', require('../routes/manual-entry'));
  });

  describe('Complete Admin Workflow with PIN', () => {
    test('should complete full product management workflow', async () => {
      // 1. Authenticate with PIN
      const authResponse = await request(app)
        .get('/api/manual/inventory')
        .set('x-admin-password', '050625')
        .expect(200);
      
      expect(authResponse.body.success).toBe(true);

      // 2. Add new product
      const addProductResponse = await request(app)
        .post('/api/manual/add-price')
        .set('x-admin-password', '050625')
        .send({
          store: 'B Kosher',
          productName: 'E2E Test Product',
          price: 4.99,
          unit: 'kg'
        })
        .expect(200);
      
      expect(addProductResponse.body.success).toBe(true);

      // 3. Update product info
      const updateResponse = await request(app)
        .put('/api/manual/update-product-info')
        .set('x-admin-password', '050625')
        .send({
          productKey: 'e2e-test-product',
          displayName: 'Updated E2E Product',
          category: 'test'
        })
        .expect(200);
      
      expect(updateResponse.body.success).toBe(true);

      // 4. Verify changes
      const verifyResponse = await request(app)
        .get('/api/manual/inventory')
        .set('x-admin-password', '050625')
        .expect(200);
      
      expect(verifyResponse.body.data.products).toBeDefined();
    });

    test('should handle failsafe password workflow', async () => {
      // 1. Try with wrong PIN
      await request(app)
        .get('/api/manual/inventory')
        .set('x-admin-password', '123456')
        .expect(401);

      // 2. Use failsafe password
      const response = await request(app)
        .get('/api/manual/inventory')
        .set('x-admin-password', 'test123')
        .expect(200);
      
      expect(response.body.success).toBe(true);
    });
  });
});
