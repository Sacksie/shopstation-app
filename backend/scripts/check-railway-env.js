#!/usr/bin/env node

/**
 * Railway Environment Validation Script
 * 
 * This script checks that all required environment variables are properly
 * configured in Railway before deployment.
 * 
 * BUSINESS IMPACT: Prevents production deployments with insecure defaults
 */

// Load environment variables from .env file for development
require('dotenv').config();

const requiredEnvVars = {
  NODE_ENV: {
    description: 'Application environment',
    required: true,
    production_value: 'production'
  },
  JWT_SECRET: {
    description: 'JWT signing secret for session management',
    required: true,
    validation: (value) => value && value !== 'development-jwt-secret-change-me' && value.length >= 32
  },
  ADMIN_PASSWORD: {
    description: 'Admin panel authentication password',
    required: true,
    validation: (value) => value && value !== 'temp-password-123' && value.length >= 8
  },
  PORT: {
    description: 'Server port (Railway sets this automatically)',
    required: false,
    default: '3001'
  }
};

console.log('🔍 Railway Environment Validation');
console.log('=====================================');

let hasErrors = false;
let warnings = [];

// Check each required environment variable
Object.entries(requiredEnvVars).forEach(([varName, config]) => {
  const value = process.env[varName];
  
  if (config.required && !value) {
    console.error(`❌ MISSING: ${varName}`);
    console.error(`   Description: ${config.description}`);
    console.error(`   Action: Set this in Railway Dashboard > Variables tab`);
    hasErrors = true;
  } else if (value && config.validation && !config.validation(value)) {
    console.error(`❌ INVALID: ${varName}`);
    console.error(`   Description: ${config.description}`);
    console.error(`   Current: ${value.substring(0, 10)}...`);
    console.error(`   Action: Update this in Railway Dashboard > Variables tab`);
    hasErrors = true;
  } else if (value) {
    console.log(`✅ Valid: ${varName}`);
    if (config.production_value && value !== config.production_value) {
      warnings.push(`⚠️  ${varName} is set to "${value}", expected "${config.production_value}"`);
    }
  } else if (!config.required) {
    console.log(`ℹ️  Optional: ${varName} (using default: ${config.default || 'none'})`);
  }
});

// Show warnings
if (warnings.length > 0) {
  console.log('\nWarnings:');
  warnings.forEach(warning => console.log(warning));
}

console.log('\n=====================================');

if (hasErrors) {
  console.error('💥 DEPLOYMENT BLOCKED: Environment variables not properly configured');
  console.error('\n🔧 TO FIX:');
  console.error('1. Go to https://railway.app');
  console.error('2. Select your backend project');
  console.error('3. Click Variables tab');
  console.error('4. Add the missing/invalid environment variables shown above');
  console.error('5. Railway will automatically redeploy');
  console.error('\n🔐 SECURITY: This validation prevents insecure production deployments');
  
  // Only exit if in production, otherwise just warn
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  } else {
    console.warn('\n⚠️  WARNING: Running with insecure development settings. DO NOT use in production.');
  }
} else {
  console.log('✅ All environment variables properly configured');
  console.log('🚀 Deployment can proceed safely');
}