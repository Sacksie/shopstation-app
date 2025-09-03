/**
 * Database Migration Manager
 * 
 * BUSINESS CRITICAL: Ensures safe database schema changes without data loss
 * - Manages schema versioning and migrations
 * - Provides rollback capabilities for failed deployments
 * - Prevents production data corruption
 * - Maintains business continuity during updates
 */

const fs = require('fs').promises;
const path = require('path');
const { readDB, writeDB } = require('../database/kosher-db');
const { cloudBackup } = require('../utils/cloudBackup');
const config = require('../config/environments');

class DatabaseMigrationManager {
  constructor() {
    this.migrationsDir = path.join(__dirname, 'scripts');
    this.migrationStateFile = path.join(__dirname, '..', 'database', 'migration-state.json');
    this.backupBeforeMigration = config.environment === 'production';
  }

  /**
   * Get current database schema version
   */
  async getCurrentVersion() {
    try {
      const stateData = await fs.readFile(this.migrationStateFile, 'utf8');
      const state = JSON.parse(stateData);
      return state.currentVersion || 0;
    } catch (error) {
      // First time - create initial state
      await this.initializeMigrationState();
      return 0;
    }
  }

  /**
   * Initialize migration tracking
   */
  async initializeMigrationState() {
    const initialState = {
      currentVersion: 0,
      appliedMigrations: [],
      lastMigrationDate: new Date().toISOString(),
      environment: config.environment,
      backupHistory: []
    };

    await fs.writeFile(this.migrationStateFile, JSON.stringify(initialState, null, 2));
    console.log('✅ Migration state initialized');
  }

  /**
   * Get all available migration scripts
   */
  async getAvailableMigrations() {
    try {
      const files = await fs.readdir(this.migrationsDir);
      const migrations = files
        .filter(file => file.endsWith('.js'))
        .map(file => {
          const match = file.match(/^(\d+)_(.+)\.js$/);
          if (!match) return null;
          return {
            version: parseInt(match[1]),
            name: match[2],
            filename: file,
            path: path.join(this.migrationsDir, file)
          };
        })
        .filter(Boolean)
        .sort((a, b) => a.version - b.version);

      return migrations;
    } catch (error) {
      console.error('Error reading migrations directory:', error);
      return [];
    }
  }

  /**
   * Create pre-migration backup
   */
  async createMigrationBackup(version, migrationName) {
    if (!this.backupBeforeMigration) {
      console.log('ℹ️  Skipping backup in non-production environment');
      return { success: true, skipReason: 'non-production' };
    }

    console.log(`📦 Creating pre-migration backup for v${version}...`);
    const backupResult = await cloudBackup.createFullBackup(`migration-v${version}-${migrationName}`);
    
    if (backupResult.success) {
      console.log(`✅ Pre-migration backup created: ${backupResult.backupId}`);
      
      // Update migration state with backup info
      const state = await this.getMigrationState();
      state.backupHistory.push({
        backupId: backupResult.backupId,
        version,
        migrationName,
        timestamp: new Date().toISOString()
      });
      await this.saveMigrationState(state);
    } else {
      console.error('❌ Failed to create pre-migration backup');
      throw new Error('Migration aborted: Backup failed');
    }

    return backupResult;
  }

  /**
   * Apply a single migration
   */
  async applyMigration(migration) {
    console.log(`🔧 Applying migration v${migration.version}: ${migration.name}`);

    try {
      // Load migration script
      delete require.cache[migration.path]; // Clear cache
      const migrationScript = require(migration.path);

      if (!migrationScript.up || typeof migrationScript.up !== 'function') {
        throw new Error(`Migration ${migration.filename} missing 'up' function`);
      }

      // Get current database state
      const currentDB = readDB();
      
      // Apply migration
      const result = await migrationScript.up(currentDB);
      
      // Save updated database
      if (result && typeof result === 'object') {
        writeDB(result);
        console.log(`✅ Migration v${migration.version} applied successfully`);
      } else {
        throw new Error('Migration did not return updated database object');
      }

      // Update migration state
      const state = await this.getMigrationState();
      state.currentVersion = migration.version;
      state.appliedMigrations.push({
        version: migration.version,
        name: migration.name,
        appliedAt: new Date().toISOString(),
        success: true
      });
      state.lastMigrationDate = new Date().toISOString();
      await this.saveMigrationState(state);

      return { success: true, version: migration.version };

    } catch (error) {
      console.error(`❌ Migration v${migration.version} failed:`, error.message);
      
      // Log failed migration
      const state = await this.getMigrationState();
      state.appliedMigrations.push({
        version: migration.version,
        name: migration.name,
        appliedAt: new Date().toISOString(),
        success: false,
        error: error.message
      });
      await this.saveMigrationState(state);

      throw error;
    }
  }

  /**
   * Rollback a migration
   */
  async rollbackMigration(migration) {
    console.log(`⏪ Rolling back migration v${migration.version}: ${migration.name}`);

    try {
      // Load migration script
      const migrationScript = require(migration.path);

      if (!migrationScript.down || typeof migrationScript.down !== 'function') {
        console.warn(`⚠️  Migration ${migration.filename} has no 'down' function - cannot rollback`);
        return { success: false, reason: 'no-rollback-function' };
      }

      // Get current database state
      const currentDB = readDB();
      
      // Apply rollback
      const result = await migrationScript.down(currentDB);
      
      // Save rolled back database
      if (result && typeof result === 'object') {
        writeDB(result);
        console.log(`✅ Migration v${migration.version} rolled back successfully`);
      } else {
        throw new Error('Rollback did not return updated database object');
      }

      // Update migration state
      const state = await this.getMigrationState();
      state.currentVersion = migration.version - 1;
      state.appliedMigrations.push({
        version: migration.version,
        name: migration.name,
        rolledBackAt: new Date().toISOString(),
        action: 'rollback',
        success: true
      });
      await this.saveMigrationState(state);

      return { success: true, version: migration.version };

    } catch (error) {
      console.error(`❌ Rollback of v${migration.version} failed:`, error.message);
      throw error;
    }
  }

  /**
   * Run all pending migrations
   */
  async migrate() {
    console.log('🚀 Starting database migration process...');

    const currentVersion = await this.getCurrentVersion();
    const availableMigrations = await this.getAvailableMigrations();
    
    const pendingMigrations = availableMigrations.filter(
      migration => migration.version > currentVersion
    );

    if (pendingMigrations.length === 0) {
      console.log('✅ Database is up to date - no migrations needed');
      return { success: true, migrationsApplied: 0 };
    }

    console.log(`📋 Found ${pendingMigrations.length} pending migrations:`);
    pendingMigrations.forEach(migration => {
      console.log(`   v${migration.version}: ${migration.name}`);
    });

    const results = [];

    for (const migration of pendingMigrations) {
      try {
        // Create backup before migration (production only)
        await this.createMigrationBackup(migration.version, migration.name);

        // Apply migration
        const result = await this.applyMigration(migration);
        results.push(result);

      } catch (error) {
        console.error(`💥 Migration pipeline failed at v${migration.version}`);
        console.error('🔄 Consider running rollback if needed');
        
        return {
          success: false,
          error: error.message,
          failedAtVersion: migration.version,
          completedMigrations: results
        };
      }
    }

    console.log(`🎉 Migration pipeline completed successfully!`);
    console.log(`📊 Applied ${results.length} migrations`);
    
    return {
      success: true,
      migrationsApplied: results.length,
      completedMigrations: results
    };
  }

  /**
   * Rollback to specific version
   */
  async rollbackToVersion(targetVersion) {
    console.log(`⏪ Rolling back database to version ${targetVersion}...`);

    const currentVersion = await this.getCurrentVersion();
    
    if (targetVersion >= currentVersion) {
      console.log('ℹ️  Target version is current or newer - no rollback needed');
      return { success: true, rollbacksApplied: 0 };
    }

    const availableMigrations = await this.getAvailableMigrations();
    const migrationsToRollback = availableMigrations
      .filter(migration => migration.version > targetVersion && migration.version <= currentVersion)
      .sort((a, b) => b.version - a.version); // Rollback in reverse order

    if (migrationsToRollback.length === 0) {
      console.log('ℹ️  No migrations to rollback');
      return { success: true, rollbacksApplied: 0 };
    }

    // Create backup before rollback
    if (this.backupBeforeMigration) {
      await cloudBackup.createFullBackup(`rollback-to-v${targetVersion}`);
    }

    const results = [];

    for (const migration of migrationsToRollback) {
      try {
        const result = await this.rollbackMigration(migration);
        if (result.success) {
          results.push(result);
        }
      } catch (error) {
        console.error(`💥 Rollback failed at v${migration.version}`);
        
        return {
          success: false,
          error: error.message,
          failedAtVersion: migration.version,
          completedRollbacks: results
        };
      }
    }

    console.log(`🎉 Rollback completed successfully to version ${targetVersion}!`);
    
    return {
      success: true,
      rollbacksApplied: results.length,
      completedRollbacks: results
    };
  }

  /**
   * Get migration state
   */
  async getMigrationState() {
    try {
      const stateData = await fs.readFile(this.migrationStateFile, 'utf8');
      return JSON.parse(stateData);
    } catch (error) {
      await this.initializeMigrationState();
      return await this.getMigrationState();
    }
  }

  /**
   * Save migration state
   */
  async saveMigrationState(state) {
    await fs.writeFile(this.migrationStateFile, JSON.stringify(state, null, 2));
  }

  /**
   * Generate new migration template
   */
  async createMigrationTemplate(name) {
    const version = Date.now(); // Use timestamp as version
    const filename = `${version}_${name.replace(/\s+/g, '_').toLowerCase()}.js`;
    const filepath = path.join(this.migrationsDir, filename);

    const template = `/**
 * Migration: ${name}
 * Version: ${version}
 * Created: ${new Date().toISOString()}
 */

/**
 * Apply this migration
 * @param {Object} database - Current database state
 * @returns {Object} - Updated database state
 */
async function up(database) {
  console.log('Applying migration: ${name}');
  
  // Example: Add new field to all products
  // const updatedProducts = {};
  // Object.entries(database.products || {}).forEach(([key, product]) => {
  //   updatedProducts[key] = {
  //     ...product,
  //     newField: 'defaultValue'
  //   };
  // });
  
  return {
    ...database,
    // products: updatedProducts,
    // Add your changes here
  };
}

/**
 * Rollback this migration
 * @param {Object} database - Current database state  
 * @returns {Object} - Rolled back database state
 */
async function down(database) {
  console.log('Rolling back migration: ${name}');
  
  // Reverse the changes made in up()
  // const updatedProducts = {};
  // Object.entries(database.products || {}).forEach(([key, product]) => {
  //   const { newField, ...productWithoutNewField } = product;
  //   updatedProducts[key] = productWithoutNewField;
  // });
  
  return {
    ...database,
    // products: updatedProducts,
    // Reverse your changes here
  };
}

module.exports = { up, down };
`;

    await fs.writeFile(filepath, template);
    console.log(`✅ Migration template created: ${filename}`);
    
    return {
      version,
      name,
      filename,
      path: filepath
    };
  }

  /**
   * Validate database integrity
   */
  async validateDatabaseIntegrity() {
    console.log('🔍 Validating database integrity...');

    try {
      const database = readDB();
      const issues = [];

      // Check required structures
      if (!database.products) {
        issues.push('Missing products object');
      }

      if (!database.aliases) {
        issues.push('Missing aliases object');
      }

      // Validate product structure
      if (database.products) {
        Object.entries(database.products).forEach(([key, product]) => {
          if (!product.name) {
            issues.push(`Product ${key} missing name`);
          }
          
          if (!product.prices || typeof product.prices !== 'object') {
            issues.push(`Product ${key} has invalid prices structure`);
          }
        });
      }

      if (issues.length === 0) {
        console.log('✅ Database integrity check passed');
        return { valid: true };
      } else {
        console.warn('⚠️  Database integrity issues found:');
        issues.forEach(issue => console.warn(`   - ${issue}`));
        return { valid: false, issues };
      }

    } catch (error) {
      console.error('❌ Database integrity check failed:', error.message);
      return { valid: false, error: error.message };
    }
  }
}

module.exports = { DatabaseMigrationManager };