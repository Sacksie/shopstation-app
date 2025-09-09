/**
 * Store Portal Authentication Tests
 * 
 * BUSINESS CRITICAL: Tests the JWT-based authentication system for store users
 * with password hashing, token generation, and middleware validation.
 */

const request = require('supertest');
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { requireStoreAuth, createToken } = require('../middleware/storeAuth');
const dbOps = require('../database/db-operations');

// Mock the database operations for testing
jest.mock('../database/db-operations');

describe('🔐 Store Portal Authentication System', () => {
  let app;
  let mockUser;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    
    // Mock user data
    mockUser = {
      id: 1,
      email: 'owner@koshercorner.com',
      password_hash: '$2b$10$hashedpasswordhere',
      store_id: 1,
      role: 'owner',
      created_at: new Date()
    };

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('JWT Token Creation', () => {
    test('should create valid JWT token with store ID', () => {
      const storeId = 1;
      const token = createToken(storeId);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      
      // Verify token can be decoded
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-default-super-secret-key');
      expect(decoded.storeId).toBe(storeId);
      expect(decoded.exp).toBeDefined();
    });

    test('should create token with 1 day expiration', () => {
      const storeId = 1;
      const token = createToken(storeId);
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-default-super-secret-key');
      
      const now = Math.floor(Date.now() / 1000);
      const expiration = decoded.exp;
      const timeDiff = expiration - now;
      
      // Should be approximately 24 hours (86400 seconds)
      expect(timeDiff).toBeGreaterThan(86000);
      expect(timeDiff).toBeLessThan(87000);
    });
  });

  describe('Authentication Middleware', () => {
    beforeEach(() => {
      app.use('/api/portal/protected', requireStoreAuth, (req, res) => {
        res.json({ 
          success: true, 
          message: 'Authenticated',
          user: req.user 
        });
      });
    });

    test('should accept valid JWT token', async () => {
      const token = createToken(1);
      
      const response = await request(app)
        .get('/api/portal/protected')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.user.storeId).toBe(1);
    });

    test('should reject request without authorization header', async () => {
      const response = await request(app)
        .get('/api/portal/protected')
        .expect(401);
      
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Authorization token required.');
    });

    test('should reject request with invalid token format', async () => {
      const response = await request(app)
        .get('/api/portal/protected')
        .set('Authorization', 'InvalidToken')
        .expect(401);
      
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Request is not authorized.');
    });

    test('should reject request with malformed Bearer token', async () => {
      const response = await request(app)
        .get('/api/portal/protected')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
      
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Request is not authorized.');
    });

    test('should reject expired token', async () => {
      // Create an expired token
      const expiredToken = jwt.sign(
        { storeId: 1 }, 
        process.env.JWT_SECRET || 'your-default-super-secret-key', 
        { expiresIn: '-1h' }
      );
      
      const response = await request(app)
        .get('/api/portal/protected')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);
      
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Request is not authorized.');
    });

    test('should reject token with wrong secret', async () => {
      const wrongSecretToken = jwt.sign(
        { storeId: 1 }, 
        'wrong-secret', 
        { expiresIn: '1d' }
      );
      
      const response = await request(app)
        .get('/api/portal/protected')
        .set('Authorization', `Bearer ${wrongSecretToken}`)
        .expect(401);
      
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Request is not authorized.');
    });
  });

  describe('Password Hashing and Verification', () => {
    test('should hash password correctly', async () => {
      const password = 'testpassword123';
      const hash = await bcrypt.hash(password, 10);
      
      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.startsWith('$2b$')).toBe(true);
    });

    test('should verify correct password', async () => {
      const password = 'testpassword123';
      const hash = await bcrypt.hash(password, 10);
      
      const isValid = await bcrypt.compare(password, hash);
      expect(isValid).toBe(true);
    });

    test('should reject incorrect password', async () => {
      const password = 'testpassword123';
      const wrongPassword = 'wrongpassword';
      const hash = await bcrypt.hash(password, 10);
      
      const isValid = await bcrypt.compare(wrongPassword, hash);
      expect(isValid).toBe(false);
    });

    test('should handle different salt rounds', async () => {
      const password = 'testpassword123';
      const hash1 = await bcrypt.hash(password, 10);
      const hash2 = await bcrypt.hash(password, 12);
      
      expect(hash1).not.toBe(hash2);
      
      // Both should verify the same password
      const isValid1 = await bcrypt.compare(password, hash1);
      const isValid2 = await bcrypt.compare(password, hash2);
      
      expect(isValid1).toBe(true);
      expect(isValid2).toBe(true);
    });
  });

  describe('Login Endpoint', () => {
    beforeEach(() => {
      // Import the portal router
      const portalRouter = require('../routes/portal');
      app.use('/api/portal', portalRouter);
    });

    test('should login with valid credentials', async () => {
      // Mock database response
      dbOps.findStoreUserByEmail.mockResolvedValue(mockUser);
      dbOps.verifyUserPassword.mockResolvedValue(true);
      
      const response = await request(app)
        .post('/api/portal/login')
        .send({
          email: 'owner@koshercorner.com',
          password: 'testpassword123'
        })
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeDefined();
      expect(response.body.user.email).toBe('owner@koshercorner.com');
      expect(response.body.user.role).toBe('owner');
      expect(response.body.user.storeId).toBe(1);
      
      // Verify token is valid
      const decoded = jwt.verify(response.body.token, process.env.JWT_SECRET || 'your-default-super-secret-key');
      expect(decoded.storeId).toBe(1);
    });

    test('should reject login with missing email', async () => {
      const response = await request(app)
        .post('/api/portal/login')
        .send({
          password: 'testpassword123'
        })
        .expect(400);
      
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Email and password are required.');
    });

    test('should reject login with missing password', async () => {
      const response = await request(app)
        .post('/api/portal/login')
        .send({
          email: 'owner@koshercorner.com'
        })
        .expect(400);
      
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Email and password are required.');
    });

    test('should reject login with non-existent user', async () => {
      dbOps.findStoreUserByEmail.mockResolvedValue(null);
      
      const response = await request(app)
        .post('/api/portal/login')
        .send({
          email: 'nonexistent@store.com',
          password: 'testpassword123'
        })
        .expect(401);
      
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid credentials.');
    });

    test('should reject login with wrong password', async () => {
      dbOps.findStoreUserByEmail.mockResolvedValue(mockUser);
      dbOps.verifyUserPassword.mockResolvedValue(false);
      
      const response = await request(app)
        .post('/api/portal/login')
        .send({
          email: 'owner@koshercorner.com',
          password: 'wrongpassword'
        })
        .expect(401);
      
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid credentials.');
    });

    test('should handle database errors gracefully', async () => {
      dbOps.findStoreUserByEmail.mockRejectedValue(new Error('Database connection failed'));
      
      const response = await request(app)
        .post('/api/portal/login')
        .send({
          email: 'owner@koshercorner.com',
          password: 'testpassword123'
        })
        .expect(500);
      
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('An internal server error occurred.');
    });
  });

  describe('Security Edge Cases', () => {
    beforeEach(() => {
      // Import the portal router
      const portalRouter = require('../routes/portal');
      app.use('/api/portal', portalRouter);
    });

    test('should handle SQL injection attempts in email', async () => {
      dbOps.findStoreUserByEmail.mockResolvedValue(null);
      
      const response = await request(app)
        .post('/api/portal/login')
        .send({
          email: "'; DROP TABLE store_users; --",
          password: 'testpassword123'
        })
        .expect(401);
      
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid credentials.');
    });

    test('should handle XSS attempts in email', async () => {
      dbOps.findStoreUserByEmail.mockResolvedValue(null);
      
      const response = await request(app)
        .post('/api/portal/login')
        .send({
          email: '<script>alert("xss")</script>',
          password: 'testpassword123'
        })
        .expect(401);
      
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid credentials.');
    });

    test('should handle very long email addresses', async () => {
      const longEmail = 'a'.repeat(300) + '@store.com';
      
      const response = await request(app)
        .post('/api/portal/login')
        .send({
          email: longEmail,
          password: 'testpassword123'
        })
        .expect(401);
      
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid credentials.');
    });

    test('should handle very long passwords', async () => {
      const longPassword = 'a'.repeat(1000);
      
      const response = await request(app)
        .post('/api/portal/login')
        .send({
          email: 'owner@koshercorner.com',
          password: longPassword
        })
        .expect(401);
      
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid credentials.');
    });
  });

  describe('Token Security', () => {
    test('should not expose sensitive user data in token', () => {
      const token = createToken(1);
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-default-super-secret-key');
      
      // Token should only contain storeId and standard JWT claims
      expect(decoded.storeId).toBe(1);
      expect(decoded.email).toBeUndefined();
      expect(decoded.password_hash).toBeUndefined();
      expect(decoded.role).toBeUndefined();
    });

    test('should use secure JWT secret', () => {
      const token = createToken(1);
      
      // Should not be using default secret in production
      if (process.env.NODE_ENV === 'production') {
        expect(process.env.JWT_SECRET).toBeDefined();
        expect(process.env.JWT_SECRET).not.toBe('your-default-super-secret-key');
      }
    });
  });
});
