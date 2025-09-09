-- Migration to update products table with missing columns

-- Add missing columns to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS slug VARCHAR(255);
ALTER TABLE products ADD COLUMN IF NOT EXISTS synonyms TEXT[];
ALTER TABLE products ADD COLUMN IF NOT EXISTS common_brands TEXT[];
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE products ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();
ALTER TABLE products ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- Add missing columns to categories table
ALTER TABLE categories ADD COLUMN IF NOT EXISTS slug VARCHAR(255);

-- Add missing columns to stores table
ALTER TABLE stores ADD COLUMN IF NOT EXISTS slug VARCHAR(255);

-- Add missing columns to store_products table
ALTER TABLE store_products ADD COLUMN IF NOT EXISTS unit VARCHAR(100);
ALTER TABLE store_products ADD COLUMN IF NOT EXISTS in_stock BOOLEAN DEFAULT true;
ALTER TABLE store_products ADD COLUMN IF NOT EXISTS last_updated TIMESTAMP DEFAULT NOW();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_stores_slug ON stores(slug);
