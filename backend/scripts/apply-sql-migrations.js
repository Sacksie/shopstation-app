#!/usr/bin/env node

/**
 * Apply SQL Migrations Script
 * 
 * BUSINESS CRITICAL: Applies the SQL migrations for Store Portal functionality
 * - Creates store_users table for authentication
 * - Adds search_analytics table for customer insights
 * - Sets up foreign key constraints and triggers
 */

const fs = require('fs').promises;
const path = require('path');
const database = require('../database/db-connection');

class SQLMigrationApplier {
  constructor() {
    this.migrationsDir = path.join(__dirname, '..', 'migrations');
    this.appliedMigrations = [];
  }

  /**
   * Main migration application process
   */
  async applyMigrations() {
    console.log('🚀 Applying SQL Migrations for Store Portal');
    console.log('============================================');
    
    try {
      // Check if database is available
      if (!database.isAvailable()) {
        console.log('⚠️  PostgreSQL database not available. Checking connection...');
        await database.connect();
        
        if (!database.isAvailable()) {
          throw new Error('Cannot connect to PostgreSQL database. Please ensure DATABASE_URL is set and database is running.');
        }
      }

      console.log('✅ Connected to PostgreSQL database');

      // Apply migration 000: Initial Schema
      await this.applyMigration('000-initial-schema.sql');

      // Apply migration 001: Add store users
      await this.applyMigration('001-add-store-users.sql');
      
      // Apply migration 002: Add search analytics
      await this.applyMigration('002-add-search-analytics.sql');
      
      // Show summary
      this.showSummary();
      
      console.log('\n🎉 SQL Migrations Applied Successfully!');
      console.log('✅ Store Portal database structure is ready');
      console.log('✅ You can now create test store users');
      
    } catch (error) {
      console.error('\n💥 Migration Application Failed:', error.message);
      console.error('📋 Applied migrations:', this.appliedMigrations);
      process.exit(1);
    }
  }

  /**
   * Apply a single SQL migration file
   */
  async applyMigration(filename) {
    console.log(`\n🔧 Applying migration: ${filename}`);
    
    try {
      const migrationPath = path.join(this.migrationsDir, filename);
      const migrationSQL = await fs.readFile(migrationPath, 'utf8');
      
      // Execute the migration SQL
      await database.query(migrationSQL);
      
      this.appliedMigrations.push(filename);
      console.log(`✅ Successfully applied: ${filename}`);
      
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log(`ℹ️  Migration ${filename} already applied, skipping`);
        this.appliedMigrations.push(`${filename} (already exists)`);
      } else {
        throw new Error(`Failed to apply ${filename}: ${error.message}`);
      }
    }
  }

  /**
   * Show migration summary
   */
  showSummary() {
    console.log('\n📋 Migration Summary');
    console.log('====================');
    this.appliedMigrations.forEach(migration => {
      console.log(`   ✅ ${migration}`);
    });
    
    console.log('\n🎯 What was created:');
    console.log('   • store_users table - For store owner authentication');
    console.log('   • search_analytics table - For customer demand insights');
    console.log('   • Foreign key constraints - For data integrity');
    console.log('   • Timestamp triggers - For audit trails');
    console.log('   • Indexes - For performance optimization');
    
    console.log('\n📝 Next steps:');
    console.log('   1. Run: npm run portal:create-users');
    console.log('   2. Run: npm run test:portal');
    console.log('   3. Test Store Portal authentication');
  }
}

// Run migrations if called directly
if (require.main === module) {
  const applier = new SQLMigrationApplier();
  applier.applyMigrations()
    .then(() => {
      console.log('🎉 SQL migrations completed successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 SQL migrations failed:', error.message);
      process.exit(1);
    });
}

module.exports = { SQLMigrationApplier };
