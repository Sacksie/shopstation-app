#!/usr/bin/env node

/**
 * Database Setup Script
 * 
 * This script sets up the PostgreSQL database schema
 */

require('dotenv').config();
const fs = require('fs').promises;
const path = require('path');
const database = require('../database/db-connection');

async function setupDatabase() {
  try {
    console.log('🔧 Setting up PostgreSQL database schema...');
    
    // Connect to database first
    await database.connect();
    console.log('✅ Database connected successfully');
    
    // Read the initial schema SQL file
    const schemaPath = path.join(__dirname, '../migrations/000-initial-schema.sql');
    const schemaSQL = await fs.readFile(schemaPath, 'utf8');
    
    // Execute the schema
    await database.query(schemaSQL);
    console.log('✅ Initial schema created successfully');
    
    // Read and execute additional migrations
    const migration1Path = path.join(__dirname, '../migrations/001-add-store-users.sql');
    const migration1SQL = await fs.readFile(migration1Path, 'utf8');
    await database.query(migration1SQL);
    console.log('✅ Store users migration applied');
    
    const migration2Path = path.join(__dirname, '../migrations/002-add-search-analytics.sql');
    const migration2SQL = await fs.readFile(migration2Path, 'utf8');
    await database.query(migration2SQL);
    console.log('✅ Search analytics migration applied');
    
    // Insert some sample data
    await insertSampleData();
    
    console.log('🎉 Database setup completed successfully!');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  }
}

async function insertSampleData() {
  try {
    console.log('📝 Inserting sample data...');
    
    // Insert sample stores
    await database.query(`
      INSERT INTO stores (name, url, is_active) VALUES 
      ('B Kosher', 'https://bkosher.com', true),
      ('Tapuach', 'https://tapuach.com', true),
      ('Kosher Kingdom', 'https://kosherkingdom.com', true)
      ON CONFLICT (name) DO NOTHING;
    `);
    
    // Insert sample categories
    await database.query(`
      INSERT INTO categories (name) VALUES 
      ('dairy'), ('bakery'), ('meat'), ('produce'), ('pantry'), ('beverages')
      ON CONFLICT (name) DO NOTHING;
    `);
    
    // Insert sample products
    await database.query(`
      INSERT INTO products (name, category_id, slug, synonyms, common_brands, is_active) VALUES 
      ('Milk', (SELECT id FROM categories WHERE name = 'dairy'), 'milk', ARRAY['fresh milk', 'whole milk'], ARRAY['Yeo Valley', 'Organic Valley'], true),
      ('Challah', (SELECT id FROM categories WHERE name = 'bakery'), 'challah', ARRAY['shabbat bread', 'bread'], ARRAY['Bakery Fresh', 'Artisan'], true),
      ('Chicken', (SELECT id FROM categories WHERE name = 'meat'), 'chicken', ARRAY['poultry', 'whole chicken'], ARRAY['Free Range', 'Organic'], true)
      ON CONFLICT (name) DO NOTHING;
    `);
    
    // Insert sample prices
    await database.query(`
      INSERT INTO store_products (store_id, product_id, price, unit, in_stock, last_updated) VALUES 
      ((SELECT id FROM stores WHERE name = 'B Kosher'), (SELECT id FROM products WHERE name = 'Milk'), 2.50, '2 pints', true, NOW()),
      ((SELECT id FROM stores WHERE name = 'Tapuach'), (SELECT id FROM products WHERE name = 'Milk'), 2.75, '2 pints', true, NOW()),
      ((SELECT id FROM stores WHERE name = 'B Kosher'), (SELECT id FROM products WHERE name = 'Challah'), 3.50, 'loaf', true, NOW()),
      ((SELECT id FROM stores WHERE name = 'Tapuach'), (SELECT id FROM products WHERE name = 'Challah'), 3.25, 'loaf', true, NOW())
      ON CONFLICT (store_id, product_id) DO NOTHING;
    `);
    
    console.log('✅ Sample data inserted successfully');
    
  } catch (error) {
    console.error('⚠️  Sample data insertion failed (this is usually okay):', error.message);
  }
}

// Run the setup
setupDatabase();
