#!/usr/bin/env node

/**
 * Development Database Setup Script
 * 
 * Sets up a local development environment for Store Portal testing
 * - Creates a local PostgreSQL database connection string
 * - Provides instructions for setting up PostgreSQL locally
 * - Falls back to JSON database if PostgreSQL is not available
 */

const fs = require('fs').promises;
const path = require('path');

class DevDatabaseSetup {
  constructor() {
    this.envFile = path.join(__dirname, '..', '.env');
    this.exampleEnvFile = path.join(__dirname, '..', '.env.example');
  }

  /**
   * Main setup process
   */
  async setup() {
    console.log('🛠️  Development Database Setup');
    console.log('==============================');
    
    try {
      // Check if .env file exists
      const envExists = await this.checkEnvFile();
      
      if (!envExists) {
        await this.createEnvFile();
      }
      
      // Check PostgreSQL availability
      await this.checkPostgreSQL();
      
      // Provide setup instructions
      this.showSetupInstructions();
      
    } catch (error) {
      console.error('❌ Setup failed:', error.message);
      process.exit(1);
    }
  }

  /**
   * Check if .env file exists
   */
  async checkEnvFile() {
    try {
      await fs.access(this.envFile);
      console.log('✅ .env file exists');
      return true;
    } catch (error) {
      console.log('⚠️  .env file not found');
      return false;
    }
  }

  /**
   * Create .env file with development settings
   */
  async createEnvFile() {
    console.log('📝 Creating .env file...');
    
    const envContent = `# Development Environment Configuration
# Copy this file and customize for your local setup

# Database Configuration
# Option 1: Local PostgreSQL (recommended for Store Portal)
# DATABASE_URL=postgresql://username:password@localhost:5432/shopstation_dev

# Option 2: Railway PostgreSQL (if you have it set up)
# DATABASE_URL=postgresql://user:pass@host:port/database

# Option 3: No DATABASE_URL = Uses JSON database (limited functionality)

# Application Settings
NODE_ENV=development
PORT=3001

# Security (use strong passwords in production)
ADMIN_PASSWORD=dev-admin-password-123
JWT_SECRET=development-jwt-secret-change-me

# Feature Flags
FEATURE_ANALYTICS=true
FEATURE_RECEIPTS=true
FEATURE_BULK_OPS=true

# API Configuration
API_RATE_LIMIT=1000
`;

    await fs.writeFile(this.envFile, envContent);
    console.log('✅ Created .env file');
  }

  /**
   * Check PostgreSQL availability
   */
  async checkPostgreSQL() {
    console.log('\n🔍 Checking PostgreSQL availability...');
    
    // Try to load environment variables
    require('dotenv').config({ path: this.envFile });
    
    if (process.env.DATABASE_URL) {
      console.log('✅ DATABASE_URL is configured');
      console.log('   Database:', process.env.DATABASE_URL.split('@')[1] || 'configured');
    } else {
      console.log('⚠️  DATABASE_URL not configured');
      console.log('   Will use JSON database (limited Store Portal functionality)');
    }
  }

  /**
   * Show setup instructions
   */
  showSetupInstructions() {
    console.log('\n📋 Setup Instructions');
    console.log('=====================');
    
    console.log('\n🎯 For Full Store Portal Functionality:');
    console.log('   1. Install PostgreSQL locally:');
    console.log('      • macOS: brew install postgresql');
    console.log('      • Ubuntu: sudo apt install postgresql');
    console.log('      • Windows: Download from postgresql.org');
    
    console.log('\n   2. Create a database:');
    console.log('      createdb shopstation_dev');
    
    console.log('\n   3. Update .env file:');
    console.log('      DATABASE_URL=postgresql://username:password@localhost:5432/shopstation_dev');
    
    console.log('\n   4. Apply migrations:');
    console.log('      npm run portal:apply-migrations');
    
    console.log('\n   5. Create test users:');
    console.log('      npm run portal:create-users');
    
    console.log('\n   6. Run tests:');
    console.log('      npm run test:portal');
    
    console.log('\n🚀 For Quick Testing (JSON Database):');
    console.log('   1. Skip PostgreSQL setup');
    console.log('   2. Run: npm run test:portal');
    console.log('   3. Note: Some features will be limited');
    
    console.log('\n💡 Current Status:');
    if (process.env.DATABASE_URL) {
      console.log('   ✅ Ready for PostgreSQL migration');
    } else {
      console.log('   ⚠️  Using JSON database (limited functionality)');
    }
  }
}

// Run setup if called directly
if (require.main === module) {
  const setup = new DevDatabaseSetup();
  setup.setup()
    .then(() => {
      console.log('\n🎉 Development setup completed!');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Setup failed:', error.message);
      process.exit(1);
    });
}

module.exports = { DevDatabaseSetup };
