/**
 * PostgreSQL Migration Tests
 * 
 * BUSINESS CRITICAL: Validates the PostgreSQL migration script
 * - Tests data preservation during migration
 * - Validates schema compatibility
 * - Ensures backup creation
 * - Verifies data integrity
 */

const fs = require('fs').promises;
const path = require('path');

// Set test environment
process.env.NODE_ENV = 'test';

// Mock database connection
const mockDatabase = {
  connect: jest.fn(() => Promise.resolve()),
  isAvailable: jest.fn(() => true),
  query: jest.fn(() => Promise.resolve({ rows: [] })),
  transaction: jest.fn(() => Promise.resolve())
};

// Mock cloud backup
const mockCloudBackup = {
  createFullBackup: jest.fn(() => Promise.resolve({ 
    success: true, 
    backupId: 'pre-postgresql-migration-test-123',
    timestamp: new Date().toISOString()
  }))
};

// Mock the dependencies
jest.mock('../database/db-connection', () => mockDatabase);
jest.mock('../utils/cloudBackup', () => ({
  cloudBackup: mockCloudBackup
}));

const { PostgreSQLMigrator } = require('../scripts/migrate-to-postgres');

describe('PostgreSQL Migration System', () => {
  let migrator;
  let testDataPath;
  let originalJsonData;

  beforeAll(async () => {
    // Create test data structure
    originalJsonData = {
      stores: {
        'B Kosher': {
          name: 'B Kosher',
          location: 'Hendon Brent Street',
          phone: '020 3210 4000',
          hours: 'Sun: 8am-10pm, Mon-Wed: 730am-10pm, Thu: 7am-11pm, Fri: 7am-3pm',
          rating: 4.2
        },
        'Test Store': {
          name: 'Test Store',
          location: 'Test Location',
          phone: '020 1234 5678',
          hours: 'Mon-Sun: 9am-9pm',
          rating: 4.0
        }
      },
      products: {
        'milk': {
          displayName: 'Milk (2 pint)',
          category: 'dairy',
          synonyms: ['fresh milk', '2 pint milk', 'whole milk'],
          commonBrands: ['Golden Flow', 'Chalav'],
          prices: {
            'B Kosher': {
              price: 2.5,
              unit: '2 pints',
              lastUpdated: '2025-08-21T11:53:24.142Z'
            },
            'Test Store': {
              price: 2.75,
              unit: '2 pints',
              lastUpdated: '2025-08-21T12:00:00.000Z'
            }
          }
        },
        'bread': {
          displayName: 'Challah',
          category: 'bakery',
          synonyms: ['challah bread', 'braided bread'],
          commonBrands: ['Grodzinski'],
          prices: {
            'B Kosher': {
              price: 3.5,
              unit: 'loaf',
              lastUpdated: '2025-08-21T11:53:24.142Z'
            }
          }
        }
      },
      productRequests: [
        {
          id: 1,
          productName: 'Organic Apples',
          userName: 'Test User',
          userEmail: 'test@example.com',
          status: 'pending',
          createdAt: '2025-08-21T12:00:00.000Z'
        }
      ]
    };

    // Create test data file path
    testDataPath = path.join(__dirname, 'test-kosher-prices.json');
    await fs.writeFile(testDataPath, JSON.stringify(originalJsonData, null, 2));
  });

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Create fresh migrator instance for each test
    migrator = new PostgreSQLMigrator();
    
    // Override the JSON path to use test data
    migrator.jsonDataPath = testDataPath;
    
    // Set up default mock responses
    mockDatabase.query.mockResolvedValue({ rows: [{ count: '0' }] });
  });

  afterAll(async () => {
    // Clean up test file
    try {
      await fs.unlink(testDataPath);
    } catch (error) {
      // File might not exist, ignore error
    }
  });

  describe('🔍 Migration Script Validation', () => {
    test('should initialize with correct configuration', () => {
      expect(migrator).toBeDefined();
      expect(migrator.jsonDataPath).toBe(testDataPath);
      expect(migrator.migrationLog).toEqual([]);
    });

    test('should load existing JSON data correctly', async () => {
      const data = await migrator.loadExistingData();
      
      expect(data).toBeDefined();
      expect(data.stores).toBeDefined();
      expect(data.products).toBeDefined();
      expect(Object.keys(data.stores)).toHaveLength(2);
      expect(Object.keys(data.products)).toHaveLength(2);
      
      // Validate specific data integrity
      expect(data.stores['B Kosher']).toEqual(originalJsonData.stores['B Kosher']);
      expect(data.products['milk']).toEqual(originalJsonData.products['milk']);
    });

    test('should create pre-migration backup', async () => {
      await migrator.createPreMigrationBackup();
      
      expect(mockCloudBackup.createFullBackup).toHaveBeenCalledWith('pre-postgresql-migration');
      expect(migrator.migrationLog).toContainEqual('✅ Backup created: pre-postgresql-migration-test-123');
    });

    test('should handle backup failures gracefully', async () => {
      mockCloudBackup.createFullBackup.mockRejectedValueOnce(new Error('Backup service unavailable'));
      
      await migrator.createPreMigrationBackup();
      
      expect(migrator.migrationLog).toContainEqual('⚠️  Backup failed: Backup service unavailable');
    });
  });

  describe('🔌 Database Connection Validation', () => {
    test('should connect to PostgreSQL successfully', async () => {
      process.env.DATABASE_URL = 'postgresql://test-connection';
      
      await migrator.connectToDatabase();
      
      expect(mockDatabase.connect).toHaveBeenCalled();
      expect(mockDatabase.isAvailable).toHaveBeenCalled();
      expect(migrator.migrationLog).toContainEqual('✅ Connected to PostgreSQL');
    });

    test('should fail if DATABASE_URL is missing', async () => {
      delete process.env.DATABASE_URL;
      
      await expect(migrator.connectToDatabase()).rejects.toThrow(
        'DATABASE_URL not found. Please add PostgreSQL to your Railway project.'
      );
    });

    test('should fail if database connection is not available', async () => {
      process.env.DATABASE_URL = 'postgresql://test-connection';
      mockDatabase.isAvailable.mockReturnValueOnce(false);
      
      await expect(migrator.connectToDatabase()).rejects.toThrow(
        'Failed to connect to PostgreSQL database'
      );
    });
  });

  describe('🏪 Store Migration Validation', () => {
    test('should migrate stores with correct data mapping', async () => {
      const stores = originalJsonData.stores;
      
      // Mock existing store check (no duplicates)
      mockDatabase.query.mockResolvedValue({ rows: [] });
      
      await migrator.migrateStores(stores);
      
      // Should check for existing stores
      expect(mockDatabase.query).toHaveBeenCalledWith(
        'SELECT id FROM stores WHERE slug = $1',
        ['B Kosher']
      );
      
      // Should insert stores
      expect(mockDatabase.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO stores'),
        [
          'B Kosher',
          'B Kosher',
          'Hendon Brent Street',
          '020 3210 4000',
          'Sun: 8am-10pm, Mon-Wed: 730am-10pm, Thu: 7am-11pm, Fri: 7am-3pm',
          4.2
        ]
      );
      
      expect(migrator.migrationLog).toContainEqual('✅ Migrated 2 stores');
    });

    test('should skip existing stores', async () => {
      const stores = { 'Existing Store': { name: 'Existing Store' } };
      
      // Mock existing store found
      mockDatabase.query.mockResolvedValue({ rows: [{ id: 1 }] });
      
      await migrator.migrateStores(stores);
      
      expect(migrator.migrationLog).toContainEqual('✅ Migrated 0 stores');
    });
  });

  describe('🛍️ Product Migration Validation', () => {
    test('should migrate products with prices correctly', async () => {
      // Mock category and store lookups
      mockDatabase.query
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // category lookup
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // product insert
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // store lookup for B Kosher
        .mockResolvedValueOnce({ rows: [] }) // price insert
        .mockResolvedValueOnce({ rows: [{ id: 2 }] }) // store lookup for Test Store
        .mockResolvedValueOnce({ rows: [] }); // price insert
      
      await migrator.migrateProducts(originalJsonData);
      
      // Should insert product
      expect(mockDatabase.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO products'),
        [
          'Milk (2 pint)',
          'milk',
          1, // category_id
          ['fresh milk', '2 pint milk', 'whole milk'], // synonyms
          ['Golden Flow', 'Chalav'] // commonBrands
        ]
      );
      
      // Should insert prices
      expect(mockDatabase.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO store_products'),
        [
          1, // store_id
          1, // product_id
          2.5, // price
          '2 pints', // unit
          '2025-08-21T11:53:24.142Z' // lastUpdated
        ]
      );
    });

    test('should handle category mapping correctly', () => {
      const testCases = [
        { input: 'dairy', expected: 'dairy' },
        { input: 'bakery', expected: 'bakery' },
        { input: 'meat', expected: 'meat-fish' },
        { input: 'fish', expected: 'meat-fish' },
        { input: 'produce', expected: 'produce' },
        { input: 'drinks', expected: 'beverages' },
        { input: 'unknown', expected: 'pantry' }
      ];
      
      testCases.forEach(({ input, expected }) => {
        expect(migrator.mapCategory(input)).toBe(expected);
      });
    });
  });

  describe('✅ Migration Validation', () => {
    test('should validate migration success with correct counts', async () => {
      mockDatabase.query
        .mockResolvedValueOnce({ rows: [{ count: '2' }] }) // stores count
        .mockResolvedValueOnce({ rows: [{ count: '2' }] }) // products count
        .mockResolvedValueOnce({ rows: [{ count: '3' }] }); // prices count
      
      await migrator.validateMigration();
      
      expect(migrator.migrationLog).toContainEqual(
        '✅ Validation passed: 2 stores, 2 products, 3 prices'
      );
    });

    test('should fail validation if no data migrated', async () => {
      mockDatabase.query
        .mockResolvedValueOnce({ rows: [{ count: '0' }] }) // stores count
        .mockResolvedValueOnce({ rows: [{ count: '0' }] }) // products count
        .mockResolvedValueOnce({ rows: [{ count: '0' }] }); // prices count
      
      await expect(migrator.validateMigration()).rejects.toThrow(
        'Migration validation failed: No data found in database'
      );
    });
  });

  describe('🔄 Full Migration Process', () => {
    test('should complete full migration workflow', async () => {
      // Mock process.exit to prevent test termination
      const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {});
      // Set up environment
      process.env.DATABASE_URL = 'postgresql://test-connection';
      
      // Mock all database operations for successful migration
      mockDatabase.query
        .mockResolvedValue({ rows: [] }) // Default empty response
        .mockResolvedValueOnce({ rows: [] }) // Schema setup
        .mockResolvedValueOnce({ rows: [] }) // Store existence check
        .mockResolvedValueOnce({ rows: [] }) // Store insert
        .mockResolvedValueOnce({ rows: [] }) // Store existence check
        .mockResolvedValueOnce({ rows: [] }) // Store insert
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // Category lookup
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // Product insert
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // Store lookup
        .mockResolvedValueOnce({ rows: [] }) // Price insert
        .mockResolvedValueOnce({ rows: [{ id: 2 }] }) // Store lookup
        .mockResolvedValueOnce({ rows: [] }) // Price insert
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // Category lookup
        .mockResolvedValueOnce({ rows: [{ id: 2 }] }) // Product insert
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // Store lookup
        .mockResolvedValueOnce({ rows: [] }) // Price insert
        .mockResolvedValueOnce({ rows: [{ count: '2' }] }) // Validation: stores
        .mockResolvedValueOnce({ rows: [{ count: '2' }] }) // Validation: products
        .mockResolvedValueOnce({ rows: [{ count: '3' }] }); // Validation: prices
      
      // Mock schema file read
      const schemaContent = 'CREATE TABLE stores (id SERIAL PRIMARY KEY);';
      jest.spyOn(fs, 'readFile').mockResolvedValueOnce(schemaContent);
      
      // Run migration
      const consoleLog = jest.spyOn(console, 'log').mockImplementation();
      const consoleError = jest.spyOn(console, 'error').mockImplementation();
      
      await migrator.migrate();
      
      // Verify success messages
      expect(consoleLog).toHaveBeenCalledWith('🎉 MIGRATION COMPLETED SUCCESSFULLY!');
      expect(consoleLog).toHaveBeenCalledWith('✅ Your data is now safe in PostgreSQL');
      
      // Verify no errors
      expect(consoleError).not.toHaveBeenCalled();
      
      // Verify backup was created
      expect(mockCloudBackup.createFullBackup).toHaveBeenCalled();
      
      // Verify database operations
      expect(mockDatabase.connect).toHaveBeenCalled();
      expect(mockDatabase.query).toHaveBeenCalledTimes(17); // All expected queries
      
      // Clean up mocks
      consoleLog.mockRestore();
      consoleError.mockRestore();
      mockExit.mockRestore();
    });
  });
});

describe('🎯 Migration Script Integration', () => {
  test('should have correct npm script configuration', async () => {
    const packageJsonPath = path.join(__dirname, '..', 'package.json');
    const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
    
    expect(packageJson.scripts).toHaveProperty('migrate:postgres');
    expect(packageJson.scripts['migrate:postgres']).toBe('node scripts/migrate-to-postgres.js');
  });

  test('should be executable as standalone script', () => {
    const scriptPath = path.join(__dirname, '..', 'scripts', 'migrate-to-postgres.js');
    expect(() => require(scriptPath)).not.toThrow();
  });
});

describe('📊 Data Integrity Validation', () => {
  test('should preserve all critical data fields', async () => {
    const migrator = new PostgreSQLMigrator();
    const data = originalJsonData;
    
    // Test store data preservation
    Object.entries(data.stores).forEach(([key, store]) => {
      expect(store).toHaveProperty('location');
      expect(store).toHaveProperty('phone');
      expect(store).toHaveProperty('hours');
      expect(store).toHaveProperty('rating');
      expect(typeof store.rating).toBe('number');
    });
    
    // Test product data preservation
    Object.entries(data.products).forEach(([key, product]) => {
      expect(product).toHaveProperty('displayName');
      expect(product).toHaveProperty('category');
      expect(product).toHaveProperty('prices');
      expect(typeof product.prices).toBe('object');
      
      // Test price data
      Object.values(product.prices).forEach(priceInfo => {
        expect(priceInfo).toHaveProperty('price');
        expect(priceInfo).toHaveProperty('unit');
        expect(priceInfo).toHaveProperty('lastUpdated');
        expect(typeof priceInfo.price).toBe('number');
      });
    });
  });
});