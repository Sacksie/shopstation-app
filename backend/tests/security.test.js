/**
 * Security Tests
 * 
 * Tests authentication security and edge cases
 */

const request = require('supertest');
const express = require('express');
const adminAuth = require('../middleware/adminAuth');

describe('🔒 Security Tests', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/test', adminAuth, (req, res) => {
      res.json({ success: true });
    });
  });

  describe('PIN Security', () => {
    test('should not accept partial PIN matches', async () => {
      await request(app)
        .get('/api/test')
        .set('x-admin-password', '05062')
        .expect(401);
    });

    test('should not accept PIN with extra characters', async () => {
      await request(app)
        .get('/api/test')
        .set('x-admin-password', '0506250')
        .expect(401);
    });

    test('should handle case sensitivity', async () => {
      await request(app)
        .get('/api/test')
        .set('x-admin-password', '050625')
        .expect(200);
    });
  });

  describe('Rate Limiting', () => {
    test('should handle multiple failed attempts', async () => {
      const promises = Array(10).fill().map(() => 
        request(app)
          .get('/api/test')
          .set('x-admin-password', 'wrongpin')
          .expect(401)
      );
      
      await Promise.all(promises);
    });
  });

  describe('Input Sanitization', () => {
    test('should handle special characters in PIN', async () => {
      await request(app)
        .get('/api/test')
        .set('x-admin-password', '05062!')
        .expect(401);
    });

    test('should handle unicode characters', async () => {
      await request(app)
        .get('/api/test')
        .set('x-admin-password', '05062５')
        .expect(401);
    });
  });
});
