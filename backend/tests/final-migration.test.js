/**
 * Final Migration Validation Test
 * 
 * BUSINESS CRITICAL: Final validation that migration is ready for production
 * - Tests with cleaned production data
 * - Validates migration script components
 * - Ensures all data will be preserved
 */

const fs = require('fs').promises;
const path = require('path');

// Set test environment
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://test-url-for-validation';

describe('🎯 Final Migration Readiness Validation', () => {
  let cleanedData;
  
  beforeAll(async () => {
    // Load the cleaned production data
    const backupFiles = await fs.readdir(path.join(__dirname, '..', 'backups'));
    const latestCleanedBackup = backupFiles
      .filter(file => file.startsWith('pre-migration-cleaned-'))
      .sort()
      .pop();
    
    if (latestCleanedBackup) {
      const backupPath = path.join(__dirname, '..', 'backups', latestCleanedBackup);
      const content = await fs.readFile(backupPath, 'utf8');
      cleanedData = JSON.parse(content);
    } else {
      throw new Error('No cleaned migration data found. Run npm run prepare-migration first.');
    }
  });

  describe('🏪 Production Store Validation', () => {
    test('should have all required kosher stores', () => {
      const expectedStores = ['b-kosher', 'tapuach', 'kosher-kingdom', 'kays'];
      const actualStores = Object.keys(cleanedData.stores);
      
      expectedStores.forEach(expectedStore => {
        expect(actualStores).toContain(expectedStore);
      });
      
      expect(actualStores.length).toBe(4);
    });

    test('should have complete store information', () => {
      Object.values(cleanedData.stores).forEach(store => {
        expect(store).toHaveProperty('name');
        expect(store).toHaveProperty('location');
        expect(store).toHaveProperty('phone');
        expect(store).toHaveProperty('hours');
        expect(store).toHaveProperty('rating');
        
        expect(typeof store.name).toBe('string');
        expect(typeof store.location).toBe('string');
        expect(typeof store.phone).toBe('string');
        expect(typeof store.rating).toBe('number');
      });
    });
  });

  describe('🛍️ Production Product Validation', () => {
    test('should have valid products with prices', () => {
      const products = Object.values(cleanedData.products);
      
      expect(products.length).toBeGreaterThan(0);
      
      products.forEach(product => {
        expect(product).toHaveProperty('displayName');
        expect(product).toHaveProperty('category');
        expect(product).toHaveProperty('prices');
        
        expect(typeof product.displayName).toBe('string');
        expect(typeof product.category).toBe('string');
        expect(typeof product.prices).toBe('object');
        expect(Object.keys(product.prices).length).toBeGreaterThan(0);
      });
    });

    test('should have valid price data structure', () => {
      Object.values(cleanedData.products).forEach(product => {
        Object.entries(product.prices).forEach(([storeName, priceInfo]) => {
          expect(priceInfo).toHaveProperty('price');
          expect(priceInfo).toHaveProperty('unit');
          expect(priceInfo).toHaveProperty('lastUpdated');
          
          expect(typeof priceInfo.price).toBe('number');
          expect(priceInfo.price).toBeGreaterThan(0);
          expect(typeof priceInfo.unit).toBe('string');
          expect(priceInfo.unit.length).toBeGreaterThan(0);
        });
      });
    });

    test('should have consistent store references', () => {
      const storeNames = Object.values(cleanedData.stores).map(store => store.name);
      
      Object.values(cleanedData.products).forEach(product => {
        Object.keys(product.prices).forEach(priceStoreName => {
          expect(storeNames).toContain(priceStoreName);
        });
      });
    });
  });

  describe('🎯 Migration Impact Analysis', () => {
    test('should calculate migration statistics', () => {
      const stats = {
        storeCount: Object.keys(cleanedData.stores).length,
        productCount: Object.keys(cleanedData.products).length,
        totalPriceEntries: Object.values(cleanedData.products).reduce(
          (total, product) => total + Object.keys(product.prices).length,
          0
        ),
        avgPricesPerProduct: 0,
        storeProductMatrix: {}
      };

      stats.avgPricesPerProduct = stats.totalPriceEntries / stats.productCount;

      // Calculate store coverage
      Object.values(cleanedData.products).forEach(product => {
        Object.keys(product.prices).forEach(storeName => {
          if (!stats.storeProductMatrix[storeName]) {
            stats.storeProductMatrix[storeName] = 0;
          }
          stats.storeProductMatrix[storeName]++;
        });
      });

      console.log('📊 Migration Impact Analysis:');
      console.log(`   Stores to migrate: ${stats.storeCount}`);
      console.log(`   Products to migrate: ${stats.productCount}`);
      console.log(`   Price entries to migrate: ${stats.totalPriceEntries}`);
      console.log(`   Average prices per product: ${stats.avgPricesPerProduct.toFixed(1)}`);
      console.log('   Store coverage:');
      Object.entries(stats.storeProductMatrix).forEach(([store, count]) => {
        console.log(`     ${store}: ${count} products`);
      });

      expect(stats.storeCount).toBe(4);
      expect(stats.productCount).toBeGreaterThan(0);
      expect(stats.totalPriceEntries).toBeGreaterThan(0);
      expect(stats.avgPricesPerProduct).toBeGreaterThan(1); // Each product should have multiple store prices
    });

    test('should identify business value preservation', () => {
      const businessValue = {
        kosherStoresPreserved: 0,
        productVariety: new Set(),
        priceCompetitiveness: []
      };

      // Count kosher stores
      Object.values(cleanedData.stores).forEach(store => {
        if (store.name.includes('Kosher') || store.name.includes('kosher')) {
          businessValue.kosherStoresPreserved++;
        }
      });

      // Analyze product variety
      Object.values(cleanedData.products).forEach(product => {
        businessValue.productVariety.add(product.category);
      });

      // Analyze price competitiveness
      Object.values(cleanedData.products).forEach(product => {
        const prices = Object.values(product.prices).map(p => p.price);
        if (prices.length > 1) {
          const minPrice = Math.min(...prices);
          const maxPrice = Math.max(...prices);
          const priceDifference = ((maxPrice - minPrice) / minPrice) * 100;
          businessValue.priceCompetitiveness.push(priceDifference);
        }
      });

      console.log('💼 Business Value Analysis:');
      console.log(`   Kosher stores preserved: ${businessValue.kosherStoresPreserved}`);
      console.log(`   Product categories: ${Array.from(businessValue.productVariety).join(', ')}`);
      console.log(`   Average price difference across stores: ${
        businessValue.priceCompetitiveness.length > 0 
          ? (businessValue.priceCompetitiveness.reduce((a, b) => a + b, 0) / businessValue.priceCompetitiveness.length).toFixed(1)
          : 0
      }%`);

      expect(businessValue.kosherStoresPreserved).toBeGreaterThan(0);
      expect(businessValue.productVariety.size).toBeGreaterThan(1);
    });
  });

  describe('🚀 Migration Script Readiness', () => {
    test('should have all required migration files', async () => {
      const requiredFiles = [
        'scripts/migrate-to-postgres.js',
        'database/db-setup.sql',
        'database/db-connection.js',
        'database/db-operations.js'
      ];

      for (const file of requiredFiles) {
        const filePath = path.join(__dirname, '..', file);
        await expect(fs.access(filePath)).resolves.toBeUndefined();
      }
    });

    test('should have npm scripts configured', async () => {
      const packageJsonPath = path.join(__dirname, '..', 'package.json');
      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));

      expect(packageJson.scripts).toHaveProperty('migrate:postgres');
      expect(packageJson.scripts).toHaveProperty('prepare-migration');
    });

    test('should validate database schema compatibility', async () => {
      const schemaPath = path.join(__dirname, '..', 'database', 'db-setup.sql');
      const schema = await fs.readFile(schemaPath, 'utf8');

      // Check that schema includes all required tables
      const requiredTables = ['stores', 'products', 'categories', 'store_products', 'product_requests'];
      
      requiredTables.forEach(table => {
        expect(schema).toMatch(new RegExp(`CREATE TABLE ${table}`, 'i'));
      });

      // Check that initial stores are included
      expect(schema).toContain('B Kosher');
      expect(schema).toContain('Tapuach');
      expect(schema).toContain('Kosher Kingdom');
      expect(schema).toContain('Kays');

      // Check that categories are defined
      expect(schema).toContain('dairy');
      expect(schema).toContain('bakery');
      expect(schema).toContain('pantry');
    });
  });

  describe('✅ Final Migration Approval', () => {
    test('should confirm migration is ready for production', () => {
      const migrationReadiness = {
        dataClean: cleanedData && Object.keys(cleanedData.stores).length > 0,
        pricesValid: Object.values(cleanedData.products).every(product => 
          Object.keys(product.prices).length > 0
        ),
        storeReferencesValid: true, // Validated in previous tests
        businessValuePreserved: Object.keys(cleanedData.stores).length === 4,
        noTestData: !JSON.stringify(cleanedData).toLowerCase().includes('test')
      };

      console.log('🎯 FINAL MIGRATION READINESS CHECKLIST:');
      console.log(`   ✅ Data cleaned and validated: ${migrationReadiness.dataClean}`);
      console.log(`   ✅ All prices valid: ${migrationReadiness.pricesValid}`);
      console.log(`   ✅ Store references valid: ${migrationReadiness.storeReferencesValid}`);
      console.log(`   ✅ Business value preserved: ${migrationReadiness.businessValuePreserved}`);
      console.log(`   ✅ No test data remaining: ${migrationReadiness.noTestData}`);

      const allChecksPass = Object.values(migrationReadiness).every(check => check === true);

      expect(allChecksPass).toBe(true);

      if (allChecksPass) {
        console.log('\n🎉 MIGRATION IS READY FOR PRODUCTION!');
        console.log('🚀 Next step: Set up PostgreSQL in Railway and run npm run migrate:postgres');
      }
    });
  });
});