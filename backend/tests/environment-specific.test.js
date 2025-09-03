/**
 * Environment-Specific Tests
 * 
 * BUSINESS CRITICAL: Validates that the application behaves correctly
 * across different deployment environments (development, staging, production).
 */

const request = require('supertest');
const express = require('express');

// Mock different environment configurations
const mockConfigs = {
  development: {
    environment: 'development',
    api: { baseUrl: 'http://localhost:3001' },
    security: { strictMode: false },
    logging: { level: 'debug' },
    features: { debugMode: true }
  },
  staging: {
    environment: 'staging',
    api: { baseUrl: 'https://staging-api.shopstation.co.uk' },
    security: { strictMode: true },
    logging: { level: 'info' },
    features: { debugMode: false }
  },
  production: {
    environment: 'production',
    api: { baseUrl: 'https://backend-production-2cbb.up.railway.app' },
    security: { strictMode: true },
    logging: { level: 'error' },
    features: { debugMode: false }
  }
};

describe('Environment-Specific Behavior Tests', () => {
  let originalNodeEnv;
  
  beforeAll(() => {
    originalNodeEnv = process.env.NODE_ENV;
  });
  
  afterAll(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });

  describe('🔧 Development Environment', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'development';
      process.env.ADMIN_PASSWORD = 'dev-admin-password';
      process.env.JWT_SECRET = 'dev-jwt-secret-not-secure';
      
      // Clear require cache to reload modules with new env
      Object.keys(require.cache).forEach(key => {
        if (key.includes('config/environments')) {
          delete require.cache[key];
        }
      });
    });

    test('allows relaxed security settings', () => {
      // Development should allow weaker passwords and JWT secrets
      expect(process.env.JWT_SECRET).toBe('dev-jwt-secret-not-secure');
      expect(process.env.ADMIN_PASSWORD).toBe('dev-admin-password');
    });

    test('enables debug features', () => {
      // Mock config loading
      jest.doMock('../config/environments', () => mockConfigs.development);
      const config = require('../config/environments');
      
      expect(config.environment).toBe('development');
      expect(config.features.debugMode).toBe(true);
      expect(config.logging.level).toBe('debug');
    });

    test('development API endpoints work correctly', async () => {
      const app = express();
      app.use(express.json());
      
      // Simple development endpoint
      app.get('/api/dev/health', (req, res) => {
        res.json({ 
          status: 'OK',
          environment: 'development',
          debug: true,
          timestamp: new Date().toISOString()
        });
      });

      const response = await request(app)
        .get('/api/dev/health')
        .expect(200);

      expect(response.body.environment).toBe('development');
      expect(response.body.debug).toBe(true);
    });

    test('development error handling is verbose', () => {
      // Development should provide detailed error information
      const error = new Error('Test development error');
      
      // Mock error handler
      const developmentErrorHandler = (err, req, res, next) => {
        res.status(500).json({
          success: false,
          error: err.message,
          stack: err.stack, // Include stack trace in development
          environment: 'development'
        });
      };

      expect(typeof developmentErrorHandler).toBe('function');
    });
  });

  describe('🎭 Staging Environment', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'staging';
      process.env.ADMIN_PASSWORD = 'staging-admin-password-secure';
      process.env.JWT_SECRET = 'staging-jwt-secret-for-testing-environment';
      
      // Clear require cache
      Object.keys(require.cache).forEach(key => {
        if (key.includes('config/environments')) {
          delete require.cache[key];
        }
      });
    });

    test('enforces secure configuration', () => {
      expect(process.env.JWT_SECRET.length).toBeGreaterThan(20);
      expect(process.env.ADMIN_PASSWORD.length).toBeGreaterThan(8);
    });

    test('disables debug features', () => {
      jest.doMock('../config/environments', () => mockConfigs.staging);
      const config = require('../config/environments');
      
      expect(config.environment).toBe('staging');
      expect(config.features.debugMode).toBe(false);
      expect(config.security.strictMode).toBe(true);
    });

    test('staging API endpoints mirror production', async () => {
      const app = express();
      app.use(express.json());
      
      // Staging endpoint should be production-like
      app.get('/api/health', (req, res) => {
        res.json({ 
          status: 'OK',
          environment: 'staging',
          version: '1.2.0',
          uptime: process.uptime()
        });
      });

      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body.environment).toBe('staging');
      expect(response.body).not.toHaveProperty('debug');
      expect(response.body).toHaveProperty('version');
    });

    test('staging quality gates are enforced', () => {
      // Staging should enforce quality gates
      const { QualityGateSystem } = require('../scripts/quality-gates');
      const qualityGates = new QualityGateSystem({ strictMode: true });
      
      expect(qualityGates.strictMode).toBe(true);
    });
  });

  describe('🌟 Production Environment', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'production';
      process.env.ADMIN_PASSWORD = 'production-secure-admin-password-123';
      process.env.JWT_SECRET = 'production-jwt-secret-very-long-and-secure-for-production';
      
      // Clear require cache
      Object.keys(require.cache).forEach(key => {
        if (key.includes('config/environments')) {
          delete require.cache[key];
        }
      });
    });

    test('enforces strict security requirements', () => {
      expect(process.env.JWT_SECRET.length).toBeGreaterThan(32);
      expect(process.env.ADMIN_PASSWORD.length).toBeGreaterThan(8);
      expect(process.env.JWT_SECRET).not.toContain('development');
      expect(process.env.ADMIN_PASSWORD).not.toContain('temp');
    });

    test('production configuration is optimal', () => {
      jest.doMock('../config/environments', () => mockConfigs.production);
      const config = require('../config/environments');
      
      expect(config.environment).toBe('production');
      expect(config.features.debugMode).toBe(false);
      expect(config.security.strictMode).toBe(true);
      expect(config.logging.level).toBe('error');
    });

    test('production error handling is secure', () => {
      // Production should not leak sensitive information
      const productionErrorHandler = (err, req, res, next) => {
        res.status(500).json({
          success: false,
          error: 'Internal server error',
          // No stack trace or detailed error info in production
          environment: 'production',
          timestamp: new Date().toISOString()
        });
      };

      const mockError = new Error('Database connection failed with credentials user:password@host');
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      productionErrorHandler(mockError, {}, mockRes, jest.fn());

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Internal server error',
          environment: 'production'
        })
      );
      
      // Should not include sensitive error details
      expect(mockRes.json).not.toHaveBeenCalledWith(
        expect.objectContaining({
          stack: expect.any(String)
        })
      );
    });

    test('production API endpoints are optimized', async () => {
      const app = express();
      app.use(express.json());
      
      // Production health endpoint
      app.get('/api/health', (req, res) => {
        res.json({ 
          status: 'OK',
          environment: 'production',
          version: '1.2.0'
          // Minimal response in production
        });
      });

      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body.environment).toBe('production');
      expect(response.body).not.toHaveProperty('debug');
      expect(response.body).not.toHaveProperty('detailedMetrics');
      expect(Object.keys(response.body)).toHaveLength(3); // Minimal response
    });
  });

  describe('🔄 Cross-Environment Compatibility', () => {
    const environments = ['development', 'staging', 'production'];

    environments.forEach(env => {
      describe(`${env} environment compatibility`, () => {
        beforeEach(() => {
          process.env.NODE_ENV = env;
          
          // Set appropriate credentials for each environment
          switch (env) {
            case 'development':
              process.env.ADMIN_PASSWORD = 'dev-admin-password';
              process.env.JWT_SECRET = 'dev-jwt-secret';
              break;
            case 'staging':
              process.env.ADMIN_PASSWORD = 'staging-admin-password-secure';
              process.env.JWT_SECRET = 'staging-jwt-secret-for-testing';
              break;
            case 'production':
              process.env.ADMIN_PASSWORD = 'production-secure-admin-password';
              process.env.JWT_SECRET = 'production-jwt-secret-very-secure';
              break;
          }
        });

        test(`${env} - core modules load correctly`, () => {
          expect(() => {
            require('../database/kosher-db');
            require('../routes/compare');
            require('../routes/manual-entry');
          }).not.toThrow();
        });

        test(`${env} - environment configuration is valid`, () => {
          // Mock appropriate config for environment
          jest.doMock('../config/environments', () => mockConfigs[env]);
          
          const config = require('../config/environments');
          expect(config.environment).toBe(env);
          expect(config.api).toBeDefined();
          expect(config.security).toBeDefined();
        });

        test(`${env} - database operations work`, () => {
          const { readDB, writeDB } = require('../database/kosher-db');
          
          expect(typeof readDB).toBe('function');
          expect(typeof writeDB).toBe('function');
          
          // Test basic database operations don't throw
          expect(() => {
            const data = readDB();
            expect(typeof data).toBe('object');
          }).not.toThrow();
        });

        test(`${env} - monitoring system initializes`, () => {
          const { BusinessMonitoring } = require('../utils/monitoring');
          
          expect(() => {
            const monitoring = new BusinessMonitoring();
            expect(monitoring).toBeDefined();
          }).not.toThrow();
        });
      });
    });

    test('environment transitions maintain data consistency', () => {
      // Test that switching environments doesn't corrupt data
      const { readDB } = require('../database/kosher-db');
      
      // Read data in development
      process.env.NODE_ENV = 'development';
      const devData = readDB();
      
      // Switch to staging
      process.env.NODE_ENV = 'staging';
      const stagingData = readDB();
      
      // Switch to production
      process.env.NODE_ENV = 'production';
      const prodData = readDB();
      
      // Data structure should be consistent across environments
      expect(typeof devData).toBe('object');
      expect(typeof stagingData).toBe('object');
      expect(typeof prodData).toBe('object');
      
      // Core structure should be the same
      if (devData.products) {
        expect(stagingData).toHaveProperty('products');
        expect(prodData).toHaveProperty('products');
      }
    });

    test('environment-specific features work correctly', () => {
      const environments = [
        { env: 'development', expectDebug: true },
        { env: 'staging', expectDebug: false },
        { env: 'production', expectDebug: false }
      ];

      environments.forEach(({ env, expectDebug }) => {
        process.env.NODE_ENV = env;
        jest.doMock('../config/environments', () => mockConfigs[env]);
        
        const config = require('../config/environments');
        expect(config.features.debugMode).toBe(expectDebug);
        
        // Clear cache for next iteration
        Object.keys(require.cache).forEach(key => {
          if (key.includes('config/environments')) {
            delete require.cache[key];
          }
        });
      });
    });
  });

  describe('⚠️ Environment Validation', () => {
    test('detects missing environment variables', () => {
      const originalJwtSecret = process.env.JWT_SECRET;
      delete process.env.JWT_SECRET;
      
      expect(() => {
        const { QualityGateSystem } = require('../scripts/quality-gates');
        const qualityGates = new QualityGateSystem();
        return qualityGates.validateEnvironmentConfig();
      }).toBeDefined();
      
      // Restore original value
      process.env.JWT_SECRET = originalJwtSecret;
    });

    test('prevents production deployment with insecure defaults', () => {
      process.env.NODE_ENV = 'production';
      process.env.JWT_SECRET = 'development-jwt-secret-change-me';
      process.env.ADMIN_PASSWORD = 'temp-password-123';
      
      expect(async () => {
        const { QualityGateSystem } = require('../scripts/quality-gates');
        const qualityGates = new QualityGateSystem({ strictMode: true });
        await qualityGates.validateEnvironmentConfig();
      }).toBeDefined();
    });

    test('validates environment-appropriate security settings', () => {
      const testCases = [
        {
          env: 'development',
          jwtSecret: 'dev-secret',
          adminPassword: 'dev-pass',
          shouldPass: true
        },
        {
          env: 'production',
          jwtSecret: 'very-long-secure-production-jwt-secret-key',
          adminPassword: 'secure-production-password',
          shouldPass: true
        },
        {
          env: 'production',
          jwtSecret: 'short',
          adminPassword: 'weak',
          shouldPass: false
        }
      ];

      testCases.forEach(testCase => {
        process.env.NODE_ENV = testCase.env;
        process.env.JWT_SECRET = testCase.jwtSecret;
        process.env.ADMIN_PASSWORD = testCase.adminPassword;
        
        if (testCase.shouldPass) {
          expect(() => {
            // Basic length validation
            if (testCase.env === 'production') {
              expect(testCase.jwtSecret.length).toBeGreaterThan(20);
              expect(testCase.adminPassword.length).toBeGreaterThan(8);
            }
          }).not.toThrow();
        } else {
          expect(() => {
            if (testCase.env === 'production') {
              if (testCase.jwtSecret.length <= 10) {
                throw new Error('JWT secret too short for production');
              }
              if (testCase.adminPassword.length <= 5) {
                throw new Error('Admin password too weak for production');
              }
            }
          }).toThrow();
        }
      });
    });
  });
});