#!/usr/bin/env node

/**
 * Migration Preparation Script
 * 
 * BUSINESS CRITICAL: Prepares and validates data before PostgreSQL migration
 * - Cleans up data inconsistencies
 * - Validates data integrity
 * - Creates migration-ready backup
 * - Reports migration readiness
 */

const fs = require('fs').promises;
const path = require('path');

class MigrationPreparation {
  constructor() {
    this.jsonDataPath = path.join(__dirname, '..', 'database', 'kosher-prices.json');
    this.backupPath = path.join(__dirname, '..', 'backups', `pre-migration-cleaned-${Date.now()}.json`);
    this.issues = [];
    this.fixes = [];
  }

  /**
   * Main preparation process
   */
  async prepare() {
    console.log('🧹 ShopStation Migration Preparation');
    console.log('=====================================');
    
    try {
      // Step 1: Load and analyze data
      const originalData = await this.loadData();
      
      // Step 2: Validate and clean data
      const cleanedData = await this.cleanAndValidateData(originalData);
      
      // Step 3: Create cleaned backup
      await this.createCleanedBackup(cleanedData);
      
      // Step 4: Generate migration report
      await this.generateReport(originalData, cleanedData);
      
      console.log('\n🎉 MIGRATION PREPARATION COMPLETED!');
      console.log('✅ Data is ready for PostgreSQL migration');
      
      return { success: true, cleanedData };
      
    } catch (error) {
      console.error('\n💥 PREPARATION FAILED:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Load existing data
   */
  async loadData() {
    console.log('📂 Loading existing data...');
    
    const content = await fs.readFile(this.jsonDataPath, 'utf8');
    const data = JSON.parse(content);
    
    console.log(`📊 Found ${Object.keys(data.stores || {}).length} stores and ${Object.keys(data.products || {}).length} products`);
    
    return data;
  }

  /**
   * Clean and validate data
   */
  async cleanAndValidateData(data) {
    console.log('🧹 Cleaning and validating data...');
    
    const cleaned = {
      stores: await this.cleanStores(data.stores || {}),
      products: {},
      productRequests: data.productRequests || []
    };
    
    // Create store name mapping for price references
    this.storeNameMapping = this.createStoreNameMapping(data.stores || {}, cleaned.stores);
    
    // Clean products with store name mapping
    cleaned.products = await this.cleanProducts(data.products || {});
    
    console.log(`✅ Cleaned data: ${this.fixes.length} fixes applied, ${this.issues.length} issues found`);
    
    return cleaned;
  }

  /**
   * Create mapping between original store names and cleaned store names
   */
  createStoreNameMapping(originalStores, cleanedStores) {
    const mapping = {};
    
    // Create mapping from original names to cleaned store objects
    Object.keys(originalStores).forEach(originalName => {
      const cleanedStoreEntry = Object.entries(cleanedStores).find(([slug, store]) => 
        store.name === originalName || slug === this.createSlug(originalName)
      );
      
      if (cleanedStoreEntry) {
        mapping[originalName] = cleanedStoreEntry[1].name; // Use the cleaned store name
      }
    });
    
    return mapping;
  }

  /**
   * Clean store data
   */
  async cleanStores(stores) {
    console.log('  🏪 Cleaning store data...');
    
    const cleaned = {};
    
    for (const [storeKey, store] of Object.entries(stores)) {
      // Skip test stores
      if (storeKey.toLowerCase().includes('test')) {
        this.issues.push(`Skipped test store: ${storeKey}`);
        continue;
      }
      
      // Clean store data
      const cleanedStore = {
        name: store.name || storeKey,
        location: store.location || 'Location TBD',
        phone: store.phone || 'Contact via website',
        hours: store.hours || 'Contact store for hours',
        rating: this.validateRating(store.rating)
      };
      
      // Create proper slug
      const slug = this.createSlug(cleanedStore.name);
      cleaned[slug] = cleanedStore;
      
      if (slug !== storeKey) {
        this.fixes.push(`Store key updated: ${storeKey} → ${slug}`);
      }
    }
    
    console.log(`    ✅ ${Object.keys(cleaned).length} stores cleaned`);
    return cleaned;
  }

  /**
   * Clean product data
   */
  async cleanProducts(products) {
    console.log('  🛍️  Cleaning product data...');
    
    const cleaned = {};
    
    for (const [productKey, product] of Object.entries(products)) {
      // Skip test products
      if (productKey.toLowerCase().includes('test') || 
          product.displayName?.toLowerCase().includes('test')) {
        this.issues.push(`Skipped test product: ${productKey}`);
        continue;
      }
      
      // Clean product data
      const cleanedProduct = {
        displayName: product.displayName || product.name || productKey,
        category: this.mapCategory(product.category),
        synonyms: Array.isArray(product.synonyms) ? product.synonyms : [],
        commonBrands: Array.isArray(product.commonBrands) ? product.commonBrands : [],
        prices: await this.cleanPrices(product.prices || {})
      };
      
      // Only include products with valid prices
      if (Object.keys(cleanedProduct.prices).length > 0) {
        const slug = this.createSlug(productKey);
        cleaned[slug] = cleanedProduct;
        
        if (slug !== productKey) {
          this.fixes.push(`Product key updated: ${productKey} → ${slug}`);
        }
      } else {
        this.issues.push(`Product has no valid prices: ${productKey}`);
      }
    }
    
    console.log(`    ✅ ${Object.keys(cleaned).length} products cleaned`);
    return cleaned;
  }

  /**
   * Clean price data
   */
  async cleanPrices(prices) {
    const cleaned = {};
    
    for (const [originalStoreName, priceInfo] of Object.entries(prices)) {
      // Skip test stores
      if (originalStoreName.toLowerCase().includes('test')) {
        continue;
      }
      
      // Map to cleaned store name
      const cleanedStoreName = this.storeNameMapping[originalStoreName];
      if (!cleanedStoreName) {
        this.issues.push(`Unknown store reference: ${originalStoreName}`);
        continue;
      }
      
      // Validate and clean price
      const price = this.validatePrice(priceInfo.price);
      if (price && price > 0) {
        cleaned[cleanedStoreName] = {
          price,
          unit: priceInfo.unit || 'item',
          lastUpdated: priceInfo.lastUpdated || new Date().toISOString()
        };
        
        if (originalStoreName !== cleanedStoreName) {
          this.fixes.push(`Updated store reference: ${originalStoreName} → ${cleanedStoreName}`);
        }
      } else {
        this.issues.push(`Invalid price for store ${originalStoreName}: ${priceInfo.price}`);
      }
    }
    
    return cleaned;
  }

  /**
   * Validate store references (now handled in price cleaning)
   */
  async validateStoreReferences(data) {
    console.log('  🔗 Store references validated during price cleaning');
  }

  /**
   * Utility functions
   */
  createSlug(name) {
    return name.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
  }

  validateRating(rating) {
    const num = parseFloat(rating);
    if (isNaN(num) || num < 0 || num > 5) {
      return 0.0;
    }
    return Math.round(num * 10) / 10; // Round to 1 decimal place
  }

  validatePrice(price) {
    if (typeof price === 'string') {
      price = parseFloat(price);
    }
    
    if (typeof price === 'number' && !isNaN(price) && price > 0) {
      return Math.round(price * 100) / 100; // Round to 2 decimal places
    }
    
    return null;
  }

  mapCategory(category) {
    const categoryMap = {
      'dairy': 'dairy',
      'bakery': 'bakery', 
      'meat': 'meat-fish',
      'fish': 'meat-fish',
      'produce': 'produce',
      'pantry': 'pantry',
      'frozen': 'frozen',
      'beverages': 'beverages',
      'drinks': 'beverages',
      'snacks': 'snacks',
      'household': 'household',
      'personal care': 'personal-care'
    };
    
    return categoryMap[category?.toLowerCase()] || 'pantry';
  }

  /**
   * Create cleaned backup
   */
  async createCleanedBackup(cleanedData) {
    console.log('💾 Creating cleaned data backup...');
    
    // Ensure backup directory exists
    const backupDir = path.dirname(this.backupPath);
    await fs.mkdir(backupDir, { recursive: true });
    
    await fs.writeFile(this.backupPath, JSON.stringify(cleanedData, null, 2));
    
    console.log(`✅ Backup created: ${path.basename(this.backupPath)}`);
  }

  /**
   * Generate migration report
   */
  async generateReport(originalData, cleanedData) {
    console.log('\n📊 MIGRATION READINESS REPORT');
    console.log('================================');
    
    const originalStats = {
      stores: Object.keys(originalData.stores || {}).length,
      products: Object.keys(originalData.products || {}).length,
      prices: Object.values(originalData.products || {}).reduce(
        (total, product) => total + Object.keys(product.prices || {}).length, 0
      )
    };
    
    const cleanedStats = {
      stores: Object.keys(cleanedData.stores).length,
      products: Object.keys(cleanedData.products).length,
      prices: Object.values(cleanedData.products).reduce(
        (total, product) => total + Object.keys(product.prices).length, 0
      )
    };
    
    console.log('\n📈 Data Statistics:');
    console.log(`   Stores: ${originalStats.stores} → ${cleanedStats.stores}`);
    console.log(`   Products: ${originalStats.products} → ${cleanedStats.products}`);
    console.log(`   Prices: ${originalStats.prices} → ${cleanedStats.prices}`);
    
    if (this.fixes.length > 0) {
      console.log('\n🔧 Applied Fixes:');
      this.fixes.forEach(fix => console.log(`   ✅ ${fix}`));
    }
    
    if (this.issues.length > 0) {
      console.log('\n⚠️  Issues Found:');
      this.issues.forEach(issue => console.log(`   ⚠️  ${issue}`));
    }
    
    console.log('\n🏪 Production Stores Ready for Migration:');
    Object.entries(cleanedData.stores).forEach(([slug, store]) => {
      const productCount = Object.values(cleanedData.products).filter(
        product => product.prices[store.name]
      ).length;
      console.log(`   ${store.name} (${store.location}): ${productCount} products`);
    });
    
    console.log('\n✅ MIGRATION READY:', cleanedStats.stores > 0 && cleanedStats.products > 0);
  }
}

// Run if called directly
if (require.main === module) {
  const prep = new MigrationPreparation();
  prep.prepare()
    .then(result => {
      if (result.success) {
        console.log('\n🎯 Next step: Run npm run migrate:postgres');
        process.exit(0);
      } else {
        console.error('\n❌ Preparation failed');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('💥 Unexpected error:', error.message);
      process.exit(1);
    });
}

module.exports = { MigrationPreparation };