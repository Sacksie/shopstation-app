/**
 * Authentication System Tests
 * 
 * BUSINESS CRITICAL: Tests the new PIN-based authentication system
 * with failsafe password support.
 */

const request = require('supertest');
const express = require('express');
const adminAuth = require('../middleware/adminAuth');

describe('🔐 PIN Authentication System', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/test', adminAuth, (req, res) => {
      res.json({ success: true, message: 'Authenticated' });
    });
  });

  describe('Valid PIN Authentication', () => {
    test('should accept PIN 050625', async () => {
      const response = await request(app)
        .get('/api/test')
        .set('x-admin-password', '050625')
        .expect(200);
      
      expect(response.body.success).toBe(true);
    });

    test('should accept PIN 331919', async () => {
      const response = await request(app)
        .get('/api/test')
        .set('x-admin-password', '331919')
        .expect(200);
      
      expect(response.body.success).toBe(true);
    });
  });

  describe('Failsafe Password', () => {
    test('should accept failsafe password test123', async () => {
      const response = await request(app)
        .get('/api/test')
        .set('x-admin-password', 'test123')
        .expect(200);
      
      expect(response.body.success).toBe(true);
    });
  });

  describe('Legacy Password Support', () => {
    test('should accept legacy admin password', async () => {
      const response = await request(app)
        .get('/api/test')
        .set('x-admin-password', 'temp-password-123')
        .expect(200);
      
      expect(response.body.success).toBe(true);
    });
  });

  describe('Invalid Authentication', () => {
    test('should reject invalid PIN', async () => {
      const response = await request(app)
        .get('/api/test')
        .set('x-admin-password', '123456')
        .expect(401);
      
      expect(response.body.error).toBe('Unauthorized');
      expect(response.body.message).toBe('Invalid PIN or password');
    });

    test('should reject empty password', async () => {
      const response = await request(app)
        .get('/api/test')
        .expect(401);
      
      expect(response.body.error).toBe('Authentication required');
    });

    test('should reject wrong password', async () => {
      const response = await request(app)
        .get('/api/test')
        .set('x-admin-password', 'wrongpassword')
        .expect(401);
      
      expect(response.body.error).toBe('Unauthorized');
    });
  });

  describe('Security Edge Cases', () => {
    test('should handle SQL injection attempts', async () => {
      const response = await request(app)
        .get('/api/test')
        .set('x-admin-password', "'; DROP TABLE users; --")
        .expect(401);
      
      expect(response.body.error).toBe('Unauthorized');
    });

    test('should handle XSS attempts', async () => {
      const response = await request(app)
        .get('/api/test')
        .set('x-admin-password', '<script>alert("xss")</script>')
        .expect(401);
      
      expect(response.body.error).toBe('Unauthorized');
    });
  });
});
