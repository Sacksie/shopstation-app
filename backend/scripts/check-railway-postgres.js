#!/usr/bin/env node

/**
 * Railway PostgreSQL Configuration Checker
 * 
 * BUSINESS CRITICAL: Verifies Railway PostgreSQL setup before migration
 * - Checks DATABASE_URL environment variable
 * - Tests PostgreSQL connection
 * - Validates database permissions
 * - Provides setup instructions if needed
 */

const { Pool } = require('pg');

class RailwayPostgresChecker {
  constructor() {
    this.databaseUrl = process.env.DATABASE_URL;
    this.connection = null;
  }

  /**
   * Main check process
   */
  async check() {
    console.log('🔍 Railway PostgreSQL Configuration Check');
    console.log('==========================================');
    
    try {
      // Step 1: Check environment variables
      await this.checkEnvironmentVariables();
      
      // Step 2: Test database connection
      await this.testDatabaseConnection();
      
      // Step 3: Check database permissions
      await this.checkDatabasePermissions();
      
      // Step 4: Verify schema readiness
      await this.checkSchemaReadiness();
      
      console.log('\n🎉 RAILWAY POSTGRESQL CHECK COMPLETED!');
      console.log('✅ PostgreSQL is ready for migration');
      
      return { success: true };
      
    } catch (error) {
      console.error('\n💥 RAILWAY POSTGRESQL CHECK FAILED:', error.message);
      await this.provideSetupInstructions();
      return { success: false, error: error.message };
    } finally {
      if (this.connection) {
        await this.connection.end();
      }
    }
  }

  /**
   * Check environment variables
   */
  async checkEnvironmentVariables() {
    console.log('🔧 Checking environment variables...');
    
    if (!this.databaseUrl) {
      throw new Error('DATABASE_URL not found. PostgreSQL not configured in Railway.');
    }
    
    // Parse DATABASE_URL to extract components
    const url = new URL(this.databaseUrl);
    console.log(`   ✅ DATABASE_URL found`);
    console.log(`   📍 Host: ${url.hostname}`);
    console.log(`   🗄️  Database: ${url.pathname.slice(1)}`);
    console.log(`   👤 User: ${url.username}`);
    console.log(`   🔒 SSL: ${url.protocol === 'postgresql:' ? 'Enabled' : 'Disabled'}`);
  }

  /**
   * Test database connection
   */
  async testDatabaseConnection() {
    console.log('🔌 Testing database connection...');
    
    this.connection = new Pool({
      connectionString: this.databaseUrl,
      ssl: { rejectUnauthorized: false },
      max: 1,
      connectionTimeoutMillis: 10000
    });

    try {
      const client = await this.connection.connect();
      const result = await client.query('SELECT NOW() as current_time, version() as postgres_version');
      client.release();
      
      console.log(`   ✅ Connected successfully`);
      console.log(`   📅 Database time: ${result.rows[0].current_time}`);
      console.log(`   🐘 PostgreSQL version: ${result.rows[0].postgres_version.split(' ')[0]}`);
      
    } catch (error) {
      throw new Error(`Database connection failed: ${error.message}`);
    }
  }

  /**
   * Check database permissions
   */
  async checkDatabasePermissions() {
    console.log('🔐 Checking database permissions...');
    
    const client = await this.connection.connect();
    
    try {
      // Check if we can create tables
      const createTest = await client.query(`
        CREATE TABLE IF NOT EXISTS permission_test (
          id SERIAL PRIMARY KEY,
          test_data TEXT
        )
      `);
      
      // Check if we can insert data
      const insertTest = await client.query(`
        INSERT INTO permission_test (test_data) VALUES ('test') RETURNING id
      `);
      
      // Check if we can read data
      const selectTest = await client.query(`
        SELECT * FROM permission_test WHERE id = $1
      `, [insertTest.rows[0].id]);
      
      // Clean up test table
      await client.query('DROP TABLE permission_test');
      
      console.log(`   ✅ CREATE permission: OK`);
      console.log(`   ✅ INSERT permission: OK`);
      console.log(`   ✅ SELECT permission: OK`);
      console.log(`   ✅ DROP permission: OK`);
      
    } catch (error) {
      throw new Error(`Permission check failed: ${error.message}`);
    } finally {
      client.release();
    }
  }

  /**
   * Check schema readiness
   */
  async checkSchemaReadiness() {
    console.log('📋 Checking schema readiness...');
    
    const client = await this.connection.connect();
    
    try {
      // Check if tables already exist
      const tablesCheck = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('stores', 'products', 'store_products', 'categories')
      `);
      
      if (tablesCheck.rows.length > 0) {
        console.log(`   ⚠️  Found existing tables: ${tablesCheck.rows.map(r => r.table_name).join(', ')}`);
        console.log(`   ℹ️  Migration will update existing schema`);
      } else {
        console.log(`   ✅ Database is clean, ready for fresh migration`);
      }
      
    } catch (error) {
      throw new Error(`Schema check failed: ${error.message}`);
    } finally {
      client.release();
    }
  }

  /**
   * Provide setup instructions if PostgreSQL is not configured
   */
  async provideSetupInstructions() {
    console.log('\n📋 RAILWAY POSTGRESQL SETUP INSTRUCTIONS');
    console.log('=========================================');
    console.log('');
    console.log('To add PostgreSQL to your Railway project:');
    console.log('');
    console.log('1. 🌐 Go to Railway Dashboard:');
    console.log('   https://railway.app/dashboard');
    console.log('');
    console.log('2. 🎯 Select your ShopStation project');
    console.log('');
    console.log('3. ➕ Click "New" → "Database" → "Add PostgreSQL"');
    console.log('');
    console.log('4. ⏳ Wait for PostgreSQL to be provisioned (2-3 minutes)');
    console.log('');
    console.log('5. 🔧 Railway will automatically create DATABASE_URL environment variable');
    console.log('');
    console.log('6. 🚀 Redeploy your application to pick up the new environment variable');
    console.log('');
    console.log('7. ✅ Run this check again: npm run check:railway-postgres');
    console.log('');
    console.log('8. 🎯 Then run migration: npm run migrate:postgres');
    console.log('');
    console.log('💡 TIP: The DATABASE_URL will look like:');
    console.log('   postgresql://postgres:password@host:port/database');
  }
}

// Run if called directly
if (require.main === module) {
  const checker = new RailwayPostgresChecker();
  checker.check()
    .then(result => {
      if (result.success) {
        console.log('\n🎯 Next step: Run npm run migrate:postgres');
        process.exit(0);
      } else {
        console.error('\n❌ Railway PostgreSQL check failed');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('💥 Unexpected error:', error.message);
      process.exit(1);
    });
}

module.exports = { RailwayPostgresChecker };
