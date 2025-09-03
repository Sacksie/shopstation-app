/**
 * Frontend Environment Configuration
 * 
 * Centralizes all environment-specific settings for the React application.
 * This eliminates hardcoded API URLs and makes the app environment-aware.
 * 
 * Team Benefits:
 * 1. New developers can immediately see what environments exist
 * 2. No more hunting through files for hardcoded URLs
 * 3. Easy to add new environments (e.g., demo, client-staging)
 * 4. Prevents production API calls during development
 */

const environments = {
  development: {
    api: {
      baseUrl: 'http://localhost:3001',
      timeout: 10000,
      retryAttempts: 3
    },
    features: {
      debugMode: true,
      showDevTools: true,
      mockData: false,
      verboseLogging: true
    },
    analytics: {
      enabled: false,
      trackingId: null
    }
  },

  staging: {
    api: {
      baseUrl: 'https://staging-backend.railway.app', // You'll create this later
      timeout: 8000,
      retryAttempts: 2
    },
    features: {
      debugMode: true,
      showDevTools: false,
      mockData: false,
      verboseLogging: false
    },
    analytics: {
      enabled: true,
      trackingId: process.env.REACT_APP_ANALYTICS_STAGING
    }
  },

  production: {
    api: {
      baseUrl: process.env.REACT_APP_API_URL || 'https://backend-production-2cbb.up.railway.app',
      timeout: 5000,
      retryAttempts: 1
    },
    features: {
      debugMode: false,
      showDevTools: false,
      mockData: false,
      verboseLogging: false
    },
    analytics: {
      enabled: true,
      trackingId: process.env.REACT_APP_ANALYTICS_PROD
    }
  }
};

// Determine current environment
// React apps use NODE_ENV, but we can override with REACT_APP_ENV for more control
const getCurrentEnvironment = () => {
  // Allow manual override for testing
  if (process.env.REACT_APP_ENV) {
    return process.env.REACT_APP_ENV;
  }
  
  // Default React behavior
  if (process.env.NODE_ENV === 'development') {
    return 'development';
  }
  
  // Check if we're on staging domain
  if (window.location.hostname.includes('staging') || 
      window.location.hostname.includes('preview')) {
    return 'staging';
  }
  
  // Default to production for built apps
  return 'production';
};

const currentEnv = getCurrentEnvironment();
const config = environments[currentEnv];

// Add environment info to config
config.environment = currentEnv;
config.buildInfo = {
  version: process.env.REACT_APP_VERSION || '1.0.0',
  buildTime: process.env.REACT_APP_BUILD_TIME || new Date().toISOString(),
  commitHash: process.env.REACT_APP_COMMIT_HASH || 'unknown'
};

// Development logging
if (config.features.verboseLogging) {
  console.log('🌍 Frontend Environment:', currentEnv.toUpperCase());
  console.log('🔗 API Base URL:', config.api.baseUrl);
  console.log('🎯 Features:', config.features);
}

// Create API helper that uses environment config
export const createApiUrl = (endpoint) => {
  const baseUrl = config.api.baseUrl.replace(/\/$/, ''); // Remove trailing slash
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${baseUrl}${cleanEndpoint}`;
};

// Export configuration
export default config;