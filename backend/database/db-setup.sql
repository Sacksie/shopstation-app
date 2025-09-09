-- ShopStation Database Schema
-- Professional database structure for multi-store grocery comparison platform

-- Stores table: Each independent store using ShopStation
CREATE TABLE stores (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL, -- URL-friendly name
    location TEXT,
    phone VARCHAR(50),
    hours TEXT,
    rating DECIMAL(2,1) DEFAULT 0.0,
    owner_email VARCHAR(255),
    subscription_status VARCHAR(50) DEFAULT 'free', -- free, paid, suspended
    subscription_ends_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- Categories table: Product categories (dairy, bakery, etc.)
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products table: Universal product catalog
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    category_id INTEGER REFERENCES categories(id),
    description TEXT,
    synonyms TEXT[], -- Array of alternative names
    common_brands TEXT[], -- Array of common brand names
    base_unit VARCHAR(50), -- kg, L, item, etc.
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- Store Products table: Specific products each store carries with prices
CREATE TABLE store_products (
    id SERIAL PRIMARY KEY,
    store_id INTEGER REFERENCES stores(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    price DECIMAL(10,2) NOT NULL,
    unit VARCHAR(50) NOT NULL, -- 2L, 500g, etc.
    in_stock BOOLEAN DEFAULT true,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(100) -- Could be 'admin', 'store_owner', 'automation'
);

-- Store Users table: For store-specific logins
CREATE TABLE store_users (
    id SERIAL PRIMARY KEY,
    store_id INTEGER NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'staff', -- 'owner', 'manager', 'staff'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- Product Requests table: User requests for missing products
CREATE TABLE product_requests (
    id SERIAL PRIMARY KEY,
    user_name VARCHAR(255),
    user_email VARCHAR(255),
    product_name VARCHAR(255) NOT NULL,
    category_suggestion VARCHAR(100),
    description TEXT,
    status VARCHAR(50) DEFAULT 'pending', -- pending, approved, rejected, added
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP,
    processed_by VARCHAR(255),
    notes TEXT
);

-- Users table: For future account functionality
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    password_hash VARCHAR(255), -- For future login functionality
    preferences JSONB, -- Store user preferences as JSON
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- Shopping Lists table: For future saved lists functionality
CREATE TABLE shopping_lists (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    items JSONB NOT NULL, -- Store list items as JSON
    is_favorite BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Search Analytics table: To track what users are searching for
CREATE TABLE search_analytics (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    query VARCHAR(255) NOT NULL,
    search_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    results_count INTEGER
);

-- Indexes for performance
CREATE INDEX idx_stores_active ON stores(is_active);
CREATE INDEX idx_stores_subscription ON stores(subscription_status);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_active ON products(is_active);
CREATE INDEX idx_store_products_store ON store_products(store_id);
CREATE INDEX idx_store_products_product ON store_products(product_id);
CREATE INDEX idx_store_products_price ON store_products(price);
CREATE INDEX idx_product_requests_status ON product_requests(status);
CREATE INDEX idx_users_email ON users(email);

-- Insert initial categories
INSERT INTO categories (name, slug, description) VALUES
('Dairy', 'dairy', 'Milk, cheese, yogurt, and dairy products'),
('Bakery', 'bakery', 'Bread, challah, cakes, and baked goods'),
('Meat & Fish', 'meat-fish', 'Kosher meat, fish, and poultry'),
('Produce', 'produce', 'Fresh fruits and vegetables'),
('Pantry', 'pantry', 'Dry goods, pasta, rice, and shelf-stable items'),
('Frozen', 'frozen', 'Frozen foods and ice cream'),
('Beverages', 'beverages', 'Drinks, juices, and beverages'),
('Snacks', 'snacks', 'Chips, cookies, and snack foods'),
('Household', 'household', 'Cleaning supplies and household items'),
('Personal Care', 'personal-care', 'Health and beauty products');

-- Insert your existing stores
INSERT INTO stores (name, slug, location, phone, hours, rating) VALUES
('B Kosher', 'b-kosher', 'Hendon Brent Street', '020 3210 4000', 'Sun: 8am-10pm, Mon-Wed: 730am-10pm, Thu: 7am-11pm, Fri: 7am-3pm', 4.2),
('Tapuach', 'tapuach', 'Hendon', '020 8202 5700', 'Sun: 8am-10pm, Mon-Wed: 7am-11pm, Thu: 7am-12am, Fri: 8am-530pm', 4.0),
('Kosher Kingdom', 'kosher-kingdom', 'Golders Green', '020 8455 1429', 'Sun-Tue: 7am-10pm, Wed-Thu: 7am-12am, Fri: 7am-6.30pm', 4.5),
('Kays', 'kays', 'London', 'Contact via website', 'Mon-Thu: 9am-6pm, Fri: 9am-2pm, Sun: 9am-6pm', 4.1);

COMMENT ON TABLE stores IS 'Independent stores using ShopStation platform';
COMMENT ON TABLE products IS 'Universal product catalog with synonyms and brands';
COMMENT ON TABLE store_products IS 'Store-specific pricing and availability';
COMMENT ON TABLE product_requests IS 'User requests for missing products';
COMMENT ON COLUMN stores.subscription_status IS 'free, paid, suspended - for monetization';
COMMENT ON COLUMN product_requests.status IS 'pending, approved, rejected, added - request workflow';