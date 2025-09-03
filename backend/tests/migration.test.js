/**
 * Database Migration Tests
 * 
 * BUSINESS CRITICAL: Validates that database migrations work correctly
 * and protect production data during schema changes.
 */

const { DatabaseMigrationManager } = require('../migrations/migration-manager');
const fs = require('fs').promises;
const path = require('path');

// Mock dependencies
jest.mock('../database/kosher-db', () => ({
  readDB: jest.fn(),
  writeDB: jest.fn()
}));

jest.mock('../utils/cloudBackup', () => ({
  cloudBackup: {
    createFullBackup: jest.fn(() => ({ success: true, backupId: 'test-backup-123' }))
  }
}));

jest.mock('../config/environments', () => ({
  environment: 'test'
}));

describe('Database Migration System', () => {
  let migrationManager;
  let mockDB;
  const testMigrationDir = path.join(__dirname, 'temp-migrations');

  beforeAll(async () => {
    // Create temporary migration directory for testing
    await fs.mkdir(testMigrationDir, { recursive: true });
    
    // Create test migration files
    const testMigration1 = `
      async function up(database) {
        return { ...database, testField: 'added' };
      }
      async function down(database) {
        const { testField, ...rest } = database;
        return rest;
      }
      module.exports = { up, down };
    `;
    
    await fs.writeFile(path.join(testMigrationDir, '001_test_migration.js'), testMigration1);
  });

  afterAll(async () => {
    // Clean up test files
    try {
      await fs.rmdir(testMigrationDir, { recursive: true });
    } catch (error) {
      // Directory might not exist or be empty
    }
  });

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock database
    mockDB = {
      products: {
        'test-product': {
          name: 'Test Product',
          prices: {
            'Test Store': { price: 1.99, unit: 'item' }
          }
        }
      },
      aliases: { 'test': 'test-product' }
    };
    
    const { readDB, writeDB } = require('../database/kosher-db');
    readDB.mockReturnValue(mockDB);
    writeDB.mockImplementation((data) => {
      mockDB = data;
      return true;
    });
    
    // Create migration manager with test directory
    migrationManager = new DatabaseMigrationManager();
    migrationManager.migrationsDir = testMigrationDir;
    migrationManager.migrationStateFile = path.join(testMigrationDir, 'test-state.json');
  });

  describe('Migration State Management', () => {
    test('initializes migration state correctly', async () => {
      const version = await migrationManager.getCurrentVersion();
      expect(version).toBe(0);
      
      // Check that state file was created
      const stateExists = await fs.access(migrationManager.migrationStateFile)
        .then(() => true)
        .catch(() => false);
      expect(stateExists).toBe(true);
    });

    test('tracks migration state correctly', async () => {
      await migrationManager.getCurrentVersion(); // Initialize state
      
      const state = await migrationManager.getMigrationState();
      expect(state).toHaveProperty('currentVersion', 0);
      expect(state).toHaveProperty('appliedMigrations');
      expect(state).toHaveProperty('environment', 'test');
    });
  });

  describe('Migration Discovery', () => {
    test('finds available migrations', async () => {
      const migrations = await migrationManager.getAvailableMigrations();
      
      expect(migrations).toHaveLength(1);
      expect(migrations[0]).toMatchObject({
        version: 1,
        name: 'test_migration',
        filename: '001_test_migration.js'
      });
    });

    test('sorts migrations by version', async () => {
      // Add another test migration
      const testMigration2 = `
        async function up(db) { return { ...db, field2: 'added' }; }
        async function down(db) { const { field2, ...rest } = db; return rest; }
        module.exports = { up, down };
      `;
      
      await fs.writeFile(path.join(testMigrationDir, '003_later_migration.js'), testMigration2);
      
      const migrations = await migrationManager.getAvailableMigrations();
      
      expect(migrations).toHaveLength(2);
      expect(migrations[0].version).toBe(1);
      expect(migrations[1].version).toBe(3);
    });
  });

  describe('Migration Application', () => {
    test('applies migration correctly', async () => {
      const migrations = await migrationManager.getAvailableMigrations();
      const migration = migrations[0];
      
      const result = await migrationManager.applyMigration(migration);
      
      expect(result.success).toBe(true);
      expect(result.version).toBe(1);
      
      // Check database was updated
      const { writeDB } = require('../database/kosher-db');
      expect(writeDB).toHaveBeenCalledWith(
        expect.objectContaining({
          testField: 'added'
        })
      );
    });

    test('updates migration state after applying', async () => {
      const migrations = await migrationManager.getAvailableMigrations();
      await migrationManager.applyMigration(migrations[0]);
      
      const state = await migrationManager.getMigrationState();
      expect(state.currentVersion).toBe(1);
      expect(state.appliedMigrations).toHaveLength(1);
      expect(state.appliedMigrations[0]).toMatchObject({
        version: 1,
        success: true
      });
    });

    test('handles migration errors correctly', async () => {
      // Create failing migration
      const failingMigration = `
        async function up(database) {
          throw new Error('Test migration failure');
        }
        module.exports = { up };
      `;
      
      await fs.writeFile(path.join(testMigrationDir, '002_failing_migration.js'), failingMigration);
      
      const migrations = await migrationManager.getAvailableMigrations();
      const failingMig = migrations.find(m => m.name === 'failing_migration');
      
      await expect(migrationManager.applyMigration(failingMig)).rejects.toThrow('Test migration failure');
      
      // Check that failure was logged
      const state = await migrationManager.getMigrationState();
      const failedMigration = state.appliedMigrations.find(m => m.version === 2);
      expect(failedMigration).toBeDefined();
      expect(failedMigration.success).toBe(false);
    });
  });

  describe('Migration Pipeline', () => {
    test('runs all pending migrations', async () => {
      const result = await migrationManager.migrate();
      
      expect(result.success).toBe(true);
      expect(result.migrationsApplied).toBeGreaterThan(0);
      
      const finalState = await migrationManager.getMigrationState();
      expect(finalState.currentVersion).toBeGreaterThan(0);
    });

    test('skips migrations if database is up to date', async () => {
      // Apply all migrations first
      await migrationManager.migrate();
      
      // Run again - should skip
      const result = await migrationManager.migrate();
      
      expect(result.success).toBe(true);
      expect(result.migrationsApplied).toBe(0);
    });

    test('stops pipeline on migration failure', async () => {
      // Create failing migration with high version number
      const failingMigration = `
        async function up(database) {
          throw new Error('Pipeline test failure');
        }
        module.exports = { up };
      `;
      
      await fs.writeFile(path.join(testMigrationDir, '999_pipeline_failure.js'), failingMigration);
      
      const result = await migrationManager.migrate();
      
      expect(result.success).toBe(false);
      expect(result.failedAtVersion).toBe(999);
      expect(result.completedMigrations).toBeDefined();
    });
  });

  describe('Migration Rollback', () => {
    test('rolls back migration correctly', async () => {
      // Apply migration first
      const migrations = await migrationManager.getAvailableMigrations();
      await migrationManager.applyMigration(migrations[0]);
      
      // Rollback
      const result = await migrationManager.rollbackMigration(migrations[0]);
      
      expect(result.success).toBe(true);
      
      // Check database was reverted
      const { writeDB } = require('../database/kosher-db');
      const lastCall = writeDB.mock.calls[writeDB.mock.calls.length - 1][0];
      expect(lastCall).not.toHaveProperty('testField');
    });

    test('handles rollback to specific version', async () => {
      // Apply migrations
      await migrationManager.migrate();
      const currentVersion = await migrationManager.getCurrentVersion();
      
      // Rollback to version 0
      const result = await migrationManager.rollbackToVersion(0);
      
      expect(result.success).toBe(true);
      
      const newVersion = await migrationManager.getCurrentVersion();
      expect(newVersion).toBeLessThan(currentVersion);
    });
  });

  describe('Database Validation', () => {
    test('validates correct database structure', async () => {
      const result = await migrationManager.validateDatabaseIntegrity();
      
      expect(result.valid).toBe(true);
    });

    test('identifies database structure issues', async () => {
      // Mock corrupted database
      const { readDB } = require('../database/kosher-db');
      readDB.mockReturnValue({ invalid: 'structure' });
      
      const result = await migrationManager.validateDatabaseIntegrity();
      
      expect(result.valid).toBe(false);
      expect(result.issues).toBeDefined();
      expect(result.issues.length).toBeGreaterThan(0);
    });
  });

  describe('Migration Template Creation', () => {
    test('creates migration template', async () => {
      const result = await migrationManager.createMigrationTemplate('test template creation');
      
      expect(result).toMatchObject({
        name: 'test template creation',
        filename: expect.stringMatching(/^\d+_test_template_creation\.js$/),
        version: expect.any(Number)
      });
      
      // Check file was created
      const fileExists = await fs.access(result.path)
        .then(() => true)
        .catch(() => false);
      expect(fileExists).toBe(true);
    });

    test('generates unique migration versions', async () => {
      const result1 = await migrationManager.createMigrationTemplate('first');
      await new Promise(resolve => setTimeout(resolve, 10)); // Small delay
      const result2 = await migrationManager.createMigrationTemplate('second');
      
      expect(result2.version).toBeGreaterThan(result1.version);
    });
  });

  describe('Production Safety', () => {
    test('creates backups before migrations in production', async () => {
      // Mock production environment
      const config = require('../config/environments');
      config.environment = 'production';
      
      migrationManager.backupBeforeMigration = true;
      
      const migrations = await migrationManager.getAvailableMigrations();
      await migrationManager.applyMigration(migrations[0]);
      
      const { cloudBackup } = require('../utils/cloudBackup');
      expect(cloudBackup.createFullBackup).toHaveBeenCalled();
    });

    test('validates migration state consistency', async () => {
      await migrationManager.migrate();
      
      const state = await migrationManager.getMigrationState();
      expect(state.currentVersion).toBeGreaterThanOrEqual(0);
      expect(state.appliedMigrations).toBeDefined();
      expect(state.lastMigrationDate).toBeDefined();
    });
  });
});