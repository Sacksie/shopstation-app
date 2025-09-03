#!/usr/bin/env node

/**
 * Database Migration CLI Tool
 * 
 * USAGE:
 *   npm run migrate              # Run all pending migrations
 *   npm run migrate:rollback 5   # Rollback to version 5
 *   npm run migrate:create "Add product ratings"  # Create new migration
 *   npm run migrate:status       # Show migration status
 */

const { DatabaseMigrationManager } = require('../migrations/migration-manager');
const config = require('../config/environments');

class MigrationCLI {
  constructor() {
    this.migrationManager = new DatabaseMigrationManager();
  }

  async run() {
    const args = process.argv.slice(2);
    const command = args[0] || 'migrate';

    console.log('🗄️  ShopStation Database Migration Tool');
    console.log(`📍 Environment: ${config.environment}`);
    console.log('========================================\n');

    try {
      switch (command) {
        case 'migrate':
          await this.runMigrations();
          break;
        
        case 'rollback':
          const targetVersion = parseInt(args[1]);
          if (isNaN(targetVersion)) {
            console.error('❌ Please specify target version: npm run migrate:rollback <version>');
            process.exit(1);
          }
          await this.rollbackToVersion(targetVersion);
          break;
        
        case 'create':
          const migrationName = args[1];
          if (!migrationName) {
            console.error('❌ Please specify migration name: npm run migrate:create "Migration Name"');
            process.exit(1);
          }
          await this.createMigration(migrationName);
          break;
        
        case 'status':
          await this.showStatus();
          break;
        
        case 'validate':
          await this.validateDatabase();
          break;
        
        default:
          this.showHelp();
          break;
      }

      console.log('\n✅ Migration operation completed successfully');
      
    } catch (error) {
      console.error('\n💥 Migration operation failed:', error.message);
      
      // In production, suggest rollback options
      if (config.environment === 'production') {
        console.error('\n🚨 PRODUCTION FAILURE DETECTED');
        console.error('🔄 Consider running: npm run migrate:rollback <previous_version>');
        console.error('📞 Alert: Database operations team should be notified');
      }
      
      process.exit(1);
    }
  }

  async runMigrations() {
    console.log('🚀 Running database migrations...\n');
    
    // Show current status first
    const currentVersion = await this.migrationManager.getCurrentVersion();
    console.log(`📊 Current database version: ${currentVersion}`);
    
    // Run migrations
    const result = await this.migrationManager.migrate();
    
    if (result.success) {
      console.log(`\n🎉 Migration pipeline completed!`);
      console.log(`📈 Applied ${result.migrationsApplied} migrations`);
      
      if (result.migrationsApplied > 0) {
        console.log('\n📋 Applied migrations:');
        result.completedMigrations.forEach(migration => {
          console.log(`   ✅ v${migration.version}`);
        });
      }
    } else {
      console.error(`\n💥 Migration failed at version ${result.failedAtVersion}`);
      console.error(`📊 Successfully applied ${result.completedMigrations.length} migrations before failure`);
      throw new Error(result.error);
    }
  }

  async rollbackToVersion(targetVersion) {
    console.log(`⏪ Rolling back to version ${targetVersion}...\n`);
    
    const currentVersion = await this.migrationManager.getCurrentVersion();
    console.log(`📊 Current version: ${currentVersion}`);
    console.log(`📍 Target version: ${targetVersion}`);
    
    if (targetVersion >= currentVersion) {
      console.log('ℹ️  No rollback needed - target version is current or newer');
      return;
    }
    
    // Confirm rollback in production
    if (config.environment === 'production') {
      console.log('\n🚨 PRODUCTION ROLLBACK CONFIRMATION');
      console.log('⚠️  This will modify production data');
      console.log('📦 Pre-rollback backup will be created automatically');
      console.log('✅ Proceeding with rollback...\n');
    }
    
    const result = await this.migrationManager.rollbackToVersion(targetVersion);
    
    if (result.success) {
      console.log(`\n🎉 Rollback completed successfully!`);
      console.log(`📈 Applied ${result.rollbacksApplied} rollbacks`);
      
      if (result.rollbacksApplied > 0) {
        console.log('\n📋 Rolled back migrations:');
        result.completedRollbacks.forEach(rollback => {
          console.log(`   ⏪ v${rollback.version}`);
        });
      }
    } else {
      console.error(`\n💥 Rollback failed at version ${result.failedAtVersion}`);
      throw new Error(result.error);
    }
  }

  async createMigration(name) {
    console.log(`📝 Creating new migration: ${name}\n`);
    
    const migration = await this.migrationManager.createMigrationTemplate(name);
    
    console.log(`✅ Migration created successfully!`);
    console.log(`📁 File: ${migration.filename}`);
    console.log(`🔗 Path: ${migration.path}`);
    console.log(`📊 Version: ${migration.version}`);
    console.log('\n📝 Next steps:');
    console.log('   1. Edit the migration file to implement your changes');
    console.log('   2. Test the migration: npm run migrate:validate');
    console.log('   3. Apply the migration: npm run migrate');
  }

  async showStatus() {
    console.log('📊 Database Migration Status\n');
    
    const currentVersion = await this.migrationManager.getCurrentVersion();
    const availableMigrations = await this.migrationManager.getAvailableMigrations();
    const state = await this.migrationManager.getMigrationState();
    
    console.log(`📍 Current Version: ${currentVersion}`);
    console.log(`📅 Last Migration: ${state.lastMigrationDate}`);
    console.log(`🌍 Environment: ${state.environment}`);
    console.log(`📦 Backup History: ${state.backupHistory?.length || 0} backups\n`);
    
    // Show migration history
    if (state.appliedMigrations && state.appliedMigrations.length > 0) {
      console.log('📋 Applied Migrations:');
      state.appliedMigrations
        .filter(m => m.success !== false)
        .sort((a, b) => a.version - b.version)
        .forEach(migration => {
          const status = migration.action === 'rollback' ? '⏪' : '✅';
          const date = migration.appliedAt || migration.rolledBackAt;
          console.log(`   ${status} v${migration.version}: ${migration.name} (${new Date(date).toLocaleDateString()})`);
        });
      console.log('');
    }
    
    // Show pending migrations
    const pendingMigrations = availableMigrations.filter(m => m.version > currentVersion);
    if (pendingMigrations.length > 0) {
      console.log('⏳ Pending Migrations:');
      pendingMigrations.forEach(migration => {
        console.log(`   🔄 v${migration.version}: ${migration.name}`);
      });
      console.log('\n💡 Run "npm run migrate" to apply pending migrations');
    } else {
      console.log('✅ Database is up to date');
    }
  }

  async validateDatabase() {
    console.log('🔍 Validating database integrity...\n');
    
    const result = await this.migrationManager.validateDatabaseIntegrity();
    
    if (result.valid) {
      console.log('✅ Database integrity check passed');
      console.log('📊 All required structures and data are valid');
    } else {
      console.error('❌ Database integrity check failed');
      
      if (result.issues) {
        console.error('\n🚨 Issues found:');
        result.issues.forEach(issue => {
          console.error(`   - ${issue}`);
        });
      }
      
      if (result.error) {
        console.error(`\nError: ${result.error}`);
      }
      
      console.error('\n🔧 Recommended actions:');
      console.error('   1. Review database structure manually');
      console.error('   2. Create migration to fix issues');
      console.error('   3. Test in development before production');
    }
  }

  showHelp() {
    console.log('🗄️  Database Migration Commands:\n');
    console.log('📈 npm run migrate                    # Apply all pending migrations');
    console.log('⏪ npm run migrate:rollback <version> # Rollback to specific version');
    console.log('📝 npm run migrate:create "Name"      # Create new migration template');
    console.log('📊 npm run migrate:status             # Show migration status');
    console.log('🔍 npm run migrate:validate           # Validate database integrity');
    console.log('\n💡 Examples:');
    console.log('   npm run migrate:rollback 1');
    console.log('   npm run migrate:create "Add product ratings"');
  }
}

// Run CLI if called directly
if (require.main === module) {
  const cli = new MigrationCLI();
  cli.run().catch(error => {
    console.error('💥 CLI Error:', error.message);
    process.exit(1);
  });
}

module.exports = { MigrationCLI };