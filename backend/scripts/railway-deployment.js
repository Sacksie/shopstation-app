#!/usr/bin/env node

/**
 * Railway Deployment Script
 * 
 * BUSINESS CRITICAL: Automated deployment for Railway platform
 * - Environment detection and configuration
 * - Automatic PostgreSQL migration on first deploy
 * - Health checks and validation
 * - Production-ready deployment pipeline
 */

const { ProductionMigrationSystem } = require('./production-migration');
const { cloudBackup } = require('../utils/cloudBackup');

class RailwayDeployment {
  constructor() {
    this.isRailway = process.env.RAILWAY_ENVIRONMENT === 'production';
    this.isProduction = process.env.NODE_ENV === 'production';
    this.databaseUrl = process.env.DATABASE_URL;
  }

  /**
   * Main deployment process
   */
  async deploy() {
    console.log('🚂 Railway Deployment System');
    console.log('============================');
    console.log(`🌍 Environment: ${this.isProduction ? 'PRODUCTION' : 'DEVELOPMENT'}`);
    console.log(`🚂 Platform: ${this.isRailway ? 'RAILWAY' : 'LOCAL'}`);
    console.log(`📅 Deployed: ${new Date().toISOString()}`);
    console.log('');

    try {
      // Step 1: Environment validation
      await this.validateEnvironment();
      
      // Step 2: Check if migration is needed
      const needsMigration = await this.checkMigrationNeeded();
      
      if (needsMigration) {
        console.log('🔄 Migration required - executing...');
        await this.executeMigration();
      } else {
        console.log('✅ Database is up to date');
      }
      
      // Step 3: Health check
      await this.performHealthCheck();
      
      // Step 4: Deployment success
      await this.recordDeploymentSuccess();
      
      console.log('\n🎉 RAILWAY DEPLOYMENT COMPLETED!');
      console.log('✅ Application is ready to serve traffic');
      console.log('✅ Database is operational');
      console.log('✅ All systems healthy');
      
      return { success: true };
      
    } catch (error) {
      console.error('\n💥 DEPLOYMENT FAILED:', error.message);
      await this.recordDeploymentFailure(error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Validate environment
   */
  async validateEnvironment() {
    console.log('🔍 Validating environment...');
    
    if (!this.databaseUrl) {
      throw new Error('DATABASE_URL not found. PostgreSQL must be configured in Railway.');
    }
    
    console.log('   ✅ DATABASE_URL configured');
    console.log('   ✅ Environment variables validated');
  }

  /**
   * Check if migration is needed
   */
  async checkMigrationNeeded() {
    console.log('🔍 Checking migration status...');
    
    if (!this.databaseUrl) {
      return false; // No database, no migration needed
    }
    
    const { Pool } = require('pg');
    const connection = new Pool({
      connectionString: this.databaseUrl,
      ssl: this.isProduction ? { rejectUnauthorized: false } : false,
      max: 1
    });
    
    try {
      const client = await connection.connect();
      
      // Check if tables exist
      const result = await client.query(`
        SELECT COUNT(*) as table_count
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('stores', 'products', 'store_products', 'categories')
      `);
      
      client.release();
      await connection.end();
      
      const tableCount = parseInt(result.rows[0].table_count);
      const needsMigration = tableCount < 4;
      
      console.log(`   📊 Tables found: ${tableCount}/4`);
      console.log(`   🔄 Migration needed: ${needsMigration ? 'YES' : 'NO'}`);
      
      return needsMigration;
      
    } catch (error) {
      console.log('   ⚠️  Could not check migration status, assuming migration needed');
      return true;
    }
  }

  /**
   * Execute migration
   */
  async executeMigration() {
    console.log('🚀 Executing PostgreSQL migration...');
    
    const migration = new ProductionMigrationSystem();
    const result = await migration.execute();
    
    if (!result.success) {
      throw new Error(`Migration failed: ${result.error}`);
    }
    
    console.log('   ✅ Migration completed successfully');
  }

  /**
   * Perform health check
   */
  async performHealthCheck() {
    console.log('🏥 Performing health check...');
    
    const { Pool } = require('pg');
    const connection = new Pool({
      connectionString: this.databaseUrl,
      ssl: this.isProduction ? { rejectUnauthorized: false } : false,
      max: 1
    });
    
    try {
      const client = await connection.connect();
      
      // Test basic queries
      const storeCount = await client.query('SELECT COUNT(*) FROM stores WHERE is_active = true');
      const productCount = await client.query('SELECT COUNT(*) FROM products WHERE is_active = true');
      
      client.release();
      await connection.end();
      
      console.log(`   📊 Health check results:`);
      console.log(`      Active stores: ${storeCount.rows[0].count}`);
      console.log(`      Active products: ${productCount.rows[0].count}`);
      
      if (parseInt(storeCount.rows[0].count) === 0) {
        throw new Error('No stores found - database may not be properly migrated');
      }
      
      console.log('   ✅ Health check passed');
      
    } catch (error) {
      throw new Error(`Health check failed: ${error.message}`);
    }
  }

  /**
   * Record deployment success
   */
  async recordDeploymentSuccess() {
    console.log('📝 Recording deployment success...');
    
    const deploymentRecord = {
      timestamp: new Date().toISOString(),
      environment: this.isProduction ? 'production' : 'development',
      platform: 'railway',
      status: 'success',
      version: process.env.RAILWAY_GIT_COMMIT_SHA || 'unknown',
      databaseUrl: this.databaseUrl ? 'configured' : 'not-configured'
    };
    
    // Log to console for Railway logs
    console.log('   📋 Deployment Record:', JSON.stringify(deploymentRecord, null, 2));
    
    console.log('   ✅ Deployment recorded');
  }

  /**
   * Record deployment failure
   */
  async recordDeploymentFailure(error) {
    console.log('📝 Recording deployment failure...');
    
    const failureRecord = {
      timestamp: new Date().toISOString(),
      environment: this.isProduction ? 'production' : 'development',
      platform: 'railway',
      status: 'failed',
      error: error.message,
      version: process.env.RAILWAY_GIT_COMMIT_SHA || 'unknown'
    };
    
    // Log to console for Railway logs
    console.log('   📋 Failure Record:', JSON.stringify(failureRecord, null, 2));
    
    console.log('   ❌ Failure recorded');
  }
}

// Run if called directly
if (require.main === module) {
  const deployment = new RailwayDeployment();
  deployment.deploy()
    .then(result => {
      if (result.success) {
        console.log('\n🎯 Deployment completed successfully');
        process.exit(0);
      } else {
        console.error('\n❌ Deployment failed');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('💥 Unexpected deployment error:', error.message);
      process.exit(1);
    });
}

module.exports = { RailwayDeployment };
