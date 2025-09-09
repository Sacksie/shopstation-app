#!/usr/bin/env node

/**
 * Data Migration Script
 * 
 * Migrates data from the legacy kosher-prices.json file to the PostgreSQL database.
 * This is a critical step in unifying the application's data layer.
 * 
 * - Idempotent: Can be run multiple times without creating duplicate data.
 * - Migrates: Stores, Categories, Products, and Product Prices.
 * - Provides a detailed summary of the migration process.
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const fs = require('fs').promises;
const path = require('path');
const database = require('../database/db-connection');

class DataMigrator {
  constructor() {
    this.jsonPath = path.join(__dirname, '..', 'database', 'kosher-prices.json');
    this.summary = {
      stores: { inserted: 0, skipped: 0 },
      categories: { inserted: 0, skipped: 0 },
      products: { inserted: 0, skipped: 0 },
      prices: { inserted: 0, skipped: 0, failed: 0 },
    };
  }

  async run() {
    console.log('🚀 Starting data migration from JSON to PostgreSQL...');
    
    try {
      if (!database.isAvailable()) {
        await database.connect();
        if (!database.isAvailable()) {
          throw new Error('Could not connect to PostgreSQL database.');
        }
      }

      const jsonData = await this.readJSON();
      
      const categoryMap = await this.migrateCategories(jsonData.categories);
      const storeMap = await this.migrateStores(jsonData.stores);
      await this.migrateProductsAndPrices(jsonData.products, categoryMap, storeMap);

      this.printSummary();

    } catch (error) {
      console.error('💥 Migration failed:', error.message);
      process.exit(1);
    } finally {
      await database.close();
    }
  }

  async readJSON() {
    console.log(`📖 Reading data from ${this.jsonPath}`);
    const content = await fs.readFile(this.jsonPath, 'utf8');
    return JSON.parse(content);
  }

  async migrateCategories(categories) {
    console.log('\n migrating categories...');
    const categoryMap = {};

    for (const [slug, categoryData] of Object.entries(categories)) {
      const result = await database.query(
        `INSERT INTO categories (name, slug) VALUES ($1, $2)
         ON CONFLICT (name) DO NOTHING RETURNING id, name`,
        [categoryData.name, slug]
      );
      
      if (result.rowCount > 0) {
        this.summary.categories.inserted++;
        categoryMap[slug] = result.rows[0].id;
      } else {
        this.summary.categories.skipped++;
        const existing = await database.query('SELECT id FROM categories WHERE name = $1', [categoryData.name]);
        if (existing.rows[0]) {
          categoryMap[slug] = existing.rows[0].id;
        }
      }
    }
    console.log(`✅ Categories migration complete.`);
    return categoryMap;
  }

  async migrateStores(stores) {
    console.log('\n migrating stores...');
    const storeMap = {};

    for (const [name, storeData] of Object.entries(stores)) {
      const result = await database.query(
        `INSERT INTO stores (name, url, is_active) VALUES ($1, $2, $3)
         ON CONFLICT (name) DO NOTHING RETURNING id, name`,
        [name, storeData.url || null, true]
      );
      
      if (result.rowCount > 0) {
        this.summary.stores.inserted++;
        storeMap[name] = result.rows[0].id;
      } else {
        this.summary.stores.skipped++;
        const existing = await database.query('SELECT id FROM stores WHERE name = $1', [name]);
        if (existing.rows[0]) {
          storeMap[name] = existing.rows[0].id;
        }
      }
    }
    console.log(`✅ Stores migration complete.`);
    return storeMap;
  }

  async migrateProductsAndPrices(products, categoryMap, storeMap) {
    console.log('\n migrating products and prices...');

    for (const [slug, productData] of Object.entries(products)) {
      if (!productData.displayName) continue;

      const categoryId = productData.category ? categoryMap[productData.category] : null;
      
      const productResult = await database.query(
        `INSERT INTO products (name, slug, category_id, synonyms, common_brands)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (name) DO NOTHING RETURNING id`,
        [
          productData.displayName,
          slug,
          categoryId,
          productData.synonyms || null,
          productData.commonBrands || null,
        ]
      );
      
      let productId;
      if (productResult.rowCount > 0) {
        this.summary.products.inserted++;
        productId = productResult.rows[0].id;
      } else {
        this.summary.products.skipped++;
        const existing = await database.query('SELECT id FROM products WHERE name = $1', [productData.displayName]);
        if (existing.rows[0]) {
          productId = existing.rows[0].id;
        }
      }

      if (productId && productData.prices) {
        await this.migratePrices(productId, productData.prices, storeMap);
      }
    }
    console.log('✅ Products and prices migration complete.');
  }

  async migratePrices(productId, prices, storeMap) {
    for (const [storeName, priceData] of Object.entries(prices)) {
      const storeId = storeMap[storeName];
      if (!storeId || typeof priceData.price !== 'number') {
        this.summary.prices.failed++;
        continue;
      }
      
      const result = await database.query(
        `INSERT INTO store_products (store_id, product_id, price, unit, last_updated)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (store_id, product_id) DO UPDATE SET
           price = EXCLUDED.price,
           unit = EXCLUDED.unit,
           last_updated = EXCLUDED.last_updated`,
        [
          storeId,
          productId,
          priceData.price,
          priceData.unit || 'item',
          priceData.lastUpdated ? new Date(priceData.lastUpdated) : new Date(),
        ]
      );
      
      if (result.rowCount > 0) {
        this.summary.prices.inserted++;
      }
    }
  }
  
  printSummary() {
    console.log('\n\n--- Migration Summary ---');
    console.log(`Categories: ${this.summary.categories.inserted} inserted, ${this.summary.categories.skipped} skipped.`);
    console.log(`Stores:     ${this.summary.stores.inserted} inserted, ${this.summary.stores.skipped} skipped.`);
    console.log(`Products:   ${this.summary.products.inserted} inserted, ${this.summary.products.skipped} skipped.`);
    console.log(`Prices:     ${this.summary.prices.inserted} inserted/updated, ${this.summary.prices.failed} failed.`);
    console.log('-------------------------\n');
    console.log('🎉 Migration complete!');
  }
}

if (require.main === module) {
  const migrator = new DataMigrator();
  migrator.run();
}

module.exports = DataMigrator;
