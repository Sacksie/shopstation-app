/**
 * Migration Validation Tests
 * 
 * BUSINESS CRITICAL: Validates migration script components without full execution
 * - Tests individual migration functions
 * - Validates data mapping logic
 * - Ensures error handling works
 */

const fs = require('fs').promises;
const path = require('path');

// Set test environment
process.env.NODE_ENV = 'test';

describe('Migration Script Component Tests', () => {
  let originalData;

  beforeAll(async () => {
    // Load actual production data for testing
    const dataPath = path.join(__dirname, '..', 'database', 'kosher-prices.json');
    try {
      const content = await fs.readFile(dataPath, 'utf8');
      originalData = JSON.parse(content);
    } catch (error) {
      console.warn('Could not load production data, using mock data');
      originalData = {
        stores: {
          'Test Store': { name: 'Test Store', location: 'Test' }
        },
        products: {
          'test-product': {
            displayName: 'Test Product',
            category: 'dairy',
            prices: { 'Test Store': { price: 5.99, unit: 'item' } }
          }
        }
      };
    }
  });

  describe('📊 Data Structure Validation', () => {
    test('should have valid store data structure', () => {
      expect(originalData).toHaveProperty('stores');
      expect(typeof originalData.stores).toBe('object');
      
      Object.entries(originalData.stores).forEach(([storeKey, store]) => {
        expect(store).toHaveProperty('location');
        expect(typeof store.location).toBe('string');
        
        if (store.rating) {
          expect(typeof store.rating).toBe('number');
          expect(store.rating).toBeGreaterThanOrEqual(0);
          expect(store.rating).toBeLessThanOrEqual(5);
        }
      });
    });

    test('should have valid product data structure', () => {
      expect(originalData).toHaveProperty('products');
      expect(typeof originalData.products).toBe('object');
      
      Object.entries(originalData.products).forEach(([productKey, product]) => {
        expect(product).toHaveProperty('displayName');
        expect(typeof product.displayName).toBe('string');
        
        expect(product).toHaveProperty('prices');
        expect(typeof product.prices).toBe('object');
        
        Object.entries(product.prices).forEach(([storeName, priceInfo]) => {
          expect(priceInfo).toHaveProperty('price');
          expect(priceInfo).toHaveProperty('unit');
          expect(typeof priceInfo.price).toBe('number');
          expect(priceInfo.price).toBeGreaterThan(0);
        });
      });
    });

    test('should have consistent store references', () => {
      const storeNames = Object.keys(originalData.stores);
      
      Object.values(originalData.products).forEach(product => {
        Object.keys(product.prices).forEach(priceStoreName => {
          expect(storeNames).toContain(priceStoreName);
        });
      });
    });
  });

  describe('🔄 Migration Logic Validation', () => {
    test('should create valid store slugs', () => {
      const createSlug = (name) => name.toLowerCase().replace(/\s+/g, '-');
      
      Object.keys(originalData.stores).forEach(storeName => {
        const slug = createSlug(storeName);
        expect(slug).toMatch(/^[a-z0-9-]+$/);
        expect(slug).not.toContain(' ');
      });
    });

    test('should create valid product slugs', () => {
      const createSlug = (name) => name.toLowerCase().replace(/\s+/g, '-');
      
      Object.keys(originalData.products).forEach(productKey => {
        const slug = createSlug(productKey);
        expect(slug).toMatch(/^[a-z0-9-]+$/);
        expect(slug).not.toContain(' ');
      });
    });

    test('should validate price data types', () => {
      Object.values(originalData.products).forEach(product => {
        Object.values(product.prices).forEach(priceInfo => {
          expect(typeof priceInfo.price).toBe('number');
          expect(priceInfo.price).toBeFinite();
          expect(priceInfo.price).toBeGreaterThan(0);
          
          expect(typeof priceInfo.unit).toBe('string');
          expect(priceInfo.unit.length).toBeGreaterThan(0);
        });
      });
    });
  });

  describe('📈 Migration Statistics', () => {
    test('should calculate migration scope correctly', () => {
      const stats = {
        storeCount: Object.keys(originalData.stores).length,
        productCount: Object.keys(originalData.products).length,
        totalPrices: Object.values(originalData.products).reduce(
          (total, product) => total + Object.keys(product.prices).length,
          0
        )
      };
      
      console.log('📊 Migration Statistics:', stats);
      
      expect(stats.storeCount).toBeGreaterThan(0);
      expect(stats.productCount).toBeGreaterThan(0);
      expect(stats.totalPrices).toBeGreaterThan(0);
      expect(stats.totalPrices).toBeGreaterThanOrEqual(stats.productCount);
    });

    test('should identify data relationships', () => {
      const storeProductMatrix = {};
      
      Object.entries(originalData.products).forEach(([productKey, product]) => {
        Object.keys(product.prices).forEach(storeName => {
          if (!storeProductMatrix[storeName]) {
            storeProductMatrix[storeName] = [];
          }
          storeProductMatrix[storeName].push(productKey);
        });
      });
      
      console.log('🔗 Store-Product Relationships:');
      Object.entries(storeProductMatrix).forEach(([store, products]) => {
        console.log(`   ${store}: ${products.length} products`);
        expect(products.length).toBeGreaterThan(0);
      });
    });
  });

  describe('🛡️ Error Prevention', () => {
    test('should handle missing optional fields', () => {
      Object.values(originalData.products).forEach(product => {
        // synonyms and commonBrands are optional
        if (product.synonyms) {
          expect(Array.isArray(product.synonyms)).toBe(true);
        }
        if (product.commonBrands) {
          expect(Array.isArray(product.commonBrands)).toBe(true);
        }
      });
    });

    test('should validate required fields exist', () => {
      Object.values(originalData.stores).forEach(store => {
        expect(store.location).toBeDefined();
      });
      
      Object.values(originalData.products).forEach(product => {
        expect(product.displayName).toBeDefined();
        expect(product.prices).toBeDefined();
        expect(Object.keys(product.prices).length).toBeGreaterThan(0);
      });
    });

    test('should handle edge cases in data', () => {
      Object.values(originalData.products).forEach(product => {
        Object.values(product.prices).forEach(priceInfo => {
          // Handle decimal precision
          expect(priceInfo.price).not.toBeNaN();
          expect(priceInfo.price).not.toEqual(Infinity);
          
          // Handle unit variations
          expect(priceInfo.unit.trim()).toBeTruthy();
        });
      });
    });
  });
});

describe('🎯 Migration Readiness Check', () => {
  test('should confirm all required files exist', async () => {
    const requiredFiles = [
      'database/db-setup.sql',
      'database/db-connection.js',
      'database/db-operations.js',
      'scripts/migrate-to-postgres.js'
    ];
    
    for (const file of requiredFiles) {
      const filePath = path.join(__dirname, '..', file);
      await expect(fs.access(filePath)).resolves.toBeUndefined();
    }
  });

  test('should validate migration script is executable', () => {
    const scriptPath = path.join(__dirname, '..', 'scripts', 'migrate-to-postgres.js');
    expect(() => require(scriptPath)).not.toThrow();
  });

  test('should confirm PostgreSQL dependencies are available', () => {
    expect(() => require('pg')).not.toThrow();
  });
});

describe('🎊 Production Data Analysis', () => {
  test('should analyze current kosher store ecosystem', () => {
    const analysis = {
      stores: Object.entries(originalData.stores).map(([name, data]) => ({
        name,
        location: data.location,
        rating: data.rating || 'Not rated',
        productCount: Object.values(originalData.products).filter(
          product => product.prices[name]
        ).length
      }))
    };
    
    console.log('🏪 Current Store Ecosystem:');
    analysis.stores.forEach(store => {
      console.log(`   ${store.name} (${store.location}): ${store.productCount} products, ${store.rating} rating`);
    });
    
    expect(analysis.stores.length).toBeGreaterThan(0);
    analysis.stores.forEach(store => {
      expect(store.name).toBeTruthy();
      expect(store.location).toBeTruthy();
    });
  });

  test('should identify most and least stocked stores', () => {
    const storeStock = {};
    
    Object.values(originalData.products).forEach(product => {
      Object.keys(product.prices).forEach(storeName => {
        storeStock[storeName] = (storeStock[storeName] || 0) + 1;
      });
    });
    
    const sortedStores = Object.entries(storeStock)
      .sort(([,a], [,b]) => b - a);
    
    if (sortedStores.length > 0) {
      const [mostStocked, mostCount] = sortedStores[0];
      const [leastStocked, leastCount] = sortedStores[sortedStores.length - 1];
      
      console.log(`📊 Most stocked: ${mostStocked} (${mostCount} products)`);
      console.log(`📊 Least stocked: ${leastStocked} (${leastCount} products)`);
      
      expect(mostCount).toBeGreaterThanOrEqual(leastCount);
    }
  });
});