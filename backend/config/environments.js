/**
 * Environment Configuration Management
 * 
 * This file centralizes all environment-specific settings for different deployment stages:
 * - development: Local development on developer machines
 * - staging: Testing environment for QA and feature validation
 * - production: Live environment serving real customers
 * 
 * Benefits:
 * 1. Single source of truth for all environment settings
 * 2. Easy onboarding for new team members
 * 3. Prevents configuration mistakes between environments
 * 4. Supports multiple deployment stages as business grows
 */

const environments = {
  development: {
    port: 3001,
    cors: {
      origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
      credentials: true
    },
    database: {
      backup_interval: '*/30 * * * *', // Every 30 minutes for testing
      max_backups: 10
    },
    logging: {
      level: 'debug',
      include_sensitive: false
    },
    security: {
      require_https: false,
      session_timeout: '24h'
    }
  },

  staging: {
    port: process.env.PORT || 3001,
    cors: {
      origin: [
        'https://staging-shopstation.vercel.app',
        'https://grocery-compare-staging.vercel.app'
      ],
      credentials: true
    },
    database: {
      backup_interval: '0 */6 * * *', // Every 6 hours
      max_backups: 20
    },
    logging: {
      level: 'info',
      include_sensitive: false
    },
    security: {
      require_https: true,
      session_timeout: '8h'
    }
  },

  production: {
    port: process.env.PORT || 3001,
    cors: {
      origin: [
        'https://shopstation.co.uk',
        'https://grocery-compare-frontend-ld1kaknut-gavriel-sacks-projects.vercel.app'
      ],
      credentials: true
    },
    database: {
      backup_interval: '0 */12 * * *', // Every 12 hours
      max_backups: 50
    },
    logging: {
      level: 'warn',
      include_sensitive: false
    },
    security: {
      require_https: true,
      session_timeout: '2h'
    }
  }
};

// Get current environment from NODE_ENV, default to development
const currentEnv = process.env.NODE_ENV || 'development';

// Export the configuration for the current environment
const config = {
  ...environments[currentEnv],
  environment: currentEnv,
  
  // Common settings that apply to all environments
  common: {
    admin_password: process.env.ADMIN_PASSWORD || 'temp-password-123',
    api_rate_limit: process.env.API_RATE_LIMIT || 100,
    jwt_secret: process.env.JWT_SECRET || 'development-jwt-secret-change-me',
    
    // Feature flags for gradual rollouts
    features: {
      advanced_analytics: process.env.FEATURE_ANALYTICS === 'true',
      receipt_processing: process.env.FEATURE_RECEIPTS === 'true',
      bulk_operations: process.env.FEATURE_BULK_OPS === 'true'
    }
  }
};

// Validation: Ensure critical production settings are configured
if (currentEnv === 'production') {
  if (config.common.admin_password === 'temp-password-123') {
    console.error('🚨 SECURITY WARNING: Default admin password detected in production!');
    process.exit(1);
  }
  
  if (config.common.jwt_secret === 'development-jwt-secret-change-me') {
    console.error('🚨 SECURITY WARNING: Default JWT secret detected in production!');
    process.exit(1);
  }
}

// Development helper: Log current environment on startup
console.log(`🌍 Environment: ${currentEnv.toUpperCase()}`);
console.log(`🚀 Server will run on port ${config.port}`);

module.exports = config;