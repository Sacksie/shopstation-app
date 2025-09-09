-- Migration to create the initial database schema for ShopStation

-- Step 1: Create the stores table
CREATE TABLE IF NOT EXISTS stores (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    url VARCHAR(255),
    is_active BOOLEAN DEFAULT true
);

-- Step 2: Create the categories table
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL
);

-- Step 3: Create the products table
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    category_id INTEGER REFERENCES categories(id)
);

-- Step 4: Create the store_products table for pricing information
CREATE TABLE IF NOT EXISTS store_products (
    id SERIAL PRIMARY KEY,
    store_id INTEGER REFERENCES stores(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    price NUMERIC(10, 2),
    UNIQUE(store_id, product_id)
);
