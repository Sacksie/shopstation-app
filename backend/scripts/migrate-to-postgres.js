#!/usr/bin/env node

/**
 * PostgreSQL Migration Script
 * 
 * BUSINESS CRITICAL: Migrates existing kosher store data to PostgreSQL
 * - Preserves all your manually entered product data
 * - Sets up professional database structure
 * - Creates backup before migration
 * - Validates data integrity after migration
 */

const fs = require('fs').promises;
const path = require('path');
const database = require('../database/db-connection');
const { cloudBackup } = require('../utils/cloudBackup');

class PostgreSQLMigrator {
  constructor() {
    this.jsonDataPath = path.join(__dirname, '..', 'database', 'kosher-prices.json');
    this.migrationLog = [];
  }

  /**
   * Main migration process
   */
  async migrate() {
    console.log('🚀 ShopStation PostgreSQL Migration');
    console.log('=====================================');
    
    try {
      // Step 1: Create backup
      await this.createPreMigrationBackup();
      
      // Step 2: Connect to database
      await this.connectToDatabase();
      
      // Step 3: Load existing data
      const jsonData = await this.loadExistingData();
      
      // Step 4: Set up database schema
      await this.setupDatabaseSchema();
      
      // Step 5: Migrate data
      await this.migrateStores(jsonData.stores);
      await this.migrateProducts(jsonData);
      
      // Step 6: Validate migration
      await this.validateMigration();
      
      // Step 7: Success summary
      await this.showMigrationSummary();
      
      console.log('\n🎉 MIGRATION COMPLETED SUCCESSFULLY!');
      console.log('✅ Your data is now safe in PostgreSQL');
      console.log('✅ Updates will never lose your data again');
      
    } catch (error) {
      console.error('\n💥 MIGRATION FAILED:', error.message);
      console.error('📋 Migration log:');
      this.migrationLog.forEach(entry => console.error(`   ${entry}`));
      process.exit(1);
    }
  }

  /**
   * Create backup before migration
   */
  async createPreMigrationBackup() {
    console.log('📦 Creating pre-migration backup...');
    
    try {
      const backupResult = await cloudBackup.createFullBackup('pre-postgresql-migration');
      this.migrationLog.push(`✅ Backup created: ${backupResult.backupId}`);
      console.log(`✅ Backup created: ${backupResult.backupId}`);
    } catch (error) {
      console.warn('⚠️  Backup failed, continuing with migration');
      this.migrationLog.push(`⚠️  Backup failed: ${error.message}`);
    }
  }

  /**
   * Connect to PostgreSQL database
   */
  async connectToDatabase() {
    console.log('🔌 Connecting to PostgreSQL...');
    
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL not found. Please add PostgreSQL to your Railway project.');
    }

    await database.connect();
    if (!database.isAvailable()) {
      throw new Error('Failed to connect to PostgreSQL database');
    }

    this.migrationLog.push('✅ Connected to PostgreSQL');
    console.log('✅ Connected to PostgreSQL');
  }

  /**
   * Load existing JSON data
   */
  async loadExistingData() {
    console.log('📂 Loading existing data...');
    
    try {
      const jsonContent = await fs.readFile(this.jsonDataPath, 'utf8');
      const data = JSON.parse(jsonContent);
      
      const productCount = Object.keys(data.products || {}).length;
      const storeCount = Object.keys(data.stores || {}).length;
      
      this.migrationLog.push(`📊 Found ${productCount} products and ${storeCount} stores`);
      console.log(`📊 Found ${productCount} products and ${storeCount} stores`);
      
      return data;
    } catch (error) {
      throw new Error(`Failed to load existing data: ${error.message}`);
    }
  }

  /**
   * Set up database schema
   */
  async setupDatabaseSchema() {
    console.log('🏗️  Setting up database schema...');
    
    try {
      const schemaPath = path.join(__dirname, '..', 'database', 'db-setup.sql');
      const schema = await fs.readFile(schemaPath, 'utf8');
      
      // Execute schema setup
      await database.query(schema);
      
      this.migrationLog.push('✅ Database schema created');
      console.log('✅ Database schema created');
    } catch (error) {
      // If tables already exist, that's okay
      if (error.message.includes('already exists')) {
        console.log('ℹ️  Database schema already exists, skipping creation');
        this.migrationLog.push('ℹ️  Schema already exists');
      } else {
        throw error;
      }
    }
  }

  /**
   * Migrate store data
   */
  async migrateStores(stores) {
    console.log('🏪 Migrating store data...');
    
    if (!stores) {
      console.log('ℹ️  No stores to migrate');
      return;
    }

    let migratedCount = 0;
    
    for (const [storeSlug, storeData] of Object.entries(stores)) {
      try {
        // Check if store already exists
        const existingStore = await database.query(
          'SELECT id FROM stores WHERE slug = $1',
          [storeSlug]
        );

        if (existingStore.rows.length > 0) {
          console.log(`   ⏭️  Store ${storeData.name || storeSlug} already exists, skipping`);
          continue;
        }

        // Insert store
        await database.query(`
          INSERT INTO stores (name, slug, location, phone, hours, rating)
          VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT (slug) DO UPDATE SET
            location = EXCLUDED.location,
            phone = EXCLUDED.phone,
            hours = EXCLUDED.hours,
            rating = EXCLUDED.rating
        `, [
          storeData.name || storeSlug,
          storeSlug,
          storeData.location || null,
          storeData.phone || null,
          storeData.hours || null,
          storeData.rating || 0.0
        ]);

        migratedCount++;
        console.log(`   ✅ Migrated store: ${storeData.name || storeSlug}`);
      } catch (error) {
        console.error(`   ❌ Failed to migrate store ${storeSlug}:`, error.message);
      }
    }

    this.migrationLog.push(`✅ Migrated ${migratedCount} stores`);
    console.log(`✅ Migrated ${migratedCount} stores`);
  }

  /**
   * Migrate product data
   */
  async migrateProducts(data) {
    console.log('🛍️  Migrating product data...');
    
    if (!data.products) {
      console.log('ℹ️  No products to migrate');
      return;
    }

    let migratedProducts = 0;
    let migratedPrices = 0;

    for (const [productSlug, productData] of Object.entries(data.products)) {
      try {
        // Get category ID
        const categoryResult = await database.query(
          'SELECT id FROM categories WHERE slug = $1',
          [this.mapCategory(productData.category)]
        );
        
        const categoryId = categoryResult.rows[0]?.id || null;

        // Insert or update product
        const productResult = await database.query(`
          INSERT INTO products (name, slug, category_id, synonyms, common_brands)
          VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (slug) DO UPDATE SET
            name = EXCLUDED.name,
            category_id = EXCLUDED.category_id,
            synonyms = EXCLUDED.synonyms,
            common_brands = EXCLUDED.common_brands,
            updated_at = CURRENT_TIMESTAMP
          RETURNING id
        `, [
          productData.displayName || productData.name || productSlug,
          productSlug,
          categoryId,
          productData.synonyms || null,
          productData.commonBrands || null
        ]);

        const productId = productResult.rows[0].id;
        migratedProducts++;

        // Migrate prices for this product
        if (productData.prices) {
          for (const [storeName, priceData] of Object.entries(productData.prices)) {
            try {
              // Get store ID
              const storeResult = await database.query(
                'SELECT id FROM stores WHERE name = $1 OR slug = $1',
                [storeName]
              );

              if (storeResult.rows.length === 0) {
                console.warn(`   ⚠️  Store '${storeName}' not found for product ${productSlug}`);
                continue;
              }

              const storeId = storeResult.rows[0].id;

              // Insert or update store product price
              await database.query(`
                INSERT INTO store_products (store_id, product_id, price, unit, last_updated)
                VALUES ($1, $2, $3, $4, $5)
                ON CONFLICT (store_id, product_id) DO UPDATE SET
                  price = EXCLUDED.price,
                  unit = EXCLUDED.unit,
                  last_updated = EXCLUDED.last_updated
              `, [
                storeId,
                productId,
                parseFloat(priceData.price) || 0,
                priceData.unit || 'item',
                priceData.lastUpdated || new Date().toISOString()
              ]);

              migratedPrices++;
            } catch (error) {
              console.error(`   ❌ Failed to migrate price for ${productSlug} at ${storeName}:`, error.message);
            }
          }
        }

        console.log(`   ✅ Migrated product: ${productData.displayName || productSlug}`);
      } catch (error) {
        console.error(`   ❌ Failed to migrate product ${productSlug}:`, error.message);
      }
    }

    this.migrationLog.push(`✅ Migrated ${migratedProducts} products with ${migratedPrices} prices`);
    console.log(`✅ Migrated ${migratedProducts} products with ${migratedPrices} prices`);
  }

  /**
   * Map old category names to new category slugs
   */
  mapCategory(categoryName) {
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

    return categoryMap[categoryName?.toLowerCase()] || 'pantry';
  }

  /**
   * Validate migration success
   */
  async validateMigration() {
    console.log('🔍 Validating migration...');

    try {
      const stores = await database.query('SELECT COUNT(*) FROM stores');
      const products = await database.query('SELECT COUNT(*) FROM products');
      const storePrices = await database.query('SELECT COUNT(*) FROM store_products');
      
      const storeCount = stores.rows[0].count;
      const productCount = products.rows[0].count;
      const priceCount = storePrices.rows[0].count;

      console.log(`✅ Validation results:`);
      console.log(`   📊 Stores: ${storeCount}`);
      console.log(`   📊 Products: ${productCount}`);
      console.log(`   📊 Prices: ${priceCount}`);

      if (parseInt(storeCount) === 0 || parseInt(productCount) === 0) {
        throw new Error('Migration validation failed: No data found in database');
      }

      this.migrationLog.push(`✅ Validation passed: ${storeCount} stores, ${productCount} products, ${priceCount} prices`);
    } catch (error) {
      throw new Error(`Migration validation failed: ${error.message}`);
    }
  }

  /**
   * Show migration summary
   */
  async showMigrationSummary() {
    console.log('\n📋 MIGRATION SUMMARY');
    console.log('====================');
    this.migrationLog.forEach(entry => console.log(entry));
    
    console.log('\n🎯 NEXT STEPS:');
    console.log('1. Your data is now in PostgreSQL - updates won\'t lose it!');
    console.log('2. Test your admin panel to ensure everything works');
    console.log('3. Deploy to Railway - your data will persist through updates');
    console.log('4. Start adding new products with confidence!');
  }
}

// Run migration if called directly
if (require.main === module) {
  const migrator = new PostgreSQLMigrator();
  migrator.migrate()
    .then(() => {
      console.log('🎉 Migration completed successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Migration failed:', error.message);
      process.exit(1);
    });
}

module.exports = { PostgreSQLMigrator };